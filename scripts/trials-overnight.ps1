# Шабона: интизори тамом шудани тавлид → гузариши дуюм (ихтисосҳои нашуда) → интиқол ба сервер.
#   Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File scripts\trials-overnight.ps1" -WindowStyle Hidden
# Лог: Back\nest-backend\trials-overnight.log
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "Back\nest-backend"
$log = Join-Path $backend "trials-overnight.log"
$bash = "C:\Program Files\Git\bin\bash.exe"

function Say($text) { Add-Content -Path $log -Value ("{0:HH:mm} {1}" -f (Get-Date), $text) -Encoding UTF8 }
function Running { @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*generate-career-trials*' }).Count -gt 0 }

Say "Интизори тавлиди ҷорӣ…"
while (Running) { Start-Sleep -Seconds 60 }
Say "Тавлид тамом шуд. Интиқоли аввал ба сервер…"
& $bash -lc "cd '$($root -replace '\\','/')' && bash scripts/sync-trials.sh" *>> $log

# Гузариши дуюм ва сеюм: ихтисосҳое, ки бо хато монданд.
foreach ($pass in 2..3) {
    Say "Гузариши $pass (ихтисосҳои нашуда)…"
    Push-Location $backend
    cmd /c "npm run trials:generate -- --concurrency 6 >> `"$backend\trials-generate.log`" 2>&1"
    Pop-Location
    & $bash -lc "cd '$($root -replace '\\','/')' && bash scripts/sync-trials.sh" *>> $log
}
Say "Тамом."
