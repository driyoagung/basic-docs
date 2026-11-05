---
title: 24.1 - Perencanaan & Desain Database
---

# 24.1 Perencanaan & Desain Database

:::info Langkah 1 dari 15
Sebelum nulis kode, kita rancang dulu struktur data project ini.
:::

## Tabel yang Dibutuhkan

```text
users
  - id, name, email, password, avatar_path, timestamps

projects
  - id, user_id (owner), name, description, color, timestamps

project_user (pivot -- anggota project)
  - project_id, user_id, role (owner/member)

tasks
  - id, project_id, user_id (creator), assignee_id, title,
    description, status (todo/in_progress/done), priority (low/medium/high),
    due_date, order, timestamps

attachments
  - id, task_id, user_id, filename, path, size, mime_type, timestamps

comments
  - id, task_id, user_id, body, timestamps
```

## Relasi Antar Tabel

- **User** hasMany Projects, Tasks, Comments
- **Project** belongsTo User (owner), hasMany Tasks, belongsToMany Users (via `project_user`)
- **Task** belongsTo Project, User (creator), User (assignee), hasMany Attachments, Comments

## ERD Singkat

```text
+--------+       +-----------+       +-----------+
| users  |1-----*| projects  |1----*|  tasks    |
+--------+       +-----------+       +-----------+
    | 1                | M                 | 1
    |                  |                   |
    | *                | *                 | *
+-----------+   +-------------+     +-----------+     +-----------+
| comments  |*--| project_user|    | attachments|     |  (User)   |
+-----------+   +-------------+     +-----------+     +-----------+
```

## Tips Desain

:::tip Gunakan enum atau string
Pada status/priority task, gunakan string PHP enum agar lebih aman:
```php
enum TaskStatus: string { case Todo = 'todo'; ... }
```
:::

::: details Penjelasan Kode
- `enum TaskStatus: string` - mendeklarasikan backed enum bernama `TaskStatus` dengan tipe skalar `string`. Setiap nilai konstanta dipetakan ke string yang disimpan di kolom database.
- `case Todo = 'todo'` - salah satu anggota enum; nilai string `'todo'` yang akan disimpan di kolom `status` tabel tasks.
- Kelebihan enum dibanding string biasa: autocompletion di IDE, ketahanan terhadap typo, dan validasi tipe saat compile-time. Saat melakukan query, kita bisa pakai `TaskStatus::Todo->value` atau cast kolom di model `$casts = ['status' => TaskStatus::class]`.
:::

- Simpan `color` project sebagai hex string (`#3B82F6`).
- `due_date` bertipe `date` (bukan datetime) - cukup tanggal tanpa jam.
- `order` untuk fitur drag-and-drop urutan task - default `0`.
- `assignee_id` nullable - task boleh tanpa assignee.

## Selanjutnya

Setelah struktur data jelas, lanjut ke [24.2 - Setup Project & Instalasi](/bagian-6/bab-24/24-2-setup-project).