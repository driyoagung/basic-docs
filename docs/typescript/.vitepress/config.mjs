import { defineConfig } from 'vitepress'


export default defineConfig({
  title: 'Ebook TypeScript',
  description: 'Panduan Lengkap Belajar TypeScript — Dari JavaScript ke React & Next.js. TypeScript 5 · React 18 · Next.js App Router · Zod. Bahasa Indonesia',
  lang: 'id-ID',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',

  head: [
    ['meta', { name: 'theme-color', content: '#42b883' }],
    ['meta', { name: 'og:title', content: 'Ebook TypeScript — Dari JavaScript ke React & Next.js' }],
    ['meta', { name: 'og:description', content: 'Panduan lengkap belajar TypeScript dalam Bahasa Indonesia' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'id_ID' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'TypeScript' },
    siteTitle: 'Ebook TypeScript',

    nav: [
      { text: '🏠 Beranda', link: '/' },
      { text: '📖 Mulai Belajar', link: '/bagian-1/bab-1' },
      {
        text: '📚 Daftar Bagian',
        items: [
          { text: '🚀 Bagian I — Fondasi TypeScript', link: '/bagian-1/index' },
          { text: '🧱 Bagian II — Fungsi, Object & Tipe Gabungan', link: '/bagian-2/index' },
          { text: '✨ Bagian III — Generics & Utility Types', link: '/bagian-3/index' },
          { text: '📦 Bagian IV — Class, Module & Data Asinkron', link: '/bagian-4/index' },
          { text: '⚛️ Bagian V — TypeScript untuk React', link: '/bagian-5/index' },
          { text: '🧭 Bagian VI — TypeScript untuk Next.js', link: '/bagian-6/index' },
          { text: '🐛 Bagian VII — Debugging, Migrasi & Best Practices', link: '/bagian-7/index' },
          { text: '🏆 Bagian VIII — Project Praktik', link: '/bagian-8/index' },
        ],
      },
      {
        text: '🔗 Tautan',
        items: [
          { text: 'TypeScript Official', link: 'https://www.typescriptlang.org', target: '_blank', rel: 'noopener' },
          { text: 'Handbook', link: 'https://www.typescriptlang.org/docs/handbook/intro.html', target: '_blank', rel: 'noopener' },
          { text: 'TSConfig Reference', link: 'https://www.typescriptlang.org/tsconfig', target: '_blank', rel: 'noopener' },
          { text: 'Zod', link: 'https://zod.dev', target: '_blank', rel: 'noopener' },
        ],
      },
    ],

    sidebar: [
      {
        text: `🚀 Bagian I — Fondasi TypeScript`,
        collapsed: false,
        items: [
          { text: `🗺️ Peta Bagian I`, link: '/bagian-1/index' },
          { text: `📘 Bab 1 — Mengenal TypeScript`, link: '/bagian-1/bab-1' },
          { text: `🔧 Bab 2 — Setup & Konfigurasi`, link: '/bagian-1/bab-2' },
          { text: `🔤 Bab 3 — Tipe Dasar`, link: '/bagian-1/bab-3' },
        ],
      },
      {
        text: `🧱 Bagian II — Fungsi, Object & Tipe Gabungan`,
        collapsed: true,
        items: [
          { text: `🗺️ Roadmap Bagian II`, link: '/bagian-2/index' },
          { text: `⚙️ Bab 4 — Fungsi di TypeScript`, link: '/bagian-2/bab-4' },
          { text: `🧱 Bab 5 — Object, type & interface ⭐`, link: '/bagian-2/bab-5' },
          { text: `🔀 Bab 6 — Union, Intersection & Narrowing ⭐`, link: '/bagian-2/bab-6' },
        ],
      },
      {
        text: `✨ Bagian III — Generics & Utility Types`,
        collapsed: true,
        items: [
          { text: `🗺️ Overview Bagian III`, link: '/bagian-3/index' },
          { text: `🧰 Bab 7 — Generics ⭐`, link: '/bagian-3/bab-7' },
          { text: `🎛️ Bab 8 — Utility Types`, link: '/bagian-3/bab-8' },
          { text: `🧠 Bab 9 — Tipe Lanjutan yang Sering Muncul`, link: '/bagian-3/bab-9' },
        ],
      },
      {
        text: `📦 Bagian IV — Class, Module & Data Asinkron`,
        collapsed: true,
        items: [
          { text: `🗺️ Ringkasan Bagian IV`, link: '/bagian-4/index' },
          { text: `🏛️ Bab 10 — Class & OOP di TypeScript`, link: '/bagian-4/bab-10' },
          { text: `📦 Bab 11 — Module & Deklarasi Tipe`, link: '/bagian-4/bab-11' },
          { text: `⏱️ Bab 12 — Async, Error & Validasi Runtime`, link: '/bagian-4/bab-12' },
        ],
      },
      {
        text: `⚛️ Bagian V — TypeScript untuk React`,
        collapsed: true,
        items: [
          { text: `🗺️ Overview Bagian V`, link: '/bagian-5/index' },
          { text: `⚛️ Bab 13 — Typing Komponen, Props & Event`, link: '/bagian-5/bab-13' },
          { text: `🪝 Bab 14 — Typing Hooks ⭐`, link: '/bagian-5/bab-14' },
          { text: `🧩 Bab 15 — Pola Lanjutan di React + TS`, link: '/bagian-5/bab-15' },
        ],
      },
      {
        text: `🧭 Bagian VI — TypeScript untuk Next.js`,
        collapsed: true,
        items: [
          { text: `🗺️ Ringkasan Bagian VI`, link: '/bagian-6/index' },
          { text: `🗺️ Bab 16 — Typing App Router`, link: '/bagian-6/bab-16' },
          { text: `⚡ Bab 17 — Server Actions & Data Bertipe`, link: '/bagian-6/bab-17' },
          { text: `🌐 Bab 18 — Fetching, Environment & Konfigurasi`, link: '/bagian-6/bab-18' },
        ],
      },
      {
        text: `🐛 Bagian VII — Debugging, Migrasi & Best Practices`,
        collapsed: true,
        items: [
          { text: `🗺️ Overview Bagian VII`, link: '/bagian-7/index' },
          { text: `🐞 Bab 19 — Membaca & Memperbaiki Error TypeScript`, link: '/bagian-7/bab-19' },
          { text: `🚚 Bab 20 — Migrasi JS → TS & Best Practices`, link: '/bagian-7/bab-20' },
        ],
      },
      {
        text: `🏆 Bagian VIII — Project Praktik`,
        collapsed: true,
        items: [
          { text: `🗺️ Capstone Overview`, link: '/bagian-8/index' },
          { text: `🎓 Bab 21 — Project: Aplikasi Katalog Bertipe`, link: '/bagian-8/bab-21' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/microsoft/TypeScript' },
    ],

    footer: {
      message: 'Dokumentasi open-source untuk komunitas developer Indonesia 🇮🇩',
      copyright: '© 2026 Ebook TypeScript — Dari JavaScript ke React & Next.js',
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

  srcExclude: [
    'struktur-ebook-typescript.md',
  ],
})
