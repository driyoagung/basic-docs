---
title: "Bab 4 — Pages & Rendering"
---

# 📖 Bab 4 — Pages & Rendering

Halaman Inertia adalah komponen React biasa yang menerima props dari controller. Tidak ada `useEffect` untuk memuat data awal, tidak ada state loading untuk fetch pertama — data sudah ada saat komponen dirender. Bab ini membahas konvensi penamaan, jenis data yang boleh dikirim, halaman statis, dan batas keamanan props.

---

## 4.1 🎮 Controller → Page

Alur paling dasar:

```php
// app/Http/Controllers/ProductController.php
namespace App\Http\Controllers;

use App\Models\Product;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('Products/Index', [
            'products' => Product::latest()->paginate(10),
        ]);
    }
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

| Bagian | Peran |
|---|---|
| `Inertia::render('Products/Index')` | Nama komponen halaman |
| Argumen kedua | Props yang dikirim ke React |
| `products.data` | Data paginator Laravel |
| `<Head title>` | Mengatur `<title>` halaman |

---

## 4.2 🗺️ Konvensi Nama

Tiga nama harus konsisten:

```text
Route name        →  products.index
URL               →  /products
Controller method →  index()
Component string  →  Products/Index
File              →  resources/js/Pages/Products/Index.jsx
```

| Konvensi | Aturan |
|---|---|
| Folder `Pages/` | Huruf kapital di awal (PascalCase) |
| Nama file | Sama persis dengan string `Inertia::render` |
| Subfolder | Mewakili resource (`Products`, `Categories`, `Auth`) |
| Ekstensi | `.jsx` (atau `.tsx` bila TypeScript) |

> ⚠️ **Kesalahan paling umum:** `Inertia::render('products/index')` (huruf kecil) padahal file `Pages/Products/Index.jsx`. Di Linux (produksi) ini gagal karena filesystem case-sensitive, meski di Windows terasa jalan.

---

## 4.3 📤 Jenis Data yang Bisa Dikirim

Inertia men-serialize props ke JSON. Semua harus bisa diwakili JSON.

| Data | Bisa? | Catatan |
|---|---|---|
| Model Eloquent | ✅ | Ikut semua atribut yang tidak di-`hidden` |
| Collection / paginator | ✅ | Paginator memberi `data`, `links`, `meta` |
| Array & object biasa | ✅ | Paling aman dan eksplisit |
| `Carbon` / `DateTime` | ✅ | Menjadi string ISO 8601 |
| Enum PHP | ✅ | Menjadi value-nya |
| Closure | ✅ (khusus) | Dievaluasi lazy (Bab 7) |
| Resource / `JsonResource` | ✅ | Direkomendasikan untuk bentuk data (Bab 14) |
| File upload | ❌ di props | Kirim lewat `FormData` (Bab 10) |

Contoh data eksplisit (lebih aman daripada model mentah):

```php
return Inertia::render('Products/Show', [
    'product' => [
        'id'          => $product->id,
        'name'        => $product->name,
        'price'       => $product->price,
        'category'    => $product->category->name,
        'created_at'  => $product->created_at->toIso8601String(),
    ],
]);
```

> 💡 **Aturan praktis:** kirim data yang **dibutuhkan UI**, bukan seluruh isi model. Semakin kecil props, semakin cepat halaman dan semakin kecil risiko kebocoran.

---

## 4.4 🧱 `Route::inertia` untuk Halaman Statis

Halaman tanpa data tidak perlu controller:

```php
use Inertia\Inertia;

Route::inertia('/about', 'About');
Route::inertia('/terms', 'Terms', ['versi' => '2.0']);
```

```jsx
export default function About() {
  return <h1>Tentang Kami</h1>
}
```

| Kebutuhan | Cara |
|---|---|
| Halaman statis | `Route::inertia('/about', 'About')` |
| Statis + props kecil | `Route::inertia('/terms', 'Terms', ['versi' => '2.0'])` |
| Butuh logika/data | Controller + `Inertia::render` |

---

## 4.5 🚨 Batas Keamanan Props

Semua props **terkirim ke browser** dan bisa dibaca siapa pun lewat DevTools atau `data-page`.

```text
Controller ── props ──► JSON di browser
                          ↑
                    semua terlihat
```

Yang **tidak boleh** masuk props:

- `password`, `remember_token`, hash apa pun
- Token API internal, secret, kunci pembayaran
- Data user lain yang tidak berhak dilihat
- Isi kolom internal yang tidak dipakai UI

Amankan di sumbernya:

```php
// Model: sembunyikan dari serialisasi
protected $hidden = ['password', 'remember_token', 'internal_note'];

// Atau lebih eksplisit: pilih kolom
$request->user()->only('id', 'name', 'email');
```

> 🚨 **Jangan mengandalkan UI untuk menyembunyikan data.** Kalau data ada di props, data itu sudah bocor — meskipun tidak ditampilkan.

---

## 4.6 🎬 Studi Kasus: Blade Lama → Halaman Inertia

Misalkan Anda punya halaman Blade:

```blade
{{-- resources/views/products/index.blade.php --}}
@extends('layouts.app')

@section('content')
  <h1>Daftar Produk</h1>
  @foreach ($products as $product)
    <div>{{ $product->name }} — Rp{{ number_format($product->price) }}</div>
  @endforeach
@endsection
```

Langkah migrasi:

**1. Ubah controller** — dari `view()` ke `Inertia::render()`:

```php
public function index()
{
    return Inertia::render('Products/Index', [
        'products' => Product::latest()->get(['id', 'name', 'price']),
    ]);
}
```

**2. Buat halaman React**:

```jsx
// resources/js/Pages/Products/Index.jsx
import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'

export default function Index({ products }) {
  return (
    <AppLayout>
      <Head title="Daftar Produk" />
      <h1>Daftar Produk</h1>
      {products.map((p) => (
        <div key={p.id}>
          {p.name} — Rp{p.price.toLocaleString('id-ID')}
        </div>
      ))}
    </AppLayout>
  )
}
```

**3. Hapus route/view lama** — route tetap sama, hanya response berubah.

**4. Uji** — buka URL, pastikan data tampil dan tidak ada request API di Network.

| Sebelum | Sesudah |
|---|---|
| `view('products.index', ...)` | `Inertia::render('Products/Index', ...)` |
| Blade `@foreach` | `products.map()` |
| `@extends` layout | `AppLayout` komponen |
| `number_format` | `toLocaleString('id-ID')` |

---

## 4.7 🧭 Kapan Memakai Layout di Halaman

Halaman bisa memakai layout dengan dua cara:

```jsx
// 1. Bungkus langsung (layout di-mount ulang tiap navigasi)
export default function Index({ products }) {
  return <AppLayout><h1>Produk</h1></AppLayout>
}
```

```jsx
// 2. Persistent layout (tidak di-mount ulang)
Index.layout = (page) => <AppLayout>{page}</AppLayout>
```

Perbedaan dan kapan memakainya dibahas di Bab 6.

---

## ✅ Checklist Bab 4

- **`Inertia::render`** — nama komponen + props; response berubah sesuai jenis request.
- **Konvensi** — string komponen, folder, dan nama file harus sama persis (case-sensitive).
- **Jenis data** — model, collection, paginator, array, Carbon, enum; semua harus serializable.
- **Data eksplisit** — kirim hanya yang dibutuhkan UI.
- **`Route::inertia`** — halaman statis tanpa controller.
- **Keamanan** — props terlihat di browser; sembunyikan kolom sensitif di sumbernya.
- **Migrasi Blade** — ganti `view()` dengan `Inertia::render`, Blade dengan JSX, layout dengan komponen.

---

⏭️ Lanjut ke [🔗 Bab 5 — Navigasi: Link & Router](/bagian-2/bab-5) untuk melanjutkan!
