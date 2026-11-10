import copy from './experiments.copy.json'
import { ablation } from '../../shared/course-models'
import { choice, element, language, setupSteps, stepCopy, text, pressed, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
const metric = element<HTMLSelectElement>('#metric'); metric.value = choice('metric', ['p50', 'p95', 'cache'] as const, 'p50')
let design = choice('design', ['super', 'without', 'neutral', 'delegate'] as const, 'super')
const labels = { super: T.super, without: T.without, neutral: T.neutral, delegate: T.delegate }
const replay = setupSteps(4, step => {
  stepCopy(T, step)
  const key = metric.value as 'p50' | 'p95' | 'cache', unit = key === 'cache' ? T.million : T.min
  const container = element('#bars'); container.replaceChildren()
  ablation.forEach(record => {
    const bar = document.createElement('div'); bar.className = 'meter'
    const label = document.createElement('span'); label.className = 'label'; label.textContent = `${record.id === design ? '↳ ' : ''}${labels[record.id]} · ${record[key].toFixed(1)} ${unit}`
    const track = document.createElement('div'); track.className = 'meter-track'
    const fill = document.createElement('div'); fill.className = 'meter-fill' + (record.id === design ? '' : ' secondary'); fill.style.setProperty('--amount', `${record[key] / (key === 'cache' ? 32 : 30) * 100}%`)
    track.append(fill); bar.append(label, track); container.append(bar)
  })
  const selected = ablation.find(record => record.id === design)!
  text('#value-p50', `${selected.p50.toFixed(1)} ${T.min}`); text('#value-p95', `${selected.p95.toFixed(1)} ${T.min}`); text('#value-cache', `${selected.cache.toFixed(1)}M`)
  text('#comparison', [T.insight0, T.insight1, T.insight2, T.insight3][ablation.indexOf(selected)])
  const difference = selected[key] - ablation[0][key]
  text('#difference', `${T.compare}: ${difference > 0 ? '+' : ''}${difference.toFixed(1)} ${unit}`)
  pressed('[data-design]', 'design', design); preserveLanguageState({ design, metric: metric.value })
})
metric.addEventListener('change', () => replay.update())
document.querySelectorAll<HTMLButtonElement>('[data-design]').forEach(button => button.addEventListener('click', () => { design = button.dataset.design as typeof design; replay.update() }))
