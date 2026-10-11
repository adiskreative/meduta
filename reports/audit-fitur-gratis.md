# Audit Fitur Gratis vs implementasi — 10 Oktober 2026

Konteks: kartu harga "Gratis" (landing, `app/page.tsx`) memuat 8 klaim. Diperiksa satu per satu terhadap kode & DB.

## Tabel kesesuaian

| Klaim di kartu | Implementasi | Status |
|---|---|---|
| "undangan pernikahan terbatas" | `useTemplate` (lib/actions/template.ts) hanya mengupdate/membuat **satu** invitation per user (`findFirst` → update, tanpa create saat sudah ada) | ✅ Berjalan |
| "Masa aktif 1 bulan" | **Tidak ada** kolom expiry pada `Invitation` dan tidak ada pekerja penonaktifan (`expires/masaAktif` tidak ditemukan di lib/) | ❌ **Tidak dievaluasi — undangan gratis aktif selamanya** |
| "Upload 5 Gambar" | `uploadImage` (lib/actions/upload.ts) tidak memeriksa jumlah file; `GalleryUploader` tanpa limit; galeri di data JSON tidak dihitung | ❌ **Tidak dievaluasi — upload tak terbatas** |
| "Bebas Ganti Background & Musik Latar" | `BackgroundForm`, `MusicForm`, upload background & musik tersedia untuk semua user | ✅ Berjalan |
| "Template dasar" | Gate pilih-tema baru selesai: 3 template gratis (classic/minimal/floral) terbuka; 14 premium terkunci untuk akun gratis | ✅ Berjalan (baru hari ini) |
| "RSVP & wedding wall" | `submitRsvp`/`submitWish` publik berfungsi (audit sebelumnya: tersimpan ke DB) | ✅ Berjalan |
| "Link undangan pribadi" | Slug unik per undangan (`/u/[slug]`), kapabilitas ganti slug 3x | ✅ Berjalan |
| "Fitur Terbatas" | Klaim umum; konsisten dengan 3 item di atas yang belum dipbatasi | ⚠️ Sebagian |
| "Watermark Meduta" | Semua template menampilkan `© {tahun} MEDUTA`/ "Dibuat dengan Meduta" di footer **tanpa syarat premium** — premium juga masih menampilkannya | ⚠️ Watermark tampil, tapi "Hapus watermark" (fitur premium) **belum dievaluasi** |

## Ringkasan temuan

**Berjalan baik (5/8):** pembatasan 1 undangan, background & musik, template dasar (gate premium baru), RSVP/wedding wall, link pribadi.

**Tidak dievaluasi / menyimpang (2/8, krusial):**
1. **"Masa aktif 1 bulan"** — tidak ada mekanisme expiry. Undangan gratis seumur hidup. Pilih: (a) tambah kolom `expiresAt` + cek di `/u/[slug]` + penonaktifan, atau (b) revise teks jadi "Masa aktif terbatas".
2. **"Upload 5 Gambar"** — tidak ada hitungan/pembatasan. Pilih: (a) enforce max 5 foto galeri untuk akun gratis (hitung field `gallery` di invitation.data), atau (b) revise teks.

**Janggal kecil (1/8):**
3. **Watermark** tampil di semua template termasuk premium — klaim "Hapus watermark Meduta" di paket Premium belum dievaluasi (tak ada kondisi `isPremium` di footer template).

## Rekomendasi urutan kerja
1. Enforce limit 5 upload galeri (paling murah, cukup hitung di `GalleryForm`/action).
2. Tambah `expiresAt` Invitation + middleware cek di `/u/[slug]` (butuh migrasi kecil).
3. Sinkronkan footer template: sembunyikan `MEDUTA` bila premium, tampil bila gratis.
4. Revise teks harga bila ada klaim yang tidak ingin dievaluasi.
