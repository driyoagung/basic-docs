---
title: "Bab 12 — Async, Error & Validasi Runtime"
---

# 📖 Bab 12 — Async, Error & Validasi Runtime

Sampai bab ini, semua tipe yang kita tulis mendeskripsikan kode yang **kita** tulis sendiri. Masalahnya, aplikasi nyata hidup dari data yang datang dari luar: response API, input user, localStorage, query string. Di sinilah batas kemampuan TypeScript terlihat — dan di sinilah banyak project React/Next.js pemula runtuh di production. Bab ini membahas async bertipe, kenapa `as` pada response API berbahaya, cara menangani `catch` yang bertipe `unknown`, dan solusi sesungguhnya: **validasi runtime dengan Zod**.

---

## 12.1 ⏳ Promise & Async/Await Bertipe

Fungsi async selalu mengembalikan `Promise<T>`, di mana `T` adalah tipe nilai yang di-`resolve`.

```ts
type Produk = {
  id: number
  nama: string
  harga: number
}

async function ambilProduk(id: number): Promise<Produk> {
  const res = await fetch(`/api/produk/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<Produk>   // ⚠️ ini hanya "janji", bukan jaminan
}

async function main() {
  const produk = await ambilProduk(1)
  console.log(produk.nama)   // TS percaya ini string
}
```

`Promise<T>` memberi Anda dua hal:

- **`await` menghasilkan `T`** — bukan `any`, bukan `unknown`.
- **Compiler memaksa penanganan** — fungsi async yang error tetap harus Anda tangani di pemanggil (setidaknya secara logika).

| Tipe | Arti |
|---|---|
| `Promise<Produk>` | Akan menghasilkan `Produk` |
| `Promise<Produk[]>` | Akan menghasilkan array produk |
| `Promise<void>` | Selesai tanpa nilai |
| `Awaited<Promise<Produk>>` | `Produk` — tipe hasil `await` |

**Fungsi async yang mengembalikan union juga bisa** — sangat berguna untuk hasil yang bisa sukses atau gagal:

```ts
async function cariProduk(q: string): Promise<Produk[]> {
  if (q.trim() === '') return []   // jalur cepat, tetap bertipe sama
  const res = await fetch(`/api/produk?q=${encodeURIComponent(q)}`)
  return res.json()
}
```

> ⚠️ **Ingat:** `await` hanya menunggu Promise selesai. Ia **tidak**
> memvalidasi bentuk hasilnya. Itu tugas bagian berikutnya.

---

## 12.2 ⚠️ Tipe Tidak Melindungi dari Data Buruk

Ini bagian terpenting bab ini. Perhatikan lagi baris ini:

```ts
return res.json() as Promise<Produk>
```

`res.json()` sebenarnya mengembalikan `Promise<any>` — bentuk datanya **tidak diketahui**. `as Promise<Produk>` hanyalah **klaim** Anda: "percayalah, bentuknya begini". TypeScript menurut — dan berhenti melindungi Anda.

```
        Server / API (dunia luar)
                 │
                 │  data JSON — bentuk TIDAK dijamin
                 ▼
        res.json()  →  Promise<any>
                 │
                 │  "as Produk"  ← hanya klaim, tanpa pengecekan
                 ▼
        Produk (di mata compiler) ✅
                 │
                 ▼
        Runtime: data bisa saja { id: "1", harga: null }
                 → 💥 bug yang tidak terdeteksi compiler
```

Contoh nyata kegagalannya:

```ts
const produk = await ambilProduk(1)
console.log(produk.harga.toFixed(2))
// Kalau server mengirim harga: null → 💥 Cannot read properties of null
```

| Sumber data | Bisa dipercaya bentuknya? | Butuh validasi runtime? |
|---|---|---|
| Variabel yang Anda buat sendiri | ✅ Ya | ❌ Tidak |
| Props dari komponen lain | ✅ Ya (dijaga compiler) | ❌ Tidak |
| Response API | ❌ Tidak | ✅ Wajib |
| Input form / query string | ❌ Tidak | ✅ Wajib |
| `localStorage` / `JSON.parse` | ❌ Tidak | ✅ Wajib |
| Webhook / pesan eksternal | ❌ Tidak | ✅ Wajib |

**Solusinya: validasi di runtime, lalu ambil tipe dari schema.**

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

Perhatikan: tipe `Produk` **tidak ditulis dua kali**. Schema adalah sumber kebenaran tunggal — tipe diambil darinya dengan `z.infer`. Kalau schema berubah, tipe ikut berubah. Inilah pola yang akan Anda pakai di seluruh project Bab 21.

---

## 12.3 🧯 `catch` Bertipe `unknown`

Sejak TypeScript 4.4, variabel di `catch` bertipe `unknown` (bukan `any`) jika `useUnknownInCatchVariables` aktif (bagian dari `strict`). Ini benar: yang dilempar bisa apa saja, bukan hanya `Error`.

```ts
try {
  await ambilProduk(1)
} catch (err) {
  // err: unknown
  // err.message          // ❌ 'err' is of type 'unknown'
  if (err instanceof Error) {
    console.error(err.message)   // ✅ err: Error
  } else {
    console.error('Error tak dikenal:', String(err))
  }
}
```

Pola handler error yang bisa dipakai ulang:

```ts
function pesanError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Terjadi kesalahan tak terduga'
}
```

**Custom error class** — untuk error domain yang bisa dibedakan:

```ts
class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly kode?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

try {
  await ambilProduk(1)
} catch (err) {
  if (err instanceof ApiError && err.status === 404) {
    // tangani "tidak ditemukan" secara spesifik
  }
}
```

| Jenis error | Cara mengenali |
|---|---|
| Error bawaan | `err instanceof Error` |
| Custom error | `err instanceof ApiError` |
| String dilempar | `typeof err === 'string'` |
| Apa pun | fallback `String(err)` |

---

## 12.4 📦 Pola `Result` sebagai Alternatif `throw`

`throw` membuat alur error "tersembunyi" — pemanggil harus ingat membungkus `try/catch`. Alternatif yang populer di TypeScript: kembalikan object hasil eksplisit.

```ts
type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E }

function bagi(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: 'Pembagi tidak boleh 0' }
  return { ok: true, data: a / b }
}

const hasil = bagi(10, 0)
if (hasil.ok) {
  console.log(hasil.data)     // ✅ number
} else {
  console.log(hasil.error)    // ✅ string
}
```

Bandingkan keduanya:

| Aspek | `throw` / `try-catch` | `Result` |
|---|---|---|
| Alur error terlihat di tipe? | ❌ Tidak (signature sama) | ✅ Ya — bagian dari return type |
| Pemanggil dipaksa menangani? | ❌ Bisa lupa | ✅ Ya (harus cek `ok`) |
| Cocok untuk | Error tak terduga, bug | Error yang bisa diprediksi (validasi, 404) |
| Ergonomi | Familiar | Sedikit lebih verbose |

> 💡 **Kapan pakai apa?** Gunakan `throw` untuk kondisi "tidak seharusnya
> terjadi" (bug, jaringan putus). Gunakan `Result` untuk kegagalan yang
> **normal** dan perlu ditampilkan ke user (validasi form, stok habis).
> Di Server Action Next.js (Bab 17), pola `Result` ini adalah standar.

---

## 12.5 🛡️ Zod: `parse`, `safeParse`, `infer`

Zod adalah library validasi schema yang paling banyak dipakai di ekosistem React/Next.js. Tiga API utamanya:

```ts
import { z } from 'zod'

const ProdukSchema = z.object({
  id: z.number().int().positive(),
  nama: z.string().min(1, 'Nama wajib diisi'),
  harga: z.number().positive('Harga harus lebih dari 0'),
  deskripsi: z.string().optional(),
})

// 1. infer — mengambil tipe dari schema
type Produk = z.infer<typeof ProdukSchema>
// { id: number; nama: string; harga: number; deskripsi?: string }

// 2. parse — lempar ZodError jika tidak valid
const produk = ProdukSchema.parse(dataMentah)

// 3. safeParse — tidak melempar; mengembalikan object hasil
const hasil = ProdukSchema.safeParse(dataMentah)
if (hasil.success) {
  console.log(hasil.data.nama)   // ✅ tipe aman
} else {
  console.log(hasil.error.issues) // daftar error per field
}
```

| API | Perilaku saat gagal | Cocok untuk |
|---|---|---|
| `parse` | Melempar `ZodError` | Data yang wajib valid (config, response internal) |
| `safeParse` | Mengembalikan `{ success: false, error }` | Input user, form, API yang error-nya ditampilkan |
| `z.infer<typeof Schema>` | — | Mengambil tipe TypeScript dari schema |

Contoh `safeParse` dengan error per field:

```ts
const hasil = ProdukSchema.safeParse(input)
if (!hasil.success) {
  const errorPerField = hasil.error.flatten().fieldErrors
  // { nama?: ['Nama wajib diisi'], harga?: ['Harga harus lebih dari 0'] }
}
```

`flatten()` sangat berguna untuk form: setiap field punya daftar pesan errornya sendiri.

---

## 12.6 🎬 Studi Kasus: `fetchJson<T>(url, schema)`

Sekarang gabungkan semuanya menjadi satu helper yang aman dan bisa dipakai ulang di seluruh aplikasi.

```ts
import { z } from 'zod'

type HasilFetch<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number }

async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<HasilFetch<T>> {
  try {
    const res = await fetch(url, init)

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, status: res.status }
    }

    const mentah: unknown = await res.json()
    const parsed = schema.safeParse(mentah)

    if (!parsed.success) {
      return { ok: false, error: 'Bentuk data tidak sesuai' }
    }

    return { ok: true, data: parsed.data }
  } catch (err) {
    return { ok: false, error: pesanError(err) }
  }
}
```

Pemakaian:

```ts
const ProdukSchema = z.object({
  id: z.number(),
  nama: z.string(),
  harga: z.number(),
})

const hasil = await fetchJson('/api/produk/1', ProdukSchema)

if (hasil.ok) {
  console.log(hasil.data.harga)   // ✅ number — sudah divalidasi
} else {
  console.log(hasil.error)        // pesan yang aman ditampilkan
}
```

Alur lengkapnya:

```
fetch(url)
   │
   ├─ !res.ok ──────────────► { ok:false, error:"HTTP 404" }
   │
   ▼
res.json() → unknown
   │
   ▼
schema.safeParse(...)
   │
   ├─ gagal ────────────────► { ok:false, error:"Bentuk tidak sesuai" }
   │
   ▼
{ ok:true, data: T }  ← tipe T dijamin oleh schema ✅
```

Yang membuat helper ini kuat:

- **Tidak ada `as`.** Tipe `T` berasal dari schema, bukan dari klaim.
- **Tidak ada `any`.** `res.json()` ditampung sebagai `unknown`.
- **Error jaringan dan error bentuk data ditangani terpisah** dengan pesan yang jelas.
- **Bisa dipakai untuk endpoint apa pun** — cukup berikan schema-nya.
- **Kontraknya jujur** — pemanggil dipaksa memeriksa `ok` sebelum mengakses `data`.

> 💡 **Inilah pola yang dipakai di Bab 21.** `fetchJson<T>` akan menjadi
> pondasi data layer project capstone, lengkap dengan `ApiResponse<T>`
> dan `Paginated<T>`.

---

## ✅ Checklist Bab 12

- **`Promise<T>`** — hasil `await` bertipe `T`; fungsi async selalu mengembalikan Promise.
- **`as` pada response API = klaim tanpa bukti** — compiler berhenti melindungi; data luar wajib divalidasi.
- **Data dari luar** — API, form, localStorage, query string: semuanya `unknown` sampai divalidasi.
- **`catch (err)` bertipe `unknown`** — cek `instanceof Error` sebelum mengakses `message`.
- **Custom error class** — bedakan error domain dengan `instanceof ApiError`.
- **Pola `Result`** — `{ ok: true; data } | { ok: false; error }`; error yang bisa diprediksi lebih baik dikembalikan daripada dilempar.
- **Zod `parse`** — melempar `ZodError`; cocok untuk data yang wajib valid.
- **Zod `safeParse`** — mengembalikan hasil sukses/gagal; cocok untuk form dan input user.
- **`z.infer<typeof Schema>`** — tipe dari schema, satu sumber kebenaran, tanpa duplikasi.
- **`fetchJson<T>(url, schema)`** — helper aman: cek HTTP, parse `unknown`, validasi schema, kembalikan `Result`.
- **Validasi di batas** — satu kali di pintu masuk (API/config), lalu percayai tipe di dalam aplikasi.

---

⏭️ Lanjut ke [🧩 Bab 13 — Typing Komponen, Props & Event](/bagian-5/bab-13) untuk melanjutkan!
