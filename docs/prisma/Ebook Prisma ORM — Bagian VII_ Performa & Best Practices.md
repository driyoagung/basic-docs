# ⚫ Ebook Prisma ORM — Bagian VII: Performa & Best Practices

> 🎯 **Tujuan Bagian VII:** Membuat query Prisma yang tidak hanya benar secara fungsional, tapi juga cepat dan efisien di production — menghindari N+1 problem, optimasi query, index yang tepat, connection pooling, dan pola-pola yang membuat codebase Prisma kamu scalable dan mudah di-maintain jangka panjang.

---

# 📖 Bab 19 — Optimasi Query & Performa

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

# 📖 Bab 20 — Best Practices & Pola Umum

---

## 🏗️ 20.1 Repository Pattern — Organisasi Kode yang Rapi

Repository Pattern memisahkan logika akses database dari logika bisnis. Ini membuat kode lebih mudah di-test, di-maintain, dan di-refactor.

```typescript
// src/repositories/base.repository.ts
// Base class yang bisa dipakai oleh semua repository

import { PrismaClient } from '@prisma/client'

export abstract class BaseRepository {
  protected prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
}


// src/repositories/produk.repository.ts
import { Prisma, Produk }  from '@prisma/client'
import { BaseRepository }  from './base.repository'
import { prisma }          from '../lib/prisma'

// Definisikan tipe untuk include yang sering dipakai
export const produkInclude = {
  kategori: true,
  tags:     { select: { nama: true, slug: true } },
  _count:   { select: { ulasan: true, itemPesanan: true } },
} satisfies Prisma.ProdukInclude

export type ProdukLengkap = Prisma.ProdukGetPayload<{
  include: typeof produkInclude
}>

export class ProdukRepository extends BaseRepository {

  // ─── READ ──────────────────────────────────────────────────────
  async cariSemua(params: {
    halaman?:    number
    perHalaman?: number
    keyword?:    string
    kategoriId?: number
    aktif?:      boolean
    tagSlug?:    string
    urutkan?:    'terbaru' | 'terlama' | 'harga_asc' | 'harga_desc' | 'terlaris'
  } = {}): Promise<{ data: ProdukLengkap[]; total: number }> {
    const {
      halaman    = 1,
      perHalaman = 12,
      keyword,
      kategoriId,
      aktif      = true,
      tagSlug,
      urutkan    = 'terbaru',
    } = params

    const where: Prisma.ProdukWhereInput = {
      aktif,
      deletedAt: null,
      ...(kategoriId && { kategoriId }),
      ...(tagSlug    && { tags: { some: { slug: tagSlug } } }),
      ...(keyword    && {
        OR: [
          { nama:      { contains: keyword, mode: 'insensitive' } },
          { deskripsi: { contains: keyword, mode: 'insensitive' } },
        ]
      }),
    }

    const orderBy: Prisma.ProdukOrderByWithRelationInput = {
      terbaru:    { createdAt: 'desc' },
      terlama:    { createdAt: 'asc'  },
      harga_asc:  { harga:     'asc'  },
      harga_desc: { harga:     'desc' },
      terlaris:   { itemPesanan: { _count: 'desc' } },
    }[urutkan] ?? { createdAt: 'desc' }

    const [data, total] = await Promise.all([
      this.prisma.produk.findMany({
        where,
        include: produkInclude,
        orderBy,
        skip: (halaman - 1) * perHalaman,
        take: perHalaman,
      }),
      this.prisma.produk.count({ where }),
    ])

    return { data, total }
  }

  async cariById(id: number): Promise<ProdukLengkap | null> {
    return this.prisma.produk.findUnique({
      where:   { id, deletedAt: null },
      include: produkInclude,
    })
  }

  async cariBySlug(slug: string): Promise<ProdukLengkap | null> {
    return this.prisma.produk.findUnique({
      where:   { slug, deletedAt: null },
      include: produkInclude,
    })
  }

  async cariTerlaris(take = 5): Promise<ProdukLengkap[]> {
    return this.prisma.produk.findMany({
      where:   { aktif: true, deletedAt: null },
      include: produkInclude,
      orderBy: { itemPesanan: { _count: 'desc' } },
      take,
    })
  }

  // ─── CREATE ────────────────────────────────────────────────────
  async buat(data: Prisma.ProdukCreateInput): Promise<ProdukLengkap> {
    return this.prisma.produk.create({
      data,
      include: produkInclude,
    })
  }

  // ─── UPDATE ────────────────────────────────────────────────────
  async update(id: number, data: Prisma.ProdukUpdateInput): Promise<ProdukLengkap> {
    return this.prisma.produk.update({
      where:   { id },
      data,
      include: produkInclude,
    })
  }

  async tambahView(id: number): Promise<void> {
    await this.prisma.produk.update({
      where: { id },
      data:  { views: { increment: 1 } },
    })
  }

  // ─── DELETE ────────────────────────────────────────────────────
  async softDelete(id: number): Promise<void> {
    await this.prisma.produk.update({
      where: { id },
      data:  { deletedAt: new Date() },
    })
  }

  async hapusPermanent(id: number): Promise<void> {
    await this.prisma.produk.delete({ where: { id } })
  }
}

// Singleton instance
export const produkRepository = new ProdukRepository(prisma)
```

---

## 🧩 20.2 Service Layer — Logika Bisnis yang Terpisah

```typescript
// src/services/produk.service.ts
// Layer antara repository (akses data) dan controller (handle request)
// Berisi logika bisnis — tidak tahu soal HTTP request/response

import { prisma }             from '../lib/prisma'
import { produkRepository }   from '../repositories/produk.repository'
import { CreateProdukSchema,
         UpdateProdukSchema,
         QueryProdukSchema }  from '../validations/produk.schema'
import slugify                from 'slugify'
import { z }                  from 'zod'

export class ProdukService {

  // ─── Buat produk baru dengan validasi bisnis ────────────────────
  async buat(rawInput: unknown) {
    // ① Validasi input
    const input = CreateProdukSchema.parse(rawInput)

    // ② Logika bisnis: generate slug
    const baseSlug = input.slug ?? slugify(input.nama, {
      lower: true, strict: true, locale: 'id'
    })

    // ③ Logika bisnis: pastikan slug unik
    let slug     = baseSlug
    let counter  = 0
    while (true) {
      const existing = await produkRepository.cariBySlug(slug)
      if (!existing) break  // Slug tersedia!

      counter++
      slug = `${baseSlug}-${counter}`
      // "laptop-asus" → "laptop-asus-1" → "laptop-asus-2" dst
    }

    // ④ Simpan ke database
    const { tagIds, ...produkData } = input

    return produkRepository.buat({
      ...produkData,
      slug,
      tags: tagIds.length > 0
        ? { connect: tagIds.map(id => ({ id })) }
        : undefined,
    })
  }


  // ─── Update dengan validasi kepemilikan ────────────────────────
  async update(
    id:      number,
    rawInput: unknown,
    editorId: number,
    editorRole: string
  ) {
    const input    = UpdateProdukSchema.parse(rawInput)
    const existing = await produkRepository.cariById(id)

    if (!existing) {
      throw new Error('Produk tidak ditemukan')
    }

    // Logika bisnis: validasi kepemilikan (jika relevan)
    // if (existing.creatorId !== editorId && editorRole !== 'ADMIN') {
    //   throw new Error('Tidak punya akses untuk edit produk ini')
    // }

    const { tagIds, ...produkData } = input

    return produkRepository.update(id, {
      ...produkData,
      ...(tagIds !== undefined && {
        tags: { set: tagIds.map(id => ({ id })) }
      }),
    })
  }


  // ─── Cari dengan paginasi dan filter ────────────────────────────
  async cari(rawQuery: unknown) {
    const query = QueryProdukSchema.parse(rawQuery)

    const { data, total } = await produkRepository.cariSemua({
      halaman:    query.halaman,
      perHalaman: query.perHalaman,
      keyword:    query.keyword,
      kategoriId: query.kategoriId,
      urutkan:    query.urutkan as any,
    })

    return {
      data,
      meta: {
        halaman:      query.halaman,
        perHalaman:   query.perHalaman,
        total,
        totalHalaman: Math.ceil(total / query.perHalaman),
        adaBerikutnya: query.halaman < Math.ceil(total / query.perHalaman),
        adaSebelumnya: query.halaman > 1,
      }
    }
  }


  // ─── Lihat detail + increment view ─────────────────────────────
  async detail(slug: string) {
    const produk = await produkRepository.cariBySlug(slug)

    if (!produk) {
      throw new Error('Produk tidak ditemukan')
    }

    // Fire and forget — jangan blokir response untuk increment view
    produkRepository.tambahView(produk.id).catch(console.error)

    return produk
  }
}

export const produkService = new ProdukService()
```

---

## 🔒 20.3 Type Safety Tingkat Lanjut dengan Prisma

```typescript
// Prisma menyediakan tipe utility yang sangat berguna
import { Prisma } from '@prisma/client'

// ─── Prisma.ModelGetPayload — Tipe berdasarkan query yang dilakukan ──
// Tipe ini berubah sesuai apa yang di-select/include!

// Tipe untuk produk dengan include tertentu
type ProdukDenganKategori = Prisma.ProdukGetPayload<{
  include: { kategori: true }
}>
// ProdukDenganKategori.kategori pasti ada (bukan optional)

type ProdukRingkas = Prisma.ProdukGetPayload<{
  select: {
    id:    true
    nama:  true
    harga: true
    slug:  true
  }
}>
// ProdukRingkas tidak punya field lain — TypeScript enforce ini!

type PesananLengkap = Prisma.PesananGetPayload<{
  include: {
    pengguna: {
      select: { nama: true; email: true }
    }
    items: {
      include: { produk: true }
    }
  }
}>
// Tipe nested ini perfectly typed!


// ─── Prisma.ModelWhereInput — Tipe untuk where clause ───────────────
type FilterProduk = Prisma.ProdukWhereInput
// Bisa pakai sebagai parameter fungsi filter

function buildProdukFilter(params: {
  aktif?:      boolean
  kategoriId?: number
  keyword?:    string
}): FilterProduk {
  return {
    ...(params.aktif      !== undefined && { aktif: params.aktif }),
    ...(params.kategoriId !== undefined && { kategoriId: params.kategoriId }),
    ...(params.keyword    !== undefined && {
      OR: [
        { nama:      { contains: params.keyword, mode: 'insensitive' } },
        { deskripsi: { contains: params.keyword, mode: 'insensitive' } },
      ]
    }),
  }
}

// Penggunaan:
const filter = buildProdukFilter({ aktif: true, keyword: 'laptop' })
await prisma.produk.findMany({ where: filter })


// ─── Prisma.ModelOrderByWithRelationInput — Tipe untuk orderBy ───────
type UrutanProduk = Prisma.ProdukOrderByWithRelationInput

function buildProdukOrder(urutkan: string): UrutanProduk {
  const options: Record<string, UrutanProduk> = {
    terbaru:    { createdAt: 'desc' },
    terlama:    { createdAt: 'asc'  },
    harga_asc:  { harga:     'asc'  },
    harga_desc: { harga:     'desc' },
    populer:    { views:     'desc' },
  }
  return options[urutkan] ?? { createdAt: 'desc' }
}


// ─── Prisma.ModelCreateInput & UpdateInput ────────────────────────────
type BuatProdukData   = Prisma.ProdukCreateInput
type UpdateProdukData = Prisma.ProdukUpdateInput

// Ini memastikan data yang dikirim ke Prisma selalu valid
async function buatProduk(data: BuatProdukData) {
  return prisma.produk.create({ data })
}
```

---

## 🧪 20.4 Testing dengan Prisma

```typescript
// src/__tests__/produk.service.test.ts
// Setup testing environment untuk Prisma

import { PrismaClient }           from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'
import { produkService }           from '../services/produk.service'

// ─── Metode 1: Mock Prisma Client ────────────────────────────────────
// Berguna untuk unit test yang cepat — tidak perlu database sungguhan!

// jest.setup.ts
jest.mock('../lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}))

describe('ProdukService', () => {
  let prismasMock: DeepMockProxy<PrismaClient>

  beforeEach(() => {
    prismasMock = mockDeep<PrismaClient>()
    jest.clearAllMocks()
  })

  it('harus buat produk dengan slug yang benar', async () => {
    // Arrange
    const inputProduk = {
      nama:       'Laptop ASUS ROG',
      harga:      25000000,
      stok:       5,
      kategoriId: 1,
      tagIds:     [1, 2],
    }

    const produkDibuat = {
      id:         1,
      nama:       'Laptop ASUS ROG',
      slug:       'laptop-asus-rog',
      harga:      25000000,
      stok:       5,
      kategoriId: 1,
      aktif:      true,
      deletedAt:  null,
      createdAt:  new Date(),
      updatedAt:  new Date(),
    }

    // Mock: findUnique return null (slug belum ada)
    prismasMock.produk.findUnique.mockResolvedValue(null)
    // Mock: create return produk yang dibuat
    prismasMock.produk.create.mockResolvedValue(produkDibuat as any)

    // Act
    const hasil = await produkService.buat(inputProduk)

    // Assert
    expect(hasil.slug).toBe('laptop-asus-rog')
    expect(prismasMock.produk.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'laptop-asus-rog' })
      })
    )
  })

  it('harus tambah angka ke slug jika sudah ada', async () => {
    const inputProduk = {
      nama:       'Laptop ASUS',
      harga:      25000000,
      stok:       5,
      kategoriId: 1,
    }

    // Mock: slug 'laptop-asus' sudah ada, 'laptop-asus-1' juga ada, 'laptop-asus-2' belum
    prismasMock.produk.findUnique
      .mockResolvedValueOnce({ id: 99 } as any)   // 'laptop-asus' sudah ada
      .mockResolvedValueOnce({ id: 100 } as any)  // 'laptop-asus-1' sudah ada
      .mockResolvedValueOnce(null)                  // 'laptop-asus-2' belum ada

    prismasMock.produk.create.mockResolvedValue({ slug: 'laptop-asus-2' } as any)

    await produkService.buat(inputProduk)

    expect(prismasMock.produk.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'laptop-asus-2' })
      })
    )
  })
})


// ─── Metode 2: Test Database Terpisah ────────────────────────────────
// Berguna untuk integration test — pakai database test sungguhan

// .env.test
// DATABASE_URL="postgresql://...@localhost:5432/db_test"

// jest.config.ts
// testEnvironment: 'node'
// setupFilesAfterEach: ['./src/__tests__/setup.ts']

// src/__tests__/setup.ts
import { PrismaClient } from '@prisma/client'
const prismaTest = new PrismaClient()

beforeAll(async () => {
  await prismaTest.$connect()
})

afterAll(async () => {
  await prismaTest.$disconnect()
})

beforeEach(async () => {
  // Bersihkan database sebelum setiap test
  await prismaTest.$transaction([
    prismaTest.ulasan.deleteMany(),
    prismaTest.itemPesanan.deleteMany(),
    prismaTest.pesanan.deleteMany(),
    prismaTest.produk.deleteMany(),
    prismaTest.kategori.deleteMany(),
    prismaTest.pengguna.deleteMany(),
  ])
})
```

---

## 📁 20.5 Struktur Folder yang Direkomendasikan

```
src/
│
├── lib/
│   ├── prisma.ts              ← Singleton PrismaClient
│   ├── prisma-extended.ts     ← Prisma + Extensions
│   ├── error-handler.ts       ← Error handling terpusat
│   ├── safe-execute.ts        ← Wrapper operasi database
│   └── retry.ts               ← Retry logic
│
├── validations/
│   ├── produk.schema.ts       ← Zod schema untuk Produk
│   ├── pengguna.schema.ts     ← Zod schema untuk Pengguna
│   ├── pesanan.schema.ts      ← Zod schema untuk Pesanan
│   └── auth.schema.ts         ← Zod schema untuk Auth
│
├── repositories/
│   ├── base.repository.ts     ← Base class
│   ├── produk.repository.ts   ← Akses data Produk
│   ├── pengguna.repository.ts ← Akses data Pengguna
│   └── pesanan.repository.ts  ← Akses data Pesanan
│
├── services/
│   ├── produk.service.ts      ← Logika bisnis Produk
│   ├── auth.service.ts        ← Logika bisnis Auth
│   └── pesanan.service.ts     ← Logika bisnis Pesanan
│
├── api/ (atau app/api/ untuk Next.js)
│   ├── produk/
│   │   └── route.ts           ← HTTP handlers
│   └── auth/
│       └── route.ts
│
└── __tests__/
    ├── setup.ts               ← Setup test environment
    ├── produk.service.test.ts
    └── pesanan.service.test.ts
```

---

## 📋 20.6 Checklist Final — Sebelum Deploy Production

```
SCHEMA & MIGRATION:
□ Semua foreign key punya @@index
□ Composite index dibuat untuk query yang sering dijalankan
□ Tipe data yang tepat (Decimal untuk uang, bukan Float!)
□ Enum dipakai untuk kolom dengan nilai terbatas
□ @@map dan @map dipakai untuk nama tabel/kolom yang konsisten
□ prisma migrate status → semua migration sudah applied
□ Migration sudah di-test di staging environment

QUERY OPTIMIZATION:
□ Tidak ada N+1 problem (loop + query di dalamnya)
□ Semua findMany() punya take (tidak ambil semua data!)
□ select dipakai untuk ambil hanya field yang dibutuhkan
□ _count dipakai untuk hitung relasi (bukan include + .length)
□ Query independen dijalankan paralel dengan Promise.all
□ Nested include punya take untuk batasi data

KEAMANAN:
□ Semua input API divalidasi dengan Zod sebelum ke Prisma
□ DATABASE_URL ada di .env (tidak hard-coded di kode)
□ .env ada di .gitignore
□ Raw query ($queryRaw) pakai tagged template literal
□ Error Prisma tidak di-expose langsung ke user
□ Connection pooling dikonfigurasi untuk serverless

ERROR HANDLING:
□ Error handler terpusat menangani semua error Prisma
□ P2002 (duplicate) → 409 Conflict
□ P2003 (FK violation) → 400 Bad Request
□ P2025 (not found) → 404 Not Found
□ ZodError → 422 Unprocessable Entity
□ Error tidak diketahui → 500 Internal Server Error

PERFORMA:
□ Query logging aktif di development
□ Slow query monitoring aktif di production
□ Connection limit dikonfigurasi sesuai environment
□ Index sudah diverifikasi dengan EXPLAIN

CODE QUALITY:
□ Repository Pattern dipakai untuk akses database
□ Service Layer berisi logika bisnis
□ TypeScript types menggunakan Prisma utility types
□ Unit test dan integration test sudah ada
□ Error messages informatif untuk debugging
```

---

## ✅ Checklist Bab 20

```
□ Repository Pattern diimplementasikan untuk memisahkan akses data
□ Service Layer berisi logika bisnis yang terpisah dari HTTP handler
□ Prisma utility types dipakai (GetPayload, WhereInput, OrderByInput)
□ Unit test menggunakan mock Prisma Client
□ Integration test menggunakan database test terpisah
□ Struktur folder mengikuti separation of concerns
□ Checklist production sudah dilewati sebelum deploy
```

---

## 📊 Ringkasan Bagian VII

```
YANG SUDAH DIPELAJARI DI BAGIAN VII:

Bab 19 — Optimasi Query & Performa
├── N+1 Problem: deteksi dan cara menghindari
├── SELECT optimization: hanya ambil field yang dibutuhkan
├── _count: hitung relasi tanpa load data ke memory
├── Parallel query dengan Promise.all dan Promise.allSettled
├── Index Strategy: kapan pasang, kapan tidak, composite index
├── EXPLAIN untuk debug query plan
└── Connection Pooling untuk serverless environment

Bab 20 — Best Practices & Pola Umum
├── Repository Pattern: pemisahan akses database
├── Service Layer: logika bisnis yang terpisah
├── TypeScript tingkat lanjut: Prisma.ModelGetPayload, WhereInput, dll
├── Testing: Mock Prisma Client vs database test sungguhan
├── Struktur folder yang direkomendasikan
└── Checklist final sebelum deploy production
```

> 📌 **Selesai! 🎉** Kamu sudah menyelesaikan Bagian I hingga VII dari Ebook Prisma ORM. Dari mengenal Prisma dari nol, mendefinisikan schema yang solid, mengelola migration dengan aman, menguasai semua operasi CRUD, query lanjutan dengan relasi, fitur-fitur Prisma yang canggih, hingga teknik optimasi dan best practices untuk production — semuanya sudah tercakup. **Selamat! Kamu sudah siap menggunakan Prisma secara profesional di project nyata.**