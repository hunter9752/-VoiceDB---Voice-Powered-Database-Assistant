# Python Backend Setup Guide

## Prerequisites

- Python 3.8 or higher
- Supabase account and project
- GROQ API key

## Step-by-Step Setup

### 1. Install Python Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Supabase

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

#### Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `backend/schema.sql`
4. Run the SQL script

This will create:
- `documents` table for RAG
- `query_logs` table for audit trail
- Vector search functions
- Safe query execution function

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# GROQ API Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

**Where to find Supabase keys:**
- Go to Project Settings → API
- Copy the Project URL
- Copy the `service_role` key (keep this secret!)
- Copy the `anon` key

**Where to get GROQ API key:**
- Go to [console.groq.com](https://console.groq.com)
- Create an account
- Generate an API key

### 4. Start the Backend Server

```bash
# Make sure virtual environment is activated
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 5. Test the API

Open your browser and go to:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

Or use curl:

```bash
# Health check
curl http://localhost:8000/health

# Get schema
curl http://localhost:8000/schema

# Test query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me all tables"}'
```

### 6. Ingest Sample Data (Optional)

```bash
# Ingest a CSV file
python scripts/ingest_dataset.py --file data/your_data.csv --table your_table_name

# Ingest a text document for RAG context
python scripts/ingest_dataset.py --file data/documentation.txt
```

## Troubleshooting

### "Module not found" errors

Make sure you're in the virtual environment and all dependencies are installed:

```bash
pip install -r requirements.txt
```

### Supabase connection errors

- Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check that you've run the `backend/schema.sql` script
- Ensure your Supabase project is active

### GROQ API errors

- Verify your `GROQ_API_KEY` is valid
- Check you have API credits available
- Ensure the model name is correct: `llama-3.3-70b-versatile`

### Import errors

Make sure you're running commands from the project root directory:

```bash
cd "c:\hacthin farm tak moodel"
python -m uvicorn backend.main:app --reload
```

## Next Steps

1. **Frontend Setup**: See `FRONTEND_SETUP.md`
2. **Data Ingestion**: Upload your datasets
3. **Testing**: Try natural language queries
4. **Production**: Configure for deployment

## API Endpoints

### POST /query
Process natural language query

**Request:**
```json
{
  "query": "Show me all users created in the last week",
  "use_rag": true
}
```

**Response:**
```json
{
  "sql": "SELECT * FROM users WHERE created_at >= NOW() - INTERVAL '7 days'",
  "explanation": "This query returns all users created in the last 7 days",
  "confidence": 0.95,
  "results": [...],
  "result_count": 42,
  "warnings": []
}
```

### GET /schema
Get database schema

**Query Parameters:**
- `table_name` (optional): Specific table name

### POST /ingest
Ingest document for RAG

**Request:**
```json
{
  "content": "Your document content here",
  "metadata": {"source": "manual_upload"}
}
```

### GET /health
Health check endpoint

## Architecture

```
User Query
    ↓
FastAPI Backend
    ↓
RAG Service (retrieve context)
    ↓
LLM Service (GROQ/Llama 70B)
    ↓
SQL Validator
    ↓
Supabase (execute query)
    ↓
Results returned to user
```

## Security Notes

- Never commit `.env` file to version control
- Use `service_role` key only on backend (never expose to frontend)
- All queries are validated before execution
- Only SELECT statements are allowed
- Query logs are maintained for audit trail
