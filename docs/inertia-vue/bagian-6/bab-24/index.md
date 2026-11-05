---
title: Bab 24 - Mini Project Task Manager
---

# Bab 24: Mini Project - Sistem Manajemen Tugas (Task Manager)

:::info Bagian VI - Studi Kasus
Bangun aplikasi Task Manager lengkap dari nol - gunakan semua konsep Bab 1-23. Project ini akan memperkuat pemahamanmu.
:::

## Gambaran Aplikasi

Aplikasi yang akan dibangun:

- Autentikasi (login, register, logout).
- Dashboard dengan statistik ringkasan.
- Manajemen Project (CRUD).
- Manajemen Task per Project (CRUD).
- Assign task ke user lain.
- Filter task berdasarkan status (todo, in-progress, done).
- Upload lampiran pada task.
- Komentar pada task.
- Notifikasi flash message.
- Otorisasi: hanya pemilik project yang bisa edit/hapus.

## Peta Perjalanan

Bab ini dipecah menjadi 15 langkah berurutan. Tiap langkah fokus pada satu modul agar mudah diikuti:

| Langkah | Topik | Link |
| --- | --- | --- |
| 24.1 | Perencanaan & Desain Database | [Buka](/bagian-6/bab-24/24-1-perencanaan-database) |
| 24.2 | Setup Project & Instalasi | [Buka](/bagian-6/bab-24/24-2-setup-project) |
| 24.3 | Database: Migration & Model | [Buka](/bagian-6/bab-24/24-3-migration-model) |
| 24.4 | Autentikasi | [Buka](/bagian-6/bab-24/24-4-autentikasi) |
| 24.5 | Layout Utama Aplikasi | [Buka](/bagian-6/bab-24/24-5-layout-utama) |
| 24.6 | Modul Project (CRUD) | [Buka](/bagian-6/bab-24/24-6-modul-project) |
| 24.7 | Modul Task (CRUD + Status) | [Buka](/bagian-6/bab-24/24-7-modul-task) |
| 24.8 | Upload Lampiran pada Task | [Buka](/bagian-6/bab-24/24-8-upload-lampiran) |
| 24.9 | Komentar pada Task | [Buka](/bagian-6/bab-24/24-9-komentar-task) |
| 24.10 | Dashboard & Statistik | [Buka](/bagian-6/bab-24/24-10-dashboard-statistik) |
| 24.11 | Manajemen Anggota Project | [Buka](/bagian-6/bab-24/24-11-anggota-project) |
| 24.12 | Filter, Search & Pagination | [Buka](/bagian-6/bab-24/24-12-filter-search-pagination) |
| 24.13 | Polish & Detail Akhir | [Buka](/bagian-6/bab-24/24-13-polish-detail) |
| 24.14 | Testing Mini Project | [Buka](/bagian-6/bab-24/24-14-testing) |
| 24.15 | Build & Deploy | [Buka](/bagian-6/bab-24/24-15-build-deploy) |

## Prasyarat

Sebelum mulai, pastikan kamu sudah:

- Membaca [Bab 1-3](/bagian-1/bab-1) (Memahami Inertia).
- Membaca [Bab 6-7](/bagian-2/bab-6) (Page Component & Layout).
- Membaca [Bab 10](/bagian-3/bab-10) (Form & Validasi).
- Membaca [Bab 14](/bagian-4/bab-14) (File Upload).

## Hasil Akhir

Setelah menyelesaikan mini project ini, kamu sudah pernah:

- Setup project Laravel + Inertia + Vue dari nol.
- Membuat CRUD lengkap dengan Inertia (tanpa API, tanpa token).
- Validasi form server-side yang terintegrasi mulus dengan `useForm()`.
- Upload file dan manajemen storage.
- Otorisasi dengan Gate & Policy.
- Filter, search, dan pagination dengan partial reload.
- Layout persisten dengan sidebar dan topbar.
- Komponen Vue yang reusable.
- Testing dengan PHPUnit dan `assertInertia()`.
- Deploy ke production.

:::tip Mulai dari sini
Yuk mulai dari [Langkah 24.1 - Perencanaan Database](/bagian-6/bab-24/24-1-perencanaan-database).
:::