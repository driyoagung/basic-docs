import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ebook React',
  description: 'Panduan Lengkap Belajar React 19 dari Zero hingga Clone Airbnb — Bahasa Indonesia',
  lang: 'id-ID',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',

  head: [
    ['meta', { name: 'theme-color', content: '#61dafb' }],
    ['meta', { name: 'og:title', content: 'Ebook React — From Zero to Clone Airbnb' }],
    ['meta', { name: 'og:description', content: 'Panduan lengkap belajar React 19 dalam Bahasa Indonesia' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'id_ID' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'React' },
    siteTitle: 'Ebook React',

    nav: [
      { text: '🏠 Beranda', link: '/' },
      { text: '📖 Mulai Belajar', link: '/bagian-1/bab-1' },
      {
        text: '📚 Daftar Bagian',
        items: [
          { text: '⚛️ Bagian I — Fondasi React', link: '/bagian-1/index' },
          { text: '🪝 Bagian II — Hooks React Modern', link: '/bagian-2/index' },
          { text: '🧩 Bagian III — Pola Desain Komponen', link: '/bagian-3/index' },
          { text: '🗃️ Bagian IV — State Management', link: '/bagian-4/index' },
          { text: '🧭 Bagian V — Ekosistem React', link: '/bagian-5/index' },
          { text: '⚡ Bagian VI — Level Up', link: '/bagian-6/index' },
          { text: '🏠 Bagian VII — Project Clone Airbnb', link: '/bagian-7/index' },
        ],
      },
      {
        text: '🔗 Tautan',
        items: [
          { text: 'React Official', link: 'https://react.dev' },
          { text: 'React Docs (EN)', link: 'https://react.dev/learn' },
          { text: 'Vite', link: 'https://vitejs.dev' },
        ],
      },
    ],

    sidebar: [
      {
        text: '⚛️ Bagian I — Fondasi React',
        collapsed: false,
        items: [
          { text: '🗺️ Peta Bagian I', link: '/bagian-1/index' },
          { text: '🌟 Bab 1 — Mengenal React & Ekosistemnya', link: '/bagian-1/bab-1' },
          { text: '📦 Bab 2 — Setup & Struktur Project', link: '/bagian-1/bab-2' },
          { text: '🏗️ Bab 3 — JSX: HTML yang Lebih Powerful', link: '/bagian-1/bab-3' },
          { text: '🚦 Bab 4 — Props & Komponen', link: '/bagian-1/bab-4' },
        ],
      },
      {
        text: '🪝 Bagian II — Hooks: Jantung React Modern',
        collapsed: true,
        items: [
          { text: '🧭 Roadmap Bagian II', link: '/bagian-2/index' },
          { text: '💉 Bab 5 — useState & useEffect', link: '/bagian-2/bab-5' },
          { text: '🌐 Bab 6 — useContext & Context API', link: '/bagian-2/bab-6' },
          { text: '🎯 Bab 7 — useReducer untuk State Kompleks', link: '/bagian-2/bab-7' },
          { text: '⚡ Bab 8 — useCallback, useMemo & useRef', link: '/bagian-2/bab-8' },
          { text: '🧩 Bab 9 — Custom Hooks', link: '/bagian-2/bab-9' },
        ],
      },
      {
        text: '🧩 Bagian III — Pola Desain Komponen',
        collapsed: true,
        items: [
          { text: '🎨 Overview Bagian III', link: '/bagian-3/index' },
          { text: '🏗️ Bab 10 — Compound Components & Render Props', link: '/bagian-3/bab-10' },
          { text: '🔄 Bab 11 — Higher-Order Components & React.memo', link: '/bagian-3/bab-11' },
          { text: '🚨 Bab 12 — Error Boundaries & Suspense', link: '/bagian-3/bab-12' },
        ],
      },
      {
        text: '🗃️ Bagian IV — State Management',
        collapsed: true,
        items: [
          { text: '🏪 Ringkasan Bagian IV', link: '/bagian-4/index' },
          { text: '🏪 Bab 13 — Redux Toolkit — Global State', link: '/bagian-4/bab-13' },
          { text: '🛒 Bab 14 — Cart & Wishlist Slice', link: '/bagian-4/bab-14' },
          { text: '🔄 Bab 15 — RTK Query — Data Fetching', link: '/bagian-4/bab-15' },
          { text: '🐻 Bab 16 — Zustand — Alternatif Redux', link: '/bagian-4/bab-16' },
        ],
      },
      {
        text: '🧭 Bagian V — Ekosistem React',
        collapsed: true,
        items: [
          { text: '🌐 Overview Bagian V', link: '/bagian-5/index' },
          { text: '🗺️ Bab 17 — React Router v6 — Navigasi Halaman', link: '/bagian-5/bab-17' },
          { text: '🎭 Bab 18 — React Router Lanjutan', link: '/bagian-5/bab-18' },
          { text: '📡 Bab 19 — TanStack Query — Server State', link: '/bagian-5/bab-19' },
          { text: '📝 Bab 20 — Form Handling dengan React Hook Form', link: '/bagian-5/bab-20' },
          { text: '📞 Bab 21 — Axios & API Layer', link: '/bagian-5/bab-21' },
        ],
      },
      {
        text: '⚡ Bagian VI — Level Up',
        collapsed: true,
        items: [
          { text: '🚀 Ringkasan Bagian VI', link: '/bagian-6/index' },
          { text: '⚡ Bab 22 — Performa & Optimasi', link: '/bagian-6/bab-22' },
          { text: '🧪 Bab 23 — Testing React & Best Practices', link: '/bagian-6/bab-23' },
        ],
      },
      {
        text: '🏠 Bagian VII — Project Clone Airbnb',
        collapsed: true,
        items: [
          { text: '🎯 Capstone Overview', link: '/bagian-7/index' },
          { text: '🏠 Bab 24 — Project Clone Airbnb Lengkap', link: '/bagian-7/bab-24' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
    ],

    footer: {
      message: 'Dokumentasi open-source untuk komunitas developer Indonesia 🇮🇩',
      copyright: '© 2026 Ebook React — From Zero to Clone Airbnb',
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
