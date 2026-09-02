# Rancangan Arsitektur — Template & Aset Desain Berbasis Peran

> Status: **Rancangan (belum diimplementasikan)**
> Tujuan dokumen ini: menyepakati arah sebelum menulis kode, supaya pengembangan
> template + aset desain konsisten dan tidak asal ngoding.

## 1. Visi

- **ADMIN** membuat dan mengelola template yang menarik: menyusun *aset desain*
  (bingkai, bunga/dekor, background default, galeri stok, musik) dan menentukan
  posisi/penampilannya.
- **USER (mempelai)** hanya memilih template lalu mengisi *konten* undangannya
  (nama, foto, background pribadi, galeri pribadi). User **tidak** menyentuh
  aset desain milik admin (bingkai, bunga, dekorasi).

Inti aturan:
> Admin mengelola **desain & aset**. User mengelola **konten**. Template =
> desain tetap + konten yang bisa diisi.

## 2. Dua lapisan data

### 2.1 Template (desain — dikelola admin)
Satu baris `Template` menggambarkan satu desain siap pakai:
- identitas (name, thumbnail)
- `componentKey` → komponen React yang me-render desain
- `isPremium`
- **ref aset desain** yang dipakai (bunga, bingkai, background default, dst)

### 2.2 Invitation (konten — dikelola user)
Satu baris `Invitation` = hasil akhir seorang user memakai sebuah template:
- memilih `templateId`
- mengisi konten ke kolom `data` (Json): nama, foto, background pribadi,
  galeri pribadi, cerita, acara, ucapan, dst
- **tidak** menyimpan posisi bunga/bingkai — yang dipakai dari template

## 3. Skema database

### 3.1 Peran (role)
Tambahkan field `role` di `User`:

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  // ...field existing...
  role  Role  @default(USER)
  // relasi aset & template yang dibuat admin
  assets      TemplateAsset[]
  createdTemplates Template[]
}
```

- Seed admin default dibuat lewat `prisma/seed.ts` (baca dari env, mis. `ADMIN_EMAIL`).
- Route `/admin/**` di-guard: hanya pemilik role `ADMIN` yang boleh masuk.

### 3.2 Aset desain (administred)
Aset = foto/URL + metadata penempatan. Satu `TemplateAsset` mewakili satu aset.
Karena penempatan aset berbeda per template, dipisah jadi dua hal:
- **Asset** (sumber file/URL)
- **TemplateDecoration** (cara menempatkan asset di sebuah template)

```prisma
model TemplateAsset {
  id        String   @id @default(cuid())
  adminId   String
  admin     User     @relation(fields: [adminId], references: [id])
  type      AssetType // IMAGE | FRAME | DECOR | BACKGROUND | MUSIC | GALLERY
  name      String
  url       String   // URL file/Upload (mis. Supabase Storage)
  thumbnail String?
  meta      Json?    // warna, bentuk, dsb opsional
  createdAt DateTime @default(now())

  decorations TemplateDecoration[]
  @@index([type])
}

enum AssetType {
  IMAGE
  FRAME
  DECOR      // bunga, ornamen
  BACKGROUND
  MUSIC
  GALLERY    // stok foto admin
}

// Penempatan aset di sebuah template (posisi, ukuran, order lapisan)
model TemplateDecoration {
  id         String @id @default(cuid())
  templateId String
  template   Template @relation(fields: [templateId], references: [id])
  assetId    String
  asset      TemplateAsset @relation(fields: [assetId], references: [id])

  // posisi dekorasi di halaman undangan
  placement String @default("floating") // cover | section | floating
  position  Json?   // { x, y } atau { top/left } relatif
  size      Json?   // { width, height } 
  zIndex    Int     @default(1)
  layer     String  @default("decor") // decor | frame
  rotated   Float?  // rotasi derajat

  @@index([templateId])
  @@index([assetId])
}
```

`Template` diperluas untuk menautkan dekorasi:

```prisma
model Template {
  // ...field existing (id, name, thumbnailUrl, componentKey, isPremium)
  createdBy     String?
  creator       User?       @relation(fields: [createdBy], references: [id])
  assets        TemplateAsset[]  // (opsional: aset yang direferensikan langsung)
  decorations   TemplateDecoration[]
}
```

> Catatan: relasi `TemplateAsset` di atas bisa dibaca sebagian "milik siapa".
> Untuk fleksibilitas, admin pertama (pemilik) disimpan di `adminId`; aset yang
> dipakai bareng antar template bisa memakai tabel pivot `TemplateDecoration`
> tanpa perlu duplikasi file.

## 4. Alur kerja

### 4.1 ADMIN membuat template
1. Login sebagai role `ADMIN`.
2. `/admin/templates` → buat template baru: isi nama, `componentKey`, pasang
   thumbnail.
3. `/admin/templates/[id]/decorations` → unggah/pilih aset (bunga, bingkai,
   background) dan atur posisinya (mis. bingkai di kiri-kanan, bunga di pojok).
4. Simpan → data `Template` + `TemplateDecoration` + `TemplateAsset`.
5. Landing page menarik data `Template` (berikut dekorasi) → thumbnail tampil.
   Dashboard user menampilkan pilihan template.

### 4.2 USER membuat undangan dari template
1. `/dashboard/pilih-tema` → pilih template.
2. `/dashboard/mempelai`, `/informasi-acara`, `/pengaturan-umum`, dst.
3. User **hanya** mengisi konten. Aset dekorasi (bunga/bingkai) **diambil dari
   template**, tidak bisa diubah user.
4. Template tetap punya slot konten untuk background & galeri **pribadi** user.

### 4.3 Render halaman publik / preview
- `/u/[slug]` → muat `Template` + `TemplateDecoration` + asetnya.
- `TemplateRenderer` memilih komponen via `componentKey`, lalu mengirim data
  konten (`Invitation.data`) + daftar dekorasi (`decorations`).
- Komponen template me-render konten user, lalu **melapisi** aset dekorasi
  (bunga, bingkai) sesuai posisi yang disimpan di `TemplateDecoration`.
- `/preview/[key]` memakai data contoh + dekorasi template.

## 5. Batasan tegas (penting)

| Hal | Admin | User |
|-----|-------|------|
| Bikin template / pilih komponen React | ✅ | ❌ |
| Unggah & atur aset desain (bunga, bingkai, dekor) | ✅ | ❌ |
| Ganti nama, foto mempelai | ❌ (bukan undangan) | ✅ (di undangannya) |
| Ganti background & galeri **pribadi** | ❌ | ✅ (slot di undanganya) |
| Ganti posisi bingkai/bunga | ✅ | ❌ |

> Komponen React baru (layout berbeda) **tetap ditulis admin/developer** dan
> didaftarkan di `components/templates/index.tsx`. Panel admin tidak menulis
> kode React; panel mengelola **data aset & dekorasi** yang dirender komponen.

## 6. Langkah implementasi (urutan kerja)

1. **Role** — tambah enum `Role`, field `role` di `User`, seed akun admin,
   guard route `/admin/**`, header/link menu dashboard menyesuaikan role.
2. **Upload aset** — pakai `lib/actions/upload.ts` (sudah ada) diperluas untuk
   jenis aset selain avatar (bucket terpisah per tipe bila perlu).
3. **Panel /admin/templates** — CRUD template + list aset.
4. **Panel /admin/templates/[id]/decorations** — pilih/unggah aset + atur posisi.
5. **Renderer dekorasi** — komponen dekorasi umum yang menempel asset sesuai
   `TemplateDecoration` (posisi/z/layer) di atas konten undangan.
6. **Dashboard user** — pastikan user hanya mengisi konten, dekorasi ikut dari
   template terpilih.
7. **Seed aset & template contoh** — supaya landing & preview langsung tampil.

## 7. Keuntungan pola ini

- Desain template bisa **kaya & beda-beda** tanpa user perlu desain sendiri.
- Panel admin menjadi pusat kurasi aset → makin menarik landing page.
- Batas hak akses jelas → tidak ada konflik "user merusak desain template".
- Upload aset memakai Supabase Storage yang sudah disiapkan.

## 8. Catatan teknis

- **Upload**: gunakan Supabase Storage (bucket `templates` untuk aset, `avatars`
  untuk foto mempelai). Butuh `SUPABASE_SERVICE_ROLE_KEY` diisi agar server
  action upload andal.
- **Server Component vs Client**: halaman publik/preview tetap Server Component
  (fetch DB). Interaksi (pilih/upload aset) di panel admin pakai Client Component
  + server action, konsisten dengan pola yang sudah ada di dashboard.
- **Registrasi template**: daftar `componentKey` tetap file `index.tsx`;
  dashboard/landing hanya boleh menawarkan `componentKey` yang terdaftar.
