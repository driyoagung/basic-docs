---
title: "Bab 11 — UPDATE: Mengubah Data"
---

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

---

🚀 Lanjut ke [🗑️ Bab 12 — DELETE — Menghapus Data](/bagian-4/bab-12) untuk melanjutkan perjalanan!
