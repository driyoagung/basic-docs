---
title: "Bab 8 — Utility Types"
---

# 📖 Bab 8 — Utility Types

Di Bab 5 sampai Bab 7, Anda menulis tipe dari nol. Kini tersedia serangkaian "mesin tipe" bawaan TypeScript yang disebut **utility types**: tipe-tipe yang menghasilkan tipe baru **dari tipe yang sudah ada**. Motivasinya satu — prinsip DRY (*Don't Repeat Yourself*) juga berlaku untuk tipe. Satu model `Produk` punya banyak wajah di aplikasi nyata: bentuk input saat create, bentuk parsial saat update, versi ringkas untuk kartu list, dan versi utuh untuk halaman detail. Tanpa utility types, Anda menulis empat tipe hampir identik, dan saat kolom database berubah, empat tempat harus diedit manual. Bab ini membuat kebiasaan itu jadi lebih disiplin.

```
               SATU SUMBER, BANYAK WAJAH

                  ┌────────────────────┐
                  │       Produk       │
                  │    (tipe induk)    │
                  │ id, nama, harga,   │
                  │ stok, deskripsi?,  │
                  │ dibuatPada         │
                  └─────────┬──────────┘
                            │ utility types
        ┌───────────────┬───┴──────────┬───────────────┐
        ▼               ▼              ▼               ▼
  ┌───────────┐  ┌────────────┐  ┌─────────────┐ ┌───────────┐
  │  Create   │  │   Update   │  │    List     │ │  Detail   │
  │ Produk-   │  │  Produk-   │  │ ProdukR-    │ │  Produk   │
  │ Input     │  │  Update    │  │ ingkas      │ │  (utuh)   │
  │ (Omit id) │  │ (semuanya  │  │ (Pick)      │ │           │
  │           │  │  opsional) │  │             │ │           │
  └───────────┘  └────────────┘  └─────────────┘ └───────────┘
        │              │                │              │
     POST /         PATCH /          GET /list       GET /:id
     create         update

  Kolom berubah di Produk → SEMUA turunan ikut berubah otomatis ✅
```

## 8.1 🔥 Konsep: Tipe Turunan, Bukan Tipe Salinan

- **Satu sumber kebenaran** — tipe induk `Produk` menggambarkan bentuk data asli, misalnya dari database. Tipe yang lain adalah **transformasinya**, bukan salin-tempel teksnya.
- **Refactor jadi satu tempat** — tambah properti `stok: number` di `Produk`, dan semua turunan langsung ikut mengikuti aturan transformasinya masing-masing. Tidak ada yang tertinggal.
- **Makna jadi eksplisit** — `ProdukInput` menyatakan maksud: "ini untuk membuat produk baru". Bukan sekadar deretan properti yang maknanya perlu Anda hafalkan.

> 💡 **Cara membaca:** hampir semua utility types punya pola `NamaUtility<Tipe>`. Anggap mereka *fungsi yang beroperasi pada tipe* — masuk satu tipe, keluar tipe lain. Semuanya murni bekerja saat kompilasi, jadi tidak ada biaya runtime apa pun.

## 8.2 🗂️ Peta Utility Types yang Sering Dipakai

| Utility | Fungsi | Contoh Kasus |
|---|---|---|
| `Partial<T>` | Semua field jadi opsional | Form edit/update |
| `Required<T>` | Semua field wajib | Tipe yang dipastikan lengkap |
| `Pick<T, K>` | Ambil sebagian field | Data ringkas untuk list |
| `Omit<T, K>` | Buang sebagian field | Input create tanpa `id` |
| `Readonly<T>` | Semua field readonly | Data dari server yang tak boleh diubah |
| `Record<K, V>` | Object dengan key dan value bertipe | Kamus/lookup (`Record<string, Produk>`) |
| `Parameters<F>` | Tipe parameter fungsi | Menyamakan argumen antar fungsi |
| `ReturnType<F>` | Tipe hasil fungsi | Sinkron dengan isi handler/fetcher |
| `Awaited<T>` | Tipe hasil `Promise` setelah `await` | `Awaited<ReturnType<typeof fetcher>>` |
| `NonNullable<T>` | Buang `null`/`undefined` dari union | Mempersempit tipe selepas pengecekan |

**Penjelasan peta di atas:**

- **Enam utility pertama (`Partial` sampai `Record`) bekerja pada object** — pengetahuan dari Bab 5 langsung kepakai.
- **`Parameters`, `ReturnType`, dan `Awaited` bekerja pada fungsi** — inputnya bukan object, melainkan tipe suatu fungsi.
- **`NonNullable<T>`** anggota kecil tapi sering muncul: versi tipe dari hasil narrowing yang Anda pelajari di Bab 6.
- **Semua di atas adalah tipe, bukan kode runtime** — murni abstraksi saat menulis, tidak dieksekusi sedikit pun.

## 8.3 🌊 `Partial<T>` & `Required<T>`

```ts
type Produk = {
  id: number
  nama: string
  harga: number
  deskripsi?: string
}

// Semua field opsional — cocok untuk payload update
type ProdukUpdate = Partial<Produk>
// ⇨ { id?: number; nama?: string; harga?: number; deskripsi?: string }

function updateProduk(id: number, data: Partial<Produk>): void {
  // hanya field yang dikirim yang di-update
}

updateProduk(1, { harga: 14_500_000 })      // OK: cukup harga ✅
updateProduk(1, { nama: 'Laptop Baru' })    // OK: cukup nama ✅

// Semua field wajib — "merekatkan" tipe yang tadinya punya opsional
type ProdukLengkap = Required<Produk>
// ⇨ { id: number; nama: string; harga: number; deskripsi: string }
```

**Penjelasan pola:**

- **`Partial<T>` untuk update** — request `PATCH` secara realistis hanya membawa field yang berubah. `Partial<Produk>` menangkap maksud itu dalam satu kata.
- **`Required<T>`** adalah kebalikannya: semua tanda `?` dihapus. Berguna bila data di satu titik sudah pasti lengkap, misalnya setelah semua nilai default diisi.
- **Hubungan dengan form** — nilai form biasanya `Partial<Produk>` selama pengguna masih mengetik, dan baru sah jadi `Produk` setelah divalidasi (pola lengkapnya dibahas via Zod di Bab 12).

> ⚠️ **Jangan tempelkan `Partial<T>` pada bentuk response API.** Server hampir selalu mengembalikan data utuh. Jika Anda menuliskan `Partial<Produk>` sebagai tipe respons, `data.id` bertipe `number | undefined` padahal server pasti mengirim id. Respons utuh tetap `Produk`; `Partial` hanya untuk input.

## 8.4 ✂️ `Pick<T, K>` & `Omit<T, K>`

```ts
type Produk = {
  id: number
  nama: string
  harga: number
  stok: number
  deskripsi?: string
  readonly dibuatPada: Date
}

// Pick: ambil SEBAGIAN field yang dipilih
type KartuProduk = Pick<Produk, 'id' | 'nama' | 'harga'>
// ⇨ { id: number; nama: string; harga: number }

// Omit: buang sebagian field, sisanya dipertahankan
type ProdukInput = Omit<Produk, 'id' | 'dibuatPada'>
// ⇨ { nama: string; harga: number; stok: number; deskripsi?: string }
```

| Aspek | `Pick<T, K>` | `Omit<T, K>` |
|---|---|---|
| Makna | "Yang saya butuhkan hanya ini" | "Semua kecuali ini" |
| Cocok saat | Field yang dibutuhkan **sedikit** | Field yang dibuang **sedikit** |
| Contoh | Kartu list, dropdown ringkas | Input create (tanpa `id`, tanpa `createdAt`) |

**Penjelasan perbandingan:**

- **Pilih berdasarkan jumlah** — jika hanya 3 dari 12 field yang dipakai, `Pick` jauh lebih ringkas daripada `Omit` 9 field. Sebaliknya, `Omit` pas untuk "semua kolom create, kecuali yang diisi server".
- **`Pick` bersifat eksplisit** — komponen kartu mengumumkan kebutuhannya sendiri: jika tipe induk tak lagi punya `harga`, error muncul persis di komponen itu.
- **`Omit` melindungi pola "input bersih"** — `id` dan `dibuatPada` adalah domain server. Dengan `Omit`, tidak ada kode yang kebetulan mengirimnya lewat form, karena di tipe input keduanya memang tidak ada.

## 8.5 📖 `Record<K, V>` & `Readonly<T>`

```ts
// Record: object yang key DAN value-nya sama-sama bertipe
type Status = 'pending' | 'aktif' | 'selesai'

const labelStatus: Record<Status, string> = {
  pending: 'Menunggu',
  aktif: 'Berjalan',
  selesai: 'Selesai',
}
// Lupa mengisi satu status → error compile: Property 'selesai' is missing ✅

// Record juga pola umum untuk cache/lookup
const produkPerId: Record<string, Produk> = {}

// Readonly: semua field jadi readonly
type ProdukServer = Readonly<Produk>

const data: ProdukServer = { id: 1, nama: 'Laptop', harga: 15_000_000 }
// data.harga = 10_000_000  ❌ error: Cannot assign to 'harga' because it is read-only
```

**Penjelasan pemakaian:**

- **`Record<K, V>` dengan union literal** — keuntungannya nyata: jika Anda lupa mengisi satu status, errornya muncul saat kompilasi. Tanpa ini, status yang hilang baru ketahuan saat teks `undefined` muncul di layar.
- **`Record<string, Produk>` sebagai cache/lookup** — pola klasik di state management dan memoization. Objek yang dulu "bebas isi apa saja" kini punya tipe nilai yang tegas.
- **`Readonly<T>`** mencegah mutasi di level propertinya saja, tapi tidak menyentuh metode array di dalamnya — array tetap `Array<T>` biasa. Untuk pembekuan menyeluruh pada konfigurasi statis, gunakan `as const` (dibahas di Bab 9).

## 8.6 🔎 Tipe dari Fungsi: `Parameters`, `ReturnType`, `Awaited`

```ts
async function ambilProduk(id: number): Promise<Produk> {
  return { id, nama: 'Laptop', harga: 15_000_000 }
}

// Tipe parameter dari fungsi
type ArgumenAmbilProduk = Parameters<typeof ambilProduk>
// ⇨ [id: number]

// Tipe hasil fungsi — untuk fungsi async ini MALAH berupa Promise!
type HasilMentah = ReturnType<typeof ambilProduk>
// ⇨ Promise<Produk>

// Awaited: "membuka bungkus" Promise → Produk
type Hasil = Awaited<ReturnType<typeof ambilProduk>>
// ⇨ Produk

// NonNullable: buang null & undefined dari union
type NamaTextField = string | null | undefined
type TeksAman = NonNullable<NamaTextField> // ⇨ string
```

**Penjelasan utilitas fungsi:**

- **`typeof f` di konteks tipe** (bukan `typeof` runtime) — penjelasan lengkapnya ada di Bab 9, tapi polanya sudah kepakai di sini: jika return type `ambilProduk` berubah, semua tipe turunannya ikut berubah secara otomatis.
- **`ReturnType` saja belum cukup untuk fungsi async** — hasilnya `Promise<Produk>`, bukan `Produk`. Itulah mengapa `Awaited<T>` ada: "mencabut" bungkus Promise, bahkan yang bertumpuk beberapa lapis.
- **`Awaited<T>` sangat praktis** untuk menurunkan tipe data dari fungsi fetch yang sudah ada, tanpa menulis ulang bentuknya.
- **`NonNullable<T>`** menyempitkan union `T | null | undefined` jadi `T` — sering dipakai setelah pengecekan null saat narrowing.

## 8.7 🎬 Studi Kasus: Satu Model `Produk`, Empat Wajah

```
           SATU MODEL → EMPAT TIPE TURUNAN

     ┌───────────────────────────────────────────────┐
     │ type Produk = {      (sumber kebenaran)       │
     │   id, nama, harga, stok, deskripsi?,          │
     │   readonly dibuatPada                         │
     │ }                                             │
     └───────────────────────────────────────────────┘
          │              │              │             │
          │ Omit id &    │ Partial      │ Pick        │ tanpa
          ▼ dibuatPada   ▼              ▼             ▼ transformasi
     ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐
     │ ProdukInput │ │ ProdukUpdate │ │ ProdukRingkas│ │  Produk  │
     │  (create)   │ │  (patch)     │ │  (list card) │ │ (detail) │
     └─────────────┘ └──────────────┘ └──────────────┘ └──────────┘
           POST            PATCH          GET /list      GET /:id
```

```ts
// types/produk.ts

// ── 1. Sumber kebenaran (bentuk data asli dari server/database) ──
export type Produk = {
  id: number
  nama: string
  harga: number
  stok: number
  deskripsi?: string
  readonly dibuatPada: Date
}

// ── 2. Create: kolom form saja, tanpa kolom yang diisi server ──
export type ProdukInput = Omit<Produk, 'id' | 'dibuatPada'>

// ── 3. Update: semuanya opsional, id dilewati secara terpisah ──
export type ProdukUpdate = Partial<ProdukInput>

// ── 4. List: versi ringkas untuk kartu/tabel ──
export type ProdukRingkas = Pick<Produk, 'id' | 'nama' | 'harga'>

// ── 5. Detail: langsung pakai Produk utuh (tidak perlu alias) ──
```

Pemakaiannya di tiap endpoint menjadi jelas siapa meminta apa:

```ts
// POST /api/produk — body: ProdukInput
function simpanProdukBaru(input: ProdukInput): void {
  // id & dibuatPada TIDAK MUNGKIN lewat: di tipe memang tidak ada
}

// PATCH /api/produk/:id — body: ProdukUpdate
function editProduk(id: number, patch: ProdukUpdate): void {}

// GET /api/produk — response: ProdukRingkas[]
function tampilkanList(items: ProdukRingkas[]): void {}

// GET /api/produk/:id — response: Produk
function tampilkanDetail(produk: Produk): void {}
```

**Penjelasan studi kasus:**

- **`id` & `dibuatPada` tidak muncul di `ProdukInput`** — hanya server yang berhak menetapkan keduanya. Tanggung jawab per tipe terlihat seketika.
- **`ProdukUpdate` dibangun dari `ProdukInput`, bukan `Produk`** — jika Anda memakai `Partial<Produk>`, tipe update akan menyebarkan `readonly dibuatPada` menjadi bisa "diubah" lewat PATCH. `Partial<ProdukInput>` menutup celah itu tanpa penjelasan tambahan.
- **`ProdukRingkas` menjaga payload network** — list ratusan item tidak perlu membawa deskripsi panjang, dan sisi UI juga dipaksa menerima bentuk ringkas itu.
- **Detail memakai `Produk` langsung** — tidak semua kasus butuh transformasi. Utility types adalah alat, bukan kewajiban.

> 💡 **Kombinasi antar utility** — utility types bisa ditumpuk: `Record<number, ProdukRingkas>` adalah kamus produk ringkas berdasarkan id, dan `Pick<Paginated<Produk>, 'data'>` mengekstrak hanya array `data` dari tipe `Paginated` Bab 7. Satu keluarga pengetahuan, banyak kombinasi.

## 8.8 💡 Kapan Memakai Utility yang Mana

| Situasi | Utility yang cocok |
|---|---|
| Form edit, PATCH, filter opsional | `Partial<T>` |
| Memastikan semua field terisi | `Required<T>` |
| Data list ringkas, props komponen kartu | `Pick<T, K>` |
| Payload create (tanpa `id`, `createdAt`) | `Omit<T, K>` |
| Kamus/lookup menurut status atau id | `Record<K, V>` |
| Data server yang tak boleh diubah | `Readonly<T>` |
| Sinkron dengan tipe fungsi yang ada | `Parameters`, `ReturnType`, `Awaited` |
| Menyingkirkan null setelah pengecekan | `NonNullable<T>` |

> 💡 **Aturan memilih:** mulai dari **maksudnya** dulu — "ini payload create", "ini data untuk list", "ini update parsial" — lalu pilih utility yang menangkap maksud itu. Mengambil urutan sebaliknya (menulis tipe tertentu lalu mencari tempat memakainya) mudah berakhir menjadi over-engineering.

Utility types akan terus dipakai hingga bagian V (React) dan VI (Next.js): props komponen memakai `Pick`, data fetching memakai `Awaited`, validasi mengombinasikan `Partial` dengan Zod. Fondasinya sudah lengkap di sini.

## ✅ Checklist Bab 8

- ✅ Memahami motif DRY untuk tipe: satu model induk, turunannya bertransformasi otomatis.
- ✅ Mengenali sepuluh utility types yang sering dipakai di project nyata.
- ✅ Bisa memakai `Partial<T>` untuk payload update dan menjelaskan mengapa `Partial` tidak cocok untuk respons utuh.
- ✅ Bisa memilih `Pick` vs `Omit` berdasarkan jumlah field yang dipakai atau dibuang.
- ✅ Bisa memakai `Record<K, V>` untuk kamus/lookup dengan key bertipe.
- ✅ Bisa menurunkan tipe dari fungsi lewat `Parameters`, `ReturnType`, dan membuka Promise dengan `Awaited`.
- ✅ Menuntaskan studi kasus: satu model `Produk` → tipe create (`Omit`), update (`Partial`), list (`Pick`), detail (utuh).
- ✅ Memilih utility berdasarkan maksud, bukan kemudahan menulisnya.

---

⏭️ Lanjut ke [🧠 Bab 9 — Tipe Lanjutan yang Sering Muncul](/bagian-3/bab-9) untuk melanjutkan!
