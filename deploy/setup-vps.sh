#!/usr/bin/env bash
# ============================================================
# Meduta — Persiapan VPS (Ubuntu 22.04 / 24.04)
# Jalankan SEKALI sebagai root di VPS baru:
#   bash setup-vps.sh
# ============================================================
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Jalankan sebagai root: sudo bash setup-vps.sh"
  exit 1
fi

echo "==> 1/7 Update sistem & paket dasar"
apt-get update -y
apt-get install -y ca-certificates curl git ufw

echo "==> 2/7 Node.js 22 LTS (NodeSource)"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node -v

echo "==> 3/7 Swap 2GB (cegah OOM saat build di VPS RAM kecil)"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap aktif"
else
  echo "Swap sudah ada — lewati"
fi

echo "==> 4/7 Firewall: buka SSH, HTTP, HTTPS (port 3000 TIDAK dibuka — hanya via Caddy)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 5/7 Caddy (reverse proxy + HTTPS otomatis Let's Encrypt)"
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
apt-get update -y
apt-get install -y caddy

echo "==> 6/7 User khusus aplikasi: meduta (home = /opt/meduta)"
id -u meduta &>/dev/null || useradd -r -m -d /opt/meduta -s /bin/bash meduta

echo "==> 7/7 Izinkan user meduta restart service tanpa password (dipakai deploy.sh)"
echo "meduta ALL=(root) NOPASSWD: /usr/bin/systemctl restart meduta" > /etc/sudoers.d/meduta-deploy
chmod 440 /etc/sudoers.d/meduta-deploy

echo ""
echo "✅ VPS siap. Lanjutkan sesuai deploy/DEPLOY.md:"
echo "   1. sudo -iu meduta git clone https://github.com/adiskreative/meduta.git /opt/meduta"
echo "   2. Isi /opt/meduta/.env (salin dari .env.example)"
echo "   3. Pasang service: cp deploy/meduta.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now meduta"
echo "   4. Pasang Caddyfile: cp deploy/Caddyfile /etc/caddy/Caddyfile (ganti domain) && systemctl reload caddy"
