---
title: "Bab 15 — Autentikasi dengan Breeze"
---

# 📖 Bab 15 — Autentikasi dengan Breeze

Karena Inertia memakai session Laravel biasa, autentikasi terasa seperti aplikasi Laravel pada umumnya: middleware `auth`, `Auth::attempt()`, dan redirect. Tidak ada token, refresh token, atau penyimpanan JWT di localStorage. Bab ini membahas apa yang dibuat Breeze, cara membaca halaman auth-nya, dan kapan Anda benar-benar butuh Sanctum.

---

## 15.1 🧰 Apa Saja yang Dibuat Breeze

```bash
php artisan breeze:install react
```

| Fitur | File utama |
|---|---|
| Login | `Pages/Auth/Login.jsx`, `AuthenticatedSessionController` |
| Register | `Pages/Auth/Register.jsx`, `RegisteredUserController` |
| Lupa password | `Pages/Auth/ForgotPassword.jsx` |
| Reset password | `Pages/Auth/ResetPassword.jsx` |
| Verifikasi email | `Pages/Auth/VerifyEmail.jsx` |
| Profil | `Pages/Profile/Edit.jsx` |
| Layout auth | `Layouts/GuestLayout.jsx` |
| Layout utama | `Layouts/AuthenticatedLayout.jsx` |
| Route auth | `routes/auth.php` |

Breeze juga menambahkan route:

```php
// routes/auth.php (ringkas)
Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
Route::post('/register', [RegisteredUserController::class, 'store']);
```

---

## 15.2 🔑 Alur Login

```text
GET /login
   │  GuestLayout + Login.jsx
   ▼
useForm.post('/login', { email, password })
   │
   ▼
LoginRequest::authenticate()
   │  Auth::attempt(...)
   ├─ gagal → error di props.errors.email
   └─ sukses → session dibuat → redirect /dashboard
```

**Halaman login (disederhanakan):**

```jsx
import { useForm, Head } from '@inertiajs/react'
import GuestLayout from '@/Layouts/GuestLayout'

export default function Login({ status }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  })

  function submit(e) {
    e.preventDefault()
    post(route('login'), { onFinish: () => reset('password') })
  }

  return (
    <GuestLayout>
      <Head title="Masuk" />

      {status && <p className="mb-4 text-sm text-green-600">{status}</p>}

      <form onSubmit={submit}>
        <input
          type="email"
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          placeholder="Email"
        />
        {errors.email && <p className="text-red-600">{errors.email}</p>}

        <input
          type="password"
          value={data.password}
          onChange={(e) => setData('password', e.target.value)}
          placeholder="Password"
        />
        {errors.password && <p className="text-red-600">{errors.password}</p>}

        <label>
          <input
            type="checkbox"
            checked={data.remember}
            onChange={(e) => setData('remember', e.target.checked)}
          />
          Ingat saya
        </label>

        <button disabled={processing}>
          {processing ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </GuestLayout>
  )
}
```

**Controller:**

```php
public function store(LoginRequest $request)
{
    $request->authenticate();
    $request->session()->regenerate();

    return redirect()->intended(route('dashboard', absolute: false));
}
```

| Langkah | Penting karena |
|---|---|
| `authenticate()` | Validasi kredensial via `Auth::attempt` |
| `session()->regenerate()` | Mencegah session fixation |
| `redirect()->intended()` | Kembali ke halaman yang tadi diminta |

---

## 15.3 🚪 Logout

Logout harus `POST`, bukan link GET.

```jsx
import { Link } from '@inertiajs/react'

<Link href={route('logout')} method="post" as="button">
  Keluar
</Link>
```

```php
public function destroy(Request $request)
{
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
}
```

> 🚨 **Logout lewat GET berbahaya.** Crawler atau prefetch bisa memicu logout tanpa sengaja. Breeze sudah memakai POST — jangan diubah.

---

## 15.4 🧱 Guest vs Auth Layout

| Layout | Dipakai halaman | Isi |
|---|---|---|
| `GuestLayout` | Login, register, reset password | Tanpa sidebar; fokus form |
| `AuthenticatedLayout` | Dashboard, CRUD | Navbar, menu user, container |

```jsx
// Pages/Auth/Login.jsx
Login.layout = (page) => <GuestLayout>{page}</GuestLayout>
```

```jsx
// Pages/Products/Index.jsx
Index.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>
```

Halaman auth tidak boleh menampilkan menu yang butuh user login — itulah alasan layout dipisah.

---

## 15.5 🛡️ Middleware `auth`, `guest`, `verified`

```php
// routes/web.php
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');
    Route::resource('products', ProductController::class);
});

// routes/auth.php
Route::middleware('guest')->group(function () {
    Route::get('/login', ...)->name('login');
    Route::get('/register', ...)->name('register');
});
```

| Middleware | Efek |
|---|---|
| `auth` | User belum login → redirect ke `/login` |
| `guest` | User sudah login → redirect ke `/dashboard` |
| `verified` | Email belum diverifikasi → redirect ke verifikasi |
| `signed` | URL bertanda tangan (verifikasi email) |

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('products', ProductController::class);
});
```

> 💡 **Redirect `auth` otomatis menyimpan URL tujuan.** Setelah login, user kembali ke halaman yang tadi ingin dibuka.

---

## 15.6 ✏️ Menambah Field saat Register

**1. Migration:**

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('phone')->nullable()->after('email');
});
```

**2. Controller:**

```php
public function store(Request $request)
{
    $request->validate([
        'name'     => ['required', 'string', 'max:255'],
        'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
        'phone'    => ['nullable', 'string', 'max:20'],
        'password' => ['required', 'confirmed', Rules\Password::defaults()],
    ]);

    $user = User::create([
        'name'     => $request->name,
        'email'    => $request->email,
        'phone'    => $request->phone,
        'password' => Hash::make($request->password),
    ]);

    event(new Registered($user));
    Auth::login($user);

    return redirect(route('dashboard', absolute: false));
}
```

**3. Form:**

```jsx
const { data, setData, post, processing, errors } = useForm({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
})
```

| Langkah | Jangan lupa |
|---|---|
| Migration | Kolom nullable atau beri default |
| Validasi | `unique:users`, `confirmed` untuk password |
| Model | Tambahkan ke `$fillable` |
| Form | Field baru + error |

---

## 15.7 🔐 Session vs Token: Kapan Sanctum?

Inertia memakai **session cookie** karena frontend dan backend berada di origin yang sama.

| Kebutuhan | Mekanisme |
|---|---|
| Dashboard Inertia | Session (bawaan) |
| API untuk mobile app | Sanctum token |
| API untuk aplikasi pihak ketiga | Passport/OAuth |
| SPA terpisah domain | Sanctum SPA (cookie + CORS) |

```text
Inertia (satu origin)
Browser ── cookie sesi ──► Laravel
Tidak perlu token, tidak perlu CORS.

API (client lain)
Mobile ── Bearer token ──► Laravel
Butuh Sanctum, rate limit, dan endpoint API.
```

> 💡 **Jangan menambahkan token ke Inertia.** Jika butuh API untuk mobile, buat endpoint API terpisah — jangan memaksa Inertia memakai token.

---

## ✅ Checklist Bab 15

- **Breeze** — menyiapkan login, register, reset password, verifikasi, profil.
- **Login** — `Auth::attempt`, `session()->regenerate()`, `intended()`.
- **Logout** — `POST` + invalidate session + regenerate token.
- **Layout** — `GuestLayout` untuk auth, `AuthenticatedLayout` untuk area login.
- **Middleware** — `auth`, `guest`, `verified` di route.
- **Register kustom** — migration, validasi, `$fillable`, form.
- **Session, bukan token** — Inertia satu origin; Sanctum hanya untuk client lain.
- **Keamanan** — jangan pernah menaruh token atau data sesi di props.

---

⏭️ Lanjut ke [🛡️ Bab 16 — Otorisasi & RBAC di Frontend](/bagian-6/bab-16) untuk melanjutkan!
