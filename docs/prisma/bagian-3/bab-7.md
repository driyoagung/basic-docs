---
title: "Bab 7 — Prisma Migrate: Dasar"
---

Bayangkan kamu bekerja di tim dengan 5 developer. Tanpa sistem migrasi, perubahan database hanya ada di laptop masing-masing — tidak ada yang tahu kolom apa yang sudah ditambahkan, tabel apa yang diubah, atau index apa yang baru dipasang. Prisma Migrate menyelesaikan masalah ini dengan memperlakukan perubahan database **seperti kode** — bisa di-version control, di-review, dan di-deploy secara konsisten.

---

## 🤔 7.1 Mengapa Migration Itu Penting?

```
TANPA MIGRATION — Kekacauan yang Biasa Terjadi:
────────────────────────────────────────────────────────────────
Developer A: "Eh, aku tadi tambah kolom 'stok_minimum' di tabel produk ya"
Developer B: "Oh... aku tidak tahu. Kenapa aplikasiku error terus?"
Developer C: "Staging server kita ketinggalan 3 perubahan database"
Tech Lead:   "Database production dan development sudah tidak sinkron lagi!"

Masalah:
❌ Tidak ada catatan perubahan apa saja yang dilakukan
❌ Tidak ada urutan — perubahan mana yang harus diterapkan duluan
❌ Tidak bisa rollback jika ada yang salah
❌ Setiap environment (dev, staging, prod) bisa berbeda strukturnya
❌ Tidak bisa direview sebelum diterapkan ke production


DENGAN MIGRATION — Terstruktur dan Aman:
────────────────────────────────────────────────────────────────
✅ Setiap perubahan tercatat sebagai file SQL di folder migrations/
✅ File migration di-commit ke Git — semua developer dapat update yang sama
✅ Urutan migration terjaga — selalu diterapkan dari yang paling lama
✅ Database di semua environment bisa disinkronkan dengan satu perintah
✅ Bisa review perubahan SQL sebelum diterapkan ke production
✅ History lengkap — tahu kapan dan perubahan apa yang dibuat
```

---

## 🔄 7.2 `db push` vs `migrate dev` — Pilih Yang Tepat

Ini adalah kebingungan paling umum bagi yang baru belajar Prisma. Keduanya mengubah struktur database, tapi dengan cara yang sangat berbeda:

```
npx prisma db push
─────────────────────────────────────────────────────────────────
Cara kerja:
  Schema.prisma → [Prisma analisa perbedaan] → Database (langsung!)
                                                 ↑ Tidak ada file migration!

✅ Kapan pakai:
   • Prototyping awal — schema masih sering berubah-ubah
   • Eksperimen — coba-coba struktur database
   • Project solo kecil yang tidak perlu history
   • Tutorial / belajar (seperti saat kita mulai Bab 2)

❌ Kapan JANGAN pakai:
   • Project tim — tidak ada yang bisa di-review atau di-share
   • Staging / Production — tidak ada cara untuk track apa yang berubah
   • Saat sudah ada data — bisa merusak data yang ada!

─────────────────────────────────────────────────────────────────

npx prisma migrate dev
─────────────────────────────────────────────────────────────────
Cara kerja:
  Schema.prisma → [Prisma analisa perbedaan] → File migration.sql
                                                       ↓
                                               Dijalankan ke database
                                                       ↓
                                               History tersimpan di DB

✅ Kapan pakai:
   • Semua project yang serius — dari kecil hingga besar
   • Project tim — migration di-commit ke Git, semua dapat update
   • Saat ada data yang harus dijaga
   • Sebelum deploy ke staging / production

✅ Keuntungan tambahan:
   • Otomatis generate Prisma Client setelah migrate
   • Otomatis jalankan seed jika dikonfigurasi
   • Bisa review SQL yang akan dijalankan sebelum apply
```

> 📌 **Rekomendasi:** Mulai dengan `db push` saat prototyping schema di awal project. Begitu schema mulai stabil dan ada data yang perlu dijaga, **switch ke `migrate dev`** dan jangan kembali ke `db push` lagi.

---

## 📁 7.3 Anatomi File Migration

```bash
# Jalankan migration pertama
npx prisma migrate dev --name init

# Yang terjadi di balik layar:
# 1. Prisma membandingkan schema.prisma dengan state database saat ini
# 2. Generate SQL berdasarkan perbedaan yang ditemukan
# 3. Simpan SQL di prisma/migrations/[timestamp]_[name]/migration.sql
# 4. Jalankan SQL ke database
# 5. Catat migration ini di tabel _prisma_migrations
# 6. Jalankan prisma generate (update Prisma Client)
```

```
prisma/
└── migrations/
    │
    ├── 20240101120000_init/              ← Timestamp + nama migration
    │   └── migration.sql                ← SQL yang di-generate Prisma
    │
    ├── 20240115093045_tambah_produk/
    │   └── migration.sql
    │
    ├── 20240120141523_tambah_relasi_tag/
    │   └── migration.sql
    │
    ├── 20240201083012_tambah_soft_delete/
    │   └── migration.sql
    │
    └── migration_lock.toml              ← Lock file — JANGAN edit manual!
```

```sql
-- Contoh isi migration.sql yang di-generate Prisma
-- prisma/migrations/20240101120000_init/migration.sql

-- CreateTable (Prisma menambahkan komentar ini untuk keterbacaan)
CREATE TABLE `pengguna` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MANAJER', 'EDITOR', 'PEMBELI') NOT NULL DEFAULT 'PEMBELI',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pengguna_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `harga` DECIMAL(12, 2) NOT NULL,
    `stok` INTEGER NOT NULL DEFAULT 0,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `kategori_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `produk_slug_key`(`slug`),
    INDEX `produk_kategori_id_idx`(`kategori_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `produk`
  ADD CONSTRAINT `produk_kategori_id_fkey`
  FOREIGN KEY (`kategori_id`)
  REFERENCES `kategori`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## 🔄 7.4 Alur Kerja Migration Sehari-hari

```
WORKFLOW DEVELOPMENT HARIAN:
──────────────────────────────────────────────────────────────
                    ┌─────────────────┐
                    │  Edit schema    │  ← Tambah model baru,
                    │  .prisma        │    tambah field, ubah relasi
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ npx prisma      │  ← Buat + jalankan migration
                    │ migrate dev     │    "nama yang deskriptif"
                    │ --name "..."    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     File migration    Jalankan SQL    Generate
     dibuat di         ke database     Prisma Client
     migrations/                       (tipe terupdate)
              │
              ▼
     ┌─────────────────┐
     │  git add .      │  ← Commit file migration bersama
     │  git commit     │    perubahan kode lainnya
     └────────┬────────┘
              │
              ▼
     ┌─────────────────┐
     │  git push       │  ← Push ke repository
     └────────┬────────┘
              │
              ▼
     Developer lain:
     ┌─────────────────┐
     │  git pull       │  ← Dapat file migration baru
     └────────┬────────┘
              │
              ▼
     ┌─────────────────┐
     │ npx prisma      │  ← Migration otomatis dijalankan
     │ migrate dev     │    database mereka ikut terupdate
     └─────────────────┘
```

---

## 📝 7.5 Penamaan Migration yang Baik

Nama migration yang deskriptif sangat membantu saat review history. Gunakan nama yang menjelaskan **apa yang berubah**, bukan **mengapa berubah**:

```bash
# ✅ NAMA YANG BAIK — Deskriptif dan jelas
npx prisma migrate dev --name "init"
npx prisma migrate dev --name "tambah_tabel_produk"
npx prisma migrate dev --name "tambah_field_deskripsi_ke_kategori"
npx prisma migrate dev --name "tambah_relasi_pengguna_pesanan"
npx prisma migrate dev --name "tambah_index_email_pengguna"
npx prisma migrate dev --name "ubah_harga_dari_int_ke_decimal"
npx prisma migrate dev --name "tambah_soft_delete_ke_produk"
npx prisma migrate dev --name "hapus_field_deprecated_kode_lama"

# ❌ NAMA YANG BURUK — Tidak informatif
npx prisma migrate dev --name "update"
npx prisma migrate dev --name "fix"
npx prisma migrate dev --name "perubahan_schema"
npx prisma migrate dev --name "migration_1"
npx prisma migrate dev --name "test123"

# Format yang disarankan: snake_case, kata kerja + objek
# tambah_[field/tabel/index]_[konteks]
# hapus_[field/tabel/index]_[konteks]
# ubah_[field]_dari_[tipe_lama]_ke_[tipe_baru]
```

---

## 🔍 7.6 Skenario Migration Umum

### Skenario 1: Menambahkan Field Baru

```prisma
// SEBELUM — schema.prisma
model Produk {
  id    Int    @id @default(autoincrement())
  nama  String
  harga Decimal @db.Decimal(12, 2)
}

// SESUDAH — tambahkan field baru
model Produk {
  id          Int      @id @default(autoincrement())
  nama        String
  harga       Decimal  @db.Decimal(12, 2)
  // Field baru:
  stokMinimum Int      @default(0)    // ← Field dengan default — AMAN, tidak rusak data
  gambarUrl   String?                  // ← Nullable — AMAN untuk data yang sudah ada
  berat       Float?                   // ← Nullable — AMAN
  diperbarui  DateTime @updatedAt      // ← updatedAt baru — AMAN
}
```

```bash
npx prisma migrate dev --name "tambah_stok_minimum_dan_gambar_ke_produk"
```

```sql
-- SQL yang di-generate (aman untuk data yang sudah ada):
ALTER TABLE `produk`
  ADD COLUMN `stok_minimum` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `gambar_url`   VARCHAR(191) NULL,
  ADD COLUMN `berat`        DOUBLE NULL,
  ADD COLUMN `diperbarui`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
```

### Skenario 2: Mengubah Tipe Data (Hati-hati!)

```prisma
// Mengubah tipe data adalah operasi BERBAHAYA
// Bisa menyebabkan data hilang atau corrupt jika tidak hati-hati!

// SEBELUM
model Produk {
  harga Int     // Simpan dalam sen/poin (tanpa desimal)
}

// SESUDAH
model Produk {
  harga Decimal @db.Decimal(12, 2)  // Simpan dengan desimal
}
```

```bash
# ⚠️ Prisma akan meminta konfirmasi karena ini operasi destructive!
npx prisma migrate dev --name "ubah_harga_dari_int_ke_decimal"

# Output dari Prisma:
# ⚠️  Warnings for the current datasource:
#
# • You are about to alter the column `harga` on the `produk` table.
#   The data in that column could be lost.
#
# Are you sure you want to create and apply this migration? › (y/N)
```

```sql
-- SQL yang di-generate — DATA BISA HILANG!
ALTER TABLE `produk` MODIFY COLUMN `harga` DECIMAL(12,2) NOT NULL;
-- MySQL akan coba konversi, tapi nilai bisa tidak akurat!
```

```bash
# CARA YANG AMAN — Lakukan secara bertahap:

# Step 1: Tambah kolom baru (nullable)
# Tambah field 'hargaBaru Decimal? @db.Decimal(12,2)' ke schema
npx prisma migrate dev --name "tambah_kolom_harga_baru"

# Step 2: Isi kolom baru dengan data yang sudah dikonversi (via script)
# npx tsx scripts/migrate-harga.ts

# Step 3: Jadikan NOT NULL setelah semua data terisi
# Ubah hargaBaru menjadi tidak nullable
npx prisma migrate dev --name "jadikan_harga_baru_not_null"

# Step 4: Rename (hapus lama, rename baru)
# Hapus field 'harga' lama, rename 'hargaBaru' menjadi 'harga'
npx prisma migrate dev --name "cleanup_rename_harga"
```

### Skenario 3: Menambahkan Index

```prisma
// SEBELUM
model Pesanan {
  id         Int           @id @default(autoincrement())
  status     StatusPesanan @default(MENUNGGU_PEMBAYARAN)
  penggunaId Int
}

// SESUDAH — Tambah index untuk performa
model Pesanan {
  id         Int           @id @default(autoincrement())
  status     StatusPesanan @default(MENUNGGU_PEMBAYARAN)
  penggunaId Int

  @@index([penggunaId])        // ← Index baru
  @@index([status, createdAt]) // ← Composite index baru
}
```

```bash
npx prisma migrate dev --name "tambah_index_pesanan"
```

```sql
-- SQL yang di-generate — Aman! Tidak mengubah data
CREATE INDEX `pesanan_penggunaId_idx` ON `pesanan`(`penggunaId`);
CREATE INDEX `pesanan_status_createdAt_idx` ON `pesanan`(`status`, `created_at`);
```

### Skenario 4: Menambahkan Relasi Baru

```prisma
// Tambah model Ulasan yang berelasi ke Produk dan Pengguna

model Ulasan {
  id         Int      @id @default(autoincrement())
  rating     Int
  komentar   String?  @db.Text
  penggunaId Int
  produkId   Int

  pengguna   Pengguna @relation(fields: [penggunaId], references: [id], onDelete: Cascade)
  produk     Produk   @relation(fields: [produkId],   references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())

  @@unique([penggunaId, produkId])
  @@index([produkId])
  @@map("ulasan")
}

// Jangan lupa tambahkan field relasi balik di model yang sudah ada!
model Produk {
  // ... field lainnya
  ulasan Ulasan[]  // ← Tambahkan ini
}

model Pengguna {
  // ... field lainnya
  ulasan Ulasan[]  // ← Tambahkan ini
}
```

```bash
npx prisma migrate dev --name "tambah_tabel_ulasan"
```

### Skenario 5: Soft Delete — Tambah Field `deletedAt`

```prisma
// Tambah soft delete ke model yang sudah ada dengan data

model Produk {
  // ... field lainnya
  deletedAt DateTime?  // ← Nullable! Sangat penting
  // null = aktif, ada nilai = sudah "dihapus"
}
```

```bash
npx prisma migrate dev --name "tambah_soft_delete_produk"
```

```sql
-- SQL yang di-generate — Aman karena nullable
ALTER TABLE `produk` ADD COLUMN `deleted_at` DATETIME(3) NULL;
```

---

## 🔍 7.7 Melihat Status Migration

```bash
# Lihat status semua migration
npx prisma migrate status

# Contoh output saat semua sudah terupdate:
# Status
# 4 migrations found in prisma/migrations
#
# Following migrations have been applied:
#
# migrations/
#   └─ 20240101120000_init/
#     └─ migration.sql
#   └─ 20240115093045_tambah_produk/
#     └─ migration.sql
#   └─ 20240120141523_tambah_relasi_tag/
#     └─ migration.sql
#   └─ 20240201083012_tambah_soft_delete/
#     └─ migration.sql
#
# Database schema is up to date!

# Contoh output saat ada migration yang belum diterapkan:
# 1 migration found in prisma/migrations that has not yet been applied:
#
#   migrations/
#     └─ 20240201083012_tambah_soft_delete/
#       └─ migration.sql
#
# Run `prisma migrate dev` or `prisma migrate deploy` to apply the pending migration.
```

---

## ⏪ 7.8 Reset Migration — Mulai dari Awal

```bash
# ⚠️⚠️ SANGAT BERBAHAYA — Hanya untuk development!
# Urutan yang dilakukan:
# 1. Drop semua tabel di database
# 2. Jalankan ulang SEMUA migration dari awal
# 3. (Opsional) Jalankan seed

npx prisma migrate reset

# Output yang akan muncul:
# Are you sure you want to reset your database?
# All data will be lost. › (y/N)
#
# Applying migration `20240101120000_init`
# Applying migration `20240115093045_tambah_produk`
# ...
# Database reset successful
# ✔ Generated Prisma Client

# Dengan auto-confirm (berguna untuk script CI/CD):
npx prisma migrate reset --force

# Reset tapi skip seeder:
npx prisma migrate reset --skip-seed
```

> ⚠️ **PERINGATAN KERAS:** `prisma migrate reset` menghapus **semua data** di database. **Jangan pernah jalankan di staging atau production!** Gunakan hanya di database development lokal kamu.

---

## 🚀 7.9 Deployment Migration ke Production

```bash
# Di production, TIDAK pakai 'migrate dev' (bisa bahaya!)
# Gunakan 'migrate deploy' — hanya jalankan migration yang pending, tidak buat yang baru

npx prisma migrate deploy

# Perbedaan migrate dev vs migrate deploy:
# ─────────────────────────────────────────────────────────────
# migrate dev:
#   ✅ Buat file migration baru jika schema berubah
#   ✅ Tanya konfirmasi untuk operasi berbahaya
#   ✅ Jalankan seed setelah migrate
#   ❌ JANGAN pakai di production
#
# migrate deploy:
#   ✅ Hanya jalankan migration yang SUDAH ADA di folder migrations/
#   ✅ Tidak buat migration baru
#   ✅ Tidak tanya konfirmasi (cocok untuk CI/CD otomatis)
#   ✅ Aman untuk production
#   ❌ Error jika schema.prisma tidak sinkron dengan migration files
```

### Integrasi dengan CI/CD

```yaml
# .github/workflows/deploy.yml — Contoh GitHub Actions

name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm start
```

---

## 🛠️ 7.10 Troubleshooting Migration

### Error: Migration tidak sinkron dengan schema

```bash
# Error:
# ⚠️ Drift detected: Your database schema is not in sync with your migration history.
# The following is a summary of the differences between your migration files
# and your database schema:
# • [+] Added tables: tabel_baru

# Penyebab: Ada yang mengedit database langsung tanpa melalui Prisma Migrate
# (misalnya pakai phpMyAdmin atau menjalankan SQL manual)

# Solusi 1: Baseline — anggap database saat ini sebagai "kebenaran"
npx prisma migrate resolve --applied "nama_migration_yang_konflik"

# Solusi 2: Reset (HAPUS SEMUA DATA!) dan mulai ulang
npx prisma migrate reset

# Solusi 3: Buat migration baru yang sesuai dengan kondisi database saat ini
npx prisma migrate dev --name "sync_dengan_database"
```

### Error: Migration sudah diterapkan tapi schema masih beda

```bash
# Cek isi tabel _prisma_migrations di database
# Ini tabel yang Prisma pakai untuk track migration mana yang sudah dijalankan

# Jalankan raw SQL untuk lihat:
# SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;

# Jika ada migration yang tercatat tapi gagal di tengah jalan:
npx prisma migrate resolve --rolled-back "nama_migration_yang_gagal"
# Tandai sebagai rolled back, lalu jalankan lagi
npx prisma migrate deploy
```

### Error: `db push` atau `migrate dev` merusak data

```bash
# Pencegahan:
# 1. SELALU backup database sebelum operasi berisiko
# 2. Test di database development dulu sebelum apply ke staging/production
# 3. Baca peringatan yang ditampilkan Prisma dengan seksama sebelum konfirmasi

# Backup MySQL sebelum migrate:
mysqldump -u root -p nama_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup PostgreSQL sebelum migrate:
pg_dump -U postgres nama_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## ✅ Checklist Bab 7

```
□ Memahami perbedaan fundamental db push vs migrate dev
□ Bisa menjalankan migration pertama dengan nama yang deskriptif
□ Memahami struktur folder migrations/ dan isi migration.sql
□ Bisa mengecek status migration dengan migrate status
□ Memahami kapan pakai migrate dev (development) vs migrate deploy (production)
□ Tahu cara reset database development dengan migrate reset
□ Tidak pernah jalankan migrate reset di staging/production!
□ Script CI/CD sudah menggunakan migrate deploy
```

---

---

---

🚀 Lanjut ke [🌱 Bab 8 — Seeder & Data Awal](/bagian-3/bab-8) untuk melanjutkan perjalanan!
