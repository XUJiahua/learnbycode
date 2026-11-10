import { languagePrefix, type Language } from './i18n'
/** All site-local links pass through the same GitHub Pages base path. */
export function sitePath(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/${path.replace(/^\/+/, '')}`
}
export function localizedPath(language: Language, path = ''): string {
  return sitePath(languagePrefix(language) + path)
}
