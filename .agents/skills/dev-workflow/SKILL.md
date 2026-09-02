---
name: dev-workflow
description: >-
  Panduan gaya coding pribadi dan alur kerja git/deploy yang konsisten,
  berlaku untuk SEMUA project apapun bahasa atau frameworknya (Laravel,
  Next.js, PHP polos, Node, Python, dst). Gunakan skill ini setiap kali
  membantu user menulis atau mengedit kode, membuat commit, membuat branch,
  membuat pull request, menyiapkan deployment, atau mengatur environment
  variable — bahkan jika user tidak menyebut kata "skill" atau "workflow"
  secara eksplisit. Selalu cek panduan ini dulu sebelum menulis kode atau
  menjalankan perintah git/deploy, supaya hasilnya konsisten dengan gaya
  kerja user di semua project mereka.
---

# Alur Kerja Coding Pribadi

Panduan umum ini berlaku di semua project user, apapun bahasa atau framework-nya. Tujuannya: kode rapi dan konsisten, riwayat git jelas dan mudah ditelusuri, serta proses deploy yang aman dan tidak bikin kejutan.

## 1. Gaya Coding

**Penamaan**
- Nama variabel, fungsi, dan file harus deskriptif — hindari singkatan ambigu (`data1`, `tmp`, `x`) kecuali untuk variabel loop pendek yang jelas konteksnya.
- Konsisten dengan konvensi bahasa yang dipakai (mis. `camelCase` di JS/TS, `snake_case` di Python/PHP prosedural, `PascalCase` untuk class/komponen) — jangan campur gaya penamaan dalam satu file.
- Nama fungsi memakai kata kerja yang menjelaskan aksinya (`getUserById`, bukan `user2`).

**Struktur & keterbacaan**
- Fungsi sebaiknya melakukan satu hal saja; kalau fungsi mulai panjang dan menangani banyak tanggung jawab, pecah jadi fungsi-fungsi kecil.
- Hindari nesting kondisi yang dalam — gunakan early return untuk memangkas level indentasi.
- Komentar dipakai untuk menjelaskan **kenapa** (alasan/keputusan desain), bukan **apa** (yang sudah jelas dari kode itu sendiri).
- Ikuti struktur folder/konvensi yang sudah ada di project (jangan bikin pola baru di tengah project yang sudah punya pola sendiri) kecuali user memang minta refactor struktur.

**Penanganan error & keamanan**
- Selalu validasi input dari luar (form, query param, request body) sebelum diproses.
- Jangan biarkan error di-silent (`catch` kosong) — minimal log, idealnya beri pesan yang bisa ditindaklanjuti.
- Jangan pernah hardcode secret, API key, password, atau connection string langsung di kode — selalu lewat environment variable (lihat bagian Environment Variable di bawah).
- Pastikan pesan error yang ditampilkan ke user tidak membocorkan detail sensitif (stack trace, struktur database, dll) di lingkungan production.

## 2. Workflow Git

**Branch**
- Branch utama (`main`/`master`) selalu dalam kondisi bisa di-deploy — jangan commit langsung ke situ untuk perubahan besar.
- Buat branch baru per fitur/perbaikan dengan format `<tipe>/<deskripsi-singkat>`, misalnya:
  - `feature/checkout-midtrans`
  - `fix/koneksi-database-timeout`
  - `chore/update-dependency`

**Commit**
- Pakai format **Conventional Commits**: `<tipe>(<scope opsional>): <pesan singkat>`
  - Tipe umum: `feat` (fitur baru), `fix` (perbaikan bug), `refactor`, `chore`, `docs`, `style`, `test`.
  - Contoh: `feat(auth): tambah login via Google`, `fix(db): perbaiki koneksi pooler Supabase`.
- Satu commit = satu perubahan logis yang jelas. Hindari commit raksasa yang menggabungkan banyak hal tak berhubungan.
- Pesan commit ditulis dalam bentuk perintah/present tense ("tambah", "perbaiki"), bukan past tense ("menambahkan", "telah diperbaiki").
- Sebelum commit, cek dulu `git status` dan `git diff` supaya tidak ikut ter-commit file yang tidak seharusnya (file `.env`, folder `node_modules`, file build, dll — pastikan sudah ada di `.gitignore`).

**Pull Request / merge**
- Judul PR ringkas dan jelas menyebutkan apa yang berubah; deskripsi mencantumkan konteks singkat kenapa perubahan ini dibuat dan cara mengetesnya kalau relevan.
- Sebelum merge ke branch utama, pastikan tidak ada konflik dan (kalau project punya test) test-nya lolos.

## 3. Workflow Deploy

**Sebelum deploy**
- Cek semua environment variable yang dibutuhkan sudah ada di hosting/server, dan **nilainya beda dari yang dipakai di lokal** untuk hal-hal sensitif (secret key production ≠ development).
- Jalankan proses build/compile sesuai project (`npm run build`, dsb) dan pastikan tidak ada error sebelum push ke server.
- Kalau ada migrasi database, jalankan migrasi dulu di lingkungan yang aman (staging kalau ada) sebelum ke production, dan pastikan ada rencana rollback kalau migrasi gagal.

**Environment variable**
- File `.env` (atau sejenisnya) **tidak pernah** di-commit ke git — selalu tambahkan ke `.gitignore` sejak awal project.
- Simpan template kosong (`.env.example`) di repo supaya kolaborator/masa depan tahu variable apa saja yang dibutuhkan, tanpa membocorkan nilai aslinya.
- Saat menambahkan `.env` manual di hosting, dobel-cek tidak ada spasi/tanda kutip nyasar dan formatnya sesuai yang dibaca framework.

**Setelah deploy**
- Cek log aplikasi setelah deploy untuk memastikan tidak ada error yang langsung muncul (koneksi database gagal, environment variable belum ke-set, dll).
- Kalau memungkinkan, tes alur inti aplikasi secara manual sekali (login, halaman utama, fitur yang baru diubah) sebelum menganggap deploy selesai.

## Cara pakai panduan ini saat membantu user

- Saat menulis kode baru: ikuti aturan penamaan, struktur, dan error handling di atas secara default, tanpa perlu diminta ulang.
- Saat diminta bikin commit message: pakai format Conventional Commits di atas.
- Saat diminta bikin branch: pakai format `<tipe>/<deskripsi-singkat>`.
- Saat membantu proses deploy: selalu ingatkan soal environment variable dan cek sebelum/sesudah deploy di atas, walau user tidak menyebutnya secara eksplisit.
