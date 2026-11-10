import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { staticServer } from './static-server.mjs'

test('public preview serves only the selected snapshot and can switch snapshots', async () => {
  const root = await mkdtemp(join(tmpdir(), 'learnbycode-preview-'))
  const first = join(root, 'first'), second = join(root, 'second')
  await mkdir(first); await mkdir(second)
  await writeFile(join(first, 'index.html'), 'first validated build')
  await writeFile(join(second, 'index.html'), 'second validated build')
  await writeFile(join(root, 'private.txt'), 'must not be public')
  await symlink(join(root, 'private.txt'), join(first, 'escape.txt'))
  let current = first
  const server = staticServer(() => current)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}`
  try {
    assert.equal(await (await fetch(url + '/learnbycode/')).text(), 'first validated build')
    assert.equal((await fetch(url + '/learnbycode/escape.txt')).status, 404)
    assert.equal((await fetch(url + '/learnbycode/%2e%2e%2fprivate.txt')).status, 404)
    assert.equal((await fetch(url + '/package.json')).status, 404)
    assert.equal((await fetch(url + '/learnbycode/', { method: 'POST' })).status, 405)
    assert.equal((await fetch(url + '/learnbycode/', { method: 'HEAD' })).status, 200)
    current = second
    assert.equal(await (await fetch(url + '/learnbycode/')).text(), 'second validated build')
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }) }
})
