---
title: "Bab 11 — Module & Deklarasi Tipe"
---

# 📖 Bab 11 — Module & Deklarasi Tipe

Begitu project membesar, pertanyaan "tipe ini tinggal di file mana?" menjadi sama pentingnya dengan "bagaimana menulis tipenya". Bab ini membahas cara TypeScript bekerja dengan module — `import`/`export`, `import type`, paket `@types/*`, file deklarasi `.d.ts`, augmentasi global, hingga mengetik variabel environment. Materi ini adalah yang membuat project React/Next.js Anda rapi: tipe yang terorganisir, tidak ada `any` liar, dan `process.env` yang aman.

---

## 11.1 📦 `import` / `export` dan `import type`

TypeScript mengikuti sistem module JavaScript modern. Bedanya: ada tipe yang ikut diimpor, dan tipe itu **hilang saat compile**.

```ts
// types/produk.ts
export type Produk = {
  id: number
  nama: string
  harga: number
}

export const BATAS_HARGA = 10_000_000
```

```ts
// components/ProdukCard.tsx
import type { Produk } from '../types/produk'   // hanya tipe — dihapus saat compile
import { BATAS_HARGA } from '../types/produk'   // nilai — tetap ada di JS
```

Kenapa `import type` penting?

- **Jelas niatnya** — pembaca langsung tahu ini hanya untuk tipe, bukan runtime.
- **Mencegah import melingkar** yang sebenarnya hanya karena tipe.
- **Diperlukan `verbatimModuleSyntax`** — jika opsi ini aktif, import yang hanya tipe wajib memakai `import type`, kalau tidak compile error.

```ts
// Bisa juga inline
import { BATAS_HARGA, type Produk } from '../types/produk'
```

| Sintaks | Untuk | Hilang saat compile? |
|---|---|---|
| `import { X } from '...'` | Nilai (fungsi, object, konstanta) | ❌ Tetap |
| `import type { X } from '...'` | Hanya tipe | ✅ Ya |
| `export type { X }` | Re-export tipe | ✅ Ya |
| `export * from '...'` | Re-export semuanya | Tergantung isi |

> 💡 **Kebiasaan yang baik:** gunakan `import type` untuk semua yang hanya
> dipakai sebagai anotasi. Bundler akan membuangnya total — bundle tidak
> bertambah satu byte pun.

---

## 11.2 🗂️ Struktur Folder Tipe

Ada tiga pola umum menempatkan tipe. Tidak ada yang "paling benar" — pilih berdasarkan ukuran dan sifat project.

**Pola 1 — folder `types/` terpusat**

```
src/
├── types/
│   ├── produk.ts
│   ├── user.ts
│   └── api.ts
├── components/
└── hooks/
```

Cocok jika tipe dipakai di banyak tempat dan menjadi "kontrak" bersama (model domain, bentuk API).

**Pola 2 — tipe di samping komponen**

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.types.ts
```

Cocok jika tipe sangat lokal: props yang hanya dipakai komponen itu.

**Pola 3 — barrel file (`index.ts`)**

```ts
// types/index.ts
export type { Produk } from './produk'
export type { User } from './user'
export type { ApiResponse } from './api'
```

Lalu di mana pun:

```ts
import type { Produk, User } from '@/types'
```

| Pola | Kelebihan | Kekurangan |
|---|---|---|
| `types/` terpusat | Mudah dicari, kontrak domain jelas | Bisa jadi "gudang" tak terawat |
| Samping komponen | Kolokasi, mudah dihapus bersama komponen | Tipe mirip bisa terduplikasi |
| Barrel file | Import rapi | Bisa memperlambat build jika berlebihan |

> ⚠️ **Hindari "barrel file raksasa"** yang mengekspor seluruh project.
> Import satu tipe bisa menarik modul yang tidak perlu. Untuk project
> kecil-menengah, barrel per folder (`types/index.ts`) sudah cukup.

---

## 11.3 📚 Paket `@types/*` dan Cara Kerjanya

Banyak library JavaScript ditulis sebelum TypeScript populer — mereka tidak membawa tipe. Solusinya: paket tipe terpisah di namespace `@types`.

```bash
# Library tanpa tipe bawaan
npm install -D @types/lodash

# Library yang sudah membawa tipe sendiri (TIDAK perlu @types)
# react, next, zod, axios → sudah punya .d.ts di dalam paketnya
```

Cara TypeScript menemukannya:

```
node_modules/
├── lodash/               ← kode JavaScript (tanpa tipe)
└── @types/
    └── lodash/
        └── index.d.ts    ← deklarasi tipe yang dibaca TS
```

| Kondisi | Yang dilakukan |
|---|---|
| Library punya `types`/`typings` di `package.json` | Langsung pakai — jangan install `@types` |
| Library tanpa tipe, ada di DefinitelyTyped | `npm i -D @types/nama-paket` |
| Library tanpa tipe & tanpa `@types` | Buat deklarasi sendiri (bagian 11.4) |

Cek cepat: setelah install, hover fungsi library di editor. Kalau tipenya muncul, berarti deklarasi ditemukan.

---

## 11.4 📄 File Deklarasi `.d.ts` & `declare module`

File `.d.ts` berisi **deklarasi bentuk** tanpa implementasi. File ini tidak menghasilkan JavaScript — ia hanya memberi tahu compiler tentang bentuk sesuatu.

**Kasus 1 — import file non-JS (gambar, CSS, SVG)**

```ts
// src/types/assets.d.ts
declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.css'
```

Tanpa deklarasi ini, `import logo from './logo.svg'` akan error: *Cannot find module './logo.svg' or its corresponding type declarations*.

**Kasus 2 — library tanpa tipe sama sekali**

```ts
// src/types/lodash-custom.d.ts
declare module 'lodash-custom' {
  export function rapikan(teks: string): string
  export function potong(teks: string, n: number): string[]
}
```

Anda menulis sendiri "kontrak" library tersebut. Ini lebih baik daripada `any` di semua pemakaian.

**Kasus 3 — deklarasi global**

```ts
// src/types/global.d.ts
declare const APP_VERSION: string
```

| File | Isi | Menghasilkan JS? |
|---|---|---|
| `.ts` biasa | Implementasi + tipe | ✅ Ya |
| `.d.ts` | Hanya deklarasi tipe | ❌ Tidak |
| `vite-env.d.ts` | Tipe khusus Vite (`import.meta.env`) | ❌ Tidak |
| `next-env.d.ts` | Tipe khusus Next.js — jangan diedit | ❌ Tidak |

---

## 11.5 🌐 Augmentasi Tipe Global

Kadang Anda perlu "menambahkan" field ke tipe milik library atau global. Ini disebut **module augmentation** / **global augmentation**.

**Menambah field ke `Window`:**

```ts
// src/types/window.d.ts
export {}

declare global {
  interface Window {
    dataLayer?: unknown[]
    analytics?: {
      track: (event: string, data?: Record<string, unknown>) => void
    }
  }
}
```

Sekarang di kode mana pun:

```ts
window.analytics?.track('klik_beli', { id: 1 })   // ✅ dikenali TS
```

**Menambah field ke `process.env`:**

```ts
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string
    NEXT_PUBLIC_API_URL: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}
```

Perhatikan `export {}` di atas `declare global` — file harus dianggap module agar augmentasi global berfungsi (tanpa itu, deklarasi dianggap global langsung dan bisa bentrok).

> ⚠️ **Augmentasi itu "menambal" tipe pihak ketiga.** Gunakan hanya jika
> library memang tidak menyediakan tipe. Kalau library punya tipe tapi
> kurang lengkap, lebih baik buka issue atau bungkus library dengan
> helper bertipe di kode Anda.

---

## 11.6 🔐 Mengetik Variabel Environment

`process.env` di Node.js bertipe `string | undefined` — setiap akses bisa `undefined`, dan itu benar: variabel bisa lupa diset. Tetapi memeriksa `undefined` di setiap pemakaian melelahkan. Pola yang baik: **validasi sekali di awal, lalu pakai tipe yang sudah bersih**.

**Langkah 1 — deklarasi tipe env:**

```ts
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string
    NEXT_PUBLIC_API_URL: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}
```

**Langkah 2 — validasi saat startup dengan Zod:**

```ts
// src/lib/env.ts
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = EnvSchema.parse(process.env)
// env.DATABASE_URL bertipe string — BUKAN string | undefined
```

**Langkah 3 — pakai dengan aman:**

```ts
import { env } from '@/lib/env'

fetch(`${env.NEXT_PUBLIC_API_URL}/produk`)   // ✅ tanpa cek undefined
```

Alurnya:

```
process.env (string | undefined, tidak dipercaya)
        │
        ▼
  EnvSchema.parse(...)  ← gagal cepat saat startup jika env salah
        │
        ▼
  env (string, sudah divalidasi) ✅
```

| Tanpa validasi | Dengan validasi |
|---|---|
| `process.env.X` bisa `undefined` di mana saja | Dicek sekali di startup |
| Error baru muncul saat request berjalan | Error muncul saat aplikasi start |
| `as string` menyembunyikan masalah | Gagal jelas + pesan Zod per field |

**Di Next.js**, ingat aturan prefix:

- `NEXT_PUBLIC_*` — tersedia di browser & server.
- Tanpa prefix — hanya di server; **jangan** diakses di Client Component.

> 💡 **Prinsip:** validasi di batas aplikasi, lalu percayai tipe di dalam.
> Ini pola yang sama dengan validasi response API (Bab 12): data dari luar
> tidak dipercaya sampai dicek.

---

## ✅ Checklist Bab 11

- **`import type`** — untuk impor yang hanya tipe; dihapus saat compile, mencegah import melingkar.
- **Struktur folder tipe** — pilih `types/` terpusat, kolokasi komponen, atau barrel; konsisten dalam satu project.
- **`@types/*`** — hanya untuk library tanpa tipe bawaan; cek dulu `package.json` library.
- **`.d.ts`** — deklarasi tanpa implementasi; dipakai untuk aset (`*.svg`, `*.css`) dan library tanpa tipe.
- **`declare module`** — mendefinisikan bentuk module yang tidak punya tipe.
- **Augmentasi global** — `declare global` + `export {}` untuk menambah field ke `Window`/`ProcessEnv`.
- **`process.env`** — bertipe `string | undefined`; validasi sekali di startup (Zod), lalu pakai tipe bersih.
- **`NEXT_PUBLIC_*`** — hanya variabel ber-prefix ini yang aman di browser.

---

⏭️ Lanjut ke [⏳ Bab 12 — Async, Error & Validasi Runtime](/bagian-4/bab-12) untuk melanjutkan!
