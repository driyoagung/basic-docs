# ⚛️ Ebook Laravel + Inertia.js + React
### Bangun Aplikasi Full Stack Modern Tanpa Membuat REST API Terpisah

---

> 🎯 **Untuk Siapa Ebook Ini?**
> Developer yang sudah paham dasar **Laravel** (routing, controller, Eloquent)
> dan dasar **React** (component, props, state, hooks), lalu ingin menggabungkan
> keduanya dalam satu project tanpa harus membangun REST API terpisah.

---

> 💡 **Asumsi yang Dipakai di Struktur Ini**
> - Laravel **11** + PHP 8.2
> - Inertia.js **v2** + React **18**
> - Contoh kode memakai **JSX** (sama seperti ebook React Anda). Jika ingin TypeScript, cukup ganti ekstensi ke `.tsx` dan tambahkan tipe pada props
> - Project akhir: **Dashboard Manajemen Produk dengan Auth + RBAC** (nyambung dengan modul Spatie yang sudah Anda punya)
>
> Jika asumsi ini berbeda dari rencana Anda, struktur mudah disesuaikan.

---

## 🤔 Apa itu Inertia.js? (Gambaran Singkat)

```
ARSITEKTUR TRADISIONAL (SPA + REST API):
React (project terpisah)  ←── JSON ──→  Laravel API (project terpisah)
  - Routing di React Router               - Routing di routes/api.php
  - Auth via token                         - Resource, CORS, Sanctum
  - Dua repo, dua deploy                   - Dua kali kerja untuk satu fitur

ARSITEKTUR INERTIA (Monolith Modern):
┌────────────────────────────────────────────┐
│  SATU PROJECT LARAVEL                      │
│  Routing  → routes/web.php (Laravel)       │
│  Controller → return Inertia::render(...)  │
│  Tampilan → komponen React di Pages/       │
│  Auth     → session Laravel biasa          │
└────────────────────────────────────────────┘
```

> 💡 **Analogi:**
> Inertia adalah **lem** antara Laravel dan React. Controller Laravel tetap
> mengatur routing dan data, tetapi tampilannya dirender oleh komponen React.
> Hasilnya terasa seperti SPA (pindah halaman tanpa reload penuh), tetapi
> Anda tidak perlu membuat API, CORS, atau token auth.

---

## 🔄 Inertia React vs Inertia Vue — Apa yang Berbeda?

> Sisi **Laravel (backend) 100% sama**. Perbedaan hanya di sisi frontend.

| Aspek | Inertia + React | Inertia + Vue |
|---|---|---|
| **Package** | `@inertiajs/react` | `@inertiajs/vue3` |
| **Bahasa template** | JSX | `<template>` SFC |
| **Props halaman** | Parameter fungsi komponen | `defineProps()` |
| **Akses shared data** | `usePage().props` | `usePage().props` |
| **Form state** | `const { data, setData } = useForm({...})` | `const form = useForm({...})` |
| **Ubah field form** | `setData('name', value)` | `v-model="form.name"` |
| **Persistent layout** | `Page.layout = page => <Layout>{page}</Layout>` | `defineOptions({ layout: Layout })` |
| **Link** | `<Link href="/x">` | `<Link href="/x">` |
| **Head/SEO** | `<Head title="..." />` | `<Head title="..." />` |
| **Entry file** | `app.jsx` + `createRoot` | `app.js` + `createApp` |
| **Starter kit** | Breeze React | Breeze Vue |
| **Backend (Laravel)** | ✅ Identik | ✅ Identik |

> ⚠️ **Perbedaan terbesar bagi pemula:**
> Di React, state form bersifat **immutable** (pakai `setData`), sedangkan di Vue
> form bersifat **reactive** (langsung ubah `form.name`). Selain itu, hampir
> semua konsep Inertia sama persis.

---

## 🧰 Tech Stack

| Tool | Fungsi |
|---|---|
| **Laravel 11** | Backend, routing, Eloquent, auth |
| **Inertia.js v2** | Jembatan Laravel ↔ React |
| **React 18** | UI |
| **Vite** | Build tool (bawaan Laravel) |
| **Ziggy** | Helper `route()` di JavaScript |
| **Tailwind CSS** | Styling |
| **Laravel Breeze** | Starter kit auth + Inertia React |
| **Spatie Permission** | Role & permission (untuk RBAC) |
| **Pest** | Testing backend |

---

## 🗺️ Peta Perjalanan Belajar

```
🟢 BAGIAN I    Fondasi Inertia                    → Bab 1  – 3
🔵 BAGIAN II   Pages, Navigasi & Layout           → Bab 4  – 6
🟡 BAGIAN III  Data Sharing & Props               → Bab 7  – 8
🟠 BAGIAN IV   Form, Validasi & Upload            → Bab 9  – 11
🔴 BAGIAN V    CRUD & Data Table                  → Bab 12 – 14
🟣 BAGIAN VI   Autentikasi & Otorisasi (RBAC)     → Bab 15 – 16
⚫ BAGIAN VII  Lanjutan: Error, SSR, Performa, Test → Bab 17 – 20
🏆 BAGIAN VIII Project & Deployment               → Bab 21 – 22
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 8 Bagian | 22 Bab
```

---

## ⭐ Bab Paling Kritis

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 3** — Cara Kerja Inertia | Memahami alur request membuat semua fitur lain masuk akal |
| 🥈 | **Bab 9** — useForm & Validasi | Hampir semua interaksi user lewat form |
| 🥉 | **Bab 7** — Shared Data | Cara kirim `auth`, `flash`, dan `permissions` ke semua halaman |

---

---

# 🟢 BAGIAN I — Fondasi Inertia

---

## 📖 Bab 1 — Mengenal Inertia.js

- 1.1 🤔 Masalah SPA + REST API yang dipecahkan Inertia
- 1.2 ⚖️ Inertia vs SPA murni vs Livewire vs Blade biasa
- 1.3 ✅ Kapan Inertia cocok, kapan tidak
- 1.4 🧩 Inertia bukan framework: ia adalah "adapter" Laravel ↔ React
- 1.5 🆕 Apa yang baru di Inertia v2

| Pendekatan | Kelebihan | Kekurangan |
|---|---|---|
| **Blade biasa** | Sederhana, SEO mudah | Interaktivitas terbatas |
| **Livewire** | Full PHP, tanpa JS | Kurang cocok bila tim sudah kuat di React |
| **Inertia + React** | UI kaya, ekosistem React, tanpa API | Perlu paham React |
| **SPA + REST API** | Frontend & backend terpisah total | Dua project, CORS, token auth |

---

## 📖 Bab 2 — Setup Project

### 2.1 🚀 Cara Tercepat: Laravel Breeze + React

```bash
laravel new toko-inertia
cd toko-inertia

composer require laravel/breeze --dev
php artisan breeze:install react
# Pilihan: dark mode, testing framework (Pest), dst.

php artisan migrate
npm install
npm run dev
php artisan serve
```

### 2.2 🗂️ Anatomi Folder Project

```
toko-inertia/
├── app/
│   ├── Http/
│   │   ├── Controllers/        ← Controller (return Inertia::render)
│   │   └── Middleware/
│   │       └── HandleInertiaRequests.php   ← ⭐ Shared data
│   └── Models/
├── resources/
│   ├── css/app.css
│   ├── js/
│   │   ├── app.jsx             ← ⭐ Entry point Inertia
│   │   ├── Pages/              ← ⭐ Satu file = satu halaman
│   │   │   ├── Dashboard.jsx
│   │   │   └── Products/
│   │   │       ├── Index.jsx
│   │   │       ├── Create.jsx
│   │   │       └── Edit.jsx
│   │   ├── Layouts/            ← Layout bersama
│   │   └── Components/         ← Komponen reusable
│   └── views/
│       └── app.blade.php       ← ⭐ Root template (satu-satunya Blade)
├── routes/web.php
└── vite.config.js
```

### 2.3 📄 Tiga File Inti

```blade
{{-- resources/views/app.blade.php — satu-satunya file Blade yang dibutuhkan --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
```

```jsx
// resources/js/app.jsx — entry point
import './bootstrap'
import '../css/app.css'

import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'

createInertiaApp({
  title: (title) => `${title} - Toko`,

  // Cara Inertia menemukan komponen: 'Products/Index' → Pages/Products/Index.jsx
  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.jsx`,
      import.meta.glob('./Pages/**/*.jsx')
    ),

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },

  progress: { color: '#4B5563' }, // Progress bar saat pindah halaman
})
```

```php
// bootstrap/app.php (Laravel 11) — daftarkan middleware Inertia
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\HandleInertiaRequests::class,
    ]);
})
```

### 2.4 🔧 Ziggy — Helper `route()` di JavaScript

```jsx
import { route } from 'ziggy-js'  // atau global jika memakai @routes

route('products.index')                  // /products
route('products.edit', product.id)       // /products/5/edit
```

---

## 📖 Bab 3 — Cara Kerja Inertia (Wajib Paham!)

### 3.1 🔄 Alur Request Pertama vs Berikutnya

```
KUNJUNGAN PERTAMA (full page load):
Browser ── GET /products ──→ Laravel
Laravel  ── HTML lengkap (app.blade.php + data halaman di atribut data-page) ──→ Browser
React "bangun" di halaman itu

NAVIGASI BERIKUTNYA (klik <Link>):
Browser ── XHR GET /products/5  + header "X-Inertia: true" ──→ Laravel
Laravel  ── JSON { component: "Products/Show", props: {...}, url, version } ──→ Browser
React ganti komponen halaman — TANPA reload penuh
```

### 3.2 📦 "Page Object" — Inti Protokol Inertia

```json
{
  "component": "Products/Index",
  "props": {
    "products": { "data": [] },
    "filters": { "search": "" },
    "auth": { "user": { "name": "Budi" } }
  },
  "url": "/products?search=laptop",
  "version": "c32b8e4965f418ad16eaebba1d4e960f"
}
```

> 💡 **Props = data dari controller yang dikirim sebagai JSON,**
> lalu diterima komponen React sebagai props biasa.

### 3.3 🧠 Konsep Penting

- 3.3.1 Asset versioning: bila file JS berubah, Inertia otomatis reload penuh
- 3.3.2 Mengapa redirect setelah POST/PUT/DELETE itu wajib (kode 303)
- 3.3.3 Bagaimana validasi error Laravel otomatis menjadi `props.errors`
- 3.3.4 Apa yang **tidak** perlu Anda lakukan lagi: `fetch`, `axios`, `useEffect` untuk load data awal

---

---

# 🔵 BAGIAN II — Pages, Navigasi & Layout

---

## 📖 Bab 4 — Pages & Rendering

### 4.1 🎮 Controller → Page

```php
// app/Http/Controllers/ProductController.php
use Inertia\Inertia;

public function index()
{
    return Inertia::render('Products/Index', [
        'products' => Product::latest()->paginate(10),
    ]);
}
```

```jsx
// resources/js/Pages/Products/Index.jsx
import { Head } from '@inertiajs/react'

export default function Index({ products }) {
  return (
    <>
      <Head title="Produk" />
      <h1>Daftar Produk</h1>
      <ul>
        {products.data.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </>
  )
}
```

### 4.2 Sub-topik

- 4.2.1 Konvensi: nama komponen ↔ path file ↔ nama route
- 4.2.2 Mengirim data: model, collection, paginator, array
- 4.2.3 `Route::inertia('/about', 'About')` untuk halaman statis
- 4.2.4 Mengapa tidak boleh mengirim data sensitif ke props (semua props terlihat di browser!)
- 4.2.5 🎬 Studi kasus: mengubah halaman Blade lama menjadi halaman Inertia

---

## 📖 Bab 5 — Navigasi: Link & Router

### 5.1 🔗 Komponen `<Link>`

```jsx
import { Link } from '@inertiajs/react'

<Link href={route('products.index')}>Produk</Link>

// Dengan method lain (misal logout) — jangan pakai <a>
<Link href={route('logout')} method="post" as="button">Logout</Link>

// Prefetch saat di-hover (fitur v2)
<Link href={route('products.show', p.id)} prefetch>Detail</Link>
```

### 5.2 🧭 Programmatic: `router`

```jsx
import { router } from '@inertiajs/react'

router.get(route('products.index'), { search: 'laptop' })
router.post(route('products.store'), data)
router.delete(route('products.destroy', id))
router.reload({ only: ['products'] })   // partial reload
```

### 5.3 ⚙️ Opsi Penting

| Opsi | Fungsi |
|---|---|
| `preserveScroll` | Posisi scroll tidak lompat ke atas |
| `preserveState` | State komponen (misal isi input) tidak hilang |
| `replace` | Ganti history, bukan tambah |
| `only` | Hanya muat props tertentu (hemat) |
| `onSuccess` / `onError` / `onFinish` | Callback lifecycle |

### 5.4 Sub-topik

- 5.4.1 Kapan pakai `<Link>` vs `router.visit`
- 5.4.2 Active link: `usePage().url`
- 5.4.3 🎬 Studi kasus: navbar dengan menu aktif

---

## 📖 Bab 6 — Layout & Head

### 6.1 🖼️ Persistent Layout

```jsx
// Layouts/AppLayout.jsx
import { Link } from '@inertiajs/react'

export default function AppLayout({ children }) {
  return (
    <div>
      <nav>
        <Link href={route('dashboard')}>Dashboard</Link>
        <Link href={route('products.index')}>Produk</Link>
      </nav>
      <main>{children}</main>
    </div>
  )
}

// Pages/Products/Index.jsx
Index.layout = (page) => <AppLayout>{page}</AppLayout>
```

> 💡 **Mengapa "persistent"?**
> Layout tidak di-mount ulang saat pindah halaman, sehingga state di dalamnya
> (musik, sidebar terbuka, scroll) tetap terjaga.

### 6.2 Sub-topik

- 6.2.1 Layout biasa vs persistent layout
- 6.2.2 Nested layout (Dashboard layout di dalam App layout)
- 6.2.3 `<Head>`: title, meta description, Open Graph
- 6.2.4 Default layout lewat `createInertiaApp` (`resolve`)
- 6.2.5 🎬 Studi kasus: layout publik vs layout admin

---

---

# 🟡 BAGIAN III — Data Sharing & Props

---

## 📖 Bab 7 — Shared Data

### 7.1 🌐 `HandleInertiaRequests` — Data untuk Semua Halaman

```php
// app/Http/Middleware/HandleInertiaRequests.php
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
```

```jsx
// Di komponen mana pun
import { usePage } from '@inertiajs/react'

const { auth, flash } = usePage().props
```

### 7.2 Sub-topik

- 7.2.1 Lazy evaluation dengan closure `fn () =>` (kenapa penting untuk performa)
- 7.2.2 Apa yang layak dan tidak layak di-share
- 7.2.3 Membuat hook `useAuth()` untuk merapikan akses
- 7.2.4 🎬 Studi kasus: navbar yang menampilkan nama user + toast flash message

---

## 📖 Bab 8 — Props Lanjutan (Fitur Performa Inertia v2)

- 8.1 **Partial reloads** — `only` / `except`
- 8.2 **Optional props** — `Inertia::optional()` (hanya dimuat jika diminta)
- 8.3 **Deferred props** — muat data berat setelah halaman tampil

```php
return Inertia::render('Dashboard', [
    'user'  => $request->user(),
    'stats' => Inertia::defer(fn () => $this->hitungStatistikBerat()),
]);
```

```jsx
import { Deferred } from '@inertiajs/react'

<Deferred data="stats" fallback={<Skeleton />}>
  <StatsPanel />
</Deferred>
```

- 8.4 **Merge props** — menambah data ke list lama (infinite scroll / load more)
- 8.5 **`WhenVisible`** — muat data saat elemen terlihat di layar
- 8.6 **Polling** — `usePoll` untuk data yang di-refresh berkala
- 8.7 🎬 Studi kasus: dashboard statistik yang tampil cepat dengan skeleton

---

---

# 🟠 BAGIAN IV — Form, Validasi & Upload

---

## 📖 Bab 9 — `useForm` & Validasi

### 9.1 📝 Form Lengkap

```jsx
import { useForm } from '@inertiajs/react'

export default function Create() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    price: '',
  })

  function submit(e) {
    e.preventDefault()
    post(route('products.store'), {
      onSuccess: () => reset(),
    })
  }

  return (
    <form onSubmit={submit}>
      <input
        value={data.name}
        onChange={(e) => setData('name', e.target.value)}
      />
      {errors.name && <p className="text-red-600">{errors.name}</p>}

      <button disabled={processing}>
        {processing ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  )
}
```

```php
// Controller — validasi Laravel biasa
public function store(Request $request)
{
    $validated = $request->validate([
        'name'  => 'required|string|max:255',
        'price' => 'required|numeric|min:0',
    ]);

    Product::create($validated);

    return redirect()->route('products.index')
        ->with('success', 'Produk berhasil ditambahkan!');
}
```

> 💡 **Tidak ada kode penanganan error manual.**
> Jika validasi gagal, Laravel mengembalikan error dan Inertia otomatis
> mengisinya ke `errors` — tanpa `try/catch`, tanpa `fetch`.

### 9.2 Sub-topik

- 9.2.1 Anatomi return `useForm`: `data`, `setData`, `errors`, `processing`, `reset`, `clearErrors`, `isDirty`, `transform`
- 9.2.2 Form Request class untuk validasi terpisah
- 9.2.3 Error bag (beberapa form dalam satu halaman)
- 9.2.4 Komponen `<Form>` (alternatif v2 untuk form sederhana)
- 9.2.5 Mencegah double submit & konfirmasi sebelum keluar halaman (`isDirty`)
- 9.2.6 Komponen input reusable (`TextInput`, `InputError`)

---

## 📖 Bab 10 — Upload File

- 10.1 Mengirim file dengan `useForm` (otomatis `multipart/form-data`)
- 10.2 Progress upload: `progress.percentage`
- 10.3 Preview gambar sebelum upload (`URL.createObjectURL`)
- 10.4 ⚠️ Gotcha: upload dengan method PUT/PATCH → pakai `post` + `_method`
- 10.5 Validasi file di Laravel (`image`, `mimes`, `max`)
- 10.6 🎬 Studi kasus: upload foto produk dengan preview & progress bar

---

## 📖 Bab 11 — Flash Message, Toast & UX Form

- 11.1 Menampilkan flash `success` / `error` dari shared data
- 11.2 Komponen Toast yang menghilang otomatis (`useEffect` + `setTimeout`)
- 11.3 Konfirmasi hapus dengan modal (bukan `window.confirm`)
- 11.4 Loading state global dengan event Inertia (`router.on('start' | 'finish')`)
- 11.5 🎬 Studi kasus: sistem notifikasi toast untuk seluruh aplikasi

---

---

# 🔴 BAGIAN V — CRUD & Data Table

---

## 📖 Bab 12 — CRUD Lengkap

### 12.1 🛣️ Routing & Controller

```php
Route::middleware('auth')->group(function () {
    Route::resource('products', ProductController::class);
});
```

| Method controller | Halaman React |
|---|---|
| `index` | `Products/Index.jsx` |
| `create` | `Products/Create.jsx` |
| `edit` | `Products/Edit.jsx` |
| `store`, `update`, `destroy` | redirect + flash message |

### 12.2 🗑️ Hapus Data

```jsx
function hapus(id) {
  if (confirm('Yakin hapus?')) {
    router.delete(route('products.destroy', id), { preserveScroll: true })
  }
}
```

### 12.3 Sub-topik

- 12.3.1 Form Create & Edit dibagi dengan satu komponen `ProductForm`
- 12.3.2 Route Model Binding + Inertia
- 12.3.3 Redirect yang benar setelah store/update/destroy
- 12.3.4 🎬 Studi kasus: CRUD Produk end-to-end

---

## 📖 Bab 13 — Pagination, Search & Filter

```jsx
import { router } from '@inertiajs/react'
import { useState, useEffect } from 'react'

const [search, setSearch] = useState(filters.search ?? '')

useEffect(() => {
  const t = setTimeout(() => {
    router.get(
      route('products.index'),
      { search },
      { preserveState: true, replace: true }
    )
  }, 400) // debounce
  return () => clearTimeout(t)
}, [search])
```

```php
$products = Product::query()
    ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
    ->latest()
    ->paginate(10)
    ->withQueryString(); // pertahankan ?search= di link pagination
```

- 13.1 Komponen `Pagination` dari `links` milik paginator Laravel
- 13.2 Search dengan debounce + `preserveState`
- 13.3 Filter (kategori, status) & sorting kolom
- 13.4 State di URL: halaman bisa di-bookmark & dibagikan
- 13.5 Infinite scroll dengan merge props (v2)
- 13.6 🎬 Studi kasus: tabel produk dengan search, filter, sort, dan pagination

---

## 📖 Bab 14 — Membentuk Data: Eloquent Resource

- 14.1 Mengapa tidak mengirim model mentah ke props
- 14.2 `JsonResource` & `ResourceCollection` dengan Inertia
- 14.3 Menyembunyikan kolom sensitif (`password`, dll)
- 14.4 `whenLoaded()` & eager loading untuk hindari N+1
- 14.5 Mengirim `can` per baris (hak akses tiap item)
- 14.6 🎬 Studi kasus: `ProductResource` dengan relasi kategori & permission

---

---

# 🟣 BAGIAN VI — Autentikasi & Otorisasi

---

## 📖 Bab 15 — Autentikasi dengan Breeze

- 15.1 Apa saja yang dibuat Breeze (login, register, reset password, verify email, profil)
- 15.2 Membaca kode halaman auth bawaan (`Pages/Auth/*`)
- 15.3 Guest vs Auth layout
- 15.4 Middleware `auth`, `guest`, `verified`
- 15.5 Redirect setelah login & logout
- 15.6 Kustomisasi: menambah field saat register
- 15.7 Kenapa auth Inertia memakai **session**, bukan token (dan kapan baru perlu Sanctum)

---

## 📖 Bab 16 — Otorisasi & RBAC di Frontend

### 16.1 🔐 Kirim Permission via Shared Data

```php
// HandleInertiaRequests::share()
'auth' => [
    'user' => $request->user() ? [
        'id'          => $request->user()->id,
        'name'        => $request->user()->name,
        'roles'       => $request->user()->getRoleNames(),
        'permissions' => $request->user()->getAllPermissions()->pluck('name'),
    ] : null,
],
```

```jsx
// hooks/useCan.js
import { usePage } from '@inertiajs/react'

export function useCan() {
  const { auth } = usePage().props
  return (permission) => auth.user?.permissions.includes(permission) ?? false
}

// Pemakaian
const can = useCan()
{can('delete products') && <button onClick={...}>Hapus</button>}
```

> ⚠️ **Penting:** menyembunyikan tombol di React hanya soal **tampilan**.
> Keamanan sesungguhnya tetap di backend (middleware, Policy, Gate).
> Selalu lindungi route di Laravel, jangan hanya menyembunyikan UI.

### 16.2 Sub-topik

- 16.2.1 Spatie Permission + Inertia (menyambung modul RBAC yang sudah ada)
- 16.2.2 Policy di Laravel + `can` per item di Resource
- 16.2.3 Komponen `<Can permission="...">` untuk merapikan JSX
- 16.2.4 Proteksi route: middleware `permission:` / `role:`
- 16.2.5 Halaman 403 yang ramah
- 16.2.6 🎬 Studi kasus: menu sidebar dinamis sesuai role (Admin / Editor / Viewer)

---

---

# ⚫ BAGIAN VII — Lanjutan: Error, SSR, Performa & Testing

---

## 📖 Bab 17 — Error Handling

- 17.1 Halaman error kustom (403, 404, 419, 500) dengan Inertia
- 17.2 Menangani 419 (CSRF/session expired) dengan elegan
- 17.3 Event global: `router.on('invalid')` dan `router.on('exception')`
- 17.4 Error Boundary React untuk error render
- 17.5 Menyembunyikan stack trace di production
- 17.6 🎬 Studi kasus: halaman error dengan layout konsisten

---

## 📖 Bab 18 — SSR & SEO

- 18.1 Masalah: halaman Inertia default dirender di browser (SEO terbatas)
- 18.2 Apa itu SSR Inertia & kapan benar-benar dibutuhkan
- 18.3 Setup SSR (`ssr.jsx`, `npm run build`, `php artisan inertia:start-ssr`)
- 18.4 `<Head>` untuk meta tag & Open Graph
- 18.5 Alternatif: halaman publik pakai Blade, dashboard pakai Inertia
- 18.6 Deploy SSR (proses Node harus berjalan di server)

---

## 📖 Bab 19 — Performa & Optimasi

- 19.1 Code splitting per halaman (sudah otomatis lewat `import.meta.glob`)
- 19.2 Prefetching link (`prefetch`, strategi `hover` / `mount` / `click`)
- 19.3 Partial reload, deferred props, lazy props (rangkuman Bab 8)
- 19.4 Eager loading Eloquent agar tidak N+1
- 19.5 Mengurangi ukuran props (select kolom seperlunya)
- 19.6 Memoization React (`useMemo`, `React.memo`) — kapan perlu, kapan tidak
- 19.7 Cache di Laravel untuk data yang jarang berubah

---

## 📖 Bab 20 — Testing

### 20.1 🧪 Test Backend (Pest/PHPUnit)

```php
use Inertia\Testing\AssertableInertia as Assert;

it('menampilkan daftar produk', function () {
    $user = User::factory()->create();
    Product::factory()->count(3)->create();

    $this->actingAs($user)
        ->get(route('products.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Products/Index')
            ->has('products.data', 3)
        );
});
```

- 20.2 Test validasi & redirect form
- 20.3 Test otorisasi (user tanpa permission harus 403)
- 20.4 Test komponen React dengan Vitest + React Testing Library
- 20.5 Mock `usePage` dan `useForm` pada test komponen
- 20.6 Test end-to-end sederhana (Laravel Dusk / Playwright)

---

---

# 🏆 BAGIAN VIII — Project & Deployment

---

## 📖 Bab 21 — Project: Dashboard Manajemen Produk dengan RBAC

### 21.1 🎯 Fitur

| Modul | Fitur |
|---|---|
| **Auth** | Login, register, reset password (Breeze) |
| **Dashboard** | Statistik dengan deferred props + skeleton |
| **Produk** | CRUD + upload gambar + search + filter + pagination |
| **Kategori** | CRUD sederhana |
| **User & Role** | Admin mengatur role user (Spatie) |
| **RBAC** | Admin / Editor / Viewer dengan permission berbeda |
| **UX** | Toast, modal konfirmasi hapus, loading state |
| **Kualitas** | Test backend & penanganan error |

### 21.2 📁 Struktur Folder Akhir

```
resources/js/
├── app.jsx
├── Pages/
│   ├── Auth/
│   ├── Dashboard.jsx
│   ├── Products/        (Index, Create, Edit)
│   ├── Categories/
│   ├── Users/           (Index, Edit — khusus Admin)
│   └── Errors/          (403, 404, 500)
├── Layouts/
│   ├── AppLayout.jsx
│   └── GuestLayout.jsx
├── Components/
│   ├── ui/              (Button, TextInput, Modal, Toast)
│   ├── ProductForm.jsx
│   ├── Pagination.jsx
│   └── Can.jsx
└── hooks/
    ├── useAuth.js
    ├── useCan.js
    └── useDebounce.js
```

### 21.3 🚀 Urutan Build

```
Step 1 ─ Setup: Laravel + Breeze React + Spatie Permission
Step 2 ─ Database: migration, model, factory, seeder (role & permission)
Step 3 ─ Layout & navigasi (AppLayout, sidebar dinamis)
Step 4 ─ CRUD Kategori (latihan pola CRUD)
Step 5 ─ CRUD Produk + upload + search/filter/pagination
Step 6 ─ Shared data: auth, permissions, flash → Toast
Step 7 ─ RBAC: middleware, Policy, hook useCan, komponen <Can>
Step 8 ─ Dashboard statistik (deferred props)
Step 9 ─ Error pages + testing
Step 10 ─ Polish & deploy
```

---

## 📖 Bab 22 — Deployment

- 22.1 Build asset production (`npm run build`)
- 22.2 Konfigurasi `.env` production (`APP_ENV`, `APP_DEBUG=false`)
- 22.3 Optimasi Laravel: `config:cache`, `route:cache`, `view:cache`
- 22.4 Deploy ke VPS (Nginx + PHP-FPM) atau Laravel Forge
- 22.5 Menjalankan queue worker & SSR (jika dipakai) dengan Supervisor
- 22.6 ⚠️ Masalah umum: asset versioning, `APP_URL` salah, mixed content (HTTP vs HTTPS)
- 22.7 Checklist sebelum go-live

---

## 📊 Ringkasan Struktur Final

```
⚛️ EBOOK LARAVEL + INERTIA.JS + REACT
│
├── 🟢 BAGIAN I    — Fondasi Inertia                  Bab 1  – 3
├── 🔵 BAGIAN II   — Pages, Navigasi & Layout         Bab 4  – 6
├── 🟡 BAGIAN III  — Data Sharing & Props             Bab 7  – 8
├── 🟠 BAGIAN IV   — Form, Validasi & Upload          Bab 9  – 11
├── 🔴 BAGIAN V    — CRUD & Data Table                Bab 12 – 14
├── 🟣 BAGIAN VI   — Autentikasi & Otorisasi (RBAC)   Bab 15 – 16
├── ⚫ BAGIAN VII  — Error, SSR, Performa, Testing    Bab 17 – 20
└── 🏆 BAGIAN VIII — Project & Deployment             Bab 21 – 22

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total   :  8 Bagian  |  22 Bab
Prasyarat: Dasar Laravel + Dasar React
Stack   :  Laravel 11 · Inertia v2 · React 18 · Vite · Tailwind
Project :  Dashboard Manajemen Produk + RBAC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

*Ebook Laravel + Inertia.js + React*
