---
title: "Bab 17 — Validasi dengan Zod + Prisma"
---

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

---

🚀 Lanjut ke [🚨 Bab 18 — Error Handling di Prisma](/bagian-6/bab-18) untuk melanjutkan perjalanan!
