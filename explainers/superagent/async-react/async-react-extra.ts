import copy from './async-react.copy.json'
import { jobState, type JobEvent } from '../../shared/course-models'
import { choice, numberParam, element, language, text, pressed, preserveLanguageState } from '../../shared/steps'
const T = copy[language]
let race = choice('race', ['cancel', 'finish', 'overlap'] as const, 'cancel'), eventIndex = numberParam('event', 0, 0, 2)
const events: Record<typeof race, JobEvent[]> = { cancel: ['start', 'kill', 'settle'], finish: ['start', 'finish', 'kill'], overlap: ['start', 'kill', 'finish'] }
function update() {
  const observed = events[race].slice(0, eventIndex + 1), state = jobState(observed)
  text('#race-events', observed.map(event => ({ start: T.raceStart, kill: T.raceKill, finish: T.raceComplete, settle: T.raceSettle }[event])).join('\n↓\n'))
  text('#race-state', { running: T.raceRunning, 'cancel-requested': T.raceRequested, cancelled: T.raceCancelled, finished: T.raceFinished }[state])
  element('#race-box').dataset.state = state === 'cancel-requested' ? 'proposal' : 'active'
  element<HTMLButtonElement>('#race-advance').disabled = eventIndex === 2
  pressed('[data-race]', 'race', race); preserveLanguageState({ race, event: eventIndex })
}
document.querySelectorAll<HTMLButtonElement>('[data-race]').forEach(button => button.addEventListener('click', () => { race = button.dataset.race as typeof race; eventIndex = 0; update() }))
element('#race-advance').addEventListener('click', () => { eventIndex = Math.min(2, eventIndex + 1); update() })
element('#race-reset').addEventListener('click', () => { eventIndex = 0; update() })
update()
