import copy from './batching.copy.json'
import { element, language, numberParam, setupSteps, stepCopy, text, preserveLanguageState } from '../../shared/steps'
import { queueModel, routerMeasurements } from '../../shared/course-models'
const T = copy[language]
const rate = element<HTMLInputElement>('#rate'), capacity = element<HTMLInputElement>('#capacity'), shards = element<HTMLSelectElement>('#shards')
rate.value = String(numberParam('rate', 3, 1, 8)); capacity.value = String(numberParam('capacity', 4, 1, 8)); shards.value = String(numberParam('shards', 1, 1, 2))
const replay = setupSteps(6, step => {
  stepCopy(T, step); text('#round', step + 1); text('#rate-value', rate.value); text('#capacity-value', capacity.value)
  const lanes = queueModel(Number(rate.value), Number(capacity.value), Number(shards.value), step + 1)
  const container = element('#queue-lanes'); container.replaceChildren()
  lanes.forEach((lane, index) => {
    const box = document.createElement('section'); box.className = 'node-box'; box.dataset.state = lane.active ? 'active' : ''
    const heading = document.createElement('h2'); heading.textContent = `Router ${T.lane} ${index + 1}`; box.append(heading)
    for (const [label, count] of [[T.pending, lane.pending], [T.active, lane.active], [T.done, lane.done], [T.calls, lane.calls]] as const) {
      const row = document.createElement('p'); row.textContent = `${label}: ${count}`; box.append(row)
    }
    const strip = document.createElement('div'); strip.className = 'token-strip'; strip.setAttribute('aria-hidden', 'true')
    for (let i = 0; i < Math.min(lane.pending + lane.active, 20); i++) { const token = document.createElement('span'); token.className = 'token' + (i >= lane.active ? ' dim' : ''); token.textContent = i < lane.active ? '▶' : '…'; strip.append(token) }
    const remaining = lane.pending + lane.active - 20
    if (remaining > 0) { const more = document.createElement('span'); more.className = 'token dim'; more.textContent = `+${remaining}`; strip.append(more) }
    box.append(strip); container.append(box)
  })
  text('#context-note', shards.value === '2' ? T.shardHint : T.sharedHint)
  preserveLanguageState({ rate: rate.value, capacity: capacity.value, shards: shards.value })
})
for (const input of [rate, capacity, shards]) input.addEventListener('input', () => replay.update())
const load = element<HTMLSelectElement>('#measurement')
load.value = String(numberParam('measurement', 0, 0, 1))
function measured() {
  const record = routerMeasurements[Number(load.value)]
  text('#measured-batch', record.batch.toFixed(1)); text('#measured-request', record.requestSeconds.toFixed(1)); text('#measured-decision', record.decisionSeconds.toFixed(1))
  for (const [id, value, max] of [['batch', record.batch, 3], ['request', record.requestSeconds, 7], ['decision', record.decisionSeconds, 7]] as const) element(`#measure-${id}`).style.setProperty('--amount', `${value / max * 100}%`)
  preserveLanguageState({ measurement: load.value })
}
load.addEventListener('change', measured); measured()
