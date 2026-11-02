---
title: "Bab 3 — Prisma Client & Koneksi Pertama"
---

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

---

🚀 Lanjut ke [🏗️ Bab 4 — Data Model & Field Types](/bagian-2/bab-4) untuk melanjutkan perjalanan!
