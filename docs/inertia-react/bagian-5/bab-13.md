---
title: "Bab 13 — Pagination, Search & Filter"
---

# 📖 Bab 13 — Pagination, Search & Filter

Tabel tanpa pencarian dan pagination akan cepat menjadi tidak terpakai. Dengan Inertia, semua state tabel — halaman, kata kunci, filter, urutan — sebaiknya hidup di **URL**, bukan di state React. Hasilnya: halaman bisa di-bookmark, dibagikan, dan tombol Back bekerja wajar.

---

## 13.1 📄 Paginator Laravel

```php
public function index(Request $request)
{
    $products = Product::query()
        ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
        ->latest()
        ->paginate(10)
        ->withQueryString();   // ⭐ pertahankan ?search= di link pagination

    return Inertia::render('Products/Index', [
        'products' => $products,
        'filters'  => ['search' => $request->search],
    ]);
}
```

Struktur props paginator:

```json
{
  "data": [{ "id": 1, "name": "Laptop" }],
  "links": [
    { "url": null, "label": "&laquo; Previous", "active": false },
    { "url": "/products?page=1", "label": "1", "active": true },
    { "url": "/products?page=2", "label": "2", "active": false }
  ],
  "meta": { "current_page": 1, "last_page": 5, "total": 48 }
}
```

> ⚠️ **`withQueryString()` wajib** bila ada search/filter. Tanpa itu, pindah halaman akan menghapus `?search=...`.

---

## 13.2 🧩 Komponen Pagination

```jsx
// resources/js/Components/Pagination.jsx
import { Link } from '@inertiajs/react'

export default function Pagination({ links }) {
  if (links.length <= 3) return null

  return (
    <nav className="mt-4 flex flex-wrap gap-1">
      {links.map((link, i) =>
        link.url ? (
          <Link
            key={i}
            href={link.url}
            preserveScroll
            className={
              'rounded px-3 py-1 text-sm ' +
              (link.active
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100')
            }
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ) : (
          <span
            key={i}
            className="rounded px-3 py-1 text-sm text-gray-400"
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ),
      )}
    </nav>
  )
}
```

`label` dari Laravel berisi HTML entity (`&laquo;`), sehingga perlu `dangerouslySetInnerHTML`.

| Field | Fungsi |
|---|---|
| `link.url` | `null` untuk tombol nonaktif |
| `link.active` | Halaman saat ini |
| `link.label` | Teks tombol (HTML entity) |

---

## 13.3 🔍 Search dengan Debounce

Jangan kirim request setiap ketikan.

```jsx
import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

export default function SearchProduk({ filters }) {
  const [search, setSearch] = useState(filters.search ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      router.get(
        route('products.index'),
        { search },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
          only: ['products', 'filters'],
        },
      )
    }, 400)

    return () => clearTimeout(timer)
  }, [search])

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Cari produk..."
      className="w-full rounded border px-3 py-2"
    />
  )
}
```

| Opsi | Alasan |
|---|---|
| `preserveState` | Fokus input tidak hilang |
| `preserveScroll` | Tidak melompat ke atas |
| `replace` | Back tidak menelusuri setiap ketikan |
| `only` | Hanya muat ulang data yang berubah |

> 💡 **Sinkronkan state lokal dengan props.** Jika user menekan Back, `filters.search` berubah — pastikan input mengikuti lewat `useEffect` atau `key`.

---

## 13.4 🎛️ Filter & Sorting

**Backend:**

```php
public function index(Request $request)
{
    $sort = $request->sort ?? 'latest';
    $arah = $request->direction === 'asc' ? 'asc' : 'desc';

    $products = Product::query()
        ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
        ->when($request->category, fn ($q, $c) => $q->where('category_id', $c))
        ->when($request->status, fn ($q, $s) => $q->where('is_active', $s === 'aktif'))
        ->orderBy(match ($sort) {
            'name'  => 'name',
            'price' => 'price',
            default => 'created_at',
        }, $arah)
        ->paginate(10)
        ->withQueryString();

    return Inertia::render('Products/Index', [
        'products'   => $products,
        'filters'    => $request->only('search', 'category', 'status', 'sort', 'direction'),
        'categories' => Category::orderBy('name')->get(['id', 'name']),
    ]);
}
```

**Frontend:**

```jsx
function ubahFilter(kunci, nilai) {
  router.get(
    route('products.index'),
    { ...filters, [kunci]: nilai, page: 1 },
    { preserveState: true, preserveScroll: true, replace: true },
  )
}

<select
  value={filters.category ?? ''}
  onChange={(e) => ubahFilter('category', e.target.value)}
>
  <option value="">Semua kategori</option>
  {categories.map((c) => (
    <option key={c.id} value={c.id}>{c.name}</option>
  ))}
</select>

<button onClick={() => ubahFilter('sort', 'price')}>Urutkan harga</button>
```

| Prinsip | Alasan |
|---|---|
| Reset `page` saat filter berubah | Halaman 5 bisa kosong setelah filter |
| Semua filter di URL | Bookmark & share |
| `withQueryString()` | Pagination mempertahankan filter |
| Validasi nilai sort | Cegah SQL injection lewat whitelist `match` |

> 🚨 **Jangan pernah memasukkan `$request->sort` langsung ke `orderBy`.** Selalu whitelist kolom yang boleh diurutkan.

---

## 13.5 🔗 State di URL

```text
/products?search=laptop&category=2&status=aktif&sort=price&direction=asc&page=3
```

| Manfaat | Penjelasan |
|---|---|
| Bookmark | User bisa menyimpan pencarian |
| Share | Kirim link ke rekan |
| Back/Forward | Navigasi wajar |
| Refresh | State tidak hilang |
| Debug | URL menunjukkan kondisi tabel |

---

## 13.6 ♾️ Infinite Scroll dengan Merge Props (v2)

Untuk daftar panjang, muat bertahap dan **tambahkan** ke list lama.

```php
public function index(Request $request)
{
    return Inertia::render('Products/Index', [
        'products' => Product::latest()->paginate(20),
    ]);
}
```

```jsx
import { WhenVisible, router } from '@inertiajs/react'

export default function Index({ products }) {
  function muatLagi() {
    router.get(
      route('products.index', { page: products.meta.current_page + 1 }),
      {},
      {
        preserveScroll: true,
        preserveState: true,
        only: ['products'],
        replace: true,
      },
    )
  }

  return (
    <div>
      {products.data.map((p) => (
        <div key={p.id}>{p.name}</div>
      ))}

      {products.meta.current_page < products.meta.last_page && (
        <WhenVisible data="products" fallback={<p>Memuat...</p>}>
          <button onClick={muatLagi}>Muat lagi</button>
        </WhenVisible>
      )}
    </div>
  )
}
```

Dengan `Inertia::merge()` di backend, item baru ditambahkan alih-alih mengganti list:

```php
'products' => Inertia::merge(fn () => Product::latest()->paginate(20)),
```

> ⚠️ **Infinite scroll menyulitkan akses ke item lama** (mis. mengedit produk di halaman 1). Untuk dashboard admin, pagination biasa sering lebih baik.

---

## 13.7 🎬 Studi Kasus: Tabel Produk Lengkap

```jsx
import { Head } from '@inertiajs/react'
import Pagination from '@/Components/Pagination'
import SearchProduk from '@/Components/SearchProduk'
import FilterKategori from '@/Components/FilterKategori'

export default function Index({ products, filters, categories }) {
  return (
    <>
      <Head title="Produk" />
      <h1 className="mb-4 text-xl font-bold">Produk</h1>

      <div className="mb-4 flex gap-2">
        <SearchProduk filters={filters} />
        <FilterKategori filters={filters} categories={categories} />
      </div>

      <table className="w-full bg-white shadow">
        <thead>
          <tr>
            <th className="p-3 text-left">Nama</th>
            <th className="p-3 text-left">Kategori</th>
            <th className="p-3 text-left">Harga</th>
          </tr>
        </thead>
        <tbody>
          {products.data.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.name}</td>
              <td className="p-3">{p.category?.name}</td>
              <td className="p-3">Rp{p.price.toLocaleString('id-ID')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination links={products.links} />
      <p className="mt-2 text-sm text-gray-500">
        Total {products.meta.total} produk
      </p>
    </>
  )
}
```

Alur:

```text
Ketik pencarian → debounce 400ms → router.get(?search=)
   │
   ▼
Controller filter + paginate + withQueryString
   │
   ▼
props.products baru → tabel & pagination diperbarui
```

---

## ✅ Checklist Bab 13

- **`withQueryString()`** — pagination mempertahankan search/filter.
- **Pagination** — render `links`, tangani `url: null` dan `active`.
- **Search** — debounce + `preserveState` + `replace`.
- **Filter** — semua di URL, reset `page` saat berubah.
- **Sorting** — whitelist kolom, jangan pakai input mentah.
- **`only`** — muat ulang props yang berubah saja.
- **Infinite scroll** — `merge` + `WhenVisible`; pilih dengan sadar.
- **State di URL** — bookmark, share, Back/Forward bekerja.

---

⏭️ Lanjut ke [🧱 Bab 14 — Membentuk Data: Eloquent Resource](/bagian-5/bab-14) untuk melanjutkan!
