---
title: "Bab 8 — Seeder & Data Awal"
---

Seeder adalah kode yang mengisi database dengan data awal — baik untuk keperluan development (data dummy yang realistis), testing (data yang konsisten untuk setiap test), maupun production (data master yang wajib ada seperti kategori, konfigurasi sistem, atau akun admin pertama).

---

## 🌱 8.1 Mengapa Seeder Penting?

```
MASALAH TANPA SEEDER:
────────────────────────────────────────────────────────────────
Developer baru join tim:
  "Database sudah kosong, bagaimana aku test fitur pencarian produk
   kalau tidak ada produknya?"

QA Engineer mau testing:
  "Aku harus input manual 50 produk dengan berbagai kategori
   setiap kali database di-reset? Itu membuang banyak waktu!"

Bug report dari user:
  "Bug ini hanya terjadi saat ada 100+ produk di satu kategori"
  Developer: "Aku harus buat 100 produk manual dulu baru bisa reproduce..."


DENGAN SEEDER YANG BAIK:
────────────────────────────────────────────────────────────────
✅ Developer baru bisa langsung kerja dengan: npx prisma db seed
✅ Database di-reset dan langsung isi otomatis dengan data realistis
✅ Data yang konsisten di semua mesin developer
✅ QA bisa test dengan berbagai kondisi data tanpa input manual
✅ Bug mudah di-reproduce karena state database bisa direplikasi
```

---

## ⚙️ 8.2 Konfigurasi Seeder

```json
// package.json — Daftarkan file seeder
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
    // Memberitahu Prisma CLI di mana file seeder berada
    // Dipakai oleh: npx prisma db seed
    // Juga dipanggil otomatis oleh: npx prisma migrate reset
  }
}
```

```bash
# Cara menjalankan seeder:

# Via Prisma CLI (recommended):
npx prisma db seed

# Via npm script:
npm run db:seed

# Reset + migrate + seed sekaligus:
npx prisma migrate reset
# ↑ Akan tanya konfirmasi, lalu otomatis jalankan seed

# Reset tanpa seed:
npx prisma migrate reset --skip-seed
```

---

## 🏗️ 8.3 Anatomi Seeder yang Baik

```typescript
// prisma/seed.ts — Template lengkap

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Helper functions ────────────────────────────────────────────────

// Jeda eksekusi — berguna untuk rate limiting atau testing
const tunggu = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Log dengan format yang konsisten
function log(pesan: string) {
  console.log(`  ${pesan}`)
}

// ─── Fungsi seeding per domain ───────────────────────────────────────
// Pisahkan per domain agar mudah di-maintain dan bisa dijalankan terpisah

async function seedKategori() { /* ... */ }
async function seedTag()      { /* ... */ }
async function seedPengguna() { /* ... */ }
async function seedProduk()   { /* ... */ }
async function seedPesanan()  { /* ... */ }

// ─── Main function ───────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Memulai seeding database...')
  console.log('═'.repeat(50))

  // Jalankan per domain — urutan penting karena relasi!
  const kategori  = await seedKategori()
  const tags      = await seedTag()
  const pengguna  = await seedPengguna()
  const produk    = await seedProduk(kategori, tags)
  await seedPesanan(pengguna, produk)

  // Tampilkan ringkasan
  console.log('\n' + '═'.repeat(50))
  console.log('📊 Ringkasan:')
  console.log(`  👥 Pengguna : ${await prisma.pengguna.count()}`)
  console.log(`  📂 Kategori : ${await prisma.kategori.count()}`)
  console.log(`  📦 Produk   : ${await prisma.produk.count()}`)
  console.log(`  🏷️  Tag      : ${await prisma.tag.count()}`)
  console.log(`  🛒 Pesanan  : ${await prisma.pesanan.count()}`)
  console.log('═'.repeat(50))
  console.log('✅ Seeding berhasil!\n')
}

main()
  .catch(e => {
    console.error('\n❌ Seeding gagal!')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## 📝 8.4 Seeder Lengkap dengan Data Realistis

```typescript
// prisma/seed.ts — Implementasi lengkap untuk e-commerce

import { PrismaClient, RolePengguna, StatusPesanan } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────────────
// ① SEED KATEGORI
// ─────────────────────────────────────────────────────────────────────
async function seedKategori() {
  console.log('\n📂 Membuat kategori...')

  // upsert: buat jika belum ada, update jika sudah ada
  // Ini membuat seeder IDEMPOTENT — aman dijalankan berkali-kali
  const dataKategori = [
    {
      nama:      'Elektronik',
      slug:      'elektronik',
      deskripsi: 'Gadget, laptop, smartphone, dan perangkat elektronik lainnya',
      warna:     '#3B82F6',  // Biru
    },
    {
      nama:      'Fashion',
      slug:      'fashion',
      deskripsi: 'Pakaian, sepatu, aksesoris, dan busana terkini',
      warna:     '#EC4899',  // Pink
    },
    {
      nama:      'Olahraga',
      slug:      'olahraga',
      deskripsi: 'Perlengkapan olahraga dan kebugaran',
      warna:     '#10B981',  // Hijau
    },
    {
      nama:      'Rumah & Dapur',
      slug:      'rumah-dapur',
      deskripsi: 'Peralatan rumah tangga dan perlengkapan dapur',
      warna:     '#F59E0B',  // Kuning
    },
    {
      nama:      'Buku & Pendidikan',
      slug:      'buku-pendidikan',
      deskripsi: 'Buku, alat tulis, dan materi pendidikan',
      warna:     '#8B5CF6',  // Ungu
    },
  ]

  const kategoriDibuat = await Promise.all(
    dataKategori.map(data =>
      prisma.kategori.upsert({
        where:  { slug: data.slug },
        update: data,   // Update jika sudah ada
        create: data,   // Buat jika belum ada
      })
    )
  )

  kategoriDibuat.forEach(k => console.log(`  ✅ ${k.nama}`))
  return kategoriDibuat
}

// ─────────────────────────────────────────────────────────────────────
// ② SEED TAG
// ─────────────────────────────────────────────────────────────────────
async function seedTag() {
  console.log('\n🏷️  Membuat tag...')

  const dataTag = [
    { nama: 'gaming',       slug: 'gaming',       warna: '#EF4444' },
    { nama: 'best-seller',  slug: 'best-seller',  warna: '#F59E0B' },
    { nama: 'new-arrival',  slug: 'new-arrival',  warna: '#10B981' },
    { nama: 'sale',         slug: 'sale',          warna: '#EC4899' },
    { nama: 'wireless',     slug: 'wireless',      warna: '#3B82F6' },
    { nama: 'premium',      slug: 'premium',       warna: '#8B5CF6' },
    { nama: 'limited',      slug: 'limited',       warna: '#6B7280' },
    { nama: 'eco-friendly', slug: 'eco-friendly',  warna: '#059669' },
  ]

  const tagDibuat = await Promise.all(
    dataTag.map(data =>
      prisma.tag.upsert({
        where:  { slug: data.slug },
        update: data,
        create: data,
      })
    )
  )

  console.log(`  ✅ ${tagDibuat.length} tag dibuat`)
  return tagDibuat
}

// ─────────────────────────────────────────────────────────────────────
// ③ SEED PENGGUNA
// ─────────────────────────────────────────────────────────────────────
async function seedPengguna() {
  console.log('\n👥 Membuat pengguna...')

  const dataPengguna = [
    {
      email:    'admin@toko.id',
      nama:     'Super Admin',
      password: 'Admin@123',
      role:     RolePengguna.ADMIN,
      bio:      'Administrator utama sistem toko online',
    },
    {
      email:    'manajer@toko.id',
      nama:     'Budi Manajer',
      password: 'Manajer@123',
      role:     RolePengguna.MANAJER,
      bio:      'Manajer operasional toko',
    },
    {
      email:    'editor@toko.id',
      nama:     'Siti Editor',
      password: 'Editor@123',
      role:     RolePengguna.EDITOR,
      bio:      'Editor konten produk',
    },
    {
      email:    'pembeli1@email.com',
      nama:     'Andi Pembeli',
      password: 'Pembeli@123',
      role:     RolePengguna.PEMBELI,
      bio:      'Pelanggan setia',
    },
    {
      email:    'pembeli2@email.com',
      nama:     'Dewi Susanti',
      password: 'Pembeli@123',
      role:     RolePengguna.PEMBELI,
      bio:      '',
    },
  ]

  const penggunaDibuat = []

  for (const data of dataPengguna) {
    const { bio, ...userData } = data

    const pengguna = await prisma.pengguna.upsert({
      where:  { email: data.email },
      update: { nama: data.nama, role: data.role },
      create: {
        ...userData,
        password: await bcrypt.hash(data.password, 12),
        // Buat profil sekaligus
        profil: {
          create: { bio: bio || null }
        }
      },
      include: { profil: true }
    })

    penggunaDibuat.push(pengguna)
    console.log(`  ✅ ${pengguna.nama} (${pengguna.role})`)
  }

  return penggunaDibuat
}

// ─────────────────────────────────────────────────────────────────────
// ④ SEED PRODUK
// ─────────────────────────────────────────────────────────────────────
async function seedProduk(
  kategori: Awaited<ReturnType<typeof seedKategori>>,
  tags:     Awaited<ReturnType<typeof seedTag>>
) {
  console.log('\n📦 Membuat produk...')

  // Helper untuk cari kategori dan tag by slug
  const getKategori = (slug: string) => kategori.find(k => k.slug === slug)!
  const getTag      = (slug: string) => tags.find(t => t.slug === slug)!

  const dataProduk = [
    // ─── Elektronik ─────────────────────────────────────────────────
    {
      nama:       'Laptop ASUS ROG Zephyrus G14',
      slug:       'laptop-asus-rog-zephyrus-g14',
      deskripsi:  'Laptop gaming flagship dengan AMD Ryzen 9 dan GPU RTX 4090. Performa tinggi dalam bodi tipis 14 inci.',
      harga:      27500000,
      stok:       5,
      kategoriSlug: 'elektronik',
      tagSlug:    ['gaming', 'premium', 'best-seller'],
    },
    {
      nama:       'MacBook Air M3 13 inci',
      slug:       'macbook-air-m3-13-inci',
      deskripsi:  'Laptop terbaik Apple dengan chip M3. Ringan, tipis, dan baterai tahan seharian.',
      harga:      22000000,
      stok:       8,
      kategoriSlug: 'elektronik',
      tagSlug:    ['premium', 'new-arrival'],
    },
    {
      nama:       'Mouse Logitech MX Master 3S',
      slug:       'mouse-logitech-mx-master-3s',
      deskripsi:  'Mouse produktivitas premium dengan MagSpeed scroll dan tombol yang bisa dikustomisasi.',
      harga:      1350000,
      stok:       30,
      kategoriSlug: 'elektronik',
      tagSlug:    ['wireless', 'best-seller'],
    },
    {
      nama:       'Headphone Sony WH-1000XM5',
      slug:       'headphone-sony-wh1000xm5',
      deskripsi:  'Headphone noise cancelling terbaik di kelasnya. Suara jernih, nyaman dipakai seharian.',
      harga:      4800000,
      stok:       15,
      kategoriSlug: 'elektronik',
      tagSlug:    ['wireless', 'premium'],
    },
    {
      nama:       'Mechanical Keyboard Keychron K2 Pro',
      slug:       'mechanical-keyboard-keychron-k2-pro',
      deskripsi:  'Keyboard mekanikal compact 75% dengan switch Gateron dan backlight RGB.',
      harga:      1200000,
      stok:       20,
      kategoriSlug: 'elektronik',
      tagSlug:    ['wireless', 'gaming'],
    },

    // ─── Fashion ────────────────────────────────────────────────────
    {
      nama:       'Kemeja Batik Premium Pria',
      slug:       'kemeja-batik-premium-pria',
      deskripsi:  'Kemeja batik motif parang dengan bahan katun premium. Cocok untuk acara formal maupun semi-formal.',
      harga:      285000,
      stok:       50,
      kategoriSlug: 'fashion',
      tagSlug:    ['premium', 'best-seller'],
    },
    {
      nama:       'Sneakers Nike Air Max 270',
      slug:       'sneakers-nike-air-max-270',
      deskripsi:  'Sepatu sneakers Nike dengan teknologi Air Max untuk kenyamanan maksimal. Tersedia berbagai pilihan warna.',
      harga:      1850000,
      stok:       25,
      kategoriSlug: 'fashion',
      tagSlug:    ['best-seller', 'new-arrival'],
    },

    // ─── Olahraga ───────────────────────────────────────────────────
    {
      nama:       'Raket Badminton Yonex Astrox 88D',
      slug:       'raket-badminton-yonex-astrox-88d',
      deskripsi:  'Raket badminton seri Astrox 88D untuk pemain dominan. Cocok untuk pemain tingkat menengah hingga profesional.',
      harga:      2250000,
      stok:       12,
      kategoriSlug: 'olahraga',
      tagSlug:    ['premium', 'limited'],
    },
    {
      nama:       'Matras Yoga Anti-Slip 6mm',
      slug:       'matras-yoga-anti-slip-6mm',
      deskripsi:  'Matras yoga tebal 6mm dengan permukaan anti-slip. Material ramah lingkungan dan mudah dibersihkan.',
      harga:      185000,
      stok:       40,
      kategoriSlug: 'olahraga',
      tagSlug:    ['eco-friendly', 'sale'],
    },

    // ─── Rumah & Dapur ──────────────────────────────────────────────
    {
      nama:       'Rice Cooker Philips HD3132',
      slug:       'rice-cooker-philips-hd3132',
      deskripsi:  'Rice cooker kapasitas 1.8L dengan teknologi Fuzzy Logic. Bisa masak berbagai jenis nasi dan menu lainnya.',
      harga:      550000,
      stok:       18,
      kategoriSlug: 'rumah-dapur',
      tagSlug:    ['best-seller'],
    },
  ]

  const produkDibuat = []

  for (const data of dataProduk) {
    const { kategoriSlug, tagSlug, ...produkData } = data

    const produk = await prisma.produk.upsert({
      where:  { slug: data.slug },
      update: {
        nama:  produkData.nama,
        harga: produkData.harga,
        stok:  produkData.stok,
      },
      create: {
        ...produkData,
        kategori: { connect: { slug: kategoriSlug } },
        tags: {
          connect: tagSlug.map(slug => ({ slug }))
        },
      },
      include: {
        kategori: true,
        tags:     true,
      }
    })

    produkDibuat.push(produk)
    console.log(`  ✅ ${produk.nama} — Rp ${Number(produk.harga).toLocaleString('id-ID')}`)
  }

  return produkDibuat
}

// ─────────────────────────────────────────────────────────────────────
// ⑤ SEED PESANAN — Data transaksi contoh
// ─────────────────────────────────────────────────────────────────────
async function seedPesanan(
  pengguna: Awaited<ReturnType<typeof seedPengguna>>,
  produk:   Awaited<ReturnType<typeof seedProduk>>
) {
  console.log('\n🛒 Membuat pesanan contoh...')

  // Cari pengguna pembeli
  const pembeli1 = pengguna.find(p => p.email === 'pembeli1@email.com')!
  const pembeli2 = pengguna.find(p => p.email === 'pembeli2@email.com')!

  // Cari produk berdasarkan slug
  const laptop   = produk.find(p => p.slug === 'laptop-asus-rog-zephyrus-g14')!
  const mouse    = produk.find(p => p.slug === 'mouse-logitech-mx-master-3s')!
  const headphone = produk.find(p => p.slug === 'headphone-sony-wh1000xm5')!
  const matras   = produk.find(p => p.slug === 'matras-yoga-anti-slip-6mm')!

  // Pesanan 1 — Selesai
  const pesanan1 = await prisma.pesanan.create({
    data: {
      status:      StatusPesanan.SELESAI,
      total:       Number(laptop.harga) + Number(mouse.harga),
      penggunaId:  pembeli1.id,
      alamatKirim: {          // Snapshot alamat — JSON
        penerima: 'Andi Pembeli',
        telepon:  '081234567890',
        jalan:    'Jl. Merdeka No. 10',
        kota:     'Jakarta Selatan',
        provinsi: 'DKI Jakarta',
        kodePos:  '12110',
      },
      items: {
        create: [
          {
            produkId:    laptop.id,
            jumlah:      1,
            hargaSatuan: laptop.harga,  // Snapshot harga saat beli
          },
          {
            produkId:    mouse.id,
            jumlah:      2,
            hargaSatuan: mouse.harga,
          },
        ]
      }
    }
  })

  // Pesanan 2 — Dalam pengiriman
  const pesanan2 = await prisma.pesanan.create({
    data: {
      status:      StatusPesanan.DIKIRIM,
      total:       Number(headphone.harga),
      penggunaId:  pembeli2.id,
      alamatKirim: {
        penerima: 'Dewi Susanti',
        telepon:  '089876543210',
        jalan:    'Jl. Gatot Subroto No. 88',
        kota:     'Bandung',
        provinsi: 'Jawa Barat',
        kodePos:  '40111',
      },
      items: {
        create: [{
          produkId:    headphone.id,
          jumlah:      1,
          hargaSatuan: headphone.harga,
        }]
      }
    }
  })

  // Pesanan 3 — Menunggu pembayaran
  const pesanan3 = await prisma.pesanan.create({
    data: {
      status:      StatusPesanan.MENUNGGU_PEMBAYARAN,
      total:       Number(matras.harga) * 2,
      penggunaId:  pembeli1.id,
      alamatKirim: {
        penerima: 'Andi Pembeli',
        telepon:  '081234567890',
        jalan:    'Jl. Merdeka No. 10',
        kota:     'Jakarta Selatan',
        provinsi: 'DKI Jakarta',
        kodePos:  '12110',
      },
      items: {
        create: [{
          produkId:    matras.id,
          jumlah:      2,
          hargaSatuan: matras.harga,
        }]
      }
    }
  })

  console.log(`  ✅ Pesanan ${pesanan1.kodePesanan} — ${pesanan1.status}`)
  console.log(`  ✅ Pesanan ${pesanan2.kodePesanan} — ${pesanan2.status}`)
  console.log(`  ✅ Pesanan ${pesanan3.kodePesanan} — ${pesanan3.status}`)
}

// ─────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Memulai seeding database...')
  console.log('═'.repeat(55))

  const kategori = await seedKategori()
  const tags     = await seedTag()
  const pengguna = await seedPengguna()
  const produk   = await seedProduk(kategori, tags)
  await seedPesanan(pengguna, produk)

  console.log('\n' + '═'.repeat(55))
  console.log('📊 Ringkasan Database:')
  console.log(`  👥 Pengguna : ${await prisma.pengguna.count()} akun`)
  console.log(`  📂 Kategori : ${await prisma.kategori.count()} kategori`)
  console.log(`  📦 Produk   : ${await prisma.produk.count()} produk`)
  console.log(`  🏷️  Tag      : ${await prisma.tag.count()} tag`)
  console.log(`  🛒 Pesanan  : ${await prisma.pesanan.count()} pesanan`)
  console.log('═'.repeat(55))
  console.log('✅ Seeding berhasil!\n')

  console.log('🔑 Akun yang tersedia:')
  console.log('─'.repeat(45))
  console.log('  Admin  : admin@toko.id        Admin@123')
  console.log('  Manajer: manajer@toko.id      Manajer@123')
  console.log('  Editor : editor@toko.id       Editor@123')
  console.log('  Pembeli: pembeli1@email.com   Pembeli@123')
  console.log('  Pembeli: pembeli2@email.com   Pembeli@123')
  console.log('─'.repeat(45) + '\n')
}

main()
  .catch(e => {
    console.error('\n❌ Seeding gagal:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## 🧪 8.5 Seeder untuk Testing — Data yang Konsisten

```typescript
// prisma/seed-test.ts — Seeder khusus untuk environment testing
// Data minimal yang cukup untuk semua test cases

import { PrismaClient } from '@prisma/client'
import bcrypt           from 'bcryptjs'

const prisma = new PrismaClient()

export async function resetDanSeedTestData() {
  // Hapus semua data dalam urutan yang benar
  await prisma.$transaction([
    prisma.itemPesanan.deleteMany(),
    prisma.pesanan.deleteMany(),
    prisma.ulasan.deleteMany(),
    prisma.produk.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.kategori.deleteMany(),
    prisma.profil.deleteMany(),
    prisma.pengguna.deleteMany(),
  ])

  // Buat data minimal untuk testing
  const hashedPassword = await bcrypt.hash('password123', 10)
  // Cost factor 10 (bukan 12) untuk testing agar lebih cepat

  const [admin, pembeli, kategori, tag] = await prisma.$transaction([
    prisma.pengguna.create({
      data: {
        email: 'admin@test.com', nama: 'Test Admin',
        password: hashedPassword, role: 'ADMIN'
      }
    }),
    prisma.pengguna.create({
      data: {
        email: 'pembeli@test.com', nama: 'Test Pembeli',
        password: hashedPassword, role: 'PEMBELI'
      }
    }),
    prisma.kategori.create({
      data: { nama: 'Test Kategori', slug: 'test-kategori' }
    }),
    prisma.tag.create({
      data: { nama: 'test', slug: 'test' }
    }),
  ])

  const produk = await prisma.produk.create({
    data: {
      nama:       'Produk Test',
      slug:       'produk-test',
      harga:      100000,
      stok:       10,
      kategoriId: kategori.id,
      tags:       { connect: [{ id: tag.id }] }
    }
  })

  return { admin, pembeli, kategori, tag, produk }
}

// Contoh penggunaan di test file (Jest / Vitest):
// beforeEach(async () => {
//   testData = await resetDanSeedTestData()
// })
```

---

## 🔧 8.6 Factory Functions — Data Dummy yang Fleksibel

```typescript
// prisma/factories.ts — Generate data dummy dengan variasi

import { prisma }  from '../src/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// Counter untuk memastikan nilai unik
let counter = 0
const unik  = () => ++counter

// ─── Factory Pengguna ─────────────────────────────────────────────
interface OpsiPengguna {
  email?:    string
  nama?:     string
  role?:     'ADMIN' | 'MANAJER' | 'EDITOR' | 'PEMBELI'
  password?: string
}

export async function buatPengguna(opsi: OpsiPengguna = {}) {
  const n = unik()
  return prisma.pengguna.create({
    data: {
      email:    opsi.email    ?? `pengguna${n}@test.com`,
      nama:     opsi.nama     ?? `Pengguna Test ${n}`,
      password: opsi.password ?? 'password-yang-sudah-di-hash',
      role:     opsi.role     ?? 'PEMBELI',
    }
  })
}

// ─── Factory Produk ───────────────────────────────────────────────
interface OpsiProduk {
  nama?:       string
  harga?:      number
  stok?:       number
  aktif?:      boolean
  kategoriId?: number
}

export async function buatProduk(opsi: OpsiProduk = {}) {
  const n = unik()

  // Jika kategoriId tidak disediakan, buat kategori baru
  let kategoriId = opsi.kategoriId
  if (!kategoriId) {
    const kategori = await prisma.kategori.create({
      data: { nama: `Kategori ${n}`, slug: `kategori-${n}` }
    })
    kategoriId = kategori.id
  }

  return prisma.produk.create({
    data: {
      nama:       opsi.nama   ?? `Produk Test ${n}`,
      slug:       `produk-test-${n}`,
      harga:      opsi.harga  ?? 100000,
      stok:       opsi.stok   ?? 10,
      aktif:      opsi.aktif  ?? true,
      kategoriId,
    }
  })
}

// ─── Factory Pesanan ──────────────────────────────────────────────
export async function buatPesanan(penggunaId: number, produkId: number, harga: number) {
  return prisma.pesanan.create({
    data: {
      penggunaId,
      total:       harga,
      alamatKirim: {
        penerima: 'Test Penerima',
        telepon:  '081234567890',
        jalan:    'Jl. Test No. 1',
        kota:     'Kota Test',
        provinsi: 'Provinsi Test',
        kodePos:  '00000',
      },
      items: {
        create: [{
          produkId,
          jumlah:      1,
          hargaSatuan: harga,
        }]
      }
    }
  })
}

// Penggunaan factory di test:
// const pengguna1 = await buatPengguna({ role: 'ADMIN' })
// const pengguna2 = await buatPengguna()  // Auto-generate email unik
// const produk    = await buatProduk({ harga: 500000, stok: 5 })
// const pesanan   = await buatPesanan(pengguna2.id, produk.id, 500000)
```

---

## ✅ Checklist Bab 8

```
□ File seeder sudah dikonfigurasi di package.json (scripts + prisma.seed)
□ Seeder menggunakan upsert (bukan create) agar idempotent
□ Seeder membersihkan/mereset data sebelum insert jika diperlukan
□ Urutan seed sudah benar (parent sebelum child — kategori sebelum produk)
□ Seeder menampilkan ringkasan di akhir (jumlah record yang dibuat)
□ Akun login yang dibuat sudah tercantum di output seeder
□ npx prisma db seed berhasil dijalankan tanpa error
□ Seeder bisa dijalankan berkali-kali tanpa error (idempotent)
□ Ada seeder terpisah untuk testing jika diperlukan
```

---

## 📊 Ringkasan Bagian III

```
YANG SUDAH DIPELAJARI DI BAGIAN III:

Bab 7 — Prisma Migrate: Dasar
├── Mengapa migration itu penting (masalah tanpa migration)
├── Perbedaan db push vs migrate dev — kapan pakai masing-masing
├── Anatomi folder migrations/ dan isi migration.sql
├── Alur kerja migration sehari-hari (edit → migrate → commit)
├── Penamaan migration yang baik dan deskriptif
├── Skenario migration umum:
│   ├── Tambah field baru (aman)
│   ├── Ubah tipe data (berbahaya, cara bertahap)
│   ├── Tambah index (aman)
│   ├── Tambah relasi baru
│   └── Tambah soft delete
├── Melihat status migration (migrate status)
├── Reset migration untuk development (migrate reset — berbahaya!)
├── Deploy migration ke production (migrate deploy)
├── Integrasi CI/CD dengan GitHub Actions
└── Troubleshooting masalah migration umum

Bab 8 — Seeder & Data Awal
├── Mengapa seeder penting (untuk developer, QA, dan bug reproduction)
├── Konfigurasi seeder di package.json
├── Anatomi seeder yang baik (fungsi terpisah per domain)
├── Seeder lengkap e-commerce:
│   ├── Seed kategori dengan warna
│   ├── Seed tag
│   ├── Seed pengguna dengan bcrypt password
│   ├── Seed produk dengan relasi kategori dan tag
│   └── Seed pesanan dengan item pesanan dan snapshot harga
├── Seeder untuk testing (data minimal, cost bcrypt lebih rendah)
└── Factory functions untuk generate data dummy yang fleksibel
```

> 📌 **Selanjutnya — Bagian IV:** Schema sudah didefinisikan, migration sudah berjalan, data awal sudah ada. Sekarang waktunya belajar **Prisma Client** secara mendalam — semua operasi CRUD dari yang paling dasar hingga teknik yang menghemat banyak waktu.

---

🚀 Lanjut ke [✏️ Bab 9 — CREATE — Membuat Data](/bagian-4/bab-9) untuk melanjutkan perjalanan!
