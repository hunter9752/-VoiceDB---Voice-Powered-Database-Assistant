from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging

from backend.config import settings
from backend.services.llm_service import LLMService
from backend.services.supabase_service import SupabaseService
from backend.services.postgres_service import PostgresService
from backend.services.rag_service import RAGService
from backend.utils.sql_safety import SQLSafetyValidator

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NL-DB-Assistant API",
   description="Natural Language to Database Query Assistant",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
llm_service = LLMService()

# Use Direct PostgreSQL connection if enabled, otherwise use Supabase RPC
if settings.use_direct_postgres:
    logger.info("🔧 Using Direct PostgreSQL Connection (asyncpg)")
    db_service = PostgresService()
else:
    logger.info("🔧 Using Supabase RPC Connection")
    db_service = SupabaseService()

# Keep reference for compatibility
supabase_service = db_service

rag_service = RAGService()
sql_validator = SQLSafetyValidator()

# Request/Response models
class QueryRequest(BaseModel):
    query: str
    use_rag: bool = False
    confirm_destructive: bool = False

class QueryResponse(BaseModel):
    sql: str
    explanation: str
    confidence: float
    results: List[dict]
    result_count: int
    warnings: List[str] = []

class SchemaResponse(BaseModel):
    schema: dict

class IngestRequest(BaseModel):
    content: str
    metadata: Optional[dict] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    services: dict

# API Endpoints

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Application starting up...")
    
    # Initialize PostgreSQL connection pool if using direct connection
    if settings.use_direct_postgres and isinstance(db_service, PostgresService):
        try:
            await db_service.connect()
            logger.info("✅ PostgreSQL connection pool initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize PostgreSQL pool: {e}")
            raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 Application shutting down...")
    
    # Close PostgreSQL connection pool
    if settings.use_direct_postgres and isinstance(db_service, PostgresService):
        await db_service.disconnect()
        logger.info("✅ PostgreSQL connection pool closed")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "llm": "groq/llama-70b",
            "database": "supabase",
            "rag": "enabled" if settings.enable_rag else "disabled"
        }
    }

@app.post("/query")
async def query_database(request: QueryRequest):
    """
    Process natural language query and return results
    
    Flow: User Query → RAG Context → LLM → SQL → Validation → Execution → Results
    """
    try:
        logger.info(f"Processing query: {request.query}")
        
        # Step 1: Get database schema
        schema = await supabase_service.get_schema()
        if not schema:
            raise HTTPException(status_code=500, detail="Failed to fetch database schema")
        
        # Step 2: Retrieve context using RAG (if enabled)
        context_docs = []
        if request.use_rag and settings.enable_rag:
            context_docs = await rag_service.retrieve_context(request.query)
            logger.info(f"Retrieved {len(context_docs)} context documents")
        
        # Step 3: Generate SQL using LLM
        llm_result = llm_service.generate_sql(
            user_query=request.query,
            schema_info=schema,
            context_docs=context_docs
        )
        
        sql = llm_result['sql']
        explanation = llm_result['explanation']
        confidence = llm_result['confidence']
        
        logger.info(f"Generated SQL: {sql}")
        
        # Step 4: Validate SQL for safety
        validation = sql_validator.validate(
            sql, 
            allow_destructive=settings.allow_destructive_queries and request.confirm_destructive
        )
        
        # If destructive operation requires confirmation
        if validation.get('requires_confirmation') and not request.confirm_destructive:
            return {
                "requires_confirmation": True,
                "operation_type": validation['operation_type'],
                "sql": sql,
                "explanation": explanation,
                "confidence": confidence,
                "warning": f"This {validation['operation_type']} operation will modify data. Please confirm.",
                "warnings": validation.get('warnings', [])
            }
        
        if not validation['is_valid']:
            error_msg = '; '.join(validation['errors'])
            logger.error(f"SQL validation failed: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail=f"Generated SQL failed safety validation: {error_msg}"
            )
        
        # Step 5: Execute query
        result = await supabase_service.execute_query(sql)
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"Query execution failed: {result.get('error', 'Unknown error')}"
            )
        
        # Step 6: Log query for audit
        await supabase_service.log_query(
            user_query=request.query,
            generated_sql=sql,
            confidence=confidence,
            success=True,
            result_count=result['count']
        )
        
        # Step 7: Return results
        return {
            "sql": sql,
            "explanation": explanation,
            "confidence": confidence,
            "results": result['rows'],
            "result_count": result['count'],
            "warnings": validation['warnings']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        
        # Log failed query
        if 'sql' in locals():
            await supabase_service.log_query(
                user_query=request.query,
                generated_sql=sql,
                confidence=confidence if 'confidence' in locals() else 0.0,
                success=False,
                error=str(e)
            )
        
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/schema", response_model=SchemaResponse)
async def get_schema(table_name: Optional[str] = None):
    """Get database schema information"""
    try:
        schema = await supabase_service.get_schema(table_name)
        return SchemaResponse(schema=schema)
        
    except Exception as e:
        logger.error(f"Error fetching schema: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest")
async def ingest_document(request: IngestRequest):
    """Ingest a document into the RAG system"""
    try:
        success = await rag_service.ingest_document(
            content=request.content,
            metadata=request.metadata
        )
        
        if success:
            return {"status": "success", "message": "Document ingested successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to ingest document")
            
    except Exception as e:
        logger.error(f"Error ingesting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Detailed health check"""
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # Check Supabase connection
    try:
        schema = await supabase_service.get_schema()
        health_status["services"]["supabase"] = "connected"
    except Exception as e:
        health_status["services"]["supabase"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check LLM service
    try:
        if llm_service.client:
            health_status["services"]["llm"] = "ready"
        else:
            health_status["services"]["llm"] = "not initialized"
    except Exception as e:
        health_status["services"]["llm"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True
    )
