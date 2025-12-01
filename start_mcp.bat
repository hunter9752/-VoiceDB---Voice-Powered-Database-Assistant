@echo off
REM Quick Start Script for NL-DB-Assistant MCP Server
REM This script starts the Node.js MCP server for Claude Desktop

echo.
echo ========================================
echo  NL-DB-Assistant MCP Server
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

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and configure it
    echo.
    pause
    exit /b 1
)

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
echo 🚀 Starting MCP server...
echo    - Server will communicate via stdio
echo    - For testing, use: npm run inspect
echo    - Press Ctrl+C to stop
echo.

REM Start the MCP server
call npm start

pause
