import { defineConfig } from 'vitepress'

const sections = [
  { title: 'Fondasi Vue.js', chapters: ['Mengenal Vue.js & Ekosistemnya', 'Setup & Struktur Project', 'Cara Berpikir Berbasis Komponen', 'Template Syntax & Direktif Dasar'] },
  { title: 'Core Concepts Vue 3', chapters: ['Reaktivitas Vue', 'Computed Properties & Watchers', 'Props & Emits', 'Slots', 'Lifecycle Hooks'] },
  { title: 'Options API', chapters: ['Options API — Cara Klasik Vue', 'Fitur Lanjutan Options API', 'Migrasi Mindset Options ke Composition'] },
  { title: 'Composition API', chapters: ['Composition API & script setup', 'Composables — Logika yang Bisa Dipakai Ulang', 'Template Refs & Reaktivitas Lanjutan', 'Composable Lanjutan & Patterns'] },
  { title: 'Ekosistem Vue', chapters: ['Vue Router Dasar', 'Vue Router Lanjutan & Best Practices', 'Pinia Dasar', 'Pinia Lanjutan & Best Practices', 'HTTP Request & Integrasi API'] },
  { title: 'Level Up', chapters: ['Komponen Lanjutan & Teknik Khusus', 'Performa, Testing & Best Practices'] },
  { title: 'Project Clone Netflix', chapters: ['Project Clone Netflix dengan TMDB API'] },
]

let chapterNumber = 0
const sidebar = sections.map((section, index) => ({
  text: `Bagian ${index + 1} — ${section.title}`,
  collapsed: index !== 0,
  items: [
    { text: 'Peta Bagian', link: `/bagian-${index + 1}/index` },
    ...section.chapters.map((chapter) => {
      chapterNumber += 1
      return { text: `Bab ${chapterNumber} — ${chapter}`, link: `/bagian-${index + 1}/bab-${chapterNumber}` }
    }),
  ],
}))

export default defineConfig({
  title: 'Ebook Vue.js',
  description: 'Panduan Vue 3 dalam Bahasa Indonesia, dari fondasi hingga project Clone Netflix',
  lang: 'id-ID',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['README.md'],
  head: [
    ['meta', { name: 'theme-color', content: '#42b883' }],
    ['meta', { name: 'og:title', content: 'Ebook Vue.js — Dari Fondasi ke Clone Netflix' }],
    ['meta', { name: 'og:description', content: 'Panduan Vue 3 dalam Bahasa Indonesia' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'id_ID' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],
  themeConfig: {
    siteTitle: 'Ebook Vue.js',
    nav: [
      { text: 'Beranda', link: '/' },
      { text: 'Mulai Belajar', link: '/bagian-1/bab-1' },
      { text: 'Daftar Bagian', items: sections.map((section, index) => ({
        text: `Bagian ${index + 1} — ${section.title}`,
        link: `/bagian-${index + 1}/index`,
      })) },
      { text: 'Dokumentasi Vue', link: 'https://vuejs.org/guide/introduction.html' },
    ],
    sidebar,
    outline: { level: [2, 3], label: 'Daftar Isi Halaman' },
    docFooter: { prev: 'Sebelumnya', next: 'Selanjutnya' },
    search: { provider: 'local' },
    footer: { message: 'Ebook Vue 3 dalam Bahasa Indonesia' },
  },
  markdown: {
    html: false,
    theme: { light: 'dracula', dark: 'dracula' },
    lineNumbers: true,
    config(md) {
      md.renderer.rules.code_inline = (tokens, index) =>
        `<code v-pre>${md.utils.escapeHtml(tokens[index].content)}</code>`
    },
    container: {
      tipLabel: 'Tips',
      warningLabel: 'Peringatan',
      dangerLabel: 'Bahaya',
      infoLabel: 'Informasi',
      detailsLabel: 'Detail',
    },
  },
})
