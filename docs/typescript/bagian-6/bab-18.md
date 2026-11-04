---
title: "Bab 18 — Fetching, Environment & Konfigurasi"
---

# 📖 Bab 18 — Fetching, Environment & Konfigurasi

Bab terakhir Bagian VI ini menyatukan potongan-potongan yang membuat aplikasi Next.js aman dan rapi: `fetch` bertipe di Server Component, API client generik, validasi environment, middleware, augmentasi tipe NextAuth, dan cara berbagi tipe antara client dan server tanpa membocorkan kode server. Setelah bab ini, Anda punya semua bekal untuk menulis project Next.js + TypeScript yang bisa dipertahankan jangka panjang.

---

## 18.1 🌐 `fetch` Bertipe di Server Component

Di Server Component, `fetch` bisa dipanggil langsung. Masalahnya tetap sama seperti Bab 12: hasil `res.json()` bertipe `any`/`unknown` — harus divalidasi.

```tsx
// app/produk/page.tsx
import { z } from 'zod'

const ProdukSchema = z.object({
  id: z.number(),
  nama: z.string(),
  harga: z.number(),
})

type Produk = z.infer<typeof ProdukSchema>

export default async function HalamanProduk() {
  const res = await fetch('https://api.toko.example/produk', {
    next: { revalidate: 60 },   // cache 60 detik
  })

  if (!res.ok) throw new Error(`Gagal memuat produk: ${res.status}`)

  const data = z.array(ProdukSchema).parse(await res.json())
  return <DaftarProduk produk={data} />
}
```

Opsi caching Next.js di `fetch`:

| Opsi | Arti |
|---|---|
| `cache: 'no-store'` | Selalu ambil baru — data dinamis (stok, harga) |
| `cache: 'force-cache'` | Simpan selamanya sampai di-revalidate |
| `next: { revalidate: 60 }` | Cache 60 detik (ISR) |
| `next: { tags: ['produk'] }` | Cache dengan tag, untuk `revalidateTag` |

> ⚠️ **Default caching berubah antar versi Next.js.** Next.js 15 mengubah
> default `fetch` menjadi **tidak di-cache** (sebelumnya cached). Selalu
> tulis opsi caching secara eksplisit agar perilakunya tidak bergantung
> pada versi.

---

## 18.2 🧰 API Client Generik

Daripada menulis `fetch` + validasi berulang di setiap halaman, buat satu client generik.

```ts
// lib/api.ts
import { z } from 'zod'

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number }

export async function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? ''
  try {
    const res = await fetch(`${base}${path}`, { ...init, cache: 'no-store' })

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, status: res.status }
    }

    const parsed = schema.safeParse(await res.json())
    if (!parsed.success) {
      return { ok: false, error: 'Bentuk data tidak sesuai' }
    }

    return { ok: true, data: parsed.data }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal menghubungi server',
    }
  }
}
```

Pemakaian dengan schema per endpoint:

```ts
const ProdukSchema = z.object({ id: z.number(), nama: z.string(), harga: z.number() })

const hasil = await apiGet('/produk/1', ProdukSchema)
if (hasil.ok) {
  console.log(hasil.data.harga)   // ✅ number, sudah tervalidasi
}
```

Bisa juga dibungkus menjadi object method:

```ts
export const api = {
  get: apiGet,
  async post<T>(path: string, body: unknown, schema: z.ZodType<T>) {
    return apiGet<T>(path, schema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  },
}
```

| Lapisan | Tanggung jawab |
|---|---|
| `apiGet` | HTTP, status, parse JSON, validasi schema, error |
| Schema per endpoint | Bentuk data yang diharapkan |
| Komponen | Menangani `ok`/error, render |

---

## 18.3 🔐 Mengetik `process.env` & Validasi Zod

Pola lengkapnya sudah disinggung di Bab 11; di sini kita terapkan di Next.js.

```ts
// lib/env.ts
import { z } from 'zod'

const EnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = EnvSchema.parse(process.env)
```

Deklarasi tipe agar editor mengenali:

```ts
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string
    DATABASE_URL: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}
```

Aturan prefix Next.js:

| Variabel | Tersedia di browser? | Tersedia di server? |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | ✅ |
| `DATABASE_URL` | ❌ (aman) | ✅ |
| `SECRET_KEY` | ❌ (aman) | ✅ |

> 🚨 **Jangan pernah menaruh secret dengan prefix `NEXT_PUBLIC_`.** Semua
> variabel ber-prefix itu **tertanam di bundle JavaScript** dan bisa dibaca
> siapa pun lewat DevTools. Hanya taruh URL publik, nama aplikasi, atau
> konfigurasi non-rahasia.

---

## 18.4 🛡️ Tipe untuk Middleware

Middleware berjalan sebelum request mencapai route. Tipenya memakai `NextRequest` dan `NextResponse`.

```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  if (!token && req.nextUrl.pathname.startsWith('/dashboard')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('dari', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/privat/:path*'],
}
```

| API | Kegunaan |
|---|---|
| `req.nextUrl.pathname` | Path yang diminta |
| `req.nextUrl.clone()` | Salin URL untuk dimodifikasi |
| `req.cookies.get(name)` | Baca cookie |
| `NextResponse.redirect(url)` | Alihkan |
| `NextResponse.next()` | Lanjutkan request |
| `config.matcher` | Pola route yang diproses middleware |

`matcher` bertipe `string[]` dan mendukung pola Next.js: `:path*` (segmen bebas), `:id` (satu segmen), regex dalam kurung.

---

## 18.5 🔑 Augmentasi Tipe NextAuth / Auth.js

NextAuth menyediakan `Session` dan `User` bawaan, tetapi aplikasi nyata biasanya menambah `id` dan `role`. Gunakan **module augmentation**.

```ts
// types/next-auth.d.ts
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'admin' | 'user'
    } & DefaultSession['user']
  }

  interface User {
    role: 'admin' | 'user'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'user'
  }
}
```

Sekarang di mana pun:

```ts
import { auth } from '@/auth'

const session = await auth()
if (session?.user.role === 'admin') {
  // ✅ role dikenali dan bertipe union
}
```

| Yang diaugmentasi | Tujuan |
|---|---|
| `next-auth` → `Session` | Tambah field di session (`id`, `role`) |
| `next-auth` → `User` | Tambah field di user hasil authorize |
| `next-auth/jwt` → `JWT` | Simpan data tambahan di token |

> 💡 **Augmentasi hanya "menambah tipe".** Anda tetap harus mengisi
> `role` di callback `jwt`/`session`. Kalau tidak, TypeScript akan
> mengira `role` ada padahal runtime `undefined` — selalu sinkronkan
> augmentasi dengan implementasi.

---

## 18.6 🧳 Berbagi Tipe antara Client & Server

Satu kesalahan arsitektur yang umum: file `types/` mengimpor Prisma atau kode server, lalu tanpa sadar ikut ter-bundle ke client.

Aturan praktis:

```
types/
├── domain/        ← murni tipe & konstanta, aman untuk client
│   ├── produk.ts
│   └── api.ts
├── server/        ← hanya untuk server (Prisma, secret)
│   └── db.ts
└── next-auth.d.ts ← augmentasi tipe
```

- **File di `types/domain`** hanya berisi `type`, `interface`, dan schema Zod yang aman — boleh diimpor client.
- **File di `types/server`** mengimpor Prisma/`fs`/secret — jangan pernah diimpor Client Component.
- **Gunakan `import type`** agar tipe tidak menarik kode runtime.
- **`server-only`** package membantu mencegah kebocoran:

```ts
// lib/db.ts
import 'server-only'
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()
```

Dengan `server-only`, mengimpor `lib/db.ts` dari Client Component akan **gagal saat build** — bukan diam-diam membocorkan kode server.

| Praktik | Manfaat |
|---|---|
| Pisahkan `types/domain` vs `types/server` | Batas jelas, bundle client tetap kecil |
| `import type` di mana-mana untuk tipe | Tidak ada runtime yang ikut |
| `import 'server-only'` di modul server | Kebocoran terdeteksi saat build |
| DTO untuk data dari server | Bentuk aman & serializable |

> ⚠️ **Tanda kebocoran:** build warning "Module not found: Can't resolve
> 'fs'" di Client Component. Itu artinya ada file server yang ikut
> terimpor lewat tipe atau util. Pisahkan segera.

---

## ✅ Checklist Bab 18

- **`fetch` di Server Component** — validasi `res.json()` dengan Zod; tulis opsi cache eksplisit.
- **Caching** — `no-store` (dinamis), `revalidate` (ISR), `tags` + `revalidateTag`.
- **API client generik** — satu fungsi `apiGet<T>(path, schema)` untuk semua endpoint.
- **`process.env`** — validasi Zod sekali di startup; deklarasikan tipenya di `env.d.ts`.
- **Prefix `NEXT_PUBLIC_`** — hanya untuk nilai non-rahasia; secret tanpa prefix.
- **Middleware** — `NextRequest`/`NextResponse`; `config.matcher` menentukan route.
- **Augmentasi NextAuth** — `Session`, `User`, `JWT`; sinkronkan dengan callback runtime.
- **Berbagi tipe** — `types/domain` aman untuk client, `types/server` khusus server.
- **`import type`** — mencegah kode runtime ikut ter-bundle.
- **`server-only`** — penjaga agar modul server tidak bocor ke client.

---

⏭️ Lanjut ke [🚨 Bab 19 — Membaca & Memperbaiki Error TypeScript](/bagian-7/bab-19) untuk melanjutkan!
