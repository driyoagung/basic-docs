import DefaultTheme from 'vitepress/theme'
import TailwindPreview from './components/TailwindPreview.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('TailwindPreview', TailwindPreview)
  },
}
