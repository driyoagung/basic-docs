---
title: "Bab 14 — Typing Hooks"
---

# 📖 Bab 14 — Typing Hooks

> ⭐ **Bab PALING KRITIS** — tempat pemula paling sering bingung di React + TS, dan tempat yang paling sering dipakai sehari-hari!

Jika Bab 13 mengajarkan Anda "mengetik pintu masuk data" (props), bab ini mengajarkan mengetik pintu internal komponen: state, ref, reducer, context, dan hooks buatan sendiri. Sintaksnya sesederhana menambah generik seperti `useState<User | null>(null)`, tapi jebakannya halus: array kosong yang tiba-tiba jadi `never[]`, `useRef` yang punya dua wajah berbeda, context default `null` yang diabaikan sampai crash. Menguasai bab ini berarti sebagian besar kesalahan React + TS yang kelihatan "aneh" akan langsung Anda mengerti penyebabnya. Luangkan waktu ekstra di sini; dua bab setelahnya jauh lebih mudah kalau fondasi ini kuat.

## 14.1 🎯 `useState` — Inference & Union dengan `null`

Kabar baik: `useState` sebagian besar mengetik dirinya sendiri lewat inference. Ini tiga kasus dasar yang harus Anda hafal di luar kepala:

```tsx
const [count, setCount] = useState(0)                     // inference: number
const [user, setUser] = useState<User | null>(null)       // union dengan null
const [items, setItems] = useState<Produk[]>([])          // array kosong butuh tipe!
```

**Penjelasan:**

- **`useState(0)`** — nilai awal `0` membuat TS menginfer `number`. Tidak perlu menulis `useState<number>(0)`.
- **`useState<User | null>(null)`** — tanpa anotasi, nilai awal `null` menginfer tipe `null` saja, sehingga `setUser(budi)` jadi error. Union `User | null` membuat setter menerima kedua bentuk, dan membaca `user` memaksa penanganan kasus kosong.
- **`useState<Produk[]>([])`** — array kosong tidak memberi TS petunjuk apa pun; ini dibahas khusus di 14.2.
- **Kapan butuh anotasi?** — hanya ketika nilai awal tidak merepresentasikan seluruh rentang nilai: `null`, string/angka kosong, atau array kosong.

Pola yang akan Anda tulis puluhan kali:

```tsx
const [produk, setProduk] = useState<Produk | null>(null)

useEffect(() => {
  ambilProduk().then(setProduk)
}, [])

if (produk === null) return <p>Memuat…</p>   // penjaga null (narrowing)
return <h1>{produk.nama}</h1>                // di sini TS tahu: Produk
```

## 14.2 🕳️ Jebakan `useState([])` — "never[]"

Ini jebakan nomor satu pemula, jadi mari kita periksa pelan-pelan:

```tsx
const [items, setItems] = useState([])

setItems([{ id: 1, nama: 'Laptop' }])
// ❌ ERROR: Argument of type '{ id: number; nama: string }'
//    is not assignable to parameter of type 'never'
```

Kenapa tipe bilang `never` kalau array-nya kosong? Ikuti alurnya:

```
useState([])
   │  nilai awal: array kosong — tidak ada SATU PUN petunjuk tipe
   ▼
TS menginfer: never[]    (array dari "tipe mustahil")
   ▼
setItems([{ id: 1, ... }])  →  ❌ ditolak! Apa pun bukan never
```

**Penjelasan:**

- **Inferensi dari nilai awal** — `useState` menentukan T dari apa yang Anda lewatkan. Array kosong: tidak ada elemen, tidak ada bukti tipe, jadi TS memilih `never`.
- **`setItems` menolak data** — karena `never` tidak punya anggota, apa pun yang Anda masukkan nanti pasti gagal. Inilah "jebakan bisu": kode terlihat wajar, tapi semua perubahan state berikutnya buntu.

Solusinya hanya satu — beri anotasi generik:

```tsx
const [items, setItems] = useState<Produk[]>([])     // ✅ T = Produk
```

Yang berubah setelah anotasi:

| Aspek                                       | Saat `useState([])`              | Saat `useState<Produk[]>([])`       |
| -------------------------------------------- | --------------------------------- | ------------------------------------ |
| Tipe `items`                                | `never[]`                         | `Produk[]`                           |
| `setItems([{ id: 1, nama: 'Laptop' }])`     | ❌ error sekali                   | ✅ valid                             |
| `items.length`                              | ✅ (dari `never[]`, bergantung)   | ✅                                   |
| `items[0]?.nama`                            | Autocomplete tidak menolong       | Autocomplete `Produk` lengkap        |

::: warning ⚠️ Jadikan Refleks
Ketika melihat tipe `never[]` muncul dari `useState([])`, jangan
mencoba menambah data dulu lalu berharap TS berbaik hati. Beri anotasi
generik di deklarasi state — itu SATU-SATUNYA solusi yang benar.
:::

## 14.3 📌 `useRef` — Dua Wajah: Elemen DOM & Mutable Value

`useRef` punya dua pemakaian berbeda, dan pada TypeScript keduanya memiliki tipe berbeda pula. Mengabur-adur keduanya adalah sumber keluhan "kenapa `ref.current` error terus" yang paling umum.

Pemakaian pertama: menyimpan referensi elemen DOM.

```tsx
function Pencarian() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Fokus</button>
    </div>
  )
}
```

Pemakaian kedua: menyimpan nilai mutable yang tidak memicu render (seperti ID interval).

```tsx
const intervalRef = useRef<number | null>(null)

useEffect(() => {
  intervalRef.current = setInterval(() => { /* ... */ }, 1000)
  return () => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
  }
}, [])
```

**Penjelasan:**

- **`useRef<HTMLInputElement>(null)`** — T = `HTMLInputElement` adalah tipe elemen yang dituju `ref`. Nilai `current` bertipe `HTMLInputElement | null` sampai elemen benar-benar termount.
- **Karena `current` bisa `null`** — selalu pakai `?.` atau pengecekan, jangan asal `inputRef.current.focus()`.
- **`useRef<number | null>(null)` untuk interval** — di browser `setInterval` mengembalikan `number` (di Node tipenya `NodeJS.Timeout`); anotasi union membuat nilai awal `null` tidak memancing error.
- **Dua wajah `useRef`** — untuk element DOM, T = tipe elemen; untuk value biasa, T = tipe nilainya sendiri (`useRef<Map<string, Produk>>(new Map())`). Autocomplete `current` mengikuti T yang Anda pilih.
- **Perbandingan `useState` vs `useRef` untuk nilai mutable** ini penting dipahami sebelum lanjut:

| Aspek                                  | `useState`            | `useRef`                        |
| ---------------------------------------- | ---------------------- | -------------------------------- |
| Memicu re-render saat nilai berubah     | ✅                     | ❌                               |
| Cocok untuk data tampilan               | ✅                     | ❌                               |
| Cocok untuk ID interval/ajax terakhir   | Tidak perlu           | ✅                               |
| Tipe nilai                              | Satu T                | Satu T + union `\|null` untuk DOM|

## 14.4 🕸️ `useReducer` + Discriminated Union — Kombinasi Sempurna

`useReducer` adalah tempat discriminated union dari Bab 6 bersinar. State dan action didefinisikan sebagai union, lalu `reducer` memeriksa `action.type` agar TS mengetahui field mana yang tersedia di setiap cabang:

```tsx
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

const [keranjang, dispatch] = useReducer(reducer, [])

dispatch({ type: 'tambah', item: laptop })   // ✅ TS wajibkan `item`
dispatch({ type: 'hapus', id: 1 })           // ✅ TS wajibkan `id`
```

**Penjelasan:**

- **`action.type` adalah discriminator** — di dalam `case 'tambah'`, TS tahu `action.item` ada; di `case 'hapus'`, hanya `action.id`. Tanpa union, Anda harus menebak field mana yang mungkin ada.
- **Field wajib dipegang TS** — `dispatch({ type: 'tambah' })` tanpa `item` langsung error; tidak ada lagi lupa mengirim payload saat development.
- **Return type `Produk[]` eksplisit** — jika Anda lupa mengembalikan state di satu cabang, TS memberi tahu sebelum kode dijalankan.

Visualisasi hubungan action → state baru:

```
dispatch({ type: 'tambah', item: p })
        │
        ▼
 action.type ── 'tambah'   → [...state, action.item]   (butuh action.item ✅)
             ├── 'hapus'   → filter (p.id !== action.id)  (butuh action.id ✅)
             └── 'kosongkan' → []                        (tanpa payload ✅)
```

Jika Anda menambah varian baru di union `Action` tapi lupa menangani di `switch`, ada dua penjaga TS yang otomatis bekerja:

```tsx
// Opsi 1: biarkan default return type memaksa semua cabang tercover
// Opsi 2: tambahkan cabang default yang memanfaatkan never:
default: {
  const _exhaustive: never = action   // ❌ error jika ada varian yang belum ditangani
  return state
}
```

## 14.5 👥 `useContext` — Selalu Cek `null`

Context adalah mekanisme state global bawaan React. Masalah utamanya: `createContext(nilaiDefault)` membuat pemakai hook bisa diam-diam menerima default itu tanpa sadar — biasanya `null`. Solusi idiomatik TypeScript memanfaatkan union null:

```tsx
const AuthContext = createContext<AuthValue | null>(null)

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  return (
    <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
  )
}

// Hook kustom dengan penjaga:
function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx     // ✅ di sini TS tahu: AuthValue (bukan AuthValue | null)
}
```

**Penjelasan:**

- **Default `null` = alarm, bukan fitur** — jika hook dipakai di luar Provider, aplikasi langsung melempar Error yang jelas, bukan berhenti diam-diam atau membaca field dari `null`.
- **`if (!ctx)` adalah type guard** — sebelum pengecekan, `ctx: AuthValue | null`; sesudahnya, `ctx: AuthValue`. Inilah yang membuat pemakai hook tidak perlu menulis pengecekan sendiri.
- **Selalu bungkus dengan hook kustom** — `useAuth()` jauh lebih aman daripada mengekspos `useContext(AuthContext)` langsung ke semua komponen.

Visualisasi pola ini:

```
<AuthProvider>                       ← createContext | null (default)
   │                                  │
   └─ Provider value={{ user, ... }} │
        │                             │
        ▼                             ▼
Komponen DALAM provider:          Komponen DI LUAR provider:
useContext → AuthValue (ada)      useContext → null
useAuth() pass, lanjut ✅         useAuth() lempar Error 🚨
                                  → bug diketahui SEGERA
```

## 14.6 ⚙️ `useEffect`, `useMemo`, `useCallback`

Tiga hook ini tidak butuh generik eksplisit — inference-nya kuat — namun ada beberapa aturan tipe yang perlu Anda hafal:

```tsx
useEffect(() => {
  const controller = new AbortController()
  fetchAmbilData(controller.signal)

  return () => controller.abort()   // cleanup tanpa anotasi apa pun
}, [])

const total = useMemo(
  () => items.reduce((sum, p) => sum + p.harga, 0),
  [items]
)          // ✅ infer: number

const onBeli = useCallback(
  (id: number) => { beliProduk(id) },
  []
)          // ✅ infer: (id: number) => void
```

**Penjelasan:**

- **Cleanup `useEffect`** — return bisa `void` atau fungsi; TS menginfer keduanya, tidak perlu generik eksplisit.
- **`useMemo` menginfer dari expr terakhir** — `reduce(...)` bertipe `number` jadi `total` otomatis `number`.
- **`useCallback` menginfer dari callback** — yang perlu Anda ketik hanya parameter callback-nya sendiri (`id: number`), karena tanpa konteks parameter callback tidak punya info.
- **Kapan anotasi perlu** — ketika fungsi yang di-callback/read menyimpan nilai variabel: `const [fn, setFn] = useState<((id: number) => void) | null>(null)`.

::: tip 💡 Kapan Mulai Mengetik?
Biasakan tanpa anotasi dulu. Selama TS bisa menginfer dari nilai awal
atau callback, biarkan inference bekerja. Tambah anotasi generik hanya
ketika: nilai awal `null`/kosong (kasus 14.1–14.2) ATAU fungsi dipisah
dari konteks sehingga TS kehilangan info tipe.
:::

## 14.7 🧬 Custom Hook Generik: `useLocalStorage<T>`

Kualitas custom hook diukur dari seberapa baik tipe-nya. Berikut versi generik penuh dari hook `useLocalStorage`, lengkap dengan parsing dan penanganan IO:

```tsx
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initialValue : (JSON.parse(raw) as T)
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const berikutnya = value instanceof Function ? value(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(berikutnya))
        } catch {
          /* penyimpanan penuh / private mode — abaikan */
        }
        return berikutnya
      })
    },
    [key]
  )

  return [stored, setValue]
}

// Pemakaian — TS menyakinkan Anda UI atau API call yang benar:
const [keranjang, setKeranjang] = useLocalStorage<Produk[]>('keranjang', [])
const [tema, setTema] = useLocalStorage<'terang' | 'gelap'>('tema', 'terang')
```

**Penjelasan:**

- **`<T>` di deklarasi hook** — tipe diputuskan pemanggil: `useLocalStorage<Produk[]>('keranjang', [])` → `keranjang: Produk[]`, `setKeranjang` hanya menerima `Produk[]`.
- **`initialValue: T`** — nilai awal menentukan tipe; juga mampu menginfer T tanpa anotasi eksplisit di banyak kasus.
- **`JSON.parse(raw) as T`** — dari `localStorage` datanya string; bentuk T hanya "diklaim", bukan diverifikasi. Untuk validasi nyata, lihat pola `fetchJson<T>(url, schema)` di Bab 12.
- **Signature setter** — `(value: T | ((prev: T) => T)) => void` meniru perilaku setter `useState`, jadi hook ini terasa "asli".

::: warning ⚠️ Klaim Tipe yang Halus
`JSON.parse` mengembalikan `any` secara internal, jadi `as T` hanyalah
klaim tanpa bukti. `localStorage` juga bisa berisi data lama dengan
bentuk berbeda setelah skema berubah. Untuk data penting, validasi
dengan Zod lalu ambil tipe via `z.infer` — lihat Bab 12.
:::

## 14.8 📊 Tabel Jebakan `useReducer`, `useRef` & Custom Hook

Sekali lagi, ringkasan pola inti bab ini:

| Jebakan / Pertanyaan                 | Penjelasan                                                     | Solusinya                          |
| -------------------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| `useState([])` → `never[]`             | Array kosong tidak memberi petunjuk tipe                       | `useState<Produk[]>([])`            |
| `useState(null)` → tipe `null` saja    | Setter menolak nilai nyata                                     | `useState<User \| null>(null)`      |
| `useRef()` tanpa generik               | `MutableRefObject<...>` rancu dengan elemen DOM                | `useRef<HTMLInputElement>(null)`    |
| `reducer` tipe mismatch                | Action union tidak sempit per cabang                           | Discriminated union + switch `type` |
| Context default diabaikan              | Pemakai dapat `null` tanpa sadar                               | Default `null` + guard di hook      |
| Custom hook tanpa generik                | Tipe T tidak mengikuti pemanggil                               | `<T>` + return `[T, setter]`        |

Visualisasi keempat hooks dan sintaks typing-nya secara ringkas:

```
useState:     useState<T>(initialValue)
useRef:       useRef<T>(initialValue)      // T = elemen DOM atau tipe nilai
useContext:   createContext<T>(default)
useReducer:   useReducer(reducer, initial) // T State & Action dari tipe reducer
```

## 14.9 🔍 `useFetch<T>` & `useDebounce<T>` — Latihan Seterusnya

Dua custom hook generik yang layak latihan: `useFetch<T>` (memakai pola FetchState dari Bab 6) dan `useDebounce<T>`:

```tsx
// useFetch<T> — pola state loading/error/success dari Bab 6:
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

// useDebounce<T>:
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
```

**Penjelasan:**

- **`FetchState<T>`** — satu generic union untuk seluruh siklus request: idle, loading, success, error. `data` hanya ada di cabang `success`, sehingga TS memaksa komponen menangani semua state sebelum membaca data.
- **`useDebounce<T>`** — T mengikuti tipe nilai input (`string` untuk search, `number` untuk filter), dari inference nilai `value` — tanpa anotasi dari pemanggil.
- **`clearTimeout` di cleanup** — efek dibatalkan bila `value` baru datang; pola dependency + cleanup seperti yang dipelajari di 14.6.

::: tip 💡 Latihan Mandiri
Rakit `useFetch<T>` lengkap dengan `FetchState<T>` berikut efek di
dalamnya: gunakan union state (bukan `data: Produk | null` + bool
terpisah) dan pastikan `tsc --noEmit` tidak memunculkan error.
:::

## 14.10 📇 Ringkasan & Studi Kasus

Studi kasus bab ini sudah Anda lewati: `useLocalStorage<T>` versi generik adalah penerjemahan langsung dari hook versi JavaScript di ebook React, memakai `<T>` dan return `[T, setter]`. Kesalahan pemula terbesar di hooks bisa dirangkum dalam satu tabel terakhir:

| Kesalahan pemula                                     | Kenapa terjadi                                     | Perbaikan                             |
| ------------------------------------------------------ | --------------------------------------------------- | -------------------------------------- |
| `const [x, setX] = useState({})` & akses `x.id`        | Inference terlalu sempit lewat nilai awal          | Anotasi penuh: `useState<Filter>({...})` |
| Membaca `ref.current` langsung tanpa `?.`              | Lupa `current` bisa `null` sebelum mount           | `ref.current?.focus()`                 |
| `useState(null)` tanpa union                           | Setter menolak objek nanti                         | `useState<Produk \| null>(null)`        |
| Context dipakai tanpa guard                            | Crash `Cannot read properties of null`             | Hook kustom + throw Error jelas        |
| Array kosong state untuk data async                    | `never[]` muncul                                   | `useState<Produk[]>([])`               |

Visual terakhir — jalan yang sudah ditempuh:

```
14.1 useState ──▶ 14.2 never[] ──▶ 14.3 useRef ──▶ 14.4 useReducer
                                                    │
                                                    ▼
              14.7 useLocalStorage ◀── 14.5 useContext ◀── 14.6 efek & memo
```

## ✅ Checklist Bab 14

| Poin | Sudah paham? |
| --- | --- |
| `useState` inference & kapan butuh anotasi union `T \| null` | ☐ |
| Jebakan `useState([])` → `never[]` dan solusi generiknya | ☐ |
| Dua wajah `useRef`: elemen DOM vs value mutable | ☐ |
| `useReducer` dengan discriminated union + exhaustiveness | ☐ |
| `useContext` default `null` + guard di hook kustom | ☐ |
| `useEffect` / `useMemo` / `useCallback` dan inference-nya | ☐ |
| Custom hook generik `useLocalStorage<T>` ditulis sendiri | ☐ |
| `useFetch<T>` dengan union state loading/error/success | ☐ |

---

⏭️ Lanjut ke [🎨 Bab 15 — Pola Lanjutan di React + TS](/bagian-5/bab-15) untuk melanjutkan!