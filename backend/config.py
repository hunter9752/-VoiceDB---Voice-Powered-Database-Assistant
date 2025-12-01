from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application configuration"""
    
    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    
    # Direct PostgreSQL Connection (Optional - for bypassing RPC)
    database_url: Optional[str] = None  # PostgreSQL connection string
    use_direct_postgres: bool = False  # Set to True to use direct connection instead of RPC
    
    
    # GROQ
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    
    # Embedding
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    openai_api_key: Optional[str] = None
    
    # Backend
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    # Security
    allow_destructive_queries: bool = True  # Enable CRUD operations
    require_confirmation_for_destructive: bool = True  # Require user confirmation
    max_query_complexity: int = 100
    enable_audit_log: bool = True
    query_timeout: int = 30000
    max_rows_affected: int = 1000  # Safety limit
    
    # Features
    enable_schema_cache: bool = True
    enable_rag: bool = False  # Temporarily disabled due to TensorFlow compatibility
    max_context_chunks: int = 5
    
    # Logging
    log_level: str = "info"
    log_queries: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env

# Global settings instance
settings = Settings()
