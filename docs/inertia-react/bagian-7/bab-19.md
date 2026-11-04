---
title: "Bab 19 — Performa & Optimasi"
---

# 📖 Bab 19 — Performa & Optimasi

Aplikasi Inertia bisa terasa sangat cepat atau sangat lambat, tergantung beberapa keputusan: seberapa besar props, berapa query yang jalan, dan apakah halaman dimuat lebih awal. Bab ini merangkum teknik yang paling berdampak — dari code splitting yang sudah otomatis sampai caching dan memoization yang sering disalahgunakan.

---

## 19.1 📦 Code Splitting per Halaman

`import.meta.glob` di `app.jsx` membuat Vite memecah bundle per halaman secara otomatis.

```jsx
resolve: (name) =>
  resolvePageComponent(
    `./Pages/${name}.jsx`,
    import.meta.glob('./Pages/**/*.jsx'),
  ),
```

| Pola | Hasil |
|---|---|
| `import.meta.glob(...)` (lazy) | Satu chunk per halaman ✅ |
| `import.meta.glob(..., { eager: true })` | Semua halaman di bundle awal ❌ |
| `import Page from ...` statis | Semua ikut bundle awal ❌ |

> 💡 **Jangan memakai `eager: true`** kecuali untuk halaman yang benar-benar selalu dibutuhkan. Halaman berat (grafik, editor) sebaiknya tetap lazy.

---

## 19.2 🔗 Prefetching Link

Inertia v2 bisa memuat halaman tujuan sebelum diklik.

```jsx
<Link href={route('products.show', p.id)} prefetch>
  Detail
</Link>

{/* Strategi eksplisit */}
<Link href={route('products.index')} prefetch="hover">Produk</Link>
<Link href={route('dashboard')} prefetch="mount">Dashboard</Link>
<Link href={route('reports.index')} prefetch="click">Laporan</Link>
```

| Strategi | Kapan dimuat | Cocok untuk |
|---|---|---|
| `hover` (default) | Saat pointer di atas link | Navigasi umum |
| `mount` | Saat link dirender | Halaman yang hampir pasti dibuka |
| `click` | Saat diklik (tanpa jeda) | Halaman berat |

> ⚠️ **Prefetch berlebihan membebani server.** Terapkan pada link yang sering dipakai, bukan semua link di tabel panjang.

---

## 19.3 ⚡ Partial, Optional, Deferred (Rangkuman Bab 8)

```php
return Inertia::render('Products/Index', [
    'products' => Product::paginate(10),                 // utama
    'filters'  => $request->only('search'),              // ringan
    'stats'    => Inertia::defer(fn () => $this->stats()), // berat
    'detail'   => Inertia::optional(fn () => $this->detail()), // saat diminta
]);
```

```jsx
router.reload({ only: ['products'] })
```

| Teknik | Menghemat |
|---|---|
| Partial reload | Query & payload yang tidak berubah |
| Deferred | Waktu render awal |
| Optional | Data yang jarang dibuka |
| Merge | Ukuran payload saat load more |

---

## 19.4 🗄️ Eager Loading untuk Hindari N+1

Masalah klasik: satu query untuk list, lalu satu query per baris.

```php
// ❌ N+1
$products = Product::paginate(10);   // 1 query
// di React: produk.category.name → tidak ada query (data tidak ada)
// di Resource dengan lazy load → 10 query tambahan

// ✅ Eager loading
$products = Product::with('category')->paginate(10);
```

```php
// Beberapa relasi
$products = Product::with(['category', 'images', 'reviews.user'])->paginate(10);

// Hanya kolom yang dibutuhkan
$products = Product::with('category:id,name')->paginate(10);
```

| Gejala N+1 | Cara mendeteksi |
|---|---|
| Halaman melambat seiring jumlah baris | Laravel Debugbar / Telescope |
| Query bertambah per item | Log query |
| `whenLoaded` tidak mengembalikan data | Lupa `with()` |

---

## 19.5 📉 Mengurangi Ukuran Props

Props besar memperlambat serialisasi, transfer, dan render.

```php
// ❌ Semua kolom + relasi penuh
'products' => Product::with('category', 'images', 'reviews')->get(),

// ✅ Hanya yang dipakai UI
'products' => Product::with('category:id,name')
    ->select('id', 'name', 'price', 'category_id')
    ->paginate(10),
```

| Strategi | Efek |
|---|---|
| `select()` kolom seperlunya | Payload lebih kecil |
| Eager load relasi terbatas | Hindari nested besar |
| Resource | Bentuk data eksplisit (Bab 14) |
| Pagination | Jangan kirim semua baris |
| Deferred | Tunda data berat |

> 💡 **Aturan praktis:** jika props lebih dari ~100 KB untuk satu halaman, curigai ada data yang tidak dipakai.

---

## 19.6 🧠 Memoization React: Kapan Perlu

```jsx
import { useMemo, memo } from 'react'

const total = useMemo(
  () => keranjang.reduce((n, i) => n + i.harga * i.jumlah, 0),
  [keranjang],
)

const BarisProduk = memo(function BarisProduk({ produk, onPilih }) {
  return <div onClick={() => onPilih(produk.id)}>{produk.name}</div>
})
```

| Alat | Kapan berguna |
|---|---|
| `useMemo` | Perhitungan mahal dari data besar |
| `useCallback` | Fungsi stabil untuk komponen `memo` |
| `React.memo` | Komponen sering render dengan props sama |
| — | **Tidak perlu** untuk perhitungan ringan |

> ⚠️ **Memoization bukan default.** Setiap `memo` menambah biaya perbandingan dan kompleksitas. Ukur dulu; optimalkan yang terbukti lambat.

---

## 19.7 🗃️ Cache di Laravel

Data yang jarang berubah tidak perlu di-query setiap request.

```php
use Illuminate\Support\Facades\Cache;

public function index()
{
    $kategori = Cache::remember('kategori.opsi', 3600, fn () =>
        Category::orderBy('name')->get(['id', 'name'])
    );

    return Inertia::render('Products/Index', [
        'kategori' => $kategori,
        'products' => Product::with('category:id,name')->paginate(10),
    ]);
}

// Hapus cache saat data berubah
Cache::forget('kategori.opsi');
```

| Data | TTL wajar |
|---|---|
| Opsi kategori/role | 1 jam |
| Statistik dashboard | 5–15 menit |
| Data yang sering berubah | Jangan di-cache |

> 🚨 **Selalu invalidate cache setelah mutasi.** Cache kategori yang tidak dihapus akan menampilkan data lama setelah tambah/edit.

---

## 19.8 🎬 Studi Kasus: Halaman Daftar Produk Cepat

```php
public function index(Request $request)
{
    $produk = Product::query()
        ->with('category:id,name')
        ->select('id', 'name', 'price', 'category_id', 'created_at')
        ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
        ->latest()
        ->paginate(15)
        ->withQueryString();

    return Inertia::render('Products/Index', [
        'products' => ProductResource::collection($produk),
        'filters'  => $request->only('search'),
        'stats'    => Inertia::defer(fn () => [
            'total' => Product::count(),
            'aktif' => Product::where('is_active', true)->count(),
        ]),
    ]);
}
```

```jsx
<Link href={route('products.show', p.id)} prefetch="hover">
  {p.name}
</Link>

<Deferred data="stats" fallback={<p>Memuat statistik...</p>}>
  <StatsPanel stats={stats} />
</Deferred>
```

| Optimasi | Dampak |
|---|---|
| `select` terbatas | Payload kecil |
| `with('category:id,name')` | Tanpa N+1 |
| Resource | Bentuk stabil |
| Deferred stats | Render awal cepat |
| Prefetch hover | Navigasi terasa instan |

---

## ✅ Checklist Bab 19

- **Code splitting** — biarkan `import.meta.glob` lazy; hindari `eager`.
- **Prefetch** — `hover` default; `mount`/`click` sesuai konteks.
- **Props** — partial reload, deferred, optional, merge.
- **Eloquent** — `with()` + `select()` untuk hindari N+1 dan payload besar.
- **Resource** — bentuk data eksplisit (Bab 14).
- **Memoization** — ukur dulu, baru optimalkan.
- **Cache** — untuk data jarang berubah; invalidate setelah mutasi.
- **Ukur** — Telescope/Debugbar sebelum menebak.

---

⏭️ Lanjut ke [🧪 Bab 20 — Testing](/bagian-7/bab-20) untuk melanjutkan!
