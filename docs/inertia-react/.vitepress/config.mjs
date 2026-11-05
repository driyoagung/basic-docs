import { defineConfig } from 'vitepress'


export default defineConfig({
  title: 'Ebook Laravel + Inertia React',
  description: 'Panduan Lengkap Laravel + Inertia.js + React — Bangun aplikasi full stack modern tanpa REST API terpisah. Laravel 11 · Inertia v2 · React 18 · Tailwind. Bahasa Indonesia',
  lang: 'id-ID',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',

  head: [
    ['meta', { name: 'theme-color', content: '#9553E9' }],
    ['meta', { name: 'og:title', content: 'Ebook Laravel + Inertia.js + React' }],
    ['meta', { name: 'og:description', content: 'Panduan lengkap membangun aplikasi full stack modern dengan Laravel, Inertia.js, dan React' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'id_ID' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'Inertia React' },
    siteTitle: 'Ebook Inertia React',

    nav: [
      { text: '🏠 Beranda', link: '/' },
      { text: '📖 Mulai Belajar', link: '/bagian-1/bab-1' },
      {
        text: '📚 Daftar Bagian',
        items: [
          { text: '🚀 Bagian I — Fondasi Inertia', link: '/bagian-1/index' },
          { text: '🧭 Bagian II — Pages, Navigasi & Layout', link: '/bagian-2/index' },
          { text: '📡 Bagian III — Data Sharing & Props', link: '/bagian-3/index' },
          { text: '📝 Bagian IV — Form, Validasi & Upload', link: '/bagian-4/index' },
          { text: '🗃️ Bagian V — CRUD & Data Table', link: '/bagian-5/index' },
          { text: '🛡️ Bagian VI — Autentikasi & Otorisasi', link: '/bagian-6/index' },
          { text: '🧪 Bagian VII — Error, SSR, Performa, Testing', link: '/bagian-7/index' },
          { text: '🏆 Bagian VIII — Project & Deployment', link: '/bagian-8/index' },
        ],
      },
      {
        text: '🔗 Tautan',
        items: [
          { text: 'Inertia.js', link: 'https://inertiajs.com', target: '_blank', rel: 'noopener' },
          { text: 'Laravel', link: 'https://laravel.com/docs', target: '_blank', rel: 'noopener' },
          { text: 'React', link: 'https://react.dev', target: '_blank', rel: 'noopener' },
          { text: 'Ziggy', link: 'https://github.com/tighten/ziggy', target: '_blank', rel: 'noopener' },
        ],
      },
    ],

    sidebar: [
      {
        text: `🚀 Bagian I — Fondasi Inertia`,
        collapsed: false,
        items: [
          { text: `🗺️ Peta Bagian I`, link: '/bagian-1/index' },
          { text: `📘 Bab 1 — Mengenal Inertia.js`, link: '/bagian-1/bab-1' },
          { text: `🔧 Bab 2 — Setup Project`, link: '/bagian-1/bab-2' },
          { text: `🔄 Bab 3 — Cara Kerja Inertia ⭐`, link: '/bagian-1/bab-3' },
        ],
      },
      {
        text: `🧭 Bagian II — Pages, Navigasi & Layout`,
        collapsed: true,
        items: [
          { text: `🗺️ Roadmap Bagian II`, link: '/bagian-2/index' },
          { text: `📄 Bab 4 — Pages & Rendering`, link: '/bagian-2/bab-4' },
          { text: `🔗 Bab 5 — Navigasi: Link & Router`, link: '/bagian-2/bab-5' },
          { text: `🪟 Bab 6 — Layout & Head`, link: '/bagian-2/bab-6' },
        ],
      },
      {
        text: `📡 Bagian III — Data Sharing & Props`,
        collapsed: true,
        items: [
          { text: `🗺️ Overview Bagian III`, link: '/bagian-3/index' },
          { text: `📡 Bab 7 — Shared Data ⭐`, link: '/bagian-3/bab-7' },
          { text: `⚡ Bab 8 — Props Lanjutan (Inertia v2)`, link: '/bagian-3/bab-8' },
        ],
      },
      {
        text: `📝 Bagian IV — Form, Validasi & Upload`,
        collapsed: true,
        items: [
          { text: `🗺️ Ringkasan Bagian IV`, link: '/bagian-4/index' },
          { text: `📝 Bab 9 — useForm & Validasi ⭐`, link: '/bagian-4/bab-9' },
          { text: `📤 Bab 10 — Upload File`, link: '/bagian-4/bab-10' },
          { text: `🔔 Bab 11 — Flash Message, Toast & UX Form`, link: '/bagian-4/bab-11' },
        ],
      },
      {
        text: `🗃️ Bagian V — CRUD & Data Table`,
        collapsed: true,
        items: [
          { text: `🗺️ Overview Bagian V`, link: '/bagian-5/index' },
          { text: `🗃️ Bab 12 — CRUD Lengkap`, link: '/bagian-5/bab-12' },
          { text: `🔎 Bab 13 — Pagination, Search & Filter`, link: '/bagian-5/bab-13' },
          { text: `🧱 Bab 14 — Membentuk Data: Eloquent Resource`, link: '/bagian-5/bab-14' },
        ],
      },
      {
        text: `🛡️ Bagian VI — Autentikasi & Otorisasi`,
        collapsed: true,
        items: [
          { text: `🗺️ Ringkasan Bagian VI`, link: '/bagian-6/index' },
          { text: `🔐 Bab 15 — Autentikasi dengan Breeze`, link: '/bagian-6/bab-15' },
          { text: `🛡️ Bab 16 — Otorisasi & RBAC di Frontend`, link: '/bagian-6/bab-16' },
        ],
      },
      {
        text: `🧪 Bagian VII — Error, SSR, Performa & Testing`,
        collapsed: true,
        items: [
          { text: `🗺️ Overview Bagian VII`, link: '/bagian-7/index' },
          { text: `⚠️ Bab 17 — Error Handling`, link: '/bagian-7/bab-17' },
          { text: `🌐 Bab 18 — SSR & SEO`, link: '/bagian-7/bab-18' },
          { text: `🚀 Bab 19 — Performa & Optimasi`, link: '/bagian-7/bab-19' },
          { text: `🧪 Bab 20 — Testing`, link: '/bagian-7/bab-20' },
        ],
      },
      {
        text: `🏆 Bagian VIII — Project & Deployment`,
        collapsed: true,
        items: [
          { text: `🗺️ Capstone Overview`, link: '/bagian-8/index' },
          { text: `🏗️ Bab 21 — Dashboard Produk + RBAC`, link: '/bagian-8/bab-21' },
          { text: `☁️ Bab 22 — Deployment`, link: '/bagian-8/bab-22' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/inertiajs/inertia' },
    ],

    footer: {
      message: 'Dokumentasi open-source untuk komunitas developer Indonesia 🇮🇩',
      copyright: '© 2026 Ebook Laravel + Inertia.js + React',
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
    'struktur-ebook-laravel-inertia-react.md',
  ],
})
