---
title: Bab 18 — Tailwind CSS — Styling di Era Inertia
---

# Bab 18: Tailwind CSS — Styling di Era Inertia

:::info Bagian V — Ekosistem & Tooling
Tailwind cocok banget dengan Inertia + Vue — utility-first, scoped-color, dan ekosistem komponen rich.
:::

## 18.1 Mengapa Tailwind Cocok dengan Inertia + Vue

- **Utility-first**: tidak perlu switch ke file CSS terpisah — semua styling di `.vue`.
- **Scoped**: dengan PostCSS + Tailwind, styling tidak konflik antar komponen.
- **HMR-friendly**: ubah class → auto-reload tanpa rebuild CSS.
- **Komponen ekosistem**: shadcn/ui, Headless UI, Flowbite, PrimeVue sudah Tailwind-ready.

## 18.2 Setup Tailwind — Recapping Bab 2

Versi 3 (default):

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.vue',
    './resources/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```

::: details Penjelasan Kode
- `content: [...]` — daftar path file yang akan di-scan oleh Tailwind untuk mendeteksi class yang dipakai. File di luar daftar ini akan di-purge (class-nya dihapus dari output CSS).
- `theme.extend.colors.brand` — mendaftarkan palet warna kustom `brand` (50—900) sehingga class seperti `bg-brand-600`, `text-brand-700` tersedia. Dipakai untuk konsistensi warna aplikasi.
- `theme.extend.fontFamily.sans` — override font default Tailwind; pakai Inter dahulu, fallback ke system-ui.
- `plugins` — `forms` untuk styling input default, `typography` untuk class `prose` (konten markdown/artikel), `aspect-ratio` untuk rasio gambar responsif.
:::

`resources/css/app.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50;
  }
  .input {
    @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500;
  }
}
```

::: details Penjelasan Kode
- `@tailwind base/components/utilities` — tiga layer Tailwind: reset (base), class komponen, dan utility class. Urutan ini penting agar utility bisa override komponen.
- `@layer components` — mendeklarasikan class reusable dalam layer komponen sehingga utility class masih menang saat konflik (specificity sama, urutan CSS menentukan).
- `@apply ...` — menyatukan banyak utility ke satu class bernama; mencegah pengulangan `rounded bg-blue-600 ...` di tiap tombol.
:::

## 18.3 Tailwind v4 dengan Vite Plugin

Tailwind v4 (rilis 2025) lebih cepat dan pakai config di CSS:

```bash
npm install tailwindcss @tailwindcss/vite
```

`vite.config.js`:

```js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [laravel(), vue(), tailwindcss()],
})
```

::: details Penjelasan Kode
- `@tailwindcss/vite` — plugin Vite resmi Tailwind v4, menggantikan `postcss` + `autoprefixer`. Lebih cepat karena terintegrasi langsung pipeline Vite (HMR instan).
- ditambahkan ke array `plugins` setelah `laravel()` dan `vue()` agar Tailwind memproses CSS setelah Vue SFC di-resolve.
:::

`resources/css/app.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --font-sans: 'Inter', sans-serif;
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 px-4 py-2 text-white rounded;
  }
}
```

::: details Penjelasan Kode
- `@import "tailwindcss"` — single import Tailwind v4 (menggantikan tiga `@tailwind` directive). Engine v4 otomatis mendeteksi content dari git-tracked files.
- `@theme { --color-brand-500: ... }` — konfigurasi tema v4 lewat CSS custom properties. Otomatis menghasilkan utility `bg-brand-500`, `text-brand-500`, dll.
- `--font-sans` — mengganti `theme.extend.fontFamily.sans` di v3; akan dipakai oleh utility `font-sans`.
:::

## 18.4 Styling: Tailwind vs `&lt;style scoped&gt;`

| Senario | Pakai |
| --- | --- |
| Layout, spacing, color, typography | Tailwind utility class |
| Animasi keyframe kompleks | `style scoped` (tag `&lt;style scoped&gt;`) |
| Pseudo-selector complex (`:nth-child(3n+1)`) | `style scoped` |
| Override deep child (kadang) | `:deep()` di scoped |
| State styling (hover, focus, group-hover) | Tailwind `hover:`, `focus:`, `group-hover:` |

Mixin kedua:

```vue
<template>
  <div class="grid grid-cols-3 gap-4 my-component">
    <!-- ... -->
  </div>
</template>

<style scoped>
.my-component {
  /* CSS kompleks yang sulit di utility */
  background: radial-gradient(...);
}

.my-component > div:nth-child(3n+1) {
  grid-column: span 2;
}
</style>
```

::: details Penjelasan Kode
- `&lt;style scoped>` — Vue menambahkan attribute `data-v-xxx` unik pada elemen agar CSS hanya berlaku di komponen ini (mencegah bocor ke komponen lain).
- `grid grid-cols-3 gap-4` — utilities Tailwind di template untuk layout dasar (grid 3 kolom).
- `:nth-child(3n+1)` — pseudo-selector kompleks; lebih ringkas di CSS murni daripada melalui Tailwind arbitrary variant `[&:nth-child(3n+1)]:col-span-2`.
- `radial-gradient(...)` — gradient kompleks; Tailwind v3 tidak punya utility penuh untuk ini sehingga lebih masuk akal pakai CSS scoped.
:::

## 18.5 Dark Mode

Enable di `tailwind.config.js`:

```js
module.exports = {
  darkMode: 'class',
  // atau 'media' untuk follows OS
}
```

::: details Penjelasan Kode
- `darkMode: 'class'` — dark mode diaktifkan saat elemen root (`&lt;html>`) punya class `dark`. Memberi kontrol eksplisit lewat toggle UI.
- `darkMode: 'media'` — alternatif mengikuti `prefers-color-scheme` OS; tidak butuh toggle, tapi user tidak bisa override manual.
:::

Toggle di root HTML:

```html
<!-- app.blade.php awalnya membaca cookie / session -->
<html class="{{ session('dark_mode') ? 'dark' : '' }}">
```

Di Vue, simpan preferensi ke Pinia or localStorage:

```js
// composables/useTheme.js
import { ref, watchEffect } from 'vue'

const isDark = ref(document.documentElement.classList.contains('dark'))

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('dark_mode', isDark.value ? '1' : '0')
})

export function useTheme() {
  return {
    isDark,
    toggle: () => (isDark.value = !isDark.value),
  }
}
```

::: details Penjelasan Kode
- `const isDark = ref(...)` — state reaktif global yang dideklarasikan di luar fungsi (module scope). Komposable singleton: semua komponen yang panggil `useTheme()` share `isDark` yang sama.
- `document.documentElement.classList.contains('dark')` — inisialisasi state dari class yang sudah diberikan Blade server-side. Mencegah "flash of light mode" saat reload.
- `watchEffect(() => { ... })` — side-effect berjalan otomatis tiap `isDark` berubah. Toggle class `dark` di `&lt;html>` lalu simpan ke localStorage untuk persist.
- `toggle: () => (isDark.value = !isDark.value)` — method untuk membalik state; memicu `watchEffect` di atas.
:::

Pakai di layout:

```vue
<script setup>
import { useTheme } from '@/composables/useTheme'
const { isDark, toggle } = useTheme()
</script>

<template>
  <button @click="toggle">{{ isDark ? '☀' : '🌙' }}</button>
</template>
```

Styling dark mode utilities:

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Konten
</div>
```

## 18.6 Komponen UI Populer untuk Inertia + Vue

### Headless UI

Untuk komponen accessible tanpa style bawaan:

```bash
npm install @headlessui/vue
```

Contoh dropdown:

```vue
<script setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
</script>

<template>
  <Menu>
    <MenuButton class="btn">More</MenuButton>
    <MenuItems class="absolute right-0 mt-2 bg-white rounded shadow-lg">
      <MenuItem v-slot="{ active }">
        <a :class="active && 'bg-blue-100'" href="/profile">Profile</a>
      </MenuItem>
      <MenuItem v-slot="{ active }">
        <a :class="active && 'bg-blue-100'" href="/settings">Settings</a>
      </MenuItem>
    </MenuItems>
  </Menu>
</template>
```

::: details Penjelasan Kode
- `&lt;Menu>` — root component Headless UI; mengelola state open/close + menyediakan context untuk children. Menangani keyboard navigation (arrow, escape) sesuai ARIA spec.
- `&lt;MenuButton>` — tombol trigger; otomatis set `aria-haspopup`, `aria-expanded`, dan `id` yang dipakai `MenuItems` untuk `aria-labelledby`.
- `&lt;MenuItems>` — panel dropdown; Headless UI menyembunyikan saat blur/outside-click. Class Tailwind untuk posisi `absolute right-0 mt-2`.
- `&lt;MenuItem v-slot="{ active }">` — scoped slot memberi tahu jika item sedang aktif (dihover / keyboard focus); `active && 'bg-blue-100'` menambah highlight class.
:::

### shadcn/vue (Radix Vue based)

Alternatif Headless UI yang lebih lengkap: <https://www.shadcn-vue.com>. Copy-paste komponen ke project, kamu punya source.

```bash
npx shadcn-vue@latest init
npx shadcn-vue@latest add button dialog dropdown-menu
```

### Flowbite

Komponen Tailwind markup siap pakai dengan JS biasa (Vue wrappers tersedia):

```bash
npm install flowbite
```

### PrimeVue

Library komponen lengkap dengan tema:

```bash
npm install primevue @primevue/themes
```

```js
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

createApp(...)
  .use(PrimeVue, { ripple: true, theme: { preset: Aura } })
```

::: details Penjelasan Kode
- `createApp(...).use(PrimeVue, ...)` — registrasi plugin PrimeVue global. Tersedia komponen `&lt;Button>`, `&lt;DataTable>`, dll tanpa import per komponen.
- `ripple: true` — efek ripple Material Design saat klik tombol.
- `theme: { preset: Aura }` — PrimeVue v4 memakai "preset" tema (Aura, Lara, Nora). Preset adalah object design tokens, bisa dikustomisasi lewat `definePreset`.
:::

## 18.7 Icons

### Heroicons

```bash
npm install @heroicons/vue
```

Pakai:

```vue
<script setup>
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <button class="inline-flex items-center gap-2">
    <PencilIcon class="h-5 w-5" /> Edit
  </button>
</template>
```

### Lucide

```bash
npm install lucide-vue-next
```

```vue
<script setup>
import { Pencil, Trash2 } from 'lucide-vue-next'
</script>

<template>
  <Pencil class="h-5 w-5" />
</template>
```

### Custom SVG

```vue
<template>
  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
</template>
```

## 18.8 Pola Component Class Map

Untuk variant button, map dengan template literal:

```vue
<script setup>
const props = defineProps({
  variant: { type: String, default: 'primary' },
})

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  danger:  'bg-red-600 text-white hover:bg-red-700',
  ghost:   'bg-transparent hover:bg-gray-100',
  outline: 'border border-gray-300 hover:bg-gray-50',
}
</script>

<template>
  <button :class="`rounded px-4 py-2 ${variants[variant]}`">
    <slot />
  </button>
</template>
```

::: details Penjelasan Kode
- `defineProps({ variant: { type: String, default: 'primary' } })` — prop `variant` dengan default `primary`; tidak wajib diisi parent.
- `variants` — plain object map; lookup `variants[variant]` mengembalikan class string sesuai variant.
- `` `rounded px-4 py-2 ${variants[variant]}` `` — template literal menggabungkan base class dengan variant class. Pendekatan sederhana, tidak butuh library tambahan.
:::

Atau pakai `class-variance-authority`:

```bash
npm install class-variance-authority
```

```js
import { cva } from 'class-variance-authority'

const button = cva('rounded px-4 py-2', {
  variants: {
    variant: {
      primary: 'bg-blue-600 text-white',
      danger:  'bg-red-600 text-white',
    },
  },
  defaultVariants: { variant: 'primary' },
})

// <button :class="button({ variant: 'danger' })">
```

::: details Penjelasan Kode
- `cva('rounded px-4 py-2', {...})` — factory function CVA; arg pertama adalah base class, arg kedua konfigurasi variants.
- `variants.variant` — object variant → class string. CVA meng-compose class sesuai variant yang dipilih.
- `defaultVariants: { variant: 'primary' }` — variant default bila tidak diberikan. Mencegah class kosong.
- `button({ variant: 'danger' })` — panggil factory untuk dapat class string final; cocok di-bind ke `:class`.
:::

## 18.9 Tips Performance Tailwind

- `content` di config harus lengkap — semua file `.vue`, `.js`, `.blade.php` yang memakai class harus ter-list agar JIT tidak purge salah.
- Untuk bundle production: Tailwind hanya include class yang benar-benar dipakai.
- Hindari `style="color:..."` inline untuk warna brand — pakai `--color-brand-*` di theme.
- Gunakan `@apply` di `@layer components` untuk class majemuk yang sering dipakai (`btn-primary`, `input`).

## 18.10 Ringkasan Bab

- Tailwind v3 (`@tailwind base/components/utilities`) atau v4 (`@import "tailwindcss"` dengan Vite plugin).
- Config theme extend untuk brand color dan font.
- Bisa mix Tailwind utility + `&lt;style scoped&gt;`.
- Dark mode via `class` strategy + Pinia/localStorage.
- Library: Headless UI (unstyled), shadcn/vue (copy source), Flowbite, PrimeVue.
- Icons: Heroicons, Lucide.

:::tip Selanjutnya
[Bab 19](/bagian-5/bab-19): pola membuat komponen UI reusable — Button, Modal, DataTable, Dropdown.
:::
