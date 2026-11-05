import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './custom.css'

const { Layout } = DefaultTheme

function HeroLogos() {
  return h('div', { class: 'hero-logos' }, [
    h('img', { src: '/images/prisma.png', alt: 'Prisma', class: 'hero-logo' }),
    h('span', { class: 'hero-logo-plus' }, '+'),
    h('img', { src: '/images/mysql.png', alt: 'MySQL', class: 'hero-logo' }),
  ])
}

export default {
  ...DefaultTheme,
  Layout: () =>
    h(Layout, null, {
      'home-hero-image': () => h(HeroLogos),
    }),
}
