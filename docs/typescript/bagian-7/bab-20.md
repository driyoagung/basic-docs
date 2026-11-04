---
title: "Bab 20 — Migrasi JS → TS & Best Practices"
---

# 📖 Bab 20 — Migrasi JS → TS & Best Practices

Project yang sudah jalan dengan JavaScript tidak harus ditulis ulang dari nol. Migrasi ke TypeScript bisa dilakukan bertahap: file demi file, error demi error, tanpa memblokir fitur baru. Di bab ini kita susun jalur migrasi yang aman, lalu tutup dengan kebiasaan baik yang membuat kode TypeScript layak dipakai jangka panjang.

## 20.1 🗺️ Roadmap Migrasi Bertahap

Jangan berangkat dengan `strict: true` pada seribu file JavaScript sekaligus — itu resep tewas di hari pertama. Jalankan tiga fase ini:

```
  KONDISI AWAL        FASE 1                  FASE 2                   FASE 3
┌──────────────┐   ┌───────────────────┐   ┌─────────────────────┐   ┌─────────────────────────┐
│ project.js   │──▶│ allowJs: true     │──▶│ RENAME file .js →   │──▶│ strict: true            │
│ murni JS     │   │ checkJs: false    │   │ .ts SATU-SATU       │   │ + opsi ketat tambahan:  │
│ (tsc belum   │   │ tsc mulai         │   │ (mulai dari file    │   │  noUncheckedIndexed-    │
│  mengecek)   │   │  "melihat" kode   │   │  utilitas) lalu     │   │  Access, exactOptional- │
│              │   │  tanpa mengecek   │   │  perbaiki per file  │   │  PropertyTypes, dll.    │
└──────────────┘   └───────────────────┘   └─────────────────────┘   └─────────────────────────┘
```

**Penjelasan fase:**

- **Fase 1 (`allowJs: true`)** — TypeScript mulai mengenal file `.js` dan ikut dalam build, tetapi belum mengecek tipenya. Build project berjalan normal; tidak ada yang berubah di runtime.
- **Fase 2 (rename per file)** — file dipindah satu per satu ke `.ts`. Tiap rename hanya memunculkan error di file itu, yang langsung diperbaiki. Jika ada masalah, rollback-nya kecil: satu file, satu commit.
- **Fase 3 (naikkan ketat)** — setelah semua file berstatus `.ts`, aktifkan `strict: true`, lalu opsi ketat tambahan satu per satu. Error baru yang muncul adalah "sonar terakhir": bagian kode yang selama ini lolos dari pengecekan.

## 20.2 ⚙️ Langkah Konkret Tiap Fase

**Fase 1 — izinkan JS di build, lewat tsconfig:**

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noEmit": true
  },
  "include": ["src"]
}
```

**Fase 2 — rename berurutan dari "daun" ke "akar" project:**

```bash
mv src/utils/format.js src/utils/format.ts
npx tsc --noEmit
# perbaiki error yang muncul di file itu saja
git commit -m "migrate: format.ts"
```

Urutan yang direkomendasikan:

- 1️⃣ **File utilitas murni** — fungsi tanpa dependensi rumit; error-nya paling sedikit.
- 2️⃣ **Model data** — tipe dasar yang akan dipakai file lain sebagai fondasi.
- 3️⃣ **Komponen UI** — paling lama, karena props dan event butuh ketelitian ekstra.
- 4️⃣ **File entry / konfigurasi** — terakhir, karena menarik semua tulisan di atasnya.

::: warning ⚠️
Perbaiki error dengan **anotasi**, bukan dengan `any`. Menggunakan `any` untuk lewat fase migrasi sama saja memindahkan masalah ke depan pintu Fase 3 — dan di situ memunculkan semula semua error yang Anda kira sudah bersih.
:::

## 20.3 📝 JSDoc sebagai Jembatan (`// @ts-check`)

Ada file yang belum boleh direname (masih dipakai di banyak tempat), tetapi Anda ingin pengecekannya mulai aktif. Gunakan komentar `@ts-check` di baris pertama file `.js`:

```js
// @ts-check

/**
 * @param {number} harga
 * @returns {string}
 */
function formatRupiah(harga) {
  return `Rp${harga.toLocaleString('id-ID')}`
}

formatRupiah('sepuluh')
// ❌ sekarang tsc menandai: Argument of type 'string' is not
//    assignable to parameter of type 'number'
```

Cara kerja JSDoc sebagai jembatan:

- **`@ts-check` mengaktifkan pengecekan hanya di file itu** — file `.js` lain tetap tenang.
- **`@param` dan `@returns` menuliskan tipe lewat JSDoc** — bentuknya seperti anotasi TS, tetapi ditulis dalam komentar.
- Saat file akhirnya direname ke `.ts`, JSDoc tinggal dihapus: tipenya sudah tertanam pada kode.

::: tip 💡
JSDoc `@ts-check` adalah cara **membayar bertahap** dalam migrasi: pengecekan aktif lebih dulu, "pembayaran" (rename ke `.ts`) menyusul kapan pun sibuk kerja memungkinkan.
:::

## 20.4 🧹 ESLint + typescript-eslint: Aturan yang Layak Diaktifkan

`tsc` mengecek kebenaran tipe; masih banyak "bau kode" yang sah secara tipe tetapi perlu dicekal. Di sinilah typescript-eslint berperan:

| Aturan | Kenapa Penting |
|---|---|
| `no-explicit-any` | Mencegah `any` masuk diam-diam — pengecekan TS tetap terjaga |
| `no-floating-promises` | Menangkap lupa `await` — sumber bug asinkron paling sering dan paling sulit dilacak |
| `no-misused-promises` | Mencegah Promise diteruskan ke callback yang tidak menunggu (mis. di `onClick`) |
| `ban-ts-comment` | Membatasi `@ts-ignore` / `@ts-expect-error` tanpa penjelasan |
| `no-non-null-assertion` | Mengurangi kemalasan `!` pada nilai yang bisa kosong |
| `consistent-type-imports` | Memaksa `import type` untuk tipe murni — lebih jelas dan tidak tersisa di bundle |
| `no-unused-vars` | Variabel mati membebani pembaca; hapus atau beri awalan `_` |

```ts
// tsc tidak menemukan apa-apa pada baris ini:
fetch('/api/produk')          // Promise "melayang" tanpa await

// sedang ESLint memberi alarm:
// ❌ error  Promises must be awaited, end with a call to .catch,
//    or explicitly ignored with the `void` operator
//    (@typescript-eslint/no-floating-promises)
```

::: tip 💡
Untuk project TypeScript penuh, aktifkan varian **type-checked** (`tseslint.configs.recommendedTypeChecked`). Beberapa aturan hanya bisa ia tangkap, bukan tsc tunggal — contohnya `no-floating-promises` dan `no-misused-promises`.
:::

## 20.5 🏷️ Konvensi Penamaan & Struktur Folder Tipe

Konsistensi penamaan membuat tipe seragam dan mudah ditebak oleh seluruh tim:

| Konsep | Konvensi | Contoh |
|---|---|---|
| Tipe & interface | PascalCase, tanpa prefiks | `Produk`, `ApiResponse`, `ActionState` |
| Union type alias | PascalCase, deskriptif | `Status`, `HasilMigrasi` |
| Schema Zod | Nama tipe + suffix `Schema` | `ProdukSchema`, `EnvSchema` |
| Tipe turunan | Suffix jelas kegunaannya | `ProdukDraft`, `ProdukUpdate` |
| File tipe | Sesuai konvensi folder project | `types/produk.ts`, `types/api.ts` |

Struktur folder yang terbukti praktis:

```
src/
├── types/               ← tipe lintas-fitur: tipe inti, ApiResponse<T>, dll.
│   ├── produk.ts        ← tipe produk & schema-nya, satu tempat
│   └── api.ts           ← ApiResponse<T>, Paginated<T>
└── features/
    └── katalog/
        ├── components/Katalog.tsx
        └── types.ts      ← tipe lokal, milik fitur ini saja
```

**Penjelasan:**

- **Tipe inti** yang dipakai lintas-fitur hidup terpusat di `src/types/`.
- **Tipe fitur** yang hanya dipakai satu area, hidup di folder fitur itu sendiri. Tidak semua tipe perlu ditaruh di `types/` agar tidak menumpuk.
- **Tipe turunan** (misal `ProdukUpdate = Partial<Produk>`), pastikan selalu berasal dari induk yang benar — jangan menyalin field-nya satu per satu.

## 20.6 🧠 Prinsip: Anotasi di Batas, Inference untuk Sisanya

Kebiasaan yang membuat kode TypeScript enak dirawat: anotasi eksplisit **hanya di titik batas** — tempat data masuk dari luar lingkup. Sisanya, biarkan TS menebak.

Tiga batas yang wajib dianotasi:

- **Parameter fungsi** — TS tidak bisa menebak "data apa yang boleh masuk".
- **Return type fungsi publik** — kontrak yang diterima file lain; perubahan internal tidak boleh mengubah bentuknya tanpa terlihat.
- **Data eksternal** — hasil `fetch`, `JSON.parse`, variabel env: bentuknya tidak bisa dibuktikan TS sendiri.

```ts
// ✅ batas: parameter & return dianotasi
function ringkas(produk: Produk): ProdukRingkas {
  const ringkasData = { id: produk.id, nama: produk.nama } // ✅ lokal: inference
  return ringkasData
}
```

```ts
const harga = 150000            // ✅ tidak perlu `: number` — TS tahu sendiri
const daftar = ['a', 'b']       // ✅ tidak perlu `: string[]`

// ❌ berlebihan — anotasi di tempat yang inference-nya sudah jelas
const harga2: number = 150000
const daftar2: string[] = ['a', 'b']
```

::: tip 💡
Pertanyaan pemandu sebelum menulis anotasi: "**apakah TS bisa menebak tipe ini dari nilai yang tersambung langsung?**" Jika ya, hapus anotasi. Jika nilainya datang dari luar (parameter, API, config), anotasi diperlukan.
:::

## 20.7 🪶 Hindari Over-Engineering Tipe

Tipe yang rumit bukan tanda hebat. Tipe yang sehat: **dapat dibaca besok tanpa harus memahami konteks penulisnya**.

```ts
// ❌ berlebihan — conditional + mapped + template literal digabung
type Pemilihan<T> = {
  [K in keyof T as T[K] extends string ? `set-${K & string}` : never]: T[K]
}
```

```ts
// ✅ cukup sederhana dan sudah menjawab kebutuhannya
type SetField = Partial<Record<'nama' | 'email', string>>
```

Gejala tipe mulai tidak sehat:

- Butuh paragraf komentar hanya untuk menjelaskan satu tipe.
- Conditional, mapped, dan template literal tumpuk tiga lapis.
- Error TypeScript di sekitar tipe itu lebih rumit dari masalah yang dipecahkan.

::: warning ⚠️
Alat advanced (conditional, mapped, template literal type) adalah alat yang bagus: gunakan hanya jika memang mempermudah. Jika tidak, turunkan jadi tipe sederhana + union. Bab 9.8 sudah membahas tanda-tanda ini.
:::

## 20.8 ✅ Checklist Code Review TypeScript

Setiap PR yang menyentuh kode TS melewati daftar ini:

```
□ Tidak ada `any` — data eksternal memakai unknown → validasi → tipe pasti
□ Return type fungsi publik sudah dianotasi
□ Props komponen sudah dianotasi
□ Pencabangan union sudah exhaustive (terlindungi pengecekan never)
□ Tidak ada @ts-ignore tanpa komentar alasan
□ Nama tipe PascalCase, tanpa prefiks I
□ import type dipakai untuk impor tipe murni
□ tsc --noEmit lulus di strict mode
□ lint lulus tanpa warning
```

## ✅ Checklist Bab 20

```
□ allowJs: true terpasang dan build project masih normal
□ Minimal satu file .js diubah ke .ts dengan proses anotasi yang benar
□ JSDoc @ts-check dipraktikkan pada satu file .js yang belum direname
□ typescript-eslint terpasang dan rule no-floating-promises aktif
□ Tipe mengikuti konvensi PascalCase dan struktur folder types/
□ Prinsip anotasi di batas sudah dipraktikkan
□ tsc --noEmit lulus dengan strict: true
```

---

⏭️ Lanjut ke [🏠 Bab 21 — Project: Aplikasi Katalog Bertipe (React + Next.js)](/bagian-8/bab-21) untuk melanjutkan!
