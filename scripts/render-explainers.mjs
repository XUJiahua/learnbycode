import { readFile, mkdir, writeFile, readdir, copyFile, rm } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { build } from 'esbuild'
import { topicSchema, slugSchema } from '../src/lib/content-schema.ts'
import { languages, languagePrefix, htmlLanguage } from '../src/lib/i18n.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const renderer = resolve(root, 'node_modules/visual-explainer/plugins/visual-explainer/kit/render.mjs')
const base = (process.env.BASE_PATH || '/learnbycode').replace(/\/$/, '')
const site = (process.env.SITE_URL || 'https://xujiahua.github.io').replace(/\/$/, '')
const review = process.argv.includes('--review')
const reviewLessons = process.argv.filter(arg => arg.startsWith('--lesson=')).map(arg => arg.slice('--lesson='.length))
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
for (const language of languages)
  await rm(resolve(root, 'public', languagePrefix(language), 'explainers'), { recursive: true, force: true })
for (const file of await readdir(resolve(root, 'src/content/topics'))) {
  if (!file.endsWith('.json')) continue
  const topic = slugSchema.parse(file.slice(0, -5))
  const data = topicSchema.parse(JSON.parse(await readFile(resolve(root, 'src/content/topics', file), 'utf8')))
  for (const lesson of data.lessons) {
    if (lesson.status !== 'published') continue
    const folder = resolve(root, 'explainers', topic, lesson.slug)
    const template = await readFile(resolve(folder, `${lesson.slug}.src.html`), 'utf8')
    const sharedStyle = template.includes('<style data-lesson-style></style>')
      ? await readFile(resolve(root, 'explainers/shared/lesson.css'), 'utf8') : ''
    const copy = JSON.parse(await readFile(resolve(folder, `${lesson.slug}.copy.json`), 'utf8'))
    if (!copy.zh || !copy.en || JSON.stringify(Object.keys(copy.zh).sort()) !== JSON.stringify(Object.keys(copy.en).sort()))
      throw new Error(`Translation keys must match: ${folder}`)
    for (const language of languages)
      for (const [key, value] of Object.entries(copy[language]))
        if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${language} copy: ${folder}/${key}`)
    const bundle = await build({ entryPoints: [resolve(folder, `${lesson.slug}.ts`)], bundle: true, write: false, format: 'iife', target: 'es2022', minify: true, legalComments: 'none' })
    const script = bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')
    if (!template.includes('<script data-interaction></script>')) throw new Error(`Missing interaction marker: ${folder}`)
    if (!template.includes('{{HTML_LANG}}')) throw new Error(`Missing HTML_LANG: ${folder}`)
    const page = language => `${base}/${languagePrefix(language)}explainers/${topic}/${lesson.slug}/`
    for (const language of languages) {
      const other = language === 'zh' ? 'en' : 'zh'
      const values = {
        HTML_LANG: htmlLanguage[language], TOPIC_URL: `${base}/${languagePrefix(language)}topics/${topic}/`,
        HOME_URL: `${base}/${languagePrefix(language)}`, PAGE_URL: site + page(language),
        ZH_URL: site + page('zh'), EN_URL: site + page('en'),
        OTHER_URL: page(other), OTHER_LANG: htmlLanguage[other], OTHER_LABEL: other === 'en' ? 'English' : '中文',
      }
      let source = template.replace('<style data-lesson-style></style>', `<style>${sharedStyle}</style>`).replace(/\{\{t:([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
        if (!Object.hasOwn(copy[language], key)) throw new Error(`Missing ${language} translation: ${key}`)
        return escape(copy[language][key])
      }).replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
        if (!Object.hasOwn(values, key)) throw new Error(`Unknown placeholder: ${key}`)
        return escape(values[key])
      })
      if (/\{\{.*?\}\}/.test(source)) throw new Error(`Unresolved placeholder: ${folder}`)
      source = source.replace('<script data-interaction></script>', `<script>${script}</script>`)
      const input = resolve(root, '.generated', language, topic, lesson.slug, `${lesson.slug}.src.html`)
      const output = resolve(dirname(input), 'index.html')
      await mkdir(dirname(input), { recursive: true })
      await writeFile(input, source)
      const checkVisual = review && (!reviewLessons.length || reviewLessons.includes(lesson.slug))
      const result = spawnSync(process.execPath, [renderer, input, '-o', output, '--root', root, ...(checkVisual ? [] : ['--no-check'])], { cwd: root, stdio: 'inherit' })
      if (result.status !== 0) throw new Error(`Visual Explainer render failed: ${language}/${topic}/${lesson.slug}`)
      const published = resolve(root, 'public', languagePrefix(language), 'explainers', topic, lesson.slug, 'index.html')
      await mkdir(dirname(published), { recursive: true })
      await copyFile(output, published)
    }
  }
}
