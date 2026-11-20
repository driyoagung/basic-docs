---
title: "Bagian 2 — SQL Dasar di PostgreSQL"
---

# 📜 Bagian 2 — SQL Dasar di PostgreSQL

> 🎯 **Tujuan Bagian:** menulis SQL harian dengan idiomatik PostgreSQL, termasuk `RETURNING` dan upsert.

## 📖 Bab di Bagian Ini

| Bab | Judul | Fokus |
|---|---|---|
| **Bab 4** | [DDL: Tabel & Tipe Data](/bagian-2/bab-4) | `CREATE TABLE`, tipe data, `IDENTITY`, `TIMESTAMPTZ` |
| **Bab 5** | [CRUD, RETURNING & Upsert](/bagian-2/bab-5) | INSERT/UPDATE/DELETE, `RETURNING`, `ON CONFLICT` |
| **Bab 6** | [Filtering, Fungsi & Tanggal](/bagian-2/bab-6) | `ILIKE`, NULL, `date_trunc`, `INTERVAL`, `generate_series` |

## ✅ Setelah Bagian Ini Anda Bisa

- Membuat tabel dengan tipe data PostgreSQL yang tepat
- Membedakan `TIMESTAMP` dan `TIMESTAMPTZ`
- Memakai `RETURNING` untuk mendapatkan id tanpa query kedua
- Melakukan upsert dengan `ON CONFLICT`
- Menulis laporan sederhana dengan fungsi tanggal

## 🧭 Urutan Belajar

```
Bab 4  →  Bab 5  →  Bab 6
```

::: tip 💡 Tips
Biasakan memakai `NUMERIC` untuk uang dan `TIMESTAMPTZ` untuk waktu. Dua keputusan ini mencegah banyak bug yang mahal diperbaiki nanti.
:::
