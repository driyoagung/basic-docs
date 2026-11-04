---
title: "Bab 9 — Tipe Lanjutan yang Sering Muncul"
---

# 📖 Bab 9 — Tipe Lanjutan yang Sering Muncul

Bab ini mengupas fitur "level berikutnya" dari sistem tipe: `keyof`, `typeof`, indexed access, mapped type, conditional type, template literal type, `as const`, dan `satisfies`. Anda tidak harus menguasainya semua dalam sehari — yang penting adalah **mengenali bentuknya** saat muncul di kode orang lain, karena fitur ini biasanya tampil di kode library dan kode senior. Di Bab 7–8 Anda sudah melihat petunjuk kecilnya (`typeof ambilProduk`); sekarang kami bedah satu per satu. Satu penekanan sejak awal: fitur lanjutan ini bisa menghasilkan tipe yang sangat pintar, tetapi juga sangat sulit dibaca — bagian akhir bab ini justru membimbing Anda kapan harus **berhenti**.

## 9.1 🔑 `keyof` & `typeof`: Mengambil Tipe dari Kebenaran yang Ada

Dua operator kecil ini menjadi fondasi seluruh fitur berikutnya:

```ts
type Produk = {
  id: number
  nama: string
  harga: number
}

// keyof: semua nama properti menjadi union
type KunciProduk = keyof Produk
// ⇨ 'id' | 'nama' | 'harga'

// typeof: ambil tipe dari NILAI yang sudah ada (bukan typeof runtime!)
const defaultProduk = { id: 0, nama: '', harga: 0 }
type BentukDefault = typeof defaultProduk
// ⇨ { id: number; nama: string; harga: number }
```

**Penjelasan operator:**

- **`keyof T` menghasilkan union berisi semua nama properti `T`** — kegunaannya terbesar di fungsi yang menyentuh properti: Anda tidak bisa menulis nama properti yang tidak ada.
- **`typeof x` di konteks tipe menghasilkan tipe lengkap dari nilai `x`** — berbeda dengan `typeof` runtime JavaScript yang hanya mereturn string seperti `'object'`. Dua dunia berbeda mesin ejaannya sama.
- **`keyof typeof x`** kombinasi praktis: `typeof` lebih dulu menangkap tipe objeknya, `keyof` menyusun daftar kuncinya.

Kombinasi paling penting di dunia nyata — akses properti yang aman:

```ts
const produk: Produk = { id: 1, nama: 'Laptop', harga: 15_000_000 }

function ambilNilai(obj: Produk, kunci: keyof Produk): string {
  const nilai = obj[kunci]
  return String(nilai)
}

ambilNilai(produk, 'nama')      // OK ✅
ambilNilai(produk, 'namaBaru')  // ❌ error: bukan bagian dari keyof Produk
```

## 9.2 🔍 Indexed Access: Mengambil Tipe dari Satu Properti

```ts
type Produk = {
  id: number
  nama: string
  harga: number
  tags: string[]
}

type HargaProduk = Produk['harga']   // ⇨ number
type TagProduk   = Produk['tags']    // ⇨ string[]

// Bisa dipakai dengan union key juga
type FieldTeks = Produk['nama' | 'tags']
// ⇨ string | string[]
```

**Penjelasan indexed access:**

- **`Produk['harga']` artinya "tipe properti `harga` milik `Produk`"** — Anda tak perlu menulis ulang `number`. Robahkan relasi: properti berubah, tipe turunannya ikut.
- **Serasi dengan `keyof`** — pola `Produk[keyof Produk]` menghasilkan union semua tipe properti: `number | string | string[]`.
- **Praktis saat tipe berlapis** — jika suatu waktu `harga: number` berubah menjadi `harga: number | null`, bagian yang memakai `Produk['harga']` tetap akurat tanpa perlu diubah.

> 💡 **Kenapa lebih baik daripada alias manual:** `type HargaProduk = number` memang terlihat singkat, tetapi kehların relasi. Saat `Produk['harga']` berubah menjadi `number | null`, hanya alias index access yang otomatis ikut; alias manual tidak.

## 9.3 🗺️ Mapped Type: Membentuk Tipe dengan "Perulangan Properti"

Mapped type memungkinkan Anda "melewati" setiap properti suatu tipe untuk membangun tipe baru — di belakang layar, utility `Readonly` dan `Partial` Bab 8 sebenarnya ditulis seperti ini:

```ts
// Implementasi Readonly dan Partial di lib TS
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K]
}

type MyPartial<T> = {
  [K in keyof T]?: T[K]
}

// Buatan sendiri: tiap field menjadi fungsi setter
type Setters<T> = {
  [K in keyof T]: (nilai: T[K]) => void
}

type ProdukSetters = Setters<Pick<Produk, 'nama' | 'harga'>>
// ⇨ { nama: (nilai: string) => void; harga: (nilai: number) => void }
```

**Penjelasan mapped type (tingkat pengenalan):**

- **`[K in keyof T]`** dibaca: "untuk setiap nama properti `K` dari `T`, buat properti dengan nama sama". `T[K]` adalah tipe properti itu (indexed access dari 9.2).
- **Modifier dapat ditambah atau dihapus** — `readonly` dan `?` boleh diselipkan; menaruh tanda `-` di depan menghapusnya: `-readonly` menghilangkan readonly, `-?` meniadakan opsional.
- **Inilah asal mula utility Bab 8** — memahami bentuk dasar ini membuka mata bahwa utility bukan sihir, meski praktiknya begitu.

## 9.4 🔀 Conditional Type: Tipe yang Memilih Berdasarkan Syarat

```ts
type Produk = { id: number; nama: string; harga: number; deskripsi?: string }

// Jika T adalah array → ambil tipe elemennya; selain itu → T apa adanya
type Unwrap<T> = T extends Array<infer U> ? U : T

type A = Unwrap<string[]>                // ⇨ string
type B = Unwrap<number>                  // ⇨ number
type D = Unwrap<Promise<string>[]>       // ⇨ Promise<string>

// Dipadukan keyof: mencatat kunci yang TIDAK opsional
type NonOptionalKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? never : K
}[keyof T]
type KunciWajib = NonOptionalKeys<Produk>
// ⇨ 'id' | 'nama' | 'harga' (deskripsi tidak ikut karena opsional)
```

**Penjelasan conditional type (tingkat pengenalan):**

- **`T extends U ? X : Y`** seperti ternary biasa, tetapi beroperasi di level tipe. Berguna saat tipe "berperilaku berbeda" tergantung bentuk input.
- **`infer U`** kata kunci di dalam conditional type: ia "menangkap" tipe di dalam pola — di contoh atas, `U` terisi tipe elemen array.
- **Sesuatu yang sudah dipakai bersama** — `Awaited<T>` dari Bab 8 pada dasar merupakan conditional type yang membuka `Promise<T>` berlapis-lapis.

> 💡 **Kenapa cukup "pengenalan ringan":** conditional type bersarang bisa cepat jadi tidak terbaca. Untuk kasus aplikasi di Project Praktik, Anda hampir tidak menulisnya sendiri — cukup mengenalnya saat muncul di tipe library.

## 9.5 📝 Template Literal Type: Tipe dari Pola Teks

```ts
// Pola dasar: prefix + kapitalisasi
type EventName<T extends string> = `on${Capitalize<T>}`

type Klik  = EventName<'click'>     // ⇨ 'onClick'
type Fokus = EventName<'focus'>     // ⇨ 'onFocus'

// Pola nyata: membuat label berpola dari kunci
type FieldProduk = keyof Pick<Produk, 'nama' | 'harga'>
type LabelForm = `label_${FieldProduk}`
// ⇨ 'label_nama' | 'label_harga'

// Union literal otomatis terkombinasi
type Arah   = 'atas' | 'bawah'
type Sisi   = 'kiri' | 'kanan'
type Posisi = `${Arah}-${Sisi}`
// ⇨ 'atas-kiri' | 'atas-kanan' | 'bawah-kiri' | 'bawah-kanan'
```

**Penjelasan template literal type:**

- **Tipe string dengan pola** — seperti template literal biasa, tetapi hasilnya *tipe string* yang hanya mengizinkan nilai sesuai pola. `EventName<'click'>` hanya menerima `'onClick'` — tidak terima `'onCuruk'`.
- **`Capitalize`** adalah utility string bawaan TypeScript; `Uncapitalize`, `Uppercase`, `Lowercase` juga tersedia.
- **Kegunaan paling praktis** — nama properti berpola: handler event, kelas CSS berawalan, key label form. Autocomplete yang muncul juga mengikuti polanya.

## 9.6 🧊 `as const`: Objek Konfigurasi yang Tegas

```ts
// Tanpa as const: TS menebak ke bentuk terluas
const STATUS = {
  loading: 'loading',
  error: 'error',
  success: 'success',
}
// typeof STATUS = { loading: string; error: string; success: string }

// Dengan as const: nilai jadi literal, semua field readonly
const STATUS_KETAT = {
  loading: 'loading',
  error: 'error',
  success: 'success',
} as const
// typeof STATUS_KETAT = {
//   readonly loading: 'loading'
//   readonly error: 'error'
//   readonly success: 'success'
// }

// Pola umum untuk daftar nilai
const UKURAN = ['kecil', 'sedang', 'besar'] as const
type UkuranProduk = (typeof UKURAN)[number]
// ⇨ 'kecil' | 'sedang' | 'besar'
```

**Penjelasan `as const`:**

- **Dua efek sekaligus** — semua nilai momen jadinya *literal type* dan semua properti jadi *readonly*. Kombinasi pas untuk objek konfigurasi yang tidak boleh diubah.
- **Pola `(typeof X)[number]`** tangkap anggota kunci array union: `(typeof UKURAN)[number]` mengambil union semua elemen array — dari data array menjadi tipe union siap pakai.
- **Lebih aman daripada union manual** — jika isi array berubah, tipe union mengikutinya otomatis.

Alur tipenya bisa dilihat begini:

```
            DARI NILAI KE TIPE

  const UKURAN = ['kecil','sedang','besar'] as const
                      │
           typeof UKURAN
                      │  (tipe array: readonly ['kecil','sedang','besar'])
                      ▼
         (typeof UKURAN)[number]
                      │  (index access: ambil tipe semua elemen)
                      ▼
         'kecil' | 'sedang' | 'besar'   ← union siap dipakai
```

## 9.7 🎯 `satisfies`: Validasi Bentuk Tanpa Mempersempit Tipe

Operator `satisfies` (sejak TypeScript 4.9) menyelesaikan dilema lama tentang anotasi tipe: memvalidasi bentuk **tanpa mempersempit** tipe variabel:

```ts
// Kasus klasik: objek konfigurasi berisi warna tema
const warnaTema = {
  primer:   '#3B82F6',
  sekunder: '#10B981',
  teks:     '#111827',
} satisfies Record<string, string>

// Perbandingan: anotasi biasa
const warnaLama: Record<string, string> = {
  primer:   '#3B82F6',
  sekunder: '#10B981',
  teks:     '#111827',
}

// warnaTema.primer  // ⇨ '#3B82F6' (literal, spesifik) ✅
// warnaLama.primer  // ⇨ string (melebar — info spesifik hilang)
```

**Penjelasan `satisfies`:**

- **Memvalidasi tanpa melebarkan** — `satisfies` memeriksa bentuk, tetapi tipe variabel tetap miliknya sendiri. Berbeda dengan anotasi `: Tipe` yang *mengganti* tipe variabel dengan anotasi itu.
- **Kasus paling cocok** — konfigurasi dengan nilai berbeda-beda per kunci. Dengan `satisfies`, `warnaTema.primer` tetap literal `'#3B82F6'`; ditambah `as const`, ia bahkan readonly.
- **Salah eja saat akses langsung tertangkap** — karena tipe variabelnya tetap bentuk litera, akses `ROUTES.salahEja` langsung error. (Pada bentuk `Record` umum, kunci asing tidak lolos cek — lihat pembahasan di bawah.)

Konfigurasi route adalah contoh di mana teknik perbedaannya sangat terlihat:

```ts
type RouteConfig = Record<string, { path: string; title: string }>

const ROUTES = {
  produk: { path: '/produk',     title: 'Daftar Produk' },
  detail: { path: '/produk/:id', title: 'Detail Produk' },
} satisfies RouteConfig

ROUTES.produk.path    // autocomplete beserta bentuk lengkapnya ✅
ROUTES.paintuk        // ❌ error: kunci tidak ada — salah eja tertangkap
```

Bahannya sama bentuknya seperti fungsi lama ini — aman dan fleksibel tanpa trade-off.

## 9.8 🛑 Kapan Berhenti: Tipe Terlalu Pintar Lebih Merugikan

Fitur di atas memang hebat, tetapi tipe yang terlalu pintar punya biaya nyata:

```
              KESEIMBANGAN KEKAYAAN TIPE

  Terlalu miskin ────────────────────────────── Terlalu pintar
  (any, tipe duplikat manual)         (conditional bersarang 5 lapis,
                                       template literal di segala arah)

  ┌───────────────────────────────┐   ┌───────────────────────────┐
  │ error terdeteksi terlambat    │   │ error pinggir tak terbaca │
  │ bug lolos ke produksi         │   │ kompilasi lambat          │
  │                               │   │ rekan tim perlu "dokumen  │
  │                               │   │  tipe" untuk membaca      │
  └───────────────────────────────┘   └───────────────────────────┘

             ⚖️  Titik enaknya: di tengah  ⚖️
```

| Gejala | Bahaya | Solusi |
|---|---|---|
| Conditional type bersarang 3 lapis ke atas | Error TS memanjang puluhan baris | Pecah jadi alias kecil bernama yang jelas |
| Mapped + template literal + conditional digabung | 2 baris tipe butuh 30 detik dibaca | Pilih bentuk yang paling sederhana |
| Generik bertumpuk 3–4 level | Autocomplete tidak berguna, error tak terbaca | Gantikan dengan tipe konkret |
| Tipe lebih panjang dari logikanya | Over-engineering | Tulis logika dulu; biarkan inference bekerja |

Aturan ringkas yang mudah diaplikasikan:

```
❓ Apakah tipe ini mencegah error nyata (typo, data salah bentuk)?
   ├─ Tidak → jangan tulis; cukup komentar.
   └─ Ya → lanjut ke pertanyaan berikutnya:
❓ Apakah tipe ini masih terbaca oleh rekan tim besok?
   ├─ Tidak → sederhanakan; biarkan inference TypeScript bekerja.
   └─ Ya → tulis, lalu beri nama deskriptif.
```

> ⚠️ **Prinsip penting:** TypeScript adalah alat bantu, bukan lomba sulit. Pembaca kode lebih senang melihat tipe 5 baris yang jelas dibandingkan tipe 1 baris yang butuh dokumen penjelasan. Jika ada tipe yang membuat file `.ts` lebih sulit dibaca daripada versi `.js`-nya, tipe tersebut gagal membantu.

## ✅ Checklist Bab 9

- ✅ Bisa memakai `keyof` untuk menghasilkan union seluruh nama properti, dan `typeof` dalam konteks tipe untuk mengisi tipe dari nilai.
- ✅ Bisa memakai indexed access seperti `Produk['harga']` agar tipe turunan selalu sinkron dengan properti induknya.
- ✅ Mengenal bentuk mapped type `[K in keyof T]: T[K]`, serta tahu bahwa utility Bab 8 dibangun dengan ini.
- ✅ Mengenal conditional type `T extends U ? X : Y` beserta `infer` — cukup mampu membaca, belum harus menulis.
- ✅ Bisa menulis template literal type sederhana seperti `on${Capitalize<T>}`.
- ✅ Memakai `as const` untuk objek konfigurasi, dan pola `(typeof X)[number]` untuk union dari array.
- ✅ Memakai `satisfies` untuk memvalidasi bentuk tanpa mengganti tipe spesifik.
- ✅ Punya penyaring over-engineering: tipe harus mencegah error nyata dan tetap mudah dibaca.

---

⏭️ Lanjut ke [🏗️ Bab 10 — Class & OOP di TypeScript](/bagian-4/bab-10) untuk melanjutkan!
