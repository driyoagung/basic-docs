---
title: 24.7 - Modul Task (CRUD + Status)
---

# 24.7 Modul Task (CRUD + Status)

:::info Langkah 7 dari 15
Modul paling inti: task di dalam project, lengkap dengan status, prioritas, dan due date.
:::

## Routes

Task adalah nested resource di bawah project:

```php
Route::resource('projects.tasks', TaskController::class)
    ->middleware(['auth'])
    ->except(['index', 'show']);
```

## Controller - TaskController

```php
class TaskController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status'      => ['required', 'in:todo,in_progress,done'],
            'priority'    => ['required', 'in:low,medium,high'],
            'due_date'    => ['nullable', 'date'],
            'assignee_id' => ['nullable', 'exists:users,id'],
        ]);

        $project->tasks()->create($validated + ['user_id' => $request->user()->id]);

        return redirect()->back()->with('success', 'Task dibuat');
    }

    public function update(Request $request, Project $project, Task $task)
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status'      => ['sometimes', 'in:todo,in_progress,done'],
            'priority'    => ['sometimes', 'in:low,medium,high'],
            'due_date'    => ['nullable', 'date'],
            'assignee_id' => ['nullable', 'exists:users,id'],
        ]);

        $task->update($validated);

        return redirect()->back()->with('success', 'Task diperbarui');
    }

    public function destroy(Project $project, Task $task)
    {
        $this->authorize('delete', $task);
        $task->delete();

        return redirect()->back()->with('success', 'Task dihapus');
    }
}
```

::: details Penjelasan Kode
- Route binding `Project $project` - Laravel mengambilProject berdasarkan segment URL `/projects/{project}` otomatis. Jika tidak ada, 404.
- `$this->authorize('update', $project)` - hapus MD ProjectPolicy. Hanya yang boleh update project yang bisa menambah task - mencegah anggota biasa menambah task ke project orang lain.
- `['in:todo,in_progress,done']` - aturan validasi: nilai harus salah satu dari list (whitelist). Mencegah status liar masuk DB.
- `['exists:users,id']` - cek ke DB bahwa `assignee_id` benar-benar ada di tabel `users` kolom `id`. Mencegah FK violation dan tampered data.
- `$project->tasks()->create($validated + ['user_id' => $request->user()->id])` - simpan task via relasi `hasMany` (auto isi `project_id`) ditambah array `+` untuk meng-merge `user_id` creator. Tidak percaya input user untuk user_id.
- `update`: `$this->authorize('update', $task)` - sekarang cek TaskPolicy (bukan ProjectPolicy) karena argumen kedua adalah `Task`. Laravel otomatis pilih policy sesuai tipe model.
- `'sometimes'` - aturan hanya dijalankan jika key ada di request. Karena update bisa parsial (mis. hanya rubah status), field yang tidak disertakan tidak divalidasi.
- `$task->update($validated)` - mass assignment ke model. Aman karena `$fillable` di model membatasi kolom yang bisa diisi.
- `redirect()->back()` - kembali ke halaman sebelumnya (biasanya `projects.show`). Tidak perlu hardcode route agar UX konsisten.
:::

## Policy - TaskPolicy

```php
class TaskPolicy
{
    public function update(User $user, Task $task): bool
    {
        return $task->user_id === $user->id
            || $task->project->user_id === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        return $this->update($user, $task);
    }
}
```

::: details Penjelasan Kode
- `update`: boleh edit jika user adalah creator task (`task->user_id`) ATAU owner project (`task->project->user_id`). Mengakses `$task->project` otomatis trigger relasi (lazy load jika belum di-eager).
- `delete`: jika sintaks sama dengan update, panggil method internal `$this->update($user, $task)` - DRY, menghindari duplikasi logika otorisasi.
:::

## Vue - Components/Tasks/TaskCard.vue

Card task dengan badge warna sesuai status:

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({ task: Object })

const statusColor = computed(() => ({
  todo: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
}[props.task.status]))

const borderColor = computed(() => ({
  todo: 'border-yellow-400',
  in_progress: 'border-blue-500',
  done: 'border-green-500',
}[props.task.status]))
</script>

<template>
  <div class="bg-white rounded shadow p-3 border-l-4" :class="borderColor">
    <h4 class="font-medium">{{ task.title }}</h4>

    <p v-if="task.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
      {{ task.description }}
    </p>

    <div class="mt-2 flex items-center gap-2">
      <span :class="statusColor" class="text-xs rounded-full px-2 py-0.5">
        {{ task.status }}
      </span>
      <span v-if="task.due_date" class="text-xs text-gray-500">
        {{ task.due_date }}
      </span>
    </div>
  </div>
</template>
```

::: details Penjelasan Kode
- `defineProps({ task: Object })` - komponen ini reusable: menerima satu task sebagai prop.
- Lookup object `{ todo: '...', in_progress: '...', done: '...' }[props.task.status]` - pattern map status ke kelas CSS, lebih ringkas dari switch-case. Akses langsung by key.
- `computed(() => ...)` - hasil di-cache berdasarkan dependency `props.task.status`; hanya recompute jika status berubah.
- `line-clamp-2` - utility Tailwind (perlu plugin `@tailwindcss/line-clamp` di v2, atau built-in di v3.3+) untuk membatasi deskripsi 2 baris dengan ellipsis.
- `:class="borderColor"` - binding kelas dinamis; `borderColor` adalah string hasil computed. Dipadukan dengan kelas statis di `class="bg-white rounded shadow p-3 border-l-4"`.
- `v-if="task.description"` - sembunyikan paragraf jika deskripsi kosong - tampilan lebih rapi.
:::

## Vue - Components/Tasks/TaskModal.vue

Modal untuk buat/edit task - pakai Headless UI Dialog:

```vue
<script setup>
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const props = defineProps({
  open: Boolean,
  project: Object,
  task: Object,
})

const emit = defineEmits(['close'])

const form = useForm({
  title: props.task?.title ?? '',
  description: props.task?.description ?? '',
  status: props.task?.status ?? 'todo',
  priority: props.task?.priority ?? 'medium',
  due_date: props.task?.due_date ?? '',
})

function submit() {
  if (props.task) {
    form.put(
      route('projects.tasks.update', [props.project.id, props.task.id]),
      { onSuccess: () => emit('close'), preserveScroll: true }
    )
  } else {
    form.post(
      route('projects.tasks.store', props.project.id),
      { onSuccess: () => { form.reset(); emit('close') }, preserveScroll: true }
    )
  }
}
</script>

<template>
  <Dialog :open="open" @close="emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black/40" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="w-full max-w-md bg-white rounded shadow p-6">
        <DialogTitle class="text-lg font-semibold mb-4">
          {{ task ? 'Edit Task' : 'Buat Task' }}
        </DialogTitle>

        <form @submit.prevent="submit" class="space-y-3">
          <input v-model="form.title" placeholder="Judul" class="input" />
          <span v-if="form.errors.title" class="text-red-600">{{ form.errors.title }}</span>

          <select v-model="form.status" class="input">
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <select v-model="form.priority" class="input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <input type="date" v-model="form.due_date" class="input" />

          <textarea v-model="form.description" class="input" placeholder="Deskripsi" />

          <div class="flex justify-end gap-2">
            <button type="button" @click="emit('close')" class="btn-outline">
              Batal
            </button>
            <button type="submit" :disabled="form.processing" class="btn-primary">
              Simpan
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>
```

::: details Penjelasan Kode
- `&lt;Dialog :open="open" @close="emit('close')">` - komponen Headless UI Dialog (modal aksesibel). `open` adalah prop control, dan event `@close` dipicu saat user tekan ESC / klik backdrop / klik tombol X. Pola two-way binding—parent yang mengatur keadaan `open`.
- `useState via props.task?.title ?? ''` - operator nullish `??` mengembalikan `''` jika `task` undefined/null. Modal dipakai untuk create (task = null) dan edit (task = objek) - perlu default di kedua kasus.
- `defineEmits(['close'])` - deklarasi event yang boleh di-emit parent. Parent bisa kit `@close="showModal = false"`.
- `form.put(route('projects.tasks.update', [props.project.id, props.task.id]))` - route nested resource perlu 2 ID. Ziggy menerima array `[project_id, task_id]` untuk segment `/projects/{project}/tasks/{task}`.
- `form.post(route('projects.tasks.store', props.project.id))` - untuk create, hanya butuh `project_id` karena task belum ada.
- `onSuccess: () => { form.reset(); emit('close') }` - set create sukses, reset form agar tidak ada sisa data, lalu tutup modal. Pada update tidak reset form karena field sudah benar (state sukses).
- `preserveScroll: true` - setelah submit, tetap scroll pada posisi sebelumnya, bukan naik ke atas halaman.
- Struktur 3-layer: `&lt;Dialog>` (root a11y) -> `&lt;div>` overlay/background -> `&lt;DialogPanel>` konten. Headless UI mengurus fokus trap, ARIA, dan event ESC.
:::

## Vue - Pages/Projects/Show.vue (Tampilan Task)

```vue
<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { ref } from 'vue'
import { Link } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import TaskCard from '@/Components/Tasks/TaskCard.vue'
import TaskModal from '@/Components/Tasks/TaskModal.vue'

defineOptions({ layout: AppLayout })

defineProps({ project: Object, tasks: Object })

const showModal = ref(false)
const editingTask = ref(null)

function openCreate() {
  editingTask.value = null
  showModal.value = true
}

function openEdit(task) {
  editingTask.value = task
  showModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ project.name }}</h1>
      <button @click="openCreate" class="btn-primary">+ Task</button>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div v-for="task in tasks.data" :key="task.id" @click="openEdit(task)">
        <TaskCard :task="task" />
      </div>
    </div>

    <TaskModal
      :open="showModal"
      :project="project"
      :task="editingTask"
      @close="showModal = false"
    />
  </div>
</template>
```

::: details Penjelasan Kode
- `ref(false)` / `ref(null)` - primitive reactive state. `showModal` toggle modal, `editingTask` menyimpan task yang sedang di-edit (null artinya create baru).
- `openCreate()` - reset `editingTask` ke null agar modal masuk mode "create", lalu buka modal. Modal deteksi `task` null vs objek untuk bedakan mode.
- `openEdit(task)` - simpan task ke `editingTask`, buka modal. Saat modal mount ulang (karena reactive), form ter-pre-fill dengan data task.
- `@click="openEdit(task)"` - click card task untuk edit. UX sederhana - klik card = edit, tanpa tombol terpisah.
- `&lt;TaskModal :open="showModal" :project="project" :task="editingTask" @close="..."/>` - komposisi komponen. Parent (page) mengontrol open/close, child (modal) emit `close` saat selesai/batal.
- `defineProps({ project, tasks })` - prop dari controller `show` (resource collection).
:::

## Optional: Drag and Drop Antar Status

Untuk fitur lengkap, bisa pakai `vuedraggable`:

```bash
npm install vuedraggable@next
```

```vue
<script setup>
import draggable from 'vuedraggable/src/vuedraggable'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

// Saat di-drop ke kolom "done", update status
function onDrop(task, newStatus) {
  router.put(
    route('projects.tasks.update', [project.id, task.id]),
    { status: newStatus },
    { preserveScroll: true }
  )
}
</script>
```

::: details Penjelasan Kode
- `router.put(...)` - imperatif langsung kirim PUT tanpa `useForm`. Cocok untuk aksi otomatis (drag) tanpa form HTML. Berguna saat tidak perlu tracking error per-field.
- Parameter body `{ status: newStatus }` - Partial update: hanya kirim `status`. Controller memakai `'sometimes'` sehingga field lain tidak divalidasi maupun diubah.
- `preserveScroll: true` - penting karena drag-drop mengubah tata letak; tidak ingin halaman Loncat.
- `vuedraggable@next` - versi Vue 3 compatible (lama hanya Vue 2).
:::

## Selanjutnya

Modul task selesai. Lanjut ke [24.8 - Upload Lampiran pada Task](/bagian-6/bab-24/24-8-upload-lampiran).
