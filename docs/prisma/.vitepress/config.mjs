import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ebook Prisma ORM',
  description: 'Panduan Lengkap Prisma ORM — Dari Raw SQL ke Type-Safe Database. TypeScript · MySQL · PostgreSQL · Next.js. Bahasa Indonesia',
  lang: 'id-ID',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',

  head: [
    ['meta', { name: 'theme-color', content: '#5A67D8' }],
    ['meta', { name: 'og:title', content: 'Ebook Prisma ORM — From Raw SQL to Type-Safe Database' }],
    ['meta', { name: 'og:description', content: 'Panduan lengkap belajar Prisma ORM dalam Bahasa Indonesia' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'id_ID' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'Prisma ORM' },
    siteTitle: 'Ebook Prisma ORM',

    nav: [
      { text: '🏠 Beranda', link: '/' },
      { text: '📖 Mulai Belajar', link: '/bagian-1/bab-1' },
      {
        text: '📚 Daftar Bagian',
        items: [
          { text: '📘 Bagian I — Mengenal Prisma & Setup', link: '/bagian-1/index' },
          { text: '🗂️ Bagian II — Prisma Schema', link: '/bagian-2/index' },
          { text: '🚚 Bagian III — Prisma Migrate', link: '/bagian-3/index' },
          { text: '🗃️ Bagian IV — CRUD & Query Dasar', link: '/bagian-4/index' },
          { text: '🔗 Bagian V — Query Lanjutan & Relasi', link: '/bagian-5/index' },
          { text: '🧠 Bagian VI — Prisma Lanjutan', link: '/bagian-6/index' },
          { text: '🚀 Bagian VII — Performa & Best Practices', link: '/bagian-7/index' },
          { text: '🏆 Bagian VIII — Project REST API', link: '/bagian-8/index' },
        ],
      },
      {
        text: '🔗 Tautan',
        items: [
          { text: 'Prisma Official', link: 'https://www.prisma.io', target: '_blank', rel: 'noopener' },
          { text: 'Prisma Docs', link: 'https://www.prisma.io/docs', target: '_blank', rel: 'noopener' },
          { text: 'Prisma GitHub', link: 'https://github.com/prisma/prisma', target: '_blank', rel: 'noopener' },
          { text: 'Next.js Docs', link: 'https://nextjs.org/docs', target: '_blank', rel: 'noopener' },
        ],
      },
    ],

    sidebar: [
      {
        text: '📘 Bagian I — Mengenal Prisma & Setup',
        collapsed: false,
        items: [
          { text: '🗺️ Peta Bagian I', link: '/bagian-1/index' },
          { text: '📖 Bab 1 — Mengenal Prisma ORM', link: '/bagian-1/bab-1' },
          { text: '📦 Bab 2 — Setup & Instalasi', link: '/bagian-1/bab-2' },
          { text: '🔌 Bab 3 — Prisma Client & Koneksi Pertama', link: '/bagian-1/bab-3' },
        ],
      },
      {
        text: '🗂️ Bagian II — Prisma Schema: Jantung Prisma',
        collapsed: true,
        items: [
          { text: '🧭 Roadmap Bagian II', link: '/bagian-2/index' },
          { text: '🏗️ Bab 4 — Data Model & Field Types', link: '/bagian-2/bab-4' },
          { text: '🧩 Bab 5 — Relasi Antar Model', link: '/bagian-2/bab-5' },
          { text: '🔧 Bab 6 — Schema Lanjutan & Multi-Database', link: '/bagian-2/bab-6' },
        ],
      },
      {
        text: '🚚 Bagian III — Prisma Migrate',
        collapsed: true,
        items: [
          { text: '🎨 Overview Bagian III', link: '/bagian-3/index' },
          { text: '🚚 Bab 7 — Prisma Migrate: Dasar', link: '/bagian-3/bab-7' },
          { text: '🌱 Bab 8 — Seeder & Data Awal', link: '/bagian-3/bab-8' },
        ],
      },
      {
        text: '🗃️ Bagian IV — CRUD & Query Dasar',
        collapsed: true,
        items: [
          { text: '🏪 Ringkasan Bagian IV', link: '/bagian-4/index' },
          { text: '✏️ Bab 9 — CREATE: Membuat Data', link: '/bagian-4/bab-9' },
          { text: '🔍 Bab 10 — READ: Mengambil Data', link: '/bagian-4/bab-10' },
          { text: '🔄 Bab 11 — UPDATE: Mengubah Data', link: '/bagian-4/bab-11' },
          { text: '🗑️ Bab 12 — DELETE: Menghapus Data', link: '/bagian-4/bab-12' },
        ],
      },
      {
        text: '🔗 Bagian V — Query Lanjutan & Relasi',
        collapsed: true,
        items: [
          { text: '🌐 Overview Bagian V', link: '/bagian-5/index' },
          { text: '🎯 Bab 13 — Filtering & Operator Lengkap', link: '/bagian-5/bab-13' },
          { text: '🔗 Bab 14 — Select & Include: Query Relasi', link: '/bagian-5/bab-14' },
          { text: '🔒 Bab 15 — Transactions & Raw Query', link: '/bagian-5/bab-15' },
        ],
      },
      {
        text: '🧠 Bagian VI — Prisma Lanjutan',
        collapsed: true,
        items: [
          { text: '🚀 Ringkasan Bagian VI', link: '/bagian-6/index' },
          { text: '🧩 Bab 16 — Prisma Middleware & Extension', link: '/bagian-6/bab-16' },
          { text: '🛡️ Bab 17 — Validasi dengan Zod + Prisma', link: '/bagian-6/bab-17' },
          { text: '🚨 Bab 18 — Error Handling di Prisma', link: '/bagian-6/bab-18' },
        ],
      },
      {
        text: '🚀 Bagian VII — Performa & Best Practices',
        collapsed: true,
        items: [
          { text: '⚡ Overview Bagian VII', link: '/bagian-7/index' },
          { text: '⚡ Bab 19 — Optimasi Query & Performa', link: '/bagian-7/bab-19' },
          { text: '🏆 Bab 20 — Best Practices & Pola Umum', link: '/bagian-7/bab-20' },
        ],
      },
      {
        text: '🏆 Bagian VIII — Project REST API',
        collapsed: true,
        items: [
          { text: '🎯 Capstone Overview', link: '/bagian-8/index' },
          { text: '🏠 Bab 21 — Project: REST API Toko Online', link: '/bagian-8/bab-21' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/prisma/prisma' },
    ],

    footer: {
      message: 'Dokumentasi open-source untuk komunitas developer Indonesia 🇮🇩',
      copyright: '© 2026 Ebook Prisma ORM — From Raw SQL to Type-Safe Database',
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
    '**/Ebook Prisma ORM*.md',
    'structure.md',
  ],
})
