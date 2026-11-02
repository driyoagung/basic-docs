---
title: "Bab 9 — CREATE: Membuat Data"
---

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

---

🚀 Lanjut ke [🔍 Bab 10 — READ — Mengambil Data](/bagian-4/bab-10) untuk melanjutkan perjalanan!
