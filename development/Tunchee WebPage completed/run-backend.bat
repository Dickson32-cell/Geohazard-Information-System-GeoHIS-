@echo off
echo Starting backend server...

:: Deactivate conda environment if active
call conda deactivate 2>NUL

:: Navigate to the backend directory
cd /d "e:\programable file for school\development\Tunchee WebPage demo\backend"

:: Run the simple server
"C:\Program Files\nodejs\node.exe" simple-server.js

pause