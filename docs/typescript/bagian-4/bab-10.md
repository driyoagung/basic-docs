---
title: "Bab 10 — Class & OOP di TypeScript"
---

# 📖 Bab 10 — Class & OOP di TypeScript

TypeScript adalah superset JavaScript, dan JavaScript sudah lama memiliki class — jadi TypeScript menambahkan yang paling menarik: **pengecekan tipe di atasnya**. Bahkan jika Anda menulis React dengan function component dan jarang membuat class sendiri, pemahaman ini tetap wajib: class muncul di kode library (misalnya `ZodError`, `Error` custom, atau class dari SDK backend), di ada server actions dengan pola service, dan di proyek Express/NestJS yang akan Anda temui di file backend. Bab ini membekali Anda membaca dan menulis class TypeScript dengan aman — dari property bertipe sampai studi kasus service class dengan dependency yang tervalidasi tipe.

## 10.1 🏷️ Kelas, Properti Bertipe, dan Constructor

Di TypeScript, properti class **wajib dideklarasikan tipenya** di kelas itu sendiri, di luar constructor:

```ts
class Produk {
  id: number
  nama: string
  harga: number

  constructor(id: number, nama: string, harga: number) {
    this.id = id
    this.nama = nama
    this.harga = harga
  }

  deskripsi(): string {
    return `${this.nama} — Rp${this.harga.toLocaleString('id-ID')}`
  }
}

const p = new Produk(1, 'Laptop', 15_000_000)
p.deskripsi()      // 'Laptop — Rp15.000.000' — autocomplete lengkap ✅
p.email = 'x'      // ❌ error: properti tidak ada
```

**Penjelasan aturan penting:**

- **Strict mode mengharuskan setiap properti terisi** — jika Anda deklarasikan `id: number` tanpa mengisinya di constructor, TS menahan: `Property 'id' has no initializer`. Beri nilai default (`id: number = 0`), isi di constructor, atau tanda tanyau `id!: number` saat Anda yakin diisi di tempat lain.
- **Metode otomatis dapat tipe** — return type bisa Anda tulis eksplisit atau biarkan inferensi `deskripsi(): string`. Untuk metode publik, menuliskannya eksplisit itu kebiasaan baik.
- **Hampir semua error class TM muncul saat kompilasi klasik** — maka bahkan jika kode library JS jadi bisa dilihat defisinya.

## 10.2 �.getTable Access Modifier

| Modifier | Ke mana | Untuk apa |
|---|---|---|
| (tidak ada) / `public` | Bisa diakses dari mana saja | Default; properti/metode normal |
| `private` | Hanya di dalam class yang sama | Menyembunyikan detail internal |
| `protected` | Class itu + subclass-nya | Data milik rantai pewarisan |
| `readonly` | Bisa diakses, tak boleh di-reassign | Data yang ditetapkan satu kali |
| `#field` (JS) | Private betul-betul di runtime | Enkapsulasi nyata, bukan hanya konvensi tipe |

```ts
class Keranjang {
  private items: Produk[] = []          // internal saja
  readonly dibuatPada = new Date()      // satu kali, lalu tetap

  tambah(item: Produk): void {
    this.items.push(item)
  }

  total(): number {
    return this.items.reduce((sum, p) => sum + p.harga, 0)
  }
}

const k = new Keranjang()
// k.items        ❌ error: ' items' adalah properti private
k.tambah(new Produk(1, 'Laptop', 15_000_000))
k.total()          // ✅
```

**Penjelasan modifier:**

- **`private` memberi tahu compiler saja** — saat dikompilasi, tetap jadi properti biasa. `#namaField` milik JavaScript lebih "betul-betul" — benar tak terlihat di runtime, tetapi sedikit berbeda dalam ergonominya.
- **`readonly` dalam konteks kelas** bisa dipakai di lokasi presisasi properti dan properti kelas: hanya mencegah reassign `this.x = ...`, tidak membakukan isi objek/class yang bertipe `Produk` )
- **Care tsask wajib berhati-hati** — `protected` bertebaran antara `private` dan publik pewarisan: subclass boleh membaca/mengubah, dunia luar tidak.

## 10.3 📐 Parameter Property: Penulisan Singkat Constructor

ReLU pola yang sangat umpat di TypeScript memetars metode启蒙 constructor menjadi parameter class:

```ts
// Long version
class Keranjang {
  private items: Produk[]
  constructor(items: Produk[]) {
    this.items = items
  }
}

// Shorthand: deklarasikan & isi sekaligus
class Keranjang {
  constructor(private items: Produk[]) {}
}
```

**Penjelasan shorthand:**

- **`private items: Produk[]` sebagai parameter constructor** — **langsung dibuat properti kelas dan di isi** `this.items = items`. Satu baris menggantikan dua baris sebelumnya.
- **Modifier berlaku apa pun untuk properti kelas** — `private`, `readonly`, atau kombinasi `readonly private` semuanya bisa ditambahkan pada parameter.
- **Cuaca Lainnya sah** — banyak kode pemula sekalipun (Ekspresi / NestJ / data service) memakai pola ini.

## 10.4 🧩 `implements` Interface & Abstract Class

```ts
// Interface = kontrak bentuk
interface BisaDisimpan {
  simpan(): Promise<void>
}

interface BerTempo {
  validSampai: Date
}

// implements: pengembangan UNTUK memenuhi kontrak
class LoginSession implements BisaDisimpan, BerTempo {
  constructor(public user: string, public validSampai: Date) {}

  async simpan(): Promise<void> {
    // implementasi riil di sini ...
  }
}
```

**Abstract class** = kelas dasar yang tidak bisa diinstansiasi, tetapi menampung logika bersama:

```ts
abstract class Repository<T> {
  abstract cari(id: number): Promise<T | null>     // wajib diisi subclass
  abstract semuanya(): Promise<T[]>

  // logika dibagi: boleh langsung dipakai subclass
  async jumlah(): Promise<number> {
    return (await this.semuanya()).length
  }
}

class ProdukRepository extends Repository<Produk> {
  async cari(id: number): Promise<Produk | null> { /* ... */ return null }
  async semuanya(): Promise<Produk[]> { /* ... */ return [] }
}
```

```
             RESPONSIBILITAS: interface vs abstract class

  ┌────────────────────┐            ┌─────────────────────────┐
  │     interface      │            │      abstract class     │
  │  (100% kontrak)    │            │  kontrak + logika bersama│
  ├────────────────────┤            ├─────────────────────────┤
  │ tanpa implementasi │            │ punya method jadi, puny │
  │ bisa multim/mungkin│            │ field, constructor      │
  │ extends: BEBAS     │            │ extends: SATU saja      │
  │ (1 class, banyak    │           │ (pewarisan tunggal JS)  │
  │  implementasi)     │            │                          │
  └────────────────────┘            └─────────────────────────┘
           │                                │
           └──── pewarisan Andrea bisa digabung ────┘
```

| Aspek | `implements` interface | extends abstract class |
|---|---|---|
| Isi | Hanya kontrak metode/properti | Kontrak + implementasi siap pakai |
| Batas pewarisan | Bisa banyak sekaligus | Hanya satu (aturan JS) |
| Cocok untuk | Kontrak lintas modul | Kerangka dengan logika bersama |

## 10.5 ⚖️ Class vs Object Literal + Fungsi: Gabung yang Mana?

Ini pertanyaan praktis — di ekosistem React, kebanyakan kode **bukan** class:

| Aspek | class + instance | object literal + fungsi |
|---|---|---|
| Ekosistem React | Langka | Dominan |
| Cocok untuk | Service class, SDK, framework yang menuntutnya | Komponen, helper, modul utilitas |
| Manajemen state | `this` bisa membingungkan | Tidak ada `this` — lebih mudah diprediksi |
| DI / framework | Pola service database server umum | Cukup di beberapa skenario |

Rekomendasi kebiasaan:

- **Di file React/Next.js, default menulis** — object literal dan fungsi biasa. React sendiri sudah beralir model "fungsi + hooks", maka edisi umum bila Anda mem Parsing class di kode komponen, itulah biasanya dari kode harus awet kebutuhan layar tertentu.
- **Class proses untuk service/server** — Backend class seperti `ProdukService` masih wajar di lapisan data. Baik juga saat permintaan dirancang di sisi Node.js yang tidak ada React.
- **Baca kode framework tulis class** — `Error` subclass, SDK pihak ketiga, Express controller — semua tetap class karena kompatibilitas & ekosistemnya.

## 10.6 🎬 Studi Kasus: `ProdukService` dengan Dependency Bertipe

Sekarang gabungkan semuanya: class service dengan **dependency yang dideklarasikan tipe dan diinject lewat constructor** — pola yang memudahkan testing.

```ts
// types/produk.ts
type Produk = { id: number; nama: string; harga: number }

// Tipe kontrak dependency — bukan implementasinya
interface ProdukStore {
  cari(id: number): Promise<Produk | null>
  semua(): Promise<Produk[]>
  simpan(produk: Produk): Promise<void>
}

// logger sebagai dependency kedua
interface Logger {
  info(pesan: string): void
  error(pesan: string): void
}

class ProdukService {
  constructor(
    private readonly store: ProdukStore,   // ← tipe kontrak, bukan class konkret
    private readonly log: Logger,
  ) {}

  async lihat(id: number): Promise<Produk> {
    const produk = await this.store.cari(id)
    if (!produk) {
      this.log.error(`Produk ${id} tidak ditemukan`)
      throw new Error(`Produk ${id} tidak ditemukan`)
    }
    this.log.info(`Produk ${id} ditemukan`)
    return produk
  }

  async tambah(input: Omit<Produk, 'id'>): Promise<Produk> {
    const produk: Produk = { id: Date.now(), ...input }
    await this.store.simpan(produk)
    this.log.info(`Produk baru: ${produk.nama}`)
    return produk
  }

  async daftar(): Promise<Produk[]> {
    return this.store.semuanya()
  }
}
```

Manfaat peneosan dependency bertipe dapat dirasakan di testing:

```ts
// Testing mudah: store asli diganti fake sesuai kontrak
class FakeStore implements ProdukStore {
  data = new Map<number, Produk>()

  async cari(id: number): Promise<Produk | null> {
    return this.data.get(id) ?? null
  }
  async semua(): Promise<Produk[]> {
    return [...this.data.values()]
  }
  async simpan(produk: Produk): Promise<void> {
    this.data.set(produk.id, produk)
  }
}

const fakeLog: Logger = {
  info: () => {},   // test: tidak usah log
  error: () => {},
}

const service = new ProdukService(new FakeStore(), fakeLog)
// service.lihat() dan semua method teruji TANPA database ✅
```

```
        STRUKTUR DEPENDENCY ProdukService

   ┌──────────────┐       ┌──────────────────┐
   │ ProdukStore  │◄──────│   ProdukService  │
   │ (interface)  │       │                  │
   └──────▲───────┘       │ + store, log     │
          │ implements    └────────▲─────────┘
          │                        │ implements
   ┌──────┴────────┐       ┌──────┴────────┐
   │  DbStore      │       │   FakeStore   │
   │ (produksi)    │       │  (testing)    │
   └───────────────┘       └───────────────┘

   Service tak tahu implementasinya — cukup kontraknya ✅
```

**Penjelasan studi kasus:**

- **`ProdukStore` adalah kontrak, bukan class konkret** — service menerima "bentuk kemampuan", sehingga bisa diganti `DbStore` di produksi maupun `FakeStore` di test tanpa mengubah satu baris.
- **`private readonly` di parameter property** — kombinasi pola Bab 10.2 + 10.3: properti tersembunyi dari luar dan tidak bisa di-reassign setelah constructor.
- **Dependency kedua (`Logger`)** menunjukkan class boleh punya lebih dari satu dependency dengan parameter type yang berbeda.
- **`Date.now()` sebagai id** memudahkan contoh; di lampiran `uuid` atau serialisasi backend mana pun yang lumrah.

> ⚠️ **Jangan tanpa diberitahu menyuntik class konkret ke service.** Jika constructor menuntut `DbStore` langsung (bukan interface `ProdukStore`), pengujian punya rintangan: Anda HARUS menyuntik instance database asli. Deklarasikan kontrak dulu (interface), baru dilengkapi inject-nya.

> 💡 **Hubungannya dengan bagian depan:** class service seperti ini sering jadi lapisan di atas Prisma/ORM — method `ProdukService.lihat()` membungkus `prisma.produk.findUnique()`. Di project Prisma ebook terpisah, membekasiah interface `ProdukStore` diimplementasi `PrismaProdukStore` semua punya bantalan siap di kontrak itu.

## ✅ Checklist Bab 10

- ✅ Bisa menulis class dengan properti bertipe dan mengatasi error "no initializer" dari strict mode.
- ✅ Memahami tanda tanya darisetiap access modifier: `public`, `private`, `protected`, `readonly`, dan `#field`.
- ✅ Bisa memakai parameter property shorthand: `constructor(private items: Produk[])`.
- ✅ Bisa menulis class yang `implements` satu atau lebih interface sebagai kontrak.
- ✅ Mengenal abstract class: subclass wajib meneruskan metode abstrak, metode biasa boleh dibagi.
- ✅ Mahir menautkan kapan class layak dipilih — dan kapan object literal + fungsi lebih thenoi di ekosistem React.
- ✅ Bisa menyusun service class dengan dependency bertipe lewat interface, sehingga pengujian cukup inject fake implementasi.

---

⏭️ Lanjut ke [🗂️ Bab 11 — Module & Deklarasi Tipe](/bagian-4/bab-11) untuk melanjutkan!
