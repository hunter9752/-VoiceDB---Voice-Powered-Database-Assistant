# 🔧 Environment Configuration Guide

## Step-by-Step Setup

### 1. Get Your GROQ API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create API Key"
5. Copy the key (starts with `gsk_...`)

**Add to .env:**
```env
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

---

### 2. Setup Supabase

#### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Set project name (e.g., "nl-db-assistant")
5. Set database password (save this!)
6. Choose region (closest to you)
7. Click "Create new project"
8. Wait 2-3 minutes for setup

#### Get API Credentials

1. Go to **Project Settings** (gear icon)
2. Click **API** in sidebar
3. Copy the following:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) ⚠️ Keep this secret!

**Add to .env:**
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key
SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
```

#### Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `backend/schema.sql` from this project
4. Copy all the SQL code
5. Paste into Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

This creates:
- ✅ `documents` table for RAG
- ✅ `query_logs` table for audit
- ✅ Vector search functions
- ✅ Safe query execution function

---

### 3. Complete .env File Template

Copy this to your `.env` file and fill in your actual values:

```env
# ============================================
# SUPABASE CONFIGURATION (Required)
# ============================================
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

# ============================================
# GROQ API CONFIGURATION (Required)
# ============================================
GROQ_API_KEY=gsk_xxxxx
GROQ_MODEL=llama-3.3-70b-versatile

# ============================================
# EMBEDDING CONFIGURATION
# ============================================
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
# Optional: Use OpenAI embeddings instead
# OPENAI_API_KEY=sk-xxxxx
# EMBEDDING_MODEL=text-embedding-3-small

# ============================================
# BACKEND CONFIGURATION
# ============================================
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# ============================================
# DATABASE CONFIGURATION (Optional - for MCP server)
# ============================================
DB_TYPE=sqlite
DB_PATH=./sample.sqlite

# ============================================
# SECURITY SETTINGS
# ============================================
ALLOW_DESTRUCTIVE_QUERIES=false
MAX_QUERY_COMPLEXITY=100
ENABLE_AUDIT_LOG=true
QUERY_TIMEOUT=30000

# ============================================
# CONNECTION POOL
# ============================================
DB_POOL_MIN=2
DB_POOL_MAX=10

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_QUERIES=true

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_SCHEMA_CACHE=true
ENABLE_QUERY_SUGGESTIONS=true
ENABLE_RAG=true
MAX_CONTEXT_CHUNKS=5
```

---

### 4. Verify Configuration

After filling in your `.env` file, verify it's correct:

#### Check Python Backend

```bash
# Activate virtual environment
venv\Scripts\activate

# Test configuration
python -c "from backend.config import settings; print('✓ Config loaded'); print(f'Supabase: {settings.supabase_url}'); print(f'GROQ Model: {settings.groq_model}')"
```

You should see:
```
✓ Config loaded
Supabase: https://your-project.supabase.co
GROQ Model: llama-3.3-70b-versatile
```

#### Test API Connection

```bash
# Start the backend
python -m uvicorn backend.main:app --reload
```

Then in another terminal:
```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "services": {
    "supabase": "connected",
    "llm": "ready"
  }
}
```

---

### 5. Common Issues

#### "Module not found" errors
```bash
pip install -r requirements.txt
```

#### "Invalid API key" from GROQ
- Check your GROQ_API_KEY is correct
- Ensure no extra spaces
- Key should start with `gsk_`

#### "Supabase connection failed"
- Verify SUPABASE_URL is correct
- Check SUPABASE_SERVICE_ROLE_KEY (not anon key)
- Ensure you ran `backend/schema.sql`

#### "pgvector extension not found"
- Go to Supabase Dashboard → Database → Extensions
- Search for "vector"
- Enable the extension
- Re-run `backend/schema.sql`

---

### 6. Security Checklist

- [ ] Never commit `.env` to git (it's in `.gitignore`)
- [ ] Use `service_role` key only on backend
- [ ] Use `anon` key for frontend (when needed)
- [ ] Keep GROQ_API_KEY secret
- [ ] Set `ALLOW_DESTRUCTIVE_QUERIES=false` in production

---

### 7. Next Steps

Once configured:

1. **Test the backend:**
   ```bash
   python -m uvicorn backend.main:app --reload
   ```
   Visit: http://localhost:8000/docs

2. **Test the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Visit: http://localhost:3000

3. **Ingest sample data:**
   ```bash
   python scripts/ingest_dataset.py --file data/sample.csv
   ```

4. **Try a query:**
   - Open http://localhost:3000
   - Type: "Show me all tables"
   - Click "Ask"

---

## Quick Reference

| Variable | Where to Get It | Example |
|----------|----------------|---------|
| `SUPABASE_URL` | Supabase → Settings → API | `https://abc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | `eyJhbGc...` |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API | `eyJhbGc...` |
| `GROQ_API_KEY` | console.groq.com → API Keys | `gsk_...` |

---

**Need help?** Check [PYTHON_SETUP.md](PYTHON_SETUP.md) for detailed troubleshooting!
