#!/usr/bin/env bash
#
# Installs the server-side autodeploy poller. Run once, as root, on the server:
#
#     bash /root/My-career/scripts/install-autodeploy.sh
#
# Re-running is safe — it overwrites the installed copy and restarts the timer.
# To turn it off:  systemctl disable --now mycareer-autodeploy.timer

set -euo pipefail

REPO=/root/My-career
BIN=/usr/local/bin/mycareer-autodeploy

install -m 755 "$REPO/scripts/autodeploy.sh" "$BIN"

cat > /etc/systemd/system/mycareer-autodeploy.service <<'UNIT'
[Unit]
Description=Deploy My Career when origin/main moves
After=network-online.target mycareer-api.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/mycareer-autodeploy
# A frontend build on a 2 GB box leans on swap; give it room before giving up.
TimeoutStartSec=1800
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mycareer-autodeploy
UNIT

cat > /etc/systemd/system/mycareer-autodeploy.timer <<'UNIT'
[Unit]
Description=Check GitHub for new My Career commits every minute

[Timer]
OnBootSec=2min
OnUnitActiveSec=1min
AccuracySec=10s
Unit=mycareer-autodeploy.service

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now mycareer-autodeploy.timer
systemctl restart mycareer-autodeploy.timer

echo
echo "installed. next run:"
systemctl list-timers mycareer-autodeploy.timer --no-pager
