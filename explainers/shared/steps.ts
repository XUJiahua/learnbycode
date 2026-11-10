export const language = document.documentElement.lang.startsWith('en') ? 'en' : 'zh'
export function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const result = document.querySelector<T>(selector)
  if (!result) throw new Error(`Missing lesson element: ${selector}`)
  return result
}
export function preserveLanguageState(state: Record<string, string | number | boolean>): void {
  const link = document.querySelector<HTMLAnchorElement>('[data-language-switch]')
  if (!link) return
  const target = new URL(link.href)
  for (const [key, value] of Object.entries(state)) target.searchParams.set(key, String(value))
  link.href = target.href
}
export function setupSteps(count: number, render: (step: number) => void, initial = 0) {
  const params = new URLSearchParams(location.search)
  const requested = params.has('step') ? Number(params.get('step')) : initial
  let current = Number.isInteger(requested) ? Math.max(0, Math.min(count - 1, requested)) : initial
  const progress = element<HTMLInputElement>('#progress')
  function update() {
    progress.max = String(count - 1); progress.value = String(current)
    progress.setAttribute('aria-valuetext', language === 'en' ? `Step ${current + 1} of ${count}` : `第 ${current + 1} 步，共 ${count} 步`)
    element<HTMLButtonElement>('#previous').disabled = current === 0
    element<HTMLButtonElement>('#next').disabled = current === count - 1
    element('#step-count').textContent = `${current + 1} / ${count}`
    render(current)
    preserveLanguageState({ step: current })
  }
  function go(next: number) { current = Math.max(0, Math.min(count - 1, next)); update() }
  element('#previous').addEventListener('click', () => go(current - 1))
  element('#next').addEventListener('click', () => go(current + 1))
  element('#restart').addEventListener('click', () => go(0))
  progress.addEventListener('input', () => go(Number(progress.value)))
  update()
  document.querySelectorAll<HTMLElement>('[data-interactive]').forEach(node => { node.hidden = false })
  element('#static-fallback').hidden = true
  return { go, update, current: () => current }
}
export function choice<const V extends readonly string[]>(key: string, values: V, fallback: V[number]): V[number] {
  const value = new URLSearchParams(location.search).get(key)
  return values.includes(value ?? '') ? value as V[number] : fallback
}
export function numberParam(key: string, fallback: number, min: number, max: number): number {
  const raw = new URLSearchParams(location.search).get(key)
  const value = raw === null ? fallback : Number(raw)
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback
}
export function pressed(selector: string, key: string, value: string): void {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[key] === value)))
}
export function text(selector: string, value: string | number): void { element(selector).textContent = String(value) }
export function stepCopy(copy: Record<string, string>, step: number): void {
  text('#step-title', copy[`step${step}Title`])
  text('#step-explanation', copy[`step${step}Explanation`])
}
