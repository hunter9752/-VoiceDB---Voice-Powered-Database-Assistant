from backend.services.supabase_service import SupabaseService
from backend.services.embedding_service import EmbeddingService
from backend.config import settings
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class RAGService:
    """Retrieval-Augmented Generation service"""
    
    def __init__(self):
        self.supabase = SupabaseService()
        self.embedding = EmbeddingService()
    
    async def retrieve_context(self, user_query: str) -> List[dict]:
        """
        Retrieve relevant context for a user query
        
        Args:
            user_query: Natural language query
            
        Returns:
            List of relevant documents/context
        """
        if not settings.enable_rag:
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.embedding.embed_text(user_query)
            
            if not query_embedding:
                logger.warning("Failed to generate query embedding")
                return []
            
            # Search for similar documents
            documents = await self.supabase.search_documents(
                query_embedding=query_embedding,
                limit=settings.max_context_chunks
            )
            
            logger.info(f"Retrieved {len(documents)} context documents")
            return documents
            
        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
            return []
    
    async def ingest_document(
        self, 
        content: str, 
        metadata: dict = None
    ) -> bool:
        """
        Ingest a document into the RAG system
        
        Args:
            content: Document content
            metadata: Additional metadata
            
        Returns:
            bool indicating success
        """
        try:
            # Chunk the document
            chunks = self.embedding.chunk_text(content)
            
            logger.info(f"Split document into {len(chunks)} chunks")
            
            # Generate embeddings for each chunk
            embeddings = self.embedding.embed_batch(chunks)
            
            # Store each chunk with its embedding
            success_count = 0
            for chunk, embedding in zip(chunks, embeddings):
                if await self.supabase.store_document(
                    content=chunk,
                    embedding=embedding,
                    metadata=metadata
                ):
                    success_count += 1
            
            logger.info(f"Stored {success_count}/{len(chunks)} chunks")
            return success_count == len(chunks)
            
        except Exception as e:
            logger.error(f"Error ingesting document: {str(e)}")
            return False
    
    async def get_table_context(self, table_names: List[str]) -> List[dict]:
        """
        Get sample data from tables for context
        
        Args:
            table_names: List of table names
            
        Returns:
            List of context documents with sample data
        """
        context = []
        
        for table_name in table_names:
            try:
                samples = await self.supabase.get_table_sample(table_name, limit=3)
                
                if samples:
                    context.append({
                        'content': f"Sample data from {table_name}: {samples}",
                        'table': table_name,
                        'type': 'sample_data'
                    })
                    
            except Exception as e:
                logger.error(f"Error getting table context for {table_name}: {str(e)}")
        
        return context
