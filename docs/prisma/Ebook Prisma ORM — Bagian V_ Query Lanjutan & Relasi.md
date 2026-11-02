# 🔴 Ebook Prisma ORM — Bagian V: Query Lanjutan & Relasi

> 🎯 **Tujuan Bagian V:** Menguasai semua operator filtering Prisma, teknik query relasi yang kompleks, transaction untuk operasi atomik, dan raw query untuk kasus-kasus yang tidak bisa diekspresikan dengan Prisma Client biasa. Ini adalah bagian di mana Prisma benar-benar bersinar dibanding raw SQL.

---

# 📖 Bab 13 — Filtering & Operator Lengkap

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

# 📖 Bab 14 — Select & Include: Query Relasi

Salah satu kekuatan terbesar Prisma adalah kemudahan mengambil data dari relasi — tanpa perlu menulis JOIN manual. Di bab ini kita bahas semua teknik untuk query data relasi secara optimal.

---

## 🎯 14.1 `select` vs `include` — Perbedaan Fundamental

```typescript
// ─── SELECT — Pilih field SPESIFIK ────────────────────────────────────
// ✅ Lebih efisien — hanya ambil yang dibutuhkan
// ❌ Tidak bisa digabung dengan include di level yang sama

const produkRingkas = await prisma.produk.findMany({
  select: {
    id:    true,   // ← Hanya field-field ini yang diambil
    nama:  true,
    harga: true,
    slug:  true,
    // stok, deskripsi, aktif, createdAt dll TIDAK diambil
    // Query lebih ringan — cocok untuk listing
  }
})
// produkRingkas[0].id    → ✅ ada
// produkRingkas[0].nama  → ✅ ada
// produkRingkas[0].stok  → ❌ ERROR TypeScript — tidak di select!


// ─── INCLUDE — Ambil SEMUA field + tambahkan relasi ───────────────────
// ✅ Lebih mudah — tidak perlu sebut semua field
// ⚠️ Mengambil SEMUA field termasuk yang besar (deskripsi, content, dll)

const produkLengkap = await prisma.produk.findMany({
  include: {
    kategori: true,   // Semua field kategori
    tags:     true,   // Semua field setiap tag
    ulasan:   true,   // Semua field setiap ulasan — HATI-HATI jika banyak!
  }
})
// Mengambil: id, nama, slug, harga, stok, deskripsi, aktif, createdAt, updatedAt
// + semua data kategori, tags, ulasan


// ─── SOLUSI OPTIMAL: select dengan nested select ──────────────────────
// Ambil field tertentu DARI field relasi!

const produkOptimal = await prisma.produk.findMany({
  select: {
    id:    true,
    nama:  true,
    harga: true,
    // Relasi bisa di-include dalam select!
    kategori: {
      select: { nama: true, slug: true }  // Hanya nama dan slug kategori
      // Bukan semua field kategori
    },
    tags: {
      select: { nama: true, slug: true }  // Hanya nama dan slug tag
    },
    _count: {
      select: { ulasan: true }  // Hitung ulasan tanpa load semua datanya!
    }
  }
})

// produkOptimal[0].kategori.nama  → ✅ ada
// produkOptimal[0].kategori.id    → ❌ ERROR — tidak di-select!
// produkOptimal[0]._count.ulasan  → ✅ angka jumlah ulasan


// ─── Perbandingan SQL yang di-generate ───────────────────────────────
// SELECT *:
// SELECT produk.*, kategori.* FROM produk LEFT JOIN kategori ...
// → Ambil semua kolom, mahal!

// SELECT tertentu:
// SELECT p.id, p.nama, p.harga, k.nama, k.slug FROM produk p LEFT JOIN kategori k ...
// → Hanya kolom yang dibutuhkan, efisien!
```

---

## 🔍 14.2 Filtering pada Data Relasi

```typescript
// Prisma memungkinkan filter BERDASARKAN data di relasi

// ─── some — Setidaknya satu relasi memenuhi kondisi ───────────────────
// SQL: WHERE EXISTS (SELECT 1 FROM _ProdukToTag pt JOIN tag t ON pt.B = t.id
//                   WHERE pt.A = produk.id AND t.nama = 'gaming')

// Produk yang punya setidaknya satu tag 'gaming'
await prisma.produk.findMany({
  where: {
    tags: {
      some: { nama: 'gaming' }
    }
  }
})

// Produk dengan minimal 1 ulasan rating 5
await prisma.produk.findMany({
  where: {
    ulasan: {
      some: { rating: 5 }
    }
  }
})

// Pengguna yang punya minimal 1 pesanan dengan status SELESAI
await prisma.pengguna.findMany({
  where: {
    pesanan: {
      some: { status: 'SELESAI' }
    }
  }
})


// ─── every — Semua relasi harus memenuhi kondisi ──────────────────────
// Produk yang SEMUA ulasannya memiliki rating >= 4
await prisma.produk.findMany({
  where: {
    ulasan: {
      every: { rating: { gte: 4 } }
    }
  }
})

// Pesanan yang SEMUA itemnya adalah produk dari kategori 'Elektronik'
await prisma.pesanan.findMany({
  where: {
    items: {
      every: {
        produk: {
          kategori: { slug: 'elektronik' }
        }
      }
    }
  }
})


// ─── none — Tidak ada relasi yang memenuhi kondisi ────────────────────
// Produk yang tidak punya tag 'discontinued'
await prisma.produk.findMany({
  where: {
    tags: {
      none: { slug: 'discontinued' }
    }
  }
})

// Pengguna yang tidak punya pesanan yang dibatalkan
await prisma.pengguna.findMany({
  where: {
    pesanan: {
      none: { status: 'DIBATALKAN' }
    }
  }
})


// ─── is / isNot — Filter berdasarkan keberadaan relasi one-to-one ──────
// Pengguna yang SUDAH punya profil
await prisma.pengguna.findMany({
  where: { profil: { isNot: null } }
})

// Pengguna yang BELUM punya profil
await prisma.pengguna.findMany({
  where: { profil: { is: null } }
  // atau lebih singkat:
  // where: { profil: null }
})

// Filter berdasarkan isi relasi one-to-one:
// Pengguna yang profilnya berisi website
await prisma.pengguna.findMany({
  where: {
    profil: {
      is: {
        website: { not: null }
      }
    }
  }
})
```

---

## 🌲 14.3 Nested Include — Relasi Bertingkat

```typescript
// Prisma mendukung nested include yang sangat dalam
// HATI-HATI: semakin dalam, semakin banyak JOIN dan semakin lambat!

// ─── Dua level include ────────────────────────────────────────────────
const pesanan = await prisma.pesanan.findUnique({
  where:   { id: 1 },
  include: {
    pengguna: true,        // Level 1: data pengguna
    items: {               // Level 1: semua item pesanan
      include: {
        produk: true       // Level 2: data produk dari setiap item
      }
    }
  }
})

// Akses data nested:
pesanan?.pengguna.nama                 // "Budi Santoso"
pesanan?.items[0].produk.nama          // "Laptop ASUS ROG"
pesanan?.items[0].hargaSatuan          // Decimal


// ─── Tiga level include dengan select ────────────────────────────────
const pesananDetail = await prisma.pesanan.findUnique({
  where: { id: 1 },
  select: {
    id:          true,
    kodePesanan: true,
    status:      true,
    total:       true,
    createdAt:   true,

    // Level 1: pengguna (pilih field tertentu)
    pengguna: {
      select: {
        nama:  true,
        email: true,
        profil: {          // Level 2: profil pengguna
          select: { telepon: true }
        }
      }
    },

    // Level 1: items pesanan
    items: {
      select: {
        jumlah:      true,
        hargaSatuan: true,
        produk: {          // Level 2: produk
          select: {
            nama:  true,
            slug:  true,
            gambar: true,
            kategori: {    // Level 3: kategori produk
              select: { nama: true }
            }
          }
        }
      }
    }
  }
})

// Akses data:
pesananDetail?.pengguna.profil?.telepon      // "081234567890"
pesananDetail?.items[0].produk.kategori.nama // "Elektronik"


// ─── Include dengan filter dan sort pada relasi ────────────────────────
const produkDenganUlasanBagus = await prisma.produk.findMany({
  where:   { aktif: true },
  include: {
    ulasan: {
      where:   { rating: { gte: 4 } },      // Hanya ulasan rating 4-5
      orderBy: { createdAt: 'desc' },         // Ulasan terbaru dulu
      take:    5,                             // Maksimal 5 ulasan
      select: {
        rating:   true,
        komentar: true,
        createdAt: true,
        pengguna: { select: { nama: true } } // Nama reviewer
      }
    },
    _count: {
      select: { ulasan: true }  // Total ulasan (termasuk yang difilter)
    }
  }
})


// ─── Avoid Over-Fetching — Panduan Praktis ────────────────────────────
/*
❌ JANGAN lakukan ini untuk listing:
   include: { ulasan: true }
   → Jika produk punya 1000 ulasan, semua dimuat!

✅ Lakukan ini:
   include: {
     ulasan: { take: 3, orderBy: { createdAt: 'desc' } }
   }
   → Hanya 3 ulasan terbaru yang dimuat

✅ Atau gunakan _count jika hanya butuh jumlah:
   _count: { select: { ulasan: true } }
   → Hanya angka total, tidak ada data ulasan yang dimuat
*/
```

---

## ⚡ 14.4 `_count` — Hitung Relasi Tanpa Load Data

```typescript
// _count adalah fitur yang sangat berguna dan sering dilupakan
// Hitung jumlah relasi TANPA memuat semua datanya ke memory

// ─── _count dasar ─────────────────────────────────────────────────────
const produk = await prisma.produk.findMany({
  select: {
    id:    true,
    nama:  true,
    harga: true,
    _count: {
      select: {
        ulasan:    true,   // Berapa banyak ulasan
        tags:      true,   // Berapa banyak tag
      }
    }
  }
})

produk.forEach(p => {
  console.log(`${p.nama}: ${p._count.ulasan} ulasan, ${p._count.tags} tags`)
})


// ─── _count dengan filter ─────────────────────────────────────────────
const produkDenganCountFilter = await prisma.produk.findMany({
  select: {
    nama:  true,
    _count: {
      select: {
        ulasan: {
          where: { rating: { gte: 4 } }  // Hitung HANYA ulasan rating 4-5
        }
      }
    }
  }
})
// produk.nama + berapa ulasan positifnya


// ─── Urutkan berdasarkan jumlah relasi ────────────────────────────────
// Produk dengan ulasan terbanyak
const produkPopuler = await prisma.produk.findMany({
  orderBy: {
    ulasan: { _count: 'desc' }  // Sort by jumlah ulasan
  },
  include: {
    _count: { select: { ulasan: true } }
  },
  take: 10,
})

// Penulis dengan artikel terbanyak
const penulisProduktif = await prisma.pengguna.findMany({
  where: { role: 'EDITOR' },
  orderBy: {
    pesanan: { _count: 'desc' }
  },
  select: {
    nama: true,
    _count: { select: { pesanan: true } }
  },
  take: 5,
})
```

---

## ✅ Checklist Bab 14

```
□ Memahami perbedaan select vs include dan kapan pakai masing-masing
□ Bisa pakai nested select untuk mengambil field tertentu dari relasi
□ Bisa filter berdasarkan relasi: some, every, none, is, isNot
□ Bisa melakukan nested include hingga 3 level
□ Menggunakan take dan where saat include untuk hindari over-fetching
□ Menggunakan _count untuk hitung relasi tanpa load datanya
□ Bisa sort berdasarkan jumlah relasi dengan _count
□ Selalu cek apakah butuh data relasi atau hanya jumlahnya (_count)
```

---

---

# 📖 Bab 15 — Transactions & Raw Query

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