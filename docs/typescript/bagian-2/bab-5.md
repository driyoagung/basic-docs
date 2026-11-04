---
title: "Bab 5 — Object, `type` & `interface`"
---

# 📖 Bab 5 — Object, `type` & `interface`

Kalau Bab 3 membahas tipe primitif, bab ini membahas bentuk data yang paling sering Anda temui di aplikasi nyata: **object**. Props komponen React adalah object. Response API adalah object. State global adalah object. Model database adalah object. Di React + TypeScript, hampir semua error tipe yang Anda temui berakar dari satu hal: bentuk object yang tidak cocok. Karena itu bab ini adalah salah satu dari empat bab paling kritis di ebook ini — kuasai betul, sisanya akan terasa jauh lebih mudah.

---

## 5.1 🧱 Mendefinisikan Bentuk Object

TypeScript tidak peduli pada nilai object, ia peduli pada **bentuknya** (shape). Ada dua cara utama menuliskan bentuk object: `type` alias dan `interface`.

```ts
type Produk = {
  id: number
  nama: string
  harga: number
  deskripsi?: string        // opsional — boleh tidak ada
  readonly dibuatPada: Date // tidak boleh diubah setelah dibuat
}

interface User {
  id: number
  nama: string
  email: string
}

const p: Produk = { id: 1, nama: 'Laptop', harga: 15000000, dibuatPada: new Date() }
```

Hal penting yang perlu Anda sadari:

- **Bentuk harus lengkap.** `Produk` mewajibkan `id`, `nama`, `harga`, dan `dibuatPada`. Kalau salah satu hilang, compiler langsung menolak.
- **Field berlebih juga ditolak.** Object literal yang berisi `stok: 10` padahal `Produk` tidak punya `stok` akan memicu *excess property check* — ini fitur, bukan bug: typo seperti `harag` langsung tertangkap.
- **`?` dan `readonly` adalah bagian dari kontrak**, bukan sekadar dokumentasi. Keduanya ditegakkan compiler.

```ts
const salah: Produk = {
  id: 1,
  nama: 'Laptop',
  harga: 15000000,
  // ❌ Property 'dibuatPada' is missing
}
```

> 💡 **Cara membaca tipe object:**
> Bacalah seperti kontrak. "Untuk disebut `Produk`, sebuah object WAJIB punya
> `id: number`, `nama: string`, `harga: number`, dan `dibuatPada: Date`;
> BOLEH punya `deskripsi: string`." Semua error tipe adalah pelanggaran kontrak.

---

## 5.2 ⚖️ `type` vs `interface`

Dua-duanya bisa mendeskripsikan object. Perbedaannya baru terasa di kasus tertentu:

| Aspek | `type` | `interface` |
|---|---|---|
| Object | ✅ | ✅ |
| Union / tuple / primitif | ✅ | ❌ |
| Extend | `&` (intersection) | `extends` |
| Declaration merging | ❌ | ✅ |
| Implementasi class | ✅ (via `implements`) | ✅ |
| Rekomendasi praktis | Serbaguna | Bagus untuk object/class publik |

```ts
// type bisa menyimpan union — interface tidak bisa
type Status = 'aktif' | 'nonaktif'

// interface bisa digabung (declaration merging)
interface User { id: number }
interface User { nama: string }
// Hasilnya: User punya id DAN nama
```

**Penjelasan perbedaan:**

- **Union** — `type` bisa menjadi union literal, tuple, atau tipe primitif; `interface` hanya bisa bentuk object.
- **Declaration merging** — dua deklarasi `interface` dengan nama sama otomatis digabung. Ini dipakai library untuk "menambahkan" field (mis. augmentasi tipe `Session` di Bab 18). `type` tidak bisa.
- **Extend** — `interface` memakai `extends`, `type` memakai intersection `&`. Hasil akhirnya mirip untuk kebutuhan sehari-hari.

> 💡 **Aturan praktis:** pilih satu dan konsisten dalam satu project.
> Untuk pemula, `type` cukup untuk hampir semua kebutuhan. Gunakan
> `interface` jika Anda menulis library publik atau butuh declaration merging.

---

## 5.3 🪆 Nested Object & Array of Object

Data nyata jarang rata. Object hampir selalu bersarang (nested) dan sering berisi array object.

```ts
type Alamat = {
  jalan: string
  kota: string
  kodePos?: string
}

type Pelanggan = {
  id: number
  nama: string
  alamat: Alamat            // object di dalam object
  telepon: string[]         // array string
  pesanan: Pesanan[]        // array object
}

type Pesanan = {
  id: number
  total: number
  status: 'baru' | 'dikirim' | 'selesai'
}
```

Akses ke dalamnya tetap type-safe di semua level:

```ts
const pelanggan: Pelanggan = ambilPelanggan()

pelanggan.alamat.kota          // string ✅
pelanggan.pesanan[0].total     // number ✅
pelanggan.pesanan[0].totalx    // ❌ Property 'totalx' does not exist
```

Diagram bentuknya:

```
Pelanggan
├── id: number
├── nama: string
├── alamat: Alamat
│   ├── jalan: string
│   ├── kota: string
│   └── kodePos?: string
├── telepon: string[]
└── pesanan: Pesanan[]
    ├── id: number
    ├── total: number
    └── status: 'baru' | 'dikirim' | 'selesai'
```

**Kesalahan umum pemula:** menulis tipe nested terlalu dalam dalam satu blok besar. Pecah menjadi tipe-tipe kecil yang bisa dipakai ulang (`Alamat`, `Pesanan`) — jauh lebih mudah dibaca dan diubah.

---

## 5.4 ❓ Optional (`?`) vs `| undefined`

Ada dua cara menyatakan "field ini mungkin tidak ada", dan bedanya halus tapi penting:

```ts
type A = { nama?: string }              // field boleh TIDAK ADA sama sekali
type B = { nama: string | undefined }   // field WAJIB ada, nilainya boleh undefined

const a: A = {}                          // ✅ valid
const b: B = {}                          // ❌ Property 'nama' is missing
const b2: B = { nama: undefined }        // ✅ valid
```

| Bentuk | Boleh field tidak ada? | Boleh bernilai `undefined`? |
|---|---|---|
| `nama?: string` | ✅ | ✅ |
| `nama: string \| undefined` | ❌ (field wajib) | ✅ |

Kapan pakai yang mana?

- **`?` (opsional)** — untuk field yang memang boleh tidak dikirim, mis. `deskripsi?` pada produk, `kodePos?` pada alamat.
- **`| undefined` eksplisit** — untuk field yang secara konsep selalu ada tetapi nilainya bisa kosong, mis. `deletedAt: Date | undefined` pada model soft-delete.

> ⚠️ **Jangan tertukar dengan `?` di parameter fungsi.** Di parameter,
> `pemisah?: string` berarti argumen boleh tidak diberikan. Di object,
> `field?: string` berarti properti boleh tidak ada. Konsepnya mirip,
> penerapannya berbeda.

Saat membaca field opsional, strict mode memaksa Anda menanganinya:

```ts
function tampilkanDeskripsi(p: Produk) {
  // p.deskripsi bertipe string | undefined
  return p.deskripsi ?? 'Tidak ada deskripsi'
}
```

---

## 5.5 🔒 `readonly` dan Immutability

`readonly` menandai field yang tidak boleh diubah setelah object dibuat. Ini bukan sekadar "gaya" — compiler menegakkannya.

```ts
type Konfigurasi = {
  readonly apiUrl: string
  readonly versi: number
}

const cfg: Konfigurasi = { apiUrl: '/api', versi: 1 }
// cfg.apiUrl = '/v2'   // ❌ Cannot assign to 'apiUrl' because it is a read-only property
```

Untuk "membekukan" seluruh object sekaligus, ada dua cara:

```ts
// 1. Utility type Readonly<T> — semua field jadi readonly
type ProdukBeku = Readonly<Produk>

// 2. as const — pada object literal, semua field jadi readonly + literal
const ROUTES = {
  home: '/',
  produk: '/produk',
} as const
// ROUTES.home = '/beranda'   // ❌ readonly
```

**Kenapa immutability penting di React?**

- **Re-render bekerja karena perbandingan referensi.** Kalau Anda memutasi object state secara langsung, React bisa melewatkan update karena referensinya tidak berubah.
- **Data yang dibagi antar komponen lebih aman** jika tidak bisa diubah diam-diam dari komponen lain.
- **`readonly` mendokumentasikan niat** — pembaca kode langsung tahu data ini tidak untuk dimodifikasi.

> 💡 **Pola umum di React:** state selalu diperlakukan immutable.
> `setProduk([...produk, baru])`, bukan `produk.push(baru)`.
> `readonly` di tipe memperkuat kebiasaan ini.

---

## 5.6 🗂️ Index Signature & `Record<string, T>`

Terkadang Anda butuh object dengan **kunci yang tidak diketahui sebelumnya** — kamus terjemahan, lookup berdasarkan ID, cache, dan sejenisnya.

```ts
// Index signature — kunci string apa pun, nilai number
type Skor = {
  [nama: string]: number
}

const skor: Skor = { budi: 90, sari: 95 }
skor['andi'] = 80          // ✅
skor['andi'] = 'salah'     // ❌ Type 'string' is not assignable to type 'number'
```

Versi yang lebih ringkas dan sering dipakai adalah `Record<K, V>`:

```ts
type Skor2 = Record<string, number>          // setara dengan index signature di atas
type StatusLabel = Record<'baru' | 'diproses' | 'selesai', string>

const label: StatusLabel = {
  baru: 'Baru',
  diproses: 'Sedang diproses',
  selesai: 'Selesai',
}
// label.hilang   // ❌ kunci di luar union langsung error
```

| Kebutuhan | Tipe yang tepat |
|---|---|
| Kunci bebas (dari data eksternal) | `Record<string, T>` |
| Kunci terbatas yang sudah diketahui | `Record<'a' \| 'b', T>` |
| Field campuran (sebagian tetap, sebagian dinamis) | index signature + field eksplisit |

**Catatan penting dengan `noUncheckedIndexedAccess: true`:**

```ts
const skor3: Record<string, number> = {}
const nilai = skor3['tidak-ada']   // bertipe number | undefined ✅ (aman)
// console.log(nilai.toFixed())    // ❌ harus dicek dulu — ini yang kita mau
```

Tanpa flag tersebut, `skor3['tidak-ada']` akan bertipe `number` dan Anda bisa crash di runtime. Inilah alasan `noUncheckedIndexedAccess` disarankan sejak Bab 2.

---

## 5.7 🧬 Extend & Intersection

Membangun tipe baru dari tipe yang sudah ada adalah cara menjaga DRY (don't repeat yourself). Jangan menyalin ulang semua field.

```ts
// Dengan intersection (type)
type User = { id: number; nama: string }
type Admin = User & { role: 'admin' | 'superadmin'; izin: string[] }

// Dengan extends (interface)
interface UserI { id: number; nama: string }
interface AdminI extends UserI { role: 'admin' | 'superadmin' }
```

Keduanya menghasilkan bentuk yang sama:

```
User              Admin
├── id: number    ├── id: number      ← dari User
└── nama: string  ├── nama: string    ← dari User
                  ├── role: ...       ← tambahan
                  └── izin: string[]  ← tambahan
```

**Kapan intersection berbahaya?** Saat dua tipe punya field sama dengan tipe berbeda:

```ts
type A = { nilai: string }
type B = { nilai: number }
type C = A & B
// C.nilai bertipe string & number → mustahil (never)
```

Intersection menggabungkan **semua** syarat, jadi konflik menghasilkan tipe yang tidak bisa dipenuhi. Kalau Anda butuh "salah satu", itu union — bukan intersection.

> 💡 **Pola komposisi di React:**
> `type ButtonProps = BaseProps & { variant: 'primary' | 'ghost' }`.
> Pecah props dasar, lalu komposisikan per varian. Lebih rapi daripada
> satu tipe raksasa dengan banyak field opsional.

---

## 5.8 🎬 Studi Kasus: Mengetik Response API

Sekarang gabungkan semuanya pada kasus paling nyata: response API blog dengan `Post`, `Comment`, dan `Author`.

```ts
type Author = {
  id: number
  nama: string
  avatarUrl?: string
}

type Comment = {
  id: number
  isi: string
  dibuatPada: string      // ISO date string dari JSON
  penulis: Author
}

type Post = {
  id: number
  slug: string
  judul: string
  ringkasan?: string
  isi: string
  dibuatPada: string
  penulis: Author
  komentar: Comment[]
  jumlahSuka: number
}
```

Lalu bentuk response pembungkusnya — pola yang hampir selalu ada di API nyata:

```ts
type ApiResponse<T> = {
  data: T
  pesan: string
  sukses: boolean
}

type DaftarPost = ApiResponse<{
  items: Post[]
  total: number
  halaman: number
}>
```

Perhatikan keuntungannya:

- **Satu tipe `Post` dipakai ulang** di daftar, detail, dan relasi komentar — tidak ada duplikasi.
- **`ApiResponse<T>` generik** (detail di Bab 7) membuat bentuk pembungkus konsisten untuk semua endpoint.
- **Field opsional ditandai jujur** — `ringkasan?` dan `avatarUrl?` memang tidak selalu dikirim server.
- **`dibuatPada` bertipe `string`, bukan `Date`** — karena JSON tidak mengenal `Date`. Konversi ke `Date` dilakukan setelah parsing.

Saat dipakai di komponen:

```tsx
function PostCard({ post }: { post: Post }) {
  return (
    <article>
      <h2>{post.judul}</h2>
      {post.ringkasan && <p>{post.ringkasan}</p>}
      <span>oleh {post.penulis.nama}</span>
      <span>{post.komentar.length} komentar</span>
    </article>
  )
}
```

> ⚠️ **Yang harus diingat dari studi kasus ini:**
> Tipe di atas mendeskripsikan **bentuk yang Anda harapkan**, bukan
> **jaminan** bahwa server benar-benar mengirimnya. `res.json() as Post`
> hanyalah klaim. Validasi runtime dengan Zod (Bab 12) adalah cara
> memastikan bentuk data dari luar benar-benar sesuai.

---

## ✅ Checklist Bab 5

- **Bentuk object adalah kontrak** — semua field wajib harus ada; field berlebih pada object literal ditolak.
- **`type` vs `interface`** — `type` serbaguna (union/tuple/primitif), `interface` untuk object publik + declaration merging. Pilih satu, konsisten.
- **Nested & array object** — pecah tipe besar menjadi tipe kecil yang bisa dipakai ulang.
- **`?` vs `| undefined`** — `?` berarti field boleh tidak ada; `| undefined` berarti field wajib tetapi nilainya boleh kosong.
- **`readonly`** — menegakkan immutability; penting untuk state React dan data yang dibagi antar komponen.
- **Index signature / `Record<K, V>`** — untuk kunci dinamis; gunakan `Record` dengan kunci union jika kunci terbatas.
- **`noUncheckedIndexedAccess`** — membuat akses index bertipe `T | undefined`, mencegah out-of-bounds bug.
- **Extend & intersection** — komposisi tipe tanpa duplikasi; hati-hati konflik field (menghasilkan `never`).
- **Response API** — bungkus dengan `ApiResponse<T>`, tandai field opsional dengan jujur, ingat JSON tidak punya `Date`.
- **Tipe ≠ validasi** — tipe mendeskripsikan harapan; data eksternal tetap perlu dicek saat runtime (Bab 12).

---

⏭️ Lanjut ke [🔀 Bab 6 — Union, Intersection & Narrowing](/bagian-2/bab-6) untuk melanjutkan!
