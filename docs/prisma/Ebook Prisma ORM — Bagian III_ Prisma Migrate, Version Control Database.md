# 🟡 Ebook Prisma ORM — Bagian III: Prisma Migrate, Version Control Database

> 🎯 **Tujuan Bagian III:** Menguasai sistem migrasi Prisma untuk mengelola perubahan schema database dengan aman, terstruktur, dan bisa direplikasi di environment manapun — dari laptop developer hingga server production.

---

# 📖 Bab 7 — Prisma Migrate: Dasar

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

# 📖 Bab 8 — Seeder & Data Awal

Seeder adalah kode yang mengisi database dengan data awal — baik untuk keperluan development (data dummy yang realistis), testing (data yang konsisten untuk setiap test), maupun production (data master yang wajib ada seperti kategori, konfigurasi sistem, atau akun admin pertama).

---

## 🌱 8.1 Mengapa Seeder Penting?

```
MASALAH TANPA SEEDER:
────────────────────────────────────────────────────────────────
Developer baru join tim:
  "Database sudah kosong, bagaimana aku test fitur pencarian produk
   kalau tidak ada produknya?"

QA Engineer mau testing:
  "Aku harus input manual 50 produk dengan berbagai kategori
   setiap kali database di-reset? Itu membuang banyak waktu!"

Bug report dari user:
  "Bug ini hanya terjadi saat ada 100+ produk di satu kategori"
  Developer: "Aku harus buat 100 produk manual dulu baru bisa reproduce..."


DENGAN SEEDER YANG BAIK:
────────────────────────────────────────────────────────────────
✅ Developer baru bisa langsung kerja dengan: npx prisma db seed
✅ Database di-reset dan langsung isi otomatis dengan data realistis
✅ Data yang konsisten di semua mesin developer
✅ QA bisa test dengan berbagai kondisi data tanpa input manual
✅ Bug mudah di-reproduce karena state database bisa direplikasi
```

---

## ⚙️ 8.2 Konfigurasi Seeder

```json
// package.json — Daftarkan file seeder
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
    // Memberitahu Prisma CLI di mana file seeder berada
    // Dipakai oleh: npx prisma db seed
    // Juga dipanggil otomatis oleh: npx prisma migrate reset
  }
}
```

```bash
# Cara menjalankan seeder:

# Via Prisma CLI (recommended):
npx prisma db seed

# Via npm script:
npm run db:seed

# Reset + migrate + seed sekaligus:
npx prisma migrate reset
# ↑ Akan tanya konfirmasi, lalu otomatis jalankan seed

# Reset tanpa seed:
npx prisma migrate reset --skip-seed
```

---

## 🏗️ 8.3 Anatomi Seeder yang Baik

```typescript
// prisma/seed.ts — Template lengkap

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Helper functions ────────────────────────────────────────────────

// Jeda eksekusi — berguna untuk rate limiting atau testing
const tunggu = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Log dengan format yang konsisten
function log(pesan: string) {
  console.log(`  ${pesan}`)
}

// ─── Fungsi seeding per domain ───────────────────────────────────────
// Pisahkan per domain agar mudah di-maintain dan bisa dijalankan terpisah

async function seedKategori() { /* ... */ }
async function seedTag()      { /* ... */ }
async function seedPengguna() { /* ... */ }
async function seedProduk()   { /* ... */ }
async function seedPesanan()  { /* ... */ }

// ─── Main function ───────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Memulai seeding database...')
  console.log('═'.repeat(50))

  // Jalankan per domain — urutan penting karena relasi!
  const kategori  = await seedKategori()
  const tags      = await seedTag()
  const pengguna  = await seedPengguna()
  const produk    = await seedProduk(kategori, tags)
  await seedPesanan(pengguna, produk)

  // Tampilkan ringkasan
  console.log('\n' + '═'.repeat(50))
  console.log('📊 Ringkasan:')
  console.log(`  👥 Pengguna : ${await prisma.pengguna.count()}`)
  console.log(`  📂 Kategori : ${await prisma.kategori.count()}`)
  console.log(`  📦 Produk   : ${await prisma.produk.count()}`)
  console.log(`  🏷️  Tag      : ${await prisma.tag.count()}`)
  console.log(`  🛒 Pesanan  : ${await prisma.pesanan.count()}`)
  console.log('═'.repeat(50))
  console.log('✅ Seeding berhasil!\n')
}

main()
  .catch(e => {
    console.error('\n❌ Seeding gagal!')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## 📝 8.4 Seeder Lengkap dengan Data Realistis

```typescript
// prisma/seed.ts — Implementasi lengkap untuk e-commerce

import { PrismaClient, RolePengguna, StatusPesanan } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────────────
// ① SEED KATEGORI
// ─────────────────────────────────────────────────────────────────────
async function seedKategori() {
  console.log('\n📂 Membuat kategori...')

  // upsert: buat jika belum ada, update jika sudah ada
  // Ini membuat seeder IDEMPOTENT — aman dijalankan berkali-kali
  const dataKategori = [
    {
      nama:      'Elektronik',
      slug:      'elektronik',
      deskripsi: 'Gadget, laptop, smartphone, dan perangkat elektronik lainnya',
      warna:     '#3B82F6',  // Biru
    },
    {
      nama:      'Fashion',
      slug:      'fashion',
      deskripsi: 'Pakaian, sepatu, aksesoris, dan busana terkini',
      warna:     '#EC4899',  // Pink
    },
    {
      nama:      'Olahraga',
      slug:      'olahraga',
      deskripsi: 'Perlengkapan olahraga dan kebugaran',
      warna:     '#10B981',  // Hijau
    },
    {
      nama:      'Rumah & Dapur',
      slug:      'rumah-dapur',
      deskripsi: 'Peralatan rumah tangga dan perlengkapan dapur',
      warna:     '#F59E0B',  // Kuning
    },
    {
      nama:      'Buku & Pendidikan',
      slug:      'buku-pendidikan',
      deskripsi: 'Buku, alat tulis, dan materi pendidikan',
      warna:     '#8B5CF6',  // Ungu
    },
  ]

  const kategoriDibuat = await Promise.all(
    dataKategori.map(data =>
      prisma.kategori.upsert({
        where:  { slug: data.slug },
        update: data,   // Update jika sudah ada
        create: data,   // Buat jika belum ada
      })
    )
  )

  kategoriDibuat.forEach(k => console.log(`  ✅ ${k.nama}`))
  return kategoriDibuat
}

// ─────────────────────────────────────────────────────────────────────
// ② SEED TAG
// ─────────────────────────────────────────────────────────────────────
async function seedTag() {
  console.log('\n🏷️  Membuat tag...')

  const dataTag = [
    { nama: 'gaming',       slug: 'gaming',       warna: '#EF4444' },
    { nama: 'best-seller',  slug: 'best-seller',  warna: '#F59E0B' },
    { nama: 'new-arrival',  slug: 'new-arrival',  warna: '#10B981' },
    { nama: 'sale',         slug: 'sale',          warna: '#EC4899' },
    { nama: 'wireless',     slug: 'wireless',      warna: '#3B82F6' },
    { nama: 'premium',      slug: 'premium',       warna: '#8B5CF6' },
    { nama: 'limited',      slug: 'limited',       warna: '#6B7280' },
    { nama: 'eco-friendly', slug: 'eco-friendly',  warna: '#059669' },
  ]

  const tagDibuat = await Promise.all(
    dataTag.map(data =>
      prisma.tag.upsert({
        where:  { slug: data.slug },
        update: data,
        create: data,
      })
    )
  )

  console.log(`  ✅ ${tagDibuat.length} tag dibuat`)
  return tagDibuat
}

// ─────────────────────────────────────────────────────────────────────
// ③ SEED PENGGUNA
// ─────────────────────────────────────────────────────────────────────
async function seedPengguna() {
  console.log('\n👥 Membuat pengguna...')

  const dataPengguna = [
    {
      email:    'admin@toko.id',
      nama:     'Super Admin',
      password: 'Admin@123',
      role:     RolePengguna.ADMIN,
      bio:      'Administrator utama sistem toko online',
    },
    {
      email:    'manajer@toko.id',
      nama:     'Budi Manajer',
      password: 'Manajer@123',
      role:     RolePengguna.MANAJER,
      bio:      'Manajer operasional toko',
    },
    {
      email:    'editor@toko.id',
      nama:     'Siti Editor',
      password: 'Editor@123',
      role:     RolePengguna.EDITOR,
      bio:      'Editor konten produk',
    },
    {
      email:    'pembeli1@email.com',
      nama:     'Andi Pembeli',
      password: 'Pembeli@123',
      role:     RolePengguna.PEMBELI,
      bio:      'Pelanggan setia',
    },
    {
      email:    'pembeli2@email.com',
      nama:     'Dewi Susanti',
      password: 'Pembeli@123',
      role:     RolePengguna.PEMBELI,
      bio:      '',
    },
  ]

  const penggunaDibuat = []

  for (const data of dataPengguna) {
    const { bio, ...userData } = data

    const pengguna = await prisma.pengguna.upsert({
      where:  { email: data.email },
      update: { nama: data.nama, role: data.role },
      create: {
        ...userData,
        password: await bcrypt.hash(data.password, 12),
        // Buat profil sekaligus
        profil: {
          create: { bio: bio || null }
        }
      },
      include: { profil: true }
    })

    penggunaDibuat.push(pengguna)
    console.log(`  ✅ ${pengguna.nama} (${pengguna.role})`)
  }

  return penggunaDibuat
}

// ─────────────────────────────────────────────────────────────────────
// ④ SEED PRODUK
// ─────────────────────────────────────────────────────────────────────
async function seedProduk(
  kategori: Awaited<ReturnType<typeof seedKategori>>,
  tags:     Awaited<ReturnType<typeof seedTag>>
) {
  console.log('\n📦 Membuat produk...')

  // Helper untuk cari kategori dan tag by slug
  const getKategori = (slug: string) => kategori.find(k => k.slug === slug)!
  const getTag      = (slug: string) => tags.find(t => t.slug === slug)!

  const dataProduk = [
    // ─── Elektronik ─────────────────────────────────────────────────
    {
      nama:       'Laptop ASUS ROG Zephyrus G14',
      slug:       'laptop-asus-rog-zephyrus-g14',
      deskripsi:  'Laptop gaming flagship dengan AMD Ryzen 9 dan GPU RTX 4090. Performa tinggi dalam bodi tipis 14 inci.',
      harga:      27500000,
      stok:       5,
      kategoriSlug: 'elektronik',
      tagSlug:    ['gaming', 'premium', 'best-seller'],
    },
    {
      nama:       'MacBook Air M3 13 inci',
      slug:       'macbook-air-m3-13-inci',
      deskripsi:  'Laptop terbaik Apple dengan chip M3. Ringan, tipis, dan baterai tahan seharian.',
      harga:      22000000,
      stok:       8,
      kategoriSlug: 'elektronik',
      tagSlug:    ['premium', 'new-arrival'],
    },
    {
      nama:       'Mouse Logitech MX Master 3S',
      slug:       'mouse-logitech-mx-master-3s',
      deskripsi:  'Mouse produktivitas premium dengan MagSpeed scroll dan tombol yang bisa dikustomisasi.',
      harga:      1350000,
      stok:       30,
      kategoriSlug: 'elektronik',
      tagSlug:    ['wireless', 'best-seller'],
    },
    {
      nama:       'Headphone Sony WH-1000XM5',
      slug:       'headphone-sony-wh1000xm5',
      deskripsi:  'Headphone noise cancelling terbaik di kelasnya. Suara jernih, nyaman dipakai seharian.',
      harga:      4800000,
      stok:       15,
      kategoriSlug: 'elektronik',
      tagSlug:    ['wireless', 'premium'],
    },
    {
      nama:       'Mechanical Keyboard Keychron K2 Pro',
      slug:       'mechanical-keyboard-keychron-k2-pro',
      deskripsi:  'Keyboard mekanikal compact 75% dengan switch Gateron dan backlight RGB.',
      harga:      1200000,
      stok:       20,
      kategoriSlug: 'elektronik',
      tagSlug:    ['wireless', 'gaming'],
    },

    // ─── Fashion ────────────────────────────────────────────────────
    {
      nama:       'Kemeja Batik Premium Pria',
      slug:       'kemeja-batik-premium-pria',
      deskripsi:  'Kemeja batik motif parang dengan bahan katun premium. Cocok untuk acara formal maupun semi-formal.',
      harga:      285000,
      stok:       50,
      kategoriSlug: 'fashion',
      tagSlug:    ['premium', 'best-seller'],
    },
    {
      nama:       'Sneakers Nike Air Max 270',
      slug:       'sneakers-nike-air-max-270',
      deskripsi:  'Sepatu sneakers Nike dengan teknologi Air Max untuk kenyamanan maksimal. Tersedia berbagai pilihan warna.',
      harga:      1850000,
      stok:       25,
      kategoriSlug: 'fashion',
      tagSlug:    ['best-seller', 'new-arrival'],
    },

    // ─── Olahraga ───────────────────────────────────────────────────
    {
      nama:       'Raket Badminton Yonex Astrox 88D',
      slug:       'raket-badminton-yonex-astrox-88d',
      deskripsi:  'Raket badminton seri Astrox 88D untuk pemain dominan. Cocok untuk pemain tingkat menengah hingga profesional.',
      harga:      2250000,
      stok:       12,
      kategoriSlug: 'olahraga',
      tagSlug:    ['premium', 'limited'],
    },
    {
      nama:       'Matras Yoga Anti-Slip 6mm',
      slug:       'matras-yoga-anti-slip-6mm',
      deskripsi:  'Matras yoga tebal 6mm dengan permukaan anti-slip. Material ramah lingkungan dan mudah dibersihkan.',
      harga:      185000,
      stok:       40,
      kategoriSlug: 'olahraga',
      tagSlug:    ['eco-friendly', 'sale'],
    },

    // ─── Rumah & Dapur ──────────────────────────────────────────────
    {
      nama:       'Rice Cooker Philips HD3132',
      slug:       'rice-cooker-philips-hd3132',
      deskripsi:  'Rice cooker kapasitas 1.8L dengan teknologi Fuzzy Logic. Bisa masak berbagai jenis nasi dan menu lainnya.',
      harga:      550000,
      stok:       18,
      kategoriSlug: 'rumah-dapur',
      tagSlug:    ['best-seller'],
    },
  ]

  const produkDibuat = []

  for (const data of dataProduk) {
    const { kategoriSlug, tagSlug, ...produkData } = data

    const produk = await prisma.produk.upsert({
      where:  { slug: data.slug },
      update: {
        nama:  produkData.nama,
        harga: produkData.harga,
        stok:  produkData.stok,
      },
      create: {
        ...produkData,
        kategori: { connect: { slug: kategoriSlug } },
        tags: {
          connect: tagSlug.map(slug => ({ slug }))
        },
      },
      include: {
        kategori: true,
        tags:     true,
      }
    })

    produkDibuat.push(produk)
    console.log(`  ✅ ${produk.nama} — Rp ${Number(produk.harga).toLocaleString('id-ID')}`)
  }

  return produkDibuat
}

// ─────────────────────────────────────────────────────────────────────
// ⑤ SEED PESANAN — Data transaksi contoh
// ─────────────────────────────────────────────────────────────────────
async function seedPesanan(
  pengguna: Awaited<ReturnType<typeof seedPengguna>>,
  produk:   Awaited<ReturnType<typeof seedProduk>>
) {
  console.log('\n🛒 Membuat pesanan contoh...')

  // Cari pengguna pembeli
  const pembeli1 = pengguna.find(p => p.email === 'pembeli1@email.com')!
  const pembeli2 = pengguna.find(p => p.email === 'pembeli2@email.com')!

  // Cari produk berdasarkan slug
  const laptop   = produk.find(p => p.slug === 'laptop-asus-rog-zephyrus-g14')!
  const mouse    = produk.find(p => p.slug === 'mouse-logitech-mx-master-3s')!
  const headphone = produk.find(p => p.slug === 'headphone-sony-wh1000xm5')!
  const matras   = produk.find(p => p.slug === 'matras-yoga-anti-slip-6mm')!

  // Pesanan 1 — Selesai
  const pesanan1 = await prisma.pesanan.create({
    data: {
      status:      StatusPesanan.SELESAI,
      total:       Number(laptop.harga) + Number(mouse.harga),
      penggunaId:  pembeli1.id,
      alamatKirim: {          // Snapshot alamat — JSON
        penerima: 'Andi Pembeli',
        telepon:  '081234567890',
        jalan:    'Jl. Merdeka No. 10',
        kota:     'Jakarta Selatan',
        provinsi: 'DKI Jakarta',
        kodePos:  '12110',
      },
      items: {
        create: [
          {
            produkId:    laptop.id,
            jumlah:      1,
            hargaSatuan: laptop.harga,  // Snapshot harga saat beli
          },
          {
            produkId:    mouse.id,
            jumlah:      2,
            hargaSatuan: mouse.harga,
          },
        ]
      }
    }
  })

  // Pesanan 2 — Dalam pengiriman
  const pesanan2 = await prisma.pesanan.create({
    data: {
      status:      StatusPesanan.DIKIRIM,
      total:       Number(headphone.harga),
      penggunaId:  pembeli2.id,
      alamatKirim: {
        penerima: 'Dewi Susanti',
        telepon:  '089876543210',
        jalan:    'Jl. Gatot Subroto No. 88',
        kota:     'Bandung',
        provinsi: 'Jawa Barat',
        kodePos:  '40111',
      },
      items: {
        create: [{
          produkId:    headphone.id,
          jumlah:      1,
          hargaSatuan: headphone.harga,
        }]
      }
    }
  })

  // Pesanan 3 — Menunggu pembayaran
  const pesanan3 = await prisma.pesanan.create({
    data: {
      status:      StatusPesanan.MENUNGGU_PEMBAYARAN,
      total:       Number(matras.harga) * 2,
      penggunaId:  pembeli1.id,
      alamatKirim: {
        penerima: 'Andi Pembeli',
        telepon:  '081234567890',
        jalan:    'Jl. Merdeka No. 10',
        kota:     'Jakarta Selatan',
        provinsi: 'DKI Jakarta',
        kodePos:  '12110',
      },
      items: {
        create: [{
          produkId:    matras.id,
          jumlah:      2,
          hargaSatuan: matras.harga,
        }]
      }
    }
  })

  console.log(`  ✅ Pesanan ${pesanan1.kodePesanan} — ${pesanan1.status}`)
  console.log(`  ✅ Pesanan ${pesanan2.kodePesanan} — ${pesanan2.status}`)
  console.log(`  ✅ Pesanan ${pesanan3.kodePesanan} — ${pesanan3.status}`)
}

// ─────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Memulai seeding database...')
  console.log('═'.repeat(55))

  const kategori = await seedKategori()
  const tags     = await seedTag()
  const pengguna = await seedPengguna()
  const produk   = await seedProduk(kategori, tags)
  await seedPesanan(pengguna, produk)

  console.log('\n' + '═'.repeat(55))
  console.log('📊 Ringkasan Database:')
  console.log(`  👥 Pengguna : ${await prisma.pengguna.count()} akun`)
  console.log(`  📂 Kategori : ${await prisma.kategori.count()} kategori`)
  console.log(`  📦 Produk   : ${await prisma.produk.count()} produk`)
  console.log(`  🏷️  Tag      : ${await prisma.tag.count()} tag`)
  console.log(`  🛒 Pesanan  : ${await prisma.pesanan.count()} pesanan`)
  console.log('═'.repeat(55))
  console.log('✅ Seeding berhasil!\n')

  console.log('🔑 Akun yang tersedia:')
  console.log('─'.repeat(45))
  console.log('  Admin  : admin@toko.id        Admin@123')
  console.log('  Manajer: manajer@toko.id      Manajer@123')
  console.log('  Editor : editor@toko.id       Editor@123')
  console.log('  Pembeli: pembeli1@email.com   Pembeli@123')
  console.log('  Pembeli: pembeli2@email.com   Pembeli@123')
  console.log('─'.repeat(45) + '\n')
}

main()
  .catch(e => {
    console.error('\n❌ Seeding gagal:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## 🧪 8.5 Seeder untuk Testing — Data yang Konsisten

```typescript
// prisma/seed-test.ts — Seeder khusus untuk environment testing
// Data minimal yang cukup untuk semua test cases

import { PrismaClient } from '@prisma/client'
import bcrypt           from 'bcryptjs'

const prisma = new PrismaClient()

export async function resetDanSeedTestData() {
  // Hapus semua data dalam urutan yang benar
  await prisma.$transaction([
    prisma.itemPesanan.deleteMany(),
    prisma.pesanan.deleteMany(),
    prisma.ulasan.deleteMany(),
    prisma.produk.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.kategori.deleteMany(),
    prisma.profil.deleteMany(),
    prisma.pengguna.deleteMany(),
  ])

  // Buat data minimal untuk testing
  const hashedPassword = await bcrypt.hash('password123', 10)
  // Cost factor 10 (bukan 12) untuk testing agar lebih cepat

  const [admin, pembeli, kategori, tag] = await prisma.$transaction([
    prisma.pengguna.create({
      data: {
        email: 'admin@test.com', nama: 'Test Admin',
        password: hashedPassword, role: 'ADMIN'
      }
    }),
    prisma.pengguna.create({
      data: {
        email: 'pembeli@test.com', nama: 'Test Pembeli',
        password: hashedPassword, role: 'PEMBELI'
      }
    }),
    prisma.kategori.create({
      data: { nama: 'Test Kategori', slug: 'test-kategori' }
    }),
    prisma.tag.create({
      data: { nama: 'test', slug: 'test' }
    }),
  ])

  const produk = await prisma.produk.create({
    data: {
      nama:       'Produk Test',
      slug:       'produk-test',
      harga:      100000,
      stok:       10,
      kategoriId: kategori.id,
      tags:       { connect: [{ id: tag.id }] }
    }
  })

  return { admin, pembeli, kategori, tag, produk }
}

// Contoh penggunaan di test file (Jest / Vitest):
// beforeEach(async () => {
//   testData = await resetDanSeedTestData()
// })
```

---

## 🔧 8.6 Factory Functions — Data Dummy yang Fleksibel

```typescript
// prisma/factories.ts — Generate data dummy dengan variasi

import { prisma }  from '../src/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// Counter untuk memastikan nilai unik
let counter = 0
const unik  = () => ++counter

// ─── Factory Pengguna ─────────────────────────────────────────────
interface OpsiPengguna {
  email?:    string
  nama?:     string
  role?:     'ADMIN' | 'MANAJER' | 'EDITOR' | 'PEMBELI'
  password?: string
}

export async function buatPengguna(opsi: OpsiPengguna = {}) {
  const n = unik()
  return prisma.pengguna.create({
    data: {
      email:    opsi.email    ?? `pengguna${n}@test.com`,
      nama:     opsi.nama     ?? `Pengguna Test ${n}`,
      password: opsi.password ?? 'password-yang-sudah-di-hash',
      role:     opsi.role     ?? 'PEMBELI',
    }
  })
}

// ─── Factory Produk ───────────────────────────────────────────────
interface OpsiProduk {
  nama?:       string
  harga?:      number
  stok?:       number
  aktif?:      boolean
  kategoriId?: number
}

export async function buatProduk(opsi: OpsiProduk = {}) {
  const n = unik()

  // Jika kategoriId tidak disediakan, buat kategori baru
  let kategoriId = opsi.kategoriId
  if (!kategoriId) {
    const kategori = await prisma.kategori.create({
      data: { nama: `Kategori ${n}`, slug: `kategori-${n}` }
    })
    kategoriId = kategori.id
  }

  return prisma.produk.create({
    data: {
      nama:       opsi.nama   ?? `Produk Test ${n}`,
      slug:       `produk-test-${n}`,
      harga:      opsi.harga  ?? 100000,
      stok:       opsi.stok   ?? 10,
      aktif:      opsi.aktif  ?? true,
      kategoriId,
    }
  })
}

// ─── Factory Pesanan ──────────────────────────────────────────────
export async function buatPesanan(penggunaId: number, produkId: number, harga: number) {
  return prisma.pesanan.create({
    data: {
      penggunaId,
      total:       harga,
      alamatKirim: {
        penerima: 'Test Penerima',
        telepon:  '081234567890',
        jalan:    'Jl. Test No. 1',
        kota:     'Kota Test',
        provinsi: 'Provinsi Test',
        kodePos:  '00000',
      },
      items: {
        create: [{
          produkId,
          jumlah:      1,
          hargaSatuan: harga,
        }]
      }
    }
  })
}

// Penggunaan factory di test:
// const pengguna1 = await buatPengguna({ role: 'ADMIN' })
// const pengguna2 = await buatPengguna()  // Auto-generate email unik
// const produk    = await buatProduk({ harga: 500000, stok: 5 })
// const pesanan   = await buatPesanan(pengguna2.id, produk.id, 500000)
```

---

## ✅ Checklist Bab 8

```
□ File seeder sudah dikonfigurasi di package.json (scripts + prisma.seed)
□ Seeder menggunakan upsert (bukan create) agar idempotent
□ Seeder membersihkan/mereset data sebelum insert jika diperlukan
□ Urutan seed sudah benar (parent sebelum child — kategori sebelum produk)
□ Seeder menampilkan ringkasan di akhir (jumlah record yang dibuat)
□ Akun login yang dibuat sudah tercantum di output seeder
□ npx prisma db seed berhasil dijalankan tanpa error
□ Seeder bisa dijalankan berkali-kali tanpa error (idempotent)
□ Ada seeder terpisah untuk testing jika diperlukan
```

---

## 📊 Ringkasan Bagian III

```
YANG SUDAH DIPELAJARI DI BAGIAN III:

Bab 7 — Prisma Migrate: Dasar
├── Mengapa migration itu penting (masalah tanpa migration)
├── Perbedaan db push vs migrate dev — kapan pakai masing-masing
├── Anatomi folder migrations/ dan isi migration.sql
├── Alur kerja migration sehari-hari (edit → migrate → commit)
├── Penamaan migration yang baik dan deskriptif
├── Skenario migration umum:
│   ├── Tambah field baru (aman)
│   ├── Ubah tipe data (berbahaya, cara bertahap)
│   ├── Tambah index (aman)
│   ├── Tambah relasi baru
│   └── Tambah soft delete
├── Melihat status migration (migrate status)
├── Reset migration untuk development (migrate reset — berbahaya!)
├── Deploy migration ke production (migrate deploy)
├── Integrasi CI/CD dengan GitHub Actions
└── Troubleshooting masalah migration umum

Bab 8 — Seeder & Data Awal
├── Mengapa seeder penting (untuk developer, QA, dan bug reproduction)
├── Konfigurasi seeder di package.json
├── Anatomi seeder yang baik (fungsi terpisah per domain)
├── Seeder lengkap e-commerce:
│   ├── Seed kategori dengan warna
│   ├── Seed tag
│   ├── Seed pengguna dengan bcrypt password
│   ├── Seed produk dengan relasi kategori dan tag
│   └── Seed pesanan dengan item pesanan dan snapshot harga
├── Seeder untuk testing (data minimal, cost bcrypt lebih rendah)
└── Factory functions untuk generate data dummy yang fleksibel
```

> 📌 **Selanjutnya — Bagian IV:** Schema sudah didefinisikan, migration sudah berjalan, data awal sudah ada. Sekarang waktunya belajar **Prisma Client** secara mendalam — semua operasi CRUD dari yang paling dasar hingga teknik yang menghemat banyak waktu.