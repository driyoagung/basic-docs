---
title: Bab 20 — State Management dengan Pinia (Kapan Perlu, Kapan Tidak)
---

# Bab 20: State Management dengan Pinia (Kapan Perlu, Kapan Tidak)

:::info Bagian V — Ekosistem & Tooling
Bab ini menjelaskan kapan kamu **butuh** Pinia di aplikasi Inertia, dan kapan sebenarnya tidak perlu.
:::

## 20.1 Di Inertia, Pinia Tidak Selalu Diperlukan

Pinia adalah state management resmi Vue. Tapi di Inertia, banyak state sudah ditangani mekanisme lain:

| Sumber state | Tanggung jawab | Solusi |
| --- | --- | --- |
| Data server (list post, detail user) | Page-specific | `page.props` (Inertia) |
| State form (input, errors) | Form input | `useForm()` (Inertia) |
| Navigasi | URL & history | `router` (Inertia) |
| Auth info global (user, roles) | Share di semua halaman | `usePage().props.auth` |
| Toast / flash message | Notifikasi | `usePage().props.flash` |

Sisanya — UI state kecil & lokal — cukup `ref` di komponen yang punya state.

## 20.2 Kapan Pinia Benar-Benar Dibutuhkan

Pinia berguna untuk:

1. **State UI yang persisten antar halaman** — sidebar collapse, dark mode, language preference.
2. **State yang dipakai banyak komponen tidak dalam relasi parent-child** — keranjang belanja (jika tidak disinkronkan ke server), preferensi tampilan tabel.
3. **State realtime / WebSocket** — notification center yang push dari event Reverb/Echo.
4. **Cache data client-side yang expensive query** — autocomplete tag suggestion.

Aturan praktis:

- Jika state **perlu survive navigasi Inertia** → Pinia + persist.
- Jika state **di-share lintas banyak komponen** tanpa parent tunggal → Pinia.
- Jika state berbasis data server → props Inertia (bukan Pinia).
- Jika state form → `useForm()`.

## 20.3 Setup Pinia

```bash
npm install pinia
```

Registrasi di `app.js`:

```js
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import { createInertiaApp } from '@inertiajs/vue3'

const pinia = createPinia()

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
    return pages[`./Pages/${name}.vue`]
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(pinia)
      .mount(el)
  },
})
```

::: details Penjelasan Kode
- `createPinia()` — instansiasi root Pinia. Wajib satu instance untuk seluruh app.
- `import.meta.glob('./Pages/**/*.vue', { eager: true })` — Vite glob import; `eager: true` agar semua page dimuat sinkron ke satu bundle. Mengembalikan object map `path → module`.
- `setup({ el, App, props, plugin })` — callback Inertia saat initialization; `plugin` adalah Inertia Vue plugin untuk `&lt;Link>`, `usePage()`, dll.
- `.use(plugin).use(pinia)` — registrasi plugin Inertia dan Pinia ke instance Vue. Urutan bebas, biasakan konsisten.
- `.mount(el)` — attach Vue app ke element root Blade. Wajib sebagai langkah terakhir setelah semua `.use()`.
:::

## 20.4 Membuat Store

```js
// stores/sidebar.js
import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    collapsed: false,
  }),
  actions: {
    toggle() { this.collapsed = !this.collapsed },
    collapse() { this.collapsed = true },
    expand() { this.collapsed = false },
  },
})
```

::: details Penjelasan Kode
- `defineStore('sidebar', {...})` — id `'sidebar'` unik untuk store ini. Dipakai Pinia untuk devtools dan key persist.
- `state: () => ({...})` — factory function returning initial state (mirip `data()` di Options API). Wajib function agar tiap instance dapat object baru.
- `actions` — method untuk mutasi state. Akses state lewat `this`. Action Pinia otomatis tidak butuh `commit`/`dispatch` seperti Vuex.
:::

Composition API style (recommended):

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const collapsed = ref(false)
  const toggle = () => (collapsed.value = !collapsed.value)

  return { collapsed, toggle }
})
```

::: details Penjelasan Kode
- `defineStore('sidebar', () => {...})` — setup syntax (composition API). Function setup mengembalikan objek state, computed, dan method.
- `const collapsed = ref(false)` — `ref` untuk state reaktif (replaces `state`).
- `computed` (jika ada) → getters; function biasa → actions. Tidak ada pemisahan eksplisit seperti Options API.
- Recommended karena lebih fleksibel: bisa pakai composable watchers, dependency injection, dll.
:::

## 20.5 Pakai Store di Komponen

```vue
<script setup>
import { useSidebarStore } from '@/stores/sidebar'

const sidebar = useSidebarStore()
</script>

<template>
  <button @click="sidebar.toggle">{{ sidebar.collapsed ? 'Expand' : 'Collapse' }}</button>

  <aside :class="sidebar.collapsed ? 'w-16' : 'w-64'" class="transition-all">
    <!-- sidebar content -->
  </aside>
</template>
```

::: details Penjelasan Kode
- `useSidebarStore()` — panggil composable store; otomatis reaktif. Akses langsung state/action via `sidebar.collapsed` / `sidebar.toggle()`.
- `sidebar.collapsed ? 'w-16' : 'w-64'` — binding class kondisional untuk animasi width sidebar.
- Karena layout persistent, state sidebar tetap ada saat navigasi antar halaman — Pinia tidak unmount.
:::

## 20.6 Persist ke localStorage

Install plugin:

```bash
npm install pinia-plugin-persistedstate
```

Registrasi:

```js
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

::: details Penjelasan Kode
- `pinia.use(piniaPluginPersistedstate)` — registrasi plugin ke seluruh store. Store yang set `persist: true` akan otomatis sync state ke localStorage.
:::

Pakai:

```js
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: false,
  }),
  actions: {
    toggle() { this.isDark = !this.isDark },
  },
  persist: true, // ← keynya di localStorage
})
```

::: details Penjelasan Kode
- `persist: true` — opt-in persist. Plugin akan serialize state ke `localStorage['theme']` tiap berubah, dan hydrate saat store pertama dipakai.
- Saat user reload, preferensi dark mode tetap.
:::

## 20.7 Contoh Store Lengkap: Sidebar + Theme + Cart

```js
// stores/theme.js
import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
  })

  return {
    isDark,
    toggle: () => (isDark.value = !isDark.value),
  }
}, {
  persist: true,
})
```

::: details Penjelasan Kode
- `watchEffect(() => { document.documentElement.classList.toggle('dark', isDark.value) })` — side-effect reaktif: setiap `isDark` berubah, toggle class `dark` di `&lt;html>`. Cocok untuk dark mode Tailwind dengan strategy `class`.
- Argumen kedua `{ persist: true }` — di setup syntax, opsi persist diberikan sebagai argumen ketiga ke `defineStore`. Plugin akan persist `isDark` ke localStorage.
:::

```js
// stores/cart.js (local-only, no server sync)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.qty, 0)
  )

  const count = computed(() => items.value.reduce((s, i) => s + i.qty, 0))

  const add = (product, qty = 1) => {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      existing.qty += qty
    } else {
      items.value.push({ ...product, qty })
    }
  }

  const remove = (id) => {
    items.value = items.value.filter(i => i.id !== id)
  }

  const clear = () => (items.value = [])

  return { items, total, count, add, remove, clear }
}, {
  persist: true,
})
```

::: details Penjelasan Kode
- `computed(() => items.value.reduce(...))` — derived state reaktif (`getters` di Options API). Total dihitung ulang otomatis saat `items` berubah.
- `items.value.find(i => i.id === product.id)` — cari item existing; jika ada, tambah `qty` saja (ganti seluruh item akan hapus referensi reaktif).
- `items.value.push({ ...product, qty })` — spread product + tambah field `qty`. Hindari referensi yang sama dengan `product` agar bisa di-edit tanpa side-effect.
- `items.value = items.value.filter(...)` — buat array baru (bukan `splice`) agar Vue deteksi perubahan.
- `persist: true` — cart disimpan ke localStorage; user bisa refresh tanpa kehilangan isi keranjang.
:::

## 20.8 Kapan TIDAK Pakai Pinia

### Hindari duplikasi data server

```js
// ❌ SALAH - duplikasi
const usePosts = defineStore('posts', () => {
  const posts = ref([])
  async function fetch() {
    const res = await axios.get('/api/posts')
    posts.value = res.data
  }
  return { posts, fetch }
})
```

::: details Penjelasan Kode
- Pattern ini melanggar mental model Inertia — data server harus dari props. Buat endpoint server untuk filter & reload via `router.get`.
- Konsekuensinya: dua sumber truth (state client + state server), data bisa sinkron dan menyebabkan bug konsistensi.
:::

### Jangan ganti auth user dengan store

```js
// ❌ Anti-pattern
const useAuth = defineStore('auth', () => {
  const user = ref(null)
  // user manual via axios
})
```

Pakai punya Inertia:

```js
// ✅ Benar
const page = usePage()
const user = computed(() => page.props.auth.user)
```

::: details Penjelasan Kode
- `usePage()` — composable Inertia untuk akses page response (props, URL, component). Reaktif terhadap navigasi.
- `page.props.auth.user` — Laravel share `auth.user` global via Middleware `ShareInertiaData`. Otomatis refresh saat navigate / logout.
- Pakai punya Inertia untuk auth agar konsisten dengan server-side state.
:::

### Jangan ganti state form

`useForm()` sudah menjadi stateful form yang luar biasa. Pakai itu bukan Pinia.

## 20.9 Pola Tepat: Local First, Pinia Bila Perlu

:::tip Aturan
- Mulai dengan **`ref()` lokal** di `AppLayout.vue`.
- Jika state harus survive di luar layout persisten → Pinia.
- Jika state dipakai banyak sibling component → Pinia.
- Sumber data server tetap via props Inertia.
:::

## 20.10 Integrasi Pinia dengan Inertia: Use Case Real

Notification center realtime. Reverb push ke Pusher, store simpan notifikasi:

```js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref([])
  const unread = computed(() => items.value.filter(n => !n.read))

  function push(notification) {
    items.value.unshift(notification)
  }

  function markAsRead(id) {
    const n = items.value.find(n => n.id === id)
    if (n) n.read = true
  }

  return { items, unread, push, markAsRead }
})
```

::: details Penjelasan Kode
- `unread = computed(...)` — getter reaktif; terupdate otomatis saat `items` berubah atau field `read` di-toggle.
- `items.value.unshift(notification)` — tambah notifikasi baru ke depan array (reverse cron). Vue mendeteksi mutation method `unshift`.
- `markAsRead(id)` — cari lalu toggle `n.read`. Karena `items` adalah `ref` array of reactive object, perubahan properti terdeteksi.
:::

Init di layout:

```js
import Echo from 'laravel-echo'
import { useNotificationStore } from '@/stores/notifications'

const notifications = useNotificationStore()

onMounted(() => {
  window.Echo.private(`App.Models.User.${user.value.id}`)
    .notification(push)
})
```

::: details Penjelasan Kode
- `window.Echo.private(...)` — subscribe channel private Reverb/Pusher. Hanya user terautentikasi yang dapat listen (otorisasi dengan `Broadcast::channel`).
- `.notification(push)` — listener untuk event notifikasi; callback `push` adalah method store yang di-destructure (contoh disederhanakan — pastikan `push` diambil dari store).
- Komponen `&lt;NotificationBell>` pakai store — dapat notifikasi baru lewat push realtime.
:::

## 20.11 Testing Store

Vitest:

```js
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { describe, it, expect, beforeEach } from 'vitest'

describe('cart', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('adds item', () => {
    const cart = useCartStore()
    cart.add({ id: 1, price: 100 }, 2)
    expect(cart.count).toBe(2)
    expect(cart.total).toBe(200)
  })
})
```

::: details Penjelasan Kode
- `setActivePinia(createPinia())` — wajib dipanggil sebelum `useStore` di test. Tanpa ini, store tidak punya instance Pinia aktif akan error. Di-set di `beforeEach` agar tiap test punya state fresh.
- `cart.add({ id: 1, price: 100 }, 2)` — panggil action store.
- `expect(cart.count).toBe(2)` — assert getter `count`; tidak butuh `.value` di Options-style atau saat store dipakai di luar setup komponen (Pinia auto-unwrap).
:::

## 20.12 Ringkasan Bab

- Banyak state sudah ditangani oleh Inertia (`page.props`, `useForm`, `router`).
- Pinia untuk state UI persisten + share lintas komponen + realtime.
- `pinia-plugin-persistedstate` untuk localStorage.
- **Jangan** duplikasi data server / form / auth ke Pinia.
- Pakai komposisi store (setup syntax) lebih ekspresif.
- Testing store dengan Vitest (`setActivePinia`).

:::tip Selanjutnya
[Bab 21](/bagian-5/bab-21): SEO & SSR — kapan perlu dan bagaimana setup `@inertiajs/server` server-side rendering.
:::
