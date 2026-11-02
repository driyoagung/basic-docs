---
title: "Bab 10 — READ: Mengambil Data"
---

Operasi READ adalah yang paling sering dilakukan dalam aplikasi nyata. Prisma menyediakan beberapa fungsi dengan karakteristik berbeda — penting untuk memilih yang tepat agar kode efisien dan type-safe.

---

## 🔄 10.1 Perbandingan Raw SQL vs Prisma — READ

```typescript
// ─── Ambil satu record ────────────────────────────────────────────────

// ❌ RAW SQL
const [rows] = await pool.query(
  'SELECT * FROM produk WHERE id = ? LIMIT 1',
  [produkId]
)
const produk = rows[0]  // Tipe: any — bisa null, tidak ada checking
if (produk) {
  console.log(produk.nama)   // Tidak ada autocomplete, rawan typo
}

// ✅ PRISMA
const produk = await prisma.produk.findUnique({ where: { id: produkId } })
// Tipe: Produk | null — TypeScript paksa kamu handle null!
if (produk) {
  console.log(produk.nama)   // Autocomplete ✅, type-safe ✅
}


// ─── Ambil dengan join / relasi ───────────────────────────────────────

// ❌ RAW SQL — JOIN yang verbose dan rawan typo
const [rows] = await pool.query(`
  SELECT
    p.*,
    k.nama AS kategori_nama,
    k.slug AS kategori_slug,
    GROUP_CONCAT(t.nama) AS tags
  FROM produk p
  LEFT JOIN kategori k ON p.kategori_id = k.id
  LEFT JOIN _ProdukToTag pt ON p.id = pt.A
  LEFT JOIN tag t ON pt.B = t.id
  WHERE p.id = ? AND p.aktif = true
  GROUP BY p.id
  LIMIT 1
`, [produkId])
// rows[0].kategori_nama ← rawan typo, tidak ada autocomplete

// ✅ PRISMA — Relasi otomatis, type-safe
const produk = await prisma.produk.findUnique({
  where:   { id: produkId, aktif: true },
  include: { kategori: true, tags: true }
})
// produk.kategori.nama ← autocomplete ✅, type-safe ✅
// produk.tags[0].nama  ← type-safe ✅
```

---

## 🔍 10.2 `findUnique()` — Cari Berdasarkan Field Unik

```typescript
// findUnique() HANYA bisa dipakai dengan field yang punya @id atau @unique!
// Jika tidak ditemukan: return null (bukan error)

// ─── By primary key ───────────────────────────────────────────────────
const produk = await prisma.produk.findUnique({
  where: { id: 1 }
})
// produk: Produk | null


// ─── By @unique field ─────────────────────────────────────────────────
const produkBySlug = await prisma.produk.findUnique({
  where: { slug: 'laptop-asus-rog' }
})

const penggunaByEmail = await prisma.pengguna.findUnique({
  where: { email: 'budi@email.com' }
})


// ─── Dengan select — ambil field tertentu saja ────────────────────────
const produkRingkas = await prisma.produk.findUnique({
  where:  { id: 1 },
  select: {
    id:    true,
    nama:  true,
    harga: true,
    // stok, deskripsi, dll TIDAK diambil → query lebih ringan
  }
})
// produkRingkas?.id    → tersedia
// produkRingkas?.stok  → ERROR TypeScript! Tidak ada di select


// ─── Dengan include — ambil semua field + relasi ──────────────────────
const produkLengkap = await prisma.produk.findUnique({
  where:   { id: 1 },
  include: {
    kategori: {
      select: { nama: true, slug: true }  // Hanya nama & slug kategori
    },
    tags: {
      select: { nama: true }              // Hanya nama tag
    },
    _count: {
      select: { ulasan: true }            // Hitung jumlah ulasan
    }
  }
})

console.log(produkLengkap?.kategori.nama)  // "Elektronik"
console.log(produkLengkap?._count.ulasan)  // 42


// ─── Handle null dengan benar ─────────────────────────────────────────
// Cara 1: Early return
const produkDetail = await prisma.produk.findUnique({ where: { id: 1 } })
if (!produkDetail) {
  throw new Error('Produk tidak ditemukan')
  // atau return res.status(404).json({ error: 'Produk tidak ditemukan' })
}
console.log(produkDetail.nama) // TypeScript tahu produkDetail sudah bukan null

// Cara 2: Optional chaining
const nama = produkDetail?.nama ?? 'Nama tidak tersedia'

// Cara 3: findUniqueOrThrow() — auto throw jika null (lihat bagian berikutnya)
```

---

## 🎯 10.3 `findUniqueOrThrow()` — Cari atau Lempar Error

```typescript
// Seperti findUnique() tapi OTOMATIS throw error jika tidak ditemukan
// Return type: Produk (bukan Produk | null) — tidak perlu cek null!

// ─── Tanpa perlu cek null manual ──────────────────────────────────────
try {
  const produk = await prisma.produk.findUniqueOrThrow({
    where: { id: 999 }  // ID tidak ada
  })
  // Jika sampai sini, produk PASTI ada
  console.log(produk.nama)   // TypeScript tahu ini bukan null

} catch (error) {
  // Throw: PrismaClientKnownRequestError dengan kode P2025
  console.error('Produk tidak ditemukan')
}


// ─── Membandingkan findUnique vs findUniqueOrThrow ────────────────────

// findUnique — perlu cek null setiap saat
const p1 = await prisma.produk.findUnique({ where: { id: 1 } })
// p1: Produk | null
if (!p1) throw new Error('Tidak ada')
console.log(p1.nama)  // OK setelah cek

// findUniqueOrThrow — langsung pakai, tidak perlu cek
const p2 = await prisma.produk.findUniqueOrThrow({ where: { id: 1 } })
// p2: Produk (pasti bukan null)
console.log(p2.nama)  // OK langsung tanpa cek


// ─── Kapan pakai yang mana? ────────────────────────────────────────────
// findUnique       → Saat tidak ada data adalah kondisi VALID
//                   Contoh: cari pengguna saat login (belum tentu ada)
//
// findUniqueOrThrow → Saat tidak ada data adalah kondisi ERROR
//                    Contoh: ambil detail produk berdasarkan ID dari URL
//                    Kalau ID tidak ada → memang harus 404
```

---

## 📋 10.4 `findFirst()` — Cari Satu dengan Kondisi Bebas

```typescript
// findFirst() lebih fleksibel dari findUnique()
// Bisa filter dengan field apapun, bukan hanya @id atau @unique
// Return: record pertama yang cocok, atau null

// ─── Ambil produk termahal yang masih aktif ───────────────────────────
const produkTermahal = await prisma.produk.findFirst({
  where:   { aktif: true, stok: { gt: 0 } },
  orderBy: { harga: 'desc' },              // Urutkan dari termahal
})


// ─── Ambil pesanan terakhir pengguna ─────────────────────────────────
const pesananTerakhir = await prisma.pesanan.findFirst({
  where:   { penggunaId: 1 },
  orderBy: { createdAt: 'desc' },          // Yang paling baru
  include: { items: { include: { produk: true } } }
})


// ─── Ambil satu produk featured ───────────────────────────────────────
const featuredProduk = await prisma.produk.findFirst({
  where: {
    aktif:   true,
    featured: true,
    stok:    { gt: 0 },
  },
  orderBy: { views: 'desc' },  // Yang paling banyak dilihat
})


// ─── findFirst vs findUnique: Perbedaan Kunci ────────────────────────
// findUnique:
//   ✅ Lebih cepat (database bisa pakai index unik secara optimal)
//   ❌ Hanya bisa filter dengan @id atau @unique field
//   SQL: ... WHERE id = 1 LIMIT 1

// findFirst:
//   ✅ Bisa filter dengan field apapun
//   ✅ Bisa dikombinasikan dengan orderBy untuk ambil "yang terbaru" dll
//   ⚠️  Sedikit lebih lambat karena tidak selalu pakai unique index
//   SQL: ... WHERE aktif = true ORDER BY harga DESC LIMIT 1
```

---

## 📚 10.5 `findMany()` — Ambil Banyak Data

```typescript
// findMany adalah yang paling sering dipakai untuk halaman listing

// ─── Paling sederhana — ambil semua ──────────────────────────────────
// ⚠️ JANGAN pakai ini di production untuk data besar!
const semuaProduk = await prisma.produk.findMany()
// Bisa return jutaan record → crash server!


// ─── Dengan pagination — WAJIB untuk production ───────────────────────
const halaman    = 2
const perHalaman = 10

const produk = await prisma.produk.findMany({
  skip: (halaman - 1) * perHalaman,   // Lewati record sebelumnya
  take: perHalaman,                    // Ambil N record
})
// SQL: SELECT * FROM produk LIMIT 10 OFFSET 10


// ─── Dengan semua opsi lengkap ────────────────────────────────────────
const hasilQuery = await prisma.produk.findMany({
  // WHERE — filter kondisi
  where: {
    aktif:      true,
    stok:       { gt: 0 },
    kategoriId: 1,
  },

  // SELECT — hanya field yang dibutuhkan (lebih efisien!)
  select: {
    id:          true,
    nama:        true,
    slug:        true,
    harga:       true,
    stok:        true,
    kategori: {
      select: { nama: true, slug: true }
    },
    tags: {
      select: { nama: true, slug: true }
    },
    _count: {
      select: { ulasan: true }
    }
    // 'deskripsi' tidak diambil — bisa sangat panjang, tidak perlu di listing
  },

  // ORDER BY — pengurutan
  orderBy: [
    { featured:  'desc' },  // Featured tampil duluan
    { createdAt: 'desc' },  // Lalu yang terbaru
  ],

  // PAGINATION
  skip: 0,
  take: 12,
})


// ─── Ambil data + hitung total (untuk info pagination) ────────────────
// Lakukan secara PARALEL agar lebih cepat!
const kondisi = { aktif: true, kategoriId: 1 }

const [produkList, totalProduk] = await Promise.all([
  prisma.produk.findMany({
    where:   kondisi,
    orderBy: { createdAt: 'desc' },
    skip:    0,
    take:    12,
    include: { kategori: true }
  }),
  prisma.produk.count({ where: kondisi })  // Hitung total
])

const totalHalaman = Math.ceil(totalProduk / 12)

console.log(`Menampilkan ${produkList.length} dari ${totalProduk} produk`)
console.log(`Halaman 1 dari ${totalHalaman}`)
```

---

## 📊 10.6 `count()` — Hitung Jumlah Record

```typescript
// SQL: SELECT COUNT(*) FROM ...

// ─── Hitung semua ──────────────────────────────────────────────────────
const totalProduk = await prisma.produk.count()


// ─── Hitung dengan kondisi ─────────────────────────────────────────────
const produkAktif = await prisma.produk.count({
  where: { aktif: true }
})

const produkStokHabis = await prisma.produk.count({
  where: { stok: 0, aktif: true }
})

const pesananBulanIni = await prisma.pesanan.count({
  where: {
    createdAt: {
      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      // Awal bulan ini
    },
  }
})

console.log(`Produk aktif  : ${produkAktif}`)
console.log(`Stok habis    : ${produkStokHabis}`)
console.log(`Pesanan bulan ini: ${pesananBulanIni}`)
```

---

## 📈 10.7 `aggregate()` — Statistik dan Agregasi

```typescript
// Seperti SQL: COUNT, SUM, AVG, MIN, MAX

// ─── Aggregate dasar ───────────────────────────────────────────────────
const statistikProduk = await prisma.produk.aggregate({
  where: { aktif: true },   // Filter opsional

  _count: { id: true },     // COUNT(id) — jumlah produk aktif
  _sum:   { stok: true },   // SUM(stok) — total stok semua produk
  _avg:   { harga: true },  // AVG(harga) — rata-rata harga
  _max:   { harga: true },  // MAX(harga) — harga tertinggi
  _min:   { harga: true },  // MIN(harga) — harga terendah
})

console.log('=== Statistik Produk Aktif ===')
console.log(`Jumlah produk    : ${statistikProduk._count.id}`)
console.log(`Total stok       : ${statistikProduk._sum.stok}`)
console.log(`Rata-rata harga  : Rp ${Number(statistikProduk._avg.harga).toLocaleString('id-ID')}`)
console.log(`Harga termahal   : Rp ${Number(statistikProduk._max.harga).toLocaleString('id-ID')}`)
console.log(`Harga termurah   : Rp ${Number(statistikProduk._min.harga).toLocaleString('id-ID')}`)


// ─── Statistik pesanan per bulan ──────────────────────────────────────
const statistikPesanan = await prisma.pesanan.aggregate({
  where: {
    status:    'SELESAI',
    createdAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31'),
    }
  },
  _count: { id:    true },
  _sum:   { total: true },
  _avg:   { total: true },
})

console.log(`Pesanan selesai  : ${statistikPesanan._count.id}`)
console.log(`Total pendapatan : Rp ${Number(statistikPesanan._sum.total).toLocaleString('id-ID')}`)
console.log(`Rata-rata pesanan: Rp ${Number(statistikPesanan._avg.total).toLocaleString('id-ID')}`)
```

---

## 🗂️ 10.8 `groupBy()` — Agregasi per Grup

```typescript
// Seperti SQL: GROUP BY dengan COUNT, SUM, AVG, MIN, MAX

// ─── Hitung produk per kategori ────────────────────────────────────────
const produkPerKategori = await prisma.produk.groupBy({
  by:    ['kategoriId'],   // GROUP BY kategori_id

  where: { aktif: true },  // Filter opsional (sebelum group)

  _count: { id:    true }, // Hitung jumlah produk
  _avg:   { harga: true }, // Rata-rata harga per kategori
  _sum:   { stok:  true }, // Total stok per kategori

  having: {
    stok: { _sum: { gt: 10 } }  // HAVING SUM(stok) > 10
  },                             // Filter SETELAH grouping

  orderBy: {
    _count: { id: 'desc' }  // Urutkan dari yang paling banyak produk
  },
})

produkPerKategori.forEach(grup => {
  console.log(`Kategori ID ${grup.kategoriId}:`)
  console.log(`  Jumlah produk: ${grup._count.id}`)
  console.log(`  Rata harga   : Rp ${Number(grup._avg.harga).toLocaleString('id-ID')}`)
  console.log(`  Total stok   : ${grup._sum.stok}`)
})


// ─── Hitung pesanan per status ─────────────────────────────────────────
const pesananPerStatus = await prisma.pesanan.groupBy({
  by:     ['status'],
  _count: { id: true },
  _sum:   { total: true },
  orderBy: { _count: { id: 'desc' } }
})

pesananPerStatus.forEach(grup => {
  console.log(`${grup.status}: ${grup._count.id} pesanan (Rp ${Number(grup._sum.total).toLocaleString('id-ID')})`)
})
// MENUNGGU_PEMBAYARAN: 25 pesanan
// SELESAI            : 180 pesanan
// DIKIRIM            : 42 pesanan
// dll...


// ─── Penjualan per bulan ──────────────────────────────────────────────
// Untuk group by bulan/tanggal, pakai raw query
// karena Prisma groupBy tidak support fungsi tanggal
import { Prisma } from '@prisma/client'

const penjualanPerBulan = await prisma.$queryRaw<
  { bulan: string; total_pesanan: bigint; total_pendapatan: number }[]
>`
  SELECT
    DATE_FORMAT(created_at, '%Y-%m') AS bulan,
    COUNT(*)                          AS total_pesanan,
    SUM(total)                        AS total_pendapatan
  FROM pesanan
  WHERE status = 'SELESAI'
    AND created_at >= '2024-01-01'
  GROUP BY DATE_FORMAT(created_at, '%Y-%m')
  ORDER BY bulan ASC
`
```

---

## ✅ Checklist Bab 10

```
□ Memahami perbedaan findUnique, findFirst, findMany
□ Tahu kapan pakai findUnique vs findUniqueOrThrow
□ Selalu pakai pagination (skip + take) pada findMany di production
□ Menggunakan select untuk hanya ambil field yang dibutuhkan
□ Paham bahwa include dan select tidak bisa dipakai bersamaan di level yang sama
□ Bisa menggunakan count() untuk informasi pagination
□ Bisa menggunakan aggregate() untuk statistik
□ Bisa menggunakan groupBy() untuk agregasi per grup
□ Query count dan findMany dijalankan paralel dengan Promise.all
```

---

---

---

🚀 Lanjut ke [🔄 Bab 11 — UPDATE — Mengubah Data](/bagian-4/bab-11) untuk melanjutkan perjalanan!
