import './async-react-extra'
import copy from './async-react.copy.json'
import { element, language, setupSteps } from '../../shared/steps'
const T = copy[language]
const titles = [T.step0Title, T.step1Title, T.step2Title, T.step3Title]
const explanations = [T.step0Explanation, T.step1Explanation, T.step2Explanation, T.step3Explanation]
const codes = [T.step0Code, T.step1Code, T.step2Code, T.step3Code]
const urls = [
  'https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/docs/003-execution.md#L23',
  'https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/cordis.patch.yml#L40',
  'https://github.com/deepseek-ai/dsh-superagent-prototype/blob/8c32a9dc5d72c033816c6a8110b37f40cf94fba4/src/executor/dsh.ts#L329',
  'https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/packages/jobs/tool-jobs/src/index.ts#L398',
]
const replay = setupSteps(4, step => {
  element('#step-title').textContent = titles[step]
  element('#step-explanation').textContent = explanations[step]
  element('#source-code').textContent = codes[step]
  const link = element<HTMLAnchorElement>('#source-link'); link.href = urls[step]; link.textContent = (step === 3 ? 'Harness · tool-jobs' : 'Prototype · ' + ['Execution', 'cordis.patch.yml', 'dsh.ts'][step]) + ' ↗'
  element('#sync-state').textContent = step === 3 ? T.sync2 : step === 0 ? T.sync0 : T.sync1
  element('#async-state').textContent = [T.async0, T.async1, T.async2, T.async3][step]
  for (const lane of ['sync', 'async']) {
    element(`#${lane}-job`).textContent = step === 3 ? T.job2 : step === 0 ? T.job0 : T.job1
    element(`#${lane}-bar`).style.setProperty('--progress', `${[20, 45, 70, 100][step]}%`)
  }
  element('#sync-input').textContent = step < 2 ? T.input0 : step === 2 ? T.inputPending : T.inputHandled
  element('#async-input').textContent = step < 2 ? T.input0 : T.inputHandled
  element<HTMLButtonElement>('#send-message').disabled = step >= 2
})
element('#send-message').addEventListener('click', () => replay.go(2))
