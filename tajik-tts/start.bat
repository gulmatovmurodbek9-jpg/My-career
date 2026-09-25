@echo off
rem Сервери овози точики. Порт 8123.
rem Ичро: ду бор клик кунед, ё дар терминал: tajik-tts\start.bat

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [XATO] Muhiti .venv nest.
    echo Iчro kuned:  py -3.12 -m venv .venv
    pause
    exit /b 1
)

if not exist "model\config.json" (
    echo [XATO] Modeli ovoz dar papkai model\ nest.
    pause
    exit /b 1
)

set PYTHONIOENCODING=utf-8
echo Serveri ovoz: http://127.0.0.1:8123
echo Baroi istodan: Ctrl+C
echo.

.venv\Scripts\python.exe server.py
pause
