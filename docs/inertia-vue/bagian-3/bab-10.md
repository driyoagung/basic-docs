---
title: Bab 10 — Form & Validasi — Pengganti Form Request Blade
---

# Bab 10: Form & Validasi — Pengganti Form Request Blade

:::info Bagian III — Vue di Konteks Inertia
`useForm()` adalah API paling powerful di Inertia — gabungan state, submit, dan tracking error dalam satu objek reaktif.
:::

## 10.1 Cara Lama vs Cara Inertia

```text
Blade (dulu):
<form method="POST"> @csrf → Controller → validate() → redirect()->back()->withErrors()
→ Blade tampilkan @error('field')

Inertia (sekarang):
useForm() → submit → Controller validate() → Inertia otomatis kembalikan errors → tampil di Vue via form.errors
```

Yang **tidak berubah**:

- Validasi tetap di controller (`$request->validate([...])`).
- FormRequest class tetap bekerja.
- CSRF token tetap otomatis dilampirkan.

Yang berubah: kamu tidak perlu menulis `@csrf` di Vue — Inertia handle otomatis.

## 10.2 `useForm()` — Senjata Utama

```js
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const form = useForm({
  title: '',
  body: '',
  status: 'draft',
})

function submit() {
  form.post(route('posts.store'), {
    preserveScroll: true,
    onSuccess: () => form.reset(),
  })
}
```

::: details Penjelasan Kode
- `import { useForm } from '@inertiajs/vue3'` — helper Inertia yang membuat objek form reaktif. Sudah menyediakan tracking `errors`, `processing`, `isDirty`, dll. tanpa boilerplate manual.
- `useForm({ title: '', body: '', status: 'draft' })` — definisikan field & nilai awal. Setiap key jadi properti reaktif (`form.title`, dll.) yang dapat langsung di-bind ke `v-model`.
- `form.post(url, options)` — shortcut submit POST. Inertia melampirkan CSRF token, mengirim body (semua field objek form), dan mengirim error laganggarlar otomatis ke `form.errors`.
- `preserveScroll: true` — setelah submit sukses, jaga posisi scroll (UX oke saat form di bagian bawah halaman).
- `onSuccess: () => form.reset()` — bila server kembalikan 2xx, kembalikan semua field ke nilai awal snapshot. Ideal agar form kosong siap diisi lagi.
:::

Object `form` punya properti reaktif:

| Prop | Kegunaan |
| --- | --- |
| `form.title` | Nilai field (di-bind ke `v-model`) |
| `form.errors` | Object error per field (`{ title: ['required'] }`) |
| `form.processing` | `true` saat request berjalan |
| `form.isDirty` | `true` jika ada perubahan belum disimpan |
| `form.wasSuccessful` | `true` jika request sukses terakhir |
| `form.recentlySuccessful` | `true` jika sukses dalam 2 detik terakhir |
| `form.hasErrors` | `true` jika ada error |
| `form.progress` | Object progress saat upload file |

## 10.3 Binding Form ke Input

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const form = useForm({
  title: '',
  body: '',
  status: 'draft',
  tags: [],
})

function submit() {
  form.post(route('posts.store'), { preserveScroll: true })
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label for="title">Judul</label>
      <input id="title" v-model="form.title" type="text" class="input" />
      <span v-if="form.errors.title" class="text-red-600">{{ form.errors.title }}</span>
    </div>

    <div>
      <label for="body">Isi</label>
      <textarea id="body" v-model="form.body" class="input" />
      <span v-if="form.errors.body" class="text-red-600">{{ form.errors.body }}</span>
    </div>

    <div>
      <label for="status">Status</label>
      <select id="status" v-model="form.status">
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </div>

    <div>
      <label>Tags</label>
      <label><input type="checkbox" v-model="form.tags" value="vue" /> Vue</label>
      <label><input type="checkbox" v-model="form.tags" value="laravel" /> Laravel</label>
    </div>

    <button type="submit" :disabled="form.processing" class="btn-primary">
      {{ form.processing ? 'Menyimpan...' : 'Simpan' }}
    </button>
  </form>
</template>
```

::: details Penjelasan Kode
- `useForm({ title: '', body: '', status: 'draft', tags: [] })` — definisi form. `tags: []` untuk input checkbox berganda (multi-select via array).
- `form.post(route('posts.store'), { preserveScroll: true })` — kirim POST ke route `posts.store`. Inertia otomatis mengirim seluruh field form sebagai body.
- `@submit.prevent="submit"` — hook submit form. `.prevent` sama dengan `e.preventDefault()` agar tidak reload halaman (browser default).
- `v-model="form.title"` — two-way binding antara input dan field form. Saat user mengetik, `form.title` berubah, dan sebaliknya.
- `&lt;span v-if="form.errors.title">&#123;&#123; form.errors.title &#125;&#125;&lt;/span>` — tampilkan pesan error jika ada. Inertia otomatis mengisi `form.errors` saat server kembalikan 422. Tidak perlu `@error` seperti Blade.
- `v-model="form.tags"` + beberapa `value="vue"`/`value="laravel"` — Vue otomatis menambah/hapus value dari array `form.tags` saat checkbox di-toggle. Fitur `v-model` untuk checkbox group.
- `:disabled="form.processing"` — nonaktifkan tombol saat request berjalan, mencegah double-submit.
- `&#123;&#123; form.processing ? 'Menyimpan...' : 'Simpan' &#125;&#125;` — feedback visual pengganti loading spinner. Karena `form.processing` reaktif, label berubah otomatis.
:::

## 10.4 Submit Form

Empat method shortcut:

```js
form.post(route('posts.store'))        // POST
form.put(route('posts.update', id))    // PUT
form.patch(route('posts.update', id))  // PATCH
form.delete(route('posts.destroy', id))// DELETE
```

Submit dengan opsi:

```js
form.post(route('posts.store'), {
  preserveScroll: true,
  preserveState: true,
  replace: false,
  only: [],
  onSuccess: (page) => {
    console.log('Sukses!', page.props.flash)
  },
  onError: (errors) => {
    console.log('Ada validation error', errors)
  },
  onFinish: () => {
    // dipanggil baik sukses/error
  },
})
```

::: details Penjelasan Kode
- `preserveScroll: true` — pertahankan scroll. Untuk form yang panjang, user tidak ke-reset ke atas setelah submit.
- `preserveState: true` — pertahankan state komponen. Berguna saat ingin komponen tidak re-create (mis. pertahankan focus input tertentu).
- `replace: false` — bila `true`, tidak menambah entri history (POST/PUT biasanya tidak perlu tetap di URL tujuan, jadi `replace: true` sering dipakai).
- `only: []` — partial reload. Setelah submit, server bisa kirim ulang hanya props tertentu (mis. `only: ['posts']`) agar hemat bandwidth — namun pada submit biasanya penuh.
- `onSuccess(page)` — callback sukses. `page` adalah objek Inertia page (`{ component, props, url, ... }`). Contoh: akses flash via `page.props.flash`.
- `onError(errors)` — validation error (status 422). `errors` berbentuk `{ field: ['pesan error'] }` secara otomatis dari Laravel.
- `onFinish` — selalu dipanggil baik sukses maupun gagal. Lokasi ideal untuk hide loader/processing state.
:::

## 10.5 State Bawaan `useForm()

```js
console.log(form.processing)        // false (saat idle)
console.log(form.errors)            // {} (saat belum ada error)
console.log(form.isDirty)           // false (saat tidak ada perubahan)
console.log(form.wasSuccessful)    // false (saat belum pernah sukses submit)
console.log(form.recentlySuccessful)// false (saat belum sukses dalam 2s terakhir)
console.log(form.hasErrors)         // false
```

::: details Penjelasan Kode
- `form.processing` — `true` hanya saat request sedang berjalan. Cocok untuk disable tombol submit & menampilkan loading state. Otomatis `false` saat selesai.
- `form.errors` — objek error per field. Saat belum ada error, isinya `{}`. Saat server kembalikan 422, Inertia otomatis mengisi: `{ title: ['Judul wajib diisi'] }`.
- `form.isDirty` — `true` bila ada field yang belum disimpan (berubah dari snapshot initial). Berguna untuk warning "Anda punya perubahan belum tersimpan".
- `form.wasSuccessful` — `true` bila request terakhir berhasil. Tetap `true` sampai submit berikutnya.
- `form.recentlySuccessful` — `true` hanya dalam 2 detik setelah sukses. Sering dipakai untuk indikator "Tersimpan!" yang muncul sebentar lalu hilang otomatis.
- `form.hasErrors` — boolean ringkas `Object.keys(form.errors).length > 0`. Berguna untuk disable tombol atau tampilkan banner error.
:::

Timpa konstanta `wasSuccessful` agar retry tombol tetap visible:

```vue
<button :disabled="form.processing">
  {{ form.processing ? 'Menyimpan...' : 'Simpan' }}
</button>
<span v-if="form.recentlySuccessful" class="text-green-600">Tersimpan!</span>
```

::: details Penjelasan Kode
- `:disabled="form.processing"` — saat request berjalan, tombol nonaktif mencegah klik dobel yang bisa mengirim POST dua kali.
- `&#123;&#123; form.processing ? 'Menyimpan...' : 'Simpan' &#125;&#125;` — label berubah otomatis karena `form.processing` reaktif. Alternatif spinner: tambahkan SVG loading di samping teks.
- `form.recentlySuccessful` — flag `true` hanya dalam 2 detik setelah sukses. Cocok untuk toast ephemeral "Tersimpan!" — muncul, lalu otomatis hilang tanpa perlu `setTimeout` manual.
:::

## 10.6 Validasi di Controller — Tidak Berubah

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'title' => ['required', 'string', 'max:255'],
        'body'  => ['required', 'string', 'min:20'],
        'status'=> ['required', 'in:draft,published'],
        'tags'  => ['array'],
        'tags.*'=> ['exists:tags,id'],
    ]);

    $post = Post::create($validated);
    $post->tags()->sync($request->tags);

    return redirect()->route('posts.show', $post)->with('success', 'Post dibuat');
}
```

::: details Penjelasan Kode
- `$request->validate([...])` — validasi inline. Laravel otomatis mengembalikan 422 + error bila gagal, dan melanjutkan ke baris berikutnya bila sukses.
- `'title' => ['required', 'string', 'max:255']` — tiap field berupa array rules. Field wajib, harus string, maks 255 karakter.
- `'tags.*' => ['exists:tags,id']` — wildcard `tags.*` memvalidasi setiap elemen array `tags` individually. Memastikan setiap id tag benar-benar ada di tabel `tags`.
- `Post::create($validated)` — mass assignment. Pastikan `$fillable` di model mendaftarkan kolom yang diizinkan (`title`, `body`, `status`).
- `$post->tags()->sync($request->tags)` — relasi many-to-many. `sync` menggantikan seluruh tag terkait dengan array baru: menambah yang baru, menghapus yang tidak ada lagi.
- `redirect()->route(...)->with('success', ...)` — redirect standar Laravel. Inertia akan menangkap redirect ini, mengambil data flash baru, lalu mengirimkannya ke client sebagai props `flash`.
:::

Saat validasi gagal:

1. Laravel lempar `ValidationException`.
2. Inertia intercept (tidak redirect `back()`).
3. Server kirim props `errors` ke client.
4. `form.errors` otomatis berisi error per field.

:::warning Jangan pakai `withErrors` di Inertia
Di Blade, validasi error di-flush ke session. Di Inertia, error dikirim sebagai props langsung — tidak ada flash. Tidak perlu `withInput()` atau `withErrors()` di controller.
:::

Pakai Form Request class — tetap bekerja:

```php
public function store(StorePostRequest $request)
{
    $post = Post::create($request->validated());
    /* ... */
}
```

## 10.7 Form untuk Update (Pre-fill Data)

```js
const props = defineProps({ post: Object })

const form = useForm({
  title: props.post.title,
  body: props.post.body,
  status: props.post.status,
})

// submit update
form.put(route('posts.update', props.post.id), { preserveScroll: true })
```

::: details Penjelasan Kode
- `useForm({ title: props.post.title, ... })` — pre-fill dengan data dari props. Inertia mengirim `post` dari controller, lalu field form langsung berisi nilai awal yang sudah benar — siap untuk diedit.
- `props.post.title` — props bersifat reaktif di sisi penerima, tapi perhatikan: snapshot initial `useForm` hanya mengambil nilai **saat pemanggilan**. Bila `props.post` berubah setelahnya, nilai form tidak ikut otomatis.
- `form.put(route('posts.update', props.post.id), ...)` — PUT/PATCH untuk resource update. URL yang benar mengandung id (`/posts/{id}`).
- `preserveScroll: true` — agar user tetap pada bagian form setelah server merespon (UX konsisten).
:::

:::tip Snapshot terpisah
`useForm` menyimpan "initial state" sebagai snapshot. `form.reset()` akan kembalikan ke nilai awal — yaitu nilai saat `useForm` dipanggil.
:::

## 10.8 Reset & Transform Form

### Reset

```js
form.reset()                  // reset semua field ke initial
form.reset('title')           // reset satu field
form.reset('title', 'body')   // reset beberapa field
```

### Clear errors

```js
form.clearErrors()
form.clearErrors('title')
```

### Transform sebelum submit

```js
form.transform((data) => ({
  ...data,
  slug: slugify(data.title),
  status: data.status ?? 'draft',
})).post(route('posts.store'))
```

::: details Penjelasan Kode
- `form.transform((data) => ({ ... }))` — mengubah payload **sebelum dikirim** ke server. Data form internal tidak berubah, hanya body request yang ditransform.
- `...data` — sebar semua field awal, lalu override/tambah field baru di belakangnya.
- `slug: slugify(data.title)` — tambahkan field turunan (slug) yang dihitung dari title. Berguna saat server tidak ingin menerima title lalu mengolahnya sendiri.
- `status: data.status ?? 'draft'` — default value bila `status` kosong/null (skenario user tidak memilih). Mengoperasi `null` coalescing di sisi client, menghemat validasi server.
- `form.reset()` — mengembalikan field ke snapshot awal. Berguna setelah submit sukses untuk form-create.
- `form.defaults('title', 'Untitled')` — mengubah snapshot initial agar `reset` kemudian kembali ke `Untitled` (bukan `''`).
:::

### Set manual error

```js
form.setError('title', 'Judul sudah digunakan')
form.setError({ title: 'X', body: 'Y' })
```

### Set default value berbeda

```js
form.defaults('title', 'Untitled').reset('title')
form.defaults({ title: '', body: '' }).reset()
```

## 10.9 Komponen Form Reusable

Pola yang dipakai Laravel Breeze:

```vue
<!-- Components/Form/TextInput.vue -->
<script setup>
defineProps({
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  error: String,
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div>
    <input
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="block w-full rounded-md border-gray-300"
      :class="{ 'border-red-500': error }"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
```

::: details Penjelasan Kode
- `defineProps({ modelValue, type, error })` — komponen reusable dengan `modelValue` adalah kontrak `v-model` Vue 3 (default prop untuk `v-model`).
- `defineEmits(['update:modelValue'])` —- menyatakan komponen memancarkan event `update:modelValue`, dipakai `v-model` untuk two-way binding.
- `:value="modelValue"` — satu arah (parent → child); prop `modelValue` jadi nilai awal input.
- `@input="$emit('update:modelValue', $event.target.value)"` — saat input berubah, pancarkan event dengan nilai baru → prop di parent ikut berubah karena `v-model` menangkapnya.
- `:class="{ 'border-red-500': error }"` — class dinamis: bila ada error, border merah. Komunikasi error visual tanpa style hardcode.
- `&lt;p v-if="error">&#123;&#123; error &#125;&#125;&lt;/p>` — tampilkan pesan error di bawah input. Komponen "bodoh" yang hanya tampil display, logic error ada di parent.
:::

```vue
<!-- Components/Form/InputError.vue -->
<script setup>
defineProps({ message: String })
</script>

<template>
  <p v-if="message" class="mt-1 text-sm text-red-600">{{ message }}</p>
</template>
```

```vue
<!-- Components/Form/PrimaryButton.vue -->
<script setup>
defineProps({ disabled: Boolean, processing: Boolean })
</script>

<template>
  <button
    :disabled="disabled || processing"
    class="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
  >
    <slot />
  </button>
</template>
```

Pakai:

```vue
<script setup>
import TextInput from '@/Components/Form/TextInput.vue'
import InputError from '@/Components/Form/InputError.vue'
import PrimaryButton from '@/Components/Form/PrimaryButton.vue'
import { useForm } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const form = useForm({ title: '', body: '' })
</script>

<template>
  <form @submit.prevent="form.post(route('posts.store'))">
    <TextInput v-model="form.title" :error="form.errors.title" />
    <InputError :message="form.errors.title" />

    <textarea v-model="form.body" />
    <InputError :message="form.errors.body" />

    <PrimaryButton :processing="form.processing">Simpan</PrimaryButton>
  </form>
</template>
```

::: details Penjelasan Kode
- `import TextInput from '@/Components/Form/TextInput.vue'` — alias `@` biasanya menunjuk `resources/js/`. Cek `vite.config.js` / `jsconfig.json`.
- `&lt;TextInput v-model="form.title" :error="form.errors.title" />` — `v-model` memakai kontrak `modelValue`/`update:modelValue`. `form.errors.title` diteruskan sebagai prop `error` agar component tahu kapan tampilkan pesan merah.
- `&lt;InputError :message="form.errors.body" />` — versi terpisah jika ingin pesan error tampil tanpa TextField (mis. di textarea yang buatan sendiri).
- `&lt;PrimaryButton :processing="form.processing">Simpan&lt;/PrimaryButton>` — prop `processing` untuk men-set `disabled`. Slot default (`&lt;slot />`) membuat label fleksibel.
- `@submit.prevent="form.post(route('posts.store'))"` — sangat ringkas: panggil method form langsung. Inertia menangani default behaviour (background request, error handling).
- Pola komponen reusable seperti di Laravel Breeze membuat setiap entri field identik & mudah dirawat.
:::

## 10.10 Multiple Error Bag

Untuk multi-form di satu page, gunakan error bag:

```js
form.post(route('posts.store'), { errorBag: 'createPost' })
```

Di template, akses error spec:

```js
import { usePage } from '@inertiajs/vue3'

const page = usePage()
const createPostErrors = computed(() => page.props.errors?.createPost ?? {})
```

::: details Penjelasan Kode
- `form.post(url, { errorBag: 'createPost' })` — minta Inertia menyimpan error di dalam kelompok bernama `createPost` alih-alih langsung di atas (`form.errors`). Berguna bila satu halaman punya beberapa form dengan field name sama (mis. dua form sama-sama punya `title`).
- `usePage()` — composable Inertia untuk akses halaman reaktif (`page.props`, `page.url`, dll.). `page.props` selalu reaktif ke data server terbaru.
- `page.props.errors?.createPost ?? {}` — dengan optional chaining, bila `errors` kosong → kembalikan `{}` agar akses `.title` di template tidak crash. `computed` memastikan re-evaluasi bila props berubah.
- Saat pakai errorBag, `form.errors` tetap menerima error hanya bila nama bag cocok — sehingga form lain di halaman tidak ke-contaminasi error form ini.
:::

## 10.11 Pola: Submit via `router` tanpa `useForm

Untuk form sederhana, bisa pakai `router` langsung:

```js
import { router } from '@inertiajs/vue3'
import { reactive } from 'vue'

const form = reactive({ title: '' })

function submit() {
  router.post(route('posts.store'), form, {
    onError: (errors) => console.log(errors),
  })
}
```

::: details Penjelasan Kode
- `const form = reactive({ title: '' })` — objek reaktif biasa untuk form sederhana. Tidak punya tracking `processing`/`errors`/`isDirty` seperti `useForm`.
- `router.post(url, form, options)` — kirim body ke server. Body adalah plain object (sudah reaktif, tapi Inertia hanya mengirimkan snapshot saat submit).
- `onError` — manual handle error. Karena tidak ada `form.errors`, kamu harus kelola sendiri (mis. buat `ref({})` lalu assign errors di callback).
- Trade-off: pendekatan ini lebih ringkas tapi kehilangan helper form yang menjadi keunggulan utama Inertia. Use `useForm()` kecuali form benar-benar sangat sederhana.
:::

Tapi kamu kehilangan `processing`, `errors`, `isDirty` — sehingga `useForm` tetap lebih produktif.

## 10.12 Ringkasan Bab

- `useForm(fieldMap)` → stateful object reaktif dengan `errors`, `processing`, `isDirty`.
- Submit via `form.post / put / patch / delete (url, options)`.
- Validasi tetap di controller pakai `$request->validate()` atau FormRequest.
- Error otomatis muncul di `form.errors.<field>`.
- `form.reset()`, `form.transform()`, `form.defaults()` untuk operasi.
- Buat komponen reusable: `TextInput`, `InputError`, `PrimaryButton`.

:::tip Selanjutnya
Masuk ke [Bagian IV — Fitur Lanjutan](/bagian-4/bab-11). Mulai dengan **Shared Data** global — pengganti `View::share()` Blade.
:::
