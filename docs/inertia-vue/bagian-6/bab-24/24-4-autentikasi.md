---
title: 24.4 - Autentikasi
---

# 24.4 Autentikasi

:::info Langkah 4 dari 15
Pakai auth Breeze yang sudah ada + tambahkan upload avatar & shared data.
:::

## Yang Sudah Disiapkan Breeze

Laravel Breeze sudah provide:

- `Auth/Login.vue`, `Register.vue`, `ForgotPassword.vue`, `VerifyEmail.vue`.
- Routes di `routes/auth.php`.
- Controller di `app/Http/Controllers/Auth/`.
- Middleware alias `auth`, `guest`, `verified`, `password.confirm`.

Tidak perlu tulis ulang - cukup kustomisasi.

## Tambah Upload Avatar (Optional)

Untuk tambah field avatar di form register:

```php
// app/Http/Controllers/Auth/RegisteredUserController.php
public function store(Request $request)
{
    $validated = $request->validate([
        'name'     => ['required', 'string', 'max:255'],
        'email'    => ['required', 'email', 'unique:users,email'],
        'password' => ['required', 'confirmed', Password::min(8)],
        'avatar'   => ['nullable', 'image', 'max:1024'],
    ]);

    if ($request->hasFile('avatar')) {
        $validated['avatar_path'] = $request->file('avatar')->store('avatars', 'public');
    }

    $user = User::create($validated);
    event(new Registered($user));
    Auth::login($user);

    return redirect()->route('dashboard');
}
```

::: details Penjelasan Kode
- `'email' => ['required', 'email', 'unique:users,email']` - aturan validasi: wajib, format email, dan unik di tabel `users` kolom `email`. Laravel otomatis query DB untuk cek duplikat.
- `'password' => ['required', 'confirmed', Password::min(8)]` - `confirmed` berarti field `password_confirmation` harus cocok. Kelas `Password::min(8)` (dari Laravel) memungkinkan aturan kompleksitas tambahan (huruf, angka, simbol) yang dapat dirantai.
- `'avatar' => ['nullable', 'image', 'max:1024']` - `nullable` boleh kosong, `image` wajib tipe gambar (jpg/png/bmp/svg/webp), `max:1024` maksimum 1024 KB.
- `$request->hasFile('avatar')` - mengecek apakah request berisi file upload dengan key `avatar`.
- `->store('avatars', 'public')` - menyimpan file ke disk `public` (folder `storage/app/public/avatars`) dan mengembalikan path relatif, mis. `avatars/abc123.jpg`. Nama file unik di-generate otomatis.
- `$validated['avatar_path']` - menyimpan ke key baru agar saat `User::create($validated)` kolom `avatar_path` ikut diisi.
- `event(new Registered($user))` - memicu event `Registered`; Listener default mengirim email verifikasi (jika fitur verifikasi diaktifkan di model User via `MustVerifyEmail`).
- `Auth::login($user)` - login user baru secara langsung tanpa perlu input password lagi.
:::

Tambah input file di `Register.vue`:

```vue
<input
  type="file"
  accept="image/*"
  @change="form.avatar = $event.target.files[0]"
/>
```

::: details Penjelasan Kode
- `accept="image/*"` - hint untuk browser hanya menampilkan file gambar di dialog pilih file. Bersifat advisory; validasi server tetap wajib.
- `@change="form.avatar = $event.target.files[0]"` - event `change` dipicu saat user memilih file. `$event.target` adalah elemen `&lt;input>` HTML, `files` adalah `FileList`, dan `[0]` mengambil file pertama sebagai objek `File` (bukan path, karena browser tidak mengekspos path lokal demi keamanan).
- Menyimpan ke `form.avatar` (objek `useForm`) agar ikut terkirim saat submit. Inertia otomatis deteksi objek `File` dan mengirim sebagai multipart/form-data.
:::

Submit form dengan `forceFormData`:

```js
form.post(route('register'), {
  forceFormData: true,
  onSuccess: () => {/* redirect otomatis */},
})
```

::: details Penjelasan Kode
- `form.post(...)` - mengirim form Inertia via POST. Helper `route('register')` dari Ziggy menghasilkan URL `/register`.
- `forceFormData: true` - memaksa Inertia mengirim sebagai `multipart/form-data` walaupun tidak ada field file software terdeteksi. Beberapa browser/engine perlu ini saat upload file di-handle manual.
- `onSuccess` callback - dijalankan setelah respons 2xx. Karena controller mengembalikan `redirect()->route('dashboard')`, Inertia otomatis ikut redirect, jadi callback sering kosong.
:::

Pastikan migration `users` punya kolom `avatar_path`:

```php
$table->string('avatar_path')->nullable()->after('password');
```

## Shared Data Auth User

Pastikan user yang login dikirim ke semua halaman. Edit `HandleInertiaRequests`:

```php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $request->user() ? UserResource::make($request->user()) : null,
        ],
        'flash' => [
            'success' => fn () => $request->session()->get('success'),
            'error'   => fn () => $request->session()->get('error'),
        ],
    ]);
}
```

::: details Penjelasan Kode
- `share()` - method di middleware `HandleInertiaRequests` yang menentukan prop apa yang selalu dikirim ke setiap halaman Inertia. Hasilnya akan muncul di `usePage().props`.
- `array_merge(parent::share($request), [...])` - menambah properti ke shared data bawaan Breeze (yang sudah berisi `auth.user` dan `errors`). Penting agar tidak menimpa default yang masih berguna.
- `$request->user() ? UserResource::make(...) : null` - bungkus user dengan resource agar konsisten format dan hanya properti yang aman diekspos (mis. tidak ada `password`).
- `fn () => $request->session()->get('success')` - lazy callback (closure). Inertia hanya mengevaluasi saat page dirender, sehingga flash message hanya dibaca sekali dan tidak ikut diserialisasi Awal sebelum benar-benar diminta - menghemat payload.
- Properti `flash` akan tersedia di Vue sebagai `page.props.flash.success`, dipakai komponen `FlashMessage` di layout.
:::

Detail tentang shared data ada di [Bab 11](/bagian-4/bab-11).

## Proteksi Route

```php
// routes/web.php
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('projects', ProjectController::class);
    Route::resource('projects.tasks', TaskController::class)->except(['index', 'show']);
    // ...
});
```

::: details Penjelasan Kode
- `Route::middleware('auth')->group(...)` - menerapkan middleware `auth` ke semua route di dalam closure. User yang belum login dialihkan ke route `login` otomatis.
- `Route::resource('projects', ...)` - generate 7 route RESTful sekaligus (`index`, `create`, `store`, `show`, `edit`, `update`, `destroy`) dengan naming convention `projects.create`, `projects.store`, dst.
- `Route::resource('projects.tasks', ...)` - nested resource. URL menjadi `/projects/{project}/tasks/{task}` dan route name `projects.tasks.update`, dll.
- `->except(['index', 'show'])` - mengecualikan route `index` dan `show` karena task ditampilkan dalam halaman project, bukan punya halaman tersendiri.
:::

## Akses User di Vue

```js
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

const page = usePage()
const user = computed(() => page.props.auth.user)
// user.value.name, user.value.avatar_path
```

::: details Penjelasan Kode
- `usePage()` - composable Inertia yang mengembalikan objek reaktif halaman saat ini. Properti `.props` berisi semua prop yang dikirim controller via `Inertia::render` + shared data dari `HandleInertiaRequests`.
- `computed(() => page.props.auth.user)` - membungkus akses ke `auth.user` dalam computed ref agar reaktif; jika props berubah (mis. setelah login/logout partial reload), `user.value` otomatis update.
:::

## Logout

```vue
<Link :href="route('logout')" method="post" as="button">
  Logout
</Link>
```

::: details Penjelasan Kode
- `&lt;Link>` - komponen Inertia yang melakukan navigasi via fetch, bukan reload penuh.
- `method="post"` - logout wajib POST (bukan GET) untuk mencegah CSRF lewat URL/iframe dan agar tidak ter-bookmark. Route `logout` default Breeze hanya menerima POST.
- `as="button"` - merender `&lt;Link>` menjadi elemen `&lt;button>` (defaultnya `&lt;a>`), karena secara semantik logout adalah aksi, bukan navigasi.
:::

## Selanjutnya

Auth siap. Lanjut ke [24.5 - Layout Utama Aplikasi](/bagian-6/bab-24/24-5-layout-utama).
