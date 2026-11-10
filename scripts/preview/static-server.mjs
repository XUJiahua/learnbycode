import { createServer } from 'node:http'
import { realpath, readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' }
/** Serves only the currently published static snapshot, never the source checkout. */
export function staticServer(directory, base = '/learnbycode/') {
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return }
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://preview.local').pathname)
      if (path === '/' && base !== '/') { response.writeHead(302, { Location: base }); response.end(); return }
      if (!path.startsWith(base)) { response.writeHead(404); response.end('Not found'); return }
      const root = await realpath(directory())
      let file = resolve(root, path.slice(base.length))
      if (file !== root && !file.startsWith(root + sep)) throw new Error('Outside snapshot')
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html')
      file = await realpath(file)
      if (!file.startsWith(root + sep)) throw new Error('Outside snapshot')
      const content = await readFile(file)
      response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' })
      response.end(request.method === 'HEAD' ? undefined : content)
    } catch { response.writeHead(404); response.end('Not found') }
  })
}
