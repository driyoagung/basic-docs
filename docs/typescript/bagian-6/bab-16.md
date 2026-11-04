---
title: "Bab 16 — Typing App Router"
---

# 📖 Bab 16 — Typing App Router

Bagian VI dimulai: Next.js App Router. Di framework ini, TypeScript menyusup ke file-file konvensi yang bentuknya sudah ditentukan framework — `page.tsx`, `layout.tsx`, `error.tsx`, `route.ts` — dan Next.js menyediakan tipe bawaan untuk semuanya. Ada satu perubahan besar yang harus Anda ingat tegas: sejak **Next.js 15**, `params` dan `searchParams` adalah **Promise** yang harus di-`await`, bukan object biasa seperti di Next.js 14 ke bawah. Menyalin tutorial lama tanpa menyesuaikan ini akan langsung memicu error `tsc`. Bab ini memetakan tipe di setiap konvensi App Router yang akan Anda pakai sehari-hari.

---

## 16.1 📄 Page dengan `params` & `searchParams`

Contoh paling penting di bab ini — dynamic route `app/blog/[slug]/page.tsx`:

```tsx
// app/blog/[slug]/page.tsx
type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BlogPage({ params }: Props) {
  const { slug } = await params   // Next.js 15+: params adalah Promise
  return <h1>{slug}</h1>
}
```

Perbedaan versi — hal yang paling sering membingungkan saat migrasi:

| Konsep | Next.js 14 ke bawah | Next.js 15 ke atas |
|---|---|---|
| `params` di page/layout | Object biasa `{ slug: string }` | `Promise<{ slug: string }>` — wajib `await` |
| `searchParams` | Object biasa | `Promise<...>` — wajib `await` |
| Cara baca | `props.params.slug` | `(await params).slug` |
| Dampak streaming | Data harus siap sebelum render | Halaman bisa stream, params menyusul |

**Penjelasan:**

- **`type Props` ditulis sendiri** — dengan mengetik `params` sebagai `Promise<{ slug: string }>`, hasil `await params` bertipe presisi `{ slug: string }`.
- **`searchParams` dengan index signature** — query string bisa berisi kunci apa pun; nilainya bisa string tunggal (`?q=budi`) atau array (`?tag=a&tag=b`), karenanya `string | string[] | undefined`.
- **`async function`** — page App Router boleh async; di Next.js 15 Anda hampir selalu async karena harus `await params`.

Membaca `searchParams` dengan aman:

```tsx
export default async function CariPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q : ''
  const tag = Array.isArray(sp.tag) ? sp.tag : sp.tag ? [sp.tag] : []

  return <HasilCari q={q} tag={tag} />
}
```

> ⚠️ **Perhatikan versi Next.js Anda.** Di Next.js 14 ke bawah, `params`
> adalah object biasa — `await params` justru error. Di Next.js 15 ke atas,
> `params` adalah Promise — lupa `await` membuat `slug` bertipe `Promise`,
> bukan `string`. Pastikan mengikuti versi yang Anda pakai. Bila ragu,
> cek dokumentasi tipe yang di-generate di `.next/types`.

---

## 16.2 🧱 Layout & `children`

Layout membungkus halaman di bawahnya. Tipenya sederhana: `children` bertipe `React.ReactNode`.

```tsx
// app/layout.tsx
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
```

Layout yang juga punya `params` (mis. `app/[locale]/layout.tsx`):

```tsx
type LayoutProps = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params
  return <div data-locale={locale}>{children}</div>
}
```

| File | Props yang tersedia | Tipe |
|---|---|---|
| `layout.tsx` | `children` | `React.ReactNode` |
| `layout.tsx` (dynamic) | `children`, `params` | `ReactNode`, `Promise<...>` |
| `template.tsx` | `children` | `ReactNode` |

**`ReactNode` vs `ReactElement`:**

- **`ReactNode`** — apa pun yang bisa dirender: elemen, string, number, array, `null`, `undefined`. Ini yang dipakai `children` di 99% kasus.
- **`ReactElement`** — hanya elemen React (`<div />`), tidak termasuk string/`null`.

```tsx
// ❌ terlalu sempit — string dan null tidak boleh
function Card({ children }: { children: React.ReactElement }) { /* ... */ }

// ✅ benar
function Card({ children }: { children: React.ReactNode }) { /* ... */ }
```

---

## 16.3 🏷️ Metadata & `generateMetadata`

Metadata statis memakai object bertipe `Metadata`:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Beranda — Toko Saya',
  description: 'Belanja kebutuhan harian dengan mudah',
  openGraph: { type: 'website', locale: 'id_ID' },
}
```

Metadata dinamis memakai `generateMetadata`, yang bisa async dan menerima `params` (Promise di Next 15+):

```tsx
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const post = await ambilPost(slug)

  return {
    title: post.judul,
    description: post.ringkasan,
    alternates: { canonical: `/blog/${slug}` },
  }
}
```

| Kebutuhan | Alat | Return type |
|---|---|---|
| Metadata tetap | `export const metadata` | `Metadata` |
| Metadata dari data | `generateMetadata` | `Promise<Metadata>` |
| Metadata per segmen | `metadata` di `layout.tsx` | `Metadata` |

> 💡 **Tips SEO:** tipe `Metadata` akan menolak properti yang tidak dikenal.
> Ini menyelamatkan Anda dari typo seperti `openGraph` ditulis `openGraphs`
> yang diam-diam tidak berefek apa pun.

---

## 16.4 ⏳ `loading.tsx` & `🚨 error.tsx`

Dua file konvensi yang membuat UI terasa cepat dan tahan gagal.

**`loading.tsx`** — ditampilkan otomatis selama segmen menunggu data (Suspense boundary bawaan):

```tsx
// app/blog/loading.tsx
export default function Loading() {
  return <p>Memuat artikel...</p>
}
```

**`error.tsx`** — menangkap error runtime di segmen; **wajib** Client Component (`'use client'`):

```tsx
// app/blog/error.tsx
'use client'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBlog({ error, reset }: ErrorProps) {
  return (
    <div role="alert">
      <h2>Terjadi kesalahan</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Coba lagi</button>
    </div>
  )
}
```

| File | Props | Catatan |
|---|---|---|
| `loading.tsx` | — | Server Component; ditampilkan saat suspense |
| `error.tsx` | `error: Error & { digest?: string }`, `reset: () => void` | Wajib `'use client'` |
| `not-found.tsx` | — | Ditampilkan oleh `notFound()` |

`digest` adalah ID error yang di-generate server — berguna untuk korelasi dengan log server tanpa membocorkan detail internal ke client.

---

## 16.5 🔌 Route Handler

Route Handler (`app/api/.../route.ts`) memakai tipe `NextRequest` dan `NextResponse`:

```ts
// app/api/produk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const ProdukSchema = z.object({
  nama: z.string().min(1),
  harga: z.number().positive(),
})

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const produk = await cariProduk(q)
  return NextResponse.json({ data: produk })
}

export async function POST(req: NextRequest) {
  const mentah: unknown = await req.json()
  const parsed = ProdukSchema.safeParse(mentah)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Data tidak valid', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const produk = await buatProduk(parsed.data)
  return NextResponse.json({ data: produk }, { status: 201 })
}
```

Route dengan params dinamis (`app/api/produk/[id]/route.ts`):

```ts
type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params        // Next.js 15+
  return NextResponse.json({ data: await ambilProduk(Number(id)) })
}
```

| Tipe | Asal | Kegunaan |
|---|---|---|
| `NextRequest` | `next/server` | `nextUrl`, `cookies`, `json()` |
| `NextResponse` | `next/server` | `json()`, `redirect()`, set cookie |
| `{ params: Promise<...> }` | argumen kedua | Dynamic route (Next 15+) |

---

## 16.6 🔀 Server vs Client Component

Ini konsep yang paling sering disalahpahami saat mengetik props.

```tsx
// Server Component (default) — boleh async, boleh akses DB langsung
async function DaftarProduk() {
  const produk = await db.produk.findMany()
  return <ProdukGrid produk={produk} />
}
```

```tsx
// Client Component — wajib 'use client', tidak boleh async
'use client'

type ProdukGridProps = {
  produk: Produk[]          // harus serializable
  onPilih: (id: number) => void  // ❌ fungsi TIDAK boleh dikirim dari server
}

export function ProdukGrid({ produk }: ProdukGridProps) {
  const [pilih, setPilih] = useState<number | null>(null)
  return (
    <ul>
      {produk.map((p) => (
        <li key={p.id} onClick={() => setPilih(p.id)}>{p.nama}</li>
      ))}
    </ul>
  )
}
```

Aturan props lintas batas server → client:

| Boleh dikirim? | Tipe |
|---|---|
| ✅ | `string`, `number`, `boolean`, `null`, `undefined` |
| ✅ | Array & object dari nilai di atas |
| ✅ | `Date` (di-serialize Next.js) |
| ❌ | Fungsi, class instance, `Map`, `Set`, symbol |

> ⚠️ **Error klasik:** mengirim `onClick={() => ...}` dari Server Component
> ke Client Component. Itu tidak mungkin karena fungsi tidak bisa
> diserialisasi. Solusinya: buat handler di dalam Client Component
> (seperti contoh `ProdukGrid` di atas) atau gunakan Server Action (Bab 17).

---

## 16.7 🔗 `next/link`, `useRouter`, `useSearchParams`

Tipe navigasi bawaan Next.js sudah lengkap — Anda tinggal memakainya.

```tsx
import Link from 'next/link'

<Link href="/produk/1">Detail</Link>
```

```tsx
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function Filter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const q = searchParams.get('q') ?? ''

  function ubah(qBaru: string) {
    const params = new URLSearchParams(searchParams)
    if (qBaru) params.set('q', qBaru)
    else params.delete('q')
    router.push(`${pathname}?${params.toString()}`)
  }

  return <input defaultValue={q} onChange={(e) => ubah(e.target.value)} />
}
```

| Hook | Return type | Catatan |
|---|---|---|
| `useRouter()` | `AppRouterInstance` | `push`, `replace`, `refresh`, `back` |
| `usePathname()` | `string` | Path saat ini |
| `useSearchParams()` | `ReadonlyURLSearchParams` | `.get()` mengembalikan `string \| null` |
| `useParams()` | `Record<string, string \| string[]>` | Params route saat ini |

**Typed routes (opsional):** dengan `experimental.typedRoutes: true` di `next.config.ts`, `href` divalidasi terhadap route yang benar-benar ada:

```ts
// next.config.ts
import type { NextConfig } from 'next'
const config: NextConfig = {
  experimental: { typedRoutes: true },
}
export default config
```

Dengan ini, `<Link href="/prodku" />` (typo) langsung error compile.

---

## ✅ Checklist Bab 16

- **`params` & `searchParams`** — Promise di Next.js 15+, object biasa di 14 ke bawah; selalu `await` sesuai versi.
- **`searchParams`** — nilainya `string | string[] | undefined`; normalisasi sebelum dipakai.
- **`children`** — `React.ReactNode` (bukan `ReactElement`) untuk layout dan komponen pembungkus.
- **`Metadata`** — `export const metadata` untuk statis, `generateMetadata` async untuk dinamis.
- **`error.tsx`** — wajib `'use client'`; props `error: Error & { digest?: string }` dan `reset`.
- **Route Handler** — `NextRequest`/`NextResponse`; body divalidasi sebelum dipakai.
- **Batas Server → Client** — props harus serializable; fungsi tidak boleh dikirim dari Server Component.
- **Navigasi** — `useRouter`, `usePathname`, `useSearchParams`; `.get()` mengembalikan `string | null`.
- **Typed routes** — `experimental.typedRoutes` memvalidasi `href` saat compile.

---

⏭️ Lanjut ke [⚡ Bab 17 — Server Actions & Data Bertipe](/bagian-6/bab-17) untuk melanjutkan!
