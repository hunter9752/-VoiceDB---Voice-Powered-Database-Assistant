@echo off
REM Quick Start Script for NL-DB-Assistant Frontend
REM This script starts the Next.js frontend development server

echo.
echo ========================================
echo  NL-DB-Assistant Frontend
echo ========================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)

REM Navigate to frontend directory
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo.
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

echo.
echo ✅ All checks passed!
echo.
echo 🚀 Starting frontend development server...
echo    - UI will be available at: http://localhost:3000
echo    - Make sure backend is running on port 8000
echo    - Press Ctrl+C to stop
echo.

REM Start the frontend
call npm run dev

pause
