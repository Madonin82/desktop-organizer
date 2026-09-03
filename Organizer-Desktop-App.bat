@echo off
setlocal
title Windows Desktop File Organizer
cd /d "%~dp0"

echo ========================================================
echo       Launching Windows Desktop File Organizer...
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Organizer-Desktop-App.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Running with elevated PowerShell bypass...
    powershell -NoProfile -WindowStyle Normal -Command "& {Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; & '%~dp0Organizer-Desktop-App.ps1'}"
)
