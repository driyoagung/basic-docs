---
title: "Bab 1 — Mengenal TypeScript"
---

# 📖 Bab 1 — Mengenal TypeScript

Sebelum menulis satu baris kode pun, ada baiknya Anda memahami **mengapa** TypeScript ada dan masalah nyata apa yang ia selesaikan. Bab ini bukan bab teori untuk hafalan — bab ini adalah bab yang mengubah cara Anda melihat kode JavaScript. Di Indonesia sendiri, hampir semua lowongan kerja React Developer kini mencantumkan TypeScript sebagai requirement, dan mayoritas project Next.js yang berjalan di production sudah 100% TypeScript. Maka tidak jauh berlebihan jika saya bilang: memahami bab ini dengan benar akan menentukan seberapa cepat Anda beradaptasi di dunia kerja nantinya. Mari kita mulai dari akar masalahnya.

---

## 1.1 🤔 Apa itu TypeScript & Masalah yang Dipecahkan

TypeScript adalah **bahasa pemrograman** yang dibangun oleh Microsoft di atas JavaScript. Diumumkan pada tahun 2012 dan kini menjadi standar de facto dalam development aplikasi web modern. Inti keberadaannya sangat sederhana:

> JavaScript tidak tahu "bentuk" data yang Anda simpan sampai kode tersebut **berjalan**. TypeScript memindahkan pengetahuan itu jauh lebih awal: ke **saat Anda mengetik kode**.

Lihat masalah yang sangat sering terjadi di project nyata:

```js
// JavaScript murni
function hitungTotal(item) {
  return item.harga * item.jumlah
}

hitungTotal({ harga: 1000, jumlh: 2 })  // typo "jumlh"!
// ✅ Tidak ada error saat menulis kode
// 💥 Hasilnya NaN — baru ketahuan saat dijalankan
```

Versi TypeScript dari fungsi yang sama:

```ts
// TypeScript
function hitungTotal(item: { harga: number; jumlah: number }) {
  return item.harga * item.jumlah
}

hitungTotal({ harga: 1000, jumlh: 2 })
// ❌ ERROR langsung di editor:
// "Object literal may only specify known properties,
//  and 'jumlh' does not exist..."
```

> 💡 **Analogi:**
> JavaScript seperti menulis dokumen tanpa pemeriksa ejaan — salah ketik baru
> ketahuan setelah dokumen dicetak dan dibacakan pembaca. TypeScript seperti
> pemeriksa ejaan yang menggarisbawahi kesalahan **sambil Anda mengetik**.

Sekarang tentukan posisi bug di atas: apakah lebih baik kodanya **error saat ditulis** atau **NaN saat di-deploy ke production**? Hampir semua developer memilih yang pertama — dan itulah yang TypeScript tawarkan.

---

## 1.2 ⚙️ Cara Kerja: TS → Compile → JS

Tipe di TypeScript tidak berjalan di browser. Parser browser tidak mengerti sintaks `string` atau `number` yang Anda tulis di samping variabel — semua itu harus diterjemahkan terlebih dahulu. Maka TypeScript bekerja dalam dua tahap. Mari lihat diagram alurnya:

```
        Kode yang Anda tulis (.ts / .tsx)
                     │
                     ▼
        ┌─────────────────────────────┐
        │   TypeScript Compiler (tsc) │
        │                             │
        │  STEP 1: Type Checking      │
        │  → bentuk data cocok?       │
        │  → error di sini ✋         │
        └─────────────┬───────────────┘
                      │ (jika tidak ada error)
                      ▼
        ┌─────────────────────────────┐
        │  STEP 2: Strip Type         │
        │  Semua anotasi tipe         │
        │  DIHAPUS SATU PER SATU      │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   JavaScript murni (.js)    │
        │   Dijalankan browser/Node   │
        └─────────────────────────────┘
```

Contoh kode sebelum dan sesudah kompilasi:

```ts
// index.ts — yang Anda tulis
function sapa(nama: string): string {
  return `Halo, ${nama}`
}
```

```js
// index.js — hasil kompilasi, tanpa satu pun tipe
function sapa(nama) {
  return `Halo, ${nama}`
}
```

> ⚠️ **Hal yang Sering Disalahpahami:**
> TypeScript **tidak mengubah** cara kode berjalan. Semua tipe **dihapus**
> saat kompilasi. Tipe hanya membantu Anda saat *menulis* kode, bukan
> melindungi aplikasi dari data buruk saat *berjalan* (misalnya respons API
> yang bentuknya aneh). Untuk perlindungan runtime, Anda tetap butuh
> validasi seperti Zod — dibahas di Bab 12.

---

## 1.3 🧩 TypeScript adalah Superset JavaScript

Istilah **superset** berarti TypeScript adalah JavaScript **plus ekstra**. Artinya: semua kode JavaScript yang valid pasti adalah TS yang valid — Anda bahkan bisa menyalin file `.js` menjadi `.ts` dan TS akan menerimanya (walau dengan sedikit warning tergantung config).

| Yang Anda tulis di TS | Status | Catatan |
|---|---|---|
| `const x = 5` | ✅ JavaScript biasa | TS hanya menebak tipenya |
| `let x: number = 5` | ✅ Ekstra TypeScript | Anotasi tipe — tidak ada di JS |
| `interface User { ... }` | ✅ Ekstra TypeScript | Hilang saat kompilasi |
| `type ID = string \| number` | ✅ Ekstra TypeScript | Union type — tulis di satu tempat |
| `x as string[]` | ✅ Ekstra TypeScript | Type assertion |

**Penjelasan tabel:**

- **JavaScript biasa** — karena TS superset, semua sintaks JS lama Anda tetap berlaku apa adanya.
- **Anotasi tipe** — ini "bumbu" utama yang TS tambahkan di atas JS.
- **`interface`, `type`, assertion** — fitur-fitur tipe yang hilang saat kompilasi; tidak akan pernah sampai ke browser.

Implikasi praktisnya: belajar TypeScript **tidak berarti membuang JavaScript**. Semua yang sudah Anda kuasai tetap dipakai — Anda hanya menambah kosakata baru berupa "deskripsi tipe" di atasnya.

---

## 1.4 🌍 Mengapa React & Next.js Menjadikan TS Standar

Ini bagian yang paling relevan dengan jalur belajar Anda. React 18 dan Next.js App Router **sangat dirancang untuk TypeScript**. Berikut tempat-tempat di mana TS benar-benar menolong saat Anda coding React:

| Situasi di React/Next.js | Yang TS Bantu |
|---|---|
| Menulis props komponen | Autocomplete nama property & warning jika salah kirim |
| Mengelola state dengan `useState` | TS memberi tahu bentuk state, tidak bisa diubah sembarangan |
| Menangkap event (`onClick`, `onChange`) | Tipe event otomatis muncul saat hover |
| Mem-fetch data dari API | Bentuk response bisa dideskripsikan sebagai tipe |
| `useEffect`, `useContext`, `ref` | Semuanya punya tipe yang jelas |
| Props halaman Next.js (`params`, `searchParams`) | Bentuk props halaman sudah siap pakai |

**Penjelasan tabel:**

- **Props** — di project React, 80% bug pemula terjadi karena props yang salah nama atau salah tipe. TS mematikan 80% bug itu.
- **State** — tanpa TS, Anda bisa set state dengan bentuk data yang berbeda-beda dan UI-nya aneh; TS mencegahnya.
- **API response** — tanpa TS, isi `res.json()` berakhir jadi `any` dan autocomplete Anda blank; dengan TS Anda bisa menulis kontrak bentuknya.

Juga penting dicatat: **kecepatan development** di project TS jauh lebih tinggi karena autocomplete editor bekerja sempurna. Anda tidak perlu membuka file lain hanya untuk mengingat apa nama property-nya.

---

## 1.5 ✅ Kapan TS Membantu, Kapan Terasa Berlebihan

TypeScript bukan obat mujarab untuk semua kondisi. Ada situasi di mana TS paling bermanfaat, dan situasi di mana "paksaan" menulis tipe justru terasa berlebihan. Perhatikan tabel berikut:

| Situasi | Posisi TS | Keterangan |
|---|---|---|
| Project React/Next skala menengah ke atas | ⭐ Sangat membantu | Bentuk data kompleks, banyak file, banyak orang |
| Tim > 3 orang | ⭐ Sangat membantu | TS jadi "kontrak tertulis" antar-dev |
| Library / package yang akan dipakai orang lain | ⭐ Sangat membantu | Tipe = dokumentasi otomatis |
| Script sekali pakai di terminal | ⚠️ Berlebihan | Tulis aja pakai JS biasa, tidak perlu tipe |
| Prototipe 1 jam demo | ⚠️ Berlebihan (opsional) | TS boleh diaktifkan, tapi tidak wajib |
| File konfigurasi kecil (`vite.config.ts`) | 🟢 Netral | TS memberi autocomplete config, biaya rendah |

**Penjelasan tabel:**

- **Project besar & tim** — di sinilah TS pada puncak terbaiknya: bug ketahuan saat compile, bukan saat user klik tombol "Beli".
- **Script kecil sekali pakai** — menulis `let x: string = "a"` untuk skrip 10 baris memang terasa berlebihan. Itu normal.
- **Vite config** — meskipun file kecil, TS memberi autocomplete untuk semua opsi Vite. Jadi tetap bermanfaat.

> 💡 **Rules of Thumb:**
> Jika kode akan **hidup lebih dari seminggu** atau **dibaca orang lain**,
> menggunakan TypeScript sudah hampir pasti menguntungkan.
> Jika kode hanya **berumur sepuluh menit** di terminal, pakai JS murni saja.

---

## 1.6 🧠 Pola Pikir Baru: "Bentuk Data" (Shape) Lebih Penting dari Nilainya

Ini adalah pergeseran mindset terpenting dari bab ini. Ketika menulis JavaScript, Anda terbiasa berpikir tentang **nilai**: "hitungTotal menerima sebuah object". Ketika menulis TypeScript, Anda akan mulai berpikir tentang **bentuk**: "object itu harus punya property `harga` bertipe `number` dan `jumlah` bertipe `number` — property lain tidak diizinkan".

Contoh perubahan cara berpikir:

```ts
// Pola pikir JS: "yang penting sudah object"
const data = {
  nama: 'Budi',
  umur: 25,
  email: 'budi@example.com',
}

// Pola pikir TS: "yang penting bentuknya"
type User = {
  nama: string
  umur: number
  email: string
}

const data: User = {
  nama: 'Budi',
  umur: 25,
  email: 'budi@example.com',
}
```

Kenapa pergeseran ini penting untuk belajar React nanti? Karena **komponen React adalah fungsi yang menerima object props dengan bentuk tertentu**. Kalau Anda terbiasa mendeskripsikan "bentuk data" — bukan hanya "isi data" — maka typing komponen, hooks, dan response API nanti akan terasa natural.

Contoh kontras praktis:

```tsx
// Pola pikir lama: "komponen menerima data produk"
// Pola pikir baru: "komponen menerima object dengan bentuk di bawah ini"
type ProductCardProps = {
  produk: {
    id: number
    nama: string
    harga: number
  }
}
```

> 💡 **Key Insight:**
> Sejak titik ini, setiap kali Anda melihat data — apakah dari API, dari form,
> atau dari props — bertanyalah: "**bentuk apa yang data ini punya?**".
> Jawaban atas pertanyaan itulah yang akan Anda tulis sebagai `type` atau
> `interface` di bab-bab selanjutnya.

---

## ✅ Checklist Bab 1

- **TypeScript** — Bahasa di atas JavaScript yang menambahkan sistem tipe saat compile time.
- **Masalah yang dipecahkan** — Bug "typo nama property" yang dulu ketahuan saat runtime, kini ketahuan saat compile.
- **Cara kerja** — `tsc` melakukan type check dahulu, lalu menghapus semua tipe, lalu menghasilkan JavaScript murni.
- **Superset** — Semua JavaScript valid adalah TypeScript valid; TS hanya menambahkan fitur tipe di atasnya.
- **Tipe tidak memproteksi runtime** — Response API tetap bisa tak sesuai bentuknya saat berjalan; ada validasi runtime (Zod) yang meng-cover-nya di Bab 12.
- **Standar industri** — React 18, Next.js, dan mayoritas lowongan kerja di Indonesia mengharapkan Anda bisa TS.
- **Pergeseran mindset** — Pikirkan "bentuk data" (shape), bukan hanya nilai; inilah fondasi untuk typing props & API nanti.
- **Kapan pakai TS** — Project yang akan hidup lama / dibaca orang lain; JS biasa untuk script sekali pakai.

---

⏭️ Lanjut ke [🛠️ Bab 2 — Setup & Konfigurasi](/bagian-1/bab-2) untuk melanjutkan!
