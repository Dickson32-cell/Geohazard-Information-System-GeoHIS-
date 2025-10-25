@echo off
cd /d "e:\programable file for school\development\Tunchee WebPage demo\backend"
call conda deactivate 2>nul
"C:\Program Files\nodejs\node.exe" server.js
pause