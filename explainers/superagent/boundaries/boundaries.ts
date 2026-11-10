import copy from './boundaries.copy.json'
import { choice, element, language, setupSteps, stepCopy, text, pressed, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
let mode = choice('mode', ['shared', 'sharded', 'isolated'] as const, 'isolated')
const permit = element<HTMLInputElement>('#permit'); permit.checked = choice('permit', ['true', 'false'] as const, 'false') === 'true'
const replay = setupSteps(4, step => {
  stepCopy(T, step)
  text('#boundary-title', { shared: T.sharedBoundary, sharded: T.shardBoundary, isolated: T.isolatedBoundary }[mode])
  text('#context-state', { shared: T.global, sharded: T.shardState, isolated: T.isolateState }[mode])
  text('#handoff', mode === 'shared' ? T.same : step < 2 ? T.waiting : permit.checked ? T.envelope : T.blocked)
  text('#boundary-note', mode === 'shared' ? T.same : T.proposal)
  permit.disabled = mode === 'shared'
  pressed('[data-mode]', 'mode', mode); preserveLanguageState({ mode, permit: permit.checked })
})
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode as typeof mode; replay.update() }))
permit.addEventListener('change', () => replay.update())
