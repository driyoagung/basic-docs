---
title: Bab 21 — Queue, Jobs & Email
---

# 📖 Bab 21 — Queue, Jobs & Email

## 21.1 📬 Queue & Background Jobs

Queue memungkinkan kita menjalankan tugas berat **di background**, tanpa membuat user menunggu.

```bash
# Buat Job
php artisan make:job SendWelcomeEmail
```

```php
// app/Jobs/SendWelcomeEmail.php
namespace App\Jobs;

use App\Mail\WelcomeEmail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendWelcomeEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10; // Tunda 10 detik sebelum retry

    public function __construct(
        public readonly User $user
    ) {}

    public function handle(): void
    {
        Mail::to($this->user->email)
            ->send(new WelcomeEmail($this->user));
    }

    // Jika job gagal setelah semua tries
    public function failed(\Throwable $exception): void
    {
        Log::error("Gagal kirim email ke {$this->user->email}: {$exception->getMessage()}");
    }
}
```

**Penjelasan Job:**

- **`ShouldQueue` interface** — Tandai job ini harus di-queue, bukan langsung dijalankan.
- **`use Dispatchable, ...`** — Trait:
  - `Dispatchable` — Bisa dipanggil `Job::dispatch()`.
  - `InteractsWithQueue` — Interaksi dengan queue (retry, fail, dll).
  - `Queueable` — Set queue & connection.
  - `SerializesModels` — Otomatis serialize Model (Penting untuk queue).
- **`$tries = 3`** — Max 3 percobaan jika gagal.
- **`$backoff = 10`** — Tunda 10 detik sebelum retry.
- **`handle()`** — Logic yang dijalankan saat job diproses.
- **`failed()`** — Dipanggil setelah job gagal permanen.

### Dispatch Job

```php
// Dispatch langsung
SendWelcomeEmail::dispatch($user);

// Tunda 5 menit
SendWelcomeEmail::dispatch($user)->delay(now()->addMinutes(5));

// Jalankan di queue tertentu
SendWelcomeEmail::dispatch($user)->onQueue('emails');

// Jalankan di connection tertentu
SendWelcomeEmail::dispatch($user)->onConnection('redis');

// Chain jobs (jalankan berurutan)
ProcessPodcast::dispatch($podcast)
    ->chain([
        new OptimizePodcast($podcast),
        new ReleasePodcast($podcast),
    ]);

// Batch (jalankan paralel, callback setelah selesai)
Bus::batch([
    new SendWelcomeEmail($user1),
    new SendWelcomeEmail($user2),
])->then(function (Batch $batch) {
    // Semua selesai
})->dispatch();
```

**Penjelasan dispatch options:**

- **`dispatch($user)`** — Langsung masuk queue.
- **`->delay()`** — Tunda eksekusi job.
- **`->onQueue('emails')`** — Taruh di queue bernama `emails` (misal untuk prioritize).
- **`->onConnection('redis')`** — Pakai Redis bukan database.
- **`->chain([...])`** — Job-chain. Job kedua jalan setelah job pertama selesai.
- **`Bus::batch([...])`** — Banyak job paralel. Callback `then` setelah semua selesai.

### Jalankan Queue Worker

```bash
# Jalankan worker (foreground)
php artisan queue:work

# Dengan opsi
php artisan queue:work --sleep=3 --tries=3 --max-time=3600

# Proses 1 job dan keluar
php artisan queue:work --once

# Monitor queue (install Horizon untuk UI)
php artisan queue:listen
```

## 21.2 🔧 Konfigurasi Queue

```ini
# .env

QUEUE_CONNECTION=database  # Bisa: sync, database, redis, sqs, beanstalkd
```

### Database Queue (Paling Simpel)

```bash
# Laravel 11+: migration tabel jobs SUDAH bawaan — langsung migrate saja
php artisan migrate

# (Laravel 10 ke bawah: generate dulu dengan `php artisan queue:table`)
```

### Redis Queue (Recommended untuk Production)

```bash
# Install predis
composer require predis/predis

# .env
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

**Penjelasan:**

- **`database`** — Pakai tabel DB. Simpel, tapi lambat untuk high load.
- **`redis`** — Pakai Redis. Cepat, support priority & delay.
- **`sync`** — Langsung execute (no queue). Untuk development.

## 21.3 📧 Kirim Email dengan Mailable

```bash
php artisan make:mail WelcomeEmail --markdown=emails.welcome
```

```php
// app/Mail/WelcomeEmail.php
namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Selamat datang di ' . config('app.name') . '!',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.welcome',
            with: ['user' => $this->user],
        );
    }
}
```

**Penjelasan Mailable:**

- **`envelope()`** — Subject email.
- **`content()`** — Isi email. `markdown` = pakai Markdown template.
- **`with: ['user' => $user]`** — Data yang di-pass ke template.

```blade
{{-- resources/views/emails/welcome.blade.php --}}
@component('mail::message')
# Halo, {{ $user->name }}!

Selamat datang di **{{ config('app.name') }}**. Akun Anda sudah aktif.

@component('mail::button', ['url' => route('dashboard')])
Buka Dashboard
@endcomponent

Salam,<br>
{{ config('app.name') }}
@endcomponent
```

### Kirim Email

```php
// Kirim langsung (blocking)
Mail::to($user->email)->send(new WelcomeEmail($user));

// Via queue (recommended)
Mail::to($user->email)->queue(new WelcomeEmail($user));

// Tunda pengiriman
Mail::to($user->email)->later(now()->addHours(1), new WelcomeEmail($user));
```

**Penjelasan:**

- **`->send()`** — Langsung kirim (blocking). User tunggu.
- **`->queue()`** — Masuk queue. Cepat, lanjut ke berikutnya.
- **`->later()`** — Tunda beberapa waktu.

## 21.4 📊 Monitor Queue dengan Horizon

```bash
# Install Horizon
composer require laravel/horizon
php artisan horizon:install
php artisan migrate
```

```bash
# Jalankan Horizon
php artisan horizon
```

Buka `http://localhost:8000/horizon` untuk dashboard monitoring queue.

**Penjelasan Horizon:**

- Horizon adalah dashboard cantik untuk Laravel queue.
- Tampil: jobs pending, processing, completed, failed.
- Bisa retry failed jobs dari UI.

## 📌 Ringkasan Bab 21

| Konsep                  | Penjelasan Singkat                                              |
| ----------------------- | --------------------------------------------------------------- |
| Queue                   | Antrian tugas untuk dijalankan di background                    |
| Job                     | Class yang bisa di-dispatch ke queue                            |
| `ShouldQueue` interface | Tandai job agar masuk queue (tidak blocking)                    |
| `dispatch()`            | Kirim job ke queue                                              |
| `$tries` & `$backoff`   | Konfigurasi retry job yang gagal                                |
| Worker                  | `php artisan queue:work` — proses job dari queue                |
| Mailable                | Class untuk representasi email                                  |
| Horizon                 | Dashboard monitoring queue dari Laravel                          |

---

➡️ Lanjut ke [Bab 22 — File Storage & Upload](/bagian-6/bab-22)
