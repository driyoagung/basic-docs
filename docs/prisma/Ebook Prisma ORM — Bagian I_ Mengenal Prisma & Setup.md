# 🟢 Ebook Prisma ORM — Bagian I: Mengenal Prisma & Setup

> 🎯 **Tujuan Bagian I:** Memahami apa itu Prisma, mengapa ia jauh lebih baik dari raw SQL, mengenal tiga komponen utamanya, dan berhasil melakukan koneksi pertama ke database MySQL maupun PostgreSQL.

---

# 📖 Bab 1 — Mengenal Prisma ORM

Sebelum kita menulis satu baris kode pun, penting untuk memahami **mengapa** Prisma ada dan masalah nyata apa yang ia selesaikan. Bab ini adalah fondasi mindset yang akan menentukan cara kamu berpikir tentang database selanjutnya.

---

## 🤔 1.1 Apa itu Prisma?

Prisma adalah **next-generation ORM** (*Object-Relational Mapper*) untuk Node.js dan TypeScript. Ia menjadi jembatan antara kode aplikasi kamu dengan database relasional — sehingga kamu bisa berinteraksi dengan database menggunakan **TypeScript biasa** yang type-safe, bukan string SQL yang rawan typo dan injection.

Tapi Prisma bukan sekadar ORM biasa. Ia dirancang dari awal untuk TypeScript — bukan di-port dari JavaScript atau bahasa lain. Hasilnya adalah pengalaman developer yang jauh lebih mulus dibanding ORM generasi sebelumnya.

```
TANPA Prisma — SQL Manual (yang sudah kamu tahu):
─────────────────────────────────────────────────────────────
import mysql from 'mysql2/promise'

const [rows] = await pool.query(
  `SELECT u.*, p.bio, p.foto
   FROM users u
   LEFT JOIN profil p ON u.id = p.user_id
   WHERE u.id = ?
     AND u.deleted_at IS NULL`,
  [userId]
)

const user = rows[0]  // Tipenya: any
user.emial            // ← Typo! Tapi tidak ada error apapun
user.createdAt.toISOString() // ← Crash di runtime jika null!
user.profil.bio       // ← Error! rows[0] bukan objek berlapis


DENGAN Prisma — TypeScript Native:
─────────────────────────────────────────────────────────────
const user = await prisma.user.findUnique({
  where:   { id: userId },
  include: { profil: true },
})

user?.email           // ← Autocomplete muncul otomatis di IDE
user?.emial           // ← ERROR saat compile! Typo langsung ketahuan
user?.createdAt?.toISOString() // ← TypeScript paksa kamu handle null
user?.profil?.bio     // ← Nested object sudah di-type dengan benar
```

---

## 🏗️ 1.2 Tiga Komponen Utama Prisma

Prisma bukan satu tool tunggal — ia adalah ekosistem yang terdiri dari tiga komponen yang bekerja bersama:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ① PRISMA SCHEMA  (prisma/schema.prisma)                   │
│   ─────────────────────────────────────────────────────      │
│   File deklaratif satu-satunya yang mendefinisikan:         │
│   • Koneksi ke database (provider & URL)                    │
│   • Model (representasi tabel)                              │
│   • Field (kolom beserta tipenya)                           │
│   • Relasi antar model                                      │
│   • Enum dan tipe custom                                    │
│   • Index dan constraint                                     │
│                                                              │
│   Ini adalah "sumber kebenaran tunggal" seluruh project.    │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       │ Dibaca oleh
           ┌───────────┴───────────┐
           ▼                       ▼
┌──────────────────────┐  ┌────────────────────────────────────┐
│                      │  │                                    │
│  ② PRISMA MIGRATE    │  │  ③ PRISMA CLIENT                  │
│  ────────────────    │  │  ──────────────                    │
│  Sistem version      │  │  Auto-generated query builder      │
│  control database:   │  │  yang type-safe:                   │
│                      │  │                                    │
│  • Generate file SQL │  │  • Semua operasi CRUD              │
│    migration dari    │  │  • Filtering & sorting             │
│    perubahan schema  │  │  • Pagination                      │
│                      │  │  • Relasi & join                   │
│  • Jalankan & track  │  │  • Transaction                     │
│    history migration │  │  • Aggregation                     │
│                      │  │                                    │
│  • Rollback jika ada │  │  Di-generate otomatis dari schema. │
│    masalah           │  │  Tipenya selalu sinkron dengan DB. │
│                      │  │                                    │
└──────────────────────┘  └────────────────────────────────────┘
           │                            │
           └────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────┐
           │        DATABASE          │
           │                          │
           │  MySQL / PostgreSQL /    │
           │  SQLite / SQL Server /   │
           │  MongoDB (preview)       │
           └──────────────────────────┘
```

### Alur Kerja Sehari-hari

```
1. Edit schema.prisma
        │
        ▼
2. npx prisma migrate dev
        │
   ┌────┴────────────────────────┐
   │                             │
   ▼                             ▼
File SQL migration          npx prisma generate
dibuat & dijalankan              │
ke database                      ▼
                        Prisma Client di-update
                        dengan tipe terbaru
                                 │
                                 ▼
                    Kamu pakai prisma.model.action()
                    dengan type safety penuh ✅
```

---

## 🆚 1.3 Prisma vs Raw SQL vs ORM Lain

### Prisma vs Raw SQL

| Aspek | Raw SQL | Prisma |
| --- | --- | --- |
| **Type safety** | ❌ Hasil bertipe `any` | ✅ Fully typed |
| **Autocomplete** | ❌ Tidak ada | ✅ Lengkap di IDE |
| **Typo detection** | ❌ Runtime error | ✅ Compile-time error |
| **SQL Injection** | ⚠️ Rawan jika lalai | ✅ Aman otomatis |
| **Refactoring** | ❌ Rename kolom = cari manual | ✅ TypeScript error menunjukkan semua tempat |
| **Schema terpusat** | ❌ Tersebar di berbagai file | ✅ Satu file `schema.prisma` |
| **Relasi** | ⚠️ JOIN manual, rawan salah | ✅ `include` yang sederhana |
| **Fleksibilitas** | ✅ Bisa query apapun | ✅ Bisa + raw query jika perlu |

### Prisma vs ORM Lain

| Aspek | Prisma | Sequelize | TypeORM | Mongoose |
| --- | --- | --- | --- | --- |
| **TypeScript-first** | ✅ Sempurna | ⚠️ Parsial | ⚠️ Parsial | ⚠️ Parsial |
| **Autocomplete** | ✅ Excellent | ⚠️ Terbatas | ⚠️ Terbatas | ⚠️ Terbatas |
| **Schema** | File `.prisma` | Code/decorator | Decorator | Schema JS |
| **Migration** | ✅ Built-in, otomatis | ✅ Ada | ✅ Ada | ❌ Tidak ada |
| **GUI** | ✅ Prisma Studio | ❌ | ❌ | ❌ |
| **Learning Curve** | 🟢 Rendah | 🟡 Sedang | 🟡 Sedang | 🟢 Rendah |
| **Cocok untuk** | SQL + MongoDB | SQL | SQL | MongoDB |

---

## 🗄️ 1.4 Database yang Didukung

```
RELATIONAL (SQL) — Fokus ebook ini:
├── ✅ MySQL 5.7+ / MariaDB   ← Database utama yang kita bahas
├── ✅ PostgreSQL 9.6+         ← Dibahas sebagai perbandingan
├── ✅ SQLite                  ← Untuk development & testing lokal
├── ✅ Microsoft SQL Server
└── ✅ CockroachDB

NON-RELATIONAL:
└── ✅ MongoDB                 ← Support via Prisma Client Extension (preview)
```

> 💡 **Untuk ebook ini:** Semua contoh ditulis untuk **MySQL** sebagai database utama. Di beberapa bagian, kita akan tunjukkan perbedaannya dengan PostgreSQL — terutama di tipe data dan beberapa fitur spesifik.

---

## 💡 1.5 Argumen Kuat untuk Beralih dari Raw SQL

Mungkin kamu bertanya: *"Saya sudah bisa SQL dengan baik, kenapa harus belajar Prisma?"* Ini adalah pertanyaan yang sangat wajar. Berikut argumen konkretnya:

```
❌ MASALAH 1: Tidak ada type safety
───────────────────────────────────
// Raw SQL
const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
const user = rows[0]         // Tipe: any
user.emial                   // Typo! Tapi tidak ada error → bug tersembunyi
user.createdAt.toISOString() // Crash runtime jika null!

// Prisma
const user = await prisma.user.findUnique({ where: { id } })
user?.emial                  // ERROR saat compile → bug ketahuan sebelum run!
user?.createdAt?.toISOString() // TypeScript paksa kamu handle null


❌ MASALAH 2: SQL Injection rawan terjadi
─────────────────────────────────────────
// Raw SQL — mudah terlupa escape
const nama = req.body.nama  // Bayangkan: "'; DROP TABLE users; --"
await pool.query(`SELECT * FROM users WHERE nama = '${nama}'`)
// → Database bisa dirusak!

// Prisma — selalu pakai prepared statement secara otomatis
await prisma.user.findMany({ where: { nama } })
// → Input otomatis di-escape, SQL injection tidak mungkin terjadi


❌ MASALAH 3: Tidak ada schema terpusat
────────────────────────────────────────
// Raw SQL — struktur tersebar di banyak file migration
// Harus buka semua file untuk tahu "shape" data saat ini
// Rename kolom? Cari manual di seluruh codebase

// Prisma — satu file untuk semua
// prisma/schema.prisma → baca ini, langsung tahu seluruh struktur DB


❌ MASALAH 4: Refactoring jadi mimpi buruk
──────────────────────────────────────────
// Raw SQL — rename kolom dari 'nama' ke 'nama_lengkap'
// Harus grep seluruh project: "SELECT nama FROM" "SET nama ="
// Satu yang terlewat → bug di production

// Prisma — rename field di schema.prisma
// TypeScript langsung error di semua tempat yang pakai field lama
// Tidak ada yang terlewat
```

---

## 📊 1.6 Kapan TIDAK Menggunakan Prisma?

Prisma bukan solusi untuk semua kasus. Ada situasi di mana raw SQL atau ORM lain lebih tepat:

```
Pertimbangkan raw SQL atau alternatif jika:

❌ Query sangat kompleks dengan banyak subquery, window functions,
   atau fitur database-specific yang tidak bisa diekspresikan di Prisma
   → Solusi: Gunakan $queryRaw di Prisma untuk query spesifik ini

❌ Performance-critical query yang butuh optimasi SQL sangat spesifik
   → Solusi: Hybrid — Prisma untuk query umum, raw SQL untuk hotspot

❌ Project yang sudah ada dengan database besar dan tidak mau migration
   → Solusi: Prisma db pull (introspection) untuk generate schema dari DB yang ada

❌ Team yang sangat familiar dengan ORM lain (Sequelize, TypeORM)
   dan project sudah terlanjur menggunakannya
   → Pertimbanglah cost migrasi vs benefit
```

---

# 📖 Bab 2 — Setup & Instalasi

Bab ini memandu kamu dari nol hingga project Prisma pertama siap digunakan. Setiap langkah dijelaskan dengan detail kenapa dilakukan, bukan hanya apa yang dilakukan.

---

## 📦 2.1 Prasyarat

Sebelum mulai, pastikan ini sudah terinstall:

```bash
# Cek versi Node.js (minimal 18.x)
node --version
# v20.11.0 ← Ideal

# Cek npm
npm --version
# 10.x.x

# Cek apakah MySQL atau PostgreSQL sudah running
# MySQL:
mysql --version
# mysql  Ver 8.0.35 ...

# PostgreSQL:
psql --version
# psql (PostgreSQL) 16.1
```

> 💡 **Jika belum punya database lokal:** Untuk development awal, kamu bisa pakai **SQLite** — tidak perlu install apapun karena database-nya berupa satu file. Atau gunakan layanan cloud gratis seperti **Neon** (PostgreSQL) atau **PlanetScale** (MySQL).

---

## 🚀 2.2 Membuat Project dari Nol

```bash
# ① Buat folder project
mkdir belajar-prisma
cd belajar-prisma

# ② Inisialisasi npm project
npm init -y

# ③ Install TypeScript dan tools yang dibutuhkan
npm install -D typescript ts-node @types/node tsx

# tsx → jalankan TypeScript langsung tanpa compile (lebih cepat untuk development)
# ts-node → alternatif tsx, lebih lama tapi lebih stabil di beberapa kasus
# @types/node → type definition untuk Node.js built-in API

# ④ Install Prisma CLI sebagai dev dependency
npm install -D prisma

# ⑤ Install Prisma Client sebagai dependency (bukan devDependency!)
# Ini yang dipakai di kode production
npm install @prisma/client

# ⑥ Inisialisasi Prisma dengan pilihan database
npx prisma init --datasource-provider mysql
# atau untuk PostgreSQL:
npx prisma init --datasource-provider postgresql
# atau untuk SQLite (paling mudah untuk mulai):
npx prisma init --datasource-provider sqlite
```

Setelah `npx prisma init`, kamu akan melihat output seperti ini:

```
✔ Your Prisma schema was created at prisma/schema.prisma
  You can now open it in your favorite editor.

Next steps:
1. Set the DATABASE_URL in the .env file to point to your existing database.
   If your database has no tables yet, read https://pris.ly/d/getting-started

2. Run prisma db pull to turn your database schema into a Prisma schema.

3. Run prisma generate to generate the Prisma Client.
```

---

## 📁 2.3 Struktur Folder Setelah Init

```
belajar-prisma/
│
├── 📁 prisma/
│   └── 📄 schema.prisma       ← File schema Prisma — JANTUNG dari semua ini
│
├── 📄 .env                    ← Berisi DATABASE_URL — JANGAN commit ke Git!
├── 📄 .gitignore              ← Pastikan .env ada di sini
├── 📄 package.json
└── 📄 package-lock.json

(Akan kita tambahkan:)
├── 📄 tsconfig.json           ← Konfigurasi TypeScript
└── 📁 src/
    ├── 📄 index.ts            ← Entry point utama
    └── 📁 lib/
        └── 📄 prisma.ts       ← Singleton Prisma Client
```

---

## ⚙️ 2.4 Konfigurasi TypeScript

```json
// tsconfig.json — buat file ini di root project
{
  "compilerOptions": {
    "target":                     "ES2020",
    "lib":                        ["ES2020"],
    "module":                     "CommonJS",
    "moduleResolution":           "node",
    "outDir":                     "./dist",
    "rootDir":                    "./src",
    "strict":                     true,
    // strict: true mengaktifkan semua pengecekan TypeScript yang ketat
    // Ini penting agar Prisma bisa memberikan type safety maksimal!
    "esModuleInterop":            true,
    "skipLibCheck":               true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule":          true
  },
  "include": [
    "src/**/*",
    "prisma/**/*"    // Sertakan folder prisma agar ts-node bisa baca seed file
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

---

## 🔌 2.5 Konfigurasi DATABASE_URL

File `.env` berisi URL koneksi ke database. Format URL berbeda untuk setiap database:

```bash
# .env

# ─── MySQL ────────────────────────────────────────────────────────
# Format: mysql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE
DATABASE_URL="mysql://root:password@localhost:3306/belajar_prisma"

# Dengan opsi tambahan:
DATABASE_URL="mysql://root:pass@localhost:3306/belajar_prisma?connection_limit=10&pool_timeout=20"

# ─── PostgreSQL ───────────────────────────────────────────────────
# Format: postgresql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE
DATABASE_URL="postgresql://postgres:password@localhost:5432/belajar_prisma"

# PostgreSQL dengan schema tertentu:
DATABASE_URL="postgresql://postgres:pass@localhost:5432/belajar_prisma?schema=public"

# PostgreSQL cloud (Neon) dengan SSL:
DATABASE_URL="postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# ─── SQLite ───────────────────────────────────────────────────────
# File database dibuat otomatis — tidak perlu install database!
DATABASE_URL="file:./dev.db"
# File akan dibuat di: prisma/dev.db
```

> 🔐 **Keamanan Penting:** File `.env` berisi kredensial database yang sangat sensitif. **Jangan pernah commit ke Git!**

```bash
# .gitignore — pastikan baris ini ada
.env
.env.local
.env.*.local
node_modules/
dist/
```

---

## 📋 2.6 Script `package.json` yang Berguna

```json
// package.json
{
  "name": "belajar-prisma",
  "version": "1.0.0",
  "scripts": {
    // ─── Menjalankan aplikasi ──────────────────────────────────────
    "dev":   "tsx watch src/index.ts",
    // tsx watch: auto-restart saat file berubah (seperti nodemon)

    "build": "tsc",
    "start": "node dist/index.js",

    // ─── Database — Development ────────────────────────────────────
    "db:push":     "prisma db push",
    // Push schema ke DB tanpa file migration (untuk prototyping cepat)

    "db:migrate":  "prisma migrate dev",
    // Buat file migration + jalankan ke DB (cara yang benar)

    "db:studio":   "prisma studio",
    // Buka GUI database di browser

    "db:seed":     "tsx prisma/seed.ts",
    // Jalankan file seeder untuk isi data awal

    "db:generate": "prisma generate",
    // Generate ulang Prisma Client setelah schema berubah

    "db:format":   "prisma format",
    // Format & prettify file schema.prisma

    // ─── Database — Production ─────────────────────────────────────
    "db:migrate:prod": "prisma migrate deploy",
    // Jalankan migration yang pending (tidak buat migration baru)
    // Inilah yang dipakai saat deploy ke production!

    "db:status":   "prisma migrate status",
    // Lihat migration mana yang sudah/belum dijalankan

    // ─── Utility ───────────────────────────────────────────────────
    "db:reset":    "prisma migrate reset",
    // ⚠️ HATI-HATI: Hapus semua data + jalankan ulang semua migration
    // HANYA untuk development!

    "db:pull":     "prisma db pull"
    // Tarik schema dari database yang sudah ada (introspection)
    // Berguna saat mulai dari database yang sudah punya tabel
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
    // Memberitahu Prisma CLI dimana file seeder berada
    // Dipakai oleh: npx prisma db seed
    // dan otomatis dipanggil saat: npx prisma migrate reset
  }
}
```

---

## 📄 2.7 File `schema.prisma` Pertama

```prisma
// prisma/schema.prisma

// ① GENERATOR — Tentukan apa yang di-generate Prisma
// prisma-client-js adalah generator utama yang paling sering dipakai
generator client {
  provider = "prisma-client-js"

  // output = "../src/generated/prisma"
  // Opsional: ubah lokasi output Prisma Client
  // Default: node_modules/@prisma/client
}

// ② DATASOURCE — Konfigurasi koneksi database
datasource db {
  provider = "mysql"           // "mysql" | "postgresql" | "sqlite" | "sqlserver"
  url      = env("DATABASE_URL") // env() membaca dari file .env
}

// ③ MODEL — Representasi tabel database
// Ini adalah contoh model pertama yang paling sederhana
model User {
  // Primary key — auto increment integer
  id        Int      @id @default(autoincrement())

  // Email unik — tidak boleh ada dua user dengan email sama
  email     String   @unique

  // Nama opsional — bisa null
  nama      String?

  // Timestamp otomatis
  createdAt DateTime @default(now())   // Diisi saat record dibuat
  updatedAt DateTime @updatedAt        // Diperbarui otomatis saat record berubah

  @@map("users")  // Nama tabel di database: "users" (bukan "User")
}
```

---

# 📖 Bab 3 — Prisma Client & Koneksi Pertama

Sekarang setelah setup selesai, waktunya menghubungkan kode TypeScript ke database dan melakukan query pertama.

---

## 🔌 3.1 Membuat Instance Prisma Client — Singleton Pattern

```typescript
// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client'

// ─── Mengapa Singleton? ────────────────────────────────────────────────
// Saat development, Next.js / ts-node / tsx sering melakukan "hot reload"
// ketika file berubah. Tanpa singleton, setiap reload membuat PrismaClient
// baru dengan koneksi baru. Jika ini terjadi berkali-kali:
//
// Reload #1 → Koneksi #1 dibuka (tidak pernah ditutup)
// Reload #2 → Koneksi #2 dibuka (tidak pernah ditutup)
// Reload #N → Koneksi #N dibuka
//
// Database memiliki batas koneksi! MySQL default: 151 koneksi.
// Jika habis → Error: "Too many connections"
//
// Singleton memastikan hanya ada SATU instance PrismaClient
// yang di-reuse di semua reload.
// ─────────────────────────────────────────────────────────────────────

// Deklarasikan tipe global untuk menyimpan instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  // Pakai instance yang sudah ada jika tersedia
  globalForPrisma.prisma ??
  // Buat instance baru jika belum ada
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      // Di development: log semua — bagus untuk melihat SQL yang di-generate Prisma
      //   'query' → tampilkan setiap query SQL yang dijalankan
      //   'info'  → info umum Prisma
      //   'warn'  → peringatan performa
      //   'error' → semua error database
      : ['error'],
      // Di production: hanya log error — hindari log berlebihan
  })

// Simpan instance ke global hanya di development
// Di production, module caching Node.js sudah cukup
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Cara import di file lain:
// import { prisma } from './lib/prisma'
// import { prisma } from '@/lib/prisma'  (jika pakai path alias)
```

---

## 🚀 3.2 Test Koneksi Pertama

```typescript
// src/index.ts

import { prisma } from './lib/prisma'

async function main() {
  console.log('🔌 Mencoba koneksi ke database...\n')

  try {
    // Buat koneksi eksplisit (opsional — Prisma otomatis connect saat query pertama)
    await prisma.$connect()
    console.log('✅ Berhasil terhubung ke database!\n')

    // ─── Test 1: Query sederhana ───────────────────────────────────
    // Sebelum ada tabel: ini akan error
    // Setelah migrate: ini akan return angka
    const jumlahUser = await prisma.user.count()
    console.log(`📊 Jumlah user di database: ${jumlahUser}`)

    // ─── Test 2: Buat user pertama ─────────────────────────────────
    const userBaru = await prisma.user.create({
      data: {
        email: 'test@example.com',
        nama:  'User Pertama',
      }
    })
    console.log('\n✨ User baru berhasil dibuat:')
    console.log('   ID    :', userBaru.id)
    console.log('   Email :', userBaru.email)
    console.log('   Nama  :', userBaru.nama)
    console.log('   Dibuat:', userBaru.createdAt.toLocaleDateString('id-ID'))

    // ─── Test 3: Baca user yang baru dibuat ───────────────────────
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    console.log('\n🔍 User ditemukan:', user?.nama)

    // ─── Test 4: Hapus user (cleanup) ────────────────────────────
    await prisma.user.delete({ where: { email: 'test@example.com' } })
    console.log('\n🗑️  User test berhasil dihapus (cleanup)')

  } catch (error) {
    console.error('\n❌ Terjadi error:')
    console.error(error)
    process.exit(1)
  } finally {
    // SELALU tutup koneksi setelah selesai
    // Tanpa ini, script tidak akan berhenti (koneksi masih terbuka)
    await prisma.$disconnect()
    console.log('\n👋 Koneksi ditutup. Selesai!')
  }
}

main()
```

Sebelum bisa menjalankan kode di atas, kita perlu membuat tabel terlebih dahulu:

```bash
# Buat dan jalankan migration pertama
npx prisma migrate dev --name init
# Output:
# ✔ Generated Prisma Client ...
# ✔ Created the first migration (prisma/migrations/...)
# ✔ Applied migration `20240101000000_init`

# Jalankan kode test
npx tsx src/index.ts

# Output yang diharapkan:
# 🔌 Mencoba koneksi ke database...
# ✅ Berhasil terhubung ke database!
# 📊 Jumlah user di database: 0
# ✨ User baru berhasil dibuat:
#    ID    : 1
#    Email : test@example.com
#    Nama  : User Pertama
#    Dibuat: 1 Januari 2024
# 🔍 User ditemukan: User Pertama
# 🗑️  User test berhasil dihapus (cleanup)
# 👋 Koneksi ditutup. Selesai!
```

---

## 📊 3.3 Memahami Log Query Prisma

Saat `log: ['query']` aktif di development, kamu akan melihat setiap SQL yang di-generate Prisma. Ini sangat berguna untuk belajar dan debugging:

```
// Ketika kamu tulis:
await prisma.user.findUnique({ where: { email: 'test@example.com' } })

// Prisma log menampilkan:
prisma:query SELECT `users`.`id`, `users`.`email`, `users`.`nama`,
             `users`.`createdAt`, `users`.`updatedAt`
             FROM `users`
             WHERE `users`.`email` = ?
             LIMIT 1
prisma:query -- Duration: 2ms

// Ketika kamu tulis:
await prisma.user.create({ data: { email: 'a@b.com', nama: 'Test' } })

// Prisma log menampilkan:
prisma:query INSERT INTO `users` (`email`, `nama`, `createdAt`, `updatedAt`)
             VALUES (?, ?, ?, ?)
```

> 💡 **Tips belajar:** Aktifkan `log: ['query']` saat pertama belajar Prisma. Bandingkan kode Prisma yang kamu tulis dengan SQL yang di-generate. Ini cara terbaik untuk memahami apa yang terjadi di balik layar.

---

## 🖥️ 3.4 Prisma Studio — GUI Database Bawaan

Prisma Studio adalah antarmuka visual untuk berinteraksi dengan database langsung dari browser. Tidak perlu install tools terpisah seperti phpMyAdmin, TablePlus, atau pgAdmin.

```bash
# Buka Prisma Studio
npx prisma studio

# Output:
# Environment variables loaded from .env
# Prisma Studio is up on http://localhost:5555
```

```
Fitur Prisma Studio:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ✅ Lihat semua tabel dan data dalam tampilan yang rapi  │
│                                                          │
│  ✅ Tambah record baru via form visual                   │
│                                                          │
│  ✅ Edit data langsung di tabel (klik, ubah, simpan)     │
│                                                          │
│  ✅ Hapus satu atau banyak record                        │
│                                                          │
│  ✅ Filter dan sort data                                 │
│                                                          │
│  ✅ Explore relasi — klik field relasi untuk navigasi    │
│     ke record yang terhubung                            │
│                                                          │
│  ✅ Export data ke JSON                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

> 💡 **Prisma Studio** adalah salah satu fitur unik Prisma yang tidak dimiliki ORM lain. Ia otomatis mengerti schema kamu — tidak perlu konfigurasi tambahan apapun.

---

## 📋 3.5 Semua Perintah Prisma CLI yang Perlu Diketahui

Referensi lengkap CLI yang akan sering kamu gunakan:

```bash
# ─── SCHEMA ───────────────────────────────────────────────────────
npx prisma format
# Format file schema.prisma agar rapi dan konsisten
# Jalankan ini setiap selesai edit schema

npx prisma validate
# Validasi schema.prisma tanpa melakukan perubahan apapun
# Berguna untuk cek apakah schema sudah valid sebelum migrate

# ─── GENERATE ─────────────────────────────────────────────────────
npx prisma generate
# Generate ulang Prisma Client dari schema.prisma
# HARUS dijalankan setiap schema berubah agar TypeScript types ikut update
# Biasanya otomatis dipanggil setelah migrate dev

# ─── DATABASE — DEVELOPMENT ───────────────────────────────────────
npx prisma db push
# Push schema langsung ke database TANPA membuat file migration
# Cocok untuk: eksperimen cepat, prototyping
# ⚠️ TIDAK cocok untuk production — tidak ada history perubahan

npx prisma migrate dev
# Buat file SQL migration dari perubahan schema + jalankan ke DB
# Ini cara yang benar dan direkomendasikan untuk semua environment

npx prisma migrate dev --name "tambah_tabel_produk"
# Sama dengan di atas, tapi dengan nama migration yang kamu tentukan
# Nama yang jelas membantu saat review history migration

npx prisma db pull
# Tarik/baca schema dari database yang sudah ada (introspection)
# Berguna saat: mulai project baru dengan database yang sudah punya tabel

# ─── DATABASE — PRODUCTION ────────────────────────────────────────
npx prisma migrate deploy
# Jalankan semua migration yang belum diterapkan
# TIDAK membuat migration baru
# Inilah perintah yang dipakai di CI/CD dan production deployment!

npx prisma migrate status
# Tampilkan status semua migration: mana yang sudah dijalankan, mana yang belum
# Berguna untuk debugging masalah migration

# ─── UTILITY ──────────────────────────────────────────────────────
npx prisma studio
# Buka GUI database di browser (localhost:5555)

npx prisma db seed
# Jalankan file seeder (harus dikonfigurasi di package.json dulu)

npx prisma migrate reset
# ⚠️⚠️ SANGAT BERBAHAYA — Gunakan dengan sangat hati-hati!
# Urutan operasi: drop semua tabel → jalankan semua migration dari awal → jalankan seed
# Semua data akan hilang! HANYA untuk development/testing!
```

---

## 🔍 3.6 Troubleshooting Masalah Umum Setup

### Error: Cannot find module '@prisma/client'

```bash
# Prisma Client belum di-generate
# Jalankan:
npx prisma generate

# Atau jika baru install dependency:
npm install
npx prisma generate
```

### Error: P1001 - Can't reach database server

```bash
# Database tidak bisa diakses — cek:
# 1. Apakah MySQL/PostgreSQL sudah berjalan?
#    MySQL:      sudo service mysql status
#    PostgreSQL: sudo service postgresql status

# 2. Apakah DATABASE_URL di .env sudah benar?
#    Cek: username, password, host, port, nama database

# 3. Apakah database sudah dibuat?
#    MySQL:      CREATE DATABASE belajar_prisma;
#    PostgreSQL: createdb belajar_prisma

# Test koneksi manual:
mysql -u root -p belajar_prisma
# atau
psql -U postgres belajar_prisma
```

### Error: P1003 - Database does not exist

```bash
# Database belum dibuat — buat dulu:

# MySQL
mysql -u root -p
mysql> CREATE DATABASE belajar_prisma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# PostgreSQL
createdb belajar_prisma
# atau
psql -U postgres -c "CREATE DATABASE belajar_prisma;"
```

### Error: Environment variable not found: DATABASE_URL

```bash
# File .env tidak terbaca
# Pastikan:
# 1. File .env ada di ROOT folder project (bukan di dalam src/)
# 2. Nama variabelnya tepat: DATABASE_URL (huruf besar semua)
# 3. Tidak ada spasi di sekitar = : DATABASE_URL="..." (bukan DATABASE_URL = "...")

# Cek isi .env:
cat .env
```

### TypeScript Error: Property 'user' does not exist on type 'PrismaClient'

```bash
# Prisma Client belum di-generate atau schema belum punya model 'user'
# Pastikan:
# 1. Ada model User di schema.prisma
# 2. Sudah jalankan: npx prisma generate
# 3. Restart TypeScript language server di VS Code:
#    Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

---

## ✅ 3.7 Checklist Akhir Bagian I

Sebelum lanjut ke Bagian II, pastikan semua ini sudah berhasil:

```
Setup:
□ Project dibuat dengan npm init
□ TypeScript, tsx, Prisma CLI, dan @prisma/client sudah terinstall
□ tsconfig.json sudah dikonfigurasi dengan strict: true
□ File .env sudah ada dengan DATABASE_URL yang benar
□ .env sudah ada di .gitignore

Prisma:
□ prisma/schema.prisma sudah ada dengan datasource dan model User
□ npx prisma migrate dev --name init berhasil dijalankan
□ Tabel users sudah ada di database
□ npx prisma generate menghasilkan Prisma Client

Koneksi:
□ src/lib/prisma.ts sudah dibuat dengan singleton pattern
□ Test koneksi (src/index.ts) berhasil dijalankan
□ Bisa create, read, dan delete user lewat Prisma Client

Tools:
□ npx prisma studio berhasil dibuka di browser
□ Semua script di package.json sudah dikonfigurasi
```

> 📌 **Ringkasan Bagian I:** Kamu sekarang sudah memahami **mengapa Prisma ada** dan masalah apa yang ia selesaikan dibanding raw SQL. Kamu sudah berhasil melakukan **setup project lengkap** dari nol — TypeScript, Prisma CLI, Prisma Client, koneksi database, migration pertama, dan Prisma Studio. Di Bagian II, kita akan masuk ke jantung Prisma: **Prisma Schema** — tempat di mana semua model, field, relasi, dan constraint database kamu didefinisikan.