---
title: 24.14 - Testing Mini Project
---

# 24.14 Testing Mini Project

:::info Langkah 14 dari 15
Test backend dengan PHPUnit/Pest + `assertInertia`, test authorization, validasi, dan upload.
:::

## Setup Testing

Pastikan `phpunit.xml` punya environment testing yang benar:

```xml
<php>
    <env name="APP_ENV" value="testing"/>
    <env name="SESSION_DRIVER" value="array"/>
    <env name="CACHE_DRIVER" value="array"/>
    <env name="DB_DATABASE" value=":memory:"/>
</php>
```

::: details Penjelasan Kode
- `&lt;env name="..." value="..."/>` - tag `&lt;php>` dalam `phpunit.xml` men-set environment variable saat test berjalan, meng-override `.env`.
- `APP_ENV=testing` - mengaktifkan mode testing; mencegah side-effect berbahaya (mis. aplikasi mengirim email asli).
- `SESSION_DRIVER=array` / `CACHE_DRIVER=array` - simpan session/cache di dalam array PHP; ter-reset antar test. Tidak menulis ke file/DB/redis -> test paralel aman.
- `DB_DATABASE=":memory:"` - SQLite in-memory untuk test. Cepat (no I/O) dan isolated; tabel dibuat/dihapus per test via migration. Untuk MySQL-specific test, gunakan DB database test terpisah.
:::

## Test Project - CRUD

Pest PHP style:

```php
use function Pest\Laravel\{actingAs, get, post, put, delete};

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('shows project list', function () {
    $this->user->projects()->save(Project::factory()->make());

    actingAs($this->user)
        ->get(route('projects.index'))
        ->assertInertia(fn ($page) => $page
            ->component('Projects/Index')
            ->has('projects.data')
        );
});

it('creates a project', function () {
    actingAs($this->user)
        ->post(route('projects.store'), [
            'name'        => 'Task Manager',
            'description' => 'Mini project',
            'color'       => '#42b883',
        ])
        ->assertRedirect();

    expect(Project::count())->toBe(1);
});

it('validates required fields', function () {
    actingAs($this->user)
        ->post(route('projects.store'), [])
        ->assertSessionHasErrors(['name', 'color']);
});
```

::: details Penjelasan Kode
- `use function Pest\Laravel\{...}` - import helper Pest untuk pendek (mirip facade, tetapi function). Menghindari `User::actingAs()->get(...)` panjang.
- `beforeEach` - hook Pest: closure di-run sebelum setiap `it(...)` dalam file. Membuat user sekali agar tidak duplikasi; lazimnya untuk setup common context.
- `actingAs($this->user)->get(route('projects.index'))` - melakukan GET ke URL `projects.index` sebagai user yang login. Pest chaining memungkinkan assertion lanjutan.
- `->assertInertia(fn ($page) => $page->component('Projects/Index')->has('projects.data'))` - Inertia testing helper. Closure menerima "page inspector" yang mengecek `component` (nama Vue file) dan keberadaan nested key (`projects.data`). Memverifikasi struktur props.
- `->assertRedirect()` - mengecek response 302 redirect (controller mengembalikan `redirect()->route(...)`).
- `expect(Project::count())->toBe(1)` - Pest expectation API: hitung jumlah record, pastikan 1. Lebih ekspresif dari `$this->assertEquals(1, Project::count())`.
- `->assertSessionHasErrors(['name', 'color'])` - setelah validation gagal, Laravel flash `errors` ke session. Assertion memastikan kedua field ada daftar error - berguna untuk test validation tanpa men-check pesan spesifik.
:::

## Test Authorization

```php
it('prevents non-owner from editing', function () {
    $intruder = User::factory()->create();
    $project = Project::factory()->for($this->user)->create();

    actingAs($intruder)
        ->put(route('projects.update', $project), ['name' => 'Hacked'])
        ->assertForbidden();
});

it('prevents non-owner from deleting', function () {
    $intruder = User::factory()->create();
    $project = Project::factory()->for($this->user)->create();

    actingAs($intruder)
        ->delete(route('projects.destroy', $project))
        ->assertForbidden();
});

it('allows owner to edit', function () {
    $project = Project::factory()->for($this->user)->create();

    actingAs($this->user)
        ->put(route('projects.update', $project), ['name' => 'Updated'])
        ->assertRedirect();
});
```

::: details Penjelasan Kode
- `Project::factory()->for($this->user)->create()` - factory chaining: `for()` menyetting relasi `belongsTo` (`user_id`), lalu `create()` menyimpan ke DB. Sintaks factory modern Laravel 8+.
- `->assertForbidden()` - response 403 Forbidden. Otomatis di-trigger saat `$this->authorize()` gagal di controller. Memverifikasi Policy bekerja (project owner restriction).
- Test negative + positive: tidak cukup cek `assertForbidden` untuk intruder; juga perlu cek owner bisa (`assertRedirect` = update sukses). Memastikan policy tidak terlalu ketat (false positive block legitimate user).
:::

## Test Task

```php
it('creates task in project', function () {
    $project = Project::factory()->for($this->user)->create();

    actingAs($this->user)
        ->post(route('projects.tasks.store', $project), [
            'title'    => 'Task 1',
            'status'   => 'todo',
            'priority' => 'medium',
        ])
        ->assertRedirect();

    expect($project->tasks()->count())->toBe(1);
});

it('validates status enum', function () {
    $project = Project::factory()->for($this->user)->create();

    actingAs($this->user)
        ->post(route('projects.tasks.store', $project), [
            'title'    => 'X',
            'status'   => 'invalid_status',
            'priority' => 'medium',
        ])
        ->assertSessionHasErrors(['status']);
});
```

::: details Penjelasan Kode
- `route('projects.tasks.store', $project)` - route nested resource butuh project ID. Ziggy-style convention: cukup kirim instance model, Laravel ambil ID-nya via route binding.
- `'status' => 'invalid_status'` - deliberately invalid value; `assertSessionHasErrors(['status'])` verifies `in:todo,in_progress,done` validator triggered.
- `expect($project->tasks()->count())->toBe(1)` - query via relasi untuk cek bahwa task benar-benar disimpan ke project tersebut.
:::

## Test Comment

```php
it('adds comment to task', function () {
    $project = Project::factory()->for($this->user)->create();
    $task = Task::factory()->for($project)->create();

    actingAs($this->user)
        ->post(route('comments.store', $task), ['body' => 'Test comment'])
        ->assertRedirect();

    expect($task->comments()->count())->toBe(1);
});

it('only owner can delete comment', function () {
    $intruder = User::factory()->create();
    $comment = Comment::factory()->create();

    actingAs($intruder)
        ->delete(route('comments.destroy', $comment))
        ->assertForbidden();
});
```

::: details Penjelasan Kode
- `Task::factory()->for($project)->create()` - factory nested relationship. Berguna untuk setup task yang valid dalam project tertentu.
- `Comment::factory()->create()` - factory tanpa `for` bila ada factory untuk relasi default di defnition - baik untuk test isolation simple tanpa specific parent.
- `assertForbidden()` - memverifikasi CommentPolicy::delete (hanya pemilik comment yang boleh). Intruder dengan user_id berbeda dari comment.user_id harus mendapat 403.
:::

## Test Upload Lampiran

```php
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('uploads attachment', function () {
    Storage::fake('public');
    $project = Project::factory()->for($this->user)->create();
    $task = Task::factory()->for($project)->create();

    actingAs($this->user)
        ->post(
            route('projects.tasks.attachments.store', [$project, $task]),
            ['file' => UploadedFile::fake()->create('doc.pdf', 1024, 'application/pdf')]
        )
        ->assertRedirect();

    Storage::disk('public')->assertExists('attachments/' . /* filename */);
});

it('rejects oversized file', function () {
    Storage::fake('public');
    // ... file 10MB > limit 5MB
    // assertSessionHasErrors(['file'])
});
```

::: details Penjelasan Kode
- `Storage::fake('public')` - mengganti disk `public` dengan filesystem fake in-memory. File diunggah ke temp temporary; tidak mengganggu storage asli. Setiap test jadi isolated & cepat.
- `UploadedFile::fake()->create('doc.pdf', 1024, 'application/pdf')` - membuat objek `UploadedFile` test (bukan file asli) berukuran 1024 KB. Berguna untuk test size validation - ubah `1024` ke `10240` untuk test file > 5MB.
- `Storage::disk('public')->assertExists('attachments/' ...)` - memverifikasi file benar-benar tersimpan di disk fake. Idealnya path diketahui pasti (mis. capture ke variabel); placeholder `/* filename */` di atas menunjukkan ini perlu di-fix untuk test reliable.
- Pattern upload test umum: fake storage -> make request with fake file -> assert stored. Tidak perlu cleanup test directory.
:::

## Test Member Manager

```php
it('owner can invite member by email', function () {
    $project = Project::factory()->for($this->user)->create();
    $member = User::factory()->create();

    actingAs($this->user)
        ->post(route('projects.members.store', $project), [
            'email' => $member->email,
        ])
        ->assertRedirect();

    expect($project->members()->count())->toBe(2); // owner + 1 member
});

it('non-owner cannot invite', function () {
    $intruder = User::factory()->create();
    $project = Project::factory()->for($this->user)->create();

    actingAs($intruder)
        ->post(route('projects.members.store', $project), [
            'email' => $this->user->email,
        ])
        ->assertForbidden();
});
```

::: details Penjelasan Kode
- `expect($project->members()->count())->toBe(2)` - anggota project = 2 karena saat project dibuat, controller `store` otomatis `attach(owner)`. Kemudian invite menambah 1 -> total 2. Bergantung pada fixture (di sini factory tidak auto-attach, hanya if controller dipanggil; perlu verifikasi count vs setup).
- `assertForbidden()` - Policy `update` di project gagal untuk intruder (bukan owner); 403 auto-throw.
:::

## Test Dashboard

```php
it('shows stats on dashboard', function () {
    actingAs($this->user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($p) => $p
            ->component('Dashboard')
            ->has('stats.total_projects')
            ->has('stats.total_tasks')
            ->has('stats.tasks_done')
        );
});
```

::: details Penjelasan Kode
- `->has('stats.total_projects')` - dotted notation untuk mengecek nested key. `stats` harus ada, dan `stats.total_projects` juga harus ada - assertion sekaligus level & sub-key.
- Berguna untuk test contract API: jika controller mengganti nama prop `stats` ke `statistics`, test ini langsung gagal - mencegah silent change.
:::

## Test Auth Flow

```php
it('guest redirected from dashboard', function () {
    get(route('dashboard'))->assertRedirect(route('login'));
});

it('logs in valid user', function () {
    $user = User::factory()->create(['password' => bcrypt('secret')]);

    post(route('login'), [
        'email'    => $user->email,
        'password' => 'secret',
    ])->assertRedirect(route('dashboard'));

    expect(auth()->user())->id->toBe($user->id);
});
```

::: details Penjelasan Kode
- `get(route('dashboard'))->assertRedirect(route('login'))` - test middleware `auth`: tanpa login, response redirect ke route `login`. Catatan: middleware `auth` default mengarahkan ke `login` route - dipastikan oleh assertion.
- `User::factory()->create(['password' => bcrypt('secret')])` - override default password factory menjadi `'secret'` yang sudah bcrypt. Factory default mungkin pakai random password, jadi eksplisit.
- `expect(auth()->user())->id->toBe($user->id)` - Pest chained assertion: ambil user login via `auth()->user()`, akses attr `id` (Pest mendukung property-chain lewat `->id`), toBe nilai user id. Memverifikasi session login berhasil.
:::

## Jalankan Test

```bash
# PHPUnit
php artisan test

# Atau Pest langsung
./vendor/bin/pest

# Dengan coverage
./vendor/bin/pest --coverage
```

## Frontend Unit Test (Vitest)

Untuk test composable atau komponen UI:

```js
import { test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/Components/UI/Button.vue'

test('renders slot content', () => {
  const wrapper = mount(Button, { slots: { default: 'Click me' } })
  expect(wrapper.text()).toContain('Click me')
})
```

::: details Penjelasan Kode
- `mount(Button, { slots: { default: 'Click me' } })` - mount penuh komponen dengan opsi seperti slot. Mount render lebih deep (child juga dirender); lebih lambat tapi lebih realistis. Alternatif `shallowMount` stub child untuk isolasi.
- `wrapper.text()` - hasil text content dari root element - ekstrak semua teks yang dirender termasuk slot.
- `expect(...).toContain(...)` - matcher Vitest (Jest-compatible API) untuk substring check.
- Untuk komponen yang pakai Inertia `usePage`/`route`, perlu mock global atau provide via `global.mocks` / `global.plugins` agar komponen bisa jalan di environment Vitest.
:::

## Selanjutnya

Testing selesai. Lanjut ke [24.15 - Build & Deploy](/bagian-6/bab-24/24-15-build-deploy).
