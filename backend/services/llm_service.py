from groq import Groq
from backend.config import settings
import json
import logging

logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with Llama 70B via GROQ API"""
    
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
        
    def generate_sql(
        self, 
        user_query: str, 
        schema_info: dict, 
        context_docs: list = None
    ) -> dict:
        """
        Generate SQL from natural language query
        
        Args:
            user_query: Natural language query from user
            schema_info: Database schema information
            context_docs: Retrieved documents for context (RAG)
            
        Returns:
            dict with sql, explanation, and confidence
        """
        try:
            # Construct prompt
            prompt = self._build_prompt(user_query, schema_info, context_docs)
            
            # Call GROQ API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert SQL assistant that converts natural language to SQL queries.

IMPORTANT GUIDELINES FOR CRUD OPERATIONS:
1. For queries  mentioning "add", "create", "insert", or "new" → Generate INSERT statements
2. For queries mentioning "update", "change", "modify", "set" → Generate UPDATE statements  
3. For queries mentioning "delete", "remove", "drop" → Generate DELETE statements
4. For queries mentioning "show", "list", "get", "find", "count", "select" → Generate SELECT statements

EXAMPLES:
- "Add a new user named John" → INSERT INTO users (name) VALUES ('John')
- "Update user with id 1 set name to Alice" → UPDATE users SET name = 'Alice' WHERE id = 1
- "Delete user where id = 5" → DELETE FROM users WHERE id = 5
- "Show all users" → SELECT * FROM users

Always include WHERE clauses for UPDATE and DELETE operations when possible.
Return response as JSON with: sql, explanation, confidence (0.0-1.0)"""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,  # Low temperature for consistent SQL generation
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            # Parse response
            result = json.loads(response.choices[0].message.content)
            
            if settings.log_queries:
                logger.info(f"Generated SQL for query: {user_query[:100]}")
                logger.debug(f"SQL: {result.get('sql', 'N/A')}")
            
            return {
                "sql": result.get("sql", ""),
                "explanation": result.get("explanation", ""),
                "confidence": result.get("confidence", 0.0),
                "model_used": self.model
            }
            
        except Exception as e:
            logger.error(f"Error generating SQL: {str(e)}")
            raise Exception(f"Failed to generate SQL: {str(e)}")
    
    def _build_prompt(
        self, 
        user_query: str, 
        schema_info: dict, 
        context_docs: list = None
    ) -> str:
        """Build prompt for LLM"""
        
        # Format schema information
        schema_text = self._format_schema(schema_info)
        
        # Format context documents
        context_text = ""
        if context_docs and settings.enable_rag:
            context_text = "\n\nRelevant context from dataset:\n"
            for i, doc in enumerate(context_docs[:settings.max_context_chunks], 1):
                context_text += f"\n{i}. {doc.get('content', '')}"
        
        prompt = f"""You are an expert assistant that converts natural language to SQL queries.

Database Schema:
{schema_text}
{context_text}

User Question: "{user_query}"

Instructions:
- Generate the appropriate SQL statement based on user intent (SELECT, INSERT, UPDATE, DELETE)
- For INSERT: include all necessary columns with appropriate values
- For UPDATE/DELETE: always include WHERE clause when specific records are mentioned
- Make sure table and column names come exactly from the provided schema
- Use proper SQL syntax for PostgreSQL
- Add a short one-line explanation of what this query does
- Provide a confidence score (0.0 to 1.0) based on how well you understand the query

Output format (JSON):
{{
  "sql": "INSERT INTO ... / UPDATE ... / DELETE FROM ... / SELECT ...",
  "explanation": "This query ...",
  "confidence": 0.95
}}

Return ONLY valid JSON, no additional text."""

        return prompt
    
    def _format_schema(self, schema_info: dict) -> str:
        """Format schema information for prompt"""
        schema_lines = []
        
        for table_name, columns in schema_info.items():
            schema_lines.append(f"\nTable: {table_name}")
            schema_lines.append("Columns:")
            
            for col in columns:
                col_info = f"  - {col['column_name']} ({col['data_type']})"
                if col.get('is_nullable') == 'NO':
                    col_info += " NOT NULL"
                if col.get('primary_key'):
                    col_info += " PRIMARY KEY"
                schema_lines.append(col_info)
        
        return "\n".join(schema_lines)
    
    def explain_query(self, sql: str) -> str:
        """Get a human-readable explanation of a SQL query"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that explains SQL queries in simple terms."
                    },
                    {
                        "role": "user",
                        "content": f"Explain this SQL query in simple terms:\n\n{sql}"
                    }
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error explaining query: {str(e)}")
            return "Unable to generate explanation"
