---
title: "Bab 20 — Testing"
---

# 📖 Bab 20 — Testing

Inertia membuat testing lebih sederhana karena tidak ada API terpisah: test backend cukup memeriksa komponen dan props, test frontend cukup merender komponen dengan props palsu. Bab ini membahas `assertInertia` dengan Pest, test validasi & otorisasi, serta Vitest + React Testing Library untuk komponen.

---

## 20.1 🧪 Test Backend dengan `assertInertia`

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

| Method | Fungsi |
|---|---|
| `component('Products/Index')` | Memastikan komponen yang dirender |
| `has('products.data', 3)` | Memastikan jumlah item |
| `where('filters.search', 'laptop')` | Memastikan nilai props |
| `missing('secret')` | Memastikan props tidak ada |
| `has('products.data.0', fn (Assert $p) => ...)` | Memeriksa item |

Contoh lebih lengkap:

```php
it('mengirim produk dengan kategori', function () {
    $user = User::factory()->create();
    $kategori = Category::factory()->create(['name' => 'Elektronik']);
    Product::factory()->create(['category_id' => $kategori->id]);

    $this->actingAs($user)
        ->get(route('products.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Products/Index')
            ->has('products.data', 1)
            ->where('products.data.0.category.name', 'Elektronik')
            ->where('auth.user.id', $user->id)
        );
});
```

> 💡 **Test props, bukan markup.** Markup React diuji terpisah di sisi frontend. Di backend, fokus pada komponen + data.

---

## 20.2 ✅ Test Validasi & Redirect

```php
it('menolak produk tanpa nama', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('products.store'), ['price' => 1000])
        ->assertSessionHasErrors('name');

    expect(Product::count())->toBe(0);
});

it('menyimpan produk yang valid', function () {
    $user = User::factory()->create();
    $kategori = Category::factory()->create();

    $this->actingAs($user)
        ->post(route('products.store'), [
            'name' => 'Laptop',
            'price' => 15000000,
            'category_id' => $kategori->id,
        ])
        ->assertRedirect(route('products.index'))
        ->assertSessionHas('success');

    expect(Product::where('name', 'Laptop')->exists())->toBeTrue();
});
```

| Assertion | Fungsi |
|---|---|
| `assertSessionHasErrors('field')` | Validasi gagal pada field |
| `assertRedirect(...)` | Redirect yang benar |
| `assertSessionHas('success')` | Flash message |
| `assertForbidden()` | 403 |
| `assertNotFound()` | 404 |

---

## 20.3 🛡️ Test Otorisasi

```php
it('viewer tidak boleh menghapus produk', function () {
    $viewer = User::factory()->create();
    $viewer->assignRole('viewer');

    $produk = Product::factory()->create();

    $this->actingAs($viewer)
        ->delete(route('products.destroy', $produk))
        ->assertForbidden();

    expect(Product::count())->toBe(1);
});

it('admin boleh menghapus produk', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $produk = Product::factory()->create();

    $this->actingAs($admin)
        ->delete(route('products.destroy', $produk))
        ->assertRedirect(route('products.index'));

    expect(Product::find($produk->id))->toBeNull();
});
```

> 🚨 **Selalu uji jalur negatif.** Bug keamanan paling berbahaya adalah aksi yang seharusnya ditolak tetapi lolos.

---

## 20.4 🧩 Test Komponen React (Vitest + RTL)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./resources/js/test/setup.js'],
  },
})
```

```js
// resources/js/test/setup.js
import '@testing-library/jest-dom/vitest'
```

Contoh test komponen murni:

```jsx
// resources/js/Components/Pagination.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Pagination from './Pagination'

vi.mock('@inertiajs/react', () => ({
  Link: ({ href, children }) => <a href={href}>{children}</a>,
}))

describe('Pagination', () => {
  it('menandai halaman aktif', () => {
    const links = [
      { url: '/products?page=1', label: '1', active: true },
      { url: '/products?page=2', label: '2', active: false },
    ]

    render(<Pagination links={links} />)

    expect(screen.getByText('1')).toHaveClass('bg-purple-600')
    expect(screen.getByText('2')).not.toHaveClass('bg-purple-600')
  })
})
```

---

## 20.5 🎭 Mock `usePage` dan `useForm`

Komponen yang bergantung pada Inertia perlu dimock.

```jsx
// resources/js/test/mockInertia.js
import { vi } from 'vitest'

export function mockPage(props = {}) {
  vi.mock('@inertiajs/react', async () => {
    const actual = await vi.importActual('@inertiajs/react')
    return {
      ...actual,
      usePage: () => ({
        props: {
          auth: { user: { id: 1, name: 'Budi', permissions: ['view products'] } },
          flash: {},
          ...props,
        },
        url: '/products',
      }),
      router: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), reload: vi.fn() },
    }
  })
}
```

Test tombol berbasis permission:

```jsx
import { render, screen } from '@testing-library/react'
import { mockPage } from '@/test/mockInertia'

mockPage({
  auth: { user: { id: 1, name: 'Budi', permissions: [] } },
})

it('menyembunyikan tombol hapus tanpa permission', () => {
  render(<AksiProduk produk={{ id: 1, name: 'Laptop' }} />)
  expect(screen.queryByText('Hapus')).not.toBeInTheDocument()
})
```

| Yang dimock | Alasan |
|---|---|
| `usePage` | Menyediakan `auth`, `flash`, `url` |
| `router` | Menghindari request nyata |
| `useForm` | Bila komponen menguji form |

---

## 20.6 🌐 Test End-to-End (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

```js
// tests/e2e/produk.spec.js
import { test, expect } from '@playwright/test'

test('admin dapat menambah produk', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type=email]', 'admin@toko.test')
  await page.fill('input[type=password]', 'password')
  await page.click('button[type=submit]')

  await page.goto('/products/create')
  await page.fill('input[placeholder="Nama produk"]', 'Laptop')
  await page.fill('input[placeholder="Harga"]', '15000000')
  await page.click('text=Simpan')

  await expect(page).toHaveURL('/products')
  await expect(page.getByText('Produk berhasil ditambahkan!')).toBeVisible()
})
```

| Level | Alat | Fokus |
|---|---|---|
| Unit backend | Pest | Logika & query |
| Feature backend | Pest + `assertInertia` | Props & komponen |
| Komponen | Vitest + RTL | Render & interaksi |
| E2E | Playwright | Alur user nyata |

---

## ✅ Checklist Bab 20

- **`assertInertia`** — uji komponen + props, bukan markup.
- **Validasi** — `assertSessionHasErrors`, pastikan data tidak tersimpan.
- **Redirect & flash** — `assertRedirect`, `assertSessionHas`.
- **Otorisasi** — uji jalur positif dan negatif (`assertForbidden`).
- **Vitest + RTL** — test komponen dengan mock `@inertiajs/react`.
- **Mock** — `usePage`, `router`, `useForm`.
- **E2E** — Playwright untuk alur login → CRUD.
- **Piramida** — banyak test backend/komponen, sedikit E2E.

---

⏭️ Lanjut ke [🎯 Bab 21 — Dashboard Produk + RBAC](/bagian-8/bab-21) untuk melanjutkan!
