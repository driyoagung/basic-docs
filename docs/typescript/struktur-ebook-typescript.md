# 🔷 Ebook TypeScript — Dari JavaScript ke React & Next.js
### Belajar TypeScript yang Benar-Benar Dipakai di Project Nyata

---

> 🎯 **Untuk Siapa Ebook Ini?**
> Anda yang sudah paham **JavaScript dasar** (variabel, fungsi, array, object,
> async/await) dan ingin belajar TypeScript sebagai bekal memakai
> **React** dan **Next.js**. Ebook ini tidak mengajarkan semua fitur TypeScript
> secara akademis. Fokusnya pada bagian yang **paling sering muncul** saat
> menulis komponen, hooks, dan halaman Next.js.

---

> 💡 **Asumsi yang Dipakai**
> - TypeScript **5.x**, mode **strict** aktif sejak awal
> - React **18+** dengan function component dan hooks
> - Next.js **App Router** (versi 15 ke atas; jika versi Anda berbeda, bagian typing `params` perlu disesuaikan)
> - Runtime: Node.js 20+, eksekusi file TS dengan `tsx`

---

## 🤔 Mengapa TypeScript Sebelum React/Next?

```
JAVASCRIPT:
function hitungTotal(item) {
  return item.harga * item.jumlah
}
hitungTotal({ harga: 1000, jumlh: 2 })   // typo "jumlh"
// ✅ Tidak ada error saat menulis
// 💥 Hasilnya NaN — baru ketahuan saat dijalankan

TYPESCRIPT:
function hitungTotal(item: { harga: number; jumlah: number }) {
  return item.harga * item.jumlah
}
hitungTotal({ harga: 1000, jumlh: 2 })
// ❌ ERROR langsung di editor:
// "Object literal may only specify known properties,
//  and 'jumlh' does not exist..."
```

> 💡 **Analogi:**
> JavaScript seperti menulis dokumen tanpa pemeriksa ejaan: salah ketik baru
> ketahuan setelah dicetak. TypeScript seperti pemeriksa ejaan yang
> menggarisbawahi kesalahan **sambil Anda mengetik**.

---

## 🔄 JavaScript vs TypeScript — Apa yang Berubah?

| Aspek | JavaScript | TypeScript |
|---|---|---|
| **Pengecekan tipe** | Saat runtime (kalau error baru ketahuan) | Saat menulis kode (compile time) |
| **Ekstensi file** | `.js`, `.jsx` | `.ts`, `.tsx` |
| **Dijalankan oleh browser/Node** | Langsung | Dikompilasi dulu ke JS |
| **Autocomplete** | Terbatas | Sangat kaya & akurat |
| **Refactor** | Berisiko | Aman (editor tahu semua pemakaian) |
| **Kurva belajar** | Rendah | Sedang (tapi cepat terbayar) |

> ⚠️ **Hal yang Sering Disalahpahami:**
> TypeScript **tidak** mengubah cara kode berjalan. Semua tipe **dihapus**
> saat kompilasi. Tipe hanya membantu Anda saat *menulis* kode, bukan
> melindungi aplikasi dari data buruk saat *berjalan* (mis. respons API).
> Untuk itu ada validasi runtime seperti Zod, dibahas di Bab 12.

---

## 🧰 Tech Stack

| Tool | Fungsi |
|---|---|
| **TypeScript 5.x** | Bahasa & compiler (`tsc`) |
| **tsx** | Menjalankan file `.ts` langsung tanpa build |
| **Vite** | Dev server untuk latihan React + TS |
| **React 18** | Latihan typing komponen & hooks |
| **Next.js (App Router)** | Latihan typing page, route handler, server action |
| **Zod** | Validasi data runtime + infer tipe |
| **ESLint + typescript-eslint** | Kualitas kode |

---

## 🗺️ Peta Perjalanan Belajar

```
🟢 BAGIAN I    Fondasi TypeScript                   → Bab 1  – 3
🔵 BAGIAN II   Fungsi, Object & Tipe Gabungan       → Bab 4  – 6
🟡 BAGIAN III  Generics & Utility Types             → Bab 7  – 9
🟠 BAGIAN IV   Class, Module & Data Asinkron        → Bab 10 – 12
🔴 BAGIAN V    TypeScript untuk React               → Bab 13 – 15
🟣 BAGIAN VI   TypeScript untuk Next.js             → Bab 16 – 18
⚫ BAGIAN VII  Debugging, Migrasi & Best Practices  → Bab 19 – 20
🏆 BAGIAN VIII Project Praktik                      → Bab 21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 8 Bagian | 21 Bab
```

---

## ⚡ Jalur Cepat (Jika Ingin Langsung ke React/Next)

> Tidak harus membaca semua bab dulu. Jika tujuan utama Anda adalah
> framework, ikuti jalur ini lalu kembali ke bab lain saat dibutuhkan.

| Tujuan | Bab yang Dibaca |
|---|---|
| **Minimal untuk React** | 2 → 3 → 5 → 6 → 7 → 13 → 14 |
| **Minimal untuk Next.js** | Jalur React + 8 → 12 → 16 → 17 |
| **Paham menyeluruh** | Semua bab berurutan |

---

## ⭐ Bab Paling Kritis

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 5** — Object, `type` & `interface` | Props React, response API, model data: semuanya object |
| 🥈 | **Bab 6** — Union & Narrowing | Dasar untuk menangani `null`, loading/error state, dan data yang bisa berbentuk beberapa jenis |
| 🥉 | **Bab 7** — Generics | Kunci memahami `useState<T>`, `Promise<T>`, dan hampir semua library |
| 🏅 | **Bab 14** — Typing Hooks | Tempat paling sering pemula bingung di React + TS |

---

---

# 🟢 BAGIAN I — Fondasi TypeScript

> 🎯 **Tujuan:** Memahami cara kerja TypeScript, menyiapkan project,
> dan menguasai tipe-tipe dasar.

---

## 📖 Bab 1 — Mengenal TypeScript

- 1.1 🤔 Apa itu TypeScript & masalah yang dipecahkan
- 1.2 ⚙️ Cara kerja: TS → (compile) → JS, tipe dihapus saat build
- 1.3 🧩 TypeScript adalah *superset* JavaScript: semua JS valid adalah TS valid
- 1.4 🌍 Mengapa React & Next.js menjadikan TS standar
- 1.5 ✅ Kapan TS membantu, kapan terasa berlebihan (script kecil sekali pakai)
- 1.6 🧠 Pola pikir baru: "bentuk data" (shape) lebih penting dari nilainya

---

## 📖 Bab 2 — Setup & Konfigurasi

### 2.1 🚀 Project Pertama

```bash
mkdir belajar-ts && cd belajar-ts
npm init -y
npm install -D typescript tsx @types/node
npx tsc --init
```

```bash
# Menjalankan file TS langsung
npx tsx src/index.ts

# Mengecek tipe saja tanpa menghasilkan file
npx tsc --noEmit
```

### 2.2 ⚙️ Memahami `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

| Opsi | Fungsi |
|---|---|
| `strict` | ⭐ Mengaktifkan semua pengecekan ketat (wajib `true`) |
| `noUncheckedIndexedAccess` | `arr[0]` bertipe `T \| undefined` (lebih aman) |
| `target` | Versi JS hasil kompilasi |
| `jsx` | Cara JSX diproses (React/Next) |
| `paths` | Alias import `@/components/...` |
| `skipLibCheck` | Lewati cek `.d.ts` library (mempercepat) |

### 2.3 Sub-topik

- 2.3.1 Project TS dengan Vite (`npm create vite@latest -- --template react-ts`)
- 2.3.2 Project TS dengan Next.js (`create-next-app` memilih TypeScript)
- 2.3.3 Ekstensi editor & cara membaca error TypeScript
- 2.3.4 Mengapa `strict: true` sejak awal itu penting

---

## 📖 Bab 3 — Tipe Dasar

### 3.1 🔤 Anotasi & Inference

```ts
// Anotasi eksplisit
let nama: string = 'Budi'
let umur: number = 25
let aktif: boolean = true

// Type inference: TS menebak sendiri (lebih disukai jika sudah jelas)
let kota = 'Jakarta'      // otomatis string
// kota = 123             // ❌ Error
```

### 3.2 📦 Tipe yang Dipelajari

| Tipe | Contoh | Catatan |
|---|---|---|
| `string`, `number`, `boolean` | `let x: number` | Dasar |
| Array | `string[]`, `Array<number>` | Dua cara penulisan |
| Tuple | `[string, number]` | Array dengan panjang & tipe tetap (`useState` mengembalikan tuple) |
| `null`, `undefined` | `string \| null` | Wajib ditangani di strict mode |
| Literal | `'success' \| 'error'` | Nilai spesifik sebagai tipe |
| `any` | `let x: any` | ⚠️ Mematikan pengecekan, hindari |
| `unknown` | `let x: unknown` | ✅ Versi aman dari `any` |
| `void` | fungsi tanpa return | |
| `never` | fungsi yang tak pernah selesai / kasus mustahil | Dipakai di exhaustive check |

### 3.3 Sub-topik

- 3.3.1 `any` vs `unknown`: kenapa `unknown` lebih aman
- 3.3.2 `as const` dan literal type
- 3.3.3 Type assertion (`as`) dan kapan berbahaya
- 3.3.4 `enum` vs union literal (mengapa banyak tim memilih union)
- 3.3.5 `null` & `undefined`: optional chaining `?.` dan nullish `??`
- 3.3.6 🎬 Studi kasus: mengetik data user dari form pendaftaran

---

---

# 🔵 BAGIAN II — Fungsi, Object & Tipe Gabungan

---

## 📖 Bab 4 — Fungsi di TypeScript

```ts
// Parameter & return type
function hitungDiskon(harga: number, persen: number = 10): number {
  return harga - (harga * persen) / 100
}

// Arrow function
const sapa = (nama: string): string => `Halo, ${nama}`

// Parameter opsional & rest
function buatSlug(teks: string, pemisah?: string): string { /* ... */ return teks }
function jumlah(...angka: number[]): number { return angka.reduce((a, b) => a + b, 0) }

// Tipe fungsi sebagai callback
type Handler = (id: number) => void
```

- 4.1 Anotasi parameter & return type (kapan return type boleh dihilangkan)
- 4.2 Parameter opsional, default, dan rest
- 4.3 Tipe fungsi & callback (`onClick`, `onChange` di React)
- 4.4 Function overload (singkat, hanya sebagai pengenalan)
- 4.5 `this` & arrow function (ringkas)
- 4.6 🎬 Studi kasus: mengetik fungsi helper `formatRupiah`, `debounce`

---

## 📖 Bab 5 — Object, `type` & `interface` ⭐

### 5.1 🧱 Mendefinisikan Bentuk Object

```ts
type Produk = {
  id: number
  nama: string
  harga: number
  deskripsi?: string        // opsional
  readonly dibuatPada: Date // tidak boleh diubah
}

interface User {
  id: number
  nama: string
  email: string
}

const p: Produk = { id: 1, nama: 'Laptop', harga: 15000000, dibuatPada: new Date() }
```

### 5.2 ⚖️ `type` vs `interface`

| Aspek | `type` | `interface` |
|---|---|---|
| Object | ✅ | ✅ |
| Union / tuple / primitif | ✅ | ❌ |
| Extend | `&` (intersection) | `extends` |
| Declaration merging | ❌ | ✅ |
| Rekomendasi praktis | Serbaguna | Bagus untuk object/class publik |

> 💡 **Aturan praktis:** pilih salah satu dan konsisten dalam satu project.
> Untuk pemula, `type` cukup untuk hampir semua kebutuhan.

### 5.3 Sub-topik

- 5.3.1 Nested object & array of object
- 5.3.2 Optional (`?`) vs `| undefined`
- 5.3.3 `readonly` dan immutability
- 5.3.4 Index signature & `Record<string, T>`
- 5.3.5 Extend & intersection (`User & { role: string }`)
- 5.3.6 🎬 Studi kasus: mengetik response API (`Post`, `Comment`, `Author`)

---

## 📖 Bab 6 — Union, Intersection & Narrowing ⭐

### 6.1 🔀 Union Type

```ts
type Status = 'idle' | 'loading' | 'success' | 'error'
type ID = string | number
```

### 6.2 🔍 Narrowing: Mempersempit Tipe

```ts
function tampil(id: string | number) {
  if (typeof id === 'string') {
    return id.toUpperCase()   // di sini TS tahu: string
  }
  return id.toFixed(2)        // di sini TS tahu: number
}
```

### 6.3 🎯 Discriminated Union (Sangat Penting untuk React)

```ts
type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T }

function render(state: FetchState<Produk[]>) {
  switch (state.status) {
    case 'loading': return 'Memuat...'
    case 'error':   return state.message      // TS tahu: ada message
    case 'success': return state.data.length  // TS tahu: ada data
  }
}
```

### 6.4 Sub-topik

- 6.4.1 Teknik narrowing: `typeof`, `instanceof`, `in`, pengecekan kesamaan, truthiness
- 6.4.2 Type guard buatan sendiri (`x is Produk`)
- 6.4.3 Exhaustive check dengan `never`
- 6.4.4 Menangani `null` & `undefined` dengan benar
- 6.4.5 🎬 Studi kasus: model state loading/error/success yang aman (dipakai ulang di Bab 14)

---

---

# 🟡 BAGIAN III — Generics & Utility Types

---

## 📖 Bab 7 — Generics ⭐

### 7.1 🧬 Apa itu Generics?

```ts
// Tanpa generics: kehilangan informasi tipe
function pertama(arr: any[]): any { return arr[0] }

// Dengan generics: tipe "mengikuti" input
function pertama<T>(arr: T[]): T | undefined { return arr[0] }

const a = pertama([1, 2, 3])        // number | undefined
const b = pertama(['x', 'y'])       // string | undefined
```

> 💡 **Analogi:** generics seperti **cetakan kue dengan ukuran bisa diatur**.
> Bentuknya tetap, isinya (tipe) ditentukan saat dipakai.

### 7.2 Sub-topik

- 7.2.1 Generic function & generic type (`type Response<T> = {...}`)
- 7.2.2 Constraint dengan `extends` (`T extends { id: number }`)
- 7.2.3 Default generic (`<T = string>`)
- 7.2.4 Contoh nyata yang sudah Anda pakai: `Array<T>`, `Promise<T>`, `useState<T>`
- 7.2.5 🎬 Studi kasus: tipe `ApiResponse<T>` & `Paginated<T>` yang bisa dipakai ulang

---

## 📖 Bab 8 — Utility Types

| Utility | Fungsi | Contoh Kasus |
|---|---|---|
| `Partial<T>` | Semua field jadi opsional | Form edit/update |
| `Required<T>` | Semua field wajib | |
| `Pick<T, K>` | Ambil sebagian field | Data ringkas untuk list |
| `Omit<T, K>` | Buang sebagian field | Input create tanpa `id` |
| `Readonly<T>` | Semua field readonly | |
| `Record<K, V>` | Object dengan key bertipe | Kamus/lookup |
| `ReturnType<F>` | Tipe hasil fungsi | |
| `Parameters<F>` | Tipe parameter fungsi | |
| `Awaited<T>` | Tipe hasil Promise | |
| `NonNullable<T>` | Buang `null`/`undefined` | |

```ts
type ProdukInput = Omit<Produk, 'id' | 'dibuatPada'>
type ProdukUpdate = Partial<ProdukInput>
type ProdukRingkas = Pick<Produk, 'id' | 'nama'>
```

- 8.1 Membangun tipe baru dari tipe lama (DRY: jangan tulis ulang)
- 8.2 🎬 Studi kasus: satu model `Produk` → tipe untuk create, update, list, detail

---

## 📖 Bab 9 — Tipe Lanjutan yang Sering Muncul

- 9.1 `keyof` & `typeof` (mengambil tipe dari nilai)
- 9.2 Indexed access (`Produk['harga']`)
- 9.3 Mapped type (pengenalan ringan)
- 9.4 Conditional type (`T extends U ? X : Y`, pengenalan ringan)
- 9.5 Template literal type (`` `on${Capitalize<string>}` ``)
- 9.6 `as const` untuk objek konfigurasi & daftar nilai
- 9.7 Operator `satisfies`: validasi bentuk tanpa kehilangan tipe spesifik
- 9.8 ⚠️ Kapan berhenti: tipe yang terlalu rumit lebih merugikan daripada membantu

---

---

# 🟠 BAGIAN IV — Class, Module & Data Asinkron

---

## 📖 Bab 10 — Class & OOP di TypeScript

- 10.1 Class, property, dan constructor bertipe
- 10.2 Access modifier: `public`, `private`, `protected`, `readonly`
- 10.3 Parameter property (`constructor(private nama: string)`)
- 10.4 `implements` interface & `abstract class`
- 10.5 Class vs object literal + fungsi: mana yang lebih umum di ekosistem React
- 10.6 🎬 Studi kasus: service class `ProdukService` dengan dependency bertipe

---

## 📖 Bab 11 — Module & Deklarasi Tipe

- 11.1 `import` / `export` dan `import type`
- 11.2 Struktur folder tipe: `types/`, tipe di samping komponen, atau barrel file
- 11.3 Paket `@types/*` dan cara kerjanya
- 11.4 File deklarasi `.d.ts` & `declare module` (mis. impor file gambar/CSS)
- 11.5 Augmentasi tipe global (mis. menambah field ke `Window`, `process.env`)
- 11.6 Mengetik variabel environment (`env.d.ts`)

---

## 📖 Bab 12 — Async, Error & Validasi Runtime

### 12.1 ⏳ Promise & Async/Await Bertipe

```ts
async function ambilProduk(id: number): Promise<Produk> {
  const res = await fetch(`/api/produk/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<Produk>   // ⚠️ ini hanya "janji", bukan jaminan
}
```

### 12.2 ⚠️ Tipe Tidak Melindungi dari Data Buruk

```
res.json() mengembalikan data DARI LUAR (API).
TypeScript tidak bisa membuktikan bentuknya benar.
`as Produk` hanyalah klaim, bukan pengecekan.

→ Solusi: validasi di runtime lalu ambil tipenya dari schema.
```

```ts
import { z } from 'zod'

const ProdukSchema = z.object({
  id: z.number(),
  nama: z.string(),
  harga: z.number().positive(),
})

type Produk = z.infer<typeof ProdukSchema>   // tipe otomatis dari schema

const data = ProdukSchema.parse(await res.json())  // error jika bentuk salah
```

### 12.3 Sub-topik

- 12.3.1 `catch (e)` bertipe `unknown`: cara menanganinya dengan aman
- 12.3.2 Custom error class bertipe
- 12.3.3 Pola `Result` (`{ ok: true, data } | { ok: false, error }`) sebagai alternatif `throw`
- 12.3.4 Zod: `parse`, `safeParse`, `infer`
- 12.3.5 🎬 Studi kasus: fungsi `fetchJson<T>(url, schema)` yang aman dan bertipe

---

---

# 🔴 BAGIAN V — TypeScript untuk React

> 🎯 **Tujuan:** Menerapkan semua yang dipelajari pada komponen,
> hooks, event, dan form React.

---

## 📖 Bab 13 — Typing Komponen, Props & Event

### 13.1 🧩 Props

```tsx
type ProductCardProps = {
  produk: Produk
  onBeli: (id: number) => void
  aktif?: boolean
  children?: React.ReactNode
}

export function ProductCard({ produk, onBeli, aktif = true, children }: ProductCardProps) {
  return (
    <div>
      <h3>{produk.nama}</h3>
      <button disabled={!aktif} onClick={() => onBeli(produk.id)}>Beli</button>
      {children}
    </div>
  )
}
```

### 13.2 🖱️ Event Handler

```tsx
function Cari() {
  const [q, setQ] = useState('')

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault() }

  return (
    <form onSubmit={onSubmit}>
      <input value={q} onChange={onChange} />
    </form>
  )
}
```

### 13.3 Sub-topik

- 13.3.1 Props: `type` vs `interface`, props opsional, nilai default
- 13.3.2 `children`: `React.ReactNode` vs `React.ReactElement`
- 13.4 Tipe event: `ChangeEvent`, `MouseEvent`, `FormEvent`, `KeyboardEvent`
- 13.5 Props gaya (`style`, `className`) & meneruskan props elemen HTML: `React.ComponentProps<'button'>`
- 13.6 Menurunkan tipe dari komponen: `React.ComponentProps<typeof Komponen>`
- 13.7 Mengapa `React.FC` tidak lagi direkomendasikan sebagai default
- 13.8 🎬 Studi kasus: membuat `Button`, `Input`, `Card` bertipe & reusable

---

## 📖 Bab 14 — Typing Hooks ⭐

### 14.1 `useState`

```tsx
const [count, setCount] = useState(0)                     // inference: number
const [user, setUser] = useState<User | null>(null)       // union dengan null
const [items, setItems] = useState<Produk[]>([])          // array kosong butuh tipe!
```

### 14.2 `useRef`, `useReducer`, `useContext`

```tsx
// useRef untuk elemen DOM
const inputRef = useRef<HTMLInputElement>(null)

// useReducer dengan discriminated union
type Action =
  | { type: 'tambah'; item: Produk }
  | { type: 'hapus'; id: number }
  | { type: 'kosongkan' }

function reducer(state: Produk[], action: Action): Produk[] {
  switch (action.type) {
    case 'tambah':    return [...state, action.item]
    case 'hapus':     return state.filter((p) => p.id !== action.id)
    case 'kosongkan': return []
  }
}

// useContext dengan pengecekan null
const AuthContext = createContext<AuthValue | null>(null)

function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
```

### 14.3 Sub-topik

- 14.3.1 `useEffect` & cleanup bertipe
- 14.3.2 `useMemo`, `useCallback`
- 14.3.3 Custom hook bertipe: `useLocalStorage<T>`, `useFetch<T>`, `useDebounce<T>`
- 14.3.4 Kesalahan umum: `useState([])` menjadi `never[]`, `useRef` dengan `null`, context default
- 14.3.5 🎬 Studi kasus: mengetik ulang hook `useLocalStorage` dari ebook React Anda menjadi versi generik

---

## 📖 Bab 15 — Pola Lanjutan di React + TS

- 15.1 Generic component (`<List<T> items={...} renderItem={...} />`)
- 15.2 Props dengan discriminated union (varian komponen yang saling eksklusif)
- 15.3 Polymorphic component (prop `as`) — pengenalan ringan
- 15.4 Form bertipe: React Hook Form + Zod (`z.infer` sebagai tipe form)
- 15.5 Context + reducer bertipe untuk state global
- 15.6 Mengetik library pihak ketiga yang tipenya kurang lengkap
- 15.7 🎬 Studi kasus: tabel data generik `DataTable<T>` yang bisa dipakai untuk produk, user, order

---

---

# 🟣 BAGIAN VI — TypeScript untuk Next.js

> 🎯 **Tujuan:** Mengetik page, layout, route handler, server action,
> dan data fetching di App Router.

---

## 📖 Bab 16 — Typing App Router

### 16.1 📄 Page dengan Params

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

> ⚠️ **Perhatikan versi:** pada Next.js 14 ke bawah `params` adalah object biasa,
> sedangkan pada Next.js 15 ke atas `params` dan `searchParams` berupa **Promise**.
> Pastikan mengikuti versi yang Anda pakai.

### 16.2 Sub-topik

- 16.2.1 Layout bertipe: `children: React.ReactNode`
- 16.2.2 `Metadata` & `generateMetadata` bertipe
- 16.2.3 Typing `loading.tsx`, `error.tsx` (`error: Error & { digest?: string }`)
- 16.2.4 Route Handler: `NextRequest`, `NextResponse`, tipe body & params
- 16.2.5 Server Component vs Client Component: perbedaan tipe yang boleh lewat batas (props harus serializable)
- 16.2.6 `next/link`, `useRouter`, `useSearchParams` bertipe
- 16.2.7 Plugin TypeScript Next.js & fitur *typed routes*

---

## 📖 Bab 17 — Server Actions & Data Bertipe

- 17.1 Server Action bertipe (`FormData` → validasi Zod → hasil bertipe)
- 17.2 State form dengan `useActionState` / `useFormStatus` + tipe state
- 17.3 Pola hasil action: `{ success: true; data } | { success: false; errors }`
- 17.4 Tipe dari Prisma (`Prisma.ProdukGetPayload`, `Prisma.ProdukCreateInput`) — hubungan dengan ebook Prisma Anda
- 17.5 Memisahkan tipe database dari tipe UI (DTO)
- 17.6 🎬 Studi kasus: form tambah artikel dengan Server Action + Zod + error per field

---

## 📖 Bab 18 — Fetching, Environment & Konfigurasi

- 18.1 `fetch` bertipe di Server Component & caching option
- 18.2 Membuat API client generik (`api.get<T>()`)
- 18.3 Mengetik `process.env` & validasi env dengan Zod saat startup
- 18.4 Tipe untuk middleware (`NextRequest`) dan matcher
- 18.5 Auth.js / NextAuth: augmentasi tipe `Session` & `User` (menambah `role`, `id`)
- 18.6 Berbagi tipe antara client & server tanpa membocorkan kode server

---

---

# ⚫ BAGIAN VII — Debugging, Migrasi & Best Practices

---

## 📖 Bab 19 — Membaca & Memperbaiki Error TypeScript

### 19.1 🚨 Error yang Hampir Pasti Anda Temui

| Pesan Error (inti) | Penyebab Umum | Solusi |
|---|---|---|
| `Object is possibly 'undefined'` / `'null'` | Lupa menangani nilai kosong | Narrowing, `?.`, `??` |
| `Type 'X' is not assignable to type 'Y'` | Bentuk data tidak cocok | Periksa field & tipe |
| `Property 'x' does not exist on type` | Typo atau tipe belum dipersempit | Cek nama / narrowing |
| `Parameter 'x' implicitly has an 'any' type` | Tidak ada anotasi | Beri tipe parameter |
| `Argument of type ... is not assignable to parameter` | Argumen salah bentuk | Sesuaikan argumen |
| `Cannot find module ... or its type declarations` | Tidak ada `@types` / path salah | Install `@types/...` atau deklarasi |
| `'x' is declared but never used` | Aturan lint | Hapus atau awali dengan `_` |

### 19.2 Sub-topik

- 19.2.1 Cara membaca pesan error panjang (baca dari **baris terakhir** dulu)
- 19.2.2 Kapan `as`, `!` (non-null assertion), `@ts-expect-error` boleh dipakai
- 19.2.3 Bahaya `any` yang menular
- 19.2.4 Mengecek tipe hasil dengan hover & `typeof`

---

## 📖 Bab 20 — Migrasi JS → TS & Best Practices

- 20.1 Migrasi bertahap: `allowJs`, ganti file satu per satu, naikkan strictness
- 20.2 JSDoc sebagai jembatan (`// @ts-check`)
- 20.3 ESLint + `typescript-eslint`: aturan yang layak diaktifkan
- 20.4 Konvensi penamaan & struktur folder tipe
- 20.5 Prinsip: biarkan inference bekerja, anotasi di batas (props, return publik, data eksternal)
- 20.6 Hindari over-engineering tipe
- 20.7 Checklist code review untuk kode TS

---

---

# 🏆 BAGIAN VIII — Project Praktik

---

## 📖 Bab 21 — Project: Aplikasi Katalog Bertipe (React + Next.js)

### 21.1 🎯 Yang Akan Dibangun

| Bagian | Isi |
|---|---|
| **Tipe inti** | `Produk`, `Kategori`, `ApiResponse<T>`, `Paginated<T>` |
| **React (Vite)** | Daftar produk, search + debounce, keranjang dengan `useReducer` & `useLocalStorage<T>` |
| **Next.js** | Halaman daftar & detail (`[slug]`), `generateMetadata`, route handler |
| **Server Action** | Form tambah produk dengan validasi Zod |
| **Validasi** | Semua data eksternal divalidasi dengan Zod, tipe diambil via `z.infer` |
| **Kualitas** | ESLint, `tsc --noEmit` di CI, `strict: true` |

### 21.2 📁 Struktur Folder

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

### 21.3 🚀 Urutan Build

```
Step 1 ─ Setup TS strict + ESLint
Step 2 ─ Definisikan tipe inti & schema Zod
Step 3 ─ Utility: fetchJson<T>, env validasi
Step 4 ─ Hooks generik (useLocalStorage, useDebounce, useFetch)
Step 5 ─ Komponen UI bertipe + DataTable<T>
Step 6 ─ Versi React: katalog + keranjang (useReducer)
Step 7 ─ Versi Next.js: halaman, metadata, route handler
Step 8 ─ Server Action + form tervalidasi
Step 9 ─ Bersihkan `any`, jalankan tsc & lint, refactor
```

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

*Ebook TypeScript — Dari JavaScript ke React & Next.js*
