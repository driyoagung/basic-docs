---
title: "Bab 15 — Pola Lanjutan di React + TS"
---

# 📖 Bab 15 — Pola Lanjutan di React + TS

Sampai di sini Anda bisa mengetik komponen dan hooks dengan benar. Bab ini menaikkan levelnya ke pola-pola yang dipakai library UI dunia nyata: komponen generik yang tipe datanya mengikuti data yang dikirim, props bervarian eksklusif dengan discriminated union, komponen polymorphic dengan prop `as`, dan form yang tipenya otomatis dari schema Zod. Pola-pola ini bukan teori kosong — kalau Anda buka kode sumber `shadcn/ui`, `TanStack Table`, atau `React Hook Form`, semua pola di bab ini ada di sana. Setelah bab ini, membaca kode UI modern tidak lagi terasa "berhantu".

## 15.1 🧬 Generic Component: `List<T>`

Generics tidak hanya untuk fungsi — komponen juga bisa. Ini versi komponen dari generic function `pertama<T>` di Bab 7:

```tsx
type ListProps<T> = {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

export function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

// Pemakaian — TS menginfer T = Produk dari items:
<List items={produkList} renderItem={(p) => <span>{p.nama}</span>} />

// Pemakaian dengan union:
<List items={[1, 2, 3]} renderItem={(n) => <b>{n + 1}</b>} />
```

**Penjelasan:**

- **`<List<T> items={...} renderItem={...} />`** — T tidak ditulis manual oleh pemanggil; TS menginfer dari `items`. Karena itu `renderItem` otomatis menerima parameter bertipe `T` yang benar.
- **Satu komponen untuk semua data** — tanpa generics Anda perlu `ProductList`, `UserList`, `OrderList`. Dengan generics, satu `List<T>`.
- **Analogi** — komponen generik adalah cetakan ECCH fungsi server: bentuk tetap (ul/li), isinya (tipe) ditentukan pemanggil.

- **`<List<T> items={...} renderItem={...} />`** — T tidak ditulis manual oleh pemanggil; TS menginfer dari `items`. Karena itu `renderItem` otomatis menerima parameter bertipe `T` yang benar.
- **Satu komponen untuk semua data** — tanpa generics Anda perlu `ProductList`, `UserList`, `OrderList`. Dengan generics, cukup satu `List<T>`.
- **Analogi dari Bab 7** — komponen generik adalah cetakan kue dengan ukuran bisa diatur: bentuknya tetap (ul/li), isinya (tipe) ditentukan pemanggil.

::: warning ⚠️ Jangan Anehkan Tipe
Saat menulis komponen generik, biarkan T diinfer dari props — jangan
memaksakan anotasi tambahan yang membuat pemanggil harus menulis
`<List<Produk> ...>` secara manual untuk setiap pemakaian.
:::

## 15.2 🔀 Props Discriminated Union — Varian yang Saling Eksklusif

Kadang komponen punya dua MODE yang props-nya berbeda: `text-btn` dengan kopling (`href`), atau `button` dengan event handler (`onClick`). Union props membuat mode saling eksklusif — pemanggil tidak bisa mencampur modes:

```tsx
type TabProps =
  | { variant: 'outline'; border: 'thin' | 'thick' }
  | { variant: 'filled'; color: 'primary' | 'danger' }

export function Tabs({ variant }: TabProps) {
  // ... render sesuai varian
}

// ✅ Valid:
<Tabs variant="outline" border="thin" />
<Tabs variant="filled" color="primary" />

// ❌ ERROR — menyalin kedua mode:
<Tabs variant="outline" color="danger" />
```

**Penjelasan:**

- **`variant` adalah discriminator** — TS hanya menerima field milik cabang varian yang dipilih. `border` tidak ada di varian `filled`, dan sebaliknya.
- **Tanpa discriminated union** — semua field harus opsional dan bisa dicampur; bug "varian outline pakai warna danger" lolos tanpa ada error.
- **Pola ini paling sering muncul di modal** — dialog bisa punya varian tanpa tombol aksi vs varian dengan tombol; discriminator memastikan kedua bentuk tidak tercampur.

## 15.3 🎭 Polymorphic Component — Prop `as`

Komponen polymorphic memungkinkan pemanggil memilih elemen HTML yang dirender: `<Text as="h1">` atau `<Text as="p">`. Bentuk paling sederhana:

```tsx
import type { ReactNode } from 'react'

type TextProps<T extends React.ElementType> = {
  as?: T
  children: ReactNode
}

export function Text<T extends React.ElementType = 'span'>({ as, children }: TextProps<T>) {
  const Tag = (as ?? 'span') as React.ElementType
  return <Tag>{children}</Tag>
}

// Pemakaian:
<Text as="h1">Judul</Text>   // render: <h1>Judul</h1>
<Text>Paragraf</Text>        // render: <span>Paragraf</span>
```

**Penjelasan:**

- **`T extends React.ElementType`** — T dibatasi ke tipe-tipe elemen/respons React yang valid (`'span'`, `'h1'`, `'button'`, atau komponen lain).
- **Pengenalan ringan saja** — versi penuh polymorphism (autocomplet proses native props undefined pasculus elemen tertentu) dari CastsKeyboardnya terlalu dini; Plugin commissioned `as` version baik.
- **Pola ini tambahan dari UI libraries** — Tailwind & UI kit preference - variatif comps as cheap overkill; keep it simple.sysail.

- **`T extends React.ElementType`** — T dibatasi ke tipe-tipe elemen React yang valid (`'span'`, `'h1'`, `'button'`, atau komponen lain).
- **Ini pengenalan ringan saja** — versi polymorphic penuh dapat mengetik props native sesuai elemen terpilih, tapi tekniknya jauh lebih rumit; untuk banyak kasus, versi di atas sudah cukup.
- **Dipakai di library UI sungguhan** — komponen `Text`, `Heading`, dan `Button` di beberapa design system persis memakai pola prop `as` ini.

## 15.4 📝 Form Bertipe: React Hook Form + Zod

Combination RHF + Zod menghilangkan "menulis tipe dua kali" (sekali schema, sekali tipe form). Tipe form langsung dari `z.infer`:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const FormSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email salah'),
  usia: z.number().min(17, 'Minimal 17 tahun'),
})

type FormData = z.infer<typeof FormSchema>   // ✅ { nama: string; email: string; usia: number }

export function Daftar() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  })

  return (
    <form onSubmit={handleSubmit((data) => simpan(data))}>
      <input {...register('nama')} />
      {errors.nama && <p>{errors.nama.message}</p>}
      {/* ...field lainnya */}
    </form>
  )
}
```

**Penjelasan:**

- **`z.infer<typeof FormSchema>`** — schema Zod adalah SATU sumber kebenaran: runtime (validasi) dan compile time (tipe) berasal dari definisi yang sama. Mengubah schema otomatis mengubah tipe.
- **`register('nama')`** — nama field DICEK TS: kalau `'naem'` typo, langsung error. Ini manfaat terbesar RHF + TS.
- **`errors` bertipe sempit** — `{ errors.nama?.message }` hanya valid untuk field yang ada; tidak ada lagi nama pesan error yang kadal.
- **`errors` bertipe sempit** — `errors.nama?.message` hanya valid untuk field yang ada; tidak ada lagi nama field error yang kadaluwarsa.
- **`handleSubmit` mengirim data yang sudah "bener"** — callback `data` otomatis bertipe `FormData` hasil validasi, tidak perlu membaca `FormData` HTML secara manual.

::: tip 💡 Satu Sumber Kebenaran
Dengan Zod, schema adalah satu-satunya sumber kebenaran: validasi
runtime, tipe compile-time, dan pesan error semuanya lahir dari satu
definisi. Skema berubah → tipe & validasi ikut berubah otomatis.
:::

## 15.5 🏛️ Context + Reducer Bertipe untuk State Global

Sekarang rakit 14.4 + 14.5 menjadi satu pola state global yang lengkap: reducer bertipe di dalam context, dengan hook akses yang aman:

```tsx
type State = {
  items: Produk[]
  total: number
}

type Action =
  | { type: 'tambah'; item: Produk }
  | { type: 'hapus'; id: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tambah': {
      const items = [...state.items, action.item]
      return { items, total: items.reduce((s, p) => s + p.harga, 0) }
    }
    case 'hapus': {
      const items = state.items.filter((p) => p.id !== action.id)
      return { items, total: items.reduce((s, p) => s + p.harga, 0) }
    }
  }
}

const KeranjangContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

function useKeranjang() {
  const ctx = useContext(KeranjangContext)
  if (!ctx) throw new Error('useKeranjang harus di dalam KeranjangProvider')
  return ctx
}
```

**Penjelasan:**

- **`React.Dispatch<Action>`** — tipe bawaan untuk fungsi `dispatch`; ini membuat pemakai context bisa `dispatch({ type: 'tambah', item: p })` dengan pengecekan penuh.
- **Kombinasi tiga pola** — context dengan default `null` (14.5), reducer dengan union action (14.4), dan nilai turunan (`total`) dihitung di dalam reducer.
- **Kapan reducer lebih baik dari beberapa `useState`** — jika ada banyak event yang mengubah beberapa field sekaligus, reducer + union action jauh lebih mudah dijitak (trace) karena semua perubahan lewat satu pintu.

## 15.6 🔧 Mengetik Library Pihak Ketiga yang Tipenya Kurang Lengkap

Tidak semua library punya tipe yang baik. Solusinya bertingkat — mulai paling ringan:

```tsx
// 1. Alias lokal dengan tipe wajar:
type LibFunc = (input: string) => Promise<number>

// 2. Deklarasi modul minimal (file .d.ts Anda sendiri):
declare module 'library-tanpa-tipe' {
  export function main(option?: string): void
}

// 3. Jika benar-benar darurat — gunakan hemat:
// @ts-expect-error library ini belum punya tipe lengkap
import { bahaya } from 'library-tanpa-tipe'
```

**Penjelasan:**

- **Alias lokal** — bungkus API library dengan tipe yang Anda butuhkan, sisanya tetap tersembunyi: sistem tipe bersih untuk semua tim.
- **`declare module`** — cara paling disegani memberi tipe minimal pada module tanpa tipe. Bab 11 sudah memperkenalkan deklarasi `.d.ts` — ini praktiknya.
- **`@ts-expect-error` hanya darurat** — sertakan komentar alasan + rencana hapus; begitu library merilis tipe resmi, baris penanda ini wajib dilapangkan.

Perbandingan tiga layer "sungguhan":

| Layer                     | Kapan dipakai                                    | Risiko                                     |
| -------------------------- | -------------------------------------------------- | -------------------------------------------- |
| Alias tipe lokal           | Library bagus tipe tapi API-nya lebar            | Kecil                                       |
| `declare module`           | Library tanpa `@types` sama sekali               | Sedang (tipe bisa jadi usang)               |
| `@ts-expect-error`         | Kasus langka, ada TODO                           | Tinggi (editor bisu di baris itu)           |

## 15.7 🎬 Studi Kasus: `DataTable<T>` Generik

Sekarang tutup bab ini dengan studi kasus besar: tabel data generik yang bisa dipakai untuk produk, user, atau order — miniatur dari `TanStack Table`.

```tsx
type Kolom<T> = {
  header: string
  accessor: (row: T) => React.ReactNode
}

type DataTableProps<T> = {
  data: T[]
  kolom: Kolom<T>[]
}

export function DataTable<T>({ data, kolom }: DataTableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {kolom.map((k) => (
            <th key={k.header}>{k.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {kolom.map((k) => (
              <td key={k.header}>{k.accessor(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

Sekarang lihat bagaimana satu komponen hidup dengan tiga model data berbeda:

```tsx
// T = Produk (diinfer dari data):
<DataTable
  data={produkList}
  kolom={[
    { header: 'Nama',  accessor: (p) => p.nama },
    { header: 'Harga', accessor: (p) => formatRupiah(p.harga) },
  ]}
/>

// T = User:
<DataTable
  data={userList}
  kolom={[
    { header: 'Email', accessor: (u) => u.email },
    { header: 'Role',  accessor: (u) => <Badge>{u.role}</Badge> },
  ]}
/>
```

**Penjelasan:**

- **T mengikuti `data`** — pemanggil tidak pernah menulis `<DataTable<Produk>`; TS menginfer dari argumen `data`, lalu memvalidasi `kolom` terhadap T-nya.
- **`(row) => ...` diinfer dan diperiksa** — di `data={produkList}`, parameter `p` otomatis `Produk`; akses `p.email` langsung ditolak TS.
- **`accessor` mengembalikan `React.ReactNode`** — catatan: cell tabel boleh string, angka, atau JSX; inilah alasan return typenya `ReactNode`, BUKAN `string`.
- **Sumber kebenaran `Kolom<T>`** — jika seorang developer menambah kolom baru, TS memastikan `accessor`-nya membaca field yang benar-benar ada di model data tersebut.

::: tip 💡 Naikkan Levelnya Sendiri
Coba tambahkan `sortable?: boolean` pada `Kolom<T>`, lalu di
`DataTable<T>` tambahkan `onSort?: (kolom: string) => void`. Semua
tipe akan tetap aman karena semuanya parametrik terhadap T.
:::

## 15.8 🧭 Peta Menuju Next.js

Semua pola di bab ini berlanjut ke bagian VI — komponen generik kembali di halaman dan data fetching, union result muncul lagi di Server Actions (pola `{ success: true } | { success: false }`), dan form RHF + Zod dipasangkan dengan Server Action:

```
BAB INI (React)                    BAB BERIKUT (Next.js)
────────────────────              ─────────────────────
List<T>, DataTable<T>      ──▶    DataTable untuk page & route data
Props discriminated union  ──▶    Result { success: true | false }
RHF + Zod                  ──▶    Server Action + Zod + useActionState
```

## ✅ Checklist Bab 15

| Poin | Sudah paham? |
| --- | --- |
| Generic component `List<T>` dan inference dari `items` | ☐ |
| Props discriminated union untuk varian eksklusif | ☐ |
| Polymorphic component (`as`) — pengenalan | ☐ |
| React Hook Form + Zod dengan `z.infer` | ☐ |
| Context + reducer bertipe untuk state global | ☐ |
| Mengetik library pihak ketiga (alias, `declare module`, `ts-expect-error`) | ☐ |
| `DataTable<T>` generik untuk banyak model | ☐ |

---

⏭️ Lanjut ke [📄 Bab 16 — Typing App Router](/bagian-6/bab-16) untuk melanjutkan!
