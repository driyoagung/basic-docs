---
title: "Bab 2 — Setup & Instalasi"
---

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

---

🚀 Lanjut ke [🔌 Bab 3 — Prisma Client & Koneksi Pertama](/bagian-1/bab-3) untuk melanjutkan perjalanan!
