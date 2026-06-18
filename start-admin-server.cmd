@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

if "%PORT%"=="" set "PORT=4173"
if "%HOST%"=="" set "HOST=127.0.0.1"

echo.
echo Starting Admin Policy Workspace server.
echo.
echo - App:  http://localhost:%PORT%/
echo - API:  http://localhost:%PORT%/api/menus
echo - Stop: Press Ctrl+C in this window.
echo.

node server.js
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Server exited with error code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
