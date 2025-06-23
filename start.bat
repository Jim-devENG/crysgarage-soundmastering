@echo off
echo Starting all services...

:: Check if PostgreSQL is running
net start postgresql* 2>nul
if errorlevel 1 (
    echo PostgreSQL service not found or failed to start
    pause
    exit /b 1
)

:: Start Laravel backend
echo Starting Laravel backend...
start cmd /k "cd backend && php artisan serve"

:: Wait for backend to start
timeout /t 5 /nobreak

:: Start Laravel queue worker
echo Starting Laravel queue worker...
start cmd /k "cd backend && php artisan queue:work"

:: Start Next.js frontend
echo Starting Next.js frontend...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo All services started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul

npx prisma db seed 