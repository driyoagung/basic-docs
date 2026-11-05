---
title: Bab 22 — Testing Aplikasi Inertia
---

# Bab 22: Testing Aplikasi Inertia

:::info Bagian V — Ekosistem & Tooling
Test backend dengan PHPUnit/Pest + `assertInertia`. Test frontend composable dengan Vitest. E2E dengan Playwright.
:::

## 22.1 Testing Backend — Sama dengan Laravel Biasa

Feature test tidak tahu Inertia — mereka lihat response HTTP:

```php
public function test_guest_sees_login_page()
{
    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Auth/Login')
        );
}
```

::: details Penjelasan Kode
- `$this->get(route('login'))` — simulate HTTP GET. Laravel testing mengembalikan `TestResponse`.
- `->assertOk()` — assert status 200 OK.
- `->assertInertia(fn ($page) => ...)` — macro yang disediakan `inertiajs/inertia-laravel`. Membuka JSON Inertia response dan menjalankan assertion pada `component`, `props`, `url`, `version`.
- `$page->component('Auth/Login')` — assert bahwa Inertia akan merender komponen Vue `Pages/Auth/Login.vue` (path relatif terhadap `resources/js/Pages`).
:::

Helper `assertInertia` validasi bahwa response adalah Inertia JSON dengan komponen & props yang benar.

## 22.2 `assertInertia` — Assertion Khusus Inertia

Package `inertiajs/inertia-laravel` menyediakan assertion + `Assert` class:

```php
use Inertia\Testing\TestResponseMacros;

public function test_index_renders_paginated_posts()
{
    Post::factory()->count(5)->create();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('posts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Posts/Index')
            ->has('posts.data', 5)
            ->has('posts.meta.total', 5)
            ->has('posts.meta.current_page', 1)
            ->where('posts.meta.per_page', 10)
        );
}
```

::: details Penjelasan Kode
- `Post::factory()->count(5)->create()` — seed 5 record Post ke DB test.
- `actingAs($user)` — authenticate sebagai user (bypass login form).
- `Assert $page` — type-hint agar IDE mengenali fluent assertion class.
- `$page->component('Posts/Index')` — assert komponen Vue yang akan di-render.
- `$page->has('posts.data', 5)` — akses nested props via dot notation; `posts.data` adalah array dengan 5 elemen.
- `$page->has('posts.meta.total', 5)` — assert prop scalar `posts.meta.total` bernilai 5. Pola `has(key, value)` ini otomatis pakai `where` bila scaler.
- `$page->where('posts.meta.per_page', 10)` — assert exact equality pada prop scalar.
:::

Method yang sering digunakan:

| Method | Validasi |
| --- | --- |
| `->component('Name')` | Komponen yang di-render |
| `->has('key')` | Ada prop `key` |
| `->has('key', $count)` | Prop `key` adalah array/collection dengan jumlah |
| `->hasAll(['a', 'b'])` | Semua key ada |
| `->where('key', $value)` | Assert prop `key` sama dengan `$value` |
| `->whereAll([...])` | Multiple |
| `->missing('key')` | Prop tidak ada |
| `->etc()` | Abaikan key lain |

## 22.3 Testing Form Submission

Pola store, validasi sukses, redirect:

```php
public function test_store_creates_post_and_redirects()
{
    $user = User::factory()->create();
    $payload = ['title' => 'Hello', 'body' => 'World world.'];

    $this->actingAs($user)
        ->post(route('posts.store'), $payload)
        ->assertRedirect(route('posts.index'));

    $this->assertDatabaseHas('posts', [
        'title' => 'Hello',
        'user_id' => $user->id,
    ]);
}
```

::: details Penjelasan Kode
- `->post(route('posts.store'), $payload)` — submit POST dengan payload form.
- `->assertRedirect(route('posts.index'))` — Laravel default controller return `redirect()->route(...)` setelah sukses store; assert ini judulnya benar.
- `assertDatabaseHas` — cek tabel `posts` ada row dengan field yang diharapkan; pastikan persistence sukses. Tidak peduli kolom lain (id, timestamps).
:::

## 22.4 Testing Validasi

Validasi gagal → Inertia kirim `errors` prop:

```php
public function test_store_requires_title_and_body()
{
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('posts.store'), [])
        ->assertSessionHasErrors(['title', 'body']);
}
```

::: details Penjelasan Kode
- `->assertSessionHasErrors(['title', 'body'])` — Laravel menyimpan validation errors di session flash. Cara lama ini tetap valid untuk Inertia karena Inertia membaca dari session juga.
:::

Atau assert langsung Inertia errors:

```php
public function test_store_validation_error_returned()
{
    $this->actingAs(User::factory()->create())
        ->post(route('posts.store'), [])
        ->assertInertia(fn (Assert $page) => $page
            ->component('Posts/Create')
            ->has('errors.title')
            ->has('errors.body')
        );
}
```

::: details Penjelasan Kode
- `$page->has('errors.title')` — Inertia merender ulang komponen `Posts/Create` lalu memasangkan prop `errors` berisi key field yang validasi gagal. Assert key ada = field error.
- Cocok jika ingin assert error spesifik tampil tanpa bergantung pada session API.
:::

## 22.5 Testing Autentikasi

```php
public function test_guest_redirected_from_dashboard()
{
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
}

public function test_user_can_login()
{
    $user = User::factory()->create(['password' => bcrypt('secret')]);

    $this->post(route('login'), [
        'email'    => $user->email,
        'password' => 'secret',
    ])->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
}
```

::: details Penjelasan Kode
- `User::factory()->create(['password' => bcrypt('secret')])` — override attribute `password` di factory; default factory menggunakan `Hash::make('password')` tetapi kita perlu hash yang cocok dengan input `'secret'`.
- `assertRedirect(route('dashboard'))` — login controller Breeze mengarahkan ke `dashboard` setelah sukses.
- `assertAuthenticatedAs($user)` — assert user `$user` (bukan user lain) yang terautentikasi di guard default.
:::

## 22.6 Testing Authorization

```php
public function test_non_owner_cannot_edit_post()
{
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->get(route('posts.edit', $post))
        ->assertForbidden();
}

public function test_owner_can_edit_post()
{
    $owner = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    $this->actingAs($owner)
        ->get(route('posts.edit', $post))
        ->assertInertia(fn (Assert $p) => $p->component('Posts/Edit'));
}
```

::: details Penjelasan Kode
- `Post::factory()->for($owner)->create()` — `for()` men-set belongsTo relation: `post.user_id = $owner->id`. Set relasi sekaligus, clean.
- `assertForbidden()` — assert status 403. Berarti policy / middleware mencegah akses user bukan owner.
- `assertInertia(fn ($p) => $p->component('Posts/Edit'))` — positive test: owner mendapat response Inertia normal dengan komponen `Posts/Edit`.
:::

## 22.7 Testing File Upload

```php
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

public function test_user_can_upload_thumbnail()
{
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('posts.store'), [
            'title'     => 'Title',
            'body'      => 'Body content lorem ipsum.',
            'thumbnail' => $file = UploadedFile::fake()->image('thumb.jpg'),
        ])
        ->assertRedirect();

    Storage::disk('public')->assertExists('thumbnails/' . $file->hashName());
}
```

::: details Penjelasan Kode
- `Storage::fake('public')` — swap disk `public` ke temporary filesystem (temporary dir). File tidak benar-benar disimpan ke disk lokal, di-cleanup setelah test.
- `UploadedFile::fake()->image('thumb.jpg')` — buat fake file upload dengan MIME image. Mendukung dimension kustomisasi `->image(..., 100, 200)`.
- `$file->hashName()` — nama unik yang diberi Laravel sebagai nama file saat disimpan.tidak perlu tahu nama pasti di test.
- `Storage::disk('public')->assertExists('thumbnails/'.$file->hashName())` — assert file benar-benar di-store ke folder `thumbnails`.
:::

## 22.8 Pest PHP

Pest lebih readable. Convert test di atas:

```php
use function Pest\Laravel\{actingAs, get, post, assertRedirect};

it('shows login page', function () {
    get(route('login'))->assertOk()->assertInertia(fn ($p) => $p->component('Auth/Login'));
});

it('requires email and password', function () {
    post(route('login'), [])->assertSessionHasErrors(['email', 'password']);
});

it('logs in a valid user', function () {
    $user = User::factory()->create(['password' => bcrypt('secret')]);

    post(route('login'), ['email' => $user->email, 'password' => 'secret'])
        ->assertRedirect(route('dashboard'));

    expect(auth()->user())->id->toBe($user->id);
});
```

::: details Penjelasan Kode
- `use function Pest\Laravel\{...}` — import function global Pest (`get`, `post`, `actingAs`). Lebih ringkas tanpa `$this->`.
- `it('shows login page', function () { ... })` — Pest style: penjabaran behavior. Dibanding `test_*`, lebih natural dan menghasilkan output test yang enak dibaca.
- `expect(auth()->user())->id->toBe($user->id)` — expectation API Pest; akses property `id` lalu assertion `toBe`. Fluent chain.
:::

## 22.9 Konfigurasi Testing Inertia

Pastikan `phpunit.xml` aktif middleware web:

```xml
<php>
    <env name="APP_ENV" value="testing"/>
    <env name="SESSION_DRIVER" value="array"/>
    <env name="CACHE_DRIVER" value="array"/>
</php>
```

::: details Penjelasan Kode
- `APP_ENV=testing` — menjalankan aplikasi di mode testing; banyak package mengubah perilaku (mis. tidak kirim email).
- `SESSION_DRIVER=array` — wajib untuk Inertia; redirect Inertia carry flash message lewat session. `array` driver in-memory, cepat dan isolated per test.
- `CACHE_DRIVER=array` — sama; cache di-memory agar test tidak kena stale cache.
:::

Inertia butuh session driver & cache — kalau hilang, redirect tidak bekerja.

## 22.10 Testing Frontend dengan Vitest

Setup Vitest:

```bash
npm install -D vitest @vue/test-utils jsdom
```

`vitest.config.js`:

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

::: details Penjelasan Kode
- `environment: 'jsdom'` — simulate DOM di Node.js. Tanpa jsdom, mounting komponen Vue yang akses `document` akan error.
- `globals: true` — inject `describe`, `it`, `expect` ke global; tidak perlu import di setiap test file.
- `plugins: [vue()]` — enable parses `.vue` SFC di test file; lakukan transformasi sama seperti Vite dev/build.
:::

Test composable:

```js
// tests/composables/useDebounce.spec.js
import { test, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDebounce } from '@/composables/useDebounce'

test('debounces callback', async () => {
  vi.useFakeTimers()
  const val = ref('')

  const cb = vi.fn()
  const debounced = useDebounce(cb, 300)

  val.value = 'halo'
  debounced.value = val.value
  await nextTick()

  vi.advanceTimersByTime(300)
  expect(cb).toHaveBeenCalledWith('halo')
})
```

::: details Penjelasan Kode
- `vi.useFakeTimers()` — pakai fake timer; `setTimeout`/`setInterval` tidak benar-benar menunggu. Lebih cepat dan deterministik.
- `vi.fn()` — mock function; merekam panggilan argument. Bisa di-assert dengan `toHaveBeenCalledWith`.
- `await nextTick()` — tunggu Vue flush update reaktif sebelum advance timer.
- `vi.advanceTimersByTime(300)` — pindahkan time 300ms; memicu `setTimeout` debounce.
- `expect(cb).toHaveBeenCalledWith('halo')` — assert panggilan terakhir `cb` dengan arg `'halo'`.
:::

Test komponen dengan `@vue/test-utils`:

```js
import { mount } from '@vue/test-utils'
import { test, expect } from 'vitest'
import Button from '@/Components/UI/Button.vue'

test('renders slot content', () => {
  const wrapper = mount(Button, { slots: { default: 'Click me' } })
  expect(wrapper.text()).toContain('Click me')
})

test('applies variant class', () => {
  const wrapper = mount(Button, { props: { variant: 'danger' } })
  expect(wrapper.classes()).toContain('bg-red-600')
})
```

::: details Penjelasan Kode
- `mount(Button, { slots, props })` — mount Vue component secara isolated dengan props/slots yg dikontrol.
- `wrapper.text()` — akses text content hasil render.
- `wrapper.classes()` — array class HTML yang diterapkan pada root element. Cocok untuk assert variant class.
:::

Mock Inertia `router`:

```js
vi.mock('@inertiajs/vue3', () => ({
  router: { visit: vi.fn(), get: vi.fn() },
  Link: { name: 'Link' },
}))
```

::: details Penjelasan Kode
- `vi.mock('@inertiajs/vue3', () => ({...}))` — replace modul Inertia dengan mock stub. Menghindari import penuh saat test unit komponen yang cuma butuh `&lt;Link>` atau `router`.
- `Link: { name: 'Link' }` — stub minimal komponen `&lt;Link>` agar `mount` tidak crash; render `&lt;div>` kosong.
:::

## 22.11 E2E Testing dengan Playwright

Install:

```bash
npm init playwright@latest
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:8000' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

::: details Penjelasan Kode
- `testDir: './tests/e2e'` — folder berisi spec E2E.
- `use.baseURL` — prefix URL tiap `page.goto('/path')`; tidak perlu ulang `http://localhost:8000`.
- `projects` — array browser engine untuk dijalankan. Playwright sudah bundle Chromium, Firefox, WebKit.
- `...devices['Desktop Chrome']` — preset Playwright untuk viewport (`1280x720`) + userAgent Chrome.
:::

Sample test:

```ts
import { test, expect } from '@playwright/test'

test('user can login and create post', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'secret')
  await page.click('button[type="submit"]')

  await page.waitForURL('/dashboard')
  await page.click('text=+ Buat Post')

  await page.fill('input[name="title"]', 'Post E2E')
  await page.fill('textarea[name="body"]', 'Body test minimal 20 chars lorem ipsum')
  await page.click('text=Simpan')

  await expect(page.locator('text=Post dibuat')).toBeVisible()
})
```

::: details Penjelasan Kode
- `test('...', async ({ page }) => { ... })` — Playwright inject `page` fixture; browser context otomatis per test.
- `page.fill(selector, value)` — isi input; menggunakan CSS + attribute selector.
- `page.waitForURL('/dashboard')` — tunggu navigasi selesai (Inertia SPA navigasi, tidak full reload). Playwright mendeteksi URL change.
- `page.click('text=+ Buat Post')` — text selector Playwright; klik elemen yang berisi teks tersebut.
- `expect(page.locator('text=Post dibuat')).toBeVisible()` — assertion E2E; locator menunggu element muncul hingga timeout default.
:::

## 22.12 Strategi Test: Apa, Berapa, Kapan

| Lapis | Tools | Cakupan |
| --- | --- | --- |
| Unit composable | Vitest | 100% logic pure |
| Unit komponen | Vitest + @vue/test-utils | Variants, props binding |
| Feature | Pest / PHPUnit | Controller, validasi, redirect, Inertia props |
| Authorization | Pest | Forbidden / Allowed per role & resource |
| E2E | Playwright | Critical user journey (login, CRUD) |

:::tip Aturan
- Feature test 80% kasus, E2E hanya untuk 5-10 alur kritis.
- Hindari snapshot yang terlalu brittle.
- Pakai `Inertia::lazy` mock di frontend unit.
:::

## 22.13 Tips Debugging Test Gagal

- Error `Session expired` → cek `SESSION_DRIVER`.
- `Expected component 'X/Y' but got 'Z'` → cek `Inertia::render` di controller.
- Client test gagal import Inertia → mock module.
- Playwright timeout → cek port server & DB test.

## 22.14 Ringkasan Bab

- Backend test = Laravel feature test + `assertInertia`.
- `Assert` class untuk validasi komponen, props, nested.
- Validasi error di-test dengan `assertSessionHasErrors` atau via Inertia `errors`.
- Authorization: `assertForbidden()`.
- Vitest untuk composable & komponen Vue.
- Playwright untuk critical E2E flow.
- Pest PHP membuat test lebih ekspresif (opsional).

:::tip Selanjutnya
[Bab 23](/bagian-5/bab-23): optimasi build, asset versioning, dan deploy ke VPS atau platform seperti Forge/Ploi.
:::
