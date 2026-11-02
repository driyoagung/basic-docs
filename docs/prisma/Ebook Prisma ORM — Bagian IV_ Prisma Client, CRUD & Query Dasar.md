# 🟠 Ebook Prisma ORM — Bagian IV: Prisma Client, CRUD & Query Dasar

> 🎯 **Tujuan Bagian IV:** Menguasai semua operasi CRUD dengan Prisma Client secara menyeluruh — dari membuat satu record hingga operasi batch, dari query sederhana hingga query dengan relasi bertingkat. Di setiap bagian kita selalu bandingkan dengan raw SQL agar transisi terasa natural.

---

# 📖 Bab 9 — CREATE: Membuat Data

Operasi CREATE adalah yang paling sering dilakukan setelah READ. Di Prisma, ada beberapa cara membuat data tergantung kebutuhanmu — satu record, banyak sekaligus, atau dengan relasi yang kompleks.

---

## 🔄 9.1 Perbandingan Raw SQL vs Prisma — CREATE

```typescript
// ❌ RAW SQL — cara lama
const [result] = await pool.query(
  `INSERT INTO produk (nama, slug, harga, stok, kategori_id, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
  ['Laptop ASUS', 'laptop-asus', 15000000, 5, 1]
)
const produkId = (result as any).insertId
// Tidak tahu tipe data yang dikembalikan
// Harus ingat urutan parameter dengan benar
// Tidak ada validasi field yang boleh diisi

// ✅ PRISMA — cara baru
const produk = await prisma.produk.create({
  data: {
    nama:       'Laptop ASUS',
    slug:       'laptop-asus',
    harga:      15000000,
    stok:       5,
    kategoriId: 1,
    // createdAt dan updatedAt diisi otomatis!
  }
})
// produk.id    → TypeScript tahu ini adalah number
// produk.nama  → TypeScript tahu ini adalah string
// produk.harga → TypeScript tahu ini adalah Decimal
// Tidak perlu ingat urutan — pakai named fields
```

---

## ✏️ 9.2 `create()` — Membuat Satu Record

```typescript
import { prisma } from './lib/prisma'

// ─── Buat record paling dasar ─────────────────────────────────────────
const kategori = await prisma.kategori.create({
  data: {
    nama:      'Elektronik',
    slug:      'elektronik',
    deskripsi: 'Produk elektronik dan gadget terkini',
    // createdAt tidak perlu diisi — @default(now()) mengisinya otomatis
  }
})

console.log(kategori.id)        // number — auto-increment
console.log(kategori.nama)      // "Elektronik"
console.log(kategori.createdAt) // Date object — diisi otomatis
// Return: SELURUH record yang baru dibuat, bukan hanya ID


// ─── Buat dengan select — hanya kembalikan field tertentu ─────────────
// Berguna jika tidak butuh semua field di response
const kategoriBaru = await prisma.kategori.create({
  data: {
    nama: 'Fashion',
    slug: 'fashion',
  },
  select: {
    id:   true,  // Kembalikan id
    nama: true,  // Kembalikan nama
    slug: true,  // Kembalikan slug
    // createdAt, updatedAt, dll TIDAK dikembalikan → response lebih kecil
  }
})
// kategoriBaru.id   → tersedia ✅
// kategoriBaru.nama → tersedia ✅
// kategoriBaru.createdAt → ERROR TypeScript! Tidak ada di select ✅
// (ini yang membuat Prisma sangat kuat — TypeScript mencegah akses field yang tidak ada)


// ─── Buat dengan include — kembalikan semua field + relasi ────────────
const produkBaru = await prisma.produk.create({
  data: {
    nama:       'MacBook Air M3',
    slug:       'macbook-air-m3',
    harga:      22000000,
    stok:       8,
    deskripsi:  'Laptop Apple terbaru dengan chip M3',
    kategoriId: 1,
  },
  include: {
    kategori: true,    // Sertakan data kategori di response
    tags:     true,    // Sertakan data tags di response
  }
})

console.log(produkBaru.kategori.nama) // "Elektronik" — tanpa query tambahan!
console.log(produkBaru.tags.length)   // 0 — belum ada tag


// ─── Buat dengan connect — hubungkan ke record yang sudah ada ─────────
// Ada DUA cara menghubungkan ke relasi:

// Cara 1: Isi langsung FK field (lebih simpel)
const produk1 = await prisma.produk.create({
  data: {
    nama:       'iPhone 15 Pro',
    slug:       'iphone-15-pro',
    harga:      18000000,
    stok:       10,
    kategoriId: 1,   // ← Isi FK langsung
  }
})

// Cara 2: Pakai connect di nested object (lebih ekspresif, bisa pakai @unique field)
const produk2 = await prisma.produk.create({
  data: {
    nama:  'Samsung Galaxy S24',
    slug:  'samsung-galaxy-s24',
    harga: 14000000,
    stok:  12,
    kategori: {
      connect: { slug: 'elektronik' }  // Connect via slug (@unique) bukan ID
    }
  }
})
```

---

## 🌳 9.3 Nested Create — Buat Record dengan Relasinya Sekaligus

```typescript
// Buat parent beserta child-nya dalam satu query

// ─── One-to-One: Buat User + Profil sekaligus ────────────────────────
const userBaru = await prisma.pengguna.create({
  data: {
    email:    'budi@email.com',
    nama:     'Budi Santoso',
    password: 'hashed_password_123',
    role:     'PEMBELI',

    profil: {
      create: {                        // ← Buat Profil baru bersamaan
        bio:     'Programmer & coffee enthusiast',
        telepon: '081234567890',
        website: 'https://budi.dev',
      }
    }
  },
  include: { profil: true }            // Kembalikan profil di response
})

console.log(userBaru.nama)             // "Budi Santoso"
console.log(userBaru.profil?.bio)      // "Programmer & coffee enthusiast"
// Hanya 1 query ke database! Bukan 2 query terpisah


// ─── One-to-Many: Buat Kategori + banyak Produk sekaligus ────────────
const elektronik = await prisma.kategori.create({
  data: {
    nama: 'Elektronik',
    slug: 'elektronik',

    produk: {
      create: [                        // ← create menerima array!
        {
          nama:  'Laptop Dell XPS 15',
          slug:  'laptop-dell-xps-15',
          harga: 23000000,
          stok:  4,
        },
        {
          nama:  'Monitor LG 27UK850',
          slug:  'monitor-lg-27uk850',
          harga: 7500000,
          stok:  8,
        },
        {
          nama:  'Keyboard Logitech MX Keys',
          slug:  'keyboard-logitech-mx-keys',
          harga: 1600000,
          stok:  15,
        },
      ]
    }
  },
  include: {
    produk:  true,
    _count: { select: { produk: true } }  // Hitung jumlah produk
  }
})

console.log(`Dibuat: ${elektronik.produk.length} produk`)
console.log(`Total : ${elektronik._count.produk} produk di kategori ini`)


// ─── Many-to-Many: Buat Produk + Tag sekaligus ────────────────────────
const produkBaru = await prisma.produk.create({
  data: {
    nama:       'Headphone Sony WH-1000XM5',
    slug:       'headphone-sony-wh1000xm5',
    harga:      4800000,
    stok:       15,
    kategoriId: 1,

    tags: {
      // Hubungkan ke tag yang sudah ada
      connect: [
        { slug: 'premium'  },
        { slug: 'wireless' },
      ],

      // Buat tag baru dan langsung hubungkan
      create: [
        { nama: 'noise-cancelling', slug: 'noise-cancelling' }
      ],

      // Connect jika sudah ada, buat jika belum ada
      connectOrCreate: [
        {
          where:  { slug: 'audio' },
          create: { nama: 'audio', slug: 'audio' }
        }
      ]
    }
  },
  include: { tags: true }
})

console.log('Tags:', produkBaru.tags.map(t => t.nama).join(', '))
// "premium, wireless, noise-cancelling, audio"
```

---

## 📋 9.4 `createMany()` — Buat Banyak Record Sekaligus

```typescript
// Jauh lebih cepat dari loop create() satu per satu!
// SQL: INSERT INTO ... VALUES (...), (...), (...) — satu query

// ─── createMany dasar ─────────────────────────────────────────────────
const { count } = await prisma.tag.createMany({
  data: [
    { nama: 'gaming',      slug: 'gaming'      },
    { nama: 'best-seller', slug: 'best-seller' },
    { nama: 'new-arrival', slug: 'new-arrival' },
    { nama: 'sale',        slug: 'sale'        },
    { nama: 'premium',     slug: 'premium'     },
    { nama: 'wireless',    slug: 'wireless'    },
  ],
  skipDuplicates: true,  // ← Lewati jika slug sudah ada, tidak error
})
// createMany hanya return { count } — tidak return data yang dibuat!

console.log(`${count} tag berhasil dibuat`)


// ─── Perbandingan performa: loop vs createMany ────────────────────────
const data = Array.from({ length: 100 }, (_, i) => ({
  nama:  `Produk Test ${i + 1}`,
  slug:  `produk-test-${i + 1}`,
  harga: Math.floor(Math.random() * 1000000) + 50000,
  stok:  Math.floor(Math.random() * 50) + 1,
  kategoriId: 1,
}))

// ❌ LAMBAT — 100 query INSERT terpisah
for (const item of data) {
  await prisma.produk.create({ data: item })
}
// Total: ~100 round-trip ke database

// ✅ CEPAT — 1 query INSERT dengan 100 values
const hasil = await prisma.produk.createMany({ data })
// Total: 1 round-trip ke database, jauh lebih cepat!

console.log(`${hasil.count} produk dibuat`)


// ─── Keterbatasan createMany ──────────────────────────────────────────
// ⚠️ createMany TIDAK mendukung:

// ❌ include / select — tidak bisa return relasi atau field tertentu
await prisma.produk.createMany({
  data: [...],
  include: { kategori: true }  // ERROR! createMany tidak support include
})

// ❌ Nested create — tidak bisa buat relasi bersamaan
await prisma.produk.createMany({
  data: [{
    nama: 'Test',
    kategori: { create: { nama: 'Baru' } }  // ERROR! Nested tidak support
  }]
})

// ✅ Solusi jika butuh nested: gunakan loop dengan create() biasa
// atau gunakan $transaction untuk performa
```

---

## 🔄 9.5 `upsert()` — Buat Jika Belum Ada, Update Jika Sudah Ada

```typescript
// upsert adalah kombinasi INSERT + ON DUPLICATE KEY UPDATE
// Sangat berguna untuk operasi "sync" data

// ─── upsert dasar ─────────────────────────────────────────────────────
const kategori = await prisma.kategori.upsert({
  where: { slug: 'elektronik' },  // ← Kondisi cari (harus @unique atau @id)

  update: {                        // ← Jika DITEMUKAN → jalankan ini
    nama:      'Elektronik & Gadget',
    deskripsi: 'Update deskripsi kategori',
  },

  create: {                        // ← Jika TIDAK DITEMUKAN → jalankan ini
    nama:      'Elektronik',
    slug:      'elektronik',
    deskripsi: 'Produk elektronik terbaru',
  },
})
// Tidak perlu cek manual apakah data sudah ada atau belum!


// ─── upsert untuk sinkronisasi data dari API eksternal ────────────────
interface DataProdukAPI {
  sku:   string
  nama:  string
  harga: number
  stok:  number
}

async function sinkronProdukDariAPI(data: DataProdukAPI[]) {
  const results = []

  for (const item of data) {
    const produk = await prisma.produk.upsert({
      where: { slug: item.sku },  // Pakai SKU sebagai identifier unik

      update: {                   // Jika sudah ada → update harga & stok
        harga: item.harga,
        stok:  item.stok,
        nama:  item.nama,
      },

      create: {                   // Jika belum ada → buat baru
        nama:       item.nama,
        slug:       item.sku,
        harga:      item.harga,
        stok:       item.stok,
        kategoriId: 1,
      },
    })
    results.push(produk)
  }

  return results
}


// ─── upsert untuk seeder yang idempotent ──────────────────────────────
// Ini yang membuat seeder bisa dijalankan berkali-kali tanpa error!
const admin = await prisma.pengguna.upsert({
  where:  { email: 'admin@toko.id' },
  update: {},            // ← Object kosong = tidak update apapun jika sudah ada
  create: {
    email:    'admin@toko.id',
    nama:     'Super Admin',
    password: await bcrypt.hash('Admin@123', 12),
    role:     'ADMIN',
  }
})
// Pertama kali: buat admin
// Kali berikutnya: temukan admin yang sama, tidak update apapun
```

---

## ✅ Checklist Bab 9

```
□ Memahami perbedaan create() vs createMany() vs upsert()
□ Bisa menggunakan nested create untuk buat parent + child sekaligus
□ Tahu perbedaan include vs select pada create()
□ Tahu cara connect ke relasi yang sudah ada (via id atau @unique field)
□ Paham keterbatasan createMany() (tidak support include & nested)
□ Bisa menggunakan upsert() untuk operasi "buat atau update"
□ Seeder sudah menggunakan upsert agar idempotent
```

---

---

# 📖 Bab 10 — READ: Mengambil Data

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

# 📖 Bab 11 — UPDATE: Mengubah Data

Operasi UPDATE di Prisma sangat powerful — ada atomic operations untuk menghindari race condition, dan berbagai cara untuk update relasi yang kompleks.

---

## 🔄 11.1 Perbandingan Raw SQL vs Prisma — UPDATE

```typescript
// ❌ RAW SQL
await pool.query(
  `UPDATE produk SET nama = ?, harga = ?, updated_at = NOW() WHERE id = ?`,
  ['Nama Baru', 15000000, produkId]
)
// Tidak ada return value yang berguna
// Tidak ada type checking untuk nilai yang di-update
// Harus update updated_at manual

// ✅ PRISMA
const produkDiupdate = await prisma.produk.update({
  where: { id: produkId },
  data:  { nama: 'Nama Baru', harga: 15000000 }
  // updatedAt diupdate OTOMATIS karena @updatedAt di schema!
})
// produkDiupdate adalah record yang sudah diupdate — type-safe!
```

---

## ✏️ 11.2 `update()` — Update Satu Record

```typescript
// update() hanya bisa pakai where dengan @id atau @unique field
// Jika record tidak ditemukan: throw PrismaClientKnownRequestError (P2025)

// ─── Update dasar ─────────────────────────────────────────────────────
const produkDiupdate = await prisma.produk.update({
  where: { id: 1 },    // Cari berdasarkan ID
  data: {
    nama:      'Laptop ASUS ROG Zephyrus G14 2024',
    harga:     27500000,
    deskripsi: 'Update deskripsi produk',
    // updatedAt diisi OTOMATIS — tidak perlu tulis manual
  }
})


// ─── Update dengan where @unique ──────────────────────────────────────
const produkBySlug = await prisma.produk.update({
  where: { slug: 'laptop-asus-rog' },   // Pakai slug (@unique)
  data:  { stok: 0, aktif: false },
})


// ─── Update dengan select/include ─────────────────────────────────────
const updated = await prisma.produk.update({
  where:  { id: 1 },
  data:   { harga: 25000000 },
  select: { id: true, nama: true, harga: true }  // Kembalikan field tertentu
  // atau:
  // include: { kategori: true }
})


// ─── Handle jika record tidak ditemukan ───────────────────────────────
import { Prisma } from '@prisma/client'

try {
  await prisma.produk.update({
    where: { id: 9999 },  // ID tidak ada
    data:  { nama: 'Test' }
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      console.log('Produk tidak ditemukan!')
      // Tangani seperti ini di API: return 404
    }
  }
}
```

---

## ⚡ 11.3 Atomic Operations — Update Angka dengan Aman

```typescript
// ⚠️ MASALAH RACE CONDITION dengan cara biasa:
// Bayangkan 2 user beli produk yang sama BERSAMAAN:

// User A baca stok: 5
// User B baca stok: 5
// User A hitung: 5 - 1 = 4, update stok = 4
// User B hitung: 5 - 1 = 4, update stok = 4
// Hasil: stok = 4 padahal harusnya 3! → Stok tidak akurat!

// ❌ CARA YANG SALAH — Rawan race condition
const produk  = await prisma.produk.findUnique({ where: { id: 1 } })
const stokBaru = Number(produk!.stok) - 1  // Baca lalu hitung
await prisma.produk.update({
  where: { id: 1 },
  data:  { stok: stokBaru }  // Tulis kembali → race condition!
})

// ✅ CARA YANG BENAR — Atomic operations
// Database yang melakukan operasi matematika secara atomic
await prisma.produk.update({
  where: { id: 1 },
  data:  { stok: { decrement: 1 } }  // stok = stok - 1 (atomic!)
  // SQL: UPDATE produk SET stok = stok - 1 WHERE id = 1
  // Tidak ada window untuk race condition!
})


// ─── Semua atomic operations yang tersedia ───────────────────────────
await prisma.produk.update({
  where: { id: 1 },
  data: {
    stok:   { increment: 10 },    // stok = stok + 10
    views:  { increment: 1 },     // views = views + 1
    harga:  { decrement: 50000 }, // harga = harga - 50000 (diskon)
    berat:  { multiply: 1.1 },    // berat = berat * 1.1
    diskon: { divide: 2 },        // diskon = diskon / 2
    stokMin: { set: 5 },          // stokMin = 5 (sama dengan assignment biasa)
  }
})


// ─── Studi kasus: Proses pembelian yang aman ─────────────────────────
async function prosesPembelian(produkId: number, jumlah: number, penggunaId: number) {
  return prisma.$transaction(async (tx) => {
    // Cek stok dengan lock (FOR UPDATE di belakang layar)
    const produk = await tx.produk.findUnique({
      where:  { id: produkId },
      select: { stok: true, harga: true, aktif: true }
    })

    if (!produk || !produk.aktif) throw new Error('Produk tidak tersedia')
    if (produk.stok < jumlah)     throw new Error(`Stok hanya tersisa ${produk.stok}`)

    // Kurangi stok secara atomic
    await tx.produk.update({
      where: { id: produkId },
      data:  { stok: { decrement: jumlah } }  // ← Atomic!
    })

    // Buat pesanan
    const pesanan = await tx.pesanan.create({
      data: {
        penggunaId,
        total:       Number(produk.harga) * jumlah,
        alamatKirim: { /* ... */ },
        items: {
          create: [{
            produkId,
            jumlah,
            hargaSatuan: produk.harga,
          }]
        }
      }
    })

    return pesanan
  })
}
```

---

## 📋 11.4 `updateMany()` — Update Banyak Record Sekaligus

```typescript
// Update semua record yang memenuhi kondisi WHERE
// Return: { count: number } — jumlah record yang diupdate
// ⚠️ Tidak return data yang diupdate!

// ─── Nonaktifkan produk yang stoknya habis ────────────────────────────
const { count } = await prisma.produk.updateMany({
  where: { stok: 0, aktif: true },
  data:  { aktif: false }
})
console.log(`${count} produk dinonaktifkan karena stok habis`)


// ─── Update harga semua produk di kategori tertentu ───────────────────
// Misalnya: diskon semua produk elektronik 10%
const diskonElektronik = await prisma.produk.updateMany({
  where: { kategoriId: 1, aktif: true },
  data: {
    harga: { multiply: 0.9 }  // Kalikan 0.9 = diskon 10%
  }
})
console.log(`${diskonElektronik.count} produk elektronik mendapat diskon`)


// ─── Tandai pesanan expired ────────────────────────────────────────────
const batasWaktu = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 jam lalu
const expired = await prisma.pesanan.updateMany({
  where: {
    status:    'MENUNGGU_PEMBAYARAN',
    createdAt: { lte: batasWaktu }   // Dibuat lebih dari 24 jam lalu
  },
  data: { status: 'DIBATALKAN' }
})
console.log(`${expired.count} pesanan dibatalkan karena expired`)


// ─── Keterbatasan updateMany ──────────────────────────────────────────
// ⚠️ updateMany TIDAK mendukung:
// - include / select (tidak bisa return relasi)
// - Nested update (tidak bisa update relasi bersamaan)
// - Return data yang diupdate (hanya return { count })
```

---

## 🔀 11.5 Update dengan Relasi

```typescript
// Update relasi sekaligus saat update record

// ─── Update kategori produk ────────────────────────────────────────────
const pindahKategori = await prisma.produk.update({
  where: { id: 1 },
  data: {
    kategori: {
      connect: { slug: 'fashion' }  // Pindah ke kategori fashion
    }
  }
})


// ─── Update tags — operasi yang tersedia ──────────────────────────────
await prisma.produk.update({
  where: { id: 1 },
  data: {
    tags: {
      // connect — tambahkan tag yang sudah ada
      connect: [{ slug: 'sale' }, { slug: 'promo' }],

      // disconnect — hapus tag tertentu (produk dan tag tetap ada)
      disconnect: [{ slug: 'new-arrival' }],

      // set — GANTI SEMUA tag dengan array baru
      // Hati-hati! Ini menghapus semua relasi tag lama
      set: [{ slug: 'sale' }, { slug: 'promo' }],

      // create — buat tag baru dan hubungkan
      create: [{ nama: 'clearance', slug: 'clearance' }],

      // connectOrCreate — connect jika ada, buat jika belum
      connectOrCreate: [{
        where:  { slug: 'limited' },
        create: { nama: 'limited', slug: 'limited' }
      }],

      // updateMany — update tag yang terhubung berdasarkan kondisi
      updateMany: {
        where: { nama: { startsWith: 'old-' } },
        data:  { nama: 'archived' }
      },

      // deleteMany — hapus relasi tag berdasarkan kondisi
      // (bukan hapus tag-nya, hanya hubungannya)
      deleteMany: [{ slug: 'discontinued' }],
    }
  }
})


// ─── Update profil via pengguna ────────────────────────────────────────
await prisma.pengguna.update({
  where: { id: 1 },
  data: {
    nama: 'Nama Pengguna Baru',    // Update field pengguna
    profil: {
      update: {                     // Update profil sekaligus
        bio:     'Bio yang baru',
        website: 'https://website-baru.com',
      }
    }
  }
})


// ─── Upsert — update atau buat profil ─────────────────────────────────
await prisma.pengguna.update({
  where: { id: 1 },
  data: {
    profil: {
      upsert: {
        update: { bio: 'Bio baru' },
        create: { bio: 'Bio pertama' }
        // Berguna jika profil mungkin belum ada!
      }
    }
  }
})
```

---

## ✅ Checklist Bab 11

```
□ Memahami perbedaan update() vs updateMany()
□ Tahu cara handle error P2025 (record not found saat update)
□ SELALU gunakan atomic operations untuk update angka (increment/decrement)
□ Tidak pakai "baca → hitung → tulis" untuk counter (rawan race condition)
□ Bisa menggunakan operasi relasi di dalam update (connect, disconnect, set)
□ Tahu kapan pakai connect vs set untuk Many-to-Many
□ Paham keterbatasan updateMany (tidak return data, tidak support nested)
```

---

---

# 📖 Bab 12 — DELETE: Menghapus Data

Operasi DELETE adalah yang paling "berbahaya" karena data bisa hilang permanen. Di bab ini kita bahas cara hapus data yang aman — termasuk soft delete sebagai alternatif yang lebih bijak.

---

## 🔄 12.1 Perbandingan Raw SQL vs Prisma — DELETE

```typescript
// ❌ RAW SQL
await pool.query('DELETE FROM produk WHERE id = ?', [produkId])
// Tidak ada konfirmasi apakah record memang ada
// Tidak ada return value yang berguna
// Tidak ada type checking

// ✅ PRISMA
const produkDihapus = await prisma.produk.delete({
  where: { id: produkId }
})
// Return record yang baru dihapus — bisa dipakai untuk logging!
// Throw error jika record tidak ada (P2025)
// Throw error jika ada constraint (P2003) — relasi masih ada
```

---

## 🗑️ 12.2 `delete()` — Hapus Satu Record

```typescript
// delete() HANYA bisa pakai where dengan @id atau @unique field
// Jika record tidak ditemukan: throw P2025
// Jika ada relasi yang mencegah penghapusan (Restrict): throw P2003

// ─── Delete dasar ─────────────────────────────────────────────────────
const produkDihapus = await prisma.produk.delete({
  where: { id: 1 }
})
console.log(`Produk "${produkDihapus.nama}" berhasil dihapus`)
// produkDihapus masih berisi data produk yang baru dihapus


// ─── Delete dengan include — kembalikan relasi sebelum dihapus ────────
const pesananDihapus = await prisma.pesanan.delete({
  where:   { id: 1 },
  include: { items: true }  // Ambil items sebelum pesanan dihapus
})
console.log(`Pesanan berisi ${pesananDihapus.items.length} item dihapus`)


// ─── Handle error saat delete ─────────────────────────────────────────
import { Prisma } from '@prisma/client'

async function hapusProduk(id: number) {
  try {
    const produk = await prisma.produk.delete({ where: { id } })
    console.log(`✅ Produk "${produk.nama}" berhasil dihapus`)
    return { sukses: true, produk }

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          // Record tidak ditemukan
          return { sukses: false, pesan: 'Produk tidak ditemukan' }

        case 'P2003':
          // Foreign key constraint — ada relasi yang mencegah penghapusan
          // Ini terjadi karena onDelete: Restrict di relasi lain
          return {
            sukses: false,
            pesan: 'Produk tidak bisa dihapus karena masih terkait dengan pesanan yang ada'
          }
      }
    }
    throw error  // Error lain yang tidak dikenali
  }
}
```

---

## 📋 12.3 `deleteMany()` — Hapus Banyak Record

```typescript
// Hapus semua record yang memenuhi kondisi WHERE
// Return: { count: number }
// SANGAT BERHATI-HATI — tidak ada konfirmasi!

// ─── Delete dengan kondisi ─────────────────────────────────────────────
const { count } = await prisma.produk.deleteMany({
  where: {
    aktif:    false,
    deletedAt: { not: null }  // Sudah di-soft delete
  }
})
console.log(`${count} produk permanen dihapus dari database`)


// ─── Hapus item pesanan yang dibatalkan (cleanup) ─────────────────────
const itemDihapus = await prisma.itemPesanan.deleteMany({
  where: {
    pesanan: {
      status: 'DIBATALKAN'
    }
  }
})


// ─── ⚠️ Hapus semua data tabel (SANGAT BERBAHAYA!) ────────────────────
// Hanya untuk testing / reset database
await prisma.produk.deleteMany()       // Hapus SEMUA produk!
// Sama seperti: TRUNCATE TABLE produk (tapi via Prisma)


// ─── Hapus dengan urutan yang benar (jika ada relasi) ─────────────────
// Harus hapus child dulu sebelum parent!
async function bersihkanDatabase() {
  await prisma.itemPesanan.deleteMany()   // Child dari pesanan
  await prisma.pesanan.deleteMany()       // Child dari pengguna
  await prisma.ulasan.deleteMany()        // Child dari produk & pengguna
  await prisma.profil.deleteMany()        // Child dari pengguna
  await prisma.produk.deleteMany()        // Child dari kategori
  await prisma.tag.deleteMany()
  await prisma.kategori.deleteMany()
  await prisma.pengguna.deleteMany()
  console.log('Database berhasil dibersihkan')
}
```

---

## 🔒 12.4 Soft Delete — Hapus Logis

```typescript
// Soft delete = tandai sebagai dihapus TANPA benar-benar menghapus dari database
// Keuntungan:
// ✅ Data bisa dipulihkan jika terjadi kesalahan
// ✅ History tetap terjaga untuk audit trail
// ✅ Mencegah masalah relasi (FK masih valid)
// ✅ Bisa lihat "apa yang dihapus pengguna"

// ─── Schema untuk soft delete ─────────────────────────────────────────
// Di schema.prisma, tambahkan field deletedAt:
// model Produk {
//   ...field lainnya...
//   deletedAt DateTime?  // null = aktif, ada nilai = sudah "dihapus"
// }


// ─── Implementasi soft delete functions ───────────────────────────────
class ProdukService {

  // "Hapus" produk (soft delete)
  async hapus(id: number) {
    const produk = await prisma.produk.update({
      where: { id },
      data:  { deletedAt: new Date() }
      // updatedAt juga otomatis terupdate!
    })
    console.log(`Produk "${produk.nama}" dipindahkan ke trash`)
    return produk
  }

  // Pulihkan produk yang sudah di-soft delete
  async pulihkan(id: number) {
    const produk = await prisma.produk.update({
      where: { id },
      data:  { deletedAt: null }  // Set kembali ke null = aktif
    })
    console.log(`Produk "${produk.nama}" berhasil dipulihkan`)
    return produk
  }

  // Hapus permanen (hard delete)
  async hapusPermanent(id: number) {
    const produk = await prisma.produk.delete({ where: { id } })
    console.log(`Produk "${produk.nama}" dihapus permanen`)
    return produk
  }

  // Ambil produk yang AKTIF (exclude soft-deleted)
  async cariAktif(page = 1, perPage = 12) {
    return prisma.produk.findMany({
      where: {
        deletedAt: null,    // ← Hanya yang belum di-soft delete
        aktif:     true,
      },
      skip:    (page - 1) * perPage,
      take:    perPage,
      orderBy: { createdAt: 'desc' },
    })
  }

  // Ambil produk yang sudah di-soft delete (isi "trash")
  async cariTrash() {
    return prisma.produk.findMany({
      where:   { deletedAt: { not: null } },  // Yang sudah di-soft delete
      orderBy: { deletedAt: 'desc' },         // Terbaru dihapus pertama
    })
  }

  // Kosongkan trash — hard delete semua yang sudah di-soft delete
  async kosongkanTrash() {
    const { count } = await prisma.produk.deleteMany({
      where: { deletedAt: { not: null } }
    })
    console.log(`${count} produk dihapus permanen dari trash`)
    return count
  }
}


// ─── Soft delete otomatis dengan Prisma Middleware ────────────────────
// Agar tidak perlu tulis { deletedAt: null } di setiap query

const prismaWithSoftDelete = prisma.$extends({
  query: {
    produk: {
      // Intercept findMany dan otomatis filter soft-deleted records
      async findMany({ args, query }) {
        args.where = {
          ...args.where,
          deletedAt: null,    // Otomatis exclude yang sudah di-soft delete
        }
        return query(args)
      },

      // Intercept findFirst juga
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },

      // Intercept delete dan ubah jadi soft delete
      async delete({ args, query }) {
        return prisma.produk.update({
          where: args.where,
          data:  { deletedAt: new Date() }
        })
      }
    }
  }
})

// Sekarang semua query otomatis exclude soft-deleted records!
const produk = await prismaWithSoftDelete.produk.findMany()
// Tidak perlu tambah where: { deletedAt: null } secara manual
```

---

## 🔗 12.5 Cascade Delete — Penghapusan Berantai

```typescript
// Dengan onDelete: Cascade di schema, menghapus parent
// otomatis menghapus semua child-nya

// Di schema:
// model Pesanan {
//   items ItemPesanan[]
// }
// model ItemPesanan {
//   pesanan Pesanan @relation(..., onDelete: Cascade)
// }

// Menghapus Pesanan otomatis menghapus semua ItemPesanan-nya!
const pesananDihapus = await prisma.pesanan.delete({
  where: { id: 1 }
  // Prisma otomatis delete ItemPesanan yang berelasi
  // Karena onDelete: Cascade di relasi ItemPesanan → Pesanan
})
// Tidak perlu hapus ItemPesanan manual terlebih dahulu!


// ─── Bandingkan: Dengan vs Tanpa Cascade ──────────────────────────────

// TANPA Cascade (onDelete: Restrict) — Harus hapus child manual dulu
await prisma.itemPesanan.deleteMany({ where: { pesananId: 1 } })
await prisma.pesanan.delete({ where: { id: 1 } })

// DENGAN Cascade (onDelete: Cascade) — Satu perintah cukup
await prisma.pesanan.delete({ where: { id: 1 } })
// ItemPesanan terhapus otomatis!


// ─── Studi kasus: Hapus pengguna beserta semua datanya ────────────────
// Dengan Cascade di schema yang tepat, cukup satu perintah!

async function hapusPenggunaDenganSemuaData(penggunaId: number) {
  // Jika semua relasi pakai onDelete: Cascade:
  const pengguna = await prisma.pengguna.delete({
    where: { id: penggunaId }
  })
  // Otomatis terhapus:
  // - Semua Profil pengguna (Cascade)
  // - Semua Pesanan pengguna (Cascade)
  //   - Semua ItemPesanan (Cascade dari Pesanan)
  // - Semua Ulasan pengguna (Cascade)

  console.log(`Pengguna "${pengguna.nama}" dan semua datanya dihapus`)
  return pengguna
}
```

---

## ✅ Checklist Bab 12

```
□ Memahami perbedaan delete() vs deleteMany()
□ Bisa handle error P2025 (not found) dan P2003 (foreign key constraint)
□ Memahami konsep soft delete dan kapan menggunakannya vs hard delete
□ Bisa mengimplementasikan soft delete dengan field deletedAt
□ Tahu cara filter record yang aktif (deletedAt: null)
□ Memahami cara kerja Cascade delete
□ Tahu urutan penghapusan yang benar (child sebelum parent) untuk deleteMany
□ Bisa menggunakan Prisma Extension untuk soft delete otomatis
```

---

## 📊 Ringkasan Bagian IV

```
YANG SUDAH DIPELAJARI DI BAGIAN IV:

Bab 9 — CREATE
├── create() — buat satu record dengan select/include
├── Nested create — buat parent + child sekaligus (1-1, 1-M, M-M)
├── Connect vs create vs connectOrCreate untuk relasi
├── createMany() — batch insert yang sangat cepat + keterbatasannya
└── upsert() — buat atau update, cocok untuk seeder dan sinkronisasi data

Bab 10 — READ
├── findUnique() — cari by @id atau @unique, return null jika tidak ada
├── findUniqueOrThrow() — sama tapi throw error jika tidak ada
├── findFirst() — cari satu dengan kondisi bebas + orderBy
├── findMany() — ambil banyak dengan where, select, orderBy, pagination
├── count() — hitung jumlah record dengan kondisi
├── aggregate() — COUNT, SUM, AVG, MIN, MAX
└── groupBy() — agregasi per grup dengan having

Bab 11 — UPDATE
├── update() — update satu record, return record yang diupdate
├── Atomic operations — increment, decrement, multiply, divide (aman dari race condition)
├── updateMany() — update banyak, return { count }
└── Update relasi — connect, disconnect, set, create, upsert dalam nested update

Bab 12 — DELETE
├── delete() — hapus satu, return record yang dihapus
├── deleteMany() — hapus banyak, return { count }
├── Soft delete — hapus logis dengan deletedAt, bisa dipulihkan
├── Prisma Extension untuk soft delete otomatis
└── Cascade delete — hapus berantai via relasi
```

> 📌 **Selanjutnya — Bagian V:** Kamu sudah menguasai semua operasi CRUD dasar. Di Bagian V, kita naik level ke **Query Lanjutan & Relasi** — semua operator filtering Prisma, query relasi yang kompleks, transaction, dan raw query untuk kasus-kasus khusus.