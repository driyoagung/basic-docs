---
title: "Bagian V — Index, Performa & Transaksi"
---

# ⚡ BAGIAN V — Index, Performa & Transaksi

> 🎯 **Tujuan Bagian Ini:**
> Memahami penyebab query lambat, membacanya lewat EXPLAIN,
> lalu menjaga konsistensi data dengan transaksi dan locking.

## 📚 Daftar Bab di Bagian Ini

| Bab | Topik | Status |
| --- | ----- | ------ |
| 14 | [Index ⭐](/bagian-5/bab-14) | ✅ Tersedia |
| 15 | [EXPLAIN & Optimasi Query](/bagian-5/bab-15) | ✅ Tersedia |
| 16 | [Transaksi, ACID & Locking ⭐](/bagian-5/bab-16) | ✅ Tersedia |

## 🗺️ Peta Konsep Bagian V

```
Bab 14 — Index ⭐
   │  B-Tree, composite, leftmost prefix, selectivity
   ▼
Bab 15 — EXPLAIN & Optimasi
   │  type, key, rows, slow query log, pagination
   ▼
Bab 16 — Transaksi & Locking ⭐
   │  ACID, isolation level, FOR UPDATE, deadlock
   ▼
Lanjut ke Bagian VI → Fitur Lanjutan MySQL
```

## ⏱️ Estimasi Waktu

| Bab | Estimasi |
| --- | -------- |
| Bab 14 | 45–60 menit |
| Bab 15 | 40–55 menit |
| Bab 16 | 50–70 menit |
| **Total Bagian V** | **± 135–185 menit** |

## ✅ Hasil yang Diharapkan

Setelah menyelesaikan bagian ini, Anda mampu:

- menjelaskan cara kerja index dan kapan index tidak dipakai;
- membuat composite index yang sesuai urutan query;
- membaca output `EXPLAIN` dan menemukan full table scan;
- memperbaiki pagination dengan keyset pagination;
- menulis transaksi checkout yang aman dari race condition dan deadlock.

::: tip 💡 Tips
Optimasi tanpa pengukuran hanyalah tebakan. Biasakan menjalankan `EXPLAIN` sebelum dan sesudah menambah index, lalu catat waktu eksekusinya.
:::
