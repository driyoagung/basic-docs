---
title: "Bab 18 — Error Handling di Prisma"
---

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

---

🚀 Lanjut ke [⚡ Bab 19 — Optimasi Query & Performa](/bagian-7/bab-19) untuk melanjutkan perjalanan!
