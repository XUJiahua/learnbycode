import copy from './channels.copy.json'
import { choice, element, language, setupSteps, stepCopy, text, pressed, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
let channel = choice('channel', ['im', 'pr', 'email'] as const, 'im')
let cancelled = choice('cancelled', ['true', 'false'] as const, 'false') === 'true'
const direction = element<HTMLSelectElement>('#direction'); direction.value = choice('direction', ['a', 'b'] as const, 'a')
const replay = setupSteps(4, step => {
  stepCopy(T, step)
  const drafts = { im: direction.value === 'a' ? T.imA : T.imB, pr: direction.value === 'a' ? T.prA : T.prB, email: direction.value === 'a' ? T.emailA : T.emailB }
  text('#draft', cancelled ? T.cancelled : step === 0 ? T.initial : step < 3 ? direction.value === 'a' ? T.progressA : T.progressB : drafts[channel])
  element('#surface-box').dataset.state = cancelled ? 'blocked' : 'active'
  pressed('[data-channel]', 'channel', channel)
  preserveLanguageState({ channel, direction: direction.value, cancelled })
})
document.querySelectorAll<HTMLButtonElement>('[data-channel]').forEach(button => button.addEventListener('click', () => { channel = button.dataset.channel as typeof channel; replay.update() }))
direction.addEventListener('change', () => { cancelled = false; replay.update() })
element('#intervene').addEventListener('click', () => { cancelled = false; direction.value = 'b'; replay.go(2) })
element('#cancel-task').addEventListener('click', () => { cancelled = true; replay.update() })
element('#restart').addEventListener('click', () => { cancelled = false; replay.go(0) })
