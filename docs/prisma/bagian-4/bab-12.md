---
title: "Bab 12 — DELETE: Menghapus Data"
---

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

---

🚀 Lanjut ke [🎯 Bab 13 — Filtering & Operator Lengkap](/bagian-5/bab-13) untuk melanjutkan perjalanan!
