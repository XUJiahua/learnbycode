import './recall-extra'
import copy from './recall.copy.json'
import { element, language, setupSteps, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
const cards = [
  { trigger_id: 'demo-message', thread: 'demo-chat', preview: T.full0.slice(0, 80), read: 'trigger/demo-message' },
  { thread: 'demo-chat', tickets: ['demo-login'], read: 'thread/demo-chat' },
  { ticket_id: 'demo-login', threads: [{ thread: 'demo-chat' }, { thread: 'demo-pr-42' }], assignments: { items: [{ id: 'demo-run', report: { preview: T.full3.slice(0, 80), read: 'ticket/demo-login/report/demo-run' } }] } },
  { report: 'demo-run', preview: T.full3.slice(0, 80), chars: T.full3.length, read: 'ticket/demo-login/report/demo-run' },
  { thread: 'demo-pr-42', tickets: ['demo-login'], preview: T.full4.slice(0, 80), read: 'thread/demo-pr-42' },
]
const full = [T.full0, T.full1, T.full2, T.full3, T.full4]
const titles = [T.step0Title, T.step1Title, T.step2Title, T.step3Title, T.step4Title]
const explanations = [T.step0Explanation, T.step1Explanation, T.step2Explanation, T.step3Explanation, T.step4Explanation]
const codes = [T.step0Code, T.step1Code, T.step2Code, T.step3Code, T.step4Code]
const lines = [9, 71, 60, 41, 60]
let expanded = new URLSearchParams(location.search).get('full') === 'true'
let reached = 0
const replay = setupSteps(5, step => {
  reached = Math.max(reached, step)
  element('#step-title').textContent = titles[step]
  element('#step-explanation').textContent = explanations[step]
  element('#source-code').textContent = codes[step]
  const link = element<HTMLAnchorElement>('#source-link')
  link.href = `https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/app/cards.ts#L${lines[step]}`
  link.textContent = `src/app/cards.ts:${lines[step]} ↗`
  element('#packet').textContent = JSON.stringify(expanded ? { ...cards[step], full_text: full[step] } : cards[step], null, 2)
  const toggle = element<HTMLButtonElement>('#read-full')
  toggle.textContent = expanded ? T.showPreview : T.readFull
  toggle.setAttribute('aria-pressed', String(expanded))
  document.querySelectorAll<HTMLButtonElement>('[data-resource]').forEach(button => {
    const index = Number(button.dataset.resource)
    button.disabled = index === 4 ? reached < 2 : index > reached + 1
    button.classList.toggle('selected', index === step)
    button.setAttribute('aria-pressed', String(index === step))
  })
  preserveLanguageState({ full: expanded })
})
document.querySelectorAll<HTMLButtonElement>('[data-resource]').forEach(button => button.addEventListener('click', () => replay.go(Number(button.dataset.resource))))
element('#read-full').addEventListener('click', () => { expanded = !expanded; replay.update() })
