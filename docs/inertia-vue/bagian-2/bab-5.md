---
title: Bab 5 — Mengirim Data dari Controller ke Vue
---

# Bab 5: Mengirim Data dari Controller ke Vue

:::info Bagian II — Transisi
Bab ini membahas pengganti `compact()` & `with()`, bagaimana serializer Inertia bekerja, dan pola partial reload untuk efisiensi.
:::

## 5.1 Pengganti `compact()` dan `with()`

| Blade | Inertia |
| --- | --- |
| `return view('posts.index', compact('posts', 'categories'))` | `return Inertia::render('Posts/Index', ['posts' => $posts, 'categories' => $categories])` |
| `return view('posts.index')->with('posts', $posts)` | sama — `Inertia::render('Posts/Index', ['posts' => $posts])` |

Array kedua dari `Inertia::render()` adalah **props** — data yang diterima page component Vue via `defineProps`.

## 5.2 Menerima Props di Vue

```vue
<script setup>
const props = defineProps({
  posts: Array,
  categories: Array,
})

// Akses langsung
console.log(props.posts)
</script>
```

::: details Penjelasan Kode
- `defineProps({ posts: Array, categories: Array })` — deklarasi prop di Composition API Vue 3. `posts` dan `categories` harus diberikan oleh controller melalui `Inertia::render('...', { posts, categories })`. Nama prop **harus persis sama** dengan key di array controller.
- Hasil `defineProps` adalah reactive object, jadi `props.posts` akan auto-update saat controller mengirim data baru (mis. saat partial reload).
- Notasi `Array` (without `null`) berarti prop wajib diisi. Untuk membuat optional, pakai `Array` + `default: () => []` atau `type: [Array, null]`.
- `&lt;script setup>` adalah syntactic sugar Vue 3 — semua top-level binding otomatis tersedia di template tanpa `return` seperti `&lt;script>` lama.
- Karena `posts` dan `categories` sudah jadi prop, kamu bisa langsung pakai `posts` di template (Vue otomatis exposable). Tapi `props.posts` lebih eksplisit dan aman saat ada naming conflict.
:::

Atau dengan TypeScript:

```vue
<script setup lang="ts">
interface Post {
  id: number
  title: string
}

defineProps<{
  posts: Post[]
  categories: Array<{ id: number; name: string }>
}>()
</script>
```

::: details Penjelasan Kode
- `&lt;script setup lang="ts">` — aktifkan TypeScript di dalam SFC. Vite akan men-strip tipe saat build (via `vue-tsc`/`tsc`).
- `interface Post { id: number; title: string }` — definisi tipe untuk object post. Membuat autocomplete dan type-check bekerja di IDE.
- `defineProps<{ posts: Post[]; ... }>()` — generic-based props declaration. Lebih ringkas dari cara runtime (`{ posts: Array }`), karena tipe langsung diturunkan dari interface.
- `Array<{ id: number; name: string }>` — array of objects dengan shape tertentu. Berguna untuk `categories` yang punya field `id` dan `name`.
- Catatan: tipe hanya ada saat compile-time. Saat runtime, Vue tetap hanya menerima JS biasa. Tipe tidak mempengaruhi JSON yang dikirim server.
:::

:::warning Props harus JSON-serializable
Tidak boleh ada Closure, instance class tanpa `JsonSerializable`, atau resource. Eloquent otomatis di-serialize karena implement `ArrayAccess` + `JsonSerializable`.
:::

## 5.3 Transformasi Data dengan API Resource

Jangan kirim model mentah ke frontend — bocor kolom sensitif (`password`, `remember_token`, `internal_notes`). Gunakan **API Resource**:

```bash
php artisan make:resource PostResource
```

```php
// app/Http/Resources/PostResource.php
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'title'      => $this->title,
            'slug'       => $this->slug,
            'body'       => $this->body,
            'published'  => $this->published_at !== null,
            'created_at' => $this->created_at->toIso8601String(),
            'user'       => UserResource::make($this->whenLoaded('user')),
            'tags'       => TagResource::collection($this->whenLoaded('tags')),
        ];
    }
}
```

::: details Penjelasan Kode
- `extends JsonResource` — dasar dari Laravel. `JsonResource` implement `JsonSerializable`, sehingga saat di-encode ke JSON akan memanggil `toArray()`.
- `$this->id` — akses attribute model via magic property `__get`. Karena `$this` adalah instance model yang di-wrap resource, semua field model bisa diakses langsung.
- `'published' => $this->published_at !== null` — transformasi: kirim `boolean` alih-alih timestamp. Frontend cukup cek `post.published === true`, tidak perlu parse null/tanggal.
- `$this->created_at->toIso8601String()` — `created_at` adalah instance Carbon (di-cast otomatis). `toIso8601String()` menghasilkan format sebagai `2024-12-31T23:59:59+00:00` yang konsisten, mudah diparse `new Date()` di JS.
- `$this->whenLoaded('user')` — hanya sertakan relasi `user` **jika sudah di-eager load** (mis. via `Post::with('user')`). Jika tidak di-load, return `MissingAttribute` (di-serialisasi sebagai key yang dihilangkan). Ini mencegah N+1 query saat resource dipakai di context tanpa relasi.
- `UserResource::make(...)` — bungkus satu model user ke `UserResource`. Pakai `::make` untuk single item, `::collection` untuk collection.
- `TagResource::collection($this->whenLoaded('tags'))` — sama, tapi untuk many tags. `whenLoaded` di sini mengHandle relasi `hasMany`/`belongsToMany`.
- Dengan resource, kamu **secara eksplisit** mendefinisikan field apa yang boleh dikirim. Kolom sensitif seperti `password` otomatis tidak ikut — tidak ada di array balikan `toArray`.
:::

Pakai di controller:

```php
public function index()
{
    $posts = Post::with(['user', 'tags'])->latest()->paginate(10);

    return Inertia::render('Posts/Index', [
        'posts' => PostResource::collection($posts),
    ]);
}
```

::: details Penjelasan Kode
- `Post::with(['user', 'tags'])` — eager load relasi sekaligus untuk menghindari N+1. Resource akan mendeteksi relasi ini sebagai "loaded" sehingga `whenLoaded('user')` dan `whenLoaded('tags')` ikut di-serialize.
- `->latest()->paginate(10)` — urutkan by `created_at desc`, paginate 10 item. Hasil `paginate()` adalah instance `LengthAwarePaginator`.
- `PostResource::collection($posts)` — bungkus paginator menjadi JSON collection. **Penting**: paginator punya struktur `{ data, links, meta }`; `PostResource::collection` hanya transform bagian `data` saja, sementara `links` dan `meta` tetap dibungkus paginator secara otomatis. Inertia-laravel tahu cara serialize paginator ini (lihat §5.4).
- Saat controller me-return ke `Inertia::render`, resource otomatis di-resolve menjadi array saat response di-serialize. Tidak perlu manual `->resolve()` atau `->toJson()`.
:::

`whenLoaded()` hanya sertakan relasi jika sudah di-eager load. Backend jadi have control penuh apa yang bocor ke frontend.

## 5.4 Pagination — Mengirim Paginator

`paginate()` langsung bisa dikirim Inertia. Inertia otomatis konversi paginator ke format:

```js
props.posts = {
  data: [/* array item */],
  links: {
    first: '...?page=1',
    last:  '...?page=10',
    prev:  null,
    next:  '...?page=2',
  },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 10,
    per_page: 10,
    to: 10,
    total: 100,
  },
}
```

::: details Penjelasan Kode
- `data` — array berisi item hasil query (sudah ditransform resource kalau pakai `PostResource::collection`). Inilah yang kamu `v-for` di Vue.
- `links` — object navigasi halaman. `prev`/`next` bernilai `null` saat tidak ada halaman sebelumnya/berikutnya — aman di-cek `if (posts.links.next)`. `first`/`last` berguna untuk tombol loncat.
- `meta.current_page` — halaman aktif, cocok untuk highlight tombol pagination.
- `meta.from` / `meta.to` — range item di halaman ini (mis. 11-20 pada halaman 2). Berguna untuk teks "Menampilkan 11-20 dari 100 post."
- `meta.last_page` — total halaman. Pakai untuk render deretan tombol 1..last_page.
- `meta.per_page` & `meta.total` — jumlah per halaman dan total semua item.
- Inertia-laravel sudah punya custom serializer yang menstandarkan format ini. Versi Laravel lama pakai struktur nested beda (`meta.links` sebagai array); versi baru konsisten seperti di atas.
:::

Di Vue, akses:

- `props.posts.data` → array post.
- `props.posts.links` → object navigasi first/last/prev/next.
- `props.posts.meta` → info page.

:::tip Versi Laravel `links` array
Beberapa versi `inertia-laravel` sudah sertakan `meta.links` sebagai array tombol halaman (1, 2, ..., 10). Konsultasi dokumentasi versimu — detail lengkap di [Bab 15](/bagian-4/bab-15).
:::

## 5.5 Eager Loading Relasi

Tetap pakai `with()` atau `load()` di Eloquent:

```php
public function show(Post $post)
{
    $post->load(['comments.user', 'tags']);

    return Inertia::render('Posts/Show', [
        'post' => PostResource::make($post),
    ]);
}
```

::: details Penjelasan Kode
- `$post->load(['comments.user', 'tags'])` — lazy eager loading. Model `$post` sudah ada (dari route binding), lalu kita eager load relasi `comments` sekaligus relasi nested `comments.user` (user dari setiap comment), plus `tags`. Dot notation `comments.user` menyatakan nested relationship.
- `PostResource::make($post)` — bungkus single model menjadi resource. Lebih ringkas dari `new PostResource($post)`.
- Karena relasi sudah di-load sebelum resource dipakai, `whenLoaded('comments')` dan `whenLoaded('user')` (di CommentResource) akan ikut di-serialize.
- Pola ini cocok untuk `show()` karena model datang dari route binding (sudah query pertama). Untuk `index()` yang query sendiri, gunakan `Post::with(...)` di awal.
:::

Resource nested (`UserResource::make($this->whenLoaded('user'))`) ikut ter-serialize otomatis. Hindari N+1 dengan standard `with()`:

```php
$posts = Post::with('user', 'tags')->paginate();
```

## 5.6 Partial Reload — Efisiensi Data

Kasus: halaman list posts dengan form filter + sort. Saat filter berubah, kita tidak perlu refresh prop `categories` atau `auth` — cukup `posts`.

Di client:

```js
import { router } from '@inertiajs/vue3'

router.reload({ only: ['posts'] })
```

::: details Penjelasan Kode
- `import { router } from '@inertiajs/vue3'` — import instance router Inertia. Tersedia juga sebagai `useRouter()` composable.
- `router.reload()` — request ulang URL saat ini (tanpa mengubah URL browser). Berbeda dari `router.get()` yang menavigasi ke URL baru.
- `{ only: ['posts'] }` — opsi partial reload. Hanya prop `posts` yang akan diganti dengan data baru dari server; prop lain (`categories`, `auth`) tetap di cache browser dan tidak re-render.
- Efek samping: Komponen yang menggunakan prop `posts` akan ter-update, tetapi komponen lain tetap (mis. dropdown filter `categories` tidak lost state).
- Server tetap mengirim semua props kecuali jika prop tersebut di-mark lazy (`Inertia::lazy` atau `fn () =>`). Lihat §5.7.
- Gunakan opsi tambahan `preserveState: true` dan `preserveScroll: true` untuk pengalaman pencarian real-time (lihat contoh Bab 6.11).
:::

Server tetap kirim semua props (kecuali pakai `Inertia::lazy`, lihat §5.7), tapi **client hanya update prop yang diminta**. Efek: data lain tetap di cache browser, tidak re-render.

Untuk mengirim hanya yang diminta dari server, gunakan partial di controller:

```php
public function index(Request $request)
{
    return Inertia::render('Posts/Index', [
        'posts' => fn () => Post::filter($request)->paginate(),
        // fn () => membuat prop ini lazy — hanya dihitung jika diminta via `only`
    ])->lazy();
}
```

::: details Penjelasan Kode
- `fn () => Post::filter($request)->paginate()` — arrow function PHP 7.4+. Saat diberikan sebagai value prop, Inertia mengenalinya sebagai **lazy callable** (sejak Inertia v2.x).
- Saat request datang tanpa `only` → closure dieksekusi (karena prop dianggap "selalu diperlukan").
- Saat request datang dengan `only: ['posts']` → closure `posts` dieksekusi. Prop lain yang tidak ada di `only` (mis. `categories`) **tidak** dieksekusi → server tidak menjalankan query-nya, hemat resource.
- `Post::filter($request)` — scope lokal `filter` yang biasanya kamu buat sendiri via `scopeFilter($query, $request)` di model. Menerjemahkan query string (`?q=...&status=...`) ke SQL `where` clause.
- `->lazy()` di method `Inertia::render(...)` — penanda global bahwa semua prop closure hanya dipakai jika cocok dengan `only`. Tidak wajib; tanpa ini, semua closure akan dieksekusi penuh di setiap request.
:::

## 5.7 Lazy Props (Inertia v2)

Untuk prop yang mahal (query kompleks, statistik), pakai `Inertia::lazy`:

```php
public function dashboard()
{
    return Inertia::render('Dashboard', [
        'stats' => Inertia::lazy(fn () => $this->computeStats()),
        'recent' => fn () => Activity::latest()->take(20)->get(),
    ]);
}
```

::: details Penjelasan Kode
- `Inertia::lazy(fn () => $this->computeStats())` — eksplisit menandai prop `stats` sebagai lazy. Closure di dalam **hanya** dieksekusi jika:
  - Tidak ada `only` di request (karena dianggap prop default yang harus ada), atau
  - `'stats'` ada di `only` (karena diminta khusus).
- Berbeda dengan prop closure plain `fn () =>` yang dijalankan jika prop itu di-render (yang untuk `recent`). Ini perbedaan halus: `Inertia::lazy` cocok untuk prop **berat** yang tidak perlu dihitung saat partial reload prop lain.
- `$this->computeStats()` — contoh method service untuk kalkulasi agregat (jumlah user baru, total revenue, dll). Biasanya mahal SQL `GROUP BY` + `COUNT`.
- `Activity::latest()->take(20)->get()` — list 20 aktivitas terbaru. Pakai closure karena prop `recent` bisa di-skip saat user hanya ingin refresh `stats`.
- Manfaat: di halaman dashboard multi-widget, user klik "refresh stats" → hanya closure `stats` yang jalan → backend tidak bekerja dua kali untuk `recent`.
:::

- `Inertia::lazy(closure)` — closure hanya dieksekusi jika prop ada di `only` atau tidak ada `only` sama sekali.
- `fn () =>` sebagai prop value — hanya dieksekusi jika benar-benar dirender.

Berguna untuk dashboard multi-widget dengan banyak card stats — filter partial reload hanya refresh card yang diminta.

## 5.8 Tipe Data Standar

Aturan prop yang aman:

| Tipe PHP | Tipe JSON | Catatan |
| --- | --- | --- |
| string | string | |
| int / float | number | |
| bool | boolean | |
| array | array | |
| Collection | array | otomatis serialize |
| Model / Collection | object/array | serialize via `JsonSerializable` |
| Carbon | string ISO | pakai `->toIso8601String()` atau `$casts` |
| enum | string (default) atau int | backend diminati string |

Cast model:

```php
protected $casts = [
    'published_at' => 'datetime',
    'status' => PostStatus::class,
];
```

::: details Penjelasan Kode
- `$casts` — property model Laravel yang otomatis meng-convert kolom database (string mentah) ke tipe PHP kaya saat dibaca, dan sebaliknya saat ditulis.
- `'published_at' => 'datetime'` — kolom `published_at` (DATETIME di SQL) akan jadi instance `Carbon` saat diakses. Berguna untuk `$post->published_at->format('d M Y')`. Saat di-serialize JSON, Carbon punya `JsonSerializable` sendiri jadi output-nya ISO otomatis (tergantung versi — kadang butuh explicit `->toIso8601String()`).
- `'status' => PostStatus::class` — cast ke PHP enum backed. Saat diakses, `$post->status` adalah instance `PostStatus` (mis. `PostStatus::Published`). Saat di-serialize ke JSON, default-nya jadi value enum (`.value`) — biasanya string `'published'`.
- Tipe lain umum: `'is_active' => 'boolean'`, `'settings' => 'array'` (JSON column), `'price' => 'decimal:2'`.
- Casting ini berpengaruh ke output resource. Mis. di `PostResource` cukup tulis `'status' => $this->status` — enum akan di-serialize otomatis tanpa perlu `->value`.
:::

## 5.9 Props Server vs Shared Props

- **Page props** (`Inertia::render('X', [...])`) — hanya untuk halaman itu.
- **Shared props** (`HandleInertiaRequests::share()`) — dikirim ke semua halaman (`auth`, `flash`). Detail di [Bab 11](/bagian-4/bab-11).

## 5.10 Pola: Controller Minimal, Resource Detail

Prinsip besar:

1. Controller hanya mengumpulkan data via Eloquent.
2. API Resource menormalisasi & filter kolom.
3. Vue menerima JSON bersih.

Contoh pola yang baik:

```php
public function index(Request $request)
{
    $posts = Post::query()
        ->with(['user', 'tags'])
        ->visibleTo($request->user())
        ->filter($request->only('q', 'status'))
        ->paginate(15);

    return Inertia::render('Posts/Index', [
        'posts' => PostResource::collection($posts),
        'filters' => $request->only('q', 'status'),
    ]);
}
```

::: details Penjelasan Kode
- `Post::query()` — mulai query builder daripada `Post::...` static. Berguna saat filter conditional dinamis (chain `->when()`), karena `::query()` selalu return builder.
- `->with(['user', 'tags'])` — eager load relasi sebelum pagination. Wajib untuk menghindari N+1 saat resource men-load nested `UserResource`/`TagResource`.
- `->visibleTo($request->user())` — custom scope untuk policy authorization di level query (mis. hanya post milik user atau yang published). Lebih efisien daripada filter collection di PHP setelahnya.
- `->filter($request->only('q', 'status'))` — scope `filter` yang menerjemahkan input ke `WHERE`. `$request->only(...)` mengambil hanya field yang diminta, mencegah user inject parameter lain.
- `->paginate(15)` — paginate 15 item per halaman. Hasil sudah `LengthAwarePaginator`.
- `PostResource::collection($posts)` — bungkus paginator ke resource. Bagian `data` ditransform, `links`/`meta` tetap.
- `'filters' => $request->only('q', 'status')` — kirim balik filter yang dipakai user. Berguna di Vue untuk pre-fill input search dan select status, sehingga form dan state URL sync. Pola umum: `v-model="search"` di-bind ke `filters.q`.
- Controller tetap ringkas — logika query bersih, transformasi di resource, format response di `Inertia::render`. Inilah pilar MVC yang dipertahankan Inertia.
:::

Note: kirim `filters` kembali ke client agar filter form bisa pre-fill value yang dimasukkan user.

## 5.11 Ringkasan Bab

- `Inertia::render('View', $arrayProps)` pengganti `view()` + `compact()`.
- Pakai **API Resource** untuk kontrol kolom yang dikirim frontend.
- Paginator otomatis serialize ke `{ data, links, meta }`.
- Eager load dengan `with()` / `load()` tetap standar Laravel.
- `Inertia::lazy` & `fn () =>` optimalkan partial reload untuk data berat.
- Kembalikan filter + meta ke client agar UI bisa sync dengan state server.

:::tip Selanjutnya
[Bab 6](/bagian-2/bab-6) bahas struktur **Page Component** `.vue` — pengganti file `.blade.php`.
:::
