---
title: "Bagian 3 — Relasi & Query Lanjutan"
---

# 🔗 Bagian 3 — Relasi & Query Lanjutan

> 🎯 **Tujuan Bagian:** menggabungkan data antar tabel dan menulis query analitik yang benar.

## 📖 Bab di Bagian Ini

| Bab | Judul | Fokus |
|---|---|---|
| **Bab 7** | [Constraint & Relasi](/bagian-3/bab-7) | Foreign key, aksi referensial, UUID, `EXCLUDE` |
| **Bab 8** | [JOIN ⭐](/bagian-3/bab-8) | INNER/LEFT/FULL, `LATERAL`, jebakan join |
| **Bab 9** | [Agregasi & Pengelompokan](/bagian-3/bab-9) | `GROUP BY`, `FILTER`, `ROLLUP`, `array_agg` |
| **Bab 10** | [Subquery, CTE, Window Function & Fitur Query Khas](/bagian-3/bab-10) | CTE rekursif, `DISTINCT ON`, window function |

## ✅ Setelah Bagian Ini Anda Bisa

- Merancang relasi one-to-many dan many-to-many
- Memilih `JOIN` yang tepat dan menjelaskan hasilnya
- Menghindari baris ganda akibat join yang salah
- Menulis laporan dengan agregasi bersyarat
- Memakai CTE, window function, dan `DISTINCT ON`

## 🧭 Urutan Belajar

```
Bab 7  →  Bab 8  →  Bab 9  →  Bab 10
```

::: tip 💡 Tips
Jika hasil query tiba-tiba lebih banyak dari perkiraan, periksa join. Satu baris yang berpasangan dengan banyak baris akan menggandakan hasil.
:::
