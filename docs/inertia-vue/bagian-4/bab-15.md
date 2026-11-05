---
title: Bab 15 — Pagination dengan Inertia
---

# Bab 15: Pagination dengan Inertia

:::info Bagian IV — Fitur Lanjutan Inertia
Paginator Laravel otomatis serialize ke format yang ramah Vue. Bab ini juga membahas filter + search dengan partial reload.
:::

## 15.1 Kirim Paginator dari Controller

```php
public function index(Request $request)
{
    $posts = Post::with('user')
        ->filter($request->only('q', 'status'))
        ->latest()
        ->paginate(10);

    return Inertia::render('Posts/Index', [
        'posts' => PostResource::collection($posts),
        'filters' => $request->only('q', 'status'),
    ]);
}
```

::: details Penjelasan Kode
- `Post::with('user')` — eager loading relasi `user` untuk mencegah N+1 query saat render di Vue (setiap post akan akses `post.user.name`).
- `->filter($request->only('q', 'status'))` — local scope kustom yang menerima array filter. `$request->only('q', 'status')` hanya ambil key yang ada, jadi filter hilang bisa di-handle default.
- `->latest()` — order by `created_at DESC`. Short-cut untuk `orderBy('created_at', 'desc')`.
- `->paginate(10)` — paginator 10 item per halaman. Otomatis baca `?page=` dari request untuk halaman aktif.
- `PostResource::collection($posts)` — bungkus paginator ke API Resource. Laravel otomatis pertahankan struktur `meta`/`links` paginator saat menggunakan collection di Resource.
- `'filters' => $request->only('q', 'status')` — kirim filter terkini agar Vue pre-fill input search/status. Berguna saat user refresh URL dengan query string — state filter tetap terjaga.
:::

`Inertia::render` atau `PostResource::collection` otomatis wrap paginator ke format:

```js
{
  data: [/*array of post*/],
  links: {
    first: '/posts?page=1',
    last:  '/posts?page=10',
    prev:  null,
    next:  '/posts?page=2',
  },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 10,
    per_page: 10,
    to: 10,
    total: 100,
    links: [
      { url: null, label: '&laquo;', active: false },
      { url: '/posts?page=1', label: '1', active: true },
      /* ... */
      { url: null, label: '&raquo;', active: false },
    ]
  }
}
```

::: details Penjelasan Kode
- `data` — array item aktual pada halaman saat ini (sudah melalui `PostResource::toArray()`).
- `links.prev / next` — URL halaman sebelum/sesudah. `null` bila di halaman pertama / terakhir.
- `meta.current_page` — halaman aktif. `from`/`to` = range nomor item (1—10). `total` total seluruh item.
- `meta.links` — array tombol numbered 1..N plus tombol prev/next (HTML entity `&laquo;` = «, `&raquo;` = »). Labelnya ada HTML, jadi di Vue perlu `v-html` untuk render arrow.
- Struktur standar ini mengikuti spesifikasi JSON:API yang Laravel pakai. Inertia-laravel mendeteksi dan menyimpan ke `page.props.posts`.
:::

:::warning Resource collection + pagination
Saat pakai `PostResource::collection($paginator)`, Laravel otomatis wrap resource ke format paginator. Format `meta.links` (array tombol 1, 2, ..., 10) tersedia — gunakan ini untuk komponen ui tombol halaman.
:::

## 15.2 Struktur Data Paginator di Vue

Akses manual:

```js
const props = defineProps({ posts: Object })

const items = computed(() => props.posts.data)
const meta = computed(() => props.posts.meta)
const links = computed(() => props.posts.links)
const navLinks = computed(() => props.posts.meta.links) // array tombol
```

## 15.3 Komponen `<Pagination>`

```vue
<!-- Components/UI/Pagination.vue -->
<script setup>
import { Link } from '@inertiajs/vue3'

const props = defineProps({
  links: { type: Array, required: true }, // array dari meta.links
})

function isDisabled(link) {
  return !link.url
}
</script>

<template>
  <nav v-if="links.length > 3" class="flex items-center gap-1">
    <Component
      v-for="(link, i) in links"
      :key="i"
      :is="isDisabled(link) ? 'span' : Link"
      :href="isDisabled(link) ? undefined : link.url"
      :preserveScroll="true"
      v-html="link.label"
      :class="[
        'rounded px-3 py-1.5 text-sm',
        link.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100',
        isDisabled(link) ? 'cursor-not-allowed opacity-50' : '',
      ]"
      preserve-scroll
    />
  </nav>
</template>
```

::: details Penjelasan Kode
- `v-if="links.length > 3"` — paginator selalu punya minimal prev + halaman pertama + next = 3 entri. Kalau kurang, berarti cuma 1 halaman → sembunyi paginator.
- `&lt;Component :is="isDisabled(link) ? 'span' : Link" />` — dynamic component Vue: render tag `&lt;span>` (disabled, untuk tombol « di halaman 1) atau komponen `&lt;Link>` Inertia (untuk enabled). Tidak bisa pakai `&lt;Link v-if disabled>` karena `&lt;Link>` selalu render dan cenderung navigate.
- `:href="link.url"` — URL halaman target; `undefined` saat disabled (span tidak punya href).
- `:preserveScroll="true"` — saat pindah halaman, scroll position dipertahankan. Default Inertia scroll ke atas; untuk tabel pagination, ini mengganggu UX.
- `v-html="link.label"` — `label` berisi HTML entity seperti `&laquo;` «. `v-html` direct render HTML. **Hati-hati XSS** — di sini aman karena label di-generate Laravel, bukan input user.
- `link.active` — boolean dari Laravel menandakan tombol halaman saat ini. Pakai untuk styling highlight.
- `:class="[...]` — array class binding. Cocok untuk multi-kondisi (semua kelas dasar + conditional).
- `preserve-scroll` (kebab) — alternatif syntax untuk boolean prop. Vue mengizinkan keduanya, sama artinya.
:::

Pakai:

```vue
<template>
  <Pagination :links="posts.meta.links" />
</template>
```

`preserve-scroll` agar scroll position tidak loncat ke atas saat ganti halaman — UX penting untuk tabel panjang.

## 15.4 Filter & Search + Pagination

Skenario: `/posts?q=laravel&status=published&page=2`.

```php
public function index(Request $request)
{
    $posts = Post::query()
        ->when($request->q, fn ($q, $v) => $q->where('title', 'like', "%{$v}%"))
        ->when($request->status, fn ($q, $v) => $q->where('status', $v))
        ->paginate(10)
        ->withQueryString();

    return Inertia::render('Posts/Index', [
        'posts'   => PostResource::collection($posts),
        'filters' => $request->only(['q', 'status']),
    ]);
}
```

::: details Penjelasan Kode
- `Post::query()` — mulai query builder (bukan `Post::all()`). Memungkinkan chain kondisi optional via `when`.
- `->when($request->q, fn ($q, $v) => $q->where('title', 'like', "%{$v}%"))` — `when` hanya jalankan closure jika value truthy. Closure menerima builder (`$q`) dan value (`$v`). Menghindari if-else verbose. **Perhatian**: Gunakan `escapeLike` manual di Laravel untuk hindari wildcard injection (`%_`).
- `->paginate(10)->withQueryString()` — `withQueryString` pertahankan semua query term aktif (`q`, `status`) di URL pagination. Tanpa ini, link ke page 2 hanya `/posts?page=2` dan filter hilang — user lihat hasil unfiltered tiba-tiba.
- `'filters' => $request->only(['q', 'status'])` — kirim balik filter ke Vue untuk pre-fill input.
:::

`->withQueryString()` agar filter tetap di URL saat pindah halaman.

Vue:

```vue
<script setup>
import { ref, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import Pagination from '@/Components/UI/Pagination.vue'

const props = defineProps({
  posts: Object,
  filters: Object,
})

const search = ref(props.filters.q ?? '')
const status = ref(props.filters.status ?? 'all')

watch(
  [search, status],
  ([q, s]) => {
    router.get(
      route('posts.index'),
      { q, status: s === 'all' ? null : s },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        only: ['posts', 'filters'],
      },
    )
  },
)
</script>

<template>
  <div class="space-y-4">
    <input v-model="search" placeholder="Cari..." class="input" />
    <select v-model="status" class="input">
      <option value="all">Semua</option>
      <option value="published">Published</option>
      <option value="draft">Draft</option>
    </select>

    <ul>
      <li v-for="post in posts.data" :key="post.id">
        {{ post.title }}
      </li>
    </ul>

    <Pagination :links="posts.meta.links" />
  </div>
</template>
```

::: details Penjelasan Kode
- `const search = ref(props.filters.q ?? '')` — init `search` dari prop supaya input terisi saat pertama load (mis. URL ada `?q=laravel`). Pakai `??` agar null-safe.
- `watch([search, status], ([q, s]) => {...})` — watch array berarti observe multiple refs. Callback ter-trigger jika salah satu berubah.
- `router.get(route('posts.index'), { q, status: s === 'all' ? null : s }, {...})` — kirim GET ke route index dengan query baru. Kalau status `all`, kirim `null` agar tidak masuk query server.
- `preserveState: true` — **penting**: pertahankan state komponen Vue (input value, scroll) saat request. Tanpa ini, page ter re-render dari awal dan input kehilangan fokus.
- `preserveScroll: true` — scroll tetap.
- `replace: true` — gunakan `history.replaceState` bukan `pushState`. Mencegah history penuh dengan setiap tampukan keyboard (yang akan membuat tombol back "terjebak" di setiap karakter).
- `only: ['posts', 'filters']` — partial reload: server hanya kirim ulang prop `posts` dan `filters`. Prop lain (mis. `auth`) tetap. Hemat bandwidth dan DB query.
- **Perhatian**: tanpa debounce, watch akan trigger tiap ketikan — dos server. Lihat §15.6.
:::

## 15.5 Partial Reload untuk Filter

Lebih efisien: hanya minta `posts`, bukan refresh seluruh halaman:

```js
router.reload({
  only: ['posts', 'filters'],
  data: { q: search.value, status: status.value },
  preserveScroll: true,
})
```

Atau via `router.get` dengan `only`:

```js
router.get(
  route('posts.index'),
  { q: search.value, status: status.value },
  { only: ['posts', 'filters'], preserveState: true, preserveScroll: true, replace: true },
)
```

::: details Penjelasan Kode
- `router.reload()` — bermaksud untuk re-request route **saat ini** (URL tidak berubah). Beda dengan `router.get` yang bisa navigasi ke URL baru.
- `data: { q, status }` — query data untuk dikirim; dengan `reload`, data ini ditambahkan ke request ke URL saat ini.
- `only: ['posts', 'filters']` — partial reload. Server hanya re-evaluate prop yang di-list. Vue merender hanya payload baru — komponen lain yang tidak berubah tidak re-render.
:::

## 15.6 Debounce Search

Saat mengetik search, terlalu cepat kirim request → dos server. Debounce 300ms:

```js
import { watch } from 'vue'
import { debounce } from 'lodash-es'

watch(
  search,
  debounce((val) => {
    router.get(
      route('posts.index'),
      { q: val },
      { preserveState: true, preserveScroll: true, replace: true, only: ['posts'] },
    )
  }, 300),
)
```

::: details Penjelasan Kode
- `import { debounce } from 'lodash-es'` — `debounce` menunda eksekusi callback hingga X ms setelah pemanggilan terakhir. Cocok untuk input search agar tidak request tiap karakter.
- `debounce((val) => {...}, 300)` — bungkus callback dengan debounce 300 ms. Watch callback dipanggil tiap perubahan, tapi `router.get` hanya dieksekusi jika user berhenti mengetik 300 ms.
- `lodash-es` versi ESM untuk tree-shaking Vite, lebih kecil bundle.
- Tanpa debounce, tiap keypress trigger request → 20 ketikan = 20 request → server overload & UX buruk.
:::

## 15.7 Cursor Pagination (Untuk Dataset Besar)

Untuk dataset puluhan ribu row, gunakan cursor pagination — lebih efisien:

```php
$posts = Post::orderBy('id')->cursorPaginate(10);
```

Format response:

```js
{
  data: [...],
  next_cursor: 'eyJpZCI6MTAxfQ==',
  // ...
  meta: { next_cursor, prev_cursor, has_more_pages }
}
```

Di Vue, kirim cursor sebagai query paramenter:

```vue
<Link :href="`/posts?cursor=${posts.next_cursor}`" preserve-scroll>Next</Link>
```

::: details Penjelasan Kode
- Cursor pagination menggunakan "cursor" (pointer encoded ke string base64) ke row terakhir yang di-load, bukan offset pageNumber. Server ambil row dengan `WHERE id > cursor ORDER BY id LIMIT N` (menggunakan index) → jauh lebih cepat dari `OFFSET 1000000 LIMIT 10` yang makin lambat seiring offset.
- `next_cursor` adalah ID row terakhir (encoded) pada page saat ini. Kirim balik sebagai query param `cursor=...` ke server.
- Kekurangan: tidak bisa lompat ke "halaman 5" langsung — hanya next/prev. Cocok untuk feed/infinite scroll.
:::

## 15.8 Infinite Scroll (Optional)

Untuk infinite scroll, gunakan IntersectionObserver + append:

```js
import { ref, onMounted } from 'vue'
import { router } from '@inertiajs/vue3'

const allItems = ref([...props.posts.data])
const nextUrl = ref(props.posts.links.next)

function loadMore() {
  if (!nextUrl.value) return
  router.get(nextUrl.value, {}, {
    preserveState: true,
    preserveScroll: true,
    only: ['posts'],
    onSuccess: (page) => {
      allItems.value.push(...page.props.posts.data)
      nextUrl.value = page.props.posts.links.next
    },
  })
}

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore()
  })
  observer.observe(document.querySelector('#load-more-sentinel'))
})
```

::: details Penjelasan Kode
- `allItems = ref([...props.posts.data])` — spread array agar reaktif (pakai ref, bukan materialize props).
- `nextUrl = ref(props.posts.links.next)` — URL page berikutnya dari paginator. Bila null = tidak ada lagi.
- `router.get(nextUrl.value, {}, {..., only: ['posts'], onSuccess: page => {...&#125;&#125;)` — request page berikutnya, hanya minta `posts`. `page` di callback adalah response Inertia props baru.
- `allItems.value.push(...page.props.posts.data)` — spread ke `allItems` agar Vue re-aktif render list.
- `IntersectionObserver` browser API — observe elemen sentinel (`#load-more-sentinel` di bawah daftar). Saat sentinel masuk viewport, panggil `loadMore`. Lebih hemat daripada scroll event listener.
- `preserveScroll: true` wajib — tanpa ini, saat load page berikutnya scroll akan reset ke atas dan user kehilangan posisi.
:::

## 15.9 Pola: Reset Page ke 1 Saat Filter Berubah

```js
watch([search, status], ([q, s]) => {
  router.get(route('posts.index'), { q, status: s, page: 1 }, { preserveState: true, replace: true, only: ['posts'] })
})
```

Tanpa reset, user akan masuk halaman 5 → filter menampilkan 0 hasil (karena filter menghasilkan total 3 page).

## 15.10 Pola Komponen `<DataTable>` dengan Pagination

```vue
<!-- Components/Table/DataTable.vue -->
<script setup>
import Pagination from '@/Components/UI/Pagination.vue'

defineProps({
  rows: Array,
  meta: Object,
  links: Array,
  columns: Array,
  loading: Boolean,
})
</script>

<template>
  <div>
    <table class="w-full">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="text-center p-4">Memuat...</td>
        </tr>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length" class="text-center p-4 text-gray-500">
            Tidak ada data
          </td>
        </tr>
        <tr v-else v-for="(row, i) in rows" :key="row.id ?? i">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row">{{ row[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>

    <Pagination :links="links" />
  </div>
</template>
```

::: details Penjelasan Kode
- `defineProps` dengan prop `columns: Array` — konfigurasi kolom dinamis (seragam: `{ key, label }`). Render header `col.label`, isi cell `row[col.key]`.
- `&lt;slot :name="`cell-${col.key}`" :row="row">` — slot dinamis per-kolom (`cell-title`, `cell-status`, dsb.). Parent bisa override render cell tertentu (mis. badge status) lewat `&lt;template #cell-status="...">`. Body default `&#123;&#123; row[col.key] &#125;&#125;` saat tidak di-slot.
- `&lt;tr v-if="loading">` → `&lt;tr v-else-if="!rows.length">` → `&lt;tr v-else v-for>` — urutan v-if/v-else-if/v-else sangat penting. Tanpa `v-else` di v-for, semua row juga akan render saat loading.
- `:colspan="columns.length"` — satu cell mengisi seluruh lebar tabel untuk state empty/loading. Bersifat visual.
- `:key="row.id ?? i"` — key preferensi ID row; fallback ke index hanya jika tidak ada ID. Index fallback bisa trigger bug animasi saat array baru-di-hapus, sebaiknya hindari tapi aman untuk read-only list.
- `&lt;Pagination :links="links" />` — slot komponen pagination di bagian bawah tabel. Pagination adalah child terpisah untuk reuse.
:::

## 15.11 Ringkasan Bab

- Paginator otomatis serialize ke `{ data, links, meta }`.
- `meta.links` = array tombol halaman untuk komponen `<Pagination>`.
- `->withQueryString()` agar filter tetap ada di URL saat pindah page.
- `preserve-scroll` & `preserve-state` kalau UX filter real-time.
- `only: ['posts']` partial reload untuk hemat bandwidth.
- Pakai debounce untuk search input.

:::tip Selanjutnya
[Bab 16](/bagian-4/bab-16): authorization — kirim permission ke Vue sebagai UX layer, sementara server tetap jadi sumber keamanan.
:::
