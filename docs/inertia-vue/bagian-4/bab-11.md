---
title: Bab 11 — Shared Data & Props Global — Pengganti View Composer
---

# Bab 11: Shared Data & Props Global — Pengganti View Composer

:::info Bagian IV — Fitur Lanjutan Inertia
Data yang dibutuhkan di semua halaman (user login, flash message, permission) — kirim sekali via `HandleInertiaRequests::share()`, akses di seluruh Vue via `usePage()`.
:::

## 11.1 Masalah: Data yang Dibutuhkan di Semua Halaman

Di Blade, kamu pakai:

```php
View::share('user', auth()->user());
View::share('appName', config('app.name'));
```

Atau View Composer di `AppServiceProvider`:

```php
View::composer('layouts.app', function ($view) {
    $view->with('unreadCount', Notification::unread()->count());
});
```

Di Inertia, digantikan oleh method `share()` di middleware `HandleInertiaRequests`.

## 11.2 `HandleInertiaRequests` Middleware

File: `app/Http/Middleware/HandleInertiaRequests.php`:

```php
class HandleInertiaRequests extends Middleware
{
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user()
                    ? UserResource::make($request->user())
                    : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'info'    => fn () => $request->session()->get('info'),
            ],
            'appName' => config('app.name'),
            'permissions' => fn () => $request->user()
                ? $request->user()->getAllPermissions()->pluck('name')
                : [],
        ]);
    }
}
```

::: details Penjelasan Kode
- `public function share(Request $request): array` — method wajib di-override dari `HandleInertiaRequests` (Inertia middleware). Nilai return (array) otomatis di-merge ke `page.props` dan dikirim ke **setiap** page component Vue.
- `return array_merge(parent::share($request), [...])` — `parent::share()` sudah menyediakan `errors` (validation errors dari session) dan `auth.user` dasar. Dengan `array_merge`, kita tambahkan/override key sendiri tanpa menghapus bawaan.
- `'auth' => ['user' => $request->user() ? UserResource::make($request->user()) : null]` — kirim data user yang sedang login. Null coalescing dengan ternary mencegah error saat tamu belum login. `UserResource::make()` membungkus model ke format API (memilih field, transformasi) sehingga password/hash tidak ikut bocor.
- `'flash' => ['success' => fn () => $request->session()->get('success')]` — pakai **closure `fn ()`** agar pembacaan session hanya dilakukan saat prop `flash.success` benar-benar diakses/dievaluasi. Tanpa closure, `->get()` langsung dieksekusi di setiap request meski page tidak memakai flash.
- `'appName' => config('app.name')` — nilai scalar dari config, tidak perlu closure karena murah.
- `'permissions' => fn () => $request->user() ? $request->user()->getAllPermissions()->pluck('name') : []` — eksekusi query permission (relatif mahal) dibungkus closure agar lazy; tamu (user null) langsung dapat `[]` tanpa query.
:::

Aturan penting:

- Array yang di-return akan jadi `page.props`.
- Data ini **selalu** dikirim ke semua halaman — gunakan `fn ()` agar dieksekusi hanya saat diperlukan (lazy).
- `parent::share()` mengirim `errors` otomatis (validation errors).

## 11.3 Mengakses Shared Data di Vue

```js
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

const page = usePage()

const user = computed(() => page.props.auth.user)
const appName = computed(() => page.props.appName)
const flash = computed(() => page.props.flash)
```

::: details Penjelasan Kode
- `import { usePage } from '@inertiajs/vue3'` — composable resmi Inertia untuk mengakses objek "page" yang berisi `props`, `url`, `component`, `version`.
- `const page = usePage()` — harus dipanggil di setup script (atau dalam composable), karena konteks Vue diperlukan. Tidak bisa dipakai di modul plain di luar component.
- `const user = computed(() => page.props.auth.user)` — **wajib bungkus `computed`** agar reaktif terhadap perubahan props saat navigasi/partial reload. Jika langsung `page.props.auth.user`, nilainya froze di render pertama dan tidak ikut berubah.
- `const flash = computed(() => page.props.flash)` — `flash` ganti nilainya setiap redirect dari controller (`->with('success', ...)`), jadi `computed` memastikan UI ikut update.
:::

:::tip Buat reaktif dengan computed
Selalu bungkus dengan `computed` jika mau reaktif terhadap navigasi (props berubah saat pindah halaman).
:::

## 11.4 Pola Composable untuk Shared Data

Agar tidak duplikasi `usePage()` di banyak komponen:

```js
// composables/useAuth.js
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

export function useAuth() {
  const page = usePage()
  return {
    user: computed(() => page.props.auth.user),
    isLoggedIn: computed(() => page.props.auth.user !== null),
    logout: () => router.post(route('logout')),
  }
}
```

::: details Penjelasan Kode
- `export function useAuth()` — pola composable Vue 3 (Composition API). Nama diawali `use` menjadi konvensi.
- `const page = usePage()` — instansiasi satu kali di dalam composable; Vue cache konteks per komponen pemanggil.
- `user: computed(() => page.props.auth.user)` — `computed` membuat `user` reaktif. Saat `router.reload({ only: ['auth'] })` dipanggil, `page.props.auth` berubah dan `user` otomatis update.
- `isLoggedIn: computed(() => page.props.auth.user !== null)` — derived state. Lebih aman pakai `!== null` daripada truthy karena user object kosong tetap truthy.
- `logout: () => router.post(route('logout'))` — method logout yang dapat dipanggil langsung; `router.post` wajib karena route logout biasanya hanya menerima POST (mencegah CSRF via GET).
:::

```js
// composables/useFlash.js
export function useFlash() {
  const page = usePage()
  const success = computed(() => page.props.flash?.success)
  const error = computed(() => page.props.flash?.error)

  return { success, error }
}
```

::: details Penjelasan Kode
- `page.props.flash?.success` — optional chaining (`?.`) mencegah TypeError jika `flash` belum di-share sama sekali (mis. saat konfigurasi `HandleInertiaRequests` belum lengkap). Hasilnya `undefined` yang aman ditampilkan.
- Dua `computed` terpisah agar pemanggil bisa ambil hanya field yang relevan; Vue tidak akan re-evaluate yang lain kecuali dependency berubah.
:::

## 11.5 Contoh Data yang Biasa di-Share

| Data | Source | Pakai untuk |
| --- | --- | --- |
| `auth.user` | `$request->user()` | Navbar user avatar, role |
| `flash.*` | `session('success')` | Notifikasi toast |
| `permissions` | `$user->permissions` | Tombol show/hide via authorization |
| `appName` | `config('app.name')` | Title, footer |
| `unreadCount` | `Notification::unread()->count()` | Badge di navbar |
| `hasOnboarded` | `$user->hasOnboarded` | Tampilkan onboarding modal |
| `enableFeatureX` | `config('features.x')` | Feature flag |

## 11.6 Lazy Shared Props

Gunakan `fn () =>` agar closure hanya dieksekusi jika props benar-benar dikirim (default: dikirim semua tapi closure lazy).

```php
'unreadCount' => fn () => Notification::where('user_id', $request->user()->id)
    ->unread()
    ->count(),
```

`Inertia::lazy` lebih eksplisit — props Truly tidak dikirim kecuali diminta dengan `only`:

```php
'heavyStats' => Inertia::lazy(fn () => $this->computeHeavyStats()),
```

::: details Penjelasan Kode
- `Inertia::lazy(closure)` — menandai prop sebagai "tidak dikirim kecuali diminta". Berbeda dari `fn () =>` yang tetap dikirim setiap request (hanya closure dievaluasi lazy). Dengan `Inertia::lazy`, seluruh prop **tidak ada di payload** kecuali client meminta via `only: ['heavyStats']`.
- Cocok untuk data berat (laporan agregasi, list besar) yang hanya ditampilkan di tab/sub-route tertentu.
:::

Di client:

```js
router.visit(url, { only: ['heavyStats'] })
```

::: details Penjelasan Kode
- `{ only: ['heavyStats'] }` — partial reload: server hanya akan re-evaluate prop yang diminta. Prop lain di-keep dari props sebelumnya sehingga hemat bandwidth & query DB.
- Tanpa `only`, semua prop akan dihitung ulang server-side dan dikirim utuh.
:::

:::tip `fn () =>` vs `Inertia::lazy`
- `fn () =>` dieksekusi setiap render, tapi hasil hanya dihitung satu kali.
- `Inertia::lazy(closure)` dieksekusi **hanya** jika nama prop ada di `only`. Pilih sesuai konteks — `lazy` lebih hemat, tapi client harus tahu kapan minta.
:::

## 11.7 Variabel Spesifik Boolean di Frontend

Untuk fitur flag, lebih ringkas pakai array object:

```php
'features' => [
    'darkMode' => config('features.dark_mode', false),
    'beta'     => $request->user()?->isBetaTester() ?? false,
],
```

Di Vue:

```js
const beta = computed(() => page.props.features.beta)
```

## 11.8 Re-Share saat Data Berubah

Karena shared data dikirim setiap render, setelah user update profil, dev cukup reload halaman:

```js
// Setelah update profile
router.reload()
// auth.user sekarang berisi data baru
```

Atau kirim spesifik:

```js
router.reload({ only: ['auth'] }) // partial reload hanya auth
```

::: details Penjelasan Kode
- `router.reload()` — meminta ulang props dari route **saat ini** (URL tidak berubah). Berguna setelah operasi server-side yang mengubah data shared (update profile, ubah role).
- `{ only: ['auth'] }` — partial reload. Hanya prop `auth` yang di-refresh, prop lain (list posts, dll.) tetap utuh sehingga UI tidak "flash" kosong.
- Tanpa `only`, semua prop route saat ini dievaluasi ulang — boros query dan bisa reset state lokal yang tidak diinginkan.
:::

## 11.9 Pola yang Salah vs Benar

:::warning Hindari
- Menimpan data dari server ke Pinia "untuk konsistensi" — props dari Inertia sudah cukup.
- Memanggil `usePage().props` di dalam method (sebagai nilai) — gunakan `computed` agar reaktif.
- Share query berat tanpa `fn ()`:
  ```php
  'unread' => $user->unreadNotifications->count(), // selalu dieksekusi, meskipun tidak dipakai
  ```
:::

::: details Penjelasan Kode (anti-pattern)
- `'unread' => $user->unreadNotifications->count()` — property access di PHP langsung mengirim query (karena `unreadNotifications` adalah relation dynamic). Walaupun page tidak memakai `unread`, query tetap dieksekusi di setiap request. Sudah pasti N+1 dan beban DB sia-sia.
:::

Pola yang benar:

```php
'unread' => fn () => $user->unreadNotifications()->count(),
```

::: details Penjelasan Kode
- `fn () => $user->unreadNotifications()->count()` — closure tidak dipanggil sampai Inertia serialize props. Closure dievaluasi tepat saat payload dikirim, sehingga tidak ada query saat konstruk respons (bisa digunakan untuk skip helemaal jika prop di `Inertia::lazy`).
- `->unreadNotifications()` (method, bukan property) mengembalikan query builder; `->count()` menghasilkan `COUNT` query efisien, bukan memuat koleksi model ke memory.
:::

## 11.10 Ringkasan Bab

- `HandleInertiaRequests::share()` = pengganti `View::share()` + View Composer.
- Data dikirim ke **setiap** page component — gunakan `fn ()` agar lazy.
- `usePage().props.<key>` di Vue — bungkus `computed` agar reaktif.
- Taruh composable (`useAuth`, `useFlash`, `usePermission`) untuk reusable akses.
- Update shared data via `router.reload({ only: ['auth'] })`.

:::tip Selanjutnya
[Bab 12](/bagian-4/bab-12): bagaimana flow auth session Laravel bekerja di Inertia.
:::