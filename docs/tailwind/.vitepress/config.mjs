import { defineConfig } from 'vitepress'
import tailwindPreviewPlugin from './theme/plugins/tailwind-preview.js'

export default defineConfig({
  title: 'Ebook Tailwind CSS',
  description: 'Panduan Lengkap Tailwind CSS — dari Utility-First hingga Design System Profesional',
  lang: 'id-ID',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'light',

  head: [
    ['meta', { name: 'theme-color', content: '#42b883' }],
    ['meta', { name: 'og:title', content: 'Ebook Tailwind CSS — Panduan Lengkap' }],
    ['meta', { name: 'og:description', content: 'Panduan lengkap Tailwind CSS dalam Bahasa Indonesia' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'id_ID' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'Tailwind CSS' },
    siteTitle: 'Ebook Tailwind CSS',

    nav: [
      { text: '🏠 Beranda', link: '/' },
      { text: '📖 Mulai Belajar', link: '/bagian-1/bab-1' },
      {
        text: '📚 Daftar Bagian',
        items: [
          { text: '🎨 Bagian I — Fondasi Tailwind', link: '/bagian-1/index' },
          { text: '📐 Bagian II — Layout & Spacing', link: '/bagian-2/index' },
          { text: '🔤 Bagian III — Typography & Colors', link: '/bagian-3/index' },
          { text: '🧱 Bagian IV — Komponen UI', link: '/bagian-4/index' },
          { text: '📱 Bagian V — Responsive & Dark Mode', link: '/bagian-5/index' },
          { text: '⚙️ Bagian VI — Kustomisasi & Design System', link: '/bagian-6/index' },
          { text: '🏗️ Bagian VII — Project Landing Page', link: '/bagian-7/index' },
        ],
      },
      {
        text: '🔗 Tautan',
        items: [
          { text: 'Tailwind CSS Official', link: 'https://tailwindcss.com' },
          { text: 'Tailwind CSS Docs (EN)', link: 'https://tailwindcss.com/docs' },
          { text: 'Tailwind UI', link: 'https://tailwindui.com' },
        ],
      },
    ],

    sidebar: [
      {
        text: '🎨 Bagian I — Fondasi Tailwind CSS',
        collapsed: false,
        items: [
          { text: '🗺️ Peta Bagian I', link: '/bagian-1/index' },
          { text: '🌟 Bab 1 — Mengenal Tailwind CSS', link: '/bagian-1/bab-1' },
          { text: '🧠 Bab 2 — Cara Berpikir Utility-First', link: '/bagian-1/bab-2' },
          { text: '📝 Bab 3 — Typography & Text Utilities', link: '/bagian-1/bab-3' },
        ],
      },
      {
        text: '📐 Bagian II — Layout & Spacing',
        collapsed: true,
        items: [
          { text: '🗺️ Peta Bagian II', link: '/bagian-2/index' },
          { text: '📦 Bab 4 — Box Model, Sizing & Positioning', link: '/bagian-2/bab-4' },
          { text: '🧩 Bab 5 — Flexbox dengan Tailwind', link: '/bagian-2/bab-5' },
          { text: '🟦 Bab 6 — CSS Grid dengan Tailwind', link: '/bagian-2/bab-6' },
        ],
      },
      {
        text: '🔤 Bagian III — Typography & Colors',
        collapsed: true,
        items: [
          { text: '🗺️ Peta Bagian III', link: '/bagian-3/index' },
          { text: '🎨 Bab 7 — Sistem Warna Tailwind', link: '/bagian-3/bab-7' },
          { text: '✨ Bab 8 — Shadow, Effects & Transitions', link: '/bagian-3/bab-8' },
        ],
      },
      {
        text: '🧱 Bagian IV — Komponen UI dengan Tailwind',
        collapsed: true,
        items: [
          { text: '🗺️ Peta Bagian IV', link: '/bagian-4/index' },
          { text: '🔘 Bab 9 — Komponen Button & Form', link: '/bagian-4/bab-9' },
          { text: '🃏 Bab 10 — Card, List & Table', link: '/bagian-4/bab-10' },
          { text: '🪟 Bab 11 — Modal, Alert, Badge & Komponen Interaktif', link: '/bagian-4/bab-11' },
        ],
      },
      {
        text: '📱 Bagian V — Responsive & Dark Mode',
        collapsed: true,
        items: [
          { text: '🗺️ Peta Bagian V', link: '/bagian-5/index' },
          { text: '📱 Bab 12 — Responsive Design (Mobile-First)', link: '/bagian-5/bab-12' },
          { text: '🌙 Bab 13 — Dark Mode', link: '/bagian-5/bab-13' },
        ],
      },
      {
        text: '⚙️ Bagian VI — Kustomisasi & Design System',
        collapsed: true,
        items: [
          { text: '🗺️ Peta Bagian VI', link: '/bagian-6/index' },
          { text: '⚙️ Bab 14 — Konfigurasi tailwind.config.js', link: '/bagian-6/bab-14' },
          { text: '🎯 Bab 15 — Arbitrary Values & Direktif CSS', link: '/bagian-6/bab-15' },
          { text: '🧩 Bab 16 — Plugin Tailwind & Design Tokens', link: '/bagian-6/bab-16' },
        ],
      },
      {
        text: '🏗️ Bagian VII — Project Landing Page Modern',
        collapsed: true,
        items: [
          { text: '🎯 Peta Bagian VII', link: '/bagian-7/index' },
          { text: '🚀 Bab 17 — Landing Page SaaS Modern Lengkap', link: '/bagian-7/bab-17' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
    ],

    footer: {
      message: 'Dokumentasi open-source untuk komunitas developer Indonesia 🇮🇩',
      copyright: '© 2026 Ebook Tailwind CSS — Panduan Lengkap',
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
    languageAlias: {
      'html-tailwind': 'html',
    },
    config(md) {
      // Plugin auto-preview untuk code blocks HTML
      // Otomatis menambahkan visual preview di bawah code block
      // kecuali di-mark dengan `html no-preview`
      md.use(tailwindPreviewPlugin)
    },
  },

  ignoreDeadLinks: [
    /^https?:\/\/(www\.)?example\.com/,
    /README/,
  ],
})
