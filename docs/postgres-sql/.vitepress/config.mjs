import { defineConfig } from 'vitepress'

const sections = [
  {
    title: 'Fondasi & Setup',
    chapters: [
      'Mengenal PostgreSQL',
      'Instalasi & Mengenal psql',
      'Struktur Logis: Cluster, Database, Schema & Role',
    ],
  },
  {
    title: 'SQL Dasar di PostgreSQL',
    chapters: [
      'DDL: Tabel & Tipe Data',
      'CRUD, RETURNING & Upsert',
      'Filtering, Fungsi & Tanggal',
    ],
  },
  {
    title: 'Relasi & Query Lanjutan',
    chapters: [
      'Constraint & Relasi',
      'JOIN ⭐',
      'Agregasi & Pengelompokan',
      'Subquery, CTE, Window Function & Fitur Query Khas',
    ],
  },
  {
    title: 'Desain Database',
    chapters: [
      'ERD, Normalisasi & Desain Skema',
      'Studi Kasus Desain: Toko Online',
    ],
  },
  {
    title: 'Fitur Khas PostgreSQL',
    chapters: [
      'JSONB ⭐',
      'Array, Enum, Range & Tipe Khusus',
      'Full-Text Search & Pencarian Fuzzy',
      'Extension',
    ],
  },
  {
    title: 'Index, Performa & Transaksi',
    chapters: [
      'Index ⭐',
      'EXPLAIN & Optimasi Query',
      'Transaksi, MVCC, Locking & VACUUM ⭐',
    ],
  },
  {
    title: 'Pemrograman di Database & Skala',
    chapters: [
      'View, Function, Trigger & Procedure',
      'Partisi, Pooling & Skala',
    ],
  },
  {
    title: 'Administrasi & Keamanan',
    chapters: [
      'Role, Hak Akses & Keamanan',
      'Backup, Restore, Replikasi & Pemeliharaan',
    ],
  },
  {
    title: 'Integrasi, Migrasi & Project',
    chapters: [
      'Menghubungkan PostgreSQL ke Aplikasi',
      'Dari MySQL ke PostgreSQL',
      'Project Akhir: Database Toko Online',
    ],
  },
]

const sectionEmojis = ['🚀', '📜', '🔗', '📐', '🧩', '⚡', '⚙️', '🛡️', '🏆']
const chapterEmojis = [
  '📘', '🚀', '🗂️', '🏗️', '🔄', '🔎', '🔐', '🔗', '📊', '🧠', '📐', '🛒', '🧩',
  '🧱', '🔤', '🧰', '🚦', '⚡', '🔒', '⚙️', '📦', '👤', '💾', '🔌', '🔀', '🏆',
]

let chapterNumber = 0
const sidebar = [
  ...sections.map((section, index) => ({
    text: `${sectionEmojis[index]} Bagian ${index + 1} — ${section.title}`,
    collapsed: index !== 0,
    items: [
      { text: '🗺️ Peta Bagian', link: `/bagian-${index + 1}/index` },
      ...section.chapters.map((chapter) => {
        chapterNumber += 1
        return {
          text: `${chapterEmojis[chapterNumber - 1]} Bab ${chapterNumber} — ${chapter}`,
          link: `/bagian-${index + 1}/bab-${chapterNumber}`,
        }
      }),
    ],
  })),
  {
    text: '🎬 Penutup',
    collapsed: true,
    items: [
      { text: '🔖 Referensi', link: '/referensi' },
      { text: '🎬 Penutup', link: '/penutup' },
    ],
  },
]

export default defineConfig({
  lang: 'id-ID',
  title: 'Ebook Database PostgreSQL',
  description: 'Dari Nol Sampai Siap Dipakai di Project Nyata — PostgreSQL 16+, SQL Modern, JSONB, Extension, MVCC, Performa & Keamanan. Bahasa Indonesia',
  cleanUrls: true,
  lastUpdated: true,

  markdown: {
    theme: {
      light: 'catppuccin-latte',
      dark: 'dracula',
    },
  },

  head: [
    ['meta', { name: 'theme-color', content: '#42b883' }],
    ['meta', { name: 'author', content: 'Tim Dokumentasi' }],
    ['meta', { name: 'keywords', content: 'PostgreSQL, Database, SQL, JSONB, MVCC, psql, Extension, Index, Transaksi, VitePress, Tutorial, Indonesia' }],
    ['meta', { property: 'og:title', content: 'Ebook Database PostgreSQL — Dari Nol Sampai Siap Dipakai' }],
    ['meta', { property: 'og:description', content: 'Panduan PostgreSQL 16+ dalam Bahasa Indonesia: SQL modern, JSONB, extension, performa, keamanan, dan project toko online.' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'id_ID' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['link', { rel: 'icon', href: '/images/postgresql.png', type: 'image/png' }],
  ],

  themeConfig: {
    logo: { src: '/images/postgresql.png', alt: 'PostgreSQL' },
    siteTitle: 'Ebook PostgreSQL',

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
      { text: '🐘 Mulai Belajar', link: '/bagian-1/bab-1' },
      {
        text: '📚 Daftar Bagian',
        items: sections.map((section, index) => ({
          text: `${sectionEmojis[index]} Bagian ${index + 1} — ${section.title}`,
          link: `/bagian-${index + 1}/index`,
        })),
      },
      {
        text: '🔗 Tautan',
        items: [
          { text: 'PostgreSQL Documentation', link: 'https://www.postgresql.org/docs/', target: '_blank', rel: 'noopener' },
          { text: 'PostgreSQL 16 Documentation', link: 'https://www.postgresql.org/docs/16/', target: '_blank', rel: 'noopener' },
          { text: 'PostgreSQL Docker Image', link: 'https://hub.docker.com/_/postgres', target: '_blank', rel: 'noopener' },
          { text: 'PostgreSQL Wiki', link: 'https://wiki.postgresql.org/', target: '_blank', rel: 'noopener' },
        ],
      },
    ],

    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/postgres/postgres' },
    ],

    footer: {
      message: 'Dokumentasi open-source untuk komunitas developer Indonesia',
      copyright: '© 2026 Ebook Database PostgreSQL — Dari Nol Sampai Siap Dipakai di Project Nyata',
    },
  },
})
