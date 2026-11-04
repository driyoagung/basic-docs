---
title: "Bab 3 — Tipe Dasar"
---

# 📖 Bab 3 — Tipe Dasar

Setelah lingkungan latihan siap, saatnya mengenal "kosakata" utama TypeScript: tipe-tipe dasar. Sebagian besar terasa familiar — `string`, `number`, `boolean` semuanya sudah dikenal dari JavaScript. Tapi ada beberapa tipe yang berbeda karakter dan justru paling sering dikacaukan pemula: **`any` vs `unknown`**, **`as const`**, **type assertion**, dan **`enum` vs union literal**. Menguasai beda-beda ini sejak awal akan menyelamatkan Anda dari kebiasaan "cepat-cepat pakai `any`" — kebiasaan yang bisa datang menampar saat project membesar. Di akhir bab, kita gabungkan semua materi melalui satu studi kasus nyata: mengetik data user dari form pendaftaran.

---

## 3.1 🔤 Anotasi & Inference

Ada dua cara TypeScript mengetahui tipe sebuah variabel: Anda **menuliskannya** (anotasi), atau TS **menebaknya** (inference).

```ts
// Anotasi eksplisit — Anda menuliskan tipenya
let nama: string = 'Budi'
let umur: number = 25
let aktif: boolean = true

// Type inference — TS menebak sendiri (lebih disukai jika sudah jelas)
let kota = 'Jakarta'      // otomatis string
// kota = 123             // ❌ Error: Type 'number' is not assignable to type 'string'
```

`let kota = 'Jakarta'` tetap ketat seperti yang beranotasi. TS melihat nilai awalnya adalah string, maka `kota` dibekukan menjadi `string` untuk selamanya — mencoba mengisinya dengan `123` langsung error. Ini keajaiban inference: tipe yang ketat tanpa perlu menulis apa-apa.

| Kondisi | Anotasi atau Inference? |
|---|---|
| Variabel lokal dengan nilai awal jelas | Inference — biarkan TS menebak |
| Parameter & return type fungsi publik | Anotasi — kontrak harus tertulis |
| `useState` dengan state object kompleks | Anotasi (gaya `useState<T>(...)`) |
| Variabel dengan nama samar `data`, `result`, dll. | Anotasi — memperjelas bentuk |

**Penjelasan tabel:**

- **Inference** — prinsip idiomatik TS: *let the compiler do the work.* Dalam banyak kasus, tipe yang hasil inference lebih presisi daripada yang Anda tulis manual.
- **Anotasi** — wajib di "batas": parameter fungsi, return type API publik, dan data yang dikirim atau diterima dari luar (API, localStorage). Detail prinsip ini dibahas di Bab 20.

> 💡 **Praktik yang disarankan:**
> Anotasi di batas (boundary), inference di interior. Artinya: tulis tipe
> pada kontrak publik (props, parameter, return), tapi biarkan TS menebak
> untuk variabel lokal yang bentuknya sudah jelas.

---

## 3.2 📦 Tipe yang Dipelajari

Berikut semua tipe dasar yang akan Anda pakai sehari-hari:

| Tipe | Contoh | Catatan |
|---|---|---|
| `string`, `number`, `boolean` | `let x: number` | Dasar |
| Array | `string[]`, `Array<number>` | Dua cara penulisan yang setara |
| Tuple | `[string, number]` | Array dengan panjang & posisi yang tetap |
| `null`, `undefined` | `string \| null` | Wajib ditangani di strict mode |
| Literal type | `'success' \| 'error'` | Nilai spesifik sebagai tipe |
| `any` | `let x: any` | ⚠️ Mematikan pengecekan — hindari |
| `unknown` | `let x: unknown` | ✅ Versi aman dari `any` |
| `void` | fungsi tanpa `return` | Hasil yang tidak digunakan |
| `never` | fungsi yang tidak pernah selesai atau selalu meng-exit | Dipakai di exhaustive check (Bab 6) |

**Penjelasan tipe-tipe yang jarang dijelaskan di tutorial lain:**

- **Tuple** — array biasa `string[]` bisa berisi 3 string atau 3 juta string; tuple `[string, number]` mengunci **posisi**: elemen ke-0 harus string, ke-1 harus number, dan panjangnya dibekukan. Inilah yang dikembalikan `useState`: `[val, setter]`.
- **`void`** — jangan bingung dengan `undefined`. `void` berarti "tidak ada nilai yang digunakan". Fungsi yang return-nya memang bukan untuk UI (misal logging) bertipe `void`.
- **`never`** — tipe "mustahil": nilai yang tidak akan pernah ada. Fungsi yang selalu `throw` atau loop `while (true)` yang tidak pernah keluar bertipe `never`. Di Bab 6 akan jadi kunci exhaustive checking.

```ts
// Tuple — kenapa penting
const pasangan: [string, number] = ['Budi', 25]
const [namaUser, umurUser] = pasangan   // namaUser: string, umurUser: number

// void — return type fungsi tanpa nilai terpakai
function log(message: string): void {
  console.log(message)
}

// never — untuk fungsi yang selalu throw
function fail(msg: string): never {
  throw new Error(msg)
}
```

---

## 3.3 🛡️ `any` vs `unknown`: Kenapa `unknown` Lebih Aman

Ini salah satu kesalahan paling berat yang sering terjadi di project pemula: memakai `any` untuk data yang bentuknya belum pasti. Lihat perbedaannya:

```ts
// ❌ any — pintu belakang melepas semua aturan
let data: any = JSON.parse('{"umur": 25}')
data.hobiii.push(123)          // ✅ TIDAK error di compile...
// 💥 ...lalu crash runtime: Cannot read properties of undefined

// ✅ unknown — nilai boleh apa saja, tapi HARUS dicek dulu
let dataAman: unknown = JSON.parse('{"umur": 25}')
if (typeof dataAman === 'object' && dataAman !== null && 'hobi' in dataAman) {
  const hobi = (dataAman as { hobi: unknown }).hobi
  if (Array.isArray(hobi)) {
    console.log(hobi.length)   // aman — TS melihatnya sudah jadi unknown[]
  }
}
```

Perhatikan bedanya: di sisi `any`, semua pemakaian lolos tanpa pertanyaan — lalu aplikasi terlihat "sehat" sampai akhirnya crash di atas bug yang tidak terlihat. Di sisi `unknown`, semua pemakaian harus **membuktikan** bentuknya dulu lewat pengecekan.

| Aspek | `any` | `unknown` |
|---|---|---|
| Bisa diassign nilai apa saja | ✅ | ✅ |
| Bisa dipakai tanpa cek bentuk | ✅ (bahaya) | ❌ (harus narrowing dulu) |
| Penyebab error tipe menyembunyikan bug | ❗ Sangat sering | ✅ Tidak — compiler melindungi |
| Rekomendasi | ⚠️ Hindari | ✅ Gunakan untuk data yang belum pasti |

**Kapan `any` boleh dipakai?** Praktisnya nyaris tidak perlu. Jika memang terpaksa (misal tipe library pihak ketiga memang kurang), batasi persis di lokasi itu dengan `// eslint-disable` dan komentar penjelasan. Jangan biarkan nilai `any` mengalir ke bagian lain kode — ia akan menular dan membungkam error di daerah yang tidak terdefinisi.

> ⚠️ **`any` itu menular:**
> Jika sebuah variabel bertipe `any` di-assign ke variabel lain, variabel
> baru itu juga menjadi `any`. Error yang seharusnya muncul justru diam.
> Kebiasaan yang baik: gunakan `unknown` + pengecekan, JANGAN `any`.

---

## 3.4 🧊 `as const` dan Literal Type

Pada object biasa, TS menebak tiap nilai sebagai tipe mendasarnya (`string`, `number`). Terkadang Anda ingin object literal itu didokumentasikan sebagai **nilai konkret** — misalnya `'ig'`, `'fb'` menjadi tipe literal yang jelas, bukan sekadar `string`. Lihat sebelum/sesudahnya:

```ts
// Tanpa as const — TS menebak selebisa mungkin
const role = { admin: 'admin', guest: 'guest' }
role.admin        // tipe: string (terlalu luas!)

// Dengan as const — dibekukan
const role2 = { admin: 'admin', guest: 'guest' } as const
role2.admin       // tipe: 'admin' (literal!)
```

Fungsi lain dari `as const`: membuat semua field-nya **`readonly`** — object tidak bisa diubah (mutasi). Cocok untuk konfigurasi tetap:

```ts
const SUBJECT = {
  produk: '/api/produk',
  user: '/api/user',
} as const

// SUBJECT.produk = 'x'        // ❌ ERROR: readonly (tidak bisa diubah)
type Endpoint = typeof SUBJECT[keyof typeof SUBJECT]
// Endpoint = '/api/produk' | '/api/user'
```

> 💡 **Penggunaan `as const` yang paling sering:**
> Membuat config tetap (routes, settings, navigasi). Anda mendapatkan
> dua keuntungan sekaligus: nilai tidak berubah (readonly), dan tipenya
> cukup presisi untuk dipakai sebagai union literal.

---

## 3.5 🎭 Type Assertion (`as`) dan Bahayanya

Kadang Anda memahami bentuk data lebih baik dari compiler. Misalnya, nilai yang datang dari `document.getElementById` bertipe `HTMLElement | null`, padahal Anda tahu di HTML ada sebuah `input`. Type assertion memberitahu TS: "*percayalah, saya tahu*".

```ts
const input = document.getElementById('email') as HTMLInputElement
console.log(input.value)   // TS percaya Anda, autocomplete jalan
```

Tapi ingat analogi ini: `as` adalah **klaim tanpa pembuktian** — Anda klaim lebih tahu, compiler percaya begitu saja. Kalau klaim itu salah, compiler tidak melindungi Anda sama sekali, dan bug akan meledak di runtime persis seperti kasus `any`.

```ts
// ❌ klaim yang salah = bug dibayar di runtime
const data = JSON.parse('{"umur": "dua-puluh-lima"}') as { umur: number }
console.log(data.umur + 100)   // 💥 "dua-puluh-lima" + 100 → string "dua-puluh-lima100"

// ✅ solusi yang benar: cek dulu, baru as
const raw: unknown = JSON.parse('{"umur": "dua-puluh-lima"}')
if (typeof raw === 'object' && raw !== null) {
  const data = raw as { umur?: number }
  if (typeof data.umur === 'number') {
    console.log(data.umur + 100)   // 125 — kini aman
  }
}
```

| Kasus `as` | Sebaiknya dipakai? |
|---|---|
| DOM: `getElementById` ke elemen tertentu | ✅ Ya — kecil, dan Anda tahu bentuk HTML-nya |
| Konfigurasi library dengan bentuk pasti | ✅ Kadang perlu (misal `as const`) |
| Data dari API/sumber eksternal | ❌ Jangan — cek bentuknya dulu |
| "Membungkam" error yang tidak dipahami | ❌ Jangan — baca error & perbaiki akarnya |

> ⚠️ **Aturan:**
> `as` boleh dipakai saat **Anda benar-benar tahu** bentuk data (misal DOM
> yang HTML-nya Anda tulis sendiri). `as` berbahaya pada data dari dunia
> luar (API, user input) — gunakan validasi runtime, dibahas di Bab 12.

---

## 3.6 🏛️ `enum` vs Union Type

Dalam JavaScript murni tidak ada enum. Jika Anda punya status pesanan yang hanya bisa `'baru'`, `'diproses'`, atau `'selesai'`, ada dua cara menuliskannya di TypeScript:

```ts
// Cara 1: enum (fitur ekstra TS)
enum StatusOrder {
  Baru = 'Baru',
  Diproses = 'Diproses',
  Selesai = 'Selesai',
}
const s: StatusOrder = StatusOrder.Diproses

// Cara 2: union literal (kebanyakan dependency React pakai INI)
type StatusOrder = 'Baru' | 'Diproses' | 'Selesai'
const s: StatusOrder = 'Diproses'
```

| Aspek | `enum` | Union Literal |
|---|---|---|
| Kode JS saat runtime | Ada Runtime object | ✅ Hilang total saat compile |
| Import | Perlu `import { StatusOrder }` | ✅ String biasa, tanpa import |
| Union dengan literal lain | ⚠️ Tidak bisa flexible | ✅ `'A' \| 'B' \| number` mudah |
| Rekomendasi di ekosistem React | ⚠️ Jarang | ✅ Standar de facto |

**Mengapa banyak tim memilih union literal?**

- **Lebih sedikit sintaks** — dan hilang total saat compile: hasil JS tidak membawa object enum.
- **Kompatibel dengan data API** — nilai string `'Diproses'` dari server cocok langsung, tanpa perlu `import`.
- **Fleksibel** — mudah digabung dengan tipe lain: `'A' | 'B' | number`.
- **Pola de facto design system** — komponen React & Tailwind punya props seperti `variant: 'primary' | 'secondary'`; inilah pola yang dipakai semua library komponen modern.

> 💡 **Kenapa banyak tim menghindari `enum`:**
> `enum` menghasilkan object runtime di JavaScript — kode yang selalu
> melekat meski nilainya sudah diketahui. Untuk pola modern, gunakan
> **union literal**: lebih ringan, langsung cocok dengan data API, dan
> tanpa biaya kode tambahan di runtime.

---

## 3.7 🕳️ `null` & `undefined`: `?.` dan `??`

Dengan `strictNullChecks` aktif, TypeScript melarang Anda mengakses property nilai yang **mungkin kosong**. Ini salah satu sumber error yang paling banyak di project — jadi harus dilawan dua tools: `?.` (optional chaining) dan `??` (nullish coalescing).

```ts
const user: { alamat: { kota: string } | null } | null = bacaUser()

// ❌ Tanpa penanganan — compile error
// console.log(user.alamat.kota)

// ✅ Optional chaining — berhenti aman jika salah satu tak ada
console.log(user?.alamat?.kota)   // undefined jika user null atau alamat null

// ✅ Nullish coalescing — fallback jika TAK ADA, bukan jika "" atau 0
const kota = user?.alamat?.kota ?? 'Kota tidak diketahui'
```

| Ekspresi | Kepanjangan yang sama | Kapan dipakai |
|---|---|---|
| `objek?.prop` | `objek === null ? undefined : objek.prop` | Akses rantai object yang mungkin kosong |
| `x ?? default` | `x !== null && x !== undefined ? x : default` | Beri nilai fallback, tanpa ganggu `0`, `''`, `false` |

**Sekilas beda `??` vs `||`:**

```ts
const nama = ''                                  // string kosong
const tampilanA = nama ?? 'tamu'                 // '' — string kosong tetap dipakai
const tampilanB = nama || 'tamu'                 // 'tamu' — string kosong dianggap salah
```

Aturan praktis: `??` hanya menganggap `null`/`undefined` sebagai "belum ada nilai", sedangkan `||` menganggap semua falsy (`0`, `''`, `false`) sebagai "kosong". Untuk field yang bisa berisi `0` atau string kosong yang sah, `??` adalah pilihan yang lebih aman.

---

## 3.8 🎬 Studi Kasus: Mengetik Data User dari Form Pendaftaran

Sekarang gabungkan semuanya. Bayangkan Anda menerima data dari `<form>` pendaftaran — data ini datang dari **input user** yang tidak bisa dipercaya bentuknya. Target kita: membentuk data mentah itu menjadi object bertipe `FormPendaftaran` yang bersih dan aman:

```ts
type FormPendaftaran = {
  nama: string
  email: string
  umur: number
  hobi: string[]
  nik?: string   // opsional — tidak semua isi NIK
}
```

Data mentah dari form secara teknis sangat kacau: `FormData` menyimpan pasangan `string | Blob` yang bentuknya tidak diketahui sebelum runtime. Kita bisa ambil nilainya, cek, dan mengembalikan object bertipe `FormPendaftaran`:

```ts
function dariForm(form: FormData): FormPendaftaran {
  const nama = form.get('nama')
  if (typeof nama !== 'string') throw new Error('Nama wajib diisi')

  const email = form.get('email')
  if (typeof email !== 'string') throw new Error('Email wajib diisi')

  const umur = Number(form.get('umur'))
  if (Number.isNaN(umur)) throw new Error('Umur harus angka')

  const hobi = form.getAll('hobi').filter((h): h is string => typeof h === 'string')

  const nik = form.get('nik')
  const nikBersih: string | undefined = typeof nik === 'string' && nik.length > 0 ? nik : undefined

  return { nama, email, umur, hobi, nik: nikBersih }
}
```

Perhatikan apa yang terjadi di code:

```
Data mentah dari form (FormData, bentuk tak pasti)
            │
            ▼
   Semua field dicek satu per satu
            │
   ┌────────┴────────────┐
   │                     │
 nama string?         umur angka?
   │ YA                 │ YA
   ▼                    ▼
 email string?      nik → string | undefined
   │ YA                 │
   │                    │
   └────────┬────────────┘
            ▼
  Object bertipe FormPendaftaran (bentuk aman) ✅
```

Hal yang bisa dipelajari dari studi ini:

- **`dariForm` memakai semua teknik bab ini sekaligus:** konversi `Number()`, pengecekan `typeof`, custom type guard `(h): h is string`, dan `undefined` untuk field optional.
- **Kontraknya jelas:** fungsi ini **akan** mengembalikan `FormPendaftaran` yang valid — ATAU throw. Bukan diam-diam mengembalikan bentuk setengah jadi.
- **Field optional (`nik?: string`) terdokumentasi jelas** — siapa pun yang membaca tipe ini langsung tahu field mana wajib dan mana tidak.

> 💡 **Studi ini akan kita perdalam lagi di Bab 12:**
> Validasi form dengan jenis yang sama akan kembali dipaketkan dengan
> **Zod** — schema yang bisa membuktikan bentuk data sekaligus menghasilkan
> pesan error yang terstruktur per-field.

---

## ✅ Checklist Bab 3

- **Anotasi vs inference** — inference saat TS bisa menebak; anotasi di batas (parameter, return publik, data eksternal).
- **`any` vs `unknown`** — `any` mematikan pengecekan & menular; `unknown` adalah alternatif yang aman karena memaksa pengecekan bentuk dulu.
- **Tuple** — array dengan panjang & posisi tetap; `useState` mengembalikan tuple `[val, setter]`.
- **`as const`** — membekukan literal & nilai; berguna untuk config & membuat tipe literal dari object.
- **Type assertion (`as`)** — pertukaran pertanggungan Anda vs compiler; aman untuk DOM, bahaya untuk data dunia luar.
- **`enum` vs union literal** — pilih union literal (standar React & Next.js); enum jarang dipakai.
- **`?.` (optional chaining)** — akses aman ke rantai object yang mungkin kosong.
- **`??` (nullish coalescing)** — fallback hanya untuk `null`/`undefined`, BUKAN untuk `""`, `0`, `false` (beda dari `||`).
- **Field optional** — `nik?: string` artinya field bisa tidak ada; gunakan `string | undefined` saat keberadaannya perlu diperiksa.
- **Studi kasus** — data dari form harus divalidasi lalu dikembalikan sebagai object yang bentuknya dipastikan dengan tipe.

---

⏭️ Lanjut ke [🔧 Bab 4 — Fungsi di TypeScript](/bagian-2/bab-4) untuk melanjutkan!
