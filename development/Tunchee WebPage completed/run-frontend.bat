@echo off
echo Starting frontend server...

:: Deactivate conda environment if active
call conda deactivate 2>NUL

:: Navigate to the frontend directory
cd /d "e:\programable file for school\development\Tunchee WebPage demo\frontend"

:: Run Vite with specific options
"C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js --port 5173 --host

pause