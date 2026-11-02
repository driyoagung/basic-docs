---
title: "Bab 13 — Filtering & Operator Lengkap"
---

Di bab ini kita bahas semua operator `where` yang tersedia di Prisma — dari yang paling sederhana hingga kombinasi kompleks. Setiap operator disertai perbandingan SQL-nya agar transisi terasa natural.

---

## 🔄 13.1 Perbandingan Raw SQL vs Prisma — Filtering

```typescript
// ❌ RAW SQL — Perlu string SQL yang verbose dan rawan typo
const [rows] = await pool.query(`
  SELECT * FROM produk
  WHERE aktif = true
    AND stok > 0
    AND harga BETWEEN ? AND ?
    AND (nama LIKE ? OR deskripsi LIKE ?)
    AND kategori_id IN (?, ?, ?)
    AND deleted_at IS NULL
  ORDER BY harga ASC
  LIMIT ? OFFSET ?
`, [100000, 5000000, '%laptop%', '%laptop%', 1, 2, 3, 12, 0])
// Urutan parameter harus benar! Rawan typo dan salah urut

// ✅ PRISMA — Named fields, type-safe, dan lebih mudah dibaca
const produk = await prisma.produk.findMany({
  where: {
    aktif:     true,
    stok:      { gt: 0 },
    harga:     { gte: 100000, lte: 5000000 },
    OR: [
      { nama:      { contains: 'laptop', mode: 'insensitive' } },
      { deskripsi: { contains: 'laptop', mode: 'insensitive' } },
    ],
    kategoriId: { in: [1, 2, 3] },
    deletedAt:  null,
  },
  orderBy: { harga: 'asc' },
  take:    12,
  skip:    0,
})
// Named fields — tidak perlu ingat urutan ✅
// TypeScript akan error jika nama field salah ✅
// IDE autocomplete untuk semua operator ✅
```

---

## 🔢 13.2 Operator Perbandingan — Semua yang Tersedia

```typescript
// ─── EQUALS — Sama dengan ──────────────────────────────────────────────
// SQL: WHERE aktif = true
await prisma.produk.findMany({
  where: { aktif: true }
  // Cara singkat: langsung assign nilai
})
// atau eksplisit:
await prisma.produk.findMany({
  where: { aktif: { equals: true } }
})


// ─── NOT — Tidak sama dengan ───────────────────────────────────────────
// SQL: WHERE status != 'DIBATALKAN'
await prisma.pesanan.findMany({
  where: { status: { not: 'DIBATALKAN' } }
})

// NOT dengan object (negasi kondisi kompleks):
// SQL: WHERE NOT (stok = 0 AND aktif = false)
await prisma.produk.findMany({
  where: {
    NOT: {
      AND: [{ stok: 0 }, { aktif: false }]
    }
  }
})


// ─── GT / GTE / LT / LTE — Perbandingan angka dan tanggal ────────────
// SQL: WHERE harga > 1000000
await prisma.produk.findMany({ where: { harga: { gt: 1000000 } } })

// SQL: WHERE harga >= 1000000
await prisma.produk.findMany({ where: { harga: { gte: 1000000 } } })

// SQL: WHERE harga < 1000000
await prisma.produk.findMany({ where: { harga: { lt: 1000000 } } })

// SQL: WHERE harga <= 1000000
await prisma.produk.findMany({ where: { harga: { lte: 1000000 } } })

// SQL: WHERE harga BETWEEN 500000 AND 5000000
await prisma.produk.findMany({
  where: {
    harga: { gte: 500000, lte: 5000000 }
    // Kombinasikan gte dan lte dalam satu object!
  }
})

// Dengan tanggal:
// SQL: WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'
const awalBulan = new Date('2024-01-01')
const akhirBulan = new Date('2024-02-01')
await prisma.pesanan.findMany({
  where: {
    createdAt: { gte: awalBulan, lt: akhirBulan }
  }
})


// ─── IN / NOT IN — Ada atau tidak dalam array ──────────────────────────
// SQL: WHERE kategori_id IN (1, 2, 3)
await prisma.produk.findMany({
  where: { kategoriId: { in: [1, 2, 3] } }
})

// SQL: WHERE status NOT IN ('DIBATALKAN', 'MENUNGGU_PEMBAYARAN')
await prisma.pesanan.findMany({
  where: {
    status: { notIn: ['DIBATALKAN', 'MENUNGGU_PEMBAYARAN'] }
  }
})

// Dinamis — berdasarkan array dari request
const kategoriDipilih = [1, 3, 5]  // Dari query param
await prisma.produk.findMany({
  where: {
    kategoriId: kategoriDipilih.length > 0
      ? { in: kategoriDipilih }
      : undefined  // Jika array kosong, tidak filter
  }
})
```

---

## 📝 13.3 Operator String — Pencarian Teks

```typescript
// ─── CONTAINS — Mengandung substring ──────────────────────────────────
// SQL MySQL: WHERE nama LIKE '%laptop%'
// SQL PG:   WHERE nama ILIKE '%laptop%' (dengan mode insensitive)

await prisma.produk.findMany({
  where: { nama: { contains: 'laptop' } }
  // MySQL: Case-insensitive by default karena collation utf8mb4_unicode_ci
  // PostgreSQL: Case-SENSITIVE by default! Perlu mode: 'insensitive'
})

// Case-insensitive di PostgreSQL:
await prisma.produk.findMany({
  where: { nama: { contains: 'laptop', mode: 'insensitive' } }
})


// ─── STARTS WITH — Diawali string ─────────────────────────────────────
// SQL: WHERE nama LIKE 'laptop%'
await prisma.produk.findMany({
  where: { nama: { startsWith: 'laptop', mode: 'insensitive' } }
})


// ─── ENDS WITH — Diakhiri string ──────────────────────────────────────
// SQL: WHERE email LIKE '%@gmail.com'
await prisma.pengguna.findMany({
  where: { email: { endsWith: '@gmail.com' } }
})


// ─── NULL CHECK ───────────────────────────────────────────────────────
// SQL: WHERE deleted_at IS NULL
await prisma.produk.findMany({
  where: { deletedAt: null }
})

// SQL: WHERE deleted_at IS NOT NULL
await prisma.produk.findMany({
  where: { deletedAt: { not: null } }
})

// SQL: WHERE foto IS NOT NULL AND bio IS NOT NULL
await prisma.profil.findMany({
  where: {
    foto: { not: null },
    bio:  { not: null },
  }
})


// ─── FULL-TEXT SEARCH — Pencarian multi-kata ──────────────────────────
// Prisma tidak punya built-in full-text search
// Simulasikan dengan OR + contains:
async function cariProduk(keyword: string) {
  const kataKata = keyword.trim().split(/\s+/)  // Split per kata

  return prisma.produk.findMany({
    where: {
      aktif:    true,
      deletedAt: null,
      AND: kataKata.map(kata => ({
        // Setiap kata harus ada di nama ATAU deskripsi
        OR: [
          { nama:      { contains: kata, mode: 'insensitive' } },
          { deskripsi: { contains: kata, mode: 'insensitive' } },
        ]
      }))
      // "laptop asus gaming" → cari yang punya ketiga kata
    },
    orderBy: { views: 'desc' },
    take:    20,
  })
}
```

---

## 🔗 13.4 AND, OR, NOT — Kombinasi Kondisi

```typescript
// ─── AND — Semua kondisi harus terpenuhi (default behavior) ───────────
// SQL: WHERE aktif = true AND stok > 0 AND harga < 5000000

// Cara 1: Object biasa (implisit AND) — paling umum
await prisma.produk.findMany({
  where: {
    aktif: true,
    stok:  { gt: 0 },
    harga: { lt: 5000000 },
  }
})

// Cara 2: Eksplisit AND — berguna untuk array kondisi dinamis
await prisma.produk.findMany({
  where: {
    AND: [
      { aktif: true },
      { stok:  { gt: 0 } },
      { harga: { lt: 5000000 } },
    ]
  }
})


// ─── OR — Salah satu kondisi harus terpenuhi ──────────────────────────
// SQL: WHERE kategori_id = 1 OR kategori_id = 2
await prisma.produk.findMany({
  where: {
    OR: [
      { kategoriId: 1 },
      { kategoriId: 2 },
    ]
  }
  // Tapi ini lebih baik ditulis: where: { kategoriId: { in: [1, 2] } }
})

// Kasus yang lebih tepat untuk OR:
// SQL: WHERE (nama LIKE '%sale%') OR (harga < 100000)
await prisma.produk.findMany({
  where: {
    OR: [
      { nama:  { contains: 'sale', mode: 'insensitive' } },
      { harga: { lt: 100000 } },
    ]
  }
})


// ─── NOT — Negasi kondisi ─────────────────────────────────────────────
// SQL: WHERE NOT aktif = true
await prisma.produk.findMany({
  where: { NOT: { aktif: true } }
  // Sama dengan: where: { aktif: false }
})

// Lebih berguna untuk kasus kompleks:
// SQL: WHERE NOT (stok = 0 OR deleted_at IS NOT NULL)
await prisma.produk.findMany({
  where: {
    NOT: {
      OR: [
        { stok:      0 },
        { deletedAt: { not: null } },
      ]
    }
  }
})


// ─── Kombinasi kompleks — AND + OR + NOT ──────────────────────────────
// Kasus nyata: Halaman pencarian produk dengan berbagai filter

interface FilterProduk {
  keyword?:    string
  minHarga?:   number
  maxHarga?:   number
  kategoriIds?: number[]
  tagSlugs?:   string[]
  inStock?:    boolean
}

async function cariDenganFilter(filter: FilterProduk) {
  return prisma.produk.findMany({
    where: {
      aktif:    true,
      deletedAt: null,

      // Filter harga (jika ada)
      ...(filter.minHarga !== undefined && {
        harga: { gte: filter.minHarga }
      }),
      ...(filter.maxHarga !== undefined && {
        harga: {
          ...(filter.minHarga !== undefined && { gte: filter.minHarga }),
          lte: filter.maxHarga
        }
      }),

      // Filter kategori (jika ada)
      ...(filter.kategoriIds && filter.kategoriIds.length > 0 && {
        kategoriId: { in: filter.kategoriIds }
      }),

      // Filter stok
      ...(filter.inStock && { stok: { gt: 0 } }),

      // Filter keyword — cari di nama dan deskripsi
      ...(filter.keyword && {
        OR: [
          { nama:      { contains: filter.keyword, mode: 'insensitive' } },
          { deskripsi: { contains: filter.keyword, mode: 'insensitive' } },
        ]
      }),

      // Filter tag — produk harus punya setidaknya satu dari tag ini
      ...(filter.tagSlugs && filter.tagSlugs.length > 0 && {
        tags: {
          some: {
            slug: { in: filter.tagSlugs }
          }
        }
      }),
    },
    orderBy: { createdAt: 'desc' },
    take:    12,
  })
}

// Penggunaan:
const hasil = await cariDenganFilter({
  keyword:    'laptop gaming',
  minHarga:   5000000,
  maxHarga:   30000000,
  kategoriIds: [1],
  tagSlugs:   ['gaming', 'premium'],
  inStock:    true,
})
```

---

## 📊 13.5 Sorting — Pengurutan yang Fleksibel

```typescript
// ─── Single field sort ────────────────────────────────────────────────
// SQL: ORDER BY harga ASC
await prisma.produk.findMany({ orderBy: { harga: 'asc' } })

// SQL: ORDER BY created_at DESC
await prisma.produk.findMany({ orderBy: { createdAt: 'desc' } })


// ─── Multiple field sort ──────────────────────────────────────────────
// SQL: ORDER BY featured DESC, created_at DESC, nama ASC
await prisma.produk.findMany({
  orderBy: [
    { featured:  'desc' },  // Featured tampil duluan
    { createdAt: 'desc' },  // Dalam setiap grup, yang terbaru duluan
    { nama:      'asc'  },  // Jika tanggal sama, urutkan nama A-Z
  ]
  // Urutan array = prioritas sort!
})


// ─── Sort berdasarkan field relasi ────────────────────────────────────
// SQL: ORDER BY kategori.nama ASC
await prisma.produk.findMany({
  orderBy: { kategori: { nama: 'asc' } },  // Sort by nama kategori
  include: { kategori: true }
})

// Sort by jumlah relasi (_count)
// SQL: ORDER BY (SELECT COUNT(*) FROM ulasan WHERE produk_id = p.id) DESC
await prisma.produk.findMany({
  orderBy: { ulasan: { _count: 'desc' } },  // Produk dengan ulasan terbanyak
  include: { _count: { select: { ulasan: true } } }
})


// ─── Sort dengan null handling ────────────────────────────────────────
// SQL: ORDER BY deleted_at NULLS FIRST (PostgreSQL)
await prisma.produk.findMany({
  orderBy: { deletedAt: { sort: 'asc', nulls: 'first' } }
  // null tampil dulu, lalu yang ada nilainya
})
```

---

## 📄 13.6 Pagination — Dua Metode Lengkap

```typescript
// ─── METODE 1: Offset Pagination ──────────────────────────────────────
// Paling umum dipakai untuk halaman bernomor (halaman 1, 2, 3...)
// Kekurangan: bisa tidak konsisten jika data baru masuk saat user browsing

interface PaginasiParams {
  halaman:    number
  perHalaman: number
}

async function getProdukDenganPaginasi({ halaman, perHalaman }: PaginasiParams) {
  const kondisi = { aktif: true, deletedAt: null }

  // Jalankan query data dan count secara PARALEL
  const [produk, total] = await Promise.all([
    prisma.produk.findMany({
      where:   kondisi,
      orderBy: { createdAt: 'desc' },
      skip:    (halaman - 1) * perHalaman,  // Offset
      take:    perHalaman,                   // Limit
      select: {
        id: true, nama: true, slug: true,
        harga: true, stok: true,
        kategori: { select: { nama: true, slug: true } },
      }
    }),
    prisma.produk.count({ where: kondisi })
  ])

  const totalHalaman = Math.ceil(total / perHalaman)

  return {
    data: produk,
    meta: {
      halaman,
      perHalaman,
      total,
      totalHalaman,
      halamanPertama: 1,
      halamanTerakhir: totalHalaman,
      adaSebelumnya: halaman > 1,
      adaBerikutnya: halaman < totalHalaman,
    }
  }
}

// Penggunaan:
const hasil = await getProdukDenganPaginasi({ halaman: 2, perHalaman: 12 })
console.log(`Halaman ${hasil.meta.halaman} dari ${hasil.meta.totalHalaman}`)
console.log(`Total: ${hasil.meta.total} produk`)


// ─── METODE 2: Cursor Pagination ──────────────────────────────────────
// Lebih efisien untuk data besar — tidak pakai OFFSET
// Cocok untuk infinite scroll / "load more" button
// Keuntungan: konsisten meski data baru masuk saat scrolling

async function getProdukDenganCursor(cursor?: number, take = 12) {
  const produk = await prisma.produk.findMany({
    where:   { aktif: true, deletedAt: null },
    orderBy: { id: 'desc' },

    // Jika ada cursor, mulai dari setelah cursor
    ...(cursor && {
      cursor: { id: cursor },  // Mulai dari record dengan id ini
      skip:   1,               // Skip cursor record itu sendiri
    }),

    take: take + 1,  // Ambil satu lebih untuk deteksi hasNextPage
  })

  // Cek apakah ada halaman berikutnya
  const adaBerikutnya = produk.length > take
  const items = adaBerikutnya ? produk.slice(0, -1) : produk
  // Buang item terakhir yang kita pakai sebagai "probe"

  // Cursor berikutnya = ID item terakhir
  const nextCursor = adaBerikutnya ? items[items.length - 1].id : null

  return { items, nextCursor, adaBerikutnya }
}

// Penggunaan:
const halaman1 = await getProdukDenganCursor()
console.log(`${halaman1.items.length} produk dimuat`)

// Load lebih banyak:
if (halaman1.adaBerikutnya) {
  const halaman2 = await getProdukDenganCursor(halaman1.nextCursor!)
  console.log(`${halaman2.items.length} produk tambahan dimuat`)
}
```

---

## ✅ Checklist Bab 13

```
□ Hafal semua operator perbandingan: equals, not, gt, gte, lt, lte
□ Tahu cara pakai in dan notIn untuk filter array
□ Bisa pakai contains, startsWith, endsWith dengan mode insensitive
□ Bisa membuat query filter dinamis dengan spread operator
□ Paham perbedaan AND (implisit) vs OR vs NOT
□ Bisa kombinasikan AND + OR + NOT untuk filter kompleks
□ Bisa sort berdasarkan relasi dan jumlah relasi (_count)
□ Bisa implementasikan offset pagination dengan meta lengkap
□ Memahami kapan pakai cursor pagination vs offset pagination
```

---

---

---

🚀 Lanjut ke [🔗 Bab 14 — Select & Include — Query Relasi](/bagian-5/bab-14) untuk melanjutkan perjalanan!
