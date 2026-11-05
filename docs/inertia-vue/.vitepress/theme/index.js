import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './vue-green.css'

const { Layout } = DefaultTheme

function HeroLogos() {
  return h('div', { class: 'hero-logos' }, [
    h('img', {
      src: '/logos/laravel.svg',
      alt: 'Laravel',
      class: 'hero-logo hero-logo-laravel',
    }),
    h('span', { class: 'hero-logo-plus' }, '+'),
    h('img', {
      src: '/logos/vue.webp',
      alt: 'Vue.js',
      class: 'hero-logo hero-logo-vue',
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