---
title: "Bagian III — Data Sharing & Props"
---

# 🟡 BAGIAN III — Data Sharing & Props

> 🎯 **Tujuan Bagian Ini:**
> Mengirim data yang dibutuhkan semua halaman (`auth`, `flash`, `permissions`) dan memakai fitur props Inertia v2 untuk performa.

## 📚 Daftar Bab di Bagian Ini

| Bab | Topik | Status |
| --- | ----- | ------ |
| 7 | [Shared Data](/bagian-3/bab-7) | ✅ Tersedia |
| 8 | [Props Lanjutan (Inertia v2)](/bagian-3/bab-8) | ✅ Tersedia |

## 🗺️ Peta Konsep Bagian III

```
Bab 7 — Shared Data
   │  (HandleInertiaRequests, closure lazy, useAuth)
   ▼
Bab 8 — Props Lanjutan
   │  (partial reload, optional, deferred, merge, WhenVisible, polling)
   ▼
Lanjut ke Bagian IV → Form, Validasi & Upload
```

## ⏱️ Estimasi Waktu

| Bab | Estimasi |
| --- | -------- |
| Bab 7 | 40–55 menit |
| Bab 8 | 45–60 menit |
| **Total Bagian III** | **± 85–115 menit** |

::: tip 💡 Tips
Shared data adalah fondasi navbar, toast, dan RBAC. Pastikan Anda paham mengapa `auth` dan `flash` dikirim lewat closure sebelum lanjut ke Bab 8.
:::
