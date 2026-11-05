import { defineConfig } from 'vitepress'

// Nama penulis & metadata global
const siteTitle = 'Laravel + Inertia.js + Vue.js'
const siteDescription = 'Dari Blade ke Full-Stack Modern — Panduan untuk Developer Laravel'

export default defineConfig({
  lang: 'id-ID',
  title: siteTitle,
  description: siteDescription,
  cleanUrls: true,
  lastUpdated: true,

  markdown: {
    theme: {
      light: 'catppuccin-latte',
      dark: 'dracula',
    },
  },

  head: [
    ['meta', { name: 'author', content: 'Tim Dokumentasi' }],
    ['meta', { name: 'keywords', content: 'Laravel, Inertia.js, Vue.js, VitePress, Tailwind, Tutorial, Indonesia' }],
    ['meta', { property: 'og:title', content: siteTitle }],
    ['meta', { property: 'og:description', content: siteDescription }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    logo: '/logos/inertia.png',
    siteTitle: '',

    outline: {
      level: [2, 3],
      label: 'Di halaman ini',
    },

    docFooter: {
      prev: 'Sebelumnya',
      next: 'Selanjutnya',
    },

    lastUpdatedText: 'Diperbarui pada',
    returnToTopLabel: 'Kembali ke atas',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Tema',
    lightModeSwitchTitle: 'Ganti ke mode terang',
    darkModeSwitchTitle: 'Ganti ke mode gelap',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Cari',
            buttonAriaLabel: 'Cari',
          },
          modal: {
            noResultsText: 'Tidak ada hasil untuk',
            resetButtonTitle: 'Bersihkan pencarian',
            footer: {
              selectText: 'Pilih',
              navigateText: 'Navigasi',
              closeText: 'Tutup',
            },
          },
        },
      },
    },

    nav: [
      { text: '🏠 Beranda', link: '/' },
      {
        text: '📚 Bagian',
        items: [
          { text: '🌉 I — Jembatan', link: '/bagian-1/bab-1' },
          { text: '🔄 II — Transisi', link: '/bagian-2/bab-4' },
          { text: '⚙️ III — Vue di Inertia', link: '/bagian-3/bab-8' },
          { text: '🚀 IV — Fitur Lanjutan', link: '/bagian-4/bab-11' },
          { text: '🛠️ V — Ekosistem & Tooling', link: '/bagian-5/bab-18' },
          { text: '🎯 VI — Studi Kasus', link: '/bagian-6/bab-24' },
        ],
      },
      { text: '🔖 Referensi', link: '/referensi' },
    ],

    sidebar: {
      '/': [
        {
          text: '📔 Pengantar',
          items: [{ text: '🏠 Beranda', link: '/' }],
        },
        {
          text: '🌉 Bagian I — Jembatan: Memahami Inertia.js',
          collapsed: false,
          items: [
            { text: '🌱 Bab 1: Apa itu Inertia.js', link: '/bagian-1/bab-1' },
            { text: '🛠️ Bab 2: Setup Project', link: '/bagian-1/bab-2' },
            { text: '🧠 Bab 3: Cara Kerja Inertia', link: '/bagian-1/bab-3' },
          ],
        },
        {
          text: '🔄 Bagian II — Transisi: Laravel seperti Biasa, Vue sebagai View',
          collapsed: false,
          items: [
            { text: '🛣️ Bab 4: Routing & Controller', link: '/bagian-2/bab-4' },
            { text: '📦 Bab 5: Mengirim Data ke Vue', link: '/bagian-2/bab-5' },
            { text: '📄 Bab 6: Page Component', link: '/bagian-2/bab-6' },
            { text: '🧩 Bab 7: Layout Persisten', link: '/bagian-2/bab-7' },
          ],
        },
        {
          text: '⚙️ Bagian III — Vue di Konteks Inertia',
          collapsed: false,
          items: [
            { text: '⚡ Bab 8: Reactivity & Composition API', link: '/bagian-3/bab-8' },
            { text: '🧭 Bab 9: Navigasi dengan Inertia', link: '/bagian-3/bab-9' },
            { text: '📝 Bab 10: Form & Validasi', link: '/bagian-3/bab-10' },
          ],
        },
        {
          text: '🚀 Bagian IV — Fitur Lanjutan Inertia',
          collapsed: false,
          items: [
            { text: '🌐 Bab 11: Shared Data', link: '/bagian-4/bab-11' },
            { text: '🔐 Bab 12: Autentikasi', link: '/bagian-4/bab-12' },
            { text: '🔔 Bab 13: Flash Message', link: '/bagian-4/bab-13' },
            { text: '📤 Bab 14: File Upload', link: '/bagian-4/bab-14' },
            { text: '📄 Bab 15: Pagination', link: '/bagian-4/bab-15' },
            { text: '🛡️ Bab 16: Authorization', link: '/bagian-4/bab-16' },
            { text: '👮 Bab 17: Middleware & Role', link: '/bagian-4/bab-17' },
          ],
        },
        {
          text: '🛠️ Bagian V — Ekosistem & Tooling',
          collapsed: false,
          items: [
            { text: '🎨 Bab 18: Tailwind CSS', link: '/bagian-5/bab-18' },
            { text: '🧱 Bab 19: Komponen UI Reusable', link: '/bagian-5/bab-19' },
            { text: '🗄️ Bab 20: Pinia', link: '/bagian-5/bab-20' },
            { text: '🔍 Bab 21: SEO & SSR', link: '/bagian-5/bab-21' },
            { text: '🧪 Bab 22: Testing', link: '/bagian-5/bab-22' },
            { text: '🚀 Bab 23: Optimasi & Deploy', link: '/bagian-5/bab-23' },
          ],
        },
        {
          text: '🎯 Bagian VI — Studi Kasus',
          collapsed: false,
          items: [
            { text: '📖 Bab 24: Mini Project - Overview', link: '/bagian-6/bab-24/' },
            { text: '📘 24.1 Perencanaan Database', link: '/bagian-6/bab-24/24-1-perencanaan-database' },
            { text: '🏗️ 24.2 Setup Project', link: '/bagian-6/bab-24/24-2-setup-project' },
            { text: '🗄️ 24.3 Migration & Model', link: '/bagian-6/bab-24/24-3-migration-model' },
            { text: '🔐 24.4 Autentikasi', link: '/bagian-6/bab-24/24-4-autentikasi' },
            { text: '🎨 24.5 Layout Utama', link: '/bagian-6/bab-24/24-5-layout-utama' },
            { text: '🗂️ 24.6 Modul Project', link: '/bagian-6/bab-24/24-6-modul-project' },
            { text: '✅ 24.7 Modul Task', link: '/bagian-6/bab-24/24-7-modul-task' },
            { text: '📎 24.8 Upload Lampiran', link: '/bagian-6/bab-24/24-8-upload-lampiran' },
            { text: '💬 24.9 Komentar Task', link: '/bagian-6/bab-24/24-9-komentar-task' },
            { text: '📊 24.10 Dashboard Statistik', link: '/bagian-6/bab-24/24-10-dashboard-statistik' },
            { text: '👥 24.11 Anggota Project', link: '/bagian-6/bab-24/24-11-anggota-project' },
            { text: '🔍 24.12 Filter & Pagination', link: '/bagian-6/bab-24/24-12-filter-search-pagination' },
            { text: '✨ 24.13 Polish & Detail', link: '/bagian-6/bab-24/24-13-polish-detail' },
            { text: '🧪 24.14 Testing', link: '/bagian-6/bab-24/24-14-testing' },
            { text: '🚢 24.15 Build & Deploy', link: '/bagian-6/bab-24/24-15-build-deploy' },
          ],
        },
        {
          text: '📎 Lampiran',
          items: [
            { text: '🔖 Referensi', link: '/referensi' },
            { text: '🎉 Penutup', link: '/penutup' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/inertiajs/inertia' },
    ],

    footer: {
      message: 'Dibangun dengan semangat untuk komunitas Laravel Indonesia 🇮🇩',
      copyright: 'Edisi 2024 · Laravel 11 · Inertia.js 2.x · Vue 3',
    },

    },
})