---
title: 24.11 - Manajemen Anggota Project
---

# 24.11 Manajemen Anggota Project

:::info Langkah 11 dari 15
Owner project bisa invite user lain lewat email, atur role, dan hapus anggota.
:::

## Routes

```php
Route::post('projects/{project}/members', [ProjectMemberController::class, 'store'])
    ->name('projects.members.store');

Route::delete('projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy'])
    ->name('projects.members.destroy');
```

## Controller - ProjectMemberController

```php
class ProjectMemberController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'role'  => ['in:member,owner'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        $project->members()->syncWithoutDetaching([
            $user->id => ['role' => $validated['role'] ?? 'member'],
        ]);

        return redirect()
            ->back()
            ->with('success', "{$user->name} ditambahkan");
    }

    public function destroy(Project $project, User $user)
    {
        $this->authorize('update', $project);

        // Jangan sampai owner terhapus
        if ($project->user_id === $user->id) {
            return redirect()->back()->with('error', 'Owner tidak bisa dihapus.');
        }

        $project->members()->detach($user);

        return redirect()->back()->with('success', 'Anggota dihapus');
    }
}
```

::: details Penjelasan Kode
- `store`: `$this->authorize('update', $project)` - hanya owner project yang bisa invite anggota. Anggota tidak bisa invite anggota lain - kontrol terpusat.
- `'email' => ['required', 'email', 'exists:users,email']` - validasi email wajib ada di DB (user harus sudah terdaftar di sistem). Mencegah invite orang asing yang belum punya akun - bedaangling philosophy dari registrasi-explicit invite.
- `User::where('email', $validated['email'])->first()` - konversi email ke instance User untuk dapat `id`. Validasi `exists` sudah pasti lolos, jadi `first()` tidak null.
- `syncWithoutDetaching([$user->id => ['role' => ...]])` - kunci dari pola ini: insert ke pivot jika belum ada, dan update role jika sudah ada. Dibanding `attach()`, `syncWithoutDetaching` tidak akan menghapus anggota lain - hanya menyinkronkan user ini.
- Format array `[$userId => ['role' => ...]]` - kunci adalah user_id (FK ke pivot), value adalah array kolom pivot tambahan. Laravel tahu ini many-to-many dari relasi.
- `destroy`: `$this->authorize('update', $project)` - hanya owner yang bisa hapus anggota.
- Guard `if ($project->user_id === $user->id)` - mencegah owner menghapus dirinya sendiri sebagai anggota (yang akan menghapus kepemilikan project). Penting karena cascade bisa menghapus project atau membuatnya orphan.
- `$project->members()->detach($user)` - hapus baris di pivot untuk user ini. Tidak menghapus user itu sendiri, hanya keanggotaannya.
:::

:::warning Cek owner
Pastikan owner project tidak bisa dihapus dari anggota - ini akan menyebabkan project tanpa owner.
:::

## Vue - Components/Projects/MemberManager.vue

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const props = defineProps({ project: Object })

const form = useForm({ email: '', role: 'member' })

function invite() {
  form.post(route('projects.members.store', props.project.id), {
    preserveScroll: true,
    onSuccess: () => form.reset(),
  })
}
</script>

<template>
  <div class="mt-6 pt-4 border-t">
    <h3 class="font-semibold mb-3">Anggota Project</h3>

    <!-- Form invite -->
    <form @submit.prevent="invite" class="flex gap-2 mb-4">
      <input
        v-model="form.email"
        type="email"
        placeholder="email@user.com"
        class="input flex-1"
      />
      <select v-model="form.role" class="input">
        <option value="member">Member</option>
        <option value="owner">Co-Owner</option>
      </select>
      <button type="submit" class="btn-primary" :disabled="form.processing">
        Invite
      </button>
    </form>
    <span v-if="form.errors.email" class="text-red-600 text-sm">
      {{ form.errors.email }}
    </span>

    <!-- Daftar anggota -->
    <ul class="space-y-2">
      <li
        v-for="m in project.members"
        :key="m.id"
        class="flex justify-between items-center bg-white rounded px-3 py-2"
      >
        <div>
          <span class="font-medium">{{ m.name }}</span>
          <span class="ml-2 text-xs text-gray-500">{{ m.pivot.role }}</span>
        </div>

        <Link
          v-if="m.pivot.role !== 'owner' && project.user_id !== m.id"
          :href="route('projects.members.destroy', [project.id, m.id])"
          method="delete"
          as="button"
          class="text-red-600 text-sm"
          preserve-scroll
        >
          Hapus
        </Link>
      </li>
    </ul>
  </div>
</template>
```

::: details Penjelasan Kode
- `useForm({ email: '', role: 'member' })` - state form invite. Default role `'member'` agar tidak iseng set sebagai owner.
- `v-for="m in project.members"` - iterate anggota dari prop `project.members`. Pastikan `members` di-eager load di controller (lihat section berikutnya).
- `m.pivot.role` - pivot data di-include di `ProjectResource` via `withPivot('role')` di model. Setiap anggota punya `pivot` object yang berisi kolom pivot tambahan.
- `v-if="m.pivot.role !== 'owner' && project.user_id !== m.id"` - menyembunyikan tombol hapus untuk owner project (`project.user_id`) dan untuk anggota dengan role `'owner'` (co-owner). Memproteksi penghapusan kritis.
- `route('projects.members.destroy', [project.id, m.id])` - route nested memerlukan 2 ID (project + user). Loop anggota menggunakan `m.id` (id User) bukan id pivot - sesuai route binding `User $user`.
- `preserve-scroll` - menjaga scroll position saat daftar anggota berubah, agar ux tidak menyebalkan (lama-invite -> scroll reset melompat ke atas).
:::

## Pakai MemberManager di Projects/Show.vue

```vue
<script setup>
import MemberManager from '@/Components/Projects/MemberManager.vue'

defineProps({ project: Object, tasks: Object })
</script>

<template>
  <div class="grid grid-cols-3 gap-6">
    <!-- Kolom kiri: tasks -->
    <div class="col-span-2">
      <h1 class="text-2xl font-bold">{{ project.name }}</h1>
      <!-- task list -->
    </div>

    <!-- Kolom kanan: anggota -->
    <div>
      <MemberManager :project="project" />
    </div>
  </div>
</template>
```

::: details Penjelasan Kode
- `grid-cols-3 gap-6` - layout 3 kolom. Kolom kiri `col-span-2` mengisi 2/3 lebar (kiri untuk tasks), kolom kanan untuk anggota.
- `&lt;MemberManager :project="project" />` - komposisi komponen; parent pass `project` sebagai prop. Komponen akan mengakses `project.members` dan `project.user_id`.
- Pattern ini memisahkan logika anggota dari halaman utama -> mudah untuk reuse atau refactor.
:::

## Pastikan `members` di-load di Controller

```php
public function show(Request $request, Project $project)
{
    $this->authorize('view', $project);

    $project->load(['members', 'tasks' => function ($q) use ($request) {
        $q->when($request->status, fn ($q, $v) => $q->where('status', $v));
    }]);

    return Inertia::render('Projects/Show', [
        'project' => ProjectResource::make($project),
        // ...
    ]);
}
```

::: details Penjelasan Kode
- `$project->load(['members', 'tasks' => ...])` - eager load 2 relasi sekaligus. Closure untuk `tasks` memungkinkan konstrains (filter status) saat load.
- Menggunakan `load` (post-query) vs `with` (di query awal) - berguna kalau kondisi filter datang dari request yang tidak ada saat awal query. Performa sama karena tetap eager load, bukan lazy load per akses.
- Penting bagi `MemberManager`: tanpa eager load, `project.members` di resource akan trigger `whenLoaded` false sehingga key `members` tidak ada di JSON. Pastikan resource punya `members` saat dibuat.
:::

## Sertakan `members` di ProjectResource

```php
class ProjectResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'color'       => $this->color,
            'user_id'     => $this->user_id,
            'members'     => $this->whenLoaded('members', fn () =>
                $this->members->map(fn ($u) => [
                    'id'    => $u->id,
                    'name'  => $u->name,
                    'email' => $u->email,
                    'pivot' => ['role' => $u->pivot->role],
                ])
            ),
            'tasks_count' => $this->whenCounted('tasks'),
        ];
    }
}
```

::: details Penjelasan Kode
- `$this->whenLoaded('members', fn () => ...)` - lazy closure hanya dieksekusi jika relasi `members` sudah di-eager load. Jika tidak, key `members` tidak ada di output - frontend tahu kapan harus minta load ulang.
- `$this->members->map(fn ($u) => [...])` - transform setiap anggota menjadi array custom. Hanya mengambil field yang dibutuhkan frontend -> payload kecil dan aman (mis. tidak ada `password`).
- `'pivot' => ['role' => $u->pivot->role]` - subset data pivot. Hanya `role` yang relevan untuk frontend; field lain (`created_at` pivot dst.) tidak perlu.
- `'tasks_count' => $this->whenCounted('tasks')` - menggunakan `whenCounted` (Laravel 9+) yang serupa `whenLoaded` tapi untuk aggregate count. Hanya muncul jika controller pakai `withCount('tasks')`. Misal di dashboard pakai, di `show` tidak - frontend tahu kapan ada angka.
:::

## Notifikasi Email (Optional)

Kirim email ke user yang di-invite:

```php
// di ProjectMemberController::store()
Mail::to($user)->send(new ProjectInvitationMail($project, $request->user()));

// app/Mail/ProjectInvitationMail.php
class ProjectInvitationMail extends Mailable
{
    public function envelope(): Envelope { /* ... */ }
    public function content(): Content { /* ... */ }
}
```

::: details Penjelasan Kode
- `Mail::to($user)->send(new ProjectInvitationMail($project, inviter))` - Laravel Mail facade. Mailable menerima dependency via constructor; secara konvensi public property otomatis tersedia di view Markdown/Blade.
- `Mailable` Laravel 9+ menggunakan metode `envelope()` (subjek, from, reply-to) dan `content()` (view, data). Lebih deklaratif dibanding lama. Isi email di-render dari Markdown template yang otomatis inline CSS.
- Untuk produksi, gunakan queue (implement `ShouldQueue` di Mailable class) agar request tidak blocking saat SMTP lambat.
:::

## Selanjutnya

Anggota project siap. Lanjut ke [24.12 - Filter, Search & Pagination](/bagian-6/bab-24/24-12-filter-search-pagination).
