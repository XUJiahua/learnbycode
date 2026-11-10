import copy from './routing.copy.json'
const language = document.documentElement.lang.startsWith('en') ? 'en' : 'zh'
const T = copy[language]
type NodeId = 'source' | 'scope' | 'thread' | 'eval' | 'worker' | 'quiet'
interface Step {
  title: string
  explanation: string
  nodes: NodeId[]
  edges: string[]
  source: 'intake' | 'evals' | 'policy' | 'delivery'
  code: string
}
interface Scenario { label: string; message: string; context: string; result: string; steps: Step[] }
const intake = (title: string, explanation: string): Step => ({ title, explanation, nodes: ['source'], edges: [], source: 'intake', code: "if (this.repo.triggers.get(trigger.id)) return 'duplicate'" })
const scope: Step = { title: T.scopeTitle, explanation: T.scopeExplanation, nodes: ['scope'], edges: ['source-scope'], source: 'intake', code: "const filter = this.options.scope.scope(trigger)\nif (!filter.listened) {\n  // Store the filtered disposition, then return\n  return 'filtered'\n}" }
const subscription: Step = { title: T.subscriptionTitle, explanation: T.subscriptionExplanation, nodes: ['thread'], edges: ['scope-thread'], source: 'intake', code: 'for (const ticketId of thread.subscriptions) {\n  const ticket = this.repo.tickets.get(ticketId)\n  // Check that the Ticket may receive input\n}' }
const evalStep: Step = { title: T.evalTitle, explanation: T.evalExplanation, nodes: ['eval'], edges: ['thread-eval'], source: 'evals', code: 'const gate = policy.gate(trigger, thread, tickets)\n// Collect admitted candidates\nthis.options.assessor.request(this.candidateOf(thread))' }
const scenarios: Record<string, Scenario> = {
  request: { label: T.requestLabel, message: T.requestMessage, context: T.requestContext, result: T.requestResult, steps: [intake(T.requestTitle, T.requestExplanation), scope, subscription, evalStep, { title: T.workerTitle, explanation: T.workerExplanation, nodes: ['worker'], edges: ['eval-worker'], source: 'delivery', code: "const sessionId = workerSessionId(ticket.id)\nconst agent = await this.host.sessions.ensure(\n  sessionId, workspace, ticket.title, 'worker'\n)" }] },
  chat: { label: T.chatLabel, message: T.chatMessage, context: T.chatContext, result: T.chatResult, steps: [intake(T.chatTitle, T.chatExplanation), scope, subscription, { title: T.rejectTitle, explanation: T.rejectExplanation, nodes: ['eval', 'quiet'], edges: ['thread-eval', 'eval-quiet'], source: 'evals', code: 'const gate = policy.gate(trigger, thread, tickets)\nif (!gate.admissible) {\n  reasons.push({ code: gate.reason, triggerId: trigger.id })\n  continue\n}\n// Record ignore and return when no candidate is admissible' }] },
  followup: { label: T.followupLabel, message: T.followupMessage, context: T.followupContext, result: T.followupResult, steps: [intake(T.followupTitle, T.followupExplanation), scope, subscription, { title: T.passTitle, explanation: T.passExplanation, nodes: ['worker'], edges: ['thread-worker'], source: 'intake', code: "this.tickets.addInput(ticket, {\n  id: key('input', ticketId, 'trigger', trigger.id),\n  kind: 'trigger', triggerId: trigger.id, at,\n})" }, { title: T.ownedTitle, explanation: T.ownedExplanation, nodes: ['worker'], edges: ['thread-worker'], source: 'intake', code: 'if (!this.owners(trigger).length)\n  this.queueForEval(trigger)\nfor (const ticketId of fanout)\n  this.tickets.wake(ticketId)' }] },
  ci: { label: T.ciLabel, message: T.ciMessage, context: T.ciContext, result: T.ciResult, steps: [intake(T.ciTitle, T.ciExplanation), scope, subscription, { title: T.ciFanoutTitle, explanation: T.ciFanoutExplanation, nodes: ['worker'], edges: ['thread-worker'], source: 'intake', code: "this.tickets.addInput(ticket, {\n  id: key('input', ticketId, 'trigger', trigger.id),\n  kind: 'trigger', triggerId: trigger.id, at,\n})" }, { title: T.ciEvalTitle, explanation: T.ciEvalExplanation, nodes: ['worker', 'eval'], edges: ['thread-worker', 'thread-eval'], source: 'intake', code: '// Human follow-ups may have owners; bot/CI use different ownership rules\nif (!this.owners(trigger).length)\n  this.queueForEval(trigger)' }] },
}
const commit = '8c32a9dc5d72c033816c6a8110b37f40cf94fba4'
const sources = {
  intake: { path: 'src/core/intake.ts', line: 19 },
  evals: { path: 'src/core/evals.ts', line: 69 },
  policy: { path: 'src/policy.ts', line: 1 },
  delivery: { path: 'src/executor/dsh.ts', line: 424 },
}
const el = <T extends HTMLElement>(selector: string): T => {
  const node = document.querySelector<T>(selector)
  if (!node) throw new Error(`Missing element: ${selector}`)
  return node
}
const params = new URLSearchParams(location.search)
let selected = Object.hasOwn(scenarios, params.get('scenario') || '') ? params.get('scenario')! : 'request'
const requestedStep = Number(params.get('step'))
let current = params.has('step') && Number.isInteger(requestedStep) ? Math.max(0, Math.min(requestedStep, scenarios[selected].steps.length - 1)) : scenarios[selected].steps.length - 1
let timer: ReturnType<typeof setInterval> | undefined
const previous = el<HTMLButtonElement>('#previous')
const next = el<HTMLButtonElement>('#next')
const play = el<HTMLButtonElement>('#play')
const progress = el<HTMLInputElement>('#progress')
const sourceLink = el<HTMLAnchorElement>('#source-link')
function stop(): void { clearInterval(timer); timer = undefined; play.textContent = T.play; play.setAttribute('aria-pressed', 'false') }
function update(): void {
  const scenario = scenarios[selected]
  const step = scenario.steps[current]
  el('#event-message').textContent = scenario.message
  el('#event-context').textContent = scenario.context
  el('#step-title').textContent = step.title
  el('#step-explanation').textContent = step.explanation
  el('#outcome').textContent = scenario.result
  el('#step-count').textContent = `${current + 1} / ${scenario.steps.length}`
  el('#code').textContent = step.code
  el('#code-note').textContent = T.codeNote
  const source = sources[step.source]
  sourceLink.href = `https://github.com/deepseek-ai/dsh-superagent-prototype/blob/${commit}/${source.path}#L${source.line}`
  sourceLink.textContent = `${source.path}:${source.line} ↗`
  previous.disabled = current === 0
  next.disabled = current === scenario.steps.length - 1
  progress.max = String(scenario.steps.length - 1)
  progress.value = String(current)
  progress.setAttribute('aria-valuetext', language === 'en' ? `Step ${current + 1}: ${step.title}` : `第 ${current + 1} 步：${step.title}`)
  const seenNodes = new Set(scenario.steps.slice(0, current + 1).flatMap(x => x.nodes))
  const seenEdges = new Set(scenario.steps.slice(0, current + 1).flatMap(x => x.edges))
  document.querySelectorAll<SVGElement>('[data-node]').forEach(node => {
    node.classList.toggle('visited', seenNodes.has(node.dataset.node as NodeId))
    node.classList.toggle('active', step.nodes.includes(node.dataset.node as NodeId))
  })
  document.querySelectorAll<SVGElement>('[data-edge]').forEach(edge => {
    edge.classList.toggle('visited', seenEdges.has(edge.dataset.edge!))
    edge.classList.toggle('active', step.edges.includes(edge.dataset.edge!))
  })
  document.querySelectorAll<HTMLButtonElement>('[data-scenario]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === selected)))
  const switcher = document.querySelector<HTMLAnchorElement>('[data-language-switch]')
  if (switcher) {
    const target = new URL(switcher.href)
    target.searchParams.set('scenario', selected)
    target.searchParams.set('step', String(current))
    switcher.href = target.href
  }
  el('#static-fallback').hidden = true
}
document.querySelectorAll<HTMLButtonElement>('[data-scenario]').forEach(button => button.addEventListener('click', () => {
  stop(); selected = button.dataset.scenario!; current = 0; update()
}))
previous.addEventListener('click', () => { stop(); current = Math.max(0, current - 1); update() })
next.addEventListener('click', () => { stop(); current = Math.min(scenarios[selected].steps.length - 1, current + 1); update() })
el('#restart').addEventListener('click', () => { stop(); current = 0; update() })
progress.addEventListener('input', () => { stop(); current = Number(progress.value); update() })
play.addEventListener('click', () => {
  if (timer) { stop(); return }
  if (current === scenarios[selected].steps.length - 1) current = 0
  update(); play.textContent = T.pause; play.setAttribute('aria-pressed', 'true')
  timer = setInterval(() => {
    current = Math.min(current + 1, scenarios[selected].steps.length - 1); update()
    if (current === scenarios[selected].steps.length - 1) stop()
  }, 2400)
})
document.addEventListener('visibilitychange', () => { if (document.hidden) stop() })
update()
el('#interaction-controls').hidden = false
el('#action-controls').hidden = false
