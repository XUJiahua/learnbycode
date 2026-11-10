import { defineConfig } from 'astro/config'

export default defineConfig({
  site: process.env.SITE_URL || 'https://xujiahua.github.io',
  base: process.env.BASE_PATH || '/learnbycode',
  output: 'static',
  trailingSlash: 'always',
})
