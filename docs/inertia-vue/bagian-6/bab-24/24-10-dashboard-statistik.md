---
title: 24.10 - Dashboard & Statistik
---

# 24.10 Dashboard & Statistik

:::info Langkah 10 dari 15
Halaman dashboard dengan statistik ringkasan - total project, task selesai, task terlambat.
:::

## Route

```php
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');
```

::: details Penjelasan Kode
- Middleware `auth` menolak guest; `verified` menolak user yang belum verifikasi email. Laravel Breeze mengirim email verifikasi dan mengeä¸è®© akse route `verified` sebelum verifikasi.
- Kombinasi middleware dievaluasi dari kiri ke kanan. User gagal `auth` diarahkan ke login; lulus `auth` tapi gagal `verified` diarahkan ke `verification.notice`.
:::

## Controller - DashboardController

```php
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_projects' => $user->projects()->count(),
                'total_tasks'    => $user->tasks()->count(),
                'tasks_done'     => $user->tasks()->where('status', 'done')->count(),
                'tasks_overdue'  => $user->tasks()->overdue()->count(),
            ],
            'recent_tasks' => TaskResource::collection(
                $user->tasks()
                    ->with('project')
                    ->latest()
                    ->take(5)
                    ->get()
            ),
            'my_projects'  => ProjectResource::collection(
                $user->projects()
                    ->withCount('tasks')
                    ->take(6)
                    ->get()
            ),
        ]);
    }
}
```

::: details Penjelasan Kode
- `$user->projects()->count()` - menghasilkan `SELECT COUNT(*)` query langsung ke DB. Menampilkan total project milik user tanpa mengambil seluruh record.
- `$user->tasks()->where('status', 'done')->count()` - delegate to SQL untuk hitung task dengan status tertentu; ringan dan cepat dibanding load ke collection dan filter di PHP.
- `$user->tasks()->overdue()->count()` - memakai custom scope dari model Task (24.3). Scope menambah `WHERE due_date < now AND status != done`. Bersih, tertest, dan reusable.
- `'stats' => [...]` - semua agregat dibungkus dalam key `stats`, sehingga frontend cukup pakai `stats.total_projects` dan prop ini akan reaktif.
- `->with('project')` - eager load relasi project untuk setiap task terbaru. Berguna saat frontend perlu menampilkan `recent_tasks[i].project.name`.
- `->latest()->take(5)->get()` - urutkan by `created_at DESC` (`latest()`), ambil hanya 5 record. Hindari `all()` di dashboard besar.
- `->withCount('tasks')` untuk `my_projects` - tambah agregat `tasks_count` tanpa eager-load seluruh task. Hemat query dan memori.
- `TaskResource::collection(...)` / `ProjectResource::collection(...)` - membungkus collection agar konsisten format dan otorisasi per-item diterapkan (mis. `can_update` di TaskResource).
:::

:::tip Scope `overdue`
Method `overdue` sudah dibuat di model Task (lihat 24.3):
```php
public function scopeOverdue($q) {
    return $q->where('due_date', '<', now())
        ->where('status', '!=', 'done');
}
```
:::

## Vue - Pages/Dashboard.vue

```vue
<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import { route } from 'ziggy-js'
import { Link } from '@inertiajs/vue3'

defineOptions({ layout: AppLayout })

defineProps({
  stats: Object,
  recent_tasks: Object,
  my_projects: Object,
})
</script>

<template>
  <div class="space-y-8">
    <h1 class="text-2xl font-bold">Dashboard</h1>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded shadow p-4">
        <p class="text-sm text-gray-500">Total Projects</p>
        <p class="text-3xl font-bold">{{ stats.total_projects }}</p>
      </div>

      <div class="bg-white rounded shadow p-4">
        <p class="text-sm text-gray-500">Total Tasks</p>
        <p class="text-3xl font-bold">{{ stats.total_tasks }}</p>
      </div>

      <div class="bg-white rounded shadow p-4">
        <p class="text-sm text-gray-500">Selesai</p>
        <p class="text-3xl font-bold text-green-600">{{ stats.tasks_done }}</p>
      </div>

      <div class="bg-white rounded shadow p-4">
        <p class="text-sm text-gray-500">Terlambat</p>
        <p class="text-3xl font-bold text-red-600">{{ stats.tasks_overdue }}</p>
      </div>
    </div>

    <!-- Recent tasks -->
    <div>
      <h2 class="font-semibold mb-2">Task Terbaru</h2>
      <ul class="space-y-2">
        <li
          v-for="t in recent_tasks.data"
          :key="t.id"
          class="bg-white shadow rounded p-3 flex justify-between"
        >
          <span>{{ t.title }}</span>
          <span class="text-xs text-gray-500">{{ t.status }}</span>
        </li>
      </ul>
    </div>

    <!-- My projects -->
    <div>
      <h2 class="font-semibold mb-2">Project Aktif</h2>
      <ul class="grid grid-cols-3 gap-2">
        <li v-for="p in my_projects.data" :key="p.id">
          <Link
            :href="route('projects.show', p.id)"
            class="bg-white shadow rounded p-3 block hover:shadow-md transition"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                :style="{ background: p.color }"
              />
              <span class="font-medium">{{ p.name }}</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">{{ p.tasks_count }} tasks</p>
          </Link>
        </li>
      </ul>
    </div>
  </div>
</template>
```

::: details Penjelasan Kode
- `grid-cols-2 md:grid-cols-4` - layout responsif: 2 kolom di mobile, 4 di desktop. Breakpoint `md` (>768px) Tailwind.
- `&#123;&#123; stats.total_projects &#125;&#125;` - interpolation langsung dari props object - reaktif otomatis setelah Inertia update props.
- `recent_tasks.data` - resource collection menghasilkan wrapper `{ data: [...] }`, jadi harus iterasi `.data`. Berbeda dari paginator yang juga punya `meta`/`links`.
- `&lt;Link :href="route('projects.show', p.id)" ... class="block hover:shadow-md transition">` - kartu project bisa diklik penuh (block fill area) untuk navigasi. `transition` menambahkan animasi smooth saat hover.
- `:style="{ background: p.color }"` - dot warna project sesuai data.
- `&#123;&#123; p.tasks_count &#125;&#125;` - kolom virtual dari `withCount('tasks')`.
:::

## Varian: Progress Bar Task Done

Untuk visualisasi persentase selesai:

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({ stats: Object })

const completionRate = computed(() => {
  if (!props.stats.total_tasks) return 0
  return Math.round((props.stats.tasks_done / props.stats.total_tasks) * 100)
})
</script>

<template>
  <div class="bg-white rounded shadow p-4">
    <p class="text-sm text-gray-500 mb-2">Progress Task</p>
    <div class="bg-gray-200 rounded h-3 overflow-hidden">
      <div
        class="bg-green-500 h-3 transition-all"
        :style="{ width: completionRate + '%' }"
      />
    </div>
    <p class="text-xs text-gray-500 mt-1">{{ completionRate }}% selesai</p>
  </div>
</template>
```

::: details Penjelasan Kode
- `if (!props.stats.total_tasks) return 0` - guard terhadap division by zero. Kalau tidak ada task, persentase 0, bukan NaN.
- `Math.round((done / total) * 100)` - konversi rasio ke persen integer.
- `computed` - re-evaluate ketika `stats` berubah. Lebih efisien dari method call di template tiap render.
- `overflow-hidden` pada container bar - penting agar inner bar rounded menyesuaikan container (tidak menyumbung keluar).
- `transition-all` - animasi width berubah mulus saat persentase update real-time (mis. saat task di-mark done via partial reload).
:::

## Varian: Chart Statistik (Optional)

Pakai `chart.js` + `vue-chartjs`:

```bash
npm install chart.js vue-chartjs
```

```vue
<script setup>
import { Bar } from 'vue-chartjs'
import { Chart, CategoryScale, LinearScale, BarElement } from 'chart.js'

Chart.register(CategoryScale, LinearScale, BarElement)

const props = defineProps({ stats: Object })

const data = {
  labels: ['Total', 'Done', 'Overdue'],
  datasets: [
    {
      data: [props.stats.total_tasks, props.stats.tasks_done, props.stats.tasks_overdue],
      backgroundColor: ['#3B82F6', '#22C55E', '#EF4444'],
    },
  ],
}
</script>
```

::: details Penjelasan Kode
- `Chart.register(CategoryScale, LinearScale, BarElement)` - di Chart.js v3+ tree-shakeable, jadi hanya register yang dipakai untuk bundle kecil. Tidak pakai default full bundle.
- `data` adalah struktur Chart.js: `labels` (x-axis), `datasets` berisi array + warna. Setiap bar diberi warna sesuai midnight blue/green/red untuk visual seketika.
- Komponen `Bar` dari `vue-chartjs` menerima prop `data` dan merender canvas.
- Catatan: props stats reaktif, tapi Chart.js tidak otomatis update. Perlu `:data` diikat dan watcher, atau gunakan `:key` paksa re-render saat stats berubah.
:::

## Selanjutnya

Dashboard siap. Lanjut ke [24.11 - Manajemen Anggota Project](/bagian-6/bab-24/24-11-anggota-project).
