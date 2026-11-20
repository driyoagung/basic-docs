---
title: "Bagian 1 — Fondasi & Setup"
---

# 🚀 Bagian 1 — Fondasi & Setup

> 🎯 **Tujuan Bagian:** memahami posisi PostgreSQL, menyiapkan environment, dan mengenal struktur logisnya.

## 📖 Bab di Bagian Ini

| Bab | Judul | Fokus |
|---|---|---|
| **Bab 1** | [Mengenal PostgreSQL](/bagian-1/bab-1) | Sejarah, posisi, kapan dipilih, siklus rilis |
| **Bab 2** | [Instalasi & Mengenal psql](/bagian-1/bab-2) | Docker, instalasi lokal, meta-command, connection string |
| **Bab 3** | [Struktur Logis: Cluster, Database, Schema & Role](/bagian-1/bab-3) | Namespace schema, search_path, role, WAL |

## ✅ Setelah Bagian Ini Anda Bisa

- Menjelaskan perbedaan PostgreSQL dengan MySQL dan database lain
- Menjalankan PostgreSQL lewat Docker atau instalasi lokal
- Memakai `psql` untuk menjelajah database
- Memahami cluster, database, schema, dan role
- Membaca pesan error dan kode `SQLSTATE`

## 🧭 Urutan Belajar

```
Bab 1  →  Bab 2  →  Bab 3
```

Jika sudah familiar dengan Docker dan SQL dasar, Anda boleh langsung ke Bab 4.

::: tip 💡 Tips
Jangan menghafal semua meta-command `psql`. Cukup ingat `\l`, `\c`, `\dt`, `\d`, `\du`, dan `\q`; sisanya bisa dicari saat dibutuhkan.
:::
