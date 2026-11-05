---
title: Bab 12 — Autentikasi dengan Inertia
---

# Bab 12: Autentikasi dengan Inertia

:::info Bagian IV — Fitur Lanjutan Inertia
Auth di Inertia = auth Laravel biasa. Session-based, tanpa token, tanpa Sanctum (untuk web).
:::

## 12.1 Auth dengan Laravel Breeze (Inertia Stack)

Cara termudah:

```bash
composer require laravel/breeze --dev
php artisan breeze:install vue
```

::: details Penjelasan Kode
- `composer require laravel/breeze --dev` — install Breeze sebagai **dev dependency** karena hanya dipakai untuk scaffolding (menggenerate file), bukan runtime dependency.
- `php artisan breeze:install vue` — pilih stack `vue` agar Breeze menggenerate page komponen Inertia (bukan Blade/Livewire). Perintah ini juga otomatis menjalankan `npm install` & `npm run build` pertama kali, serta mendaftarkan route `auth.php`.
:::

Yang di-generate:

- Page components di `Pages/Auth/`:
  - `Login.vue`, `Register.vue`, `ForgotPassword.vue`, `ResetPassword.vue`
  - `VerifyEmail.vue`, `ConfirmPassword.vue`
- Middleware `Authenticate`, `RedirectIfAuthenticated` (already Laravel).
- Routes di `auth.php` route file.
- Controller di `Auth/`.
- `HandleInertiaRequests` (kalau belum ada).

## 12.2 Flow Auth Inertia

```
1. User buka /login  -> Request GET -> Laravel session OK -> Inertia::render('Auth/Login')
2. Submit form        -> POST /login -> AttemptController -> auth.session regenerate
3. Sukses             -> redirect()->intended('/dashboard')
4. Inertia navigate   -> router.goto -> /dashboard
5. Request dashboard -> middleware auth OK -> Inertia::render('Dashboard')
```

Session Laravel tetap jadi sumber kebenaran. Inertia hanya menggantikan Blade view dengan Vue.

:::tip Sanctum tetap relevan
Jika nanti mau tambah mobile app, pakai Sanctum untuk API token. Web (Inertia) tetap pakai session.
:::

## 12.3 `Auth::user()` Tetap Bisa di Controller

```php
public function dashboard()
{
    $user = Auth::user(); // atau auth()->user() atau $request->user()
    return Inertia::render('Dashboard', [
        'user' => UserResource::make($user),
    ]);
}
```

::: details Penjelasan Kode
- `Auth::user()` / `auth()->user()` / `$request->user()` — tiga cara ekuivalen untuk ambil user ter autentikasi. `$request->user()` paling disukai karena dapat di-mock saat testing dan implicit dari request context.
- `UserResource::make($user)` — bungkus ke API Resource agar keluaran field terkontrol (mis. hanya `id`, `name`, `email`, tidak ada `password`/`remember_token`). `::make` menerima satu model, sedangkan `::collection` untuk paginator/koleksi.
- Nilai `'user'` otomatis masuk `page.props.user` di Vue.
:::

Di Inertia, biasanya user dikirim via shared data (lihat [Bab 11](/bagian-4/bab-11)):

```php
'auth' => [
    'user' => $request->user() ? UserResource::make($request->user()) : null,
]
```

## 12.4 Proteksi Route — Sama dengan Blade

```php
// routes/web.php
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('posts', PostController::class);
});

Route::middleware('guest')->group(function () {
    Route::get('/login',  [Auth\LoginController::class, 'create'])->name('login');
    Route::post('/login', [Auth\LoginController::class, 'store']);
});

// Email verified
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/billing', /* ... */);
});

// Password confirmation
Route::middleware(['auth', 'password.confirm'])->group(function () {
    Route::post('/dangerous-action', /* ... */);
});
```

::: details Penjelasan Kode
- `Route::middleware('auth')->group(...)` — semua route di grup wajib login. Tidak ada request sampai controller; middleware redirect ke `login` kalau tamu.
- `middleware('guest')` — kebalikan, redirect user yang **sudah login** ke `dashboard`. Berguna agar tidak bisa `GET /login` lagi setelah login.
- `['auth', 'verified']` — email harus sudah diverifikasi (`EnsureEmailIsVerified` middleware). Cocok untuk fitur billing, ubah email.
- `['auth', 'password.confirm']` — `password.confirm` middleware menyimpan URL intended di session, lalu redirect ke `password.confirm`. Setelah user konfirmasi password, baru diarahkan balik ke intended URL. Proteksi aksi destruktif (hapus akun, dll).
- `->name('login')` — route `login` wajib ada karena middleware `auth` akan `redirect()->route('login')` saat tamu.
:::

Tidak ada perubahan dari Blade.

## 12.5 Tampilkan Data User di Vue

```vue
<script setup>
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const page = usePage()
const user = computed(() => page.props.auth.user)
</script>

<template>
  <div class="flex items-center gap-3">
    <img :src="user.avatar" :alt="user.name" class="h-8 w-8 rounded-full" />
    <span>{{ user.name }}</span>
    <Link :href="route('logout')" method="post" as="button" class="text-red-600">
      Logout
    </Link>
  </div>
</template>
```

::: details Penjelasan Kode
- `&lt;script setup>` — Composition API syntax di Vue 3 SFC. Variabel yang di-deklarasi otomatis tersedia di template.
- `import { Link } from '@inertiajs/vue3'` — komponen `&lt;Link>` Inertia, wrapping tag `&lt;a>` tetapi memicu navigasi client-side (tidak reload halaman penuh).
- `:href="route('logout')"` — pakai helper `route()` dari Ziggy untuk generate URL berdasarkan nama route Laravel. Tidak perlu hardcode `/logout`.
- `method="post"` — Inertia `&lt;Link>` menerima HTTP method. Wajib `post` (bukan `get`) untuk logout karena Laravel mengharuskan POST (proteksi CSRF).
- `as="button"` — render `&lt;Link>` sebagai elemen `&lt;button>` (defaultnya `&lt;a>`). Logout biasanya tidak boleh jadi link `&lt;a>` semantik karena bukan navigasi melainkan aksi.
:::

User akan reaktif terhadap navigasi — begitu `router.reload()` dipanggil setelah update profil, data terbaru langsung tampil.

## 12.6 Login Manual (tanpa Breeze)

Jika ingin menulis sendiri:

```php
// app/Http/Controllers/Auth/LoginController.php
class LoginController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'Email atau password salah',
            ]);
        }

        $request->session()->regenerate();
        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login');
    }
}
```

::: details Penjelasan Kode
- `public function create()` — konvensi Laravel: tampilkan form (mirip RESTful `create`). Di Inertia, "form" = page component Vue.
- `public function store(Request $request)` — terima submit POST login.
- `$request->validate([...])` — validasi otomatis. Jika gagal, Laravel redirect balik + simpan error ke session → masuk ke `page.props.errors` via `parent::share()`.
- `Auth::attempt($credentials, $request->boolean('remember'))` — coba match `$credentials` ke tabel users. Argumen kedua `remember` menentukan apakah cookie "remember me" dibuat. `$request->boolean()` aman mengkonversi `"on"`/`"true`/`1` ke boolean.
- `throw ValidationException::withMessages([...])` — Mengirim error validation ke field `email` agar tampil di `form.errors.email`. Tetap dengan HTTP 422 (bukan 401/403) agar tidak terlihat user mana yang ada/tidak ada (anti user enumeration).
- `$request->session()->regenerate()` — **fixation prevention**: regenerate session ID sehingga ID lama tidak valid. Mencegah serangan session fixation. Wajib setelah login berhasil.
- `redirect()->intended(route('dashboard'))` — `intended()` mengambil URL yang dicoba user sebelum diintercept middleware `auth`. Kalau tidak ada, fallback ke `dashboard` (argumen default).
- `Auth::logout()` — hapus user dari session saat ini.
- `$request->session()->invalidate()` — hapus semua data session + regenerate ID. Agar data sensitif yang disimpan di session (cart, temp form) tidak diakses sesudah logout.
- `$request->session()->regenerateToken()` — collisions CSRF token baru, invalidasi token lama yang mungkin tertinggal di form HTML cache.
:::

```vue
<!-- Pages/Auth/Login.vue -->
<script setup>
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AuthLayout from '@/Layouts/AuthLayout.vue'

defineOptions({ layout: AuthLayout })

const form = useForm({
  email: '',
  password: '',
  remember: false,
})

function submit() {
  form.post(route('login'), {
    onSuccess: () => console.log('Login sukses'),
    onError: () => form.reset('password'),
  })
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label>Email</label>
      <input v-model="form.email" type="email" />
      <span v-if="form.errors.email" class="text-red-600">{{ form.errors.email }}</span>
    </div>

    <div>
      <label>Password</label>
      <input v-model="form.password" type="password" />
      <span v-if="form.errors.password" class="text-red-600">{{ form.errors.password }}</span>
    </div>

    <label>
      <input type="checkbox" v-model="form.remember" /> Ingat saya
    </label>

    <button type="submit" :disabled="form.processing">Login</button>
  </form>
</template>
```

::: details Penjelasan Kode
- `import { useForm } from '@inertiajs/vue3'` — composable utama Inertia untuk form. Otomatis handle state, `processing`, `errors`, `progress`, dan method helper (`post`, `put`, `delete`, `submit`).
- `defineOptions({ layout: AuthLayout })` — pakai layout khusus (misal tanpa navbar) untuk page ini. Inertia mengizinkan multiple layout via `defineOptions` di `&lt;script setup>` (lihat Bab 6 manajemen layout).
- `useForm({ email: '', password: '', remember: false })` — inisialisasi state form. Field name harus persis sama dengan key validasi server (`email`, `password`).
- `form.post(route('login'), {...})` — kirim POST ke URL login. `form.post` otomatis pakai Inertia router (client-side) → server return redirect → Inertia navigate ke dashboard.
- `onSuccess: () => ...` — callback saat server merespons 2xx dan Inertia berhasil navigate.
- `onError: () => form.reset('password')` — saat server kirim 422 (validation), reset field `password` saja (tidak reset `email`) agar user tidak perlu input ulang email.
- `@submit.prevent="submit"` — `.prevent` modifier Vue: `event.preventDefault()` agar form tidak benar-benar dikirim penuh oleh browser.
- `v-model="form.email"` — two-way binding antara input dan state form. Vue memperbarui `form.email` saat user mengetik.
- `form.errors.email` — diisi otomatis oleh Inertia saat server kirim 422 + JSON `errors`. Render kondisional dengan `v-if`.
- `:disabled="form.processing"` — `form.processing` true saat request in-flight. Mencegah double-submit dan UX yang baik (tombol nonaktif).
:::

## 12.7 Logout

Logout via POST (lihat §12.5):

```vue
<Link :href="route('logout')" method="post" as="button">Logout</Link>
```

Atau programatik setelah konfirmasi:

```js
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

router.post(route('logout'))
```

::: details Penjelasan Kode
- `router.post(route('logout'))` — versi programatik (tanpa `&lt;Link>`). Berguna saat logout harus terjadi setelah modal konfirmasi, berhasil sync data, dsb.
- Tidak perlu `onSuccess` karena server akan `redirect()->route('login')`, Inertia otomatis navigate.
:::

## 12.8 Registrasi Manual

```php
class RegisterController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create($validated);
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }
}
```

::: details Penjelasan Kode
- `'email' => ['required', 'email', 'unique:users,email']` — validasi `unique` pada tabel `users` kolom `email`. Mencegah duplikat akun.
- `'password' => ['required', 'confirmed', Password::min(8)]` — `confirmed` meminta field `password_confirmation` sama; `Password::min(8)` adalah rule object Laravel yang merekomendasikan kompleksitas (bisa chain `.letters().numbers().symbols()`).
- `User::create($validated)` — mass assignment. Pastikan `$fillable` di model mencakup `name`, `email`, `password`. Password otomatis di-hash jika model pakai cast `hashed` (Laravel 10+) atau mutator.
- `Auth::login($user)` — login user **tanpa** attempt (karena baru dibuat, pasti valid). Membuat session untuk user baru. Argumen kedua opsional `$remember = false`.
- `$request->session()->regenerate()` — sama seperti login: anti session-fixation.
:::

## 12.9 Verifikasi Email

Laravel sudah menyediakan listener `EmailVerifiedListener`. Aktifkan di `bootstrap/app.php`:

```php
->withSchedule(function (Schedule $schedule) {
    // ...
})
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    ]);
})
```

Middleware `verified` redirect ke `verification.notice` otomatis. Page component:

```vue
<!-- Pages/Auth/VerifyEmail.vue -->
<script setup>
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
</script>

<template>
  <div>
    <h1>Verifikasi Email</h1>
    <p>Silakan cek email untuk link verifikasi.</p>
    <Link :href="route('verification.send')" method="post">Kirim ulang</Link>
  </div>
</template>
```

::: details Penjelasan Kode
- `middleware->alias(['verified' => ...])` — daftarkan alias `verified` di Laravel 11 (di versi 10 ini otomatis via `Kernel`). Setelah didaftarkan, pakai `Route::middleware('verified')`.
- `EnsureEmailIsVerified` — middleware bawaan. Cek `user->hasVerifiedEmail()`. Jika belum → redirect ke route `verification.notice` (yang mengarah ke page ini).
- `&lt;Link :href="route('verification.send')" method="post">` — route untuk **mengirim ulang** email verifikasi. Wajib `method="post"` (aksi server-side, bukan navigasi). Laravel throttle bawaan membatasi pengiriman ulang agar tidak spam.
:::

## 12.10 Konfirmasi Password

Untuk aksi sensitif (hapus akun, ubah password), Laravel menyediakan middleware `password.confirm`. Saat middleware redirect, Inertia akan navigate ke `password.confirm` page.

```vue
<!-- Pages/Auth/ConfirmPassword.vue -->
<script setup>
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const form = useForm({ password: '' })

function submit() {
  form.post(route('password.confirm'), {
    onSuccess: () => { /* user kembali ke intended page */ },
  })
}
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="form.password" type="password" placeholder="Password" />
    <span v-if="form.errors.password" class="text-red-600">{{ form.errors.password }}</span>
    <button type="submit">Lanjut</button>
  </form>
</template>
```

::: details Penjelasan Kode
- `ConfirmPassword` middleware menyimpan URL intended di session saat redirect ke `password.confirm`. Setelah user submit password, `onSuccess` Inertia navigate ke intended URL otomatis (tidak perlu redirect manual di Vue).
- `useForm({ password: '' })` — form minimal, hanya butuh password untuk konfirmasi.
- Server memverifikasi password hash cocok dengan user saat ini. Setelah 3 jam (default) session konfirmasi kedaluwarsa, user harus konfirmasi lagi — defence in depth.
:::

## 12.11 Auth Race Condition: Hati-hati

Hindari pattern:

```js
// SALAH: data user di-render saat null
onMounted(() => {
  if (page.props.auth.user) { /* ... */ }
})
```

Sebagai gantinya pakai guard di template:

```vue
<div v-if="user">...</div>
```

Saat middleware auth redirect tamu ke halaman login, page component proteksi middleware tidak akan di-render sama sekali. Jadi `user` pasti non-null di page yang diproteksi `auth`.

## 12.12 Ringkasan Bab

- Session-based auth — tidak ada token.
- Breeze Vue buat auth lengkap dengan Inertia.
- `Auth::user()` tetap bekerja di controller.
- Proteksi route: `auth`, `guest`, `verified`, `password.confirm`.
- User dikirim via `auth.user` shared data — akses `usePage().props.auth.user`.
- Logout POST via `<Link>` atau `router.post(route('logout'))`.

:::tip Selanjutnya
[Bab 13](/bagian-4/bab-13): bagaimana flash message dari controller muncul sebagai toast di Vue.
:::
