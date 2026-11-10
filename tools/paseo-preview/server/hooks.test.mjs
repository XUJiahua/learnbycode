import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import contribute, { eligible } from '../index.server.ts'

test('opt-in hooks start once, refresh completed work, and respect explicit stops', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'learnbycode-hook-'))
  const handlers = new Map()
  let starts = 0
  const cleanup = contribute({ on: (name, fn) => { handlers.set(name, fn); return () => handlers.delete(name) } })
  const context = { paseo: { workspaces: { ref: () => ({ terminals: { create: async options => {
    starts++; assert.equal(options.cwd, cwd); assert.equal(options.command, 'node')
    await writeFile(join(cwd, '.preview/status.json'), JSON.stringify({ pid: process.pid, state: 'ready' }))
    return { id: 'preview-test-terminal' }
  } } }) } } }
  const agent = { id: 'agent', cwd, workspaceId: 'workspace', parentAgentId: null }
  try {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'learnbycode' }))
    assert.equal(await eligible(cwd), false)
    await mkdir(join(cwd, '.paseo'))
    await writeFile(join(cwd, '.paseo/public-preview.json'), JSON.stringify({ enabled: true, project: 'learnbycode' }))
    assert.equal(await eligible(cwd), true)
    await handlers.get('agent.turn_started')({ agent }, context)
    await handlers.get('agent.turn_started')({ agent }, context)
    assert.equal(starts, 1)
    await handlers.get('agent.turn_ended')({ agent, outcome: { kind: 'completed' } }, context)
    assert((await readFile(join(cwd, '.preview/refresh'), 'utf8')).length > 0)
    await rm(join(cwd, '.preview/refresh'))
    await handlers.get('agent.turn_ended')({ agent, outcome: { kind: 'canceled' } }, context)
    await assert.rejects(readFile(join(cwd, '.preview/refresh')))
    await writeFile(join(cwd, '.preview/stopped'), 'stopped')
    await handlers.get('agent.turn_ended')({ agent, outcome: { kind: 'completed' } }, context)
    await assert.rejects(readFile(join(cwd, '.preview/refresh')))
    assert.equal(starts, 1)
  } finally { await cleanup(); await rm(cwd, { recursive: true, force: true }) }
})
