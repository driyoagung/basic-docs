---
title: "Bab 21 — Project: Dashboard Manajemen Produk dengan RBAC"
---

# 📖 Bab 21 — Project: Dashboard Manajemen Produk dengan RBAC

Saatnya menyatukan 20 bab menjadi satu aplikasi utuh: dashboard manajemen produk dengan auth, CRUD, upload gambar, pencarian, dan RBAC. Tidak ada konsep baru di sini — semuanya penerapan. Fokusnya adalah urutan membangun yang benar dan bagaimana potongan-potongan itu saling mengunci.

---

## 21.1 🎯 Fitur yang Dibangun

| Modul | Fitur |
|---|---|
| **Auth** | Login, register, reset password (Breeze) |
| **Dashboard** | Statistik dengan deferred props + skeleton |
| **Produk** | CRUD + upload gambar + search + filter + pagination |
| **Kategori** | CRUD sederhana |
| **User & Role** | Admin mengatur role user (Spatie) |
| **RBAC** | Admin / Editor / Viewer dengan permission berbeda |
| **UX** | Toast, modal konfirmasi hapus, loading state |
| **Kualitas** | Test backend & halaman error |

Alur peran:

```text
Admin   ──► semua menu, kelola user & role
Editor  ──► dashboard, produk, kategori (tanpa hapus user)
Viewer  ──► dashboard + lihat produk (tanpa tombol mutasi)
```

---

## 21.2 📁 Struktur Folder Akhir

```text
resources/js/
├── app.jsx
├── Pages/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   ├── Dashboard.jsx
│   ├── Products/        (Index, Create, Edit)
│   ├── Categories/      (Index, Create, Edit)
│   ├── Users/           (Index, Edit — khusus Admin)
│   └── Errors/          (Error.jsx)
├── Layouts/
│   ├── AppLayout.jsx
│   ├── AdminLayout.jsx
│   └── GuestLayout.jsx
├── Components/
│   ├── ui/              (Button, TextInput, Modal, Toast)
│   ├── ProductForm.jsx
│   ├── Pagination.jsx
│   ├── FlashToast.jsx
│   └── Can.jsx
└── hooks/
    ├── useAuth.js
    ├── useCan.js
    └── useDebounce.js
```

```text
app/
├── Http/
│   ├── Controllers/     (Product, Category, User)
│   ├── Middleware/HandleInertiaRequests.php
│   ├── Requests/        (StoreProductRequest, UpdateProductRequest)
│   └── Resources/       (ProductResource, CategoryResource)
├── Models/              (Product, Category, User)
└── Policies/            (ProductPolicy)
```

---

## 21.3 🚀 Urutan Build

```text
Step 1  Setup: Laravel + Breeze React + Spatie Permission
Step 2  Database: migration, model, factory, seeder (role & permission)
Step 3  Layout & navigasi (AppLayout, sidebar dinamis)
Step 4  CRUD Kategori (latihan pola CRUD)
Step 5  CRUD Produk + upload + search/filter/pagination
Step 6  Shared data: auth, permissions, flash → Toast
Step 7  RBAC: middleware, Policy, useCan, <Can>
Step 8  Dashboard statistik (deferred props)
Step 9  Error pages + testing
Step 10 Polish & deploy
```

Jangan melompat ke Step 5 sebelum Step 1–3 selesai — sebagian besar error awal berasal dari setup dan layout yang belum benar.

---

## 21.4 🧰 Step 1–2: Setup & Database

```bash
laravel new toko-admin
cd toko-admin
composer require laravel/breeze --dev
php artisan breeze:install react
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
npm install
```

**Model `User`:**

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;

    protected $fillable = ['name', 'email', 'password'];
}
```

**Seeder role & permission:**

```php
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

$permissions = [
    'view products', 'create products', 'edit products', 'delete products',
    'view categories', 'create categories', 'edit categories', 'delete categories',
    'manage users',
];

foreach ($permissions as $p) {
    Permission::firstOrCreate(['name' => $p]);
}

$admin = Role::firstOrCreate(['name' => 'admin']);
$admin->syncPermissions($permissions);

$editor = Role::firstOrCreate(['name' => 'editor']);
$editor->syncPermissions([
    'view products', 'create products', 'edit products', 'delete products',
    'view categories', 'create categories', 'edit categories',
]);

$viewer = Role::firstOrCreate(['name' => 'viewer']);
$viewer->syncPermissions(['view products', 'view categories']);

User::factory()->create(['email' => 'admin@toko.test'])
    ->assignRole('admin');
```

```bash
php artisan db:seed
```

| Role | Permission inti |
|---|---|
| Admin | semua + `manage users` |
| Editor | produk & kategori (tanpa user) |
| Viewer | `view products`, `view categories` |

---

## 21.5 🧱 Step 3–4: Layout & CRUD Kategori

**Sidebar dinamis** (detail di Bab 16):

```jsx
const MENU = [
  { label: 'Dashboard', route: 'dashboard', permission: null },
  { label: 'Produk', route: 'products.index', permission: 'view products' },
  { label: 'Kategori', route: 'categories.index', permission: 'view categories' },
  { label: 'User & Role', route: 'users.index', role: 'admin' },
]

{MENU.filter(boleh).map((item) => (
  <Link key={item.route} href={route(item.route)}>{item.label}</Link>
))}
```

**CRUD kategori** mengikuti pola Bab 12:

```php
Route::resource('categories', CategoryController::class);
```

```jsx
// Categories/Index.jsx
{categories.data.map((k) => (
  <tr key={k.id}>
    <td>{k.name}</td>
    <td>
      <Can permission="edit categories">
        <Link href={route('categories.edit', k.id)}>Edit</Link>
      </Can>
      <Can permission="delete categories">
        <button onClick={() => hapus(k.id)}>Hapus</button>
      </Can>
    </td>
  </tr>
))}
```

Kategori adalah latihan termurah untuk memastikan pola CRUD sudah benar sebelum produk yang lebih kompleks.

---

## 21.6 🛍️ Step 5: CRUD Produk

**Controller index** dengan search, filter, dan pagination (Bab 13):

```php
public function index(Request $request)
{
    $products = Product::query()
        ->with('category:id,name')
        ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
        ->when($request->category, fn ($q, $c) => $q->where('category_id', $c))
        ->latest()
        ->paginate(10)
        ->withQueryString();

    return Inertia::render('Products/Index', [
        'products'   => ProductResource::collection($products),
        'filters'    => $request->only('search', 'category'),
        'categories' => Category::orderBy('name')->get(['id', 'name']),
    ]);
}
```

**Upload gambar** (Bab 10):

```php
public function store(StoreProductRequest $request)
{
    $data = $request->validated();
    $data['foto'] = $request->file('foto')->store('produk', 'public');

    Product::create($data);

    return redirect()->route('products.index')
        ->with('success', 'Produk berhasil ditambahkan!');
}
```

**Form dengan preview & progress:**

```jsx
const { data, setData, post, processing, progress, errors } = useForm({
  name: '',
  price: '',
  category_id: '',
  foto: null,
})
```

| Fitur | Komponen/sumber |
|---|---|
| Search debounce | `SearchProduk` + `router.get` |
| Filter kategori | `select` + `router.get` |
| Pagination | `Pagination` dari `links` |
| Upload | `progress.percentage` + preview |
| Aksi per baris | `can` dari Resource |

---

## 21.7 🔐 Step 6–7: Shared Data & RBAC

**Shared data:**

```php
'auth' => [
    'user' => $request->user() ? [
        'id' => $request->user()->id,
        'name' => $request->user()->name,
        'roles' => $request->user()->getRoleNames(),
        'permissions' => $request->user()->getAllPermissions()->pluck('name'),
    ] : null,
],
'flash' => [
    'success' => fn () => $request->session()->get('success'),
    'error' => fn () => $request->session()->get('error'),
],
```

**Policy:**

```php
public function delete(User $user, Product $product): bool
{
    return $user->can('delete products');
}
```

**Route protection:**

```php
Route::middleware(['auth'])->group(function () {
    Route::resource('products', ProductController::class)
        ->middleware('permission:view products');

    Route::middleware(['role:admin'])->group(function () {
        Route::resource('users', UserController::class);
    });
});
```

> 🚨 **Uji dengan tiga akun berbeda** (admin/editor/viewer). Jika viewer masih bisa menghapus lewat URL langsung, proteksi route belum benar.

---

## 21.8 📊 Step 8: Dashboard dengan Deferred Props

```php
public function index(Request $request)
{
    return Inertia::render('Dashboard', [
        'ringkasan' => [
            'produk' => Product::count(),
            'kategori' => Category::count(),
            'user' => User::count(),
        ],
        'stats' => Inertia::defer(fn () => [
            'terlaris' => $this->produkTerlaris(),
            'grafik' => $this->penjualanBulanan(),
        ]),
    ]);
}
```

```jsx
<Deferred data="stats" fallback={<SkeletonDashboard />}>
  <StatsPanel stats={stats} />
</Deferred>
```

| Bagian | Waktu tampil |
|---|---|
| Angka ringkasan | Segera |
| Skeleton | Segera (pengganti stats) |
| Grafik & terlaris | Setelah data siap |

---

## 21.9 🧪 Step 9–10: Error, Test & Polish

**Test wajib:**

```php
it('viewer tidak bisa menghapus produk', function () {
    $viewer = User::factory()->create()->assignRole('viewer');
    $produk = Product::factory()->create();

    $this->actingAs($viewer)
        ->delete(route('products.destroy', $produk))
        ->assertForbidden();
});
```

```php
it('menampilkan daftar produk', function () {
    $admin = User::factory()->create()->assignRole('admin');
    Product::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('products.index'))
        ->assertInertia(fn ($page) => $page
            ->component('Products/Index')
            ->has('products.data', 3)
        );
});
```

**Checklist polish:**

- Toast muncul setelah create/update/delete.
- Modal konfirmasi sebelum hapus.
- Loading state saat submit.
- Halaman 403/404/419/500 memakai layout.
- Search & filter bertahan saat pindah halaman.
- Tidak ada `console.log` dan data sensitif di props.

---

## 21.10 ✅ Definition of Done

| Kriteria | Bukti |
|---|---|
| Auth berjalan | Login/logout/register tanpa error |
| RBAC benar | Viewer tidak bisa mutasi, baik lewat UI maupun URL |
| CRUD lengkap | Create, read, update, delete + flash |
| Upload | Preview, progress, validasi, file lama terhapus |
| Tabel | Search, filter, sort, pagination dari URL |
| Data aman | Resource, bukan model mentah |
| Dashboard | Ringkasan cepat + stats deferred |
| UX | Toast, modal, loading, error per field |
| Test | Feature test validasi & otorisasi hijau |
| Error | 403/404/419/500 ramah |
| Build | `npm run build` dan `php artisan route:list` bersih |

---

## 📊 Ringkasan Struktur Final

```text
⚛️ EBOOK LARAVEL + INERTIA.JS + REACT
│
├── 🟢 BAGIAN I    — Fondasi Inertia                  Bab 1  – 3
├── 🔵 BAGIAN II   — Pages, Navigasi & Layout         Bab 4  – 6
├── 🟡 BAGIAN III  — Data Sharing & Props             Bab 7  – 8
├── 🟠 BAGIAN IV   — Form, Validasi & Upload          Bab 9  – 11
├── 🔴 BAGIAN V    — CRUD & Data Table                Bab 12 – 14
├── 🟣 BAGIAN VI   — Autentikasi & Otorisasi (RBAC)   Bab 15 – 16
├── ⚫ BAGIAN VII  — Error, SSR, Performa, Testing    Bab 17 – 20
└── 🏆 BAGIAN VIII — Project & Deployment             Bab 21 – 22

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total   :  8 Bagian  |  22 Bab
Stack   :  Laravel 11 · Inertia v2 · React 18 · Vite · Tailwind
Project :  Dashboard Manajemen Produk + RBAC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ Checklist Bab 21

- **Urutan build** — setup → database → layout → kategori → produk → shared → RBAC → dashboard → test.
- **Seeder** — role & permission dibuat eksplisit dan idempoten.
- **Sidebar** — menu difilter berdasarkan role/permission.
- **CRUD** — pola Bab 12 dipakai ulang untuk kategori & produk.
- **Produk** — upload, search, filter, pagination, Resource.
- **RBAC** — middleware + Policy + `useCan` + `<Can>`.
- **Dashboard** — ringkasan langsung, statistik deferred.
- **Test** — validasi, redirect, dan otorisasi negatif.
- **Definition of Done** — semua poin di atas terpenuhi.

---

⏭️ Lanjut ke [🚀 Bab 22 — Deployment](/bagian-8/bab-22) untuk melanjutkan!
