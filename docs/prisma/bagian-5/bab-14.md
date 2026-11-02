---
title: "Bab 14 — Select & Include: Query Relasi"
---

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

---

🚀 Lanjut ke [🔒 Bab 15 — Transactions & Raw Query](/bagian-5/bab-15) untuk melanjutkan perjalanan!
