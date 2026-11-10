import copy from './recovery.copy.json'
import { choice, element, language, text, pressed, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
let monitor = choice('monitor', ['outside', 'inside'] as const, 'outside')
const fault = element<HTMLSelectElement>('#monitor-fault'), semantic = element<HTMLInputElement>('#semantic-check')
fault.value = choice('fault', ['crash', 'stall'] as const, 'crash'); semantic.checked = choice('semantic', ['true', 'false'] as const, 'false') === 'true'
function update() {
  text('#monitor-main', fault.value === 'crash' ? T.independentDown : T.independentStalled)
  text('#monitor-state', monitor === 'inside' ? T.independentBlocked : fault.value === 'crash' ? T.independentAlive : semantic.checked ? T.independentProposed : T.independentBlind)
  element('#monitor-box').dataset.state = monitor === 'inside' ? 'blocked' : fault.value === 'stall' && semantic.checked ? 'proposal' : 'active'
  semantic.disabled = monitor === 'inside' || fault.value === 'crash'
  pressed('[data-monitor]', 'monitor', monitor); preserveLanguageState({ monitor, fault: fault.value, semantic: semantic.checked })
}
document.querySelectorAll<HTMLButtonElement>('[data-monitor]').forEach(button => button.addEventListener('click', () => { monitor = button.dataset.monitor as typeof monitor; update() }))
for (const input of [fault, semantic]) input.addEventListener('change', update)
update()
