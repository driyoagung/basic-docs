---
title: "Bab 3 — Cara Kerja Inertia"
---

# 📖 Bab 3 — Cara Kerja Inertia

Ini bab paling penting di Bagian I. Hampir semua kebingungan Inertia — "kenapa data saya tidak berubah?", "kenapa harus redirect?", "kenapa halaman reload penuh?" — hilang begitu Anda memahami **page object** dan **alur request**. Luangkan waktu di sini.

---

## 3.1 🔄 Kunjungan Pertama vs Navigasi Berikutnya

Inertia punya dua jalur yang sangat berbeda.

```text
KUNJUNGAN PERTAMA (full page load)
Browser ── GET /products ───────────────► Laravel
Laravel ── HTML lengkap (app.blade.php) ─► Browser
           + data halaman di atribut #app[data-page]
React mount dan merender Products/Index

NAVIGASI BERIKUTNYA (klik <Link>)
Browser ── XHR GET /products/5 ─────────► Laravel
           header: X-Inertia: true
Laravel ── JSON page object ────────────► Browser
           { component, props, url, version }
React ganti komponen — tanpa reload penuh
```

Perbedaan kunci:

| Aspek | Kunjungan pertama | Navigasi Inertia |
|---|---|---|
| Response | HTML + `data-page` | JSON |
| Yang dirender | Seluruh dokumen | Komponen halaman saja |
| Browser reload | Ya | Tidak |
| Layout | Di-mount ulang | Tetap (persistent) |
| Asset | Dimuat dari awal | Sudah ada di memori |

> 💡 **Analogi:** kunjungan pertama seperti membuka buku baru; navigasi berikutnya seperti membalik halaman. Sampul (layout) tetap sama, hanya isi halaman yang diganti.

---

## 3.2 📦 Page Object — Inti Protokol

Semua yang dikirim Laravel ke React berbentuk satu object:

```json
{
  "component": "Products/Index",
  "props": {
    "products": { "data": [], "links": [] },
    "filters": { "search": "" },
    "auth": { "user": { "id": 1, "name": "Budi" } },
    "errors": {}
  },
  "url": "/products?search=laptop",
  "version": "c32b8e4965f418ad16eaebba1d4e960f"
}
```

| Field | Fungsi |
|---|---|
| `component` | Nama halaman yang harus dirender (`Pages/Products/Index.jsx`) |
| `props` | Data dari controller + shared data |
| `url` | URL saat ini (untuk active link, bookmark) |
| `version` | Versi aset untuk deteksi deploy baru |
| `clearHistory` | Menandai agar history dibersihkan (jarang dipakai) |

Props yang selalu ada dari middleware:

- **`errors`** — error validasi Laravel, otomatis diisi Inertia.
- **`auth`** — data user yang di-share (Bab 7).
- **`flash`** — pesan sesi sekali tampil (Bab 7).

---

## 3.3 🧠 Konsep Penting

### 3.3.1 Asset Versioning

Inertia menyimpan `version` di page object. Saat Anda deploy ulang dan file JS berubah, version berubah. Request berikutnya dengan version lama akan **memaksa reload penuh** agar user tidak memakai JS usang.

```text
Deploy v1 → browser simpan version A
Deploy v2 → server kirim version B
Klik link → Inertia lihat A ≠ B → reload penuh sekali → version B
```

Ini mencegah bug aneh "kode lama masih jalan" setelah deploy.

### 3.3.2 Redirect 303 Setelah POST/PUT/DELETE

Setelah mutasi, controller **wajib** redirect — bukan mengembalikan halaman langsung.

```php
public function store(Request $request)
{
    $validated = $request->validate([...]);
    Product::create($validated);

    return redirect()->route('products.index')
        ->with('success', 'Produk berhasil ditambahkan!');
}
```

```text
POST /products ──► 303 redirect ──► GET /products
                                    (halaman baru dengan data terbaru)
```

Mengapa bukan langsung render? Karena halaman hasil POST akan "menempel" di history: refresh memicu POST ulang (double submit). Redirect membuat browser kembali ke pola GET yang aman.

### 3.3.3 Error Validasi Otomatis

Tidak ada `try/catch` atau penanganan error manual di React:

```php
$request->validate([
    'name'  => 'required|max:255',
    'price' => 'required|numeric|min:0',
]);
```

Jika gagal, Laravel melakukan redirect kembali dengan error di session. Inertia mengubahnya menjadi `props.errors`:

```jsx
const { errors } = usePage().props
// atau dari useForm (Bab 9)
errors.name // "The name field is required."
```

### 3.3.4 Yang Tidak Perlu Lagi Anda Lakukan

| Dulu (SPA + API) | Sekarang (Inertia) |
|---|---|
| `fetch('/api/products')` di `useEffect` | Props dari controller |
| State `loading` untuk fetch awal | Halaman sudah membawa data |
| `axios` + interceptor token | Session cookie Laravel |
| Menangani 422 manual | `props.errors` otomatis |
| CORS & preflight | Tidak ada (satu origin) |
| Menyusun URL API manual | `route()` via Ziggy |

> ⚠️ **Tetap ada loading state** untuk aksi seperti submit form dan navigasi — tetapi bukan untuk memuat data awal halaman.

---

## 3.4 🛰️ Header Penting Inertia

Anda jarang menyentuhnya langsung, tetapi berguna saat debugging:

| Header | Arah | Arti |
|---|---|---|
| `X-Inertia: true` | Client → Server | Request ini harus dibalas JSON |
| `X-Inertia-Version` | Client → Server | Versi aset yang dipegang client |
| `X-Inertia-Partial-Data` | Client → Server | Props yang diminta (partial reload) |
| `X-Inertia-Partial-Component` | Client → Server | Komponen untuk partial reload |
| `X-Inertia-Location` | Server → Client | Instruksi reload penuh |
| `X-Inertia-Infinite-Scroll-Merge-Intent` | Client → Server | Mode merge (append/prepend) |

Melihat `X-Inertia: true` di DevTools adalah bukti bahwa navigasi berjalan lewat Inertia, bukan reload biasa.

---

## 3.5 🔍 Melacak Satu Request dari Awal sampai Akhir

Contoh: user membuka `/products?search=laptop`.

```text
1. routes/web.php
   Route::get('/products', [ProductController::class, 'index']);

2. ProductController@index
   $products = Product::where('name', 'like', '%laptop%')->paginate(10);
   return Inertia::render('Products/Index', [
       'products' => $products,
       'filters'  => ['search' => request('search')],
   ]);

3. HandleInertiaRequests@share
   menambahkan auth, flash, errors ke props

4. Response
   HTML (kunjungan pertama) atau JSON page object (navigasi)

5. React
   resolve('Products/Index') → Pages/Products/Index.jsx
   render <Index products={...} filters={...} />

6. Layout
   Index.layout = page => <AppLayout>{page}</AppLayout>
```

Semua fitur di bab-bab berikutnya hanyalah variasi dari alur ini.

---

## 3.6 🧪 Latihan Cepat

Lakukan di project `toko-inertia`:

1. Buat route `/halo` yang me-render `Halo` dengan props `['nama' => 'Budi']`.
2. Buat `Pages/Halo.jsx` yang menampilkan `Halo, {nama}`.
3. Buka halaman, lihat `data-page` di elemen `#app` lewat DevTools.
4. Tambahkan `<Link href="/halo">Halo</Link>` dari dashboard, klik, dan perhatikan Network: response JSON, bukan HTML.

Jika keempat langkah berhasil, Anda sudah memahami inti Inertia.

---

## ✅ Checklist Bab 3

- **Dua jalur** — kunjungan pertama HTML, navigasi berikutnya JSON.
- **Page object** — `component`, `props`, `url`, `version`; satu-satunya kontrak server-client.
- **Asset versioning** — version berubah saat deploy → reload penuh sekali.
- **Redirect 303** — wajib setelah POST/PUT/DELETE agar tidak double submit.
- **Error otomatis** — validasi Laravel menjadi `props.errors`.
- **Tanpa fetch awal** — data halaman datang dari props, bukan `useEffect`.
- **Header** — `X-Inertia`, `X-Inertia-Version`, `X-Inertia-Partial-Data` untuk debugging.

---

⏭️ Lanjut ke [📄 Bab 4 — Pages & Rendering](/bagian-2/bab-4) untuk melanjutkan!
