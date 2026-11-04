---
title: "Bab 17 — Server Actions & Data Bertipe"
---

# 📖 Bab 17 — Server Actions & Data Bertipe

Server Action adalah fungsi yang berjalan di server tetapi bisa dipanggil langsung dari Client Component — tanpa perlu menulis Route Handler dan `fetch` manual. Bagi TypeScript, ini peluang emas: satu fungsi, satu kontrak tipe, dari form di browser sampai database di server. Bab ini membahas cara mengetik Server Action dari ujung ke ujung: `FormData` → validasi Zod → hasil bertipe → ditampilkan di form, termasuk pola `useActionState` dan pemisahan tipe database (Prisma) dari tipe UI (DTO).

---

## 17.1 🧾 Server Action Bertipe: `FormData` → Zod → Hasil

Server Action ditandai dengan `'use server'` di atas file (atau di dalam fungsi). Argumen dan return-nya **harus serializable**.

```ts
// app/actions/produk.ts
'use server'

import { z } from 'zod'

const ProdukSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  harga: z.coerce.number().positive('Harga harus lebih dari 0'),
  kategori: z.enum(['elektronik', 'pakaian', 'makanan']),
})

type HasilAction =
  | { success: true; id: number }
  | { success: false; errors: Record<string, string[]> }

export async function tambahProduk(
  _prevState: HasilAction | null,
  formData: FormData,
): Promise<HasilAction> {
  const mentah = Object.fromEntries(formData)
  const parsed = ProdukSchema.safeParse(mentah)

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const produk = await db.produk.create({ data: parsed.data })
  return { success: true, id: produk.id }
}
```

Poin penting:

- **`formData: FormData`** — tipe bawaan; semua nilai mentah berupa `string | File`.
- **`Object.fromEntries(formData)`** — mengubah ke object; hasilnya `unknown`-ish, jadi divalidasi Zod.
- **`z.coerce.number()`** — karena form selalu mengirim string, `coerce` mengubahnya menjadi number sebelum validasi.
- **Return type eksplisit `Promise<HasilAction>`** — kontrak jelas antara server dan client.

> ⚠️ **Jangan pernah mempercayai `formData` mentah.** Semua yang datang dari
> browser bisa dimanipulasi: angka bisa negatif, enum bisa nilai asing,
> field wajib bisa kosong. Zod di Server Action adalah garis pertahanan
> terakhir sebelum data masuk database.

---

## 17.2 🪝 `useActionState` & `useFormStatus`

React 19 menyediakan `useActionState` untuk menangani state hasil action + loading sekaligus.

```tsx
// app/produk/tambah/FormProduk.tsx
'use client'

import { useActionState } from 'react'
import { tambahProduk } from '@/app/actions/produk'

export function FormProduk() {
  const [state, formAction, pending] = useActionState(tambahProduk, null)

  return (
    <form action={formAction}>
      <input name="nama" required />
      {state?.success === false && state.errors.nama && (
        <p className="error">{state.errors.nama[0]}</p>
      )}

      <input name="harga" type="number" required />
      {state?.success === false && state.errors.harga && (
        <p className="error">{state.errors.harga[0]}</p>
      )}

      <select name="kategori">
        <option value="elektronik">Elektronik</option>
        <option value="pakaian">Pakaian</option>
        <option value="makanan">Makanan</option>
      </select>

      <button type="submit" disabled={pending}>
        {pending ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  )
}
```

| Nilai | Tipe | Kegunaan |
|---|---|---|
| `state` | `HasilAction \| null` | Hasil action terakhir |
| `formAction` | fungsi | Dipasang ke `<form action={...}>` |
| `pending` | `boolean` | True selama action berjalan |

Untuk komponen di dalam form yang butuh tahu status submit, gunakan `useFormStatus`:

```tsx
'use client'
import { useFormStatus } from 'react-dom'

export function TombolSimpan() {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending}>Simpan</button>
}
```

> 💡 **`useFormStatus` harus berada di dalam `<form>`.** Ia membaca status
> form induknya. Untuk loading di komponen yang sama dengan form, pakai
> `pending` dari `useActionState`.

---

## 17.3 📦 Pola Hasil Action

Konsistenkan bentuk hasil action agar mudah ditangani di client. Pola yang direkomendasikan:

```ts
type ActionState<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; errors: Record<string, string[]>; message?: string }
```

Contoh dengan pesan sukses:

```ts
export async function tambahProduk(
  _prev: ActionState<{ id: number }> | null,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  const parsed = ProdukSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: 'Periksa kembali isian Anda',
    }
  }

  const produk = await db.produk.create({ data: parsed.data })
  return { success: true, data: { id: produk.id }, message: 'Produk disimpan' }
}
```

Di client, tipe ini memberi narrowing otomatis:

```tsx
if (state?.success) {
  console.log(state.data.id)     // ✅ ada data
} else if (state) {
  console.log(state.errors)      // ✅ ada errors
}
```

| Bentuk hasil | Kapan dipakai |
|---|---|
| `{ success: true; data }` | Sukses dengan data baru (id, entity) |
| `{ success: false; errors }` | Gagal validasi — error per field |
| `{ success: false; message }` | Gagal umum (mis. "stok habis") |
| `throw` | Bug/keadaan tak terduga — biarkan `error.tsx` menangkap |

---

## 17.4 🗄️ Tipe dari Prisma

Jika Anda memakai Prisma (lihat ebook Prisma di dokumentasi ini), tipe model bisa diambil langsung dari Prisma Client.

```ts
import type { Prisma } from '@prisma/client'

// Tipe entity lengkap
type Produk = Prisma.ProdukGetPayload<{}>

// Entity + relasi
type ProdukDenganKategori = Prisma.ProdukGetPayload<{
  include: { kategori: true }
}>

// Tipe input untuk create
type ProdukCreateInput = Prisma.ProdukCreateInput

// Tipe input untuk update (semua field opsional)
type ProdukUpdateInput = Prisma.ProdukUpdateInput
```

Pemakaian di Server Action:

```ts
const data: Prisma.ProdukCreateInput = {
  nama: parsed.data.nama,
  harga: parsed.data.harga,
  kategori: { connect: { id: parsed.data.kategoriId } },
}
await db.produk.create({ data })
```

| Tipe Prisma | Isi |
|---|---|
| `Prisma.ProdukGetPayload<{}>` | Entity lengkap |
| `Prisma.ProdukGetPayload<{ include: ... }>` | Entity + relasi |
| `Prisma.ProdukCreateInput` | Input create (relasi pakai `connect`) |
| `Prisma.ProdukUpdateInput` | Input update (semua opsional) |
| `Prisma.ProdukWhereInput` | Filter query |

> ⚠️ **Tipe Prisma ≠ tipe UI.** `ProdukGetPayload` berisi `Date`, `Decimal`,
> dan relasi yang tidak selalu bisa dikirim ke Client Component. Karena itu
> kita memisahkan DTO (bagian berikutnya).

---

## 17.5 🧱 Memisahkan Tipe Database dari Tipe UI (DTO)

Prinsipnya: **jangan bocorkan model database ke UI**. Buat DTO (Data Transfer Object) yang bentuknya persis kebutuhan UI.

```ts
// types/produk-dto.ts
export type ProdukDTO = {
  id: number
  nama: string
  harga: number          // Decimal → number
  kategoriNama: string   // relasi → field datar
  dibuatPada: string     // Date → ISO string
}

export function keProdukDTO(
  p: Prisma.ProdukGetPayload<{ include: { kategori: true } }>,
): ProdukDTO {
  return {
    id: p.id,
    nama: p.nama,
    harga: Number(p.harga),
    kategoriNama: p.kategori.nama,
    dibuatPada: p.dibuatPada.toISOString(),
  }
}
```

Alurnya:

```
Database (Prisma)
   │  ProdukGetPayload: Date, Decimal, relasi
   ▼
Mapper (keProdukDTO)
   │  konversi & ratakan
   ▼
DTO (ProdukDTO)
   │  string, number — serializable
   ▼
Client Component / JSON API ✅
```

| Masalah tanpa DTO | Dengan DTO |
|---|---|
| `Date`/`Decimal` gagal di-serialize | Semua field serializable |
| UI bergantung pada skema database | UI stabil meski skema berubah |
| Field sensitif ikut terkirim | Hanya field yang dibutuhkan |

> 💡 **Aturan:** Server Action dan Route Handler selalu mengembalikan DTO,
> bukan entity Prisma mentah. Ini melindungi Anda dari kebocoran data
> (mis. `passwordHash`) dan error serialisasi.

---

## 17.6 🎬 Studi Kasus: Form Tambah Artikel + Zod + Error per Field

Gabungkan semuanya dalam satu alur lengkap.

**1. Schema & tipe hasil:**

```ts
// app/actions/artikel.ts
'use server'

import { z } from 'zod'

const ArtikelSchema = z.object({
  judul: z.string().min(3, 'Judul minimal 3 karakter').max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug hanya huruf kecil, angka, dan tanda hubung'),
  isi: z.string().min(50, 'Isi minimal 50 karakter'),
  kategori: z.enum(['tips', 'tutorial', 'opini']),
})

export type ArtikelState =
  | { success: true; id: number }
  | { success: false; errors: Record<string, string[]> }
```

**2. Server Action:**

```ts
export async function simpanArtikel(
  _prev: ArtikelState | null,
  formData: FormData,
): Promise<ArtikelState> {
  const parsed = ArtikelSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  const artikel = await db.artikel.create({ data: parsed.data })
  revalidatePath('/artikel')
  return { success: true, id: artikel.id }
}
```

**3. Client Component dengan error per field:**

```tsx
'use client'

import { useActionState } from 'react'
import { simpanArtikel, type ArtikelState } from '@/app/actions/artikel'

export function FormArtikel() {
  const [state, action, pending] = useActionState<ArtikelState | null, FormData>(
    simpanArtikel,
    null,
  )

  const err = (field: string) =>
    state?.success === false ? state.errors[field]?.[0] : undefined

  return (
    <form action={action}>
      <label>
        Judul
        <input name="judul" />
        {err('judul') && <span className="error">{err('judul')}</span>}
      </label>

      <label>
        Slug
        <input name="slug" />
        {err('slug') && <span className="error">{err('slug')}</span>}
      </label>

      <label>
        Isi
        <textarea name="isi" rows={8} />
        {err('isi') && <span className="error">{err('isi')}</span>}
      </label>

      <label>
        Kategori
        <select name="kategori">
          <option value="tips">Tips</option>
          <option value="tutorial">Tutorial</option>
          <option value="opini">Opini</option>
        </select>
        {err('kategori') && <span className="error">{err('kategori')}</span>}
      </label>

      <button type="submit" disabled={pending}>
        {pending ? 'Menyimpan...' : 'Simpan Artikel'}
      </button>

      {state?.success && <p role="status">Artikel berhasil disimpan.</p>}
    </form>
  )
}
```

Alur data lengkapnya:

```
<form action={action}>
      │  FormData (string mentah)
      ▼
simpanArtikel (server)
      │  Object.fromEntries → safeParse(Zod)
      ├─ gagal → { success:false, errors } ──► tampil per field
      ▼
db.artikel.create(parsed.data)   ← data sudah tervalidasi
      │
      ▼
{ success:true, id } ──► revalidatePath → halaman ter-update
```

Yang membuat alur ini production-ready:

- **Validasi ganda** — HTML `required` untuk UX, Zod untuk keamanan (client bisa dilewati).
- **Error per field** — user tahu persis isian mana yang salah.
- **Tipe end-to-end** — `ArtikelState` dipakai server & client, tidak ada `any`.
- **Loading state** — `pending` dari `useActionState`.
- **Cache invalidation** — `revalidatePath` setelah sukses.
- **Tanpa `fetch` manual** — Server Action menghilangkan boilerplate endpoint.

---

## ✅ Checklist Bab 17

- **`'use server'`** — menandai Server Action; argumen & return harus serializable.
- **`FormData` mentah** — selalu divalidasi Zod; `z.coerce` untuk angka dari input.
- **Return type eksplisit** — `Promise<ActionState>` sebagai kontrak server-client.
- **`useActionState`** — memberi `state`, `formAction`, dan `pending` sekaligus.
- **`useFormStatus`** — untuk tombol/komponen di dalam form; harus berada di dalam `<form>`.
- **Pola hasil** — `{ success: true; data } | { success: false; errors }`; narrowing otomatis di client.
- **Tipe Prisma** — `Prisma.ProdukGetPayload`, `ProdukCreateInput`, `ProdukWhereInput`.
- **DTO** — jangan kirim entity Prisma mentah ke UI; konversi `Date`/`Decimal`/relasi.
- **Error per field** — `error.flatten().fieldErrors` dari Zod, ditampilkan dekat input.
- **`revalidatePath`** — segarkan data setelah mutasi sukses.

---

⏭️ Lanjut ke [🌐 Bab 18 — Fetching, Environment & Konfigurasi](/bagian-6/bab-18) untuk melanjutkan!
