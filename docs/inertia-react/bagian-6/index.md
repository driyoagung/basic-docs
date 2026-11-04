---
title: "Bagian VI — Autentikasi & Otorisasi"
---

# 🟣 BAGIAN VI — Autentikasi & Otorisasi

> 🎯 **Tujuan Bagian Ini:**
> Memakai auth session Laravel lewat Breeze, lalu mengirim role & permission ke React untuk UI yang sadar hak akses — tanpa mengorbankan keamanan backend.

## 📚 Daftar Bab di Bagian Ini

| Bab | Topik | Status |
| --- | ----- | ------ |
| 15 | [Autentikasi dengan Breeze](/bagian-6/bab-15) | ✅ Tersedia |
| 16 | [Otorisasi & RBAC di Frontend](/bagian-6/bab-16) | ✅ Tersedia |

## 🗺️ Peta Konsep Bagian VI

```
Bab 15 — Autentikasi Breeze
   │  (login, register, middleware auth/guest/verified)
   ▼
Bab 16 — RBAC di Frontend
   │  (Spatie, permissions shared, useCan, <Can>, Policy)
   ▼
Lanjut ke Bagian VII → Error, SSR, Performa & Testing
```

## ⏱️ Estimasi Waktu

| Bab | Estimasi |
| --- | -------- |
| Bab 15 | 45–60 menit |
| Bab 16 | 50–70 menit |
| **Total Bagian VI** | **± 95–130 menit** |

::: danger 🚨 Ingat
Menyembunyikan tombol di React **bukan** keamanan. Selalu lindungi route dan aksi di Laravel dengan middleware, Gate, atau Policy.
:::
