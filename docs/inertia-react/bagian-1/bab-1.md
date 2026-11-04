---
title: "Bab 1 — Mengenal Inertia.js"
---

# 📖 Bab 1 — Mengenal Inertia.js

Inertia.js sering disebut "framework", padahal ia bukan. Inertia adalah **adapter** tipis yang menghubungkan backend Laravel dengan frontend React: Laravel tetap memegang routing, controller, validasi, dan session; React hanya bertugas merender halaman. Bab ini menjelaskan masalah yang dipecahkannya, kapan Anda sebaiknya memakainya, dan apa yang baru di Inertia v2.

---

## 1.1 🤔 Masalah SPA + REST API

Pola klasik "React SPA + Laravel API" bekerja, tetapi memaksa Anda mengerjakan banyak hal dua kali.

```text
ARSITEKTUR SPA + REST API
┌──────────────────┐        JSON        ┌──────────────────┐
│  React (repo A)  │ ←────────────────→ │ Laravel (repo B) │
│  React Router    │                    │ routes/api.php   │
│  Token auth      │                    │ Sanctum + CORS   │
│  Deploy sendiri  │                    │ Deploy sendiri   │
└──────────────────┘                    └──────────────────┘

Satu fitur "tambah produk" =
  route API + controller API + resource + validasi +
  fetch di React + state loading + state error + CORS + token
```

Beban yang muncul:

| Beban | Penjelasan |
|---|---|
| **Routing ganda** | Route di `routes/api.php` dan React Router harus sinkron |
| **Auth token** | Login manual, simpan token, refresh, logout, 401 handling |
| **CORS** | Konfigurasi origin, preflight, cookie lintas domain |
| **Duplikasi validasi** | Validasi backend + validasi form frontend |
| **Dua deploy** | Frontend dan backend bisa berbeda versi |

Inertia menghapus lapisan API itu tanpa mengorbankan pengalaman SPA.

---

## 1.2 ⚖️ Inertia vs Alternatif

| Pendekatan | Kelebihan | Kekurangan | Cocok untuk |
|---|---|---|---|
| **Blade biasa** | Sederhana, SEO mudah, satu bahasa | Interaktivitas terbatas | Situs konten, admin sederhana |
| **Livewire** | Full PHP, tanpa JS terpisah | Kurang nyaman bila tim kuat di React | Tim Laravel murni |
| **Inertia + React** | UI kaya, ekosistem React, tanpa API | Perlu paham React | Dashboard, aplikasi internal, SaaS |
| **SPA + REST API** | Frontend/backend terpisah total | Dua project, CORS, token | Tim besar, mobile client juga butuh API |

> 💡 **Cara memilih cepat:** Jika hanya butuh halaman sederhana dengan sedikit interaksi, Blade/Livewire lebih murah. Jika UI butuh komponen React yang kompleks tetapi Anda tidak ingin mengurus API, Inertia adalah titik seimbangnya.

---

## 1.3 ✅ Kapan Cocok, Kapan Tidak

**Cocok bila:**

- Aplikasi **satu tim** dengan backend Laravel dan frontend React.
- Butuh UI interaktif: tabel dengan filter, form bertahap, modal, dashboard.
- Auth memakai **session Laravel** (bukan mobile app / third-party client).
- Ingin menghindari biaya perawatan API dan CORS.

**Kurang cocok bila:**

- Anda perlu **API publik** untuk mobile atau partner (tetap butuh REST/GraphQL).
- Butuh **SEO kuat untuk halaman publik** dan tidak mau mengoperasikan SSR Node (lihat Bab 18).
- Tim frontend dan backend terpisah dengan siklus rilis independen.
- Aplikasi sangat ringan yang cukup dengan Blade.

```text
Butuh API untuk pihak lain? ── ya ──► SPA + REST API (atau Inertia + API terpisah)
        │ tidak
        ▼
UI React kompleks? ── tidak ──► Blade / Livewire
        │ ya
        ▼
Inertia + React ✅
```

---

## 1.4 🧩 Inertia Bukan Framework

Inertia tidak menambah routing baru, tidak punya ORM, dan tidak mengatur state global. Ia hanya menyediakan **protokol** antara server dan client.

| Lapisan | Pemilik |
|---|---|
| Routing | Laravel (`routes/web.php`) |
| Controller & validasi | Laravel |
| Auth & session | Laravel |
| Database | Eloquent |
| Komponen halaman | React (`resources/js/Pages`) |
| Navigasi antar halaman | Inertia (`<Link>`, `router`) |
| Data halaman | Props dari controller |

Di sisi Laravel, semuanya terasa seperti aplikasi biasa — hanya nilai balik controller berubah:

```php
// Tanpa Inertia
return view('products.index', ['products' => $products]);

// Dengan Inertia
return Inertia::render('Products/Index', ['products' => $products]);
```

Di sisi React, semuanya terasa seperti komponen biasa — hanya sumber datanya props:

```jsx
export default function Index({ products }) {
  return <h1>Daftar Produk</h1>
}
```

> ⚠️ **Konsekuensi penting:** semua props yang dikirim controller **terlihat di browser**. Jangan pernah mengirim password hash, token internal, atau data sensitif lain ke props (dibahas lagi di Bab 4 dan 14).

---

## 1.5 🆕 Apa yang Baru di Inertia v2

Inertia v2 menambah fitur yang sebelumnya harus diakali manual:

| Fitur | Manfaat |
|---|---|
| **Deferred props** | Data berat dimuat setelah halaman tampil |
| **Prefetching** | Halaman tujuan dimuat saat link di-hover |
| **Polling** | Data di-refresh berkala dengan `usePoll` |
| **Merge props** | Menambah data ke list lama (infinite scroll) |
| **`WhenVisible`** | Memuat data saat elemen masuk viewport |
| **`<Form>`** | Form sederhana tanpa `useForm` manual |
| **Async requests** | Semua request bisa dibatalkan & dilacak |

Fitur-fitur ini dibahas mendalam di Bab 8 dan 19. Untuk sekarang, cukup ingat bahwa Inertia v2 membuat aplikasi terasa lebih cepat tanpa banyak kode tambahan.

---

## 1.6 🧠 Mental Model yang Benar

Simpan tiga kalimat ini:

1. **Controller mengirim props, bukan HTML.**
2. **React merender halaman berdasarkan props itu.**
3. **Perpindahan halaman adalah request Inertia, bukan reload browser.**

Dengan model ini, pertanyaan seperti "di mana state disimpan?" atau "kenapa data tidak berubah?" akan lebih mudah dijawab di bab berikutnya.

---

## ✅ Checklist Bab 1

- **Masalah utama** — routing ganda, token auth, CORS, dan duplikasi kerja hilang dengan Inertia.
- **Perbandingan** — Blade, Livewire, Inertia, dan SPA + API punya trade-off berbeda.
- **Kapan cocok** — aplikasi satu tim dengan session auth dan UI React kompleks.
- **Kapan tidak** — butuh API publik, SEO publik kuat tanpa SSR, atau tim terpisah.
- **Bukan framework** — Inertia hanya adapter; routing, auth, dan database tetap milik Laravel.
- **Props terlihat di browser** — jangan kirim data sensitif.
- **Inertia v2** — deferred, prefetch, polling, merge props, `WhenVisible`, `<Form>`.

---

⏭️ Lanjut ke [🛠️ Bab 2 — Setup Project](/bagian-1/bab-2) untuk melanjutkan!
