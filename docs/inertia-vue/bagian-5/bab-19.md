---
title: Bab 19 — Komponen UI yang Dapat Digunakan Ulang
---

# Bab 19: Komponen UI yang Dapat Digunakan Ulang

:::info Bagian V — Ekosistem & Tooling
Struktur folder `Components/` di Laravel + Inertia, dan pola membuat Button, Modal, DataTable, Dropdown.
:::

## 19.1 Struktur Folder `Components/

```text
resources/js/
└── Components/
    ├── UI/
    │   ├── Button.vue
    │   ├── Input.vue
    │   ├── Modal.vue
    │   ├── Badge.vue
    │   ├── Card.vue
    │   ├── Spinner.vue
    │   ├── EmptyState.vue
    │   └── Dropdown.vue
    ├── Form/
    │   ├── TextInput.vue
    │   ├── TextareaInput.vue
    │   ├── SelectInput.vue
    │   ├── CheckboxInput.vue
    │   ├── FileInput.vue
    │   ├── InputLabel.vue
    │   └── InputError.vue
    ├── Table/
    │   ├── DataTable.vue
    │   ├── TableHeader.vue
    │   ├── TableRow.vue
    │   └── Pagination.vue
    └── [Feature]/
        ├── PostCard.vue
        └── TaskModal.vue
```

Aturan:

- `UI/` — generic, fitur-agnostik.
- `Form/` — input controls.
- `Table/` — table-related composite.
- `[Feature]/` — komponen spesifik fitur (`Posts/PostCard.vue`).

## 19.2 Komponen Button

```vue
<!-- Components/UI/Button.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  type: { type: String, default: 'button' },
  disabled: Boolean,
  loading: Boolean,
  as: { type: String, default: 'button' },
})

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded font-medium transition',
  'focus:outline-none focus:ring-2 focus:ring-blue-500',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  sizeClass.value,
  variantClass.value,
])

const sizeClass = computed(() => ({
  sm: 'px-2.5 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}[props.size]))

const variantClass = computed(() => ({
  primary:  'bg-blue-600 text-white hover:bg-blue-700',
  danger:   'bg-red-600 text-white hover:bg-red-700',
  ghost:    'text-gray-700 hover:bg-gray-100',
  outline:  'border border-gray-300 text-gray-700 hover:bg-gray-50',
  link:     'text-blue-600 underline',
}[props.variant]))
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? type : undefined"
    :disabled="disabled || loading"
    :class="classes"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
    </svg>
    <slot />
  </component>
</template>
```

::: details Penjelasan Kode
- `as: { default: 'button' }` — prop "polymorphic": komponen bisa render sebagai `button`, `a`, atau bahkan `RouterLink`. Memakai `&lt;component :is="as">` (dynamic component Vue).
- `type: as === 'button' ? type : undefined` — attribute `type` hanya relevan untuk `&lt;button>`; untuk `&lt;a>` di-set `undefined` agar tidak dirender (menghindari warning HTML).
- `disabled="disabled || loading"` — saat `loading`, tombol otomatis disabled agar user tidak klik dua kali; spinner ditampilkan.
- `classes = computed(() => [...])` — array class Tailwind yang digabung otomatis Vue. Menggunakan `computed` agar reaktif terhadap perubahan `props.size` / `props.variant`.
- `{ sm: '...', md: '...', lg: '...' }[props.size]` — lookup table pattern: akses properti berdasarkan props. Lebih ringkas dari `if/else` atau `switch`.
- `animate-spin` — utility Tailwind untuk keyframe `spin`; menampilkan spinner saat `loading: true`.
- `&lt;slot />` — default slot untuk content tombol (teks/icon).
:::

Pakai:

```vue
<Button variant="primary" size="md" :loading="form.processing">Simpan</Button>
<Button variant="danger" @click="destroy">Hapus</Button>
<Button as="a" href="/">Kembali</Button>
```

## 19.3 Komponen Modal

```vue
<!-- Components/UI/Modal.vue -->
<script setup>
import { onUnmounted, watch } from 'vue'

const props = defineProps({
  open: Boolean,
  size: { type: String, default: 'md' },
  closeOnOverlay: { type: Boolean, default: true },
})
const emit = defineEmits(['update:open', 'close'])

function close() {
  emit('update:open', false)
  emit('close')
}

function onOverlayClick() {
  if (props.closeOnOverlay) close()
}

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})

const sizeClass = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-40 flex items-center justify-center p-4"
      >
        <div class="fixed inset-0 bg-black/50" @click="onOverlayClick" />
        <div
          :class="['relative w-full rounded-lg bg-white shadow-xl', sizeClass[size]]"
        >
          <button
            class="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            @click="close"
          >&times;</button>
          <div class="p-6">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
```

::: details Penjelasan Kode
- `defineEmits(['update:open', 'close'])` — dua emit: `update:open` agar kompatibel dengan `v-model:open`, dan `close` untuk hook tambahan.
- `close()` — selalu emit `update:open` dengan `false`. Parent pakai `v-model:open="open"` sehingga state sinkron.
- `watch(() => props.open, ...)` — saat `open` menjadi `true`, set `body.style.overflow = 'hidden'` untuk mencegah body scroll di belakang modal. Dipecah saat `false` kembali normal.
- `onUnmounted(...)` — cleanup safety: bila komponen di-unmount saat modal masih open, reset overflow body agar tidak "stuck".
- `&lt;Teleport to="body">` — render modal ke `&lt;body>` bukan di tempat komponen dipakai. Menghindari masalah `overflow: hidden` atau `z-index` parent yang memotong modal.
- `&lt;Transition name="modal">` — animasi Vue; class `modal-enter-active` dst. didefinisikan di `&lt;style scoped>`. Transition hanya jalan saat `v-if` toggle.
- `bg-black/50` — utility Tailwind opacity: warna hitam 50% transparan (overlay backdrop).
- `sizeClass[size]` — lookup object untuk max-width; dipilih lewat prop `size`.
:::

Pakai dengan `v-model`:

```vue
<script setup>
import Modal from '@/Components/UI/Modal.vue'
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <button @click="open = true">Buka</button>
  <Modal v-model:open="open" size="md">
    <h3 class="text-lg font-bold">Judul Modal</h3>
    <p>Isi modal...</p>
    <div class="mt-4 flex justify-end gap-2">
      <button @click="open = false" class="btn-outline">Tutup</button>
      <button class="btn-primary">OK</button>
    </div>
  </Modal>
</template>
```

::: tip Teleport ke body
Modal di-Teleport ke `<body>` agar lepas dari z-index / overflow:hidden parent.
:::

## 19.4 Komponen DataTable

```vue
<!-- Components/Table/DataTable.vue -->
<script setup>
import Pagination from '@/Components/Table/Pagination.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, required: true }, // [{ key, label, sortable }]
  links: Array, // meta.links from paginator
  loading: Boolean,
  emptyText: { type: String, default: 'Tidak ada data' },
})

const emit = defineEmits(['sort', 'page-change'])
</script>

<template>
  <div class="overflow-x-auto bg-white rounded shadow">
    <table class="min-w-full">
      <thead>
        <tr class="border-b bg-gray-50 text-left">
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-2 text-xs font-semibold uppercase text-gray-500"
          >
            <slot :name="`header-${col.key}`" :column="col">{{ col.label }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-4 py-8 text-center text-gray-500">
            <Spinner /> Memuat...
          </td>
        </tr>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length" class="px-4 py-8 text-center text-gray-500">
            {{ emptyText }}
          </td>
        </tr>
        <tr
          v-else
          v-for="(row, i) in rows"
          :key="row.id ?? i"
          class="border-b hover:bg-gray-50"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-2"
          >
            <slot :name="`cell-${col.key}`" :row="row" :index="i">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <Pagination v-if="links?.length" :links="links" />
  </div>
</template>
```

::: details Penjelasan Kode
- `rows: { type: Array, default: () => [] }` — default factory function `() => []` (bukan `[]` langsung) karena default prop harus berupa function untuk tipe reference agar tiap instance dapat array sendiri.
- `columns: [{ key, label, sortable }]` — kontrak data kolom; `key` untuk akses field di row, `label` header, `sortable` flag fitur.
- `&lt;slot :name="`header-${col.key}`" :column="col">` — dynamic named slot per kolom header. Parent bisa override `#header-actions` misalnya untuk render button di header.
- `&lt;slot :name="`cell-${col.key}`" :row="row" :index="i">&#123;&#123; row[col.key] &#125;&#125;&lt;/slot>` — scoped slot per cell; bila parent tidak override, default render `row[col.key]`. Inilah inti reusable DataTable.
- `:colspan="columns.length"` — saat loading/empty, satu `&lt;td>` menutup semua kolom.
- `:key="row.id ?? i` — pakai `id` row bila ada; fallback ke index agar tetap unik.
- `links?.length` — optional chaining; bila `links` undefined (non-paginated), `Pagination` tidak di-render.
:::

Pakai:

```vue
<script setup>
import DataTable from '@/Components/Table/DataTable.vue'

const columns = [
  { key: 'title', label: 'Judul' },
  { key: 'user', label: 'Penulis' },
  { key: 'actions', label: '' },
]

defineProps({ posts: Object })
</script>

<template>
  <DataTable
    :rows="posts.data"
    :columns="columns"
    :links="posts.meta.links"
    :loading="loading"
  >
    <template #cell-user="{ row }">{{ row.user.name }}</template>
    <template #cell-actions="{ row }">
      <Link :href="route('posts.edit', row.id)">Edit</Link>
    </template>
  </DataTable>
</template>
```

::: details Penjelasan Kode
- `posts.data` / `posts.meta.links` — struktur paginator Laravel: `data` berisi row, `meta.links` berisi array link navigasi (prev, 1, 2, next).
- `#cell-user="{ row }"` — destruct scoped slot; `row` dilewatkan dari DataTable untuk akses data kolom saat render.
- `&lt;Link :href="route('posts.edit', row.id)">` — komponen Inertia `&lt;Link>`; navigasi SPA tanpa reload penuh.
:::

## 19.5 Komponen Dropdown (Headless UI)

```vue
<!-- Components/UI/Dropdown.vue -->
<script setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
</script>

<template>
  <Menu class="relative inline-block">
    <MenuButton class="rounded p-2 hover:bg-gray-100">
      <slot name="trigger">Menu</slot>
    </MenuButton>

    <MenuItems class="absolute right-0 mt-2 w-48 rounded bg-white py-1 shadow-lg">
      <slot />
    </MenuItems>
  </Menu>
</template>
```

::: details Penjelasan Kode
- Wrapper ini hanya membungkus Headless UI `Menu` agar styling konsisten di seluruh app. Logic a11y (keyboard, ARIA) tetap dari Headless UI.
- `&lt;slot name="trigger">` — slot bernama untuk tombol trigger; parent bisa custom teks/icon.
- `&lt;slot />` default slot berisi `&lt;MenuItem>` yang dilewatkan parent.
:::

Pakai:

```vue
<Dropdown>
  <template #trigger>⋯</template>
  <MenuItem v-slot="{ active }">
    <Link :href="route('posts.edit', post.id)" :class="active && 'bg-gray-100'">
      Edit
    </Link>
  </MenuItem>
  <MenuItem v-slot="{ active }">
    <a
      href="#"
      :class="active && 'bg-gray-100'"
      @click.prevent="destroy(post)"
    >
      Hapus
    </a>
  </MenuItem>
</Dropdown>
```

## 19.6 Komponen Spinner

```vue
<!-- Components/UI/Spinner.vue -->
<script setup>
defineProps({ size: { type: String, default: 'md' } })
const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
</script>

<template>
  <svg :class="['animate-spin text-blue-600', sizes[size]]" viewBox="0 0 24 24" fill="none">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
  </svg>
</template>
```

::: details Penjelasan Kode
- `sizes[size]` — lookup object ukuran. Dipilih via prop `size`.
- `animate-spin` — utility keyframe Tailwind; badge loading dengan rotasi tak terhingga.
- `&lt;circle opacity-25>` + `&lt;path opacity-75>` — bagian static ring (+ path yang berputar) memberi ilusi spinner matte. Pattern SVG spinner klasik.
:::

## 19.7 Komponen Badge

```vue
<!-- Components/UI/Badge.vue -->
<script setup>
defineProps({
  variant: { type: String, default: 'info' },
})
const variantClass = {
  info:    'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger:  'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-800',
}
</script>

<template>
  <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClass[variant]]">
    <slot />
  </span>
</template>
```

::: details Penjelasan Kode
- `variantClass` — map 5 varian (info/success/warning/danger/neutral) ke pasangan bg + text warna. Pola yang sama seperti di Button.
- `rounded-full` — utility Tailwind untuk pill shape (border-radius 100%).
- `inline-flex items-center` — badge inline; alignment vertikal untuk icon kecil di dalamnya.
:::

## 19.8 Komponen Card & EmptyState

```vue
<!-- Components/UI/Card.vue -->
<template>
  <div class="rounded-lg border bg-white p-4 shadow-sm">
    <div v-if="$slots.header" class="border-b pb-2 mb-3 font-semibold"><slot name="header" /></div>
    <slot />
    <div v-if="$slots.footer" class="border-t pt-2 mt-3"><slot name="footer" /></div>
  </div>
</template>
```

::: details Penjelasan Kode
- `$slots.header` — cek keberadaan slot bernama `header` pada instance. Bila parent tidak pakai slot ini, blok header tidak dirender (mencegah border kosong).
- Slot `header` / default / `footer` — tiga region konten Card; fleksibilitas tanpa prop tambahan.
:::

```vue
<!-- Components/UI/EmptyState.vue -->
<script setup>
defineProps({ text: { type: String, default: 'Tidak ada data' } })
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-gray-500">
    <slot name="icon">
      <svg class="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7" />
      </svg>
    </slot>
    <p class="mt-2 text-sm">{{ text }}</p>
    <slot name="action" />
  </div>
</template>
```

::: details Penjelasan Kode
- `&lt;slot name="icon">` dengan fallback SVG — bila parent tidak override, pakai icon default (kotak kosong).
- `&lt;slot name="action">` — untuk tombol CTA di empty state (mis. "Buat Post Pertama").
:::

## 19.9 Pola Umum Komponen Reusable

- **Variants** lewat prop + computed map.
- **Slots** (default, named, scoped) untuk customisasi render.
- **`v-model`** lewat `:modelValue` + `update:modelValue`.
- **`defineExpose`** untuk method ke parent.
- **`Teleport`** untuk Modal / Tooltip / Notification agar lepas z-index.
- **`<Transition>` / `<TransitionGroup>`** untuk animasi.
- **`&lt;style scoped&gt;`** untuk CSS kompleks.

## 19.10 Composition dengan Composable

Untuk komponen yang share state (mis. accordion), ekstrak ke composable:

```js
// composables/useOpenState.js
import { ref } from 'vue'
export function useOpenState(initial = false) {
  const open = ref(initial)
  const toggle = () => (open.value = !open.value)
  const close = () => (open.value = false)
  const openFn = () => (open.value = true)
  return { open, toggle, close, openFn }
}
```

::: details Penjelasan Kode
- `useOpenState` — composable Vue 3 (Composition API). Setiap pemanggilan membuat instance `ref` baru sendiri (isolated state) — beda dengan `useTheme` di Bab 18 yang module-level.
- `open` di-return bersama method — pattern agar parent bisa `v-model:open` atau watch.
- Cocok dipakai accordion, dropdown manual, dialog, atau tab. Beri parameter `initial` untuk default open/close.
:::

## 19.11 Ringkasan Bab

- Struktur folder: `UI/`, `Form/`, `Table/`, `[Feature]/`.
- Button: variant + size + loading, render sebagai `<button>` atau `<a>`.
- Modal: `Teleport`, `v-model:open`, `<Transition>`.
- DataTable: columns + scoped slot `cell-<key>`.
- Dropdown: pakai Headless UI `<Menu>`.
- Card, Badge, EmptyState, Spinner: utilitas generik.
- Gunakan composable untuk share state antar komponen.

:::tip Selanjutnya
[Bab 20](/bagian-5/bab-20): Pinia — kapan perlu, kapan tidak. Di Inertia, sebagian besar state tidak butuh Pinia!
:::
