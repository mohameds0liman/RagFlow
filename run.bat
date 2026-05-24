@echo off
echo ============================
echo Starting RAGFlow Backend...
echo ============================
start "RAGFlow-Backend" cmd /k "python run.py"
timeout /t 3 /nobreak >nul
echo ============================
echo Starting RAGFlow Frontend...
echo ============================
start "RAGFlow-Frontend" cmd /k "cd /d "%~dp0Frontend" && npm run dev -- --host"
echo ============================
echo Both servers starting...
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo ============================