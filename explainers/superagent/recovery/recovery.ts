import copy from './recovery.copy.json'
import { element, language, setupSteps, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
const params = new URLSearchParams(location.search)
const cases = ['crash', 'api', 'stop', 'drift'] as const
type Failure = typeof cases[number]
let selected: Failure = cases.includes(params.get('case') as Failure) ? params.get('case') as Failure : 'crash'
const proposal = element<HTMLInputElement>('#proposal')
proposal.checked = params.get('proposal') === 'true'
const titles = [T.step0Title, T.step1Title, T.step2Title, T.step3Title, T.step4Title]
const explanations = [T.step0Explanation, T.step1Explanation, T.step2Explanation, T.step3Explanation, T.step4Explanation]
const codes = [T.step0Code, T.step1Code, T.step2Code, T.step3Code, T.step4Code]
const prototype = 'https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/'
const urls = [prototype + 'docs/007-architecture.md#L149', prototype + 'docs/003-execution.md#L43', prototype + 'docs/006-deployment.md#L132', prototype + 'src/executor/dsh.ts#L524', 'https://x.com/DeepSeekHarness/status/2116857257245987236']
const replay = setupSteps(5, step => {
  element('#step-title').textContent = titles[step]
  element('#step-explanation').textContent = explanations[step]
  element('#source-code').textContent = codes[step]
  const link = element<HTMLAnchorElement>('#source-link'); link.href = urls[step]; link.textContent = ['Store / Effects', 'Execution recovery', 'Hourly check', 'DshExecutor.resume', 'Article · sections 5–6'][step] + ' ↗'
  let loop: string = T.loopInitial, watch: string = T.watchInitial
  let loopState = '', watchState = ''
  if (step > 0) {
    loop = { crash: T.crashFailure, api: T.apiFailure, stop: T.stopFailure, drift: T.driftFailure }[selected]
    loopState = selected === 'crash' ? 'down' : ''
    if (step >= 2) watch = { crash: T.checking, api: T.checking, stop: T.respectStop, drift: proposal.checked ? T.proposed : T.blind }[selected]
    if (selected === 'api' && step === 2) loop = T.retrying
    if (step >= 3) {
      loop = { crash: T.resumed, api: T.retried, stop: T.stopped, drift: proposal.checked ? T.investigate : T.humanNeeded }[selected]
      watch = selected === 'crash' ? T.restarting : watch
      loopState = selected === 'stop' ? 'down' : selected === 'drift' ? '' : 'active'
    }
    if (selected === 'drift' && proposal.checked) { loopState = 'proposal'; watchState = 'proposal' }
  }
  if (step >= 2 && selected !== 'crash') {
    if (selected === 'api') {
      element('#source-code').textContent = T.apiCode
      link.href = prototype + 'src/executor/dsh.ts#L509'; link.textContent = 'DshExecutor · retries / resumeAfter ↗'
    } else if (selected === 'stop') {
      element('#source-code').textContent = T.stopCode
      link.href = prototype + 'docs/006-deployment.md#L132'; link.textContent = 'Hourly check · --respect-stop ↗'
    } else {
      element('#source-code').textContent = proposal.checked ? T.proposedCode : T.blindCode
      link.href = proposal.checked ? urls[4] : urls[2]
      link.textContent = (proposal.checked ? 'Article · section 6' : 'Hourly check · exit 0') + ' ↗'
    }
  }
  proposal.disabled = selected !== 'drift'
  element('#loop-state').textContent = loop; element('#watch-state').textContent = watch
  element('#loop-box').dataset.state = loopState; element('#watch-box').dataset.state = watchState
  element('#store-box').dataset.state = step > 0 ? 'active' : ''
  document.querySelectorAll<HTMLButtonElement>('[data-case]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.case === selected)))
  preserveLanguageState({ case: selected, proposal: proposal.checked })
})
document.querySelectorAll<HTMLButtonElement>('[data-case]').forEach(button => button.addEventListener('click', () => { selected = button.dataset.case as Failure; replay.go(1) }))
proposal.addEventListener('change', () => replay.update())
