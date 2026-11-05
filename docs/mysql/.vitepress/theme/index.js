import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './custom.css'

const { Layout } = DefaultTheme

function HeroLogos() {
  return h('div', { class: 'hero-logos' }, [
    h('img', {
      src: '/images/mysql.png',
      alt: 'MySQL',
      class: 'hero-logo hero-logo-mysql',
    }),
  ])
}

export default {
  ...DefaultTheme,
  Layout: () =>
    h(Layout, null, {
      'home-hero-image': () => h(HeroLogos),
    }),
}
