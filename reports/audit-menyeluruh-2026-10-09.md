# Audit Menyeluruh Meduta — 9 Oktober 2026

Branch: `fix/keamanan-features` · Commit audit: `e0f87b0` · Lingkup: seluruh aplikasi (typecheck, tes, lint, runtime endpoint, interaksi browser, security surface).

## Ringkasan

| Pemeriksaan | Hasil |
|---|---|
| Typecheck (`tsc --noEmit`) | ✅ Bersih (exit 0) |
| Tes (`vitest`, 3 file / 16 tes) | ✅ Semua lulus |
| 17 endpoint `/preview/[key]?frame=1` | ✅ Semua 200 |
| Endpoint publik (`/`, `/login`, `/register`, `/faq`, `/pusat-bantuan`, `/u/[slug]`) | ✅ 200 |
| Log server | ✅ Tanpa error tak-terduga (1×500 ditemukan saat audit, see Bug #2) |
| Lint | ⚠️ 4 error + 42 warning tersisa (detail di bawah) |

## Bug Ditemukan & Sudah Diperbaiki

### 🔴 Bug #1 (kritis): React hooks dipanggil kondisional di OnyxGate
- **Lokasi**: [components/templates/OnyxGate.tsx:99](components/templates/OnyxGate.tsx#L99)
- **Gejala**: `useState(titleError)` berada **setelah** `if (open) return null`. Saat tamu klik "Buka Undangan", jumlah hook berubah antar render → React melempar "Rendered more hooks than during the previous render" → **crash** tampilan undangan template Onyx (premium).
- **Perbaikan**: pindahkan `useState(titleError)` ke atas early-return, sejajar hook lain.
- **Verifikasi**: buka preview Onyx → klik "Buka Undangan" → gerbang keluar mulus, hero render penuh, `dialogCount=0`, tanpa error console.

### 🔴 Bug #2 (kritis): RSVP tamu anonim kedua me-crash halaman undangan
- **Lokasi**: [lib/actions/rsvp-visitor.ts:73](lib/actions/rsvp-visitor.ts#L73)
- **Gejala**: cabang "tamu tidak terdaftar" membuat `Guest` dengan `uniqueLink: invitation.slug`, padahal kolom `Guest.uniqueLink` **`@unique`** (prisma/schema.prisma:164). Tamu anonim **kedua** pada undangan yang sama → `Unique constraint failed on Guest_uniqueLink_key` → server action 500 → **seluruh halaman `/u/[slug]` menampilkan "A server error occurred"**. Ini berarti fitur RSVP publik rusak untuk setiap undangan setelah tamu anonim pertama — bug produksi berdampak langsung ke pengguna berbayar.
- **Perbaikan**: gunakan `buildUniqueLink(invitation.slug, guestName)` (pola sama dengan `lib/actions/guest.ts`) + fallback `update` jika tamu dengan nama sama sudah pernah RSVP.
- **Verifikasi end-to-end**: RSVP "Tamu Audit Dua" (tamu anonim kedua di undangan `wendi-tika`) → tersimpan di DB dengan `uniqueLink: "wendi-tika?to=tamu-audit-dua"`, `rsvpStatus: CONFIRMED`, halaman tidak crash. Data uji dihapus setelahnya.

## Temuan yang Diperbaiki Sekalian

- `react/no-unescaped-entities` (2 error) di [components/admin/DecorationForm.tsx:31](components/admin/DecorationForm.tsx#L31) → tanda kutip di-escape; lint turun dari 7 → 4 error.

## Temuan Tersisa (perlu keputusan/kerja lanjutan)

### 🟡 4 error lint: setState sinkron dalam effect
- [components/dashboard/MusicForm.tsx:26](components/dashboard/MusicForm.tsx#L26)
- [components/dashboard/SendInvitationForm.tsx:71](components/dashboard/SendInvitationForm.tsx#L71)
- [components/landing/TemplateSlider.tsx:29](components/landing/TemplateSlider.tsx#L29)
- [components/templates/BackgroundMusic.tsx:20](components/templates/BackgroundMusic.tsx#L20)
- Pola `useEffect(() => { setX(...) })` langsung — berisiko render berantai pada React 19. Perlu refactor ke derivasi saat-render atau `useSyncExternalStore`. Tidak diecerabut di audit ini karena menyentuh perilaku player musik & slider yang sudah stabil.

### 🟡 Tanpa rate limit pada server action publik
- `submitRsvp` & `submitWish` (`lib/actions/rsvp-visitor.ts`, `lib/actions/wish.ts`) menerima submission tanpa batas laju — rentan spam ucapan/RSVP. Rekomendasi: rate limit per-IP sederhana (mis. tabel `SubmissionWindow` atau upstream di reverse proxy VPS).

### 🟡 Lain-lain
- 42 warning `no-unused-vars` (kosmetik; beberapa di template Spotify/Vogue/Wedflix).
- RSVP di halaman `/preview/[key]` selalu gagal dengan "Undangan tidak ditemukan" karena preview memakai sample data tanpa invitationId nyata — **by design**, tapi bisa membingungkan saat demo; pertimbangkan pesan khusus mode preview.
- Tidak ada `middleware.ts` — proteksi admin mengandalkan guard per-halaman + per-action. Guard terlihat konsisten (`role !== "ADMIN" → redirect`), namun middleware membuat defensif lebih rapat.
- Audit kontras widget sebelumnya ([reports/audit-onyx-vs-purple.md](reports/audit-onyx-vs-purple.md)) **belum dieksekusi**: `RsvpForm.tsx` masih memakai kelas terang hardcoded (`text-zinc-700`, `border-zinc-300`) yang kurang kontras di kartu gelap Onyx/Purple.

## Yang Sudah Diverifikasi Baik

- Musik latar (Supabase storage, HTTP 206 streaming) berfungsi; tombol play/mute berganti state.
- Countdown hidup, Google Calendar & Maps links render di semua template yang dicek.
- Validasi RSVP Zod ("Nama minimal 2 karakter") tampil benar.
- `GET /u/wendi-tika?frame=1` 200 setelah fix; tidak ada 500 baru di log server.
- Seed DB: 17 template, komponen `spotify` terdaftar di 5 titik registrasi.
