---
title: "Bab 4 — Data Model & Field Types"
---

Schema Prisma adalah **satu sumber kebenaran** untuk seluruh struktur database kamu. Dari satu file `schema.prisma`, Prisma bisa generate TypeScript types, SQL migration, dan diagram relasi secara otomatis. Kalau schema salah, semuanya salah — itulah mengapa bab ini adalah yang paling kritis.

---

## 🏗️ 4.1 Anatomi Sebuah Model

Sebelum membahas tipe data satu per satu, penting untuk memahami seluruh bagian penyusun sebuah model Prisma dan apa fungsinya:

```prisma
//   ①     ②        ③           ④              ⑤
model Produk {
  id          Int      @id         @default(autoincrement())
  nama        String
  slug        String   @unique
  harga       Decimal  @db.Decimal(12, 2)
  deskripsi   String?  @db.Text
  // ↑ Tanda ? = field ini nullable (boleh null/kosong)
  stok        Int      @default(0)
  aktif       Boolean  @default(true)
  gambar      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // ↑ @updatedAt: otomatis diisi saat record diubah

  // ⑥ Block-level attributes (dimulai dengan @@)
  @@map("produk")              // Nama tabel di DB: "produk"
  @@index([nama])              // Index untuk performa query
  @@index([aktif, createdAt])  // Composite index
  @@unique([nama, slug])       // Kombinasi nama+slug harus unik
}

// Penjelasan tiap bagian:
// ① Keyword 'model' — deklarasi bahwa ini adalah representasi tabel
// ② Nama model (PascalCase) — konvensi Prisma, di DB akan di-map via @@map
// ③ Nama field (camelCase) — nama yang dipakai di kode TypeScript
// ④ Tipe data Prisma — menentukan tipe TypeScript dan kolom SQL
// ⑤ Field attributes (dimulai @) — modifikasi perilaku field
// ⑥ Block attributes (dimulai @@) — pengaturan di level tabel
```

---

## 📊 4.2 Semua Tipe Data Prisma — Lengkap dengan SQL Equivalent

Prisma memiliki tipe data universal yang diterjemahkan ke tipe kolom spesifik database. Berikut peta lengkapnya:

```prisma
model ReferensiTipeData {
  id Int @id @default(autoincrement())

  // ═══════════════════════════════════════════════════════
  // STRING — Teks
  // ═══════════════════════════════════════════════════════

  namaDefault   String
  // MySQL:      VARCHAR(191) — batas 191 karena utf8mb4 index limit
  // PostgreSQL: TEXT — tidak ada batas panjang default

  namaVarchar   String  @db.VarChar(255)
  // MySQL & PG: VARCHAR(255) — panjang maksimal 255 karakter
  // Pakai ini jika butuh batas panjang eksplisit

  kodePos       String  @db.Char(5)
  // MySQL & PG: CHAR(5) — panjang TETAP, selalu 5 karakter
  // Cocok untuk: kode pos, kode negara, nomor identitas panjang tetap

  kontenPanjang String  @db.Text
  // MySQL:      TEXT — hingga 65.535 karakter (~64 KB)
  // PostgreSQL: TEXT — tidak ada batas praktis
  // Cocok untuk: artikel, deskripsi panjang, HTML content

  kontenSangatPanjang String @db.LongText
  // MySQL SAJA:  LONGTEXT — hingga 4GB
  // PostgreSQL: Gunakan @db.Text saja (sudah unlimited)
  // Cocok untuk: konten yang sangat panjang di MySQL

  namaNullable  String?
  // Tanda ? membuat field ini nullable
  // SQL: VARCHAR(191) NULL (bukan NOT NULL)


  // ═══════════════════════════════════════════════════════
  // ANGKA — Numerik
  // ═══════════════════════════════════════════════════════

  umur          Int
  // MySQL & PG: INTEGER (32-bit) — range: -2,147,483,648 s/d 2,147,483,647
  // Cocok untuk: umur, jumlah, stok, rating

  stokBesar     Int     @db.UnsignedInt
  // MySQL SAJA: UNSIGNED INT — hanya positif, range 0 s/d 4,294,967,295
  // 2x lebih besar dari INT untuk nilai positif
  // Cocok untuk: counter, stok yang tidak mungkin negatif

  idBesar       BigInt
  // MySQL & PG: BIGINT (64-bit) — untuk angka yang sangat besar
  // Cocok untuk: ID Twitter-style, jumlah like viral, timestamp microsecond

  harga         Decimal @db.Decimal(12, 2)
  // MySQL & PG: DECIMAL(12, 2)
  // 12 = total digit, 2 = digit setelah koma
  // WAJIB untuk uang! Float rawan presisi error
  // Contoh: 9,999,999,999.99 (10 digit + 2 desimal)

  rating        Float
  // MySQL:      DOUBLE (64-bit floating point)
  // PostgreSQL: DOUBLE PRECISION
  // ⚠️ Jangan pakai untuk uang! Gunakan Decimal
  // Cocok untuk: koordinat GPS, persentase, nilai ilmiah

  persentase    Float   @db.DoublePrecision
  // PostgreSQL: Eksplisit double precision
  // MySQL: DOUBLE (sama dengan Float)


  // ═══════════════════════════════════════════════════════
  // BOOLEAN
  // ═══════════════════════════════════════════════════════

  aktif         Boolean @default(true)
  // MySQL:      TINYINT(1) — 0 = false, 1 = true
  // PostgreSQL: BOOLEAN (native)
  // Prisma menangani konversi otomatis di kedua database


  // ═══════════════════════════════════════════════════════
  // TANGGAL & WAKTU
  // ═══════════════════════════════════════════════════════

  dibuatPada    DateTime @default(now())
  // MySQL:      DATETIME(3) — presisi millisecond
  // PostgreSQL: TIMESTAMP(3) WITH TIME ZONE
  // @default(now()) → diisi otomatis saat record dibuat

  diupdatePada  DateTime @updatedAt
  // MySQL & PG: DATETIME/TIMESTAMP
  // @updatedAt → diisi otomatis SETIAP KALI record diubah
  // Ini adalah fitur Prisma, bukan fitur database native

  tanggalLahir  DateTime @db.Date
  // MySQL & PG: DATE — hanya tanggal tanpa jam (YYYY-MM-DD)
  // Cocok untuk: tanggal lahir, tanggal kadaluarsa

  waktuBuka     DateTime @db.Time
  // MySQL & PG: TIME — hanya jam tanpa tanggal (HH:MM:SS)
  // Cocok untuk: jam operasional, durasi


  // ═══════════════════════════════════════════════════════
  // JSON — Data Terstruktur Fleksibel
  // ═══════════════════════════════════════════════════════

  metadata      Json?
  // MySQL 5.7.8+: JSON column native
  // PostgreSQL:   JSONB (binary JSON — lebih cepat & bisa di-index)
  // Cocok untuk: konfigurasi fleksibel, data yang strukturnya sering berubah

  tags          Json    @default("[]")
  // JSON dengan default nilai array kosong
  // Hati-hati: Prisma tidak bisa filter/sort berdasarkan isi JSON
  // Jika butuh query ke dalam JSON → pakai relasi ke tabel Tag

  settingPengguna Json  @default("{}")
  // JSON dengan default object kosong


  // ═══════════════════════════════════════════════════════
  // BYTES — Data Biner
  // ═══════════════════════════════════════════════════════

  thumbnail     Bytes?
  // MySQL:      BLOB (Binary Large Object)
  // PostgreSQL: BYTEA
  // ⚠️ Umumnya lebih baik simpan file di storage (S3, Cloudinary)
  // dan simpan URL-nya sebagai String
  // Gunakan Bytes hanya untuk file kecil atau enkripsi
}
```

### Ringkasan: Kapan Pakai Tipe Apa?

| Kebutuhan | Tipe Prisma | Catatan |
| --- | --- | --- |
| ID, jumlah, stok | `Int` | Range ±2 milyar |
| ID sosmed, counter besar | `BigInt` | Range ±9 kuintilion |
| **Harga, uang** | `Decimal` | **Wajib! Jangan Float** |
| Koordinat, persentase | `Float` | Tidak presisi untuk uang |
| Nama, judul, URL | `String` | Default VARCHAR(191) di MySQL |
| Artikel, deskripsi panjang | `String @db.Text` | Tidak ada batas panjang |
| Ya/tidak, aktif/nonaktif | `Boolean` |  |
| Waktu dibuat/diubah | `DateTime` | Kombinasikan dengan `@default(now())` atau `@updatedAt` |
| Hanya tanggal | `DateTime @db.Date` |  |
| Konfigurasi fleksibel | `Json` | Hindari jika butuh query ke dalam value |
| File kecil, enkripsi | `Bytes` | Umumnya simpan URL saja |

---

## 🔑 4.3 Primary Key — Semua Pilihan

Primary key adalah identitas unik setiap record. Pilihan yang tepat bergantung pada kebutuhan aplikasi:

```prisma
// ① AUTO-INCREMENT INTEGER — Paling umum, paling simpel
model User {
  id Int @id @default(autoincrement())
  // MySQL: AUTO_INCREMENT, mulai dari 1
  // PostgreSQL: SERIAL atau GENERATED ALWAYS AS IDENTITY
  // Keuntungan: ringkas, urut, mudah dibaca
  // Kelemahan: mudah ditebak (hacker bisa coba /users/1, /users/2, ...)
}

// ② AUTO-INCREMENT BIGINT — Untuk data yang sangat besar
model Log {
  id BigInt @id @default(autoincrement())
  // Pakai saat Int sudah tidak cukup (> 2 milyar record)
  // Contoh: log aktivitas, event tracking, analitik
}

// ③ CUID — Collision-resistant Unique ID
model Post {
  id String @id @default(cuid())
  // Contoh output: clh3zpf0w0000356yq8tuf7yx
  // Keuntungan: aman (tidak bisa ditebak), bisa di-generate di client
  //             lebih pendek dari UUID, berurutan secara waktu
  // Cocok untuk: ID publik yang tidak boleh mudah ditebak
}

// ④ UUID — Universal Unique Identifier (standard industri)
model File {
  id String @id @default(uuid())
  // Contoh output: 550e8400-e29b-41d4-a716-446655440000
  // Keuntungan: standard universal, cocok untuk sistem terdistribusi
  // Kelemahan: panjang (36 karakter), tidak berurutan
}

// ⑤ UUID native PostgreSQL (lebih efisien)
model Token {
  // @db.Uuid → simpan sebagai tipe UUID native PG (bukan VARCHAR)
  // dbgenerated() → database yang generate, bukan Prisma
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  // Hanya PostgreSQL!
}

// ⑥ COMPOSITE PRIMARY KEY — Dua kolom jadi satu PK
model ItemKeranjang {
  penggunaId Int
  produkId   Int
  jumlah     Int
  dibuatPada DateTime @default(now())

  @@id([penggunaId, produkId])
  // Kombinasi penggunaId + produkId harus unik
  // Satu pengguna hanya bisa punya satu entri per produk di keranjang
}

// ⑦ MANUAL / NATURAL KEY — Nilai diisi dari aplikasi
model Konfigurasi {
  kunci String @id
  // Nilai diisi manual: "NAMA_APLIKASI", "VERSI", "MODE_MAINTENANCE"
  nilai String
}
```

> 💡 **Rekomendasi Praktis:**
> 
> - Untuk entitas internal (User, Post, Produk) → gunakan `Int @id @default(autoincrement())`
> - Untuk resource yang URL-nya public → gunakan `String @id @default(cuid())` agar tidak mudah ditebak
> - Untuk tabel pivot many-to-many → gunakan `@@id([field1, field2])`

---

## 🏷️ 4.4 Field Attributes — Semua yang Tersedia

Field attributes adalah modifier yang mengubah perilaku sebuah field:

```prisma
model ContohAttributes {

  // ─── @id ──────────────────────────────────────────────────────
  id Int @id
  // Menandai field ini sebagai primary key
  // Wajib ada satu @id di setiap model (kecuali pakai @@id)

  // ─── @unique ──────────────────────────────────────────────────
  email    String @unique
  username String @unique
  // Nilai di kolom ini tidak boleh sama antar record
  // SQL: UNIQUE INDEX dibuat otomatis
  // TypeScript: bisa dipakai di where: { email: '...' } (bukan hanya id)

  // ─── @default ─────────────────────────────────────────────────
  status    String   @default("aktif")        // String literal
  stok      Int      @default(0)              // Angka
  aktif     Boolean  @default(true)           // Boolean
  dibuatPada DateTime @default(now())         // Fungsi: waktu saat ini
  kode      String   @default(cuid())         // Fungsi: generate CUID
  uuid      String   @default(uuid())         // Fungsi: generate UUID
  nilai     Int      @default(dbgenerated("FLOOR(RAND() * 1000)"))
  // dbgenerated(): SQL expression yang dieksekusi oleh database
  // Berguna untuk nilai yang hanya database yang bisa hitung

  // ─── @updatedAt ───────────────────────────────────────────────
  diupdatePada DateTime @updatedAt
  // Prisma OTOMATIS mengisi field ini dengan waktu saat ini
  // setiap kali record diupdate — kamu tidak perlu melakukannya manual
  // Hanya untuk tipe DateTime!

  // ─── @map ─────────────────────────────────────────────────────
  namaLengkap  String @map("nama_lengkap")
  tanggalLahir DateTime @map("tanggal_lahir")
  // Nama field di Prisma (camelCase) ≠ nama kolom di database (snake_case)
  // Di Prisma  : pakai namaLengkap
  // Di database: kolom bernama nama_lengkap

  // ─── @db ──────────────────────────────────────────────────────
  bio       String  @db.Text           // TEXT (bukan VARCHAR)
  harga     Decimal @db.Decimal(12, 2) // DECIMAL dengan presisi spesifik
  kode      String  @db.Char(6)        // CHAR panjang tetap
  konten    String  @db.LongText       // LONGTEXT (MySQL saja)
  // @db memungkinkan kamu memilih tipe kolom database yang spesifik
  // ketika tipe Prisma default tidak cukup presisi

  // ─── @ignore ──────────────────────────────────────────────────
  fieldLegacy String @ignore
  // Field ini ada di database tapi diabaikan oleh Prisma Client
  // Berguna saat: database lama punya kolom yang tidak ingin diekspos
  // atau kolom yang dikelola langsung oleh database (trigger, dll)
}
```

---

## 📐 4.5 Block Attributes — Pengaturan Level Tabel

Block attributes (dimulai `@@`) mengatur perilaku di level tabel keseluruhan:

```prisma
model Produk {
  id         Int    @id @default(autoincrement())
  nama       String
  slug       String
  sku        String  // Stock Keeping Unit
  kategoriId Int
  harga      Decimal @db.Decimal(12, 2)
  aktif      Boolean @default(true)
  createdAt  DateTime @default(now())

  // ─── @@map ────────────────────────────────────────────────────
  @@map("produk")
  // Nama model di Prisma: "Produk"
  // Nama tabel di database: "produk"
  // Tanpa @@map, tabel akan bernama "Produk" (dengan huruf besar P)
  // Best practice: snake_case di database, PascalCase di Prisma

  // ─── @@unique ─────────────────────────────────────────────────
  @@unique([nama, kategoriId])
  // Kombinasi nama + kategoriId harus unik
  // Artinya: produk bernama "Laptop" boleh ada di banyak kategori
  //          tapi tidak boleh ada dua "Laptop" di kategori yang sama
  // SQL: UNIQUE INDEX pada kedua kolom ini

  @@unique([slug])     // Bisa juga single field (sama dengan @unique di field)
  @@unique([sku])      // Atau beberapa @@unique terpisah

  // ─── @@index ──────────────────────────────────────────────────
  @@index([kategoriId])
  // Buat index pada kolom kategoriId
  // SANGAT PENTING untuk performa! Foreign key harus selalu punya index
  // Tanpa index: query WHERE kategori_id = ? akan scan seluruh tabel

  @@index([aktif, createdAt])
  // Composite index — optimal untuk query:
  // WHERE aktif = true ORDER BY created_at DESC
  // Urutan kolom penting: kolom yang difilter duluan, lalu yang di-sort

  @@index([harga(sort: Asc)])
  // Index dengan urutan tertentu — cocok untuk sort berulang

  // ─── @@id ─────────────────────────────────────────────────────
  // @@id([field1, field2]) — Composite primary key
  // (hanya pakai jika tidak ada @id di field)
}
```

> ⚠️ **Tentang Index:** Index mempercepat query `SELECT` tapi memperlambat `INSERT/UPDATE/DELETE` karena database harus memperbarui index juga. Pasang index pada:
> 
> - Semua kolom foreign key (`kategoriId`, `userId`, dll)
> - Kolom yang sering dipakai di `WHERE` clause
> - Kolom yang sering dipakai di `ORDER BY`
> - **Jangan** index semua kolom — pilih yang benar-benar dibutuhkan

---

## 🔢 4.6 Enum — Nilai yang Sudah Ditentukan

Enum adalah cara mendefinisikan kolom yang hanya boleh berisi nilai-nilai tertentu. Lebih aman dari String biasa karena TypeScript langsung error kalau kamu typo.

```prisma
// Definisi Enum — tulis di luar model
enum StatusPesanan {
  MENUNGGU_PEMBAYARAN   // Pesanan baru, belum dibayar
  DIBAYAR               // Pembayaran sudah dikonfirmasi
  DIPROSES              // Sedang disiapkan oleh penjual
  DIKIRIM               // Dalam pengiriman
  SELESAI               // Sudah diterima pembeli
  DIBATALKAN            // Dibatalkan oleh pembeli atau penjual

  @@map("status_pesanan") // Nama enum di database (MySQL)
}

enum RolePengguna {
  ADMIN
  MANAJER
  EDITOR
  PEMBELI
}

enum StatusProduk {
  AKTIF
  NONAKTIF
  HABIS
  DIHAPUS
}

enum MetodePembayaran {
  TRANSFER_BANK
  KARTU_KREDIT
  DOMPET_DIGITAL
  BAYAR_DI_TEMPAT
}

// Penggunaan enum di model
model Pesanan {
  id              Int              @id @default(autoincrement())
  kodePesanan     String           @unique @default(cuid())
  status          StatusPesanan    @default(MENUNGGU_PEMBAYARAN)
  metodePembayaran MetodePembayaran
  total           Decimal          @db.Decimal(12, 2)
  // ...
}

model Pengguna {
  id   Int          @id @default(autoincrement())
  role RolePengguna @default(PEMBELI)
  // ...
}
```

```typescript
// Penggunaan di TypeScript — Prisma generate enum sebagai TypeScript enum
import { prisma }                                    from './lib/prisma'
import { StatusPesanan, RolePengguna, StatusProduk } from '@prisma/client'

// ✅ Type-safe — tidak bisa typo
const pesananDiproses = await prisma.pesanan.findMany({
  where: { status: StatusPesanan.DIPROSES }
})

// ✅ IDE autocomplete muncul saat ketik StatusPesanan.
const pesananAktif = await prisma.pesanan.findMany({
  where: {
    status: {
      in: [StatusPesanan.DIBAYAR, StatusPesanan.DIPROSES, StatusPesanan.DIKIRIM]
    }
  }
})

// ✅ Update status dengan aman
await prisma.pesanan.update({
  where: { id: 1 },
  data:  { status: StatusPesanan.SELESAI }
})

// ❌ Error saat compile — SELESAI_SEMUA tidak ada di enum
await prisma.pesanan.update({
  where: { id: 1 },
  data:  { status: StatusPesanan.SELESAI_SEMUA }  // ERROR!
})
```

> 💡 **Enum vs String biasa:**
> 
> ```
> // String biasa — rawan typo, tidak ada validasi
> status: 'diproses'   // ✅ benar
> status: 'di proses'  // Typo! Tapi tidak ada error
> status: 'Diproses'   // Case beda! Query tidak ketemu
> 
> // Enum — dijamin benar, error langsung di editor
> status: StatusPesanan.DIPROSES  // ✅ selalu benar
> status: StatusPesanan.Di_Proses // ERROR saat compile!
> ```

---

## 🏷️ 4.7 Naming Conventions — Best Practice

```prisma
// ✅ KONVENSI YANG DIREKOMENDASIKAN:

// Model: PascalCase
model UserProfil { ... }      // ✅ PascalCase
model produk { ... }          // ❌ lowercase
model user_profil { ... }     // ❌ snake_case

// Field: camelCase
model Produk {
  id          Int    @id       // ✅ camelCase (id cukup, tidak perlu produkId)
  namaLengkap String           // ✅ camelCase
  hargaJual   Decimal          // ✅ camelCase
  NamaLengkap String           // ❌ PascalCase
  nama_lengkap String          // ❌ snake_case
}

// Tabel di DB: snake_case via @@map
model UserProfil {
  id          Int    @id @default(autoincrement())
  namaLengkap String @map("nama_lengkap")  // Kolom: nama_lengkap

  @@map("user_profil")  // Tabel: user_profil
}
// Prisma: prisma.userProfil.findMany()
// SQL:    SELECT * FROM user_profil

// Enum: SCREAMING_SNAKE_CASE
enum StatusPesanan {
  MENUNGGU_PEMBAYARAN   // ✅ SCREAMING_SNAKE_CASE
  dibayar               // ❌ lowercase
  sudahDikirim          // ❌ camelCase
}

// Foreign key: namaModelId (camelCase + Id)
model Produk {
  kategoriId  Int        // ✅
  id_kategori Int        // ❌
  KategoriId  Int        // ❌
}
```

---

## ✅ Checklist Bab 4

```
□ Memahami perbedaan @id, @@id, dan @unique, @@unique
□ Bisa memilih tipe data yang tepat (terutama Decimal vs Float untuk uang)
□ Mengerti kapan pakai @db untuk native database types
□ Tahu perbedaan @map (field) dan @@map (tabel)
□ Sudah pasang @@index pada semua foreign key di schema
□ Menggunakan Enum untuk kolom dengan nilai terbatas
□ Mengikuti naming conventions: model PascalCase, field camelCase, tabel snake_case
```

---

---

---

🚀 Lanjut ke [🧩 Bab 5 — Relasi Antar Model](/bagian-2/bab-5) untuk melanjutkan perjalanan!
