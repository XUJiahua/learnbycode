import { mkdir, readFile, writeFile, rename, rm, cp, readdir, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { staticServer } from './static-server.mjs'

const root = process.cwd(), stateDir = resolve(root, '.preview')
const statusFile = join(stateDir, 'status.json'), lock = join(stateDir, 'lock')
const owner = randomUUID(), startedAt = new Date().toISOString()
const base = `${(process.env.BASE_PATH || '/learnbycode').replace(/\/$/, '')}/`
let snapshot, server, tunnel, buildProcess, timer, closing = false, pumping = false
let lastHash, lastRequest = '', lastError
let state = { pid: process.pid, owner, startedAt, state: 'starting', publicUrl: null, base }
const json = async path => JSON.parse(await readFile(path, 'utf8'))
const exists = async path => !!await stat(path).catch(() => null)
const alive = pid => { try { process.kill(pid, 0); return true } catch { return false } }
let saving = Promise.resolve()
function save(patch) {
  const task = saving.then(async () => {
  state = { ...state, ...patch }
  const temporary = `${statusFile}.${owner}.tmp`
  await writeFile(temporary, JSON.stringify(state, null, 2) + '\n')
  await rename(temporary, statusFile)
  })
  saving = task.catch(() => {})
  return task
}
async function acquire() {
  await mkdir(stateDir, { recursive: true })
  try { await mkdir(lock) }
  catch {
    const prior = await json(join(lock, 'owner.json')).catch(() => null)
    const age = Date.now() - (await stat(lock)).mtimeMs
    if ((prior?.pid && alive(prior.pid)) || age < 30_000) {
      console.log('A preview is already running or starting. Use pnpm preview:status.'); return false
    }
    await rm(lock, { recursive: true, force: true }); await mkdir(lock)
  }
  await writeFile(join(lock, 'owner.json'), JSON.stringify({ owner, pid: process.pid }))
  await rm(join(stateDir, 'stopped'), { force: true })
  return true
}
async function fingerprint() {
  const hash = createHash('sha256')
  async function visit(path) {
    const info = await stat(path).catch(() => null)
    if (!info) return
    if (info.isDirectory()) {
      for (const name of (await readdir(path)).sort()) {
        if ([resolve(root, 'public'), resolve(root, 'public/en')].includes(path) && name === 'explainers') continue
        await visit(join(path, name))
      }
    } else { hash.update(path); hash.update(await readFile(path)) }
  }
  for (const item of ['src', 'explainers', 'public', 'scripts/render-explainers.mjs', 'scripts/check-site.mjs', 'astro.config.mjs', 'package.json', 'pnpm-lock.yaml']) await visit(resolve(root, item))
  return hash.digest('hex')
}
function validateBuild() {
  return new Promise((accept, reject) => {
    buildProcess = spawn('pnpm', ['verify'], { cwd: root, stdio: 'inherit', detached: true })
    buildProcess.once('error', reject)
    buildProcess.once('exit', code => { buildProcess = undefined; code === 0 ? accept() : reject(new Error(`pnpm verify exited ${code}`)) })
  })
}
async function refresh(request) {
  const hash = await fingerprint()
  if (hash === lastHash && snapshot) { await save({ handledRequest: request }); return }
  await save({ state: 'building', error: null })
  try {
    await validateBuild()
    if (closing) return
    const next = join(stateDir, 'sites', randomUUID())
    await cp(resolve(root, 'dist'), next, { recursive: true })
    snapshot = next
    lastHash = hash; lastError = undefined
    await save({ state: 'ready', builtAt: new Date().toISOString(), sourceHash: hash, handledRequest: request, error: null })
    for (const name of await readdir(join(stateDir, 'sites'))) {
      const previous = join(stateDir, 'sites', name)
      if (previous !== next) setTimeout(() => { void rm(previous, { recursive: true, force: true }) }, 10_000).unref()
    }
    console.log('Validated preview snapshot is ready.')
  } catch (error) {
    if (closing) return
    lastError = String(error)
    await save({ state: snapshot ? 'ready' : 'error', error: lastError, handledRequest: request })
    console.error('Preview build failed; keeping the last validated snapshot:', lastError)
  }
}
async function pump() {
  if (closing || pumping) return
  if (await exists(join(stateDir, 'stopped'))) { await close(); return }
  const request = await readFile(join(stateDir, 'refresh'), 'utf8').catch(() => '')
  if (request === lastRequest) return
  pumping = true; lastRequest = request
  try { await refresh(request) } finally { pumping = false }
}
async function close() {
  if (closing) return
  closing = true; clearInterval(timer)
  if (buildProcess?.pid) { try { process.kill(-buildProcess.pid, 'SIGTERM') } catch {} }
  tunnel?.kill('SIGTERM'); server?.close()
  await save({ state: 'stopped', publicUrl: null })
  const current = await json(join(lock, 'owner.json')).catch(() => null)
  if (current?.owner === owner) await rm(lock, { recursive: true, force: true })
  setTimeout(() => process.exit(0), 1000).unref()
}
async function start() {
  if (!await acquire()) return
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => { void close() })
  await save({})
  await refresh('initial')
  if (!snapshot) throw new Error(lastError || 'No validated snapshot')
  server = staticServer(() => snapshot, base)
  const port = Number(process.env.PASEO_PORT || process.env.PREVIEW_PORT || 0)
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid preview port')
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', accept) })
  const localPort = server.address().port
  await save({ localPort })
  const config = join(stateDir, 'cloudflared.yml')
  await writeFile(config, '{}\n')
  tunnel = spawn('cloudflared', ['tunnel', '--config', config, '--no-autoupdate', '--protocol', 'http2', '--url', `http://127.0.0.1:${localPort}`], { stdio: ['ignore', 'pipe', 'pipe'] })
  let buffer = '', published = false
  const output = chunk => {
    const text = chunk.toString(); process.stdout.write(text)
    buffer = (buffer + text).slice(-8000)
    const address = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
    if (address && !published) {
      published = true
      void save({ publicUrl: address[0] + base, englishUrl: address[0] + base + 'en/' }).then(() => console.log(`PUBLIC PREVIEW: ${address[0]}${base}`))
    }
  }
  tunnel.stdout.on('data', output); tunnel.stderr.on('data', output)
  tunnel.once('error', error => { console.error(error); void close() })
  tunnel.once('exit', code => { if (!closing) { console.error(`cloudflared exited ${code}; restart the preview service.`); void close() } })
  timer = setInterval(() => { void pump().catch(error => console.error(error)) }, 1000)
}
start().catch(async error => { console.error(error); await close(); process.exitCode = 1 })
