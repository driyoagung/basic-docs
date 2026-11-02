---
title: "Bab 19 — Optimasi Query & Performa"
---

Performance issue di database adalah salah satu penyebab aplikasi lambat yang paling sering terjadi — dan paling mudah dicegah jika tahu caranya dari awal.

---

## 🔴 19.1 N+1 Problem — Musuh Utama Performa

N+1 adalah masalah performa yang paling sering ditemui developer yang baru pakai ORM. Namanya berasal dari jumlah query yang dieksekusi: **1 query** untuk ambil daftar data + **N query** untuk ambil relasi masing-masing — sehingga total menjadi N+1 query.

```typescript
// ════════════════════════════════════════════════════════════
// ❌ CONTOH N+1 PROBLEM
// ════════════════════════════════════════════════════════════

// Query 1: Ambil 10 produk
const produk = await prisma.produk.findMany({ take: 10 })
// SQL: SELECT * FROM produk LIMIT 10
// → 10 produk dimuat

for (const p of produk) {
  // Query 2-11: Ambil kategori SETIAP produk secara terpisah!
  const kategori = await prisma.kategori.findUnique({
    where: { id: p.kategoriId }
  })
  console.log(`${p.nama} — ${kategori?.nama}`)
}

// Total: 1 + 10 = 11 query ke database!
// Dengan 100 produk: 101 query!
// Dengan 1000 produk: 1001 query! → Aplikasi bisa timeout/crash


// ════════════════════════════════════════════════════════════
// ✅ SOLUSI — Pakai include atau select dengan relasi
// ════════════════════════════════════════════════════════════

// Satu query dengan JOIN — jauh lebih efisien!
const produkDenganKategori = await prisma.produk.findMany({
  take:    10,
  include: { kategori: true }
  // SQL: SELECT p.*, k.* FROM produk p
  //      LEFT JOIN kategori k ON p.kategori_id = k.id
  //      LIMIT 10
  // → Hanya 1-2 query!
})

produkDenganKategori.forEach(p => {
  console.log(`${p.nama} — ${p.kategori.nama}`)
})


// ════════════════════════════════════════════════════════════
// ❌ N+1 yang lebih halus — sulit dideteksi!
// ════════════════════════════════════════════════════════════

// Ini tampak seperti kode yang benar...
async function getProdukDenganTag(ids: number[]) {
  const results = []

  for (const id of ids) {
    // Tapi ini query database di dalam loop!
    const produk = await prisma.produk.findUnique({
      where:   { id },
      include: { tags: true }
    })
    if (produk) results.push(produk)
  }

  return results
}

// ✅ PERBAIKAN — Ambil semua sekaligus
async function getProdukDenganTagOptimal(ids: number[]) {
  return prisma.produk.findMany({
    where:   { id: { in: ids } },  // IN clause — satu query!
    include: { tags: true },
    orderBy: { id: 'asc' }
  })
}
```

### Cara Deteksi N+1 Problem

```typescript
// Aktifkan query logging di development untuk deteksi N+1

const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'query' }],
})

let queryCount = 0

prisma.$on('query', (e) => {
  queryCount++
  if (process.env.DEBUG_QUERIES) {
    console.log(`Query #${queryCount}: ${e.query.substring(0, 100)}...`)
  }
})

// Jalankan operasi dan cek jumlah query
queryCount = 0
await getDataYangMungkinN1()
console.log(`Total queries: ${queryCount}`)
// Jika angkanya besar dan proporsional dengan jumlah data → N+1!
```

---

## ⚡ 19.2 Optimasi SELECT — Hanya Ambil Yang Dibutuhkan

```typescript
// Ini adalah optimasi paling mudah dan paling berdampak!
// Semakin sedikit data yang diambil = semakin cepat query

// ════════════════════════════════════════════════════════════
// ❌ TIDAK EFISIEN — Ambil semua kolom
// ════════════════════════════════════════════════════════════
const produk = await prisma.produk.findMany()
// SQL: SELECT id, nama, slug, deskripsi, harga, stok, gambar,
//             aktif, views, kategori_id, created_at, updated_at, deleted_at
//      FROM produk
//
// 'deskripsi' bisa berisi ribuan karakter per produk
// Kalau ada 100 produk = 100x teks panjang dimuat ke memory!
// Network transfer juga jauh lebih besar

// ════════════════════════════════════════════════════════════
// ✅ EFISIEN — Hanya field yang ditampilkan
// ════════════════════════════════════════════════════════════
// Untuk halaman listing produk (kartu produk kecil):
const produkListing = await prisma.produk.findMany({
  select: {
    id:     true,
    nama:   true,
    slug:   true,
    harga:  true,
    gambar: true,
    stok:   true,
    // deskripsi: TIDAK diambil — tidak ditampilkan di listing
    // views, aktif, deletedAt: TIDAK diambil — tidak diperlukan
    kategori: { select: { nama: true, slug: true } },
    _count:   { select: { ulasan: true } },  // Hanya angka, bukan data ulasan
  },
  take: 12,
})

// Untuk halaman detail produk (semua info diperlukan):
const produkDetail = await prisma.produk.findUnique({
  where:   { slug: 'laptop-asus-rog' },
  include: {
    kategori: true,
    tags:     true,
    ulasan: {
      take:    5,                    // Hanya 5 ulasan terbaru
      orderBy: { createdAt: 'desc' },
      select: {
        rating:   true,
        komentar: true,
        createdAt: true,
        pengguna: { select: { nama: true, inisialNama: true } }
      }
    },
    _count: { select: { ulasan: true } }  // Total ulasan
  }
})

// Perbandingan data yang diambil:
// findMany tanpa select: ~500 bytes per produk × 100 = ~50KB
// findMany dengan select: ~100 bytes per produk × 100 = ~10KB
// → 5x lebih efisien!
```

---

## 🔢 19.3 Menggunakan `_count` Secara Optimal

```typescript
// _count menghitung relasi di sisi database — tanpa load datanya!
// Jauh lebih efisien dari mengambil semua data lalu .length

// ════════════════════════════════════════════════════════════
// ❌ TIDAK EFISIEN — Load semua ulasan hanya untuk hitung
// ════════════════════════════════════════════════════════════
const produk = await prisma.produk.findMany({
  include: { ulasan: true }  // Load SEMUA ulasan ke memory!
})

produk.forEach(p => {
  console.log(`${p.nama}: ${p.ulasan.length} ulasan`)
  // p.ulasan bisa berisi ratusan record yang tidak diperlukan!
})

// ════════════════════════════════════════════════════════════
// ✅ EFISIEN — Hanya hitung di database
// ════════════════════════════════════════════════════════════
const produkDenganCount = await prisma.produk.findMany({
  select: {
    id:    true,
    nama:  true,
    _count: {
      select: {
        ulasan:     true,   // Hanya angka, tidak ada data ulasan
        itemPesanan: true,  // Berapa kali produk dipesan
        tags:       true,   // Berapa banyak tag
      }
    }
  }
})

produkDenganCount.forEach(p => {
  console.log(`${p.nama}:`)
  console.log(`  ${p._count.ulasan} ulasan`)
  console.log(`  ${p._count.itemPesanan} kali dipesan`)
  console.log(`  ${p._count.tags} tags`)
})

// _count dengan filter — hitung subset dari relasi
const produkDenganRatingPositif = await prisma.produk.findMany({
  select: {
    nama:  true,
    _count: {
      select: {
        ulasan: {
          where: { rating: { gte: 4 } }  // Hitung hanya ulasan rating 4-5!
        }
      }
    }
  }
})
```

---

## ⚡ 19.4 Parallel Query — Maksimalkan Throughput

```typescript
// Query yang independen harus dijalankan secara PARALEL
// Bukan menunggu satu per satu (sequential)

// ════════════════════════════════════════════════════════════
// ❌ SEQUENTIAL — Lambat karena menunggu satu per satu
// ════════════════════════════════════════════════════════════
async function getHalamanBerandaSEQUENTIAL() {
  const produkFeatured = await prisma.produk.findMany({
    where: { aktif: true, featured: true }, take: 3
  })
  // Tunggu 50ms...

  const produkTerbaru = await prisma.produk.findMany({
    where: { aktif: true }, orderBy: { createdAt: 'desc' }, take: 8
  })
  // Tunggu 60ms...

  const kategori = await prisma.kategori.findMany({
    include: { _count: { select: { produk: true } } }
  })
  // Tunggu 40ms...

  const totalProduk = await prisma.produk.count({ where: { aktif: true } })
  // Tunggu 20ms...

  // Total: 50 + 60 + 40 + 20 = 170ms 🐌
  return { produkFeatured, produkTerbaru, kategori, totalProduk }
}


// ════════════════════════════════════════════════════════════
// ✅ PARALLEL — Semua jalan bersamaan
// ════════════════════════════════════════════════════════════
async function getHalamanBerandaPARALLEL() {
  const [produkFeatured, produkTerbaru, kategori, totalProduk] =
    await Promise.all([
      prisma.produk.findMany({
        where: { aktif: true, featured: true }, take: 3
      }),                                // 50ms ┐
      prisma.produk.findMany({                   │
        where: { aktif: true },                  │
        orderBy: { createdAt: 'desc' }, take: 8  │ Semua
      }),                                // 60ms ├ jalan
      prisma.kategori.findMany({                 │ bersamaan!
        include: { _count: { select: { produk: true } } }
      }),                                // 40ms │
      prisma.produk.count({ where: { aktif: true } })
      // 20ms ┘
    ])

  // Total: max(50, 60, 40, 20) = 60ms ⚡ — hampir 3x lebih cepat!
  return { produkFeatured, produkTerbaru, kategori, totalProduk }
}


// ════════════════════════════════════════════════════════════
// ✅ Promise.all dengan error handling
// ════════════════════════════════════════════════════════════
async function getDataDashboard(penggunaId: number) {
  try {
    const [
      statProduk,
      statPesanan,
      ulasanTerbaru,
      produkTerlaris,
    ] = await Promise.all([
      prisma.produk.aggregate({
        where:  { aktif: true },
        _count: { id: true },
        _sum:   { stok: true },
        _avg:   { harga: true },
      }),
      prisma.pesanan.groupBy({
        by:     ['status'],
        _count: { id: true },
        _sum:   { total: true },
        where:  { penggunaId },
      }),
      prisma.ulasan.findMany({
        orderBy: { createdAt: 'desc' },
        take:    5,
        include: {
          pengguna: { select: { nama: true } },
          produk:   { select: { nama: true, slug: true } },
        }
      }),
      prisma.produk.findMany({
        orderBy: { itemPesanan: { _count: 'desc' } },
        take:    5,
        select: {
          nama:  true,
          harga: true,
          _count: { select: { itemPesanan: true } }
        }
      }),
    ])

    return { statProduk, statPesanan, ulasanTerbaru, produkTerlaris }

  } catch (error) {
    // Jika salah satu gagal, semua gagal
    // Gunakan Promise.allSettled jika mau handle partial failure
    console.error('Dashboard data gagal dimuat:', error)
    throw error
  }
}


// Promise.allSettled — jika ingin tetap lanjut meski ada yang gagal
async function getDataDenganPartialFailure() {
  const results = await Promise.allSettled([
    prisma.produk.findMany({ take: 10 }),
    prisma.kategori.findMany(),
    prisma.tag.findMany(),
    // Jika salah satu error, yang lain tetap berjalan
  ])

  const [produkResult, kategoriResult, tagResult] = results

  return {
    produk:   produkResult.status   === 'fulfilled' ? produkResult.value   : [],
    kategori: kategoriResult.status === 'fulfilled' ? kategoriResult.value : [],
    tag:      tagResult.status      === 'fulfilled' ? tagResult.value      : [],
  }
}
```

---

## 🗂️ 19.5 Index Strategy — Index yang Tepat di Tempat yang Tepat

```typescript
// Index mempercepat query SELECT tapi memperlambat INSERT/UPDATE/DELETE
// Pasang index hanya pada kolom yang benar-benar diperlukan

// ─── Aturan dasar: Kapan harus pasang index ─────────────────────────
/*
✅ PASANG INDEX jika:
   1. Kolom foreign key (kategoriId, penggunaId, dll)
      → Dipakai di JOIN dan filter
   2. Kolom yang sering dipakai di WHERE clause
      → WHERE aktif = true, WHERE status = 'SELESAI'
   3. Kolom yang sering dipakai di ORDER BY
      → ORDER BY created_at DESC, ORDER BY harga ASC
   4. Kolom @unique (sudah otomatis punya index)

❌ JANGAN pasang index jika:
   1. Kolom dengan kardinalitas rendah (Boolean, Enum dengan sedikit nilai)
      → WHERE aktif = true → 50% data, index tidak efektif
   2. Kolom yang jarang di-query
   3. Tabel yang sangat sering INSERT/UPDATE (index makin banyak = makin lambat write)
*/
```

```prisma
// prisma/schema.prisma — Index yang optimal

model Produk {
  id          Int       @id @default(autoincrement())
  nama        String
  slug        String    @unique              // ← Otomatis punya index
  harga       Decimal   @db.Decimal(12, 2)
  stok        Int       @default(0)
  aktif       Boolean   @default(true)
  views       Int       @default(0)
  kategoriId  Int
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  kategori    Kategori  @relation(fields: [kategoriId], references: [id])
  tags        Tag[]
  ulasan      Ulasan[]
  itemPesanan ItemPesanan[]

  // ─── Index yang direkomendasikan ─────────────────────────────────

  // ① Index FK — wajib untuk semua foreign key!
  @@index([kategoriId])
  // Dipakai untuk: WHERE kategori_id = ? dan JOIN kategori

  // ② Composite index untuk query listing produk aktif
  @@index([aktif, deletedAt, createdAt])
  // Dipakai untuk: WHERE aktif = true AND deleted_at IS NULL ORDER BY created_at DESC
  // Urutan kolom penting: filter equality dulu, lalu range/sort

  // ③ Index untuk sort by harga
  @@index([aktif, harga])
  // Dipakai untuk: WHERE aktif = true ORDER BY harga ASC/DESC

  // ④ Index untuk filter by kategori + sort
  @@index([kategoriId, aktif, createdAt])
  // Dipakai untuk: WHERE kategori_id = ? AND aktif = true ORDER BY created_at DESC

  // ⑤ Index untuk views (produk populer)
  @@index([views(sort: Desc)])
  // Dipakai untuk: ORDER BY views DESC LIMIT 10
}

model Pesanan {
  id         Int           @id @default(autoincrement())
  status     StatusPesanan
  total      Decimal       @db.Decimal(12, 2)
  penggunaId Int
  createdAt  DateTime      @default(now())

  pengguna   Pengguna      @relation(fields: [penggunaId], references: [id])
  items      ItemPesanan[]

  // ─── Index untuk Pesanan ─────────────────────────────────────────
  @@index([penggunaId])                      // Riwayat pesanan user
  @@index([status])                          // Filter by status
  @@index([penggunaId, status])              // Pesanan user by status
  @@index([createdAt(sort: Desc)])           // Sort by tanggal
  @@index([status, createdAt(sort: Desc)])   // Filter status + sort tanggal
}

model Ulasan {
  id         Int      @id @default(autoincrement())
  rating     Int
  produkId   Int
  penggunaId Int
  createdAt  DateTime @default(now())

  // ─── Index untuk Ulasan ──────────────────────────────────────────
  @@index([produkId])                 // Ulasan per produk
  @@index([penggunaId])               // Ulasan per pengguna
  @@index([produkId, rating])         // Filter ulasan produk by rating
  @@index([rating])                   // Ulasan by rating (untuk filtering)
  @@index([createdAt(sort: Desc)])    // Ulasan terbaru

  @@unique([penggunaId, produkId])    // Satu pengguna satu ulasan per produk
}
```

---

## 📊 19.6 Monitoring Query dengan `EXPLAIN`

```typescript
// MySQL/PostgreSQL punya perintah EXPLAIN untuk analisis query plan
// Berguna untuk debug kenapa query lambat

// Via Prisma raw query:
const explainResult = await prisma.$queryRaw`
  EXPLAIN SELECT p.*, k.nama
  FROM produk p
  LEFT JOIN kategori k ON p.kategori_id = k.id
  WHERE p.aktif = true
    AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC
  LIMIT 12
`
console.log('Query Plan:', JSON.stringify(explainResult, null, 2))
// Perhatikan:
// - type: "ALL" → Full table scan → Butuh index!
// - type: "ref" atau "range" → Pakai index → Baik
// - rows: angka tinggi → Banyak row diperiksa → Perlu optimasi

// MySQL EXPLAIN FORMAT=JSON (lebih detail):
const explainJSON = await prisma.$queryRaw`
  EXPLAIN FORMAT=JSON
  SELECT * FROM produk WHERE aktif = true ORDER BY created_at DESC LIMIT 12
`

// PostgreSQL EXPLAIN ANALYZE (lebih lengkap, jalankan query sungguhan):
const explainPG = await prisma.$queryRaw`
  EXPLAIN ANALYZE
  SELECT * FROM produk WHERE aktif = true ORDER BY created_at DESC LIMIT 12
`
```

---

## 🔄 19.7 Connection Pooling untuk Production

```typescript
// Masalah di serverless environment (Vercel, AWS Lambda):
// Setiap function invocation bisa membuat koneksi database baru
// Jika banyak request bersamaan → "too many connections" error!

// ─── Solusi 1: PgBouncer / Neon Pooler ───────────────────────────────
// Tambahkan connection pooler di depan database

// prisma/schema.prisma
// datasource db {
//   provider  = "postgresql"
//   url       = env("DATABASE_URL")      // URL dengan pooler
//   directUrl = env("DIRECT_URL")        // URL langsung (untuk migrate)
// }

// .env
// DATABASE_URL="postgresql://user:pass@pooler.neon.tech:5432/db?sslmode=require"
// DIRECT_URL="postgresql://user:pass@direct.neon.tech:5432/db?sslmode=require"


// ─── Solusi 2: Connection Limit di URL ────────────────────────────────
// Batasi jumlah koneksi per instance Prisma

// MySQL:
// DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=5&pool_timeout=10"

// PostgreSQL:
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5"


// ─── Solusi 3: Prisma Accelerate ──────────────────────────────────────
// Layanan connection pooling resmi dari Prisma
// prisma.io/data-platform/accelerate

// Setup:
// npm install @prisma/extension-accelerate

import { withAccelerate } from '@prisma/extension-accelerate'

const prismaWithAccelerate = new PrismaClient().$extends(withAccelerate())

// Pakai caching di level query:
const produk = await prismaWithAccelerate.produk.findMany({
  cacheStrategy: {
    ttl: 60,     // Cache selama 60 detik
    swr: 30,     // Stale-while-revalidate: 30 detik
  }
})
```

---

## 🔎 19.8 Query Optimization Checklist

```typescript
// Sebelum ship ke production, terapkan checklist ini pada setiap query:

// ─── Checklist ────────────────────────────────────────────────────────

/*
QUERY DASAR:
□ Tidak ada findMany() tanpa take (pagination) untuk data besar
□ Tidak ada loop yang berisi query database (N+1 problem)
□ Pakai select/include yang tepat, bukan ambil semua kolom (*) 
□ Query yang independen dijalankan dengan Promise.all
□ Pakai _count untuk hitung relasi, bukan .length dari include

INDEX:
□ Semua foreign key punya @@index di schema
□ Kolom yang sering dipakai di WHERE punya @@index
□ Kolom yang sering dipakai di ORDER BY punya @@index
□ Composite index dibuat sesuai query yang paling sering dijalankan

RELASI:
□ Tidak ada over-fetching (include relasi yang tidak diperlukan)
□ Nested include punya take untuk batasi jumlah data
□ Pakai select bertingkat untuk batasi field dari relasi

SCHEMA:
□ Field dengan tipe data yang tepat (Decimal untuk uang, bukan Float)
□ Nullable field (?) untuk kolom yang boleh null
□ @updatedAt untuk timestamp update otomatis

PRODUCTION:
□ Connection pooling dikonfigurasi
□ Query lambat di-monitor (log query > 500ms)
□ DATABASE_URL pakai SSL untuk cloud database
□ Tidak ada query SELECT * di production
*/
```

---

## ✅ Checklist Bab 19

```
□ Bisa mengidentifikasi N+1 problem dengan query logging
□ Semua relasi dimuat dengan include/select, bukan loop query
□ Semua findMany() punya take (pagination)
□ Query independen dijalankan paralel dengan Promise.all
□ Pakai select untuk hanya ambil field yang dibutuhkan
□ Pakai _count untuk hitung relasi tanpa load data
□ Semua FK punya @@index di schema.prisma
□ Composite index dibuat sesuai pola query yang ada
□ Connection pooling dikonfigurasi untuk serverless environment
□ Bisa membaca output EXPLAIN untuk debug query lambat
```

---

---

---

🚀 Lanjut ke [🏆 Bab 20 — Best Practices & Pola Umum](/bagian-7/bab-20) untuk melanjutkan perjalanan!
