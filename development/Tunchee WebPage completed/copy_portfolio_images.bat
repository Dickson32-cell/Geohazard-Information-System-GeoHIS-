@echo off
echo Copying portfolio images from backend to frontend...
echo.

set BACKEND_DIR=E:\programable file for school\development\Tunchee WebPage completed\backend\uploads
set FRONTEND_DIR=E:\programable file for school\development\Tunchee WebPage completed\frontend\public\portfolio

if not exist "%BACKEND_DIR%" (
    echo Backend uploads directory not found: %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    mkdir "%FRONTEND_DIR%"
)

echo Copying images...
copy "%BACKEND_DIR%\*.jpg" "%FRONTEND_DIR%\" 2>nul
copy "%BACKEND_DIR%\*.jpeg" "%FRONTEND_DIR%\" 2>nul
copy "%BACKEND_DIR%\*.png" "%FRONTEND_DIR%\" 2>nul
copy "%BACKEND_DIR%\*.gif" "%FRONTEND_DIR%\" 2>nul
copy "%BACKEND_DIR%\*.webp" "%FRONTEND_DIR%\" 2>nul

echo.
echo Images copied successfully!
echo Update the portfolioImages array in src/pages/Portfolio.jsx to include the new images.
echo.
pause