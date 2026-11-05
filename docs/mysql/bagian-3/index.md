---
title: "Bagian III — Relasi & Query Lanjutan"
---

# 🔗 BAGIAN III — Relasi & Query Lanjutan

> 🎯 **Tujuan Bagian Ini:**
> Menghubungkan tabel dengan benar, menggabungkan data memakai JOIN,
> dan menjawab pertanyaan bisnis dengan agregasi, subquery, CTE,
> window function, serta UNION.

## 📚 Daftar Bab di Bagian Ini

| Bab | Topik | Status |
| --- | ----- | ------ |
| 8 | [Constraint & Relasi Antar Tabel](/bagian-3/bab-8) | ✅ Tersedia |
| 9 | [JOIN ⭐](/bagian-3/bab-9) | ✅ Tersedia |
| 10 | [Agregasi & Pengelompokan](/bagian-3/bab-10) | ✅ Tersedia |
| 11 | [Subquery, CTE, Window Function & UNION](/bagian-3/bab-11) | ✅ Tersedia |

## 🗺️ Peta Konsep Bagian III

```
Bab 8 — Constraint & Relasi
   │  PRIMARY KEY, FOREIGN KEY, CASCADE, tabel pivot
   ▼
Bab 9 — JOIN ⭐
   │  INNER, LEFT, RIGHT, CROSS, SELF JOIN
   ▼
Bab 10 — Agregasi
   │  COUNT, SUM, AVG, GROUP BY, HAVING
   ▼
Bab 11 — Query Lanjutan
   │  subquery, EXISTS, CTE, window function, UNION
   ▼
Lanjut ke Bagian IV → Desain Database
```

## ⏱️ Estimasi Waktu

| Bab | Estimasi |
| --- | -------- |
| Bab 8 | 35–50 menit |
| Bab 9 | 45–60 menit |
| Bab 10 | 30–45 menit |
| Bab 11 | 45–60 menit |
| **Total Bagian III** | **± 155–215 menit** |

## ✅ Hasil yang Diharapkan

Setelah menyelesaikan bagian ini, Anda mampu:

- membuat relasi one-to-many dan many-to-many dengan aman;
- memilih jenis JOIN yang tepat dan menghindari duplikasi baris;
- membuat laporan dengan `GROUP BY` dan `HAVING`;
- memakai CTE dan window function untuk query yang lebih mudah dibaca;
- menulis query "3 produk terlaris per kategori" tanpa bingung.

::: tip 💡 Tips
Bab 9 adalah bab paling penting di bagian ini. Luangkan waktu untuk menggambar diagram himpunan sebelum menulis JOIN — kesalahan paling sering berasal dari salah membayangkan hasil join, bukan salah sintaks.
:::
