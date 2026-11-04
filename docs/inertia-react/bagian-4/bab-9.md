---
title: "Bab 9 — useForm & Validasi"
---

# 📖 Bab 9 — useForm & Validasi

Hampir semua interaksi user di aplikasi CRUD adalah form. Inertia menyediakan hook `useForm` yang menangani state, pengiriman, error validasi, dan status processing sekaligus — tanpa `fetch`, `axios`, atau `try/catch`. Bab ini membedah anatomi `useForm`, pola submit yang benar, dan cara merapikan form yang kompleks.

---

## 9.1 📝 Form Lengkap

```jsx
import { useForm } from '@inertiajs/react'

export default function Create() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    price: '',
  })

  function submit(e) {
    e.preventDefault()
    post(route('products.store'), {
      onSuccess: () => reset(),
    })
  }

  return (
    <form onSubmit={submit}>
      <input
        value={data.name}
        onChange={(e) => setData('name', e.target.value)}
      />
      {errors.name && <p className="text-red-600">{errors.name}</p>}

      <input
        type="number"
        value={data.price}
        onChange={(e) => setData('price', e.target.value)}
      />
      {errors.price && <p className="text-red-600">{errors.price}</p>}

      <button disabled={processing}>
        {processing ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  )
}
```

```php
// Controller — validasi Laravel biasa
public function store(Request $request)
{
    $validated = $request->validate([
        'name'  => 'required|string|max:255',
        'price' => 'required|numeric|min:0',
    ]);

    Product::create($validated);

    return redirect()->route('products.index')
        ->with('success', 'Produk berhasil ditambahkan!');
}
```

> 💡 **Tidak ada penanganan error manual.** Jika validasi gagal, Laravel redirect kembali dengan error; Inertia mengisinya ke `errors` otomatis.

---

## 9.2 🧬 Anatomi `useForm`

```jsx
const form = useForm({
  name: '',
  price: '',
  category_id: '',
})
```

| Properti | Tipe | Fungsi |
|---|---|---|
| `data` | object | Nilai form saat ini |
| `setData(key, value)` | fungsi | Mengubah satu field |
| `setData(object)` | fungsi | Mengubah banyak field sekaligus |
| `errors` | object | Error validasi per field |
| `processing` | boolean | Request sedang berjalan |
| `progress` | object/null | Progress upload (Bab 10) |
| `reset(...fields)` | fungsi | Kembalikan ke nilai awal |
| `clearErrors(...fields)` | fungsi | Hapus error |
| `isDirty` | boolean | Ada perubahan dari nilai awal |
| `transform(callback)` | fungsi | Ubah data sebelum dikirim |
| `post/put/patch/delete` | fungsi | Kirim request |

Contoh pemakaian lanjutan:

```jsx
const { data, setData, errors, processing, isDirty, reset } = useForm({
  name: '',
  price: '',
  is_active: true,
})

setData({ name: 'Laptop', price: '15000000' })  // banyak field
reset('name')                                   // reset satu field
reset()                                         // reset semua
```

---

## 9.3 🚀 Submit dan Callback

```jsx
post(route('products.store'), {
  preserveScroll: true,
  onSuccess: (page) => {
    reset()
    // page.props berisi props halaman tujuan
  },
  onError: (errors) => {
    console.log(errors) // sama dengan form.errors
  },
  onFinish: () => {
    // selalu jalan, sukses atau gagal
  },
})
```

| Callback | Kapan dipanggil |
|---|---|
| `onSuccess` | Request sukses (termasuk redirect) |
| `onError` | Validasi gagal (422) |
| `onFinish` | Selalu, di akhir |
| `onCancel` | Request dibatalkan |
| `onProgress` | Upload berjalan (Bab 10) |

`processing` sudah cukup untuk menonaktifkan tombol — tidak perlu state `loading` sendiri.

---

## 9.4 🧾 Form Request Class

Validasi yang panjang sebaiknya dipindah ke Form Request agar controller tetap ringkas.

```bash
php artisan make:request StoreProductRequest
```

```php
// app/Http/Requests/StoreProductRequest.php
public function authorize(): bool
{
    return true;
}

public function rules(): array
{
    return [
        'name'        => ['required', 'string', 'max:255'],
        'price'       => ['required', 'numeric', 'min:0'],
        'category_id' => ['required', 'exists:categories,id'],
        'description' => ['nullable', 'string'],
    ];
}
```

```php
public function store(StoreProductRequest $request)
{
    Product::create($request->validated());

    return redirect()->route('products.index')
        ->with('success', 'Produk disimpan');
}
```

| Validasi di controller | Form Request |
|---|---|
| Cepat untuk form kecil | Rapi untuk form besar |
| Sulit dipakai ulang | Bisa dipakai di store & update |
| Controller panjang | Controller tetap bersih |

---

## 9.5 🗂️ Error Bag (Beberapa Form di Satu Halaman)

Misalnya halaman profil punya form "update profil" dan "ganti password".

```jsx
const profil = useForm({ name: '', email: '' })
const password = useForm({ current_password: '', password: '' })

profil.put(route('profile.update'), { errorBag: 'profil' })
password.put(route('password.update'), { errorBag: 'password' })
```

Akses error sesuai bag:

```jsx
profil.errors.name
password.errors.current_password
```

> ⚠️ **Tanpa `errorBag`, error dari dua form bisa saling menimpa** pada field dengan nama sama (mis. `password`).

---

## 9.6 🧩 Komponen `<Form>` (Inertia v2)

Untuk form sederhana yang tidak butuh state manual:

```jsx
import { Form } from '@inertiajs/react'

export default function Create() {
  return (
    <Form action={route('products.store')} method="post">
      {({ errors, processing }) => (
        <>
          <input name="name" />
          {errors.name && <p>{errors.name}</p>}

          <input name="price" type="number" />
          {errors.price && <p>{errors.price}</p>}

          <button disabled={processing}>Simpan</button>
        </>
      )}
    </Form>
  )
}
```

| Kapan `<Form>` | Kapan `useForm` |
|---|---|
| Form sederhana | Butuh state terkontrol |
| Tidak perlu validasi client | Perlu `isDirty`, `transform`, reset selektif |
| Cukup submit + error | Butuh callback lifecycle lengkap |

---

## 9.7 🛡️ Mencegah Double Submit & Kehilangan Data

**Double submit** dicegah dengan `processing`:

```jsx
<button type="submit" disabled={processing}>
  {processing ? 'Menyimpan...' : 'Simpan'}
</button>
```

**Peringatan sebelum keluar** saat ada perubahan:

```jsx
import { useEffect } from 'react'

export default function Edit() {
  const { data, setData, put, processing, isDirty } = useForm({ name: '' })

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // ...
}
```

> 💡 **`isDirty`** berguna juga untuk menonaktifkan tombol simpan saat tidak ada perubahan.

---

## 9.8 🎬 Studi Kasus: Form Produk dengan Komponen Reusable

**`TextInput`:**

```jsx
// resources/js/Components/TextInput.jsx
export default function TextInput({ label, error, ...props }) {
  return (
    <div className="mb-4">
      <label className="block mb-1 text-sm font-medium">{label}</label>
      <input
        {...props}
        className={
          'w-full rounded border px-3 py-2 ' +
          (error ? 'border-red-500' : 'border-gray-300')
        }
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

**Halaman create:**

```jsx
import { useForm, Head } from '@inertiajs/react'
import TextInput from '@/Components/TextInput'

export default function Create({ categories }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    price: '',
    category_id: '',
    description: '',
  })

  function submit(e) {
    e.preventDefault()
    post(route('products.store'), { onSuccess: () => reset() })
  }

  return (
    <>
      <Head title="Tambah Produk" />
      <form onSubmit={submit} className="max-w-lg">
        <TextInput
          label="Nama"
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          error={errors.name}
        />

        <TextInput
          label="Harga"
          type="number"
          value={data.price}
          onChange={(e) => setData('price', e.target.value)}
          error={errors.price}
        />

        <select
          value={data.category_id}
          onChange={(e) => setData('category_id', e.target.value)}
          className="w-full rounded border px-3 py-2 mb-4"
        >
          <option value="">Pilih kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.category_id && (
          <p className="text-sm text-red-600">{errors.category_id}</p>
        )}

        <textarea
          value={data.description}
          onChange={(e) => setData('description', e.target.value)}
          className="w-full rounded border px-3 py-2 mb-4"
        />

        <button disabled={processing} className="rounded bg-purple-600 px-4 py-2 text-white">
          {processing ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </>
  )
}
```

Alur yang terjadi saat submit:

```text
Submit → useForm.post()
   │
   ▼
Laravel validate
   ├─ gagal → redirect back + errors → form.errors terisi
   └─ sukses → redirect + flash → onSuccess → reset()
```

---

## ✅ Checklist Bab 9

- **`useForm`** — state, submit, error, processing dalam satu hook.
- **`setData`** — satu field atau banyak field; immutable.
- **`errors`** — otomatis dari validasi Laravel, per field.
- **`processing`** — nonaktifkan tombol, cegah double submit.
- **Callback** — `onSuccess`, `onError`, `onFinish`, `onCancel`.
- **Form Request** — validasi terpisah untuk form besar.
- **Error bag** — `errorBag` saat ada beberapa form di satu halaman.
- **`<Form>`** — alternatif ringkas untuk form sederhana.
- **`isDirty`** — peringatan keluar dan tombol simpan.
- **Komponen reusable** — `TextInput` + error terpusat.

---

⏭️ Lanjut ke [📤 Bab 10 — Upload File](/bagian-4/bab-10) untuk melanjutkan!
