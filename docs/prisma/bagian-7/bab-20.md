---
title: "Bab 20 — Best Practices & Pola Umum"
---

---

## 🏗️ 20.1 Repository Pattern — Organisasi Kode yang Rapi

Repository Pattern memisahkan logika akses database dari logika bisnis. Ini membuat kode lebih mudah di-test, di-maintain, dan di-refactor.

```typescript
// src/repositories/base.repository.ts
// Base class yang bisa dipakai oleh semua repository

import { PrismaClient } from '@prisma/client'

export abstract class BaseRepository {
  protected prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
}


// src/repositories/produk.repository.ts
import { Prisma, Produk }  from '@prisma/client'
import { BaseRepository }  from './base.repository'
import { prisma }          from '../lib/prisma'

// Definisikan tipe untuk include yang sering dipakai
export const produkInclude = {
  kategori: true,
  tags:     { select: { nama: true, slug: true } },
  _count:   { select: { ulasan: true, itemPesanan: true } },
} satisfies Prisma.ProdukInclude

export type ProdukLengkap = Prisma.ProdukGetPayload<{
  include: typeof produkInclude
}>

export class ProdukRepository extends BaseRepository {

  // ─── READ ──────────────────────────────────────────────────────
  async cariSemua(params: {
    halaman?:    number
    perHalaman?: number
    keyword?:    string
    kategoriId?: number
    aktif?:      boolean
    tagSlug?:    string
    urutkan?:    'terbaru' | 'terlama' | 'harga_asc' | 'harga_desc' | 'terlaris'
  } = {}): Promise<{ data: ProdukLengkap[]; total: number }> {
    const {
      halaman    = 1,
      perHalaman = 12,
      keyword,
      kategoriId,
      aktif      = true,
      tagSlug,
      urutkan    = 'terbaru',
    } = params

    const where: Prisma.ProdukWhereInput = {
      aktif,
      deletedAt: null,
      ...(kategoriId && { kategoriId }),
      ...(tagSlug    && { tags: { some: { slug: tagSlug } } }),
      ...(keyword    && {
        OR: [
          { nama:      { contains: keyword, mode: 'insensitive' } },
          { deskripsi: { contains: keyword, mode: 'insensitive' } },
        ]
      }),
    }

    const orderBy: Prisma.ProdukOrderByWithRelationInput = {
      terbaru:    { createdAt: 'desc' },
      terlama:    { createdAt: 'asc'  },
      harga_asc:  { harga:     'asc'  },
      harga_desc: { harga:     'desc' },
      terlaris:   { itemPesanan: { _count: 'desc' } },
    }[urutkan] ?? { createdAt: 'desc' }

    const [data, total] = await Promise.all([
      this.prisma.produk.findMany({
        where,
        include: produkInclude,
        orderBy,
        skip: (halaman - 1) * perHalaman,
        take: perHalaman,
      }),
      this.prisma.produk.count({ where }),
    ])

    return { data, total }
  }

  async cariById(id: number): Promise<ProdukLengkap | null> {
    return this.prisma.produk.findUnique({
      where:   { id, deletedAt: null },
      include: produkInclude,
    })
  }

  async cariBySlug(slug: string): Promise<ProdukLengkap | null> {
    return this.prisma.produk.findUnique({
      where:   { slug, deletedAt: null },
      include: produkInclude,
    })
  }

  async cariTerlaris(take = 5): Promise<ProdukLengkap[]> {
    return this.prisma.produk.findMany({
      where:   { aktif: true, deletedAt: null },
      include: produkInclude,
      orderBy: { itemPesanan: { _count: 'desc' } },
      take,
    })
  }

  // ─── CREATE ────────────────────────────────────────────────────
  async buat(data: Prisma.ProdukCreateInput): Promise<ProdukLengkap> {
    return this.prisma.produk.create({
      data,
      include: produkInclude,
    })
  }

  // ─── UPDATE ────────────────────────────────────────────────────
  async update(id: number, data: Prisma.ProdukUpdateInput): Promise<ProdukLengkap> {
    return this.prisma.produk.update({
      where:   { id },
      data,
      include: produkInclude,
    })
  }

  async tambahView(id: number): Promise<void> {
    await this.prisma.produk.update({
      where: { id },
      data:  { views: { increment: 1 } },
    })
  }

  // ─── DELETE ────────────────────────────────────────────────────
  async softDelete(id: number): Promise<void> {
    await this.prisma.produk.update({
      where: { id },
      data:  { deletedAt: new Date() },
    })
  }

  async hapusPermanent(id: number): Promise<void> {
    await this.prisma.produk.delete({ where: { id } })
  }
}

// Singleton instance
export const produkRepository = new ProdukRepository(prisma)
```

---

## 🧩 20.2 Service Layer — Logika Bisnis yang Terpisah

```typescript
// src/services/produk.service.ts
// Layer antara repository (akses data) dan controller (handle request)
// Berisi logika bisnis — tidak tahu soal HTTP request/response

import { prisma }             from '../lib/prisma'
import { produkRepository }   from '../repositories/produk.repository'
import { CreateProdukSchema,
         UpdateProdukSchema,
         QueryProdukSchema }  from '../validations/produk.schema'
import slugify                from 'slugify'
import { z }                  from 'zod'

export class ProdukService {

  // ─── Buat produk baru dengan validasi bisnis ────────────────────
  async buat(rawInput: unknown) {
    // ① Validasi input
    const input = CreateProdukSchema.parse(rawInput)

    // ② Logika bisnis: generate slug
    const baseSlug = input.slug ?? slugify(input.nama, {
      lower: true, strict: true, locale: 'id'
    })

    // ③ Logika bisnis: pastikan slug unik
    let slug     = baseSlug
    let counter  = 0
    while (true) {
      const existing = await produkRepository.cariBySlug(slug)
      if (!existing) break  // Slug tersedia!

      counter++
      slug = `${baseSlug}-${counter}`
      // "laptop-asus" → "laptop-asus-1" → "laptop-asus-2" dst
    }

    // ④ Simpan ke database
    const { tagIds, ...produkData } = input

    return produkRepository.buat({
      ...produkData,
      slug,
      tags: tagIds.length > 0
        ? { connect: tagIds.map(id => ({ id })) }
        : undefined,
    })
  }


  // ─── Update dengan validasi kepemilikan ────────────────────────
  async update(
    id:      number,
    rawInput: unknown,
    editorId: number,
    editorRole: string
  ) {
    const input    = UpdateProdukSchema.parse(rawInput)
    const existing = await produkRepository.cariById(id)

    if (!existing) {
      throw new Error('Produk tidak ditemukan')
    }

    // Logika bisnis: validasi kepemilikan (jika relevan)
    // if (existing.creatorId !== editorId && editorRole !== 'ADMIN') {
    //   throw new Error('Tidak punya akses untuk edit produk ini')
    // }

    const { tagIds, ...produkData } = input

    return produkRepository.update(id, {
      ...produkData,
      ...(tagIds !== undefined && {
        tags: { set: tagIds.map(id => ({ id })) }
      }),
    })
  }


  // ─── Cari dengan paginasi dan filter ────────────────────────────
  async cari(rawQuery: unknown) {
    const query = QueryProdukSchema.parse(rawQuery)

    const { data, total } = await produkRepository.cariSemua({
      halaman:    query.halaman,
      perHalaman: query.perHalaman,
      keyword:    query.keyword,
      kategoriId: query.kategoriId,
      urutkan:    query.urutkan as any,
    })

    return {
      data,
      meta: {
        halaman:      query.halaman,
        perHalaman:   query.perHalaman,
        total,
        totalHalaman: Math.ceil(total / query.perHalaman),
        adaBerikutnya: query.halaman < Math.ceil(total / query.perHalaman),
        adaSebelumnya: query.halaman > 1,
      }
    }
  }


  // ─── Lihat detail + increment view ─────────────────────────────
  async detail(slug: string) {
    const produk = await produkRepository.cariBySlug(slug)

    if (!produk) {
      throw new Error('Produk tidak ditemukan')
    }

    // Fire and forget — jangan blokir response untuk increment view
    produkRepository.tambahView(produk.id).catch(console.error)

    return produk
  }
}

export const produkService = new ProdukService()
```

---

## 🔒 20.3 Type Safety Tingkat Lanjut dengan Prisma

```typescript
// Prisma menyediakan tipe utility yang sangat berguna
import { Prisma } from '@prisma/client'

// ─── Prisma.ModelGetPayload — Tipe berdasarkan query yang dilakukan ──
// Tipe ini berubah sesuai apa yang di-select/include!

// Tipe untuk produk dengan include tertentu
type ProdukDenganKategori = Prisma.ProdukGetPayload<{
  include: { kategori: true }
}>
// ProdukDenganKategori.kategori pasti ada (bukan optional)

type ProdukRingkas = Prisma.ProdukGetPayload<{
  select: {
    id:    true
    nama:  true
    harga: true
    slug:  true
  }
}>
// ProdukRingkas tidak punya field lain — TypeScript enforce ini!

type PesananLengkap = Prisma.PesananGetPayload<{
  include: {
    pengguna: {
      select: { nama: true; email: true }
    }
    items: {
      include: { produk: true }
    }
  }
}>
// Tipe nested ini perfectly typed!


// ─── Prisma.ModelWhereInput — Tipe untuk where clause ───────────────
type FilterProduk = Prisma.ProdukWhereInput
// Bisa pakai sebagai parameter fungsi filter

function buildProdukFilter(params: {
  aktif?:      boolean
  kategoriId?: number
  keyword?:    string
}): FilterProduk {
  return {
    ...(params.aktif      !== undefined && { aktif: params.aktif }),
    ...(params.kategoriId !== undefined && { kategoriId: params.kategoriId }),
    ...(params.keyword    !== undefined && {
      OR: [
        { nama:      { contains: params.keyword, mode: 'insensitive' } },
        { deskripsi: { contains: params.keyword, mode: 'insensitive' } },
      ]
    }),
  }
}

// Penggunaan:
const filter = buildProdukFilter({ aktif: true, keyword: 'laptop' })
await prisma.produk.findMany({ where: filter })


// ─── Prisma.ModelOrderByWithRelationInput — Tipe untuk orderBy ───────
type UrutanProduk = Prisma.ProdukOrderByWithRelationInput

function buildProdukOrder(urutkan: string): UrutanProduk {
  const options: Record<string, UrutanProduk> = {
    terbaru:    { createdAt: 'desc' },
    terlama:    { createdAt: 'asc'  },
    harga_asc:  { harga:     'asc'  },
    harga_desc: { harga:     'desc' },
    populer:    { views:     'desc' },
  }
  return options[urutkan] ?? { createdAt: 'desc' }
}


// ─── Prisma.ModelCreateInput & UpdateInput ────────────────────────────
type BuatProdukData   = Prisma.ProdukCreateInput
type UpdateProdukData = Prisma.ProdukUpdateInput

// Ini memastikan data yang dikirim ke Prisma selalu valid
async function buatProduk(data: BuatProdukData) {
  return prisma.produk.create({ data })
}
```

---

## 🧪 20.4 Testing dengan Prisma

```typescript
// src/__tests__/produk.service.test.ts
// Setup testing environment untuk Prisma

import { PrismaClient }           from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'
import { produkService }           from '../services/produk.service'

// ─── Metode 1: Mock Prisma Client ────────────────────────────────────
// Berguna untuk unit test yang cepat — tidak perlu database sungguhan!

// jest.setup.ts
jest.mock('../lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}))

describe('ProdukService', () => {
  let prismasMock: DeepMockProxy<PrismaClient>

  beforeEach(() => {
    prismasMock = mockDeep<PrismaClient>()
    jest.clearAllMocks()
  })

  it('harus buat produk dengan slug yang benar', async () => {
    // Arrange
    const inputProduk = {
      nama:       'Laptop ASUS ROG',
      harga:      25000000,
      stok:       5,
      kategoriId: 1,
      tagIds:     [1, 2],
    }

    const produkDibuat = {
      id:         1,
      nama:       'Laptop ASUS ROG',
      slug:       'laptop-asus-rog',
      harga:      25000000,
      stok:       5,
      kategoriId: 1,
      aktif:      true,
      deletedAt:  null,
      createdAt:  new Date(),
      updatedAt:  new Date(),
    }

    // Mock: findUnique return null (slug belum ada)
    prismasMock.produk.findUnique.mockResolvedValue(null)
    // Mock: create return produk yang dibuat
    prismasMock.produk.create.mockResolvedValue(produkDibuat as any)

    // Act
    const hasil = await produkService.buat(inputProduk)

    // Assert
    expect(hasil.slug).toBe('laptop-asus-rog')
    expect(prismasMock.produk.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'laptop-asus-rog' })
      })
    )
  })

  it('harus tambah angka ke slug jika sudah ada', async () => {
    const inputProduk = {
      nama:       'Laptop ASUS',
      harga:      25000000,
      stok:       5,
      kategoriId: 1,
    }

    // Mock: slug 'laptop-asus' sudah ada, 'laptop-asus-1' juga ada, 'laptop-asus-2' belum
    prismasMock.produk.findUnique
      .mockResolvedValueOnce({ id: 99 } as any)   // 'laptop-asus' sudah ada
      .mockResolvedValueOnce({ id: 100 } as any)  // 'laptop-asus-1' sudah ada
      .mockResolvedValueOnce(null)                  // 'laptop-asus-2' belum ada

    prismasMock.produk.create.mockResolvedValue({ slug: 'laptop-asus-2' } as any)

    await produkService.buat(inputProduk)

    expect(prismasMock.produk.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'laptop-asus-2' })
      })
    )
  })
})


// ─── Metode 2: Test Database Terpisah ────────────────────────────────
// Berguna untuk integration test — pakai database test sungguhan

// .env.test
// DATABASE_URL="postgresql://...@localhost:5432/db_test"

// jest.config.ts
// testEnvironment: 'node'
// setupFilesAfterEach: ['./src/__tests__/setup.ts']

// src/__tests__/setup.ts
import { PrismaClient } from '@prisma/client'
const prismaTest = new PrismaClient()

beforeAll(async () => {
  await prismaTest.$connect()
})

afterAll(async () => {
  await prismaTest.$disconnect()
})

beforeEach(async () => {
  // Bersihkan database sebelum setiap test
  await prismaTest.$transaction([
    prismaTest.ulasan.deleteMany(),
    prismaTest.itemPesanan.deleteMany(),
    prismaTest.pesanan.deleteMany(),
    prismaTest.produk.deleteMany(),
    prismaTest.kategori.deleteMany(),
    prismaTest.pengguna.deleteMany(),
  ])
})
```

---

## 📁 20.5 Struktur Folder yang Direkomendasikan

```
src/
│
├── lib/
│   ├── prisma.ts              ← Singleton PrismaClient
│   ├── prisma-extended.ts     ← Prisma + Extensions
│   ├── error-handler.ts       ← Error handling terpusat
│   ├── safe-execute.ts        ← Wrapper operasi database
│   └── retry.ts               ← Retry logic
│
├── validations/
│   ├── produk.schema.ts       ← Zod schema untuk Produk
│   ├── pengguna.schema.ts     ← Zod schema untuk Pengguna
│   ├── pesanan.schema.ts      ← Zod schema untuk Pesanan
│   └── auth.schema.ts         ← Zod schema untuk Auth
│
├── repositories/
│   ├── base.repository.ts     ← Base class
│   ├── produk.repository.ts   ← Akses data Produk
│   ├── pengguna.repository.ts ← Akses data Pengguna
│   └── pesanan.repository.ts  ← Akses data Pesanan
│
├── services/
│   ├── produk.service.ts      ← Logika bisnis Produk
│   ├── auth.service.ts        ← Logika bisnis Auth
│   └── pesanan.service.ts     ← Logika bisnis Pesanan
│
├── api/ (atau app/api/ untuk Next.js)
│   ├── produk/
│   │   └── route.ts           ← HTTP handlers
│   └── auth/
│       └── route.ts
│
└── __tests__/
    ├── setup.ts               ← Setup test environment
    ├── produk.service.test.ts
    └── pesanan.service.test.ts
```

---

## 📋 20.6 Checklist Final — Sebelum Deploy Production

```
SCHEMA & MIGRATION:
□ Semua foreign key punya @@index
□ Composite index dibuat untuk query yang sering dijalankan
□ Tipe data yang tepat (Decimal untuk uang, bukan Float!)
□ Enum dipakai untuk kolom dengan nilai terbatas
□ @@map dan @map dipakai untuk nama tabel/kolom yang konsisten
□ prisma migrate status → semua migration sudah applied
□ Migration sudah di-test di staging environment

QUERY OPTIMIZATION:
□ Tidak ada N+1 problem (loop + query di dalamnya)
□ Semua findMany() punya take (tidak ambil semua data!)
□ select dipakai untuk ambil hanya field yang dibutuhkan
□ _count dipakai untuk hitung relasi (bukan include + .length)
□ Query independen dijalankan paralel dengan Promise.all
□ Nested include punya take untuk batasi data

KEAMANAN:
□ Semua input API divalidasi dengan Zod sebelum ke Prisma
□ DATABASE_URL ada di .env (tidak hard-coded di kode)
□ .env ada di .gitignore
□ Raw query ($queryRaw) pakai tagged template literal
□ Error Prisma tidak di-expose langsung ke user
□ Connection pooling dikonfigurasi untuk serverless

ERROR HANDLING:
□ Error handler terpusat menangani semua error Prisma
□ P2002 (duplicate) → 409 Conflict
□ P2003 (FK violation) → 400 Bad Request
□ P2025 (not found) → 404 Not Found
□ ZodError → 422 Unprocessable Entity
□ Error tidak diketahui → 500 Internal Server Error

PERFORMA:
□ Query logging aktif di development
□ Slow query monitoring aktif di production
□ Connection limit dikonfigurasi sesuai environment
□ Index sudah diverifikasi dengan EXPLAIN

CODE QUALITY:
□ Repository Pattern dipakai untuk akses database
□ Service Layer berisi logika bisnis
□ TypeScript types menggunakan Prisma utility types
□ Unit test dan integration test sudah ada
□ Error messages informatif untuk debugging
```

---

## ✅ Checklist Bab 20

```
□ Repository Pattern diimplementasikan untuk memisahkan akses data
□ Service Layer berisi logika bisnis yang terpisah dari HTTP handler
□ Prisma utility types dipakai (GetPayload, WhereInput, OrderByInput)
□ Unit test menggunakan mock Prisma Client
□ Integration test menggunakan database test terpisah
□ Struktur folder mengikuti separation of concerns
□ Checklist production sudah dilewati sebelum deploy
```

---

## 📊 Ringkasan Bagian VII

```
YANG SUDAH DIPELAJARI DI BAGIAN VII:

Bab 19 — Optimasi Query & Performa
├── N+1 Problem: deteksi dan cara menghindari
├── SELECT optimization: hanya ambil field yang dibutuhkan
├── _count: hitung relasi tanpa load data ke memory
├── Parallel query dengan Promise.all dan Promise.allSettled
├── Index Strategy: kapan pasang, kapan tidak, composite index
├── EXPLAIN untuk debug query plan
└── Connection Pooling untuk serverless environment

Bab 20 — Best Practices & Pola Umum
├── Repository Pattern: pemisahan akses database
├── Service Layer: logika bisnis yang terpisah
├── TypeScript tingkat lanjut: Prisma.ModelGetPayload, WhereInput, dll
├── Testing: Mock Prisma Client vs database test sungguhan
├── Struktur folder yang direkomendasikan
└── Checklist final sebelum deploy production
```

> 📌 **Selesai! 🎉** Kamu sudah menyelesaikan Bagian I hingga VII dari Ebook Prisma ORM. Dari mengenal Prisma dari nol, mendefinisikan schema yang solid, mengelola migration dengan aman, menguasai semua operasi CRUD, query lanjutan dengan relasi, fitur-fitur Prisma yang canggih, hingga teknik optimasi dan best practices untuk production — semuanya sudah tercakup. **Selamat! Kamu sudah siap menggunakan Prisma secara profesional di project nyata.**

---

🚀 Lanjut ke [🏠 Bab 21 — Project: REST API Toko Online](/bagian-8/bab-21) untuk melanjutkan perjalanan!
