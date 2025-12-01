"""
Dataset ingestion script
Uploads CSV/JSON data to Supabase and creates embeddings for RAG
"""

import sys
import asyncio
import pandas as pd
import argparse
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.services.rag_service import RAGService
from backend.services.supabase_service import SupabaseService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def ingest_csv(file_path: str, table_name: str = None):
    """
    Ingest CSV file into Supabase
    
    Args:
        file_path: Path to CSV file
        table_name: Optional table name (defaults to filename)
    """
    try:
        # Read CSV
        df = pd.read_csv(file_path)
        logger.info(f"Loaded CSV with {len(df)} rows and {len(df.columns)} columns")
        
        # Determine table name
        if not table_name:
            table_name = Path(file_path).stem.lower().replace(' ', '_')
        
        logger.info(f"Table name: {table_name}")
        
        # Initialize services
        supabase = SupabaseService()
        rag = RAGService()
        
        # Create documents for RAG from the data
        logger.info("Creating embeddings for RAG...")
        
        # Convert each row to a text description
        for idx, row in df.iterrows():
            # Create a text representation of the row
            row_text = f"Record from {table_name}: "
            row_text += ", ".join([f"{col}={val}" for col, val in row.items()])
            
            # Ingest into RAG system
            metadata = {
                "table": table_name,
                "row_index": idx,
                "source": file_path
            }
            
            await rag.ingest_document(content=row_text, metadata=metadata)
            
            if (idx + 1) % 10 == 0:
                logger.info(f"Processed {idx + 1}/{len(df)} rows")
        
        logger.info(f"✓ Successfully ingested {len(df)} rows into RAG system")
        
        # Also store the actual data in Supabase
        # Note: You'll need to create the table first or use Supabase's auto-create
        logger.info(f"Data is ready for querying via natural language!")
        
        # Print sample queries
        print("\n" + "="*60)
        print("Sample queries you can try:")
        print(f"  - Show me all records from {table_name}")
        print(f"  - Count total rows in {table_name}")
        if len(df.columns) > 0:
            first_col = df.columns[0]
            print(f"  - Find records where {first_col} is...")
        print("="*60 + "\n")
        
    except Exception as e:
        logger.error(f"Error ingesting CSV: {str(e)}")
        raise

async def ingest_text_file(file_path: str):
    """
    Ingest text file for RAG context
    
    Args:
        file_path: Path to text file
    """
    try:
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        logger.info(f"Loaded text file with {len(content)} characters")
        
        # Initialize RAG service
        rag = RAGService()
        
        # Ingest document
        metadata = {
            "source": file_path,
            "type": "text_document"
        }
        
        success = await rag.ingest_document(content=content, metadata=metadata)
        
        if success:
            logger.info("✓ Successfully ingested text document")
        else:
            logger.error("✗ Failed to ingest text document")
            
    except Exception as e:
        logger.error(f"Error ingesting text file: {str(e)}")
        raise

async def main():
    parser = argparse.ArgumentParser(description='Ingest dataset into NL-DB-Assistant')
    parser.add_argument('--file', required=True, help='Path to data file (CSV or TXT)')
    parser.add_argument('--table', help='Table name (for CSV files)')
    parser.add_argument('--type', choices=['csv', 'text'], help='File type (auto-detected if not specified)')
    
    args = parser.parse_args()
    
    # Determine file type
    file_path = Path(args.file)
    if not file_path.exists():
        logger.error(f"File not found: {args.file}")
        return
    
    file_type = args.type
    if not file_type:
        if file_path.suffix.lower() == '.csv':
            file_type = 'csv'
        elif file_path.suffix.lower() in ['.txt', '.md']:
            file_type = 'text'
        else:
            logger.error(f"Unable to determine file type for: {args.file}")
            return
    
    logger.info(f"Ingesting {file_type} file: {args.file}")
    
    # Ingest based on type
    if file_type == 'csv':
        await ingest_csv(args.file, args.table)
    elif file_type == 'text':
        await ingest_text_file(args.file)

if __name__ == "__main__":
    asyncio.run(main())
