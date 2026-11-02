# 🔷 Ebook Prisma ORM — From Raw SQL to Type-Safe Database
### Panduan Lengkap Prisma | TypeScript · MySQL · PostgreSQL · Dari SQL ke ORM Modern

---

> 🎯 **Untuk Siapa Ebook Ini?**
> Anda yang sudah terbiasa menulis SQL mentah seperti
> `SELECT * FROM users WHERE id = ?` dan ingin beralih ke cara yang
> lebih **aman, ekspresif, dan modern** menggunakan Prisma ORM.
> Tidak ada yang diulang dari nol — kita langsung bandingkan
> cara lama (raw SQL) dengan cara baru (Prisma) di setiap topik.

---

> 🔄 **Raw SQL vs Prisma — Gambaran Awal**
>
> ```typescript
> // ❌ Raw SQL — yang sudah Anda tahu
> const [rows] = await pool.query(
>   'SELECT u.*, p.bio FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = ?',
>   [userId]
> )
> // rows tidak punya tipe — bisa salah akses kapan saja!
> // rows[0].emial → tidak ada error padahal typo!
>
> // ✅ Prisma — cara baru
> const user = await prisma.user.findUnique({
>   where:   { id: userId },
>   include: { profile: true },
> })
> // user.email → autocomplete & type-safe!
> // user.emial → ERROR saat compile! Typo langsung ketahuan.
> ```

---

> 🧰 **Tech Stack yang Digunakan**
>
> | Tool | Versi | Fungsi |
> |---|---|---|
> | **Prisma** | 5.x | ORM utama |
> | **TypeScript** | 5.x | Type safety |
> | **MySQL** | 8.x | Database utama |
> | **PostgreSQL** | 16.x | Database perbandingan |
> | **Node.js** | 20.x | Runtime |
> | **Prisma Studio** | Built-in | GUI database |
> | **ts-node / tsx** | Latest | Jalankan TypeScript |

---

## 🗺️ Peta Perjalanan Belajar

```
🟢 BAGIAN I    Mengenal Prisma & Setup               → Bab 1  – 3
🔵 BAGIAN II   Prisma Schema — Jantung Prisma         → Bab 4  – 6
🟡 BAGIAN III  Prisma Migrate — Versi Kontrol DB      → Bab 7  – 8
🟠 BAGIAN IV   Prisma Client — CRUD & Query           → Bab 9  – 12
🔴 BAGIAN V    Query Lanjutan & Relasi                → Bab 13 – 15
🟣 BAGIAN VI   Prisma Lanjutan                        → Bab 16 – 18
⚫ BAGIAN VII  Performa & Best Practices              → Bab 19 – 20
🏆 BAGIAN VIII Project: API dengan Next.js + Prisma   → Bab 21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 8 Bagian | 21 Bab | Raw SQL → Type-Safe ORM
```

---

## ⭐ Bab Paling Kritis

> ⚠️ **Empat bab ini adalah fondasi — semua bab lain bergantung padanya.**

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 4** — Data Model & Field Types | Schema adalah kontrak seluruh aplikasi — salah di sini berdampak ke mana-mana |
| 🥈 | **Bab 5** — Relasi Antar Model | Relasi yang salah = query yang salah & data yang corrupt |
| 🥉 | **Bab 9** — CRUD Dasar | Fondasi semua operasi database — wajib dikuasai sebelum query lanjutan |
| 🏅 | **Bab 13** — Filtering & Query Lanjutan | Di sinilah kekuatan Prisma sesungguhnya dibandingkan raw SQL |

---

## 💡 Mengapa Prisma? — Argumen untuk Developer SQL

> Anda mungkin bertanya: *"Saya sudah bisa SQL, kenapa harus pakai ORM?"*
> Berikut alasannya:

```
MASALAH RAW SQL YANG DIPECAHKAN PRISMA:

❌ Masalah 1: Tidak ada type safety
   const user = rows[0]
   user.emial    // Typo! Tapi tidak ada error — bug tersembunyi
   user.createdAt.toISOString() // Error runtime jika null!

✅ Solusi Prisma:
   const user = await prisma.user.findUnique(...)
   user.emial    // ERROR saat compile! Typo langsung ketahuan
   user?.createdAt?.toISOString() // TypeScript paksa handle null

---

❌ Masalah 2: String SQL rawan typo & SQL Injection
   const q = `SELECT * FROM users WHERE name = '${name}'`
   // name = "'; DROP TABLE users; --" → Database bisa dihapus!

✅ Solusi Prisma:
   prisma.user.findMany({ where: { name } })
   // Prisma otomatis pakai prepared statement — SQL Injection tidak mungkin!

---

❌ Masalah 3: Tidak ada schema terpusat
   Struktur tabel tersebar di berbagai file migration
   Tidak ada satu tempat untuk lihat "shape" data

✅ Solusi Prisma:
   prisma/schema.prisma → Satu file, semua model & relasi terlihat jelas

---

❌ Masalah 4: Autocomplete tidak ada
   Harus ingat nama kolom dari kepala

✅ Solusi Prisma:
   prisma.user. → IDE langsung tampilkan semua kolom yang tersedia!
```

---

---

# 🟢 BAGIAN I — Mengenal Prisma & Setup

> 🎯 **Tujuan:** Memahami apa itu Prisma, komponen-komponennya,
> dan setup project pertama dengan koneksi ke MySQL & PostgreSQL.

---

## 📖 Bab 1 — Mengenal Prisma ORM

---

### 1.1 🤔 Apa itu Prisma?

Prisma adalah **next-generation ORM** untuk Node.js dan TypeScript yang
terdiri dari tiga komponen utama yang bekerja bersama:

```
PRISMA TERDIRI DARI 3 KOMPONEN:

┌─────────────────────────────────────────────────────┐
│  1. PRISMA SCHEMA (prisma/schema.prisma)            │
│     → File deklaratif untuk mendefinisikan:         │
│       - Koneksi database                            │
│       - Model (tabel) dan field (kolom)             │
│       - Relasi antar tabel                          │
│       - Enum dan type custom                        │
└─────────────────────────────────────────────────────┘
           │ dibaca oleh
           ▼
┌─────────────────────────────────────────────────────┐
│  2. PRISMA MIGRATE                                  │
│     → Sistem migrasi database                       │
│       - Buat file SQL migration dari schema         │
│       - Lacak perubahan schema (version control)    │
│       - Jalankan & rollback migration               │
└─────────────────────────────────────────────────────┘
           │ menghasilkan
           ▼
┌─────────────────────────────────────────────────────┐
│  3. PRISMA CLIENT (@prisma/client)                  │
│     → Auto-generated, type-safe query builder       │
│       - CRUD operations                             │
│       - Filtering, sorting, pagination              │
│       - Relasi & join                               │
│       - Transaction                                 │
└─────────────────────────────────────────────────────┘
```

---

### 1.2 🆚 Prisma vs ORM Lain

| Aspek | Prisma | Sequelize | TypeORM | Mongoose |
|---|---|---|---|---|
| **Bahasa** | TypeScript-first | JS/TS | JS/TS | JS/TS |
| **Type Safety** | ✅ Sempurna | ⚠️ Parsial | ⚠️ Parsial | ⚠️ Parsial |
| **Schema** | File `.prisma` | Code-first / decorator | Decorator | Schema JS |
| **Autocomplete** | ✅ Excellent | ⚠️ Terbatas | ⚠️ Terbatas | ⚠️ Terbatas |
| **Migration** | ✅ Built-in | ✅ Ada | ✅ Ada | ❌ Tidak ada |
| **Database GUI** | ✅ Prisma Studio | ❌ Tidak ada | ❌ Tidak ada | ❌ Tidak ada |
| **Learning curve** | 🟢 Rendah | 🟡 Sedang | 🟡 Sedang | 🟢 Rendah |
| **Database** | SQL + MongoDB | SQL | SQL | MongoDB |

---

### 1.3 🗄️ Database yang Didukung Prisma

```
RELATIONAL (SQL):
├── MySQL / MariaDB     ← Fokus utama ebook ini
├── PostgreSQL          ← Dibahas sebagai perbandingan
├── SQLite              ← Untuk development/testing
├── Microsoft SQL Server
└── CockroachDB

NON-RELATIONAL:
└── MongoDB             ← Support via Prisma Client Extension
```

---

### 1.4 📊 Alur Kerja Prisma — Gambaran Besar

```
Developer menulis/update schema.prisma
              │
              ▼
    npx prisma migrate dev
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
File SQL migration    npx prisma generate
dibuat & dijalankan        │
ke database                ▼
                  Prisma Client di-generate
                  (node_modules/@prisma/client)
                           │
                           ▼
                  Developer pakai PrismaClient
                  untuk query database dengan
                  type safety penuh
```

---

## 📖 Bab 2 — Setup & Instalasi

---

### 2.1 📦 Instalasi Prisma

```bash
# Buat project Node.js baru
mkdir belajar-prisma
cd belajar-prisma
npm init -y

# Install TypeScript & tools
npm install -D typescript ts-node @types/node tsx
npx tsc --init

# Install Prisma CLI (sebagai dev dependency)
npm install -D prisma

# Install Prisma Client (sebagai dependency)
npm install @prisma/client

# Inisialisasi Prisma dengan MySQL
npx prisma init --datasource-provider mysql

# Atau dengan PostgreSQL
npx prisma init --datasource-provider postgresql
```

---

### 2.2 📁 Struktur Folder Setelah Init

```
belajar-prisma/
│
├── 📁 prisma/
│   └── 📄 schema.prisma     ← File schema utama Prisma
│
├── 📄 .env                  ← Database URL (JANGAN commit ke Git!)
├── 📄 .gitignore            ← Tambahkan .env & node_modules
├── 📄 tsconfig.json         ← Konfigurasi TypeScript
└── 📄 package.json
```

---

### 2.3 🔌 Konfigurasi Koneksi Database

```bash
# .env — Format DATABASE_URL

# MySQL
DATABASE_URL="mysql://username:password@localhost:3306/nama_database"
# Contoh:
DATABASE_URL="mysql://root:password123@localhost:3306/toko_db"

# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/nama_database"
# Contoh:
DATABASE_URL="postgresql://postgres:password123@localhost:5432/toko_db"

# PostgreSQL dengan SSL (untuk cloud DB)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# MySQL dengan opsi tambahan
DATABASE_URL="mysql://root:pass@localhost:3306/db?connection_limit=10&pool_timeout=20"
```

> ⚠️ **Penting:** Selalu tambahkan `.env` ke `.gitignore`!
> Database credentials adalah data sensitif yang tidak boleh masuk ke repository.

---

### 2.4 📄 File `schema.prisma` Pertama

```prisma
// prisma/schema.prisma

// ① Generator — Prisma Client apa yang di-generate
generator client {
  provider = "prisma-client-js"
  // output   = "../src/generated/prisma" // Opsional: custom output path
}

// ② Datasource — Koneksi ke database
datasource db {
  provider = "mysql"      // "mysql" | "postgresql" | "sqlite"
  url      = env("DATABASE_URL")  // Baca dari .env
}

// ③ Model — Definisi tabel (dibahas detail di Bab 4)
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### 2.5 🔧 Setup `tsconfig.json`

```json
// tsconfig.json
{
  "compilerOptions": {
    "target":           "ES2020",
    "lib":              ["ES2020"],
    "module":           "CommonJS",
    "moduleResolution": "node",
    "outDir":           "./dist",
    "rootDir":          "./src",
    "strict":           true,
    "esModuleInterop":  true,
    "skipLibCheck":     true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "prisma/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### 2.6 🛠️ Script di `package.json`

```json
{
  "scripts": {
    "dev":             "tsx watch src/index.ts",
    "build":           "tsc",
    "start":           "node dist/index.js",

    "db:push":         "prisma db push",
    "db:migrate":      "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio":       "prisma studio",
    "db:seed":         "tsx prisma/seed.ts",
    "db:reset":        "prisma migrate reset",
    "db:generate":     "prisma generate",
    "db:format":       "prisma format"
  }
}
```

---

## 📖 Bab 3 — Prisma Client & Koneksi Pertama

---

### 3.1 🔌 Membuat Instance Prisma Client

```typescript
// src/lib/prisma.ts
// Singleton pattern — WAJIB untuk menghindari "too many connections"!

import { PrismaClient } from '@prisma/client'

// Di development: hot reload bisa buat banyak instance
// Singleton mencegah ini dengan simpan instance di global scope
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']  // Log semua di development
      : ['error'],                            // Hanya error di production
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

### 3.2 🚀 Test Koneksi Pertama

```typescript
// src/index.ts

import { prisma } from './lib/prisma'

async function main() {
  try {
    // Test koneksi dengan query sederhana
    await prisma.$connect()
    console.log('✅ Berhasil terhubung ke database!')

    // Query pertama
    const userCount = await prisma.user.count()
    console.log(`📊 Jumlah user di database: ${userCount}`)

  } catch (error) {
    console.error('❌ Gagal terhubung:', error)
    process.exit(1)
  } finally {
    // Selalu tutup koneksi saat selesai
    await prisma.$disconnect()
  }
}

main()
```

```bash
# Jalankan file TypeScript
npx tsx src/index.ts
```

---

### 3.3 🖥️ Prisma Studio — GUI Database

```bash
# Buka Prisma Studio di browser
npx prisma studio
# Otomatis buka: http://localhost:5555

# Fitur Prisma Studio:
# ✅ Lihat semua data dalam tabel dengan tampilan yang rapi
# ✅ Tambah, edit, hapus data secara visual
# ✅ Filter dan sort data
# ✅ Explore relasi antar tabel
# ✅ Export data
```

> 💡 **Prisma Studio** adalah pengganti tools seperti phpMyAdmin atau pgAdmin
> yang lebih modern dan otomatis mengerti schema Prisma Anda.

---

### 3.4 📋 Perintah Prisma CLI Lengkap

```bash
# === SCHEMA ===
npx prisma format          # Format & beautify schema.prisma
npx prisma validate        # Validasi schema tanpa apply ke DB

# === GENERATE ===
npx prisma generate        # Generate Prisma Client dari schema
                           # Harus dijalankan setiap schema berubah!

# === DATABASE ===
npx prisma db push         # Push schema ke DB TANPA migration file
                           # Cocok untuk prototyping cepat

npx prisma db pull         # Tarik schema dari DB yang sudah ada
                           # (Introspection — untuk project yang sudah punya DB)

npx prisma db seed         # Jalankan seeder

# === MIGRATE ===
npx prisma migrate dev     # Buat migration file + jalankan ke DB
npx prisma migrate deploy  # Jalankan migration yang pending (production)
npx prisma migrate reset   # Drop semua tabel + jalankan ulang semua migration
npx prisma migrate status  # Lihat status migration

# === STUDIO ===
npx prisma studio          # Buka GUI database di browser
```

---

---

# 🔵 BAGIAN II — Prisma Schema: Jantung Prisma

> 🎯 **Tujuan:** Menguasai Prisma Schema Language (PSL) secara menyeluruh —
> dari field types hingga relasi yang kompleks.
> Schema yang baik adalah fondasi aplikasi yang baik.

---

## 📖 Bab 4 — Data Model & Field Types

---

### 4.1 🏗️ Anatomi Sebuah Model

```prisma
// Setiap bagian dari model Prisma:

model Produk {
//  ①     ②        ③           ④
  id       Int      @id         @default(autoincrement())
  nama     String
  harga    Decimal  @db.Decimal(12, 2)
  deskripsi String? // ← ? berarti nullable (boleh null)
  stok     Int      @default(0)
  aktif    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Field computed (tidak ada di DB, hanya Prisma)
  // Tidak ada di Prisma — computed dilakukan di aplikasi

  // ⑤ Attribute level model
  @@map("produk")         // Nama tabel berbeda dari nama model
  @@index([nama])         // Index untuk performa query
  @@unique([nama, slug])  // Kombinasi unique
}

// ① Nama field (camelCase di Prisma, snake_case di DB via @map)
// ② Tipe data Prisma
// ③ Attribute field (@id, @unique, @default, @relation, dll)
// ④ Argumen attribute
// ⑤ Attribute level model (@@id, @@unique, @@index, @@map)
```

---

### 4.2 📊 Semua Field Types Prisma

```prisma
model ContohTipeData {
  id Int @id @default(autoincrement())

  // === STRING ===
  nama         String           // VARCHAR(191) di MySQL, TEXT di PostgreSQL
  kode         String  @db.Char(10)   // CHAR(10) — panjang tetap
  deskripsi    String  @db.Text       // TEXT — teks panjang
  kontenPanjang String @db.LongText   // LONGTEXT — MySQL saja
  bio          String? // Nullable string

  // === ANGKA ===
  umur         Int              // INTEGER
  stok         Int     @db.UnsignedInt // MySQL: hanya positif
  idBesar      BigInt           // BIGINT (untuk ID yang sangat besar)
  harga        Decimal @db.Decimal(12, 2) // Presisi tinggi untuk uang
  rating       Float            // FLOAT/DOUBLE (kurang presisi)
  persentase   Float   @db.DoublePrecision // PostgreSQL

  // === BOOLEAN ===
  aktif        Boolean @default(true)  // TINYINT(1) di MySQL, BOOLEAN di PG

  // === TANGGAL & WAKTU ===
  tanggalLahir DateTime @db.Date          // DATE (tanpa jam)
  dibuatPada   DateTime @default(now())   // DATETIME/TIMESTAMP
  diperbaruiPada DateTime @updatedAt      // Auto-update saat record berubah
  jamBuka      DateTime @db.Time          // TIME (jam saja)

  // === JSON ===
  // MySQL 5.7.8+ dan PostgreSQL mendukung JSON native
  metadata    Json?                       // JSON column
  tags        Json    @default("[]")      // JSON array

  // === BYTES ===
  gambar      Bytes?                      // BLOB — simpan file binary

  // Hanya di PostgreSQL:
  // uuid        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
}
```

---

### 4.3 🔑 Primary Key — Berbagai Opsi

```prisma
// ① Auto-increment integer (paling umum, MySQL)
model User {
  id Int @id @default(autoincrement())
}

// ② Auto-increment bigint (untuk data sangat besar)
model Log {
  id BigInt @id @default(autoincrement())
}

// ③ CUID — ID string unik yang aman (cross-database)
model Post {
  id String @id @default(cuid())
  // Contoh: clh3zpf0w0000356yq8tuf7yx
}

// ④ UUID — Standard universal unique ID
model Token {
  id String @id @default(uuid())
  // Contoh: 550e8400-e29b-41d4-a716-446655440000
}

// ⑤ Composite primary key (dua kolom jadi satu PK)
model PesananItem {
  pesananId Int
  produkId  Int
  jumlah    Int

  @@id([pesananId, produkId]) // PK terdiri dari dua kolom
}

// ⑥ Custom ID (nilai diisi manual dari aplikasi)
model Konfigurasi {
  kunci String @id  // Nilai diisi manual, contoh: "APP_NAME", "MAX_UPLOAD"
  nilai String
}
```

---

### 4.4 🏷️ Field Attributes — Semua yang Perlu Diketahui

```prisma
model Contoh {
  // @id — Primary key
  id Int @id @default(autoincrement())

  // @unique — Nilai harus unik di seluruh tabel
  email String @unique

  // @default — Nilai default
  status   String   @default("active")
  aktif    Boolean  @default(true)
  stok     Int      @default(0)
  createdAt DateTime @default(now())    // Waktu saat record dibuat
  updatedAt DateTime @updatedAt         // Auto-update saat record diubah

  // @map — Nama kolom berbeda antara Prisma dan database
  namaLengkap String @map("nama_lengkap")
  // Di Prisma pakai camelCase: namaLengkap
  // Di database kolom bernama: nama_lengkap

  // @db — Native database type
  harga Decimal @db.Decimal(10, 2)
  bio   String  @db.Text

  // @updatedAt — Otomatis diupdate saat record berubah
  diperbarui DateTime @updatedAt

  // @ignore — Field ini ada di DB tapi diabaikan Prisma Client
  fieldLama String @ignore

  // @@map — Nama tabel berbeda antara Prisma dan database
  @@map("tabel_contoh")  // Di DB namanya "tabel_contoh", di Prisma "Contoh"

  // @@unique — Kombinasi kolom yang harus unik
  @@unique([email, namaLengkap])

  // @@index — Buat index untuk performa query
  @@index([email])
  @@index([createdAt, status])  // Composite index
}
```

---

### 4.5 🔢 Enum — Nilai Terbatas

```prisma
// Definisikan Enum
enum StatusPesanan {
  MENUNGGU_PEMBAYARAN
  DIBAYAR
  DIPROSES
  DIKIRIM
  SELESAI
  DIBATALKAN
}

enum RoleUser {
  ADMIN
  EDITOR
  PEMBACA

  @@map("role_user") // Nama di database
}

// Gunakan Enum di model
model Pesanan {
  id     Int           @id @default(autoincrement())
  status StatusPesanan @default(MENUNGGU_PEMBAYARAN)
}

model User {
  id   Int      @id @default(autoincrement())
  role RoleUser @default(PEMBACA)
}
```

```typescript
// Penggunaan di TypeScript — Prisma generate enum sebagai TypeScript enum
import { PrismaClient, StatusPesanan, RoleUser } from '@prisma/client'

const pesanan = await prisma.pesanan.findMany({
  where: { status: StatusPesanan.DIPROSES }
})

// Type safety: tidak bisa salah ketik!
// StatusPesanan.DIPROSES  ✅
// StatusPesanan.DIKERJAKAN ❌ Error compile!
```

---

## 📖 Bab 5 — Relasi Antar Model

---

### 5.1 🔗 One to One (Satu ke Satu)

```prisma
// Setiap User punya tepat satu Profil

model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  profil  Profil?  // Relasi ke Profil (opsional — user bisa belum punya profil)
}

model Profil {
  id      Int    @id @default(autoincrement())
  bio     String?
  foto    String?
  userId  Int    @unique  // ← @unique memastikan satu user = satu profil
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  //              ①                   ②                  ③          ④
  // ① @relation  → Deklarasi ini adalah kolom relasi
  // ② fields     → Kolom di tabel INI yang jadi foreign key
  // ③ references → Kolom di tabel LAIN yang dirujuk
  // ④ onDelete   → Apa yang terjadi saat User dihapus:
  //                Cascade = Profil ikut terhapus
  //                SetNull = userId jadi null
  //                Restrict = User tidak bisa dihapus jika punya Profil
}
```

```typescript
// Penggunaan:

// Buat user + profil sekaligus
const user = await prisma.user.create({
  data: {
    email: 'budi@email.com',
    profil: {
      create: { bio: 'Developer', foto: 'foto.jpg' }
    }
  },
  include: { profil: true }
})

// Ambil user beserta profilnya
const user = await prisma.user.findUnique({
  where:   { id: 1 },
  include: { profil: true }
})
user?.profil?.bio // Type-safe!
```

---

### 5.2 📚 One to Many (Satu ke Banyak)

```prisma
// Satu Kategori punya banyak Produk

model Kategori {
  id     Int      @id @default(autoincrement())
  nama   String   @unique
  slug   String   @unique
  produk Produk[] // Array → satu kategori bisa punya banyak produk
}

model Produk {
  id          Int       @id @default(autoincrement())
  nama        String
  harga       Decimal   @db.Decimal(12, 2)
  kategoriId  Int
  kategori    Kategori  @relation(fields: [kategoriId], references: [id])
  // kolom kategoriId adalah foreign key yang menunjuk ke Kategori.id
}
```

```typescript
// Penggunaan:

// Buat kategori + produk sekaligus
const elektronik = await prisma.kategori.create({
  data: {
    nama: 'Elektronik',
    slug: 'elektronik',
    produk: {
      create: [
        { nama: 'Laptop ASUS', harga: 15000000 },
        { nama: 'Mouse Logitech', harga: 250000 },
      ]
    }
  },
  include: { produk: true }
})

// Ambil kategori dengan semua produknya
const kategori = await prisma.kategori.findUnique({
  where:   { slug: 'elektronik' },
  include: {
    produk: {
      orderBy: { harga: 'asc' },
      take:    5,
    }
  }
})

// Ambil produk beserta kategorinya
const produk = await prisma.produk.findMany({
  include: { kategori: true }
})
produk[0].kategori.nama // "Elektronik"
```

---

### 5.3 🔄 Many to Many (Banyak ke Banyak)

```prisma
// Produk bisa punya banyak Tag, Tag bisa ada di banyak Produk

// ① IMPLICIT Many-to-Many (Prisma buat tabel pivot otomatis)
model Produk {
  id   Int    @id @default(autoincrement())
  nama String
  tags Tag[]  // Relasi implisit
}

model Tag {
  id   Int      @id @default(autoincrement())
  nama String   @unique
  produk Produk[] // Relasi implisit
}
// Prisma otomatis buat tabel _ProdukToTag di database

// ---

// ② EXPLICIT Many-to-Many (pakai model pivot — lebih fleksibel!)
// Gunakan ini jika tabel pivot punya kolom tambahan
model Produk {
  id     Int            @id @default(autoincrement())
  nama   String
  tags   ProdukTag[]    // Relasi via model pivot
}

model Tag {
  id      Int         @id @default(autoincrement())
  nama    String      @unique
  produk  ProdukTag[] // Relasi via model pivot
}

// Model pivot eksplisit — bisa punya kolom tambahan!
model ProdukTag {
  produkId  Int
  tagId     Int
  dibuatPada DateTime @default(now()) // Kolom tambahan!
  urutan    Int       @default(0)     // Kolom tambahan!

  produk    Produk @relation(fields: [produkId], references: [id], onDelete: Cascade)
  tag       Tag    @relation(fields: [tagId],    references: [id], onDelete: Cascade)

  @@id([produkId, tagId])  // Composite PK
}
```

```typescript
// Penggunaan implicit many-to-many:
const produk = await prisma.produk.create({
  data: {
    nama: 'Laptop Gaming',
    tags: {
      connect:       [{ id: 1 }, { id: 2 }],   // Hubungkan dengan tag yang ada
      connectOrCreate: [{                         // Hubungkan atau buat jika belum ada
        where:  { nama: 'gaming' },
        create: { nama: 'gaming' }
      }]
    }
  },
  include: { tags: true }
})

// Disconnect (hapus dari pivot tapi tidak hapus data asli)
await prisma.produk.update({
  where: { id: 1 },
  data:  { tags: { disconnect: [{ id: 2 }] } }
})
```

---

### 5.4 ↩️ Self-Relation — Model Berelasi dengan Diri Sendiri

```prisma
// Contoh: Kategori bisa punya sub-kategori
model Kategori {
  id          Int        @id @default(autoincrement())
  nama        String
  parentId    Int?       // null berarti ini adalah root kategori
  parent      Kategori?  @relation("SubKategori", fields: [parentId], references: [id])
  children    Kategori[] @relation("SubKategori")
}

// Contoh: User bisa punya banyak follower (social media)
model User {
  id          Int     @id @default(autoincrement())
  nama        String
  // User yang di-follow oleh user ini
  mengikuti   User[]  @relation("UserMengikuti")
  // User yang mengikuti user ini
  diikutiOleh User[]  @relation("UserMengikuti")
}
```

---

### 5.5 🔀 Referential Actions — onDelete & onUpdate

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id      Int  @id @default(autoincrement())
  userId  Int
  user    User @relation(
    fields:    [userId],
    references: [id],
    onDelete:  Cascade,   // ← Pilihan onDelete
    onUpdate:  Cascade,   // ← Pilihan onUpdate
  )
}
```

| Action | Penjelasan | Kapan Dipakai |
|---|---|---|
| `Cascade` | Record ikut terhapus/diupdate | Ketika child tidak berguna tanpa parent |
| `SetNull` | FK di-set null | Ketika child bisa berdiri sendiri |
| `SetDefault` | FK di-set ke default value | Jarang dipakai |
| `Restrict` | Error jika ada child — parent tidak bisa dihapus | Proteksi data penting |
| `NoAction` | Seperti Restrict tapi cek di akhir transaction | PostgreSQL/SQLite |

---

## 📖 Bab 6 — Schema Lanjutan & Multi-Database

---

### 6.1 🔤 Naming Conventions — Prisma vs Database

```prisma
// Best practice: Prisma pakai PascalCase & camelCase
// Database pakai snake_case
// Gunakan @map dan @@map untuk bridging!

model UserProfil {          // PascalCase di Prisma
  id          Int      @id @default(autoincrement())
  namaDepan   String   @map("nama_depan")    // snake_case di DB
  namaBelakang String  @map("nama_belakang")
  userId      Int      @unique @map("user_id")
  user        User     @relation(fields: [userId], references: [id])
  dibuatPada  DateTime @default(now()) @map("dibuat_pada")

  @@map("user_profil")   // Nama tabel di DB: "user_profil"
}
// Di Prisma: prisma.userProfil.findMany()
// Di DB: SELECT * FROM user_profil
```

---

### 6.2 🆚 Perbedaan MySQL vs PostgreSQL di Schema

```prisma
// Beberapa @db types berbeda antara MySQL dan PostgreSQL:

// ① Auto-increment
// MySQL:
id Int @id @default(autoincrement())

// PostgreSQL (tambahan: bisa pakai SERIAL atau IDENTITY):
id Int      @id @default(autoincrement())
id BigInt   @id @default(autoincrement())

// ② UUID sebagai PK
// MySQL:
id String @id @default(uuid()) @db.Char(36)

// PostgreSQL (lebih native):
id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

// ③ JSON
// MySQL (JSON column):
data Json?

// PostgreSQL (JsonB — lebih cepat & bisa di-index):
data Json? @db.JsonB

// ④ String length default
// MySQL: String → VARCHAR(191) — batas karena utf8mb4 index
// PostgreSQL: String → TEXT (tidak ada batas)
nama String           // MySQL: VARCHAR(191) | PG: TEXT
nama String @db.VarChar(255)  // Eksplisit di keduanya
```

---

---

# 🟡 BAGIAN III — Prisma Migrate: Version Control Database

> 🎯 **Tujuan:** Menguasai sistem migrasi Prisma untuk mengelola
> perubahan schema database dengan aman dan terstruktur.

---

## 📖 Bab 7 — Prisma Migrate — Dasar

---

### 7.1 🆚 `db push` vs `migrate dev` — Kapan Pakai Yang Mana?

```
prisma db push:
├── Push schema langsung ke database
├── TIDAK membuat file migration
├── Cocok untuk: prototyping, development awal, schema yang sering berubah
├── ⚠️ Tidak cocok untuk production — tidak ada history
└── Jalankan: npx prisma db push

prisma migrate dev:
├── Buat file SQL migration dari perubahan schema
├── Simpan history perubahan database
├── Cocok untuk: semua stage (dev, staging, production)
├── ✅ Cara yang direkomendasikan
└── Jalankan: npx prisma migrate dev --name nama_migrasi
```

---

### 7.2 📁 Struktur File Migration

```
prisma/
├── schema.prisma
└── migrations/
    ├── 20240115120000_init/
    │   └── migration.sql        ← SQL yang dijalankan
    ├── 20240116093000_tambah_profil/
    │   └── migration.sql
    ├── 20240120141500_tambah_kategori_produk/
    │   └── migration.sql
    └── migration_lock.toml      ← Lock file — jangan edit manual!
```

```sql
-- Contoh isi migration.sql yang di-generate Prisma
-- prisma/migrations/20240115120000_init/migration.sql

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 7.3 🔄 Alur Kerja Migration

```bash
# Step 1: Edit schema.prisma (tambah model/field/relasi)

# Step 2: Buat dan jalankan migration
npx prisma migrate dev --name tambah_model_produk
# Ini akan:
# - Deteksi perubahan dari schema terakhir
# - Generate file SQL migration
# - Jalankan SQL ke database
# - Generate ulang Prisma Client

# Step 3: Verifikasi di database / Prisma Studio
npx prisma studio

# Step 4: Commit semua file ke Git
git add prisma/
git commit -m "feat: tambah model Produk"
```

---

### 7.4 ⏪ Reset & Rollback

```bash
# Reset semua migration (HAPUS semua data!)
# Hanya untuk development!
npx prisma migrate reset

# Lihat status migration
npx prisma migrate status
# Output:
# 3 migrations found in prisma/migrations
# ✔ 20240115120000_init
# ✔ 20240116093000_tambah_profil
# ✗ 20240120141500_tambah_kategori_produk  ← Belum dijalankan!

# Deploy migration yang pending (untuk production)
npx prisma migrate deploy
```

---

## 📖 Bab 8 — Seeder & Data Awal

---

### 8.1 🌱 Membuat Seeder

```typescript
// prisma/seed.ts

import { PrismaClient, RoleUser } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai seeding...')

  // Bersihkan data lama (urutan penting! Hapus child dulu)
  await prisma.produk.deleteMany()
  await prisma.kategori.deleteMany()
  await prisma.user.deleteMany()

  // ① Buat users
  const adminUser = await prisma.user.upsert({
    where:  { email: 'admin@toko.com' },
    update: {},  // Jika sudah ada, tidak perlu update
    create: {
      email:    'admin@toko.com',
      nama:     'Administrator',
      password: await bcrypt.hash('password123', 12),
      role:     RoleUser.ADMIN,
    },
  })

  const editorUser = await prisma.user.upsert({
    where:  { email: 'editor@toko.com' },
    update: {},
    create: {
      email:    'editor@toko.com',
      nama:     'Editor Produk',
      password: await bcrypt.hash('password123', 12),
      role:     RoleUser.EDITOR,
    },
  })

  // ② Buat kategori
  const kategoris = await Promise.all([
    prisma.kategori.upsert({
      where:  { slug: 'elektronik' },
      update: {},
      create: { nama: 'Elektronik', slug: 'elektronik' },
    }),
    prisma.kategori.upsert({
      where:  { slug: 'fashion' },
      update: {},
      create: { nama: 'Fashion', slug: 'fashion' },
    }),
  ])

  // ③ Buat produk
  const produkData = [
    { nama: 'Laptop ASUS ROG',    harga: 15000000, stok: 10, kategoriId: kategoris[0].id },
    { nama: 'Mouse Logitech G402', harga: 350000,  stok: 50, kategoriId: kategoris[0].id },
    { nama: 'Kemeja Batik',       harga: 150000,   stok: 30, kategoriId: kategoris[1].id },
  ]

  for (const data of produkData) {
    await prisma.produk.create({ data })
  }

  console.log('✅ Seeding selesai!')
  console.log(`   - ${await prisma.user.count()} users dibuat`)
  console.log(`   - ${await prisma.kategori.count()} kategori dibuat`)
  console.log(`   - ${await prisma.produk.count()} produk dibuat`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

```json
// package.json — daftarkan seeder
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

```bash
# Jalankan seeder
npx prisma db seed

# Reset + migrate + seed sekaligus
npx prisma migrate reset
# (migrate reset otomatis jalankan seed jika dikonfigurasi)
```

---

---

# 🟠 BAGIAN IV — Prisma Client: CRUD & Query Dasar

> 🎯 **Tujuan:** Menguasai semua operasi CRUD dengan Prisma Client
> dan memahami perbedaannya dengan raw SQL yang sudah Anda tahu.

---

## 📖 Bab 9 — CREATE — Membuat Data

---

### 9.1 ✏️ `create()` — Buat Satu Record

```typescript
import { prisma } from './lib/prisma'

// SQL yang setara: INSERT INTO produk (nama, harga, stok) VALUES (?, ?, ?)

// ① create() dasar
const produkBaru = await prisma.produk.create({
  data: {
    nama:       'Laptop Gaming ASUS ROG',
    harga:      15000000,
    stok:       5,
    kategoriId: 1,
  },
})
// produkBaru.id   → ID yang baru di-generate
// produkBaru.nama → 'Laptop Gaming ASUS ROG'
// produkBaru.harga → Prisma kembalikan sebagai Decimal object

// ② create() dengan relasi — buat parent + child sekaligus
const kategoriDenganProduk = await prisma.kategori.create({
  data: {
    nama: 'Elektronik',
    slug: 'elektronik',
    produk: {
      create: [
        { nama: 'Laptop', harga: 15000000, stok: 5 },
        { nama: 'Mouse',  harga: 250000,   stok: 20 },
      ]
    }
  },
  include: { produk: true } // Return juga produk yang baru dibuat
})

// ③ create() dengan connect — hubungkan ke record yang sudah ada
const produk = await prisma.produk.create({
  data: {
    nama:      'Keyboard Mekanikal',
    harga:     800000,
    stok:      15,
    kategori: {
      connect: { id: 1 } // Hubungkan ke kategori yang sudah ada
      // atau connect: { slug: 'elektronik' } — bisa pakai field @unique
    }
  }
})
```

---

### 9.2 📋 `createMany()` — Buat Banyak Record Sekaligus

```typescript
// SQL: INSERT INTO produk (nama, harga) VALUES (?, ?), (?, ?), (?, ?)

const result = await prisma.produk.createMany({
  data: [
    { nama: 'Produk A', harga: 100000, stok: 10, kategoriId: 1 },
    { nama: 'Produk B', harga: 200000, stok: 5,  kategoriId: 1 },
    { nama: 'Produk C', harga: 300000, stok: 8,  kategoriId: 2 },
  ],
  skipDuplicates: true, // Lewati jika ada duplikasi (tidak error)
})

console.log(result.count) // Jumlah record yang berhasil dibuat

// ⚠️ createMany() TIDAK mendukung:
// - include (tidak bisa return relasi)
// - Nested create (tidak bisa buat relasi bersamaan)
```

---

### 9.3 🔄 `upsert()` — Buat atau Update

```typescript
// Jika ada → update, jika tidak ada → buat baru
// SQL: INSERT ... ON DUPLICATE KEY UPDATE ...

const user = await prisma.user.upsert({
  where:  { email: 'budi@email.com' }, // Kondisi cari

  update: {                              // Jika DITEMUKAN → update ini
    nama:      'Budi Santoso Updated',
    updatedAt: new Date(),
  },

  create: {                              // Jika TIDAK DITEMUKAN → buat ini
    email:    'budi@email.com',
    nama:     'Budi Santoso',
    password: 'hashed_password',
  },
})
```

---

## 📖 Bab 10 — READ — Mengambil Data

---

### 10.1 🔍 `findUnique()` & `findFirst()`

```typescript
// findUnique() — Cari berdasarkan @id atau @unique field
// HANYA bisa pakai field yang memiliki @id atau @unique!
// SQL: SELECT * FROM produk WHERE id = ? LIMIT 1

const produk = await prisma.produk.findUnique({
  where: { id: 1 }
  // atau: where: { slug: 'laptop-gaming-asus' } — jika slug @unique
})
// produk bisa null jika tidak ditemukan!
// TypeScript tahu: produk: Produk | null

// Handle null dengan aman
if (!produk) throw new Error('Produk tidak ditemukan')
console.log(produk.nama) // Aman karena sudah cek null

// ---

// findFirstOrThrow() — Throw error jika tidak ditemukan
const produk = await prisma.produk.findUniqueOrThrow({
  where: { id: 999 }
})
// Throw PrismaClientKnownRequestError jika tidak ada
// Tidak perlu cek null manual!

// ---

// findFirst() — Ambil satu berdasarkan kondisi apapun
// SQL: SELECT * FROM produk WHERE harga > ? ORDER BY createdAt DESC LIMIT 1
const produkTermahal = await prisma.produk.findFirst({
  where:   { harga: { gt: 1000000 } },
  orderBy: { harga: 'desc' },
})
```

---

### 10.2 📋 `findMany()` — Ambil Banyak Data

```typescript
// SQL: SELECT * FROM produk ORDER BY createdAt DESC LIMIT 10 OFFSET 0

// ① Dasar
const semuaProduk = await prisma.produk.findMany()

// ② Dengan opsi lengkap
const produk = await prisma.produk.findMany({
  // WHERE
  where: {
    aktif:  true,
    stok:   { gt: 0 }, // stok > 0
  },

  // SELECT — hanya ambil field yang dibutuhkan
  select: {
    id:    true,
    nama:  true,
    harga: true,
    // stok, deskripsi, dll tidak diambil → query lebih efisien
  },

  // ORDER BY
  orderBy: [
    { harga: 'asc' },       // Urutkan harga dari termurah
    { nama:  'asc' },       // Jika harga sama, urutkan nama A-Z
  ],

  // PAGINATION
  skip: 0,   // Lewati 0 record (halaman 1)
  take: 10,  // Ambil 10 record

  // INCLUDE RELASI
  include: {
    kategori: true,
    tags:     true,
  },
})

// Pagination helper
const halaman = 2
const perPage = 10
const produk = await prisma.produk.findMany({
  skip: (halaman - 1) * perPage,
  take: perPage,
})
```

---

### 10.3 📊 `count()`, `aggregate()`, `groupBy()`

```typescript
// COUNT
// SQL: SELECT COUNT(*) FROM produk WHERE aktif = true
const totalProdukAktif = await prisma.produk.count({
  where: { aktif: true }
})

// AGGREGATE — min, max, sum, avg, count
// SQL: SELECT MIN(harga), MAX(harga), AVG(harga), SUM(stok) FROM produk
const statistik = await prisma.produk.aggregate({
  where:   { aktif: true },
  _min:    { harga: true },
  _max:    { harga: true },
  _avg:    { harga: true },
  _sum:    { stok: true },
  _count:  { id: true },
})

console.log(statistik._min.harga)    // Harga termurah
console.log(statistik._max.harga)    // Harga termahal
console.log(statistik._avg.harga)    // Rata-rata harga
console.log(statistik._sum.stok)     // Total stok
console.log(statistik._count.id)     // Jumlah produk

// GROUP BY
// SQL: SELECT kategori_id, COUNT(*), AVG(harga) FROM produk GROUP BY kategori_id
const perKategori = await prisma.produk.groupBy({
  by:      ['kategoriId'],
  where:   { aktif: true },
  _count:  { id: true },
  _avg:    { harga: true },
  _sum:    { stok: true },
  having:  { stok: { _sum: { gt: 10 } } }, // HAVING SUM(stok) > 10
  orderBy: { _count: { id: 'desc' } },
})

perKategori.forEach(grup => {
  console.log(`Kategori ${grup.kategoriId}: ${grup._count.id} produk`)
})
```

---

## 📖 Bab 11 — UPDATE — Mengubah Data

---

### 11.1 🔄 `update()` & `updateMany()`

```typescript
// update() — Update satu record berdasarkan @id atau @unique
// SQL: UPDATE produk SET nama = ?, harga = ? WHERE id = ?

const produkDiupdate = await prisma.produk.update({
  where: { id: 1 },
  data: {
    nama:  'Laptop Gaming ASUS ROG Updated',
    harga: 14500000,
  },
})

// Atomic operations — lebih aman dari race condition!
// SQL: UPDATE produk SET stok = stok + 5 WHERE id = ?
const produkRestock = await prisma.produk.update({
  where: { id: 1 },
  data:  { stok: { increment: 5 } }  // stok + 5
})

const produkTerjual = await prisma.produk.update({
  where: { id: 1 },
  data:  { stok: { decrement: 1 } }  // stok - 1
})

// Operasi numerik lain:
// { multiply: 2 }  → stok * 2
// { divide: 2 }    → stok / 2
// { set: 100 }     → stok = 100 (sama dengan biasa)

// ---

// updateMany() — Update banyak record sekaligus
// SQL: UPDATE produk SET aktif = false WHERE stok = 0
const result = await prisma.produk.updateMany({
  where: { stok: 0 },
  data:  { aktif: false }
})
console.log(`${result.count} produk dinonaktifkan`)

// ⚠️ updateMany() tidak bisa pakai include untuk return relasi
```

---

## 📖 Bab 12 — DELETE — Menghapus Data

---

### 12.1 🗑️ `delete()` & `deleteMany()`

```typescript
// delete() — Hapus satu record
// SQL: DELETE FROM produk WHERE id = ?

const produkDihapus = await prisma.produk.delete({
  where: { id: 1 }
})
// Return record yang baru saja dihapus

// ---

// deleteMany() — Hapus banyak record
// SQL: DELETE FROM produk WHERE aktif = false AND stok = 0
const result = await prisma.produk.deleteMany({
  where: {
    aktif: false,
    stok:  0,
  }
})
console.log(`${result.count} produk dihapus`)

// Hapus SEMUA data (hati-hati!)
await prisma.produk.deleteMany() // Tanpa where = hapus semua!
```

---

### 12.2 🔒 Soft Delete — Hapus Logis (Tidak Ada di Prisma Secara Native)

```typescript
// Prisma tidak punya soft delete bawaan
// Implementasikan manual dengan field deletedAt

// Di schema:
// model Produk {
//   id        Int       @id @default(autoincrement())
//   nama      String
//   deletedAt DateTime? // null = aktif, ada nilai = sudah "dihapus"
// }

// "Hapus" produk (soft delete)
async function softDelete(id: number) {
  return prisma.produk.update({
    where: { id },
    data:  { deletedAt: new Date() }
  })
}

// Pulihkan produk yang sudah di-soft delete
async function pulihkan(id: number) {
  return prisma.produk.update({
    where: { id },
    data:  { deletedAt: null }
  })
}

// Query yang otomatis exclude soft-deleted records
async function ambilProdukAktif() {
  return prisma.produk.findMany({
    where: { deletedAt: null } // Hanya yang belum dihapus
  })
}
```

---

---

# 🔴 BAGIAN V — Query Lanjutan & Relasi

> 🎯 **Tujuan:** Menguasai semua operator filtering Prisma, query relasi
> yang kompleks, dan teknik yang membuat Prisma jauh lebih powerful dari raw SQL.

---

## 📖 Bab 13 — Filtering & Operator Lengkap

---

### 13.1 🔍 Semua Operator `where`

```typescript
// Tabel perbandingan SQL vs Prisma:

// SQL: WHERE harga = 100000
prisma.produk.findMany({ where: { harga: 100000 } })

// SQL: WHERE harga != 100000
prisma.produk.findMany({ where: { harga: { not: 100000 } } })

// SQL: WHERE harga > 100000
prisma.produk.findMany({ where: { harga: { gt: 100000 } } })

// SQL: WHERE harga >= 100000
prisma.produk.findMany({ where: { harga: { gte: 100000 } } })

// SQL: WHERE harga < 100000
prisma.produk.findMany({ where: { harga: { lt: 100000 } } })

// SQL: WHERE harga <= 100000
prisma.produk.findMany({ where: { harga: { lte: 100000 } } })

// SQL: WHERE harga BETWEEN 100000 AND 500000
prisma.produk.findMany({ where: { harga: { gte: 100000, lte: 500000 } } })

// SQL: WHERE nama LIKE '%laptop%'
prisma.produk.findMany({ where: { nama: { contains: 'laptop' } } })

// SQL: WHERE nama LIKE 'laptop%'
prisma.produk.findMany({ where: { nama: { startsWith: 'laptop' } } })

// SQL: WHERE nama LIKE '%laptop'
prisma.produk.findMany({ where: { nama: { endsWith: 'laptop' } } })

// Case-insensitive (default di MySQL, eksplisit di PostgreSQL)
prisma.produk.findMany({
  where: { nama: { contains: 'laptop', mode: 'insensitive' } }
})

// SQL: WHERE id IN (1, 2, 3)
prisma.produk.findMany({ where: { id: { in: [1, 2, 3] } } })

// SQL: WHERE id NOT IN (1, 2, 3)
prisma.produk.findMany({ where: { id: { notIn: [1, 2, 3] } } })

// SQL: WHERE deleted_at IS NULL
prisma.produk.findMany({ where: { deletedAt: null } })

// SQL: WHERE deleted_at IS NOT NULL
prisma.produk.findMany({ where: { deletedAt: { not: null } } })
```

---

### 13.2 🔗 AND, OR, NOT

```typescript
// SQL: WHERE aktif = true AND stok > 0 AND harga < 1000000
// Cara 1: Objek biasa (implisit AND)
prisma.produk.findMany({
  where: {
    aktif: true,
    stok:  { gt: 0 },
    harga: { lt: 1000000 },
  }
})

// Cara 2: Eksplisit AND
prisma.produk.findMany({
  where: {
    AND: [
      { aktif: true },
      { stok:  { gt: 0 } },
      { harga: { lt: 1000000 } },
    ]
  }
})

// SQL: WHERE kategori_id = 1 OR kategori_id = 2
prisma.produk.findMany({
  where: {
    OR: [
      { kategoriId: 1 },
      { kategoriId: 2 },
    ]
  }
})

// SQL: WHERE NOT (stok = 0)
prisma.produk.findMany({
  where: {
    NOT: { stok: 0 }
  }
})

// Kombinasi kompleks:
// SQL: WHERE aktif = true AND (harga < 100000 OR stok > 50)
prisma.produk.findMany({
  where: {
    aktif: true,
    OR: [
      { harga: { lt: 100000 } },
      { stok:  { gt: 50 } },
    ]
  }
})
```

---

### 13.3 📊 Sorting & Pagination Lengkap

```typescript
// SORTING
prisma.produk.findMany({
  orderBy: { harga: 'asc' }  // ASC: termurah dulu
})

prisma.produk.findMany({
  orderBy: { harga: 'desc' } // DESC: termahal dulu
})

// Multiple sort
prisma.produk.findMany({
  orderBy: [
    { kategoriId: 'asc' },  // Urutkan kategori dulu
    { harga:      'asc' },  // Dalam kategori yang sama, urutkan harga
    { nama:       'asc' },  // Jika harga sama, urutkan nama
  ]
})

// Sort berdasarkan relasi (sort by nama kategori)
prisma.produk.findMany({
  orderBy: { kategori: { nama: 'asc' } }
})

// ---

// PAGINATION — Offset-based (paling umum)
const halaman = 3
const perPage = 10

const produk = await prisma.produk.findMany({
  skip: (halaman - 1) * perPage,  // Skip (halaman-1) * perPage records
  take: perPage,                   // Ambil perPage records
})

// Hitung total untuk informasi pagination
const [produk, total] = await prisma.$transaction([
  prisma.produk.findMany({ skip: 20, take: 10 }),
  prisma.produk.count(),
])

const totalHalaman = Math.ceil(total / perPage)

// CURSOR-BASED PAGINATION — Lebih efisien untuk data besar
const produkPertama = await prisma.produk.findMany({ take: 10 })
const cursorId = produkPertama[produkPertama.length - 1].id

const produkBerikutnya = await prisma.produk.findMany({
  take:   10,
  skip:   1,              // Skip cursor record itu sendiri
  cursor: { id: cursorId }, // Mulai dari setelah cursor
})
```

---

## 📖 Bab 14 — Select & Include — Relasi Query

---

### 14.1 🎯 `select` vs `include` — Perbedaan Fundamental

```typescript
// SELECT — Pilih field SPESIFIK yang ingin diambil
// Tidak bisa pakai select + include bersamaan di level yang sama!

const produk = await prisma.produk.findMany({
  select: {
    id:    true,
    nama:  true,
    harga: true,
    // stok, deskripsi, aktif, dll TIDAK diambil → query lebih efisien

    // Bisa include relasi di dalam select:
    kategori: {
      select: { nama: true } // Hanya nama kategori, bukan semua field
    },
  }
})
// produk[0].id       ✅
// produk[0].nama     ✅
// produk[0].stok     ❌ Error TypeScript! Field ini tidak diselect

// ---

// INCLUDE — Ambil SEMUA field + tambahkan relasi
const produk = await prisma.produk.findMany({
  include: {
    kategori: true,     // Semua field kategori
    tags:     true,     // Semua field tags
    ulasan: {
      include: {
        user: {         // Nested include — user yang buat ulasan
          select: { nama: true, email: true } // Hanya field tertentu
        }
      },
      orderBy: { createdAt: 'desc' },
      take:    5,       // Hanya 5 ulasan terbaru
    }
  }
})
```

---

### 14.2 🔍 Filtering pada Relasi

```typescript
// Ambil produk yang punya setidaknya SATU tag bernama 'gaming'
// SQL: ... JOIN produk_tag pt ON p.id = pt.produk_id
//      JOIN tags t ON pt.tag_id = t.id WHERE t.nama = 'gaming'
const produkGaming = await prisma.produk.findMany({
  where: {
    tags: {
      some: { nama: 'gaming' }  // some = setidaknya satu
    }
  }
})

// Ambil produk yang SEMUA tagnya adalah kategori 'premium'
const produkPremium = await prisma.produk.findMany({
  where: {
    tags: {
      every: { isPremium: true }  // every = semua harus memenuhi
    }
  }
})

// Ambil produk yang TIDAK PUNYA tag apapun
const produkTanpaTag = await prisma.produk.findMany({
  where: {
    tags: {
      none: {}  // none = tidak ada satu pun
    }
  }
})

// Ambil produk yang punya setidaknya satu ulasan dengan rating >= 4
const produkBagus = await prisma.produk.findMany({
  where: {
    ulasan: {
      some: { rating: { gte: 4 } }
    }
  },
  include: {
    // Filter juga bisa di dalam include!
    ulasan: {
      where:   { rating: { gte: 4 } }, // Hanya tampilkan ulasan bagus
      orderBy: { rating: 'desc' },
    }
  }
})
```

---

## 📖 Bab 15 — Transactions & Raw Query

---

### 15.1 🔒 Transaction — Operasi Atomik

```typescript
// Semua operasi berhasil atau semua dibatalkan

// ① Sequential Transaction — operasi satu per satu (bisa pakai hasil sebelumnya)
const result = await prisma.$transaction(async (tx) => {
  // tx adalah Prisma Client yang terikat ke transaction ini
  // Jika ada error → semua operasi di sini di-rollback!

  // Cek stok
  const produk = await tx.produk.findUnique({
    where: { id: 1 }
  })

  if (!produk || produk.stok < 1) {
    throw new Error('Stok tidak cukup!')  // ← Trigger rollback
  }

  // Kurangi stok
  const produkDiupdate = await tx.produk.update({
    where: { id: 1 },
    data:  { stok: { decrement: 1 } }
  })

  // Buat order
  const order = await tx.pesanan.create({
    data: {
      userId:   1,
      produkId: 1,
      jumlah:   1,
      total:    produk.harga,
    }
  })

  return { order, produk: produkDiupdate }
})

// ② Batch Transaction — lebih cepat, tidak bisa pakai hasil sebelumnya
const [produkBaru, totalProduk] = await prisma.$transaction([
  prisma.produk.create({ data: { nama: 'Test', harga: 100000, stok: 1 } }),
  prisma.produk.count(),
])
// Kedua query dijalankan bersamaan dalam satu transaction
```

---

### 15.2 📝 Raw Query — Ketika Prisma Tidak Cukup

```typescript
// Terkadang butuh SQL yang tidak bisa diekspresikan dengan Prisma Client
// Gunakan $queryRaw atau $executeRaw

// $queryRaw — untuk SELECT (mengembalikan data)
// WAJIB pakai template literal sql`` atau Prisma.sql`` untuk keamanan!
import { Prisma } from '@prisma/client'

const hasilKhusus = await prisma.$queryRaw<{ nama: string; total: number }[]>`
  SELECT
    p.nama,
    COUNT(o.id) as total
  FROM produk p
  LEFT JOIN pesanan o ON p.id = o.produk_id
  WHERE p.aktif = true
  GROUP BY p.id, p.nama
  HAVING total > 10
  ORDER BY total DESC
  LIMIT 10
`

// Dengan parameter (AMAN dari SQL injection)
const minHarga = 100000
const produk = await prisma.$queryRaw<Produk[]>`
  SELECT * FROM produk
  WHERE harga > ${minHarga}
  ORDER BY harga ASC
`

// $executeRaw — untuk INSERT, UPDATE, DELETE (mengembalikan count)
const rowsAffected = await prisma.$executeRaw`
  UPDATE produk
  SET harga = harga * 0.9
  WHERE kategori_id = ${1}
    AND aktif = true
`
console.log(`${rowsAffected} produk mendapat diskon`)

// ⚠️ JANGAN gunakan template string biasa (rentan SQL injection)!
// ❌ BERBAHAYA:
await prisma.$queryRaw`SELECT * FROM produk WHERE id = ${userId}` // ✅ Aman
await prisma.$queryRawUnsafe(`SELECT * FROM produk WHERE id = ${userId}`) // ❌ Berbahaya!
```

---

---

# 🟣 BAGIAN VI — Prisma Lanjutan

> 🎯 **Tujuan:** Fitur-fitur Prisma yang membuat pekerjaan developer
> lebih mudah — middleware, extension, dan integrasi dengan validasi.

---

## 📖 Bab 16 — Prisma Middleware & Extension

---

### 16.1 🔌 Prisma Middleware — Intercept Query

```typescript
// Middleware dijalankan sebelum/sesudah setiap query Prisma
// Mirip middleware di Express tapi untuk database operations

const prisma = new PrismaClient()

// ① Logging middleware — log semua query
prisma.$use(async (params, next) => {
  const sebelum = Date.now()
  const result  = await next(params) // Jalankan query
  const sesudah = Date.now()

  console.log(`Query: ${params.model}.${params.action} — ${sesudah - sebelum}ms`)
  return result
})

// ② Soft delete middleware — otomatis filter deleted records
prisma.$use(async (params, next) => {
  // Untuk semua findMany pada model yang punya deletedAt
  const modelDenganSoftDelete = ['Produk', 'User', 'Post']

  if (modelDenganSoftDelete.includes(params.model ?? '')) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      // Tambahkan kondisi deletedAt: null secara otomatis
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      }
    }

    // Ubah delete menjadi soft delete
    if (params.action === 'delete') {
      params.action = 'update'
      params.args.data = { deletedAt: new Date() }
    }
  }

  return next(params)
})
```

---

### 16.2 🔧 Prisma Client Extension (Cara Modern)

```typescript
// Extension lebih powerful dari middleware (Prisma 4.7+)

const prismaExtended = prisma.$extends({
  // ① Model extension — tambahkan method ke model tertentu
  model: {
    produk: {
      // Method custom: prisma.produk.cariAktif()
      async cariAktif(params?: { take?: number; orderBy?: object }) {
        return prisma.produk.findMany({
          where:   { aktif: true, deletedAt: null },
          orderBy: params?.orderBy ?? { createdAt: 'desc' },
          take:    params?.take,
        })
      },

      // Method custom: prisma.produk.softDelete(id)
      async softDelete(id: number) {
        return prisma.produk.update({
          where: { id },
          data:  { deletedAt: new Date() }
        })
      }
    }
  },

  // ② Result extension — tambahkan computed field ke result
  result: {
    produk: {
      hargaFormat: {
        needs:   { harga: true },
        compute: (produk) => `Rp ${Number(produk.harga).toLocaleString('id-ID')}`
      },
      isAvailable: {
        needs:   { stok: true, aktif: true },
        compute: (produk) => produk.stok > 0 && produk.aktif
      }
    }
  },
})

// Penggunaan extension:
const produkAktif = await prismaExtended.produk.cariAktif({ take: 10 })
produkAktif[0].hargaFormat  // "Rp 15.000.000" — computed!
produkAktif[0].isAvailable  // true/false — computed!
```

---

## 📖 Bab 17 — Validasi dengan Zod + Prisma

---

### 17.1 ✅ Integrasi Zod untuk Validasi Input

```typescript
// npm install zod zod-prisma-types

import { z } from 'zod'

// Schema validasi untuk membuat produk
const CreateProdukSchema = z.object({
  nama: z
    .string()
    .min(3,   'Nama minimal 3 karakter')
    .max(255, 'Nama maksimal 255 karakter'),

  harga: z
    .number()
    .positive('Harga harus lebih dari 0')
    .max(999999999, 'Harga terlalu besar'),

  stok: z
    .number()
    .int('Stok harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif')
    .default(0),

  deskripsi: z
    .string()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional(),

  kategoriId: z
    .number()
    .int()
    .positive('Pilih kategori yang valid'),

  tags: z
    .array(z.number().int().positive())
    .max(10, 'Maksimal 10 tag')
    .optional(),
})

// Update schema — semua field opsional
const UpdateProdukSchema = CreateProdukSchema.partial()

// Type inference dari Zod schema
type CreateProdukInput = z.infer<typeof CreateProdukSchema>
type UpdateProdukInput = z.infer<typeof UpdateProdukSchema>

// Fungsi service yang menggunakan validasi
async function buatProduk(rawInput: unknown) {
  // Validasi input — throw error jika tidak valid
  const data = CreateProdukSchema.parse(rawInput)

  // Jika sampai sini, data sudah valid dan typed!
  return prisma.produk.create({
    data: {
      nama:       data.nama,
      harga:      data.harga,
      stok:       data.stok,
      deskripsi:  data.deskripsi,
      kategoriId: data.kategoriId,
      ...(data.tags && {
        tags: { connect: data.tags.map(id => ({ id })) }
      }),
    }
  })
}
```

---

## 📖 Bab 18 — Error Handling di Prisma

---

### 18.1 🚨 Jenis Error Prisma

```typescript
import { Prisma } from '@prisma/client'

async function operasiDatabase() {
  try {
    const produk = await prisma.produk.create({
      data: { nama: 'Test', harga: 100, stok: 1, kategoriId: 999 }
    })

  } catch (error) {

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Error dari query Prisma yang sudah dikenali
      switch (error.code) {
        case 'P2002':
          // Unique constraint violation
          // Contoh: email sudah ada
          const field = error.meta?.target as string[]
          throw new Error(`${field.join(', ')} sudah digunakan.`)

        case 'P2003':
          // Foreign key constraint violation
          // Contoh: kategoriId tidak ada
          throw new Error('Referensi data tidak ditemukan.')

        case 'P2025':
          // Record not found (untuk update/delete)
          throw new Error('Data tidak ditemukan.')

        case 'P2016':
          // Query interpretation error
          throw new Error('Query tidak valid.')

        default:
          throw new Error(`Database error: ${error.code}`)
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      // Error validasi dari Prisma Client (tipe data salah, field tidak ada, dll)
      throw new Error('Data yang dikirim tidak valid.')
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      // Gagal koneksi ke database
      throw new Error('Gagal terhubung ke database.')
    }

    // Error tidak dikenali
    throw error
  }
}
```

---

---

# ⚫ BAGIAN VII — Performa & Best Practices

> 🎯 **Tujuan:** Membuat query Prisma yang efisien dan menghindari
> jebakan performa yang umum terjadi.

---

## 📖 Bab 19 — Optimasi Query & Performa

---

### 19.1 🔴 N+1 Problem di Prisma

```typescript
// ❌ N+1 Problem — Query tidak efisien
const kategori = await prisma.kategori.findMany()
// 1 query: SELECT * FROM kategori

for (const kat of kategori) {
  const produk = await prisma.produk.findMany({
    where: { kategoriId: kat.id }
  })
  // N query: SELECT * FROM produk WHERE kategori_id = ?
  // Jika ada 10 kategori = 11 query total!
  console.log(`${kat.nama}: ${produk.length} produk`)
}

// ✅ Solusi: Gunakan include atau select dengan relasi
const kategori = await prisma.kategori.findMany({
  include: {
    _count: { select: { produk: true } } // Hitung tanpa load semua data!
    // atau:
    // produk: true // Load semua produk (hati-hati data besar!)
  }
})
// HANYA 2 query: 1 untuk kategori, 1 untuk semua produk
kategori.forEach(kat => {
  console.log(`${kat.nama}: ${kat._count.produk} produk`)
})
```

---

### 19.2 ⚡ Teknik Optimasi

```typescript
// ① Select hanya yang dibutuhkan (jangan ambil semua kolom!)
// ❌ Ambil semua — tidak efisien jika konten HTML besar
const posts = await prisma.post.findMany()

// ✅ Hanya ambil yang ditampilkan di list
const posts = await prisma.post.findMany({
  select: {
    id:          true,
    title:       true,
    slug:        true,
    excerpt:     true,
    publishedAt: true,
    author: { select: { nama: true } },
    // content (bisa ribuan karakter) TIDAK diambil di list!
  }
})

// ② Gunakan _count untuk hitung relasi (jauh lebih efisien dari include)
const produk = await prisma.produk.findMany({
  select: {
    id:   true,
    nama: true,
    _count: {
      select: {
        ulasan: true, // Hitung jumlah ulasan
        tags:   true, // Hitung jumlah tag
      }
    }
  }
})
produk[0]._count.ulasan // 42
produk[0]._count.tags   // 5

// ③ Index yang tepat di schema (sangat penting!)
// model Produk {
//   @@index([kategoriId])                // Query by kategori sering
//   @@index([aktif, createdAt])          // Query aktif + sort by date
//   @@index([nama])                      // Search by nama
// }

// ④ Pagination wajib untuk data besar
// ❌ Ini bisa crash server jika ada jutaan record!
const semua = await prisma.produk.findMany()

// ✅ Selalu batasi dengan pagination
const produk = await prisma.produk.findMany({
  take: 20,
  skip: 0,
})
```

---

## 📖 Bab 20 — Best Practices & Pola Umum

---

### 20.1 🏗️ Repository Pattern dengan Prisma

```typescript
// Pisahkan logika database dari logika bisnis

// src/repositories/produk.repository.ts
import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'

export class ProdukRepository {
  // Tipe untuk relasi yang di-include
  static readonly includeDefault = {
    kategori: true,
    tags:     true,
    _count:   { select: { ulasan: true } },
  } satisfies Prisma.ProdukInclude

  async cariSemua(params?: {
    halaman?:   number
    perPage?:   number
    keyword?:   string
    kategoriId?: number
    aktif?:     boolean
  }) {
    const { halaman = 1, perPage = 10, keyword, kategoriId, aktif } = params ?? {}

    const where: Prisma.ProdukWhereInput = {
      ...(aktif !== undefined && { aktif }),
      ...(kategoriId           && { kategoriId }),
      ...(keyword              && { nama: { contains: keyword, mode: 'insensitive' } }),
    }

    const [data, total] = await prisma.$transaction([
      prisma.produk.findMany({
        where,
        include: ProdukRepository.includeDefault,
        orderBy: { createdAt: 'desc' },
        skip:    (halaman - 1) * perPage,
        take:    perPage,
      }),
      prisma.produk.count({ where }),
    ])

    return {
      data,
      pagination: {
        halaman,
        perPage,
        total,
        totalHalaman: Math.ceil(total / perPage),
      }
    }
  }

  async cariById(id: number) {
    return prisma.produk.findUniqueOrThrow({
      where:   { id },
      include: ProdukRepository.includeDefault,
    })
  }

  async buat(data: Prisma.ProdukCreateInput) {
    return prisma.produk.create({ data, include: ProdukRepository.includeDefault })
  }

  async update(id: number, data: Prisma.ProdukUpdateInput) {
    return prisma.produk.update({ where: { id }, data })
  }

  async hapus(id: number) {
    return prisma.produk.delete({ where: { id } })
  }
}

export const produkRepository = new ProdukRepository()
```

---

---

# 🏆 BAGIAN VIII — Project: REST API dengan Next.js + Prisma

> 🎯 **Tujuan:** Terapkan semua yang dipelajari dalam satu project
> REST API full stack yang production-ready.

---

## 📖 Bab 21 — Project: REST API Toko Online

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