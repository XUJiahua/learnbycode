import { readFile, stat, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse } from 'node-html-parser'

const root = resolve('dist')
const site = process.env.SITE_URL || 'https://xujiahua.github.io'
const base = `${(process.env.BASE_PATH || '/learnbycode').replace(/\/$/, '')}/`
let files = 0
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name)
    if (entry.isDirectory()) { await walk(path); continue }
    if (!entry.name.endsWith('.html')) continue
    files++
    const html = parse(await readFile(path, 'utf8'))
    if (!html.querySelector('h1')) throw new Error(`Missing h1: ${path}`)
    const lang = html.querySelector('html')?.getAttribute('lang')
    if (!['zh-CN', 'en'].includes(lang)) throw new Error(`Invalid language: ${path}`)
    const switcher = html.querySelector('[data-language-switch]')
    if (!switcher) throw new Error(`Missing language switch: ${path}`)
    const alternateLinks = html.querySelectorAll('link[rel="alternate"][hreflang]')
    if (!['zh-CN', 'en'].every(language => alternateLinks.some(link => link.getAttribute('hreflang') === language)))
      throw new Error(`Missing bilingual alternate links: ${path}`)
    const otherLanguage = lang === 'en' ? 'zh-CN' : 'en'
    const otherLink = alternateLinks.find(link => link.getAttribute('hreflang') === otherLanguage)
    if (new URL(switcher.getAttribute('href'), site).pathname !== new URL(otherLink.getAttribute('href'), site).pathname)
      throw new Error(`Language switch points at a different page: ${path}`)
    const visible = parse(html.toString())
    visible.querySelectorAll('script,style,[data-language-switch]').forEach(node => node.remove())
    if (lang === 'en' && /[\u4e00-\u9fff]/.test(visible.textContent))
      throw new Error(`Untranslated Chinese text on English page: ${path}`)
    if (/\{\{(?:t:|[A-Z_]+\}\})/.test(visible.toString())) throw new Error(`Unresolved translation: ${path}`)
    for (const element of html.querySelectorAll('[href], [src]')) {
      const raw = element.getAttribute('href') || element.getAttribute('src')
      if (!raw || /^(#|data:|mailto:|javascript:)/.test(raw)) continue
      const relative = path.slice(root.length).replaceAll('\\', '/')
      const url = new URL(raw, `${site}${base}${relative.slice(1)}`)
      if (url.origin !== new URL(site).origin) continue
      if (!url.pathname.startsWith(base)) throw new Error(`Link escapes Pages base: ${raw} in ${path}`)
      const decoded = decodeURIComponent(url.pathname.slice(base.length))
      const target = resolve(root, decoded)
      if (target !== root && !target.startsWith(root + '/')) throw new Error(`Unsafe path: ${raw}`)
      const info = await stat(target).catch(() => null)
      if (!info) throw new Error(`Broken local link: ${raw} in ${path}`)
      if (info.isDirectory()) await stat(resolve(target, 'index.html'))
    }
  }
}
await walk(root)
console.log(`Checked ${files} HTML pages: bilingual content, language switches, headings, local links and base ${base}`)
