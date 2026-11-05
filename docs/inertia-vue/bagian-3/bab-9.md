---
title: Bab 9 — Navigasi dengan Inertia — Pengganti a href dan redirect
---

# Bab 9: Navigasi dengan Inertia — Pengganti `<a>` dan `redirect()`

:::info Bagian III — Vue di Konteks Inertia
Komponen `<Link>` adalah pengganti tag `<a>`. `router` adalah pengganti `redirect()->route()`. Bab ini membahas keduanya + prefetch & loading state.
:::

## 9.1 Komponen `<Link>` — Pengganti tag `<a>`

Import dari adapter:

```js
import { Link } from '@inertiajs/vue3'
```

Penggunaan dasar:

```vue
<template>
  <Link :href="route('posts.index')">Daftar Post</Link>
</template>
```

Komponen ini **merender `<a>`** tapi di-intercept oleh Inertia — klik tidak menyebabkan full reload, melainkan XHR ke server yang menukar page component.

| Prop | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `href` | String | — | URL tujuan (wajib) |
| `method` | `'get' \| 'post' \| 'put' \| 'patch' \| 'delete'` | `'get'` | HTTP method |
| `data` | Object | `{}` | Body untuk non-GET |
| `as` | `'a' \| 'button'` | `'a'` | Tag yang dirender |
| `preserve-scroll` | Boolean | `false` | Pertahankan scroll |
| `preserve-state` | Boolean | `false` | Pertahankan state komponen |
| `replace` | Boolean | `false` | Replace history (tanpa tambah) |
| `only` | Array | `[]` | Partial reload props tertentu |
| `prefetch` | Boolean \| `'hover'` | `false` | Prefetch halaman |
| `headers` | Object | `{}` | Custom header |

Contoh:

```vue
<Link :href="route('posts.show', post.id)">Lihat</Link>
<Link :href="route('posts.create')" as="button" class="btn">+ Tambah</Link>
<Link :href="route('logout')" method="post" as="button">Logout</Link>
<Link :href="route('posts.destroy', post.id)" method="delete" as="button" @click.prevent="confirm">
  Hapus
</Link>
```

::: details Penjelasan Kode
- `Link :href="route('posts.show', post.id)"` - komponen Link Inertia tetap merender tag `a` HTML, tapi klik di-intercept (tidak reload). `route()` menghasilkan URL berdasarkan nama route Laravel.
- `as="button"` - minta Inertia render tag `button` alih-alih `a`. Berguna untuk aksi yang semantik lebih cocok button (logout, hapus) dan agar styling lebih konsisten.
- `method="post"` / `method="delete"` - di Blade, butuh form `method="POST"` + input hidden `_method=DELETE`. Inertia menyembunyikan semua itu: cukup set prop.
- `@click.prevent="confirm"` - mencegah default (`preventDefault`) agar kita bisa minta konfirmasi dulu sebelum request. Yang sebenarnya mengirim request adalah `Link` - di sini kita hanya intercept untuk validasi.
- Inertia otomatis melampirkan CSRF token (dibaca dari meta `csrf-token`) ke setiap request non-GET, jadi tidak perlu manual.
:::

## 9.2 Helper `route()` dengan Ziggy

`route()` tersedia di JavaScript berkat Ziggy (lihat [Bab 6 §6.6](/bagian-2/bab-6#_6-6-akses-url-route-di-vue-ziggy)):

```js
import { route } from 'ziggy-js'

route('posts.index')             // '/posts'
route('posts.show', 1)           // '/posts/1'
route('posts.show', { post: 1 }) // '/posts/1' (named param)
route('posts.index', { q: 'x' }) // '/posts?q=x'
route().current('posts.*')       // true jika di posts
route().current()                // nama route aktif
```

::: details Penjelasan Kode
- `route('posts.index')` — menghasilkan URL berdasarkan nama route yang didaftarkan Laravel (`Route::get('/posts', ...)->name('posts.index')`). Ziggy meneruskan daftar route ke JS via `@routes` Blade directive.
- `route('posts.show', 1)` — bila route punya parameter `{post}`, Ziggy menerima single nilai (id) dan menempatkannya secara berurutan.
- `route('posts.show', { post: 1 })` — bentuk eksplisit dengan named param. Lebih aman bila route punya banyak parameter karena tidak bergantung urutan.
- `route('posts.index', { q: 'x' })` — objek plain di argumen kedua diperlakukan sebagai query string (jika bukan nama param).
- `route().current('posts.*')` — gunakan wildcard `*` untuk cek apakah route aktif berawalan `posts.`, cocok untuk menandai menu aktif di sidebar.
- `route().current()` — mengembalikan nama route dari URL saat ini. Dipakai untuk highlighting menu atau kondisi logika berbasis halaman.
:::

Dengan parameter objek:

```js
route('projects.tasks.show', { project: 12, task: 45 })
// '/projects/12/tasks/45'
```

Query opsional:

```js
route('posts.index', { _query: { filter: 'published' } })
// '/posts?filter=published'
```

## 9.3 Navigasi Programatik dengan `router`

Untuk navigasi dari script (setelah submit, setelah confirm, dsb):

```js
import { router } from '@inertiajs/vue3'

router.visit(route('posts.index'))
router.get(route('posts.index'))
router.post(route('posts.store'), data)
router.put(route('posts.update', id), data)
router.patch(route('posts.update', id), data)
router.delete(route('posts.destroy', id))
router.replace(route('posts.index'))
router.reload()                  // reload halaman saat ini
router.reload({ only: ['posts'] }) // partial reload
```

::: details Penjelasan Kode
- `router.visit(url)` — bentuk dasar semua shortcut. Menerima opsi paling lengkap.
- `router.get / post / put / patch / delete` — shortcut yang menetapkan `method` secara otomatis sesuai nama method HTTP-nya.
- `router.get(route('posts.index'))` — GET request ke `/posts`. Untuk fetch data / navigasi read-only.
- `router.post(route('posts.store'), data)` — kirim body ekstra tanpa bikin `&lt;form>`. Cocok untuk submit dengan payload terprogram.
- `router.replace(url)` — sama dengan `visit` + `replace: true`. URL baru akan **menggantikan** entri history saat ini, bukan menambah entri baru → back button tidak kembali ke URL sebelumnya.
- `router.reload()` — kembali ke URL saat ini. Berguna setelah mutasi data agar props segar.
- `router.reload({ only: ['posts'] })` — partial reload: hanya props `posts` yang diminta ulang, bukan semua. Menghemat bandwidth & render.
:::

Contoh nyata — setelah konfirmasi hapus:

```js
function destroy(postId) {
  if (!confirm('Yakin hapus post ini?')) return
  router.delete(route('posts.destroy', postId), {
    preserveScroll: true,
    onSuccess: () => console.log('Terhapus'),
  })
}
```

::: details Penjelasan Kode
- `if (!confirm('Yakin hapus post ini?')) return` — pola konfirmasi sederhana memakai dialog bawaan browser. Bila user batal, fungsi berhenti dan request tidak dikirim.
- `router.delete(route('posts.destroy', postId), {...})` — kirim DELETE request ke route yang sesuai. Inertia akan memetikscope `/posts/{post}` ke URL `/posts/123`.
- `preserveScroll: true` — penting pada list: setelah hapus & re-render, scroll posisi user tetap (tidak meloncat ke atas).
- `onSuccess: () => console.log(...)` — callback setelah server memberi respon 2xx. Lokasi yang baik untuk menutup modal, reset state, atau menampilkan toast.
:::

## 9.4 Method HTTP dari Link

Tanpa perlu form tersembunyi seperti di Blade:

```vue
<!-- Delete -->
<Link
  :href="route('posts.destroy', post.id)"
  method="delete"
  as="button"
  class="text-red-600"
>
  Hapus
</Link>

<!-- Logout -->
<Link
  :href="route('logout')"
  method="post"
  as="button"
>
  Logout
</Link>

<!-- Update via PUT -->
<Link
  :href="route('posts.update', post.id)"
  method="put"
  :data="{ status: 'published' }"
  as="button"
>
  Publish
</Link>
```

Inertia membuat form internal yang dikirim ke server — CSRF token otomatis dilampirkan (baca dari meta `csrf-token`).

::: details Penjelasan Kode
- Berbeda dengan Blade yang butuh `&lt;form method="POST">&lt;input type="hidden" name="_method" value="PUT">` untuk method non-GET, di Inertia cukup set `method="put"`.
- `:data="{ status: 'published' }"` — body request. Karena GET tidak punya body, properti `data` hanya relevan untuk POST/PUT/PATCH/DELETE.
- `as="button"` — render tag `&lt;button>` agar tidak melanggar HTML spec (tag `&lt;a>` tanpa `href` valid, tapi semantik aksi lebih pas pakai button).
- `method="delete"` untuk hapus: Laravel akan match ke `Route::delete('/posts/{post}', ...)`. Pastikan konsisten method di route & di komponen.
- Inertia membaca token dari `&lt;meta name="csrf-token" content="&#123;&#123; csrf_token() &#125;&#125;">` di layout utama lalu melampirkan header `X-CSRF-TOKEN` otomatis ke setiap request non-GET.
:::

## 9.5 Preserve State & Scroll

| Prop | Kegunaan |
| --- | --- |
| `preserve-state` | Tetap pertahankan state Vue lokal (search input, toggle) |
| `preserve-scroll` | Tetap di scroll position yang sama |

Kasus: filter dengan input search. Saat user mengetik, kamu reload data via `router.get` — tanpa `preserveState`, input akan ke-reset.

```js
router.get(
  route('posts.index'),
  { q: search.value },
  {
    preserveState: true,  // input tetap ada
    preserveScroll: true, // tidak loncat ke atas
    replace: true,        // tidak menambah history
  },
)
```

::: details Penjelasan Kode
- `router.get(route('posts.index'), { q: search.value }, {...})` — kirim GET dengan query `?q=...` (objek kedua jadi query string untuk method GET).
- `preserveState: true` — pertahankan state komponen Vue. Tanpa ini, input search akan ke-reset ke default dan user kehilangan teks yang sudah diketik.
- `preserveScroll: true` — jaga posisi scroll. Berguna bila list panjang agar user tidak dibawa ke atas tiap request.
- `replace: true` — gunakan `history.replaceState` alih-alih `pushState`. Tanpa ini, setiap karakter akan jadi entri history terpisah → tombol back akan me-reverse karakter demi karakter (UX sangat buruk).
- Tilik kapas: tiga opsi ini adalah kombinasi wajib untuk filter search-as-you-type agar terasa seperti halaman SPA modern.
:::

## 9.6 Callback Navigation

`router` methods menerima opsi callback:

```js
router.get(route('posts.index'), data, {
  onStart:       () => loading.value = true,
  onFinish:      () => loading.value = false,
  onSuccess:     (page) => console.log('Loaded', page.component),
  onError:       (errors) => console.log('Validation errors', errors),
  onCancelToken: (token) => { /* bisa cancel */ },
  onCancel:      () => console.log('Dibatalkan'),
  preserveScroll: true,
  only: ['posts'], // partial reload
})
```

::: details Penjelasan Kode
- `onStart` / `onFinish` — lifecycle callback paling umum untuk toggle loading state. Dipanggil sebelum request dan setelah selesai (baik sukses/error).
- `onSuccess(page)` — `page` berisi payload Inertia (component, props, url). Lokasi ideal untuk menampilkan flash message atau update state lokal.
- `onError(errors)` — dipanggil saat server mengembalikan validation error (422). `errors` berisi object `{ field: [pesan] }` siap ditampilkan.
- `onCancelToken(token)` — menerima objek cancel. Agar penghapusan/submit bisa di-cancel jika user pergi sebelum selesai.
- `onCancel` — listener ketika request dibatalkan (mis. user navigasi lain).
- `only: ['posts']` — partial reload. Server hanya mengirim ulang props yang terdaftar di `only`, bukan seluruh page — menghemat bandwidth.
:::

## 9.7 Prefetch (Inertia v2)

Link bisa **preload** halaman tujuan sebelum user klik — terasa instan:

```vue
<!-- Prefetch on hover (default) -->
<Link :href="route('posts.show', post.id)" prefetch>
  Lihat Post
</Link>

<!-- Prefetch langsung saat mount -->
<Link :href="route('posts.show', post.id)" prefetch="mount">
  Lihat Post
</Link>

<!-- Prefetch dengan delay -->
<Link :href="route('posts.show', post.id)" :prefetch="['hover', 200]">
  Lihat Post
</Link>
```

::: details Penjelasan Kode
- `prefetch` (boolean, default `'hover'`) — Inertia mem-pra-muat halaman tujuan **saat mouse hover**, sehingga ketika user benar-benar klik, halaman langsung tampil instan dari cache.
- `prefetch="mount"` — prefetch begitu komponen ini di-mount. Cocok untuk link yang sangat mungkin diklik (mis. link utama di card).
- `:prefetch="['hover', 200]"` — bentuk array: `[mode, delayMs]`. Delay 200ms mencegah prefetch saat hover singkat tak sengaja, menghemat request.
- Hanya.prefetch data suntuk url tujuan, lalu cache-nya hilang setelah dipakai atau setelah TTL tertentu.
:::

Prefetch cache akan dipakai saat klik dilakukan — banyak link berat bisa d_prefetch saat hover.

## 9.8 Loading State & Progress Bar

Inertia punya progress bar bawaan. Kustomisasi via plugin npm `@inertiajs/progress` (versi 1) atau konfigurasi di v2:

```js
// v2: progress sudah otomatis, kustomisasi via turbo / nprogress-style
import { router } from '@inertiajs/vue3'

router.on('start', () => loading.value = true)
router.on('finish', () => loading.value = false)
```

::: details Penjelasan Kode
- `router.on('start', handler)` — global event listener. Setiap navigasi Inertia (Link atau `router.visit`) memancarkan event `start`.
- `router.on('finish', handler)` — dipanggil setelah request selesai, bergantung sukses/error/cancel. Cocok untuk hide loading spinner global.
- Pakai `ref` biasa untuk `loading` agar bisa dipakai di seluruh komponen yang membaca state-nya.
- Pendekatan alternatif v2: gunakan plugin progress bawaan (`@inertiajs/progress`) untuk kemudahan.
:::

Kustomisasi progress bar (Inertia v2 dengan `nprogress`):

```js
import NProgress from 'nprogress'
import { router } from '@inertiajs/vue3'

let timeout

router.on('start', () => {
  timeout = setTimeout(() => NProgress.start(), 250)
})

router.on('finish', (event) => {
  clearTimeout(timeout)
  NProgress.done()
})
```

::: details Penjelasan Kode
- `import NProgress from 'nprogress'` — library progress bar tipis di atas halaman, populer di komunitas SPA.
- `let timeout` — menampung id setTimeout agar bisa di-cancel. Di-deklarasi di luar listener agar closure-nya sama antar event.
- `setTimeout(() => NProgress.start(), 250)` — tunda bar 250ms sebelum muncul. Trik klasik: navigasi cepat (<250ms) tidak menampilkan progress bar → terasa instan, hanya navigasi lambat yang menampilkan progress.
- `clearTimeout(timeout)` di `finish` — bila request selesai sebelum 250ms, batalkan timer sehingga bar tidak muncul tiba-tiba.
- `NProgress.done()` — tutup bar. Otomatis pahami bila belum pernah `start()` pun tidak error.
:::

## 9.9 ?. Active State & Class Bindings

Untuk menandai link aktif:

```vue
<script setup>
import { route } from 'ziggy-js'
import { Link } from '@inertiajs/vue3'

const links = [
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'posts.index', label: 'Posts' },
]
</script>

<template>
  <Link
    v-for="link in links"
    :key="link.name"
    :href="route(link.name)"
    :class="route().current(link.name) ? 'text-blue-700 font-bold' : 'text-gray-600'"
  >
    {{ link.label }}
  </Link>
</template>
```

::: details Penjelasan Kode
- `route().current(link.name)` — mengecek apakah nama route aktif sama dengan `link.name`. Mengembalikan boolean.
- `:class="route().current(link.name) ? 'text-blue-700 font-bold' : 'text-gray-600'"` — binding class kondisional: aktif jadi biru tebal, tidak aktif jadi abu-abu.
- Pola iterasi menu cukup umum di sidebar/navbar Inertia. Ziggy menyediakan API live untuk inspeksi URL tanpa harus parse manual.
- Alternatif: `route().current('posts.*')` dengan wildcard untuk highlight semua route yang berawalan `posts.` (mis. index, create, show).
:::

## 9.10 Membatalkan Navigasi

Untuk request yang bisa di-cancel:

```js
import { router } from '@inertiajs/vue3'

const cancelToken = router.CancelToken.source()

router.get(route('posts.index'), {}, { onCancelToken: cancelToken })

// Saat user pindah tab sebelum request selesai
cancelToken.cancel('User navigated away')
```

::: details Penjelasan Kode
- `router.CancelToken.source()` — mirip pola Axios. Membuat sumber cancel token yang bisa kamu kontrol kapan pun.
- `onCancelToken: cancelToken` — menyerahkan token ke Inertia. Inertia mendaftarkan internal handler-nya, tapi token tetap bisa kamu cancel dari luar.
- `cancelToken.cancel('User navigated away')` — bila user pindah halaman sebelum request awal selesai, panggil cancel agar request lama tidak menimpa data baru (race condition).
- Pola ini opsional — Inertia v2 sebenarnya sudah otomatis cancel request lama saat navigasi baru dipicu. Manual berguna bila kamu punya logika kustom (mis. tombol "Batal" di search).
:::

## 9.11 Manual: `visit()` dengan Opsi Lengkap

`router.visit()` adalah fungsi dasar yang dipakai semua shortcut:

```js
router.visit(url, {
  method: 'get',
  data: {},
  headers: {},
  preserveState: false,
  preserveScroll: false,
  only: [],
  except: [],
  replace: false,
  async: false,
  preserveUrl: false,
  errorBag: null,
  onSuccess: () => {},
  onError: () => {},
  onFinish: () => {},
})
```

::: details Penjelasan Kode
- `router.visit(url, options)` — bentuk dasar yang dipakai semua shortcut (`get`, `post`, dst.). Setiap opsi di sini dapat dipakai di shortcut juga.
- `method`, `data`, `headers` — inti request. Method HARUS string HIP ngkat kapital `'get'`, `'put'`, dst.
- `preserveState` — pertahankan state komponen Vue setelah navigasi (mis. input yang sedang diketik).
- `preserveScroll` — jaga posisi scroll window. Default `false` (Inertia scroll ke atas layaknya load normal).
- `only: []` / `except: []` — partial reload. `only` minta hanya props tertentu; `except` minta semua kecuali yang disebut.
- `replace: false` — bila `true`, gunakan `history.replaceState` (tidak menambah entri back button).
- `async: false` — bila `true`, kirim request secara synchronous terhadap antrian navigasi berikutnya (jarang dipakai).
- `preserveUrl: false` — bila `true`, URL window tidak diubah walau navigasi terjadi.
- `errorBag: null` — kelompokkan error untuk form tertentu (berguna jika ada beberapa form di satu halaman).
:::

## 9.12 Pola Konfirmasi Hapus yang Aman

```vue
<script setup>
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const showConfirm = ref(false)
const target = ref(null)

function confirmDelete(post) {
  target.value = post
  showConfirm.value = true
}

function destroy() {
  router.delete(route('posts.destroy', target.value.id), {
    preserveScroll: true,
    onSuccess: () => {
      showConfirm.value = false
      target.value = null
    },
  })
}
</script>

<template>
  <button @click="confirmDelete(post)">Hapus</button>

  <Modal v-if="showConfirm" @close="showConfirm = false">
    <h3>Yakin hapus "{{ target.title }}"?</h3>
    <button @click="destroy" class="bg-red-600 text-white">Ya, hapus</button>
  </Modal>
</template>
```

::: details Penjelasan Kode
- `const showConfirm = ref(false)` & `const target = ref(null)` — dua state lokal: satu mengontrol tampil/tidak modal, satu menyimpan item yang akan dihapus.
- `confirmDelete(post)` — dipanggil saat user klik tombol Hapus. Set `target.value = post` lalu `showConfirm.value = true` untuk membuka modal konfirmasi. **Aksi hapus belum dilakukan** di tahap ini.
- `router.delete(route('posts.destroy', target.value.id), {...})` — request DELETE barus dikirim setelah user konfirmasi. URL dibangun dari id yang disimpan di `target`.
- `onSuccess` — tutup modal (`showConfirm = false`) dan kosongkan target agar bersih untuk penggunaan berikutnya.
- `&lt;Modal v-if="showConfirm" @close="...">` — `v-if` berarti modal di-create hanya saat dibutuhkan → onUnmounted modal dibersihkan.
- Pola ini aman & UX-friendly: tidak pakai `confirm()` browser bawaan yang block thread, dan memungkinkan customisasi UI modal sesuai brand.
:::

## 9.13 Ringkasan Bab

- Pakai `<Link>` untuk navigasi dari template.
- `as="button"` + `method="post/delete"` untuk aksi non-GET.
- `router.visit / get / post / put / patch / delete` untuk navigasi programatik.
- `preserveState` & `preserveScroll` penting untuk filter & pagination.
- Prefetch membuat navigasi terasa instan (v2).
- Set progress bar di `router.on('start'/'finish')`.
- Helper Ziggy `route()` sama seperti Blade.

:::tip Selanjutnya
[Bab 10](/bagian-3/bab-10) bahas senjata utama form: `useForm()` — binding, submit, errors, transformasi, dan komponen reusable.
:::
