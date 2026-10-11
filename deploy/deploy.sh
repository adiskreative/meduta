#!/usr/bin/env bash
# ============================================================
# Meduta — Deploy inkremental di VPS (jalankan sebagai meduta)
# Pemakaian: bash deploy.sh        (pull + build + restart)
#            bash deploy.sh --seed (juga jalankan seed)
# ============================================================
set -euo pipefail
cd /opt/meduta

BRANCH="${DEPLOY_BRANCH:-fix/keamanan-features}"
echo "==> Branch: $BRANCH"

echo "==> 1/5 Ambil kode terbaru"
git fetch origin
git reset --hard "origin/$BRANCH"

echo "==> 2/5 Install dependensi"
npm ci

echo "==> 3/5 Generate Prisma client + build Next.js"
npx prisma generate
npm run build

echo "==> 4/5 Sinkronkan schema ke database Supabase"
npx prisma db push --skip-generate

if [ "${1:-}" = "--seed" ]; then
  echo "==> Seed (idempoten)"
  npm run db:seed
fi

echo "==> 5/5 Restart service"
sudo systemctl restart meduta
sleep 3
systemctl is-active meduta && echo "✅ Deploy selesai — aplikasi hidup"
