@echo off
rem Sahifai sabti ovoz. Du bor klik kuned - brauzer xudash kushoda meshavad.
rem Mikrofon faqat dar localhost kor mekunad, baroi hamin serveri xurd lozim ast.
cd /d "%~dp0"
set PY=..\.venv\Scripts\python.exe
if not exist "%PY%" set PY=py
start "" http://localhost:8765/
echo Sahifai sabt: http://localhost:8765/   (baroi istodan tirezaro pushed)
"%PY%" -m http.server 8765 --bind 127.0.0.1
