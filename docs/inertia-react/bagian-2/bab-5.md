---
title: "Bab 5 — Navigasi: Link & Router"
---

# 📖 Bab 5 — Navigasi: Link & Router

Di aplikasi Inertia, jangan memakai `<a href>` untuk navigasi internal — itu memicu reload penuh dan membuang seluruh keuntungan SPA. Gunakan `<Link>` untuk navigasi deklaratif dan `router` untuk navigasi programatik. Bab ini juga membahas opsi penting seperti `preserveState`, `preserveScroll`, `only`, dan prefetch.

---

## 5.1 🔗 Komponen `<Link>`

```jsx
import { Link } from '@inertiajs/react'

export default function Navbar() {
  return (
    <nav>
      <Link href={route('dashboard')}>Dashboard</Link>
      <Link href={route('products.index')}>Produk</Link>
    </nav>
  )
}
```

Method selain GET — jangan pakai `<a>`:

```jsx
<Link href={route('logout')} method="post" as="button">
  Logout
</Link>
```

Prefetch saat hover (Inertia v2):

```jsx
<Link href={route('products.show', p.id)} prefetch>
  Detail
</Link>
```

| Prop | Fungsi |
|---|---|
| `href` | URL tujuan (biasanya dari `route()`) |
| `method` | `get` (default), `post`, `put`, `patch`, `delete` |
| `as` | Tag yang dirender (`a`, `button`, `div`) |
| `data` | Data tambahan untuk request |
| `preserveScroll` | Pertahankan posisi scroll |
| `preserveState` | Pertahankan state komponen |
| `replace` | Ganti history, bukan menambah |
| `prefetch` | Muat halaman tujuan lebih awal |
| `only` | Partial reload props tertentu |
| `onSuccess` / `onError` / `onFinish` | Callback lifecycle |

> ⚠️ **`<a href>` biasa akan reload penuh.** Semua manfaat Inertia (tanpa reload, persistent layout, state terjaga) hilang. Untuk link eksternal, `<a>` justru benar.

---

## 5.2 🧭 Navigasi Programatik dengan `router`

Gunakan `router` ketika navigasi terjadi setelah logika — misalnya setelah validasi lokal atau dari event non-link.

```jsx
import { router } from '@inertiajs/react'

// GET dengan query
router.get(route('products.index'), { search: 'laptop' })

// POST
router.post(route('products.store'), data)

// PUT / PATCH / DELETE
router.put(route('products.update', id), data)
router.delete(route('products.destroy', id))

// Reload halaman saat ini
router.reload()

// Reload hanya props tertentu (partial reload)
router.reload({ only: ['products'] })
```

| Method | Kegunaan |
|---|---|
| `router.visit(url, options)` | Navigasi generik |
| `router.get/post/put/patch/delete` | Shortcut per method |
| `router.reload(options)` | Muat ulang halaman saat ini |
| `router.prefetch(url)` | Prefetch manual |
| `router.cancel()` | Batalkan request berjalan (v2) |

### `router.visit` vs shortcut

```jsx
router.visit(route('products.index'), {
  method: 'get',
  data: { search: 'laptop' },
  preserveState: true,
})

// setara dengan
router.get(route('products.index'), { search: 'laptop' }, { preserveState: true })
```

---

## 5.3 ⚙️ Opsi Penting

| Opsi | Default | Fungsi |
|---|---|---|
| `preserveScroll` | `false` | Scroll tidak lompat ke atas |
| `preserveState` | `false` (GET), `true` (non-GET) | State komponen tidak di-reset |
| `replace` | `false` | Tidak menambah entri history |
| `only` | — | Hanya muat props yang disebut |
| `except` | — | Muat semua kecuali props yang disebut |
| `data` | — | Data tambahan (query/body) |
| `onSuccess` | — | Dipanggil setelah sukses |
| `onError` | — | Dipanggil saat ada error validasi |
| `onFinish` | — | Selalu dipanggil di akhir |
| `onCancel` | — | Dipanggil saat request dibatalkan |
| `async` | `false` | Kembalikan promise (v2) |

Contoh pencarian yang tidak mengubah scroll dan mempertahankan isi input:

```jsx
router.get(route('products.index'), { search }, {
  preserveState: true,
  preserveScroll: true,
  replace: true,
})
```

**Kapan `replace: true`?** Untuk filter/pencarian — agar tombol Back tidak menelusuri setiap ketikan.

---

## 5.4 🎯 Active Link

`usePage().url` berisi URL saat ini (termasuk query string). Cocokkan dengan path link.

```jsx
import { Link, usePage } from '@inertiajs/react'

export default function Navbar() {
  const { url } = usePage()

  const aktif = (path) => url.startsWith(path)

  return (
    <nav>
      <Link
        href={route('dashboard')}
        className={aktif('/dashboard') ? 'text-purple-600 font-bold' : ''}
      >
        Dashboard
      </Link>
      <Link
        href={route('products.index')}
        className={aktif('/products') ? 'text-purple-600 font-bold' : ''}
      >
        Produk
      </Link>
    </nav>
  )
}
```

Alternatif dengan Ziggy:

```jsx
route().current('products.*')   // true untuk /products, /products/5, dst.
```

| Cara | Kelebihan |
|---|---|
| `url.startsWith()` | Tidak bergantung Ziggy |
| `route().current('products.*')` | Lebih ekspresif untuk pola route |
| `usePage().component` | Cocok untuk mencocokkan nama halaman |

> 💡 **Hati-hati `/`:** `url.startsWith('/')` selalu true. Cocokkan path spesifik atau gunakan `route().current()`.

---

## 5.5 🎬 Studi Kasus: Navbar dengan Menu Aktif

```jsx
// resources/js/Components/NavLink.jsx
import { Link } from '@inertiajs/react'

export default function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      className={
        'px-3 py-2 rounded-md text-sm font-medium ' +
        (active
          ? 'bg-purple-100 text-purple-700'
          : 'text-gray-600 hover:text-gray-900')
      }
    >
      {children}
    </Link>
  )
}
```

```jsx
// resources/js/Layouts/AppLayout.jsx
import { usePage } from '@inertiajs/react'
import NavLink from '@/Components/NavLink'

export default function AppLayout({ children }) {
  const { url } = usePage()
  const aktif = (path) => url.startsWith(path)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex gap-2 p-4 bg-white shadow">
        <NavLink href={route('dashboard')} active={aktif('/dashboard')}>
          Dashboard
        </NavLink>
        <NavLink href={route('products.index')} active={aktif('/products')}>
          Produk
        </NavLink>
        <NavLink href={route('categories.index')} active={aktif('/categories')}>
          Kategori
        </NavLink>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
```

Hasilnya: menu aktif berubah otomatis setiap navigasi, tanpa state tambahan dan tanpa reload.

---

## 5.6 🔁 Navigasi yang Sering Salah

| Situasi | Salah | Benar |
|---|---|---|
| Link internal | `<a href="/products">` | `<Link href={route('products.index')}>` |
| Logout | `<a href="/logout">` | `<Link method="post" as="button">` |
| Submit form | `fetch()` manual | `useForm().post()` (Bab 9) |
| Filter pencarian | `window.location = ...` | `router.get(..., { preserveState: true })` |
| Buka tab baru | `<Link target="_blank">` | `<a target="_blank">` (reload penuh wajar) |

> ⚠️ **`target="_blank"` pada `<Link>`** tidak membuka tab baru dengan benar karena Inertia mencegat klik. Untuk tab baru, gunakan `<a>` biasa.

---

## ✅ Checklist Bab 5

- **`<Link>`** — navigasi internal tanpa reload; wajib untuk link di dalam aplikasi.
- **Method non-GET** — gunakan `<Link method="post" as="button">` untuk logout dan aksi serupa.
- **`router`** — untuk navigasi programatik: `get`, `post`, `put`, `delete`, `reload`, `visit`.
- **Opsi** — `preserveState`, `preserveScroll`, `replace`, `only`, `except`, callback lifecycle.
- **Partial reload** — `only: ['products']` menghemat data yang dikirim.
- **Active link** — `usePage().url` atau `route().current()`.
- **Prefetch** — `prefetch` mempercepat navigasi yang diprediksi.
- **Jangan** pakai `<a>` untuk internal atau `<Link target="_blank">` untuk tab baru.

---

⏭️ Lanjut ke [🖼️ Bab 6 — Layout & Head](/bagian-2/bab-6) untuk melanjutkan!
