---
title: "Bab 20 — Backup, Restore & Migrasi"
---

# 💾 Bab 20 — Backup, Restore & Migrasi

> 🎯 **Tujuan Bab:** membuat backup yang benar-benar bisa dipulihkan, mengelola perubahan skema, dan menyiapkan operasional database yang aman.

## 20.1 📦 Logical Backup dengan `mysqldump`

```bash
mysqldump -u root -p \
  --single-transaction \
  --routines --triggers --events \
  toko > toko_backup.sql
```

| Opsi | Fungsi |
|---|---|
| `--single-transaction` | Konsisten untuk InnoDB tanpa mengunci tabel |
| `--routines` | Ikut menyimpan procedure/function |
| `--triggers` | Ikut menyimpan trigger |
| `--events` | Ikut menyimpan event |

Restore:

```bash
mysql -u root -p toko < toko_backup.sql
```

> ⚠️ Backup belum selesai sampai Anda membuktikan restore berhasil.

## 20.2 🗄️ Logical vs Physical Backup

| Jenis | Kelebihan | Kekurangan |
|---|---|---|
| **Logical** (`mysqldump`) | Mudah dibaca, portabel | Lambat untuk data besar |
| **Physical** (file data) | Cepat untuk data besar | Terikat versi dan platform |

Untuk database kecil-menengah, logical backup sering cukup. Untuk data besar, pertimbangkan physical backup atau tool khusus.

## 20.3 📅 Strategi Backup

| Aspek | Pertanyaan |
|---|---|
| **Jadwal** | Seberapa sering data berubah? |
| **Retensi** | Berapa lama backup disimpan? |
| **Lokasi** | Disimpan di server yang sama? (berisiko) |
| **Enkripsi** | Apakah backup aman jika bocor? |
| **Uji restore** | Kapan terakhir kali diuji? |

Pola umum:

- backup harian penuh;
- backup incremental jika didukung;
- simpan salinan di lokasi berbeda;
- uji restore otomatis ke database sementara.

## 20.4 📤 Import & Export CSV

Export:

```sql
SELECT id, nama, email
FROM users
INTO OUTFILE '/tmp/users.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

Import:

```sql
LOAD DATA INFILE '/tmp/users.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id, nama, email);
```

Batasan:

- `secure_file_priv` membatasi direktori;
- format harus cocok;
- validasi data setelah import.

## 20.5 🔄 Migrasi Skema

Migration adalah perubahan skema yang tercatat dan bisa diulang.

Alur yang aman:

1. Buat file migration.
2. Uji di database lokal.
3. Uji di staging dengan salinan data.
4. Backup sebelum deploy.
5. Jalankan migration.
6. Verifikasi aplikasi.

Contoh perubahan berisiko:

```sql
ALTER TABLE orders
  ADD COLUMN catatan TEXT NULL;
```

Menambah kolom `NULL` relatif aman. Menghapus kolom atau mengubah tipe data bisa merusak data dan memerlukan rencana khusus.

> 💡 Untuk tabel besar, `ALTER TABLE` bisa mengunci dan memakan waktu. Pertimbangkan strategi online schema change atau jendela maintenance.

## 20.6 🔁 Replication (Pengenalan)

Replication menyalin data dari server **primary** ke **replica**.

Kegunaan:

- read scaling (laporan di replica);
- ketersediaan jika primary bermasalah;
- backup dari replica.

Risiko:

- lag replikasi;
- konflik data jika replica ditulis;
- kompleksitas operasional.

## 20.7 📊 Monitoring Dasar

Yang perlu dipantau:

- jumlah koneksi aktif;
- query lambat;
- ukuran database dan tabel;
- penggunaan disk;
- status replikasi;
- error log.

```sql
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Slow_queries';
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'toko';
```

## 20.8 ✅ Checklist Sebelum Deploy

- [ ] Backup terbaru tersedia dan sudah diuji
- [ ] Migration diuji di staging
- [ ] Perubahan skema kompatibel dengan versi aplikasi lama
- [ ] Index baru tidak mengunci tabel terlalu lama
- [ ] User aplikasi memiliki hak yang cukup
- [ ] Monitoring dan alert aktif
- [ ] Rencana rollback jelas

## 📌 Ringkasan

- `mysqldump` adalah alat backup logical yang praktis.
- Backup harus disimpan terpisah, terenkripsi, dan diuji restore.
- Migration mengelola perubahan skema secara terkontrol.
- Replication membantu read scaling dan ketersediaan.
- Monitoring mencegah masalah kecil menjadi insiden besar.

## 🧪 Latihan

1. Backup database `toko` dengan `mysqldump`.
2. Restore ke database `toko_restore` dan bandingkan jumlah baris.
3. Export tabel `users` ke CSV, lalu import ke tabel baru.
4. Tulis migration untuk menambah kolom `catatan` di `orders`.
5. Buat checklist deploy untuk project Anda.

::: tip 💡 Tips
Simpan backup di lokasi yang tidak bisa dihapus oleh server database. Backup yang berada di mesin yang sama akan hilang bersama database saat disk rusak.
:::
