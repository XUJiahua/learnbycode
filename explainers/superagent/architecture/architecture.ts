import copy from './architecture.copy.json'
import { choice, language, setupSteps, stepCopy, text, pressed, preserveLanguageState, element } from '../../shared/steps'
const T = copy[language]
let mode = choice('mode', ['single', 'isolated', 'two'] as const, 'two')
const replay = setupSteps(3, step => {
  stepCopy(T, step)
  text('#coord-state', { single: T.singleCoord, isolated: T.isolatedCoord, two: T.twoCoord }[mode])
  text('#coordinator-name', mode === 'two' ? 'Router' : mode === 'single' ? T.single : T.isolated)
  text('#dispatch-edge', mode === 'two' ? T.dispatch : mode === 'single' ? T.sameWindow : T.separateEntries)
  const events = [T.context0, ...(step >= 1 ? [T.context1, T.context2] : []), ...(step >= 2 ? [T.context3] : [])]
  const groups = mode === 'single' ? [{ name: 'Session', events }]
    : mode === 'isolated' ? events.map((event, index) => ({ name: `Session ${index + 1}`, events: [event] }))
    : [{ name: T.workerA, events: events.filter(event => event !== T.context2) }, { name: T.workerB, events: events.filter(event => event === T.context2) }]
  const cells = element('#session-cells'); cells.replaceChildren(); cells.classList.toggle('two', mode !== 'single')
  cells.style.gridTemplateColumns = mode === 'single' ? '1fr' : ''
  for (const group of groups) {
    const cell = document.createElement('section'); cell.className = 'node-box'
    const title = document.createElement('h3'); title.textContent = group.name; cell.append(title)
    const tokens = document.createElement('div'); tokens.className = 'token-strip'
    for (const event of group.events) { const token = document.createElement('span'); token.className = 'token'; token.textContent = event; tokens.append(token) }
    if (!group.events.length) { const waiting = document.createElement('p'); waiting.textContent = T.waitingContext; cell.append(waiting) }
    cell.append(tokens); cells.append(cell)
  }
  text('#event-now', [T.event0, T.event1, T.event2][step])
  element('#coord-box').dataset.state = mode === 'isolated' ? 'blocked' : 'active'
  element('#architecture-map').dataset.state = mode
  pressed('[data-mode]', 'mode', mode); preserveLanguageState({ mode })
})
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode as typeof mode; replay.update() }))
