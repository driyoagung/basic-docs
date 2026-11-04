import { defineConfig } from 'vitepress'
import { icon, badge } from './icons.mjs'

const bintang = badge()

export default defineConfig({
  title: 'Ebook TypeScript',
  description: 'Panduan Lengkap Belajar TypeScript — Dari JavaScript ke React & Next.js. TypeScript 5 · React 18 · Next.js App Router · Zod. Bahasa Indonesia',
  lang: 'id-ID',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',

  head: [
    ['meta', { name: 'theme-color', content: '#3178C6' }],
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
          { text: '🟢 Bagian I — Fondasi TypeScript', link: '/bagian-1/index' },
          { text: '🔵 Bagian II — Fungsi, Object & Tipe Gabungan', link: '/bagian-2/index' },
          { text: '🟡 Bagian III — Generics & Utility Types', link: '/bagian-3/index' },
          { text: '🟠 Bagian IV — Class, Module & Data Asinkron', link: '/bagian-4/index' },
          { text: '🔴 Bagian V — TypeScript untuk React', link: '/bagian-5/index' },
          { text: '🟣 Bagian VI — TypeScript untuk Next.js', link: '/bagian-6/index' },
          { text: '⚫ Bagian VII — Debugging, Migrasi & Best Practices', link: '/bagian-7/index' },
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
        text: `${icon('rocket-launch', '#16a34a')} Bagian I — Fondasi TypeScript`,
        collapsed: false,
        items: [
          { text: `${icon('map')} Peta Bagian I`, link: '/bagian-1/index' },
          { text: `${icon('book-open')} Bab 1 — Mengenal TypeScript`, link: '/bagian-1/bab-1' },
          { text: `${icon('wrench-screwdriver')} Bab 2 — Setup & Konfigurasi`, link: '/bagian-1/bab-2' },
          { text: `${icon('language')} Bab 3 — Tipe Dasar`, link: '/bagian-1/bab-3' },
        ],
      },
      {
        text: `${icon('cube', '#2563eb')} Bagian II — Fungsi, Object & Tipe Gabungan`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Roadmap Bagian II`, link: '/bagian-2/index' },
          { text: `${icon('wrench')} Bab 4 — Fungsi di TypeScript`, link: '/bagian-2/bab-4' },
          { text: `${icon('cube')} Bab 5 — Object, type & interface ${bintang}`, link: '/bagian-2/bab-5' },
          { text: `${icon('arrows-right-left')} Bab 6 — Union, Intersection & Narrowing ${bintang}`, link: '/bagian-2/bab-6' },
        ],
      },
      {
        text: `${icon('sparkles', '#d97706')} Bagian III — Generics & Utility Types`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Overview Bagian III`, link: '/bagian-3/index' },
          { text: `${icon('variable')} Bab 7 — Generics ${bintang}`, link: '/bagian-3/bab-7' },
          { text: `${icon('adjustments-horizontal')} Bab 8 — Utility Types`, link: '/bagian-3/bab-8' },
          { text: `${icon('cpu-chip')} Bab 9 — Tipe Lanjutan yang Sering Muncul`, link: '/bagian-3/bab-9' },
        ],
      },
      {
        text: `${icon('folder', '#ea580c')} Bagian IV — Class, Module & Data Asinkron`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Ringkasan Bagian IV`, link: '/bagian-4/index' },
          { text: `${icon('cube-transparent')} Bab 10 — Class & OOP di TypeScript`, link: '/bagian-4/bab-10' },
          { text: `${icon('folder-open')} Bab 11 — Module & Deklarasi Tipe`, link: '/bagian-4/bab-11' },
          { text: `${icon('clock')} Bab 12 — Async, Error & Validasi Runtime`, link: '/bagian-4/bab-12' },
        ],
      },
      {
        text: `${icon('code-bracket-square', '#dc2626')} Bagian V — TypeScript untuk React`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Overview Bagian V`, link: '/bagian-5/index' },
          { text: `${icon('puzzle-piece')} Bab 13 — Typing Komponen, Props & Event`, link: '/bagian-5/bab-13' },
          { text: `${icon('link')} Bab 14 — Typing Hooks ${bintang}`, link: '/bagian-5/bab-14' },
          { text: `${icon('swatch')} Bab 15 — Pola Lanjutan di React + TS`, link: '/bagian-5/bab-15' },
        ],
      },
      {
        text: `${icon('server-stack', '#7c3aed')} Bagian VI — TypeScript untuk Next.js`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Ringkasan Bagian VI`, link: '/bagian-6/index' },
          { text: `${icon('document')} Bab 16 — Typing App Router`, link: '/bagian-6/bab-16' },
          { text: `${icon('bolt')} Bab 17 — Server Actions & Data Bertipe`, link: '/bagian-6/bab-17' },
          { text: `${icon('globe-alt')} Bab 18 — Fetching, Environment & Konfigurasi`, link: '/bagian-6/bab-18' },
        ],
      },
      {
        text: `${icon('bug-ant', '#64748b')} Bagian VII — Debugging, Migrasi & Best Practices`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Overview Bagian VII`, link: '/bagian-7/index' },
          { text: `${icon('exclamation-triangle')} Bab 19 — Membaca & Memperbaiki Error TypeScript`, link: '/bagian-7/bab-19' },
          { text: `${icon('rocket-launch')} Bab 20 — Migrasi JS → TS & Best Practices`, link: '/bagian-7/bab-20' },
        ],
      },
      {
        text: `${icon('trophy', '#ca8a04')} Bagian VIII — Project Praktik`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Capstone Overview`, link: '/bagian-8/index' },
          { text: `${icon('academic-cap')} Bab 21 — Project: Aplikasi Katalog Bertipe`, link: '/bagian-8/bab-21' },
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
      light: 'github-light',
      dark: 'github-dark',
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
