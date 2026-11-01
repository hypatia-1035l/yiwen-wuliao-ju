@echo off
rem Yiwen Wuliao Ju - one-click dev server launcher
cd /d %~dp0
start "" cmd /c "timeout /t 4 /nobreak >nul & start "" http://127.0.0.1:5180/"
npx vite --host 127.0.0.1 --port 5180
