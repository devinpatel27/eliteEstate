@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"

if not exist "%BACKEND%\package.json" (
  echo [ERROR] Backend folder not found: %BACKEND%
  pause
  exit /b 1
)

if not exist "%FRONTEND%\package.json" (
  echo [ERROR] Frontend folder not found: %FRONTEND%
  pause
  exit /b 1
)

where wt >nul 2>&1
if %errorlevel%==0 (
  echo Starting Elite Estate CRM in Windows Terminal ^(2 tabs^)...
  wt -w 0 new-tab --title "CRM Backend" -d "%BACKEND%" cmd /k "npm run dev" ; new-tab --title "CRM Frontend" -d "%FRONTEND%" cmd /k "npm run dev"
  exit /b 0
)

echo Windows Terminal not found. Opening two CMD windows instead...
start "CRM Backend" cmd /k "cd /d "%BACKEND%" && npm run dev"
start "CRM Frontend" cmd /k "cd /d "%FRONTEND%" && npm run dev"

exit /b 0
