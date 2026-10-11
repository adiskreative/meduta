# Laporan Audit Visual: Template **Onyx** vs **Purple**

**Meduta — Undangan Digital Pernikahan**
Tanggal audit: 3 Oktober 2026 · Branch: `fix/keamanan-features`
Metode: pemeriksaan langsung di viewport ponsel **390 × 844 px** (ukuran layar ponsel standar), pengukuran metrik DOM (ukuran elemen, warna terkomputasi, font, animasi aktif) pada kedua template yang berjalan live, plus rujukan tangkapan layar halaman penuh (`public/thumbs/onyx-1790959117034.webp` 440×8494 dan `public/thumbs/purple-1790959132214.webp` 440×8554).

---

## 1. Ringkasan Eksekutif

Onyx dan Purple adalah **kembar struktural**: urutan section, tata letak, urutan konten, dan seluruh teks pengantar **identik 1:1** — dibangun dari kerangka yang sama. Perbedaan keduanya murni pada **identitas visual**:

| Aspek | **Onyx** | **Purple** |
|---|---|---|
| Tema | Hitam onyx mewah, nuansa "galeri malam" | Plum gelap romantis, nuansa "gerbang taman" |
| Latar utama | `#202020` (abu-hitam pekat) | `#240016` (plum tua) |
| Warna aksen | Fuchsia `#F50260` (70 elemen terdeteksi) | Emas `#E8B54D` (64 elemen terdeteksi) |
| Warna sekunder | Gradasi maroon gelap, putih tembus | Krem `#DAC8C0`, cokelat keunguan `#3A2230` |
| Flora khas | Buket sudut hitam-emas 4 penjuru (226 px), karangan wreath emas | Gerbang lengkung kain 327 px, buket lavender & monstera dengan efek cermin |
| Font judul gerbang | Gambar kaligrafi hasil unggahan admin | Teks "The Wedding of" script bertingkat + monogram emas 48 px |
| Total tinggi halaman (mobile) | 8.351 px | 8.596 px |

**Kesimpulan untuk klien:** keduanya layak tayang; kualitas struktur dan animasi setara. Terdapat beberapa **temuan kontras kecil yang sama di keduanya** (bagian 4) yang kami sarankan diperbaiki sebelum rilis, dan **satu perbedaan fitur** (slot gambar gerbang) yang perlu diputuskan apakah disamakan.

---

## 2. Perbandingan per Section

### 2.1 Gerbang (Halaman Pembuka)
Kedua gerbang menutupi seluruh layar (fixed, lapisan atas) dan memuat nama tamu + tombol buka.

| Elemen | Onyx | Purple |
|---|---|---|
| Latar | `#202020` polos elegan | Plum `#240016` |
| Visual utama | **4 buket sudut** `onyx-corner` selebar **58% layar (226 px)** di 4 penjuru, animasi masuk `onyxRibbonIn 1,2 dtk` lalu **goyang lembut 6,4 dtk** | **Gerbang lengkung** `purple-arch` selebar **96% (327 px)** sebagai "panggung", **bernapas 7,2 dtk** (`ppArchSway`) |
| Flora tambahan | Wreath emas **224 px** muncul `onyxWreathIn 1,1 dtk` lalu bergoyang 6,8 dtk | Buket kiri-kanan **147 px** (`ppSwayLeft 5,4 dtk` / `ppSwayRight 6,1 dtk`), lavender 82 px + monstera 148 px di bawah, **sisi kanan cermin `scaleX(-1)`** agar kiri-kanan simetris |
| Judul | **Slot gambar kaligrafi unggahan admin** (160 px, fade-up + denyut cahaya emas-fuchsia 4,5 dtk) | Teks "The / Wedding / of" Great Vibes bertingkat 13/36/14 px warna krem + **monogram "A & R" Great Vibes 48 px emas** |
| Nama tamu | "BAPAK AHMAD & IBU SITI" — Cormorant 18 px, **HURUF KAPITAL**, jarak huruf 3,2 px | "Bapak Ahmad & Ibu Siti" — Geist 18 px krem, huruf normal |
| Tombol | "Buka Undangan" **Great Vibes 24 px** di atas pelat gambar 170×56 px | "Buka Undangan" Geist 18 px, **pill solid krem** dengan glow emas lembut (denyut 3,2 dtk), lebar 234 px |

**Catatan:** gaya Onyx lebih "plakat gala", Purple lebih "pintu masuk taman". Keduanya sudah halus dan tidak saling menimpa.

### 2.2 Cover (Halaman Utama Setelah Dibuka)
Kedua cover tepat **844 px = satu layar penuh** (`min-h-[100svh]`) — komposisi tidak pernah meluber.

| Elemen | Onyx | Purple |
|---|---|---|
| Cahaya latar | Radial glow fuchsia 9% dari atas | Radial glow emas 7% dari atas |
| Partikel | ±20 butir "debu" fuchsia 2–5 px naik perlahan (`onyxDustRise`) | Kelip halus (`ppTwinkle`) |
| Flora | 4 buket sudut sama dengan gerbang (goyang 6,4 dtk) | Buket atas lembut (6,6/7,3 dtk) + lavender & monstera bawah **dengan cermin kanan** |
| Foto mempelai | **Lingkaran 192 px** + **ring emas 253 px melayang** mengelilingi foto (`onyx-ring-float`, lapisan atas) | **Potret 227×283 px** dalam bingkai lengkung (radius 38%/30%) bergaris emas 3 px |
| Nama mempelai | Tidak ditampilkan besar (hanya untuk pembaca layar) — murni foto | **"Andi dan Reni" Great Vibes 36 px putih** + eyebrow "The Wedding" emas 14 px |
| Info tanggal | "Sabtu, 12 Desember 2026 │ Jl. Sudirman No. 10" dengan pemisah fuchsia | "Sabtu, 12 Desember 2026" putih 90% |
| Petunjuk gulir | "GULIR KE BAWAH" 10 px, jarak huruf 3,5 px — **identik di keduanya** | sama |

**Catatan:** cover Onyx lebih "potret berbingkai cincin", cover Purple lebih "poster berbab". Nama besar hanya ada di Purple; bila klien ingin nama tampil di Onyx, itu penyesuaian kecil.

### 2.3 Mempelai
| Elemen | Onyx | Purple |
|---|---|---|
| Layout | Dua kartu berdampingan dipisah **garis vertikal fuchsia 3 px** bergradasi | Dua kartu berdampingan dengan garis pembatas horizontal emas tipis (96 px, digambar animasi `ppDividerDraw`) |
| Bingkai foto | 179×224 px, bentuk **quarter-ellipse** khas Onyx | 179×239 px, bentuk **lengkung atas (arch)** dengan dasar plum `#3A2230` |
| Nama | Great Vibes 30 px putih — identik di keduanya | sama |
| Orang tua & kutipan anak | Ada di kedua template | sama |

### 2.4 Hitung Mundur (Save The Date)
**Geometri identik sempurna**: 4 kartu **171×114 px, sudut 24 px**, angka serif besar + label HARI/JAM/MENIT/DETIK, nilai live (terverifikasi berjalan).

- Onyx: kartu gradasi abu `#2A2A2A→#1C1C1C`, garis fuchsia di tepi atas kartu, angka berubah fuchsia saat disentuh, tombol "Simpan Tanggal ke Google Calendar" bermaroon dengan bingkai fuchsia.
- Purple: kartu plum dengan bingkai krem 22%, aksen emas.

### 2.5 Kisah Cinta (Story)
**Identik 1:1** — garis waktu vertikal di kiri dengan **titik belah ketupat** berbingkai aksen (Onyx fuchsia / Purple emas), nomor urut 01/02, pil tanggal, kartu `ox-card`/`pp-card` (sudut 24 px, gradasi gelap, bayangan lembut). Hanya warna yang berbeda.

### 2.6 Rangkaian Acara
**Identik 1:1** — kartu Akad Nikah (ikon hati) + Resepsi (ikon pesta) selebar 358 px, dilengkapi jam, lokasi, dan tombol Google Maps.
Satu variasi kecil: **pil tanggal** pada kartu acara tambahan — Onyx memakai **gradasi fuchsia** dengan teks putih; Purple memakai **krem solid** dengan teks cokelat tua. Keduanya konsisten dengan identitas masing-masing.

### 2.7 Galeri
**Identik 1:1** — 4 foto 356×286 px, satu kolom di ponsel (2 kolom di tablet, 3 di desktop), zoom halus saat disentuh, **lightbox** klik-untuk-perbesar (Purple: bingkai emas pada lightbox; Onyx: bingkai fuchsia).

### 2.8 Amplop Digital (Kado)
Struktur sama: kartu besar sudut 36 px berisi ikon hadiah + rekening.
- Onyx: chip ikon latar fuchsia 12% + 2 kartu rekening (BRI a.n. Andi Pratama, BCA a.n. Reni Kartika) dengan bingkai fuchsia.
- Purple: chip ikon emas 12% + kartu rekening bingkai krem.
- Tombol **"Salin" identik di keduanya** — lihat temuan bersama no. 2.

### 2.9 RSVP (Konfirmasi Kehadiran)
Struktur sama: kartu sudut 36 px + judul script + form.
- Tombol utama "Saya Hadir" keduanya bergaya **neon ghost**: teks putih bercahaya (Onyx glow fuchsia 35%, Purple glow emas 35%).
- Input dan tombol sekunder memiliki **temuan kontras yang sama di keduanya** (bagian 4).

### 2.10 Papan Ucapan & Penutup
- Kartu ucapan: Onyx memakai kartu `ox-card` (bingkai fuchsia); Purple memakai kartu bingkai krem 22% + bayangan. Keduanya 2 kolom di layar lebar, avatar bulat berwarna aksen.
- Penutup: kutipan + nama mempelai + "© 2026 MEDUTA" — teks identik. Purple menambahkan strip footer terpisah 256 px dengan ruang bawah ekstra untuk tombol musik mengapung; Onyx menggabungkannya dalam satu bagian 367 px.

---

## 3. Animasi & Dekorasi

| | Onyx (14 keyframes) | Purple (15 keyframes) |
|---|---|---|
| Daftar | `onyxRibbonIn, onyxSway, onyxDecorFloat, onyxFloatY, onyxWreathIn, onyxWreathSway, onyxFadeUp, onyxShimmer, onyxNeonFlicker, onyxGlowPulse, onyxDustRise, onyxBtnGlow, onyxHeartBeat, onyxOut` | `ppArchSway, ppSwayLeft, ppSwayRight, ppSwayLeftSoft, ppSwayRightSoft, ppFloatY, ppDoveFloat, ppTwinkle, ppFadeUp, ppShimmer, ppGlow, ppBtnGlow, ppDividerDraw, ppScrollBounce, ppOut` |
| Karakter | Masuk meriah (ribbon, neon flicker), goyangan buket 6,4 dtk | Goyangan lebih ragam (5,4–7,3 dtk, varian lembut), kelip & burung merpati |
| Aksesibilitas | ✅ `prefers-reduced-motion` dihormati (sway, ring, wreath dimatikan) | ✅ dihormati (sway, arch, twinkle dimatikan) |

Kedua template menghormati preferensi "kurangi gerakan" pengguna — baik untuk aksesibilitas.

---

## 4. Temuan Bersama (perlu perbaikan kecil)

Temuan berikut berlaku **sama di Onyx dan Purple** karena berasal dari komponen fitur yang dipakai bersama:

1. **Label form RSVP abu gelap di latar gelap** — teks "Nama Anda" / "Jumlah Tamu" memakai warna `zinc-700` bawaan sehingga nyaris tak terbaca di kartu gelap kedua template. *(Sumber: teks label hardcoded di `RsvpForm`.)*
2. **Teks input RSVP gelap di atas latar gelap** — kolom isian dirender transparan-gelap dengan warna teks `zinc-900`; tulisan tamu saat mengetik sulit terlihat. Bingkai kolom (putih 15%) sudah benar. *(Benturan urutan CSS antara kelas bawaan dan kelas tema.)*
3. **Tombol "Tidak Bisa Hadir"** memakai bingkai + teks abu terang bawaan — di latar gelap teksnya kurang kontras.
4. **Tombol "Salin"** pada kartu rekening memakai tema abu untuk latar terang — kurang terlihat di kartu gelap kedua template. *(Komponen `CopyButton` belum punya opsi penyesuaian warna.)*
5. **Perbedaan fitur gerbang**: Onyx mendukung **unggahan gambar judul gerbang** (kaligrafi kustom per pelanggan); Purple menampilkan judul teks statis. Perlu keputusan: samakan kemampuan Purple, atau dokumentasikan sebagai perbedaan paket.

**Tingkat dampak:** semua temuan di atas adalah isyarat visual (affordance) dan keterbacaan form — tidak memengaruhi fungsi (form tetap terkirim, tombol tetap bekerja).

---

## 5. Rekomendasi

1. **Prioritas tinggi** — perbaiki kontras 4 poin di bagian 4 (kirim properti tema dari Onyx/Purple ke `RsvpForm`/`CopyButton`, dan bereskan benturan kelas input). Estimasi kecil, dampak langsung terasa oleh tamu.
2. **Prioritas sedang** — putuskan paritas fitur gerbang (slot gambar judul di Purple), agar kapabilitas kedua template setara saat klien memilih.
3. **Opsional** — jika ingin identitas makin khas: tampilkan nama mempelai besar di cover Onyx (saat ini hanya Purple), atau tambahkan pil tanggal krem→gradasi emas di Purple agar konsisten dengan Onyx yang bergradasi.
4. Setelah perbaikan, **regenerasi thumbnail** kedua template agar pratinjau landing ikut terbarui.

---

## Lampiran — Rujukan Visual
- Tangkapan penuh Onyx: `public/thumbs/onyx-1790959117034.webp` (440×8494)
- Tangkapan penuh Purple: `public/thumbs/purple-1790959132214.webp` (440×8554)
- Data contoh yang dipakai: mempelai Andi & Reni, akad 12 Desember 2026, tamu "Bapak Ahmad & Ibu Siti"
