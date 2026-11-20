---
title: "Bagian 4 — Desain Database"
---

# 📐 Bagian 4 — Desain Database

> 🎯 **Tujuan Bagian:** menerjemahkan kebutuhan bisnis menjadi skema PostgreSQL yang sehat.

## 📖 Bab di Bagian Ini

| Bab | Judul | Fokus |
|---|---|---|
| **Bab 11** | [ERD, Normalisasi & Desain Skema](/bagian-4/bab-11) | Entitas, kardinalitas, 1NF–3NF, denormalisasi sadar |
| **Bab 12** | [Studi Kasus Desain: Toko Online](/bagian-4/bab-12) | ERD lengkap, `CREATE TABLE`, JSONB vs kolom biasa |

## ✅ Setelah Bagian Ini Anda Bisa

- Menggambar ERD dari kebutuhan bisnis
- Menormalisasi skema dan mengenali kapan denormalisasi masuk akal
- Memilih tipe data dan constraint yang tepat
- Memutuskan kapan memakai JSONB dan kapan tabel relasi
- Mengevaluasi desain dengan pertanyaan bisnis nyata

## 🧭 Urutan Belajar

```
Bab 11  →  Bab 12
```

::: tip 💡 Tips
Desain yang baik membuat query laporan terasa wajar. Jika satu laporan sederhana membutuhkan lima join aneh, mungkin ada masalah di skema.
:::
