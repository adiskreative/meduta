# Meduta — Log Progres

> Terakhir diperbarui: 03 Sep 2026, 13:52 WIB
> Branch: `feature/initial-setup`
> Server: `http://localhost:3000` (PID server perlu dijalankan ulang)

---

## Commit (urutan dari awal)

| # | Hash | Judul |
|---|------|-------|
| 1 | `417b909` | Initial commit from Create Next App |
| 2 | `2614d9e` | chore: setup project dependencies & configuration |
| 3 | `fe08115` | feat(db): tambah Prisma schema dan seed data template |
| 4 | `ca1ebe1` | feat(auth): tambah autentikasi login dan register |
| 5 | `7877671` | feat(dashboard): implementasi dashboard admin undangan |
| 6 | `d3a68f1` | feat(invitation): tambah halaman publik undangan, template, dan RSVP/ucapan |
| 7 | `2a29a80` | fix(couple): simpan data mempelai yang benar (bukan objek zod) |
| 8 | `a5b0ce8` | feat(upload): tambah upload foto mempelai ke Supabase Storage |
| 9 | `8c3504e` | docs: tambah rancangan arsitektur template dan aset desain |
| 10 | `19747e7` | feat(admin): tambah sistem role admin, guard route, dan panel admin |

---

## Tech Stack

- **Framework**: Next.js 16.3.4 (Turbopack) + React 19 + TypeScript
- **Database**: PostgreSQL (Supabase) via Prisma 7.10.0
- **Auth**: NextAuth v5 beta.32 (Credentials + Google OAuth)
- **UI**: Tailwind CSS 4, Lucide React icons, React Hook Form + Zod
- **Storage**: Supabase Storage (perlu `SUPABASE_SERVICE_ROLE_KEY` diisi)
- **Package**: `@supabase/supabase-js` (upload foto)

---

## Fitur yang Sudah Selesai

### Halaman Landing (`/`)
- Navbar, hero, fitur, section template dengan mockup ponsel + tombol "Lihat Pratinjau"
- Cara kerja, harga, CTA, footer

### Autentikasi (`/login`, `/register`)
- Login/register dengan email + password
- Google OAuth (opsional, butuh `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`)
- Password di-hash dengan bcryptjs

### Dashboard User (`/dashboard`)
- Overview (RSVP count, wish count, status undangan)
- Pilih template (`/dashboard/pilih-tema`)
- Pengaturan umum (event name, slug, custom message)
- Data mempelai (`/dashboard/mempelai`) dengan upload foto
- Informasi acara (tanggal, waktu, venue, lokasi + acara tambahan)
- RSVP / daftar tamu dengan filter status
- Ucapan & doa dengan filter visible/hidden
- Kirim undangan (generate link unik per tamu)
- Sidebar responsive dengan link "Admin Panel" untuk role admin

### Halaman Publik (`/u/[slug]`)
- Fetch undangan by slug + render template sesuai `componentKey`
- Greeting tamu dari `?to=<nama>`
- Tampil notice "belum dipublikasikan" jika status draft
- RSVP publik (form konfirmasi kehadiran)
- Daftar ucapan publik (wedding wall)
- Form kirim ucapan publik
- `generateMetadata` dinamis untuk SEO

### Template (3 desain)
- **Classic** (`/preview/classic`) — Elegant serif, background foto cover, sections penuh
- **Minimal** (`/preview/minimal`) — Clean modern, card-based sections
- **Floral** (`/preview/floral`) — Floral premium, gradient rose tones

### Pratinjau Template (`/preview/[key]`)
- Render template asli dengan data contoh (bukan thumbnail)
- Topbar sticky + tombol "Tutup" kembali ke homepage

### Upload Foto (`/dashboard/mempelai`)
- Upload ke Supabase Storage bucket `avatars`
- Validasi tipe (JPG/PNG/WebP/GIF) + ukuran (≤3MB)
- Pratinjau foto + status upload
- Butuh `SUPABASE_SERVICE_ROLE_KEY` diisi agar berfungsi

### Sistem Role Admin (`/admin`)
- `Role` enum (USER/ADMIN) di Prisma schema
- Session + JWT membawa `role`
- `/admin` guard: hanya role ADMIN yang bisa akses
- Admin shell dengan sidebar khusus (Ringkasan, Template, Aset Desain)
- Dashboard admin: ringkasan hitungan template/user/undangan
- Seed admin dari env (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)

---

## Yang Belum / Next Steps

### Langkah 2: Admin CRUD Template
- `/admin/templates` — daftar, tambah, ubah, hapus template
- Form edit: nama, thumbnail, componentKey, isPremium
- Halaman detail template

### Langkah 3: Admin Kelola Aset Desain
- `/admin/assets` — upload & kelola aset (foto, bingkai, bunga, background, musik)
- `/admin/templates/[id]/decorations` — tempatkan aset di template (posisi, ukuran, z-index)
- Schema `TemplateAsset` + `TemplateDecoration` (lihat `docs/arsitektur-template-aset.md`)

### Halaman yang Belum Dibuat
- `/dashboard/cerita-cinta` (sidebar sudah ada link, halaman belum)
- `/dashboard/galeri` (sidebar sudah ada link, halaman belum)
- `/dashboard/background-music` (sidebar sudah ada link, halaman belum)
- `/dashboard/kado-nikah` (sidebar sudah ada link, halaman belum)
- `/dashboard/transaksi` (sidebar sudah ada link, halaman belum)
- `/dashboard/notifikasi` (sidebar sudah ada link, halaman belum)
- `/dashboard/akun` (sidebar sudah ada link, halaman belum)

### Integrasi
- Pembayaran Midtrans (schema `Transaction` + `midtransId` sudah ada, env kosong)
- Import CSV/Excel tamu (tombol sudah ada tapi disabled)
- Email integration untuk kirim undangan

---

## Environment yang Perlu Diisi

```env
# Sudah terisi
DATABASE_URL=...
DIRECT_URL=...
AUTH_SECRET=...
AUTH_TRUST_HOST=true
NEXT_PUBLIC_SUPABASE_URL=...  # project Supabase biasa (xxx.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Belum terisi (perlu diisi agar fitur berfungsi)
ADMIN_EMAIL=admin@meduta.com    # untuk seed akun admin
ADMIN_PASSWORD=password123       # untuk seed akun admin
SUPABASE_SERVICE_ROLE_KEY=       # agar upload foto berfungsi
MIDTRANS_SERVER_KEY=             # untuk pembayaran
MIDTRANS_CLIENT_KEY=             # untuk pembayaran
AUTH_GOOGLE_ID=                  # untuk Google OAuth
AUTH_GOOGLE_SECRET=              # untuk Google OAuth
```

### Setelah isi ADMIN_EMAIL/ADMIN_PASSWORD di .env:
```bash
npm run db:seed
```

---

## File Structure Penting

```
app/
  admin/layout.tsx        # guard role ADMIN
  admin/page.tsx          # ringkasan admin
  dashboard/layout.tsx    # guard login + pass isAdmin
  dashboard/page.tsx      # overview
  preview/[key]/page.tsx  # pratinjau template asli
  u/[slug]/page.tsx       # halaman publik undangan
  page.tsx                # landing page

components/
  admin/AdminShell.tsx         # shell admin (sidebar + header)
  dashboard/CoupleForm.tsx     # form mempelai + upload foto
  dashboard/PhotoUploader.tsx  # upload ke Supabase
  dashboard/Sidebar.tsx        # sidebar (admin link visible untuk admin)
  landing/TemplateCard.tsx     # kartu template di landing page
  templates/
    index.tsx                  # registry componentKey → komponen
    types.ts                   # TemplateProps + InvitationView
    ClassicTemplate.tsx         # template classic
    MinimalTemplate.tsx         # template minimal
    FloralTemplate.tsx          # template floral
    WishForm.tsx                # form submit ucapan (client)
    RsvpForm.tsx                # form submit RSVP (client)
    WishList.tsx                # tampilan daftar ucapan

lib/
  auth.ts                # NextAuth config + callbacks
  prisma.ts              # Prisma client
  supabase.ts            # Supabase client helper
  invitation-data.ts     # InvitationData type + helper
  actions/
    auth.ts, couple.ts, event.ts, general.ts
    guest.ts, rsvp.ts, template.ts, wish.ts
    rsvp-visitor.ts      # RSVP publik (tanpa login)
    upload.ts            # upload avatar ke Supabase

prisma/
  schema.prisma          # DB schema (User, Invitation, Guest, Wish, Template, Transaction)
  seed.ts                # seed 3 template + akun admin
```

---

## Catatan Teknis

- **Dev server**: `npm run dev` → `http://localhost:3000`. Filesystem lambat (network drive?), kompilasi pertama ~50s, selanjutnya ~11s.
- **Build**: `npm run build` lolos. Route `/admin` sudah terdaftar.
- **Bug fixed**: `couple.ts` sebelumnya menyimpan objek zod result, sudah diperbaiki menyimpan `groom.data` / `bride.data`.
- **`.agents/`, `.claude/`, `.windsurf/`**: tidak sengaja ter-commit di commit terakhir. Bisa dihapus dari repo dengan `git rm -r --cached .agents .claude .windsurf` lalu commit.
- **Supabase Storage**: bucket `avatars` belum dibuat. Server action `uploadAvatar` akan otomatis buat bila `SUPABASE_SERVICE_ROLE_KEY` terisi.
