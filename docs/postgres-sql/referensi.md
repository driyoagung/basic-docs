---
title: "Referensi"
---

# 🔖 Referensi

Kumpulan sumber resmi dan alat bantu untuk melanjutkan belajar PostgreSQL.

## 📚 Dokumentasi Resmi

| Sumber | Link |
|---|---|
| PostgreSQL Documentation | https://www.postgresql.org/docs/ |
| PostgreSQL 16 Documentation | https://www.postgresql.org/docs/16/ |
| PostgreSQL 17 Documentation | https://www.postgresql.org/docs/17/ |
| PostgreSQL Wiki | https://wiki.postgresql.org/ |
| PostgreSQL Docker Image | https://hub.docker.com/_/postgres |
| psql Documentation | https://www.postgresql.org/docs/current/app-psql.html |
| SQL Commands Reference | https://www.postgresql.org/docs/current/sql-commands.html |
| PostgreSQL Error Codes | https://www.postgresql.org/docs/current/errcodes-appendix.html |

## 🛠️ Alat Bantu

| Tool | Kegunaan |
|---|---|
| **pgAdmin** | GUI resmi PostgreSQL |
| **DBeaver** | GUI database gratis dan lintas platform |
| **TablePlus** | GUI ringan untuk PostgreSQL/MySQL |
| **psql** | Client CLI resmi |
| **PgBouncer** | Connection pooling |
| **pgloader** | Migrasi MySQL → PostgreSQL |
| **pgBackRest** | Backup dan PITR |
| **pgBench** | Benchmark bawaan PostgreSQL |
| **dbdiagram.io** | Menggambar ERD secara online |

## 🧩 Extension & Ekosistem

| Extension | Link |
|---|---|
| PostGIS | https://postgis.net/documentation/ |
| pgvector | https://github.com/pgvector/pgvector |
| pg_trgm | https://www.postgresql.org/docs/current/pgtrgm.html |
| pg_stat_statements | https://www.postgresql.org/docs/current/pgstatstatements.html |
| postgres_fdw | https://www.postgresql.org/docs/current/postgres-fdw.html |

## 📖 Bacaan Lanjutan

| Topik | Sumber |
|---|---|
| Index & performa | https://use-the-index-luke.com/ |
| Latihan SQL interaktif | https://pgexercises.com/ |
| Latihan SQL dasar | https://sqlbolt.com/ |
| Latihan query | https://leetcode.com/problemset/database/ |
| PostgreSQL internals | https://postgrespro.com/community/books/internals |
| The Art of PostgreSQL | https://theartofpostgresql.com/ |
| Laravel database | https://laravel.com/docs/database |
| Prisma ORM | https://www.prisma.io/docs |

## 🧠 Topik yang Layak Dipelajari Setelah Ebook Ini

- **Replikasi & high availability** — streaming replication, failover, lag.
- **PITR & backup strategi** — WAL archiving, pgBackRest, uji restore.
- **Partisi & data lifecycle** — retensi, arsip, dan partisi otomatis.
- **Query tuning lanjutan** — statistik, `EXPLAIN` mendalam, `pg_stat_statements`.
- **Keamanan database** — RLS, enkripsi at-rest, audit, secret management.
- **Data engineering** — ETL, warehouse, dan analitik.
- **Ekstensi modern** — PostGIS, pgvector, TimescaleDB.
- **Operasi produksi** — monitoring, connection pooling, upgrade major.

::: tip 💡 Tips
Saat membaca dokumentasi resmi, biasakan langsung mencoba contohnya di database latihan. Membaca tanpa mengetik jauh lebih cepat lupa.
:::
