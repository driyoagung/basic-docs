---
title: "Bab 7 — Shared Data"
---

# 📖 Bab 7 — Shared Data

Hampir setiap halaman butuh data yang sama: user yang login, pesan flash, daftar permission. Menyalinnya di setiap controller jelas tidak masuk akal. Inertia menyediakan **shared data** lewat middleware `HandleInertiaRequests` — dikirim sekali, tersedia di semua halaman. Bab ini membahas cara mendefinisikannya dengan benar, kenapa closure penting, dan cara merapikan aksesnya dengan hook.

---

## 7.1 🌐 `HandleInertiaRequests`

Middleware ini berjalan di setiap request dan menambahkan props global.

```php
// app/Http/Middleware/HandleInertiaRequests.php
namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),

            'auth' => [
                'user' => $request->user()
                    ? $request->user()->only('id', 'name', 'email')
                    : null,
            ],

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
```

| Bagian | Fungsi |
|---|---|
| `rootView` | Blade root (`resources/views/app.blade.php`) |
| `version()` | Versi aset untuk asset versioning (Bab 3) |
| `share()` | Data global yang dikirim ke semua halaman |

Di React, akses lewat `usePage()`:

```jsx
import { usePage } from '@inertiajs/react'

const { auth, flash } = usePage().props
```

---

## 7.2 ⚡ Lazy Evaluation dengan Closure

Perhatikan perbedaan berikut:

```php
// ❌ Selalu dievaluasi — query jalan di setiap request
'flash' => [
    'success' => $request->session()->get('success'),
],

// ✅ Dievaluasi hanya saat props diserialisasi
'flash' => [
    'success' => fn () => $request->session()->get('success'),
],
```

Mengapa penting?

- Props dikirim ke **setiap** halaman. Query berat di `share()` memperlambat semuanya.
- Dengan closure, nilai baru dihitung saat page object dibuat — dan bisa dilewati pada **partial reload** (Bab 8).
- Closure juga berguna untuk data yang hanya dibutuhkan sebagian halaman.

```php
'notifikasi' => fn () => $request->user()
    ? $request->user()->unreadNotifications()->count()
    : 0,
```

| Tanpa closure | Dengan closure |
|---|---|
| Dihitung selalu, bahkan bila tidak dipakai | Dihitung saat dibutuhkan |
| Sulit di-skip pada partial reload | Bisa di-skip |
| Query berat membebani semua halaman | Beban terkendali |

> 💡 **Aturan:** apa pun yang menyentuh database atau session sebaiknya dibungkus closure di `share()`.

---

## 7.3 🧭 Apa yang Layak Di-share

| Layak | Tidak layak |
|---|---|
| `auth.user` (id, name, email) | Password, token, data sensitif |
| `flash.success` / `flash.error` | Seluruh isi session |
| Daftar permission & role | Semua data user lain |
| Pengaturan aplikasi ringan | Data besar yang hanya dipakai satu halaman |
| Jumlah notifikasi belum dibaca | Daftar notifikasi lengkap (pakai props halaman) |

```text
Shared data = konteks global aplikasi
Props halaman = data spesifik halaman
```

Mencampur keduanya membuat payload membengkak dan sulit dilacak.

---

## 7.4 🪝 Hook `useAuth()`

Akses `usePage().props.auth` berulang kali cepat melelahkan. Bungkus dalam hook:

```jsx
// resources/js/hooks/useAuth.js
import { usePage } from '@inertiajs/react'

export function useAuth() {
  const { auth } = usePage().props

  return {
    user: auth?.user ?? null,
    isLoggedIn: Boolean(auth?.user),
    hasRole: (role) => auth?.user?.roles?.includes(role) ?? false,
    can: (permission) =>
      auth?.user?.permissions?.includes(permission) ?? false,
  }
}
```

Pemakaian:

```jsx
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, isLoggedIn } = useAuth()

  return (
    <nav>
      {isLoggedIn ? <span>Halo, {user.name}</span> : <a href="/login">Masuk</a>}
    </nav>
  )
}
```

| Keuntungan hook | Penjelasan |
|---|---|
| Satu sumber logika | Perubahan bentuk `auth` cukup diubah di satu tempat |
| API lebih jelas | `can('delete products')` vs `auth.user.permissions.includes(...)` |
| Mudah di-test | Hook bisa dimock (Bab 20) |

> ⚠️ **Hook hanya untuk tampilan.** `can()` di frontend tidak menggantikan Policy/middleware di Laravel (Bab 16).

---

## 7.5 🎬 Studi Kasus: Navbar + Toast Flash

**Backend** — flash message dikirim dari controller:

```php
return redirect()->route('products.index')
    ->with('success', 'Produk berhasil disimpan!');
```

**Middleware** — share flash:

```php
'flash' => [
    'success' => fn () => $request->session()->get('success'),
    'error'   => fn () => $request->session()->get('error'),
],
```

**Frontend** — komponen toast:

```jsx
// resources/js/Components/FlashToast.jsx
import { useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'

export default function FlashToast() {
  const { flash } = usePage().props
  const [pesan, setPesan] = useState(null)

  useEffect(() => {
    if (flash?.success) {
      setPesan({ tipe: 'success', teks: flash.success })
    } else if (flash?.error) {
      setPesan({ tipe: 'error', teks: flash.error })
    }
  }, [flash])

  useEffect(() => {
    if (!pesan) return
    const timer = setTimeout(() => setPesan(null), 4000)
    return () => clearTimeout(timer)
  }, [pesan])

  if (!pesan) return null

  return (
    <div
      role="status"
      className={
        'fixed bottom-4 right-4 rounded-lg px-4 py-3 text-white shadow-lg ' +
        (pesan.tipe === 'success' ? 'bg-green-600' : 'bg-red-600')
      }
    >
      {pesan.teks}
    </div>
  )
}
```

Pasang di layout agar tersedia di semua halaman:

```jsx
// Layouts/AppLayout.jsx
import FlashToast from '@/Components/FlashToast'

export default function AppLayout({ children }) {
  return (
    <div>
      <nav>{/* ... */}</nav>
      <main>{children}</main>
      <FlashToast />
    </div>
  )
}
```

**Navbar dengan nama user:**

```jsx
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, isLoggedIn } = useAuth()

  return (
    <header className="flex items-center p-4 bg-white shadow">
      <span className="font-bold">Toko</span>
      <div className="ml-auto">
        {isLoggedIn ? `Halo, ${user.name}` : 'Tamu'}
      </div>
    </header>
  )
}
```

Alur lengkapnya:

```text
Controller → redirect()->with('success', ...)
                    │
                    ▼
HandleInertiaRequests@share (closure)
                    │
                    ▼
props.flash.success
                    │
                    ▼
<FlashToast> → tampil 4 detik → hilang
```

---

## 7.6 🧪 Debug Shared Data

Buka DevTools → Elements → `#app` → atribut `data-page`. Di sana terlihat seluruh page object, termasuk `auth` dan `flash`.

```json
{
  "component": "Products/Index",
  "props": {
    "auth": { "user": { "id": 1, "name": "Budi" } },
    "flash": { "success": "Produk berhasil disimpan!" }
  }
}
```

Jika `auth` bernilai `null` padahal sudah login, periksa:

1. Middleware sudah terdaftar di `bootstrap/app.php`.
2. `$request->user()` tidak `null` (session aktif).
3. Props tidak ditimpa oleh controller dengan key yang sama.

---

## ✅ Checklist Bab 7

- **`HandleInertiaRequests`** — sumber shared data untuk semua halaman.
- **`share()`** — kembalikan `auth`, `flash`, dan konteks global lain.
- **Closure** — bungkus query/session agar dievaluasi lazy.
- **Layak di-share** — auth ringkas, flash, permission, pengaturan kecil.
- **Tidak layak** — data sensitif, data besar, isi session mentah.
- **`useAuth()`** — merapikan akses user, role, dan permission.
- **Flash + Toast** — pola standar umpan balik setelah redirect.
- **Debug** — periksa `data-page` di DevTools.

---

⏭️ Lanjut ke [⚡ Bab 8 — Props Lanjutan (Inertia v2)](/bagian-3/bab-8) untuk melanjutkan!
