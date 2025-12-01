try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None
    
from backend.config import settings
import logging
from typing import List

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self):
        self.model_name = settings.embedding_model
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the embedding model"""
        try:
            # TEMPORARILY DISABLED due to TensorFlow compatibility issues
            # RAG features will not work until this is re-enabled
            logger.warning("Embedding model disabled - RAG features unavailable")
            self.model = None
            return
            
            # Original code (disabled):
            # if self.model_name.startswith('sentence-transformers/'):
            #     # Use Sentence Transformers
            #     self.model = SentenceTransformer(self.model_name)
            #     logger.info(f"Loaded embedding model: {self.model_name}")
            # elif settings.openai_api_key:
            #     # Use OpenAI embeddings (implement if needed)
            #     logger.info("Using OpenAI embeddings")
            # else:
            #     raise ValueError("No valid embedding configuration found")
                
        except Exception as e:
            logger.error(f"Error loading embedding model: {str(e)}")
            raise
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text
            
        Returns:
            List of floats representing the embedding
        """
        try:
            if isinstance(self.model, SentenceTransformer):
                embedding = self.model.encode(text, convert_to_numpy=True)
                return embedding.tolist()
            else:
                # OpenAI or other provider
                raise NotImplementedError("OpenAI embeddings not yet implemented")
                
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            return []
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts
        
        Args:
            texts: List of input texts
            
        Returns:
            List of embeddings
        """
        try:
            if isinstance(self.model, SentenceTransformer):
                embeddings = self.model.encode(texts, convert_to_numpy=True)
                return [emb.tolist() for emb in embeddings]
            else:
                raise NotImplementedError("Batch embeddings not yet implemented")
                
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            return []
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """
        Split text into overlapping chunks
        
        Args:
            text: Input text
            chunk_size: Size of each chunk in characters
            overlap: Overlap between chunks
            
        Returns:
            List of text chunks
        """
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size // 2:
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return [c for c in chunks if c]  # Filter empty chunks
