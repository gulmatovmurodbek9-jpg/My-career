# Таҳрири грамматикии ҳамаи сенарияҳо (AI-муҳаррир) ва баъд интиқол ба сервер. Аз ҷои қатъшуда давом медиҳад.
#   Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File scripts\trials-proofread.ps1" -WindowStyle Hidden
# Лог: Back\nest-backend\trials-proofread.log. Файл бояд UTF-8 бо BOM бошад (PowerShell 5.1).
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "Back\nest-backend"
$log = Join-Path $backend "trials-proofread.log"
$bash = "C:\Program Files\Git\bin\bash.exe"
$unix = $root -replace '\\', '/'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

Push-Location $backend
cmd /c "npm run trials:proofread -- --concurrency 5 >> `"$log`" 2>&1"
Pop-Location
$out = & $bash -lc "cd '$unix' && bash scripts/sync-trials.sh 2>&1" | Out-String
Add-Content -Path $log -Value ("{0:HH:mm} Интиқол: {1}" -f (Get-Date), ($out -replace "`r?`n", ' ')) -Encoding UTF8
