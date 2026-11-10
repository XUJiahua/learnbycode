import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const state = resolve('.preview'), command = process.argv[2] || 'serve'
if (command === 'serve') await import('./preview/worker.mjs')
else if (command === 'status') {
  const data = await readFile(resolve(state, 'status.json'), 'utf8').catch(() => null)
  console.log(data || 'No public preview has been started.')
} else if (command === 'refresh') {
  await mkdir(state, { recursive: true })
  await writeFile(resolve(state, 'refresh'), randomUUID())
  console.log('Refresh requested. Check pnpm preview:status for completion and build errors.')
} else if (command === 'stop') {
  await mkdir(state, { recursive: true })
  await writeFile(resolve(state, 'stopped'), new Date().toISOString())
  console.log('Stop requested. Automatic hooks will respect this until an explicit restart.')
} else if (command === 'enable') {
  await rm(resolve(state, 'stopped'), { force: true })
  console.log('Automatic preview is enabled. Start the public-preview service or begin another agent turn.')
} else throw new Error(`Unknown preview command: ${command}`)
