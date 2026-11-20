---
title: "Bab 20 — View, Function, Trigger & Procedure"
---

# ⚙️ Bab 20 — View, Function, Trigger & Procedure

> 🎯 **Tujuan Bab:** memindahkan logika yang tepat ke database tanpa membuat aplikasi sulit dirawat.

## 20.1 👁️ View

View adalah query tersimpan yang tampil seperti tabel.

```sql
CREATE VIEW v_ringkasan_order AS
SELECT
  o.id,
  u.nama AS pelanggan,
  o.total,
  o.status,
  o.created_at
FROM orders o
JOIN users u ON u.id = o.user_id;

SELECT * FROM v_ringkasan_order WHERE status = 'paid';
```

View berguna untuk:

- menyederhanakan query kompleks;
- membatasi kolom yang diekspos;
- menyatukan definisi laporan.

View tidak menyimpan data; query dijalankan saat view dipakai.

## 20.2 🧊 Materialized View

Materialized view menyimpan hasil secara fisik.

```sql
CREATE MATERIALIZED VIEW mv_omzet_bulanan AS
SELECT
  date_trunc('month', created_at) AS bulan,
  COUNT(*) AS jumlah_order,
  SUM(total) AS omzet
FROM orders
WHERE status IN ('paid','shipped','done')
GROUP BY 1;

SELECT * FROM mv_omzet_bulanan;
```

Refresh:

```sql
REFRESH MATERIALIZED VIEW mv_omzet_bulanan;
```

Refresh tanpa mengunci pembaca:

```sql
CREATE UNIQUE INDEX uq_mv_omzet_bulanan ON mv_omzet_bulanan (bulan);
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_omzet_bulanan;
```

`CONCURRENTLY` membutuhkan unique index. Data akan tertinggal sampai refresh berikutnya; dokumentasikan interval refresh.

## 20.3 🧮 Function

### SQL Function

```sql
CREATE FUNCTION total_belanja(p_user_id BIGINT)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(total), 0)
  FROM orders
  WHERE user_id = p_user_id
    AND status IN ('paid','shipped','done');
$$ LANGUAGE sql STABLE;
```

```sql
SELECT total_belanja(1);
```

### PL/pgSQL Function

```sql
CREATE FUNCTION tambah_stok(p_product_id BIGINT, p_jumlah INT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stok = stok + p_jumlah
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk % tidak ditemukan', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

```sql
SELECT tambah_stok(1, 10);
```

## 20.4 📤 Parameter & Return

```sql
CREATE FUNCTION cari_produk(p_keyword TEXT)
RETURNS TABLE (
  id BIGINT,
  nama TEXT,
  harga NUMERIC
) AS $$
  SELECT id, nama, harga
  FROM products
  WHERE nama ILIKE '%' || p_keyword || '%';
$$ LANGUAGE sql STABLE;
```

```sql
SELECT * FROM cari_produk('laptop');
```

Parameter `OUT`:

```sql
CREATE FUNCTION statistik_order(
  OUT jumlah BIGINT,
  OUT total NUMERIC
) AS $$
  SELECT COUNT(*), COALESCE(SUM(total), 0)
  FROM orders
  WHERE status = 'paid';
$$ LANGUAGE sql STABLE;
```

## 20.5 🏷️ Volatility

| Sifat | Arti | Contoh |
|---|---|---|
| `IMMUTABLE` | Hasil selalu sama untuk input sama | `lower()`, matematika |
| `STABLE` | Konsisten dalam satu statement | `now()`, baca tabel |
| `VOLATILE` | Bisa berubah setiap panggilan | `random()`, tulis data |

Salah menandai fungsi bisa menghasilkan index atau rencana yang salah. Fungsi yang membaca tabel bukan `IMMUTABLE`.

## 20.6 🪝 Trigger

Trigger menjalankan fungsi saat terjadi event.

```sql
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

Event yang tersedia: `BEFORE`/`AFTER`/`INSTEAD OF`, `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`.

## 20.7 🧾 Audit Trigger

```sql
CREATE TABLE audit_log (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabel      TEXT NOT NULL,
  aksi       TEXT NOT NULL,
  data_lama  JSONB,
  data_baru  JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE FUNCTION audit_perubahan() RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_log (tabel, aksi, data_lama, data_baru)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_audit
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION audit_perubahan();
```

> ⚠️ Trigger audit menambah biaya tulis. Jangan memasangnya di semua tabel tanpa alasan.

## 20.8 🧑‍💻 Procedure

Procedure dipanggil dengan `CALL` dan bisa mengelola transaksi.

```sql
CREATE PROCEDURE proses_order(p_order_id BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders SET status = 'paid' WHERE id = p_order_id;
  INSERT INTO payments (order_id, metode, jumlah, status)
  SELECT id, 'transfer', total, 'paid'
  FROM orders WHERE id = p_order_id;

  COMMIT;
END;
$$;
```

```sql
CALL proses_order(10);
```

Gunakan procedure untuk tugas administratif, bukan untuk logika bisnis yang seharusnya berada di aplikasi.

## 20.9 🔐 `SECURITY DEFINER`

Secara default fungsi berjalan dengan hak pemanggil (`SECURITY INVOKER`). `SECURITY DEFINER` menjalankannya dengan hak pemilik fungsi.

```sql
CREATE FUNCTION hapus_order(p_id BIGINT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM orders WHERE id = p_id;
$$;
```

> ⚠️ `SECURITY DEFINER` bisa menjadi celah keamanan jika `search_path` tidak dikunci. Tetapkan `search_path` secara eksplisit dan beri hak eksekusi seperlunya.

## 20.10 ⚖️ Logika di Database atau Aplikasi?

| Di database | Di aplikasi |
|---|---|
| Constraint dan integritas | Alur bisnis kompleks |
| Trigger audit sederhana | Validasi dan pesan error |
| Fungsi agregasi laporan | Orkestrasi API |
| Operasi massal | Logika yang sering berubah |

Aturan praktis: database menjaga **kebenaran data**; aplikasi mengatur **alur pengalaman pengguna**.

## 📌 Ringkasan

- View menyederhanakan query; materialized view menyimpan hasil.
- Function bisa SQL atau PL/pgSQL.
- Volatility memengaruhi planner dan index.
- Trigger cocok untuk `updated_at` dan audit.
- Procedure bisa mengelola transaksi; `SECURITY DEFINER` harus hati-hati.

## 🧪 Latihan

1. Buat view ringkasan order.
2. Buat materialized view omzet bulanan dan refresh.
3. Buat fungsi `total_belanja`.
4. Buat trigger audit untuk tabel products.
5. Jelaskan kapan memilih function vs logika aplikasi.

::: tip 💡 Tips
Logika database sangat kuat, tetapi sulit di-debug dan di-versioning jika berlebihan. Simpan DDL fungsi/trigger di migrasi dan dokumentasikan.
:::
