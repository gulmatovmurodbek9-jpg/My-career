# Шабона: тавлиди «Як рӯз дар ихтисос» то ҳамаи ихтисосҳо сенария гиранд, баъд аз ҳар гузариш —
# интиқол ба сервер. Агар тавлид аллакай равон бошад, аввал интизори тамом шуданаш мешавад.
#   Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File scripts\trials-overnight.ps1" -WindowStyle Hidden
# Лог: Back\nest-backend\trials-overnight.log (UTF-8). Файл бояд UTF-8 бо BOM бошад (PowerShell 5.1).
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "Back\nest-backend"
$log = Join-Path $backend "trials-overnight.log"
$genLog = Join-Path $backend "trials-generate.log"
$bash = "C:\Program Files\Git\bin\bash.exe"
$unix = $root -replace '\\', '/'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

function Say($text) { Add-Content -Path $log -Value ("{0:HH:mm} {1}" -f (Get-Date), $text) -Encoding UTF8 }
function Running { @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*generate-career-trials*' }).Count -gt 0 }
function Sync {
    $out = & $bash -lc "cd '$unix' && bash scripts/sync-trials.sh 2>&1" | Out-String
    $lines = ($out -split "`n" | Where-Object { $_ -match 'Содир|Ворид|rror' }) -join ' · '
    Say "Интиқол: $lines"
}

if (Running) {
    Say "Интизори тавлиди ҷорӣ…"
    while (Running) { Start-Sleep -Seconds 60 }
}
Sync

foreach ($pass in 1..6) {
    Say "Гузариши $pass…"
    $before = (Get-Item $genLog -ErrorAction SilentlyContinue).Length
    Push-Location $backend
    cmd /c "npm run trials:generate -- --concurrency 5 >> `"$genLog`" 2>&1"
    Pop-Location
    Sync
    # Агар дар ин гузариш ихтисоси нав намонд — тамом.
    $tail = Get-Content $genLog -Encoding UTF8 | Select-Object -Last 400
    $header = $tail | Where-Object { $_ -match 'Тавлид: (\d+) ихтисос' } | Select-Object -Last 1
    if ($header -match 'Тавлид: 0 ихтисос') { Say "Ҳамаи ихтисосҳо сенария доранд."; break }
}
Say "Тамом."
