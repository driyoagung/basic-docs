import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ebook Laravel',
  description: 'Panduan Lengkap Belajar Laravel 12 dari Zero hingga Production — Bahasa Indonesia',
  lang: 'id-ID',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',

  head: [
    ['meta', { name: 'theme-color', content: '#42b883' }],
    ['meta', { name: 'og:title', content: 'Ebook Laravel — From Zero to Production' }],
    ['meta', { name: 'og:description', content: 'Panduan lengkap belajar Laravel 12 dalam Bahasa Indonesia' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'id_ID' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'Laravel' },
    siteTitle: 'Ebook Laravel',

    nav: [
      { text: '🏠 Beranda', link: '/' },
      { text: '📖 Mulai Belajar', link: '/bagian-1/bab-1' },
      {
        text: '📚 Daftar Bagian',
        items: [
          { text: '🚀 Bagian I — Fondasi Laravel', link: '/bagian-1/index' },
          { text: '🧩 Bagian II — Core Concepts', link: '/bagian-2/index' },
          { text: '🗄️ Bagian III — Database & Eloquent', link: '/bagian-3/index' },
          { text: '🔐 Bagian IV — Autentikasi & Keamanan', link: '/bagian-4/index' },
          { text: '🔌 Bagian V — REST API', link: '/bagian-5/index' },
          { text: '⚡ Bagian VI — Level Up', link: '/bagian-6/index' },
          { text: '🏗️ Bagian VII — Project E-Commerce', link: '/bagian-7/index' },
        ],
      },
      {
        text: '🔗 Tautan',
        items: [
          { text: 'Laravel Official', link: 'https://laravel.com' },
          { text: 'Laravel Docs (EN)', link: 'https://laravel.com/docs' },
        ],
      },
    ],

    sidebar: [
      {
        text: '🚀 Bagian I — Fondasi Laravel',
        collapsed: false,
        items: [
          { text: '🗺️ Peta Bagian I', link: '/bagian-1/index' },
          { text: '🌟 Bab 1 — Mengenal Laravel & Ekosistemnya', link: '/bagian-1/bab-1' },
          { text: '📦 Bab 2 — Setup & Instalasi Project', link: '/bagian-1/bab-2' },
          { text: '🏗️ Bab 3 — MVC: Cara Berpikir Laravel', link: '/bagian-1/bab-3' },
          { text: '🚦 Bab 4 — Routing & Controller Dasar', link: '/bagian-1/bab-4' },
        ],
      },
      {
        text: '🧩 Bagian II — Core Concepts Laravel',
        collapsed: true,
        items: [
          { text: '🧭 Roadmap Bagian II', link: '/bagian-2/index' },
          { text: '💉 Bab 5 — Service Container & Dependency Injection', link: '/bagian-2/bab-5' },
          { text: '🎨 Bab 6 — Blade Template Engine', link: '/bagian-2/bab-6' },
          { text: '✅ Bab 7 — Validasi & Form Request', link: '/bagian-2/bab-7' },
          { text: '🛡️ Bab 8 — Middleware', link: '/bagian-2/bab-8' },
          { text: '🍪 Bab 9 — Session, Cookie & Flash Message', link: '/bagian-2/bab-9' },
        ],
      },
      {
        text: '🗄️ Bagian III — Database & Eloquent ORM',
        collapsed: true,
        items: [
          { text: '🗃️ Overview Bagian III', link: '/bagian-3/index' },
          { text: '🗄️ Bab 10 — Eloquent ORM & Migration', link: '/bagian-3/bab-10' },
          { text: '🔗 Bab 11 — Relasi Eloquent', link: '/bagian-3/bab-11' },
          { text: '🏭 Bab 12 — Seeder, Factory & Database Testing', link: '/bagian-3/bab-12' },
          { text: '⚙️ Bab 13 — Query Builder & Raw Query', link: '/bagian-3/bab-13' },
        ],
      },
      {
        text: '🔐 Bagian IV — Autentikasi & Keamanan',
        collapsed: true,
        items: [
          { text: '🔐 Ringkasan Bagian IV', link: '/bagian-4/index' },
          { text: '🔓 Bab 14 — Autentikasi dengan Laravel Breeze', link: '/bagian-4/bab-14' },
          { text: '👥 Bab 15 — Role & Permission', link: '/bagian-4/bab-15' },
          { text: '🛡️ Bab 16 — Keamanan Laravel', link: '/bagian-4/bab-16' },
        ],
      },
      {
        text: '🔌 Bagian V — REST API Development',
        collapsed: true,
        items: [
          { text: '📡 Overview Bagian V', link: '/bagian-5/index' },
          { text: '🌐 Bab 17 — Dasar REST API dengan Laravel', link: '/bagian-5/bab-17' },
          { text: '📤 Bab 18 — API Response & Error Handling', link: '/bagian-5/bab-18' },
          { text: '🔑 Bab 19 — Autentikasi API dengan Sanctum', link: '/bagian-5/bab-19' },
          { text: '🏷️ Bab 20 — API Versioning & Best Practices', link: '/bagian-5/bab-20' },
        ],
      },
      {
        text: '⚡ Bagian VI — Level Up',
        collapsed: true,
        items: [
          { text: '⚡ Ringkasan Bagian VI', link: '/bagian-6/index' },
          { text: '📨 Bab 21 — Queue, Jobs & Email', link: '/bagian-6/bab-21' },
          { text: '📦 Bab 22 — File Storage & Upload', link: '/bagian-6/bab-22' },
          { text: '🚀 Bab 23 — Caching & Performance Optimization', link: '/bagian-6/bab-23' },
        ],
      },
      {
        text: '🏗️ Bagian VII — Project E-Commerce API',
        collapsed: true,
        items: [
          { text: '🎯 Capstone Overview', link: '/bagian-7/index' },
          { text: '🛒 Bab 24 — Project REST API E-Commerce Lengkap', link: '/bagian-7/bab-24' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
    ],

    footer: {
      message: 'Dokumentasi open-source untuk komunitas developer Indonesia 🇮🇩',
      copyright: '© 2026 Ebook Laravel — From Zero to Production',
    },

    outline: {
      level: [2, 3],
      label: 'Daftar Isi Halaman',
    },

    docFooter: {
      prev: 'Bab Sebelumnya',
      next: 'Bab Selanjutnya',
    },

    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            boost: { title: 4, text: 2, tags: 3 },
          },
        },
      },
    },
  },

  markdown: {
    theme: {
      light: 'catppuccin-latte',
      dark: 'dracula',
    },
    lineNumbers: true,
    container: {
      tipLabel: '💡 Tips',
      warningLabel: '⚠️ Peringatan',
      dangerLabel: '🚨 Bahaya',
      infoLabel: 'ℹ️ Informasi',
      detailsLabel: 'Detail',
    },
  },

  ignoreDeadLinks: [
    /^https?:\/\/(www\.)?example\.com/,
    /README/,
  ],
})
