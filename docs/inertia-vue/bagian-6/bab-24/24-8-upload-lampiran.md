---
title: 24.8 - Upload Lampiran pada Task
---

# 24.8 Upload Lampiran pada Task

:::info Langkah 8 dari 15
User bisa upload file lampiran ke task tertentu. Pakai `forceFormData` - wajib untuk file upload.
:::

## Routes

```php
Route::post('projects/{project}/tasks/{task}/attachments', [AttachmentController::class, 'store'])
    ->name('projects.tasks.attachments.store');

Route::delete('attachments/{attachment}', [AttachmentController::class, 'destroy'])
    ->name('attachments.destroy');
```

::: details Penjelasan Kode
- Route POST nested 3-level pertama (`projects/{project}/tasks/{task}/attachments`) untuk upload, tapi route delete cukup `attachments/{attachment}` karena attachment punya ID global unik - tidak perlu scope via project/task.
- `->name(...)` - eksplisit kasih nama route agar bisa panggil `route('projects.tasks.attachments.store', [project, task])` di frontend via Ziggy.
- Pola delete tanpa parent context lebih RESTful ketika resource sudah punya ID sendiri - lebih singkat URL & tidak perlu validasi parent.
:::

## Controller - AttachmentController

```php
class AttachmentController extends Controller
{
    public function store(Request $request, Project $project, Task $task)
    {
        $this->authorize('update', $task);

        $request->validate([
            'file' => ['required', 'file', 'max:5120'], // max 5MB
        ]);

        $path = $request->file('file')->store('attachments', 'public');

        $task->attachments()->create([
            'user_id'   => $request->user()->id,
            'filename'  => $request->file('file')->getClientOriginalName(),
            'path'      => $path,
            'size'      => $request->file('file')->getSize(),
            'mime_type' => $request->file('file')->getMimeType(),
        ]);

        return redirect()->back()->with('success', 'File diupload');
    }

    public function destroy(Request $request, Attachment $attachment)
    {
        $this->authorize('delete', $attachment);

        Storage::disk('public')->delete($attachment->path);
        $attachment->delete();

        return redirect()->back()->with('success', 'File dihapus');
    }
}
```

::: details Penjelasan Kode
- `$this->authorize('update', $task)` - hanya yang boleh edit task yang boleh upload lampiran. Otorisasi dijadikan pusat di server.
- `'file' => ['required', 'file', 'max:5120']` - aturan upload: wajib, harus berupa file, maks 5120 KB (5 MB). Laravel konversi ke byte saat validasi.
- `$request->file('file')->store('attachments', 'public')` - simpan ke disk `public` (folder `storage/app/public/attachments`), nama file di-hash otomatis agar unik. Mengembalikan path relatif (mis. `attachments/abc123.pdf`).
- `getClientOriginalName()` - nama asli file dari komputer user (mis. `laporan.pdf`). Disimpan terpisah dari `path` untuk ditampilkan di UI sebagai label yang familiar.
- `getSize()` - ukuran byte. `getMimeType()` - MIME sebenarnya (bukan ekstensi) yang dideteksi dari konten - lebih aman untuk klasifikasi file.
- Hapus: `Storage::disk('public')->delete($attachment->path)` - hapus file fisik dari disk dulu sebelum hapus record DB. Jika urutan terbalik, file jadi orphan. Praktik baik: wrap dalam `DB::transaction` agar jika file gagal hapus, record tidak ikut hilang (di sini sederhana untuk demo).
- `$attachment->delete()` - hapus record dari DB, cascade tidak relevan karena attachment tidak punya child.
:::

## Policy - AttachmentPolicy

```php
class AttachmentPolicy
{
    public function delete(User $user, Attachment $attachment): bool
    {
        return $attachment->user_id === $user->id
            || $attachment->task->project->user_id === $user->id;
    }
}
```

::: details Penjelasan Kode
- Mengizinkan hapus jika user adalah pengupload (`user_id`) ATAU owner project tempat task ini berada. Akses berantai `$attachment->task->project->user_id` memicu lazy load 2 level - hati-hati N+1; di produksi lebih baik eager load via `with('task.project')`.
- Method `delete` saja (tidak ada `update`) karena lampiran tidak pernah di-edit, hanya di-upload ulang / dihapus.
:::

## Storage Link

:::danger Wajib
Jalankan sekali di setup project:
```bash
php artisan storage:link
```
Tanpa ini, file di `storage/app/public` tidak bisa diakses publik.
:::

## Vue - Form Upload di TaskModal

Tambah input file di dalam TaskModal (atau halaman detail task):

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const props = defineProps({ task: Object })

const form = useForm({ file: null })

function onFileChange(e) {
  form.file = e.target.files[0]
}

function upload() {
  form.post(route('projects.tasks.attachments.store', [props.task.project_id, props.task.id]), {
    forceFormData: true,  // wajib untuk file upload
    preserveScroll: true,
    onSuccess: () => form.reset(),
  })
}
</script>

<template>
  <div class="mt-4 pt-4 border-t">
    <h3 class="font-semibold mb-2">Lampiran</h3>

    <!-- Daftar lampiran existing -->
    <ul class="space-y-1 mb-3">
      <li
        v-for="att in task.attachments"
        :key="att.id"
        class="flex items-center justify-between text-sm"
      >
        <a :href="'/storage/' + att.path" target="_blank" class="text-blue-600 underline">
          {{ att.filename }}
        </a>
        <span class="text-gray-500">{{ formatSize(att.size) }}</span>
      </li>
    </ul>

    <!-- Form upload baru -->
    <input type="file" @change="onFileChange" />

    <!-- Progress bar saat upload -->
    <div v-if="form.progress" class="mt-2">
      <div class="bg-gray-200 rounded h-2">
        <div
          class="bg-blue-600 h-2 transition-all"
          :style="{ width: form.progress.percentage + '%' }"
        />
      </div>
      <p class="text-xs text-gray-500 mt-1">{{ form.progress.percentage }}%</p>
    </div>

    <button
      type="button"
      @click="upload"
      :disabled="!form.file || form.processing"
      class="btn-outline mt-2 text-sm"
    >
      Upload
    </button>
  </div>
</template>
```

::: details Penjelasan Kode
- `useForm({ file: null })` - state awal `null` (belum ada file dipilih). Saat user pilih, diset ke objek `File`.
- `form.post(route(...), { forceFormData: true })` - `forceFormData` memaksa request dikirim sebagai `multipart/form-data`, ESSENTIAL untuk upload. Jika tidak, fetch API bisa kirim sebagai JSON dan file hilang.
- `form.progress` - objek reaktif yang diisi Inertia saat upload berisi `{ percentage, loaded, total }`. Berguna untuk menampilkan progress bar real-time (XHR `upload.onprogress`).
- `:style="{ width: form.progress.percentage + '%' }"` - ubah lebar bar sesuai persentase. Tailwind `transition-all` membuat animasi mulus.
- `target="_blank"` - buka file di tab baru agar user tetap di halaman task.
- `:disabled="!form.file || form.processing"` - disable tombol jika belum pilih file atau sedang uploading. Mencegah click ganda dan upload kosong.
- `onSuccess: () => form.reset()` - reset form setelah upload sukses, sehingga input file kosong dan bisa upload file lain.
- URL `'/storage/' + att.path` - karena sudah `storage:link`, file di `storage/app/public` accessible via `public/storage`. Catatan: lebih aman pakai `route` khusus untuk download dengan otorisasi, bukan URL publik langsung.
:::

## Helper Format Size

Format byte jadi readable:

```js
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return bytes.toFixed(1) + ' ' + units[i]
}
```

::: details Penjelasan Kode
- Algoritma konversi byte ke unit yang lebih besar (B -> KB -> MB -> GB). Loop while membagi `bytes` dengan 1024 selama masih >= 1024 dan belum capai unit terakhir (`GB`).
- `i++` - lanjut ke unit berikutnya (0 = B, 1 = KB, dst).
- `toFixed(1)` - pembulatan ke 1 desimal (mis. `12.3 MB`). Lebih readable dari angka mentah `12345678`.
:::

## Validasi di Controller

```php
$request->validate([
    'file' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf,doc,docx,zip'],
]);
```

Error validasi otomatis muncul di `form.errors.file`.

::: details Penjelasan Kode
- `mimes:jpg,jpeg,png,...` - whitelist ekstensi. Laravel sebenarnya memvalidasi berdasarkan MIME type yang dipetakan dari ekstensi (lebih longgar dari `mime_types` yang cek MIME sebenarnya). Kombinasi `file` + `max` + `mimes` = batasan lengkap.
- Error dari validate dikirim balik ke session, Inertia tanie ke `form.errors.file`. Frontend cukup render `&lt;span v-if="form.errors.file">` untuk tampilkan.
:::

## Hapus Lampiran

```vue
<Link
  :href="route('attachments.destroy', att.id)"
  method="delete"
  as="button"
  class="text-red-600 text-xs"
  preserve-scroll
>
  Hapus
</Link>
```

::: details Penjelasan Kode
- `method="delete"` - HTTP DELETE untuk hapus resource. Lebih RESTful dibanding POST ke endpoint hapus.
- `as="button"` - render sebagai tombol, bukan link, karena semantiknya aksi (bukan navigasi).
- `preserve-scroll` - properti khusus `&lt;Link>` Inertia (kebab-case) untuk jaga posisi scroll setelah hapus. Berguna saat ada banyak lampiran agar user tidak kehilangan posisi.
:::

## Multiple File Upload (Optional)

Untuk upload banyak file sekaligus:

```vue
<script setup>
const form = useForm({ files: [] })

function onFilesChange(e) {
  form.files = Array.from(e.target.files)
}

function upload() {
  form.post(route(/* ... */), {
    forceFormData: true,
    preserveScroll: true,
  })
}
</script>

<template>
  <input type="file" multiple @change="onFilesChange" />
</template>
```

::: details Penjelasan Kode
- `multiple` - atribut HTML untuk input file agar boleh pilih banyak file.
- `e.target.files` - `FileList` (bukan array asli). `Array.from(...)` mengubahnya menjadi array proper agar bisa di-iterate maupun dikirim Inertia sebagai multiple field.
- Inertia otomatis serialize array `files` sebagai `files[0]`, `files[1]`, dst - format yang dikenali Laravel validator untuk aturan `array`.
:::

Controller:

```php
$request->validate([
    'files'   => ['required', 'array', 'max:10'],
    'files.*' => ['file', 'max:5120'],
]);

foreach ($request->file('files') as $file) {
    // ... store setiap file
}
```

::: details Penjelasan Kode
- `'files' => ['required', 'array', 'max:10']` - validasi parent: harus ada, harus array, maks 10 elemen.
- `'files.*' => ['file', 'max:5120']` - wildcard `files.*` menerapkan validasi ke setiap elemen array. Laravel otomatis iterasi dan kumpulkan error per index (`files.0`, `files.1`, dst).
- `foreach ($request->file('files') as $file)` - iterasi file di server. Untuk performa, gunakan job queue jika file besar (upload disinkron, processing resize async).
:::

## Selanjutnya

Upload siap. Lanjut ke [24.9 - Komentar pada Task](/bagian-6/bab-24/24-9-komentar-task).
