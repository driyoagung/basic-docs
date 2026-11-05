---
title: Bab 7 — Layout Persisten — Pengganti @extends dan @section
---

# Bab 7: Layout Persisten — Pengganti `@extends` dan `@section`

:::info Bagian II — Transisi
Inertia memperkenalkan "persistent layout" — navbar dan sidebar tetap ter-mount saat navigasi antar halaman, jadi state (dropdown, scroll, animasi) tidak hilang.
:::

## 7.1 Masalah: Tanpa Layout, Setiap Halaman Menulis Ulang Navbar

Di Blade kamu pakai `@extends('layouts.app')` agar navbar tidak ditulis ulang di setiap file. Tapi:

- Saat navigasi antar halaman, Blade **me-rewrite HTML penuh** — browser render ulang navbar dari nol.
- Animasi transisi hilang, dropdown tertutup, scroll reset.

Di Vue tanpa setup benar, ini jadi tiga kali lebih buruk:

1. Setiap page punya navbar sendiri — duplikasi.
2. Atau, layout di-wrap parent — saat navigasi Inertia, **parent layout unmount-mount ulang** → state Vue (open dropdown, collapse sidebar) **reset**.

Inertia solve ini dengan **persistent layout**.

## 7.2 Persistent Layout di Inertia

Definisikan layout di page component. Inertia akan tetap mempertahankan layout instance di DOM saat ganti page:

```vue
<!-- Pages/Posts/Index.vue -->
<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout })
</script>

<template>
  <div>
    <!-- Konten halaman -->
  </div>
</template>
```

::: details Penjelasan Kode
- `import AppLayout from '@/Layouts/AppLayout.vue'` — load komponen layout. Wajib di-import agar bisa dijadikan layout.
- `defineOptions({ layout: AppLayout })` — macro Vue 3.3+ yang escape ke Inertia. Memberitahu Inertia bahwa page ini harus dibungkus oleh `AppLayout` dan **instance layout harus dipertahankan** saat navigasi.
- Saat user pindah dari `Posts/Index` → `Posts/Show` (dan keduanya pakai `AppLayout`), Inertia hanya swap komponen page di dalam `&lt;slot />` layout. Navbar/footer di AppLayout **tidak unmount** → state Vue di layout tetap.
- Bandingkan dengan versi manual `&lt;AppLayout>...&lt;/AppLayout>` di template — itu re-mount setiap navigasi karena dianggap bagian dari page component.
- `defineOptions` bukan properti runtime biasa — Vue compiler mengenalinya dan meng-inject ke options komponen saat kompilasi SFC.
:::

Atau dengan higher-order component style:

```vue
<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'

const props = defineProps({ posts: Array })
</script>

<template>
  <AppLayout>
    <!-- Konten -->
  </AppLayout>
</template>
```

::: details Penjelasan Kode
- Pendekatan ini menempatkan `&lt;AppLayout>` di template page component — seolah-olah layout adalah komponen child.
- `&lt;slot />` di `AppLayout` akan diisi dengan konten di dalam `&lt;AppLayout> ... &lt;/AppLayout>`.
- **Kelemahan**: Saat Inertia swap page (mis. ke `Posts/Show` yang juga punya `&lt;AppLayout>` di template-nya), Vue considers `AppLayout` sebagai child baru → unmount lalu mount ulang. State lokal (open dropdown, scrolled position) **hilang**.
- Inilah kenapa rekomendasi resmi pakai `defineOptions({ layout })` — di sana Inertia tahu layout adalah konsep khusus dan memperlakukannya sebagai instance persisten.
- Pendekatan ini masih berguna kalau kamu benar-benar ingin layout rebuild per halaman (kasus langka, mis. layout yang sangat berbeda per page tanpa state).
:::

:::tip Disarankan: `defineOptions({ layout })` (Inertia >= 1.0.3)
Pakai pendekatan `defineOptions({ layout })` — Inertia tahu layout harus persistent. Pendekatan `<AppLayout>` manual **tidak persistent** (layout re-mount saat navigasi).
:::

## 7.3 Membuat `AppLayout.vue

Contoh layout dengan navbar, sidebar, slot konten:

```vue
<!-- resources/js/Layouts/AppLayout.vue -->
<script setup>
import { Link, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import { route } from 'ziggy-js'

const page = usePage()
const user = computed(() => page.props.auth.user)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <header class="border-b bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link :href="route('dashboard')" class="font-bold text-blue-700">MyApp</Link>

        <nav class="space-x-4 text-sm">
          <Link :href="route('posts.index')" :class="{ 'font-semibold': route().current('posts.*') }">
            Posts
          </Link>
          <Link :href="route('dashboard')">Dashboard</Link>
        </nav>

        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600">{{ user?.name }}</span>
          <Link :href="route('logout')" method="post" as="button" class="text-red-600">
            Logout
          </Link>
        </div>
      </div>
    </header>

    <!-- Konten halaman -->
    <main class="mx-auto max-w-6xl px-6 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t py-4 text-center text-xs text-gray-500">
      &copy; 2024 MyApp
    </footer>
  </div>
</template>
```

::: details Penjelasan Kode

**`&lt;script setup>`:**
- `import { Link, usePage } from '@inertiajs/vue3'` — `Link` untuk navigasi tanpa reload; `usePage` untuk akses props server (auth, flash).
- `import { computed } from 'vue'` — `computed` membuat derived value yang cached & reaktif.
- `import { route } from 'ziggy-js'` — generate URL untuk named route.
- `const page = usePage()` — ambil Inertia page object global. Reaktif — saat shared props berubah (mis. user login/logout), `page.props` update otomatis.
- `const user = computed(() => page.props.auth.user)` — derived state dengan caching. Bila `page.props.auth` berubah, `user` berevaluasi ulang; bila tidak, value cached. Berguna karena `auth` adalah shared prop yang dikirim ke semua halaman (lihat Bab 11).

**`&lt;template>`:**
- `&lt;div class="min-h-screen bg-gray-50">` — wrapper layout, minimum tinggi viewport, latar abu muda (Tailwind).
- `&lt;header class="border-b bg-white">` — navbar dengan border bawah dan latar putih.
- `&lt;div class="mx-auto flex max-w-6xl ...">` — kontainer horizontal flex, max width 6xl (72rem), center horizontal.
- `&lt;Link :href="route('dashboard')">` — navigasi ke route `dashboard`. Link Inertia melakukan visit XHR, jadi tidak full reload.
- `:class="{ 'font-semibold': route().current('posts.*') }"` — conditional class. Saat di halaman `posts.*`, link "Posts" tampil bold. Pakai `route().current()` dari Ziggy.
- `&lt;nav class="space-x-4 text-sm">` — utility `space-x-4` menambah margin kiri tiap child kecuali pertama. Cepat untuk menu horizontal.
- `&#123;&#123; user?.name &#125;&#125;` — optional chaining. Bila `user` null (belum login), tidak error — teks kosong. Penting karena layout bisa dipakai untuk halaman auth (sebelum user login).
- `&lt;Link :href="route('logout')" method="post" as="button">` — Inertia `Link` dengan method `POST` (logout butuh POST, bukan GET). `as="button"` render `&lt;button>` tuaian link, jadi styling bisa konsisten.
- `method="post"` — Inertia akan kirim request POST alih-alih default GET. Berguna untuk aksi yang harus mengubah state server (logout, delete).
- `&lt;main class="mx-auto max-w-6xl px-6 py-8">&lt;slot />&lt;/main>` — **slot default**. Inilah tempat konten page component di-inject. Saat `defineOptions({ layout: AppLayout })` di page, konten template page menggantikan `&lt;slot />`.
- `&lt;footer class="border-t py-4 text-center text-xs text-gray-500">&copy; 2024 MyApp&lt;/footer>` — footer disclaimer. `&copy;` adalah entity copyright.

**Inti:** Komponen ini adalah Vue SFC biasa. Inertia membuatnya "persistent" **karena** page component memakai `defineOptions({ layout })`, bukan karena layout itu sendiri punya magic.
:::

Manfaat persistent layout:

- Saat navigasi `Posts/Index` → `Posts/Show`, header/footer **tidak unmount**.
- Dropdown yang terbuka di navbar tetap terbuka.
- Audio player, video, animasi scroll → tidak terganggu.
- State lokal Vue di layout dilindungi.

## 7.4 Nested Layout

Untuk layout bertingkat (misal admin area di dalam app layout):

```vue
<!-- Pages/Admin/Users/Index.vue -->
<script setup>
import AppLayout from '@/Layouts/AppLayout.vue'
import AdminLayout from '@/Layouts/AdminLayout.vue'

defineOptions({ layout: [AppLayout, AdminLayout] })
</script>
```

::: details Penjelasan Kode
- `defineOptions({ layout: [AppLayout, AdminLayout] })` — array layout. Inertia akan membungkus page dengan layout **paling kanan dulu**, lalu ke yang lebih luar.
- Urutan render: `AppLayout` (terluar) → `AdminLayout` → page component. Konten `AdminLayout` menggantikan `&lt;slot />` di `AppLayout`. Konten page menggantikan `&lt;slot />` di `AdminLayout`.
- Berguna untuk hierarki visual: app shell (navbar global) → admin sidebar → konten halaman admin.
- Keduanya persistent — saat user berpindah antar halaman admin, `AppLayout` dan `AdminLayout` tidak unmount.
- Banding: bila kamu pakai 3-level layout, cukup tambahkan ke array: `[AppLayout, AdminLayout, SectionLayout]`.
:::

Layout paling luar di-render paling pertama, layout dalam diberi `<slot>` dari outer:

```vue
<!-- Layouts/AdminLayout.vue -->
<template>
  <div class="flex">
    <aside class="w-56 bg-gray-900 p-4 text-gray-200">
      <!-- Admin Sidebar -->
    </aside>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
```

::: details Penjelasan Kode
- `&lt;div class="flex">` — wrapper flex horizontal. Sidebar di kiri, konten kanan.
- `&lt;aside class="w-56 bg-gray-900 p-4 text-gray-200">` — sidebar lebar 14rem (56 × 0.25rem), background hitam pekat, padding 4, teks terang. Item menu admin biasanya diletakkan di sini.
- `&lt;main class="flex-1">` — `flex-1` membuat main mengisi sisa ruang horizontal. Konten halaman admin tampil di sini.
- `&lt;slot />` — page component (mis. `Admin/Users/Index.vue`) akan di-inject di sini oleh Inertia. Tidak ada default content, jadi wajib page memberikan konten.
- Karena `AdminLayout` tidak punya `&lt;script setup>` di cuplikan ini, dia tidak menerima props — murni presentational wrapper. Bisa tambahkan script untuk logika sidebar interaktif (collapse, active menu highlight).
:::

## 7.5 Beberapa Layout Berbeda

Buat layout untuk halaman auth (tanpa navbar app):

```vue
<!-- Layouts/AuthLayout.vue -->
<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <div class="w-full max-w-md">
      <slot />
    </div>
  </div>
</template>
```

::: details Penjelasan Kode
- `flex min-h-screen items-center justify-center` — center konten horizontal & vertikal di tengah viewport. Pattern klasik untuk halaman login/register.
- `bg-gray-100` — latar abu muda, agar card login terlihat menonjol.
- `w-full max-w-md` — card lebar penuh pada layar kecil, tapi maksimal `md` (28rem) di layar besar. Responsive default Tailwind.
- `&lt;slot />` — form login/register di-inject oleh page component `Auth/Login.vue`.
- Tidak ada `&lt;script setup>` — layout ini murni struktur, tidak butuh state. Wajar kalau halaman auth tidak punya state UI yang perlu dipertahankan antar halaman (login sekali pakai).
:::

Pakai di `Login.vue`:

```vue
<!-- Pages/Auth/Login.vue -->
<script setup>
import AuthLayout from '@/Layouts/AuthLayout.vue'
defineOptions({ layout: AuthLayout })
</script>
```

::: details Penjelasan Kode
- Layout di-override per-page. Bila di `app.js` default `AppLayout`, page `Login` ini tidak pakainya — pakai `AuthLayout` yang lebih cocok (tanpa navbar).
- `defineOptions` di sini menimpa default dari `app.js`. Saat user mengakses `/login`, Inertia membungkus Login dengan AuthLayout, bukan AppLayout.
- Berguna untuk halaman yang visually sangat berbeda (`auth`, `error page`, `print`, `onboarding fullscreen`).
:::

Pattern lain: layout untuk print, layout fullscreen, layout onboarding.

## 7.6 Layout Default via `app.js

Agar tidak tulis `defineOptions({ layout })` di setiap halaman, set default di `app.js`:

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
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) }).use(plugin).mount(el)
  },
})
```

::: details Penjelasan Kode
- `createInertiaApp({...})` — entry point Inertia. Menerima `resolve` dan `setup`.
- `resolve: name => { ... }` — fungsi yang dipanggil tiap navigasi. `name` adalah string komponen (mis. `'Posts/Index'`). Tugasnya: kembalikan modul Vue yang sesuai.
- `import.meta.glob('./Pages/**/*.vue', { eager: true })` — Vite import semua file `Pages/`. `eager: true` memuat semuanya ke bundle utama (lihat §4.7 untuk lazy alternatif).
- `pages[`./Pages/${name}.vue`]` — akses modul spesifik. Template literal menggabungkan `'./Pages/'`, nama komponen, dan `'.vue'`.
- `page.default.layout = page.default.layout || AppLayout` — **inti dari default layout**. Modul SFC Vue punya export default berisi options/defineOptions. Di sini kita set `layout` jika belum diset oleh page.
  - Bila page sudah `defineOptions({ layout: AdminLayout })`, `page.default.layout` sudah terisi — tidak di-overwrite.
  - Bila page tidak set layout, di-assign `AppLayout`.
- `setup({ el, App, props, plugin })` — dijalankan sekali saat app boot. Membuat instance Vue, menggunak plugin Inertia (`plugin` menyediakan `&lt;Link>`, `usePage`, dll), lalu mount ke `el` (elemen root di HTML blade).
- `h(App, props)` — render function Vue. `h` adalah createVNode; `App` adalah komponen root Inertia; `props` berisi page component & props untuk di-pass.
- **Catatan Penting:** kode di cuplikan ini sedikit tidak lengkap — di setup perlu `import { createApp, h } from 'vue'` agar `h` tersedia. Laravel Breeze inertia-vue biasanya sudah include ini.
- Keuntungan pola ini: satu titik konfigurasi. Page tidak perlu repot `defineOptions` kecuali butuh layout berbeda.
:::

Setiap page yang tidak menentukan layout sendiri akan pakai `AppLayout`. Override per-halaman:

```vue
<!-- Pages/Auth/Login.vue tidak pakai AppLayout -->
<script setup>
import AuthLayout from '@/Layouts/AuthLayout.vue'
defineOptions({ layout: AuthLayout }) // override default
</script>
```

Untuk halaman yang benar-benar tanpa layout (misal error page fullscreen):

```vue
<script setup>
defineOptions({ layout: null })
</script>
```

::: details Penjelasan Kode
- `defineOptions({ layout: null })` — eksplisit bilang "halaman ini tidak punya layout". Page dirender sebagai root tanpa wrapper. Berguna untuk halaman error fullscreen atau embedded widget.
- Tanpa `layout: null`, Inertia akan pakai default dari `app.js` (yaitu `AppLayout`). Override `null` menonaktifkannya.
- Layout `null` tidak menggantikan page; page sendiri menjadi root yang dirender.
:::

## 7.7 Named Slot — Header & Action Button

Gunakan named slot untuk bagian layout yang ingin di-customize per page:

```vue
<!-- Layouts/AppLayout.vue -->
<template>
  <div>
    <header>
      <slot name="header">
        <!-- Default fallback -->
        <h1 class="text-xl font-bold">MyApp</h1>
      </slot>
    </header>

    <main>
      <slot /> <!-- slot default = konten utama -->
    </main>

    <footer>
      <slot name="footer" />
    </footer>
  </div>
</template>
```

::: details Penjelasan Kode
- `&lt;slot name="header">...&lt;/slot>` — named slot `header`. Isi di antara tag adalah **fallback content** — ditampilkan jika page tidak provide slot `header`.
- `&lt;slot />` (tanpa name) — slot **default**. Vue menganggap semua konten template yang tidak di `&lt;template #name>` masuk ke sini.
- `&lt;slot name="footer" />` — named slot `footer` tanpa fallback. Bila page tidak provide, footer kosong.
- Konsep Vue standar: page passing konten via `&lt;template #header>`, `&lt;template #footer>`, dan sisanya ke default slot.
- Manfaat: layout fleksibel tanpa props boolean (`hideHeader`, `hideFooter`). Page Custom sendiri area yang ingin.
:::

Pakai di page:

```vue
<!-- Pages/Posts/Index.vue -->
<template>
  <template #header>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">Daftar Post</h1>
      <Link :href="route('posts.create')" class="btn-primary">+ Buat</Link>
    </div>
  </template>

  <div class="space-y-4">
    <!-- konten utama -->
  </div>

  <template #footer>
    <span class="text-xs text-gray-500">{{ posts.meta.total }} post</span>
  </template>
</template>
```

::: details Penjelasan Kode
- `&lt;template #header>` — shorthand untuk `v-slot:header`. Konten di dalam mengisi named slot `header` di layout. Gantikan fallback `&lt;h1>MyApp&lt;/h1>`.
- `&lt;template #footer>` — sama, kirim konten ke slot `footer`. Page bisa menampilkan info dinamis seperti `posts.meta.total` (dari paginator).
- Bagian template yang TIDAK berada di `&lt;template #nama>` masuk ke `&lt;slot />` default — di sini adalah `&lt;div class="space-y-4">` berisi konten utama.
- `&#123;&#123; posts.meta.total &#125;&#125;` — akses prop `posts` (paginator) → `.meta.total`. Karena controller mengirim paginator, ini tersedia.
- Pola ini jika kamu pakai pendekatan manual `&lt;AppLayout>` di template. **Penting**: per §7.2, ini **tidak persistent** — bila page navigasi, slot di-inject ulang. Untuk persistent layout + named slot, gunakan `defineOptions({ layout })` lalu pakai named slot di dalam layout.
- Catatan integrasi: Untuk persistent layout + named slot, kamu bisa kombinasikan: page set `defineOptions({ layout: AppLayout })`, lalu konten page directive `&lt;template #header>` tetap di-kenali oleh layout karena Inertia membungkus page sebagai slot.
:::

## 7.8 Slot dengan Props (Scoped Slot)

Layout bisa kirim data ke slot:

```vue
<!-- Layouts/AppLayout.vue -->
<script setup>
const props = defineProps({ hideSidebar: Boolean })
</script>

<template>
  <slot :showSidebar="!hideSidebar" />
</template>
```

::: details Penjelasan Kode
- `defineProps({ hideSidebar: Boolean })` — layout terima prop dari page. Boolean.
- `&lt;slot :showSidebar="!hideSidebar" />` — slot dikirim dengan "slot prop" `showSidebar`. Nilainya adalah kebalikan dari `hideSidebar`. Vue meng-attach attribute ini ke slot scope sehingga konsumer bisa akses.
- Scoped slot ini berguna untuk kasus di mana konsumen slot butuh data yang computed dari props layout — mis. toggle sidebar, dark mode, dll.
- Pendekatan ini jarang dipakai untuk layout persistent karena `defineOptions({ layout })` tidak mengoper props ke layout. Pola scoped slot lebih cocok untuk komponen biasa (`&lt;DataTable>`, `&lt;Modal>`).
:::

Pakai:

```vue
<AppLayout>
  <template #default="{ showSidebar }">
    <div :class="showSidebar ? 'lg:pl-56' : ''">
      <!-- konten -->
    </div>
  </template>
</AppLayout>
```

::: details Penjelasan Kode
- `&lt;template #default="{ showSidebar }">` — destructuring scoped slot. Akses slot prop `showSidebar` yang dikirim layout via `&lt;slot :showSidebar="...">`.
- `:class="showSidebar ? 'lg:pl-56' : ''"` — kondisional: padding kiri `lg:pl-56` bila sidebar tampil. Tailwind responsive — hanya apply di breakpoint `lg` (desktop).
- Berguna bila layout mengkomputasi sesuatu (mis. lewat props) yang ingin konsumen pakai untuk menyesuaikan rendering konten.
- Catatan: Pendekatan `&lt;AppLayout>` ini berarti layout tidak persistent. Untuk persistent layout, gunakan `defineOptions({ layout })` dan hindari scoped slot yang bergantung pada parent memanggil layout manual.
:::

## 7.9 State Persisten di Layout

Karena layout tidak unmount, state lokal Vue tetap. Manfaat untuk:

- **Sidebar collapse**: `const collapsed = ref(localStorage.getItem('sidebar') === '1')` tetap tersimpan.
- **Notification popup** yang sedang tampil.
- **Audio/video player** yang sedang play.
- **Form draft** yang belum submit.

:::warning Keep state kecil
Jangan manfaatkan persistent layout untuk "menyimpan data server" — gunakan `usePage().props` atau Pinia untuk itu. Layout hanya untuk state UI.
:::

## 7.10 Layout untuk Halaman Error

Halaman 403/404/500 kustom:

```vue
<!-- Layouts/ErrorLayout.vue -->
<template>
  <div class="min-h-screen flex flex-col items-center justify-center">
    <slot />
  </div>
</template>
```

```vue
<!-- Pages/Errors/403.vue -->
<script setup>
import ErrorLayout from '@/Layouts/ErrorLayout.vue'
defineOptions({ layout: ErrorLayout })
</script>

<template>
  <div class="text-center">
    <p class="text-6xl font-bold text-red-600">403</p>
    <p class="mt-2">Akses ditolak. Hubungi admin.</p>
  </div>
</template>
```

::: details Penjelasan Kode
- ErrorLayout sederhana: konten tengah viewport, vertikal & horizontal center. Cocok untuk error page yang biasanya simpel fullscreen message.
- `Pages/Errors/403.vue` pakai `defineOptions({ layout: ErrorLayout })` agar error page **persistent** saat user menavigasi keluar-masuk error scenario (jarang, tapi mungkin: dashboard → 403 → dashboard).
- `text-6xl font-bold text-red-600` — ukuran teks besar (3.75rem), bold, merah. Standar Tailwind untuk error standout.
- Penting: layout ini berbeda dari `AppLayout` (tidak ada navbar). User tidak bisa "klik login" dari error page kalau belum login. Bila perlu, tambah link balik ke dashboard.
:::

Inertia merender `Pages/Errors/403.vue` ketika controller `abort(403)`. Configure default error pages via `HandleInertiaRequests`:

```php
public function resolveErrorResponse(Request $request, Throwable $e): string
{
    return match ($e->getStatusCode()) {
        404 => 'Errors/404',
        403 => 'Errors/403',
        500 => 'Errors/500',
        default => parent::resolveErrorResponse($request, $e),
    };
}
```

::: details Penjelasan Kode
- Method ini di-override di `app/Http/Middleware/HandleInertiaRequests.php`. Tujuannya: memetakan HTTP status code ke nama komponen Vue yang akan dirender saat error.
- `match ($e->getStatusCode())` — match expression PHP 8+. Mirip switch tapi return value. Lebih ringkas & aman (exhaustive).
- `404 => 'Errors/404'` — bila exception punya status 404, Inertia render `Pages/Errors/404.vue`. Begitu seterusnya.
- `default => parent::resolveErrorResponse($request, $e)` — fallback ke parent class (default Inertia) untuk status lain (mis. 419 CSRF, 422 validation). Mencegah error tak tertangani.
- Berguna untuk UX konsisten — error page kustom dengan layout app, bukan hitam putih default Laravel.
- `$e->getStatusCode()` — beberapa exception (seperti `HttpException`) punya method ini. Exception generic mungkin tidak — disarankan wrap dengan `instanceof HttpException` bila ragu, atau pakai `$e->getCode()` dengan hati-hati.
:::

## 7.11 Ringkasan Bab

- Layout persistent = `<template>` navbar/sidebar tetap ter-mount saat navigasi.
- Pakai `defineOptions({ layout: AppLayout })` di page component.
- Bisa nested `defineOptions({ layout: [OuterLayout, InnerLayout] })`.
- Set default di `app.js` dengan meng-assign `page.default.layout`.
- Override per-page atau set `null` untuk tanpa layout.
- Named slot untuk header, breadcrumb, action button.
- State UI (sidebar collapse, dropdown) **tidak reset** saat navigasi.

:::tip Selanjutnya
[Bab 8](/bagian-3/bab-8) mulai bagian Vue — fokus pada Composition API yang **benar-benar** dipakai di konteks Inertia.
:::
