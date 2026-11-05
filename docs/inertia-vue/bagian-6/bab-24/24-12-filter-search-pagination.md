---
title: 24.12 - Filter, Search & Pagination
---

# 24.12 Filter, Search & Pagination

:::info Langkah 12 dari 15
Tambahkan filter status, search berdasarkan judul, dan pagination dengan partial reload.
:::

## Controller - Update `show` Project

```php
public function show(Request $request, Project $project)
{
    $this->authorize('view', $project);

    $project->load(['members', 'tasks' => function ($q) use ($request) {
        $q->when($request->q, fn ($q, $v) => $q->where('title', 'like', "%{$v}%"))
          ->when($request->status, fn ($q, $v) => $q->where('status', $v))
          ->when($request->priority, fn ($q, $v) => $q->where('priority', $v))
          ->latest();
    }]);

    return Inertia::render('Projects/Show', [
        'project' => ProjectResource::make($project),
        'tasks'   => TaskResource::collection($project->tasks),
        'filters' => $request->only(['q', 'status', 'priority']),
    ]);
}
```

::: details Penjelasan Kode
- `->when($request->q, fn ($q, $v) => $q->where('title', 'like', "%{$v}%"))` - conditional where. `$v` adalah nilai dari `$request->q`. Jika kosong/null, klausa tidak ditambahkan.
- `'like', "%{$v}%"` - operator LIKE dengan wildcard di kedua sisi = substring match. Performa di tabel besar rendah (full scan); pertimbangkan full-text search untuk dataset besar.
- Variabel `{$v}` di dalam string double-quote di-interpolasi PHP - perhatikan injection risk: gunakan binding parameter (Laravel otomatis parameterized, jadi tetap aman dari SQL injection).
- `$q->when(...)->when(...)->latest()` - chaining beberapa filter kondisional, diakhiri `latest()` (`ORDER BY created_at DESC`).
- `$request->only(['q', 'status', 'priority'])` - hanya sertakan key yang relevan untuk filter; key yang tidak ada di URL tidak ikut. Dikirim ke frontend untuk pre-fill state input.
:::

## Vue - Filter Component

```vue
<script setup>
import { ref, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import Pagination from '@/Components/UI/Pagination.vue'
import debounce from 'lodash/debounce'

const props = defineProps({
  project: Object,
  tasks: Object,
  filters: Object,
})

const search = ref(props.filters.q ?? '')
const status = ref(props.filters.status ?? 'all')
const priority = ref(props.filters.priority ?? 'all')

// Watch filter - kirim partial reload
watch(
  [search, status, priority],
  debounce(([q, s, p]) => {
    router.get(
      route('projects.show', props.project.id),
      {
        q: q || null,
        status: s === 'all' ? null : s,
        priority: p === 'all' ? null : p,
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        only: ['tasks', 'filters'],
      }
    )
  }, 300),
)
</script>

<template>
  <div class="space-y-4">
    <!-- Filter bar -->
    <div class="flex gap-3">
      <input
        v-model="search"
        placeholder="Cari task..."
        class="input flex-1"
      />

      <select v-model="status" class="input">
        <option value="all">Semua Status</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <select v-model="priority" class="input">
        <option value="all">Semua Prioritas</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>

    <!-- Task list -->
    <ul class="space-y-2">
      <li
        v-for="task in tasks.data"
        :key="task.id"
        class="bg-white rounded shadow p-3 flex justify-between"
      >
        <span>{{ task.title }}</span>
        <span class="text-xs text-gray-500">{{ task.status }} / {{ task.priority }}</span>
      </li>
    </ul>

    <!-- Empty state -->
    <p v-if="!tasks.data.length" class="text-gray-500 text-center py-4">
      Tidak ada task yang cocok dengan filter.
    </p>

    <!-- Pagination -->
    <Pagination
      v-if="tasks.meta?.links"
      :links="tasks.meta.links"
    />
  </div>
</template>
```

::: details Penjelasan Kode
- `ref(props.filters.q ?? '')` - init state dari filter yang diterima dari server. Pola ini untuk menjaga state input tetap sinkron dengan URL/query string setelah reload - input tidak ke-reset.
- `watch([search, status, priority], callback)` - multiple-source watcher. Callback dijalankan jika salah satu ref berubah.
- `debounce(..., 300)` - lodash debounce menunda eksekusi 300 ms setelah ketik terakhir. Penting agar saat user mengetik di search, tidak mengirim request per keystroke - menghemat bandwidth & beban server.
- `router.get(route('projects.show', ...), { q, status, priority }, { ... })` - navigasi Inertia ke URL yang sama dengan query parameter baru. Inertia akan re-render halaman dengan data baru.
- `q: q || null` - jika search kosong, kirim `null` sehingga query `q` tidak muncul di URL (bersih). Kebalikannya, `''` akan muncul sebagai `?q=`.
- `status: s === 'all' ? null : s` - 'all' adalah sentinel untuk "tidak ada filter" -> dikirim null agar tidak ditambahkan ke where di controller.
- `preserveState: true` - cegah komponen di-remount; state internal (input value) dipertahankan. Penting karena kita sudah sinkron manual via `ref`.
- `preserveScroll: true` - tahan scroll; UX lebih nyaman saat filter berubah.
- `replace: true` - ganti history entry, bukan push baru. Mencegah tombol back harus melewati 20 state filter.
- `only: ['tasks', 'filters']` - partial reload; server hanya mengirim ulang props `tasks` dan `filters`. Props lain (project, auth, flash) tetap di cache browser - menghemat bandwidth dan render lebih cepat.
:::

## Pagination Component

Buat `Components/UI/Pagination.vue`:

```vue
<script setup>
import { Link } from '@inertiajs/vue3'

const props = defineProps({
  links: { type: Array, required: true },
})

function isDisabled(link) {
  return !link.url
}
</script>

<template>
  <nav v-if="links.length > 3" class="flex items-center gap-1 mt-4">
    <Component
      v-for="(link, i) in links"
      :key="i"
      :is="isDisabled(link) ? 'span' : Link"
      :href="isDisabled(link) ? undefined : link.url"
      v-html="link.label"
      preserve-scroll
      :class="[
        'rounded px-3 py-1.5 text-sm',
        link.active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100',
        isDisabled(link) ? 'cursor-not-allowed opacity-50' : '',
      ]"
    />
  </nav>
</template>
```

::: details Penjelasan Kode
- `links` adalah array dari Laravel paginator: setiap item `{ url, label, active }`. `label` berisi HTML seperti `&laquo; Previous` atau `&lt;span class="...">1&lt;/span>` (sudah pre-rendered).
- `&lt;Component :is="...">` - dynamic component Vue. Swap antara `'span'` (disabled - tidak ada URL untuk prev/next di page pertama/terakhir) atau `Link` Inertia (enabled).
- `:href="isDisabled(link) ? undefined : link.url"` - undefined href saat disabled, sehingga tidak ada navigasi.
- `v-html="link.label"` - render label yang berisi HTML. Catatan keamanan: `v-html` hanya aman jika label dari sumber terpercaya (di sini dari Laravel paginator, tidak user-controlled).
- `preserve-scroll` - prop khas `&lt;Link>` agar pagination tidak menggulir ke atas.
- `link.active ? 'bg-blue-600 text-white' : '...'` - styling dinamis berdasarkan state halaman aktif dari paginator.
- `v-if="links.length > 3"` - jangan render pagination jika hanya 1 halaman (link default: prev, 1, next = 3 link; lebih dari 1 halaman > 3).
:::

## Filter untuk Pagination

`->withQueryString()` agar filter tetap ada saat pindah halaman. Untuk project yang load task via relasi (bukan paginate), pagination dilakukan manual:

```php
// Pilihan A: Paginator terpisah
$tasks = $project->tasks()
    ->when($request->q, /*...*/)
    ->when($request->status, /*...*/)
    ->paginate(10)
    ->withQueryString();

return Inertia::render('Projects/Show', [
    'project' => ProjectResource::make($project->load('members')),
    'tasks'   => TaskResource::collection($tasks),
    'filters' => $request->only(['q', 'status', 'priority']),
]);
```

::: details Penjelasan Kode
- `->paginate(10)` - paginator LengthAwarePaginator dengan 10 item per halaman. Berbeda dari `load('tasks')` yang mengembalikan collection; paginator punya `links()` dan metadata.
- `->withQueryString()` - pertahankan query string yang ada di URL saat ini (filter `q`, `status`, dst) di link pagination. Tanpa ini, klik halaman 2 akan kehilangan filter - user melihat semua task di halaman 2, bukan hasil filter.
- `TaskResource::collection($tasks)` - Larproperty paginator diterima `JsonResource::collection`; output JSON akan ada `data`, `links`, `meta` - cocok untuk pagination UI.
- `ProjectResource::make($project->load('members'))` - chain eager load di model sebelum wrap. Berguna kalau kita hanya punya model `Project` (sudah ada dari route binding) dan perlu members untuk sidebar.
- Pilihan A ini lebih scaling-friendly dibanding `$project->load('tasks')` (no pagination) untuk project dengan banyak task.
:::

## Pola Partial Reload

Event saat filter berubah - hanya minta `tasks` dan `filters`:

```js
router.get(
  route('projects.show', project.id),
  { q, status, priority },
  {
    preserveState: true,    // input tidak ke-reset
    preserveScroll: true,   // tidak loncat ke atas
    replace: true,          // tidak menambah history
    only: ['tasks', 'filters'],  // partial reload
  }
)
```

::: details Penjelasan Kode
- `only: ['tasks', 'filters']` - partial reload kunci efisiensi Inertia. Bersama `Inertia::render`, controller hanya perlu mengirim prop `tasks` dan `filters` jika request memiliki header `X-Inertia-Partial-Data`.
- Akses fitur ini secara low-level via `Inertia::render(...)->only([...])` di controller, atau Inertia auto-hanya kirim prop yang di-list `only`. Pada backend, gunakan `Inertia::lazy('foo')` agar prop lain tidak dikomputasi saat partial reload.
- `preserveState` vs `preserveScroll`: hold state Vue komponen vs hold scroll position - keduanya beda dan saling melengkapi.
- `replace: true` - meng-overwrite entry history terkini -> back button tidak melewati setiap versi filter.
:::

:::tip Optimasi bandwidth
`only: ['tasks', 'filters']` membuat server hanya mengirim ulang prop `tasks` dan `filters` - prop lain seperti `project`, `auth`, `flash` tetap di cache browser.
:::

## Reset Page saat Filter Berubah

Saat filter berubah, pagination reset ke page 1:

```js
watch([search, status, priority], ([q, s, p]) => {
  router.get(route('projects.show', project.id),
    { q, status: s, priority: p, page: 1 },
    { preserveState: true, preserveScroll: true, only: ['tasks'] }
  )
})
```

::: details Penjelasan Kode
- `page: 1` - eksplisit reset ke halaman 1 saat filter berubah. Tanpa ini, user bisa berakhir di page 4 dari filter lama yang tidak ada di filter baru (404 / kosong).
- `only: ['tasks']` - tidak perlu reload `filters` karena state filter sudah di-set di client (changes are local). Hemat payload.
- Catatan: pendekatan ini sebaiknya di-debounce juga agar trigger tidak per keystroke; di atas dipangkas untuk kejelasan alur.
:::

## Selanjutnya

Filter siap. Lanjut ke [24.13 - Polish & Detail Akhir](/bagian-6/bab-24/24-13-polish-detail).
