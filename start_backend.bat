@echo off
REM Quick Start Script for NL-DB-Assistant Backend
REM This script starts the Python FastAPI backend server

echo.
echo ========================================
echo  NL-DB-Assistant Backend Server
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and configure it
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
echo Checking dependencies...
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Dependencies not installed
    echo Run: pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ All checks passed!
echo.
echo 🚀 Starting backend server...
echo    - API will be available at: http://localhost:8000
echo    - API docs at: http://localhost:8000/docs
echo    - Press Ctrl+C to stop
echo.

REM Start the backend
python -m backend.main

pause
