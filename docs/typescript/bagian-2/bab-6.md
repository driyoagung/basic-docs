---
title: "Bab 6 — Union, Intersection & Narrowing"
---

# 📖 Bab 6 — Union, Intersection & Narrowing

Data di aplikasi nyata jarang punya satu bentuk saja. Sebuah nilai bisa berupa `string` **atau** `number`. Sebuah state bisa sedang `loading`, `error`, **atau** `success` — dan setiap kondisi membawa data yang berbeda. Di sinilah **union type** dan **narrowing** berperan. Bab ini adalah bab kritis kedua: hampir semua pola state React yang aman (loading/error/success) berdiri di atas materi ini, dan akan dipakai ulang di Bab 14 saat membahas `useReducer`.

---

## 6.1 🔀 Union Type

Union berarti "salah satu dari beberapa tipe", ditulis dengan `|`.

```ts
type Status = 'idle' | 'loading' | 'success' | 'error'
type ID = string | number
type Hasil = string | null
```

Saat sebuah nilai bertipe union, TypeScript hanya mengizinkan operasi yang **aman untuk semua anggotanya**:

```ts
function tampilkan(id: string | number) {
  // id.toUpperCase()   // ❌ bisa jadi number → tidak semua punya toUpperCase
  // id.toFixed(2)      // ❌ bisa jadi string → tidak semua punya toFixed
  String(id)            // ✅ aman untuk keduanya
}
```

Untuk memakai operasi khusus salah satu anggota, Anda harus **mempersempit** tipenya dulu — itulah narrowing.

**Union literal** (union dari nilai spesifik, bukan tipe) adalah bentuk union yang paling sering Anda pakai:

```ts
type Ukuran = 'sm' | 'md' | 'lg'
type Varian = 'primary' | 'secondary' | 'ghost'

type ButtonProps = {
  ukuran?: Ukuran
  variant?: Varian
}
```

Dengan union literal, typo langsung error:

```ts
<Button variant="primery" />   // ❌ Type '"primery"' is not assignable to type 'Varian'
```

| Union | Arti |
|---|---|
| `string \| number` | Nilai boleh string atau number |
| `'a' \| 'b' \| 'c'` | Hanya salah satu dari tiga nilai literal |
| `T \| null` | Nilai ada, atau null |
| `T \| undefined` | Nilai ada, atau belum diisi |

---

## 6.2 🔍 Narrowing: Mempersempit Tipe

Narrowing adalah proses TypeScript "mempersempit" tipe union berdasarkan pengecekan yang Anda tulis. Compiler mengikuti alur logika Anda.

```ts
function tampil(id: string | number) {
  if (typeof id === 'string') {
    return id.toUpperCase()   // di sini TS tahu: string
  }
  return id.toFixed(2)        // di sini TS tahu: number
}
```

Berikut semua teknik narrowing yang perlu Anda kenal:

| Teknik | Contoh | Cocok untuk |
|---|---|---|
| `typeof` | `typeof x === 'string'` | Primitif: string, number, boolean, function |
| `instanceof` | `err instanceof Error` | Instance class (Error, Date, Map, dll.) |
| Operator `in` | `'nama' in obj` | Membedakan bentuk object |
| Pengecekan kesamaan | `status === 'loading'` | Union literal (discriminated union) |
| Truthiness | `if (user)` | Membuang `null` / `undefined` |
| `Array.isArray` | `Array.isArray(x)` | Membedakan array dari non-array |
| Pengecekan `null` eksplisit | `x !== null` | Membuang `null` tanpa membuang `''`/`0` |

Contoh masing-masing:

```ts
// typeof — primitif
function format(nilai: string | number) {
  return typeof nilai === 'number' ? nilai.toFixed(2) : nilai.trim()
}

// instanceof — class
function pesanError(err: unknown) {
  if (err instanceof Error) return err.message   // err: Error
  return 'Terjadi kesalahan tak dikenal'
}

// operator in — bentuk object
type Kucing = { mengeong: () => void }
type Anjing = { menggonggong: () => void }

function suara(hewan: Kucing | Anjing) {
  if ('mengeong' in hewan) hewan.mengeong()
  else hewan.menggonggong()
}

// truthiness — buang null/undefined
function sapa(user: { nama: string } | null) {
  if (user) return `Halo, ${user.nama}`
  return 'Halo, tamu'
}
```

> ⚠️ **Jebakan truthiness:**
> `if (nilai)` membuang `0`, `''`, dan `false` juga — bukan hanya
> `null`/`undefined`. Untuk angka atau string yang boleh bernilai `0`
> atau kosong, gunakan pengecekan eksplisit `nilai !== null && nilai !== undefined`.

---

## 6.3 🛡️ Type Guard Buatan Sendiri

Kadang pengecekan bentuk terlalu kompleks untuk ditulis berulang. Solusinya: **user-defined type guard** dengan sintaks `x is T`.

```ts
type Produk = {
  id: number
  nama: string
  harga: number
}

function isProduk(nilai: unknown): nilai is Produk {
  return (
    typeof nilai === 'object' &&
    nilai !== null &&
    'id' in nilai && typeof (nilai as Produk).id === 'number' &&
    'nama' in nilai && typeof (nilai as Produk).nama === 'string' &&
    'harga' in nilai && typeof (nilai as Produk).harga === 'number'
  )
}

function proses(data: unknown) {
  if (isProduk(data)) {
    console.log(data.harga)   // ✅ data sudah bertipe Produk
  }
}
```

Perhatikan `nilai is Produk` — inilah yang memberitahu compiler: "kalau fungsi ini `true`, maka `nilai` adalah `Produk`". Tanpa anotasi itu, hasil pengecekan hanyalah `boolean` biasa dan narrowing tidak terjadi.

Untuk pengecekan yang harus **melempar error** jika gagal, gunakan *assertion function*:

```ts
function assertProduk(nilai: unknown): asserts nilai is Produk {
  if (!isProduk(nilai)) throw new Error('Bukan Produk yang valid')
}

function pakai(data: unknown) {
  assertProduk(data)
  console.log(data.nama)   // ✅ setelah assertion, data: Produk
}
```

| Alat | Sintaks | Efek |
|---|---|---|
| Type guard | `x is T` | `if (guard(x))` → x bertipe T di cabang true |
| Assertion function | `asserts x is T` | Setelah dipanggil, x bertipe T di sisa fungsi |

---

## 6.4 🎯 Discriminated Union (Sangat Penting untuk React)

Ini pola paling berharga di bab ini. Discriminated union adalah union dari beberapa bentuk object yang dibedakan oleh **satu field penanda** (discriminant) — biasanya `status` atau `type`.

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

Yang membuat pola ini kuat:

- **Setiap kondisi membawa data yang relevan saja.** Saat `loading`, tidak ada `data`; saat `error`, ada `message`; saat `success`, ada `data`. Tidak ada field opsional yang harus Anda tebak-tebak.
- **Compiler mempersempit otomatis** berdasarkan `state.status`. Di cabang `error`, `state.message` dijamin ada.
- **Kondisi mustahil ditolak.** `{ status: 'loading', data: [] }` tidak valid karena bentuk `loading` tidak punya `data`.

Diagram alurnya:

```
        ┌──────────────────────────────┐
        │      FetchState<T>           │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   { status:      { status:      { status:
     'loading' }    'error',       'success',
                    message }      data: T }
        │              │              │
        ▼              ▼              ▼
   "Memuat..."    state.message   state.data
```

Bandingkan dengan versi "boolean flag" yang sering ditulis pemula:

```ts
// ❌ Rawan: kombinasi tidak masuk akal bisa terjadi
type StateBuruk = {
  loading: boolean
  error?: string
  data?: Produk[]
}
// loading=true DAN error terisi DAN data terisi? Mungkin secara tipe, mustahil secara logika.
```

> 💡 **Aturan desain state:**
> Jika dua field tidak pernah valid bersamaan, jangan jadikan dua field
> terpisah. Jadikan satu field penanda + union bentuk. Compiler akan
> menjaga kombinasi mustahil agar tidak pernah terjadi.

---

## 6.5 🚫 Exhaustive Check dengan `never`

Saat memakai `switch` pada discriminated union, Anda ingin compiler **memastikan semua kasus ditangani**. Kalau nanti ada anggota union baru ditambahkan, kode lama harus error — bukan diam-diam melewatkan kasus tersebut.

```ts
type Status = 'loading' | 'error' | 'success'

function label(status: Status) {
  switch (status) {
    case 'loading': return 'Memuat...'
    case 'error':   return 'Gagal'
    case 'success': return 'Berhasil'
    default:
      // Di sini status bertipe never — semua kasus sudah tertangani
      const mustahil: never = status
      return mustahil
  }
}
```

Sekarang tambahkan `'idle'` ke `Status`:

```ts
type Status = 'idle' | 'loading' | 'error' | 'success'
// ❌ Error di label(): Type '"idle"' is not assignable to type 'never'
```

Compiler langsung memberi tahu bahwa ada kasus baru yang belum ditangani. Inilah **exhaustive check** — jaring pengaman untuk refactor.

| Tanpa exhaustive check | Dengan exhaustive check |
|---|---|
| Kasus baru terlewat → bug runtime | Kasus baru → error compile |
| Perlu ingat manual semua anggota union | Compiler yang mengingatkan |

---

## 6.6 🕳️ Menangani `null` & `undefined` dengan Benar

`null` dan `undefined` adalah dua anggota union yang paling sering muncul. Dengan strict mode, keduanya wajib ditangani.

```ts
type User = { nama: string; email?: string }

function tampil(user: User | null) {
  // user.nama                    // ❌ 'user' is possibly 'null'
  return user?.nama ?? 'Tamu'     // ✅ optional chaining + fallback
}
```

Tiga alat utama:

| Alat | Kegunaan | Contoh |
|---|---|---|
| Optional chaining `?.` | Akses aman rantai object | `user?.alamat?.kota` |
| Nullish coalescing `??` | Fallback hanya untuk null/undefined | `user?.nama ?? 'Tamu'` |
| Pengecekan eksplisit | Ketika `0`/`''` adalah nilai sah | `if (x !== null && x !== undefined)` |

Beda `??` dan `||` yang sering menjebak:

```ts
const jumlah = 0
jumlah ?? 10    // 0   ← benar: 0 adalah nilai sah
jumlah || 10    // 10  ← salah jika 0 memang valid
```

> ⚠️ **Kesalahan paling umum di React:**
> `const [items, setItems] = useState([])` membuat tipe `never[]`.
> Jika state bisa `null`, tulis eksplisit: `useState<Produk[] | null>(null)`,
> lalu tangani `null` saat render. Detail di Bab 14.

---

## 6.7 ➕ Intersection: Menggabungkan, Bukan Memilih

Jangan tertukar union (`|`) dengan intersection (`&`):

```ts
type A = { a: string }
type B = { b: number }

type Union = A | B        // punya a ATAU b
type Intersection = A & B // punya a DAN b

const u1: Union = { a: 'x' }         // ✅
const u2: Union = { b: 1 }           // ✅
const u3: Union = { a: 'x', b: 1 }   // ✅ (boleh keduanya)
const i1: Intersection = { a: 'x', b: 1 } // ✅ wajib keduanya
const i2: Intersection = { a: 'x' }  // ❌ kurang b
```

| Operator | Arti | Analogi |
|---|---|---|
| `A \| B` | Salah satu | "Menu A atau menu B" |
| `A & B` | Keduanya sekaligus | "Menu A dan menu B" |

Di React, intersection dipakai untuk komposisi props:

```ts
type BaseProps = { className?: string }
type ButtonProps = BaseProps & {
  variant: 'primary' | 'ghost'
  onClick: () => void
}
```

---

## 6.8 🎬 Studi Kasus: Model State Loading/Error/Success

Inilah pola yang akan Anda pakai berulang kali — dan akan dipakai ulang di Bab 14 saat `useReducer`.

```ts
type Produk = { id: number; nama: string; harga: number }

type State<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T }

type Action =
  | { type: 'mulai' }
  | { type: 'berhasil'; data: Produk[] }
  | { type: 'gagal'; message: string }
  | { type: 'reset' }

function reducer(state: State<Produk[]>, action: Action): State<Produk[]> {
  switch (action.type) {
    case 'mulai':
      return { status: 'loading' }
    case 'berhasil':
      return { status: 'success', data: action.data }
    case 'gagal':
      return { status: 'error', message: action.message }
    case 'reset':
      return { status: 'idle' }
    default: {
      const mustahil: never = action
      return mustahil
    }
  }
}
```

Dan cara render-nya — perhatikan tidak ada `undefined` yang perlu ditebak:

```tsx
function DaftarProduk({ state }: { state: State<Produk[]> }) {
  switch (state.status) {
    case 'idle':
      return <p>Tekan tombol untuk memuat.</p>
    case 'loading':
      return <p>Memuat produk...</p>
    case 'error':
      return <p role="alert">{state.message}</p>
    case 'success':
      return (
        <ul>
          {state.data.map((p) => (
            <li key={p.id}>{p.nama}</li>
          ))}
        </ul>
      )
  }
}
```

Mengapa pola ini aman:

- **Tidak ada kombinasi mustahil.** Tidak mungkin `loading` sekaligus punya `data`.
- **Tidak ada `!` atau `as`.** Compiler tahu persis field mana yang ada di setiap cabang.
- **Refactor aman.** Menambah status baru memaksa Anda menangani render & reducer (berkat `never`).
- **Mudah diuji.** Setiap state adalah object literal kecil yang bisa dibuat di test.

> 💡 **Ini bukan hanya teori.** Pola `State<T>` + `Action` ini persis yang
> dipakai library data-fetching populer (TanStack Query, SWR) di balik
> layar. Dengan memahaminya, Anda bisa membangun versi sederhana sendiri
> (`useFetch<T>`) di Bab 14 dan Bab 21.

---

## ✅ Checklist Bab 6

- **Union (`|`)** — nilai boleh salah satu tipe; operasi hanya diizinkan jika aman untuk semua anggota.
- **Union literal** — `'sm' | 'md' | 'lg'`; typo langsung error, standar props komponen modern.
- **Narrowing** — `typeof`, `instanceof`, `in`, kesamaan, truthiness, `Array.isArray`, pengecekan `null` eksplisit.
- **Jebakan truthiness** — `if (x)` membuang `0`, `''`, `false`; gunakan pengecekan eksplisit untuk nilai sah tersebut.
- **Type guard (`x is T`)** — fungsi pengecekan bentuk yang membuat narrowing otomatis.
- **Assertion function (`asserts x is T`)** — melempar error sekaligus mempersempit tipe setelah pemanggilan.
- **Discriminated union** — union bentuk object dengan satu field penanda (`status`/`type`); setiap kondisi membawa data yang relevan saja.
- **Exhaustive check dengan `never`** — compiler memastikan semua kasus union ditangani; aman saat menambah anggota baru.
- **`??` vs `||`** — `??` hanya untuk `null`/`undefined`; `||` menganggap semua falsy.
- **Intersection (`&`)** — menggabungkan syarat (A dan B), bukan memilih (A atau B).
- **Model state React** — `State<T>` + `Action` + reducer + `never` = state aman tanpa `undefined` dan tanpa `as`.

---

⏭️ Lanjut ke [🧬 Bab 7 — Generics](/bagian-3/bab-7) untuk melanjutkan!
