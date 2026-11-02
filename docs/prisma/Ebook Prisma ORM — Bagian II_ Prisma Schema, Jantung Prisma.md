# 🔵 Ebook Prisma ORM — Bagian II: Prisma Schema, Jantung Prisma

> 🎯 **Tujuan Bagian II:** Menguasai Prisma Schema Language (PSL) secara menyeluruh — dari tipe data, attribute, enum, hingga semua jenis relasi antar model. Schema yang baik adalah fondasi aplikasi yang tidak akan bermasalah di kemudian hari.

---

# 📖 Bab 4 — Data Model & Field Types

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

# 📖 Bab 5 — Relasi Antar Model

Relasi adalah inti dari database relasional. Prisma membuat mendefinisikan dan menggunakan relasi jauh lebih mudah dari menulis JOIN di SQL mentah. Di bab ini kita bahas semua jenis relasi secara mendalam — dengan kode lengkap dan perbandingan SQL-nya.

---

## 🔗 5.1 One-to-One — Satu ke Satu

Setiap record di tabel A berhubungan dengan tepat satu record di tabel B, dan sebaliknya.

```
Diagram:
┌──────────┐          ┌──────────┐
│  User    │  1 ── 1  │  Profil  │
│          │          │          │
│ id       │◄─────────│ userId   │
│ email    │          │ bio      │
└──────────┘          │ foto     │
                      └──────────┘
```

```prisma
// prisma/schema.prisma

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  nama      String
  password  String
  profil    Profil?
  // ↑ Tanda ? berarti relasi ini opsional
  // Seorang user mungkin belum punya profil
  // Tanpa ?, TypeScript akan selalu expect Profil ada

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Profil {
  id      Int     @id @default(autoincrement())
  bio     String? @db.Text   // Biografi (opsional)
  foto    String?            // URL foto (opsional)
  telepon String?            // Nomor telepon (opsional)
  website String?            // URL website (opsional)

  // Foreign key — referensi ke User
  userId  Int     @unique    // @unique memastikan ONE-to-ONE!
  // Tanpa @unique → ini jadi One-to-Many (satu user banyak profil)
  user    User    @relation(
    fields:    [userId],     // Kolom di tabel Profil yang jadi FK
    references: [id],        // Kolom di tabel User yang dirujuk
    onDelete:  Cascade,      // Jika User dihapus → Profil ikut terhapus
    onUpdate:  Cascade,      // Jika User.id berubah → Profil.userId ikut berubah
  )

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("profil")
}
```

```typescript
// Penggunaan One-to-One di TypeScript

// ① Buat User beserta Profil sekaligus (nested create)
const userBaru = await prisma.user.create({
  data: {
    email:    'budi@email.com',
    nama:     'Budi Santoso',
    password: 'hashed_password',

    profil: {
      create: {               // Buat Profil baru sekaligus
        bio:     'Full stack developer',
        foto:    'https://cdn.example.com/foto/budi.jpg',
        telepon: '081234567890',
        website: 'https://budi.dev',
      }
    }
  },
  include: { profil: true }  // Return profil di response
})

console.log(userBaru.profil?.bio)  // "Full stack developer"

// ② Tambahkan Profil ke User yang sudah ada
const profil = await prisma.profil.create({
  data: {
    bio:    'UI/UX Designer',
    userId: 5,              // Connect ke user dengan id 5
  }
})

// ③ Ambil User beserta Profilnya
const user = await prisma.user.findUnique({
  where:   { email: 'budi@email.com' },
  include: { profil: true }
})

// Type-safe access:
user?.profil?.bio        // string | null | undefined
user?.profil?.telepon    // string | null | undefined

// ④ Update Profil melalui User
await prisma.user.update({
  where: { id: 1 },
  data: {
    profil: {
      update: {
        bio: 'Senior Full Stack Developer',
      }
    }
  }
})

// ⑤ Hapus Profil (User tetap ada karena onDelete: Cascade hanya satu arah)
await prisma.profil.delete({ where: { userId: 1 } })
// User tidak terhapus, hanya profil-nya

// ⑥ Ambil User tanpa Profil (cek yang belum punya profil)
const userTanpaProfil = await prisma.user.findMany({
  where: { profil: null }
})
```

---

## 📚 5.2 One-to-Many — Satu ke Banyak

Satu record di tabel A bisa berhubungan dengan banyak record di tabel B. Ini adalah relasi yang paling sering dipakai.

```
Diagram:
┌──────────┐          ┌──────────┐
│ Kategori │  1 ── ∞  │  Produk  │
│          │          │          │
│ id ──────┼──────────► kategoriId│
│ nama     │          │ nama     │
└──────────┘          │ harga    │
                      └──────────┘
```

```prisma
model Kategori {
  id          Int       @id @default(autoincrement())
  nama        String    @unique
  slug        String    @unique
  deskripsi   String?   @db.Text
  gambar      String?

  produk      Produk[]  // ← Array: satu kategori punya banyak produk
  // Ini adalah "virtual field" — tidak ada kolom ini di database!
  // Prisma menggunakannya untuk query JOIN otomatis

  createdAt   DateTime  @default(now())

  @@map("kategori")
}

model Produk {
  id          Int       @id @default(autoincrement())
  nama        String
  slug        String    @unique
  deskripsi   String?   @db.Text
  harga       Decimal   @db.Decimal(12, 2)
  stok        Int       @default(0)
  aktif       Boolean   @default(true)

  kategoriId  Int                   // ← Kolom ini ADA di database (foreign key)
  kategori    Kategori  @relation(
    fields:    [kategoriId],        // FK di tabel Produk
    references: [id],               // PK di tabel Kategori
    onDelete:  Restrict,            // Kategori tidak bisa dihapus jika masih punya produk
  )

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("produk")
  @@index([kategoriId])  // WAJIB! Semua FK harus punya index
  @@index([aktif, createdAt])
}
```

```typescript
// Penggunaan One-to-Many di TypeScript

// ① Buat Kategori beserta Produk sekaligus
const elektronik = await prisma.kategori.create({
  data: {
    nama:      'Elektronik',
    slug:      'elektronik',
    deskripsi: 'Gadget dan perangkat elektronik',

    produk: {
      create: [                     // Buat banyak produk sekaligus
        {
          nama:  'Laptop ASUS ROG Zephyrus',
          slug:  'laptop-asus-rog-zephyrus',
          harga: 25000000,
          stok:  5,
        },
        {
          nama:  'Mouse Logitech G502',
          slug:  'mouse-logitech-g502',
          harga: 850000,
          stok:  25,
        },
        {
          nama:  'Keyboard Mechanical Keychron K2',
          slug:  'keyboard-keychron-k2',
          harga: 1200000,
          stok:  15,
        },
      ]
    }
  },
  include: {
    produk: {
      orderBy: { harga: 'desc' }    // Urutkan produk dari termahal
    }
  }
})
console.log(`Kategori: ${elektronik.nama}`)
console.log(`Jumlah produk: ${elektronik.produk.length}`)

// ② Tambahkan produk ke kategori yang sudah ada
const produkBaru = await prisma.produk.create({
  data: {
    nama:       'Headphone Sony WH-1000XM5',
    slug:       'headphone-sony-wh1000xm5',
    harga:      4500000,
    stok:       8,
    kategoriId: elektronik.id,     // Hubungkan ke kategori via ID
    // Atau pakai connect:
    // kategori: { connect: { slug: 'elektronik' } }
  }
})

// ③ Ambil Kategori dengan semua Produknya
const kategoriDenganProduk = await prisma.kategori.findUnique({
  where:   { slug: 'elektronik' },
  include: {
    produk: {
      where:   { aktif: true, stok: { gt: 0 } }, // Filter produk
      orderBy: { harga: 'asc' },                  // Urutkan
      take:    10,                                 // Maksimal 10 produk
      select: {                                    // Hanya field yang dibutuhkan
        id:    true,
        nama:  true,
        harga: true,
        stok:  true,
      }
    },
    _count: { select: { produk: true } }          // Hitung total produk
  }
})

console.log(`Total: ${kategoriDenganProduk?._count.produk} produk`)

// ④ Ambil Produk beserta Kategorinya
const semuaProduk = await prisma.produk.findMany({
  where:   { aktif: true },
  include: { kategori: true },
  orderBy: { createdAt: 'desc' },
  take:    20,
})

semuaProduk.forEach(p => {
  console.log(`${p.nama} — ${p.kategori.nama}`)
  // Type-safe: p.kategori pasti ada (bukan nullable)
  // karena kategoriId adalah required field
})

// ⑤ Pindahkan produk ke kategori lain
await prisma.produk.update({
  where: { id: 1 },
  data:  { kategoriId: 2 }  // Pindah ke kategori lain
})

// ⑥ Hitung produk per kategori
const statKategori = await prisma.kategori.findMany({
  include: {
    _count: { select: { produk: true } }
  },
  orderBy: {
    produk: { _count: 'desc' }  // Urutkan kategori dari yang paling banyak produk
  }
})
```

---

## 🔄 5.3 Many-to-Many — Banyak ke Banyak

Satu record di tabel A bisa berhubungan dengan banyak record di tabel B, dan sebaliknya. Prisma mendukung dua cara: implicit (otomatis) dan explicit (dengan model pivot).

```
Diagram:
┌─────────┐          ┌───────────┐          ┌─────┐
│ Produk  │  ∞ ── ∞  │ ProdukTag │  ∞ ── ∞  │ Tag │
│         │          │           │          │     │
│ id ─────┼──────────► produkId  │          │ id  │
│ nama    │          │ tagId ────┼──────────► nama │
└─────────┘          └───────────┘          └─────┘
```

### Cara 1: Implicit Many-to-Many (Prisma Urus Sendiri)

```prisma
// Prisma otomatis buat tabel pivot "_ProdukToTag" di database
// Gunakan ini jika tabel pivot tidak butuh kolom tambahan

model Produk {
  id   Int    @id @default(autoincrement())
  nama String
  tags Tag[]  // ← Array menunjukkan relasi many-to-many
}

model Tag {
  id     Int      @id @default(autoincrement())
  nama   String   @unique
  produk Produk[] // ← Array di sisi lain juga
}
// Database akan punya tabel: _ProdukToTag (A: produkId, B: tagId)
```

```typescript
// Penggunaan Implicit Many-to-Many

// Buat produk dengan tag yang sudah ada
const produk = await prisma.produk.create({
  data: {
    nama: 'Laptop Gaming ASUS ROG',
    tags: {
      connect: [           // Hubungkan ke tag yang sudah ada (by unique field)
        { nama: 'gaming' },
        { nama: 'laptop' },
        { nama: 'asus'   },
      ]
    }
  },
  include: { tags: true }
})

// Buat produk dengan tag baru dan yang sudah ada
const produk2 = await prisma.produk.create({
  data: {
    nama: 'Headphone Sony',
    tags: {
      connect:         [{ nama: 'audio' }],  // Tag yang sudah ada
      create:          [{ nama: 'sony' }],   // Buat tag baru
      connectOrCreate: [{                    // Connect jika ada, buat jika belum
        where:  { nama: 'wireless' },
        create: { nama: 'wireless' },
      }]
    }
  },
  include: { tags: true }
})

// Tambahkan tag ke produk yang sudah ada
await prisma.produk.update({
  where: { id: 1 },
  data: {
    tags: {
      connect: [{ nama: 'new-arrival' }]
    }
  }
})

// Hapus tag dari produk (produk dan tag tetap ada, hanya hubungannya dihapus)
await prisma.produk.update({
  where: { id: 1 },
  data: {
    tags: {
      disconnect: [{ nama: 'gaming' }]
    }
  }
})

// Ganti SEMUA tag dengan set baru
await prisma.produk.update({
  where: { id: 1 },
  data: {
    tags: {
      set: [{ nama: 'sale' }, { nama: 'promo' }]
      // set menggantikan SEMUA tag yang ada dengan tag-tag ini
    }
  }
})

// Ambil produk beserta semua tag-nya
const produkDenganTag = await prisma.produk.findMany({
  include: { tags: true }
})

// Filter produk yang punya tag 'gaming'
const produkGaming = await prisma.produk.findMany({
  where: {
    tags: { some: { nama: 'gaming' } }
    // some: setidaknya satu tag bernama 'gaming'
  },
  include: { tags: true }
})
```

### Cara 2: Explicit Many-to-Many (dengan Model Pivot)

```prisma
// Gunakan ini jika tabel pivot butuh kolom tambahan
// Contoh: kapan tag ditambahkan, siapa yang menambahkan, urutan tampil

model Produk {
  id       Int         @id @default(autoincrement())
  nama     String
  produkTags ProdukTag[]  // Relasi melalui model pivot
}

model Tag {
  id       Int         @id @default(autoincrement())
  nama     String      @unique
  produkTags ProdukTag[]  // Relasi melalui model pivot
}

// Model pivot — bisa punya kolom tambahan!
model ProdukTag {
  produkId    Int
  tagId       Int

  // Kolom tambahan yang tidak bisa ada di implicit M2M:
  dibuatPada  DateTime  @default(now())  // Kapan tag ini ditambahkan
  dibuatOleh  Int?                       // Siapa yang menambahkan
  prioritas   Int       @default(0)      // Urutan tampil

  // Relasi ke model parent
  produk      Produk    @relation(fields: [produkId], references: [id], onDelete: Cascade)
  tag         Tag       @relation(fields: [tagId],    references: [id], onDelete: Cascade)

  @@id([produkId, tagId])  // Composite PK — satu produk hanya bisa punya satu entri per tag
  @@map("produk_tag")
  @@index([tagId])  // Index untuk query sebaliknya (cari produk by tag)
}
```

```typescript
// Penggunaan Explicit Many-to-Many

// Tambahkan tag ke produk (dengan data tambahan)
await prisma.produkTag.create({
  data: {
    produkId:   1,
    tagId:      5,
    dibuatOleh: userId,  // Siapa yang menambahkan tag ini
    prioritas:  1,       // Tag ini tampil pertama
  }
})

// Ambil produk dengan semua tag-nya (plus data pivot)
const produkDenganTag = await prisma.produk.findUnique({
  where:   { id: 1 },
  include: {
    produkTags: {
      include:  { tag: true },           // Include data tag
      orderBy:  { prioritas: 'asc' },    // Urutkan berdasarkan prioritas
    }
  }
})

// Akses nama tag:
produkDenganTag?.produkTags.forEach(pt => {
  console.log(`Tag: ${pt.tag.nama}, Prioritas: ${pt.prioritas}`)
  console.log(`Ditambahkan pada: ${pt.dibuatPada.toLocaleDateString('id-ID')}`)
})

// Hapus tag dari produk
await prisma.produkTag.delete({
  where: {
    produkId_tagId: {  // Composite key untuk where
      produkId: 1,
      tagId:    5,
    }
  }
})
```

> 💡 **Implicit vs Explicit — Kapan Pakai Yang Mana?**
> 
> ```
> Pakai IMPLICIT jika:
> ✅ Tabel pivot tidak butuh kolom tambahan
> ✅ Tidak perlu query ke tabel pivot secara langsung
> ✅ Penulisan kode lebih simpel
> 
> Pakai EXPLICIT jika:
> ✅ Butuh simpan data tambahan di relasi (kapan, siapa, urutan)
> ✅ Butuh query langsung ke tabel pivot
> ✅ Butuh filter/sort berdasarkan data di tabel pivot
> ```

---

## ↩️ 5.4 Self-Relation — Model Berelasi dengan Dirinya Sendiri

```prisma
// ① Contoh 1: Kategori dengan sub-kategori (tree structure)
model Kategori {
  id         Int        @id @default(autoincrement())
  nama       String
  slug       String     @unique

  // Self-relation: kategori bisa punya parent kategori
  parentId   Int?       // null = ini adalah kategori root
  parent     Kategori?  @relation("SubKategori", fields: [parentId], references: [id])
  children   Kategori[] @relation("SubKategori")
  // Nama relasi "SubKategori" harus sama di kedua sisi!

  @@map("kategori")
  @@index([parentId])
}
```

```typescript
// Penggunaan self-relation kategori

// Buat struktur kategori bertingkat
const elektronik = await prisma.kategori.create({
  data: {
    nama:     'Elektronik',
    slug:     'elektronik',
    parentId: null,          // Root kategori

    children: {
      create: [
        { nama: 'Laptop',    slug: 'laptop'    },
        { nama: 'Smartphone', slug: 'smartphone' },
        { nama: 'Audio',     slug: 'audio'     },
      ]
    }
  },
  include: { children: true }
})

// Ambil kategori dengan semua sub-kategorinya (nested)
const tree = await prisma.kategori.findMany({
  where:   { parentId: null },   // Hanya root kategori
  include: {
    children: {
      include: {
        children: true           // Sub-sub kategori (level 3)
      }
    }
  }
})
```

---

## ⚙️ 5.5 Referential Actions — onDelete & onUpdate

Ini menentukan apa yang terjadi pada record yang berelasi ketika record parent dihapus atau ID-nya berubah:

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id     Int  @id @default(autoincrement())
  judul  String
  userId Int
  user   User @relation(
    fields:    [userId],
    references: [id],
    onDelete:  Cascade,   // ← Pilih sesuai kebutuhan
    onUpdate:  Cascade,
  )
}
```

```
Penjelasan semua pilihan Referential Action:

┌─────────────┬────────────────────────────────────────────────────────┐
│   Action    │  Apa yang terjadi pada record CHILD?                   │
├─────────────┼────────────────────────────────────────────────────────┤
│  Cascade    │  Child IKUT TERHAPUS/TERUPDATE bersama parent          │
│             │  Pakai untuk: Comment saat Post dihapus,               │
│             │               Item pesanan saat Pesanan dihapus        │
├─────────────┼────────────────────────────────────────────────────────┤
│  SetNull    │  FK di child di-set menjadi NULL                       │
│             │  Syarat: FK field harus nullable (Int?)                │
│             │  Pakai untuk: Post saat Author dihapus                 │
│             │               (post tetap ada tapi orphan)             │
├─────────────┼────────────────────────────────────────────────────────┤
│  SetDefault │  FK di child di-set ke nilai @default                  │
│             │  Jarang dipakai, harus ada @default di FK field        │
├─────────────┼────────────────────────────────────────────────────────┤
│  Restrict   │  ERROR — parent TIDAK BISA dihapus jika punya child   │
│             │  Pakai untuk: Kategori yang masih punya Produk,        │
│             │               User yang masih punya Pesanan aktif      │
├─────────────┼────────────────────────────────────────────────────────┤
│  NoAction   │  Seperti Restrict, cek dilakukan di akhir transaction  │
│             │  Lebih fleksibel untuk operasi kompleks dalam satu tx  │
└─────────────┴────────────────────────────────────────────────────────┘
```

```prisma
// Contoh penggunaan yang tepat:

model User {
  id       Int       @id @default(autoincrement())
  posts    Post[]
  pesanan  Pesanan[]
  komentar Komentar[]
}

model Post {
  userId Int
  user   User @relation(fields: [userId], references: [id],
    onDelete: Cascade  // Post dihapus jika User dihapus
  )
  komentar Komentar[]
}

model Komentar {
  postId Int
  post   Post @relation(fields: [postId], references: [id],
    onDelete: Cascade  // Komentar dihapus jika Post dihapus
  )
  userId Int?          // Nullable! Komentar bisa anonim
  user   User? @relation(fields: [userId], references: [id],
    onDelete: SetNull  // Komentar tetap ada (authorId jadi null) jika User dihapus
  )
}

model Pesanan {
  userId Int
  user   User @relation(fields: [userId], references: [id],
    onDelete: Restrict  // User TIDAK BISA dihapus jika masih punya pesanan!
  )
}
```

---

## 🔍 5.6 Studi Kasus — Schema E-Commerce Lengkap

Berikut contoh schema realistis yang menggabungkan semua jenis relasi:

```prisma
// Schema e-commerce yang menggabungkan semua jenis relasi

model Pengguna {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  nama         String
  password     String
  role         RolePengguna @default(PEMBELI)

  // One-to-One
  profil       Profil?

  // One-to-Many (sebagai "satu")
  pesanan      Pesanan[]
  ulasan       Ulasan[]
  alamat       Alamat[]

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  deletedAt    DateTime?  // Soft delete

  @@map("pengguna")
  @@index([email])
}

model Profil {
  id       Int      @id @default(autoincrement())
  bio      String?  @db.Text
  foto     String?
  telepon  String?

  // One-to-One dengan Pengguna
  penggunaId Int    @unique
  pengguna   Pengguna @relation(fields: [penggunaId], references: [id], onDelete: Cascade)

  @@map("profil")
}

model Kategori {
  id       Int        @id @default(autoincrement())
  nama     String     @unique
  slug     String     @unique
  gambar   String?

  // Self-relation (sub-kategori)
  parentId Int?
  parent   Kategori?  @relation("Subkategori", fields: [parentId], references: [id])
  children Kategori[] @relation("Subkategori")

  // One-to-Many dengan Produk
  produk   Produk[]

  @@map("kategori")
  @@index([parentId])
  @@index([slug])
}

model Produk {
  id          Int            @id @default(autoincrement())
  nama        String
  slug        String         @unique
  deskripsi   String?        @db.Text
  harga       Decimal        @db.Decimal(12, 2)
  stok        Int            @default(0)
  aktif       Boolean        @default(true)
  gambar      Json?          // Array URL gambar

  // One-to-Many (sebagai "banyak") — relasi ke Kategori
  kategoriId  Int
  kategori    Kategori       @relation(fields: [kategoriId], references: [id], onDelete: Restrict)

  // Many-to-Many implicit — relasi ke Tag
  tags        Tag[]

  // One-to-Many (sebagai "satu") — relasi ke ItemPesanan dan Ulasan
  itemPesanan ItemPesanan[]
  ulasan      Ulasan[]

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?

  @@map("produk")
  @@index([kategoriId])
  @@index([aktif, harga])
  @@index([slug])
}

model Tag {
  id     Int      @id @default(autoincrement())
  nama   String   @unique
  slug   String   @unique
  warna  String?  // Hex color untuk UI badge

  // Many-to-Many implicit — relasi ke Produk
  produk Produk[]

  @@map("tags")
}

model Pesanan {
  id            Int           @id @default(autoincrement())
  kodePesanan   String        @unique @default(cuid())
  status        StatusPesanan @default(MENUNGGU_PEMBAYARAN)
  total         Decimal       @db.Decimal(12, 2)
  catatan       String?       @db.Text
  alamatKirim   Json          // Snapshot alamat saat checkout

  // One-to-Many (sebagai "banyak") — relasi ke Pengguna
  penggunaId    Int
  pengguna      Pengguna      @relation(fields: [penggunaId], references: [id], onDelete: Restrict)

  // One-to-Many (sebagai "satu") — relasi ke ItemPesanan
  items         ItemPesanan[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("pesanan")
  @@index([penggunaId])
  @@index([status])
  @@index([kodePesanan])
}

model ItemPesanan {
  id          Int     @id @default(autoincrement())
  jumlah      Int
  hargaSatuan Decimal @db.Decimal(12, 2)
  // Snapshot harga saat checkout — penting! Harga produk bisa berubah nanti

  pesananId   Int
  pesanan     Pesanan @relation(fields: [pesananId], references: [id], onDelete: Cascade)

  produkId    Int
  produk      Produk  @relation(fields: [produkId], references: [id], onDelete: Restrict)

  @@map("item_pesanan")
  @@index([pesananId])
  @@index([produkId])
}

model Ulasan {
  id         Int     @id @default(autoincrement())
  rating     Int     // 1-5
  judul      String?
  konten     String? @db.Text
  terverifikasi Boolean @default(false) // Apakah pembeli memang sudah beli produk ini

  penggunaId Int
  pengguna   Pengguna @relation(fields: [penggunaId], references: [id], onDelete: Cascade)

  produkId   Int
  produk     Produk   @relation(fields: [produkId],   references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())

  @@unique([penggunaId, produkId])  // Satu pengguna hanya bisa review satu kali per produk
  @@map("ulasan")
  @@index([produkId])
  @@index([rating])
}

model Alamat {
  id          Int      @id @default(autoincrement())
  label       String   // "Rumah", "Kantor", dll
  penerima    String
  telepon     String
  jalan       String   @db.Text
  kota        String
  provinsi    String
  kodePos     String   @db.Char(5)
  isDefault   Boolean  @default(false)

  penggunaId  Int
  pengguna    Pengguna @relation(fields: [penggunaId], references: [id], onDelete: Cascade)

  @@map("alamat")
  @@index([penggunaId])
}

enum RolePengguna {
  ADMIN
  MANAJER
  EDITOR
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
```

---

## ✅ Checklist Bab 5

```
□ Memahami perbedaan One-to-One, One-to-Many, dan Many-to-Many
□ Bisa menentukan di sisi mana foreign key diletakkan
□ Memahami perbedaan implicit vs explicit Many-to-Many
□ Tahu kapan pakai onDelete: Cascade vs Restrict vs SetNull
□ Bisa membaca diagram relasi dan menerjemahkannya ke schema Prisma
□ Semua foreign key sudah punya @@index
□ Paham bahwa "virtual field" (produk Produk[]) tidak membuat kolom di database
```

---

---

# 📖 Bab 6 — Schema Lanjutan & Multi-Database

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