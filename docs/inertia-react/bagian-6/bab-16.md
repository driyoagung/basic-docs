---
title: "Bab 16 — Otorisasi & RBAC di Frontend"
---

# 📖 Bab 16 — Otorisasi & RBAC di Frontend

Autentikasi menjawab "siapa Anda"; otorisasi menjawab "apa yang boleh Anda lakukan". Di Inertia, pembagian tugasnya jelas: **Laravel adalah penjaga sebenarnya**, React hanya menyesuaikan tampilan. Bab ini menyambungkan Spatie Permission, Policy, shared data, hook `useCan`, dan komponen `<Can>` menjadi RBAC yang aman dan rapi.

---

## 16.1 🔐 Kirim Permission via Shared Data

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),

        'auth' => [
            'user' => $request->user() ? [
                'id'          => $request->user()->id,
                'name'        => $request->user()->name,
                'email'       => $request->user()->email,
                'roles'       => $request->user()->getRoleNames(),
                'permissions' => $request->user()->getAllPermissions()->pluck('name'),
            ] : null,
        ],
    ];
}
```

```jsx
import { usePage } from '@inertiajs/react'

const { auth } = usePage().props
auth.user?.permissions.includes('delete products')
```

| Field | Isi |
|---|---|
| `roles` | Nama role (`admin`, `editor`, `viewer`) |
| `permissions` | Daftar permission efektif (termasuk dari role) |
| `auth.user` | `null` bila belum login |

> ⚠️ **Jangan kirim seluruh model user.** Cukup id, name, email, roles, permissions. Field sensitif tidak boleh masuk props.

---

## 16.2 🪝 Hook `useCan`

```jsx
// resources/js/hooks/useCan.js
import { usePage } from '@inertiajs/react'

export function useCan() {
  const { auth } = usePage().props

  return {
    can: (permission) =>
      auth?.user?.permissions?.includes(permission) ?? false,

    hasRole: (role) =>
      auth?.user?.roles?.includes(role) ?? false,

    hasAnyRole: (roles) =>
      roles.some((r) => auth?.user?.roles?.includes(r)),
  }
}
```

Pemakaian:

```jsx
import { useCan } from '@/hooks/useCan'

export default function AksiProduk({ produk }) {
  const { can } = useCan()

  return (
    <div>
      {can('edit products') && <a href={route('products.edit', produk.id)}>Edit</a>}
      {can('delete products') && <button>Hapus</button>}
    </div>
  )
}
```

| Fungsi | Contoh |
|---|---|
| `can(permission)` | `can('create products')` |
| `hasRole(role)` | `hasRole('admin')` |
| `hasAnyRole([...])` | `hasAnyRole(['admin', 'editor'])` |

---

## 16.3 🧩 Komponen `<Can>`

Menyembunyikan JSX dengan kondisi berulang melelahkan. Bungkus jadi komponen.

```jsx
// resources/js/Components/Can.jsx
import { useCan } from '@/hooks/useCan'

export default function Can({ permission, role, children, fallback = null }) {
  const { can, hasRole } = useCan()

  const boleh = permission ? can(permission) : role ? hasRole(role) : false

  return boleh ? children : fallback
}
```

```jsx
<Can permission="delete products">
  <button onClick={() => hapus(produk.id)}>Hapus</button>
</Can>

<Can role="admin">
  <Link href={route('users.index')}>Kelola User</Link>
</Can>
```

| Props | Fungsi |
|---|---|
| `permission` | Cek permission |
| `role` | Cek role |
| `fallback` | Tampilan alternatif |
| `children` | Ditampilkan bila boleh |

---

## 16.4 🛡️ Policy di Laravel + `can` per Item

Policy adalah sumber kebenaran per item. Resource mengirim hasilnya ke UI (Bab 14).

```bash
php artisan make:policy ProductPolicy --model=Product
```

```php
// app/Policies/ProductPolicy.php
public function update(User $user, Product $product): bool
{
    return $user->can('edit products')
        || $product->owner_id === $user->id;
}

public function delete(User $user, Product $product): bool
{
    return $user->can('delete products');
}
```

**Controller:**

```php
public function update(UpdateProductRequest $request, Product $product)
{
    $this->authorize('update', $product);

    $product->update($request->validated());

    return redirect()->route('products.index')
        ->with('success', 'Produk diperbarui');
}
```

**Resource:**

```php
'can' => [
    'update' => $request->user()?->can('update', $this->resource) ?? false,
    'delete' => $request->user()?->can('delete', $this->resource) ?? false,
],
```

```text
Policy (Laravel) ──► controller authorize ──► 403 bila gagal
      │
      └──► Resource 'can' ──► tombol tampil/sembunyi
```

---

## 16.5 🚦 Proteksi Route

```php
// routes/web.php
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::resource('users', UserController::class);
});

Route::middleware(['auth', 'permission:manage products'])->group(function () {
    Route::resource('products', ProductController::class);
});
```

| Middleware | Efek |
|---|---|
| `role:admin` | Hanya role admin |
| `role:admin\|editor` | Salah satu role |
| `permission:edit products` | Butuh permission tertentu |
| `permission:edit products\|delete products` | Salah satu permission |

> 🚨 **Menyembunyikan tombol bukan keamanan.** User bisa memanggil URL langsung. Route dan aksi harus dilindungi middleware/Policy.

---

## 16.6 🚫 Halaman 403 yang Ramah

Buat halaman error yang tetap memakai layout aplikasi (detail di Bab 17).

```jsx
// Pages/Errors/403.jsx
import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'

export default function Forbidden() {
  return (
    <AppLayout>
      <Head title="Akses Ditolak" />
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold">403 — Akses Ditolak</h1>
        <p className="mt-2 text-gray-600">
          Anda tidak memiliki izin untuk membuka halaman ini.
        </p>
        <Link href={route('dashboard')} className="mt-6 inline-block text-purple-600">
          Kembali ke Dashboard
        </Link>
      </div>
    </AppLayout>
  )
}
```

---

## 16.7 🎬 Studi Kasus: Sidebar Dinamis per Role

Tiga role: **Admin** (semua), **Editor** (produk & kategori), **Viewer** (hanya lihat).

```jsx
// resources/js/Layouts/AdminLayout.jsx
import { Link, usePage } from '@inertiajs/react'

const MENU = [
  { label: 'Dashboard', route: 'dashboard', permission: null },
  { label: 'Produk', route: 'products.index', permission: 'view products' },
  { label: 'Kategori', route: 'categories.index', permission: 'view categories' },
  { label: 'User & Role', route: 'users.index', role: 'admin' },
]

export default function AdminLayout({ children }) {
  const { auth } = usePage().props
  const user = auth.user

  const boleh = (item) => {
    if (item.role) return user.roles.includes(item.role)
    if (item.permission) return user.permissions.includes(item.permission)
    return true
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 p-4 text-white">
        <p className="mb-6 font-bold">Admin Panel</p>
        <nav className="flex flex-col gap-2">
          {MENU.filter(boleh).map((item) => (
            <Link key={item.route} href={route(item.route)}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 text-xs text-gray-400">
          {user.name} · {user.roles.join(', ')}
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  )
}
```

| Role | Menu yang tampil |
|---|---|
| **Admin** | Dashboard, Produk, Kategori, User & Role |
| **Editor** | Dashboard, Produk, Kategori |
| **Viewer** | Dashboard, Produk (tanpa tombol edit/hapus) |

Tombol aksi tetap dijaga terpisah:

```jsx
<Can permission="edit products">
  <Link href={route('products.edit', produk.id)}>Edit</Link>
</Can>
```

---

## ✅ Checklist Bab 16

- **Shared data** — kirim `roles` dan `permissions`, bukan model user penuh.
- **`useCan`** — `can`, `hasRole`, `hasAnyRole`.
- **`<Can>`** — bungkus JSX agar tidak berulang.
- **Policy** — sumber kebenaran per item; `authorize()` di controller.
- **`can` per item** — dari Resource, dipakai untuk tombol.
- **Middleware** — `role:` dan `permission:` melindungi route.
- **403** — halaman ramah dengan layout konsisten.
- **Prinsip** — UI menyembunyikan, backend menolak.

---

⏭️ Lanjut ke [🚨 Bab 17 — Error Handling](/bagian-7/bab-17) untuk melanjutkan!
