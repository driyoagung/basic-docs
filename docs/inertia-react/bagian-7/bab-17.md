---
title: "Bab 17 — Error Handling"
---

# 📖 Bab 17 — Error Handling

Error di aplikasi Inertia datang dari dua arah: **server** (404, 403, 419, 500) dan **client** (komponen gagal render). Keduanya bisa ditangani dengan rapi tanpa menampilkan halaman putih atau stack trace ke user. Bab ini membahas halaman error Inertia, penanganan 419, event global, dan Error Boundary React.

---

## 17.1 🗂️ Halaman Error Kustom

Laravel memetakan exception ke view `resources/views/errors/{kode}.blade.php`. Untuk Inertia, render komponen React.

**Cara 1 — Blade yang me-render Inertia:**

```blade
{{-- resources/views/errors/404.blade.php --}}
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @routes
    @vite(['resources/js/app.jsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
```

**Cara 2 — handler exception (lebih fleksibel):**

```php
// bootstrap/app.php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->respond(function (Response $response) {
        if (in_array($response->getStatusCode(), [403, 404, 419, 500])) {
            return Inertia::render('Errors/Error', [
                'status' => $response->getStatusCode(),
            ])->toResponse(request())->setStatusCode($response->getStatusCode());
        }

        return $response;
    });
})
```

**Komponen:**

```jsx
// resources/js/Pages/Errors/Error.jsx
import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'

const PESAN = {
  403: ['Akses Ditolak', 'Anda tidak memiliki izin membuka halaman ini.'],
  404: ['Halaman Tidak Ditemukan', 'Alamat yang Anda buka tidak tersedia.'],
  419: ['Sesi Berakhir', 'Halaman kedaluwarsa. Silakan muat ulang.'],
  500: ['Terjadi Kesalahan', 'Server mengalami masalah. Coba lagi nanti.'],
}

export default function Error({ status }) {
  const [judul, pesan] = PESAN[status] ?? PESAN[500]

  return (
    <AppLayout>
      <Head title={`${status} — ${judul}`} />
      <div className="py-20 text-center">
        <p className="text-6xl font-black text-gray-300">{status}</p>
        <h1 className="mt-4 text-2xl font-bold">{judul}</h1>
        <p className="mt-2 text-gray-600">{pesan}</p>
        <Link href={route('dashboard')} className="mt-6 inline-block text-purple-600">
          Kembali ke Dashboard
        </Link>
      </div>
    </AppLayout>
  )
}
```

| Kode | Penyebab umum |
|---|---|
| 403 | Policy/middleware menolak |
| 404 | Route/model tidak ditemukan |
| 419 | CSRF token/sesi kedaluwarsa |
| 500 | Exception tak tertangani |

---

## 17.2 ⏰ Menangani 419 dengan Elegan

419 terjadi saat sesi kedaluwarsa atau CSRF token tidak cocok — sering ketika user membiarkan tab lama terbuka.

**Di server:** pesan yang jelas, bukan halaman default.

```php
if ($response->getStatusCode() === 419) {
    return Inertia::render('Errors/Error', ['status' => 419])
        ->toResponse(request())
        ->setStatusCode(419);
}
```

**Di client:** tawarkan muat ulang.

```jsx
{status === 419 && (
  <button onClick={() => window.location.reload()}>
    Muat Ulang Halaman
  </button>
)}
```

> 💡 **Perpanjang sesi** di `config/session.php` (`lifetime`) bila user sering kehilangan pekerjaan. Tetap tangani 419 — sesi bisa habis kapan saja.

---

## 17.3 🛰️ Event Global Inertia

```jsx
// app.jsx atau komponen global
import { router } from '@inertiajs/react'

router.on('invalid', (event) => {
  // Response bukan Inertia (mis. redirect ke domain lain)
  console.warn('Response Inertia tidak valid:', event.detail)
})

router.on('exception', (event) => {
  console.error('Exception Inertia:', event.detail.exception)
})

router.on('error', (errors) => {
  console.error('Validasi gagal:', errors)
})
```

| Event | Kapan |
|---|---|
| `invalid` | Response bukan page object (biasanya redirect eksternal) |
| `exception` | Error saat request |
| `error` | Error validasi (422) |
| `finish` | Request selesai apa pun hasilnya |

Contoh penanganan `invalid` — redirect penuh ke lokasi baru:

```jsx
router.on('invalid', (event) => {
  event.preventDefault()
  if (event.detail.response.status === 409) {
    window.location.href = event.detail.response.headers['x-inertia-location']
  }
})
```

---

## 17.4 🧯 Error Boundary React

Error saat **render** komponen tidak tertangkap Laravel. Gunakan Error Boundary.

```jsx
// resources/js/Components/ErrorBoundary.jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">Terjadi kesalahan tampilan</h2>
          <p className="mt-2 text-gray-600">Coba muat ulang halaman.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-purple-600 px-4 py-2 text-white"
          >
            Muat Ulang
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

Pasang di layout:

```jsx
import ErrorBoundary from '@/Components/ErrorBoundary'

export default function AppLayout({ children }) {
  return (
    <div>
      <nav>{/* ... */}</nav>
      <main>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  )
}
```

> ⚠️ **Error Boundary hanya menangkap error render/lifecycle.** Error di event handler dan kode async tetap perlu `try/catch`.

---

## 17.5 🔒 Menyembunyikan Stack Trace di Produksi

```ini
# .env production
APP_ENV=production
APP_DEBUG=false
```

```php
// config/app.php
'debug' => (bool) env('APP_DEBUG', false),
```

| `APP_DEBUG` | Perilaku |
|---|---|
| `true` (lokal) | Stack trace lengkap, halaman Ignition |
| `false` (produksi) | Halaman error generik, detail masuk log |

> 🚨 **`APP_DEBUG=true` di produksi membocorkan path, query, dan environment.** Periksa dua kali saat deploy (Bab 22).

---

## 17.6 🎬 Studi Kasus: Halaman Error Konsisten

Tujuan: semua error memakai layout aplikasi sehingga user tetap bisa navigasi.

```text
Exception di Laravel
   │
   ▼
withExceptions → Inertia::render('Errors/Error', status)
   │
   ▼
Error.jsx + AppLayout
   │
   ├─ 403 → "Akses Ditolak"
   ├─ 404 → "Tidak Ditemukan"
   ├─ 419 → tombol muat ulang
   └─ 500 → "Terjadi Kesalahan"
```

**Uji cepat:**

```bash
# 404
curl -I http://127.0.0.1:8000/halaman-tidak-ada

# 419 (buka form lama, hapus cookie, submit)
# 403 (akses route admin sebagai viewer)
# 500 (lempar exception sementara di route)
```

| Uji | Harapan |
|---|---|
| 404 | Halaman error dengan navbar |
| 403 | Pesan izin, bukan stack trace |
| 419 | Tombol muat ulang |
| 500 | Pesan umum, detail di log |

---

## ✅ Checklist Bab 17

- **Halaman error** — 403, 404, 419, 500 memakai komponen Inertia.
- **Handler exception** — `withExceptions` memetakan status ke halaman.
- **419** — pesan jelas + tombol muat ulang.
- **Event global** — `invalid`, `exception`, `error`, `finish`.
- **Error Boundary** — menangkap error render React.
- **Produksi** — `APP_DEBUG=false`, detail hanya di log.
- **Konsistensi** — error tetap memakai layout aplikasi.

---

⏭️ Lanjut ke [🌐 Bab 18 — SSR & SEO](/bagian-7/bab-18) untuk melanjutkan!
