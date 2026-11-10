import copy from './speculation.copy.json'
import { choice, element, language, setupSteps, stepCopy, text, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
const mode = element<HTMLSelectElement>('#mode'), signal = element<HTMLSelectElement>('#signal')
mode.value = choice('mode', ['off', 'observe', 'auto'] as const, 'observe'); signal.value = choice('signal', ['simple', 'false', 'complex'] as const, 'simple')
const replay = setupSteps(4, step => {
  stepCopy(T, step)
  const allowed = mode.value === 'auto'
  text('#gate-state', step === 0 ? T.gateInitial : mode.value === 'off' ? T.noCandidate : allowed ? T.accepted : T.recordOnly)
  text('#work-state', step < 2 ? T.workInitial : !allowed ? T.observeWork : step === 2 ? T.working : signal.value === 'simple' ? T.ready : signal.value === 'false' ? T.discard : T.needsDecision)
  text('#delivery-state', step === 3 && allowed && signal.value === 'simple' ? T.deliver : T.deliveryInitial)
  element('#gate-box').dataset.state = step > 0 ? 'active' : ''
  element('#work-box').dataset.state = step >= 2 ? allowed ? 'active' : 'blocked' : ''
  element('#delivery-box').dataset.state = step === 3 && allowed && signal.value === 'simple' ? 'active' : ''
  preserveLanguageState({ mode: mode.value, signal: signal.value })
})
for (const input of [mode, signal]) input.addEventListener('change', () => replay.update())
