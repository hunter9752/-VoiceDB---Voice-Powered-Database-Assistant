# 🚀 VoiceDB Deployment Guide

Complete guide for deploying VoiceDB to production.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database is accessible from deployment platform
- [ ] GROQ API key is valid
- [ ] .env files are in .gitignore
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend starts without errors

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Repository

```bash
# Ensure you're in the project root
cd c:\hacthin farm tak moodel

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - VoiceDB by SHREYASNH"

# Create main branch
git branch -M main
```

### Step 2: Push to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/SHREYASNH/voicedb.git

# Push to GitHub
git push -u origin main
```

### Step 3: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Import your repository**: `SHREYASNH/voicedb`

5. **Configure Project**:
   - **Project Name**: `voicedb`
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

6. **Environment Variables** (Add these in Vercel dashboard):
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

7. **Click "Deploy"** ✅

8. **Your frontend will be live at**: `https://voicedb.vercel.app`

## 🔧 Backend Deployment

### Option 1: Railway.app (Recommended)

**Best for**: FastAPI + PostgreSQL + Easy setup

1. **Go to [railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `SHREYASNH/voicedb`

5. **Configure**:
   - **Root Directory**: Leave empty or set to `/`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Build Command**: `pip install -r requirements.txt`

6. **Environment Variables** (Add in Railway):
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db
   USE_DIRECT_POSTGRES=true
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   GROQ_API_KEY=your_groq_key
   GROQ_MODEL=llama-3.1-70b-versatile
   BACKEND_HOST=0.0.0.0
   BACKEND_PORT=$PORT
   CORS_ORIGINS=["https://voicedb.vercel.app"]
   ```

7. **Deploy** → Railway will provide a URL like: `https://voicedb-production.up.railway.app`

8. **Update Vercel**: Go back to Vercel → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to your Railway URL

### Option 2: Render.com (Free Tier Available)

1. **Go to [render.com](https://render.com)**
2. **New** → **Web Service**
3. **Connect repository**: `SHREYASNH/voicedb`

4. **Configure**:
   - **Name**: `voicedb-api`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free (or paid)

5. **Environment Variables**: (Same as Railway)

6. **Create Web Service**

### Option 3: Fly.io (Dockerfile)

1. **Install Fly CLI**:
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Or download from https://fly.io/docs/hands-on/install-flyctl/
```

2. **Create Dockerfile** (already included in project):
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY .env .

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

3. **Deploy**:
```bash
# Login to Fly
fly auth login

# Launch app
fly launch

# Set environment variables
fly secrets set DATABASE_URL=postgresql://...
fly secrets set GROQ_API_KEY=your_key
# ... (set all env vars)

# Deploy
fly deploy
```

## 🔄 Update Deployment

### Update Backend
```bash
# Make changes to backend code
git add .
git commit -m "Update backend"
git push

# Railway/Render will auto-deploy
# For Fly.io: fly deploy
```

### Update Frontend
```bash
# Make changes to frontend
git add .
git commit -m "Update frontend"
git push

# Vercel will auto-deploy
```

## 🔐 Production Security

### 1. Update CORS Origins
In your backend `.env`:
```env
CORS_ORIGINS=["https://voicedb.vercel.app"]
```

### 2. Secure Environment Variables
- Never commit `.env` files
- Use platform secret management
- Rotate keys regularly

### 3. Database Security
- Enable SSL for PostgreSQL connection
- Use strong passwords
- Enable RLS (Row Level Security) in Supabase

## 📊 Monitoring

### Vercel Monitoring
- View logs: Dashboard → Your Project → Logs
- Analytics: Dashboard → Analytics

### Railway Monitoring  
- View logs: Project → Deployments → Logs
- Metrics: Project → Metrics

### Render Monitoring
- View logs: Dashboard → Service → Logs
- Metrics: Dashboard → Metrics

## 🐛 Troubleshooting

### Frontend Build Fails
```bash
# Test build locally
cd frontend
npm run build

# Check for errors
npm run lint
```

### Backend Won't Start
1. Check environment variables are set
2. Verify DATABASE_URL is correct
3. Test GROQ API key is valid
4. Check logs for specific errors

### Database Connection Issues
1. Verify DATABASE_URL format
2. Check if database allows external connections
3. Verify Supabase project is active
4. Check IP whitelist (if applicable)

## 📝 Post-Deployment

### 1. Update README
Add deployment URLs:
```markdown
## 🌐 Live Demo
- Frontend: https://voicedb.vercel.app
- Backend: https://voicedb-api.railway.app
```

### 2. Test All Features
- ✅ Voice input works
- ✅ Text queries work
- ✅ Database tab loads data
- ✅ Editor executes SQL
- ✅ History shows queries
- ✅ Settings displays schema

### 3. Share Your Project! 🎉
```markdown
🎤 VoiceDB is now LIVE!

Frontend: https://voicedb.vercel.app
Backend: https://voicedb-api.railway.app

Created by @SHREYASNH
```

## 🆘 Need Help?

- Check logs in your deployment platform
- Review environment variables
- Test backend API directly: `https://your-backend.com/health`
- Verify Supabase connection
- Check GROQ API quota

---

**Deployment prepared for VoiceDB by SHREYASNH** 🚀
