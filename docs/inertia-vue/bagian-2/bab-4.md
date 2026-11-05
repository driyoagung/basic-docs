---
title: Bab 4 — Routing & Controller — Tidak Banyak Berubah
---

# Bab 4: Routing & Controller — Tidak Banyak Berubah

:::info Bagian II — Transisi
Kita masuk ke bagian yang paling menggembirakan: dengan Inertia, hampir semua yang kamu kenal tentang Laravel **tetap sama**. Bab ini bukti konkretnya.
:::

## 4.1 Route Tetap di `routes/web.php

Tidak ada `routes/api.php` untuk Inertia — itu hanya untuk REST API terpisah. Inertia pakai middleware `web` (session + CSRF + state) supaya session dan auth Laravel tetap bekerja normal.

Perbandingan route Blade vs Inertia:

```php
// Blade (dulu)
Route::get('/posts', [PostController::class, 'index'])->name('posts.index');

// Inertia (sekarang) — SAMA PERSIS
Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
```

Tidak ada perubahan. Yang berubah hanya **apa yang dikembalikan controller**, bukan routing.

## 4.2 Resource Route Tetap Sama

`Route::resource` menghasilkan 7 route standar (index, create, store, show, edit, update, destroy) — bekerja persis sama:

```php
Route::resource('posts', PostController::class);
```

Untuk nested resource (misal tasks di bawah project):

```php
Route::resource('projects.tasks', TaskController::class);
```

Semua helper seperti `->only()`, `->except()`, `->middleware()`, dan `Route::apiResource()` tetap berlaku. Inertia tidak peduli bagaimana route didefinisikan — yang penting nilai balik controller.

## 4.3 Controller — Satu Perubahan Utama

**Logika controller tetap sama**: query Eloquent, validasi, authorization, exception, semuanya tidak berubah. Yang berubah hanya **return value**.

```php
// Blade (dulu)
public function index()
{
    $posts = Post::with('user')->latest()->paginate(10);
    return view('posts.index', compact('posts'));
}

// Inertia (sekarang)
public function index()
{
    $posts = Post::with('user')->latest()->paginate(10);
    return Inertia::render('Posts/Index', [
        'posts' => $posts,
    ]);
}
```

::: details Penjelasan Kode
- `Post::with('user')->latest()->paginate(10)` — eager load relasi `user` untuk menghindari N+1 query, urutkan terbaru, lalu paginate 10 item per halaman. Bagian ini **identik** dengan Blade, tidak ada perubahan.
- `view('posts.index', compact('posts'))` — di Blade, ini mencari file `resources/views/posts/index.blade.php` dan mengirim variabel `$posts` ke view.
- `Inertia::render('Posts/Index', ['posts' => $posts])` — pengganti `view()`. String `'Posts/Index'` merujuk ke file `resources/js/Pages/Posts/Index.vue` (bukan lagi `.blade.php`). Array kedua adalah **props** — data yang akan diterima page component Vue via `defineProps`.
- Perhatikan: `compact('posts')` membuat associative array `['posts' => $posts]`, jadi penulisan array eksplisit di `Inertia::render` pada dasarnya sama saja.
- Hasil akhir `Inertia::render()` bukan HTML string, melainkan JSON `{ component, props, url, version }` yang dikirim ke browser untuk di-render Vue.
:::

Hal yang sama untuk `show`, `create`, `edit`:

```php
public function show(Post $post)
{
    return Inertia::render('Posts/Show', [
        'post' => $post->load('user', 'tags'),
    ]);
}

public function create()
{
    return Inertia::render('Posts/Create', [
        'categories' => Category::all(),
    ]);
}

public function edit(Post $post)
{
    return Inertia::render('Posts/Edit', [
        'post' => $post,
        'categories' => Category::all(),
    ]);
}
```

::: details Penjelasan Kode
- `$post->load('user', 'tags')` — lazy eager loading setelah model sudah ter-load. Berguna saat model datang dari route model binding (sudah di-query), dan kita ingin menambah relasi sebelum dikirim ke frontend. Berbeda dengan `with()` yang dilakukan di query builder.
- `Category::all()` — ambil semua record untuk mengisi dropdown/select di form. Wajar dikirim sebagai prop karena ukurannya kecil.
- `edit()` mengirim dua prop sekaligus: `post` (data yang sedang diedit, untuk pre-fill form) dan `categories` (pilihan dropdown). Pola ini identik dengan Blade.
- Setiap method hanya mengubah **apa yang dirender**, logika pengambilan data sama persis dengan versi Blade.
:::

## 4.4 Redirect Tetap Sama

Setiap pola redirect yang kamu pakai di Blade bekerja tanpa perubahan:

```php
public function store(Request $request)
{
    $validated = $request->validate([...]);
    Post::create($validated);

    // Tetap sama persis
    return redirect()->route('posts.index');
    return redirect()->back();
    return redirect()->route('posts.index')->with('success', 'Post dibuat!');
}
```

::: details Penjelasan Kode
- `$request->validate([...])` — validasi input, lempar `ValidationException` otomatis kalau gagal. Tidak perlu `try-catch`.
- `Post::create($validated)` — mass assignment dari array yang sudah tervalidasi. Pastikan `$fillable` di model mencakup field ini.
- `redirect()->route('posts.index')` — redirect ke named route. Inertia di sisi client akan melakukan XHR ke URL tujuan dan re-render.
- `redirect()->back()` — kembali ke halaman sebelumnya, berguna untuk form yang gagal atau aksi cepat.
- `->with('success', 'Post dibuat!')` — flash message disimpan ke session. Inertia otomatis menyediakannya di `page.props.flash` (akses via `usePage().props.flash` di Vue).
- Yang penting: Inertia **membaca** redirect response, lalu mengganti URL browser dan request halaman tujuan secara otomatis. Kamu tetap tulis kode seperti Blade.
:::

Inertia otomatis menangkap redirect → update URL → request halaman tujuan → render ulang. Flash message via `with()` akan tersedia di `page.props.flash` (dibahas Bab 13).

## 4.5 Validasi & Error — Tetap di Controller

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'title' => ['required', 'string', 'max:255'],
        'body'  => ['required', 'string'],
    ]);

    Post::create($validated);
    return redirect()->route('posts.index');
}
```

::: details Penjelasan Kode
- `'title' => ['required', 'string', 'max:255']` — aturan validasi: wajib, harus string, maksimal 255 karakter. Format array memudahkan menambah rule custom.
- `$request->validate([...])` mengembalikan hanya field yang tervalidasi (filter otomatis), jadi aman diteruskan ke `Post::create()`.
- Saat validasi gagal, Laravel melempar `ValidationException` dan secara default mengembalikan user ke halaman sebelumnya dengan error. Inertia menangkap ini dan meng-asuhnya sebagai `props.errors` di sisi Vue, sehingga `form.errors.title` terisi otomatis (lihat `&lt;useForm>` di Bab 10).
- `redirect()->route('posts.index')` — setelah sukses simpan, kembali ke daftar post. Tidak ada `try-catch` karena exception handling sudah disediakan Laravel.
:::

Saat validasi gagal:

1. Laravel lempar `ValidationException`.
2. Inertia intercept → kirim props `errors` ke client.
3. Komponen Vue `useForm()` otomatis menerima di `form.errors.title`.

Tidak ada konfigurasi tambahan — detail lengkap di [Bab 10](/bagian-3/bab-10).

## 4.6 Konvensi Penamaan Komponen

Aturan penting dalam `Inertia::render($name)`:

- `name` adalah **string nama file** relatif terhadap `resources/js/Pages/`.
- **PascalCase** untuk nama file & folder.
- Slash `/` untuk hierarki folder.

| `Inertia::render(...)` | File Vue |
| --- | --- |
| `'Dashboard'` | `Pages/Dashboard.vue` |
| `'Posts/Index'` | `Pages/Posts/Index.vue` |
| `'Auth/Login'` | `Pages/Auth/Login.vue` |
| `'Admin/Users/Edit'` | `Pages/Admin/Users/Edit.vue` |

Pola yang umum dipakai komunitas:

- Page terkait resource berkumpul dalam satu folder (`Posts/Index`, `Posts/Show`).
- Folder struktur mencerminkan fitur, bukan tipe file (bukan `Pages/Views/` atau `Pages/Forms/`).

## 4.7 Lazy Loading Page Component

Default `import.meta.glob('./Pages/**/*.vue', { eager: true })` **memuat semua page** ke bundle utama. Ini baik untuk project kecil — navigasi instan — tapi memperbesar bundle awal.

Untuk project besar, ubah jadi lazy:

```js
resolve: name => {
  const pages = import.meta.glob('./Pages/**/*.vue')
  return pages[`./Pages/${name}.vue`]()
}
```

::: details Penjelasan Kode
- `import.meta.glob('./Pages/**/*.vue')` — fitur Vite untuk import banyak file sekaligus berdasarkan pola glob. Tanpa `{ eager: true }`, ini mengembalikan object berisi **function loader** per file (bukan modul langsung).
- `pages[`./Pages/${name}.vue`]` — akses loader spesifik berdasarkan nama komponen yang diminta Inertia (mis. `'Posts/Index'` → `./Pages/Posts/Index.vue`).
- `()` di akhir — memanggil loader sehingga Vite akan mengunduh chunk file tersebut **saat halaman dibuka**, bukan di bundle awal. Ini yang membuat tiap page jadi chunk terpisah.
- Bandingkan dengan `{ eager: true }` yang langsung menggabungkan semua page ke bundle utama — navigasi instan tapi bundle awal besar.
- `name` adalah parameter dari `createInertiaApp({ resolve })`. Inertia memberi nama komponen (string dari controller) dan minta Vite memberi modul Vue yang sesuai.
:::

Sekarang tiap page menjadi chunk terpisah — hanya diunduh saat dibuka.

:::tip Aturan praktis
Project < 50 page: eager (default). Project > 50 page: lazy. Kamu juga bisa mix — eager untuk halaman yang sering, lazy untuk halaman admin yang jarang dibuka.
:::

## 4.8 Route Model Binding

Implicit binding tetap bekerja:

```php
Route::get('/posts/{post}', [PostController::class, 'show']);

public function show(Post $post)
{
    return Inertia::render('Posts/Show', ['post' => $post]);
}
```

::: details Penjelasan Kode
- `Route::get('/posts/{post}', ...)` — placeholder `{post}` akan di-resolve Laravel menjadi instance `Post` berdasarkan primary key default (`id`). Inertia tidak terlibat di tahap ini — semua terjadi di sisi server sebelum controller jalan.
- `public function show(Post $post)` — type-hint model di signature method memicu Laravel service container melakukan implicit binding: query `Post::where('id', $routeParam)->firstOrFail()` otomatis dijalankan.
- Hasil binding kemudian dikirim ke `Inertia::render` sebagai prop `post`. Vue menerima ini via `defineProps({ post: Object })`.
- Tidak ada perbedaan dengan Blade — Inertia hanya peduli nilai balik akhir, bukan sumber data controller.
:::

Custom key binding:

```php
Route::get('/posts/{post:slug}', [PostController::class, 'show']);
```

Tidak ada perubahan vs Blade — Inertia tidak peduli asal usul data.

## 4.9 Route Group & Middleware

Semua grouping dengan tetap berlaku:

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('projects', ProjectController::class);
    Route::resource('projects.tasks', TaskController::class);
});

Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('users', Admin\UserController::class);
});
```

::: details Penjelasan Kode
- `Route::middleware(['auth', 'verified'])` — grup route hanya bisa diakses user yang login (`auth`) dan sudah verifikasi email (`verified`). Middleware ini berjalan **sebelum** controller, jadi Inertia tidak terlibat di sini.
- `->group(function () { ... })` — closure berisi route yang mewarisi middleware di atas.
- `->prefix('admin')` — semua URL di dalam grup mendapat awalan `/admin` (mis. `admin/users`).
- `->name('admin.')` — semua named route mendapat prefix nama `admin.` (mis. `admin.users.index`). Ini penting untuk Ziggy di sisi Vue: `route('admin.users.index')`.
- `->middleware('role:admin')` — middleware kustom dengan parameter `admin`. Middleware ini biasanya kamu definisikan sendiri untuk cek role/spatie-permission.
- Inertia tidak peduli dengan layer ini — semua eksekusi sebelum controller tidak berubah.
:::

## 4.10 Logging, Query, & Exception

Middleware Laravel (debugbar, telescope, log channel) tetap berjalan. Inertia hanya menggubah response akhir — fase sebelumnya (request → middleware → controller) tidak tersentuh.

## 4.11 Ringkasan Bab

- `routes/web.php` tidak berubah sama sekali.
- Controller hanya berubah di `return` — `view()` → `Inertia::render()`.
- Redirect, validasi, middleware, resource route, route model binding tetap sama.
- Aturan penamaan: PascalCase, folder fitur (`Posts/Index.vue`).
- Page eager oleh default; ubah ke lazy untuk project besar.

:::tip Selanjutnya
[Bab 5](/bagian-2/bab-5) masuk lebih dalam: bagaimana mengirim data kompleks (paginator, API resource, relasi) dari controller ke Vue.
:::
