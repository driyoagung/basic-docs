---
title: "Bab 5 — Relasi Antar Model"
---

Relasi adalah inti dari database relasional. Prisma membuat mendefinisikan dan menggunakan relasi jauh lebih mudah dari menulis JOIN di SQL mentah. Di bab ini kita bahas semua jenis relasi secara mendalam — dengan kode lengkap dan perbandingan SQL-nya.

---

## 🔗 5.1 One-to-One — Satu ke Satu

Setiap record di tabel A berhubungan dengan tepat satu record di tabel B, dan sebaliknya.

```
Diagram:
┌──────────┐          ┌──────────┐
│  User    │  1 ── 1  │  Profil  │
│          │          │          │
│ id       │◄─────────│ userId   │
│ email    │          │ bio      │
└──────────┘          │ foto     │
                      └──────────┘
```

```prisma
// prisma/schema.prisma

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  nama      String
  password  String
  profil    Profil?
  // ↑ Tanda ? berarti relasi ini opsional
  // Seorang user mungkin belum punya profil
  // Tanpa ?, TypeScript akan selalu expect Profil ada

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Profil {
  id      Int     @id @default(autoincrement())
  bio     String? @db.Text   // Biografi (opsional)
  foto    String?            // URL foto (opsional)
  telepon String?            // Nomor telepon (opsional)
  website String?            // URL website (opsional)

  // Foreign key — referensi ke User
  userId  Int     @unique    // @unique memastikan ONE-to-ONE!
  // Tanpa @unique → ini jadi One-to-Many (satu user banyak profil)
  user    User    @relation(
    fields:    [userId],     // Kolom di tabel Profil yang jadi FK
    references: [id],        // Kolom di tabel User yang dirujuk
    onDelete:  Cascade,      // Jika User dihapus → Profil ikut terhapus
    onUpdate:  Cascade,      // Jika User.id berubah → Profil.userId ikut berubah
  )

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("profil")
}
```

```typescript
// Penggunaan One-to-One di TypeScript

// ① Buat User beserta Profil sekaligus (nested create)
const userBaru = await prisma.user.create({
  data: {
    email:    'budi@email.com',
    nama:     'Budi Santoso',
    password: 'hashed_password',

    profil: {
      create: {               // Buat Profil baru sekaligus
        bio:     'Full stack developer',
        foto:    'https://cdn.example.com/foto/budi.jpg',
        telepon: '081234567890',
        website: 'https://budi.dev',
      }
    }
  },
  include: { profil: true }  // Return profil di response
})

console.log(userBaru.profil?.bio)  // "Full stack developer"

// ② Tambahkan Profil ke User yang sudah ada
const profil = await prisma.profil.create({
  data: {
    bio:    'UI/UX Designer',
    userId: 5,              // Connect ke user dengan id 5
  }
})

// ③ Ambil User beserta Profilnya
const user = await prisma.user.findUnique({
  where:   { email: 'budi@email.com' },
  include: { profil: true }
})

// Type-safe access:
user?.profil?.bio        // string | null | undefined
user?.profil?.telepon    // string | null | undefined

// ④ Update Profil melalui User
await prisma.user.update({
  where: { id: 1 },
  data: {
    profil: {
      update: {
        bio: 'Senior Full Stack Developer',
      }
    }
  }
})

// ⑤ Hapus Profil (User tetap ada karena onDelete: Cascade hanya satu arah)
await prisma.profil.delete({ where: { userId: 1 } })
// User tidak terhapus, hanya profil-nya

// ⑥ Ambil User tanpa Profil (cek yang belum punya profil)
const userTanpaProfil = await prisma.user.findMany({
  where: { profil: null }
})
```

---

## 📚 5.2 One-to-Many — Satu ke Banyak

Satu record di tabel A bisa berhubungan dengan banyak record di tabel B. Ini adalah relasi yang paling sering dipakai.

```
Diagram:
┌──────────┐          ┌──────────┐
│ Kategori │  1 ── ∞  │  Produk  │
│          │          │          │
│ id ──────┼──────────► kategoriId│
│ nama     │          │ nama     │
└──────────┘          │ harga    │
                      └──────────┘
```

```prisma
model Kategori {
  id          Int       @id @default(autoincrement())
  nama        String    @unique
  slug        String    @unique
  deskripsi   String?   @db.Text
  gambar      String?

  produk      Produk[]  // ← Array: satu kategori punya banyak produk
  // Ini adalah "virtual field" — tidak ada kolom ini di database!
  // Prisma menggunakannya untuk query JOIN otomatis

  createdAt   DateTime  @default(now())

  @@map("kategori")
}

model Produk {
  id          Int       @id @default(autoincrement())
  nama        String
  slug        String    @unique
  deskripsi   String?   @db.Text
  harga       Decimal   @db.Decimal(12, 2)
  stok        Int       @default(0)
  aktif       Boolean   @default(true)

  kategoriId  Int                   // ← Kolom ini ADA di database (foreign key)
  kategori    Kategori  @relation(
    fields:    [kategoriId],        // FK di tabel Produk
    references: [id],               // PK di tabel Kategori
    onDelete:  Restrict,            // Kategori tidak bisa dihapus jika masih punya produk
  )

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("produk")
  @@index([kategoriId])  // WAJIB! Semua FK harus punya index
  @@index([aktif, createdAt])
}
```

```typescript
// Penggunaan One-to-Many di TypeScript

// ① Buat Kategori beserta Produk sekaligus
const elektronik = await prisma.kategori.create({
  data: {
    nama:      'Elektronik',
    slug:      'elektronik',
    deskripsi: 'Gadget dan perangkat elektronik',

    produk: {
      create: [                     // Buat banyak produk sekaligus
        {
          nama:  'Laptop ASUS ROG Zephyrus',
          slug:  'laptop-asus-rog-zephyrus',
          harga: 25000000,
          stok:  5,
        },
        {
          nama:  'Mouse Logitech G502',
          slug:  'mouse-logitech-g502',
          harga: 850000,
          stok:  25,
        },
        {
          nama:  'Keyboard Mechanical Keychron K2',
          slug:  'keyboard-keychron-k2',
          harga: 1200000,
          stok:  15,
        },
      ]
    }
  },
  include: {
    produk: {
      orderBy: { harga: 'desc' }    // Urutkan produk dari termahal
    }
  }
})
console.log(`Kategori: ${elektronik.nama}`)
console.log(`Jumlah produk: ${elektronik.produk.length}`)

// ② Tambahkan produk ke kategori yang sudah ada
const produkBaru = await prisma.produk.create({
  data: {
    nama:       'Headphone Sony WH-1000XM5',
    slug:       'headphone-sony-wh1000xm5',
    harga:      4500000,
    stok:       8,
    kategoriId: elektronik.id,     // Hubungkan ke kategori via ID
    // Atau pakai connect:
    // kategori: { connect: { slug: 'elektronik' } }
  }
})

// ③ Ambil Kategori dengan semua Produknya
const kategoriDenganProduk = await prisma.kategori.findUnique({
  where:   { slug: 'elektronik' },
  include: {
    produk: {
      where:   { aktif: true, stok: { gt: 0 } }, // Filter produk
      orderBy: { harga: 'asc' },                  // Urutkan
      take:    10,                                 // Maksimal 10 produk
      select: {                                    // Hanya field yang dibutuhkan
        id:    true,
        nama:  true,
        harga: true,
        stok:  true,
      }
    },
    _count: { select: { produk: true } }          // Hitung total produk
  }
})

console.log(`Total: ${kategoriDenganProduk?._count.produk} produk`)

// ④ Ambil Produk beserta Kategorinya
const semuaProduk = await prisma.produk.findMany({
  where:   { aktif: true },
  include: { kategori: true },
  orderBy: { createdAt: 'desc' },
  take:    20,
})

semuaProduk.forEach(p => {
  console.log(`${p.nama} — ${p.kategori.nama}`)
  // Type-safe: p.kategori pasti ada (bukan nullable)
  // karena kategoriId adalah required field
})

// ⑤ Pindahkan produk ke kategori lain
await prisma.produk.update({
  where: { id: 1 },
  data:  { kategoriId: 2 }  // Pindah ke kategori lain
})

// ⑥ Hitung produk per kategori
const statKategori = await prisma.kategori.findMany({
  include: {
    _count: { select: { produk: true } }
  },
  orderBy: {
    produk: { _count: 'desc' }  // Urutkan kategori dari yang paling banyak produk
  }
})
```

---

## 🔄 5.3 Many-to-Many — Banyak ke Banyak

Satu record di tabel A bisa berhubungan dengan banyak record di tabel B, dan sebaliknya. Prisma mendukung dua cara: implicit (otomatis) dan explicit (dengan model pivot).

```
Diagram:
┌─────────┐          ┌───────────┐          ┌─────┐
│ Produk  │  ∞ ── ∞  │ ProdukTag │  ∞ ── ∞  │ Tag │
│         │          │           │          │     │
│ id ─────┼──────────► produkId  │          │ id  │
│ nama    │          │ tagId ────┼──────────► nama │
└─────────┘          └───────────┘          └─────┘
```

### Cara 1: Implicit Many-to-Many (Prisma Urus Sendiri)

```prisma
// Prisma otomatis buat tabel pivot "_ProdukToTag" di database
// Gunakan ini jika tabel pivot tidak butuh kolom tambahan

model Produk {
  id   Int    @id @default(autoincrement())
  nama String
  tags Tag[]  // ← Array menunjukkan relasi many-to-many
}

model Tag {
  id     Int      @id @default(autoincrement())
  nama   String   @unique
  produk Produk[] // ← Array di sisi lain juga
}
// Database akan punya tabel: _ProdukToTag (A: produkId, B: tagId)
```

```typescript
// Penggunaan Implicit Many-to-Many

// Buat produk dengan tag yang sudah ada
const produk = await prisma.produk.create({
  data: {
    nama: 'Laptop Gaming ASUS ROG',
    tags: {
      connect: [           // Hubungkan ke tag yang sudah ada (by unique field)
        { nama: 'gaming' },
        { nama: 'laptop' },
        { nama: 'asus'   },
      ]
    }
  },
  include: { tags: true }
})

// Buat produk dengan tag baru dan yang sudah ada
const produk2 = await prisma.produk.create({
  data: {
    nama: 'Headphone Sony',
    tags: {
      connect:         [{ nama: 'audio' }],  // Tag yang sudah ada
      create:          [{ nama: 'sony' }],   // Buat tag baru
      connectOrCreate: [{                    // Connect jika ada, buat jika belum
        where:  { nama: 'wireless' },
        create: { nama: 'wireless' },
      }]
    }
  },
  include: { tags: true }
})

// Tambahkan tag ke produk yang sudah ada
await prisma.produk.update({
  where: { id: 1 },
  data: {
    tags: {
      connect: [{ nama: 'new-arrival' }]
    }
  }
})

// Hapus tag dari produk (produk dan tag tetap ada, hanya hubungannya dihapus)
await prisma.produk.update({
  where: { id: 1 },
  data: {
    tags: {
      disconnect: [{ nama: 'gaming' }]
    }
  }
})

// Ganti SEMUA tag dengan set baru
await prisma.produk.update({
  where: { id: 1 },
  data: {
    tags: {
      set: [{ nama: 'sale' }, { nama: 'promo' }]
      // set menggantikan SEMUA tag yang ada dengan tag-tag ini
    }
  }
})

// Ambil produk beserta semua tag-nya
const produkDenganTag = await prisma.produk.findMany({
  include: { tags: true }
})

// Filter produk yang punya tag 'gaming'
const produkGaming = await prisma.produk.findMany({
  where: {
    tags: { some: { nama: 'gaming' } }
    // some: setidaknya satu tag bernama 'gaming'
  },
  include: { tags: true }
})
```

### Cara 2: Explicit Many-to-Many (dengan Model Pivot)

```prisma
// Gunakan ini jika tabel pivot butuh kolom tambahan
// Contoh: kapan tag ditambahkan, siapa yang menambahkan, urutan tampil

model Produk {
  id       Int         @id @default(autoincrement())
  nama     String
  produkTags ProdukTag[]  // Relasi melalui model pivot
}

model Tag {
  id       Int         @id @default(autoincrement())
  nama     String      @unique
  produkTags ProdukTag[]  // Relasi melalui model pivot
}

// Model pivot — bisa punya kolom tambahan!
model ProdukTag {
  produkId    Int
  tagId       Int

  // Kolom tambahan yang tidak bisa ada di implicit M2M:
  dibuatPada  DateTime  @default(now())  // Kapan tag ini ditambahkan
  dibuatOleh  Int?                       // Siapa yang menambahkan
  prioritas   Int       @default(0)      // Urutan tampil

  // Relasi ke model parent
  produk      Produk    @relation(fields: [produkId], references: [id], onDelete: Cascade)
  tag         Tag       @relation(fields: [tagId],    references: [id], onDelete: Cascade)

  @@id([produkId, tagId])  // Composite PK — satu produk hanya bisa punya satu entri per tag
  @@map("produk_tag")
  @@index([tagId])  // Index untuk query sebaliknya (cari produk by tag)
}
```

```typescript
// Penggunaan Explicit Many-to-Many

// Tambahkan tag ke produk (dengan data tambahan)
await prisma.produkTag.create({
  data: {
    produkId:   1,
    tagId:      5,
    dibuatOleh: userId,  // Siapa yang menambahkan tag ini
    prioritas:  1,       // Tag ini tampil pertama
  }
})

// Ambil produk dengan semua tag-nya (plus data pivot)
const produkDenganTag = await prisma.produk.findUnique({
  where:   { id: 1 },
  include: {
    produkTags: {
      include:  { tag: true },           // Include data tag
      orderBy:  { prioritas: 'asc' },    // Urutkan berdasarkan prioritas
    }
  }
})

// Akses nama tag:
produkDenganTag?.produkTags.forEach(pt => {
  console.log(`Tag: ${pt.tag.nama}, Prioritas: ${pt.prioritas}`)
  console.log(`Ditambahkan pada: ${pt.dibuatPada.toLocaleDateString('id-ID')}`)
})

// Hapus tag dari produk
await prisma.produkTag.delete({
  where: {
    produkId_tagId: {  // Composite key untuk where
      produkId: 1,
      tagId:    5,
    }
  }
})
```

> 💡 **Implicit vs Explicit — Kapan Pakai Yang Mana?**
> 
> ```
> Pakai IMPLICIT jika:
> ✅ Tabel pivot tidak butuh kolom tambahan
> ✅ Tidak perlu query ke tabel pivot secara langsung
> ✅ Penulisan kode lebih simpel
> 
> Pakai EXPLICIT jika:
> ✅ Butuh simpan data tambahan di relasi (kapan, siapa, urutan)
> ✅ Butuh query langsung ke tabel pivot
> ✅ Butuh filter/sort berdasarkan data di tabel pivot
> ```

---

## ↩️ 5.4 Self-Relation — Model Berelasi dengan Dirinya Sendiri

```prisma
// ① Contoh 1: Kategori dengan sub-kategori (tree structure)
model Kategori {
  id         Int        @id @default(autoincrement())
  nama       String
  slug       String     @unique

  // Self-relation: kategori bisa punya parent kategori
  parentId   Int?       // null = ini adalah kategori root
  parent     Kategori?  @relation("SubKategori", fields: [parentId], references: [id])
  children   Kategori[] @relation("SubKategori")
  // Nama relasi "SubKategori" harus sama di kedua sisi!

  @@map("kategori")
  @@index([parentId])
}
```

```typescript
// Penggunaan self-relation kategori

// Buat struktur kategori bertingkat
const elektronik = await prisma.kategori.create({
  data: {
    nama:     'Elektronik',
    slug:     'elektronik',
    parentId: null,          // Root kategori

    children: {
      create: [
        { nama: 'Laptop',    slug: 'laptop'    },
        { nama: 'Smartphone', slug: 'smartphone' },
        { nama: 'Audio',     slug: 'audio'     },
      ]
    }
  },
  include: { children: true }
})

// Ambil kategori dengan semua sub-kategorinya (nested)
const tree = await prisma.kategori.findMany({
  where:   { parentId: null },   // Hanya root kategori
  include: {
    children: {
      include: {
        children: true           // Sub-sub kategori (level 3)
      }
    }
  }
})
```

---

## ⚙️ 5.5 Referential Actions — onDelete & onUpdate

Ini menentukan apa yang terjadi pada record yang berelasi ketika record parent dihapus atau ID-nya berubah:

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id     Int  @id @default(autoincrement())
  judul  String
  userId Int
  user   User @relation(
    fields:    [userId],
    references: [id],
    onDelete:  Cascade,   // ← Pilih sesuai kebutuhan
    onUpdate:  Cascade,
  )
}
```

```
Penjelasan semua pilihan Referential Action:

┌─────────────┬────────────────────────────────────────────────────────┐
│   Action    │  Apa yang terjadi pada record CHILD?                   │
├─────────────┼────────────────────────────────────────────────────────┤
│  Cascade    │  Child IKUT TERHAPUS/TERUPDATE bersama parent          │
│             │  Pakai untuk: Comment saat Post dihapus,               │
│             │               Item pesanan saat Pesanan dihapus        │
├─────────────┼────────────────────────────────────────────────────────┤
│  SetNull    │  FK di child di-set menjadi NULL                       │
│             │  Syarat: FK field harus nullable (Int?)                │
│             │  Pakai untuk: Post saat Author dihapus                 │
│             │               (post tetap ada tapi orphan)             │
├─────────────┼────────────────────────────────────────────────────────┤
│  SetDefault │  FK di child di-set ke nilai @default                  │
│             │  Jarang dipakai, harus ada @default di FK field        │
├─────────────┼────────────────────────────────────────────────────────┤
│  Restrict   │  ERROR — parent TIDAK BISA dihapus jika punya child   │
│             │  Pakai untuk: Kategori yang masih punya Produk,        │
│             │               User yang masih punya Pesanan aktif      │
├─────────────┼────────────────────────────────────────────────────────┤
│  NoAction   │  Seperti Restrict, cek dilakukan di akhir transaction  │
│             │  Lebih fleksibel untuk operasi kompleks dalam satu tx  │
└─────────────┴────────────────────────────────────────────────────────┘
```

```prisma
// Contoh penggunaan yang tepat:

model User {
  id       Int       @id @default(autoincrement())
  posts    Post[]
  pesanan  Pesanan[]
  komentar Komentar[]
}

model Post {
  userId Int
  user   User @relation(fields: [userId], references: [id],
    onDelete: Cascade  // Post dihapus jika User dihapus
  )
  komentar Komentar[]
}

model Komentar {
  postId Int
  post   Post @relation(fields: [postId], references: [id],
    onDelete: Cascade  // Komentar dihapus jika Post dihapus
  )
  userId Int?          // Nullable! Komentar bisa anonim
  user   User? @relation(fields: [userId], references: [id],
    onDelete: SetNull  // Komentar tetap ada (authorId jadi null) jika User dihapus
  )
}

model Pesanan {
  userId Int
  user   User @relation(fields: [userId], references: [id],
    onDelete: Restrict  // User TIDAK BISA dihapus jika masih punya pesanan!
  )
}
```

---

## 🔍 5.6 Studi Kasus — Schema E-Commerce Lengkap

Berikut contoh schema realistis yang menggabungkan semua jenis relasi:

```prisma
// Schema e-commerce yang menggabungkan semua jenis relasi

model Pengguna {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  nama         String
  password     String
  role         RolePengguna @default(PEMBELI)

  // One-to-One
  profil       Profil?

  // One-to-Many (sebagai "satu")
  pesanan      Pesanan[]
  ulasan       Ulasan[]
  alamat       Alamat[]

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  deletedAt    DateTime?  // Soft delete

  @@map("pengguna")
  @@index([email])
}

model Profil {
  id       Int      @id @default(autoincrement())
  bio      String?  @db.Text
  foto     String?
  telepon  String?

  // One-to-One dengan Pengguna
  penggunaId Int    @unique
  pengguna   Pengguna @relation(fields: [penggunaId], references: [id], onDelete: Cascade)

  @@map("profil")
}

model Kategori {
  id       Int        @id @default(autoincrement())
  nama     String     @unique
  slug     String     @unique
  gambar   String?

  // Self-relation (sub-kategori)
  parentId Int?
  parent   Kategori?  @relation("Subkategori", fields: [parentId], references: [id])
  children Kategori[] @relation("Subkategori")

  // One-to-Many dengan Produk
  produk   Produk[]

  @@map("kategori")
  @@index([parentId])
  @@index([slug])
}

model Produk {
  id          Int            @id @default(autoincrement())
  nama        String
  slug        String         @unique
  deskripsi   String?        @db.Text
  harga       Decimal        @db.Decimal(12, 2)
  stok        Int            @default(0)
  aktif       Boolean        @default(true)
  gambar      Json?          // Array URL gambar

  // One-to-Many (sebagai "banyak") — relasi ke Kategori
  kategoriId  Int
  kategori    Kategori       @relation(fields: [kategoriId], references: [id], onDelete: Restrict)

  // Many-to-Many implicit — relasi ke Tag
  tags        Tag[]

  // One-to-Many (sebagai "satu") — relasi ke ItemPesanan dan Ulasan
  itemPesanan ItemPesanan[]
  ulasan      Ulasan[]

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?

  @@map("produk")
  @@index([kategoriId])
  @@index([aktif, harga])
  @@index([slug])
}

model Tag {
  id     Int      @id @default(autoincrement())
  nama   String   @unique
  slug   String   @unique
  warna  String?  // Hex color untuk UI badge

  // Many-to-Many implicit — relasi ke Produk
  produk Produk[]

  @@map("tags")
}

model Pesanan {
  id            Int           @id @default(autoincrement())
  kodePesanan   String        @unique @default(cuid())
  status        StatusPesanan @default(MENUNGGU_PEMBAYARAN)
  total         Decimal       @db.Decimal(12, 2)
  catatan       String?       @db.Text
  alamatKirim   Json          // Snapshot alamat saat checkout

  // One-to-Many (sebagai "banyak") — relasi ke Pengguna
  penggunaId    Int
  pengguna      Pengguna      @relation(fields: [penggunaId], references: [id], onDelete: Restrict)

  // One-to-Many (sebagai "satu") — relasi ke ItemPesanan
  items         ItemPesanan[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("pesanan")
  @@index([penggunaId])
  @@index([status])
  @@index([kodePesanan])
}

model ItemPesanan {
  id          Int     @id @default(autoincrement())
  jumlah      Int
  hargaSatuan Decimal @db.Decimal(12, 2)
  // Snapshot harga saat checkout — penting! Harga produk bisa berubah nanti

  pesananId   Int
  pesanan     Pesanan @relation(fields: [pesananId], references: [id], onDelete: Cascade)

  produkId    Int
  produk      Produk  @relation(fields: [produkId], references: [id], onDelete: Restrict)

  @@map("item_pesanan")
  @@index([pesananId])
  @@index([produkId])
}

model Ulasan {
  id         Int     @id @default(autoincrement())
  rating     Int     // 1-5
  judul      String?
  konten     String? @db.Text
  terverifikasi Boolean @default(false) // Apakah pembeli memang sudah beli produk ini

  penggunaId Int
  pengguna   Pengguna @relation(fields: [penggunaId], references: [id], onDelete: Cascade)

  produkId   Int
  produk     Produk   @relation(fields: [produkId],   references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())

  @@unique([penggunaId, produkId])  // Satu pengguna hanya bisa review satu kali per produk
  @@map("ulasan")
  @@index([produkId])
  @@index([rating])
}

model Alamat {
  id          Int      @id @default(autoincrement())
  label       String   // "Rumah", "Kantor", dll
  penerima    String
  telepon     String
  jalan       String   @db.Text
  kota        String
  provinsi    String
  kodePos     String   @db.Char(5)
  isDefault   Boolean  @default(false)

  penggunaId  Int
  pengguna    Pengguna @relation(fields: [penggunaId], references: [id], onDelete: Cascade)

  @@map("alamat")
  @@index([penggunaId])
}

enum RolePengguna {
  ADMIN
  MANAJER
  EDITOR
  PEMBELI
}

enum StatusPesanan {
  MENUNGGU_PEMBAYARAN
  DIBAYAR
  DIPROSES
  DIKIRIM
  SELESAI
  DIBATALKAN
}
```

---

## ✅ Checklist Bab 5

```
□ Memahami perbedaan One-to-One, One-to-Many, dan Many-to-Many
□ Bisa menentukan di sisi mana foreign key diletakkan
□ Memahami perbedaan implicit vs explicit Many-to-Many
□ Tahu kapan pakai onDelete: Cascade vs Restrict vs SetNull
□ Bisa membaca diagram relasi dan menerjemahkannya ke schema Prisma
□ Semua foreign key sudah punya @@index
□ Paham bahwa "virtual field" (produk Produk[]) tidak membuat kolom di database
```

---

---

---

🚀 Lanjut ke [🔧 Bab 6 — Schema Lanjutan & Multi-Database](/bagian-2/bab-6) untuk melanjutkan perjalanan!
