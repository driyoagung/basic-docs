---
title: "Bagian II — SQL Dasar"
---

# 📜 BAGIAN II — SQL Dasar

> 🎯 **Tujuan Bagian Ini:**
> Menguasai perintah SQL yang paling sering dipakai: membuat tabel,
> mengisi data, membaca data, memperbarui, menghapus, memfilter, dan mengurutkan.

## 📚 Daftar Bab di Bagian Ini

| Bab | Topik | Status |
| --- | ----- | ------ |
| 5 | [DDL: Membuat Database & Tabel](/bagian-2/bab-5) | ✅ Tersedia |
| 6 | [CRUD: INSERT, SELECT, UPDATE, DELETE](/bagian-2/bab-6) | ✅ Tersedia |
| 7 | [Filtering, Sorting & Fungsi](/bagian-2/bab-7) | ✅ Tersedia |

## 🗺️ Peta Konsep Bagian II

```
Bab 5 — DDL
   │  CREATE DATABASE, CREATE TABLE, tipe data, ALTER
   ▼
Bab 6 — CRUD
   │  INSERT → SELECT → UPDATE → DELETE
   ▼
Bab 7 — Filtering, Sorting & Fungsi
   │  WHERE, ORDER BY, LIMIT, fungsi string/angka/tanggal
   ▼
Lanjut ke Bagian III → Relasi & Query Lanjutan
```

## ⏱️ Estimasi Waktu

| Bab | Estimasi |
| --- | -------- |
| Bab 5 | 35–50 menit |
| Bab 6 | 30–45 menit |
| Bab 7 | 35–50 menit |
| **Total Bagian II** | **± 100–145 menit** |

## ✅ Hasil yang Diharapkan

Setelah menyelesaikan bagian ini, Anda mampu:

- membuat database dan tabel dengan tipe data yang tepat;
- membedakan `DECIMAL` dan `FLOAT` untuk uang;
- melakukan CRUD tanpa merusak data;
- memfilter dan mengurutkan data dengan `WHERE`, `ORDER BY`, dan `LIMIT`;
- memakai fungsi bawaan MySQL untuk kebutuhan sehari-hari.

::: warning ⚠️ Kebiasaan Penting
Selalu tulis `WHERE` sebelum menjalankan `UPDATE` atau `DELETE`. Di Bab 6 ada pola aman untuk menguji query sebelum benar-benar mengubah data.
:::
