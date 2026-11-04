---
title: "Bab 6 — Layout & Head"
---

# 📖 Bab 6 — Layout & Head

Layout adalah kerangka yang sama di banyak halaman: navbar, sidebar, footer. Inertia React mendukung dua pola — membungkus halaman langsung atau **persistent layout** yang tidak di-mount ulang saat navigasi. Bab ini juga membahas nested layout, komponen `<Head>` untuk title/meta, dan cara memilih layout publik vs admin.

---

## 6.1 🖼️ Dua Pola Layout

### Pola 1: Bungkus langsung

```jsx
// Pages/Products/Index.jsx
import AppLayout from '@/Layouts/AppLayout'

export default function Index({ products }) {
  return (
    <AppLayout>
      <h1>Produk</h1>
    </AppLayout>
  )
}
```

### Pola 2: Persistent layout

```jsx
// Pages/Products/Index.jsx
import AppLayout from '@/Layouts/AppLayout'

function Index({ products }) {
  return <h1>Produk</h1>
}

Index.layout = (page) => <AppLayout>{page}</AppLayout>

export default Index
```

| Aspek | Bungkus langsung | Persistent |
|---|---|---|
| Layout di-mount ulang | Ya | Tidak |
| State layout (sidebar, musik, scroll) | Hilang | Terjaga |
| Animasi layout | Bisa ter-reset | Mulus |
| Kompleksitas | Rendah | Sedikit lebih tinggi |
| Cocok untuk | Halaman sederhana | Dashboard dengan sidebar |

> 💡 **Mengapa "persistent"?** Karena React mempertahankan instance layout di antara halaman. Sidebar yang terbuka, tab aktif, atau posisi scroll di dalam layout tidak kembali ke awal.

---

## 6.2 🧱 Anatomi Layout

```jsx
// resources/js/Layouts/AppLayout.jsx
import { Link, usePage } from '@inertiajs/react'

export default function AppLayout({ children }) {
  const { auth } = usePage().props

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center gap-4 p-4 bg-white shadow">
        <Link href={route('dashboard')} className="font-bold">
          Toko
        </Link>
        <Link href={route('products.index')}>Produk</Link>
        <Link href={route('categories.index')}>Kategori</Link>

        <span className="ml-auto text-sm text-gray-600">
          {auth.user?.name}
        </span>
      </nav>

      <main className="p-6">{children}</main>
    </div>
  )
}
```

| Bagian | Peran |
|---|---|
| `children` | Halaman yang sedang aktif |
| `usePage().props.auth` | Data user dari shared data (Bab 7) |
| `<Link>` | Navigasi internal |

---

## 6.3 🪆 Nested Layout

Layout bisa bersarang: layout aplikasi membungkus layout dashboard.

```jsx
// Layouts/DashboardLayout.jsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <aside className="w-64 bg-white shadow">Menu dashboard</aside>
      <section className="flex-1 p-6">{children}</section>
    </div>
  )
}
```

```jsx
// Pages/Dashboard.jsx
import AppLayout from '@/Layouts/AppLayout'
import DashboardLayout from '@/Layouts/DashboardLayout'

function Dashboard() {
  return <h1>Ringkasan</h1>
}

Dashboard.layout = (page) => (
  <AppLayout>
    <DashboardLayout>{page}</DashboardLayout>
  </AppLayout>
)

export default Dashboard
```

```text
AppLayout (navbar global)
└── DashboardLayout (sidebar)
    └── Halaman Dashboard
```

> ⚠️ **Jangan bungkus layout dua kali.** Jika `AppLayout` sudah dipasang lewat `createInertiaApp` sebagai default, jangan membungkusnya lagi di halaman — hasilnya navbar ganda.

---

## 6.4 🏷️ `<Head>` untuk Title & Meta

```jsx
import { Head } from '@inertiajs/react'

export default function Show({ product }) {
  return (
    <>
      <Head>
        <title>{product.name} — Toko</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:type" content="product" />
      </Head>

      <h1>{product.name}</h1>
    </>
  )
}
```

| Pemakaian | Contoh |
|---|---|
| Title sederhana | `<Head title="Produk" />` |
| Title + meta | `<Head><title>...</title><meta ... /></Head>` |
| Title dinamis | `<Head title={product.name} />` |
| Canonical | `<link rel="canonical" href={url} />` |

Title default bisa diatur di `app.jsx`:

```jsx
createInertiaApp({
  title: (title) => (title ? `${title} - Toko` : 'Toko'),
  // ...
})
```

---

## 6.5 ⚙️ Layout Default lewat `createInertiaApp`

Daripada mengatur `.layout` di setiap halaman, pasang layout default di `resolve`:

```jsx
// app.jsx
import AppLayout from './Layouts/AppLayout'
import GuestLayout from './Layouts/GuestLayout'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
    const page = pages[`./Pages/${name}.jsx`]

    page.default.layout =
      page.default.layout ??
      ((page) => <AppLayout>{page}</AppLayout>)

    return page
  },
  // ...
})
```

Dengan pola ini:

- Halaman biasa otomatis memakai `AppLayout`.
- Halaman auth menimpa dengan `GuestLayout`:

```jsx
Login.layout = (page) => <GuestLayout>{page}</GuestLayout>
```

| Strategi | Kelebihan | Kekurangan |
|---|---|---|
| `.layout` per halaman | Eksplisit | Boilerplate di setiap file |
| Default di `resolve` | Konsisten, sedikit kode | Perlu paham `resolve` |
| Bungkus langsung | Paling sederhana | Layout re-mount |

---

## 6.6 🎬 Studi Kasus: Layout Publik vs Admin

Skenario: toko punya halaman publik (beranda, katalog) dan area admin (dashboard, CRUD).

```jsx
// Layouts/PublicLayout.jsx
export default function PublicLayout({ children }) {
  return (
    <div>
      <header className="p-4 bg-purple-700 text-white">
        <Link href="/">Toko</Link>
        <Link href="/katalog" className="ml-4">Katalog</Link>
      </header>
      <main>{children}</main>
      <footer className="p-4 text-center text-sm text-gray-500">
        © 2026 Toko
      </footer>
    </div>
  )
}
```

```jsx
// Layouts/AdminLayout.jsx
import { usePage } from '@inertiajs/react'

export default function AdminLayout({ children }) {
  const { auth } = usePage().props

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <p className="mb-6 font-bold">Admin</p>
        <nav className="flex flex-col gap-2">
          <Link href={route('dashboard')}>Dashboard</Link>
          <Link href={route('products.index')}>Produk</Link>
          <Link href={route('categories.index')}>Kategori</Link>
          <Link href={route('users.index')}>User</Link>
        </nav>
        <p className="mt-auto text-xs text-gray-400">{auth.user?.name}</p>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  )
}
```

```jsx
// Pages/Katalog.jsx
import PublicLayout from '@/Layouts/PublicLayout'

function Katalog({ products }) {
  return <div>...</div>
}

Katalog.layout = (page) => <PublicLayout>{page}</PublicLayout>
export default Katalog
```

```jsx
// Pages/Products/Index.jsx
import AdminLayout from '@/Layouts/AdminLayout'

function Index({ products }) {
  return <div>...</div>
}

Index.layout = (page) => <AdminLayout>{page}</AdminLayout>
export default Index
```

| Halaman | Layout | Alasan |
|---|---|---|
| Beranda, Katalog | `PublicLayout` | Navbar & footer publik, tanpa sidebar |
| Dashboard, CRUD | `AdminLayout` | Sidebar admin, data user |
| Login, Register | `GuestLayout` | Fokus ke form, tanpa navigasi |

---

## ✅ Checklist Bab 6

- **Dua pola** — bungkus langsung vs `Page.layout` (persistent).
- **Persistent layout** — tidak di-mount ulang; state sidebar/scroll terjaga.
- **Nested layout** — `AppLayout` → `DashboardLayout` → halaman.
- **`<Head>`** — title, description, Open Graph; title default di `app.jsx`.
- **Default layout** — bisa dipasang di `resolve` agar tidak berulang.
- **Layout per area** — publik, admin, guest; pilih sesuai kebutuhan.
- **Hindari layout ganda** — jangan bungkus ulang layout default.

---

⏭️ Lanjut ke [🌐 Bab 7 — Shared Data](/bagian-3/bab-7) untuk melanjutkan!
