# Run Doc — Meduta (Next.js 16 + Turbopack + Prisma)

## 1. Reproduksi artefak (checkout baru)

Semua artefak berikut **tidak di-commit**, wajib dibuat ulang:

| Artefak | Cara membuat |
|---|---|
| `.env` | **Copy dari main checkout** (`F:\development\meduta\.env`) — jangan symlink. Isi koneksi DB (Prisma adapter-pg) & konfigurasi email. Jangan pernah menuliskan nilai rahasianya di dokumen ini. |
| `node_modules/` | `npm install` (Windows: pakai `npm.cmd` bila memanggil via PowerShell) |
| `generated/prisma/` (Prisma client, output kustom — **bukan** `node_modules/.prisma`) | `npx prisma generate` |

Opsional (hanya bila thumbnail statis landing perlu dibuat ulang, server harus hidup dulu):
`npm run thumbs -- --base http://localhost:<port>`

## 2. Menjalankan server dev

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>.log' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

- stdout dan stderr **harus** ke dua file berbeda (PowerShell menolak kalau sama).
- Port: script `dev` = `next dev` (default **3000** bila bebas). Di lingkungan ini Next kadang
  memilih port lain otomatis — **selalu baca baris `Local:` di log** untuk tahu port aktual,
  lalu pakai URL itu untuk `register_preview` (pid = hasil `netstat -ano | grep ":<port>" | grep LISTENING`).
- **JANGAN** tambah `-p 3000` / `-ArgumentList 'run','dev','-p','3000'`: tanpa `--`, argumen
  `3000` dipakai Next sebagai *project directory* (error "Invalid project directory … meduta\\3000").
  Biarkan tanpa argumen; baca port aktual dari log.
- Kompilasi pertama lambat (filesystem ~1 dtk/benchmark): request pertama bisa 30–45 dtk
  sebelum menjawab 200 — tunggu dengan timeout panjang sebelum menyimpulkan gagal.
- Verifikasi hidup: `powershell -NoProfile -Command "Get-Process -Id <pid>"`,
  lalu `curl --max-time 120 http://localhost:<port>/` sampai 200.
