---
title: "Bab 16 — Prisma Middleware & Client Extension"
---

Di Bagian V kita sudah menyentuh Prisma Middleware secara singkat. Di bab ini kita bahas secara mendalam — termasuk perbedaannya dengan Prisma Client Extension yang lebih modern dan powerful.

---

## 🔄 16.1 Middleware vs Extension — Pilih Yang Tepat

```
PRISMA MIDDLEWARE ($use):
─────────────────────────────────────────────────────────────────
✅ Ada sejak Prisma versi awal
✅ Bisa intercept SEMUA operasi (query, mutasi, dll)
✅ Cocok untuk: logging, soft delete global, audit log
❌ Tidak mengubah TypeScript types
❌ API yang agak verbose
❌ Deprecated di beberapa fitur baru — lebih baik pakai Extension

PRISMA CLIENT EXTENSION ($extends):
─────────────────────────────────────────────────────────────────
✅ Fitur baru (Prisma 4.7+) — cara yang direkomendasikan
✅ Mengubah TypeScript types secara nyata
✅ Bisa tambah method baru, computed field, dan custom result
✅ Lebih composable — bisa gabungkan banyak extension
✅ Lebih type-safe dari middleware
❌ Hanya tersedia di Prisma versi baru

→ REKOMENDASI: Pakai Extension untuk project baru,
               Middleware untuk project yang sudah pakai Prisma lama
```

---

## 🔌 16.2 Prisma Middleware — Penggunaan Mendalam

```typescript
// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client'

function buatPrismaClient() {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn'  },
    ],
  })

  // ─── MIDDLEWARE 1: Performance Logger ─────────────────────────────
  // Log semua query beserta durasinya
  client.$use(async (params, next) => {
    const sebelum = Date.now()
    const result  = await next(params)
    const durasi  = Date.now() - sebelum

    // Kategorikan kecepatan query
    const status =
      durasi < 100  ? '⚡ FAST  ' :
      durasi < 500  ? '🟡 MEDIUM' :
      durasi < 2000 ? '🟠 SLOW  ' :
                      '🔴 VERY SLOW'

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${status} | ${durasi}ms | ${params.model}.${params.action}`
      )
    }

    // Alert jika query sangat lambat
    if (durasi > 2000) {
      console.error(
        `🚨 VERY SLOW QUERY DETECTED!\n` +
        `   Model : ${params.model}\n` +
        `   Action: ${params.action}\n` +
        `   Args  : ${JSON.stringify(params.args, null, 2)}\n` +
        `   Durasi: ${durasi}ms`
      )
      // Kirim alert ke monitoring service jika perlu
      // await sendAlert('slow_query', { model: params.model, durasi })
    }

    return result
  })


  // ─── MIDDLEWARE 2: Soft Delete Global ─────────────────────────────
  // Model yang mendukung soft delete
  const SOFT_DELETE_MODELS = ['Produk', 'Pengguna', 'Pesanan'] as const
  type SoftDeleteModel = typeof SOFT_DELETE_MODELS[number]

  client.$use(async (params, next) => {
    const model = params.model as SoftDeleteModel | undefined

    if (model && SOFT_DELETE_MODELS.includes(model)) {

      // ① findMany, findFirst → otomatis exclude soft-deleted
      if (['findMany', 'findFirst', 'findFirstOrThrow'].includes(params.action)) {
        // Inisialisasi where jika belum ada
        if (!params.args) params.args = {}
        if (!params.args.where) params.args.where = {}

        // Hanya tambahkan filter jika belum ada filter deletedAt
        // Ini memungkinkan query EKSPLISIT untuk melihat deleted records
        if (!('deletedAt' in params.args.where)) {
          params.args.where.deletedAt = null
        }
      }

      // ② findUnique, findUniqueOrThrow → tidak intercept
      // (karena biasanya pakai ID yang sudah spesifik)

      // ③ delete → ubah jadi soft delete
      if (params.action === 'delete') {
        params.action    = 'update'
        params.args.data = { deletedAt: new Date() }
      }

      // ④ deleteMany → ubah jadi updateMany (soft delete batch)
      if (params.action === 'deleteMany') {
        params.action = 'updateMany'
        params.args   = {
          ...params.args,
          data: { deletedAt: new Date() }
        }
      }
    }

    return next(params)
  })


  // ─── MIDDLEWARE 3: Audit Log ───────────────────────────────────────
  // Catat setiap perubahan data ke tabel audit
  const AUDIT_MODELS = ['Produk', 'Pengguna', 'Pesanan']
  const AUDIT_ACTIONS = ['create', 'update', 'updateMany', 'delete', 'deleteMany']

  client.$use(async (params, next) => {
    const result = await next(params)

    // Catat setelah operasi berhasil
    if (
      AUDIT_MODELS.includes(params.model ?? '') &&
      AUDIT_ACTIONS.includes(params.action)     &&
      params.model !== 'AuditLog'               // Hindari infinite loop!
    ) {
      // Fire and forget — jangan blokir response utama
      client.auditLog.create({
        data: {
          model:     params.model ?? 'unknown',
          aksi:      params.action,
          dataBaru:  JSON.stringify(params.args?.data ?? {}),
          dataBefore: JSON.stringify(params.args?.where ?? {}),
          waktu:     new Date(),
          // userId bisa diambil dari context/session jika tersedia
        }
      }).catch(err => {
        // Jangan crash aplikasi jika audit gagal
        console.error('Audit log gagal:', err)
      })
    }

    return result
  })

  return client
}

// Singleton pattern
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? buatPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## 🔧 16.3 Prisma Client Extension — Cara Modern

Extension adalah cara yang direkomendasikan untuk extend Prisma Client. Ada empat jenis extension:

```
JENIS EXTENSION:
─────────────────────────────────────────────────────────────────
① model   → Tambah method/query baru ke model tertentu
            Contoh: prisma.produk.cariAktif(), prisma.pengguna.softDelete()

② result  → Tambah computed field ke setiap result
            Contoh: produk.hargaFormat, produk.isAvailable, pengguna.namaInisial

③ client  → Tambah method ke PrismaClient itu sendiri
            Contoh: prisma.clearCache(), prisma.healthCheck()

④ query   → Intercept query (seperti middleware tapi lebih type-safe)
            Contoh: auto-filter soft delete, inject timestamp
```

```typescript
// src/lib/prisma-extended.ts
// Prisma Client dengan semua extension yang berguna

import { PrismaClient, Prisma } from '@prisma/client'
import { prisma }               from './prisma'

export const db = prisma.$extends({

  // ═══════════════════════════════════════════════════════════════════
  // ① MODEL EXTENSION — Method baru untuk setiap model
  // ═══════════════════════════════════════════════════════════════════
  model: {

    // ─── Extension untuk model Produk ────────────────────────────────
    produk: {

      // Ambil semua produk yang aktif dan tidak soft-deleted
      async cariAktif(opsi?: {
        take?:       number
        kategoriId?: number
        tagSlug?:    string
        keyword?:    string
      }) {
        return prisma.produk.findMany({
          where: {
            aktif:     true,
            deletedAt: null,
            ...(opsi?.kategoriId && { kategoriId: opsi.kategoriId }),
            ...(opsi?.tagSlug    && { tags: { some: { slug: opsi.tagSlug } } }),
            ...(opsi?.keyword    && {
              OR: [
                { nama:      { contains: opsi.keyword, mode: 'insensitive' } },
                { deskripsi: { contains: opsi.keyword, mode: 'insensitive' } },
              ]
            }),
          },
          orderBy: { createdAt: 'desc' },
          take:    opsi?.take ?? 12,
          include: { kategori: true, tags: true },
        })
      },

      // Soft delete satu produk
      async softDelete(id: number) {
        return prisma.produk.update({
          where: { id },
          data:  { deletedAt: new Date() }
        })
      },

      // Pulihkan produk dari soft delete
      async pulihkan(id: number) {
        return prisma.produk.update({
          where: { id },
          data:  { deletedAt: null }
        })
      },

      // Ambil produk yang sudah di-soft delete (isi "trash")
      async cariTrash() {
        return prisma.produk.findMany({
          where:   { deletedAt: { not: null } },
          orderBy: { deletedAt: 'desc' },
        })
      },

      // Tambah views secara atomic
      async tambahView(id: number) {
        return prisma.produk.update({
          where: { id },
          data:  { views: { increment: 1 } },
          select: { id: true, views: true }
        })
      },

      // Cari produk terlaris berdasarkan jumlah item pesanan
      async terlaris(take = 5) {
        return prisma.produk.findMany({
          where:   { aktif: true, deletedAt: null },
          orderBy: { itemPesanan: { _count: 'desc' } },
          take,
          include: {
            kategori: true,
            _count: { select: { itemPesanan: true, ulasan: true } }
          }
        })
      },
    },


    // ─── Extension untuk model Pengguna ──────────────────────────────
    pengguna: {

      // Cari pengguna by email (case-insensitive)
      async cariByEmail(email: string) {
        return prisma.pengguna.findFirst({
          where: {
            email:    { equals: email, mode: 'insensitive' },
            deletedAt: null,
          },
          include: { profil: true }
        })
      },

      // Soft delete pengguna
      async nonaktifkan(id: number) {
        return prisma.pengguna.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            // Revoke semua session
            sessions: { deleteMany: {} }
          }
        })
      },

      // Update profil sekaligus (upsert profil)
      async updateDenganProfil(
        id:     number,
        data:   Prisma.PenggunaUpdateInput,
        profil: { bio?: string; foto?: string; telepon?: string; website?: string }
      ) {
        return prisma.pengguna.update({
          where: { id },
          data: {
            ...data,
            profil: {
              upsert: {
                update: profil,
                create: profil,
              }
            }
          },
          include: { profil: true }
        })
      },
    },


    // ─── Extension untuk model Pesanan ───────────────────────────────
    pesanan: {

      // Ambil riwayat pesanan pengguna dengan pagination
      async riwayatPengguna(penggunaId: number, halaman = 1, perHalaman = 10) {
        const [pesanan, total] = await Promise.all([
          prisma.pesanan.findMany({
            where:   { penggunaId },
            orderBy: { createdAt: 'desc' },
            skip:    (halaman - 1) * perHalaman,
            take:    perHalaman,
            include: {
              items: {
                include: {
                  produk: { select: { nama: true, gambar: true, slug: true } }
                }
              }
            }
          }),
          prisma.pesanan.count({ where: { penggunaId } })
        ])

        return {
          data: pesanan,
          meta: {
            halaman,
            perHalaman,
            total,
            totalHalaman: Math.ceil(total / perHalaman),
          }
        }
      },

      // Batalkan pesanan yang sudah terlalu lama tidak dibayar
      async batalkanYangExpired(jamTimeout = 24) {
        const batasWaktu = new Date(
          Date.now() - jamTimeout * 60 * 60 * 1000
        )

        return prisma.pesanan.updateMany({
          where: {
            status:    'MENUNGGU_PEMBAYARAN',
            createdAt: { lt: batasWaktu }
          },
          data: { status: 'DIBATALKAN' }
        })
      },
    },
  },


  // ═══════════════════════════════════════════════════════════════════
  // ② RESULT EXTENSION — Computed fields di setiap result
  // ═══════════════════════════════════════════════════════════════════
  result: {

    // ─── Computed fields untuk Produk ────────────────────────────────
    produk: {

      // Format harga menjadi string Rupiah
      hargaFormat: {
        needs:   { harga: true },  // Field yang diperlukan untuk compute
        compute: (produk) => {
          return `Rp ${Number(produk.harga).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`
        }
        // Hasil: "Rp 15.000.000"
      },

      // Cek apakah produk tersedia (aktif dan stok > 0)
      tersedia: {
        needs:   { aktif: true, stok: true, deletedAt: true },
        compute: (produk) => {
          return produk.aktif && produk.stok > 0 && produk.deletedAt === null
        }
        // Hasil: true / false
      },

      // Status stok dalam bentuk teks
      statusStok: {
        needs:   { stok: true },
        compute: (produk) => {
          if (produk.stok === 0)   return 'Habis'
          if (produk.stok <= 5)    return 'Hampir habis'
          if (produk.stok <= 20)   return 'Stok terbatas'
          return 'Tersedia'
        }
        // Hasil: "Tersedia" | "Stok terbatas" | "Hampir habis" | "Habis"
      },
    },


    // ─── Computed fields untuk Pengguna ──────────────────────────────
    pengguna: {

      // Inisial nama untuk avatar
      inisialNama: {
        needs:   { nama: true },
        compute: (pengguna) => {
          return pengguna.nama
            .split(' ')
            .slice(0, 2)              // Maksimal 2 kata
            .map(kata => kata[0])     // Ambil huruf pertama
            .join('')
            .toUpperCase()
        }
        // "Budi Santoso" → "BS"
        // "Ahmad"        → "A"
      },

      // Tampilkan role dalam bahasa Indonesia
      roleLabel: {
        needs:   { role: true },
        compute: (pengguna) => {
          const labels: Record<string, string> = {
            ADMIN:   '👑 Administrator',
            MANAJER: '📊 Manajer',
            EDITOR:  '✏️ Editor',
            PEMBELI: '🛍️ Pembeli',
          }
          return labels[pengguna.role] ?? pengguna.role
        }
      },
    },


    // ─── Computed fields untuk Pesanan ───────────────────────────────
    pesanan: {

      // Status dalam bahasa Indonesia dengan emoji
      statusLabel: {
        needs:   { status: true },
        compute: (pesanan) => {
          const labels: Record<string, string> = {
            MENUNGGU_PEMBAYARAN: '⏳ Menunggu Pembayaran',
            DIBAYAR:             '✅ Sudah Dibayar',
            DIPROSES:            '⚙️ Sedang Diproses',
            DIKIRIM:             '🚚 Dalam Pengiriman',
            SELESAI:             '🎉 Selesai',
            DIBATALKAN:          '❌ Dibatalkan',
          }
          return labels[pesanan.status] ?? pesanan.status
        }
      },

      // Format total dalam Rupiah
      totalFormat: {
        needs:   { total: true },
        compute: (pesanan) => {
          return `Rp ${Number(pesanan.total).toLocaleString('id-ID')}`
        }
      },
    },
  },


  // ═══════════════════════════════════════════════════════════════════
  // ③ CLIENT EXTENSION — Method baru di level PrismaClient
  // ═══════════════════════════════════════════════════════════════════
  client: {

    // Health check — cek apakah database bisa diakses
    async healthCheck() {
      try {
        await prisma.$queryRaw`SELECT 1`
        return { sehat: true, waktu: new Date() }
      } catch (error) {
        return { sehat: false, error: String(error), waktu: new Date() }
      }
    },

    // Statistik database — jumlah record di setiap tabel
    async statistikDatabase() {
      const [
        totalProduk,
        totalPengguna,
        totalPesanan,
        totalKategori,
      ] = await Promise.all([
        prisma.produk.count(),
        prisma.pengguna.count(),
        prisma.pesanan.count(),
        prisma.kategori.count(),
      ])

      return { totalProduk, totalPengguna, totalPesanan, totalKategori }
    },
  },
})

// Export db sebagai versi extended dari prisma
export type DbType = typeof db
```

```typescript
// Penggunaan Extension yang sudah dibuat:
import { db } from './lib/prisma-extended'

// ① Method model baru
const produkAktif = await db.produk.cariAktif({ keyword: 'laptop', take: 5 })
const terlaris    = await db.produk.terlaris(10)
await db.produk.tambahView(1)
await db.produk.softDelete(5)

const riwayat = await db.pesanan.riwayatPengguna(1, 1, 10)
const expired = await db.pesanan.batalkanYangExpired(24)

// ② Computed fields — OTOMATIS ada di setiap result!
const produk = await db.produk.findMany({ take: 5 })
produk.forEach(p => {
  console.log(p.nama)          // "Laptop ASUS ROG"
  console.log(p.hargaFormat)   // "Rp 25.000.000" ← computed!
  console.log(p.tersedia)      // true             ← computed!
  console.log(p.statusStok)    // "Tersedia"       ← computed!
})

const pengguna = await db.pengguna.findMany()
pengguna.forEach(p => {
  console.log(p.nama)          // "Budi Santoso"
  console.log(p.inisialNama)   // "BS"  ← computed!
  console.log(p.roleLabel)     // "🛍️ Pembeli" ← computed!
})

// ③ Client method
const health = await db.healthCheck()
console.log(health.sehat ? '✅ Database OK' : '❌ Database bermasalah')

const stats = await db.statistikDatabase()
console.log(`Total: ${stats.totalProduk} produk, ${stats.totalPengguna} pengguna`)
```

---

## 🔗 16.4 Composing Multiple Extensions

```typescript
// Extension bisa digabungkan (compose) dengan mudah

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Extension terpisah per concern
const withSoftDelete = prisma.$extends({
  query: {
    produk: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
    }
  }
})

const withTimestamps = withSoftDelete.$extends({
  result: {
    produk: {
      dibuatSejak: {
        needs:   { createdAt: true },
        compute: (p) => {
          const hari = Math.floor((Date.now() - p.createdAt.getTime()) / 86400000)
          return hari === 0 ? 'Hari ini' : `${hari} hari lalu`
        }
      }
    }
  }
})

const withMethods = withTimestamps.$extends({
  model: {
    produk: {
      async terlaris(take = 5) {
        return withTimestamps.produk.findMany({
          orderBy: { views: 'desc' }, take
        })
      }
    }
  }
})

// Satu client dengan semua extension tergabung
export const db = withMethods
```

---

## ✅ Checklist Bab 16

```
□ Memahami perbedaan Middleware ($use) vs Extension ($extends)
□ Bisa membuat middleware untuk logging performa query
□ Bisa membuat middleware untuk soft delete global
□ Bisa membuat Extension model dengan method baru yang reusable
□ Bisa membuat Extension result untuk computed fields
□ Bisa membuat Extension client untuk utility methods
□ Paham cara compose beberapa extension menjadi satu
□ Selalu hindari infinite loop di middleware/extension (cek model !== 'AuditLog')
```

---

---

---

🚀 Lanjut ke [🛡️ Bab 17 — Validasi dengan Zod + Prisma](/bagian-6/bab-17) untuk melanjutkan perjalanan!
