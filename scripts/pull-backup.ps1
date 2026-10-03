# Нусхаи эҳтиётии база дар ҶОИ ДИГАР: ҳар рӯз охирин нусхаи серверро ба ин компютер мекашад.
# (Нусхаҳои сервер дар ҳамон диск ҳастанд — агар сервер афтад, онҳо ҳам нест мешаванд.)
#
#   Дастӣ:   powershell -ExecutionPolicy Bypass -File scripts\pull-backup.ps1
#   Худкор:  дар Task Scheduler вазифаи «MyCareer pull backup» (ҳар рӯз 10:00 ва ҳангоми ворид шудан).
#   Нигоҳдорӣ: 30 нусхаи охир дар %USERPROFILE%\MyCareerBackups.
$ErrorActionPreference = 'Stop'
$server = 'root@31.222.229.253'
$key = Join-Path $env:USERPROFILE '.ssh\mycareer_deploy'
$dest = Join-Path $env:USERPROFILE 'MyCareerBackups'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$latest = (& ssh -i $key -o BatchMode=yes $server 'ls -1t /root/backups/daily/db-*.sql.gz | head -1').Trim()
if (-not $latest) { throw 'Дар сервер нусха нест' }
$name = Split-Path $latest -Leaf
$target = Join-Path $dest $name
if (-not (Test-Path $target)) {
    & scp -i $key -o BatchMode=yes "${server}:$latest" $target
    if ($LASTEXITCODE -ne 0) { throw 'scp нашуд' }
}
Get-ChildItem $dest -Filter 'db-*.sql.gz' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | Remove-Item -Force
"$(Get-Date -Format s) $name ($([math]::Round((Get-Item $target).Length / 1MB, 1)) MB)" | Add-Content (Join-Path $dest 'pull.log')
