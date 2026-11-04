---
title: "Bab 21 — Project: Aplikasi Katalog Bertipe (React + Next.js)"
---

# 📖 Bab 21 — Project: Aplikasi Katalog Bertipe (React + Next.js)

Saatnya menyatukan 20 bab menjadi satu project utuh. Kita akan membangun **aplikasi katalog produk bertipe** — versi React (Vite) untuk latihan interaksi, dan versi Next.js (App Router) untuk latihan server-side: halaman dinamis, metadata, route handler, dan Server Action dengan validasi Zod. Tidak ada konsep baru di bab ini; semuanya adalah penerapan. Fokusnya: bagaimana potongan-potongan tipe yang Anda pelajari saling mengunci menjadi aplikasi yang aman dan mudah dirawat.

---

## 21.1 🎯 Yang Akan Dibangun

| Bagian | Isi |
|---|---|
| **Tipe inti** | `Produk`, `Kategori`, `ApiResponse<T>`, `Paginated<T>` |
| **React (Vite)** | Daftar produk, search + debounce, keranjang dengan `useReducer` & `useLocalStorage<T>` |
| **Next.js** | Halaman daftar & detail (`[slug]`), `generateMetadata`, route handler |
| **Server Action** | Form tambah produk dengan validasi Zod |
| **Validasi** | Semua data eksternal divalidasi dengan Zod, tipe diambil via `z.infer` |
| **Kualitas** | ESLint, `tsc --noEmit` di CI, `strict: true` |

Alur data yang akan kita bangun:

```
           ┌─────────────────────────────────────────┐
           │            types/domain                 │
           │  ProdukSchema (Zod) → Produk (infer)     │
           │  ApiResponse<T>, Paginated<T>            │
           └───────────────┬─────────────────────────┘
                           │ dipakai bersama
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
  React (Vite)                          Next.js (App Router)
  ├─ useFetch<T>                        ├─ page.tsx (await params)
  ├─ useLocalStorage<T>                 ├─ generateMetadata
  ├─ useReducer keranjang               ├─ route handler /api/produk
  └─ DataTable<T>                       └─ Server Action + Zod
```

---

## 21.2 📁 Struktur Folder

```
src/
├── types/
│   ├── produk.ts            ← tipe & schema Zod
│   └── api.ts               ← ApiResponse<T>, Paginated<T>
├── lib/
│   ├── api.ts               ← fetchJson<T>(url, schema)
│   └── env.ts               ← validasi env
├── hooks/
│   ├── useLocalStorage.ts   ← generik
│   ├── useDebounce.ts
│   └── useFetch.ts
├── components/
│   ├── ui/                  ← Button, Input, Card (bertipe)
│   └── DataTable.tsx        ← generik
└── app/                     ← halaman Next.js (jika di bagian Next)
```

**Alasan tiap folder:**

- **`types/`** — sumber kebenaran bentuk data. Semua schema Zod dan tipe turunannya di sini. Aman diimpor client maupun server (Bab 18).
- **`lib/`** — kode yang tidak terkait UI: HTTP client dan validasi env. `env.ts` memastikan aplikasi gagal cepat jika konfigurasi salah.
- **`hooks/`** — logika state yang bisa dipakai ulang, semuanya generik agar tidak terikat satu tipe produk.
- **`components/ui/`** — komponen presentasional bertipe; tidak tahu tentang API.
- **`components/DataTable.tsx`** — satu tabel generik untuk produk, user, atau order.
- **`app/`** — konvensi Next.js: page, layout, route handler, server action.

---

## 21.3 🧱 Tipe Inti & Schema Zod

Mulai dari fondasi. Tulis schema dulu, ambil tipenya dengan `infer` — jangan menulis tipe dua kali.

```ts
// types/produk.ts
import { z } from 'zod'

export const KategoriSchema = z.enum(['elektronik', 'pakaian', 'makanan'])
export type Kategori = z.infer<typeof KategoriSchema>

export const ProdukSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  nama: z.string().min(1),
  harga: z.number().positive(),
  kategori: KategoriSchema,
  stok: z.number().int().nonnegative(),
  deskripsi: z.string().optional(),
})
export type Produk = z.infer<typeof ProdukSchema>

export const ProdukInputSchema = ProdukSchema.omit({ id: true, slug: true })
export type ProdukInput = z.infer<typeof ProdukInputSchema>
```

```ts
// types/api.ts
import { z } from 'zod'

export type ApiResponse<T> = {
  data: T
  pesan: string
  sukses: boolean
}

export type Paginated<T> = {
  items: T[]
  total: number
  halaman: number
  perHalaman: number
}

export function apiResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: item,
    pesan: z.string(),
    sukses: z.boolean(),
  })
}
```

| Tipe | Kegunaan |
|---|---|
| `Produk` | Entity lengkap dari API |
| `ProdukInput` | Data form (tanpa `id`/`slug` — dibuat server) |
| `ApiResponse<T>` | Pembungkus response konsisten |
| `Paginated<T>` | Hasil list dengan metadata halaman |

---

## 21.4 🔌 Utility: `fetchJson<T>` & Validasi Env

```ts
// lib/api.ts
import { z } from 'zod'

export type Hasil<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number }

export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<Hasil<T>> {
  try {
    const res = await fetch(url, init)
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, status: res.status }

    const parsed = schema.safeParse(await res.json())
    if (!parsed.success) return { ok: false, error: 'Bentuk data tidak sesuai' }

    return { ok: true, data: parsed.data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Gagal terhubung' }
  }
}
```

```ts
// lib/env.ts
import { z } from 'zod'

const EnvSchema = z.object({
  VITE_API_URL: z.string().url(),
})

export const env = EnvSchema.parse(import.meta.env)
// env.VITE_API_URL bertipe string — sudah divalidasi
```

> 💡 **Prinsip yang sama seperti Bab 12:** data dari luar (API & env)
> divalidasi sekali di pintu masuk, lalu seluruh aplikasi memakai tipe
> yang sudah bersih tanpa cek `undefined` berulang.

---

## 21.5 🪝 Hooks Generik

**`useLocalStorage<T>`** — menyimpan state bertipe ke localStorage:

```ts
// hooks/useLocalStorage.ts
import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, awal: T) {
  const [nilai, setNilai] = useState<T>(() => {
    try {
      const tersimpan = localStorage.getItem(key)
      return tersimpan ? (JSON.parse(tersimpan) as T) : awal
    } catch {
      return awal
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(nilai))
  }, [key, nilai])

  return [nilai, setNilai] as const   // tuple: [T, setter]
}
```

**`useDebounce<T>`** — menunda nilai sampai berhenti berubah:

```ts
// hooks/useDebounce.ts
import { useEffect, useState } from 'react'

export function useDebounce<T>(nilai: T, delay = 400): T {
  const [tertunda, setTertunda] = useState(nilai)

  useEffect(() => {
    const timer = setTimeout(() => setTertunda(nilai), delay)
    return () => clearTimeout(timer)
  }, [nilai, delay])

  return tertunda
}
```

**`useFetch<T>`** — pola `State<T>` dari Bab 6:

```ts
// hooks/useFetch.ts
import { useEffect, useState } from 'react'
import type { z } from 'zod'
import { fetchJson } from '@/lib/api'

export type State<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T }

export function useFetch<T>(url: string, schema: z.ZodType<T>) {
  const [state, setState] = useState<State<T>>({ status: 'loading' })

  useEffect(() => {
    let aktif = true
    setState({ status: 'loading' })

    fetchJson(url, schema).then((hasil) => {
      if (!aktif) return
      setState(
        hasil.ok
          ? { status: 'success', data: hasil.data }
          : { status: 'error', message: hasil.error },
      )
    })

    return () => {
      aktif = false
    }
  }, [url, schema])

  return state
}
```

| Hook | Generik | Manfaat |
|---|---|---|
| `useLocalStorage<T>` | Tipe nilai tersimpan | Tidak perlu `as` saat membaca |
| `useDebounce<T>` | Tipe nilai apa pun | Search input tanpa spam request |
| `useFetch<T>` | Tipe hasil API | State loading/error/success aman |

---

## 21.6 🧩 Komponen UI & `DataTable<T>`

**Komponen dasar** — props sempit dan jelas:

```tsx
// components/ui/Button.tsx
import type { ComponentProps, ReactNode } from 'react'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost'
  children: ReactNode
}

export function Button({ variant = 'primary', children, ...rest }: ButtonProps) {
  return (
    <button data-variant={variant} {...rest}>
      {children}
    </button>
  )
}
```

**`DataTable<T>`** — satu tabel untuk semua entity:

```tsx
// components/DataTable.tsx
type Kolom<T> = {
  kunci: keyof T
  judul: string
  render?: (nilai: T[keyof T], baris: T) => React.ReactNode
}

type DataTableProps<T> = {
  data: T[]
  kolom: Kolom<T>[]
  kunciBaris: (baris: T) => string | number
}

export function DataTable<T>({ data, kolom, kunciBaris }: DataTableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {kolom.map((k) => (
            <th key={String(k.kunci)}>{k.judul}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((baris) => (
          <tr key={kunciBaris(baris)}>
            {kolom.map((k) => (
              <td key={String(k.kunci)}>
                {k.render ? k.render(baris[k.kunci], baris) : String(baris[k.kunci])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

Pemakaian untuk produk:

```tsx
<DataTable
  data={produk}
  kunciBaris={(p) => p.id}
  kolom={[
    { kunci: 'nama', judul: 'Nama' },
    { kunci: 'harga', judul: 'Harga', render: (h) => formatRupiah(h as number) },
    { kunci: 'stok', judul: 'Stok' },
  ]}
/>
```

---

## 21.7 🛒 Versi React: Katalog & Keranjang

State keranjang paling cocok memakai `useReducer` + discriminated union (Bab 6 & 14):

```tsx
// features/keranjang/reducer.ts
import type { Produk } from '@/types/produk'

export type ItemKeranjang = { produk: Produk; jumlah: number }

export type Aksi =
  | { type: 'tambah'; produk: Produk }
  | { type: 'kurangi'; id: number }
  | { type: 'hapus'; id: number }
  | { type: 'kosongkan' }

export function reducer(state: ItemKeranjang[], aksi: Aksi): ItemKeranjang[] {
  switch (aksi.type) {
    case 'tambah': {
      const ada = state.find((i) => i.produk.id === aksi.produk.id)
      if (ada) {
        return state.map((i) =>
          i.produk.id === aksi.produk.id ? { ...i, jumlah: i.jumlah + 1 } : i,
        )
      }
      return [...state, { produk: aksi.produk, jumlah: 1 }]
    }
    case 'kurangi':
      return state
        .map((i) => (i.produk.id === aksi.id ? { ...i, jumlah: i.jumlah - 1 } : i))
        .filter((i) => i.jumlah > 0)
    case 'hapus':
      return state.filter((i) => i.produk.id !== aksi.id)
    case 'kosongkan':
      return []
  }
}
```

Halaman katalog dengan search + debounce:

```tsx
function HalamanKatalog() {
  const [cari, setCari] = useState('')
  const cariTertunda = useDebounce(cari, 400)
  const state = useFetch(`/api/produk?q=${encodeURIComponent(cariTertunda)}`, ProdukListSchema)
  const [keranjang, dispatch] = useReducer(reducer, [], () => {
    const simpan = localStorage.getItem('keranjang')
    return simpan ? (JSON.parse(simpan) as ItemKeranjang[]) : []
  })

  useEffect(() => {
    localStorage.setItem('keranjang', JSON.stringify(keranjang))
  }, [keranjang])

  if (state.status === 'loading') return <p>Memuat...</p>
  if (state.status === 'error') return <p role="alert">{state.message}</p>

  return (
    <>
      <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari produk..." />
      <DataTable
        data={state.data}
        kunciBaris={(p) => p.id}
        kolom={[
          { kunci: 'nama', judul: 'Nama' },
          { kunci: 'harga', judul: 'Harga', render: (h) => formatRupiah(h as number) },
        ]}
      />
      <p>Item di keranjang: {keranjang.reduce((n, i) => n + i.jumlah, 0)}</p>
      <button onClick={() => dispatch({ type: 'kosongkan' })}>Kosongkan</button>
    </>
  )
}
```

---

## 21.8 ▲ Versi Next.js: Halaman, Metadata & Route Handler

**Halaman detail dinamis** (`app/produk/[slug]/page.tsx`) — `params` adalah Promise di Next.js 15+:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProdukSchema } from '@/types/produk'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const produk = await ambilProduk(slug)
  if (!produk) return { title: 'Produk tidak ditemukan' }
  return {
    title: `${produk.nama} — Toko Saya`,
    description: produk.deskripsi ?? `Beli ${produk.nama} dengan harga terbaik.`,
    alternates: { canonical: `/produk/${slug}` },
  }
}

export default async function DetailProduk({ params }: Props) {
  const { slug } = await params
  const produk = await ambilProduk(slug)
  if (!produk) notFound()
  return <Detail produk={produk} />
}
```

**Route Handler** (`app/api/produk/route.ts`) — body divalidasi sebelum masuk:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { ProdukInputSchema } from '@/types/produk'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const halaman = Number(req.nextUrl.searchParams.get('halaman') ?? '1')
  const hasil = await cariProduk(q, halaman)
  return NextResponse.json({ data: hasil, pesan: 'OK', sukses: true })
}

export async function POST(req: NextRequest) {
  const parsed = ProdukInputSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, pesan: 'Data tidak valid', sukses: false, issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const produk = await buatProduk(parsed.data)
  return NextResponse.json({ data: produk, pesan: 'Dibuat', sukses: true }, { status: 201 })
}
```

---

## 21.9 ⚡ Server Action + Form Tervalidasi

```ts
// app/produk/actions.ts
'use server'

import { ProdukInputSchema, type Produk } from '@/types/produk'
import { revalidatePath } from 'next/cache'

export type SimpanState =
  | { success: true; data: Produk }
  | { success: false; errors: Record<string, string[]> }

export async function simpanProduk(
  _prev: SimpanState | null,
  formData: FormData,
): Promise<SimpanState> {
  const parsed = ProdukInputSchema.safeParse({
    ...Object.fromEntries(formData),
    harga: Number(formData.get('harga')),
    stok: Number(formData.get('stok')),
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const produk = await buatProduk(parsed.data)
  revalidatePath('/produk')
  return { success: true, data: produk }
}
```

```tsx
'use client'
import { useActionState } from 'react'
import { simpanProduk, type SimpanState } from './actions'

export function FormProduk() {
  const [state, action, pending] = useActionState<SimpanState | null, FormData>(
    simpanProduk,
    null,
  )

  const err = (f: string) =>
    state?.success === false ? state.errors[f]?.[0] : undefined

  return (
    <form action={action}>
      <input name="nama" placeholder="Nama" />
      {err('nama') && <span className="error">{err('nama')}</span>}

      <input name="harga" type="number" placeholder="Harga" />
      {err('harga') && <span className="error">{err('harga')}</span>}

      <input name="stok" type="number" placeholder="Stok" />
      {err('stok') && <span className="error">{err('stok')}</span>}

      <select name="kategori">
        <option value="elektronik">Elektronik</option>
        <option value="pakaian">Pakaian</option>
        <option value="makanan">Makanan</option>
      </select>

      <button disabled={pending}>{pending ? 'Menyimpan...' : 'Simpan'}</button>
    </form>
  )
}
```

---

## 21.10 🧹 Bersihkan `any`, Jalankan `tsc` & Lint

Langkah terakhir — dan yang paling menentukan kualitas jangka panjang:

```bash
# 1. Cari semua any yang tersisa
npx tsc --noEmit

# 2. Cari any secara eksplisit
grep -rn ": any" src --include="*.ts" --include="*.tsx"

# 3. Lint
npx eslint src --ext .ts,.tsx

# 4. Build
npm run build
```

**CI minimal** (`.github/workflows/ci.yml`):

```yaml
name: CI
on: [push, pull_request]
jobs:
  cek:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint src --ext .ts,.tsx
      - run: npm run build
```

| Langkah | Menangkap |
|---|---|
| `tsc --noEmit` | Error tipe di seluruh project |
| ESLint | `any` implisit, variabel tak terpakai, aturan tim |
| `npm run build` | Error integrasi Next.js (batas server/client) |
| `grep ": any"` | `any` eksplisit yang lolos review |

---

## 21.11 ✅ Definition of Done

Tandai project selesai jika semua poin berikut terpenuhi:

| Kriteria | Bukti |
|---|---|
| Semua data eksternal divalidasi | `grep -r "as Produk"` kosong; semua lewat `safeParse`/`parse` |
| Tidak ada `any` | `grep -rn ": any"` kosong |
| `strict: true` | `tsconfig.json` |
| `tsc --noEmit` lulus | CI hijau |
| Komponen UI bertipe | `Button`, `Input`, `Card`, `DataTable<T>` |
| Hooks generik dipakai | `useLocalStorage<T>`, `useDebounce<T>`, `useFetch<T>` |
| State keranjang aman | `useReducer` + `Aksi` discriminated union |
| Next.js page & metadata | `params: Promise<...>`, `generateMetadata` |
| Server Action tervalidasi | Zod + `useActionState` + error per field |
| CI berjalan | `tsc` + ESLint + build |

---

## 📊 Ringkasan Struktur Final

```
🔷 EBOOK TYPESCRIPT — DARI JAVASCRIPT KE REACT & NEXT.JS
│
├── 🟢 BAGIAN I    — Fondasi TypeScript                  Bab 1  – 3
│   ├── Bab 1  ─ Mengenal TypeScript
│   ├── Bab 2  ─ Setup & Konfigurasi
│   └── Bab 3  ─ Tipe Dasar
│
├── 🔵 BAGIAN II   — Fungsi, Object & Tipe Gabungan      Bab 4  – 6
│   ├── Bab 4  ─ Fungsi di TypeScript
│   ├── Bab 5  ─ Object, type & interface ⭐
│   └── Bab 6  ─ Union, Intersection & Narrowing ⭐
│
├── 🟡 BAGIAN III  — Generics & Utility Types            Bab 7  – 9
│   ├── Bab 7  ─ Generics ⭐
│   ├── Bab 8  ─ Utility Types
│   └── Bab 9  ─ Tipe Lanjutan yang Sering Muncul
│
├── 🟠 BAGIAN IV   — Class, Module & Data Asinkron       Bab 10 – 12
│   ├── Bab 10 ─ Class & OOP di TypeScript
│   ├── Bab 11 ─ Module & Deklarasi Tipe
│   └── Bab 12 ─ Async, Error & Validasi Runtime (Zod)
│
├── 🔴 BAGIAN V    — TypeScript untuk React              Bab 13 – 15
│   ├── Bab 13 ─ Typing Komponen, Props & Event
│   ├── Bab 14 ─ Typing Hooks ⭐
│   └── Bab 15 ─ Pola Lanjutan di React + TS
│
├── 🟣 BAGIAN VI   — TypeScript untuk Next.js            Bab 16 – 18
│   ├── Bab 16 ─ Typing App Router
│   ├── Bab 17 ─ Server Actions & Data Bertipe
│   └── Bab 18 ─ Fetching, Environment & Konfigurasi
│
├── ⚫ BAGIAN VII  — Debugging, Migrasi & Best Practices Bab 19 – 20
│   ├── Bab 19 ─ Membaca & Memperbaiki Error TypeScript
│   └── Bab 20 ─ Migrasi JS → TS & Best Practices
│
└── 🏆 BAGIAN VIII — Project Praktik                     Bab 21
    └── Bab 21 ─ Aplikasi Katalog Bertipe (React + Next.js)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total    :  8 Bagian  |  21 Bab
Prasyarat:  JavaScript dasar (variabel, fungsi, array, object, async)
Fokus    :  TypeScript yang dipakai di React & Next.js
Stack    :  TypeScript 5 · React 18 · Next.js (App Router) · Zod
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ Checklist Bab 21

- **Tipe inti** — schema Zod sebagai sumber kebenaran; tipe diambil dengan `z.infer`, tanpa duplikasi.
- **`fetchJson<T>`** — HTTP + validasi schema + `Result`; dipakai semua data fetching.
- **Env divalidasi** — gagal cepat saat startup, bukan saat request berjalan.
- **Hooks generik** — `useLocalStorage<T>`, `useDebounce<T>`, `useFetch<T>`; tidak terikat satu entity.
- **`DataTable<T>`** — satu komponen untuk semua entity; kolom diketik dengan `keyof T`.
- **Keranjang** — `useReducer` + discriminated union `Aksi`; state mustahil tidak bisa terjadi.
- **Next.js page** — `params` Promise (15+), `generateMetadata`, `notFound()`.
- **Route Handler** — `NextRequest`/`NextResponse`; body divalidasi sebelum dipakai.
- **Server Action** — Zod + `useActionState` + error per field + `revalidatePath`.
- **Kualitas** — `tsc --noEmit`, ESLint, build di CI; tidak ada `any` dan tidak ada `as` pada data eksternal.

---

🎉 **Selamat!** Anda telah menyelesaikan Ebook TypeScript — dari JavaScript menuju React & Next.js yang bertipe kuat. Kembali ke [Beranda](/).
