---
title: "Bab 12 — CRUD Lengkap"
---

# 📖 Bab 12 — CRUD Lengkap

Sekarang saatnya merangkai semuanya: route resource, controller, halaman index/create/edit, form bersama, dan hapus data. Pola di bab ini akan Anda ulangi untuk hampir semua resource — kategori, user, pesanan — sehingga layak dikuasai sampai hafal.

---

## 12.1 🛣️ Routing & Controller

```php
// routes/web.php
use App\Http\Controllers\ProductController;

Route::middleware('auth')->group(function () {
    Route::resource('products', ProductController::class);
});
```

| Method controller | Route | Halaman React |
|---|---|---|
| `index` | `GET /products` | `Products/Index.jsx` |
| `create` | `GET /products/create` | `Products/Create.jsx` |
| `store` | `POST /products` | redirect + flash |
| `show` | `GET /products/{product}` | `Products/Show.jsx` |
| `edit` | `GET /products/{product}/edit` | `Products/Edit.jsx` |
| `update` | `PUT/PATCH /products/{product}` | redirect + flash |
| `destroy` | `DELETE /products/{product}` | redirect + flash |

Controller ringkas:

```php
class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('Products/Index', [
            'products' => Product::latest()->paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/Create', [
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        Product::create($request->validated());

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil ditambahkan!');
    }

    public function edit(Product $product)
    {
        return Inertia::render('Products/Edit', [
            'product'    => $product->only('id', 'name', 'price', 'category_id'),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil diperbarui!');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil dihapus!');
    }
}
```

> 💡 **Route model binding** otomatis mencari `Product` berdasarkan `{product}`. Jika tidak ditemukan, Laravel mengembalikan 404 — tidak perlu `findOrFail` manual.

---

## 12.2 🧩 Satu Form untuk Create & Edit

Jangan menduplikasi form. Buat komponen `ProductForm` yang menerima `initial` dan `action`.

```jsx
// resources/js/Components/ProductForm.jsx
import { useForm } from '@inertiajs/react'

export default function ProductForm({ initial, categories, method = 'post', url }) {
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: initial?.name ?? '',
    price: initial?.price ?? '',
    category_id: initial?.category_id ?? '',
  })

  function submit(e) {
    e.preventDefault()
    const opsi = { preserveScroll: true }
    if (method === 'put') {
      put(url, opsi)
    } else {
      post(url, { ...opsi, onSuccess: () => reset() })
    }
  }

  return (
    <form onSubmit={submit} className="max-w-lg">
      <input
        value={data.name}
        onChange={(e) => setData('name', e.target.value)}
        placeholder="Nama produk"
        className="w-full rounded border px-3 py-2 mb-1"
      />
      {errors.name && <p className="mb-3 text-sm text-red-600">{errors.name}</p>}

      <input
        type="number"
        value={data.price}
        onChange={(e) => setData('price', e.target.value)}
        placeholder="Harga"
        className="w-full rounded border px-3 py-2 mb-1"
      />
      {errors.price && <p className="mb-3 text-sm text-red-600">{errors.price}</p>}

      <select
        value={data.category_id}
        onChange={(e) => setData('category_id', e.target.value)}
        className="w-full rounded border px-3 py-2 mb-1"
      >
        <option value="">Pilih kategori</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {errors.category_id && <p className="mb-3 text-sm text-red-600">{errors.category_id}</p>}

      <button disabled={processing} className="rounded bg-purple-600 px-4 py-2 text-white">
        {processing ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  )
}
```

**Create:**

```jsx
import { Head } from '@inertiajs/react'
import ProductForm from '@/Components/ProductForm'

export default function Create({ categories }) {
  return (
    <>
      <Head title="Tambah Produk" />
      <h1 className="mb-4 text-xl font-bold">Tambah Produk</h1>
      <ProductForm
        categories={categories}
        method="post"
        url={route('products.store')}
      />
    </>
  )
}
```

**Edit:**

```jsx
import { Head } from '@inertiajs/react'
import ProductForm from '@/Components/ProductForm'

export default function Edit({ product, categories }) {
  return (
    <>
      <Head title={`Edit ${product.name}`} />
      <h1 className="mb-4 text-xl font-bold">Edit Produk</h1>
      <ProductForm
        initial={product}
        categories={categories}
        method="put"
        url={route('products.update', product.id)}
      />
    </>
  )
}
```

| Props | Create | Edit |
|---|---|---|
| `initial` | — | data produk |
| `method` | `post` | `put` |
| `url` | `products.store` | `products.update` |

---

## 12.3 📋 Halaman Index

```jsx
import { Head, Link, router } from '@inertiajs/react'

export default function Index({ products }) {
  return (
    <>
      <Head title="Produk" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Produk</h1>
        <Link
          href={route('products.create')}
          className="rounded bg-purple-600 px-4 py-2 text-white"
        >
          Tambah
        </Link>
      </div>

      <table className="w-full bg-white text-left shadow">
        <thead>
          <tr>
            <th className="p-3">Nama</th>
            <th className="p-3">Harga</th>
            <th className="p-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {products.data.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.name}</td>
              <td className="p-3">Rp{p.price.toLocaleString('id-ID')}</td>
              <td className="p-3 flex gap-2">
                <Link
                  href={route('products.edit', p.id)}
                  className="text-blue-600"
                >
                  Edit
                </Link>
                <button
                  onClick={() => hapus(p)}
                  className="text-red-600"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function hapus(produk) {
  if (confirm(`Hapus "${produk.name}"?`)) {
    router.delete(route('products.destroy', produk.id), {
      preserveScroll: true,
    })
  }
}
```

> 💡 Untuk aplikasi nyata, ganti `confirm` dengan modal dari Bab 11.

---

## 12.4 🗑️ Hapus Data dengan Benar

```jsx
function hapus(id) {
  router.delete(route('products.destroy', id), {
    preserveScroll: true,
    preserveState: true,
  })
}
```

| Opsi | Efek |
|---|---|
| `preserveScroll` | Tidak melompat ke atas setelah hapus |
| `preserveState` | Filter/pencarian tetap |
| `only` | Muat ulang props tertentu saja |

> ⚠️ **Jangan hapus lewat GET.** Route destroy harus `DELETE` agar tidak terpicu oleh prefetch, crawler, atau refresh browser.

---

## 12.5 🔄 Redirect yang Benar

| Aksi | Redirect |
|---|---|
| `store` | `redirect()->route('products.index')` + flash |
| `update` | `redirect()->route('products.index')` + flash |
| `destroy` | `redirect()->route('products.index')` + flash |
| Validasi gagal | otomatis `back()` dengan errors |
| Ingin tetap di halaman edit | `back()->with('success', ...)` |

```text
POST/PUT/DELETE
      │
      ▼
   redirect (303)
      │
      ▼
   GET halaman tujuan
      │
      ▼
   props baru + flash
```

---

## 12.6 🎬 Studi Kasus: CRUD Produk End-to-End

**1. Migration & model:**

```bash
php artisan make:model Product -mf
```

```php
// migration
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->foreignId('category_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->decimal('price', 12, 2);
    $table->timestamps();
});
```

**2. Form Request:**

```bash
php artisan make:request StoreProductRequest
php artisan make:request UpdateProductRequest
```

```php
public function rules(): array
{
    return [
        'name'        => ['required', 'string', 'max:255'],
        'price'       => ['required', 'numeric', 'min:0'],
        'category_id' => ['required', 'exists:categories,id'],
    ];
}
```

**3. Routes, controller, halaman** — seperti di atas.

**4. Uji alur:**

```text
/products            → daftar + tombol tambah
/products/create     → form kosong → submit → redirect + flash
/products/5/edit     → form terisi → submit → redirect + flash
hapus                → konfirmasi → DELETE → redirect + flash
```

Jika semua langkah berhasil, Anda sudah punya CRUD produksi. Bab 13 menambahkan search, filter, dan pagination.

---

## ✅ Checklist Bab 12

- **`Route::resource`** — tujuh route standar dengan satu baris.
- **Route model binding** — `Product $product` otomatis 404 bila tidak ada.
- **Form bersama** — `ProductForm` dipakai create & edit.
- **Index** — tabel + link edit/hapus + tombol tambah.
- **Hapus** — `router.delete`, bukan GET; `preserveScroll`.
- **Redirect** — selalu setelah mutasi, dengan flash.
- **Form Request** — validasi terpisah untuk store & update.
- **Konsistensi** — pola ini bisa diulang untuk resource lain.

---

⏭️ Lanjut ke [🔍 Bab 13 — Pagination, Search & Filter](/bagian-5/bab-13) untuk melanjutkan!
