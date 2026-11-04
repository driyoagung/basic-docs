---
title: "Bab 19 — Membaca & Memperbaiki Error TypeScript"
---

# 📖 Bab 19 — Membaca & Memperbaiki Error TypeScript

Selama 18 bab ini Anda pasti sudah beberapa kali bertemu pesan error berwarna merah. Bab ini adalah buku saku darurat: kumpulan error yang paling sering muncul, artinya apa, dan cara memperbaikinya. Ketika Anda mulai menulis kode sendiri tanpa tutorial, bab inilah yang paling sering dibuka.

## 19.1 🚨 Error yang Hampir Pasti Anda Temui

| Pesan Error (inti) | Penyebab Umum | Solusi |
|---|---|---|
| `Object is possibly 'undefined'` / `'null'` | Lupa menangani nilai kosong | Narrowing, `?.`, `??` |
| `Type 'X' is not assignable to type 'Y'` | Bentuk data tidak cocok | Periksa field & tipe |
| `Property 'x' does not exist on type` | Typo atau tipe belum dipersempit | Cek nama / narrowing |
| `Parameter 'x' implicitly has an 'any' type` | Tidak ada anotasi | Beri tipe parameter |
| `Argument of type ... is not assignable to parameter` | Argumen salah bentuk | Sesuaikan argumen |
| `Cannot find module ... or its type declarations` | Tidak ada `@types` / path salah | Install `@types/...` atau deklarasi |
| `'x' is declared but never used` | Aturan lint | Hapus atau awali dengan `_` |

**Penjelasan tabel:**

- **Enam dari tujuh error di atas** punya satu akar masalah yang sama: bentuk data yang Anda tulis tidak cocok dengan bentuk yang diminta. TypeScript hanya melapor di tempat ketidakcocokan itu terdeteksi.
- Error pertama dan kelima sering membingungkan karena mirip. Bedanya: yang pertama soal **variabel yang bisa kosong**, yang kelima soal **argumen yang salah bentuk**.

## 19.2 🔧 Bedah 7 Error — Pemicu, Pesan, Solusi

Setiap error di bawah punya pola yang sama: kode pemicu → pesan error → solusi.

### Error #1 — `Object is possibly 'undefined'`

```ts
const angka: number[] = [1, 2, 3]

console.log(angka[5].toFixed(2))
// ❌ 'angka[5]' is possibly 'undefined'
```

Array bisa saja diakses di luar batasnya, dan TypeScript tidak bisa membuktikan sebaliknya sebelum runtime. Solusinya bertingkat:

```ts
console.log(angka[5]?.toFixed(2) ?? 'kosong')  // ✅ aman: boleh kosong
if (angka[5] !== undefined) {
  console.log(angka[5]!.toFixed(2))            // ✅ sah: cek eksplisit sudah dibuat
}
console.log(angka[5]!.toFixed(2))              // ⚠️ hanya jika Anda benar-benar yakin
```

::: warning ⚠️
Simbol `!` (non-null assertion) hanya dipakai untuk nilai yang Anda tahu pasti tidak kosong — alasan yang compiler tidak bisa lihat sendiri. Jangan jadikan alat cepat untuk menutup error.
:::

### Error #2 — `Type 'X' is not assignable to type 'Y'`

```ts
type User = { id: number; nama: string; email: string }

const baru: User = { id: 1, nama: 'Budi' }
// ❌ Property 'email' is missing in type '{ id: number; nama: string; }'
//    but required in type 'User'
```

Data mengklaim bertipe `User` tetapi field-nya tidak lengkap. Solusi:

- **Lengkapi field-nya** — biasanya ini yang benar: `email: 'budi@mail.com'`
- **Ubah tipe-nya** — jika memang boleh kosong, jadikan opsional: `email?: string`

### Error #3 — `Property 'x' does not exist on type`

Ada dua penyebab klasik. Pertama: **typo**.

```ts
const produk = { id: 1, nama: 'Laptop' }
console.log(produk.nma)
// ❌ Property 'nma' does not exist on type '{ id: number; nama: string; }'
```

Kedua: **tipe belum dipersempit** — khas union:

```ts
type Hasil =
  | { status: 'sukses'; data: string[] }
  | { status: 'gagal'; pesan: string }

function tampil(h: Hasil) {
  return h.data
  // ❌ varian { status: 'gagal' } tidak memiliki 'data'
}

// ✅ Solusi: narrowing dulu
function tampil2(h: Hasil) {
  if (h.status === 'sukses') return h.data   // TS tahu: varian ini punya data
  return h.pesan                              // TS tahu: varian ini punya pesan
}
```

### Error #4 — `Parameter 'x' implicitly has an 'any' type`

```ts
function hitungTotal(item) {
  return item.harga * item.jumlah
}
// ❌ Parameter 'item' implicitly has an 'any' type
```

Strict mode mewajibkan setiap parameter punya tipe. Solusinya beri anotasi:

```ts
function hitungTotal(item: { harga: number; jumlah: number }): number {
  return item.harga * item.jumlah
}
```

::: danger 🚨
Jangan menutup error ini dengan menulis `any`. Itu bukan solusi — itu membangun utang yang membuat semua error berikutnya tidak terlihat. Lihat 19.5 tentang `any` yang menular.
:::

### Error #5 — `Argument of type ... is not assignable to parameter`

```ts
function diskon(harga: number): number {
  return harga - harga * 0.1
}

const hasil = diskon('15000')
// ❌ Argument of type 'string' is not assignable to parameter of type 'number'
```

Yang salah adalah argumen yang Anda kirim, bukan parameternya. Konversi secara eksplisit di batas data:

```ts
const hasil = diskon(Number('15000'))  // ✅
```

### Error #6 — `Cannot find module ... or its type declarations`

```ts
import _ from 'lodash'
// ❌ Could not find a declaration file for module 'lodash'
```

Dua penyebab paling umum dan solusinya:

```bash
# 1. Library belum punya tipe — install @types-nya
npm i -D @types/lodash

# 2. Path alias @/ belum didefinisikan di tsconfig.json
#    tambahkan: "paths": { "@/*": ["./src/*"] }
```

Untuk module tanpa tipe sama sekali (misal impor file aset), deklarasikan sendiri:

```ts
// types/gambar.d.ts
declare module '*.png' {
  const src: string
  export default src
}
```

### Error #7 — `'x' is declared but never used`

```ts
function kirim(id: number, opsi: string) { /* hanya pakai id */ }
// ❌ 'opsi' is declared but never used
```

Error ini berasal dari lint, bukan dari tsc. Jika parameter memang wajib ada karena mengikuti kontrak interface, gunakan awalan `_`:

```ts
function kirim(id: number, _opsi: string) { /* ada demi bentuk, tidak dipakai */ }
```

## 19.3 🪜 Membaca Pesan Error Panjang — Baca dari Bawah

Error yang panjang punya struktur seperti berita: penyebab akarnya ada di **baris terakhir**, bukan yang pertama.

```ts
type Alamat = { kota: string; kodePos: string }
type Order = { id: string; alamat: Alamat }

const order: Order = {
  id: 'ORD-1',
  alamat: { kota: 'Bandung' },   // kodePos hilang
}
```

tsc menghasilkan pesan bertingkat seperti ini:

```text
src/index.ts:5:7 - error TS2739: Type '{ kota: string; }'
  is not assignable to type 'Order'.
  Types of property 'alamat' are incompatible.
    Type '{ kota: string; }' is missing the following
    properties from type 'Alamat': kodePos
```

Cara membacanya — dari bawah ke atas:

1. **Baris terakhir: `...is missing... kodePos`** — inilah penyebab sebenarnya. Mulailah dari sini.
2. **`Types of property 'alamat' are incompatible`** — field mana yang bermasalah.
3. **Baris pertama: `Type ... is not assignable to type 'Order'`** — konteks besar di mana error ditemukan.

::: tip 💡
Baris pertama hanya menjawab "**di mana**", baris terakhir menjawab "**kenapa**". Mulailah dari kenapa.
:::

## 19.4 🛠️ Kapan `as`, `!`, dan `@ts-expect-error` Boleh Dipakai

Ketiganya adalah cara memerintah compiler agar diam. Semuanya sah **jika Anda memiliki bukti yang compiler tidak bisa lihat sendiri**.

| Alat | Aman Dipakai Saat | Berbahaya Saat |
|---|---|---|
| `as T` | Bentuk data sudah dibuktikan di runtime (misal lewat Zod) | Klaim bentuk tanpa bukti — compiler hanya mempercayai kata Anda |
| `!` | Ada guard yang lebih luas di atasnya (`if (!x) throw`) atau verifikasi runtime terpisah | Rantai asumsi berantai di jalur yang tidak pernah diverifikasi |
| `@ts-expect-error` | Bersifat sementara, dengan komentar alasan, dan ada rencana menghapusnya | Menutup error yang seharusnya benar-benar diperbaiki |
| `@ts-ignore` | — | Hindari sepenuhnya; selalu ganti dengan `@ts-expect-error` |

```ts
// ✅ 'as' yang berdasar: bentuk data SUDAH dibuktikan Zod di runtime
const parsed: unknown = await res.json()
const produk = ProdukSchema.parse(parsed)   // bahkan 'as' pun jadi tidak perlu

// ✅ '!' dengan alasan tercatat: findIndex sudah dijaga guard di atasnya
const idx = daftar.findIndex((p) => p.id === id)
if (idx === -1) throw new Error('produk tidak ada')
const target = daftar[idx]!   // idx dipastikan valid oleh guard sebelumnya
```

```ts
// ✅ @ts-expect-error yang disiplin — punya alasan dan tanggal kedaluwarsa
// @ts-expect-error — TODO(budi): library v3.2 belum menyertakan d.ts, hapus setelah upgrade
kirimKeLib(options)
```

::: tip 💡
Keunggulan `@ts-expect-error` dibanding `@ts-ignore`: jika error yang ia "kira" akan muncul tiba-tiba tidak terjadi lagi (misal library sudah merilis file tipenya), tsc memberi peringatan *"Unused '@ts-expect-error' directive"*. Directive yang tidak terpakai otomatis jadi terlihat — seperti daftar TODO yang bergaris bawah sendiri.
:::

## 19.5 ☣️ Bahaya `any` yang Menular

`any` tidak hanya mematikan pengecekan di satu variabel — ia mengalir ke semua kode yang keluar dari sana.

```ts
async function ambil(): Promise<any> {
  const res = await fetch('/api/produk')
  return res.json()
}

const produk = await ambil()      // produk: any
const total = produk.reduce((a: any, b: any) => a.harga + b.harga, 0)
// tsc: "setuju saja" — tidak ada satu pun baris yang dicek
```

Tiga cara `any` merusak kode:

- **Menular lewat return** — fungsi yang menyentuh `any` umumnya mengembalikan `any` juga. Nilai `any` turun ke pemakai berikutnya.
- **Pengecekan hilang di semua turunannya** — typo, field salah, operasi aneh: semuanya lolos tanpa peringatan. Autocomplete juga ikut hancur.
- **Refactor jadi buta** — saat rename field `harga` menjadi `price`, editor hanya menemukan kode bertipe. Kode di balik `any` lolos diam-diam sampai aplikasi error di runtime.

Solusinya: ganti `any` dengan `unknown`. Nilai `unknown` masih menerima apa pun, tetapi **wajib dibuktikan bentuknya dulu** sebelum dipakai:

```ts
async function ambil(): Promise<unknown> {
  const res = await fetch('/api/produk')
  return res.json()
}

const data = await ambil()               // data: unknown — tidak bisa langsung dipakai
const daftar = ProdukSchema.parse(data)  // ✅ validasi runtime → tipe pasti
```

::: danger 🚨
**`any` = percaya begitu saja. `unknown` = tidak percaya sampai dibuktikan.** Untuk data yang datang dari luar project (API, `localStorage`, `JSON.parse`), selalu mulai dari `unknown`, lalu buktikan bentuknya dengan Zod atau type guard sebelum dipakai.
:::

## 19.6 🔎 Hover & `typeof` untuk Debug

### Hover — Alat Debug Pertama Anda

Di VS Code, menggerakkan kursor ke sebuah variabel sudah cukup untuk melihat tipe yang TS percayai saat itu.

```tsx
const [items, setItems] = useState([])
// hover items: never[]  ← tanda bahaya! array kosong menyimpulkan never[]
// ✅ perbaiki: useState<Item[]>([])
```

Kebiasaan hover yang berguna:

- **Di atas variabel** — melihat tipe yang sedang diterima.
- **Di atas pemanggilan fungsi** — melihat bentuk argumen yang diminta.

### `typeof` — Melihat Tipe Dari Nilai

```ts
const data = await fetchJson(url, ProdukSchema)
type TipeAktual = typeof data   // compile time: "tipe yang SEBENARNYA diterima?"

console.log(typeof nilai)       // runtime: 'string' | 'number' | 'object' | ...
                                // catatan: ini typeof JavaScript, bukan typeof TypeScript
```

::: tip 💡
Ada **dua typeof dari dua dunia yang berbeda**: typeof di TypeScript menghasilkan tipe (compile time), typeof di JavaScript menghasilkan string (runtime). Gunakan **hover** untuk menjawab "TS berpikir ini apa", dan `console.log(typeof x)` untuk menjawab "data nyata ini sebenarnya apa".
:::

## 19.7 🗺️ Diagram Alur Debugging

```
                ERROR MUNCUL (editor / tsc --noEmit)
                              │
                              ▼
              Baca pesan dari BARIS TERAKHIR dulu
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Penyebab sudah jelas di sana? │
              │ (typo, field hilang, dsb.)    │
              └──────┬─────────────────┬──────┘
                  YA │                 │ TIDAK
                     ▼                 ▼
          ┌─────────────────┐  ┌───────────────────────┐
          │ Perbaiki kode:  │  │ Hover variabel dan    │
          │ lengkapi field, │  │ pemanggilan fungsi →  │
          │ betulkan nama,  │  │ melihat tipe yang     │
          │ beri anotasi    │  │ sebenarnya / diminta  │
          └────────┬────────┘  └───────────┬───────────┘
                   │                       ▼
                   │           ┌────────────────────────┐
                   │           │ Yang salah: DATA yang  │
                   │           │ Anda kirim, atau TIPE  │
                   │           │ tujuannya?             │
                   │           └─────┬─────────────┬────┘
                   │              DATA          TUJUAN
                   │                 ▼             ▼
                   │    ┌─────────────────┐  ┌──────────────────────┐
                   │    │ Narrowing/valid │  │ Perbaiki bentuk tipe │
                   │    │ (guard, Zod)    │  │ tujuan (beri field,  │
                   │    │                 │  │ buat opsional, dll.) │
                   │    └────────┬────────┘  └──────────┬───────────┘
                   └────────────┬┴──────────────────────┘
                                ▼
                ┌─────────────────────────────────────────┐
                │ npx tsc --noEmit                        │
                │ masih error? → ulangi dari awal diagram │
                │ bersih?      → ✅ commit                │
                └─────────────────────────────────────────┘
```

**Penjelasan alur:**

- **Mulai dari baris terakhir** — pemula sering berhenti di baris pertama pesan lalu bingung. Padahal baris terakhir yang berisi akar masalahnya.
- **Hover dulu sebelum mengubah-ubah** — sering kali yang salah bukan data, melainkan asumsi Anda tentang bentuk datanya.
- **Bedakan "perbaiki kode" dan "ubah tipe"** — pilih salah satu. Kalau menyentuh dua-duanya sekaligus tanpa pikir, kode bisa jadi terkompilasi tapi tidak benar.

## ✅ Checklist Bab 19

```
□ Dapat membedah 7 error umum dari tabel 19.1 tanpa bantuan
□ Terbiasa membaca pesan error panjang dari baris TERAKHIR
□ Tahu bedanya "perbaiki kode" dan "ubah tipe tujuan"
□ Tahu syarat sahnya as / ! / @ts-expect-error (punya bukti)
□ Punya refleks memilih unknown (bukan any) untuk data eksternal
□ Terbiasa hover untuk melihat tipe sebelum mengubah kode
□ Tahu beda typeof TypeScript (compile) vs typeof JavaScript (runtime)
□ Alur debug 19.7 sudah dipraktikkan di project nyata
```

---

⏭️ Lanjut ke [🚀 Bab 20 — Migrasi JS → TS & Best Practices](/bagian-7/bab-20) untuk melanjutkan!
