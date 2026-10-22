# Panduan Deploy Meduta ke VPS

Arsitektur deploy:

```
Browser ──> Domain (DNS A record) ──> VPS
                                      ├─ Caddy  (HTTPS otomatis, port 443)
                                      └─ Node/Next.js (service systemd, port 3000 lokal)
                                                  ├─ Database → Supabase Postgres (awan)
                                                  └─ Upload   → Supabase Storage (awan)
```

VPS hanya menjalankan aplikasi — database dan semua file upload (foto,
musik, background) sudah berada di Supabase, jadi VPS tidak perlu disk besar.

---

## Prasyarat

- [ ] VPS aktif (Ubuntu 22.04/24.04, minimal 1 vCPU / 1GB RAM) — punya IP publik
- [ ] Domain sudah Anda miliki (bisa diakses DNS-nya)
- [ ] Akun Supabase (database + storage produksi)
- [ ] Akun GitHub (repo `adiskreative/meduta` sudah bisa di-clone; jika repo private, pakai [deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh))

## Langkah 1 — Arahkan domain ke VPS

Di panel DNS registrar Anda:

| Tipe | Nama | Nilai | TTL |
|---|---|---|---|
| A | `@` | `IP_PUBLIK_VPS` | 3600 |
| A | `www` | `IP_PUBLIK_VPS` | 3600 |

Cek setelah propagasi (biasanya < 1 jam):

```bash
dig +short domain-anda.com
# harus mengembalikan IP VPS
```

## Langkah 2 — Persiapan VPS (sekali saja)

SSH ke VPS sebagai root, lalu salin & jalankan skrip setup (atau paste manual):

```bash
# dari komputer lokal — salin skrip ke VPS
scp deploy/setup-vps.sh root@IP_VPS:/root/

# di VPS
bash /root/setup-vps.sh
```

Yang dipasang skrip: Node.js 22, swap 2GB, firewall (SSH/HTTP/HTTPS saja),
Caddy, user khusus `meduta` (home `/opt/meduta`), dan izin restart service.

## Langkah 3 — Clone repo & isi environment

```bash
sudo -iu meduta
git clone -b fix/keamanan-features https://github.com/adiskreative/meduta.git /opt/meduta
cd /opt/meduta
cp .env.example .env
nano .env
```

Isi nilai produksi (lihat tabel berikutnya). **Wajib**: `DATABASE_URL`,
`DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`.

## Langkah 4 — Siapkan Supabase produksi

1. Buat project baru di [supabase.com](https://supabase.com) (atau pakai yang ada).
2. **Database**: Settings → Database → Connection string:
   - `DATABASE_URL` ← **Transaction pooler** (port 6543, tambah `?pgbouncer=true&connection_limit=1`)
   - `DIRECT_URL` ← **Session pooler** (port 5432) — dipakai `prisma db push`
3. **Storage**: tidak perlu buat bucket manual — aplikasi otomatis membuat
   bucket `avatars` (public) saat upload pertama. Pastikan service role key di-set.
4. Copy nilainya ke `.env` VPS.

> Catatan: database development dan produksi dipisah — jangan pakai project
> Supabase yang isinya data contoh untuk produksi.

## Langkah 5 — Build & jalankan service

```bash
# masih sebagai user meduta
npm ci
npx prisma generate
npm run build
npx prisma db push        # sinkronkan schema ke Supabase produksi
npm run db:seed           # buat akun admin + template (idempoten)
exit                      # kembali ke root
```

Pasang service systemd + Caddy (sebagai root):

```bash
cp /opt/meduta/deploy/meduta.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now meduta

# Caddy — GANTI domain di dalam file dulu!
nano /opt/meduta/deploy/Caddyfile          # ganti meduta.com → domain Anda
cp /opt/meduta/deploy/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
```

`npm run build` menggunakan Prisma Client untuk Node.js. Untuk deployment
Cloudflare Workers, gunakan `npm run build:worker`; script tersebut memilih
Prisma Client dengan runtime `workerd` dan membangun Next.js dengan Turbopack
agar query compiler WASM Prisma dibundel untuk Worker (Webpack mencoba memuatnya
melalui `fs.readFile`, yang tidak tersedia di runtime Cloudflare). Sebelum
deployment Cloudflare pertama dan setiap kali schema berubah, jalankan
`npx prisma db push` dari lingkungan tepercaya dengan `DIRECT_URL` yang mengarah
ke database target yang benar. Periksa perubahan schema yang direncanakan dan
pastikan ada cadangan sebelum menyetujuinya.

Cek: `systemctl status meduta` → `active (running)`, lalu buka
`https://domain-anda.com` — sertifikat HTTPS terbit otomatis oleh Caddy
(dibutuhkan DNS sudah mengarah + port 80/443 terbuka).

## Langkah 6 — OAuth Google & Email produksi

- **Google OAuth** (console.cloud.google.com → Credentials):
  - Authorized JavaScript origin: `https://domain-anda.com`
  - Authorized redirect URI: `https://domain-anda.com/api/auth/callback/google`
- **Resend** (resend.com → Domains): tambahkan & verifikasi domain Anda,
  lalu set `RESEND_API_KEY` dan `EMAIL_FROM="Meduta <admin@meduta.my.id>"`
  setelah alamat tersebut memenuhi persyaratan sender terverifikasi Resend.
  `RESEND_API_KEY` diperlukan untuk mengirim email konfirmasi akun saat
  pendaftaran dan tautan reset password.
- **NEXT_PUBLIC_APP_URL** = `https://domain-anda.com` (dipakai link undangan tamu —
  penting: link undangan yang sudah tersebar mengikuti nilai ini).

## Langkah 7 — Aktifkan pembayaran Premium (Midtrans)

Isi key Midtrans pada environment aplikasi dengan pasangan key dari environment
yang sama:

- Sandbox: `MIDTRANS_IS_PRODUCTION=false` dan gunakan Server Key serta Client Key
  Sandbox. Gunakan ini hanya pada lingkungan pengujian.
- Production: `MIDTRANS_IS_PRODUCTION=true` dan gunakan Server Key serta Client
  Key Production.

Di Midtrans Dashboard untuk environment yang sama, atur Payment Notification URL
ke `https://domain-anda.com/api/midtrans/notification`. URL harus mengarah ke
deployment aplikasi yang sudah memuat route Midtrans; respons `404` berarti
deployment belum memiliki route tersebut. Checkout premium menggunakan
`/api/midtrans/checkout`.

Status `Settlement` di Sandbox hanya transaksi uji dan tidak membuktikan
pembayaran Production. Jangan memasangkan notifikasi Sandbox dengan Server Key
Production atau sebaliknya. Endpoint notifikasi DOKU tetap tersedia untuk
menyelesaikan notifikasi transaksi DOKU lama, tetapi checkout baru memakai
Midtrans.

## Perawatan harian

```bash
# Deploy versi baru (di VPS, sebagai user meduta):
bash /opt/meduta/deploy/deploy.sh

# Log aplikasi:
journalctl -u meduta -f

# Restart manual:
sudo systemctl restart meduta
```

## Troubleshooting

| Gejala | Cek |
|---|---|
| 502 Bad Gateway | `systemctl status meduta` — aplikasi mati; lihat `journalctl -u meduta -n 50` |
| HTTPS tidak terbit | DNS belum mengarah / port 80 terblokir; `journalctl -u caddy -n 50` |
| `P1001` saat build/seed | `DATABASE_URL`/`DIRECT_URL` salah pooler; lihat Langkah 4 |
| Upload gagal "Bucket storage belum siap" | `SUPABASE_SERVICE_ROLE_KEY` kosong atau salah project |
| Email terkirim ke spam | Verifikasi domain (SPF/DKIM) di dashboard Resend |
| Build kehabisan memori | Swap aktif? `swapon --show`; skrip setup sudah membuat 2GB |
