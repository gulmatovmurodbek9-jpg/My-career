@echo off
rem Hamai qismhoi loiha bo yak klik: ovoz (8123), backend (3005), sait (5173).
rem Bad az ogozi kompyuter hamin faylro du bor klik kuned.
rem Har qism dar tirezai alohida kor mekunad; baroi istodan tirezaashro pushed.

cd /d "%~dp0"

echo [1/3] Serveri ovoz (8123)...
start "Ovoz 8123" cmd /k "cd /d "%~dp0tajik-tts" && call start.bat"

echo [2/3] Backend (3005)...
start "Backend 3005" cmd /k "cd /d "%~dp0Back\nest-backend" && npm run start:dev"

echo [3/3] Sait (5173)...
start "Sait 5173" cmd /k "cd /d "%~dp0Front" && npm run dev"

echo.
echo Tayyor. Modeli ovoz ~20 soniya bor meshavad, backend ~15 soniya.
echo Bad saitro kushoed: http://localhost:5173
timeout /t 8 >nul
