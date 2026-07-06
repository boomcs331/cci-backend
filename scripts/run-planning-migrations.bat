@echo off
echo ========================================
echo Running Sales Planning Migrations
echo ========================================
echo.

cd /d "%~dp0.."

echo Step 1: Creating tables...
node scripts\run-migration-simple.js
if %errorlevel% neq 0 (
    echo ERROR: Tables migration failed
    pause
    exit /b 1
)

echo.
echo Step 2: Creating menus...
echo (Please run 081-sales-planning-menu.sql manually in pgAdmin/DBeaver)
echo.

echo ========================================
echo Migration completed!
echo ========================================
pause
