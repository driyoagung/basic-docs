---
title: "Bagian 6 — Index, Performa & Transaksi"
---

# ⚡ Bagian 6 — Index, Performa & Transaksi

> 🎯 **Tujuan Bagian:** membuat query cepat dengan bukti, dan menjaga data tetap konsisten saat konkuren.

## 📖 Bab di Bagian Ini

| Bab | Judul | Fokus |
|---|---|---|
| **Bab 17** | [Index ⭐](/bagian-6/bab-17) | B-Tree, GIN, GiST, BRIN, partial, expression |
| **Bab 18** | [EXPLAIN & Optimasi Query](/bagian-6/bab-18) | `EXPLAIN ANALYZE`, statistik, `pg_stat_statements` |
| **Bab 19** | [Transaksi, MVCC, Locking & VACUUM ⭐](/bagian-6/bab-19) | ACID, isolation, `FOR UPDATE`, deadlock, autovacuum |

## ✅ Setelah Bagian Ini Anda Bisa

- Memilih jenis index sesuai pola query
- Membuat partial dan covering index
- Membaca rencana eksekusi dan menemukan penyebab lambat
- Menulis checkout yang aman dari race condition
- Memahami MVCC, bloat, dan peran autovacuum

## 🧭 Urutan Belajar

```
Bab 17  →  Bab 18  →  Bab 19
```

::: tip 💡 Tips
Jangan menambah index tanpa mengukur. Index mempercepat baca, tetapi memperlambat tulis dan memakan ruang. Buktikan dengan `EXPLAIN (ANALYZE, BUFFERS)`.
:::
