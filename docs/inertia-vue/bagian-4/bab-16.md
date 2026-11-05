---
title: Bab 16 — Authorization — Gate & Policy di Sisi Vue
---

# Bab 16: Authorization — Gate & Policy di Sisi Vue

:::info Bagian IV — Fitur Lanjutan Inertia
Frontend authorization = pengalaman pengguna (UX), bukan keamanan. Server tetap jadi sumber kebenaran.
:::

## 16.1 Authorization Tetap di Server

:::danger Aturan emas
Jangan pernah percaya apa yang disembunyikan di frontend. **Tombol yang di-hidden di Vue bukan keamanan.**
:::

Gate, Policy, `authorize()` di controller — semuanya tetap di Laravel:

```php
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post); // throws 403 jika gagal

    $post->update($request->validated());
    return redirect()->route('posts.show', $post);
}

public function destroy(Post $post)
{
    $this->authorize('delete', $post);
    $post->delete();
    return redirect()->route('posts.index');
}
```

::: details Penjelasan Kode
- `$this->authorize('update', $post)` — helper controller dari trait `AuthorizesRequests`. Pertama argument = nama ability (cocokkan dengan method Policy), kedua = instance yang akan jadi argumen Policy `update(User $user, Post $post)`.
- Bila Policy mengembalikan `false`, Laravel lempar `AuthorizationException` → di-convert ke HTTP 403. Controller tidak lanjut ke `update`.
- `$this->authorize('delete', $post)` — pola sama, ability terpisah. Pisahkan update/delete agar bisa memiliki rule berbeda (mis. owner bisa edit, hanya admin bisa hapus).
- Pemanggilan sebelum mutasi adalah praktek defence in depth: walau tombhidden di UI, panggilan API langsung tetap ditolak.
:::

Policy contoh:

```php
class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->isAdmin();
    }

    public function delete(User $user, Post $post): bool
    {
        return $this->update($user, $post);
    }
}
```

::: details Penjelasan Kode
- `class PostPolicy` — konvensi Laravel: nama model + `Policy`. Laravel 11 auto-discovery: tidak perlu daftar manual (`Gate::policy(Post::class, PostPolicy::class)` sudah default).
- Signature `update(User $user, Post $post): bool` — Laravel otomatis inject user login sebagai argumen pertama, instance post (yang di-pass ke `authorize`) sebagai kedua. Jangan salah urutan.
- `$user->id === $post->user_id` — hanya pemilik. Hindari `$user->id == $post->user_id` (loose compare) untuk hindari type juggling bug.
- `|| $user->isAdmin()` — admin override. Helper method di model User mengembalikan boolean.
- `$this->update($user, $post)` di method `delete` — reuse rule agar DRY. Hindari duplikasi kondisi; jika policy delete lebih ketat di masa depan, ubah di satu tempat.
:::

Daftar di `AuthServiceProvider` (Laravel 11 sudah auto-discovered di `app/Policies`).

## 16.2 Kirim Permissions ke Vue

Pola yang aman: kirim **hasil** evaluasi `can`, bukan list permission mentah. Server sudah menghitung user vs resource.

```php
public function show(Post $post)
{
    return Inertia::render('Posts/Show', [
        'post' => $post,
        'can' => [
            'update' => $request->user()->can('update', $post),
            'delete' => $request->user()->can('delete', $post),
        ],
    ]);
}
```

::: details Penjelasan Kode
- `'can' => [...]` — kirim key `can` ke props Vue, berisi peta ability → boolean. Vue tidak perlu tahu rule logic, hanya hasilnya.
- `$request->user()->can('update', $post)` — cek via Policy (atau Gate). Sama logikanya dengan `$this->authorize('update', $post)` tapi tidak lempar exception, hanya return bool.
- Penting dibanding dengan mengirim Gate mentah: jika kirim `$user->roles`, rule bisa terbuka untuk inspect dan user bisa memanipulasi via DevTools. Boolean sudah final.
- Per-instance: `can.update` bergantung pada `$post` yang sedang dirender. Untuk list/index yang tidak punya instance tunggal, lihat §16.8.
:::

Atau via shared data untuk akses global:

```php
// HandleInertiaRequests::share()
'can' => function () use ($request) {
    $user = $request->user();
    if (! $user) return [];

    return [
        'create_post' => $user->can('create', Post::class),
        'admin_access' => $user->can('accessAdmin', Admin::class),
    ];
},
```

::: details Penjelasan Kode
- Closure `function () use ($request)` — bahasa PHP: capture `$request` ke closure scope. Pakai `function` (bukan `fn`) untuk multiple statement.
- `if (! $user) return [];` — early return untuk tamu agar tidak eksekusi `can()` pada null user.
- Ability tanpa instance (`create`, `accessAdmin`) — policy method signature hanya `create(User $user)`, tanpa argumen model. Cocok untuk gate global cek "apakah boleh ke resource index/create".
- Kirim subset yang akan benar-benar dipakai di layout (sidebar, navbar). Tidak perlu semua ability.
:::

:::tip Hindari kirim Gate mentah
`Gate::all()` bocor semua ability ke frontend. Pre-filter ke yang relevan saja.
:::

## 16.3 Pakai di Vue — Untuk Tampilan Saja

```vue
<script setup>
defineProps({
  post: Object,
  can: Object,
})
</script>

<template>
  <h1>{{ post.title }}</h1>
  <p>{{ post.body }}</p>

  <div class="mt-4 flex gap-2">
    <button v-if="can.update" @click="edit">Edit</button>
    <button v-if="can.delete" @click="confirmDelete" class="text-red-600">Hapus</button>
  </div>
</template>
```

::: details Penjelasan Kode
- `defineProps({ post: Object, can: Object })` — terima props dari controller. `can` adalah object peta ability seperti `{ update: true, delete: false }`.
- `v-if="can.update"` — tombol edit hanya tampil jika user punya ability. **Ini hanya UX, bukan security** — user masih bisa curl `/posts/{id}` langsung untuk update. Server tetap `$this->authorize('update', ...)`.
- Pisahkan `edit`/`confirmDelete` handler di `&lt;script setup>` (tidak ditampilkan untuk singkatnya).
:::

Tombol hanya tampil jika user boleh. Tapi endpoint update/delete **tetap** diproteksi oleh Policy di server.

## 16.4 Konsep "UX Layer" vs "Security Layer"

| Lapisan | Tanggung jawab |
| --- | --- |
| **UX (Vue)** | Tunjukkan/sembunyikan elemen agar user tidak frustrasi klik tombol yang ditolak |
| **Security (Laravel)** | Validate intent — server tolak aksi dengan 403/404 jika tidak diizinkan |

Pesan error 403 (lihat [Bab 17](/bagian-4/bab-17)) harus tetap user-friendly.

## 16.5 Pola `can` Helper di Vue

Buat composable untuk akses, abstrak dari `page.props`:

```js
// composables/useCan.js
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

export function useCan() {
  const page = usePage()

  const can = computed(() => page.props.can ?? {})

  return {
    can: (ability) => can.value[ability] ?? false,
    canUpdate: (resourceKey) => can.value[`update_${resourceKey}`] ?? false,
    canDelete: (resourceKey) => can.value[`delete_${resourceKey}`] ?? false,
    isAdmin: computed(() => can.value.admin_access === true),
  }
}
```

::: details Penjelasan Kode
- `const can = computed(() => page.props.can ?? {})` — reaktif reference ke peta ability. `?? {}` mencegah undefined bila `can` belum di-share.
- `can: (ability) => can.value[ability] ?? false` — metod helper. Selalu default `false` jika ability tidak ada, sehingga tombol tetap aman ter-hide meski prop belum lengkap.
- `canUpdate: (resourceKey) => can.value[`update_${resourceKey}`] ?? false` — dapat ability dengan key dimanis (`update_post`, `update_comment`). Cocok bila pakai naming konsisten multi-resource.
- `isAdmin: computed(() => can.value.admin_access === true)` — `computed` agar reaktif; `=== true` strict comparison (mencegah truthy `"1"` lolos).
- Composable ini pure UX tools. Tidak boleh jadi satu-satunya proteksi — server policy tetap wajib.
:::

Pakai:

```vue
<script setup>
import { useCan } from '@/composables/useCan'
const { can } = useCan()
</script>

<template>
  <button v-if="can('create_post')">+ Tambah Post</button>
</template>
```

## 16.6 Helper Global Ziggy + Can

Snir komponent:

```vue
<script setup>
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import { useCan } from '@/composables/useCan'

const { can } = useCan()

defineProps({ post: Object })
</script>

<template>
  <div class="space-x-2">
    <Link v-if="can('create_post')" :href="route('posts.create')">+ Tambah</Link>
    <Link :href="route('posts.show', post.id)">Lihat</Link>
    <Link v-if="can('update_post')" :href="route('posts.edit', post.id)">Edit</Link>
    <Link
      v-if="can('delete_post')"
      :href="route('posts.destroy', post.id)"
      method="delete"
      as="button"
    >
      Hapus
    </Link>
  </div>
</template>
```

::: details Penjelasan Kode
- `method="delete" as="button"` — `&lt;Link>` Inertia yang melakukan DELETE request. Wajib `as="button"` semantic karena bukan navigasi GET; render sebagai `&lt;button type="button">`.
- Iterasi di template mengikuti naming `update_post`/`delete_post` — sesuai helper `useCan` di §16.5. Konsistensi key di backend dan frontend wajib.
- Route `posts.destroy` butuh parameter `post.id` untuk route model binding.
:::

## 16.7 Pola: Kirim Permissions Named

Struktur bagus: `can.update_post` vs `can.update` (kurang spesifik):

```php
// Resource helper
'can' => $this->buildAbilities($post, 'post'),

protected function buildAbilities($model, $prefix): array {
    $user = request()->user();
    return [
        "{$prefix}_view"   => $user->can('view', $model),
        "{$prefix}_update" => $user->can('update', $model),
        "{$prefix}_delete" => $user->can('delete', $model),
    ];
}
```

::: details Penjelasan Kode
- `"{$prefix}_view"` — string interpolation PHP untuk naming konsisten (`post_view`, `comment_view`, …). Berguna saat page memiliki beberapa resource sekaligus agar tidak konflik key `can.view`.
- Method `buildAbilities` reusable lewat argumen `$prefix`. Taruh di controller atau trait. Hindari duplikasi isinya untuk setiap page.
- `$user = request()->user()` — helper global sama dengan injek `Request` untuk kompatibilitas. Dapat `null` saat tamu.
:::

## 16.8 Resource-Level Permissions untuk Index

Untuk index page, kamu tidak punya instance model spesifik. Pre-evaluate untuk class:

```php
'can' => [
    'create_post' => $request->user()->can('create', Post::class),
],
```

Per-item:

```php
'posts' => PostResource::collection($posts->each(fn ($p) =>
    $p->setAttribute('can_update', $request->user()->can('update', $p))
)),
```

::: details Penjelasan Kode
- `$posts->each(fn ($p) => $p->setAttribute('can_update', ...))` — pakai `each` pada paginator collection untuk menambahkan virtual attribute tiap model. `setAttribute` men-set attribute dynamic (tidak di kolom DB) yang akan ikut ke JSON Resource.
- `$user->can('update', $p)` — N+1 calls pada Policy cache: Laravel cache hasil per user+model, jadi tidak menghitung ulang.
- Pendekatan ini efisien bila jumlah item per halaman kecil (mis. 10—20). Untuk lebih besar, gunakan query batch (load semua owner_ids, compare dengan user id).
:::

Lalu di Resource:

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'can_update' => $this->can_update ?? false,
        'can_delete' => $this->can_delete ?? false,
    ];
}
```

::: details Penjelasan Kode
- `'can_update' => $this->can_update ?? false` — bila attribute tidak di-set (mis. resource dipakai tanpa pre-evaluasi), default false. Aman di sisi UX (tombol tetap ter-hide).
- Resource tetap mengembalikan field ability sebagai boolean, berdampingan dengan field data model. Frontend tidak perlu tahu rule.
:::

## 16.9 Test Akses

```php
public function test_non_owner_cannot_edit_post()
{
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->get(route('posts.edit', $post))
        ->assertForbidden();

    $this->actingAs($intruder)
        ->put(route('posts.update', $post), ['title' => 'X'])
        ->assertForbidden();
}
```

::: details Penjelasan Kode
- `User::factory()->create()` — buat user acak dengan atribut default (lihat `UserFactory`).
- `Post::factory()->for($owner)->create()` — `->for($owner)` set relasi `user_id` ke owner; factory tahu bahwa `Post` belongs to `User`.
- `$this->actingAs($intruder)` — login sebagai intruder untuk request berikutnya.
- `->get(route('posts.edit', $post))->assertForbidden()` — expect HTTP 403 dari policy saat buka halaman edit.
- `->put(route('posts.update', $post), ['title' => 'X'])->assertForbidden()` — test submit update juga ditolak.
- Test ini wajib untuk keamanan server side, tidak peduli apakah tombol ter-hide di Vue — tombol bisa dipanggil manual.
:::

Detail testing di [Bab 22](/bagian-5/bab-22).

## 16.10 Anti-Pattern yang Sering Terjadi

:::warning Hindari
- Mengirim list Gate mentah (`Gate::abilities()`) ke frontend.
- Membuat keputusan keamanan di Vue (`if (user.role === 'admin')`).
- Mengandalkan visibility button untuk proteksi — tombol yang dihidden bisa dipanggil via DevTools.
:::

Lakukan:

- Pre-filter di server, kirim hasil boolean.
- Pre-evaluate per-resource di Resource collection.
- Komponen can helper sebagai UX, bukan security.

## 16.11 Ringkasan Bab

- Authorization tetap di Laravel via Gate/Policy.
- Kirim `can.update` / `can.delete` per resource sebagai boolean.
- Buat composable `useCan()` untuk abstraksi.
- Tidak ada Gate mentah yang dikirim ke frontend.
- Policy di controller + `authorize()` + middleware role adalah security.
- UX (hidden button) ≠  security.

:::tip Selanjutnya
[Bab 17](/bagian-4/bab-17): middleware role + bagaimana Inertia render halaman error 403/404/500.
:::
