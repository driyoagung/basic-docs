---
title: "Bab 7 — Generics"
---

# 📖 Bab 7 — Generics

Anda sudah memakai generics setiap hari tanpa sadar: `useState` di React, `Promise<T>` saat menunggu API, bahkan `Array<Produk>` yang Anda tulis di Bab 3 — semuanya generics. Bab ini "membongkar" ilusi ajaib itu supaya Anda bisa membaca tipe dari library mana pun tanpa bingung, dan yang lebih penting: **menulis sendiri** tipe yang bisa dipakai ulang. Generics adalah bab yang paling kritis di bagian III — begitu paham, hampir semua error `Type 'X' is not assignable to type 'Y'` yang bersarang jadi mudah dibaca. Luangkan waktu ekstra di bab ini; konsepnya akan terus dipakai sampai Bab 21.

## 7.1 🔥 Mengapa Generics Dibutuhkan?

Bayangkan Anda menulis fungsi `pertama` — mengambil elemen pertama dari sebuah array. Ada tiga strategi, dan dua di antaranya buruk:

```ts
// ❌ Strategi 1: pakai `any` — kehilangan semua informasi tipe
function pertama(arr: any[]): any {
  return arr[0]
}
const a = pertama([1, 2, 3])
a.toUpperCase() // TIDAK ada error! Tapi crash saat dijalankan
// karena a sebenarnya number, bukan string

// ❌ Strategi 2: tulis versi per tipe — melanggar prinsip DRY
function pertamaAngka(arr: number[]): number | undefined { return arr[0] }
function pertamaTeks(arr: string[]): string | undefined { return arr[0] }
// ...setiap tipe baru = fungsi baru = pemeliharaan mimpi buruk

// ✅ Strategi 3: generics — satu fungsi untuk semua tipe
function pertama<T>(arr: T[]): T | undefined {
  return arr[0]
}
const b = pertama([1, 2, 3])   // b: number | undefined
const c = pertama(['x', 'y'])  // c: string | undefined
```

**Penjelasan strategi:**

- **`any`** — "pintu darurat" yang mematikan pengecekan tipe: `a` bertipe `any`, jadi `a.toUpperCase()` lolos saat menulis kode tapi meledak saat berjalan.
- **Duplikasi** — aman, tapi setiap tipe baru butuh fungsi baru. Di project besar, ini berlipat-lipat tanpa nilai tambah.
- **Generics** — tulis logika **satu kali**, tipe "mengalir" otomatis dari input ke output. Menggabungkan kelebihan keduanya: keamanan tipe tanpa duplikasi.

| Strategi | Aman tipe? | Tidak duplikat? | Verdict |
|---|---|---|---|
| `any[]` / `any` | ❌ | ✅ | Hindari — keamanan hilang |
| Satu fungsi per tipe | ✅ | ❌ | Hindari — sulit dikembangkan |
| `function pertama<T>(arr: T[])` | ✅ | ✅ | 🥇 Inilah generics |

## 7.2 🍰 Analogi: Cetakan Kue yang Bentuknya Sama, Adonannya Bisa Berbeda

```
                GENERICS = CETAKAN KUE

   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │   CETAKAN   │         │   CETAKAN   │         │   CETAKAN   │
   │  <  ⬚  >   │         │  <  ⬚  >   │         │  <  ⬚  >   │
   │  bentuk     │         │  bentuk     │         │  bentuk     │
   │  tetap,     │         │  tetap,     │         │  tetap,     │
   │  lubang ⬚   │         │  lubang ⬚   │         │  lubang ⬚   │
   │  bisa       │         │  bisa       │         │  bisa       │
   │  diisi apa  │         │  diisi apa  │         │  diisi apa  │
   │  saja       │         │  saja       │         │  saja       │
   └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
          │ isi adonan            │ isi adonan            │ isi adonan
          │ cokelat               │ strawberry            │ pandan
          ▼                       ▼                       ▼
   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │  Kue Cokelat│         │ Kue Stroberi│         │ Kue Pandan  │
   │  (bentuk    │         │ (bentuk     │         │ (bentuk     │
   │  SAMA,      │         │ SAMA,       │         │ SAMA,       │
   │  isi beda)  │         │ isi beda)   │         │ isi beda)   │
   └─────────────┘         └─────────────┘         └─────────────┘

    pertama<T>     : T = cokelat   →  hasil bertipe cokelat
    pertama<T>     : T = strawberry → hasil bertipe strawberry
    Response<T>    : T = Produk    →  data bertipe Produk
```

> 💡 **Inti analogi:** cetakan (logika fungsi / bentuk tipe) ditulis **satu kali**. Isi adonan (tipe konkret) diputuskan **saat dipakai**, bukan saat cetakan dibuat. Itulah mengapa Anda hanya butuh menulis `Response<T>` satu kali, tapi bisa memakainya untuk `Response<Produk>`, `Response<User>`, dan lima puluh model lain tanpa menulis ulang apa pun.

## 7.3 🧬 Generic Function: Tipe yang "Mengikuti" Input

Tanda `<T>` setelah nama fungsi mendeklarasikan **parameter tipe** — seperti parameter biasa, tapi berisi *tipe*, bukan nilai:

```ts
function pertama<T>(arr: T[]): T | undefined {
  return arr[0]
}

// Cara 1: eksplisit — Anda menentukan T sendiri
const b = pertama<number>([1, 2, 3])
const c = pertama<string>(['x', 'y'])

// Cara 2: inference — TS menebak T dari argumen (lebih disukai)
const d = pertama([1, 2, 3])        // T = number, dari isi array
const e = pertama(['x', 'y'])       // T = string

// Tipe mengalir: masuk number → keluar number
const angka: number | undefined = d
```

**Penjelasan cara kerja:**

1. **`T` adalah variabel untuk tipe** — seperti `x` di matematika, `T` menunggu "diisi" saat fungsi dipanggil. Namanya bebas (`T`, `TData`, `TItem`), tapi singkat satu huruf adalah konvensi paling umum.
2. **Saat dipanggil, TS menebak `T`** — dari `pertama([1, 2, 3])`, TS melihat argumennya `number[]`, jadi `T = number`. Sekali `T` terkunci, semua `T` di tanda tangan fungsi otomatis ikut jadi `number` — termasuk nilai kembalian.
3. **Return `T | undefined`, bukan `T`** — array bisa kosong, jadi `arr[0]` bisa jadi `undefined`. Ini contoh betapa pentingnya mode `strict`: fungsi generik yang baik **tidak berbohong** soal kembaliannya.

> 💡 **Cara membaca error:** jika Anda pernah melihat error seperti `"string is not assignable to number"`, sekarang Anda tahu artinya: **parameter tipe `T` di satu tempat terkunci `number`, tapi di tempat lain Anda menyerahkan `string`**. Cari di mana `T` pertama kali tersambung — biasanya argumen pertama.

## 7.4 📦 Generic Type & Interface: Kontainer yang Dipakai Ulang

Generics tidak hanya untuk fungsi. Pahami ini — ini bentuk yang paling sering Anda temui di library:

```ts
// Kontainer generik: type
type Box<T> = {
  isi: T
}

const kotakAngka: Box<number> = { isi: 123 }
const kotakTeks: Box<string> = { isi: 'hello' }

// Response API generik: satu bentuk dipakai semua endpoint
type Response<T> = {
  success: boolean
  message: string
  data: T        // ← bisa menampung tipe apa pun
}

const resProduk: Response<Produk> = {
  success: true,
  message: 'OK',
  data: { id: 1, nama: 'Laptop', harga: 15_000_000 },
}
resProduk.data.nama   // TypeScript tahu: ini Produk ✅

// Interface juga bisa generik
interface Repository<T, ID> {
  simpan(item: T): Promise<void>
  cari(id: ID): Promise<T | null>
}

// Pemakaian: cukup alias, tanpa menulis ulang
type UserRepo = Repository<User, number>
type ProdukRepo = Repository<Produk, string>
```

**Penjelasan pemakaian:**

- **`Box<T>`** — kotak serbaguna: bentuk sama, isi bebas. Sekali tulis, tak perlu versi `BoxAngka`.
- **`Response<T>`** — bentuk response API yang normalnya Anda duplikat untuk tiap endpoint; kini cukup `Response<Produk>`, `Response<User>`, dan seterusnya.
- **`Repository<T, ID>`** — bisa juga punya **beberapa** parameter tipe sekaligus, dipisah koma. Pemakainya cukup alias: `type UserRepo = Repository<User, number>`.
- **Bisa di-nesting** — generic type saling menyusun: `type Responses = Record<string, Response<unknown>>`. Bentuk bersarang seperti ini sering muncul di tipe library — Bab 8–9 membangunnya dari nol.

## 7.5 🔒 Constraint dengan `extends`: Membatasi Apa yang Boleh Masuk

Tanpa batasan, `T` bisa tipe apa pun — termasuk tipe yang tidak Anda duga. Kadang Anda butuh `T` "setidaknya punya properti tertentu" — di situlah constraint `extends` masuk:

```ts
// ❌ Tanpa constraint: TS tidak tahu T punya properti 'id'
function tampilkanId<T>(item: T): void {
  item.id // error: Property 'id' does not exist on type 'T'
}

// ✅ Dengan constraint: T harus minimal punya { id: number }
function tampilkanId<T extends { id: number }>(item: T): void {
  console.log(item.id) // aman: T terjamin punya id
}

tampilkanId({ id: 1, nama: 'Laptop' })   // OK: punya id ✅
tampilkanId({ nama: 'Anonim' })          // ❌ error: tidak punya id

// Constraint juga membuka akses properti error dengan aman
function ambilPesan<T extends { message: string }>(err: T): string {
  return err.message.toUpperCase() // aman: message terjamin ada
}

// Constraint juga bisa menunjuk ke tipe bentukan lain
type BerID = { id: number; nama: string }
function cari<T extends BerID>(items: T[], predikat: (i: T) => boolean): T | undefined {
  return items.find(predikat)
}
```

**Penjelasan constraint:**

- **`T extends { id: number }` dibaca:** "`T` boleh tipe apa pun, **selama** punya (minimal) properti `id` bertipe `number`". Tipe dengan properti lebih banyak umumnya juga boleh — karena masih memenuhi syarat minimalnya.
- **Constraint membuka akses properti** — sebelum constraint, `T` adalah "kotak hitam"; setelahnya, `item.id` dan metode bawaan tipe itu bisa disentuh dengan aman di dalam fungsi.
- **Bisa extend ke union** — `T extends string | number` artinya hanya string atau number yang diterima. Sangat berguna untuk fungsi util, misalnya membatasi jenis ID.
- **Analogi:** constraint itu seperti kriteria minimal di lowongan — kandidat boleh punya keterampilan ekstra, tapi setidaknya wajib bisa "ini".

## 7.6 ⚙️ Default Generic & Beberapa Parameter Tipe

Dua fitur praktis yang membuat generics lebih enak dipakai:

```ts
// Default generic: jika T tidak ditentukan, pakai string
type Tag<T = string> = {
  nama: T
  nilai: string
}

const t1: Tag = { nama: 'baru', nilai: '1' }        // ⇒ Tag<string> — default aktif
const t2: Tag<'utama'> = { nama: 'utama', nilai: '2' } // ditimpa

// Beberapa parameter dipisah koma
type Pair<K, V> = {
  kunci: K
  nilai: V
}

const pasangan: Pair<string, number> = { kunci: 'usia', nilai: 25 }
```

**Penjelasan:**

- **`<T = string>`** — nilai default untuk parameter tipe. Mirip parameter default biasa: memanggil tanpa menentukan `T` tetap valid, dan `T` diisi otomatis.
- **Default = mengurangi kebisingan** — jika `string` adalah pemakaian paling umum, pemanggil yang tidak menentukan `T` tetap mendapat tipe yang masuk akal.
- **`Pair<K, V>`** — dua parameter tipe bebas dipakai di posisi berbeda. `Map<K, V>` dari standar JS persis seperti ini.

## 7.7 🌍 Generics yang Sudah Anda Pakai Setiap Hari

Ini bagian penghubung: semuanya yang tadinya terasa "ajaib" kini bisa Anda baca sendiri.

| Tipe bawaan | Generik? | Dipakai di mana | Contoh |
|---|---|---|---|
| `Array<T>` / `T[]` | ✅ `T` = tipe elemen | Semua kode | `Produk[]` = `Array<Produk>` |
| `Promise<T>` | ✅ `T` = nilai setelah `await` | Async / fetch | `Promise<Produk>` |
| `useState<T>` | ✅ `T` = tipe state | React hook | `useState<Produk[]>([])` |
| `Map<K, V>` | ✅ Kunci & nilai | Lookup/kamus | `Map<string, Produk>` |
| `Set<T>` | ✅ `T` = tipe elemen | Kumpulan unik | `Set<number>` |
| `Record<K, V>` | ✅ Kunci & nilai | Object bertipe | Bab 8 bahas detail |
| `React.FC<P>` | ✅ `P` = tipe props | React (legacy) | hindari sebagai default |

**Penjelasan tiga yang terpenting:**

- **`Promise<T>`** — `T` di sini adalah *nilai hasil* setelah `await`. Jika Anda tulis `Promise<Produk>`, maka `await`-nya menghasilkan `Produk`. Jika lupa menentukan `T`, hasilnya bertipe `unknown`.
- **`useState<T>`** — hook ini adalah **fungsi generik**! Saat Anda menulis `useState(0)`, TS menebak `T = number`. Tapi untuk array kosong seperti `useState([])`, TS tidak tahu isi apa — untuk itu Anda harus eksplisit: `useState<Produk[]>([])`. Teknik ini dibedah di Bab 14.
- **`fetch` → `Promise<Response>`** — `fetch` selalu mengembalikan `Response` (bukan data Anda). Data nyata datang lewat `res.json()` yang mengembalikan `Promise<any>` — dan itulah celah besar yang dibahas sungguh-sungguh di Bab 12.

> ⚠️ **Paling sering keliru:** `useState([])` tanpa tipe menghasilkan `never[]` (array tak bisa diisi apa pun), bukan `Produk[]`. Selalu tulis `useState<Produk[]>([])` saat array diinisialisasi kosong.

## 7.8 🎬 Studi Kasus: `ApiResponse<T>` & `Paginated<T>`

Sekarang gabungkan semuanya: `ApiResponse<T>` untuk respons berhasil, `Paginated<T>` untuk endpoint list, dan `ApiError` untuk respons gagal — semuanya di satu file:

```ts
// types/api.ts — dipakai ulang di SELURUH project
export type Meta = {
  halaman: number
  total: number
}

// Bentuk respons berhasil
export type ApiResponse<T> = {
  success: true
  data: T
}

// Versi list berpagination
export type Paginated<T> = ApiResponse<T[]> & {
  meta: Meta
}

// Bentuk respons gagal
export type ApiError = {
  success: false
  message: string
  // field level errors — mis. { email: 'Email tidak valid' }
  errors?: Record<string, string>
}
```

Pemakainya menunjukkan kekuatan sesungguhnya — **satu definisi, semua model**:

```ts
type Produk = { id: number; nama: string; harga: number }
type User   = { id: number; nama: string; email: string }

// Endpoint detail produk
const detailProduk: ApiResponse<Produk> = {
  success: true,
  data: { id: 1, nama: 'Laptop', harga: 15_000_000 },
}
detailProduk.data.harga        // number ✅

// Endpoint list produk — tipe otomatis: { data: Produk[], meta: Meta }
const listProduk: Paginated<Produk> = {
  success: true,
  data: [{ id: 1, nama: 'Laptop', harga: 15_000_000 }],
  meta: { halaman: 1, total: 42 },
}

// Endpoint list user — beda model, tanpa menulis ulang bentuk!
const listUser: Paginated<User> = {
  success: true,
  data: [{ id: 1, nama: 'Budi', email: 'budi@mail.com' }],
  meta: { halaman: 1, total: 7 },
}
```

**Penjelasan studi kasus:**

- **`ApiResponse<T>`** — menampung seluruh respons berhasil ber-`T` dari endpoint berapa pun: `Produk`, `User`, `Order`, `Comment` — tanpa menulis bentuk ulang.
- **`Paginated<T>`** — komposisi! Alias `Paginated<T>` cuma menambah `meta` di atas `ApiResponse<T[]>` — `data` jadi `T[]`. Kasus nyata yang rumit jadi dua baris saja.
- **`ApiError`** — tidak perlu generik karena **pesan error biasanya sama bentuknya untuk semua endpoint** — disediakan sebagai pasangan agar cabang gagal tetap aman.
- **Gabungkan ke discriminated union** — di Bab 6 Anda membuat `FetchState<T>` (`loading | error | success`). Kini tersambung rapi: `FetchState<Paginated<Produk>>` adalah tipe state yang sah dan sangat umum di aplikasi nyata.

```
               SATU DEFINISI, SEMUA TAMPAK UTUH

   Sebelum (tanpa generics):           Sesudah (dengan generics):

   ┌───────────────────────┐            ┌──────────────────────┐
   │ type ProdukListResp { │            │ ApiResponse<Produk>  │
   │   data: Produk[]      │            │          ↑           │
   │ }                     │            │ Paginated<Produk>    │
   ├───────────────────────┤            │          ↑           │
   │ type UserListResp {   │     →      │ Paginated<User>      │
   │   data: User[]        │            │          ↑           │
   │ }                     │            │ Paginated<Order>     │
   ├───────────────────────┤            │          ↑           │
   │ type OrderListResp {  │            │   ApiResponse<T>     │
   │   data: Order[]       │            │   (satu definisi,    │
   │ }                     │            │    tak terhitung     │
   └───────────────────────┘            │    pemakaian)        │
                                        └──────────────────────┘
```

> 💡 **Tips penamaan parameter tipe:** `T` untuk "Type" adalah standar. Kalau bermakna lebih spesifik, perpanjang: `TData`, `TItem`, `TProps` (di React). Konsisten saja — pembaca kode cepat mengenali parameter tipe dari huruf `T`.

> ⚠️ **Jangan generikkan jika cuma dipakai untuk satu tipe.** Jika suatu tipe hanya pernah dipakai sebagai `Response<Produk>` sepanjang project, cukup tulis `type ProdukResponse = { ... }` langsung. Generics memberikan nilai saat ada **dua atau lebih** pemakaian dengan bentuk berbeda.

## ✅ Checklist Bab 7

- ✅ Memahami tiga strategi menangani "fungsi untuk tipe apa pun": `any`, duplikasi, **generics**.
- ✅ Bisa menulis generic function dan menjelaskan kenapa `T | undefined` lebih jujur daripada `T`.
- ✅ Bisa menulis generic type (`Response<T>`) dan interface generik dengan beberapa parameter tipe.
- ✅ Bisa menambahkan constraint `T extends { id: number }` untuk membuka akses properti.
- ✅ Bisa memakai default generic `<T = string>` dan multiple type parameter `<K, V>`.
- ✅ Mengetahui bahwa `Array<T>`, `Promise<T>`, `useState<T>` — semua yang tadinya ajaib — adalah generics biasa.
- ✅ Membuat sendiri `ApiResponse<T>` & `Paginated<T>` yang bisa dipakai ulang untuk semua model.
- ✅ Tahu kapan *tidak* perlu generik: satu pemakaian saja cukup dengan tipe langsung.

---

⏭️ Lanjut ke [🧰 Bab 8 — Utility Types](/bagian-3/bab-8) untuk melanjutkan!
