---
title: Laravel + Inertia.js + Vue.js
description: Dari Blade ke Full-Stack Modern — Panduan untuk Developer Laravel
layout: home

hero:
  name: "Laravel · Inertia · Vue"
  text: "Dari Blade ke Full-Stack Modern"
  tagline: Panduan lengkap untuk developer Laravel yang ingin transisi ke Inertia.js + Vue 3 — tetap menulis Laravel seperti biasa, dengan tampilan aplikasi modern.
  image:
    src: /logos/inertia.png
    alt: Logo Inertia.js
  actions:
    - theme: brand
      text: Mulai Membaca
      link: /bagian-1/bab-1
    - theme: alt
      text: Setup Project
      link: /bagian-1/bab-2
    - theme: alt
      text: Lihat Studi Kasus
      link: /bagian-6/bab-24/

features:
  - title: Tanpa REST API
    details: Tidak perlu membangun API terpisah. Laravel tetap jadi single source of truth — routing, controller, dan validasi tidak banyak berubah.
    icon: 🔌
  - title: Satu Codebase
    details: Backend dan frontend dalam satu project. Tidak ada double routing, double auth, atau CORS yang merepotkan.
    icon: 📦
  - title: Vue 3 Composition API
    details: Gunakan sintaks script setup, ref, computed, dan useForm. UI interaktif tanpa full page reload.
    icon: ⚡
  - title: Transisi Mulus dari Blade
    details: Tetap pakai Eloquent, Middleware, Gate/Policy. Cukup ganti `return view()` dengan `Inertia::render()`.
    icon: 🔄
  - title: Tailwind CSS & Pinia
    details: Styling utility-first dan state management modern — hanya ketika benar-benar dibutuhkan.
    icon: 🎨
  - title: Siap Produksi
    details: Dilengkapi testing, optimasi Vite, SSR untuk SEO, dan deploy ke VPS atau platform seperti Forge/Ploi.
    icon: 🚀
---
