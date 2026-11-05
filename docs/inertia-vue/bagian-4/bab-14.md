---
title: Bab 14 — File Upload dengan Inertia
---

# Bab 14: File Upload dengan Inertia

:::info Bagian IV — Fitur Lanjutan Inertia
Upload file di Inertia tetap pakai `useForm()` — tongkat penting: `forceFormData: true` agar Inertia kirim `multipart/form-data`.
:::

## 14.1 Upload File dengan `useForm()

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const form = useForm({
  title: '',
  thumbnail: null,
})

function submit() {
  form.post(route('posts.store'), {
    forceFormData: true,
    preserveScroll: true,
    onSuccess: () => form.reset(),
  })
}

function onFileChange(e) {
  const file = e.target.files[0]
  form.thumbnail = file
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label>Judul</label>
      <input v-model="form.title" type="text" />
      <span v-if="form.errors.title" class="text-red-600">{{ form.errors.title }}</span>
    </div>

    <div>
      <label>Thumbnail</label>
      <input type="file" @change="onFileChange" accept="image/*" />
      <span v-if="form.errors.thumbnail" class="text-red-600">{{ form.errors.thumbnail }}</span>
    </div>

    <button type="submit" :disabled="form.processing">Upload</button>
  </form>
</template>
```

::: details Penjelasan Kode
- `useForm({ title: '', thumbnail: null })` — inisialisasi state. Untuk field file, awali `null` (belum ada file dipilih). Pastikan bukan string kosong karena akan dianggap text biasa.
- `form.post(route('posts.store'), { forceFormData: true, ... })` — `forceFormData: true` **wajib** saat ada file. Tanpa opsi ini, Inertia kirim JSON dan file tidak ter-serialize → server `$request->file('thumbnail')` null.
- `preserveScroll: true` — setelah submit sukses, scroll tetap di posisi user. Untuk upload biasanya di-submit di bagian head, default scroll ke atas bisa mengganggu.
- `onSuccess: () => form.reset()` — reset semua field ke initial value setelah upload berhasil. Field `thumbnail` kembali `null`, `title` kembali `''` — form siap pakai lagi.
- `@change="onFileChange"` — input file tidak pakai `v-model` (Vue tidak mendukung v-model langsung untuk input file). Event change kemudian menarik `e.target.files[0]` (objek `File` dari File API browser) dan pidahkan ke `form.thumbnail`.
- `e.target.files[0]` — `files` adalah `FileList`; ambil file pertama. Untuk multiple file, iterate `Array.from(e.target.files)`.
- `accept="image/*"` — filter dialog file OS hanya tampilkan gambar. Hanya hint UX, bukan validasi (user bisa override).
- `:disabled="form.processing"` — `form.processing` true saat request in-flight, mencegah submit berulang.
:::

## 14.2 Kenapa `forceFormData: true`?

Default, Inertia mengirim body sebagai JSON. Tapi **file tidak bisa di-serialize ke JSON** — harus multipart/form-data. `forceFormData: true` paksa Inertia menggunakan FormData:

```js
form.post(url, { forceFormData: true })
```

Tanpa opsi ini, kamu akan mendapat error di server: `$request->file('thumbnail')` = null.

## 14.3 Validasi File di Controller

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'title'     => ['required', 'string', 'max:255'],
        'thumbnail' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
    ]);

    $path = $request->file('thumbnail')->store('thumbnails', 'public');
    $validated['thumbnail_path'] = $path;

    Post::create($validated);

    return redirect()->route('posts.index')->with('success', 'Post dibuat');
}
```

::: details Penjelasan Kode
- `'image'` rule — Laravel cek apakah file adalah gambar valid (PHP `getimagesize()`). Tidak cukup ekstensi: file `.jpg` yang ternyata text akan ditolak.
- `'mimes:jpg,jpeg,png,webp'` — whitelist ekstensi/ MIME type. Lebih ketat dari `image` saja.
- `'max:2048'` — maks 2048 **KB** = 2 MB untuk rule file. Untuk non-file, satuan KB juga (atau bisa numeric).
- `$request->file('thumbnail')->store('thumbnails', 'public')` — panggilan `store(direktori, disk)`. Disk `public` = `storage/app/public`. Mengembalikan path relatif seperti `thumbnails/abc123.jpg` (nama file random hash).
- `$validated['thumbnail_path'] = $path` — tambah field ke array validated sebelum mass-assign. Pastikan `thumbnail_path` ada di `$fillable` model. Hapus key `thumbnail` otomatis via `unset` jika tidak ingin kolom itu di mass-assign.
- `Post::create($validated)` — mass assignment dengan signature `fillable`.
:::

Error validasi file otomatis muncul di `form.errors.thumbnail` — detail di [Bab 10](/bagian-3/bab-10).

## 14.4 Progress Upload

`form.progress` tersedia saat Inertia mendeteksi upload:

```js
{
  percentage: 42,
  total: 1048576,
  loaded: 440000,
  // ...
}
```

Tampilkan progress bar:

```vue
<template>
  <form @submit.prevent="submit">
    <!-- fields -->
    <div v-if="form.progress" class="mt-2">
      <div class="bg-gray-200 rounded h-2 overflow-hidden">
        <div
          class="bg-blue-600 h-2 transition-all"
          :style="{ width: `${form.progress.percentage}%` }"
        />
      </div>
      <p class="text-xs text-gray-500 mt-1">{{ form.progress.percentage }}%</p>
    </div>

    <button type="submit" :disabled="form.processing">
      {{ form.processing ? 'Uploading...' : 'Upload' }}
    </button>
  </form>
</template>
```

::: details Penjelasan Kode
- `form.progress` — objek yang diisi Inertia secara real-time saat upload via `XMLHttpRequest` dengan `upload.onprogress`. Bernilai `null` saat tidak ada upload in-flight.
- `form.progress.percentage` — integer 0—100. Inertia menghitung dari `loaded / total`.
- `:style="{ width: \`${form.progress.percentage}%\` }"` — inline style binding. Lebar bar diupdate dinamis sesuai persentase.
- `class="transition-all"` — tailwind: transisi CSS untuk semua property sehingga bar tampil smooth (bukan lompat diskret).
- `:disabled="form.processing"` — saat `processing` true, tombol nonaktif; label berubah tex "Uploading..." untuk feedback UX.
:::

## 14.5 Multiple File Upload

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const form = useForm({
  title: '',
  photos: [], // array of File
})

function onFilesChange(e) {
  form.photos = Array.from(e.target.files)
}

function submit() {
  form.post(route('galleries.store'), { forceFormData: true })
}
</script>

<template>
  <input type="file" multiple accept="image/*" @change="onFilesChange" />

  <ul v-if="form.photos.length">
    <li v-for="(file, i) in form.photos" :key="i">{{ file.name }} - {{ file.size }} bytes</li>
  </ul>
</template>
```

::: details Penjelasan Kode
- `photos: []` — inisialisasi sebagai **array kosong**, bukan `null`. Multiple file perlu array.
- `Array.from(e.target.files)` — `e.target.files` adalah `FileList` (bukan array), harus di-convert ke Array agar bisa di-iterate pakai `v-for` reactive Vue.
- `multiple` attribute HTML — izinkan pilih banyak file di file dialog.
- Inertia otomatis serialize array File sebagai multiple entry FormData (`photos[0]=...`, `photos[1]=...`). Validasi Laravel `array` + `photos.*` mendukung ini.
- `:key="i"` — key unik untuk list. Untuk file sebaiknya pakai `file.name + file.size` karena index bisa tetap sama saat array dihapus tengah.
:::

Controller:

```php
$validated = $request->validate([
    'title'  => ['required', 'string'],
    'photos' => ['required', 'array', 'max:10'],
    'photos.*' => ['image', 'mimes:jpg,png,webp', 'max:2048'],
]);

foreach ($request->file('photos') as $file) {
    $path = $file->store('gallery', 'public');
    Photo::create(['post_id' => $post->id, 'path' => $path]);
}
```

::: details Penjelasan Kode
- `'photos' => ['required', 'array', 'max:10']` — validasi bahwa input `photos` adalah array (jenis FormData multi-upload), maksimal 10 item.
- `'photos.*'` — wildcard validation: rule ini diterapkan ke setiap elemen pada array `photos`. Laravel otomatis iterasi.
- `foreach ($request->file('photos') as $file)` — Laravel parse multiple file upload menjadi collection `UploadedFile`. Loop simpan satu-per-satu. Untuk performa lebih baik, gunakan job queue agar tidak blocking.
:::

## 14.6 Drag & Drop Zone

Komponen reusable:

```vue
<!-- Components/Form/FileDrop.vue -->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: [File, Array],
  multiple: Boolean,
  accept: String,
})
const emit = defineEmits(['update:modelValue'])

const dragging = ref(false)
const inputRef = ref(null)

function onDrop(e) {
  e.preventDefault()
  dragging.value = false
  const files = Array.from(e.dataTransfer.files)
  emit('update:modelValue', props.multiple ? files : files[0])
}

function onInput(e) {
  const files = Array.from(e.target.files)
  emit('update:modelValue', props.multiple ? files : files[0])
}
</script>

<template>
  <div
    @drop="onDrop"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @click="inputRef?.click()"
    :class="dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
    class="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center"
  >
    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :multiple="multiple"
      :accept="accept"
      @change="onInput"
    />
    <p v-if="!modelValue || (Array.isArray(modelValue) && !modelValue.length)">
      Tarik file ke sini atau klik untuk pilih
    </p>
    <ul v-else-if="Array.isArray(modelValue)">
      <li v-for="(f, i) in modelValue" :key="i">{{ f.name }}</li>
    </ul>
    <span v-else>{{ modelValue.name }}</span>
  </div>
</template>
```

::: details Penjelasan Kode
- `defineProps({ modelValue: [File, Array], ... })` — `modelValue` standar Vue 3 untuk `v-model`. Tipe bisa File (single) atau Array (multiple).
- `defineEmits(['update:modelValue'])` — emit event standar `update:modelValue` agar komponen ini bisa dipakai dengan `v-model` (mis.`&lt;FileDrop v-model="form.thumbnail" />`).
- `@dragover.prevent` — `.prevent` wajib: tanpa `preventDefault`, browser akan navigate ke file yang di-drop (open file). Hanya dragover yang diizinkan prevent default.
- `@dragleave.prevent` — saat kursor keluar zone, set `dragging=false` agar style balik normal.
- `@drop="onDrop"` — saat user release mouse. Wajib `e.preventDefault()` di handler karena beberapa browser masih interpret drop sebagai navigasi.
- `inputRef?.click()` — programmatically trigger klik pada `&lt;input>` tersembunyi. Optional chaining aman saat ref belum ter-attach.
- `&lt;input class="hidden" />` — sembunyikan input asli; input tetap di DOM agar form bisa submit file. Kita hanya "mempercantik" UI dengan div wrapper.
- `Array.isArray(modelValue)` — cek tipe untuk render yang sesuai (single file = `&lt;span>`, multi = `&lt;ul>`).
:::

Pakai:

```vue
<FileDrop v-model="form.thumbnail" accept="image/*" />
<FileDrop v-model="form.photos" multiple accept="image/*" />
```

## 14.7 Preview Gambar Sebelum Upload

```vue
<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ file: File })
const preview = ref('')

watch(() => props.file, (file) => {
  if (file && file.type.startsWith('image/')) {
    preview.value = URL.createObjectURL(file)
  } else {
    preview.value = ''
  }
})
</script>

<template>
  <img v-if="preview" :src="preview" class="h-32 w-32 object-cover rounded" />
</template>
```

::: details Penjelasan Kode
- `URL.createObjectURL(file)` — buat URL `blob:` sementara dari objek `File`. URL ini valid selama document hidup / sampai `revokeObjectURL` dipanggil. Lebih cepat daripada `FileReader.readAsDataURL` (base64 karena tidak perlu encode).
- `file.type.startsWith('image/')` — cek MIME type agar hanya file gambar yang di-preview. File non-image (PDF, video) tidak akan jadi `&lt;img>` yang berarti.
- `watch(() => props.file, ...)` — reaksi setiap file diganti. Tanpa watch, preview tetap gambar lama meski user pilih file baru.
:::

:::warning Cleanup `URL.createObjectURL`
Saat file diganti / komponen di-unmount, revoke URL untuk hindari memory leak:
```js
onUnmounted(() => URL.revokeObjectURL(preview.value))
```
:::

## 14.8 Upload Avatar / Profile Picture

Pola umum:

```php
public function updateAvatar(Request $request)
{
    $validated = $request->validate([
        'avatar' => ['required', 'image', 'max:1024'],
    ]);

    $path = $request->file('avatar')->store('avatars', 'public');
    Auth::user()->update(['avatar_path' => $path]);

    return redirect()->back()->with('success', 'Avatar diperbarui');
}
```

Vue:

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import FileDrop from '@/Components/Form/FileDrop.vue'

const form = useForm({ avatar: null })

function submit() {
  form.post(route('profile.avatar.update'), { forceFormData: true })
}
</script>
```

::: details Penjelasan Kode
- `redirect()->back()` — kembali ke URL sebelumnya. Setelah avatar update, server re-render halaman profil yang sama (Inertia akan mengirim `auth.user` baru via shared data).
- `'avatar' => ['required', 'image', 'max:1024']` — batas 1 MB, cukup untuk foto profil.
- Jika user update avatar berulang, pertimbangkan hapus file avatar lama di storage untuk hindari orphan files (`Storage::disk('public')->delete($user->avatar_path)` sebelum update path baru).
:::

## 14.9 Limitasi & Validasi Server

Selalu validasi di server:

```php
['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:max_width=2000,max_height=2000']
```

Pastikan `php.ini` cukup besar:

- `upload_max_filesize = 10M`
- `post_max_size = 12M`

## 14.10 Storage & Visibility

- `store('folder', 'public')` → disimpan ke `storage/app/public/folder`. **Wajib** symlink ke public:
  ```bash
  php artisan storage:link
  ```
- Untuk file privat yang butuh auth: `store` di disk `local` (atau S3), generate signed URL saat download.

::: details Penjelasan Kode
- `php artisan storage:link` — buat symlink `public/storage` → `storage/app/public`. Tanpa ini, file tidak bisa diakses via URL browser. Jalankan sekali per server (cek `/.public/storage` ada).
- Untuk file sensitif (ktp, dokumen), simpan di disk `local` (nons-public) → gunakan `URL::signedRoute` untuk download ber-time-limited, atau stream response setelah cek policy.
:::

## 14.11 Upload dengan Presigned URL (Alternatif)

Untuk file besar, sering lebih efisien upload langsung ke S3 / MinIO skip Laravel:

```php
// Controller: minta presigned URL
$post = Post::create(['title' => $request->title]);
$upload = CloudStorage::presignedUrl('post-' . $post->id . '.jpg');

return Inertia::render('Posts/Upload', ['uploadUrl' => $upload]);
```

Vue: PUT file langsung ke `uploadUrl`. Backend tidak perlu handle upload.

## 14.12 Ringkasan Bab

- `useForm` tetap dipakai, tambah opsi `forceFormData: true`.
- Validasi di controller sama dengan Blade (`'image'`, `'max:2048'`).
- `form.progress.percentage` untuk progress bar.
- Multiple file: array File di form + validasi `array` + per-item.
- Drag-and-drop dan preview gambar dengan `URL.createObjectURL`.
- Wajib `php artisan storage:link` agar file public.

:::tip Selanjutnya
[Bab 15](/bagian-4/bab-15): pagination dengan Inertia — paginator format & komponen reusable.
:::
