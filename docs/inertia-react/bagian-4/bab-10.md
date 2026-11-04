---
title: "Bab 10 — Upload File"
---

# 📖 Bab 10 — Upload File

Upload file di Inertia terasa hampir sama dengan form biasa: masukkan `File` ke state `useForm`, lalu kirim. Inertia otomatis mengubah request menjadi `multipart/form-data`. Bab ini membahas progress upload, preview gambar, jebakan method PUT/PATCH, dan validasi file di Laravel.

---

## 10.1 📎 Mengirim File dengan `useForm`

```jsx
import { useForm } from '@inertiajs/react'

export default function UploadFoto() {
  const { data, setData, post, processing, progress, errors } = useForm({
    nama: '',
    foto: null,
  })

  function submit(e) {
    e.preventDefault()
    post(route('produk.store'))
  }

  return (
    <form onSubmit={submit}>
      <input
        type="text"
        value={data.nama}
        onChange={(e) => setData('nama', e.target.value)}
      />

      <input
        type="file"
        onChange={(e) => setData('foto', e.target.files[0])}
      />
      {errors.foto && <p className="text-red-600">{errors.foto}</p>}

      <button disabled={processing}>Upload</button>
    </form>
  )
}
```

Yang perlu diperhatikan:

- Nilai file adalah **objek `File`**, bukan string.
- Jangan menetapkan `Content-Type` manual — Inertia mengurus boundary `multipart/form-data`.
- `progress` hanya terisi saat ada file.

| State | Isi |
|---|---|
| `data.foto` | `File` atau `null` |
| `progress.percentage` | 0–100 |
| `progress.total` | Ukuran total (byte) |
| `progress.loaded` | Sudah terkirim (byte) |

---

## 10.2 📊 Progress Upload

```jsx
{progress && (
  <div className="h-2 w-full rounded bg-gray-200">
    <div
      className="h-2 rounded bg-purple-600 transition-all"
      style={{ width: `${progress.percentage}%` }}
    />
  </div>
)}
```

Atau lewat callback:

```jsx
post(route('produk.store'), {
  onProgress: (p) => console.log(`${p.percentage}%`),
})
```

> ⚠️ **Progress hanya untuk upload file.** Pada form biasa nilainya `null`; jangan mengandalkannya sebagai indikator loading umum — gunakan `processing`.

---

## 10.3 🖼️ Preview Sebelum Upload

```jsx
import { useEffect, useState } from 'react'

export default function UploadFoto() {
  const { data, setData, post, progress, errors } = useForm({
    foto: null,
  })
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!data.foto) {
      setPreview(null)
      return
    }

    const url = URL.createObjectURL(data.foto)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [data.foto])

  return (
    <form onSubmit={(e) => { e.preventDefault(); post(route('produk.store')) }}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setData('foto', e.target.files[0])}
      />

      {preview && (
        <img src={preview} alt="Preview" className="mt-4 h-40 rounded object-cover" />
      )}

      {errors.foto && <p className="text-red-600">{errors.foto}</p>}
      <button disabled={progress != null}>Upload</button>
    </form>
  )
}
```

> 💡 **Selalu `URL.revokeObjectURL`** saat preview diganti atau komponen dilepas. Tanpa itu, memori browser bocor.

---

## 10.4 ⚠️ Gotcha: PUT/PATCH dengan File

Browser **tidak mendukung** upload file lewat `PUT`/`PATCH` multipart dengan baik. Solusinya: kirim `POST` + field `_method`.

```jsx
const { data, setData, post, processing, errors } = useForm({
  _method: 'put',
  nama: '',
  foto: null,
})

post(route('produk.update', produk.id))
```

Laravel membaca `_method` dan memperlakukannya sebagai `PUT`, termasuk untuk route model binding dan validasi.

| Method | Upload file? |
|---|---|
| `POST` | ✅ |
| `PUT` / `PATCH` | ❌ (gunakan `_method`) |
| `DELETE` | Tidak relevan |

> 🚨 **Jangan pakai `put()` untuk upload.** Request bisa terkirim tetapi file tidak terbaca di server — bug yang sulit dilacak.

---

## 10.5 ✅ Validasi File di Laravel

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'nama' => ['required', 'string', 'max:255'],
        'foto' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
    ]);

    $path = $request->file('foto')->store('produk', 'public');

    Product::create([
        'nama' => $validated['nama'],
        'foto' => $path,
    ]);

    return redirect()->route('produk.index')
        ->with('success', 'Produk diunggah');
}
```

| Aturan | Arti |
|---|---|
| `image` | Harus gambar (jpg, png, gif, webp, svg) |
| `mimes:jpg,png,webp` | Ekstensi/MIME tertentu |
| `max:2048` | Maksimal 2048 KB (2 MB) |
| `dimensions:min_width=300` | Batas dimensi gambar |
| `mimetypes:image/jpeg` | MIME type spesifik |

Agar file bisa diakses publik:

```bash
php artisan storage:link
```

```jsx
<img src={`/storage/${produk.foto}`} alt={produk.nama} />
```

---

## 10.6 🎬 Studi Kasus: Upload Foto Produk

**Controller update:**

```php
public function update(Request $request, Product $product)
{
    $validated = $request->validate([
        'nama' => ['required', 'string', 'max:255'],
        'foto' => ['nullable', 'image', 'max:2048'],
    ]);

    $data = ['nama' => $validated['nama']];

    if ($request->hasFile('foto')) {
        if ($product->foto) {
            Storage::disk('public')->delete($product->foto);
        }
        $data['foto'] = $request->file('foto')->store('produk', 'public');
    }

    $product->update($data);

    return redirect()->route('produk.index')
        ->with('success', 'Produk diperbarui');
}
```

**Halaman edit:**

```jsx
import { useForm } from '@inertiajs/react'
import { useEffect, useState } from 'react'

export default function Edit({ produk }) {
  const { data, setData, post, processing, progress, errors } = useForm({
    _method: 'put',
    nama: produk.nama,
    foto: null,
  })

  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!data.foto) return setPreview(null)
    const url = URL.createObjectURL(data.foto)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [data.foto])

  function submit(e) {
    e.preventDefault()
    post(route('produk.update', produk.id), { preserveScroll: true })
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <input
        value={data.nama}
        onChange={(e) => setData('nama', e.target.value)}
        className="w-full rounded border px-3 py-2 mb-4"
      />
      {errors.nama && <p className="text-red-600">{errors.nama}</p>}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setData('foto', e.target.files[0])}
      />
      {errors.foto && <p className="text-red-600">{errors.foto}</p>}

      <img
        src={preview ?? `/storage/${produk.foto}`}
        alt="Foto produk"
        className="mt-4 h-40 w-40 rounded object-cover"
      />

      {progress && (
        <div className="mt-4 h-2 rounded bg-gray-200">
          <div
            className="h-2 rounded bg-purple-600"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}

      <button disabled={processing} className="mt-4 rounded bg-purple-600 px-4 py-2 text-white">
        {processing ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  )
}
```

Alur upload:

```text
Pilih file → File di state
      │
      ▼
Submit → POST multipart (+ _method=put)
      │
      ├─ progress.percentage naik
      ▼
Laravel validasi → simpan ke storage → redirect + flash
```

---

## ✅ Checklist Bab 10

- **File di `useForm`** — nilai `File`, bukan string; Inertia mengurus multipart.
- **Progress** — `progress.percentage`; hanya ada saat upload file.
- **Preview** — `URL.createObjectURL` + `revokeObjectURL` saat cleanup.
- **PUT/PATCH** — gunakan `post` + `_method` untuk upload.
- **Validasi** — `image`, `mimes`, `max`, `dimensions` di Laravel.
- **Storage** — `store('folder', 'public')` + `php artisan storage:link`.
- **Hapus file lama** — `Storage::disk('public')->delete(...)` saat update.
- **UX** — nonaktifkan tombol selama `processing`, tampilkan error per field.

---

⏭️ Lanjut ke [🔔 Bab 11 — Flash Message, Toast & UX Form](/bagian-4/bab-11) untuk melanjutkan!
