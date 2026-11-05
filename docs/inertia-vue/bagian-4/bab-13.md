---
title: Bab 13 — Flash Message & Notifikasi
---

# Bab 13: Flash Message & Notifikasi

:::info Bagian IV — Fitur Lanjutan Inertia
Cara kirim notifikasi singkat dari controller (`with('success', ...)`) dan tampilkan sebagai toast di Vue.
:::

## 13.1 Flash Message dari Controller

Tetap sama persis dengan Blade:

```php
public function store(Request $request)
{
    $post = Post::create($request->validated());

    return redirect()
        ->route('posts.index')
        ->with('success', 'Post berhasil dibuat!');
}

public function update(Request $request, Post $post)
{
    $post->update($request->validated());

    return redirect()
        ->route('posts.show', $post)
        ->with('success', 'Post diperbarui');
}

public function destroy(Post $post)
{
    $post->delete();

    return redirect()
        ->route('posts.index')
        ->with('warning', 'Post dipindahkan ke trash.');
}
```

::: details Penjelasan Kode
- `->with('success', 'Post berhasil dibuat!')` — flash data Laravel: disimpan ke session hanya untuk satu request berikutnya, lalu otomatis dibuang. Tidak perlu ada kode tambahan untuk membersihkan.
- `return redirect()->route(...)` — redirect adalah respon standar untuk PRG (Post/Redirect/Get) pattern. Mencegah resubmit form saat user refresh. Inertia mengikuti redirect ini dan secara otomatis navigate.
- Warna flash (`success`/`warning`) menentukan key di session. Di Inertia, key ini yang akan di-share ke `page.props.flash.warning`.
- `Post::create($request->validated())` — mass assignment aman karena hanya field yang lulus validasi yang diterima. Pastikan model `$fillable` sesuai.
:::

Tidak ada konfigurasi tambahan di controller.

## 13.2 Share Flash ke Vue

Tambah ke `HandleInertiaRequests::share()`:

```php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'flash' => [
            'success' => fn () => $request->session()->get('success'),
            'error'   => fn () => $request->session()->get('error'),
            'warning' => fn () => $request->session()->get('warning'),
            'info'    => fn () => $request->session()->get('info'),
        ],
    ]);
}
```

::: details Penjelasan Kode
- `fn () => $request->session()->get('success')` — closure lazy. Sesaat sebelum Inertia serialize payload, closure dipanggil untuk membaca session. Jika tidak pakai closure, `->get()` langsung dieksekusi saat masuk method share — biaya baca session meski Vue tidak memakai `flash`.
- Closure mengembalikan `null` jika tidak ada flash key tersebut — aman diakses Vue dengan `flash?.success` (optional chaining).
- Inertia-laravel mendeteksi closure dan otomatis mengeksekusi saat mengirim props. Tidak perlu `Inertia::lazy` di sini karena flash ingin dikirim ke setiap halaman (agak boros) tapi closure membuat pembacaan session menjadi lazy.
:::

Pakai `fn ()` agar closure hanya dieksekusi jika `flash` benar-benar dipakai — hemat session read.

## 13.3 Menangkap Flash di Vue

```js
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

const page = usePage()
const flash = computed(() => page.props.flash)
const success = computed(() => flash.value?.success)
```

`page.props.flash` akan berisi data baru tiap kali redirect berhasil, secara reaktif.

## 13.4 Komponen `<FlashMessage>` di Layout

Letakkan di layout agar tampil di semua halaman:

```vue
<!-- Components/UI/FlashMessage.vue -->
<script setup>
import { usePage } from '@inertiajs/vue3'
import { computed, watch, ref } from 'vue'

const page = usePage()

const flashes = ref([])

watch(
  () => ({ ...page.props.flash }),
  (flash) => {
    for (const [type, message] of Object.entries(flash)) {
      if (message) {
        const id = Date.now() + Math.random()
        flashes.value.push({ id, type, message })
        setTimeout(() => {
          flashes.value = flashes.value.filter(f => f.id !== id)
        }, 4000)
      }
    }
  },
  { immediate: true, deep: true },
)

function dismiss(id) {
  flashes.value = flashes.value.filter(f => f.id !== id)
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <div
      v-for="f in flashes"
      :key="f.id"
      :class="{
        'bg-green-600': f.type === 'success',
        'bg-red-600':   f.type === 'error',
        'bg-yellow-500': f.type === 'warning',
        'bg-blue-600':  f.type === 'info',
      }"
      class="rounded px-4 py-3 text-white shadow-lg flex items-start gap-3"
    >
      <span>{{ f.message }}</span>
      <button @click="dismiss(f.id)" class="text-white/80 hover:text-white">&times;</button>
    </div>
  </div>
</template>
```

::: details Penjelasan Kode
- `const flashes = ref([])` — list of active flash toast. Bisa multiple toastr sekaligus (mis. saat controller kirim sekaligus `->with('success', ...)->with('info', ...)`).
- `watch(() => ({ ...page.props.flash }), (flash) => {...}, { immediate: true, deep: true })`:
  - Source function `() => ({ ...page.props.flash })` — pakai spread untuk membuat objek baru tiap kali props berubah. Vue membandingkan referensi objek baru → watch ter-trigger saat `page.props.flash` reference berubah (yang terjadi saat partial reload/navigasi).
  - `{ immediate: true }` — jalankan callback seketika saat mount, jadi flash yang sudah ada di props muat langsung.
  - `{ deep: true }` — bila hanya properti dalam `flash` yang berubah (mis. `flash.success`), tetap trigger.
- `Object.entries(flash)` — iterasi `[key, value]` mis. `['success', 'Post dibuat']`. Loop ini memungkinkan beberapa flash sekaligus muncul terpisah.
- `const id = Date.now() + Math.random()` — buat ID unik untuk setiap toast. `Date.now()` bisa tabrakan jika dua flash muncul microsecond yang sama, jadi di-random via `+Math.random()`.
- `setTimeout(() => { /* filter */ }, 4000)` — auto-dismiss setelah 4 detik. Filter bukan `splice` agar reaktif Vue dapat trigger.
- `:class="{ 'bg-green-600': f.type === 'success', ... }"` — object syntax class binding Vue: key sebagai class, value boolean sebagai kondisi. Lebih readable daripada template string untuk multi-class kondisional.
- `&lt;button @click="dismiss(f.id)">&times;&lt;/button>` — dismiss manual. `&times;` adalah HTML entity `×`.
:::

Pakai di `AppLayout.vue`:

```vue
<template>
  <div class="min-h-screen">
    <FlashMessage />
    <header><!-- Navbar --></header>
    <main><slot /></main>
  </div>
</template>
```

## 13.5 Auto-Dismiss dengan Transisi

Tambah transisi keluar:

```vue
<template>
  <TransitionGroup name="flash" tag="div" class="fixed top-4 right-4 z-50 space-y-2">
    <div v-for="f in flashes" :key="f.id" :class="/* ... */">
      <!-- ... -->
    </div>
  </TransitionGroup>
</template>

<style scoped>
.flash-enter-active,
.flash-leave-active {
  transition: all 0.3s ease;
}
.flash-enter-from,
.flash-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
```

::: details Penjelasan Kode
- `&lt;TransitionGroup name="flash" tag="div">` — built-in Vue untuk animasi daftar. `name="flash"` jadi prefix class CSS (`flash-enter-active` dst.). `tag="div"` = wrapper element yang di-render.
- `.flash-enter-active / .flash-leave-active` — periode transisi berlangsung. Vue aplikasikan class ini selama 0.3s.
- `.flash-enter-from / .flash-leave-to` — state awal (enter) dan akhir (leave). Di sini opacity 0 + geser 20px. Vue interpolate dari state awal → state normal → state akhir.
- Berbeda dari `&lt;Transition>`: `&lt;TransitionGroup>` mendukung add/remove list dinamis dengan `:key`.
:::

## 13.6 Tipe Flash yang Direkomendasikan

| Tipe | Warna | Penggunaan |
| --- | --- | --- |
| `success` | hijau | Operasi berhasil (create, update, delete) |
| `error` | merah | Error fatal, kegagalan batch |
| `warning` | kuning | Operasi berhasil tapi perlu perhatian (soft delete, deprecated) |
| `info` | biru | Informasi non-kritis (maintenance, tips) |

## 13.7 Pola: Multiple Flash Sekali Kirim

Untuk operasi yang menghasilkan beberapa flash:

```php
return redirect()->route('posts.index')
    ->with('success', 'Post dibuat')
    ->with('info', 'Notifikasi telah dikirim ke follower');
```

Di `flash` shared:

```php
'flashes' => fn () => $request->session()->get('flashes', []),
```

Kemudian loop di komponen `FlashMessage`.

## 13.8 Validasi Error sebagai "Flash"

Error validasi tidak flash — diteruskan via prop `errors`. Lebih detail di [Bab 10](/bagian-3/bab-10).

Tapi untuk error dari handler non-validation (misal upload gagal):

```php
throw ValidationException::withMessages([
    'thumbnail' => 'File terlalu besar',
]);
```

Akan otomatis masuk `page.props.errors.thumbnail`. Tidak perlu flash manual.

## 13.9 Konfirmasi Sebelum Aksi Berbahaya

Sebelum gunakan `confirm()` browser (yang_global di-block beberapa browser), pakai modal:

```vue
<script setup>
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import Modal from '@/Components/UI/Modal.vue'

const open = ref(false)
const target = ref(null)

function ask(post) {
  target.value = post
  open.value = true
}

function confirmDestroy() {
  router.delete(route('posts.destroy', target.value.id), {
    preserveScroll: true,
    onSuccess: () => { open.value = false },
  })
}
</script>

<template>
  <button @click="ask(post)" class="text-red-600">Hapus</button>

  <Modal :open="open" @close="open = false">
    <h3 class="text-lg font-bold">Konfirmasi Hapus</h3>
    <p>Yakin ingin menghapus <strong>{{ target?.title }}</strong>?</p>
    <div class="mt-4 flex justify-end gap-2">
      <button @click="open = false" class="px-3 py-1.5">Batal</button>
      <button @click="confirmDestroy" class="bg-red-600 px-3 py-1.5 text-white">
        Hapus
      </button>
    </div>
  </Modal>
</template>
```

::: details Penjelasan Kode
- `const target = ref(null)` — simpan resource yang akan dihapus. Pakai `null` awal agar `target?.title` tidak crash di template sebelum user pilih.
- `function ask(post)` — buka modal + set target. Pisahkan dari `confirmDestroy` agar tombol di card daftar tidak langsung hapus.
- `router.delete(route('posts.destroy', target.value.id), {...})` — `router.delete` untuk DELETE request. `route(...)` menerima parameter ID untuk route model binding.
- `preserveScroll: true` — setelah hapus, scroll position tetap agar UX tidak melompat. Default Inertia reset scroll ke atas.
- `onSuccess: () => { open.value = false }` — tutup modal otomatis saat server merespons sukses. Jangan tutup sebelum request, kalau gagal user perlu lihat error.
- `&lt;Modal :open="open" @close="open = false">` — emit `close` saat user klik backdrop / tombol `Esc`. State modal di-trigger dari parent agar modal reusable.
:::

## 13.10 Pola Composable `useFlash

```js
// composables/useFlash.js
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

export function useFlash() {
  const page = usePage()
  return {
    success: computed(() => page.props.flash?.success),
    error:   computed(() => page.props.flash?.error),
    warning: computed(() => page.props.flash?.warning),
    info:    computed(() => page.props.flash?.info),
    hasAny:  computed(() => Object.values(page.props.flash ?? {}).some(Boolean)),
  }
}
```

## 13.11 Pola: Notifikasi dari WebSocket (Realtime)

Untuk notifikasi yang muncul real-time dari server (queue worker, broadcast event), gunakan Laravel Echo + Reverb:

```js
// resources/js/app.js
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
})

Echo.private(`App.Models.User.${userId}`)
  .notification((notification) => {
    // push to a store atau tampilkan toast
    showFlash({ type: 'info', message: notification.message })
  })
```

::: details Penjelasan Kode
- `laravel-echo` — library front-end Laravel untuk listen event broadcast/WebSocket. Provider-agnostic (Reverb, Pusher, Ably).
- `broadcaster: 'reverb'` — gunakan driver Reverb (WebSocket server Laravel). Diperlukan Pusher-js sebagai transport karena API-nya kompatibel.
- `import.meta.env.VITE_REVERB_*` — Vite environment variables. Wajib diawali `VITE_` agar di-expose ke client. Set di `.env`.
- `Echo.private(`App.Models.User.${userId}`)` — channel private otomatis otorisasi via `/broadcasting/auth`. Notifikasi yang dikirim user via `$user->notify()` akan broadcast ke channel user ini.
- `.notification(callback)` — listener khusus untuk notifikasi Laravel (bukan event generic). Berguna untuk menampilkan toast realtime saat server job selesai, ada pesan baru, dll.
:::

## 13.12 Ringkasan Bab

- Flash dari controller sama persis dengan Blade: `->with('success', ...)`.
- Share `flash` di `HandleInertiaRequests::share()` — pakai `fn ()` agar lazy.
- Di Vue akses `usePage().props.flash` — render di komponen layout.
- Buat komponen `<FlashMessage>` auto-dismiss dengan TransitionGroup.
- Konfirmasi hapus pakai modal, bukan `window.confirm`.
- Untuk realtime: gunakan Reverb + Echo.

:::tip Selanjutnya
[Bab 14](/bagian-4/bab-14): upload file dengan `useForm()` + `forceFormData`, plus progress bar.
:::
