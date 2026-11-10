import type { PluginServerContext, PluginHookContext, PluginHookAgent, PluginTurnOutcome } from '@getpaseo/plugin/server'
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

type Context = Pick<PluginHookContext, 'paseo'>
type Event = { agent: PluginHookAgent; outcome?: PluginTurnOutcome }
const read = async (path: string): Promise<Record<string, unknown> | null> => JSON.parse(await readFile(path, 'utf8').catch(() => 'null'))
const exists = async (path: string): Promise<boolean> => !!await stat(path).catch(() => null)

/** Opt-in is per checkout. The plugin never starts services for other projects. */
export async function eligible(cwd: string): Promise<boolean> {
  try {
    const [config, pkg] = await Promise.all([read(join(cwd, '.paseo/public-preview.json')), read(join(cwd, 'package.json'))])
    return config?.enabled === true && config.project === 'learnbycode' && pkg?.name === 'learnbycode'
  } catch { return false }
}
export default function contribute(server: PluginServerContext) {
  const pending = new Map<string, Promise<void>>()
  let disposed = false
  async function ensure(event: Event, { paseo }: Context): Promise<void> {
    const { agent } = event
    if (disposed || !agent.workspaceId || agent.parentAgentId || !await eligible(agent.cwd)) return
    const stateDir = join(agent.cwd, '.preview')
    if (await exists(join(stateDir, 'stopped'))) return
    if (pending.has(agent.cwd)) return
    const task = (async () => {
      await mkdir(stateDir, { recursive: true })
      const status = await read(join(stateDir, 'status.json'))
      let running = false
      if (typeof status?.pid === 'number' && status.state !== 'stopped') {
        try { process.kill(status.pid, 0); running = true } catch {}
      }
      if (!running) {
        const workspace = paseo.workspaces.ref(agent.workspaceId!)
        const terminal = await workspace.terminals.create({
          name: 'Learn by Code · Public preview', cwd: agent.cwd,
          command: 'node', args: ['scripts/public-preview.mjs', 'serve'],
        })
        await writeFile(join(stateDir, 'terminal.json'), JSON.stringify({ id: terminal.id }))
        console.log(`Started public preview in ${agent.cwd}; terminal ${terminal.id}`)
      }
      if (event.outcome?.kind === 'completed') {
        await writeFile(join(stateDir, 'refresh'), randomUUID())
        console.log(`Preview refresh requested for ${agent.cwd}`)
      }
    })()
    pending.set(agent.cwd, task)
    try { await task } finally { pending.delete(agent.cwd) }
  }
  // Newer 0.14 builds expose addHook; released 0.14 SDKs still use on.
  const modern = server as unknown as { addHook?: (name: string, handler: (event: Event, context: Context) => Promise<void>) => () => void }
  const removers = modern.addHook
    ? [modern.addHook('agent.turn.before', ensure), modern.addHook('agent.turn.after', async (event, context) => {
        if (event.outcome?.kind === 'completed') await ensure(event, context)
      })]
    : [server.on('agent.turn_started', ensure), server.on('agent.turn_ended', async (event, context) => {
        if (event.outcome.kind === 'completed') await ensure(event, context)
      })]
  return async () => { disposed = true; removers.forEach(remove => remove()); await Promise.allSettled(pending.values()) }
}
