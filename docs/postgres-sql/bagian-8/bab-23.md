---
title: "Bab 23 — Backup, Restore, Replikasi & Pemeliharaan"
---

# 💾 Bab 23 — Backup, Restore, Replikasi & Pemeliharaan

> 🎯 **Tujuan Bab:** memastikan data bisa dipulihkan, bukan sekadar “punya backup”.

## 23.1 🎯 RPO & RTO

| Istilah | Arti |
|---|---|
| **RPO** | Berapa banyak data boleh hilang |
| **RTO** | Berapa lama boleh tidak tersedia |

Contoh:

- RPO 15 menit, RTO 1 jam → butuh WAL archiving dan prosedur restore yang teruji.
- RPO 24 jam, RTO 8 jam → dump harian mungkin cukup.

Backup tanpa uji restore bukan jaminan. Jadwalkan uji restore rutin.

## 23.2 🧰 `pg_dump`

Dump satu database:

```bash
pg_dump -h localhost -U postgres -d toko -Fc -f toko.dump
```

Format:

| Format | Flag | Catatan |
|---|---|---|
| Plain SQL | default | Mudah dibaca, sulit paralel |
| Custom | `-Fc` | Fleksibel, mendukung `pg_restore` |
| Directory | `-Fd` | Paralel, banyak file |
| Tar | `-Ft` | Arsip tunggal |

Dump paralel:

```bash
pg_dump -h localhost -U postgres -d toko -Fd -j 4 -f toko_dir
```

Hanya skema:

```bash
pg_dump -d toko --schema-only -f schema.sql
```

Hanya data:

```bash
pg_dump -d toko --data-only -f data.sql
```

## 23.3 ♻️ `pg_restore`

```bash
pg_restore -h localhost -U postgres -d toko_baru --clean --if-exists -j 4 toko.dump
```

| Opsi | Fungsi |
|---|---|
| `--clean` | Hapus objek sebelum dibuat |
| `--if-exists` | Hindari error saat objek tidak ada |
| `-j` | Paralel |
| `--no-owner` | Abaikan owner asli |
| `--no-privileges` | Abaikan grant |

Untuk plain SQL:

```bash
psql -h localhost -U postgres -d toko_baru -f toko.sql
```

## 23.4 🌐 `pg_dumpall`

Untuk seluruh cluster, termasuk role dan tablespace:

```bash
pg_dumpall -U postgres -f semua.sql
```

Hanya role/global:

```bash
pg_dumpall -U postgres --globals-only -f globals.sql
```

`pg_dumpall` tidak mendukung format custom/paralel. Untuk cluster besar, kombinasikan `pg_dump` per database dengan dump global.

## 23.5 🧱 `pg_basebackup`

Backup fisik seluruh cluster:

```bash
pg_basebackup -h localhost -U repl -D /backup/base -Ft -z -P -X stream
```

| Opsi | Fungsi |
|---|---|
| `-D` | Direktori tujuan |
| `-Ft` | Format tar |
| `-z` | Kompresi |
| `-P` | Progress |
| `-X stream` | Sertakan WAL |

Backup fisik cocok untuk restore cepat dan replica.

## 23.6 🕰️ PITR

Point-in-Time Recovery memungkinkan restore ke detik tertentu.

Konsep:

1. backup fisik dasar;
2. arsipkan WAL berkelanjutan;
3. saat restore, putar ulang WAL sampai target.

Konfigurasi primary:

```ini
wal_level = replica
archive_mode = on
archive_command = 'cp %p /arsip/wal/%f'
```

Restore:

```ini
restore_command = 'cp /arsip/wal/%f %p'
recovery_target_time = '2025-02-01 10:30:00+07'
```

> ⚠️ Uji PITR di lingkungan terpisah. Kesalahan konfigurasi bisa membuat restore gagal saat dibutuhkan.

## 23.7 🔁 Replikasi Streaming

Primary:

```ini
wal_level = replica
max_wal_senders = 10
```

Replica:

```ini
primary_conninfo = 'host=10.0.0.10 port=5432 user=repl password=...'
```

Pantau:

```sql
SELECT client_addr, state, sent_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;
```

Replica read-only bisa dipakai untuk laporan. Waspadai lag dan query yang butuh data terbaru.

## 23.8 🔄 Logical Replication

Berguna untuk replikasi selektif atau antar versi.

Publisher:

```sql
CREATE PUBLICATION pub_orders FOR TABLE orders, order_items;
```

Subscriber:

```sql
CREATE SUBSCRIPTION sub_orders
CONNECTION 'host=primary dbname=toko user=repl password=...'
PUBLICATION pub_orders;
```

Logical replication tidak mereplikasi DDL. Perubahan skema harus diterapkan terpisah.

## 23.9 🧹 Pemeliharaan Rutin

| Tugas | Perintah | Frekuensi |
|---|---|---|
| Analyze | `ANALYZE` | Setelah perubahan besar |
| Vacuum | `VACUUM` | Otomatis, pantau |
| Reindex | `REINDEX` | Jika bloated/rusak |
| Cek koneksi | `pg_stat_activity` | Harian |
| Cek backup | restore test | Mingguan/bulanan |
| Cek disk | `df -h` | Harian |
| Cek lag replika | `pg_stat_replication` | Berkelanjutan |

Cek arsip WAL:

```sql
SELECT * FROM pg_stat_archiver;
```

Jika `failed_count` naik, arsip WAL bermasalah dan PITR tidak aman.

## 23.10 📦 Upgrade

Minor upgrade biasanya cukup ganti binary dan restart. Major upgrade butuh:

- `pg_upgrade`, atau
- dump/restore, atau
- logical replication.

Selalu baca catatan rilis dan uji di staging. Backup sebelum upgrade.

## 23.11 🎬 Studi Kasus: Strategi Backup

Kebutuhan:

- RPO 15 menit;
- RTO 1 jam;
- retensi 30 hari.

Strategi:

1. `pg_basebackup` harian;
2. arsip WAL berkelanjutan;
3. dump logis harian untuk tabel kritis;
4. uji restore mingguan ke server staging;
5. simpan backup di lokasi terpisah dan terenkripsi.

## 📌 Ringkasan

- Backup harus diuji restore.
- `pg_dump` untuk logis, `pg_basebackup` untuk fisik.
- PITR membutuhkan arsip WAL.
- Replikasi bukan pengganti backup.
- Pemeliharaan rutin menjaga performa dan keandalan.

## 🧪 Latihan

1. Dump database `toko` dalam format custom.
2. Restore ke database baru.
3. Jelaskan perbedaan `pg_dump` dan `pg_basebackup`.
4. Periksa status `pg_stat_archiver`.
5. Rancang strategi backup untuk RPO 15 menit.

::: tip 💡 Tips
Simpan prosedur restore langkah demi langkah. Saat insiden, Anda tidak ingin mencari-cari perintah di internet.
:::
