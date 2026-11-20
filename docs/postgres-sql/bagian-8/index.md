---
title: "Bagian 8 — Administrasi & Keamanan"
---

# 🛡️ Bagian 8 — Administrasi & Keamanan

> 🎯 **Tujuan Bagian:** menjalankan PostgreSQL dengan hak akses minimal dan rencana pemulihan yang teruji.

## 📖 Bab di Bagian Ini

| Bab | Judul | Fokus |
|---|---|---|
| **Bab 22** | [Role, Hak Akses & Keamanan](/bagian-8/bab-22) | Role, `GRANT`, `pg_hba.conf`, RLS, SQL injection |
| **Bab 23** | [Backup, Restore, Replikasi & Pemeliharaan](/bagian-8/bab-23) | `pg_dump`, PITR, replikasi, VACUUM, monitoring |

## ✅ Setelah Bagian Ini Anda Bisa

- Membuat role aplikasi dengan least privilege
- Mengatur autentikasi dan akses jaringan
- Menerapkan Row-Level Security untuk multi-tenant
- Membuat backup dan membuktikan restore berhasil
- Memahami replikasi, PITR, dan pemeliharaan rutin

## 🧭 Urutan Belajar

```
Bab 22  →  Bab 23
```

::: tip 💡 Tips
Backup belum selesai sampai Anda berhasil melakukan restore. Jadwalkan uji restore, bukan hanya backup.
:::
