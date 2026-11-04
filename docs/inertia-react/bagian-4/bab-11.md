---
title: "Bab 11 — Flash Message, Toast & UX Form"
---

# 📖 Bab 11 — Flash Message, Toast & UX Form

Setelah redirect, user perlu tahu apakah aksinya berhasil. Flash message dari Laravel + toast di React adalah pola standarnya. Bab ini juga membahas modal konfirmasi (bukan `window.confirm`), loading global dengan event Inertia, dan cara menyusun sistem notifikasi yang konsisten.

---

## 11.1 💬 Flash Message dari Shared Data

**Controller:**

```php
return redirect()->route('products.index')
    ->with('success', 'Produk berhasil disimpan!');

// atau error
return back()->with('error', 'Stok tidak mencukupi.');
```

**Middleware:**

```php
'flash' => [
    'success' => fn () => $request->session()->get('success'),
    'error'   => fn () => $request->session()->get('error'),
],
```

**React:**

```jsx
import { usePage } from '@inertiajs/react'

export default function Halaman() {
  const { flash } = usePage().props

  return (
    <div>
      {flash.success && <p className="text-green-600">{flash.success}</p>}
      {flash.error && <p className="text-red-600">{flash.error}</p>}
    </div>
  )
}
```

| Jenis | Kapan dipakai |
|---|---|
| `success` | Setelah create/update/delete berhasil |
| `error` | Kegagalan bisnis (stok habis, akses ditolak) |
| `warning` | Peringatan yang tidak menghentikan aksi |
| `info` | Informasi netral |

> 💡 **Flash hanya sekali.** Nilainya diambil dari session dan hilang setelah request berikutnya — cocok untuk pesan pasca-redirect.

---

## 11.2 🔔 Komponen Toast Otomatis Hilang

```jsx
// resources/js/Components/Toast.jsx
import { useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'

const WARNA = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-amber-500',
  info: 'bg-blue-600',
}

export default function Toast() {
  const { flash } = usePage().props
  const [daftar, setDaftar] = useState([])

  useEffect(() => {
    const baru = Object.entries(flash ?? {})
      .filter(([, teks]) => Boolean(teks))
      .map(([tipe, teks]) => ({ id: crypto.randomUUID(), tipe, teks }))

    if (baru.length === 0) return

    setDaftar((lama) => [...lama, ...baru])

    const timer = setTimeout(() => {
      setDaftar((lama) => lama.slice(baru.length))
    }, 4000)

    return () => clearTimeout(timer)
  }, [flash])

  if (daftar.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {daftar.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`rounded-lg px-4 py-3 text-white shadow-lg ${WARNA[t.tipe] ?? 'bg-gray-700'}`}
        >
          {t.teks}
        </div>
      ))}
    </div>
  )
}
```

Pasang sekali di layout:

```jsx
import Toast from '@/Components/Toast'

export default function AppLayout({ children }) {
  return (
    <div>
      <main>{children}</main>
      <Toast />
    </div>
  )
}
```

| Bagian | Fungsi |
|---|---|
| `useEffect` | Bereaksi saat `flash` berubah |
| `setTimeout` | Menghilangkan toast setelah 4 detik |
| `role="status"` | Dibacakan screen reader |
| `z-50` | Di atas konten lain |

---

## 11.3 🗑️ Modal Konfirmasi Hapus

`window.confirm` memblokir thread dan tidak bisa didesain. Gunakan modal.

```jsx
// resources/js/Components/ConfirmDialog.jsx
export default function ConfirmDialog({ open, judul, pesan, onBatal, onKonfirmasi, proses }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold">{judul}</h2>
        <p className="mt-2 text-sm text-gray-600">{pesan}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onBatal} className="rounded px-4 py-2 text-gray-600">
            Batal
          </button>
          <button
            onClick={onKonfirmasi}
            disabled={proses}
            className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {proses ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

Pemakaian:

```jsx
import { useState } from 'react'
import { router } from '@inertiajs/react'
import ConfirmDialog from '@/Components/ConfirmDialog'

export default function BarisProduk({ produk }) {
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [proses, setProses] = useState(false)

  function hapus() {
    setProses(true)
    router.delete(route('products.destroy', produk.id), {
      preserveScroll: true,
      onFinish: () => {
        setProses(false)
        setKonfirmasi(false)
      },
    })
  }

  return (
    <>
      <button onClick={() => setKonfirmasi(true)}>Hapus</button>

      <ConfirmDialog
        open={konfirmasi}
        judul="Hapus produk?"
        pesan={`"${produk.name}" akan dihapus permanen.`}
        onBatal={() => setKonfirmasi(false)}
        onKonfirmasi={hapus}
        proses={proses}
      />
    </>
  )
}
```

> ⚠️ **Tetap lindungi di backend.** Modal hanya mencegah klik tidak sengaja; route destroy tetap harus punya middleware/Policy (Bab 16).

---

## 11.4 ⏳ Loading State Global

Inertia memancarkan event saat navigasi dimulai dan selesai.

```jsx
// resources/js/Components/GlobalLoading.jsx
import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

export default function GlobalLoading() {
  const [aktif, setAktif] = useState(false)

  useEffect(() => {
    const mulai = () => setAktif(true)
    const selesai = () => setAktif(false)

    router.on('start', mulai)
    router.on('finish', selesai)

    return () => {
      router.off('start', mulai)
      router.off('finish', selesai)
    }
  }, [])

  if (!aktif) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-purple-600" />
  )
}
```

| Event | Kapan |
|---|---|
| `start` | Request Inertia dimulai |
| `finish` | Request selesai (sukses/gagal) |
| `invalid` | Response bukan Inertia (mis. redirect eksternal) |
| `exception` | Terjadi error |
| `navigate` | Setelah navigasi berhasil |

> 💡 Inertia sudah punya progress bar bawaan (`progress` di `createInertiaApp`). Gunakan event global hanya bila butuh indikator kustom.

---

## 11.5 🎬 Studi Kasus: Sistem Notifikasi Aplikasi

Gabungkan semuanya di satu layout:

```jsx
// resources/js/Layouts/AppLayout.jsx
import { usePage } from '@inertiajs/react'
import Toast from '@/Components/Toast'
import GlobalLoading from '@/Components/GlobalLoading'

export default function AppLayout({ children }) {
  const { auth } = usePage().props

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalLoading />

      <header className="flex items-center gap-4 bg-white p-4 shadow">
        <span className="font-bold">Toko</span>
        <span className="ml-auto text-sm text-gray-600">{auth.user?.name}</span>
      </header>

      <main className="p-6">{children}</main>

      <Toast />
    </div>
  )
}
```

Alur lengkap satu aksi:

```text
User klik "Simpan"
   │
   ▼
useForm.post() → GlobalLoading aktif
   │
   ▼
Laravel simpan + redirect + flash
   │
   ▼
Halaman baru → Toast membaca flash.success
   │
   ▼
4 detik → toast hilang otomatis
```

| Komponen | Tanggung jawab |
|---|---|
| `GlobalLoading` | Umpan balik saat request berjalan |
| `Toast` | Pesan hasil aksi |
| `ConfirmDialog` | Konfirmasi aksi destruktif |
| `errors` | Error validasi per field (Bab 9) |

---

## ✅ Checklist Bab 11

- **Flash** — dikirim dengan `->with()`, di-share lewat closure, dibaca dari `usePage().props.flash`.
- **Toast** — komponen global, auto-dismiss, `role="status"`.
- **Modal konfirmasi** — ganti `window.confirm`; tangani `processing`.
- **Loading global** — `router.on('start' | 'finish')`, bersihkan listener saat unmount.
- **Progress bar** — bawaan Inertia cukup untuk sebagian besar kasus.
- **Keamanan** — konfirmasi UI tidak menggantikan otorisasi backend.
- **Konsistensi** — satu sistem notifikasi di layout, bukan per halaman.

---

⏭️ Lanjut ke [🔁 Bab 12 — CRUD Lengkap](/bagian-5/bab-12) untuk melanjutkan!
