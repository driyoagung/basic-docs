---
title: 24.3 - Database Migration & Model
---

# 24.3 Database: Migration & Model

:::info Langkah 3 dari 15
Buat semua migration & model sesuai rancangan 24.1, lengkap dengan relasi Eloquent.
:::

## Generator Migration + Model

```bash
php artisan make:model Project -m
php artisan make:model Task -m
php artisan make:model Attachment -m
php artisan make:model Comment -m
```

## Migration: Project

```php
Schema::create('projects', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->text('description')->nullable();
    $table->string('color')->default('#3B82F6');
    $table->timestamps();
});
```

::: details Penjelasan Kode
- `Schema::create('projects', ...)` - mendefinisikan pembuatan tabel `projects`. Closure menerima `Blueprint $table` sebagai builder untuk menambahkan kolom.
- `$table->id()` - shorthand untuk `bigIncrements('id')`: kolom primary key `id` bertipe `BIGINT UNSIGNED` auto-increment.
- `$table->foreignId('user_id')->constrained()->cascadeOnDelete()` - membuat kolom `user_id` (BIGINT UNSIGNED) sekaligus menambahkan foreign key ke tabel `users` (nama tabel ditebak dari nama kolom). `cascadeOnDelete()` menyebabkan project otomatis terhapus saat user-nya dihapus - mencegah data orphan.
- `$table->text('description')->nullable()` - kolom `description` bertipe TEXT yang boleh kosong (NULL).
- `$table->string('color')->default('#3B82F6')` - varchar default 255 karakter, dengan nilai default hex warna biru jika tidak diisi saat insert.
- `$table->timestamps()` - menambahkan dua kolom `created_at` dan `updated_at` timestamp, otomatis diisi Eloquent.
:::

## Migration: Pivot Project-User

```php
Schema::create('project_user', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('role')->default('member');
    $table->timestamps();
});
```

::: details Penjelasan Kode
- Nama tabel `project_user` mengikuti konvensi Eloquent: nama dua model dalam bentuk tunggal, diurutkan alfabetis, dipisah underscore. Laravel otomatis mendeteksinya sebagai pivot table relasi `belongsToMany`.
- `$table->id()` - kolom primary key tambahan (bukan composite key). Walaupun pivot biasanya hanya composite key, menambah `id` memudahkan referensi baris (mis. untuk hapus baris spesifik).
- Dua `foreignId(...)->constrained()->cascadeOnDelete()` - foreign key ke `projects` dan `users`, masing-masing cascade delete. Saat project atau user dihapus, baris pivot terkait ikut terhapus.
- `$table->string('role')->default('member')` - kolom tambahan pada pivot menyimpan role anggota. Nilai default `'member'`; owner di-set eksplisit saat `attach()`.
:::

## Migration: Task

```php
Schema::create('tasks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->comment('Creator');
    $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('title');
    $table->text('description')->nullable();
    $table->string('status')->default('todo');
    $table->string('priority')->default('medium');
    $table->date('due_date')->nullable();
    $table->integer('order')->default(0);
    $table->timestamps();
});
```

::: details Penjelasan Kode
- `$table->foreignId('project_id')->constrained()->cascadeOnDelete()` - task otomatis terhapus saat project induk dihapus (cascade). Berguna karena task selalu punya project.
- `$table->foreignId('user_id')->constrained()->comment('Creator')` - kolom creator task. `->comment()` menambah metadata di MySQL sehingga kolom terdokumentasi di DB.
- `$table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete()` - nullable karena task boleh tanpa assignee. `constrained('users')` eksplisit karena nama kolom `assignee_id` tidak mengikuti konvensi (`users`), jadi Laravel tidak bisa menebak tabel target. `nullOnDelete()` menjadikan NULL saat user assignee dihapus (bukan menghapus task).
- `$table->date('due_date')` - tipe `DATE` (hanya tanggal, tanpa jam) sesuai tips 24.1.
- `$table->integer('order')->default(0)` - kolom urutan untuk drag-and-drop; default 0 agar semua task baru menempati posisi awal.
:::

## Migration: Attachment

```php
Schema::create('attachments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('task_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('filename');
    $table->string('path');
    $table->unsignedBigInteger('size');
    $table->string('mime_type');
    $table->timestamps();
});
```

::: details Penjelasan Kode
- `$table->string('filename')` - menyimpan nama file asli (mis. `laporan.pdf`) untuk ditampilkan ke user.
- `$table->string('path')` - path file di storage (mis. `attachments/abc123.pdf`), berbeda dari `filename` karena Laravel memutuskan nama unik saat `store()`.
- `$table->unsignedBigInteger('size')` - ukuran file dalam byte. Pakai `unsignedBigInteger` agar bisa menampung file besar (di atas 2 GB) tanpa overflow.
- `$table->string('mime_type')` - tipe MIME (mis. `application/pdf`) untuk validasi download dan keamanan.
:::

## Migration: Comment

```php
Schema::create('comments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('task_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->text('body');
    $table->timestamps();
});
```

::: details Penjelasan Kode
- `$table->text('body')` - isi komentar. Tipe `text` bukan `string` karena panjang tidak terbatas 255 karakter dan tidak perlu index.
- Dua `foreignId` cascade - komentar ikut terhapus saat task atau user pembuatnya dihapus, mencegah ghost comments pada task yang sudah tidak ada.
:::

## Model: Project

```php
class Project extends Model
{
    protected $fillable = ['user_id', 'name', 'description', 'color'];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot('role');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
```

::: details Penjelasan Kode
- `protected $fillable = [...]` - whitelist kolom yang boleh diisi via mass-assignment (mis. `Project::create([...])`). Mencegah mass-assignment vulnerability: kolom di luar list ini akan diabaikan.
- `owner(): BelongsTo` - relasi project -> satu user sebagai pemilik. Argumen kedua `'user_id'` menetapkan foreign key custom (default `user_id` sebenarnya cocok, ditulis eksplisit agar jelas).
- `members(): BelongsToMany` - relasi many-to-many ke `User` melalui pivot `project_user`. `->withPivot('role')` menyertakan kolom `role` saat mengakses `$project->members`, sehingga bisa baca `$member->pivot->role`.
- `tasks(): HasMany` - satu project punya banyak task. Foreign key `project_id` ditebak otomatis.
:::

## Model: Task

```php
class Task extends Model
{
    protected $fillable = [
        'project_id', 'user_id', 'assignee_id', 'title',
        'description', 'status', 'priority', 'due_date', 'order',
    ];

    protected $casts = ['due_date' => 'date'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function scopeOverdue($q)
    {
        return $q->where('due_date', '<', now())
            ->where('status', '!=', 'done');
    }
}
```

::: details Penjelasan Kode
- `protected $casts = ['due_date' => 'date']` - otomatis casting kolom `due_date` ke instance `Carbon` saat dibaca, dan kembali ke string `Y-m-d` saat disimpan. Memudahkan operasi tanggal di PHP.
- `creator()` dan `assignee()` keduanya `belongsTo User::class` tapi dengan foreign key berbeda (`user_id` vs `assignee_id`). Ini memungkinkan satu model punya dua relasi ke model yang sama - pola umum pada tabel dengan multiple user reference.
- `comments(): HasMany` + `->latest()` - mengurutkan komentar dari terbaru ke terlama secara default setiap kali relasi di-load (eager maupun lazy).
- `scopeOverdue($q)` - custom query scope. Saat dipanggil `Task::overdue()`, Laravel otomatis menambah klausa `WHERE due_date < now AND status != 'done'`. Variabel `$q` adalah query builder; konvensi scope harus diawali `scope` dan parameter pertama adalah builder.
:::

## API Resource

```bash
php artisan make:resource ProjectResource
php artisan make:resource TaskResource
php artisan make:resource CommentResource
```

Contoh `TaskResource`:

```php
class TaskResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'priority'    => $this->priority,
            'due_date'    => $this->due_date?->toDateString(),
            'assignee'    => $this->whenLoaded('assignee', fn () => UserResource::make($this->assignee)),
            'comments'    => $this->whenLoaded('comments', fn () => CommentResource::collection($this->comments)),
            'can_update'  => $request->user()->can('update', $this),
            'can_delete'  => $request->user()->can('delete', $this),
        ];
    }
}
```

::: details Penjelasan Kode
- `JsonResource` - kelas dasar Laravel untuk transformasi model menjadi array/JSON. Memberi kontrol penuh properti apa yang diekspos ke frontend.
- `$this->due_date?->toDateString()` - operator `?->` (nullsafe) memanggil `toDateString()` hanya jika `due_date` tidak null (karena sudah di-cast ke Carbon). Hasilnya string `Y-m-d` bersih, bukan objek Carbon serialize.
- `$this->whenLoaded('assignee', fn () => ...)` - kunci menghindari N+1. Relasi hanya disertakan ke JSON jika sudah di-eager load di controller via `with()`. Jika belum di-load, kunci `assignee` tidak muncul sama sekali (bukan `null`), jadi developer frontend tahu kapan harus load ulang.
- `UserResource::make($this->assignee)` - membungkus satu model ke resource collection. `make()` instance tunggal, `collection(...)` untuk banyak model.
- `'can_update' => $request->user()->can('update', $this)` - mengevaluasi Policy di server dan mengirim boolean ke frontend, sehingga Vue bisa sembunyikan tombol edit tanpa duplikasi logika otorisasi di JS.
:::

:::tip `whenLoaded` penting
Hanya sertakan relasi jika sudah di-eager load dengan `with()` / `load()`. Ini menghindari N+1 dan menahan otorisasi di server-side.
:::

## Jalankan Migration

```bash
php artisan migrate
```

## Selanjutnya

Database siap. Lanjut ke [24.4 - Autentikasi](/bagian-6/bab-24/24-4-autentikasi).