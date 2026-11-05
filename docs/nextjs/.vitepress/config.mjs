import { defineConfig } from 'vitepress'

const sections = [
  { title: 'Dari React ke Next.js', chapters: ['Mengenal Next.js & Ekosistemnya', 'Setup Project & Struktur Folder', 'Perbedaan Konsep: React vs Next.js'] },
  { title: 'App Router: Routing & Layout', chapters: ['File Convention & Routing System', 'Layouts, Loading & Error UI', 'Navigasi & Link'] },
  { title: 'Rendering Strategies', chapters: ['Server Components vs Client Components', 'SSR, SSG, ISR — Strategi Rendering', 'Metadata & SEO'] },
  { title: 'Data Fetching & Database', chapters: ['Data Fetching di Next.js', 'Prisma ORM — Database di Next.js', 'State Management di Next.js'] },
  { title: 'API Routes & Server Actions', chapters: ['API Routes (Route Handlers)', 'Server Actions — Cara Modern Mutasi Data', 'Middleware Next.js'] },
  { title: 'Autentikasi & Otorisasi', chapters: ['NextAuth.js (Auth.js)', 'Otorisasi & Role-Based Access'] },
  { title: 'Optimasi & Performa', chapters: ['Optimasi Gambar, Font & Script', 'Caching, Suspense & Streaming'] },
  { title: 'Deployment & CI/CD', chapters: ['Deploy ke Vercel & Best Practices'] },
  { title: 'Project Blog CMS Full Stack', chapters: ['Project: Blog CMS dengan Next.js 14'] },
]

const sectionEmojis = ['🚀', '🗂️', '🎛️', '📡', '🔌', '🔐', '🚀', '☁️', '🏗️']
const chapterEmojis = ['📘', '🔧', '🔄', '🗂️', '🧱', '🔗', '🖥️', '🎛️', '🌐', '📡', '🗃️', '🧠', '🔌', '⚡', '🚦', '🔐', '🛡️', '🚀', '💨', '☁️', '🏗️']

let chapterNumber = 0
const sidebar = sections.map((section, index) => ({
  text: `${sectionEmojis[index]} Bagian ${index + 1} — ${section.title}`,
  collapsed: index !== 0,
  items: [
    { text: '🗺️ Peta Bagian', link: `/bagian-${index + 1}/index` },
    ...section.chapters.map((chapter) => {
      chapterNumber += 1
      return { text: `${chapterEmojis[chapterNumber - 1]} Bab ${chapterNumber} — ${chapter}`, link: `/bagian-${index + 1}/bab-${chapterNumber}` }
    }),
  ],
}))

export default defineConfig({
  title: 'Ebook Next.js 14',
  description: 'Belajar Next.js 14 App Router dari React hingga project Blog CMS dalam Bahasa Indonesia',
  lang: 'id-ID',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['README.md', 'struktur-ebook-nextjs.md', 'Ebook Next.js 14*.md'],
  head: [
    ['meta', { name: 'theme-color', content: '#111827' }],
    ['meta', { name: 'og:title', content: 'Ebook Next.js 14 — Dari React ke Blog CMS' }],
    ['meta', { name: 'og:description', content: 'Panduan Next.js 14 App Router dalam Bahasa Indonesia' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'id_ID' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],
  themeConfig: {
    siteTitle: 'Ebook Next.js 14',
    nav: [
      { text: 'Beranda', link: '/' },
      { text: 'Mulai Belajar', link: '/bagian-1/bab-1' },
      { text: 'Daftar Bagian', items: sections.map((section, index) => ({
        text: `${sectionEmojis[index]} Bagian ${index + 1} — ${section.title}`,
        link: `/bagian-${index + 1}/index`,
      })) },
      { text: 'Dokumentasi Next.js', link: 'https://nextjs.org/docs' },
    ],
    sidebar,
    outline: { level: [2, 3], label: 'Daftar Isi Halaman' },
    docFooter: { prev: 'Sebelumnya', next: 'Selanjutnya' },
    search: { provider: 'local' },
    footer: { message: 'Ebook Next.js 14 dalam Bahasa Indonesia' },
  },
  markdown: {
    theme: { light: 'catppuccin-latte', dark: 'dracula' },
    lineNumbers: true,
    container: {
      tipLabel: 'Tips',
      warningLabel: 'Peringatan',
      dangerLabel: 'Bahaya',
      infoLabel: 'Informasi',
      detailsLabel: 'Detail',
    },
  },
})
