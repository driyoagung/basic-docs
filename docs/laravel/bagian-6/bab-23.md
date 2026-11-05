---
title: Bab 23 — Caching & Performance Optimization
---

# 📖 Bab 23 — Caching & Performance Optimization

## 23.1 ⚡ Caching Strategis

```php
use Illuminate\Support\Facades\Cache;

// Cache hasil query yang mahal
$topProducts = Cache::remember('products.top.10', now()->addHours(1), function () {
    return Product::with('category')
        ->active()
        ->orderByDesc('sold_count')
        ->limit(10)
        ->get();
});

// Cek ada atau tidak
if (Cache::has('key')) { ... }

// Ambil atau default
$value = Cache::get('key', 'default');

// Hapus cache
Cache::forget('products.top.10');
Cache::flush(); // Hapus SEMUA cache

// Simpan permanen (forever)
Cache::forever('settings', Setting::pluck('value', 'key')->toArray());
```

**Penjelasan method cache:**

- **`Cache::remember($key, $ttl, $closure)`** — Ambil cache. Jika tidak ada, jalankan closure, simpan hasilnya dengan TTL.
- **`now()->addHours(1)`** — TTL 1 jam. Setelah itu cache expired.
- **`Cache::has()`** — Cek ada tanpa ambil.
- **`Cache::get('key', 'default')`** — Ambil atau return default.
- **`Cache::forget()`** — Hapus 1 cache key.
- **`Cache::flush()`** — Hapus SEMUA cache. **Hati-hati** — hapus cache untuk semua user.
- **`Cache::forever()`** — Simpan permanen (tanpa TTL). Untuk data yang jarang berubah.

## 23.2 🏷️ Cache dengan Tags (Redis/Memcached)

```php
// Cache dengan tag — mudah invalidasi per kelompok
$products = Cache::tags(['products', 'category:1'])->remember(
    'products.category.1',
    now()->addHours(6),
    fn() => Product::where('category_id', 1)->get()
);

// Hapus cache saat ada update
Cache::tags(['products'])->flush(); // Hapus semua cache bertag 'products'
Cache::tags(['category:1'])->flush(); // Hapus semua cache kategori 1
```

::: tip 💡 Tips
Cache tags hanya didukung di Redis dan Memcached. Untuk `database` atau `file` driver, tags tidak akan bekerja.
:::

## 23.3 🔄 Cache Pattern: Remember Forever

```php
// Pattern: ambil cache, kalau tidak ada generate & simpan permanen
$settings = Cache::rememberForever('site.settings', function () {
    return Setting::pluck('value', 'key')->toArray();
});

// Cara pakai
$siteName = $settings['site_name'] ?? 'Default';
```

**Penjelasan `rememberForever()`:**

- Sama dengan `remember()` tanpa TTL.
- Cocok untuk data yang jarang berubah (settings, konfigurasi).
- Untuk invalidate: `Cache::forget('site.settings')` manual.

## 23.4 📊 Cache Observer — Auto Invalidate

```php
// app/Observers/ProductObserver.php
namespace App\Observers;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class ProductObserver
{
    public function saved(Product $product): void
    {
        $this->clearCache($product);
    }

    public function deleted(Product $product): void
    {
        $this->clearCache($product);
    }

    private function clearCache(Product $product): void
    {
        Cache::forget('products.top.10');
        Cache::tags(['products'])->flush();
        Cache::tags(["category:{$product->category_id}"])->flush();
    }
}

// Daftarkan di AppServiceProvider
public function boot(): void
{
    Product::observe(ProductObserver::class);
}
```

**Penjelasan Cache Observer:**

- **`ProductObserver`** — Hook yang dipanggil saat model saved/deleted.
- **Auto invalidate** — Cache otomatis ter-update saat data berubah.
- Tanpa observer, user akan lihat data stale.

## 23.5 🚀 Eager Loading untuk Hindari N+1

```php
// ❌ N+1 Problem — 1 + N queries
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->user->name;          // Query baru!
    echo $order->items->count();      // Query baru!
    foreach ($order->items as $item) {
        echo $item->product->name;    // Query baru!
    }
}
// Total: 1 + N + N + (N*M) queries!

// ✅ Eager Loading — hanya 4 queries total
$orders = Order::with(['user', 'items.product'])->get();
foreach ($orders as $order) {
    echo $order->user->name;          // No query
    echo $order->items->count();      // No query
    foreach ($order->items as $item) {
        echo $item->product->name;    // No query
    }
}
// Total: 4 queries (orders, users, items, products)
```

## 23.6 📦 Chunk untuk Data Besar

```php
// Proses 10.000 records tanpa makan RAM
Product::chunk(500, function ($products) {
    foreach ($products as $product) {
        // proses tiap produk
    }
});

// Atau dengan lazy (LazyCollection) — paling hemat memory
Product::lazy(500)->each(function ($product) {
    // proses
});

// Atau chunkById — lebih aman jika data berubah saat iterasi
Product::chunkById(500, function ($products) {
    foreach ($products as $product) {
        // proses
    }
});

// Untuk update massal yang lebih cepat
Product::where('is_active', false)->update(['is_active' => true]);
// 1 query, bukan N queries
```

**Penjelasan chunk:**

- **`chunk(500, closure)`** — Ambil data 500 per batch. Hemat memory.
- **`lazy(500)->each(...)`** — Versi lazy via LazyCollection — paling hemat memory.
- **`chunkById(500, closure)`** — Mirip `chunk()`, tapi paginasi berdasarkan ID — lebih aman jika data berubah saat iterasi.
- **Bulk update** — 1 query untuk update banyak row.

## 23.7 📊 Database Indexing

```php
// Migration: tambah index untuk kolom yang sering di-query
$table->index('email');                   // Single column
$table->index(['category_id', 'is_active']); // Composite index
$table->unique('slug');                   // Unique index

// Untuk LIKE query
$table->string('slug')->index();
```

::: warning ⚠️ Jangan Over-Index!
Index mempercepat SELECT, tapi memperlambat INSERT/UPDATE/DELETE.
Tambahkan index hanya untuk kolom yang BENAR-BENAR sering di-query.
:::

## 23.8 🎯 Production Optimization Checklist

```bash
# 1. Cache konfigurasi
php artisan config:cache

# 2. Cache route
php artisan route:cache

# 3. Cache view
php artisan view:cache

# 4. Optimize autoloader
composer install --optimize-autoloader --no-dev

# 5. Cache event & listener (jika ada)
php artisan event:cache
```

```ini
# .env (production)
APP_DEBUG=false
APP_ENV=production
LOG_LEVEL=error
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

**Penjelasan production optimization:**

- **`config:cache`** — Gabung semua config jadi 1 file cached. Load lebih cepat.
- **`route:cache`** — Compile semua route ke 1 file.
- **`view:cache`** — Compile Blade template ke PHP murni.
- **`composer install --optimize-autoloader`** — Optimalkan autoload class.
- **`CACHE_STORE=redis`** — Pakai Redis (in-memory) bukan file/database. (Sejak Laravel 11, env key-nya `CACHE_STORE`, bukan `CACHE_DRIVER`.)

## 23.9 📈 Monitoring Tools

| Tool                       | Fungsi                                      |
| -------------------------- | ------------------------------------------- |
| **Laravel Telescope**      | Debug request, query, log, dll              |
| **Laravel Horizon**        | Monitoring queue & job                      |
| **Laravel Pulse**          | Performance monitoring (baru di Laravel 11) |
| **Sentry / Bugsnag**       | Error tracking                              |
| **Laravel Debugbar**       | Debugbar di local development               |

```bash
# Telescope
composer require laravel/telescope --dev

# Horizon
composer require laravel/horizon

# Pulse
composer require laravel/pulse
```

**Penjelasan monitoring tools:**

- **Telescope** — "Debugger cantik" untuk development. Lihat request, query, jobs, dll.
- **Horizon** — Khusus untuk queue. Dashboard monitoring & retry failed jobs.
- **Pulse** — Untuk production monitoring. Metric cards, exceptions, slow queries.
- **Sentry** — SaaS error tracking. Collect exceptions dari production.

## 📌 Ringkasan Bab 23

| Konsep                | Penjelasan Singkat                                              |
| --------------------- | --------------------------------------------------------------- |
| Cache                 | Simpan data di memory untuk akses cepat                        |
| `Cache::remember()`   | Ambil cache atau jalankan closure lalu simpan                  |
| `Cache::tags()`       | Group cache untuk invalidasi selektif                          |
| Cache Observer        | Auto invalidate cache saat model berubah                       |
| Eager Loading         | Hindari N+1 query problem                                     |
| Chunk                 | Proses data besar dalam batch kecil                            |
| Index                 | Percepat query dengan index di kolom yang sering di-cari       |
| Production Cache      | `config:cache`, `route:cache`, `view:cache`                   |
| Redis                 | Cache driver tercepat untuk production                         |

---

➡️ Lanjut ke [Bagian VII — Project E-Commerce API](/bagian-7/index)
