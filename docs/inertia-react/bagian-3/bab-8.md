---
title: "Bab 8 — Props Lanjutan (Inertia v2)"
---

# 📖 Bab 8 — Props Lanjutan (Inertia v2)

Inertia v2 membawa fitur yang membuat aplikasi terasa jauh lebih cepat: partial reload, optional props, deferred props, merge props, `WhenVisible`, dan polling. Semuanya berpusat pada satu ide — **jangan kirim data yang belum dibutuhkan**. Bab ini membahas kapan memakai masing-masing dan jebakannya.

---

## 8.1 🔁 Partial Reload: `only` & `except`

Saat halaman butuh refresh data tertentu, jangan muat ulang semua props.

```jsx
import { router } from '@inertiajs/react'

// Hanya muat ulang products
router.reload({ only: ['products'] })

// Muat semua kecuali stats yang berat
router.reload({ except: ['stats'] })

// Dengan navigasi
router.get(route('products.index'), { search: 'laptop' }, {
  only: ['products', 'filters'],
  preserveState: true,
  preserveScroll: true,
})
```

```php
// Controller tetap sama — Inertia memilih props yang dikirim
return Inertia::render('Products/Index', [
    'products' => Product::paginate(10),
    'filters'  => ['search' => request('search')],
    'stats'    => fn () => $this->statistikBulanan(),
]);
```

| Opsi | Arti |
|---|---|
| `only` | Kirim hanya props yang disebut |
| `except` | Kirim semua kecuali yang disebut |
| Syarat | Props harus berupa closure agar bisa dilewati |

> ⚠️ **Partial reload hanya melewati closure.** Props yang dievaluasi langsung (mis. `Product::paginate()` tanpa `fn`) tetap dihitung. Bungkus dengan closure agar benar-benar hemat.

---

## 8.2 🎯 Optional Props: `Inertia::optional()`

Props yang **hanya dikirim bila diminta** eksplisit oleh client.

```php
return Inertia::render('Products/Index', [
    'products' => Product::paginate(10),
    'detail'   => Inertia::optional(fn () => $this->detailMahal()),
]);
```

```jsx
// Minta saat dibutuhkan
router.reload({ only: ['detail'] })
```

| Perilaku | Nilai |
|---|---|
| Kunjungan awal | `detail` tidak ada di props |
| `only: ['detail']` | `detail` dikirim |
| Cocok untuk | Data sekunder, panel detail, data ekspor |

Perbedaan dengan deferred: optional **tidak otomatis dimuat**; deferred dimuat otomatis setelah halaman tampil.

---

## 8.3 ⏳ Deferred Props

Data berat dimuat **setelah** halaman tampil, sehingga halaman pertama terasa instan.

```php
return Inertia::render('Dashboard', [
    'user'  => $request->user()->only('id', 'name'),
    'stats' => Inertia::defer(fn () => $this->hitungStatistikBerat()),
]);
```

```jsx
import { Deferred } from '@inertiajs/react'

export default function Dashboard({ user, stats }) {
  return (
    <div>
      <h1>Halo, {user.name}</h1>

      <Deferred data="stats" fallback={<Skeleton />}>
        <StatsPanel stats={stats} />
      </Deferred>
    </div>
  )
}
```

```jsx
function Skeleton() {
  return <div className="h-40 animate-pulse rounded bg-gray-200" />
}
```

| Tahap | Yang terjadi |
|---|---|
| 1 | Halaman dirender tanpa `stats` |
| 2 | Browser menampilkan `fallback` |
| 3 | Inertia meminta props deferred |
| 4 | `stats` terisi, `StatsPanel` dirender |

> 💡 **Gunakan deferred untuk data yang boleh terlambat** — statistik, grafik, ringkasan. Jangan untuk data utama halaman (mis. daftar produk yang langsung dibaca user).

---

## 8.4 ➕ Merge Props

Menambahkan data baru ke list lama — dasar infinite scroll / load more.

```php
return Inertia::render('Products/Index', [
    'products' => Product::paginate(10),
]);

// Halaman berikutnya
return Inertia::render('Products/Index', [
    'products' => Product::paginate(10, page: request('page', 1)),
]);
```

```jsx
<Link
  href={route('products.index', { page: 2 })}
  preserveScroll
  preserveState
>
  Muat lagi
</Link>
```

Dengan merge props (v2), item baru **ditambahkan** ke list lama, bukan menggantinya:

```php
'products' => Inertia::merge(fn () => Product::paginate(10)),
```

| Tanpa merge | Dengan merge |
|---|---|
| List diganti | Item baru ditambahkan |
| Scroll reset | Scroll tetap |
| Cocok untuk pagination biasa | Cocok untuk infinite scroll |

---

## 8.5 👀 `WhenVisible`

Memuat props saat elemen benar-benar terlihat di layar (Intersection Observer).

```jsx
import { WhenVisible } from '@inertiajs/react'

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <WhenVisible data="grafik" fallback={<Skeleton />}>
        <GrafikPenjualan />
      </WhenVisible>
    </div>
  )
}
```

| Fitur | Deferred | WhenVisible |
|---|---|---|
| Kapan dimuat | Setelah halaman tampil | Saat elemen terlihat |
| Cocok untuk | Data di atas lipatan | Data jauh di bawah halaman |
| Fallback | Wajib | Wajib |

> ⚠️ **Jangan bungkus data utama dengan `WhenVisible`** — jika elemen tidak pernah terlihat (mis. di balik tab tersembunyi), data tidak akan dimuat.

---

## 8.6 🔄 Polling dengan `usePoll`

Data yang perlu diperbarui berkala tanpa reload penuh.

```jsx
import { usePoll } from '@inertiajs/react'

export default function Antrian() {
  usePoll(5000, { only: ['antrian'] })

  return <DaftarAntrian />
}
```

| Parameter | Arti |
|---|---|
| `5000` | Interval dalam milidetik |
| `only` | Props yang di-refresh |
| `keepAlive` | Tetap polling saat tab tidak aktif (opsional) |

Gunakan polling untuk data yang memang berubah cepat (antrian, status pesanan). Untuk data statis, polling hanya membebani server.

---

## 8.7 🎬 Studi Kasus: Dashboard Cepat dengan Skeleton

**Controller:**

```php
public function index(Request $request)
{
    return Inertia::render('Dashboard', [
        'user' => $request->user()->only('id', 'name'),
        'ringkasan' => [
            'totalProduk' => Product::count(),
            'totalKategori' => Category::count(),
        ],
        'stats' => Inertia::defer(fn () => [
            'penjualanBulanan' => $this->penjualanBulanan(),
            'produkTerlaris'   => $this->produkTerlaris(),
        ]),
    ]);
}
```

**Halaman:**

```jsx
import { Deferred, Head } from '@inertiajs/react'

export default function Dashboard({ user, ringkasan, stats }) {
  return (
    <>
      <Head title="Dashboard" />
      <h1 className="text-2xl font-bold">Halo, {user.name}</h1>

      <div className="grid grid-cols-2 gap-4 my-6">
        <Kartu label="Total Produk" nilai={ringkasan.totalProduk} />
        <Kartu label="Total Kategori" nilai={ringkasan.totalKategori} />
      </div>

      <Deferred data="stats" fallback={<SkeletonDashboard />}>
        <StatsPanel stats={stats} />
      </Deferred>
    </>
  )
}
```

```text
Request pertama
├── user          → langsung
├── ringkasan     → langsung (query ringan)
└── stats         → deferred (query berat)

Render awal: angka ringkasan + skeleton
Beberapa ms kemudian: grafik & produk terlaris terisi
```

Hasilnya: dashboard terasa instan, sementara data berat menyusul tanpa memblokir.

---

## ✅ Checklist Bab 8

- **Partial reload** — `only`/`except` + closure agar props benar-benar dilewati.
- **Optional** — `Inertia::optional()` hanya dikirim saat diminta.
- **Deferred** — `Inertia::defer()` + `<Deferred>` + fallback skeleton.
- **Merge** — `Inertia::merge()` untuk infinite scroll / load more.
- **`WhenVisible`** — muat data saat elemen terlihat; jangan untuk data utama.
- **Polling** — `usePoll(interval, { only })` untuk data yang berubah cepat.
- **Prinsip** — kirim data seminimal mungkin pada waktu yang tepat.

---

⏭️ Lanjut ke [📝 Bab 9 — useForm & Validasi](/bagian-4/bab-9) untuk melanjutkan!
