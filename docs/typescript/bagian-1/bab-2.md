---
title: "Bab 2 — Setup & Konfigurasi"
---

# 📖 Bab 2 — Setup & Konfigurasi

Teori di Bab 1 tidak akan berarti jika Anda tidak pernah menyiapkan lingkungan latihan sendiri. Di bab ini Anda akan bangun project TypeScript pertama dari nol — mulai dari `npm init`, memahami isi `tsconfig.json` yang sering dianggap "file misterius", sampai setup project Vite dan Next.js yang pakai TS-nya siap production. Hal kecil yang sering diabaikan pemula: **mengaktifkan `strict: true` sejak hari pertama**. Seperti belajar menyetir dengan sabuk pengaman sejak awal — jauh lebih sulit mengubah kebiasaan buruk belakangan. Mari kita mulai.

---

## 2.1 🚀 Project Pertama

Siapkan terminal Anda dan ikuti langkah-langkah ini. Saya sarankan Anda membuat project latihan baru terpisah yang khusus untuk ebook ini (jangan campur dengan project lain):

```bash
mkdir belajar-ts && cd belajar-ts
npm init -y
npm install -D typescript tsx @types/node
npx tsc --init
```

**Penjelasan command per baris:**

- `mkdir belajar-ts && cd belajar-ts` — buat folder baru dan masuk ke dalamnya.
- `npm init -y` — inisialisasi `package.json` dengan jawaban default, tanpa pertanyaan interaktif.
- `npm install -D typescript tsx @types/node` — install **3 dev dependency**:
  - **`typescript`** — compiler & type checker (`tsc`).
  - **`tsx`** — runner untuk mengeksekusi file `.ts` langsung, tanpa compile manual (pengganti `ts-node` yang lebih cepat).
  - **`@types/node`** — tipe untuk API Node.js (`fs`, `path`, `process`, dsb.).
- `npx tsc --init` — generate `tsconfig.json` default di folder project.

> 💡 **Kenapa `tsx` dan bukan `tsc` untuk menjalankan kode?**
> `tsc` hanya **meng-compile** file, tidak menjalankannya. `tsx` menjalankan
> file TS langsung di atas Node.js dengan transpile super cepat — persis
> yang Anda butuhkan saat latihan dan eksperimen.

---

## 2.2 ⚡ Menjalankan & Mengecek Kode

Ada dua command yang akan Anda pakai berulang-ulang selama ebook ini. Buat file `src/index.ts` dulu:

```ts
// src/index.ts
const sapa = (nama: string): string => `Halo, ${nama}`

console.log(sapa('Kamu'))
```

Lalu jalankan:

```bash
# Menjalankan file TS langsung
npx tsx src/index.ts
# → Halo, Kamu

# Mengecek tipe saja tanpa menghasilkan file
npx tsc --noEmit
# → (diam = tidak ada error; Error akan ter-print jika ada)
```

| Command | Fungsi | Kapan Dipakai |
|---|---|---|
| `npx tsx src/index.ts` | Eksekusi file TS langsung | Latihan & eksperimen cepat |
| `npx tsc --noEmit` | Type check saja, tidak output `.js` | Menjaga kualitas, juga di CI |
| `npx tsc --watch` | Type check berjalan terus, merespons perubahan file | Siklus mengetik-and-cek yang panjang |
| `npx tsc file.ts` | Compile file tunggal jadi JS | Eksperimen kecil, di luar project |

**Penjelasan tabel:**

- **`tsx`** — mode paling cepat untuk melihat hasil. Perhatikan: `tsx` **tidak me-type check** — dia hanya transpile. Artinya kode tetap jalan meskipun ada error tipe; yang menangkap error tipe adalah editor dan `tsc --noEmit`.
- **`tsc --noEmit`** — command yang paling sering Anda pakai saat sesi coding. Flag `--noEmit` berarti "cek tipe, tapi jangan buat file output". Ini standar di project Next.js dan pipeline CI.
- **`tsc --watch`** — best friend Anda di terminal kedua saat ngoding.

---

## 2.3 📋 Memahami `tsconfig.json`

Inilah "control panel" TypeScript. File ini menentukan **bagaimana TS mengecek dan meng-compile** project Anda. Berikut config yang akan kita pakai sebagai patokan sepanjang ebook:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

| Opsi | Fungsi |
|---|---|
| `strict` | ⭐ Mengaktifkan semua pengecekan ketat (wajib `true`) |
| `noUncheckedIndexedAccess` | `arr[0]` bertipe `T \| undefined` (lebih aman) |
| `target` | Versi JS hasil kompilasi |
| `module` | Format module hasil compile (`ESNext`, `CommonJS`, dll.) |
| `moduleResolution` | Cara TS mencari file module (untuk bundler seperti Vite, pakai `bundler`) |
| `jsx` | Cara JSX diproses (React/Next) |
| `paths` | Alias import `@/components/...` |
| `skipLibCheck` | Lewati cek `.d.ts` library (mempercepat) |
| `include` | Folder/file yang ikut di-check |

**Penjelasan opsi penting:**

- **`strict`** — konfigurasi paling krusial. `true` menghidupkan belasan aturan ketat sekaligus (termasuk `strictNullChecks`, `noImplicitAny`). Penjelasannya di sub-bab 2.7.
- **`target`** — "kompilasi kode TS ini jadi versi JS berapa". `ES2022` cukup modern untuk browser & Node 20+.
- **`jsx: preserve`** — bersama Vite/Next, file TSX yang berisi JSX tidak dikompilasi oleh TS; server & bundler yang mengerjakannya. Maka `preserve` adalah pilihan tepat.
- **`paths`** — alias supaya import tidak panjang seperti `../../../components/Nav`; cukup `@/components/Nav`.

> ⚠️ **Di Vite dan Next.js, JANGAN meng-edit banyak opsi compiler secara manual.**
> Kedua scaffold ini punya berbeda config default yang disetel tepat untuk mereka.
> Edit `tsconfig.json` hanya jika Anda tahu persis apa yang diubah. Untuk
> ebook ini, config di atas dipakai saat latihan TypeScript "murni"
> di project `belajar-ts`.

---

## 2.4 🎨 Project TS dengan Vite

Jika tujuan Anda menyempurnakan latihan React + TS, Vite adalah pilihan paling nyaman. Dev server cepat, hot-reload instan, dan template TypeScript-nya matang. Satu command saja:

```bash
npm create vite@latest -- --template react-ts
```

### Struktur folder yang Vite siapkan untuk Anda

```
belajar-react-ts/
├── src/
│   ├── App.tsx              ← komponen utama (React + TS)
│   ├── main.tsx             ← entry point
│   └── vite-env.d.ts        ← deklarasi tipe khusus Vite
├── index.html
├── tsconfig.json            ← sudah strict + jsx by default
└── vite.config.ts
```

**Penjelasan struktur:**

- **`App.tsx`** — komponen React ditulis dalam TypeScript (ekstensi `tsx`, bukan `js`).
- **`tsconfig.json`** — sudah menyala `strict: true`. Vite "merantai" beberapa tsconfig (referensi) khusus untuk kebutuhan CSS & build.
- **`vite.config.ts`** — config bundler di atas TypeScript, lengkap dengan tipe-nya.
- **`vite-env.d.ts`** — file deklarasi yang memungkinkan TS memahami import non-JS seperti CSS dan images. Detail ada di Bab 11.

Jalankan dengan:

```bash
npm install
npm run dev
```

---

## 2.5 ▲ Project TS dengan Next.js

Untuk Next.js, TypeScript sudah menjadi default siap. Semua project baru di App Router pakai TypeScript sejak create-next-app.

```bash
npx create-next-app@latest belajar-next-ts
# Saat muncul prompt, pilih:
# TypeScript ..... ✅ Yes
# ESLint ......... ✅ Yes
# App Router ..... ✅ Yes
# dst. sesuai kebutuhan
```

Next.js akan otomatis generate:

```
belajar-next-ts/
├── app/
│   ├── layout.tsx           ← layout root (children bertipe React.ReactNode)
│   └── page.tsx             ← halaman home
├── next-env.d.ts            ← deklarasi tipe punya Next.js
└── tsconfig.json            ← strict + flags khusus Next.js
```

**Yang perlu disadari di project Next.js:**

- **`strict: true` sudah aktif default** — Anda tidak perlu config manual.
- **Komponen page bisa `async`** — di App Router, komponen halaman boleh dideklarasikan `async` karena Next.js men-render-nya di server. Detail di Bab 16.
- **`next-env.d.ts`** — deklarasi tipe milik Next.js. Jangan dihapus dan jangan di-edit.
- **Type check di CI** — Next.js akan gagal build jika masih ada error tipe; ini bagus untuk menjaga project. Untuk mempercepat CI, banyak tim juga memakai `tsc --noEmit` di pipeline.

---

## 2.6 🔍 Membaca Error TypeScript

Kemampuan membaca error TS dengan benar adalah keterampilan yang menjadi pembeda developer senior. Beberapa tool yang akan menghaluskan hidup Anda:

| Tool / Ekstensi | Fungsi |
|---|---|
| TypeScript (VS Code bawaan) | Autocomplete, hover tipe, squiggly error real-time |
| Hover tipe di editor | Lihat tipe variabel apa pun dengan menaruh kursor di atasnya |
| Error Lens (VS Code) | Menampilkan pesan error inline di samping baris |
| TypeScript Compiler | Sumber kebenaran: daftar error + lokasi + penjelasan |

**Langkah membaca error TS:**

1. **Baca baris TERAKHIR dulu** — pesan TS bisa panjang 10+ baris, tapi inti masalahnya biasanya di kalimat terakhir.
2. **Naik ke atas pesan** — context di atas menjelaskan bentuk data apa yang diharapkan compiler.
3. **Hover pada kode yang di-garisbawahi** — editor menampilkan tipe yang Anda berikan vs. tipe yang diharapkan.

Aturan praktis: jangan terbiasa spam `as any` untuk mematikan error. Baca dulu pesannya untuk tahu bentuk data yang diinginkan compiler. `as any` memang mematikan semua error di baris itu, tapi ia juga menyembunyikan masalah yang akhirnya meledak saat runtime.

> ⚠️ **Catatan penting:** `tsx` TIDAK melakukan type check.
> Artinya, command `npx tsx src/index.ts` tetap jalan meskipun ada
> error tipe. Untuk project serius, pastikan `npx tsc --noEmit` selalu
> dijalankan, setidaknya di CI.

---

## 2.7 🔒 Mengapa `strict: true` Sejak Awal Itu Penting

Bayangkan belajar menyetir tanpa pernah ditegur sama sekali — sampai hari pertama bekerja di jalan tol. Itulah yang terjadi jika Anda memulai dengan `strict: false`: error yang sudah bisa diketahui compiler sejak awal justru tersembunyi, dan kebiasaan yang salah ikut terbawa sampai project ini go public. Lihat bedanya:

```ts
// strict: false — banyak pengecekan mati
let nama                       // ✅ lolos — tapi tipenya any (terselubung!)
function tampil(x) {           // ✅ lolos — x implicit any
  return `Halo, ${x.toUpperCase()}`  // 💥 crash runtime jika x bukan string
}

// strict: true — compiler mencegat semuanya
let nama                       // ❌ ERROR: Variable 'nama' implicitly has an 'any' type
function tampil(x) {           // ❌ ERROR: Parameter 'x' implicitly has an 'any' type
```

Contoh lain, kasus yang paling sering membunuh aplikasi:

```ts
// strict: false — strictNullChecks mati
const user = null
console.log(user.email)        // ✅ lolos compile → 💥 TypeError di runtime

// strict: true — strictNullChecks hidup
const user = null
console.log(user.email)        // ❌ ERROR saat compile: user is null
```

Rasakan bedanya: **bug yang dulu muncul di production, kini muncul di editor**. Ini adalah error yang paling sering muncul ketika `strict` aktif — Anda akan mengenal semuanya sepanjang ebook ini:

| Error umum | Apa artinya |
|---|---|
| `Object is possibly 'undefined'` | Nilai bisa tak ada — tangani dulu |
| `Type 'X' is not assignable to type 'Y'` | Bentuk data tak cocok |
| `Parameter 'x' implicitly has an 'any' type` | Beri anotasi parameter |
| `Property does not exist on type` | Typo atau perlu narrowing |

> 💡 **Yang perlu di-ingat:**
> Jangan godaan mematikan `strict` di project latihan "supaya tidak ribet".
> Justru sekarang — saat masih belajar — error yang muncul adalah guru
> terbaik Anda. Nanti saat project sudah berjalan di production, akan
> sangat sedikit kejutan yang tersisa.

---

## ✅ Checklist Bab 2

- **Setup minimal** — `npm init`, install `typescript`, `tsx`, `@types/node`, jalankan `npx tsc --init`.
- **Dua command utama** — `tsx file.ts` untuk menjalankan, `tsc --noEmit` untuk type check (tanpa output file).
- **`tsx` tidak type-check** — dia hanya transpile; error tipe masih perlu `tsc --noEmit` untuk deteksi penuh.
- **`tsconfig.json`** — "control panel" TS; satu file menentukan behaviour kompilasi & pengecekan.
- **`strict: true`** — wajib dinyalakan sejak project baru dibuat; `strictNullChecks` menangkap error `null`/`undefined` paling berbahaya.
- **`noUncheckedIndexedAccess`** — membuat `arr[0]` bertipe `T | undefined` (index di luar jangkauan tidak lagi lolos diam-diam → mencegah out-of-bounds bug).
- **Vite** — `npm create vite@latest -- --template react-ts`; template siap pakai, dev server super cepat.
- **Next.js** — `create-next-app` sudah default TS; App Router punya tipe untuk layouts & page.
- **Membaca error** — mulai dari baris terakhir, lalu naik ke context; jangan spam `as any`.

---

⏭️ Lanjut ke [🔤 Bab 3 — Tipe Dasar](/bagian-1/bab-3) untuk melanjutkan!
