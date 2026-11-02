---
title: "Bab 15 — Transactions & Raw Query"
---

---

## 🔒 15.1 Mengapa Transaction Itu Penting?

```
MASALAH TANPA TRANSACTION:
─────────────────────────────────────────────────────────────────
Bayangkan proses pembelian:

Langkah 1: Buat pesanan → ✅ Berhasil
Langkah 2: Kurangi stok → ✅ Berhasil
Langkah 3: Catat pembayaran → ❌ GAGAL! (server down, network error)

Hasil: Pesanan sudah ada, stok sudah berkurang,
       tapi pembayaran tidak tercatat!
       → Data tidak konsisten, keuangan berantakan!

DENGAN TRANSACTION:
─────────────────────────────────────────────────────────────────
Semua langkah dalam satu transaction:

Langkah 1: Buat pesanan → ✅
Langkah 2: Kurangi stok → ✅
Langkah 3: Catat pembayaran → ❌ GAGAL

→ ROLLBACK! Semua langkah dibatalkan otomatis
→ Database kembali ke kondisi sebelum transaction dimulai
→ Data selalu konsisten ✅
```

---

## 🔄 15.2 Sequential Transaction — Operasi Berurutan

```typescript
// Sequential transaction: operasi berjalan satu per satu
// Bisa pakai hasil operasi sebelumnya di operasi berikutnya
// Jika ada error → semua dibatalkan (rollback)

// ─── Proses pembelian yang aman ────────────────────────────────────────
async function prosesPembelian(
  penggunaId: number,
  items:      { produkId: number; jumlah: number }[],
  alamat:     object
) {
  return prisma.$transaction(async (tx) => {
    // tx = PrismaClient yang terikat ke transaction ini
    // SELALU pakai tx di dalam $transaction, bukan prisma!

    // ─── Step 1: Validasi dan lock stok ────────────────────────────
    const produkIds   = items.map(i => i.produkId)
    const produkList  = await tx.produk.findMany({
      where:  { id: { in: produkIds }, aktif: true },
      select: { id: true, nama: true, harga: true, stok: true }
    })

    // Cek apakah semua produk ada
    if (produkList.length !== items.length) {
      throw new Error('Beberapa produk tidak ditemukan atau tidak aktif')
    }

    // Cek stok masing-masing produk
    for (const item of items) {
      const produk = produkList.find(p => p.id === item.produkId)!
      if (produk.stok < item.jumlah) {
        throw new Error(
          `Stok ${produk.nama} tidak mencukupi. Tersisa: ${produk.stok}`
        )
      }
    }

    // ─── Step 2: Hitung total ──────────────────────────────────────
    let totalBayar = 0
    for (const item of items) {
      const produk   = produkList.find(p => p.id === item.produkId)!
      totalBayar    += Number(produk.harga) * item.jumlah
    }

    // ─── Step 3: Buat pesanan ──────────────────────────────────────
    const pesanan = await tx.pesanan.create({
      data: {
        penggunaId,
        total:       totalBayar,
        alamatKirim: alamat,
        items: {
          create: items.map(item => ({
            produkId:    item.produkId,
            jumlah:      item.jumlah,
            hargaSatuan: produkList.find(p => p.id === item.produkId)!.harga,
          }))
        }
      }
    })

    // ─── Step 4: Kurangi stok secara atomic ────────────────────────
    for (const item of items) {
      await tx.produk.update({
        where: { id: item.produkId },
        data:  { stok: { decrement: item.jumlah } }
      })
    }

    // ─── Step 5: Update statistik pengguna ─────────────────────────
    await tx.pengguna.update({
      where: { id: penggunaId },
      data:  { totalPesanan: { increment: 1 } }  // Jika ada field ini
    })

    // Return: semua langkah berhasil!
    return {
      pesanan,
      pesan: `Pesanan ${pesanan.kodePesanan} berhasil dibuat`
    }

    // Jika ada throw di manapun dalam fungsi ini:
    // Semua operasi di atas dibatalkan otomatis (rollback)!
  })
}

// Penggunaan:
try {
  const result = await prosesPembelian(
    1,
    [
      { produkId: 1, jumlah: 1 },
      { produkId: 3, jumlah: 2 },
    ],
    { penerima: 'Budi', jalan: 'Jl. Merdeka 1', kota: 'Jakarta' }
  )
  console.log(result.pesan)
} catch (error) {
  console.error('Pembelian gagal:', error.message)
  // Semua perubahan sudah di-rollback otomatis!
}


// ─── Transfer kredit antar pengguna ────────────────────────────────────
async function transferKredit(
  dariId: number,
  keId:   number,
  jumlah: number
) {
  return prisma.$transaction(async (tx) => {
    // Ambil pengguna pengirim dengan cek saldo
    const pengirim = await tx.pengguna.findUniqueOrThrow({
      where:  { id: dariId },
      select: { kredit: true, nama: true }
    })

    if (pengirim.kredit < jumlah) {
      throw new Error(`Saldo ${pengirim.nama} tidak mencukupi`)
    }

    // Kurangi kredit pengirim
    const pengirimUpdate = await tx.pengguna.update({
      where: { id: dariId },
      data:  { kredit: { decrement: jumlah } },
      select: { kredit: true }
    })

    // Tambah kredit penerima
    await tx.pengguna.update({
      where: { id: keId },
      data:  { kredit: { increment: jumlah } }
    })

    // Catat riwayat transfer
    await tx.riwayatKredit.create({
      data: { dariId, keId, jumlah, tipe: 'TRANSFER' }
    })

    return {
      sukses:       true,
      sisaKredit:   pengirimUpdate.kredit,
    }
  })
}
```

---

## ⚡ 15.3 Batch Transaction — Operasi Paralel

```typescript
// Batch transaction: semua operasi dijalankan BERSAMAAN dalam satu transaction
// Lebih cepat dari sequential, tapi tidak bisa pakai hasil operasi sebelumnya

// ─── Ambil banyak data sekaligus ──────────────────────────────────────
const [produk, kategori, tagList, totalProduk] = await prisma.$transaction([
  prisma.produk.findMany({
    where:   { aktif: true },
    orderBy: { createdAt: 'desc' },
    take:    12,
    include: { kategori: true },
  }),
  prisma.kategori.findMany({
    include: { _count: { select: { produk: true } } }
  }),
  prisma.tag.findMany({
    orderBy: { nama: 'asc' }
  }),
  prisma.produk.count({ where: { aktif: true } }),
])

// Semua 4 query jalan dalam satu transaction — data konsisten!
// Jika ada yang gagal, semua dibatalkan
console.log(`${produk.length} produk, ${kategori.length} kategori, total ${totalProduk}`)


// ─── Batch operations ──────────────────────────────────────────────────
// Buat beberapa records sekaligus dalam satu transaction
const [admin, kategoriElektronik, tagGaming] = await prisma.$transaction([
  prisma.pengguna.create({
    data: { email: 'admin@test.com', nama: 'Admin', password: 'xxx', role: 'ADMIN' }
  }),
  prisma.kategori.create({
    data: { nama: 'Elektronik', slug: 'elektronik' }
  }),
  prisma.tag.create({
    data: { nama: 'gaming', slug: 'gaming' }
  }),
])
// Semua terbuat dalam satu transaksi!
```

---

## 🔧 15.4 Transaction Options — Konfigurasi Lanjutan

```typescript
// Prisma mendukung beberapa opsi untuk sequential transaction

const hasil = await prisma.$transaction(
  async (tx) => {
    // ... operasi
  },
  {
    maxWait: 5000,    // Maksimal tunggu transaction slot tersedia (ms)
                      // Default: 2000ms
    timeout: 10000,   // Maksimal durasi transaction keseluruhan (ms)
                      // Default: 5000ms
                      // Jika melebihi → otomatis rollback!

    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    // Level isolasi transaction:
    // ReadUncommitted → Bisa baca data yang belum di-commit (paling longgar)
    // ReadCommitted   → Hanya baca data yang sudah di-commit
    // RepeatableRead  → Data yang dibaca dalam TX selalu sama
    // Serializable    → TX berjalan seolah-olah satu per satu (paling ketat)
    // Default: ReadCommitted (di MySQL) atau ReadCommitted (di PostgreSQL)
  }
)


// ─── Kapan ubah isolation level? ──────────────────────────────────────
// ReadCommitted (default) → Cocok untuk 95% kasus
// RepeatableRead → Saat baca data beberapa kali dalam TX dan harus konsisten
// Serializable   → Saat butuh akurasi tinggi (keuangan, inventory)
//                  ⚠️ Paling lambat — bisa menyebabkan deadlock!
```

---

## 📝 15.5 Raw Query — Ketika Prisma Client Tidak Cukup

```typescript
// Gunakan raw query untuk:
// ✅ Query yang tidak bisa diekspresikan dengan Prisma Client
// ✅ Optimasi query yang sangat spesifik
// ✅ Fungsi database native (FULLTEXT, window functions, dll)
// ✅ Query yang butuh kontrol penuh atas SQL

import { Prisma } from '@prisma/client'

// ─── $queryRaw — SELECT yang mengembalikan data ────────────────────────
// WAJIB pakai tagged template literal! Mencegah SQL injection!

// Contoh 1: Full-text search MySQL
const keyword = 'laptop gaming'
const hasilSearch = await prisma.$queryRaw<{
  id:     number
  nama:   string
  harga:  number
  relevance: number
}[]>`
  SELECT
    id,
    nama,
    CAST(harga AS DECIMAL(12,2)) as harga,
    MATCH(nama, deskripsi) AGAINST (${keyword} IN BOOLEAN MODE) AS relevance
  FROM produk
  WHERE
    aktif = true
    AND deleted_at IS NULL
    AND MATCH(nama, deskripsi) AGAINST (${keyword} IN BOOLEAN MODE) > 0
  ORDER BY relevance DESC
  LIMIT 20
`

hasilSearch.forEach(p => {
  console.log(`${p.nama} (relevance: ${p.relevance.toFixed(2)})`)
})


// Contoh 2: Window function untuk ranking
const produkDenganRanking = await prisma.$queryRaw<{
  id:            number
  nama:          string
  harga:         number
  kategori_nama: string
  ranking:       number
}[]>`
  SELECT
    p.id,
    p.nama,
    p.harga,
    k.nama AS kategori_nama,
    RANK() OVER (
      PARTITION BY p.kategori_id
      ORDER BY p.harga ASC
    ) AS ranking
  FROM produk p
  JOIN kategori k ON p.kategori_id = k.id
  WHERE p.aktif = true
  ORDER BY k.nama, ranking
`


// Contoh 3: Statistik penjualan per bulan
const penjualanBulanan = await prisma.$queryRaw<{
  tahun:              number
  bulan:              number
  total_pesanan:      bigint
  total_pendapatan:   number
  rata_rata_pesanan:  number
}[]>`
  SELECT
    YEAR(created_at)  AS tahun,
    MONTH(created_at) AS bulan,
    COUNT(*)          AS total_pesanan,
    SUM(total)        AS total_pendapatan,
    AVG(total)        AS rata_rata_pesanan
  FROM pesanan
  WHERE
    status    = 'SELESAI'
    AND YEAR(created_at) = ${new Date().getFullYear()}
  GROUP BY
    YEAR(created_at),
    MONTH(created_at)
  ORDER BY bulan ASC
`

penjualanBulanan.forEach(stat => {
  // Catatan: BigInt perlu dikonversi untuk operasi matematika
  console.log(`${stat.tahun}-${String(stat.bulan).padStart(2, '0')}:`)
  console.log(`  ${Number(stat.total_pesanan)} pesanan`)
  console.log(`  Rp ${stat.total_pendapatan.toLocaleString('id-ID')}`)
})


// ─── $executeRaw — untuk INSERT, UPDATE, DELETE ────────────────────────
// Return: jumlah baris yang terpengaruh

// Update massal dengan logika kompleks
const jumlahUpdated = await prisma.$executeRaw`
  UPDATE produk
  SET
    harga      = harga * 0.9,
    updated_at = NOW()
  WHERE
    kategori_id = ${1}
    AND aktif   = true
    AND stok    > ${0}
`
console.log(`${jumlahUpdated} produk mendapat diskon 10%`)


// Hapus data lama (cleanup)
const batasWaktu = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 hari lalu
const jumlahDihapus = await prisma.$executeRaw`
  DELETE FROM pesanan
  WHERE
    status    = 'DIBATALKAN'
    AND created_at < ${batasWaktu}
`
console.log(`${jumlahDihapus} pesanan dibatalkan dihapus`)


// ─── ⚠️ KEAMANAN — JANGAN lakukan ini! ────────────────────────────────
const inputPengguna = "'; DROP TABLE produk; --"  // Input berbahaya!

// ❌ SANGAT BERBAHAYA — SQL Injection!
await prisma.$queryRawUnsafe(
  `SELECT * FROM produk WHERE nama = '${inputPengguna}'`
  // inputPengguna langsung di-embed → SQL bisa dimanipulasi!
)

// ✅ AMAN — Pakai tagged template literal
await prisma.$queryRaw`
  SELECT * FROM produk WHERE nama = ${inputPengguna}
`
// inputPengguna otomatis di-escape sebagai parameter → tidak bisa inject SQL!


// ─── Type casting untuk raw query results ─────────────────────────────
// Raw query return tipe yang mungkin tidak seperti yang diharapkan
// MySQL: COUNT() return BigInt, DECIMAL return string
// Perlu konversi manual!

const stats = await prisma.$queryRaw<{ total: bigint; avg_harga: string }[]>`
  SELECT COUNT(*) as total, AVG(harga) as avg_harga FROM produk
`

const total    = Number(stats[0].total)     // BigInt → number
const avgHarga = parseFloat(stats[0].avg_harga) // string → number
console.log(`Total: ${total}, Rata-rata harga: ${avgHarga}`)
```

---

## 🔧 15.6 Prisma Middleware — Intercept Semua Query

```typescript
// Middleware dijalankan sebelum SETIAP operasi Prisma
// Berguna untuk: logging, validasi global, transformasi data

const prismaWithMiddleware = new PrismaClient()

// ─── Middleware 1: Query logger ────────────────────────────────────────
prismaWithMiddleware.$use(async (params, next) => {
  const sebelum = Date.now()
  const result  = await next(params)  // Jalankan query
  const durasi  = Date.now() - sebelum

  // Log query yang lambat
  if (durasi > 500) {
    console.warn(
      `⚠️ SLOW QUERY: ${params.model}.${params.action} — ${durasi}ms`
    )
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 ${params.model}.${params.action} — ${durasi}ms`)
  }

  return result
})


// ─── Middleware 2: Soft delete otomatis ────────────────────────────────
prismaWithMiddleware.$use(async (params, next) => {
  const modelDenganSoftDelete = ['Produk', 'Pengguna']

  if (modelDenganSoftDelete.includes(params.model ?? '')) {

    // Auto-filter soft deleted di findMany dan findFirst
    if (['findMany', 'findFirst', 'findFirstOrThrow'].includes(params.action)) {
      if (params.args.where) {
        // Tambahkan kondisi deletedAt: null jika belum ada
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null
        }
      } else {
        params.args.where = { deletedAt: null }
      }
    }

    // Ubah delete() menjadi soft delete
    if (params.action === 'delete') {
      params.action = 'update'
      params.args['data'] = { deletedAt: new Date() }
    }

    // Ubah deleteMany() menjadi updateMany (soft delete batch)
    if (params.action === 'deleteMany') {
      params.action = 'updateMany'
      if (params.args.data !== undefined) {
        params.args.data.deletedAt = new Date()
      } else {
        params.args.data = { deletedAt: new Date() }
      }
    }
  }

  return next(params)
})


// ─── Middleware 3: Audit log ────────────────────────────────────────────
prismaWithMiddleware.$use(async (params, next) => {
  const result = await next(params)

  // Catat perubahan data ke audit log
  if (['create', 'update', 'delete'].includes(params.action)) {
    // Jangan log middleware itu sendiri (infinite loop!)
    if (params.model !== 'AuditLog') {
      await prismaWithMiddleware.auditLog.create({
        data: {
          model:  params.model ?? 'unknown',
          aksi:   params.action,
          data:   JSON.stringify(params.args.data ?? {}),
          waktu:  new Date(),
        }
      }).catch(console.error)  // Jangan crash aplikasi jika audit gagal
    }
  }

  return result
})
```

---

## 🚀 15.7 Studi Kasus Lengkap — Dashboard Statistik

```typescript
// Menggabungkan semua yang dipelajari di Bagian V:
// - Filtering kompleks
// - Nested select
// - Aggregate + groupBy
// - Transaction batch
// - Raw query

async function getDashboardData(penggunaId?: number) {
  // Ambil semua data dashboard dalam satu transaction (konsistensi data)
  const [
    ringkasanProduk,
    ringkasanPesanan,
    produkTerlaris,
    penjualanMingguan,
    ulasanTerbaru,
  ] = await prisma.$transaction([

    // ① Ringkasan produk
    prisma.produk.aggregate({
      where: { aktif: true, deletedAt: null },
      _count: { id:   true },
      _sum:   { stok: true },
      _avg:   { harga: true },
    }),

    // ② Ringkasan pesanan
    prisma.pesanan.groupBy({
      by:    ['status'],
      _count: { id:    true },
      _sum:   { total: true },
      ...(penggunaId && { where: { penggunaId } }),
    }),

    // ③ 5 produk terlaris (berdasarkan jumlah item pesanan)
    prisma.produk.findMany({
      where: { aktif: true },
      select: {
        id:    true,
        nama:  true,
        harga: true,
        _count: { select: { itemPesanan: true } }
      },
      orderBy: { itemPesanan: { _count: 'desc' } },
      take:    5,
    }),

    // ④ Penjualan 7 hari terakhir (raw query untuk groupBy tanggal)
    prisma.$queryRaw<{ tanggal: Date; total: number; jumlah: bigint }[]>`
      SELECT
        DATE(created_at) AS tanggal,
        SUM(total)       AS total,
        COUNT(*)         AS jumlah
      FROM pesanan
      WHERE
        status     = 'SELESAI'
        AND created_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE(created_at)
      ORDER BY tanggal ASC
    `,

    // ⑤ 5 ulasan terbaru
    prisma.ulasan.findMany({
      select: {
        rating:   true,
        komentar: true,
        createdAt: true,
        pengguna: { select: { nama: true } },
        produk:   { select: { nama: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    5,
    }),
  ])

  // Proses data penjualan mingguan
  const penjualanFormatted = penjualanMingguan.map(item => ({
    tanggal: item.tanggal.toLocaleDateString('id-ID'),
    total:   item.total,
    jumlah:  Number(item.jumlah),
  }))

  return {
    produk: {
      totalAktif:  ringkasanProduk._count.id,
      totalStok:   ringkasanProduk._sum.stok,
      rataHarga:   Number(ringkasanProduk._avg.harga).toFixed(0),
    },
    pesanan: {
      perStatus: ringkasanPesanan.map(s => ({
        status:  s.status,
        jumlah:  s._count.id,
        total:   Number(s._sum.total),
      })),
      totalPendapatan: ringkasanPesanan
        .filter(s => s.status === 'SELESAI')
        .reduce((acc, s) => acc + Number(s._sum.total), 0),
    },
    produkTerlaris: produkTerlaris.map(p => ({
      nama:          p.nama,
      harga:         Number(p.harga),
      totalTerjual:  p._count.itemPesanan,
    })),
    penjualanMingguan: penjualanFormatted,
    ulasanTerbaru,
  }
}
```

---

## ✅ Checklist Bab 15

```
□ Memahami mengapa transaction penting (konsistensi data)
□ Bisa membuat sequential transaction dengan $transaction(async (tx) => {})
□ Selalu pakai 'tx' bukan 'prisma' di dalam sequential transaction
□ Bisa membuat batch transaction dengan $transaction([...])
□ Tahu kapan pakai sequential vs batch transaction
□ Bisa menggunakan $queryRaw dengan tagged template literal
□ Bisa menggunakan $executeRaw untuk mutasi data
□ Tidak pernah pakai $queryRawUnsafe dengan input pengguna!
□ Bisa konversi BigInt dan string dari raw query ke tipe yang benar
□ Bisa membuat middleware Prisma untuk logging, soft delete, atau audit log
```

---

## 📊 Ringkasan Bagian V

```
YANG SUDAH DIPELAJARI DI BAGIAN V:

Bab 13 — Filtering & Operator Lengkap
├── Operator perbandingan: equals, not, gt, gte, lt, lte
├── Array operators: in, notIn
├── String operators: contains, startsWith, endsWith (+ mode insensitive)
├── Null check: null, { not: null }
├── Logika: AND (implisit & eksplisit), OR, NOT
├── Filter dinamis dengan spread operator
├── Sorting: single, multiple field, by relasi, by _count
└── Pagination: offset (numbered pages) & cursor (infinite scroll)

Bab 14 — Select & Include: Query Relasi
├── select vs include — perbedaan dan kapan pakai
├── Nested select untuk field tertentu dari relasi
├── Filter pada relasi: some, every, none, is, isNot
├── Nested include hingga 3 level
├── Include dengan filter, sort, dan take (hindari over-fetching)
└── _count untuk hitung relasi tanpa load data

Bab 15 — Transactions & Raw Query
├── Sequential transaction — operasi berurutan, akses hasil sebelumnya
├── Batch transaction — operasi paralel, lebih cepat
├── Transaction options: maxWait, timeout, isolationLevel
├── $queryRaw — SELECT dengan typed result
├── $executeRaw — INSERT, UPDATE, DELETE
├── Keamanan: WAJIB pakai tagged template literal!
├── Type casting hasil raw query (BigInt, string → number)
└── Prisma Middleware untuk logging, soft delete, dan audit log
```

> 📌 **Selanjutnya — Bagian VI:** Di Bagian V kamu sudah menguasai semua teknik query yang powerful. Di Bagian VI, kita masuk ke **Prisma Lanjutan** — middleware, extension, integrasi validasi dengan Zod, dan error handling yang profesional.

---

🚀 Lanjut ke [🧩 Bab 16 — Prisma Middleware & Extension](/bagian-6/bab-16) untuk melanjutkan perjalanan!
