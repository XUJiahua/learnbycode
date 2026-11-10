import copy from './recall.copy.json'
import { choice, numberParam, element, language, text, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
const budget = element<HTMLInputElement>('#inline-budget'), broken = element<HTMLInputElement>('#broken-reference'), stale = element<HTMLInputElement>('#stale-reference')
budget.value = String(Math.round(numberParam('budget', 80, 20, 240) / 20) * 20)
broken.checked = choice('broken', ['true', 'false'] as const, 'false') === 'true'; stale.checked = choice('stale', ['true', 'false'] as const, 'false') === 'true'
let reads = numberParam('reads', 0, 0, 10)
function update() {
  const body = stale.checked ? T.budgetOld : T.budgetCurrent
  reads = Math.min(reads, Math.ceil(Math.max(0, body.length - Number(budget.value)) / 120))
  const end = Math.min(body.length, Number(budget.value) + reads * 120)
  text('#inline-value', budget.value); text('#window-text', body.slice(0, end)); text('#outside-text', body.slice(end) || '✓')
  text('#read-count', reads); text('#remaining-count', Math.ceil((body.length - end) / 120))
  text('#reference-result', broken.checked ? T.budgetBroken : stale.checked ? T.budgetStale : T.budgetGood)
  element<HTMLButtonElement>('#read-reference').disabled = broken.checked || end === body.length
  preserveLanguageState({ budget: budget.value, broken: broken.checked, stale: stale.checked, reads })
}
for (const input of [budget, broken, stale]) input.addEventListener('input', () => { reads = 0; update() })
element('#read-reference').addEventListener('click', () => { reads++; update() })
update()
