---
title: 24.5 - Layout Utama Aplikasi
---

# 24.5 Layout Utama Aplikasi

:::info Langkah 5 dari 15
Buat dua layout: `AppLayout` (untuk app) dan `AuthLayout` (untuk login/register).
:::

## AppLayout - Sidebar + Topbar

```vue
<!-- resources/js/Layouts/AppLayout.vue -->
<script setup>
import { Link, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import { route } from 'ziggy-js'
import FlashMessage from '@/Components/UI/FlashMessage.vue'

const page = usePage()
const user = computed(() => page.props.auth.user)
</script>

<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-56 bg-gray-900 text-gray-100 flex flex-col">
      <Link :href="route('dashboard')" class="px-4 py-4 text-lg font-bold">
        TaskManager
      </Link>
      <nav class="flex-1 px-2 space-y-1 text-sm">
        <Link
          :href="route('dashboard')"
          :class="route().current('dashboard') && 'bg-gray-800'"
          class="block px-3 py-2 rounded hover:bg-gray-800"
        >
          Dashboard
        </Link>
        <Link
          :href="route('projects.index')"
          :class="route().current('projects.*') && 'bg-gray-800'"
          class="block px-3 py-2 rounded hover:bg-gray-800"
        >
          Projects
        </Link>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col">
      <!-- Topbar -->
      <header class="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span class="text-gray-700">{{ user?.name }}</span>
        <Link
          :href="route('logout')"
          method="post"
          as="button"
          class="text-red-600 text-sm"
        >
          Logout
        </Link>
      </header>

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>

    <FlashMessage />
  </div>
</template>
```

::: details Penjelasan Kode
- `&lt;script setup>` - sintaks Composition API Vue 3. Semua variable di top-level otomatis tersedia di template tanpa perlu `return`.
- `Link, usePage` dari `@inertiajs/vue3` - `Link` untuk navigasi tanpa reload; `usePage` untuk akses props server.
- `route` dari `ziggy-js` - helper global yang menghasilkan URL berdasarkan nama route Laravel. Bisa dipakai karena Ziggy sudah expose route ke JS.
- `usePage()` + `computed` - idiom standar untuk membaca user yang login. Dideklarasikan di layout agar anak-anaknya (halaman) tidak perlu import ulang.
- `route().current('dashboard')` - mengecek apakah route aktif saat ini cocok dengan pola `'dashboard'`. Dipakai untuk highlight menu aktif. Pola wildcard `'projects.*'` cocok dengan `projects.index`, `projects.show`, dst.
- `:class="... && 'bg-gray-800'"` - trik Vue: jika expression truthy, kelas `bg-gray-800` ditambahkan; jika falsy, tidak menambahkan apa-apa (bukan string "false").
- `&lt;slot />` - tempat Inertia meng-inject konten halaman. Saat `Inertia::render('Dashboard')` dipanggil, `Dashboard.vue` dirender dengan layout ini dan isinya menggantikan `&lt;slot />`.
- `&lt;FlashMessage />` - komponen notifikasi global. Diletakkan di layout agar tampil di semua halaman tanpa perlu menambah manual.
:::

## AuthLayout - Sederhana Untuk Login/Register

```vue
<!-- resources/js/Layouts/AuthLayout.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md bg-white rounded shadow p-6">
      <slot />
    </div>
  </div>
</template>
```

::: details Penjelasan Kode
- Layout auth minimal tanpa sidebar/topbar - cukup kartu putih di tengah. Menghindari user yang belum login melihat menu internal.
- Tanpa `&lt;script setup>` karena tidak butuh state/body script. Khusus template, hanya `&lt;template>` sudah cukup di SFC Vue.
- `max-w-md` - lebar maksimum medium (28rem) sesuai Tailwind, nyaman untuk form.
- `&lt;slot />` - slot default menampung isi page auth (form login, register, dll).
:::

## Pakai Layout di Page

Untuk halaman app (mis. `Dashboard.vue`):

```vue
<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
defineOptions({ layout: AppLayout })
</script>
```

Untuk halaman auth (Login.vue, Register.vue):

```vue
<script setup>
import AuthLayout from '@/Layouts/AuthLayout.vue'
defineOptions({ layout: AuthLayout })
</script>
```

::: details Penjelasan Kode
- `defineOptions({ layout: AppLayout })` - macro compiler Vue 3.3+ untuk mengatur opsi komponen tanpa menggunakan `&lt;script>` block terpisah. Inertia membaca `layout` dari opsi komponen untuk menentukan layout mana yang membungkus halaman ini.
- Hasilnya: `Dashboard.vue` dirender di dalam `AppLayout`, dan `Login.vue` dalam `AuthLayout`. Konten halaman mengisi `&lt;slot />` layout.
- `import AppLayout from '@/Layouts/AppLayout.vue'` - alias `@` adalah Vite alias ke `resources/js/`, sesuai konfigurasi Breeze default.
:::

## Set Default Layout di app.js (Optional)

Agar tidak tulis `defineOptions` di tiap page:

```js
import { createInertiaApp } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
    const page = pages[`./Pages/${name}.vue`]
    page.default.layout = page.default.layout || AppLayout
    return page
  },
  // ...
})
```

::: details Penjelasan Kode
- `createInertiaApp({...})` - bootstrap app Inertia. Callback `resolve` dipanggil setiap kali navigasi, untuk mendapatkan komponen halaman berdasarkan nama route.
- `import.meta.glob('./Pages/**/*.vue', { eager: true })` - fitur Vite yang mengimpor semua file `.vue` di folder `Pages` secara eager (langsung di-bundle, bukan lazy). Hasilnya object dengan key path file dan value modul.
- `pages[./Pages/${name}.vue]` - mengambil komponen berdasarkan nama yang dikirim controller (mis. `'Dashboard'` -> `./Pages/Dashboard.vue`).
- `page.default.layout = page.default.layout || AppLayout` - default-kan `AppLayout` sebagai layout jika komponen tidak menetapkan sendiri. Pola `a || b` memilih `b` hanya jika `a` falsy - jadi jika halaman pakai `defineOptions({ layout: ... })`, nilainya tidak ditimpa.
- Strategi ini membuat sebagian besar page tidak perlu `defineOptions`; cukup override di halaman auth saat perlu layout berbeda.
:::

Override per-halaman (Login pakai `AuthLayout`):

```vue
<script setup>
import AuthLayout from '@/Layouts/AuthLayout.vue'
defineOptions({ layout: AuthLayout }) // override default
</script>
```

## Komponen FlashMessage

Buat komponen notifikasi di layout (detail lengkap di [Bab 13](/bagian-4/bab-13)):

```vue
<!-- Components/UI/FlashMessage.vue -->
<script setup>
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

const page = usePage()
const success = computed(() => page.props.flash?.success)
const error = computed(() => page.props.flash?.error)
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <div v-if="success" class="bg-green-600 text-white rounded px-4 py-2 shadow-lg">
      {{ success }}
    </div>
    <div v-if="error" class="bg-red-600 text-white rounded px-4 py-2 shadow-lg">
      {{ error }}
    </div>
  </div>
</template>
```

::: details Penjelasan Kode
- `page.props.flash?.success` - optional chaining (`?.`) mengembalikan `undefined` jika `flash` null, mencegah error mengakses properti objek null. Cocok ketika user belum punya flash message.
- `computed(...)` - membuat ref reaktif; render template otomatis update saat props Inertia berubah (mis. setelah submit form berhasil dan server kirim flash baru).
- `v-if="success"` - hanya merender jika ada pesan. Saat flash dihapus di sesi (one-time), blok hilang otomatis.
- Posisi `fixed top-4 right-4 z-50` - mengambang di pojok kanan atas, di atas elemen lain (`z-50` tinggi).
:::

## Selanjutnya

Layout siap. Lanjut ke [24.6 - Modul Project (CRUD)](/bagian-6/bab-24/24-6-modul-project).
