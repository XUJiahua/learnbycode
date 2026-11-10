import copy from './security.copy.json'
import { choice, element, language, setupSteps, stepCopy, text, pressed, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
let selected = choice('case', ['injection', 'credential'] as const, 'injection')
const restrict = element<HTMLInputElement>('#restrict'), opaque = element<HTMLInputElement>('#opaque')
restrict.checked = choice('restrict', ['true', 'false'] as const, 'false') === 'true'; opaque.checked = choice('opaque', ['true', 'false'] as const, 'false') === 'true'
const replay = setupSteps(4, step => {
  stepCopy(T, step)
  const attack = selected === 'injection'
  text('#source-state', attack ? T.sourceText : T.credentialText)
  text('#loop-state', step === 0 ? T.loop0 : attack ? T.loopBad : T.legitimate)
  text('#permission-state', step < 2 ? T.tool0 : !attack ? T.legitAllowed : restrict.checked ? T.toolBlocked : T.toolAllowed)
  text('#endpoint-state', step < 3 ? T.endpoint0 : attack ? restrict.checked ? T.endpointBlocked : T.endpointRisk : opaque.checked ? T.secretHidden : T.secretExposed)
  element('#agent-box').dataset.state = step > 0 ? attack ? 'blocked' : 'active' : ''
  element('#permission-box').dataset.state = step >= 2 ? attack && restrict.checked ? 'blocked' : 'active' : ''
  element('#endpoint-box').dataset.state = step >= 3 ? attack ? restrict.checked ? 'active' : 'blocked' : opaque.checked ? 'active' : 'blocked' : ''
  pressed('[data-case]', 'case', selected); preserveLanguageState({ case: selected, restrict: restrict.checked, opaque: opaque.checked })
})
document.querySelectorAll<HTMLButtonElement>('[data-case]').forEach(button => button.addEventListener('click', () => { selected = button.dataset.case as typeof selected; replay.update() }))
for (const input of [restrict, opaque]) input.addEventListener('change', () => replay.update())
