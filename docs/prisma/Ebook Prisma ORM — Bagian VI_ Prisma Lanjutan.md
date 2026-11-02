# 🟣 Ebook Prisma ORM — Bagian VI: Prisma Lanjutan

> 🎯 **Tujuan Bagian VI:** Menguasai fitur-fitur Prisma yang membuat kode lebih ekspresif, aman, dan mudah di-maintain — dari Prisma Client Extension yang modern, integrasi validasi dengan Zod, hingga error handling yang profesional dan siap production.

---

# 📖 Bab 16 — Prisma Middleware & Client Extension

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

# 📖 Bab 17 — Validasi dengan Zod + Prisma

Prisma memberikan type safety di level database dan ORM. Tapi bagaimana dengan input dari user? API request bisa berisi data apapun — string yang panjangnya salah, angka negatif, email yang tidak valid, atau field yang seharusnya tidak ada. Zod adalah solusinya.

---

## 🤔 17.1 Mengapa Zod + Prisma adalah Kombinasi Sempurna?

```
TANPA ZOD — Bahaya yang Tidak Terlihat:
─────────────────────────────────────────────────────────────────
// Input dari API request
const body = await request.json()
// body bisa berisi APAPUN — tidak ada jaminan strukturnya benar!

// Langsung ke Prisma tanpa validasi — BERBAHAYA!
await prisma.produk.create({
  data: {
    nama:       body.nama,       // Bisa string kosong ""
    harga:      body.harga,      // Bisa -999999 atau "abc"
    stok:       body.stok,       // Bisa -100
    kategoriId: body.kategoriId, // Bisa tidak ada atau bukan angka
  }
})
// Mungkin crash di database, atau menyimpan data yang tidak valid!


DENGAN ZOD — Validasi Sebelum Ke Prisma:
─────────────────────────────────────────────────────────────────
const body = await request.json()

// Validasi dulu dengan Zod
const data = CreateProdukSchema.parse(body)
// Jika tidak valid → throw ZodError dengan pesan yang jelas
// Jika valid → data sudah typed dengan benar

// Baru kirim ke Prisma — data sudah dijamin bersih
await prisma.produk.create({ data })
// Aman! ✅
```

---

## 📦 17.2 Setup Zod

```bash
npm install zod
```

```typescript
// Zod tidak butuh konfigurasi khusus — langsung import dan pakai
import { z } from 'zod'
```

---

## 📋 17.3 Schema Validasi untuk Semua Operasi CRUD

```typescript
// src/validations/produk.schema.ts
import { z } from 'zod'

// ─── Schema untuk CREATE produk ──────────────────────────────────────
export const CreateProdukSchema = z.object({
  nama: z
    .string({ required_error: 'Nama produk wajib diisi' })
    .trim()                                              // Hapus whitespace di awal/akhir
    .min(3,   'Nama minimal 3 karakter')
    .max(255, 'Nama maksimal 255 karakter'),

  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung'
    )
    .optional(),
    // Opsional — akan di-generate dari nama jika tidak disediakan

  deskripsi: z
    .string()
    .trim()
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .optional(),

  harga: z
    .number({ required_error: 'Harga wajib diisi', invalid_type_error: 'Harga harus berupa angka' })
    .positive('Harga harus lebih dari 0')
    .max(999_999_999, 'Harga terlalu besar')
    .multipleOf(0.01, 'Harga maksimal 2 desimal'),
    // .multipleOf(0.01) → 10.555 tidak valid, 10.55 valid

  stok: z
    .number({ invalid_type_error: 'Stok harus berupa angka' })
    .int('Stok harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif')
    .max(999_999, 'Stok terlalu besar')
    .default(0),

  stokMinimum: z
    .number()
    .int()
    .min(0)
    .default(0),

  gambar: z
    .string()
    .url('Format URL gambar tidak valid')
    .optional()
    .nullable(),

  aktif: z
    .boolean()
    .default(true),

  kategoriId: z
    .number({ required_error: 'Kategori wajib dipilih', invalid_type_error: 'Kategori tidak valid' })
    .int()
    .positive('Pilih kategori yang valid'),

  tagIds: z
    .array(
      z.number().int().positive()
    )
    .max(10, 'Maksimal 10 tag per produk')
    .default([]),
})
// Type inference — tidak perlu tulis interface manual!
export type CreateProdukInput = z.infer<typeof CreateProdukSchema>


// ─── Schema untuk UPDATE produk ───────────────────────────────────────
// .partial() membuat SEMUA field menjadi opsional
export const UpdateProdukSchema = CreateProdukSchema
  .partial()                         // Semua opsional
  .omit({ slug: true, tagIds: true }) // Hapus field yang tidak boleh diupdate via schema ini
  .extend({
    // Field tambahan yang khusus untuk update
    tagIds: z.array(z.number().int().positive()).optional(),
    // tagIds opsional saat update (null = jangan ubah, [] = hapus semua, [...] = set baru)
  })

export type UpdateProdukInput = z.infer<typeof UpdateProdukSchema>


// ─── Schema untuk QUERY/FILTER produk ────────────────────────────────
export const QueryProdukSchema = z.object({
  halaman: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    // Transform string dari query param ke number!
    .pipe(z.number().int().positive()),

  perHalaman: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 12)
    .pipe(z.number().int().min(1).max(100)),

  keyword: z
    .string()
    .trim()
    .min(2, 'Keyword minimal 2 karakter')
    .max(100)
    .optional(),

  kategoriId: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined)
    .pipe(z.number().int().positive().optional()),

  minHarga: z
    .string()
    .optional()
    .transform(val => val ? parseFloat(val) : undefined)
    .pipe(z.number().positive().optional()),

  maxHarga: z
    .string()
    .optional()
    .transform(val => val ? parseFloat(val) : undefined)
    .pipe(z.number().positive().optional()),

  urutkan: z
    .enum(['harga_asc', 'harga_desc', 'terbaru', 'terlama', 'terlaris'])
    .default('terbaru'),

  tagSlugs: z
    .string()
    .optional()
    .transform(val => val ? val.split(',').map(s => s.trim()) : []),
    // Query param: "gaming,premium" → ["gaming", "premium"]
})
.refine(
  data => {
    // Custom validation: maxHarga harus >= minHarga
    if (data.minHarga && data.maxHarga) {
      return data.maxHarga >= data.minHarga
    }
    return true
  },
  {
    message: 'Harga maksimum harus lebih besar dari harga minimum',
    path:    ['maxHarga'],
  }
)

export type QueryProdukInput = z.infer<typeof QueryProdukSchema>
```

---

## 🔧 17.4 Schema Validasi untuk Autentikasi

```typescript
// src/validations/auth.schema.ts
import { z } from 'zod'

export const RegisterSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(2,  'Nama minimal 2 karakter')
    .max(50, 'Nama maksimal 50 karakter')
    .regex(/^[a-zA-Z\s]+$/, 'Nama hanya boleh berisi huruf dan spasi'),

  email: z
    .string()
    .trim()
    .email('Format email tidak valid')
    .toLowerCase(),  // Selalu simpan email dalam huruf kecil
    // "BUDI@EMAIL.COM" → "budi@email.com"

  password: z
    .string()
    .min(8,  'Password minimal 8 karakter')
    .max(72, 'Password maksimal 72 karakter')  // Batas bcrypt
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password harus mengandung huruf kecil, huruf besar, dan angka'
    ),

  konfirmasiPassword: z.string(),
})
.refine(
  data => data.password === data.konfirmasiPassword,
  {
    message: 'Password dan konfirmasi password tidak cocok',
    path:    ['konfirmasiPassword'],
  }
)

export const LoginSchema = z.object({
  email:    z.string().trim().email('Format email tidak valid').toLowerCase(),
  password: z.string().min(1, 'Password wajib diisi'),
})

export const UpdatePasswordSchema = z.object({
  passwordLama: z.string().min(1, 'Password lama wajib diisi'),
  passwordBaru: z
    .string()
    .min(8, 'Password baru minimal 8 karakter')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password harus mengandung huruf kecil, besar, dan angka'),
  konfirmasi: z.string(),
})
.refine(
  data => data.passwordBaru === data.konfirmasi,
  { message: 'Konfirmasi password tidak cocok', path: ['konfirmasi'] }
)
.refine(
  data => data.passwordLama !== data.passwordBaru,
  { message: 'Password baru tidak boleh sama dengan password lama', path: ['passwordBaru'] }
)

export type RegisterInput         = z.infer<typeof RegisterSchema>
export type LoginInput            = z.infer<typeof LoginSchema>
export type UpdatePasswordInput   = z.infer<typeof UpdatePasswordSchema>
```

---

## 🚀 17.5 Integrasi Zod dengan Prisma di Service Layer

```typescript
// src/services/produk.service.ts

import { prisma }            from '../lib/prisma'
import { z }                 from 'zod'
import slugify                from 'slugify'
import {
  CreateProdukSchema,
  UpdateProdukSchema,
  QueryProdukSchema,
  type CreateProdukInput,
  type UpdateProdukInput,
  type QueryProdukInput,
} from '../validations/produk.schema'


export class ProdukService {

  // ─── CREATE ────────────────────────────────────────────────────────
  async buatProduk(rawInput: unknown) {
    // ① Validasi input — throw ZodError jika tidak valid
    const data = CreateProdukSchema.parse(rawInput)
    // Setelah parse(), TypeScript tahu data adalah CreateProdukInput

    // ② Generate slug dari nama jika tidak disediakan
    const slug = data.slug ?? slugify(data.nama, {
      lower:     true,
      strict:    true,   // Hapus karakter special
      locale:    'id',
    })

    // ③ Cek apakah slug sudah dipakai
    const existing = await prisma.produk.findUnique({ where: { slug } })
    if (existing) {
      throw new Error(`Slug "${slug}" sudah digunakan. Gunakan nama yang berbeda.`)
    }

    // ④ Simpan ke database
    const { tagIds, ...produkData } = data

    return prisma.produk.create({
      data: {
        ...produkData,
        slug,
        tags: tagIds.length > 0
          ? { connect: tagIds.map(id => ({ id })) }
          : undefined,
      },
      include: { kategori: true, tags: true }
    })
  }


  // ─── UPDATE ────────────────────────────────────────────────────────
  async updateProduk(id: number, rawInput: unknown) {
    // ① Validasi input
    const data = UpdateProdukSchema.parse(rawInput)

    // ② Cek apakah produk ada
    const existing = await prisma.produk.findUnique({ where: { id } })
    if (!existing) throw new Error('Produk tidak ditemukan')

    // ③ Update
    const { tagIds, ...produkData } = data

    return prisma.produk.update({
      where: { id },
      data: {
        ...produkData,
        ...(tagIds !== undefined && {
          tags: { set: tagIds.map(id => ({ id })) }
          // set mengganti semua tag dengan array baru
        }),
      },
      include: { kategori: true, tags: true }
    })
  }


  // ─── QUERY / SEARCH ────────────────────────────────────────────────
  async cariProduk(rawQuery: unknown) {
    // ① Validasi dan transform query params
    const query = QueryProdukSchema.parse(rawQuery)
    // query.halaman sudah berupa number (bukan string lagi!)
    // query.minHarga sudah berupa number atau undefined

    // ② Bangun WHERE condition
    const where = {
      aktif:    true,
      deletedAt: null,
      ...(query.kategoriId && { kategoriId: query.kategoriId }),
      ...(query.minHarga   && { harga: { gte: query.minHarga } }),
      ...(query.maxHarga   && {
        harga: {
          ...(query.minHarga && { gte: query.minHarga }),
          lte: query.maxHarga
        }
      }),
      ...(query.keyword && {
        OR: [
          { nama:      { contains: query.keyword, mode: 'insensitive' as const } },
          { deskripsi: { contains: query.keyword, mode: 'insensitive' as const } },
        ]
      }),
      ...(query.tagSlugs.length > 0 && {
        tags: { some: { slug: { in: query.tagSlugs } } }
      }),
    }

    // ③ Tentukan pengurutan
    const orderBy = {
      harga_asc:  { harga:      'asc'  as const },
      harga_desc: { harga:      'desc' as const },
      terbaru:    { createdAt:  'desc' as const },
      terlama:    { createdAt:  'asc'  as const },
      terlaris:   { views:      'desc' as const },
    }[query.urutkan]

    // ④ Eksekusi query paralel
    const [produk, total] = await Promise.all([
      prisma.produk.findMany({
        where,
        orderBy,
        skip:    (query.halaman - 1) * query.perHalaman,
        take:    query.perHalaman,
        select: {
          id:    true, nama:  true,
          slug:  true, harga: true,
          stok:  true, gambar: true,
          kategori: { select: { nama: true, slug: true } },
          tags:     { select: { nama: true, slug: true } },
          _count:   { select: { ulasan: true } },
        }
      }),
      prisma.produk.count({ where })
    ])

    return {
      data: produk,
      meta: {
        halaman:     query.halaman,
        perHalaman:  query.perHalaman,
        total,
        totalHalaman: Math.ceil(total / query.perHalaman),
      }
    }
  }
}

export const produkService = new ProdukService()
```

---

## 🎯 17.6 Menangani ZodError dengan Baik

```typescript
// src/lib/validasi.ts

import { z, ZodError } from 'zod'

// ─── Parse dengan error yang informatif ──────────────────────────────
export function parseInput<T>(
  schema: z.ZodType<T>,
  input:  unknown
): T {
  try {
    return schema.parse(input)
  } catch (error) {
    if (error instanceof ZodError) {
      // Format error menjadi pesan yang mudah dibaca
      const pesan = error.errors
        .map(e => `${e.path.join('.')} — ${e.message}`)
        .join('\n')

      throw new Error(`Input tidak valid:\n${pesan}`)
    }
    throw error
  }
}

// ─── safeParse — tidak throw, return success/error ────────────────────
export function validasiInput<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input)

  if (!result.success) {
    return {
      sukses:  false as const,
      errors:  result.error.flatten().fieldErrors,
      // {
      //   nama:       ["Nama minimal 3 karakter"],
      //   harga:      ["Harga harus lebih dari 0"],
      //   kategoriId: ["Pilih kategori yang valid"],
      // }
      pesan:   'Data yang dikirim tidak valid. Periksa kembali.',
    }
  }

  return {
    sukses: true as const,
    data:   result.data,
  }
}


// Penggunaan di Route Handler / API:
import { validasiInput }   from '../lib/validasi'
import { CreateProdukSchema } from '../validations/produk.schema'

async function handleCreateProduk(body: unknown) {
  const validasi = validasiInput(CreateProdukSchema, body)

  if (!validasi.sukses) {
    // Kirim 422 Unprocessable Entity
    return {
      status:  422,
      body: {
        pesan:  validasi.pesan,
        errors: validasi.errors,
      }
    }
  }

  // validasi.data sudah typed sebagai CreateProdukInput
  const produk = await produkService.buatProduk(validasi.data)
  return { status: 201, body: produk }
}
```

---

## ✅ Checklist Bab 17

```
□ Zod sudah terinstall dan bisa diimport
□ Schema validasi terpisah dari service/controller (di folder validations/)
□ Semua input API request divalidasi sebelum ke Prisma
□ Pakai .transform() untuk konversi tipe (string query param → number)
□ Pakai .refine() untuk validasi yang bergantung pada banyak field
□ Pakai z.infer<typeof Schema> untuk type inference (tidak tulis interface manual)
□ Error ZodError diformat menjadi pesan yang informatif untuk user
□ Pakai safeParse() untuk handling error tanpa try-catch
□ Email selalu di-lowercase dengan .toLowerCase()
□ String di-trim() untuk hapus whitespace di awal/akhir
```

---

---

# 📖 Bab 18 — Error Handling di Prisma

Error yang tidak ditangani dengan baik adalah salah satu penyebab bug production yang paling susah di-debug. Di bab ini kita bahas semua jenis error Prisma dan cara menanganinya secara profesional.

---

## 📋 18.1 Jenis-Jenis Error Prisma

```typescript
import { Prisma } from '@prisma/client'

// Prisma memiliki 5 kelas error utama:

// ① PrismaClientKnownRequestError
// → Error dari query yang sudah dikenali (constraint violation, not found, dll)
// → Punya property: code, meta, message

// ② PrismaClientUnknownRequestError
// → Error dari query yang tidak dikenali
// → Biasanya bug di Prisma atau query yang tidak valid

// ③ PrismaClientRustPanicError
// → Error pada Prisma Query Engine (very rare)
// → Aplikasi perlu di-restart

// ④ PrismaClientInitializationError
// → Error saat inisialisasi PrismaClient
// → Biasanya: DATABASE_URL salah, database tidak bisa diakses

// ⑤ PrismaClientValidationError
// → Error validasi dari Prisma Client (tipe data salah, field tidak ada, dll)
// → Bukan error dari database, tapi dari Prisma Client itu sendiri
```

---

## 🔢 18.2 Error Codes yang Sering Terjadi

```typescript
// Semua error code Prisma dimulai dengan "P" + 4 digit

// ─── P2002: Unique Constraint Violation ──────────────────────────────
// Terjadi saat: INSERT/UPDATE dengan nilai yang sudah ada di @unique field

try {
  await prisma.pengguna.create({
    data: { email: 'sudah@ada.com', nama: 'Test', password: 'xxx' }
    //     email ini sudah dipakai user lain!
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[]).join(', ')
      // error.meta.target berisi nama field yang konflik: ["email"]
      throw new Error(`${field} sudah digunakan oleh akun lain`)
    }
  }
}


// ─── P2003: Foreign Key Constraint Violation ─────────────────────────
// Terjadi saat: INSERT dengan FK yang tidak ada, atau DELETE parent yang masih punya child

try {
  await prisma.produk.create({
    data: { nama: 'Test', slug: 'test', harga: 100, stok: 1, kategoriId: 9999 }
    //                                                         kategoriId tidak ada!
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      const field = error.meta?.field_name as string
      throw new Error(`Referensi ${field} tidak ditemukan`)
    }
  }
}


// ─── P2025: Record Not Found ──────────────────────────────────────────
// Terjadi saat: update() atau delete() dengan where yang tidak menemukan record

try {
  await prisma.produk.update({
    where: { id: 9999 },   // ID tidak ada!
    data:  { nama: 'Updated' }
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      throw new Error('Data yang ingin diupdate tidak ditemukan')
    }
  }
}


// ─── P2014: Required Relation Violation ──────────────────────────────
// Terjadi saat: disconnect relasi yang required (non-nullable)

// ─── P2016: Query Interpretation Error ───────────────────────────────
// Terjadi saat: query tidak valid atau ada masalah interpretasi

// ─── P1001: Can't Reach Database ──────────────────────────────────────
// Terjadi saat: database tidak bisa diakses
// (connection refused, network error, dll)

// ─── P1002: Database Timeout ──────────────────────────────────────────
// Terjadi saat: query melebihi batas waktu yang ditentukan
```

---

## 🛡️ 18.3 Error Handler Terpusat

```typescript
// src/lib/error-handler.ts
// Error handler yang menangani semua jenis error Prisma

import { Prisma }  from '@prisma/client'
import { ZodError } from 'zod'

// Tipe untuk response error yang terstandarisasi
export interface ErrorResponse {
  kode:       string
  pesan:      string
  detail?:    Record<string, string[]>
  statusHTTP: number
}

export function handlePrismaError(error: unknown): ErrorResponse {

  // ─── ZodError — validasi input gagal ─────────────────────────────
  if (error instanceof ZodError) {
    return {
      kode:       'VALIDATION_ERROR',
      pesan:      'Data yang dikirim tidak valid',
      detail:     error.flatten().fieldErrors as Record<string, string[]>,
      statusHTTP: 422,
    }
  }


  // ─── PrismaClientKnownRequestError ────────────────────────────────
  if (error instanceof Prisma.PrismaClientKnownRequestError) {

    switch (error.code) {
      case 'P2002': {
        const fields = (error.meta?.target as string[] ?? []).join(', ')
        return {
          kode:       'DUPLICATE_ERROR',
          pesan:      `${fields || 'Data'} sudah digunakan`,
          statusHTTP: 409,  // Conflict
        }
      }

      case 'P2003': {
        const field = error.meta?.field_name as string ?? 'relasi'
        return {
          kode:       'REFERENCE_ERROR',
          pesan:      `Referensi ${field} tidak ditemukan`,
          statusHTTP: 400,  // Bad Request
        }
      }

      case 'P2025': {
        return {
          kode:       'NOT_FOUND',
          pesan:      'Data tidak ditemukan',
          statusHTTP: 404,
        }
      }

      case 'P2014': {
        return {
          kode:       'RELATION_ERROR',
          pesan:      'Operasi melanggar constraint relasi database',
          statusHTTP: 400,
        }
      }

      case 'P2016': {
        return {
          kode:       'QUERY_ERROR',
          pesan:      'Query tidak valid',
          statusHTTP: 400,
        }
      }

      default: {
        console.error(`Unhandled Prisma error code: ${error.code}`, error)
        return {
          kode:       'DATABASE_ERROR',
          pesan:      'Terjadi kesalahan pada database',
          statusHTTP: 500,
        }
      }
    }
  }


  // ─── PrismaClientValidationError ──────────────────────────────────
  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error('Prisma validation error:', error.message)
    return {
      kode:       'INVALID_QUERY',
      pesan:      'Query yang dikirim tidak valid',
      statusHTTP: 400,
    }
  }


  // ─── PrismaClientInitializationError ──────────────────────────────
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error('Database connection error:', error.message)
    return {
      kode:       'DB_CONNECTION_ERROR',
      pesan:      'Tidak dapat terhubung ke database',
      statusHTTP: 503,  // Service Unavailable
    }
  }


  // ─── Error umum ───────────────────────────────────────────────────
  if (error instanceof Error) {
    // Error yang sengaja di-throw dengan pesan khusus
    return {
      kode:       'ERROR',
      pesan:      error.message,
      statusHTTP: 400,
    }
  }

  // ─── Error tidak dikenal ──────────────────────────────────────────
  console.error('Unknown error:', error)
  return {
    kode:       'UNKNOWN_ERROR',
    pesan:      'Terjadi kesalahan yang tidak diketahui',
    statusHTTP: 500,
  }
}
```

---

## 🔧 18.4 Wrapper Service yang Aman

```typescript
// src/lib/safe-execute.ts
// Helper untuk menjalankan operasi database dengan error handling otomatis

import { handlePrismaError, type ErrorResponse } from './error-handler'

type HasilOperasi<T> =
  | { sukses: true;  data: T }
  | { sukses: false; error: ErrorResponse }

export async function safeExecute<T>(
  operasi: () => Promise<T>
): Promise<HasilOperasi<T>> {
  try {
    const data = await operasi()
    return { sukses: true, data }
  } catch (error) {
    return { sukses: false, error: handlePrismaError(error) }
  }
}


// Penggunaan di service/handler:
import { safeExecute }    from '../lib/safe-execute'
import { produkService }  from '../services/produk.service'

// ─── Di Next.js Route Handler ──────────────────────────────────────────
// app/api/produk/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  const hasil = await safeExecute(() =>
    produkService.buatProduk(body)
  )

  if (!hasil.sukses) {
    return NextResponse.json(
      {
        pesan:  hasil.error.pesan,
        kode:   hasil.error.kode,
        detail: hasil.error.detail,
      },
      { status: hasil.error.statusHTTP }
    )
  }

  return NextResponse.json(hasil.data, { status: 201 })
}

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams)

  const hasil = await safeExecute(() =>
    produkService.cariProduk(searchParams)
  )

  if (!hasil.sukses) {
    return NextResponse.json(
      { pesan: hasil.error.pesan, kode: hasil.error.kode },
      { status: hasil.error.statusHTTP }
    )
  }

  return NextResponse.json(hasil.data)
}
```

---

## 📊 18.5 Retry Logic — Coba Ulang Saat Error Sementara

```typescript
// src/lib/retry.ts
// Coba ulang operasi yang mungkin gagal karena alasan sementara
// (network blip, database temporarily unavailable, dll)

import { Prisma } from '@prisma/client'

interface RetryOptions {
  maxCobaan:      number   // Berapa kali maksimal coba
  delayMs:        number   // Jeda awal antar percobaan
  faktorBackoff:  number   // Pengganda delay (exponential backoff)
}

const defaultRetryOptions: RetryOptions = {
  maxCobaan:     3,
  delayMs:       500,    // 500ms, 1000ms, 2000ms
  faktorBackoff: 2,
}

function isRetriableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Error yang layak untuk retry
    return ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code)
    // P1001: Can't reach database
    // P1002: Database timeout
    // P1008: Operations timeout
    // P1017: Server closed connection
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true  // Masalah koneksi awal
  }
  return false
}

export async function withRetry<T>(
  operasi:  () => Promise<T>,
  opsi:     RetryOptions = defaultRetryOptions
): Promise<T> {
  let lastError: unknown
  let delay = opsi.delayMs

  for (let percobaan = 1; percobaan <= opsi.maxCobaan; percobaan++) {
    try {
      return await operasi()
    } catch (error) {
      lastError = error

      // Jika bukan error yang layak retry, langsung throw
      if (!isRetriableError(error)) throw error

      // Jika ini percobaan terakhir, throw
      if (percobaan === opsi.maxCobaan) throw error

      console.warn(
        `⚠️ Percobaan ${percobaan}/${opsi.maxCobaan} gagal. ` +
        `Coba lagi dalam ${delay}ms...`
      )

      // Tunggu sebelum coba lagi (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= opsi.faktorBackoff
    }
  }

  throw lastError
}


// Penggunaan:
const produk = await withRetry(
  () => prisma.produk.findMany({ take: 10 }),
  { maxCobaan: 3, delayMs: 500, faktorBackoff: 2 }
)
// Jika database sementara tidak bisa diakses, akan coba ulang:
// Percobaan 1 → gagal → tunggu 500ms
// Percobaan 2 → gagal → tunggu 1000ms
// Percobaan 3 → berhasil ✅ (atau throw jika masih gagal)
```

---

## 📋 18.6 Logging Error yang Terstruktur

```typescript
// src/lib/logger.ts
// Structured logging untuk error database

interface LogEntry {
  level:     'info' | 'warn' | 'error'
  pesan:     string
  model?:    string
  aksi?:     string
  errorCode?: string
  durasi?:   number
  waktu:     string
  userId?:   number
  requestId?: string
}

function log(entry: LogEntry) {
  const output = {
    ...entry,
    waktu: new Date().toISOString(),
    env:   process.env.NODE_ENV,
  }

  if (entry.level === 'error') {
    console.error(JSON.stringify(output))
    // Di production: kirim ke logging service (Datadog, Sentry, dll)
  } else if (entry.level === 'warn') {
    console.warn(JSON.stringify(output))
  } else {
    console.log(JSON.stringify(output))
  }
}

// Middleware Prisma dengan structured logging
export function setupPrismaLogging(prismaClient: any) {
  prismaClient.$use(async (params: any, next: any) => {
    const sebelum = Date.now()

    try {
      const result = await next(params)
      const durasi = Date.now() - sebelum

      // Log query lambat
      if (durasi > 1000) {
        log({
          level:  'warn',
          pesan:  'Query lambat terdeteksi',
          model:  params.model,
          aksi:   params.action,
          durasi,
          waktu:  new Date().toISOString(),
        })
      }

      return result

    } catch (error: any) {
      const durasi = Date.now() - sebelum

      log({
        level:     'error',
        pesan:     error.message,
        model:     params.model,
        aksi:      params.action,
        errorCode: error.code,
        durasi,
        waktu:     new Date().toISOString(),
      })

      throw error
    }
  })
}
```

---

## ✅ Checklist Bab 18

```
□ Memahami 5 kelas error Prisma dan kapan masing-masing terjadi
□ Hafal error code yang paling sering: P2002, P2003, P2025
□ Ada error handler terpusat yang menangani semua error Prisma
□ Error Prisma tidak pernah di-expose langsung ke user (bisa bocorkan info sensitif)
□ ZodError diformat menjadi pesan per field yang informatif
□ Error logging terstruktur (JSON) untuk memudahkan debugging
□ Retry logic untuk error sementara (koneksi, timeout)
□ Setiap API endpoint menggunakan safeExecute atau try-catch yang tepat
□ Error P2025 (not found) ditangani dengan status HTTP 404
□ Error P2002 (duplicate) ditangani dengan status HTTP 409
□ Error validasi ditangani dengan status HTTP 422
```

---

## 📊 Ringkasan Bagian VI

```
YANG SUDAH DIPELAJARI DI BAGIAN VI:

Bab 16 — Prisma Middleware & Client Extension
├── Perbandingan Middleware vs Extension (kapan pakai masing-masing)
├── Middleware mendalam: performance logger, soft delete global, audit log
├── Extension model: method baru (cariAktif, softDelete, terlaris, dll)
├── Extension result: computed fields (hargaFormat, tersedia, inisialNama)
├── Extension client: utility methods (healthCheck, statistikDatabase)
└── Composing multiple extensions menjadi satu

Bab 17 — Validasi dengan Zod + Prisma
├── Mengapa Zod + Prisma adalah kombinasi sempurna
├── Schema validasi untuk CREATE, UPDATE, dan QUERY/FILTER
├── Transformasi otomatis: string query param → number, email lowercase
├── Custom validation dengan .refine() untuk kondisi antar-field
├── z.infer<> untuk type inference tanpa tulis interface manual
├── Integrasi di service layer (validasi sebelum ke Prisma)
└── Error handling ZodError yang informatif per field

Bab 18 — Error Handling di Prisma
├── 5 kelas error Prisma dan kapan terjadi
├── Error codes penting: P2002, P2003, P2025, P2003, P1001, P1002
├── Error handler terpusat yang menstandarisasi semua error
├── safeExecute() wrapper untuk operasi database yang aman
├── Penggunaan di Next.js Route Handler
├── Retry logic dengan exponential backoff untuk error sementara
└── Structured logging untuk debugging di production
```

> 📌 **Selanjutnya — Bagian VII:** Kode kamu sekarang sudah aman, tervalidasi, dan error-nya terhandle dengan baik. Di Bagian VII, kita fokus pada **Performa & Best Practices** — optimasi query, menghindari N+1 problem, dan pola-pola yang membuat codebase Prisma kamu scalable dan mudah di-maintain.