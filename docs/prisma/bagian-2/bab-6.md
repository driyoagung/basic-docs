---
title: "Bab 6 — Schema Lanjutan & Multi-Database"
---

---

## 🔤 6.1 Naming Conventions — Bridging Prisma dan Database

```prisma
// Masalah: Prisma pakai camelCase, database konvensional pakai snake_case
// Solusi: @map (field) dan @@map (tabel)

// ✅ CARA YANG BENAR
model UserProfil {                       // Model: PascalCase
  id           Int      @id @default(autoincrement())
  namaDepan    String   @map("nama_depan")    // DB kolom: nama_depan
  namaBelakang String   @map("nama_belakang") // DB kolom: nama_belakang
  tanggalLahir DateTime @map("tanggal_lahir") // DB kolom: tanggal_lahir
  userId       Int      @unique @map("user_id") // DB kolom: user_id
  dibuatPada   DateTime @default(now()) @map("dibuat_pada")
  diupdatePada DateTime @updatedAt @map("diupdate_pada")

  user         User     @relation(fields: [userId], references: [id])

  @@map("user_profil")  // Tabel DB: user_profil
}

// Hasil: Di kode TypeScript pakai camelCase, di database pakai snake_case
// prisma.userProfil.findMany()          → SELECT * FROM user_profil
// prisma.userProfil.create({ data: { namaDepan: 'Budi' } })
// → INSERT INTO user_profil (nama_depan) VALUES ('Budi')
```

---

## 🆚 6.2 Perbedaan MySQL vs PostgreSQL di Schema

```prisma
// Beberapa perbedaan penting yang perlu diketahui:

// ─── AUTO-INCREMENT ─────────────────────────────────────────────────
// MySQL:
model UserMySQL {
  id Int @id @default(autoincrement())
  // SQL: id INT NOT NULL AUTO_INCREMENT
}
// PostgreSQL (sama, tapi SQL yang di-generate berbeda):
model UserPG {
  id Int @id @default(autoincrement())
  // SQL: id SERIAL NOT NULL atau id INT GENERATED ALWAYS AS IDENTITY
}

// ─── UUID ────────────────────────────────────────────────────────────
// MySQL — disimpan sebagai CHAR(36):
model ItemMySQL {
  id String @id @default(uuid()) @db.Char(36)
}
// PostgreSQL — tipe UUID native, lebih efisien:
model ItemPG {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
}

// ─── JSON ────────────────────────────────────────────────────────────
// MySQL — JSON column biasa:
model KonfigMySQL {
  data Json?
  // SQL: data JSON NULL
}
// PostgreSQL — JSONB lebih cepat & bisa di-index:
model KonfigPG {
  data Json? @db.JsonB
  // SQL: data JSONB NULL
  // Keuntungan JSONB: kompresi biner, indexing, query lebih cepat
}

// ─── STRING DEFAULT LENGTH ─────────────────────────────────────────
// MySQL: String → VARCHAR(191)
// Kenapa 191? Batas index untuk utf8mb4 di MySQL adalah 767 bytes
// utf8mb4 maksimal 4 bytes per karakter → 767/4 ≈ 191 karakter

// PostgreSQL: String → TEXT (tidak ada batas panjang default)

// Solusi: Pakai @db.VarChar(255) untuk konsistensi di kedua database:
model Konsisten {
  nama     String @db.VarChar(255)   // Eksplisit di MySQL dan PostgreSQL
  deskripsi String @db.Text          // Sama di keduanya
}

// ─── FULL-TEXT SEARCH ───────────────────────────────────────────────
// MySQL: INDEX FULLTEXT — buat via raw SQL atau @db.Text + manual index
// PostgreSQL: tsvector/tsquery — jauh lebih powerful, bisa via raw query Prisma
```

---

## 🔧 6.3 Multiple Schema / Prisma Schema Per Database

```prisma
// Satu project bisa punya koneksi ke beberapa database berbeda
// Gunakan previewFeatures: ["multiSchema"] untuk PostgreSQL

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "analytics"]  // Dua schema PostgreSQL
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique

  @@schema("public")     // Model ini ada di schema "public"
}

model PageView {
  id        Int      @id @default(autoincrement())
  url       String
  viewedAt  DateTime @default(now())

  @@schema("analytics") // Model ini ada di schema "analytics"
}
```

---

## 🌱 6.4 Seed File yang Baik

```typescript
// prisma/seed.ts — Template seed file yang reusable

import { PrismaClient, RolePengguna, StatusProduk } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function bersihkanData() {
  console.log('🗑️  Membersihkan data lama...')

  // Urutan penting! Hapus yang punya FK dulu
  await prisma.ulasan.deleteMany()
  await prisma.itemPesanan.deleteMany()
  await prisma.pesanan.deleteMany()
  await prisma.produk.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.kategori.deleteMany()
  await prisma.profil.deleteMany()
  await prisma.pengguna.deleteMany()

  console.log('✅ Data lama berhasil dibersihkan')
}

async function buatPengguna() {
  console.log('👥 Membuat pengguna...')

  const admin = await prisma.pengguna.create({
    data: {
      email:    'admin@toko.id',
      nama:     'Administrator',
      password: await bcrypt.hash('Admin@123', 12),
      role:     RolePengguna.ADMIN,
      profil: {
        create: {
          bio:     'Administrator sistem toko online',
          telepon: '081200000000',
        }
      }
    },
    include: { profil: true }
  })

  const pembeli = await prisma.pengguna.create({
    data: {
      email:    'budi@email.com',
      nama:     'Budi Santoso',
      password: await bcrypt.hash('Budi@123', 12),
      role:     RolePengguna.PEMBELI,
      profil: {
        create: { bio: 'Pelanggan setia toko online kami' }
      }
    }
  })

  console.log(`   ✅ ${admin.nama} (${admin.role})`)
  console.log(`   ✅ ${pembeli.nama} (${pembeli.role})`)

  return { admin, pembeli }
}

async function buatKategoriDanProduk() {
  console.log('📦 Membuat kategori dan produk...')

  // Buat tag dulu
  const tags = await Promise.all([
    prisma.tag.create({ data: { nama: 'gaming',    slug: 'gaming'    } }),
    prisma.tag.create({ data: { nama: 'laptop',    slug: 'laptop'    } }),
    prisma.tag.create({ data: { nama: 'audio',     slug: 'audio'     } }),
    prisma.tag.create({ data: { nama: 'wireless',  slug: 'wireless'  } }),
    prisma.tag.create({ data: { nama: 'sale',      slug: 'sale'      } }),
  ])

  // Buat kategori beserta produk
  const elektronik = await prisma.kategori.create({
    data: {
      nama: 'Elektronik',
      slug: 'elektronik',
      produk: {
        create: [
          {
            nama:      'Laptop ASUS ROG Zephyrus G14',
            slug:      'laptop-asus-rog-zephyrus-g14',
            deskripsi: 'Laptop gaming terbaru dengan performa tinggi',
            harga:     25000000,
            stok:      5,
            tags: { connect: [{ slug: 'gaming' }, { slug: 'laptop' }] }
          },
          {
            nama:      'Headphone Sony WH-1000XM5',
            slug:      'headphone-sony-wh1000xm5',
            deskripsi: 'Headphone noise cancelling terbaik di kelasnya',
            harga:     4500000,
            stok:      12,
            tags: { connect: [{ slug: 'audio' }, { slug: 'wireless' }] }
          },
        ]
      }
    },
    include: { produk: true }
  })

  console.log(`   ✅ Kategori: ${elektronik.nama}`)
  console.log(`   ✅ ${elektronik.produk.length} produk dibuat`)

  return { elektronik }
}

async function main() {
  console.log('\n🌱 Memulai seeding database...\n')
  console.log('━'.repeat(50))

  await bersihkanData()
  const { admin, pembeli } = await buatPengguna()
  const { elektronik } = await buatKategoriDanProduk()

  // Ringkasan
  console.log('\n' + '━'.repeat(50))
  console.log('📊 Ringkasan Seeding:')
  console.log(`   👥 Pengguna  : ${await prisma.pengguna.count()}`)
  console.log(`   📂 Kategori  : ${await prisma.kategori.count()}`)
  console.log(`   📦 Produk    : ${await prisma.produk.count()}`)
  console.log(`   🏷️  Tag       : ${await prisma.tag.count()}`)
  console.log('━'.repeat(50))
  console.log('\n✅ Seeding selesai!\n')
  console.log('🔑 Akun yang tersedia:')
  console.log(`   Admin  : admin@toko.id    / Admin@123`)
  console.log(`   Pembeli: budi@email.com   / Budi@123`)
}

main()
  .catch(e => {
    console.error('❌ Seeding gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## ✅ Checklist Bab 6

```
□ Konsisten pakai @map dan @@map untuk naming convention
□ Memahami perbedaan MySQL vs PostgreSQL untuk tipe String, UUID, dan JSON
□ Seed file sudah dibuat dan bisa dijalankan dengan npx prisma db seed
□ Seed file menggunakan upsert atau bersihkan data dulu sebelum seed
□ Schema sudah divalidasi dengan: npx prisma validate
□ Schema sudah diformat dengan: npx prisma format
```

---

## 📊 Ringkasan Bagian II

```
YANG SUDAH DIPELAJARI DI BAGIAN II:

Bab 4 — Data Model & Field Types
├── Anatomi model: field, attribute, block attribute
├── Semua tipe data Prisma + SQL equivalent (String, Int, Decimal, dll)
├── Semua opsi Primary Key (autoincrement, cuid, uuid, composite)
├── Field attributes: @id, @unique, @default, @updatedAt, @map, @db, @ignore
├── Block attributes: @@map, @@unique, @@index, @@id
└── Enum untuk nilai terbatas

Bab 5 — Relasi Antar Model
├── One-to-One: @unique pada FK, dua sisi relasi
├── One-to-Many: Array [] di sisi "satu", FK di sisi "banyak"
├── Many-to-Many Implicit: Array [] di kedua sisi, Prisma urus pivot
├── Many-to-Many Explicit: Model pivot dengan kolom tambahan
├── Self-Relation: Model berelasi dengan dirinya sendiri
└── Referential Actions: Cascade, SetNull, Restrict, NoAction

Bab 6 — Schema Lanjutan
├── Naming convention: @map & @@map untuk bridging PascalCase ↔ snake_case
├── Perbedaan MySQL vs PostgreSQL di schema
└── Seed file yang terstruktur dan mudah di-maintain
```

> 📌 **Selanjutnya — Bagian III:** Setelah schema siap, waktunya memahami **Prisma Migrate** — sistem version control database yang memastikan setiap perubahan schema tercatat, bisa di-rollback, dan bisa direplikasi di environment lain (staging, production) dengan aman.

---

🚀 Lanjut ke [🚚 Bab 7 — Prisma Migrate — Dasar](/bagian-3/bab-7) untuk melanjutkan perjalanan!
