import copy from './byom.copy.json'
import { choice, element, language, setupSteps, stepCopy, text, pressed, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
let mode = choice('mode', ['local', 'cloud', 'byom'] as const, 'byom')
const online = element<HTMLInputElement>('#online'); online.checked = choice('online', ['true', 'false'] as const, 'true') === 'true'
const replay = setupSteps(4, step => {
  stepCopy(T, step)
  const local = mode === 'local', available = online.checked || !local
  text('#compute-place', local ? T.localPlace : T.cloudPlace)
  text('#state-place', local ? T.disk : T.database)
  text('#environment-place', mode === 'byom' ? T.daemon : local ? T.localPlace : T.sandbox)
  text('#compute-state', !available ? T.loopPaused : step === 3 ? T.loopRecovered : T.loopRunning)
  text('#environment-state', mode === 'cloud' ? T.cloudWork : !online.checked ? T.offlineWork : local ? T.localWork : T.byomWork)
  text('#availability', local ? T.localHint : mode === 'cloud' ? T.cloudHint : T.wait)
  element('#compute-box').dataset.state = available ? 'active' : 'blocked'
  element('#environment-box').dataset.state = mode !== 'cloud' && !online.checked ? 'blocked' : mode === 'byom' ? 'proposal' : ''
  pressed('[data-mode]', 'mode', mode); preserveLanguageState({ mode, online: online.checked })
})
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode as typeof mode; replay.update() }))
online.addEventListener('change', () => replay.update())
element('#restart-loop').addEventListener('click', () => replay.go(3))
