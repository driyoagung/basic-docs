---
layout: home

hero:
  name: "Ebook Laravel + Inertia React"
  text: "Full Stack Modern Tanpa REST API Terpisah"
  tagline: "Gabungkan kekuatan Laravel dan React dalam satu project. Routing, auth, dan data tetap di Laravel — tampilan dirender React. Tanpa API, CORS, atau token."
  actions:
    - theme: brand
      text: 🚀 Mulai Belajar
      link: /bagian-1/bab-1
    - theme: alt
      text: 📚 Lihat Daftar Bab
      link: /bagian-1/index
    - theme: alt
      text: ⚡ Jalur Cepat CRUD
      link: /bagian-5/index

features:
  - icon: 🧩
    title: Satu Project, Dua Dunia
    details: Laravel mengatur route, controller, dan database; React mengurus tampilan. Tanpa dua repo, tanpa API terpisah.
  - icon: 🔐
    title: Auth Session Bawaan
    details: Login, register, reset password, dan verifikasi email lewat Laravel Breeze — bukan token yang harus diurus manual.
  - icon: 📝
    title: Form Tanpa Fetch
    details: useForm mengirim data, Laravel memvalidasi, error otomatis muncul sebagai props.errors. Tanpa try/catch dan axios.
  - icon: ⚡
    title: Performa Inertia v2
    details: Partial reload, deferred props, prefetch, merge props, dan polling — dashboard tetap terasa instan.
  - icon: 🛡️
    title: RBAC End-to-End
    details: Spatie Permission, Policy Laravel, hook useCan, dan komponen Can — aman di backend, rapi di frontend.
  - icon: 🇮🇩
    title: 100% Bahasa Indonesia
    details: "Penjelasan santai dengan studi kasus nyata: dashboard manajemen produk lengkap dengan auth dan role."
---

## 🎯 Untuk Siapa Ebook Ini?

Anda yang sudah paham dasar **Laravel** (routing, controller, Eloquent) dan dasar **React** (component, props, state, hooks), lalu ingin menggabungkan keduanya dalam satu project tanpa harus membangun REST API terpisah.

## 🤔 Masalah yang Dipecahkan Inertia

```text
SPA + REST API (cara lama):
React  ←── JSON ──→  Laravel API
- dua project, dua deploy
- routing di dua tempat
- CORS, token, refresh token
- satu fitur = dua kali kerja

Inertia (monolith modern):
┌──────────────────────────────────┐
│ SATU PROJECT LARAVEL             │
│ routes/web.php → Controller      │
│ Controller → Inertia::render()   │
│ Tampilan → React di Pages/       │
│ Auth → session Laravel biasa     │
└──────────────────────────────────┘
```

> 💡 **Analogi:**
> Inertia adalah lem antara Laravel dan React. Controller tetap mengatur
> data dan route, tetapi tampilan dirender komponen React. Hasilnya terasa
> seperti SPA — pindah halaman tanpa reload penuh — tanpa membuat API.

## 🔄 Inertia React vs Inertia Vue

| Aspek | Inertia + React | Inertia + Vue |
|---|---|---|
| **Package** | `@inertiajs/react` | `@inertiajs/vue3` |
| **Template** | JSX | `<template>` SFC |
| **Props halaman** | Parameter komponen | `defineProps()` |
| **Form state** | `useForm({...})` + `setData` | `useForm({...})` reaktif |
| **Layout** | `Page.layout = page => ...` | `defineOptions({ layout })` |
| **Backend Laravel** | ✅ Identik | ✅ Identik |

## 🧰 Tech Stack

| Tool | Fungsi |
|---|---|
| **Laravel 11 + PHP 8.2** | Backend, routing, Eloquent, auth |
| **Inertia.js v2** | Jembatan Laravel ↔ React |
| **React 18** | UI |
| **Vite** | Build tool (bawaan Laravel) |
| **Ziggy** | Helper `route()` di JavaScript |
| **Tailwind CSS** | Styling |
| **Laravel Breeze** | Starter kit auth + Inertia React |
| **Spatie Permission** | Role & permission (RBAC) |
| **Pest** | Testing backend |

## 🗺️ Peta Perjalanan Belajar

```
🟢 BAGIAN I    Fondasi Inertia                    → Bab 1  – 3
🔵 BAGIAN II   Pages, Navigasi & Layout           → Bab 4  – 6
🟡 BAGIAN III  Data Sharing & Props               → Bab 7  – 8
🟠 BAGIAN IV   Form, Validasi & Upload            → Bab 9  – 11
🔴 BAGIAN V    CRUD & Data Table                  → Bab 12 – 14
🟣 BAGIAN VI   Autentikasi & Otorisasi (RBAC)     → Bab 15 – 16
⚫ BAGIAN VII  Error, SSR, Performa & Testing     → Bab 17 – 20
🏆 BAGIAN VIII Project & Deployment               → Bab 21 – 22
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 8 Bagian | 22 Bab
```

## ⚡ Jalur Cepat

> Tidak harus membaca semua bab berurutan. Ikuti jalur sesuai tujuan Anda.

| Tujuan | Bab yang Dibaca |
|---|---|
| **CRUD minimal** | 2 → 3 → 4 → 5 → 9 → 12 → 13 |
| **CRUD + Auth** | Jalur CRUD + 15 → 16 |
| **Siap produksi** | Semua bab + 17 → 18 → 19 → 20 → 22 |
| **Paham menyeluruh** | Semua bab berurutan |

## ⭐ Bab Paling Kritis

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 3** — Cara Kerja Inertia | Memahami alur request membuat semua fitur lain masuk akal |
| 🥈 | **Bab 9** — useForm & Validasi | Hampir semua interaksi user lewat form |
| 🥉 | **Bab 7** — Shared Data | Cara kirim `auth`, `flash`, dan `permissions` ke semua halaman |

---

::: tip 💡 Cara Membaca Ebook Ini
- Mulai dari **Bab 1** jika baru pertama mengenal Inertia
- Pakai **jalur cepat** di atas jika ingin langsung membangun CRUD
- Perhatikan emoji: 🚨 bahaya, 💡 tips penting, ⭐ bab kritis
- Prasyarat: dasar Laravel (routing, controller, Eloquent) + dasar React (component, props, state, hooks)
:::
