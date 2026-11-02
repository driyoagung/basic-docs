---
layout: home

hero:
  name: "Ebook Prisma ORM"
  text: "From Raw SQL to Type-Safe Database"
  tagline: "Panduan lengkap Prisma ORM dalam Bahasa Indonesia — dari raw SQL yang Anda tahu menuju Prisma yang type-safe, ekspresif, dan modern. TypeScript · MySQL · PostgreSQL · Next.js."
  actions:
    - theme: brand
      text: 🚀 Mulai Belajar
      link: /bagian-1/bab-1
    - theme: alt
      text: 📚 Lihat Daftar Bab
      link: /bagian-1/index
    - theme: alt
      text: 🏠 Langsung ke Project
      link: /bagian-8/bab-21

features:
  - icon: 🔄
    title: Raw SQL vs Prisma
    details: Setiap konsep dibandingkan langsung dengan raw SQL yang sudah Anda tahu — bukan diulang dari nol. Lihat sendiri di mana Prisma lebih aman dan ekspresif.
  - icon: 🟢
    title: Fondasi yang Kuat
    details: Setup lengkap dari nol — Prisma CLI, schema.prisma, Prisma Client, koneksi database, migration pertama, hingga Prisma Studio.
  - icon: 🔵
    title: Schema & Relasi
    details: Data model, semua field types, primary key, relasi one-to-one / one-to-many / many-to-many, self-relation, hingga referential actions.
  - icon: 🟠
    title: CRUD Mastery
    details: create, findMany, aggregate, update dengan atomic operations, delete, soft delete, dan cascade delete — dibandingkan dengan raw SQL di setiap langkah.
  - icon: 🔴
    title: Query Lanjutan
    details: Semua operator where, AND/OR/NOT, pagination, select & include, nested relasi, transactions, dan raw query untuk kasus-kasus khusus.
  - icon: 🇮🇩
    title: 100% Bahasa Indonesia
    details: Semua penjelasan menggunakan Bahasa Indonesia yang santai dan mudah dipahami, dengan analogi dan studi kasus yang relevan.

---

## 🎯 Untuk Siapa Ebook Ini?

Ebook ini untuk Anda yang sudah terbiasa menulis SQL mentah seperti `SELECT * FROM users WHERE id = ?` dan ingin beralih ke cara yang lebih **aman, ekspresif, dan modern** menggunakan Prisma ORM. Tidak ada yang diulang dari nol — kita langsung bandingkan cara lama (raw SQL) dengan cara baru (Prisma) di setiap topik.

> 🔄 **Raw SQL vs Prisma — Gambaran Awal**
>
> ```typescript
> // ❌ Raw SQL — yang sudah Anda tahu
> const [rows] = await pool.query(
>   'SELECT u.*, p.bio FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = ?',
>   [userId]
> )
> // rows tidak punya tipe — bisa salah akses kapan saja!
>
> // ✅ Prisma — cara baru
> const user = await prisma.user.findUnique({
>   where:   { id: userId },
>   include: { profile: true },
> })
> // user.email → autocomplete & type-safe!
> // user.emial → ERROR saat compile! Typo langsung ketahuan.
> ```

## 🗺️ Peta Perjalanan Belajar

```
🟢 BAGIAN I    Mengenal Prisma & Setup              → Bab 1  – 3
🔵 BAGIAN II   Prisma Schema — Jantung Prisma       → Bab 4  – 6
🟡 BAGIAN III  Prisma Migrate — Version Control DB  → Bab 7  – 8
🟠 BAGIAN IV   Prisma Client — CRUD & Query         → Bab 9  – 12
🔴 BAGIAN V    Query Lanjutan & Relasi              → Bab 13 – 15
🟣 BAGIAN VI   Prisma Lanjutan                      → Bab 16 – 18
⚫ BAGIAN VII  Performa & Best Practices            → Bab 19 – 20
🏆 BAGIAN VIII Project: API dengan Next.js + Prisma → Bab 21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 8 Bagian | 21 Bab | Raw SQL → Type-Safe ORM
```

## 🧰 Tech Stack yang Digunakan

| Tool              | Versions | Deskripsi                                |
| ----------------- | -------- | ---------------------------------------- |
| **Prisma**        | 5.x      | ORM utama                                |
| **TypeScript**    | 5.x      | Type safety                              |
| **MySQL**         | 8.x      | Database utama                           |
| **PostgreSQL**    | 16.x     | Database perbandingan                    |
| **Node.js**       | ≥ 18     | Runtime                                  |
| **Prisma Studio** | Built-in | GUI database                             |
| **tsx**           | Latest   | Jalankan TypeScript langsung             |

## ⭐ Bab Paling Kritis — Jangan Sampai Dilewati!

> ⚠️ **Catatan Penting:** Empat bab berikut adalah **fondasi segalanya**. Jika Anda merasa bingung di bab-bab selanjutnya, kemungkinan besar jawabannya ada di salah satu dari empat bab ini.

| Prioritas | Bab                                          | Alasan Kritis                                                                     |
| --------- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| 🥇        | **Bab 4** — Data Model & Field Types         | Schema adalah kontrak seluruh aplikasi — salah di sini berdampak ke mana-mana.     |
| 🥈        | **Bab 5** — Relasi Antar Model               | Relasi yang salah = query yang salah & data yang corrupt.                          |
| 🥉        | **Bab 9** — CREATE (CRUD Dasar)              | Fondasi semua operasi database — wajib dikuasai sebelum query lanjutan.            |
| 🏅        | **Bab 13** — Filtering & Operator Lengkap    | Di sinilah kekuatan Prisma sesungguhnya dibandingkan raw SQL.                     |

---

## 💡 Cara Membaca Ebook Ini

::: tip 💡 Tips
- Mulai dari **Bab 1** jika Anda baru pertama kali menyentuh ORM
- Gunakan **peta perjalanan** di atas jika Anda sudah menggunakan raw SQL sehari-hari
- Perhatikan **emoji** pada judul — 🚨 berarti bahaya, 💡 berarti tips penting
- Bandingkan **Raw SQL vs Prisma** di setiap topik — ini inti dari ebook ini
:::

::: warning ⚠️ Kapan TIDAK Menggunakan Prisma?
Prisma bukan untuk semua kasus. Ebook ini juga membahas **kapan sebaiknya tetap pakai raw query atau ORM lain** — sehingga Anda pilih tool secara terarah, bukan karena ikut-ikutan.
:::
