# ▲ Ebook Next.js 14 — From React to Full Stack
### Panduan Lengkap App Router · Server Components · Full Stack · Project Blog CMS

---

> 🎯 **Posisi Ebook Ini**
> Ebook ini adalah **kelanjutan langsung dari ebook React** yang sudah Anda miliki.
> Asumsinya: Anda sudah paham React (component, props, state, hooks, useEffect).
> Di sini kita tidak mengulang dasar React — kita langsung fokus pada
> **apa yang membuat Next.js berbeda dan lebih powerful dari React biasa.**

---

> 🔄 **Next.js vs React — Perbedaan Mendasar**
>
> | Aspek | React (Ebook Sebelumnya) | Next.js (Ebook Ini) |
> |---|---|---|
> | **Jenis** | Library UI | Full Stack Framework |
> | **Rendering** | Client-Side (CSR) | SSR, SSG, ISR, CSR |
> | **Routing** | Butuh React Router | Built-in (File-based) |
> | **SEO** | ❌ Sulit | ✅ Sangat baik |
> | **Backend/API** | ❌ Tidak ada | ✅ API Routes bawaan |
> | **Performa awal** | Lambat (JS dulu) | Cepat (HTML langsung) |
> | **Image optimization** | Manual | ✅ `<Image>` bawaan |
> | **Font optimization** | Manual | ✅ `next/font` bawaan |
> | **Deploy** | Static hosting | Vercel / Server |
> | **Data fetching** | `useEffect` + fetch | `async/await` di Server |

---

> 🧰 **Tech Stack yang Digunakan**
>
> | Tool | Versi | Fungsi |
> |---|---|---|
> | **Next.js** | 14.x | Full Stack Framework |
> | **React** | 18.x | UI Library (bawaan Next.js) |
> | **TypeScript** | 5.x | Type safety (opsional tapi direkomendasikan) |
> | **Tailwind CSS** | 3.x | Styling |
> | **Prisma** | 5.x | ORM untuk database |
> | **PostgreSQL / SQLite** | Latest | Database |
> | **NextAuth.js** | 5.x | Autentikasi |
> | **Vercel** | - | Deployment platform |

---

## 🗺️ Peta Perjalanan Belajar

```
🟢 BAGIAN I    Dari React ke Next.js              → Bab 1  – 3
🔵 BAGIAN II   App Router — Routing & Layout       → Bab 4  – 6
🟡 BAGIAN III  Rendering Strategies               → Bab 7  – 9
🟠 BAGIAN IV   Data Fetching & Database            → Bab 10 – 12
🔴 BAGIAN V    API Routes & Server Actions         → Bab 13 – 15
🟣 BAGIAN VI   Autentikasi & Otorisasi             → Bab 16 – 17
⚫ BAGIAN VII  Optimasi & Performa                 → Bab 18 – 19
🎯 BAGIAN VIII Deployment & CI/CD                 → Bab 20
🏆 BAGIAN IX   Project: Blog CMS Full Stack        → Bab 21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 9 Bagian | 21 Bab | React Dev → Next.js Full Stack
```

---

## ⭐ Bab Paling Kritis — Jangan Sampai Dilewati!

> ⚠️ **Empat konsep ini adalah yang paling sering membingungkan developer
> yang pindah dari React ke Next.js. Kuasai keempatnya sebelum lanjut.**

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 7** — Server vs Client Component | Konsep paling baru & paling membingungkan — fondasi App Router |
| 🥈 | **Bab 4** — App Router & File Convention | Routing Next.js bekerja sangat berbeda dari React Router |
| 🥉 | **Bab 10** — Data Fetching di Server | Cara fetch data berubah total dari `useEffect` |
| 🏅 | **Bab 13** — Server Actions | Cara Next.js menggantikan REST API untuk form & mutasi data |

---

## 🎯 Mengapa Next.js Setelah React?

> 💡 **Analogi Sederhana:**
> React adalah **mesin mobil** — powerful tapi Anda perlu rakit sendiri
> kemudi, ban, bodi, dan sistemnya. Next.js adalah **mobil siap pakai**
> yang sudah dilengkapi GPS (routing), AC (optimasi), dan SIM card (API) —
> mesinnya tetap React, tapi semua pelengkapnya sudah tersedia.

### Masalah React yang Dipecahkan Next.js

```
❌ MASALAH DI REACT MURNI:
├── SEO buruk — Google kesulitan baca konten (JavaScript harus dijalankan dulu)
├── Performa awal lambat — user lihat halaman kosong dulu
├── Routing harus setup manual (React Router)
├── Tidak ada backend — harus buat Express/Laravel terpisah
├── Image tidak otomatis dioptimasi
├── Tidak ada code splitting otomatis
└── Deployment lebih rumit

✅ SEMUA DIPECAHKAN NEXT.JS:
├── SSR/SSG → HTML sudah jadi saat dikirim ke browser → SEO ✅
├── Server Components → Render di server → Halaman muncul instan ✅
├── File-based routing → Buat file = buat halaman ✅
├── API Routes + Server Actions → Backend dalam satu project ✅
├── <Image> component → Auto compress, lazy load, WebP ✅
├── Automatic code splitting → Hanya load JS yang dibutuhkan ✅
└── Deploy ke Vercel → Satu klik ✅
```

---

---

# 🟢 BAGIAN I — Dari React ke Next.js

> 🎯 **Tujuan:** Memahami apa yang berubah saat beralih dari React ke Next.js,
> setup project pertama, dan memahami struktur folder yang baru.

---

## 📖 Bab 1 — Mengenal Next.js & Ekosistemnya

---

### 1.1 🏗️ Sejarah & Evolusi Next.js

```
Next.js 1-9   → Pages Router, SSR dasar
Next.js 10-12 → Image optimization, ISR, Middleware
Next.js 13    → ⭐ App Router diperkenalkan (beta)
               → React Server Components
               → Layouts, Loading, Error UI
Next.js 14    → ✅ App Router stable & direkomendasikan
               → Server Actions stable
               → Partial Prerendering (experimental)
Next.js 15    → React 19 support, caching improvements
```

---

### 1.2 🌐 Ekosistem Next.js

```
NEXT.JS ECOSYSTEM
│
├── Core
│   ├── App Router        → Routing berbasis file
│   ├── Server Components → Render di server (React 18+)
│   ├── Client Components → Render di browser
│   ├── Server Actions    → Mutasi data dari server
│   └── Middleware        → Intercept request
│
├── Built-in Optimizations
│   ├── next/image        → Optimasi gambar otomatis
│   ├── next/font         → Optimasi font (zero layout shift)
│   ├── next/link         → Prefetching otomatis
│   └── next/script       → Load script third-party optimal
│
├── Data Layer
│   ├── Prisma            → ORM (paling populer dengan Next.js)
│   ├── Drizzle ORM       → Alternatif ringan
│   └── Direct fetch      → Untuk REST API eksternal
│
└── Auth & Deploy
    ├── NextAuth.js (Auth.js) → Autentikasi lengkap
    ├── Clerk               → Auth as a Service
    └── Vercel              → Deploy platform resmi
```

---

### 1.3 📊 Kapan Pilih Next.js vs React Biasa?

| Skenario | Pilihan | Alasan |
|---|---|---|
| Landing page produk | ✅ **Next.js** | SEO penting, performa awal kritis |
| Blog / artikel | ✅ **Next.js** | SEO sangat penting |
| E-commerce | ✅ **Next.js** | SEO produk + performa |
| Dashboard admin internal | React / Next.js | SEO tidak penting, tapi Next.js tetap lebih praktis |
| Aplikasi mobile (React Native) | React Native | Platform berbeda |
| Prototype cepat | React | Setup lebih mudah untuk eksperimen |

> 💡 **Kesimpulan Praktis:**
> Jika Anda membangun sesuatu untuk internet yang butuh SEO atau
> performa — pilih Next.js. Jika React sudah ada di project lama,
> Next.js bisa diadopsi secara bertahap.

---

### 1.4 🆚 Pages Router vs App Router — Mana yang Harus Dipelajari?

```
Pages Router (Lama — Next.js < 13)     App Router (Baru — Next.js 13+)
─────────────────────────────          ────────────────────────────────
pages/                                 app/
├── index.js      → /                  ├── page.tsx         → /
├── blog/                              ├── blog/
│   └── [slug].js → /blog/:slug        │   └── [slug]/
└── api/                               │       └── page.tsx  → /blog/:slug
    └── posts.js  → /api/posts         └── api/
                                           └── posts/
                                               └── route.ts  → /api/posts

getServerSideProps()  → fetch di server   fetch() async di Server Component
getStaticProps()      → build time data   generateStaticParams()
useRouter()           → navigasi          useRouter() dari 'next/navigation'
```

> ⚠️ **Ebook Ini Fokus ke App Router.**
> Pages Router masih didukung tapi tidak aktif dikembangkan.
> Semua fitur baru Next.js hanya ada di App Router.

---

## 📖 Bab 2 — Setup Project & Struktur Folder

---

### 2.1 🚀 Membuat Project Next.js

```bash
# Buat project baru dengan create-next-app
npx create-next-app@latest blog-cms

# Pilihan yang disarankan untuk ebook ini:
# ✔ Would you like to use TypeScript? → Yes
# ✔ Would you like to use ESLint? → Yes
# ✔ Would you like to use Tailwind CSS? → Yes
# ✔ Would you like to use `src/` directory? → No
# ✔ Would you like to use App Router? → Yes ← WAJIB
# ✔ Would you like to customize the import alias? → No

cd blog-cms
npm run dev
# Buka: http://localhost:3000
```

---

### 2.2 🗂️ Anatomi Folder Next.js App Router

```
blog-cms/
│
├── 📁 app/                      ← ⭐ INTI dari App Router
│   ├── 📄 layout.tsx            ← Root layout (wraps semua halaman)
│   ├── 📄 page.tsx              ← Halaman: /
│   ├── 📄 loading.tsx           ← UI loading otomatis
│   ├── 📄 error.tsx             ← UI error otomatis
│   ├── 📄 not-found.tsx         ← Halaman 404
│   │
│   ├── 📁 blog/                 ← Route: /blog
│   │   ├── 📄 page.tsx          ← Halaman: /blog
│   │   └── 📁 [slug]/           ← Dynamic route
│   │       └── 📄 page.tsx      ← Halaman: /blog/judul-artikel
│   │
│   ├── 📁 dashboard/            ← Route: /dashboard
│   │   ├── 📄 layout.tsx        ← Layout khusus dashboard
│   │   ├── 📄 page.tsx          ← Halaman: /dashboard
│   │   └── 📁 posts/
│   │       └── 📄 page.tsx      ← Halaman: /dashboard/posts
│   │
│   └── 📁 api/                  ← API Routes
│       └── 📁 posts/
│           └── 📄 route.ts      ← API: /api/posts
│
├── 📁 components/               ← Komponen reusable
│   ├── 📁 ui/                   ← Komponen UI generik
│   └── 📁 blog/                 ← Komponen domain blog
│
├── 📁 lib/                      ← Utility & konfigurasi
│   ├── 📄 db.ts                 ← Koneksi Prisma
│   ├── 📄 auth.ts               ← Konfigurasi NextAuth
│   └── 📄 utils.ts              ← Helper functions
│
├── 📁 prisma/
│   └── 📄 schema.prisma         ← Schema database
│
├── 📄 middleware.ts             ← Middleware Next.js
├── 📄 next.config.js            ← Konfigurasi Next.js
├── 📄 tailwind.config.ts        ← Konfigurasi Tailwind
└── 📄 .env.local                ← Environment variables
```

> 💡 **Perbedaan Besar dari React:**
> Di React, Anda buat routing dengan `<Route path="/blog">`.
> Di Next.js, cukup **buat folder dan file** — routing terjadi otomatis!
> `app/blog/page.tsx` → otomatis jadi halaman `/blog`.

---

### 2.3 ⚙️ File Konfigurasi Penting

```typescript
// next.config.js — Konfigurasi Next.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Domain gambar yang diizinkan
      },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
}

module.exports = nextConfig
```

```ini
# .env.local — Variabel environment (JANGAN commit ke Git!)
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random-secret-string"
```

---

### 2.4 🔧 Script yang Sering Dipakai

```bash
npm run dev      # Development server (http://localhost:3000)
npm run build    # Build untuk production
npm run start    # Jalankan production build
npm run lint     # Cek kode dengan ESLint

# Prisma
npx prisma init          # Inisialisasi Prisma
npx prisma db push       # Sinkronkan schema ke database
npx prisma migrate dev   # Buat dan jalankan migration
npx prisma studio        # GUI database di browser
npx prisma generate      # Generate Prisma Client
```

---

## 📖 Bab 3 — Perbedaan Konsep: React vs Next.js

---

### 3.1 🔄 Yang Berubah dari React

```tsx
// ===== REACT (yang sudah Anda tahu) =====

// Semua komponen adalah Client Component
// Data fetching pakai useEffect
import { useState, useEffect } from 'react'

function BlogList() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}
```

```tsx
// ===== NEXT.JS App Router (cara baru) =====

// Server Component — fetch data langsung, tanpa useEffect!
// Tidak perlu useState, tidak ada loading state manual
async function BlogList() {
  // Ini berjalan di SERVER — aman akses database langsung!
  const posts = await fetch('https://api.example.com/posts')
  const data  = await posts.json()

  return (
    <ul>
      {data.map((post: Post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

// Atau langsung query database:
async function BlogList() {
  const posts = await prisma.post.findMany() // Langsung ke DB!

  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}
```

---

### 3.2 📋 Tabel Perubahan Konsep Lengkap

| React (Lama) | Next.js App Router (Baru) | Catatan |
|---|---|---|
| `useEffect` untuk fetch | `async/await` di komponen | Di Server Component |
| `useState` untuk loading | `loading.tsx` file | Otomatis |
| React Router `<Route>` | Struktur folder/file | File-based routing |
| `react-helmet` untuk SEO | `export const metadata` | Built-in |
| Error boundary manual | `error.tsx` file | Otomatis |
| Semua komponen = client | Server & Client Component | Konsep baru! |
| API terpisah (Express) | `route.ts` / Server Actions | Built-in |
| `useNavigate()` | `useRouter()` dari `next/navigation` | Beda import! |
| `<img>` biasa | `<Image>` dari `next/image` | Optimasi otomatis |
| `<a>` biasa | `<Link>` dari `next/link` | Prefetch otomatis |

---

### 3.3 🧠 Mental Model Baru yang Harus Dibiasakan

```
Di React: SEMUA komponen = JavaScript di browser (client)

Di Next.js App Router:
┌─────────────────────────────────────────────────────┐
│                    SERVER                           │
│  ┌──────────────────────────────────────────────┐  │
│  │         Server Components (default)          │  │
│  │  - Bisa fetch data langsung                  │  │
│  │  - Bisa akses database                       │  │
│  │  - TIDAK bisa: useState, useEffect, onClick  │  │
│  │  - Tidak ada JavaScript di browser           │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │ Kirim HTML
                        ▼
┌─────────────────────────────────────────────────────┐
│                   BROWSER                           │
│  ┌──────────────────────────────────────────────┐  │
│  │    'use client' → Client Components          │  │
│  │  - Bisa: useState, useEffect, event handlers │  │
│  │  - TIDAK bisa: akses database langsung       │  │
│  │  - Ada JavaScript di browser                 │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

---

# 🔵 BAGIAN II — App Router: Routing & Layout

> 🎯 **Tujuan:** Menguasai sistem routing Next.js yang berbasis file —
> dari route sederhana hingga nested layout yang kompleks.

---

## 📖 Bab 4 — File Convention & Routing System

---

### 4.1 📄 File Convention — File Khusus Next.js

Di App Router, setiap file dengan nama tertentu punya fungsi khusus:

```
app/
├── layout.tsx      ← Wraps semua halaman di dalam folder ini
├── page.tsx        ← ⭐ Konten halaman — INI yang jadi halaman!
├── loading.tsx     ← Tampil otomatis saat page sedang load
├── error.tsx       ← Tampil otomatis saat ada error
├── not-found.tsx   ← Tampil saat notFound() dipanggil
├── template.tsx    ← Seperti layout tapi re-mount setiap navigasi
├── default.tsx     ← Fallback untuk Parallel Routes
└── route.ts        ← API endpoint (bukan halaman!)
```

---

### 4.2 🛣️ Jenis-jenis Route

```
STATIC ROUTE
app/about/page.tsx          → /about
app/contact/page.tsx        → /contact
app/blog/page.tsx           → /blog

DYNAMIC ROUTE
app/blog/[slug]/page.tsx    → /blog/apa-saja
app/user/[id]/page.tsx      → /user/123

CATCH-ALL ROUTE
app/docs/[...slug]/page.tsx → /docs/apa/saja/seberapa/dalam

OPTIONAL CATCH-ALL
app/[[...slug]]/page.tsx    → / DAN /apa/saja

ROUTE GROUPS (tidak mempengaruhi URL!)
app/(marketing)/page.tsx    → /        (bukan /marketing)
app/(marketing)/about/page.tsx → /about
app/(dashboard)/settings/page.tsx → /settings

PARALLEL ROUTES
app/@modal/page.tsx         → Render bersamaan dengan page utama

INTERCEPTING ROUTES
app/blog/(..)photo/page.tsx → Intercept navigasi ke /photo
```

---

### 4.3 🔗 Dynamic Routes — Detail

```tsx
// app/blog/[slug]/page.tsx

// Params diterima via props
interface Props {
  params: { slug: string }
  searchParams: { [key: string]: string | undefined }
}

export default async function BlogDetailPage({ params, searchParams }: Props) {
  const { slug } = params
  // URL: /blog/cara-belajar-nextjs → slug = "cara-belajar-nextjs"

  const post = await prisma.post.findUnique({
    where: { slug }
  })

  if (!post) {
    notFound() // Tampilkan halaman not-found.tsx
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}

// Generate static paths saat build time (untuk SSG)
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    select: { slug: true }
  })

  return posts.map(post => ({ slug: post.slug }))
}
```

---

### 4.4 🔍 Search Params — Query String

```tsx
// URL: /blog?page=2&kategori=tutorial&q=nextjs
// app/blog/page.tsx

interface Props {
  searchParams: {
    page?:      string
    kategori?:  string
    q?:         string
  }
}

export default async function BlogPage({ searchParams }: Props) {
  const halaman  = Number(searchParams.page ?? '1')
  const kategori = searchParams.kategori
  const keyword  = searchParams.q

  const posts = await prisma.post.findMany({
    where: {
      ...(kategori && { category: { slug: kategori } }),
      ...(keyword  && { title: { contains: keyword, mode: 'insensitive' } }),
      published: true,
    },
    skip:  (halaman - 1) * 10,
    take:  10,
    orderBy: { createdAt: 'desc' },
  })

  return <PostList posts={posts} />
}
```

---

## 📖 Bab 5 — Layouts, Loading & Error UI

---

### 5.1 🖼️ Layout — Shared UI Antar Halaman

```tsx
// app/layout.tsx — ROOT LAYOUT (wajib ada!)
// Wraps SEMUA halaman di aplikasi

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

// Metadata untuk SEO — berlaku di semua halaman
export const metadata: Metadata = {
  title: {
    default:  'Blog CMS',
    template: '%s | Blog CMS', // Setiap halaman bisa override %s
  },
  description: 'Platform blog modern dengan Next.js',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

```tsx
// app/dashboard/layout.tsx — NESTED LAYOUT
// Hanya untuk halaman di dalam /dashboard

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  // Proteksi route — redirect jika belum login
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

---

### 5.2 ⏳ Loading UI — Automatic Loading State

```tsx
// app/blog/loading.tsx
// Tampil OTOMATIS saat page.tsx sedang fetch data

export default function BlogLoading() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Skeleton loader */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-48 rounded-lg mb-3" />
          <div className="bg-gray-200 h-4 rounded mb-2" />
          <div className="bg-gray-200 h-4 w-2/3 rounded" />
        </div>
      ))}
    </div>
  )
}
```

---

### 5.3 🚨 Error UI — Automatic Error Handling

```tsx
// app/blog/error.tsx
// Tampil OTOMATIS saat ada error di page.tsx
// Harus 'use client' karena pakai event handler

'use client'

import { useEffect } from 'react'

export default function BlogError({
  error,
  reset, // Fungsi untuk coba load ulang
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error ke monitoring service (Sentry, dll)
    console.error(error)
  }, [error])

  return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        Terjadi Kesalahan
      </h2>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg"
      >
        Coba Lagi
      </button>
    </div>
  )
}
```

---

## 📖 Bab 6 — Navigasi & Link

---

### 6.1 🔗 Komponen `<Link>` — Navigasi Client-Side

```tsx
import Link from 'next/link'

// Link dasar — prefetch otomatis saat muncul di viewport!
<Link href="/blog">Blog</Link>

// Link dengan dynamic route
<Link href={`/blog/${post.slug}`}>
  {post.title}
</Link>

// Link dengan query params
<Link href={{ pathname: '/blog', query: { kategori: 'tutorial', page: 2 } }}>
  Tutorial — Halaman 2
</Link>
// Menghasilkan: /blog?kategori=tutorial&page=2

// Link dengan opsi tambahan
<Link
  href="/blog"
  prefetch={false}        // Nonaktifkan prefetch
  replace                 // Replace history, bukan push
  scroll={false}          // Jangan scroll ke atas saat navigasi
>
  Blog
</Link>

// Active link — cek dengan usePathname()
'use client'
import { usePathname } from 'next/navigation'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={isActive ? 'font-bold text-blue-600' : 'text-gray-600'}
    >
      {children}
    </Link>
  )
}
```

---

### 6.2 🧭 Navigasi Programmatic

```tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function SearchForm() {
  const router        = useRouter()
  const pathname      = usePathname()       // URL saat ini tanpa query
  const searchParams  = useSearchParams()   // Query params saat ini

  function handleSearch(keyword: string) {
    const params = new URLSearchParams(searchParams)

    if (keyword) {
      params.set('q', keyword)
    } else {
      params.delete('q')
    }

    // Navigasi ke URL baru
    router.push(`${pathname}?${params.toString()}`)

    // Atau replace (tidak tambah history)
    // router.replace(`${pathname}?${params.toString()}`)
  }

  function kembali() {
    router.back()   // Kembali ke halaman sebelumnya
    router.forward() // Maju ke halaman berikutnya
    router.refresh() // Refresh data server component
  }

  return <input onChange={e => handleSearch(e.target.value)} />
}
```

---

---

# 🟡 BAGIAN III — Rendering Strategies

> 🎯 **Tujuan:** Memahami kapan dan bagaimana Next.js merender halaman —
> ini adalah konsep terpenting yang membedakan Next.js dari React.

---

## 📖 Bab 7 — Server Components vs Client Components

---

### 7.1 🖥️ Server Components — Default di App Router

```tsx
// app/blog/page.tsx
// Tidak ada 'use client' → ini adalah Server Component

// ✅ Server Component BISA:
// - async/await langsung di komponen
// - Akses database, file system, environment variables
// - Fetch data tanpa expose ke browser
// - Akses backend resources langsung

import { prisma } from '@/lib/db'

async function BlogPage() {
  // Ini berjalan di server — user tidak bisa lihat query ini
  const posts = await prisma.post.findMany({
    where:   { published: true },
    orderBy: { createdAt: 'desc' },
    include: { author: true, category: true },
  })

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>Oleh: {post.author.name}</p>
        </article>
      ))}
    </div>
  )
}

// ❌ Server Component TIDAK BISA:
// - useState, useEffect, useRef, useContext
// - onClick, onChange, dan event handlers lain
// - window, document, localStorage
// - Hooks React lainnya
```

---

### 7.2 💻 Client Components — Saat Butuh Interaktivitas

```tsx
// components/SearchBar.tsx
'use client' // ← Directive ini WAJIB untuk Client Component

// ✅ Client Component BISA:
// - useState, useEffect, dan semua hooks React
// - Event handlers (onClick, onChange, dll)
// - Browser APIs (window, localStorage, dll)
// - Real-time updates

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const [keyword, setKeyword]         = useState('')
  const [isPending, startTransition]  = useTransition()
  const router                        = useRouter()

  function handleSearch(value: string) {
    setKeyword(value)
    startTransition(() => {
      router.push(`/blog?q=${value}`)
    })
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={keyword}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Cari artikel..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      {isPending && <span className="absolute right-3 top-3">⏳</span>}
    </div>
  )
}
```

---

### 7.3 🎯 Strategi: Kapan Pakai Yang Mana?

```
Butuh data dari database?          → Server Component
Butuh API key yang sensitif?       → Server Component
Tidak ada interaktivitas?          → Server Component (lebih efisien)
Konten statis / SEO penting?       → Server Component

Butuh useState / useEffect?        → Client Component
Butuh event handler (onClick)?     → Client Component
Butuh akses browser API?           → Client Component
Butuh real-time updates?           → Client Component
```

---

### 7.4 🪆 Komposisi Server & Client Component

```tsx
// ✅ POLA YANG BENAR:
// Server Component sebagai wrapper, Client Component di dalam

// app/blog/page.tsx (Server Component)
import BlogList    from '@/components/BlogList'    // Server Component
import SearchBar   from '@/components/SearchBar'   // Client Component
import LikeButton  from '@/components/LikeButton'  // Client Component

async function BlogPage() {
  const posts = await prisma.post.findMany() // Di server

  return (
    <div>
      {/* Client Component menerima data dari server via props */}
      <SearchBar />

      {/* Server Component — render di server */}
      <BlogList posts={posts} />
    </div>
  )
}

// ❌ POLA YANG SALAH:
// Jangan import Server Component di dalam Client Component!
'use client'
import ServerComponent from './ServerComponent' // ❌ Akan jadi Client Component!
```

---

## 📖 Bab 8 — SSR, SSG, ISR — Strategi Rendering

---

### 8.1 🔄 SSR — Server-Side Rendering

HTML dibuat di server **setiap kali ada request**.
Cocok untuk konten yang sering berubah atau personal.

```tsx
// app/dashboard/page.tsx
// SSR: Data selalu fresh setiap request

import { cookies, headers } from 'next/headers'

async function DashboardPage() {
  // Akses request-specific data → otomatis SSR
  const cookieStore = cookies()
  const token       = cookieStore.get('token')

  const stats = await fetch('https://api.example.com/stats', {
    cache: 'no-store',  // ← Jangan cache → SSR setiap request
    headers: { Authorization: `Bearer ${token?.value}` }
  })

  const data = await stats.json()

  return <Dashboard data={data} />
}
```

---

### 8.2 🏗️ SSG — Static Site Generation

HTML dibuat **saat build time** — sangat cepat, cocok untuk blog!

```tsx
// app/blog/[slug]/page.tsx
// SSG: Build semua halaman saat npm run build

// Ini memberitahu Next.js halaman mana yang harus di-build
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    select: { slug: true },
    where:  { published: true },
  })

  return posts.map(post => ({ slug: post.slug }))
  // Next.js akan build: /blog/post-1, /blog/post-2, dst.
}

async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug }
  })

  // Data di-fetch saat BUILD, bukan saat request!
  return <PostContent post={post} />
}
```

---

### 8.3 ⚡ ISR — Incremental Static Regeneration

Gabungan SSG + SSR — build waktu pertama, **regenerasi otomatis** setelah interval tertentu.
**Ini yang paling cocok untuk blog!**

```tsx
// app/blog/page.tsx

async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: {
      revalidate: 3600, // ← Regenerasi setiap 1 jam (3600 detik)
    }
  })

  // Atau dengan Prisma — gunakan revalidatePath / revalidateTag
  const posts2 = await prisma.post.findMany()

  return <PostList posts={posts2} />
}

// Revalidasi on-demand saat post baru dibuat
import { revalidatePath, revalidateTag } from 'next/cache'

async function buatPost(data: PostData) {
  await prisma.post.create({ data })
  revalidatePath('/blog')        // Refresh halaman /blog
  revalidatePath('/blog/[slug]', 'page') // Refresh semua detail post
  revalidateTag('posts')          // Refresh semua fetch dengan tag 'posts'
}
```

---

### 8.4 📊 Kapan Pakai Strategi Mana?

| Strategi | Kapan | Contoh |
|---|---|---|
| **SSG** | Konten jarang berubah, SEO penting | Halaman statis, docs |
| **ISR** | Konten berubah tapi tidak real-time | Blog, e-commerce catalog |
| **SSR** | Konten personal atau selalu fresh | Dashboard, profil user |
| **CSR** | Konten tidak perlu SEO, sangat dinamis | Chat, live dashboard |

---

## 📖 Bab 9 — Metadata & SEO

---

### 9.1 📋 Static Metadata

```tsx
// app/blog/page.tsx
import type { Metadata } from 'next'

// Metadata statis — ditulis langsung
export const metadata: Metadata = {
  title:       'Semua Artikel',
  description: 'Kumpulan artikel tentang teknologi dan programming.',
  keywords:    ['Next.js', 'React', 'JavaScript', 'Tutorial'],
  authors:     [{ name: 'Tim Blog CMS' }],

  // Open Graph — untuk preview di media sosial
  openGraph: {
    title:       'Semua Artikel — Blog CMS',
    description: 'Kumpulan artikel tentang teknologi dan programming.',
    url:         'https://blogcms.com/blog',
    siteName:    'Blog CMS',
    images: [{
      url:    'https://blogcms.com/og-blog.jpg',
      width:  1200,
      height: 630,
      alt:    'Blog CMS',
    }],
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card:        'summary_large_image',
    title:       'Semua Artikel',
    description: 'Kumpulan artikel teknologi',
    images:      ['https://blogcms.com/og-blog.jpg'],
  },

  // Robots — instruksi untuk search engine crawler
  robots: {
    index:            true,
    follow:           true,
    googleBot: {
      index:          true,
      follow:         true,
      'max-image-preview': 'large',
    },
  },
}
```

---

### 9.2 🔄 Dynamic Metadata — Per Halaman

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

// generateMetadata dipanggil untuk buat metadata dinamis per halaman
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where:   { slug: params.slug },
    include: { author: true },
  })

  if (!post) return { title: 'Artikel Tidak Ditemukan' }

  return {
    title:       post.title,
    description: post.excerpt ?? post.content.slice(0, 160),
    authors:     [{ name: post.author.name }],
    openGraph: {
      title:     post.title,
      images:    post.coverImage ? [{ url: post.coverImage }] : [],
      type:      'article',
      publishedTime: post.createdAt.toISOString(),
    },
    alternates: {
      canonical: `https://blogcms.com/blog/${post.slug}`,
    },
  }
}
```

---

### 9.3 🗺️ Sitemap & Robots.txt

```tsx
// app/sitemap.ts — Sitemap otomatis

import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.post.findMany({
    where:  { published: true },
    select: { slug: true, updatedAt: true },
  })

  const postUrls = posts.map(post => ({
    url:          `https://blogcms.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority:     0.8,
  }))

  return [
    { url: 'https://blogcms.com', lastModified: new Date(), priority: 1 },
    { url: 'https://blogcms.com/blog', lastModified: new Date(), priority: 0.9 },
    ...postUrls,
  ]
}
```

```tsx
// app/robots.ts — robots.txt otomatis

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules:   { userAgent: '*', allow: '/', disallow: '/dashboard/' },
    sitemap: 'https://blogcms.com/sitemap.xml',
  }
}
```

---

---

# 🟠 BAGIAN IV — Data Fetching & Database

> 🎯 **Tujuan:** Memahami cara Next.js mengambil dan mengelola data —
> dari fetch API biasa hingga koneksi database langsung dengan Prisma.

---

## 📖 Bab 10 — Data Fetching di Next.js

---

### 10.1 🔄 Fetch API dengan Caching

```tsx
// Next.js mengextend fetch() bawaan dengan opsi caching

// ① Cache selamanya (SSG behavior)
const data = await fetch('https://api.example.com/posts', {
  cache: 'force-cache' // Default!
})

// ② Tidak cache sama sekali (SSR behavior)
const data = await fetch('https://api.example.com/posts', {
  cache: 'no-store'
})

// ③ Revalidate setiap N detik (ISR behavior)
const data = await fetch('https://api.example.com/posts', {
  next: { revalidate: 3600 } // 1 jam
})

// ④ Revalidate berdasarkan tag
const data = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] }
})

// Invalidasi manual berdasarkan tag
import { revalidateTag } from 'next/cache'
revalidateTag('posts') // Refresh semua fetch dengan tag 'posts'
```

---

### 10.2 ⚡ Parallel & Sequential Fetching

```tsx
// ❌ Sequential — lambat! (total: 300ms + 400ms = 700ms)
async function BlogPage() {
  const user  = await fetchUser()     // 300ms
  const posts = await fetchPosts()    // 400ms (mulai setelah user selesai)
  // Total: 700ms
}

// ✅ Parallel — cepat! (total: max(300ms, 400ms) = 400ms)
async function BlogPage() {
  const [user, posts] = await Promise.all([
    fetchUser(),   // 300ms  ┐ Mulai bersamaan!
    fetchPosts(),  // 400ms  ┘
  ])
  // Total: 400ms — hampir 2x lebih cepat!
}
```

---

## 📖 Bab 11 — Prisma ORM — Database di Next.js

---

### 11.1 🔧 Setup Prisma

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(AUTHOR)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  excerpt     String?
  content     String
  coverImage  String?
  published   Boolean   @default(false)
  publishedAt DateTime?
  views       Int       @default(0)
  author      User      @relation(fields: [authorId], references: [id])
  authorId    String
  category    Category  @relation(fields: [categoryId], references: [id])
  categoryId  String
  tags        Tag[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Category {
  id    String @id @default(cuid())
  name  String
  slug  String @unique
  posts Post[]
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}

enum Role {
  ADMIN
  AUTHOR
  READER
}
```

```bash
# Generate Prisma Client & push ke database
npx prisma generate
npx prisma db push
# atau
npx prisma migrate dev --name init
```

---

### 11.2 🔌 Setup Prisma Client

```typescript
// lib/db.ts
// Singleton pattern — penting untuk Next.js!
// Tanpa ini, setiap hot reload membuat koneksi baru → koneksi habis!

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

### 11.3 🔍 Query Prisma yang Sering Dipakai

```typescript
// READ
const posts = await prisma.post.findMany({
  where:   { published: true, authorId: userId },
  orderBy: { createdAt: 'desc' },
  take:    10,
  skip:    20, // Pagination: skip 20, ambil 10
  include: {
    author:   { select: { name: true, email: true } }, // Hanya field tertentu
    category: true,
    tags:     true,
  },
  select: { // Alternatif include — pilih field yang diambil
    id: true, title: true, slug: true, publishedAt: true,
  }
})

// Hitung total untuk pagination
const total = await prisma.post.count({ where: { published: true } })

// SEARCH
const results = await prisma.post.findMany({
  where: {
    OR: [
      { title:   { contains: keyword, mode: 'insensitive' } },
      { content: { contains: keyword, mode: 'insensitive' } },
    ],
  },
})

// CREATE
const post = await prisma.post.create({
  data: {
    title,
    slug:     slugify(title),
    content,
    author:   { connect: { id: authorId } },
    category: { connect: { id: categoryId } },
    tags:     { connect: tagIds.map(id => ({ id })) },
  },
})

// UPDATE
const updated = await prisma.post.update({
  where: { id: postId },
  data:  { title, content, published: true, publishedAt: new Date() },
})

// DELETE
await prisma.post.delete({ where: { id: postId } })

// TRANSACTION
const [post, _] = await prisma.$transaction([
  prisma.post.create({ data: postData }),
  prisma.user.update({ where: { id: authorId }, data: { postCount: { increment: 1 } } }),
])
```

---

## 📖 Bab 12 — State Management di Next.js

---

### 12.1 🗄️ Zustand — State Management Ringan

```bash
npm install zustand
```

```typescript
// stores/useCartStore.ts — Contoh untuk blog: bookmark artikel
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BookmarkStore {
  bookmarks: string[]         // Array of post IDs
  addBookmark:    (id: string) => void
  removeBookmark: (id: string) => void
  isBookmarked:   (id: string) => boolean
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (id) =>
        set(state => ({ bookmarks: [...state.bookmarks, id] })),

      removeBookmark: (id) =>
        set(state => ({ bookmarks: state.bookmarks.filter(b => b !== id) })),

      isBookmarked: (id) => get().bookmarks.includes(id),
    }),
    { name: 'bookmarks-storage' } // Persist ke localStorage
  )
)
```

```tsx
// components/BookmarkButton.tsx
'use client'
import { useBookmarkStore } from '@/stores/useBookmarkStore'

export default function BookmarkButton({ postId }: { postId: string }) {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarkStore()
  const saved = isBookmarked(postId)

  return (
    <button onClick={() => saved ? removeBookmark(postId) : addBookmark(postId)}>
      {saved ? '🔖 Tersimpan' : '📌 Simpan'}
    </button>
  )
}
```

---

---

# 🔴 BAGIAN V — API Routes & Server Actions

> 🎯 **Tujuan:** Membangun backend langsung di Next.js —
> baik via REST API Routes maupun Server Actions yang lebih modern.

---

## 📖 Bab 13 — API Routes (Route Handlers)

---

### 13.1 🔌 Membuat API Route

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/posts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page    = Number(searchParams.get('page')  ?? '1')
    const limit   = Number(searchParams.get('limit') ?? '10')
    const keyword = searchParams.get('q') ?? ''

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          published: true,
          ...(keyword && { title: { contains: keyword, mode: 'insensitive' } }),
        },
        orderBy: { publishedAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
        include: { author: { select: { name: true } }, category: true },
      }),
      prisma.post.count({ where: { published: true } }),
    ])

    return NextResponse.json({
      data:       posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data post' },
      { status: 500 }
    )
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, categoryId } = body

    // Validasi
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title dan content wajib diisi' },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug:    slugify(title),
        content,
        authorId:   'user-id-dari-session',
        categoryId,
      },
    })

    return NextResponse.json(post, { status: 201 })

  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat post' }, { status: 500 })
  }
}
```

```typescript
// app/api/posts/[id]/route.ts
// GET, PUT, DELETE untuk satu post

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await prisma.post.findUnique({ where: { id: params.id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const post = await prisma.post.update({
    where: { id: params.id },
    data:  body,
  })
  return NextResponse.json(post)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.post.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Post berhasil dihapus' })
}
```

---

## 📖 Bab 14 — Server Actions — Cara Modern Mutasi Data

---

### 14.1 🎯 Apa itu Server Actions?

> 💡 **Server Actions adalah game changer!**
> Bayangkan bisa submit form dan langsung update database
> **tanpa perlu membuat API Route terpisah**.
> Server Actions menjalankan fungsi di server langsung dari form atau event handler.

```
Cara Lama (React + Express):
Form submit → fetch('/api/posts', { method: 'POST' }) → API Route → Database

Cara Baru (Server Actions):
Form submit → Server Action → Database (API Route tidak perlu!)
```

---

### 14.2 📝 Server Actions untuk Form

```tsx
// app/dashboard/posts/new/page.tsx
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'

// Definisikan Server Action
async function buatPost(formData: FormData) {
  'use server' // ← Directive ini WAJIB untuk Server Action

  const title   = formData.get('title') as string
  const content = formData.get('content') as string

  // Validasi
  if (!title || title.length < 3) {
    throw new Error('Judul minimal 3 karakter')
  }

  // Langsung simpan ke database — tidak perlu API!
  await prisma.post.create({
    data: {
      title,
      slug:     title.toLowerCase().replace(/ /g, '-'),
      content,
      authorId: 'current-user-id',
    }
  })

  revalidatePath('/blog')         // Refresh halaman blog
  revalidatePath('/dashboard/posts') // Refresh daftar post di dashboard
  redirect('/dashboard/posts')    // Redirect setelah berhasil
}

export default function NewPostPage() {
  return (
    // action={buatPost} → Ketika form submit, Server Action dipanggil
    <form action={buatPost} className="space-y-4">
      <input name="title" placeholder="Judul artikel" required />
      <textarea name="content" placeholder="Konten artikel" rows={10} required />
      <button type="submit">Publikasikan</button>
    </form>
  )
}
```

---

### 14.3 🔄 Server Actions dengan useFormState & useFormStatus

```tsx
// actions/post.actions.ts — Pisahkan Server Actions ke file sendiri
'use server'

import { z } from 'zod' // Validasi schema

// Schema validasi dengan Zod
const PostSchema = z.object({
  title:      z.string().min(3, 'Judul minimal 3 karakter').max(100),
  excerpt:    z.string().max(200).optional(),
  content:    z.string().min(10, 'Konten minimal 10 karakter'),
  categoryId: z.string().min(1, 'Pilih kategori'),
  published:  z.boolean().default(false),
})

type ActionState = {
  errors?: { [key: string]: string[] }
  message?: string
  success?: boolean
}

export async function createPost(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Validasi
  const validasi = PostSchema.safeParse({
    title:      formData.get('title'),
    excerpt:    formData.get('excerpt'),
    content:    formData.get('content'),
    categoryId: formData.get('categoryId'),
    published:  formData.get('published') === 'on',
  })

  if (!validasi.success) {
    return {
      errors:  validasi.error.flatten().fieldErrors,
      message: 'Gagal. Periksa kembali data Anda.',
    }
  }

  try {
    await prisma.post.create({
      data: {
        ...validasi.data,
        slug:     slugify(validasi.data.title),
        authorId: 'current-user-id',
      }
    })

    revalidatePath('/blog')
    return { success: true, message: 'Artikel berhasil dipublikasikan!' }

  } catch {
    return { message: 'Terjadi kesalahan server.' }
  }
}
```

```tsx
// app/dashboard/posts/new/page.tsx — Form dengan status & error
'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { createPost } from '@/actions/post.actions'

// Submit button yang tahu status form
function SubmitButton() {
  const { pending } = useFormStatus() // Otomatis tahu apakah form sedang submit
  return (
    <button type="submit" disabled={pending}>
      {pending ? '⏳ Menyimpan...' : '💾 Simpan Artikel'}
    </button>
  )
}

export default function NewPostForm() {
  const [state, dispatch] = useFormState(createPost, {})

  return (
    <form action={dispatch}>
      {state.message && (
        <div className={state.success ? 'text-green-600' : 'text-red-600'}>
          {state.message}
        </div>
      )}

      <div>
        <input name="title" placeholder="Judul" />
        {state.errors?.title && (
          <p className="text-red-500 text-sm">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <textarea name="content" placeholder="Konten" rows={10} />
        {state.errors?.content && (
          <p className="text-red-500 text-sm">{state.errors.content[0]}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  )
}
```

---

## 📖 Bab 15 — Middleware Next.js

---

### 15.1 🔒 Middleware — Intercept Setiap Request

```typescript
// middleware.ts — Di root project (sejajar dengan app/)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ① Proteksi route dashboard
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req: request })

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname) // Simpan tujuan awal
      return NextResponse.redirect(loginUrl)
    }

    // Cek role — hanya admin yang bisa akses /dashboard/settings
    if (pathname.startsWith('/dashboard/settings') && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ② Redirect /admin ke /dashboard
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ③ Tambahkan custom header
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)
  return response
}

// Tentukan path mana yang diproses middleware (lebih efisien!)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

---

# 🟣 BAGIAN VI — Autentikasi & Otorisasi

> 🎯 **Tujuan:** Implementasi sistem autentikasi yang lengkap dan aman
> menggunakan NextAuth.js — login, register, session, dan proteksi route.

---

## 📖 Bab 16 — NextAuth.js (Auth.js)

---

### 16.1 🔧 Setup NextAuth

```bash
npm install next-auth@beta @auth/prisma-adapter
```

```typescript
// lib/auth.ts — Konfigurasi NextAuth

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    // ① Login dengan Google OAuth
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ② Login dengan email + password
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user?.password) return null

        const passwordCocok = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        return passwordCocok ? user : null
      },
    }),
  ],

  callbacks: {
    // Tambahkan data custom ke session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id   = token.sub!
        session.user.role = token.role as string
      }
      return session
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
  },

  pages: {
    signIn: '/login',         // Halaman login custom
    error:  '/auth/error',    // Halaman error auth
  },

  session: { strategy: 'jwt' },
})
```

```typescript
// app/api/auth/[...nextauth]/route.ts — Route handler NextAuth
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

---

### 16.2 🔐 Menggunakan Auth di Komponen

```tsx
// Di Server Component — gunakan auth() langsung
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function DashboardPage() {
  const session = await auth()

  if (!session) redirect('/login')

  return <div>Halo, {session.user?.name}!</div>
}

// Di Client Component — gunakan useSession()
'use client'
import { useSession, signIn, signOut } from 'next-auth/react'

function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <span>Loading...</span>

  if (session) {
    return (
      <div>
        <img src={session.user?.image ?? ''} alt="Avatar" />
        <span>{session.user?.name}</span>
        <button onClick={() => signOut()}>Logout</button>
      </div>
    )
  }

  return <button onClick={() => signIn('google')}>Login dengan Google</button>
}
```

---

## 📖 Bab 17 — Otorisasi & Role-Based Access

---

### 17.1 🛡️ Role-Based Access Control

```typescript
// lib/auth-utils.ts — Helper untuk cek otorisasi

import { auth } from './auth'
import { redirect } from 'next/navigation'

// Pastikan user sudah login
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return session
}

// Pastikan user adalah admin
export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'ADMIN') redirect('/dashboard')
  return session
}

// Pastikan user adalah author atau admin
export async function requireAuthor() {
  const session = await requireAuth()
  if (!['ADMIN', 'AUTHOR'].includes(session.user.role)) {
    redirect('/dashboard')
  }
  return session
}
```

```tsx
// Penggunaan di page
async function AdminSettingsPage() {
  const session = await requireAdmin() // Redirect otomatis jika bukan admin

  return <div>Settings untuk admin: {session.user.name}</div>
}
```

---

---

# ⚫ BAGIAN VII — Optimasi & Performa

> 🎯 **Tujuan:** Membuat aplikasi Next.js yang cepat, efisien,
> dan memberikan pengalaman pengguna yang excellent.

---

## 📖 Bab 18 — Optimasi Gambar, Font & Script

---

### 18.1 🖼️ Komponen `<Image>` — Optimasi Otomatis

```tsx
import Image from 'next/image'

// ✅ Gambar dengan ukuran tetap
<Image
  src="/images/hero.jpg"
  alt="Hero banner"
  width={1200}
  height={630}
  priority       // Load duluan (untuk gambar above the fold)
  quality={85}   // Kualitas 85% (default 75)
/>

// ✅ Gambar yang mengisi container (responsive)
<div className="relative h-64 w-full">
  <Image
    src={post.coverImage}
    alt={post.title}
    fill                        // Isi seluruh container
    className="object-cover"    // CSS object-fit
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    // sizes membantu browser pilih ukuran gambar yang tepat
  />
</div>

// Gambar dari URL eksternal (harus didaftarkan di next.config.js)
<Image
  src="https://images.unsplash.com/photo-xyz"
  alt="External image"
  width={800}
  height={400}
/>
```

---

### 18.2 🔤 Optimasi Font — Zero Layout Shift

```tsx
// app/layout.tsx

import { Inter, Merriweather } from 'next/font/google'
import localFont from 'next/font/local'

// Google Font — diunduh saat build, tidak ada request ke Google saat runtime
const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter', // CSS variable untuk Tailwind
  display:  'swap',
})

// Font untuk artikel (serif)
const merriweather = Merriweather({
  weight:   ['400', '700'],
  subsets:  ['latin'],
  variable: '--font-merriweather',
})

// Font lokal — dari file di project
const customFont = localFont({
  src:      './fonts/CustomFont.woff2',
  variable: '--font-custom',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="font-sans"> {/* Pakai var(--font-inter) via Tailwind */}
        {children}
      </body>
    </html>
  )
}
```

---

## 📖 Bab 19 — Caching, Suspense & Streaming

---

### 19.1 💨 Streaming dengan Suspense

```tsx
// Streaming: tampilkan konten yang sudah siap duluan
// Konten lambat muncul setelah siap — tidak blokir render!

import { Suspense } from 'react'

async function BlogPage() {
  return (
    <div>
      {/* Hero langsung tampil */}
      <HeroBanner />

      {/* PostList ditampilkan streaming — muncul saat data siap */}
      <Suspense fallback={<PostsSkeleton />}>
        <PostList />    {/* Ini async — fetch data dari DB */}
      </Suspense>

      {/* Sidebar tampil paralel dengan PostList */}
      <Suspense fallback={<SidebarSkeleton />}>
        <PopularPosts />
      </Suspense>
    </div>
  )
}
```

---

### 19.2 🔄 Request Memoization & Data Cache

```typescript
// Next.js otomatis memoize fetch() yang sama dalam satu request
// Tidak perlu React Query / SWR untuk Server Components!

// Ini dipanggil di dua tempat berbeda, tapi hanya SATU request ke database!
async function getUser(id: string) {
  return await prisma.user.findUnique({ where: { id } })
  // Jika dipanggil dua kali dengan id yang sama dalam satu render → hanya 1 query!
}

// Untuk fungsi non-fetch, gunakan cache() dari React
import { cache } from 'react'

const getPost = cache(async (slug: string) => {
  return await prisma.post.findUnique({ where: { slug } })
})
// Sekarang getPost('same-slug') hanya query ke DB sekali per request
```

---

---

# 🎯 BAGIAN VIII — Deployment & CI/CD

> 🎯 **Tujuan:** Deploy aplikasi Next.js ke production dengan benar
> dan setup pipeline yang memudahkan proses rilis.

---

## 📖 Bab 20 — Deploy ke Vercel & Best Practices

---

### 20.1 🚀 Deploy ke Vercel (Cara Termudah)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy ke production
vercel --prod
```

**Atau via GitHub:**
1. Push ke GitHub
2. Buka vercel.com → Import project
3. Hubungkan repo → Vercel otomatis build & deploy
4. Setiap push ke `main` → otomatis deploy ulang

---

### 20.2 ⚙️ Environment Variables di Vercel

```
Di Vercel Dashboard → Project → Settings → Environment Variables:

DATABASE_URL          = postgresql://... (Production DB)
NEXTAUTH_URL          = https://blogcms.vercel.app
NEXTAUTH_SECRET       = [generate dengan: openssl rand -base64 32]
GOOGLE_CLIENT_ID      = ...
GOOGLE_CLIENT_SECRET  = ...
```

---

### 20.3 📊 Checklist Sebelum Deploy Production

```
Performance:
☐ Semua gambar pakai <Image> component
☐ Font pakai next/font (bukan Google Fonts link)
☐ Strategi caching yang tepat (revalidate, tags)
☐ Parallel fetching dengan Promise.all

SEO:
☐ metadata di setiap page
☐ generateMetadata untuk halaman dinamis
☐ sitemap.ts ada
☐ robots.ts ada
☐ OpenGraph image untuk setiap halaman penting

Security:
☐ Environment variables tidak ada di kode
☐ API Routes ada validasi & autentikasi
☐ Server Actions ada validasi input
☐ Middleware proteksi route yang perlu auth

Database:
☐ Prisma connection pool dikonfigurasi
☐ Migration production sudah dijalankan
☐ Backup database ada
```

---

---

# 🏆 BAGIAN IX — Project: Blog CMS Full Stack

> 🎯 **Tujuan:** Terapkan **semua** yang dipelajari dalam satu project
> Blog CMS yang lengkap — dari frontend hingga backend, dari auth hingga deploy.

---

## 📖 Bab 21 — Project: Blog CMS dengan Next.js 14

---

### 21.1 🎯 Fitur yang Akan Dibangun

| Fitur | Teknologi |
|---|---|
| ✅ Halaman utama dengan featured posts | Server Components + Prisma |
| ✅ Daftar artikel dengan filter & search | SearchParams + Prisma |
| ✅ Detail artikel dengan MDX support | next-mdx-remote |
| ✅ Sitemap & robots.txt otomatis | Next.js built-in |
| ✅ SEO per halaman dengan OpenGraph | generateMetadata |
| ✅ Login Google + Email/Password | NextAuth.js |
| ✅ Dashboard penulis — CRUD artikel | Server Actions |
| ✅ Upload cover image | UploadThing / Cloudinary |
| ✅ Kategori & tag artikel | Prisma relations |
| ✅ Bookmark artikel (disimpan lokal) | Zustand + localStorage |
| ✅ Dark/Light mode | next-themes |
| ✅ Halaman admin — manage semua user | Role-based access |
| ✅ ISR — konten fresh tanpa rebuild penuh | revalidateTag |
| ✅ Deploy ke Vercel + Neon DB | Vercel + PostgreSQL |

---

### 21.2 📁 Struktur Project Final

```
blog-cms/
│
├── app/
│   ├── (public)/              ← Route group: halaman publik
│   │   ├── layout.tsx         ← Layout dengan Navbar & Footer
│   │   ├── page.tsx           ← Homepage: /
│   │   ├── blog/
│   │   │   ├── page.tsx       ← Daftar artikel: /blog
│   │   │   └── [slug]/
│   │   │       └── page.tsx   ← Detail artikel: /blog/:slug
│   │   └── kategori/
│   │       └── [slug]/
│   │           └── page.tsx   ← Artikel per kategori
│   │
│   ├── (auth)/                ← Route group: halaman auth
│   │   ├── login/page.tsx     ← /login
│   │   └── register/page.tsx  ← /register
│   │
│   ├── dashboard/             ← Area penulis (perlu login)
│   │   ├── layout.tsx         ← Layout dengan Sidebar
│   │   ├── page.tsx           ← Dashboard overview
│   │   ├── posts/
│   │   │   ├── page.tsx       ← Daftar post saya
│   │   │   ├── new/page.tsx   ← Buat post baru
│   │   │   └── [id]/
│   │   │       └── edit/page.tsx ← Edit post
│   │   └── profile/page.tsx   ← Edit profil
│   │
│   ├── admin/                 ← Area admin (perlu role ADMIN)
│   │   ├── layout.tsx
│   │   ├── page.tsx           ← Admin overview
│   │   ├── users/page.tsx     ← Manage users
│   │   └── posts/page.tsx     ← Manage semua posts
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── posts/route.ts
│       ├── posts/[id]/route.ts
│       └── upload/route.ts
│
├── actions/
│   ├── post.actions.ts        ← CRUD post
│   ├── auth.actions.ts        ← Register, update profile
│   └── admin.actions.ts       ← Admin actions
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── blog/
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   ├── PostContent.tsx    ← Render MDX
│   │   ├── PostForm.tsx       ← Form buat/edit post
│   │   └── CategoryBadge.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Skeleton.tsx
│       └── ThemeToggle.tsx
│
├── lib/
│   ├── db.ts                  ← Prisma client singleton
│   ├── auth.ts                ← NextAuth config
│   ├── utils.ts               ← Helper: slugify, formatDate, dll
│   └── validations.ts         ← Zod schemas
│
├── stores/
│   └── useBookmarkStore.ts    ← Zustand bookmark state
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                ← Data awal
│
└── middleware.ts              ← Proteksi route
```

---

### 21.3 🚀 Urutan Build Step by Step

```
Step 1 ─── Setup & Database
           ├── Create Next.js project
           ├── Setup Prisma + schema
           ├── Setup NextAuth
           └── Seed data awal

Step 2 ─── Public Pages (SSG/ISR)
           ├── Homepage dengan featured posts
           ├── Halaman /blog dengan search & filter
           ├── Halaman detail /blog/[slug]
           └── Halaman kategori

Step 3 ─── SEO & Performance
           ├── generateMetadata per halaman
           ├── sitemap.ts & robots.ts
           ├── Optimasi gambar dengan <Image>
           └── Loading skeleton UI

Step 4 ─── Auth Pages
           ├── Halaman login (Google + Credentials)
           ├── Halaman register
           └── Middleware proteksi route

Step 5 ─── Dashboard (Server Actions)
           ├── Form buat artikel
           ├── Form edit artikel
           ├── Hapus artikel
           └── Upload cover image

Step 6 ─── Admin Panel
           ├── Daftar semua user
           ├── Manage semua artikel
           └── Role-based protection

Step 7 ─── Polish & Deploy
           ├── Dark/Light mode
           ├── Error boundaries
           ├── ISR configuration
           └── Deploy ke Vercel + Neon DB
```

---

## 📊 Ringkasan Struktur Final

```
▲ EBOOK NEXT.JS 14 — FROM REACT TO FULL STACK
│
├── 🟢 BAGIAN I   — Dari React ke Next.js          Bab 1  – 3
│   ├── Bab 1  ─ Mengenal Next.js & Ekosistemnya
│   ├── Bab 2  ─ Setup Project & Struktur Folder
│   └── Bab 3  ─ Perbedaan Konsep: React vs Next.js
│
├── 🔵 BAGIAN II  — App Router: Routing & Layout   Bab 4  – 6
│   ├── Bab 4  ─ File Convention & Routing System
│   ├── Bab 5  ─ Layouts, Loading & Error UI
│   └── Bab 6  ─ Navigasi & Link
│
├── 🟡 BAGIAN III — Rendering Strategies           Bab 7  – 9
│   ├── Bab 7  ─ Server Components vs Client Components
│   ├── Bab 8  ─ SSR, SSG, ISR — Strategi Rendering
│   └── Bab 9  ─ Metadata & SEO
│
├── 🟠 BAGIAN IV  — Data Fetching & Database       Bab 10 – 12
│   ├── Bab 10 ─ Data Fetching di Next.js
│   ├── Bab 11 ─ Prisma ORM — Database di Next.js
│   └── Bab 12 ─ State Management di Next.js
│
├── 🔴 BAGIAN V   — API Routes & Server Actions    Bab 13 – 15
│   ├── Bab 13 ─ API Routes (Route Handlers)
│   ├── Bab 14 ─ Server Actions — Cara Modern Mutasi Data
│   └── Bab 15 ─ Middleware Next.js
│
├── 🟣 BAGIAN VI  — Autentikasi & Otorisasi        Bab 16 – 17
│   ├── Bab 16 ─ NextAuth.js (Auth.js)
│   └── Bab 17 ─ Otorisasi & Role-Based Access
│
├── ⚫ BAGIAN VII  — Optimasi & Performa            Bab 18 – 19
│   ├── Bab 18 ─ Optimasi Gambar, Font & Script
│   └── Bab 19 ─ Caching, Suspense & Streaming
│
├── 🎯 BAGIAN VIII — Deployment & CI/CD            Bab 20
│   └── Bab 20 ─ Deploy ke Vercel & Best Practices
│
└── 🏆 BAGIAN IX  — Project: Blog CMS Full Stack   Bab 21
    └── Bab 21 ─ Project Blog CMS dengan Next.js 14

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total   :  9 Bagian  |  21 Bab
Target  :  Developer yang sudah paham React
Stack   :  Next.js 14 + Prisma + NextAuth + Tailwind + Vercel
Project :  Blog CMS Full Stack dengan SEO & Auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

*Ebook Next.js 14 — From React to Full Stack*
*Next.js 14 App Router + Prisma + NextAuth.js + Tailwind CSS + Vercel*
