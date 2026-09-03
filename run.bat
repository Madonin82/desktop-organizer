@echo off
setlocal
title Desktop File Organizer - Launcher
cd /d "%~dp0"

echo ========================================================
echo       Desktop File Organizer - Launcher
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js is not installed on this PC.
    echo.
    echo No worries! Launching the Native Windows Desktop App directly...
    echo (Runs instantly with zero extra software required)
    echo.
    timeout /t 2 >nul
    call "%~dp0Organizer-Desktop-App.bat"
    exit /b
)

if not exist "node_modules\" (
    echo [*] First time setup: Installing web app packages...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [!] npm install failed. Launching the native Windows app instead...
        call "%~dp0Organizer-Desktop-App.bat"
        exit /b
    )
)

echo [*] Starting local web app server...
echo [*] Opening your browser to http://localhost:3000
start "" "http://localhost:3000"
call npm run dev
