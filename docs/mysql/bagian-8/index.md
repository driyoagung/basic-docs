---
title: "Bagian VIII — Integrasi Aplikasi & Sekilas PostgreSQL"
---

# 🌐 BAGIAN VIII — Integrasi Aplikasi & Sekilas PostgreSQL

> 🎯 **Tujuan Bagian Ini:**
> Menghubungkan MySQL ke aplikasi dengan aman dan efisien,
> lalu melihat posisi MySQL dibanding PostgreSQL dan database lain.

## 📚 Daftar Bab di Bagian Ini

| Bab | Topik | Status |
| --- | ----- | ------ |
| 21 | [Menghubungkan MySQL ke Aplikasi](/bagian-8/bab-21) | ✅ Tersedia |
| 22 | [Sekilas PostgreSQL & Pilihan Database Lain](/bagian-8/bab-22) | ✅ Tersedia |

## 🗺️ Peta Konsep Bagian VIII

```
Bab 21 — Integrasi Aplikasi
   │  driver, PDO, mysql2, connection pooling, ORM
   ▼
Bab 22 — PostgreSQL & Database Lain
   │  perbandingan, portabilitas, Redis, MongoDB, Elasticsearch
   ▼
Lanjut ke Bagian IX → Project
```

## ⏱️ Estimasi Waktu

| Bab | Estimasi |
| --- | -------- |
| Bab 21 | 45–60 menit |
| Bab 22 | 30–45 menit |
| **Total Bagian VIII** | **± 75–105 menit** |

## ✅ Hasil yang Diharapkan

Setelah menyelesaikan bagian ini, Anda mampu:

- menghubungkan aplikasi PHP/Node.js ke MySQL dengan aman;
- membedakan ORM, query builder, dan raw SQL;
- membaca query log ORM untuk mendeteksi N+1;
- menjelaskan perbedaan utama MySQL dan PostgreSQL;
- memilih database tambahan sesuai kebutuhan.

::: tip 💡 Tips
Setelah membaca Bab 21, buka aplikasi Laravel atau Node.js Anda dan aktifkan query log. Sering kali ada N+1 yang tidak terlihat sampai datanya bertambah.
:::
