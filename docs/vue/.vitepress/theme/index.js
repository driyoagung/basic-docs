import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './custom.css'

const { Layout } = DefaultTheme

function HeroLogos() {
  return h('div', { class: 'hero-logos' }, [
    h('img', { src: '/images/vue.png', alt: 'Vue.js', class: 'hero-logo' }),
    h('span', { class: 'hero-logo-plus' }, '+'),
    h('img', { src: '/images/javascript.png', alt: 'JavaScript', class: 'hero-logo' }),
  ])
}

export default {
  ...DefaultTheme,
  Layout: () =>
    h(Layout, null, {
      'home-hero-image': () => h(HeroLogos),
    }),
}
