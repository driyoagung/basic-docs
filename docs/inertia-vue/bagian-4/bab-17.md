---
title: Bab 17 — Middleware & Akses Role
---

# Bab 17: Middleware & Akses Role

:::info Bagian IV — Fitur Lanjutan Inertia
Middleware Laravel tetap bekerja sama. Saat 403/404 terjadi, Inertia render halaman error kustom.
:::

## 17.1 Middleware Laravel Tetap Bekerja Sama

```php
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/billing', /* ... */);
});

Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('users', Admin\UserController::class);
});
```

::: details Penjelasan Kode
- `Route::middleware([...])->group(...)` — grup route membagi middleware ke semua route anggota. Menghindari duplikasi tag middleware per route.
- `->prefix('admin')->name('admin.')` — prefix URL (`/admin/users`) dan prefix route name (`admin.users.index`). Konvensi Laravel untuk namespacing grup fitur.
- `'role:admin'` — middleware `role` dengan parameter `admin`. Middleware custom harus meng-accept parameter lewat signature `handle(Request, Closure, ...$roles)`.
- Middleware dievaluasi sebelum Inertia render page. Bila gagal, request tidak sampai ke controller — Inertia tidak perlu tahu, hanya menerima 403 redirect/text.
:::

Middleware standar Laravel (`auth`, `guest`, `verified`, `signed`, `throttle`, `can`) bekerja tanpa perubahan. In bertindak transparan atas hasil middleware.

## 17.2 Membuat Middleware Role Custom

```bash
php artisan make:middleware EnsureUserHasRole
```

```php
// app/Http/Middleware/EnsureUserHasRole.php
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        if (! $request->user() || ! in_array($request->user()->role, $roles)) {
            abort(403, 'Akses ditolak: role tidak sesuai.');
        }

        return $next($request);
    }
}
```

::: details Penjelasan Kode
- `make:middleware EnsureUserHasRole` — artisan generator boilerplate class middleware. Default signature `handle(Request, Closure)`.
- `string ...$roles` — variadic parameter: `role:admin,super-admin` di route di-parse menjadi `['admin', 'super-admin']`. Tipe `string` memaksa tiap argumen string.
- `if (! $request->user() || ! in_array($request->user()->role, $roles))` — cek dua kondisi: tidak login, atau role tidak masuk whitelist. Short-circuit jika tamu → langsung 403 tanpa cek role.
- `abort(403, 'Akses ditolak: role tidak sesuai.')` — lempar `HttpResponseException` dengan status 403 dan pesan. Inertia akan tangkap dan render page error (lihat §17.7).
- `return $next($request)` — wajib lanjutkan request ke layer berikutnya (controller). Lupa return ini = request hang.
- Middleware ini hanya cocok bila user pakai role tunggal (kolom `role` di tabel users). Untuk multi-role + permission kompleks, gunakan Spatie (§17.3).
:::

Daftarkan alias di `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\EnsureUserHasRole::class,
    ]);
})
```

Pakai:

```php
Route::middleware(['auth', 'role:admin,super-admin'])->group(/* ... */);
```

## 17.3 Spatie Laravel Permission (Recommended)

Untuk project serius dengan complex roles & permissions, pakai `spatie/laravel-permission`:

```bash
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

::: details Penjelasan Kode
- `composer require spatie/laravel-permission` — install package. Tidak perlu `--dev` karena runtime dependency.
- `vendor:publish --provider=...` — publish config (`permission.php`) + migration. Tanpa ini, package jalan dengan default tapi tidak fleksibel.
- `php artisan migrate` — jalankan migration bawaan package: tabel `roles`, `permissions`, `model_has_permissions`, `model_has_roles`, `role_has_permissions`.
:::

Definisi role & permission:

```php
$role = Role::create(['name' => 'admin']);
$permission = Permission::create(['name' => 'edit posts']);
$role->givePermissionTo($permission);
$user->assignRole('admin');
```

Middleware bawaan:

```php
Route::middleware(['auth', 'role:admin'])->group(/* ... */);
Route::middleware(['auth', 'permission:edit posts'])->group(/* ... */);
```

Helper di blade / controller sama dengan tanpa Inertia.

## 17.4 Role-Based Access di Vue

Kirim role user ke shared data:

```php
// HandleInertiaRequests::share()
'auth' => [
    'user' => $request->user() ? UserResource::make($request->user()) : null,
    'roles' => fn () => $request->user()
        ? $request->user()->roles->pluck('name')->toArray()
        : [],
    'permissions' => fn () => $request->user()
        ? $request->user()->getAllPermissions()->pluck('name')->toArray()
        : [],
],
```

::: details Penjelasan Kode
- `'roles' => fn () => $request->user()->roles->pluck('name')->toArray()` — relasi `roles` (dari Spatie) eager access collection, ambil kolom `name` saja, konversi ke array PHP plain. Closure lazy agar query hanya saat dipakai.
- `'permissions' => fn () => $request->user()->getAllPermissions()->pluck('name')->toArray()` — `getAllPermissions()` adalah method Spatie yang menggabung permission direct + permission via role. Hemat pengguna untuk tidak perlu tahu role mana yang memberi.
- Kirim sebagai array string (`['admin', 'edit posts']`) — mudah di-`includes()` di Vue.
- **Ingat**: ini data UX, bukan security. Server tetap `role:` middleware + Policy.
:::

Composable:

```js
// composables/useRole.js
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

export function useRole() {
  const page = usePage()
  const roles = computed(() => page.props.auth.roles ?? [])
  const permissions = computed(() => page.props.auth.permissions ?? [])

  return {
    hasRole: (role) => roles.value.includes(role),
    hasPermission: (perm) => permissions.value.includes(perm),
    hasAnyRole: (...list) => list.some(r => roles.value.includes(r)),
    isAdmin: computed(() => roles.value.includes('admin')),
  }
}
```

::: details Penjelasan Kode
- `roles = computed(() => page.props.auth.roles ?? [])` — reaktif akses array roles. `?? []` untuk aman bila belum di-share.
- `hasRole: (role) => roles.value.includes(role)` — cek keanggotaan tunggal. `Array.includes` strict equality cocok untuk string role.
- `hasAnyRole: (...list) => list.some(r => roles.value.includes(r))` — variadic; `list.some` return true jika salah satu match. Untuk multi-role condition (mis. admin ATAU editor).
- `isAdmin: computed(() => roles.value.includes('admin'))` — derived helper sebagai `computed` agar reaktif. Bisa pakai di template: `&lt;NavItem v-if="isAdmin">`.
- Konsisten dengan pattern composable Vue 3 — bukan Pinia store, hanya pembungkus `usePage`.
:::

Pakai di sidebar:

```vue
<script setup>
import { useRole } from '@/composables/useRole'
const { hasRole, isAdmin } = useRole()
</script>

<template>
  <nav>
    <Link :href="route('dashboard')">Dashboard</Link>
    <Link v-if="hasRole('admin')" :href="route('admin.users.index')">User Management</Link>
    <Link v-if="isAdmin" :href="route('admin.settings.index')">Settings</Link>
  </nav>
</template>
```

## 17.5 Middleware untuk Proteksi Group Route

```php
// routes/admin.php — di-load via bootstrap/app.php
Route::middleware(['auth', 'role:admin,super-admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('users', Admin\UserController::class);
        Route::resource('settings', Admin\SettingsController::class);
    });
```

## 17.6 Inertia Redirect saat Unauthorized

Saat middleware lempar `abort(403)` atau `abort(404)`:

- Inertia intercept HttpResponseException.
- Render halaman error default (dari `inertia-laravel`), atau kustomisasi via config.

Atau lempar manual:

```php
abort_if(! $request->user()->can('update', $post), 403, 'Anda tidak punya akses.');
```

## 17.7 Kustomisasi Page Error

Default, Inertia render komponen `Error.vue` di `Pages/Error.vue`. Buat sendiri:

```vue
<!-- Pages/Error.vue -->
<script setup>
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import ErrorLayout from '@/Layouts/ErrorLayout.vue'

defineOptions({ layout: ErrorLayout })

const page = usePage()
const status = computed(() => page.props.status ?? 500)
const title = computed(() => ({
  403: 'Akses Ditolak',
  404: 'Halaman Tidak Ditemukan',
  419: 'Sesi Kadaluarsa',
  500: 'Kesalahan Server',
  503: 'Pemeliharaan',
}[status.value] ?? 'Terjadi Kesalahan'))

const message = computed(() => ({
  403: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
  404: 'URL yang Anda minta tidak tersedia.',
  500: 'Terjadi kesalahan di server kami. Tim sudah diberi tahu.',
}[status.value] ?? ''))
</script>

<template>
  <div class="text-center">
    <p class="text-7xl font-bold text-red-600">{{ status }}</p>
    <h1 class="mt-2 text-2xl font-bold">{{ title }}</h1>
    <p class="mt-1 text-gray-600">{{ message }}</p>
    <a href="/" class="mt-4 inline-block text-blue-600 underline">Kembali ke beranda</a>
  </div>
</template>
```

::: details Penjelasan Kode
- `defineOptions({ layout: ErrorLayout })` — pakai layout khusus (minimal, tanpa navbar) untuk page error. Jangan pakai `AppLayout` karena error mungkin terjadi saat session expired sehingga navbar menampilkan null user.
- `page.props.status` — Inertia-laravel mengirim prop `status` berisi HTTP code (403, 404, 500, dll.). Inertia memilih page component berdasarkan config `pages.error` (default `Error.vue`).
- `({ 403: ... 404: ... }[status.value] ?? 'Terjadi Kesalahan')` — map object lookup dengan fallback. Lebih clean daripada switch-case karena palette finite.
- `&lt;a href="/">` — gunakan `&lt;a>` native (bukan `&lt;Link>` Inertia) untuk "Kembali ke beranda" karena boleh full reload setelah error state agar clear context (props error bisa sampai ke beranda saat pakai navigasi client-side, lebih aman reload penuh).
- Pisahkan page error agar tidak kena bug tak terduga (mis. middleware yang gagal pada layout utama).
:::

Atau, separate page per kode:

```php
// HandleInertiaRequests
public function resolveErrorResponse(Request $request, Throwable $e): string
{
    return match ($e->getStatusCode() ?? 500) {
        403 => 'Errors/403',
        404 => 'Errors/404',
        419 => 'Errors/SessionExpired',
        500 => 'Errors/500',
        503 => 'Errors/Maintenance',
        default => parent::resolveErrorResponse($request, $e),
    };
}
```

::: details Penjelasan Kode
- `resolveErrorResponse(Request $request, Throwable $e): string` — method yang di-override dari `HandleInertiaRequests`. Mengembalikan nama komponen (relative path dari `Pages/`) yang akan di-render.
- `match ($e->getStatusCode() ?? 500)` — PHP 8 `match` expression (strict comparison, return value). `getStatusCode()` mungkin null bila bukan `HttpException`, fallback ke 500.
- `default => parent::resolveErrorResponse(...)` — call parent agar fallback untuk code yang tidak di-handle (mis. 401, 429). Hindari override total agar error tak terduga tetap di-render dengan default bagus.
- Berguna jika ingin styling & messaging berbeda per HTTP code (mis. 419 perlu minta user re-login, 503 menampilkan info maintenance).
:::

## 17.8 Mode Maintenance

Laravel 11 maintenance mode me-render view `maintenance.blade.php`. Untuk Inertia, tetap relevant menyiapkan halaman ini:

```html
<!-- resources/views/maintenance.blade.php -->
<!DOCTYPE html>
<html><head><title>Maintenance</title></head>
<body>
  <h1>Lagi maintenance</h1>
  <p>Coba lagi nanti.</p>
</body>
</html>
```

Saat `php artisan down`, semua route me-render Blade ini — tidak butuh Inertia component.

## 17.9 Pola:kses Berlapis

Contoh: post yang hanya bisa diedit oleh owner ATAU admin.

V_frontend:

```js
const canUpdate = computed(() => {
  return page.props.auth.user?.id === props.post.user_id
      || page.props.auth.permissions?.includes('edit any post')
})
```

Backend (Policy):

```php
public function update(User $user, Post $post): bool
{
    return $user->id === $post->user_id
        || $user->can('edit any post');
}
```

Pesan 403 yang informatif:

```php
$this->authorize('update', $post); // default guna pesan "This action is unauthorized."
```

Custom:

```php
abort_unless($user->can('update', $post), 403, 'Hanya pemilik atau admin yang boleh mengedit.');
```

::: details Penjelasan Kode
- `abort_unless(condition, code, message)` — kebalikan `abort_if`. Lempar `HttpException` dengan code & pesan jika condition **false**. Lebih ekspresip untuk "tolak bila tidak boleh".
- Pesan kustom muncul di `page.props.errors` atau di halaman error kustom. User-friendly daripada default Laravel "This action is unauthorized."
- Pastikan tidak bocor info sensitif (mis. jangan sebut "admin Robert" di pesan — info enum role saja).
:::

## 17.10 Anti-Pattern Role di Frontend

:::warning Hindari
```js
// ❌ Tidak aman — role bisa dimodifikasi lewat DevTools
{'admin' in page.props.auth.roles ? <AdminButton /> : null}
```
:::

Frontend hanya untuk UX. Server tetap validasi via middleware `role:` atau Policy.

## 17.11 Logging Unauthorized

Tambah logging agar admin tahu siapa yang mencoba akses terlarang:

```php
public function handle(Request $request, Closure $next, ...$roles)
{
    if (! $request->user() || ! in_array($request->user()->role, $roles)) {
        Log::warning('Unauthorized access', [
            'user_id' => $request->user()?->id,
            'url'     => $request->url(),
            'ip'      => $request->ip(),
        ]);
        abort(403, 'Akses ditolak: role tidak sesuai.');
    }
    return $next($request);
}
```

::: details Penjelasan Kode
- `Log::warning(...)` — log level warning (lebih rendah dari error, lebih tinggi dari info). Lisensi audit akses.
- `'user_id' => $request->user()?->id` — null-safe operator `?->` untuk ambil ID user bila ada; tamu → null.
- `'url' => $request->url()` — URL tanpa query string agar tidak log sensitive query (token, sesid). Untuk penuh, pakai `->fullUrl()`.
- `'ip' => $request->ip()` — IP client. Hati-hati bila behind proxy, pastikan konfigurasi `TrustProxies` middleware sudah benar agar dapat IP asli.
- Berguna untuk forensik, tapi pertimbangkan volume: jika ada brute force, log bisa cepat penuh. Pakai rate limiter untuk perlindungan aktif.
:::

## 17.12 Ringkasan Bab

- Middleware Laravel (`auth`, `guest`, `verified`, `role:`) tidak berubah di Inertia.
- Custom alias middleware di `bootstrap/app.php`.
- Untuk sistem role kompleks → `spatie/laravel-permission` sangat disarankan.
- Kirim `roles` & `permissions` ke shared data — pakai di Vue sebagai UX layer.
- `abort(403/404)` Inertia render page error kustom (`Pages/Error.vue` atau per-code).
- Security = Gate/Policy/middleware, UX = composable `useRole()/useCan()`.

:::tip Selanjutnya
Masuk ke [Bagian V — Ekosistem & Tooling](/bagian-5/bab-18). Mulai dengan **Tailwind CSS** dan integrasi komponen UI populer.
:::
