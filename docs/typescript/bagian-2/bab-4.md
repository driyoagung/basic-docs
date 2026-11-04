---
title: "Bab 4 — Fungsi di TypeScript"
---

# 📖 Bab 4 — Fungsi di TypeScript

Di React, hampir semuanya adalah fungsi: komponen adalah fungsi, `useState` menerima fungsi initializer, event handler adalah fungsi, custom hook adalah fungsi. Karena itu, kemampuan mengetik fungsi dengan benar adalah keterampilan harian yang akan Anda pakai setiap menit selama menulis komponen. Bab ini membahas anotasi parameter dan return type, parameter opsional dengan nilai default serta rest parameter, tipe fungsi sebagai callback (termasuk `onClick` dan `onChange` di React), pengenalan singkat function overload, catatan tentang `this` dan arrow function, lalu menutup dengan studi kasus dua helper yang pasti Anda butuhkan di project nyata: `formatRupiah` dan `debounce`.

---

## 4.1 🖊️ Anotasi Parameter & Return Type

Parameter fungsi **wajib** dianotasi di strict mode — parameter tanpa tipe memicu error `Parameter 'x' implicitly has an 'any' type`. Return type adalah sebaliknya: **boleh** tidak ditulis, karena inference TS biasanya sudah menebaknya dengan tepat.

```ts
// Parameter & return type
function hitungDiskon(harga: number, persen: number = 10): number {
  return harga - (harga * persen) / 100
}

// Arrow function
const sapa = (nama: string): string => `Halo, ${nama}`
```

Inference pada return type bekerja seperti ini:

```ts
function buatPengguna(id: number) {
  return { id, nama: 'Budi', aktif: true }
}
// TS menebak sendiri: { id: number; nama: string; aktif: boolean }
// Anda tidak perlu menulis return type-nya secara manual.
```

| Kasus | Anotasi return type? | Alasan |
|---|---|---|
| Fungsi kecil lokal yang `return`-nya jelas | ❌ Tidak perlu | Inference sudah tepat; menulis ulang tidak menambah apa pun |
| Fungsi yang mengembalikan object literal | ❌ Tidak perlu | Inference kadang lebih presisi daripada tulisan manual |
| Fungsi yang diekspor dan dipakai file lain | ✅ Disarankan | Ini "kontrak"; tanpa anotasi, perubahan internal meledak ke semua pemanggil |
| Fungsi yang return-nya bercabang kompleks | ✅ Disarankan | Untuk memastikan semua cabang mengembalikan bentuk yang dijanjikan |

**Penjelasan tabel:**

- **Fungsi internal** — prinsip "biarkan compiler bekerja". Tipe hasil inference tidak akan pernah salah.
- **Fungsi ekspor** — tanpa anotasi return, perubahan internal fungsi bisa diam-diam mengubah bentuk datanya, dan errornya meledak di file pemanggil yang jauh. Dengan anotasi, error terjebak di tempatnya.

> 💡 **Praktik yang disarankan:**
> Anotasi **parameter** dibuat setiap saat. Anotasi **return type**
> untuk fungsi yang diekspor atau tinggal lama. Fungsi kecil lokal?
> Biarkan TS yang menebak.

---

## 4.2 🎁 Parameter Opsional, Default & Rest

Dua hal berbeda ini sering dikacaukan: parameter **opsional** (`pemisah?`) dan parameter **default** (`pemisah = '-'`). Bedanya penting:

```ts
// Parameter opsional — mungkin tidak diisi
function buatSlug(teks: string, pemisah?: string): string {
  return teks.toLowerCase().trim().replace(/\s+/g, pemisah ?? '-')
}

// Parameter default — nilai diberikan jika tidak diisi
function hitungDiskon(harga: number, persen: number = 10): number {
  return harga - (harga * persen) / 100
}

// Rest parameter — menampung argumen berjumlah bebas
function jumlah(...angka: number[]): number {
  return angka.reduce((a, b) => a + b, 0)
}
```

| Sintaks | Arti | Tipenya di dalam fungsi |
|---|---|---|
| `pemisah?: string` | Bisa tidak diisi | `string \| undefined` — wajib dicek sebelum dipakai |
| `persen: number = 10` | Default: `10` | `number` saja — sudah terjamin |
| `...angka: number[]` | Semua argumen tersisa | `number[]` — array biasa |
| `...args: [string, number]` | Rest tuple — posisi diikat | `args[0]` pasti string, `args[1]` pasti number |

**Penjelasan tabel:**

- **Opsional (`?`)** — TS memasukkan `undefined` sebagai kemungkinan tipe. Selama belum dicek, Anda tidak boleh memakainya — di sinilah strict mode melarangnya.
- **Default (`= nilai`)** — karena sudah ada nilai pengganti, tipenya hanya `T`. Penanganan undefined sudah diurus oleh nilai default.
- **Rest (`...`)** — bentuk array menampung semua argumen; bentuk tuple mengikat posisi: `args[0]` pasti string, `args[1]` pasti number.

```ts
// Beda parameter opsional vs default dalam praktik
function tampilkan(label: string, level: 1 | 2 = 1, catatan?: string): string {
  // `level`  — pasti number, karena defaultnya sudah ada
  // `catatan`— bertipe `string | undefined` — harus dicek
  if (catatan !== undefined) {
    return `${label} (level ${level}) — ${catatan}`
  }
  return `${label} (level ${level})`
}
```

> ⚠️ **Kesalahan yang sangat umum:**
> Merasa bahwa parameter opsional "pasti punya nilai". Kenyataannya,
> tipenya TETAP `T \| undefined` — compiler mencegah pemakaiannya
> sampai Anda mengeceknya. Setiap `?:` di signature fungsi harus ada
> penanganannya di badan fungsi.

---

## 4.3 📚 Tipe Fungsi & Callback di React

Fungsi bertipe adalah data biasa: bisa disimpan di variabel, jadi tipe parameter, atau jadi tipe return. Sintaks menuliskan tipe fungsi:

```ts
// Tipe fungsi sebagai callback
type Handler = (id: number) => void

type ProdukActions = {
  onBeli: Handler
  onHapus: Handler
}
```

Berikut contoh tipe yang Anda akan sering lihat di project React:

| Kebutuhan | Tipe fungsi | Catatan |
|---|---|---|
| Callback click | `(event: React.MouseEvent<HTMLButtonElement>) => void` | `void` — tidak diharuskan return |
| Event change input | `(event: React.ChangeEvent<HTMLInputElement>) => void` | Ambil `event.target.value` |
| Callback di `useState` | `(prev: T) => T` | Bereaksi terhadap state sebelumnya |
| Callback di `useEffect` | `() => void \| (() => void)` | Bisa return fungsi cleanup |

**Penjelasan tabel:**

- **Event handler React** — tipenya panjang karena event handler punya elemen target berbeda-beda (button, input, form). Tipe tersebut memastikan `event.target` punya property yang benar.
- **`prev => next` di `useState`** — tipe callback update state; akan sering Anda lihat di Bab 14.
- **`useEffect`** — jika mengembalikan fungsi, fungsi itu adalah `cleanup` yang dijalankan sebelum effect berikutnya.

```tsx
// Props callback komponen React
type ToolbarProps = {
  onTambah: (nama: string) => void
  onHapus: (id: number) => void
}

export function Toolbar({ onTambah, onHapus }: ToolbarProps) {
  return (
    <>
      <button onClick={() => onTambah('Budi')}>Tambah</button>
      <button onClick={() => onHapus(1)}>Hapus</button>
    </>
  )
}
```

> 💡 **Kenapa `void` untuk callback React:**
> Handler bertipe `void` karena React TIDAK memakai nilai baliknya.
> Melimpahkan return value justru membingungkan bagi pembaca kode.
> Simpan saja pemanggilan fungsi atau arrow function tanpa variabel.

---

## 4.4 🔁 Function Overload (Pengenalan Singkat)

Function overload: satu fungsi punya **beberapa signature**. Di TypeScript, ini berguna ketika hasil return berbeda tergantung bentuk input — khususnya jika TS tidak bisa membedakannya hanya dari pemeriksaan di dalam badan fungsi:

```ts
// Signature 1: tanpa limit
function potong(s: string): string
// Signature 2: dengan limit number → max elemen
function potong(s: string, limit: number): string[]

// Implementasi — melayani semua signature
function potong(s: string, limit?: number): string[] {
  return limit === undefined ? s.split(' ') : s.split(' ').slice(0, limit)
}

potong('a b c')        // string[]
potong('a b c', 2)     // string[] — hasilnya ['a', 'b']
```

Sebentar saja cukup. Overload banyak sekali muncul di tipe bawaan DOM dan library JavaScript — misalnya signature yang berbeda tergantung jenis input. Untuk kebutuhan sehari-hari, Anda jarang perlu menulis overload sendiri; yang penting Anda dapat **membacanya** saat menemukan tipe library. Materi yang lebih advance (overload + generics) disambung nanti di Bab 7.

---

## 4.5 ↩️ `this` & Arrow Function

Di JavaScript, `this` ditentukan oleh **bagaimana fungsi dipanggil**, bukan tempat fungsi dideklarasikan. Di TypeScript, `this` bisa dianotasi secara eksplisit sebagai parameter pertama fungsi biasa:

```ts
interface Pembeli {
  nama: string
  sapaan: () => string                // arrow function — tidak punya `this` sendiri
  sapaanBiasa(this: Pembeli): string  // beranotasi — `this` harus Pembeli
}
```

Kabar baiknya: di React modern dan Next.js, Anda akan jarang sekali memikirkan `this` lagi. Class component mulai ditinggalkan, dan function component menghilangkan hampir semua kebutuhan akan `this`. Yang perlu Anda ingat:

- **Arrow function** (`() => {}`) — mewarisi `this` dari cakupan sekitarnya. Tidak bisa "nyasar" ke tempat lain.
- **Fungsi biasa (`function(){}`)** — punya `this` sendiri yang bisa berubah tergantung pemanggil. Lebih rawan — dan anotasi `this: Pembeli` di TypeScript mirip safety lock.
- **Event handler React** — gunakan arrow function di dalam komponen (`onClick={() => ...}`). Masalah `this` praktis tidak pernah muncul lagi.

---

## 4.6 🎬 Studi Kasus: `formatRupiah` & `debounce`

Dua helper yang pasti terpakai di aplikasi web Indonesia: memformat angka ke Rupiah, dan menahan ketikan pada kolom pencarian.

### `formatRupiah`

Helper beranotasi penuh dengan parameter default dan return type eksplisit:

```ts
function formatRupiah(nilai: number, minimumDigit = 0): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: minimumDigit,
  }).format(nilai)
}

formatRupiah(1500000)        // "Rp1.500.000"
formatRupiah(1500000, 2)     // "Rp1.500.000,00"
```

### `debounce` — menunda eksekusi sampai pengguna berhenti mengetik

Skenario nyata: kolom pencarian yang setiap keystroke memanggil API. Solusinya adalah `debounce` — setiap keystroke mengatur ulang timer, dan request hanya dikirim setelah berhenti mengetik:

```
 KETIKAN KEYBOARD                       WAKTU (jalan ke kanan)
 ────●────●────●────●────●─────────╳
    beberapa keystroke             API call setelah 400ms diam ✅

 ────●───●───●───────●───●───●───●───►
          Tanpa debounce: API dipanggil
          di setiap keystroke — banyak request sia-sia 💸
```

Implementasi `debounce` dengan TS:

```ts
function debounce(fn: (...args: unknown[]) => void, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined

  return (...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Pemakaian contoh di React
const cari = debounce((keyword: string) => {
  console.log('mengambil data untuk:', keyword)
}, 400)
```

Catatan penting dari studi kasus ini:

- **`timer` bertipe `ReturnType<typeof setTimeout> | undefined`** — lebih aman daripada `number`, karena tipe id timer berbeda antara browser dan Node.js. `ReturnType` memungkinkan TS mencari tipe yang benar di lengan berapa pun.
- **`...args: unknown[]`** — bentuk vector yang cukup untuk umum, TAPI… di Bab 7, setelah Anda mempelajari **generics**, versi `debounce<F>` akan membuat tipe argumen "mengikuti" fungsi yang di-burn. Untuk sawhere, versi pattern cukup yang pak adalah cukup.
- **`delay = 300`** — nilai default 300ms, kebiasaan yang umum di library debounce: pemanggil cukup `debounce(fn)` kalau tidak ingin menyetel.

> 💡 **Kenapa `ReturnType<typeof setTimeout>`:**
> Di browser, timer id adalah `number`; di Node.js, tipe-nya
> `NodeJS.Timeout` — bukan number. Menulis `number` atau berpaling
> `setTimeout` gagal dikompile di banyak system. Menggunakan
> `ReturnType` mengikutkan tipe `setTimeout` yang aktif di masa.

---

## ✅ Checklist Bab 4

- **Parameter: wajib dianotasi** — di strict mode, parameter tanpa tipe memicu error "implicitly has an 'any' type".
- **Return type: boleh tidak ditulis** — inference cukup untuk fungsi lokal; untuk fungsi publik dan yang diekspor, tulis anotasi.
- **Parameter opsional (`?`)** — tipenya otomatis `T | undefined`; wajib ditangani sebelum dipakai.
- **Parameter default** — sudah terisin nilai pengganti, tapinya tak bertipe `undefined` drops pull.
- **Rest parameter (`...`)** — menampung argumen jumlah bebas; tipenya bisa array atau tuple.
- **Tipe fungsi (`type Handler = ...`)** — fungsi adalah data yang bisa di-passing; props seperti `onTambah: Handler` adalah kontrak callback bagi komponen React.
- **Callback React** — dari `(event: React.MouseEvent<HTMLButtonElement>) => void`, dan sejenisnya.
- **Function overload** — fungsi satu dengan beberapa signature; semantic perkenal itu banyak muncul di utility built-in. Detail pada Bab 7.
- **Arrow function** — mewarisi `this` dari cakupan sekitarnya; digilka untuk handler React.
- **`debounce`** — timer id bertipe `ReturnType<typeof setTimeout> | undefined`, bukan `number` polos.
- **`formatRupiah`** — helper dengan parameter default dan return string; menggunakan `Intl.NumberFormat('id-ID')`.

---

⏭️ Lanjut ke [🧱 Bab 5 — Object, type & interface](/bagian-2/bab-5) untuk melanjutkan!
