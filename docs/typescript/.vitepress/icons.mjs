import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const heroicons = require('@iconify-json/heroicons/icons.json')

export function icon(name, color, extraClass = '') {
  const entry = heroicons.icons[name]
  if (!entry) {
    throw new Error(`Ikon "${name}" tidak ditemukan di @iconify-json/heroicons`)
  }

  const style = color ? ` style="color:${color}"` : ''
  const className = `vp-sidebar-icon${extraClass ? ` ${extraClass}` : ''}`

  return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${heroicons.width} ${heroicons.height}" aria-hidden="true" focusable="false"${style}>${entry.body}</svg>`
}

export function badge(name = 'star-solid', color = '#f59e0b') {
  return icon(name, color, 'vp-sidebar-icon--badge')
}
