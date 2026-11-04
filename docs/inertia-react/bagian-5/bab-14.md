---
title: "Bab 14 — Membentuk Data: Eloquent Resource"
---

# 📖 Bab 14 — Membentuk Data: Eloquent Resource

Mengirim model Eloquent mentah ke props itu cepat, tetapi berbahaya dan rapuh: kolom sensitif bisa bocor, bentuk data berubah saat skema berubah, dan relasi membengkak tanpa kendali. **Eloquent Resource** adalah lapisan pembentuk data yang eksplisit — hanya field yang Anda sebut yang dikirim. Bab ini membahas Resource, `whenLoaded`, `can` per item, dan studi kasus lengkap.

---

## 14.1 🚨 Mengapa Tidak Kirim Model Mentah

```php
// ❌ Semua atribut ikut, kecuali yang di-$hidden
return Inertia::render('Products/Index', [
    'products' => Product::all(),
]);
```

Risiko:

| Risiko | Contoh |
|---|---|
| Kebocoran kolom | `internal_note`, `cost_price`, `supplier_id` |
| Bentuk tidak stabil | Tambah kolom DB → props ikut berubah |
| Relasi tak terkendali | Nested object besar tanpa perlu |
| N+1 | Relasi diakses di React memicu query tambahan |
| Tipe membingungkan | `Decimal` dikirim sebagai string |

```text
Model mentah ──► semua kolom (kecuali $hidden) ──► browser
Resource     ──► hanya field yang Anda pilih ────► browser
```

> 🚨 **`$hidden` bukan pengaman utama.** Ia mudah terlupa saat menambah kolom baru. Resource memaksa Anda memilih field secara sadar.

---

## 14.2 🧱 `JsonResource` Dasar

```bash
php artisan make:resource ProductResource
```

```php
// app/Http/Resources/ProductResource.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'price'      => (float) $this->price,
            'is_active'  => $this->is_active,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
```

Pemakaian:

```php
use App\Http\Resources\ProductResource;

return Inertia::render('Products/Index', [
    'products' => ProductResource::collection(Product::paginate(10)),
]);
```

| Pemakaian | Hasil |
|---|---|
| `new ProductResource($product)` | Satu item |
| `ProductResource::collection($products)` | Koleksi |
| `ProductResource::collection(Product::paginate())` | Koleksi + metadata pagination |

---

## 14.3 🔗 Relasi dengan `whenLoaded`

Jangan sertakan relasi yang belum di-eager-load — itu memicu N+1.

```php
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'name'     => $this->name,
            'price'    => (float) $this->price,

            'category' => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ]),
        ];
    }
}
```

```php
// Controller — eager load
$products = Product::with('category')->paginate(10);
```

| Kondisi | Hasil props |
|---|---|
| `with('category')` | `category` berisi object |
| Tanpa eager load | `category` tidak ada |
| `whenLoaded('category')` | Tidak memicu query tambahan |

> 💡 **`whenLoaded` adalah pengaman, bukan pengganti eager loading.** Tetap panggil `with()` di controller agar data benar-benar tersedia.

---

## 14.4 🔐 Menyembunyikan Kolom Sensitif

```php
public function toArray(Request $request): array
{
    return [
        'id'    => $this->id,
        'name'  => $this->name,
        'email' => $this->email,

        // hanya untuk pemilik atau admin
        'phone' => $this->when(
            $request->user()?->id === $this->id || $request->user()?->isAdmin(),
            $this->phone,
        ),

        // jangan pernah:
        // 'password' => $this->password,
        // 'remember_token' => $this->remember_token,
    ];
}
```

| Helper | Fungsi |
|---|---|
| `when($kondisi, $nilai)` | Sertakan bila kondisi true |
| `mergeWhen($kondisi, [...])` | Gabungkan beberapa field bila true |
| `whenHas($atribut)` | Sertakan bila atribut ada |
| `whenNotNull($nilai)` | Sertakan bila tidak null |

---

## 14.5 🛡️ `can` per Item

Resource bisa mengirim hak akses per baris agar UI tahu tombol mana yang tampil.

```php
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'    => $this->id,
            'name'  => $this->name,
            'price' => (float) $this->price,

            'can' => [
                'update' => $request->user()?->can('update', $this->resource) ?? false,
                'delete' => $request->user()?->can('delete', $this->resource) ?? false,
            ],
        ];
    }
}
```

```jsx
{produk.can.update && <Link href={route('products.edit', produk.id)}>Edit</Link>}
{produk.can.delete && <button onClick={() => hapus(produk.id)}>Hapus</button>}
```

> ⚠️ **Ini hanya untuk tampilan.** Backend tetap harus memeriksa Policy di controller (Bab 16).

---

## 14.6 🎬 Studi Kasus: `ProductResource` Lengkap

**Controller:**

```php
public function index(Request $request)
{
    $products = Product::query()
        ->with(['category', 'images'])
        ->latest()
        ->paginate(10)
        ->withQueryString();

    return Inertia::render('Products/Index', [
        'products' => ProductResource::collection($products),
    ]);
}
```

**Resource:**

```php
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'price'       => (float) $this->price,
            'is_active'   => $this->is_active,
            'created_at'  => $this->created_at->toIso8601String(),

            'category' => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ]),

            'gambar' => $this->whenLoaded('images', fn () =>
                $this->images->map(fn ($img) => [
                    'id'  => $img->id,
                    'url' => asset("storage/{$img->path}"),
                ])
            ),

            'can' => [
                'update' => $request->user()?->can('update', $this->resource) ?? false,
                'delete' => $request->user()?->can('delete', $this->resource) ?? false,
            ],
        ];
    }
}
```

**Halaman React:**

```jsx
export default function Index({ products }) {
  return (
    <table>
      <tbody>
        {products.data.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.category?.name}</td>
            <td>Rp{p.price.toLocaleString('id-ID')}</td>
            <td>
              {p.can.update && <Link href={route('products.edit', p.id)}>Edit</Link>}
              {p.can.delete && <button onClick={() => hapus(p.id)}>Hapus</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

Bentuk props yang dihasilkan:

```json
{
  "id": 5,
  "name": "Laptop",
  "price": 15000000,
  "category": { "id": 2, "name": "Elektronik" },
  "gambar": [{ "id": 9, "url": "https://toko.test/storage/produk/a.jpg" }],
  "can": { "update": true, "delete": false }
}
```

| Manfaat | Penjelasan |
|---|---|
| Eksplisit | Hanya field yang dibutuhkan |
| Aman | Tidak ada kolom sensitif |
| Stabil | Perubahan skema tidak langsung bocor ke UI |
| Efisien | `whenLoaded` + eager loading mencegah N+1 |
| Sadar akses | `can` per item untuk tombol |

---

## ✅ Checklist Bab 14

- **Jangan kirim model mentah** — risiko kebocoran dan bentuk tidak stabil.
- **`JsonResource`** — pilih field secara eksplisit.
- **Koleksi** — `Resource::collection()` mendukung paginator.
- **`whenLoaded`** — relasi hanya muncul bila di-eager-load.
- **`with()` di controller** — mencegah N+1.
- **Kolom sensitif** — jangan pernah disertakan; gunakan `when` untuk field kondisional.
- **`can` per item** — tombol sesuai hak akses; tetap validasi di backend.
- **Tipe data** — cast `Decimal` ke `float`, tanggal ke ISO string.

---

⏭️ Lanjut ke [🔐 Bab 15 — Autentikasi dengan Breeze](/bagian-6/bab-15) untuk melanjutkan!
