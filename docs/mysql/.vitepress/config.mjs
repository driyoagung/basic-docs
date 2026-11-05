import { defineConfig } from 'vitepress'

const sections = [
  {
    title: 'Fondasi: Database, SQL vs NoSQL & Setup',
    chapters: [
      'Mengenal Database & DBMS',
      'SQL vs NoSQL: Peta Besar Dunia Database ⭐',
      'Konsep Database Relasional',
      'Instalasi & Setup MySQL',
    ],
  },
  {
    title: 'SQL Dasar',
    chapters: [
      'DDL: Membuat Database & Tabel',
      'CRUD: INSERT, SELECT, UPDATE, DELETE',
      'Filtering, Sorting & Fungsi',
    ],
  },
  {
    title: 'Relasi & Query Lanjutan',
    chapters: [
      'Constraint & Relasi Antar Tabel',
      'JOIN ⭐',
      'Agregasi & Pengelompokan',
      'Subquery, CTE, Window Function & UNION',
    ],
  },
  {
    title: 'Desain Database',
    chapters: [
      'ERD & Normalisasi ⭐',
      'Studi Kasus Desain: Toko Online',
    ],
  },
  {
    title: 'Index, Performa & Transaksi',
    chapters: [
      'Index ⭐',
      'EXPLAIN & Optimasi Query',
      'Transaksi, ACID & Locking ⭐',
    ],
  },
  {
    title: 'Fitur Lanjutan MySQL',
    chapters: [
      'View, Stored Procedure, Function, Trigger & Event',
      'JSON, Full-Text Search & Fitur Modern',
    ],
  },
  {
    title: 'Administrasi & Keamanan',
    chapters: [
      'User, Privilege & Keamanan',
      'Backup, Restore & Migrasi',
    ],
  },
  {
    title: 'Integrasi Aplikasi & Sekilas PostgreSQL',
    chapters: [
      'Menghubungkan MySQL ke Aplikasi',
      'Sekilas PostgreSQL & Pilihan Database Lain',
    ],
  },
  {
    title: 'Project: Database Toko Online',
    chapters: ['Project Akhir'],
  },
]

const sectionEmojis = ['🚀', '📜', '🔗', '📐', '⚡', '🧰', '🛡️', '🌐', '🏆']
const chapterEmojis = [
  '📘', '⚖️', '🧱', '🚀', '🏗️', '🔄', '🔎', '🔐', '🔗', '📊', '🧠', '📐',
  '🛒', '🗂️', '🚦', '🔒', '🧰', '🧩', '👤', '💾', '🔌', '🐘', '🏆',
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
  title: 'Ebook Database MySQL',
  description: 'Dari Nol Sampai Siap Dipakai di Project Nyata — MySQL 8.x, SQL, Desain Skema, Performa & Keamanan. Bahasa Indonesia',
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
    ['meta', { name: 'keywords', content: 'MySQL, Database, SQL, InnoDB, Normalisasi, Index, Transaksi, VitePress, Tutorial, Indonesia' }],
    ['meta', { property: 'og:title', content: 'Ebook Database MySQL — Dari Nol Sampai Siap Dipakai' }],
    ['meta', { property: 'og:description', content: 'Panduan MySQL 8.x dalam Bahasa Indonesia: SQL, desain skema, performa, keamanan, dan project toko online.' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'id_ID' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['link', { rel: 'icon', href: '/images/mysql.png', type: 'image/png' }],
  ],

  themeConfig: {
    logo: { src: '/images/mysql.png', alt: 'MySQL' },
    siteTitle: 'Ebook MySQL',

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
      { text: '🐬 Mulai Belajar', link: '/bagian-1/bab-1' },
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
          { text: 'MySQL Documentation', link: 'https://dev.mysql.com/doc/', target: '_blank', rel: 'noopener' },
          { text: 'MySQL 8.4 Reference Manual', link: 'https://dev.mysql.com/doc/refman/8.4/en/', target: '_blank', rel: 'noopener' },
          { text: 'MySQL Docker Image', link: 'https://hub.docker.com/_/mysql', target: '_blank', rel: 'noopener' },
          { text: 'PostgreSQL Documentation', link: 'https://www.postgresql.org/docs/', target: '_blank', rel: 'noopener' },
        ],
      },
    ],

    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mysql/mysql-server' },
    ],

    footer: {
      message: 'Dokumentasi open-source untuk komunitas developer Indonesia',
      copyright: '© 2026 Ebook Database MySQL — Dari Nol Sampai Siap Dipakai di Project Nyata',
    },
  },
})
