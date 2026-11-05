---
title: "Bagian VI — Fitur Lanjutan MySQL"
---

# 🧰 BAGIAN VI — Fitur Lanjutan MySQL

> 🎯 **Tujuan Bagian Ini:**
> Mengenal fitur yang membuat MySQL lebih dari sekadar tempat menyimpan tabel:
> view, stored procedure, trigger, event, JSON, dan full-text search.

## 📚 Daftar Bab di Bagian Ini

| Bab | Topik | Status |
| --- | ----- | ------ |
| 17 | [View, Stored Procedure, Function, Trigger & Event](/bagian-6/bab-17) | ✅ Tersedia |
| 18 | [JSON, Full-Text Search & Fitur Modern](/bagian-6/bab-18) | ✅ Tersedia |

## 🗺️ Peta Konsep Bagian VI

```
Bab 17 — Logika di Database
   │  view, procedure, function, trigger, event scheduler
   ▼
Bab 18 — Fitur Modern
   │  JSON, generated column, full-text index, partisi
   ▼
Lanjut ke Bagian VII → Administrasi & Keamanan
```

## ⏱️ Estimasi Waktu

| Bab | Estimasi |
| --- | -------- |
| Bab 17 | 45–60 menit |
| Bab 18 | 40–55 menit |
| **Total Bagian VI** | **± 85–115 menit** |

## ✅ Hasil yang Diharapkan

Setelah menyelesaikan bagian ini, Anda mampu:

- membuat view untuk menyederhanakan laporan;
- menulis stored procedure dan function dengan `DELIMITER` yang benar;
- memakai trigger untuk audit log secara bijak;
- menyimpan dan mengindeks data JSON lewat generated column;
- memakai full-text index dan mengetahui batasannya.

::: warning ⚠️ Jangan Berlebihan
Semakin banyak logika bisnis dipindah ke database, semakin sulit di-debug dan di-version-control. Bab 17 membahas pedoman kapan logika sebaiknya tetap di aplikasi.
:::
