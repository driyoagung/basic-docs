---
title: "Bagian VII — Administrasi & Keamanan"
---

# 🛡️ BAGIAN VII — Administrasi & Keamanan

> 🎯 **Tujuan Bagian Ini:**
> Menjalankan MySQL dengan aman di production: hak akses minimal,
> perlindungan dari SQL injection, backup yang teruji, dan migrasi skema.

## 📚 Daftar Bab di Bagian Ini

| Bab | Topik | Status |
| --- | ----- | ------ |
| 19 | [User, Privilege & Keamanan](/bagian-7/bab-19) | ✅ Tersedia |
| 20 | [Backup, Restore & Migrasi](/bagian-7/bab-20) | ✅ Tersedia |

## 🗺️ Peta Konsep Bagian VII

```
Bab 19 — User, Privilege & Keamanan
   │  least privilege, role, prepared statement, TLS
   ▼
Bab 20 — Backup, Restore & Migrasi
   │  mysqldump, retensi, uji restore, replication
   ▼
Lanjut ke Bagian VIII → Integrasi Aplikasi
```

## ⏱️ Estimasi Waktu

| Bab | Estimasi |
| --- | -------- |
| Bab 19 | 40–55 menit |
| Bab 20 | 40–55 menit |
| **Total Bagian VII** | **± 80–110 menit** |

## ✅ Hasil yang Diharapkan

Setelah menyelesaikan bagian ini, Anda mampu:

- membuat user aplikasi dengan hak akses terbatas;
- menjelaskan mengapa aplikasi tidak boleh memakai `root`;
- mencegah SQL injection dengan prepared statement;
- membuat jadwal backup dan membuktikan restore berhasil;
- mengelola perubahan skema lewat migration.

::: warning ⚠️ Backup Belum Selesai Sampai Diuji
Backup yang belum pernah direstore hanyalah harapan. Selalu uji restore ke database terpisah secara berkala.
:::
