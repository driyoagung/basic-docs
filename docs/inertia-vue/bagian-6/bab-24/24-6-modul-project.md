---
title: 24.6 - Modul Project (CRUD)
---

# 24.6 Modul Project (CRUD)

:::info Langkah 6 dari 15
Mem bangun CRUD project lengkap: route, controller, policy, resource, dan Vue pages.
:::

## Routes

```php
// routes/web.php
Route::resource('projects', ProjectController::class)->middleware(['auth']);
```

## Controller - ProjectController

```php
class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $projects = $request->user()
            ->projects()
            ->withCount('tasks')
            ->paginate(12);

        return Inertia::render('Projects/Index', [
            'projects' => ProjectResource::collection($projects),
        ]);
    }

    public function create()
    {
        return Inertia::render('Projects/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color'       => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6})/'],
        ]);

        $project = $request->user()->projects()->create($validated);
        $project->members()->attach($request->user(), ['role' => 'owner']);

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Project dibuat');
    }

    public function show(Request $request, Project $project)
    {
        $this->authorize('view', $project);

        $project->load(['members', 'tasks' => function ($q) use ($request) {
            $q->when($request->status, fn ($q, $v) => $q->where('status', $v));
        }]);

        return Inertia::render('Projects/Show', [
            'project' => ProjectResource::make($project),
            'tasks'   => TaskResource::collection($project->tasks),
            'filters' => $request->only(['status']),
        ]);
    }

    public function edit(Project $project)
    {
        $this->authorize('update', $project);
        return Inertia::render('Projects/Edit', ['project' => $project]);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color'       => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6})/'],
        ]);

        $project->update($validated);

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Project diperbarui');
    }

    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);
        $project->delete();

        return redirect()
            ->route('projects.index')
            ->with('success', 'Project dihapus');
    }
}
```

::: details Penjelasan Kode
- `index`: `$request->user()->projects()` - memakai relasi `hasMany` milik user yang login, sehingga hanya project miliknya yang diquery (oto. scoped by `user_id`).
- `->withCount('tasks')` - eager agregat `COUNT(*)` untuk setiap project (dianggap sebagai kolom virtual `tasks_count`). Menghindari pemanggilan `$project->tasks->count()` per baris (N+1).
- `->paginate(12)` - paginator Laravel; menghasilkan struktur dengan `data`, `links`, `meta` (current_page, total, dst). Angka 12 = items per page.
- `ProjectResource::collection($projects)` - membungkus paginator menjadi JSON yang aman dikirim ke Vue, struktur `data` dipertahankan dan `links/meta` tetap ada.
- `store`: `$request->user()->projects()->create($validated)` - menyimpan via relasi. Laravel otomatis mengisi `user_id` dengan ID user yang login (lebih aman daripada manual dari input).
- `$project->members()->attach($user, ['role' => 'owner'])` - insert ke pivot `project_user` dengan data tambahan `role = owner`. Jadi pembuat project otomatis jadi owner.
- `'regex:/^#([A-Fa-f0-9]{6})/'` - validasi format warna hex 6 digit (`#RRGGBB`).
- `show`: `$this->authorize('view', $project)` - mengeksekusi `ProjectPolicy::view`. Jika gagal, lempar `AuthorizationException` -> response 403.
- `$project->load([...])` - lazy eager load setelah model sudah ter-load. Berguna saat kita butuh relasi untuk halaman tertentu tapi tidak di awal query.
- `=> function ($q) use ($request) { ... }` - konstrains relasi: hanya load task yang cocok filter `status`. `$request->status` di-capture via `use` karena closure tidak punya akses ke scope luar.
- `$q->when($request->status, fn ($q, $v) => ...)` - hanya menerapkan `where` jika `$request->status` truthy. `$v` adalah nilai kondisi yang otomatis dilewatkan.
- `$request->only(['status'])` - mengambil hanya key `status` agar filter konsisten saat di-pass ke frontend (untuk re-render filter di UI).
- `update`: `'sometimes'` - aturan validasi yang hanya dijalankan jika field ada di request. Cocok untuk PATCH/PUT parsial.
- `destroy`: `$project->delete()` - soft/hard delete. Karena model tidak pakai `SoftDeletes`, ini benar-benar menghapus baris.
- `->with('success', '...')` - flash data sekali pakai ke session. Ditangkap Inertia via prop `flash.success` (lihat 24.4).
:::

## Policy - ProjectPolicy

```php
class ProjectPolicy
{
    public function view(User $user, Project $project): bool
    {
        return $project->user_id === $user->id
            || $project->members()->where('user_id', $user->id)->exists();
    }

    public function update(User $user, Project $project): bool
    {
        return $project->user_id === $user->id;
    }

    public function delete(User $user, Project $project): bool
    {
        return $project->user_id === $user->id;
    }
}
```

::: details Penjelasan Kode
- Policy - kelas khusus otorisasi per-model. Laravel auto-discover dari nama model (`Project` -> `ProjectPolicy`) di Laravel 10+.
- `view`: user boleh melihat jika adalah owner (`user_id` sama) ATAU terdaftar sebagai anggota. `->exists()` menghasilkan query `SELECT EXISTS (...)` - efisien, hanya cek ada/tidak tanpa fetch seluruh baris.
- `update`/`delete`: hanya owner (`user_id === user->id`) yang boleh. Member tidak boleh edit/hapus, walaupun bisa melihat.
- Method return `bool` - true maka authorize lolos, false berarti 403 Forbidden. Argumen pertama selalu user yang login (auto-injected), kedua adalah instance model dari route binding.
:::

:::tip Policy auto-discover
Laravel 11 auto-discover policy di `app/Policies` - tidak perlu daftar manual di `AuthServiceProvider`.
:::

## Vue - Projects/Index.vue

```vue
<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

defineOptions({ layout: AppLayout })
defineProps({ projects: Object })
</script>

<template>
  <div>
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold">Projects</h1>
      <Link :href="route('projects.create')" class="btn-primary">+ Tambah</Link>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div v-for="p in projects.data" :key="p.id" class="bg-white rounded shadow p-4">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full" :style="{ background: p.color }" />
          <Link :href="route('projects.show', p.id)" class="font-semibold">
            {{ p.name }}
          </Link>
        </div>
        <p class="text-sm text-gray-500 mt-1">{{ p.tasks_count }} tasks</p>
      </div>
    </div>
  </div>
</template>
```

::: details Penjelasan Kode
- `defineProps({ projects: Object })` - menerima prop `projects` (paginator) dari controller. Shape: `{ data: [...], links, meta }`.
- `defineOptions({ layout: AppLayout })` - bungkus halaman dengan AppLayout (sidebar/topbar).
- `v-for="p in projects.data"` - iterasi array `data` dari paginator. Jangan iterasi `projects` langsung karena paginator adalah object.
- `:key="p.id"` - key unik agar Vue reuse DOM element dengan benar saat re-sort.
- `:style="{ background: p.color }"` - binding style dinamis dari hex warna project. Vue mengubahnya menjadi `style="background: #3B82F6"`.
- `&#123;&#123; p.tasks_count &#125;&#125;` - kolom virtual dari `withCount('tasks')` di controller.
- `&lt;Link :href="route('projects.show', p.id)">` - navigasi ke detail project tanpa reload.
:::

## Vue - Projects/Create.vue

```vue
<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

defineOptions({ layout: AppLayout })

const form = useForm({
  name: '',
  description: '',
  color: '#3B82F6',
})

function submit() {
  form.post(route('projects.store'), { preserveScroll: true })
}
</script>

<template>
  <form @submit.prevent="submit" class="max-w-lg space-y-4">
    <div>
      <label>Nama Project</label>
      <input v-model="form.name" type="text" class="input" />
      <span v-if="form.errors.name" class="text-red-600">{{ form.errors.name }}</span>
    </div>

    <div>
      <label>Deskripsi</label>
      <textarea v-model="form.description" class="input" />
    </div>

    <div>
      <label>Warna</label>
      <input type="color" v-model="form.color" />
    </div>

    <button type="submit" :disabled="form.processing" class="btn-primary">
      Simpan
    </button>
  </form>
</template>
```

::: details Penjelasan Kode
- `useForm({...})` - composable Inertia yang menyimpan state form + helper submit. Otomatis menampung error validasi yang dikirim server ke `form.errors`, dan tracking `form.processing` saat request berjalan.
- `v-model="form.name"` - two-way binding antara input dan `form.name`. Vue mengupdate `form.name` saat user mengetik.
- `@submit.prevent="submit"` - modifier `.prevent` mencegah browser reload default saat form submit, lalu panggil `submit`.
- `form.post(route('projects.store'), { preserveScroll: true })` - submit ke route via POST. `preserveScroll` mempertahankan posisi scroll setelah respons (default Inertia meng-scroll ke atas).
- `form.errors.name` - objek error diisi otomatis oleh Inertia saat server kembali dengan `422 Unprocessable Entity` (validation error). Cocok dengan `Session::has('errors')` Laravel.
- `:disabled="form.processing"` - disable tombol selama request berlangsung - double-click prevention.
:::

## Vue - Projects/Edit.vue

Mirip dengan Create, tapi pre-fill dari props:

```vue
<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

defineOptions({ layout: AppLayout })

const props = defineProps({ project: Object })

const form = useForm({
  name: props.project.name,
  description: props.project.description,
  color: props.project.color,
})

function submit() {
  form.put(route('projects.update', props.project.id), { preserveScroll: true })
}
</script>
```

::: details Penjelasan Kode
- `defineProps({ project: Object })` - menerima prop `project` dari controller `edit()` (instance model yang di-pass). Inertia otomatis serialisasi ke JSON.
- `useForm({ name: props.project.name, ... })` - pre-fill field form dari data project yang ada. Reactivity: prop bersifat read-only, jadi harus copy ke state lokal form.
- `form.put(...)` - method HTTP PUT untuk update. Route `projects.update` mengharapkan parameter ID project (`route('projects.update', props.project.id)` menjadi `/projects/{id}` dengan method PUT).
- Beda `post` (create) dan `put` (update) penting karena route resource membedakannya - RESTful convention.
:::

## Selanjutnya

CRUD project selesai. Lanjut ke [24.7 - Modul Task (CRUD + Status)](/bagian-6/bab-24/24-7-modul-task).
