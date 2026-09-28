@echo off
rem Sahifai sabti ovoz. Du bor klik kuned.
rem Mikrofon faqat dar localhost kor mekunad, baroi hamin serveri xurd lozim ast.
cd /d "%~dp0"

set PY=..\.venv\Scripts\python.exe
if not exist "%PY%" set PY=python
"%PY%" --version >nul 2>&1
if errorlevel 1 (
    echo [XATO] Python yoft nashud. Python-ro nasb kuned: https://www.python.org/downloads/
    pause
    exit /b 1
)

rem Brauzer faqat bad az ogozi server kushoda meshavad - vagarna
rem "sait dastnoras" menamoyad.
start "" /b cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:8765/"

echo.
echo   Sahifai sabt: http://localhost:8765/
echo   Agar brauzer xudash kushoda nashavad, in suroghro dar Chrome kushoed.
echo   Baroi istodan in tirezaro pushed.
echo.
"%PY%" -m http.server 8765 --bind 127.0.0.1
if errorlevel 1 (
    echo.
    echo [XATO] Server ogoz nashud. Shoyad port 8765 band ast - tirezai kuhnaro pushed.
    pause
)
