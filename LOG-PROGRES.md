# Meduta — Log Progres

> Terakhir diperbarui: 03 Sep 2026
> Branch: `feature/initial-setup`
> Server: `http://localhost:3000` (PID server perlu dijalankan ulang)

> Status: Langkah 2 & 3 admin (CRUD template, aset, dekorasi) + renderer dekorasi & seed aset contoh sudah dikerjakan (belum di-commit per update terakhir).

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

> **CATATAN**: Commit `19747e7` sebelumnya tercatat sebagai #10, tapi log aktual menunjukkan urutan commit menyusul setelah `8da2aba` (docs: log progres). Karena LOG ini diedit sendiri, urutan #11 dst mengikuti commit terakhir yang terverifikasi di `git log`. Fitur **Admin CRUD Template** (commit #11) **belum di-commit** per update terakhir.

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

### Admin CRUD Template (`/admin/templates`)
- List semua template (dengan thumbnail, badge premium, jumlah undangan pemakai)
- Tambah template baru (`/admin/templates/new`)
- Edit template (`/admin/templates/[id]`) — nama, thumbnail, componentKey, isPremium
- Hapus template (dengan konfirmasi; diblokir bila masih dipakai undangan)
- Validasi Zod: nama ≥3, thumbnail URL valid & wajib, componentKey unik + format `a-z0-9-`
- Server action `admin-template.ts` dengan guard role ADMIN sendiri

### Admin Kelola Aset Desain (`/admin/assets`)
- Model `TemplateAsset` + enum `AssetType` (IMAGE/FRAME/DECOR/BACKGROUND/MUSIC/GALLERY)
- Upload file ke Supabase Storage bucket `templates` (10MB; gambar atau musik), otomatis buat bucket bila service key terisi
- Tambah aset dari URL eksternal (+ optional thumbnail)
- Hapus aset (diblokir bila masih dipakai dekorasi)
- Ringkasan jumlah aset per tipe
- Server action `admin-asset.ts` dengan guard role ADMIN sendiri

### Admin Dekorasi Template (`/admin/templates/[id]/decorations`)
- Model `TemplateDecoration` — penempatan aset pada sebuah template
- Pilih aset + set `placement` (floating/cover/section), `layer` (decor/frame), `zIndex`, rotasi, `position` (x,y), `size` (width,height)
- Daftar dekorasi terpasang (thumbnail + detail posisi) & hapus
- Tombol "Dekorasi" di list template + hitungan dekorasi per template
- Server action `admin-decoration.ts` dengan guard role ADMIN sendiri

### Renderer Dekorasi (langkah 5 arsitektur)
- `DecorationLayer` — melapisi aset dekorasi (posisi/size/zIndex/rotasi, pointer-events-none) di atas konten
- `TemplateRenderer` membungkus komponen + `DecorationLayer`
- `TemplateProps.decorations?: Decoration[]` + helper `mapDecorations` di `lib/decoration.ts`
- Halaman publik `/u/[slug]` & preview `/preview/[key]` mengambil dekorasi template (beserta aset) dan meneruskannya

### Seed Aset Contoh (langkah 7)
- `seedAssets()` di `prisma/seed.ts` — 2 aset contoh (DECOR bungga, FRAME bingkai) + 1 dekorasi di template floral
- Idempotent (hanya dibuat bila nama aset belum ada)

---

## Yang Belum / Next Steps

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
  admin/assets/page.tsx   # kelola aset desain
  admin/templates/page.tsx        # daftar template (CRUD)
  admin/templates/new/page.tsx     # tambah template
  admin/templates/[id]/page.tsx    # edit template
  admin/templates/[id]/decorations/page.tsx # tempatkan aset di template
  dashboard/layout.tsx    # guard login + pass isAdmin
  dashboard/page.tsx      # overview
  preview/[key]/page.tsx  # pratinjau template asli
  u/[slug]/page.tsx       # halaman publik undangan
  page.tsx                # landing page

components/
  admin/AdminShell.tsx         # shell admin (sidebar + header)
  admin/TemplateForm.tsx       # form create/edit template (client)
  admin/DeleteTemplateButton.tsx # tombol hapus template + konfirmasi
  admin/AssetForm.tsx          # form tambah aset (upload / URL)
  admin/DecorationForm.tsx     # form tambah dekorasi
  admin/DeleteButton.tsx       # tombol hapus generik + konfirmasi
  dashboard/CoupleForm.tsx     # form mempelai + upload foto
  dashboard/PhotoUploader.tsx  # upload ke Supabase
  dashboard/Sidebar.tsx        # sidebar (admin link visible untuk admin)
  landing/TemplateCard.tsx     # kartu template di landing page
  templates/
    index.tsx                  # registry componentKey → komponen (+ DecorationLayer)
    types.ts                   # TemplateProps + InvitationView + Decoration
    DecorationLayer.tsx        # lapisan aset dekorasi (posisi/z/rotasi)
    ClassicTemplate.tsx         # template classic
    MinimalTemplate.tsx         # template minimal
    FloralTemplate.tsx          # template floral
    WishForm.tsx                # form submit ucapan (client)
    RsvpForm.tsx                # form submit RSVP (client)
    WishList.tsx                # tampilan daftar ucapan

  lib/
  auth.ts                # NextAuth config + callbacks
  prisma.ts              # Prisma client
  supabase.ts            # Supabase client helper (+ bucket templates)
  invitation-data.ts     # InvitationData type + helper
  decoration.ts          # mapDecorations → Decoration[]
  actions/
    auth.ts, couple.ts, event.ts, general.ts
    guest.ts, rsvp.ts, template.ts, wish.ts
    rsvp-visitor.ts      # RSVP publik (tanpa login)
    upload.ts            # upload avatar ke Supabase
    admin-template.ts    # CRUD template (guard ADMIN)
    admin-asset.ts       # CRUD aset desain (guard ADMIN)
    admin-decoration.ts  # CRUD dekorasi template (guard ADMIN)

prisma/
  schema.prisma          # DB schema (+ TemplateAsset, TemplateDecoration, AssetType)
  seed.ts                # seed 3 template + aset/dekorasi contoh + akun admin
```

---

## Catatan Teknis

- **Dev server**: `npm run dev` → `http://localhost:3000`. Filesystem lambat (network drive?), kompilasi pertama ~50s, selanjutnya ~11s.
- **Build**: `npm run build` lolos. Route `/admin/templates`, `/admin/templates/new`, `/admin/templates/[id]`, `/admin/templates/[id]/decorations`, dan `/admin/assets` sudah terdaftar.
- **Schema**: `TemplateAsset`, `TemplateDecoration`, dan enum `AssetType` ditambahkan; DB di-sync via `prisma db push` (PostgreSQL Supabase).
- **Bug fixed**: `couple.ts` sebelumnya menyimpan objek zod result, sudah diperbaiki menyimpan `groom.data` / `bride.data`.
- **`.agents/`, `.claude/`, `.windsurf/`**: tidak sengaja ter-commit di commit terakhir. Bisa dihapus dari repo dengan `git rm -r --cached .agents .claude .windsurf` lalu commit.
- **Supabase Storage**: bucket `avatars` (foto mempelai) & `templates` (aset desain) — belum dibuat manual. Server action `uploadAvatar` / `createAssetFromUpload` otomatis buat bucket bila `SUPABASE_SERVICE_ROLE_KEY` terisi.
