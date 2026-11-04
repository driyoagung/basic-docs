---
title: "Bab 13 — Typing Komponen, Props & Event"
---

# 📖 Bab 13 — Typing Komponen, Props & Event

Hampir seluruh pekerjaan Anda di React berputar di sekitar tiga hal: komponen, props, dan event. Dalam JavaScript murni, semua itu berjalan tanpa pengawasan — komponen bisa menerima prop apa pun, bisa salah mengirim nama prop, dan efek baru terasa saat runtime. Dengan TypeScript, semua itu terkunci: bentuk props didefinisikan sekali, pemanggilan dengan prop yang salah nama langsung digarisbawahi di editor, dan event handler mendapat tipe yang presisi. Tanpa typing, aplikasi React hanya "berharap" `props.user` memang ada; dengan typing, kesalahan tertangkap sebelum aplikasi dijalankan. Bab ini adalah fondasi bagi dua bab berikutnya, jadi pelajari setiap konsepnya dengan tenang.

## 13.1 🧩 Props — Dasar Mengetik Komponen

Cara paling idiomatis mengetik komponen React: definisikan tipe props terlebih dahulu, lalu pakai sebagai anotasi parameter fungsi komponen.

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

**Penjelasan:**

- **`produk: Produk`** — pemanggil wajib mengirim object sesuai tipe `Produk`. Field salah nama atau salah tipe langsung protes di editor.
- **`onBeli: (id: number) => void`** — prop berupa fungsi; yang penting signature-nya: menerima `number`, mengembalikan apa pun (diabaikan).
- **`aktif?: boolean`** — tanda `?` membuat opsional; nilai default diisi lewat destructuring (`= true`), bukan di dalam tipe.
- **`children?: React.ReactNode`** — slot fleksibel untuk konten JSX apa pun, dibahas khusus di 13.3.

Visualisasi alur tipe dari pemanggil ke definisi komponen:

```
PEMANGGIL                              DEFINISI KOMPONEN
<ProductCard                           type ProductCardProps = {
  produk={laptop}   ── Produk ──────▶     produk   : Produk              ✅ cocok
  onBuy={salah}     ── fungsi ──────▶    onBeli    : (id:number)=>void   ❌ nama salah!
  aktif={false}     ── boolean ─────▶    aktif?    : boolean             ✅ opsional
/>
──────────────────────────────────────────────────────────────────────
TS membandingkan prop yang DIKIRIM dengan prop yang DITULIS.
Ketidakcocokan = error langsung di editor, sebelum runtime.
```

::: tip 💡 Praktik yang Disarankan
Tipe props menempel di file yang sama dengan komponen dan diekspor
bersama komponen. Banyak tim memakai akhiran `XxxProps` supaya mudah
dikenali saat autocompletion menampilkan komponen tersebut.
:::

## 13.2 ⚖️ `type` vs `interface` untuk Props

Dua sintaks berikut sama-sama valid untuk props. Ini ringkasan versi yang relevan untuk komponen React (tabel lengkap sudah dibahas di Bab 5):

| Aspek                     | `type`                              | `interface`                          |
| ------------------------- | ------------------------------------ | ------------------------------------- |
| Mengetik props object     | ✅                                   | ✅                                    |
| Union / tuple / primitif  | ✅ (`type Status = 'a' \| 'b'`)       | ❌ tidak bisa                         |
| Extend                    | `&` (intersection)                   | `extends`                             |
| Declaration merging       | ❌                                   | ✅                                    |
| Rekomendasi praktis       | Serbaguna, cukup untuk hampir semua  | Bagus untuk object/class publik       |

**Penjelasan perbandingan:**

- **Union / primitif** — hanya `type` yang bisa, dan union akan sangat sering dipakai di React (state loading/error/success).
- **Declaration merging** — `interface` yang dideklarasikan dua kali digabung otomatis. Ini rawan jadi sumber bug yang sulit dilacak, tapi berguna untuk augmentasi tipe (nanti dibahas di Bab 18).
- **Aturan praktis** — pilih SATU dan konsisten. Dalam ebook ini kami pakai `type`.

## 13.3 🎁 children: `React.ReactNode` vs `React.ReactElement`

Dua tipe ini sering tertukar. Perbedaannya terletak pada jangkauan tipe yang diterima:

| Yang dilewatkan sebagai `children` | `React.ReactNode` | `React.ReactElement` |
| ----------------------------------- | ------------------ | ---------------------- |
| String (`"Halo"`)                   | ✅                 | ❌                     |
| Angka (`42`)                        | ✅                 | ❌                     |
| Elemen JSX (`<span>Hai</span>`)     | ✅                 | ✅                     |
| Array elemen / fragment             | ✅                 | ✅                     |
| `null` / `undefined` / boolean      | ✅                 | ❌                     |
| Promise (React 19 `use()`)          | ✅                 | ❌                     |

**Penjelasan:**

- **`React.ReactNode`** — himpunan terluas: semua yang bisa dirender React. Pilihan default untuk slot konten.
- **`React.ReactElement`** — hanya satu elemen JSX. Berguna saat Anda perlu membaca `type` atau `props` dari child, misalnya untuk pola komponen compound.

```tsx
type CardProps = {
  children?: React.ReactNode    // ✅ default: fleksibel
}

export function Card({ children }: CardProps) {
  return <div className="card">{children}</div>
}

// ❌ Jika children: React.ReactElement, contoh ini error:
// <Card>Teks biasa</Card>
//    ~~~~  Type 'string' is not assignable to type 'ReactElement'
```

Kalau ragu, tulis `children?: React.ReactNode`. Turunkan ke `React.ReactElement` hanya saat komponen Anda memang perlu membaca atau meng-clone elemennya.

## 13.4 🖱️ Tipe Event Handler

Setiap event React punya tipe. Dua yang paling sering dipakai: mengubah input dan submit form.

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

Tabel referensi event yang pasti Anda temui:

| Event React             | Tipe TypeScript                          | Kapan dipakai                           |
| ------------------------ | ----------------------------------------- | ---------------------------------------- |
| `onChange`               | `React.ChangeEvent<HTMLInputElement>`     | input, select, textarea — ambil `value`  |
| `onSubmit`               | `React.FormEvent<HTMLFormElement>`        | `<form onSubmit>` — `preventDefault`     |
| `onKeyDown` / `onKeyUp`  | `React.KeyboardEvent<HTMLInputElement>`   | tangkap Enter, Escape, tombol panah      |
| `onClick`                | `React.MouseEvent<HTMLButtonElement>`     | klik pada button, div, dsb               |
| `onFocus` / `onBlur`     | `React.FocusEvent<HTMLInputElement>`      | validasi saat keluar/masuk field         |

**Penjelasan:**

- **Elemen generik itu penting** — `ChangeEvent<HTMLInputElement>` membuat TS tahu `e.target` adalah input sehingga `e.target.value` bertipe `string`. Untuk `<textarea>` atau `<select>`, isi generiknya sesuai elemen.
- **Trik cepat di editor** — tulis `const onChange = (e) => setQ(e.target.value)` lalu arahkan cursor ke `e`. Editor menampilkan tipe lengkap yang diminta handler JSX. Salin, tempel, selesai.
- **Inline pun bisa** — `onClick={(e) => ...}` langsung di JSX membuat TS menginfer tipe `e` otomatis. Anotasi eksplisit paling berguna ketika handler dipisah jadi fungsi terpisah.

## 13.5 🔀 Meneruskan Props Elemen HTML: `ComponentProps<'button'>`

Sering kali Anda ingin komponen Button sendiri dengan tampilan bebas, tapi tetap menerima semua props native `<button>` (`type`, `disabled`, `onClick`, dll). Ada utility khusus untuk kebutuhan ini:

```tsx
type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={variant === 'ghost' ? 'bt bt-ghost' : 'bt bt-primary'}
    />
  )
}
```

**Penjelasan:**

- **`React.ComponentProps<'button'>`** — menyerap SEMUA props native elemen `<button>`: `type`, `disabled`, `onClick`, `aria-*`, dan lainnya.
- **`& { variant?: ... }`** — intersection menambahkan props kustom di atas props native.
- **`{...rest}`** — semua props lain tetap diteruskan ke elemen native. Pola *props forwarding* ini jadi tulang punggung komponen reusable.

Utility serupa yang layak kenal:

| Utility                                  | Fungsi                                          |
| ------------------------------------------ | ------------------------------------------------ |
| `React.ComponentProps<'button'>`           | Semua props elemen HTML `<button>`               |
| `React.ComponentProps<typeof Komponen>`    | Semua props komponen React (kustom/library)      |
| `React.ComponentPropsWithoutRef<'button'>` | Tanpa `ref` (jarang perlu di React 18+)          |
| `React.HTMLAttributes<HTMLDivElement>`     | Props HTML dasar saja (`className`, `style`, dsb)|

## 13.6 ⚙️ Menurunkan Tipe dari Komponen Lain

Utility `ComponentProps` tidak hanya untuk elemen HTML; bisa juga dipakai ke komponen Anda sendiri atau dari library:

```tsx
import { Input as UiInput } from './ui/Input'

type LabeledInputProps = React.ComponentProps<typeof UiInput> & {
  label: string
}

export function LabeledInput({ label, ...rest }: LabeledInputProps) {
  return (
    <label className="block">
      <span>{label}</span>
      <UiInput {...rest} />
    </label>
  )
}
```

**Penjelasan:**

- **`typeof UiInput`** — mengambil tipe dari nilai (komponen) tersebut; Anda tidak perlu tahu isi file-nya.
- **Otomatis ikut berkembang** — jika library mengubah props di versi baru, wrapper ini mengikuti tanpa Anda sunting.
- **`label: string` tanpa `?`** — props tambahan yang wajib. Bandingkan dengan turunan `ComponentProps` yang bersifat opsional sesuai elemen aslinya.

::: warning ⚠️ Jangan Menipu Diri dengan `any`
Mengganti `ComponentProps<'button'>` dengan `props: { [k: string]: any }`
berarti menghapus seluruh proteksi tipe di tombol Anda. Itu penyiasatan,
bukan solusi — editor bisu, bug lolos, refactor jadi berisiko.
:::

## 13.7 🚫 Mengapa `React.FC` Tidak Direkomendasikan

Dulu banyak tutorial menulis komponen dengan anotasi `React.FC<Props>`. Di ekosistem modern, pola ini tidak lagi direkomendasikan:

| Masalah                                    | Yang lebih disukai                              |
| ------------------------------------------- | ------------------------------------------------ |
| `React.FC` implisit menambah `children`     | Tulis `children` manual di tipe props jika perlu |
| Generics rancu (`React.FC<Props<T>>`)       | Komponen fungsi biasa, generics lebih jelas      |
| Dua alias tipe per komponen (props + FC)    | Satu tipe props, anotasi di parameter fungsi     |

```tsx
// ❌ Cara lama
const Counter: React.FC<{ initial: number }> = ({ initial }) => {
  return <span>{initial}</span>
}

// ✅ Cara modern
type CounterProps = {
  initial?: number
}

export function Counter({ initial = 0 }: CounterProps) {
  const [count, setCount] = useState(initial)
  return <button onClick={() => setCount(n => n + 1)}>{count}</button>
}
```

**Penjelasan:**

- **`React.FC` tidak berbahaya** — banyak codebase memakainya sampai sekarang. Masalahnya bukan error, tapi lebih banyak gesekan: alias ganda, generics rumit, dan perilaku bawaan yang berubah antar versi React.
- **React 18 ke atas** — `children` tidak lagi implisit di `React.FC`; kalau butuh, tulis sendiri di tipe props. Lebih jujur dan eksplisit.
- **Return type** — komponen fungsi dapat mengembalikan `JSX.Element | null`; inference TS sudah menanganinya tanpa `React.FC`.

## 13.8 🎬 Studi Kasus: Komponen UI Bertype & Reusable

Mari rakit semua yang dipelajari jadi satu set komponen UI kecil yang bisa dipakai ulang. Gambaran strukturnya:

```
src/
├── lib/
│   └── cn.ts               ← util menggabungkan nama class (opsional)
└── components/
    └── ui/
        ├── Button.tsx      ← ComponentProps<'button'> + variant & size
        ├── Input.tsx       ← ComponentProps<'input'> + error
        └── Card.tsx        ← children?: React.ReactNode
```

Komponen `Button` dengan tabel varian memakai union + `Record`:

```tsx
// components/ui/Button.tsx
import { cn } from '@/lib/cn'

export type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  danger:    'bg-red-600 text-white hover:bg-red-700',
}

const SIZE_CLASS: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn('rounded font-medium', VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
    />
  )
}
```

Komponen `Input` dengan penanda error:

```tsx
// components/ui/Input.tsx
import { cn } from '@/lib/cn'

export type InputProps = React.ComponentProps<'input'> & {
  error?: string
}

export function Input({ error, className, ...rest }: InputProps) {
  return (
    <div>
      <input {...rest} className={cn('input', error && 'input-error', className)} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
```

**Penjelasan studi kasus:**

- **`Record<union, string>`** — peta varian → class. Jika jenis union ditambah tapi peta tidak diisi, TS langsung error; tidak ada varian yang tersesat tanpa class.
- **`{...rest}`** — semua kemampuan native tetap tersedia bagi pemanggil, tanpa perlu dideklarasi satu per satu.
- **Ekstensi kecil jadi besar** — pola props forwarding + union varian inilah cara library UI seperti shadcn/ui menyusun komponennya.

Sebagai penutup, begini perjalanan materi bagian React ini:

```
Bab 13 (bab ini)          Bab 14 ⭐                  Bab 15
──────────────────        ────────────────────       ──────────────────
Props & event typing  ──▶ useState & union null  ──▶  Komponen generik <T>
ComponentProps<...>   ──▶ useRef (DOM vs value)  ──▶  Props discriminated union
UI kit bertipe        ──▶ useReducer + union     ──▶  Polymorphic component (as)
Children typing       ──▶ useContext null-check  ──▶  Form RHF + Zod, DataTable<T>
```

## ✅ Checklist Bab 13

| Poin | Sudah paham? |
| --- | --- |
| Mengetik props via `type` dengan anotasi parameter fungsi | ☐ |
| `children?: React.ReactNode` vs `ReactElement` dan kapan pakainya | ☐ |
| Mengenali tipe event `ChangeEvent`, `FormEvent`, `KeyboardEvent`, `MouseEvent` | ☐ |
| Meneruskan props elemen HTML dengan `ComponentProps<'button'>` | ☐ |
| Menurunkan tipe dari komponen lain via `ComponentProps<typeof K>` | ☐ |
| Memahami alasan `React.FC` tidak lagi direkomendasikan | ☐ |
| Membangun set komponen UI bertipe & reusable (Button/Input/Card) | ☐ |

---

⏭️ Lanjut ke [🪝 Bab 14 — Typing Hooks](/bagian-5/bab-14) untuk melanjutkan!
