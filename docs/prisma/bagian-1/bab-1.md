---
title: "Bab 1 — Mengenal Prisma ORM"
---

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

---

🚀 Lanjut ke [📦 Bab 2 — Setup & Instalasi](/bagian-1/bab-2) untuk melanjutkan perjalanan!
