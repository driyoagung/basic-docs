---
title: "Bab 21 — Project: REST API Toko Online"
---

# 🏆 BAGIAN VIII — Project: REST API dengan Next.js + Prisma

> 🎯 **Tujuan:** Terapkan semua yang dipelajari dalam satu project
> REST API full stack yang production-ready.

---

# 📖 Bab 21 — Project: REST API Toko Online

---

### 21.1 🎯 Yang Akan Dibangun

```
REST API Toko Online:

Endpoint Publik (tanpa auth):
GET  /api/produk              → List produk + filter + pagination
GET  /api/produk/:id          → Detail produk
GET  /api/kategori            → List kategori
GET  /api/produk/search       → Pencarian produk

Endpoint Privat (butuh JWT):
POST   /api/auth/register     → Daftar user baru
POST   /api/auth/login        → Login → dapat token
GET    /api/profil             → Profil user yang login
POST   /api/produk            → Buat produk baru (admin)
PUT    /api/produk/:id        → Update produk (admin)
DELETE /api/produk/:id        → Hapus produk (admin)
POST   /api/ulasan/:produkId  → Beri ulasan produk
GET    /api/pesanan           → Riwayat pesanan user
POST   /api/pesanan           → Buat pesanan baru
```

---

### 21.2 📊 Schema Prisma Final Project

```prisma
// prisma/schema.prisma — Schema lengkap project

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum RoleUser {
  ADMIN
  PEMBELI
}

enum StatusPesanan {
  MENUNGGU_PEMBAYARAN
  DIBAYAR
  DIPROSES
  DIKIRIM
  SELESAI
  DIBATALKAN
}

model User {
  id          Int          @id @default(autoincrement())
  email       String       @unique
  nama        String
  password    String
  role        RoleUser     @default(PEMBELI)
  profil      Profil?
  pesanan     Pesanan[]
  ulasan      Ulasan[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  deletedAt   DateTime?    // Soft delete

  @@map("users")
  @@index([email])
}

model Profil {
  id       Int     @id @default(autoincrement())
  bio      String? @db.Text
  foto     String?
  telepon  String?
  alamat   String? @db.Text
  userId   Int     @unique
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profil")
}

model Kategori {
  id          Int       @id @default(autoincrement())
  nama        String    @unique
  slug        String    @unique
  deskripsi   String?
  produk      Produk[]
  createdAt   DateTime  @default(now())

  @@map("kategori")
  @@index([slug])
}

model Produk {
  id          Int           @id @default(autoincrement())
  nama        String
  slug        String        @unique
  deskripsi   String?       @db.Text
  harga       Decimal       @db.Decimal(12, 2)
  stok        Int           @default(0)
  gambar      String?
  aktif       Boolean       @default(true)
  kategoriId  Int
  kategori    Kategori      @relation(fields: [kategoriId], references: [id])
  tags        Tag[]
  ulasan      Ulasan[]
  itemPesanan ItemPesanan[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?

  @@map("produk")
  @@index([kategoriId])
  @@index([aktif, createdAt])
  @@index([nama])
}

model Tag {
  id     Int      @id @default(autoincrement())
  nama   String   @unique
  produk Produk[]

  @@map("tags")
}

model Ulasan {
  id        Int      @id @default(autoincrement())
  rating    Int      // 1-5
  komentar  String?  @db.Text
  userId    Int
  produkId  Int
  user      User     @relation(fields: [userId],   references: [id])
  produk    Produk   @relation(fields: [produkId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, produkId]) // Satu user hanya bisa ulasan satu kali per produk
  @@map("ulasan")
  @@index([produkId])
  @@index([rating])
}

model Pesanan {
  id          Int           @id @default(autoincrement())
  kodePesanan String        @unique @default(cuid())
  status      StatusPesanan @default(MENUNGGU_PEMBAYARAN)
  total       Decimal       @db.Decimal(12, 2)
  userId      Int
  user        User          @relation(fields: [userId], references: [id])
  items       ItemPesanan[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("pesanan")
  @@index([userId])
  @@index([status])
}

model ItemPesanan {
  id         Int     @id @default(autoincrement())
  jumlah     Int
  hargaSatuan Decimal @db.Decimal(12, 2)
  pesananId  Int
  produkId   Int
  pesanan    Pesanan @relation(fields: [pesananId], references: [id], onDelete: Cascade)
  produk     Produk  @relation(fields: [produkId],  references: [id])

  @@map("item_pesanan")
  @@index([pesananId])
}
```

---

### 21.3 📁 Struktur Project Final

```
toko-api/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── src/
│   ├── lib/
│   │   ├── prisma.ts         ← Singleton Prisma Client
│   │   └── jwt.ts            ← JWT helper
│   │
│   ├── repositories/
│   │   ├── produk.repository.ts
│   │   ├── user.repository.ts
│   │   └── pesanan.repository.ts
│   │
│   ├── services/
│   │   ├── produk.service.ts  ← Logika bisnis
│   │   ├── auth.service.ts
│   │   └── pesanan.service.ts
│   │
│   ├── validations/
│   │   ├── produk.schema.ts   ← Zod schemas
│   │   ├── auth.schema.ts
│   │   └── pesanan.schema.ts
│   │
│   └── api/                   ← Next.js Route Handlers
│       ├── auth/
│       │   ├── register/route.ts
│       │   └── login/route.ts
│       ├── produk/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── kategori/
│       │   └── route.ts
│       └── pesanan/
│           └── route.ts
│
├── .env
├── package.json
└── tsconfig.json
```

---

### 21.4 ✅ Checklist Sebelum Production

```
Schema & Migration:
☐ Semua @index sudah ditambahkan pada kolom yang sering di-query
☐ Foreign key @relation sudah dikonfigurasi onDelete yang tepat
☐ Enum dipakai untuk kolom dengan nilai terbatas
☐ prisma migrate status → semua migration sudah applied

Query:
☐ Tidak ada N+1 problem (pakai include/select bukan loop query)
☐ Semua findMany() punya take (pagination)
☐ select hanya field yang dibutuhkan
☐ Index ada untuk semua kolom yang sering difilter/diurutkan

Error Handling:
☐ Semua Prisma error di-handle (P2002, P2025, dll)
☐ Transaction dipakai untuk operasi yang atomik

Keamanan:
☐ DATABASE_URL ada di .env (tidak hard-coded)
☐ .env ada di .gitignore
☐ Raw query ($queryRaw) pakai template literal (bukan string biasa)
☐ Input user selalu divalidasi sebelum masuk ke Prisma
```

---

## 📊 Ringkasan Struktur Final

```
🔷 EBOOK PRISMA ORM — FROM RAW SQL TO TYPE-SAFE DATABASE
│
├── 🟢 BAGIAN I    — Mengenal Prisma & Setup          Bab 1  – 3
│   ├── Bab 1  ─ Mengenal Prisma ORM
│   ├── Bab 2  ─ Setup & Instalasi
│   └── Bab 3  ─ Prisma Client & Koneksi Pertama
│
├── 🔵 BAGIAN II   — Prisma Schema: Jantung Prisma     Bab 4  – 6
│   ├── Bab 4  ─ Data Model & Field Types
│   ├── Bab 5  ─ Relasi Antar Model
│   └── Bab 6  ─ Schema Lanjutan & Multi-Database
│
├── 🟡 BAGIAN III  — Prisma Migrate                    Bab 7  – 8
│   ├── Bab 7  ─ Prisma Migrate — Dasar
│   └── Bab 8  ─ Seeder & Data Awal
│
├── 🟠 BAGIAN IV   — Prisma Client: CRUD & Query       Bab 9  – 12
│   ├── Bab 9  ─ CREATE — Membuat Data
│   ├── Bab 10 ─ READ — Mengambil Data
│   ├── Bab 11 ─ UPDATE — Mengubah Data
│   └── Bab 12 ─ DELETE — Menghapus Data
│
├── 🔴 BAGIAN V    — Query Lanjutan & Relasi           Bab 13 – 15
│   ├── Bab 13 ─ Filtering & Operator Lengkap
│   ├── Bab 14 ─ Select & Include — Relasi Query
│   └── Bab 15 ─ Transactions & Raw Query
│
├── 🟣 BAGIAN VI   — Prisma Lanjutan                   Bab 16 – 18
│   ├── Bab 16 ─ Prisma Middleware & Extension
│   ├── Bab 17 ─ Validasi dengan Zod + Prisma
│   └── Bab 18 ─ Error Handling di Prisma
│
├── ⚫ BAGIAN VII  — Performa & Best Practices          Bab 19 – 20
│   ├── Bab 19 ─ Optimasi Query & Performa
│   └── Bab 20 ─ Best Practices & Pola Umum
│
└── 🏆 BAGIAN VIII — Project: API dengan Next.js        Bab 21
    └── Bab 21 ─ Project: REST API Toko Online

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total   :  8 Bagian  |  21 Bab
Target  :  Developer yang sudah pakai raw SQL
Database:  MySQL (utama) + PostgreSQL (perbandingan)
Bahasa  :  TypeScript
Project :  REST API Toko Online (Next.js + Prisma)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

*Ebook Prisma ORM — From Raw SQL to Type-Safe Database*
*Prisma 5 · TypeScript 5 · MySQL 8 · PostgreSQL 16 · Next.js 14*

---

🎉 **Selamat!** Anda telah menyelesaikan Ebook Prisma ORM — dari raw SQL menuju type-safe database. Kembali ke [Beranda](/) untuk review kembali.
