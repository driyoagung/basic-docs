import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import TailwindPreview from './components/TailwindPreview.vue'
import './custom.css'

const { Layout } = DefaultTheme

function HeroLogos() {
  return h('div', { class: 'hero-logos' }, [
    h('img', { src: '/images/tailwindcss.png', alt: 'Tailwind CSS', class: 'hero-logo' }),
    h('span', { class: 'hero-logo-plus' }, '+'),
    h('img', { src: '/images/css3.png', alt: 'CSS3', class: 'hero-logo' }),
  ])
}

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(Layout, null, {
      'home-hero-image': () => h(HeroLogos),
    }),
  enhanceApp({ app }) {
    app.component('TailwindPreview', TailwindPreview)
  },
}
