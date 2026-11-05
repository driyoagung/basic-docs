---
title: 24.9 - Komentar pada Task
---

# 24.9 Komentar pada Task

:::info Langkah 9 dari 15
User bisa berkomentar di task. Hanya pemilik komentar yang bisa hapus.
:::

## Routes

```php
Route::post('tasks/{task}/comments', [CommentController::class, 'store'])
    ->name('comments.store');

Route::delete('comments/{comment}', [CommentController::class, 'destroy'])
    ->name('comments.destroy');
```

## Controller - CommentController

```php
class CommentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $this->authorize('view', $task);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:500'],
        ]);

        $task->comments()->create($validated + ['user_id' => $request->user()->id]);

        return redirect()->back()->with('success', 'Komentar ditambahkan');
    }

    public function destroy(Request $request, Comment $comment)
    {
        $this->authorize('delete', $comment);
        $comment->delete();

        return redirect()->back()->with('success', 'Komentar dihapus');
    }
}
```

::: details Penjelasan Kode
- `store`: `$this->authorize('view', $task)` - hanya yang boleh melihat task yang boleh komentar. Lebih longgar daripada `update` - anggota project bisa komentar walaupun tidak bisa edit task.
- `'body' => ['required', 'string', 'max:500']` - batas 500 karakter agar UI tetap ringkas dan mencegah spam/penyalahgunaan.
- `$task->comments()->create($validated + ['user_id' => $request->user()->id])` - simpan via relasi (auto `task_id`), merge `user_id` creator dari server. Tidak percaya input user untuk `user_id` - keamanan dasar.
- `destroy`: `$this->authorize('delete', $comment)` - hanya pemilik komentar yang bisa hapus (lihat CommentPolicy).
:::

## Policy - CommentPolicy

```php
class CommentPolicy
{
    public function delete(User $user, Comment $comment): bool
    {
        return $comment->user_id === $user->id;
    }
}
```

::: details Penjelasan Kode
- Hanya user yang membuat komentar (`comment->user_id`) yang boleh hapus. Berbeda dengan task policy yang mengizinkan owner project - komentar bersifat personal.
- Tidak ada method `update` karena komentar tidak bisa di-edit (sesuai banyaknya chat app / forum sederhana).
:::

## Resource - CommentResource

```php
class CommentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'body'       => $this->body,
            'created_at' => $this->created_at->diffForHumans(),
            'user'       => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ],
            'can_delete' => $request->user()->can('delete', $this),
        ];
    }
}
```

::: details Penjelasan Kode
- `$this->created_at->diffForHumans()` - Carbon method menghasilkan teks relatif seperti "2 minutes ago" / "5 minutes ago". Lebih ramah daripada timestamp mentah untuk UI komentar.
- `'user' => ['id' => ..., 'name' => ...]` -_packing_ manual hanya field yang dibutuhkan frontend. Tapi perhatikan: jika `$this->user` null, akan error. Untuk keamanan, gunakan `whenLoaded('user', ...)` atau pastikan eager load di controller.
- `'can_delete' => $request->user()->can('delete', $this)` - menghitung otorisasi di server sekali, kirim boolean ke frontend. Frontend tinggal `v-if="c.can_delete"` untuk sembunyikan tombol hapus.
:::

:::tip Eager load relasi
Di controller `show` project, sertakan comments via eager loading:
```php
$project->load(['tasks.comments.user']);
```
Ini menghindari N+1 query saat render daftar komentar.
:::

## Vue - Form Komentar di TaskModal

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const props = defineProps({ task: Object })

const form = useForm({ body: '' })

function post() {
  form.post(route('comments.store', props.task.id), {
    preserveScroll: true,
    onSuccess: () => form.reset(),
  })
}
</script>

<template>
  <div class="space-y-3 mt-4 pt-4 border-t">
    <h3 class="font-semibold">Komentar</h3>

    <!-- Daftar komentar -->
    <div
      v-for="c in task.comments"
      :key="c.id"
      class="bg-gray-50 rounded p-3"
    >
      <div class="flex justify-between text-xs text-gray-500">
        <span>{{ c.user.name }}</span>
        <span>{{ c.created_at }}</span>
      </div>

      <p class="text-sm mt-1">{{ c.body }}</p>

      <Link
        v-if="c.can_delete"
        :href="route('comments.destroy', c.id)"
        method="delete"
        as="button"
        class="text-red-600 text-xs mt-1 inline-block"
        preserve-scroll
      >
        Hapus
      </Link>
    </div>

    <!-- Form tambah komentar -->
    <form @submit.prevent="post" class="flex gap-2">
      <input
        v-model="form.body"
        placeholder="Tulis komentar..."
        class="input flex-1"
      />
      <button
        type="submit"
        :disabled="form.processing || !form.body"
        class="btn-primary"
      >
        Kirim
      </button>
    </form>
    <span v-if="form.errors.body" class="text-red-600 text-sm">
      {{ form.errors.body }}
    </span>
  </div>
</template>
```

::: details Penjelasan Kode
- `useForm({ body: '' })` - form satu field untuk komentar. State awal string kosong.
- `v-for="c in task.comments"` - iterate komentar dari prop task. Pastikan controller eager load `comments` dan `comments.user` agar tidak N+1 saat akses `c.user.name`.
- `v-if="c.can_delete"` - boolean dari resource mengontrol tombol hapus. Frontend tidak perlu tahu logika otorisasi; cukup percaya flag server.
- `:disabled="form.processing || !form.body"` - disable submit saat request berjalan ATAU body kosong. Mencegah submit kosong dan double-submit.
- `preserveScroll: true` - krusial untuk chat-like UI: setelah submit, user harus tetap melihat komentar barunya di akhir list, bukan di-scroll ke atas.
- `onSuccess: () => form.reset()` - kosongkan input setelah sukses, siap untuk komentar berikutnya.
- `:href="route('comments.destroy', c.id)"` - Link delete dengan method delete; tidak ada form parent yang diperlukan.
:::

## Mentions (Optional)

Untuk fitur `@username` di komentar:

```js
import { ref, watch } from 'vue'

const body = ref('')

watch(body, (val) => {
  const mentions = val.match(/@(\w+)/g) ?? []
  // Untuk notifikasi: kirim mentions ke server
})
```

::: details Penjelasan Kode
- `watch(body, callback)` - menjalankan callback setiap kali `body` berubah. Side effect reaktif tanpa event listener manual.
- `val.match(/@(\w+)/g)` - regex global mencari semua pola `@` diikuti karakter word (huruf/angka/underscore). `g` flag = find all, return array (atau `null` jika tidak ada - perlu `?? []`).
- `\w` - character class untuk `[A-Za-z0-9_]`. Cocok untuk username sederhana (tidak menerima titik/dash).
- Sebagai placeholder - di produksi, kirim array ke server via API terpisah atau pasang event listener untuk tampilkan dropdown suggestion.
:::

Backend parsing mention saat store:

```php
preg_match_all('/@(\w+)/', $validated['body'], $matches);
$usernames = $matches[1];
$users = User::whereIn('name', $usernames)->get();

// Notify users...
```

::: details Penjelasan Kode
- `preg_match_all('/@(\w+)/', $body, $matches)` - regex PHP untuk tangkap semua mention. Group tangkap `(\w+)` akan ada di `$matches[1]` (array username tanpa `@`). `$matches[0]` berisi full match termasuk `@`.
- `User::whereIn('name', $usernames)->get()` - satu query untuk cari semua user sekaligus (lebih efisien dari looping `where('name', ...)`). Inilah cara mengubah mentions jadi objek User.
- Setelah itu kirim notifikasi (mis. via `Notification::send($users, new Mentioned($comment))`), broadcast event Reverb, atau email. Detail tergantung implementasi.
:::

## Selanjutnya

Komentar siap. Lanjut ke [24.10 - Dashboard & Statistik](/bagian-6/bab-24/24-10-dashboard-statistik).