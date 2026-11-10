import copy from './routing.copy.json'
import { choice, element, language, text, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
const thread = element<HTMLSelectElement>('#fanout-thread'), sender = element<HTMLSelectElement>('#fanout-sender')
thread.value = choice('fanoutThread', ['pr', 'im'] as const, 'pr'); sender.value = choice('fanoutSender', ['human', 'ci'] as const, 'human')
const links = ['a-pr', 'a-im', 'b-pr', 'b-im'].map(id => ({ id, input: element<HTMLInputElement>(`#sub-${id}`) }))
for (const { id, input } of links) input.checked = choice(`sub-${id}`, ['true', 'false'] as const, id === 'b-im' ? 'false' : 'true') === 'true'
let handed = choice('handed', ['true', 'false'] as const, 'false') === 'true'
function update() {
  const receivers = ['a', 'b'].filter(ticket => element<HTMLInputElement>(`#sub-${ticket}-${thread.value}`).checked)
  for (const ticket of ['a', 'b']) element(`#fanout-${ticket}`).dataset.state = receivers.includes(ticket) ? 'active' : ''
  text('#fanout-result', receivers.length ? `${T.extraFanout}: ${receivers.join(', ').toUpperCase()}` : T.extraNone)
  text('#fanout-eval', sender.value === 'ci' ? T.extraBot : receivers.length ? T.extraOwned : T.extraNone)
  text('#fanout-note', handed ? T.extraReturn : T.extraNormal)
  element<HTMLButtonElement>('#fanout-handback').disabled = !receivers.includes('a')
  preserveLanguageState({ fanoutThread: thread.value, fanoutSender: sender.value, handed, ...Object.fromEntries(links.map(({ id, input }) => [`sub-${id}`, input.checked])) })
}
for (const input of [thread, sender, ...links.map(link => link.input)]) input.addEventListener('change', () => { handed = false; update() })
element('#fanout-handback').addEventListener('click', () => { element<HTMLInputElement>(`#sub-a-${thread.value}`).checked = false; handed = true; update() })
update(); document.querySelectorAll<HTMLElement>('.addon [data-interactive]').forEach(node => { node.hidden = false })
