---
title: Bab 8 — Reactivity & Composition API — Yang Perlu Kamu Tahu
---

# Bab 8: Reactivity & Composition API — Yang Perlu Kamu Tahu

:::info Bagian III — Vue di Konteks Inertia
Bab ini fokus pada API Vue 3 yang paling sering dipakai di aplikasi Inertia. Tidak mengajarkan Vue dari nol — hanya yang relevan untuk kamu transisi dari Blade.
:::

## 8.1 `ref()` — Variabel Reaktif

`ref` membungkus nilai apa pun menjadi reaktif. Saat nilai berubah, Vue update tampilan otomatis.

```js
import { ref } from 'vue'

const count = ref(0)
const message = ref('Halo')
const isOpen = ref(false)

// Akses .value di script
count.value++
message.value = 'Hai'

// Di template, langsung tanpa .value
// <button>{{ count }} {{ message }}</button>
```

::: details Penjelasan Kode
- `import { ref } from 'vue'` — mengimpor helper reaktivitas bawaan Vue 3 dari paket `vue`.
- `ref(0)` — membungkus nilai primitif `0` menjadi reaktif. Vue akan melacak perubahan dan otomatis meng-update DOM yang bergantung padanya.
- `ref('Halo')` / `ref(false)` — `ref` juga bekerja untuk `string` dan `boolean` yang sama-sama bersifat primitif.
- `count.value++` — di dalam `&lt;script setup>`, akses & mutasi wajib melalui properti `.value` karena `ref` mengembalikan objek `{ value: ... }`.
- `message.value = 'Hai'` — reassignment nilai reaktif. Vue men-trigger update hanya bila nilai berubah.
- Di template, `&#123;&#123; count &#125;&#125;` ditulis langsung tanpa `.value` karena Vue melakukan "auto-unwrap" saat `ref` diekspos ke template.
:::

Aturan praktis:

- Pakai `ref` untuk **primitif** (string, number, boolean) atau single value.
- Selalu pakai `.value` di `<script setup>`.
- Pakai langsung (tanpa `.value`) di `<template>`.

## 8.2 `reactive()` — Objek Reaktif

`reactive` membuat objek/array reaktif secara mendalam (deep).

```js
import { reactive } from 'vue'

const form = reactive({
  title: '',
  body: '',
  tags: [],
})

form.title = 'Halo' // reactive
form.tags.push('vue') // reactive
```

::: details Penjelasan Kode
- `reactive({...})` — membuat objek menjadi reaktif secara **mendalam** (deep). Semua properti bertingkat juga reaktif.
- `form.title = 'Halo'` — mutasi properti langsung, tanpa `.value` seperti `ref`. Inilah keuntungan utama `reactive` untuk form state.
- `form.tags.push('vue')` — metode mutasi array (`push`, `pop`, `splice`) tetap reaktif karena Vue memantau array secara internal (menggunakan Proxy di Vue 3).
- Cocok untuk form dengan banyak field karena aksesnya natural: `form.fieldName` bukan `form.fieldName.value`.
:::

Perbedaan dengan `ref`:

| Aspek | `ref` | `reactive` |
| --- | --- | --- |
| Tipe data | Bebas (primitif, objek) | Objek & array |
| Akses di script | Perlu `.value` | Langsung |
| Reassignment | Bisa (`x.value = ...`) | Tidak bisa (ganti ref ke objek baru) |
| Rekomendasi | Untuk state kecil | Untuk objek form state |

:::warning Perhatian
Jangan destructure `reactive` — kehilangan reaktif:
```js
const { title } = reactive({ title: '' }) // title = '' (tidak reaktif)
```
Gunakan `toRefs` jika perlu destructure.
:::

## 8.3 `computed()` — Nilai Turunan

`computed` menghitung ulang hanya jika dependency berubah, dan **ter-cache** — efisien dibanding method biasa.

```js
import { ref, computed } from 'vue'

const posts = ref([...])
const search = ref('')

// Hanya dihitung ulang saat posts atau search berubah
const filtered = computed(() =>
  posts.value.filter(p => p.title.includes(search.value))
)

const totalChar = computed(() => search.value.length)
```

::: details Penjelasan Kode
- `computed(() => ...)` — menerima *getter function*. Hasil getter di-cache dan hanya dihitung ulang bila dependency reaktif berubah.
- `posts.value.filter(...)` — mengakses nilai `ref` via `.value` di dalam computed. Vue menjadikan `posts` dan `search` sebagai dependency otomatis.
- `p.title.includes(search.value)` — operasi filter memakai `search.value`. Saat user mengetik, hanya `filtered` yang re-evaluasi, bukan seluruh komponen.
- `computed(() => search.value.length)` — contoh lain: panjang karakter search. Mengembalikan nilai turunan, di-cache antar-render selama `search` tidak berubah.
- Berbeda dengan method: method selalu dijalankan ulang tiap render, sedangkan `computed` menghindari perhitungan ulang yang tidak perlu → lebih efisien.
:::

Kapan pakai `computed` vs method:

- **Computed** untuk nilai yang diturunkan dari state (filter, sort, debounced search).
- **Method** untuk aksi (submit, click handler).

:::warning Computed harus pure
Jangan mutate state lain dalam `computed` — itu anti-pattern Vue:
```js
const foo = computed(() => {
  otherRef.value = 'X' // ❌ side effect
  return /* ... */
})
```
:::

## 8.4 `watch()` — Reaksi terhadap Perubahan

`watch` menjalankan efek samping saat dependency reaktif berubah.

```js
import { ref, watch } from 'vue'

const search = ref('')

watch(search, (newVal, oldVal) => {
  console.log('Search berubah dari', oldVal, 'ke', newVal)
})
```

::: details Penjelasan Kode
- `watch(search, callback)` — mengawasi satu sumber reaktif. Callback dipanggil bila nilainya berubah.
- Argumen `(newVal, oldVal)` — memberi nilai sesudah & sebelum, berguna untuk logging, debounce, atau membandingkan state.
- Cocok untuk efek samping (side effect) seperti fetch data, simpan draft, atau trigger notifikasi — bukan untuk menghitung nilai turunan (gunakan `computed`).
:::

Untuk objek dalam, pakai `deep` atau `flush`:

```js
watch(
  form,
  (newVal) => {
    localStorage.setItem('draft', JSON.stringify(newVal))
  },
  { deep: true },
)
```

::: details Penjelasan Kode
- `watch(form, callback, { deep: true })` — opsi `deep: true` memaksa Vue menjelajah seluruh properti bertingkat `form` agar perubahan nested tetap terdeteksi. Tanpa `deep`, hanya reassignment `form = {...}` yang terdeteksi.
- `localStorage.setItem('draft', JSON.stringify(newVal))` — contoh side effect: menyimpan draft form ke localStorage setiap kali user mengetik.
- Opsi lain yang sering dipakai: `flush: 'post'` (jalankan setelah DOM update) dan `immediate: true` (jalankan sekali saat mendaftar).
:::

Lanjutan `watchEffect` — jalankan efek otomatis dan track dependency:

```js
import { watchEffect } from 'vue'

watchEffect(() => {
  console.log('Search sekarang:', search.value)
})
```

::: details Penjelasan Kode
- `watchEffect(callback)` — callback langsung dijalankan satu kali saat pendaftaran, lalu Vue merekam setiap `ref`/`reactive` yang diakses di dalamnya sebagai dependency otomatis.
- Berbeda `watch` (harus sebut dependency eksplisit & dapat `oldVal`), `watchEffect` hanya menerima `newVal`-ish (computed live) — tidak punya `oldVal`.
- Cocok untuk efek dengan dependency yang sulit di-list manual, contoh: mengakses banyak properti objek reaktif secara dinamis.
:::

`watchEffect` cocok jika kamu tidak tahu dependency di awal — tapi tidak dapat oldVal.

## 8.5 `onMounted` & Lifecycle Hooks

| Hook | Kapan dipanggil |
| --- | --- |
| `onBeforeMount` | Sebelum komponen di-mount |
| `onMounted` | Setelah DOM terpasang — bisa akses `ref` element |
| `onBeforeUpdate` | Sebelum update DOM |
| `onUpdated` | Setelah update DOM |
| `onBeforeUnmount` | Sebelum komponen di-unmount |
| `onUnmounted` | Setelah komponen di-unmount — cleanup |

Contoh umum:

```js
import { onMounted, onUnmounted, ref } from 'vue'

const windowWidth = ref(window.innerWidth)

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

function onResize() {
  windowWidth.value = window.innerWidth
}
```

::: details Penjelasan Kode
- `onMounted(() => ...)` — dipanggil setelah komponen dipasang ke DOM. Di sinilah aman mendaftar event listener karena elemen sudah ada.
- `onUnmounted(() => ...)` — cleanup event listener agar tidak memory leak & tidak men-trigger di komponen yang sudah hilang. Sangat penting saat persisten di layout SPA.
- `window.addEventListener('resize', onResize)` — mendaftar handler ke `window`. Bila listener tidak dihapus di `onUnmounted`, akan terus jalan walau komponen sudah unmount → antipattern & bug berat.
- `windowWidth.value = window.innerWidth` — mutasi ref yang men-trigger re-render komponen tiap user resize jendela.
:::

:::tip Persistent layout = berbeda dari SPA
Di Inertia, layout persistent **tidak unmount** saat navigasi. `onMounted` layout hanya jalan satu kali saat app dimuat. Page component tetap normal `onMounted` tiap navigasi.
:::

## 8.6 Template Ref — Akses DOM Langsung

Untuk auto-focus input, ukur element, dsb:

```vue
<script setup>
import { ref, onMounted } from 'vue'

const inputEl = ref(null)

onMounted(() => {
  inputEl.value?.focus()
})
</script>

<template>
  <input ref="inputEl" type="text" />
</template>
```

::: details Penjelasan Kode
- `const inputEl = ref(null)` — variabel `ref` yang akan diisi instance DOM/X element. Awalnya `null` karena DOM belum ada saat `&lt;script setup>` dieksekusi.
- `ref="inputEl"` di template — menetapkan elemen `&lt;input>` ke variabel `inputEl` berkat Vue melakukan binding otomatis. Hanya bisa diakses **setelah mount**.
- `onMounted(() => inputEl.value?.focus())` — `?.` (optional chaining) menghindari error bila elemen belum ada. Focus otomatis sangat berguna untuk form input pertama.
:::

Untuk komponen child, ref merujuk ke instance:

```vue
<script setup>
import ChildComp from '@/Components/Child.vue'
const childRef = ref(null)

function doSomething() {
  childRef.value?.focusInput()
}
</script>
```

::: details Penjelasan Kode
- Saat `ref` ditempel ke child component (`&lt;Child ref="childRef" />`), `childRef.value` berisi **instance komponen child**, bukan DOM.
- Agar method child dapat dipanggil parent, child wajib `defineExpose({ focusInput })` karena `&lt;script setup>` menutup scope default-nya.
- `childRef.value?.focusInput()` — optional chaining menghindari crash bila child belum selesai mount.
:::

Untuk v-for, ref menjadi array:

```vue
<script setup>
const items = ref([...])
const refs = ref([])

function logFirst() {
  console.log(refs.value[0])
}
</script>

<template>
  <div v-for="item in items" :key="item.id" :ref="el => { if (el) refs.push(el) }">
    {{ item.title }}
  </div>
</template>
```

::: details Penjelasan Kode
- `v-for` dengan `:ref="el => ..."` — di Vue 3, ref pada v-for **tidak otomatis jadi array** seperti di Vue 2. Harus di-handle manual lewat function ref.
- `if (el) refs.push(el)` — guard `if (el)` penting karena Vue memanggil ref dengan `null` saat elemen di-unmount. Tanpa guard, `null` masuk ke array → bug.
- Pola ini berguna untuk animasi stagger, scroll-to, atau mengukur ukuran banyak elemen sekaligus (misal dengan `IntersectionObserver`).
:::

## 8.7 `defineProps`, `defineEmits`, `defineExpose`

Tiga macro compile-time (tidak perlu import):

```vue
<script setup>
const props = defineProps({
  post: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete'])

emit('edit', props.post)

// Expose method ke parent lewat ref
defineExpose({
  refresh: () => { /* ... */ },
})
</script>
```

::: details Penjelasan Kode
- `defineProps({...})` — macro compile-time (bukan runtime function) untuk deklarasi props. Tidak perlu `import`; Vue mengkompilasi macro ini menjadi props instance.
- `post: { type: Object, required: true }` — validasi bawaan: tipe & keharusan. Bila parent tidak pass atau tipe salah, Vue melempar warning dev-mode.
- `defineEmits(['edit', 'delete'])` — daftarkan nama event yang boleh dipancarkan komponen. `emit('edit', payload)` mengirim event ke parent; parent dengarkan via `@edit="handler"`.
- `defineExpose({...})` — di `&lt;script setup>`, semua binding default-nya chiri (private). `defineExpose` membuka method/properti tertentu agar parent dapat memanggilnya lewat template ref.
- Karena macro, ini bukan JS biasa — dihapus dari output akhir oleh compiler Vue.
:::

TypeScript:

```ts
defineProps<{ post: Post }>()
defineEmits<{ (e: 'edit', post: Post): void }>()
```

## 8.8 Composables — Fungsi Reusable

Ekstrak logika ke dalam composable:

```js
// composables/useDebounce.js
import { ref, watch } from 'vue'

export function useDebounce(fn, delay = 300) {
  let timeout
  const debounced = ref(fn)

  watch(debounced, (val) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(val), delay)
  })

  return debounced
}
```

::: details Penjelasan Kode
- `export function useDebounce(fn, delay = 300)` — konvensi penamaan composable: diawali `use`. Menerima fungsi yang ingin di-debounce.
- `let timeout` — menyimpan id `setTimeout` di closure agar bisa di-cancel. Tidak reaktif, jadi pakai `let` biasa (bukan `ref`).
- `const debounced = ref(fn)` — bungkus nilai awal sebagai ref agar komponen yang memakai bisa lacak perubahannya.
- `watch(debounced, (val) => ...)` — bila user set nilai baru, jalankan ulang timer.
- `clearTimeout(timeout)` — batal timer sebelumnya agar tidak menumpuk panggilan; inti dari debounce: hanya panggilan terakhir yang jalan setelah `delay`.
- `setTimeout(() => fn(val), delay)` — jalankan fungsi asli setelah delay. Selama user mengetik terus sebelum delay habis, fungsi asli tidak dipanggil.
- `return debounced` — kembalikan `ref` agar caller pakai seperti ref biasa.
:::

Pakai:

```js
import { useDebounce } from '@/composables/useDebounce'

const search = useDebounce(async (q) => {
  // kirim request search
}, 500)
```

::: details Penjelasan Kode
- `useDebounce(async (q) => {...}, 500)` — memakai composable. Setiap kali `search.value` di-assign, callback hanya dipanggil `500ms` setelah perubahan terakhir.
- Ideal untuk search-as-you-type: menghemat request server karena user yang mengetik cepat tidak menyebabkan satu request per keystroke.
- Pola ini menunjukkan kekuatan composable: logika reusable tanpa duplikasi di banyak komponen.
:::

Tips composal:

- Nama selalu diawali `use` (`usePosts`, `useSidebar`).
- Return `ref`, `computed`, dan `function` — bukan plain object.
- Idealnya stateless / re-entrant — kecuali yang memang stateful (store).

## 8.9 Directive yang Sering Dipakai

| Directive | Kegunaan |
| --- | --- |
| `v-model` | Two-way binding untuk input |
| `v-if` / `v-else` / `v-show` | Conditional render/show |
| `v-for` | List rendering — wajib `:key` |
| `v-bind` / `:` | Bind attribute |
| `v-on` / `@` | Listen event |
| `v-html` | Render HTML string (hati-hati XSS) |

Contoh `v-for`:

```html
<li v-for="post in posts" :key="post.id">
  {{ post.title }}
</li>

<li v-for="(post, index) in posts" :key="post.id">{{ index }} - {{ post.title }}</li>

<div v-for="(value, key) in user" :key="key">{{ key }}: {{ value }}</div>
```

## 8.10 Pola yang Sering Tidak Perlu Dipelajari Dulu

Di konteks Inertia, kamu **tidak perlu** berikut:

- ❌ **Vue Router** — route ada di Laravel.
- ❌ **Axios / fetch for navigation** — pakai `<Link>` & `router.visit`.
- ❌ **Pinia untuk data server** — props Inertia cukup.
- ❌ **Vuex** — Pinia sudah menggantikan.
- ❌ **Quasar / Framework UI yang bawa routingnya sendiri** — konflik.

Fokus pada:

- `ref`, `reactive`, `computed`, `watch`, `onMounted`.
- `defineProps`, `defineEmits`, `defineExpose`.
- Composables.
- `<Link>`, `useForm`, `usePage` (Inertia-specific).

## 8.11 Contoh Nyata: Filter List dengan `watch`, `ref`, `router

```vue
<script setup>
import { ref, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'

const props = defineProps({
  posts: Array,
  filters: Object,
})

const search = ref(props.filters.q ?? '')
const status = ref(props.filters.status ?? 'all')

watch(
  [search, status],
  ([q, s]) => {
    router.get(
      route('posts.index'),
      { q, status: s },
      { preserveState: true, preserveScroll: true, replace: true },
    )
  },
)
</script>

<template>
  <input v-model="search" placeholder="Cari..." />
  <select v-model="status">
    <option value="all">Semua</option>
    <option value="published">Published</option>
    <option value="draft">Draft</option>
  </select>

  <ul>
    <li v-for="post in posts.data" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

::: details Penjelasan Kode
- `import { router } from '@inertiajs/vue3'` — Inertia router untuk navigasi programatik dari `&lt;script setup>`.
- `import { route } from 'ziggy-js'` — helper routing dari Ziggy agar bisa pakai nama route Laravel di JS (mis. `route('posts.index')`).
- `defineProps({ posts: Array, filters: Object })` — menerima props dari controller. `posts` berisi data ter-paginate, `filters` menyimpan query terakhir (q, status).
- `ref(props.filters.q ?? '')` — inisialisasi `search` dengan nilai filter terakhir dari server. Pakai `??` agar `null`/`undefined` jadi string kosong. Ini menjaga input tetap terisi setelah navigasi.
- `watch([search, status], ([q, s]) => ...)` — pantau beberapa ref sekaligus. Callback menerima array `[newQ, newS]` sesuai urutan source — inilah multi-source watch.
- `router.get(route('posts.index'), { q, status: s }, {...})` — kirim permintaan GET ke `posts.index` dengan query baru. Inertia mengganti props tanpa reload penuh.
- `preserveState: true` — jangan reset state komponen (input search tidak ke-clear) sehingga user bisa terus mengetik mulus.
- `preserveScroll: true` — pertahankan posisi scroll (berguna pada list panjang). Tanpa ini window meloncat ke atas tiap request.
- `replace: true` — pakai `history.replaceState` alih-alih `pushState`. Tanpa ini, tiap karakter yang diketik akan jadi entri history → tombol back akan traverse karakter demi karakter (UX buruk).
- `&lt;input v-model="search">` — two-way binding; setiap keystroke menulis `search.value`, memicu `watch`, yang memicu `router.get` — membuat filter otomatis real-time.
- `v-for="post in posts.data"` — `posts` diasumsikan paginasi Laravel (struktur `{ data, links, meta }`). Iterasi hanya `data` agar tidak render properti meta.
- `:key="post.id"` — wajib agar Vue dapat melacak item secara stabil saat urutan berubah karena filter.
:::

## 8.12 Ringkasan Bab

- `ref`: bungkus nilai, akses `.value` di script.
- `reactive`: objek reaktif, tidak bisa reassign.
- `computed`: cache nilai turunan.
- `watch`: efek samping saat state berubah.
- `onMounted`: akses DOM pertama.
- Template ref untuk akses element child.
- Tidak perlu Vue Router, Axios untuk navigasi.
- Fokus pada Composition API + Inertia helper.

:::tip Selanjutnya
[Bab 9](/bagian-3/bab-9) bahas navigasi lengkap: komponen `<Link>`, `router.visit`, preserve state & prefetch.
:::
