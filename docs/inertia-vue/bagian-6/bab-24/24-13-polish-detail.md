---
title: 24.13 - Polish & Detail Akhir
---

# 24.13 Polish & Detail Akhir

:::info Langkah 13 dari 15
Sentuhan terakhir: loading state, konfirmasi hapus, empty state, dark mode, dan error page.
:::

## Loading State di Tombol Submit

Pakai `form.processing` untuk disable + label loading:

```vue
<button type="submit" :disabled="form.processing" class="btn-primary">
  <svg v-if="form.processing" class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
  </svg>
  {{ form.processing ? 'Menyimpan...' : 'Simpan' }}
</button>
```

::: details Penjelasan Kode
- `form.processing` - boolean Inertia yang true selama request berlangsung. Otomatis false saat selesai (sukses atau gagal).
- `:disabled="form.processing"` - disable tombol, mencegah submit ganda. UX juga menandakan proses.
- `animate-spin` - utility Tailwind untuk rotasi tak terhingga. SVG dengan dua shape (circle luar pucat + path dalam) menciptakan spinner material-style.
- `viewBox="0 0 24 24"` - koordinat Canvas SVG 24x24, di-scale ke `h-4 w-4` (16x16 px). Path yang dimulai dari ujung (V0 lalu h4) membuat efek "separuh spinner`.
- `&#123;&#123; form.processing ? 'Menyimpan...' : 'Simpan' &#125;&#125;` - label dinamis berdasarkan state.
:::

## Indikator "Tersimpan" Sementara

`form.recentlySuccessful` true selama 2 detik setelah sukses:

```vue
<button type="submit" :disabled="form.processing" class="btn-primary">
  Simpan
</button>
<span v-if="form.recentlySuccessful" class="text-green-600 text-sm ml-2">
  Tersimpan!
</span>
```

::: details Penjelasan Kode
- `form.recentlySuccessful` - flag Inertia yang aktif true selama 2 detik setelah respons 2xx sukses. Otomatis false kembali setelah itu.
- Berguna untuk feedback cepat "Tersimpan!" tanpa memerlukan toast/message global.
- `v-if` - element muncul/hilang otomatis sesuai flag, tanpa transisi.
:::

## Konfirmasi Hapus dengan Modal (Bukan `window.confirm`)

:::warning Hindari `confirm()` browser
`window.confirm()` memblok UI dan terlihat seperti error di beberapa browser. Gunakan modal kustom.
:::

```vue
<script setup>
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import Modal from '@/Components/UI/Modal.vue'

const open = ref(false)
const target = ref(null)

function ask(project) {
  target.value = project
  open.value = true
}

function confirmDestroy() {
  router.delete(route('projects.destroy', target.value.id), {
    preserveScroll: true,
    onSuccess: () => { open.value = false; target.value = null },
  })
}
</script>

<template>
  <button @click="ask(project)" class="text-red-600">Hapus Project</button>

  <Modal :open="open" @close="open = false">
    <p class="text-lg font-semibold">Hapus project "{{ target?.name }}"?</p>
    <p class="text-sm text-gray-500 mt-1">Tindakan ini tidak bisa dibatalkan.</p>

    <div class="mt-4 flex justify-end gap-2">
      <button @click="open = false" class="btn-outline">Batal</button>
      <button @click="confirmDestroy" class="bg-red-600 text-white px-4 py-2 rounded">
        Ya, Hapus
      </button>
    </div>
  </Modal>
</template>
```

::: details Penjelasan Kode
- Pattern "ask-then-confirm": saat awal klik Hapus, simpan target di ref state `target.value` dan buka modal. Tidak langsung hapus.
- `target?.name` - optional chaining saat `target` masih `null` pada saat awal render. Hindari error akses properti null.
- `router.delete(...)` - imperative Inertia delete tanpa `&lt;Link>`. Cocok untuk aksi yang tidak dari anchor semantik.
- `onSuccess: () => { open.value = false; target.value = null }` - tutup modal dan reset target setelah sukses, siap untuk operasi hapus berikutnya.
- Modal bisa pakai komponen Headless UI Dialog (lihat TaskModal 24.7) agar aksesibel (focus trap, ESC, ARIA).
:::

## Empty State Informatif

Buat komponen reusable `Components/UI/EmptyState.vue`:

```vue
<script setup>
defineProps({
  text: { type: String, default: 'Tidak ada data' },
  hint: String,
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-gray-500">
    <svg class="h-12 w-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
    <p class="text-sm">{{ text }}</p>
    <p v-if="hint" class="text-xs mt-1">{{ hint }}</p>
    <slot name="action" />
  </div>
</template>
```

::: details Penjelasan Kode
- `defineProps` dengan `type` dan `default` - validasi prop ringan di sisi Vue. Bila prop tidak diberikan, default digunakan; type hanya warning di dev.
- `&lt;slot name="action" />` - named slot - memungkinkan parent meng-inject elemen spesifik (tombol) di area action. Lebih fleksibel dari prop bias.
- Icon SVG inline (clipboard icon). Garis.EditValue dengan `stroke-linecap="round"` dan `stroke-linejoin="round"` membuat ujung halus.
- `v-if="hint"` - hint opsional; hanya muncul jika diberikan.
:::

Pakai:

```vue
<EmptyState v-if="!tasks.data.length" text="Belum ada task" hint="Buat task pertama">
  <template #action>
    <button @click="openCreate" class="btn-primary mt-4">+ Tambah Task</button>
  </template>
</EmptyState>
```

::: details Penjelasan Kode
- `&lt;template #action>` - shorthand `#` untuk `v-slot:action`. Mengisi named slot di komponen EmptyState dengan tombol CTA.
- `v-if="!tasks.data.length"` - empty state hanya muncul jika tidak ada task. Array kosong memiliki `.length === 0` (falsy), jadi `!` menjadikan true.
- Beda dengan `v-else`; di sini hanya satu branch karena parent bisa tidak punya konten lain.
:::

## Responsive Layout untuk Mobile

Sidebar collapse di layar kecil:

```vue
<script setup>
import { ref } from 'vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile toggle -->
    <button
      @click="sidebarOpen = !sidebarOpen"
      class="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-gray-900 text-white"
    >
      ☰
    </button>

    <!-- Sidebar -->
    <aside
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      class="fixed md:translate-x-0 md:static w-56 bg-gray-900 text-gray-100 transition-transform"
    >
      <!-- nav -->
    </aside>

    <main class="md:ml-56 p-6">
      <slot />
    </main>
  </div>
</template>
```

::: details Penjelasan Kode
- `sidebarOpen` - state sederhana untuk toggle sidebar di mobile.
- `md:hidden` - tombol hamburger hanya tampil di layar < md. Di desktop, `md:translate-x-0` menahan sidebar terlihat tanpa toggle.
- `:class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"` - Tailwind transform classes. `-translate-x-full` menggeser sidebar keluar layar ke kiri (100% width); `translate-x-0` mengembalikan ke posisi 0.
- `transition-transform` - animasi smooth saat sidebar slide.
- `fixed md:static` - di mobile sidebar overlay dengan `position: fixed`; di desktop `static` menjadi bagian layout (mempengaruhi lebar main).
- `md:ml-56` - main content memberi margin kiri 56 (=14rem = 224px) untuk sidebar statis di desktop. Mobile tidak butuh margin karena sidebar fixed overlay.
:::

## Dark Mode dengan Pinia (Optional)

Buat store `theme`:

```js
// stores/theme.js
import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  })

  return {
    isDark,
    toggle: () => (isDark.value = !isDark.value),
  }
})
```

::: details Penjelasan Kode
- `defineStore('theme', () => {...})` - Pinia setup store dengan composition API. `() =>` factory mengembalikan state dan action.
- `ref(localStorage.getItem('theme') === 'dark')` - inisialisasi state dari localStorage agar preferensi dark mode tetap setelah refresh.
- `watchEffect` - menjalankan watcher langsung dan mengulang setiap kali dependency berubah. Di sini, setiap `isDark` berubah, side effect (toggle class di `&lt;html>` + simpan localStorage) dijalankan.
- `document.documentElement.classList.toggle('dark', isDark.value)` - tambah/hapus class `dark` di root `&lt;html>`. Tailwind's `darkMode: 'class'` akan membaca class ini untuk aktifkan `dark:` variants.
- `toggle: () => (isDark.value = !isDark.value)` - arrow function yang membalikan nilai. Note: perlu tanda kurung sekitar expression karena arrow body implicit return - tanpa tanda kurung, `{} ` akan diartikan block body.
- Mengembalikan object dengan `isDark` (state) dan `toggle` (action) - konsumsi seperti `theme.isDark`, `theme.toggle()`.
:::

Pakai di layout:

```vue
<script setup>
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
</script>

<template>
  <button @click="theme.toggle">
    {{ theme.isDark ? '☀' : '🌙' }}
  </button>
</template>
```

Enable `darkMode: 'class'` di `tailwind.config.js`:

```js
module.exports = {
  darkMode: 'class',
  // ...
}
```

Pakai dark variant di seluruh komponen:

```vue
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <!-- konten -->
</div>
```

## Error Page Kustom (403, 404, 500)

Buat `Pages/Error.vue`:

```vue
<script setup>
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import ErrorLayout from '@/Layouts/ErrorLayout.vue'

defineOptions({ layout: ErrorLayout })

const page = usePage()
const status = computed(() => page.props.status ?? 500)

const title = computed(() => ({
  403: 'Akses Ditolak',
  404: 'Halaman Tidak Ditemukan',
  419: 'Sesi Kadaluarsa',
  500: 'Kesalahan Server',
  503: 'Pemeliharaan',
}[status.value] ?? 'Terjadi Kesalahan'))

const message = computed(() => ({
  403: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
  404: 'URL yang Anda minta tidak tersedia.',
  500: 'Terjadi kesalahan di server kami. Tim sudah diberi tahu.',
}[status.value] ?? ''))
</script>

<template>
  <div class="text-center">
    <p class="text-7xl font-bold text-red-600">{{ status }}</p>
    <h1 class="mt-2 text-2xl font-bold">{{ title }}</h1>
    <p class="mt-1 text-gray-600">{{ message }}</p>
    <a href="/" class="mt-4 inline-block text-blue-600 underline">
      Kembali ke beranda
    </a>
  </div>
</template>
```

::: details Penjelasan Kode
- `page.props.status` - Inertia mengirim status code HTTP ke halaman error khusus (`Pages/Error.vue`) saat exception terjadi. Inertia men-trap laravel exception dan merender halaman ini.
- Lookup object `{ 403: '...', 404: '...', ... }[status.value] ?? '...'` - map status ke judul. Operator `??` memberi fallback bila status tidak ada di map (mis. 418 I'm a teapot).
- `defineOptions({ layout: ErrorLayout })` - pakai layout khusus yang minimal (tanpa sidebar/topbar) - lebih ramah untuk error context.
- Tiga computed terpisah (`status`, `title`, `message`) - deklarif, mudah di-debug; computed cache berdasarkan dependency.
- Untuk pencegahan 500 recursion: jangan gunakan layout yang ada logic auth/side effect, karena error page harus bisa dirender dalam kondisi apa pun.
:::

## Konfirmasi Password untuk Aksi Sensitif

Hapus project memerlukan konfirmasi password:

```php
Route::delete('projects/{project}', [ProjectController::class, 'destroy'])
    ->middleware(['auth', 'password.confirm']);
```

::: details Penjelasan Kode
- Middleware `password.confirm` - Laravel built-in: user harus memasukkan password lagi sebagai double-factor untuk aksi kritis. Mencegah session hijacking berbahaya saat user meninggalkan komputer ter-unlock.
- Setelah konfirmasi, sistem menyimpan timestamp konfirmasi di session; user tidak perlu konfirmasi ulang untuk aksi lain dalam 3 jam (konfigurasi `password_timeout`).
:::

Inertia otomatis render `Auth/ConfirmPassword.vue` saat middleware redirect.

## Tips UX Tambahan

- **Breadcrumb** di topbar (`Dashboard > Projects > Task Manager`).
- **Skeleton loader** saat fetch data (`<div class="animate-pulse">`).
- **Auto-focus** input pertama saat modal terbuka:
  ```vue
  <input ref="firstInput" />
  onMounted(() => firstInput.value?.focus())
  ```
- **Keyboard shortcut** untuk simpan (`Ctrl+Enter` di textarea).

## Selanjutnya

Polish selesai. Lanjut ke [24.14 - Testing Mini Project](/bagian-6/bab-24/24-14-testing).
