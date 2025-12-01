# 🎤 VoiceDB - Voice-Powered Database Assistant

![VoiceDB Banner](https://img.shields.io/badge/VoiceDB-Voice--Powered-00d4ff?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.9+-blue?style=flat-square&logo=python)
![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-green?style=flat-square&logo=postgresql)

**Created by [SHREYASNH](https://github.com/SHREYASNH)**

A modern, voice-enabled natural language database interface that transforms how you interact with databases. Ask questions in plain English (or use your voice!), and get instant SQL results.

## ✨ Features

### 🎯 Core Capabilities
- **🎤 Voice Input** - Speak your database queries naturally using Web Speech API
- **💬 Natural Language Processing** - Ask questions in plain English, get SQL automatically
- **📊 5 Powerful Tabs**:
  - **Chat** - Voice & text queries with real-time results
  - **Database** - Browse tables with pagination
  - **Editor** - Direct SQL editor with syntax support
  - **History** - Track all your queries with filters
  - **Settings** - View complete database schema

### 🚀 Technology Stack

#### Backend
- **FastAPI** - High-performance Python web framework
- **PostgreSQL (Supabase)** - Direct database connection via `asyncpg`
- **GROQ LLM** - Llama 70B for SQL generation
- **RAG** - Context-aware query understanding

#### Frontend
- **Next.js 13** - React framework with SSR
- **Web Speech API** - Native browser voice recognition
- **Modern UI** - Glassmorphism, gradients, animations
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🎨 UI Highlights

- **Stunning Cyan-Emerald Gradient Theme**
- **Glassmorphism Effects**
- **Smooth Animations & Transitions**
- **Voice Input with Real-time Transcription**
- **Dark Mode Optimized**
- **Mobile-Responsive Touch Interface**

## 📦 Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL database (Supabase recommended)
- GROQ API key

### 1. Clone Repository
```bash
git clone https://github.com/SHREYASNH/voicedb.git
cd voicedb
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL (PostgreSQL connection string)
# - GROQ_API_KEY
# - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local if needed
```

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
python -m backend.main
# Runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## 🌐 Deployment

### Vercel Deployment (Frontend)

1. **Push to GitHub** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit - VoiceDB by SHREYASNH"
git branch -M main
git remote add origin https://github.com/SHREYASNH/voicedb.git
git push -u origin main
```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure:
     - **Framework**: Next.js
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`
   - Add environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_API_URL` = your backend URL

### Backend Deployment Options

#### Option 1: Railway
- Best for FastAPI + PostgreSQL
- Connect GitHub repo
- Deploy from `backend` directory
- Add environment variables

#### Option 2: Render
- Free tier available
- Deploy as Web Service
- Set build command: `pip install -r requirements.txt`
- Set start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

#### Option 3: Fly.io
- Great for Python apps
- Use included `Dockerfile`
- Deploy with: `fly deploy`

## 📁 Project Structure

```
voicedb/
├── backend/                 # FastAPI backend
│   ├── main.py             # FastAPI app entry
│   ├── config.py           # Configuration
│   ├── services/           # Core services
│   │   ├── postgres_service.py   # Direct DB connection
│   │   ├── llm_service.py        # GROQ LLM integration
│   │   └── supabase_service.py   # Supabase client
│   └── models/             # Data models
│
├── frontend/               # Next.js frontend
│   ├── pages/             # Next.js pages
│   │   └── index.tsx      # Main app page
│   ├── components/        # React components
│   │   ├── ChatTab.tsx    # Voice & text chat
│   │   ├── DatabaseTab.tsx # Table browser
│   │   ├── EditorTab.tsx   # SQL editor
│   │   ├── HistoryTab.tsx  # Query history
│   │   └── SettingsTab.tsx # Schema viewer
│   └── styles/            # CSS files
│
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
USE_DIRECT_POSTGRES=true

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-70b-versatile

# Server
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎯 Usage Examples

### Voice Query
1. Open http://localhost:3000
2. Click the 🎤 microphone button
3. Say: "Show all users"
4. Watch VoiceDB generate SQL and display results!

### Text Query
1. Type: "How many orders were placed today?"
2. Click "Ask"
3. View the generated SQL and results

### Direct SQL
1. Go to "Editor" tab
2. Write: `SELECT * FROM products WHERE price > 100`
3. Click "Execute"

## 🔒 Security Features

- ✅ SQL injection prevention
- ✅ Row Level Security (RLS) with Supabase
- ✅ Environment variable protection
- ✅ Query validation and sanitization
- ✅ Rate limiting (configurable)
- ✅ Destructive query confirmation

## 🎨 Customization

### Theme Colors
Edit `frontend/styles/globals.css`:
```css
:root {
  --accent-primary: #06b6d4;  /* Cyan */
  --accent-secondary: #10b981; /* Emerald */
}
```

### Database Schema
Add your own tables to Supabase, and VoiceDB will automatically detect and query them!

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:8000/health

# View logs
python -m backend.main
```

### Frontend Issues
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

### Database Connection
```bash
# Test PostgreSQL connection
python test_postgres_connection.py
```

## 📊 API Endpoints

### Backend REST API

- `GET /health` - Health check
- `GET /schema` - Get database schema
- `POST /query` - Execute natural language query
  ```json
  {
    "query": "Show all users",
    "confirm_destructive": false
  }
  ```

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

**SHREYASNH**
- GitHub: [@SHREYASNH](https://github.com/SHREYASNH)
- Project: VoiceDB - Voice-Powered Database Assistant

## 🙏 Acknowledgments

- **GROQ** - For the powerful Llama 70B LLM
- **Supabase** - For PostgreSQL hosting and authentication
- **Vercel** - For Next.js deployment
- **FastAPI** - For the amazing Python web framework

## 🚀 Roadmap

- [ ] Multi-language support
- [ ] Advanced chart visualizations
- [ ] Export to CSV/Excel
- [ ] Team collaboration features
- [ ] Custom query templates
- [ ] AI-powered query suggestions

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/SHREYASNH">SHREYASNH</a>
</p>

<p align="center">
  <a href="#-voicedb---voice-powered-database-assistant">Back to Top ⬆️</a>
</p>
