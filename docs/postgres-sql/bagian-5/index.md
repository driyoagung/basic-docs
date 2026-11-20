---
title: "Bagian 5 — Fitur Khas PostgreSQL"
---

# 🧩 Bagian 5 — Fitur Khas PostgreSQL

> 🎯 **Tujuan Bagian:** menguasai fitur yang paling sering menjadi alasan orang memilih PostgreSQL.

## 📖 Bab di Bagian Ini

| Bab | Judul | Fokus |
|---|---|---|
| **Bab 13** | [JSONB ⭐](/bagian-5/bab-13) | Operator JSONB, index GIN, kapan dipakai |
| **Bab 14** | [Array, Enum, Range & Tipe Khusus](/bagian-5/bab-14) | Array, enum, range, `EXCLUDE`, UUID, domain |
| **Bab 15** | [Full-Text Search & Pencarian Fuzzy](/bagian-5/bab-15) | `tsvector`, `tsquery`, `pg_trgm`, ranking |
| **Bab 16** | [Extension](/bagian-5/bab-16) | `CREATE EXTENSION`, PostGIS, pgvector, FDW |

## ✅ Setelah Bagian Ini Anda Bisa

- Menyimpan atribut fleksibel dengan JSONB secara bijak
- Membuat index GIN untuk JSONB dan array
- Mencegah jadwal bentrok dengan range dan `EXCLUDE`
- Membangun pencarian teks dengan peringkat relevansi
- Memasang dan mengevaluasi extension

## 🧭 Urutan Belajar

```
Bab 13  →  Bab 14  →  Bab 15  →  Bab 16
```

::: tip 💡 Tips
Fitur khas PostgreSQL sangat kuat, tetapi tidak semua data harus menjadi JSONB atau array. Gunakan fitur karena kebutuhan, bukan karena tersedia.
:::
