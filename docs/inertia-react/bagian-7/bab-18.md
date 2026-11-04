---
title: "Bab 18 — SSR & SEO"
---

# 📖 Bab 18 — SSR & SEO

Secara default, Inertia merender halaman di browser. Untuk dashboard internal ini tidak masalah, tetapi halaman publik yang perlu diindeks mesin pencari membutuhkan HTML awal. SSR Inertia menyelesaikannya — dengan biaya: proses Node harus berjalan di server. Bab ini membahas kapan SSR benar-benar dibutuhkan dan cara menyiapkannya.

---

## 18.1 🤔 Masalah Render di Browser

```text
Tanpa SSR:
Browser ── GET /produk/5 ──► Laravel
Laravel ── HTML kerangka (kosong) ──► Browser
Browser ── jalankan JS ──► React render ──► konten terlihat

Yang dilihat crawler lama / preview sosial:
<h1></h1>  ← kosong
```

Dampak:

| Dampak | Penjelasan |
|---|---|
| SEO lemah | Crawler yang tidak menjalankan JS tidak melihat konten |
| Preview sosial buruk | WhatsApp/Twitter tidak menampilkan judul & gambar |
| First paint lambat | User melihat layar kosong sampai JS siap |
| Aksesibilitas | Konten tidak ada tanpa JS |

---

## 18.2 🧭 Kapan SSR Benar-Benar Dibutuhkan

| Kebutuhan | SSR perlu? |
|---|---|
| Dashboard admin internal | ❌ Tidak |
| Aplikasi setelah login | ❌ Tidak |
| Landing page publik | ✅ Sering ya |
| Blog / katalog publik | ✅ Ya |
| Preview link media sosial | ✅ Ya |
| Aplikasi offline-first | ❌ Tidak relevan |

Alternatif yang sering lebih murah:

```text
Halaman publik (beranda, blog, katalog)
        │
        ├─ Blade + sedikit JS  → SEO bagus, tanpa Node
        └─ Inertia SSR         → SPA + SEO, butuh proses Node

Dashboard (setelah login)
        └─ Inertia CSR         → cepat, sederhana
```

> 💡 **Jangan pasang SSR hanya karena "biar modern".** Ini menambah kompleksitas deploy, memori, dan potensi downtime.

---

## 18.3 ⚙️ Setup SSR

**1. Buat entry SSR:**

```jsx
// resources/js/ssr.jsx
import { createInertiaApp } from '@inertiajs/react'
import createServer from '@inertiajs/react/server'
import ReactDOMServer from 'react-dom/server'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'

createServer((page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => `${title} - Toko`,
    resolve: (name) =>
      resolvePageComponent(
        `./Pages/${name}.jsx`,
        import.meta.glob('./Pages/**/*.jsx'),
      ),
    setup: ({ App, props }) => <App {...props} />,
  }),
)
```

**2. Konfigurasi Vite:**

```js
// vite.config.js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/app.jsx', 'resources/js/ssr.jsx'],
      ssr: 'resources/js/ssr.jsx',
      refresh: true,
    }),
    react(),
  ],
})
```

**3. Build:**

```bash
npm run build
```

**4. Jalankan server SSR:**

```bash
php artisan inertia:start-ssr
```

**5. Aktifkan di middleware** (biasanya Breeze sudah menyiapkan):

```php
// config/inertia.php atau HandleInertiaRequests
'ssr' => [
    'enabled' => true,
    'url' => 'http://127.0.0.1:13714',
],
```

| Perintah | Fungsi |
|---|---|
| `npm run build` | Build client + SSR bundle |
| `php artisan inertia:start-ssr` | Menjalankan server Node SSR |
| `php artisan inertia:stop-ssr` | Menghentikan server SSR |

---

## 18.4 🏷️ `<Head>` untuk Meta & Open Graph

SSR baru berguna jika meta tag diisi dengan benar.

```jsx
import { Head } from '@inertiajs/react'

export default function Show({ produk }) {
  const gambar = produk.gambar?.[0]?.url

  return (
    <>
      <Head>
        <title>{produk.name} — Toko</title>
        <meta name="description" content={produk.description} />
        <link rel="canonical" href={`https://toko.example/produk/${produk.slug}`} />

        <meta property="og:type" content="product" />
        <meta property="og:title" content={produk.name} />
        <meta property="og:description" content={produk.description} />
        {gambar && <meta property="og:image" content={gambar} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <h1>{produk.name}</h1>
    </>
  )
}
```

| Tag | Fungsi |
|---|---|
| `<title>` | Judul tab & hasil pencarian |
| `description` | Cuplikan di hasil pencarian |
| `canonical` | Mencegah konten duplikat |
| `og:*` | Preview saat dibagikan |
| `twitter:card` | Preview di Twitter/X |

> ⚠️ **Meta harus berasal dari server.** Jika data produk baru tersedia lewat fetch client, preview sosial tetap kosong.

---

## 18.5 🧩 Pola Hibrida: Blade untuk Publik, Inertia untuk Dashboard

Sering kali ini pilihan paling pragmatis.

```php
// routes/web.php
Route::get('/', [HomeController::class, 'index']);           // Blade
Route::get('/blog/{post}', [BlogController::class, 'show']); // Blade

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', ...);                            // Inertia
    Route::resource('products', ProductController::class);    // Inertia
});
```

| Area | Teknologi | Alasan |
|---|---|---|
| Beranda, blog, katalog | Blade + Tailwind | SEO mudah, tanpa Node |
| Dashboard, CRUD | Inertia + React | Interaktif, tanpa API |
| Halaman auth | Inertia (Breeze) | Sudah disiapkan |

```text
Pengunjung anonim ──► Blade (HTML lengkap, cepat diindeks)
User login       ──► Inertia (SPA, interaktif)
```

---

## 18.6 🚀 Deploy SSR

SSR membutuhkan **dua proses** di server:

```text
Nginx
 ├── PHP-FPM ──► Laravel (port 9000)
 └── Node    ──► Inertia SSR (port 13714)
```

**Supervisor:**

```ini
[program:inertia-ssr]
command=node /var/www/toko/bootstrap/ssr/ssr.js
autostart=true
autorestart=true
user=www-data
numprocs=1
```

| Hal | Catatan |
|---|---|
| Build | `npm run build` menghasilkan `bootstrap/ssr/ssr.js` |
| Proses | Harus hidup terus; restart otomatis |
| Memori | Pantau; restart berkala bila perlu |
| Port | Pastikan hanya diakses lokal |
| Log | Arahkan ke file log yang dipantau |

> 🚨 **Jika proses SSR mati, halaman bisa error 500.** Selalu pasang `autorestart=true` dan health check. Bila SSR terlalu merepotkan, gunakan pola hibrida di 18.5.

---

## ✅ Checklist Bab 18

- **Masalah** — tanpa SSR, HTML awal kosong; SEO dan preview sosial lemah.
- **Kapan perlu** — halaman publik; dashboard internal tidak.
- **Setup** — `ssr.jsx`, konfigurasi Vite `ssr`, `npm run build`, `inertia:start-ssr`.
- **`<Head>`** — title, description, canonical, Open Graph, Twitter card.
- **Hibrida** — Blade untuk publik, Inertia untuk dashboard.
- **Deploy** — proses Node terpisah + Supervisor + `autorestart`.
- **Risiko** — SSR mati = error; siapkan monitoring.

---

⏭️ Lanjut ke [🚀 Bab 19 — Performa & Optimasi](/bagian-7/bab-19) untuk melanjutkan!
