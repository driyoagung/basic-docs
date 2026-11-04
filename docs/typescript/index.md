---
layout: home

hero:
  name: "Ebook TypeScript"
  text: "Dari JavaScript ke React & Next.js"
  tagline: "Belajar TypeScript yang benar-benar dipakai di project nyata — fokus pada bagian yang paling sering muncul saat menulis komponen, hooks, dan halaman Next.js."
  actions:
    - theme: brand
      text: 🚀 Mulai Belajar
      link: /bagian-1/bab-1
    - theme: alt
      text: 📚 Lihat Daftar Bab
      link: /bagian-1/index
    - theme: alt
      text: ⚡ Jalur Cepat React
      link: /bagian-5/index

features:
  - icon: 🔄
    title: JS vs TS, Apa yang Berubah?
    details: Pengecekan tipe berpindah dari runtime ke saat menulis kode — autocomplete kaya, refactor aman, dan typo tertangkap lebih awal.
  - icon: 🟢
    title: Fondasi yang Benar
    details: Setup strict mode sejak awal, `tsconfig.json` yang benar, dan semua tipe dasar — array, tuple, literal, `any` vs `unknown`.
  - icon: ⭐
    title: Bab Kritis Ditantang
    details: Object typing, union & narrowing, generics, dan typing hooks — empat bab paling kritis dijelaskan mendalam dengan studi kasus.
  - icon: 🔴
    title: Fokus React
    details: Typing props, event, hooks, hingga pola lanjutan — generic component, discriminated union, dan `DataTable<T>`.
  - icon: 🟣
    title: Fokus Next.js
    details: Typing App Router, Server Actions + Zod, typed routes hingga augmentasi tipe `Session` — mengikuti Next.js 15+.
  - icon: 🇮🇩
    title: 100% Bahasa Indonesia
    details: Penjelasan santai dengan studi kasus lokal seperti `formatRupiah` dan kasus yang relevan dengan konteks developer Indonesia.

---

## 🎯 Untuk Siapa Ebook Ini?

Anda yang sudah paham **JavaScript dasar** (variabel, fungsi, array, object, async/await) dan ingin belajar TypeScript sebagai bekal memakai **React** dan **Next.js**. Ebook ini tidak mengajarkan semua fitur TypeScript secara akademis — fokusnya pada bagian yang **paling sering muncul** saat menulis komponen, hooks, dan halaman Next.js.

## 🤔 Mengapa TypeScript Sebelum React/Next?

```ts
// JAVASCRIPT
function hitungTotal(item) {
  return item.harga * item.jumlah
}
hitungTotal({ harga: 1000, jumlh: 2 })   // typo "jumlh"
// ✅ Tidak ada error saat menulis
// 💥 Hasilnya NaN — baru ketahuan saat dijalankan

// TYPESCRIPT
function hitungTotal(item: { harga: number; jumlah: number }) {
  return item.harga * item.jumlah
}
hitungTotal({ harga: 1000, jumlh: 2 })
// ❌ ERROR langsung di editor!
```

> 💡 **Analogi:**
> JavaScript seperti menulis dokumen tanpa pemeriksa ejaan: salah ketik baru
> ketahuan setelah dicetak. TypeScript seperti pemeriksa ejaan yang
> menggarisbawahi kesalahan **sambil Anda mengetik**.

## 🔄 JavaScript vs TypeScript — Apa yang Berubah?

| Aspek | JavaScript | TypeScript |
|---|---|---|
| **Pengecekan tipe** | Saat runtime | Saat menulis kode |
| **Ekstensi file** | `.js`, `.jsx` | `.ts`, `.tsx` |
| **Dijalankan browser/Node** | Langsung | Dikompilasi dulu ke JS |
| **Autocomplete** | Terbatas | Sangat kaya & akurat |
| **Refactor** | Berisiko | Aman |
| **Kurva belajar** | Rendah | Sedang |

::: warning ⚠️ Hal yang Sering Disalahpahami
TypeScript **tidak** mengubah cara kode berjalan. Semua tipe **dihapus** saat kompilasi. Tipe hanya membantu saat *menulis* kode, bukan melindungi aplikasi dari data buruk saat *berjalan* (respons API). Untuk itu ada validasi runtime seperti Zod — dibahas di Bab 12.
:::

## 🧰 Tech Stack

| Tool | Fungsi |
|---|---|
| **TypeScript 5.x** | Bahasa & compiler (`tsc`) |
| **tsx** | Menjalankan file `.ts` langsung tanpa build |
| **Vite** | Dev server untuk latihan React + TS |
| **React 18** | Latihan typing komponen & hooks |
| **Next.js (App Router)** | Latihan typing page, route handler, server action |
| **Zod** | Validasi data runtime + infer tipe |
| **ESLint + typescript-eslint** | Kualitas kode |

## 🗺️ Peta Perjalanan Belajar

```
🟢 BAGIAN I    Fondasi TypeScript                   → Bab 1  – 3
🔵 BAGIAN II   Fungsi, Object & Tipe Gabungan       → Bab 4  – 6
🟡 BAGIAN III  Generics & Utility Types             → Bab 7  – 9
🟠 BAGIAN IV   Class, Module & Data Asinkron        → Bab 10 – 12
🔴 BAGIAN V    TypeScript untuk React               → Bab 13 – 15
🟣 BAGIAN VI   TypeScript untuk Next.js             → Bab 16 – 18
⚫ BAGIAN VII  Debugging, Migrasi & Best Practices  → Bab 19 – 20
🏆 BAGIAN VIII Project Praktik                      → Bab 21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 8 Bagian | 21 Bab
```

## ⚡ Jalur Cepat

> Tidak harus membaca semua bab dulu. Jika tujuan utama Anda adalah framework, ikuti jalur ini lalu kembali ke bab lain saat dibutuhkan.

| Tujuan | Bab yang Dibaca |
|---|---|
| **Minimal untuk React** | 2 → 3 → 5 → 6 → 7 → 13 → 14 |
| **Minimal untuk Next.js** | Jalur React + 8 → 12 → 16 → 17 |
| **Paham menyeluruh** | Semua bab berurutan |

## ⭐ Bab Paling Kritis

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 5** — Object, `type` & `interface` | Props React, response API, model data — semuanya object |
| 🥈 | **Bab 6** — Union & Narrowing | Dasar menangani `null`, loading/error state, dan data multi-bentuk |
| 🥉 | **Bab 7** — Generics | Kunci memahami `useState<T>`, `Promise<T>`, dan hampir semua library |
| 🏅 | **Bab 14** — Typing Hooks | Tempat paling sering pemula bingung di React + TS |

---

::: tip 💡 Cara Membaca Ebook Ini
- Mulai dari **Bab 1** jika baru pertama kali menyentuh TypeScript
- Pakai **jalur cepat** di atas jika tujuan Anda langsung React/Next.js
- Perhatikan **emoji** pada judul — 🚨 berarti bahaya, 💡 berarti tips penting, ⭐ berarti bab kritis
- Prasyarat: JavaScript dasar (variabel, fungsi, array, object, async/await)
:::
