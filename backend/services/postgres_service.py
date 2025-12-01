"""
Direct PostgreSQL Service for Supabase
Uses asyncpg to connect directly to PostgreSQL database, bypassing RPC issues
"""
import asyncpg
import logging
from typing import List, Dict, Optional
from backend.config import settings

logger = logging.getLogger(__name__)

class PostgresService:
    """Service for direct PostgreSQL connection to Supabase"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.schema_cache = {}
        logger.info("[POSTGRES] Initializing Direct PostgreSQL Service")
        
    async def connect(self):
        """Establish connection pool to PostgreSQL"""
        if not settings.database_url:
            raise ValueError("DATABASE_URL not configured in .env file")
            
        try:
            self.pool = await asyncpg.create_pool(
                settings.database_url,
               min_size=1,
                max_size=10,
                command_timeout=60
            )
            logger.info("[POSTGRES] Connection pool created successfully")
            logger.info(f"[POSTGRES] Database URL: {settings.database_url[:50]}...")
        except Exception as e:
            logger.error(f"[POSTGRES] Failed to create connection pool: {e}")
            raise
            
    async def disconnect(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("[POSTGRES] Connection pool closed")
    
    async def execute_query(self, sql: str) -> dict:
        """
        Execute SQL query directly against PostgreSQL
        
        Args:
            sql: SQL query to execute
            
        Returns:
            dict with rows, count, and metadata
        """
        if not self.pool:
            await self.connect()
            
        try:
            logger.info(f"[POSTGRES] Executing query: {sql[:100]}...")
            
            async with self.pool.acquire() as conn:
                # Execute query
                rows = await conn.fetch(sql)
                
                # Convert asyncpg.Record to dict
                result_rows = [dict(row) for row in rows]
                
                logger.info(f"[POSTGRES] Query successful! Returned {len(result_rows)} rows")
                
                return {
                    "rows": result_rows,
                    "count": len(result_rows),
                    "success": True
                }
                
        except asyncpg.PostgresError as e:
            error_msg = f"PostgreSQL Error: {e}"
            logger.error(f"[POSTGRES] Query failed: {error_msg}")
            return {
                "rows": [],
                "count": 0,
                "success": False,
                "error": error_msg
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"[POSTGRES] Query failed: {error_msg}")
            return {
                "rows": [],
                "count": 0,
                "success": False,
                "error": error_msg
            }
    
    async def get_schema(self, table_name: Optional[str] = None) -> dict:
        """
        Get database schema information
        
        Args:
            table_name: Optional specific table name
            
        Returns:
            dict containing schema information
        """
        if not self.pool:
            await self.connect()
            
        try:
            # Query to get all tables and columns
            schema_query = """
            SELECT 
                t.table_name,
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default
            FROM information_schema.tables t
            JOIN information_schema.columns c 
                ON t.table_name = c.table_name
            WHERE t.table_schema = 'public'
                AND t.table_type = 'BASE TABLE'
            """
            
            if table_name:
                schema_query += f" AND t.table_name = '{table_name}'"
                
            schema_query += " ORDER BY t.table_name, c.ordinal_position"
            
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(schema_query)
            
            # Organize schema by table - return columns list directly (not wrapped in dict)
            schema = {}
            for row in rows:
                table = row['table_name']
                if table not in schema:
                    schema[table] = []  # Direct list, not dict with 'columns' key
                    
                schema[table].append({
                    'column_name': row['column_name'],
                    'data_type': row['data_type'],
                    'is_nullable': 'YES' if row['is_nullable'] == 'YES' else 'NO',
                    'column_default': row['column_default'],
                    'primary_key': False  # Can be enhanced later
                })
            
            logger.info(f"[POSTGRES] Retrieved schema for {len(schema)} tables")
            return schema
            
        except Exception as e:
            logger.error(f"[POSTGRES] Failed to get schema: {e}")
            return {}
    
    async def log_query(self, user_query: str, generated_sql: str, 
                       confidence: float, success: bool, 
                       result_count: int = 0, error: str = None):
        """Log query to audit table"""
        if not self.pool:
            await self.connect()
            
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO query_logs 
                    (user_query, generated_sql, confidence, success, result_count, error)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, user_query, generated_sql, confidence, success, result_count, error)
                
            logger.info("[POSTGRES] Query logged to audit table")
        except Exception as e:
            logger.warning(f"[POSTGRES] Failed to log query: {e}")
