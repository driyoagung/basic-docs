import { defineConfig } from 'vitepress'
import { icon, badge } from './icons.mjs'

const bintang = badge()

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
          { text: '🟢 Bagian I — Fondasi Inertia', link: '/bagian-1/index' },
          { text: '🔵 Bagian II — Pages, Navigasi & Layout', link: '/bagian-2/index' },
          { text: '🟡 Bagian III — Data Sharing & Props', link: '/bagian-3/index' },
          { text: '🟠 Bagian IV — Form, Validasi & Upload', link: '/bagian-4/index' },
          { text: '🔴 Bagian V — CRUD & Data Table', link: '/bagian-5/index' },
          { text: '🟣 Bagian VI — Autentikasi & Otorisasi', link: '/bagian-6/index' },
          { text: '⚫ Bagian VII — Error, SSR, Performa, Testing', link: '/bagian-7/index' },
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
        text: `${icon('rocket-launch', '#16a34a')} Bagian I — Fondasi Inertia`,
        collapsed: false,
        items: [
          { text: `${icon('map')} Peta Bagian I`, link: '/bagian-1/index' },
          { text: `${icon('book-open')} Bab 1 — Mengenal Inertia.js`, link: '/bagian-1/bab-1' },
          { text: `${icon('wrench-screwdriver')} Bab 2 — Setup Project`, link: '/bagian-1/bab-2' },
          { text: `${icon('arrow-path')} Bab 3 — Cara Kerja Inertia ${bintang}`, link: '/bagian-1/bab-3' },
        ],
      },
      {
        text: `${icon('rectangle-group', '#2563eb')} Bagian II — Pages, Navigasi & Layout`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Roadmap Bagian II`, link: '/bagian-2/index' },
          { text: `${icon('document')} Bab 4 — Pages & Rendering`, link: '/bagian-2/bab-4' },
          { text: `${icon('link')} Bab 5 — Navigasi: Link & Router`, link: '/bagian-2/bab-5' },
          { text: `${icon('window')} Bab 6 — Layout & Head`, link: '/bagian-2/bab-6' },
        ],
      },
      {
        text: `${icon('share', '#d97706')} Bagian III — Data Sharing & Props`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Overview Bagian III`, link: '/bagian-3/index' },
          { text: `${icon('share')} Bab 7 — Shared Data ${bintang}`, link: '/bagian-3/bab-7' },
          { text: `${icon('bolt')} Bab 8 — Props Lanjutan (Inertia v2)`, link: '/bagian-3/bab-8' },
        ],
      },
      {
        text: `${icon('pencil-square', '#ea580c')} Bagian IV — Form, Validasi & Upload`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Ringkasan Bagian IV`, link: '/bagian-4/index' },
          { text: `${icon('pencil-square')} Bab 9 — useForm & Validasi ${bintang}`, link: '/bagian-4/bab-9' },
          { text: `${icon('arrow-up-tray')} Bab 10 — Upload File`, link: '/bagian-4/bab-10' },
          { text: `${icon('bell')} Bab 11 — Flash Message, Toast & UX Form`, link: '/bagian-4/bab-11' },
        ],
      },
      {
        text: `${icon('table-cells', '#dc2626')} Bagian V — CRUD & Data Table`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Overview Bagian V`, link: '/bagian-5/index' },
          { text: `${icon('circle-stack')} Bab 12 — CRUD Lengkap`, link: '/bagian-5/bab-12' },
          { text: `${icon('magnifying-glass')} Bab 13 — Pagination, Search & Filter`, link: '/bagian-5/bab-13' },
          { text: `${icon('table-cells')} Bab 14 — Membentuk Data: Eloquent Resource`, link: '/bagian-5/bab-14' },
        ],
      },
      {
        text: `${icon('shield-check', '#7c3aed')} Bagian VI — Autentikasi & Otorisasi`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Ringkasan Bagian VI`, link: '/bagian-6/index' },
          { text: `${icon('lock-closed')} Bab 15 — Autentikasi dengan Breeze`, link: '/bagian-6/bab-15' },
          { text: `${icon('shield-check')} Bab 16 — Otorisasi & RBAC di Frontend`, link: '/bagian-6/bab-16' },
        ],
      },
      {
        text: `${icon('bug-ant', '#64748b')} Bagian VII — Error, SSR, Performa & Testing`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Overview Bagian VII`, link: '/bagian-7/index' },
          { text: `${icon('exclamation-triangle')} Bab 17 — Error Handling`, link: '/bagian-7/bab-17' },
          { text: `${icon('globe-alt')} Bab 18 — SSR & SEO`, link: '/bagian-7/bab-18' },
          { text: `${icon('rocket-launch')} Bab 19 — Performa & Optimasi`, link: '/bagian-7/bab-19' },
          { text: `${icon('beaker')} Bab 20 — Testing`, link: '/bagian-7/bab-20' },
        ],
      },
      {
        text: `${icon('trophy', '#ca8a04')} Bagian VIII — Project & Deployment`,
        collapsed: true,
        items: [
          { text: `${icon('map')} Capstone Overview`, link: '/bagian-8/index' },
          { text: `${icon('academic-cap')} Bab 21 — Dashboard Produk + RBAC`, link: '/bagian-8/bab-21' },
          { text: `${icon('cloud-arrow-up')} Bab 22 — Deployment`, link: '/bagian-8/bab-22' },
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
      light: 'dracula',
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
