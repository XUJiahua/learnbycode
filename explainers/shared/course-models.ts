export interface QueueLane { pending: number; active: number; busyUntil: number; done: number; calls: number }
export function queueModel(arrivals: number, capacity: number, shards: number, rounds: number): QueueLane[] {
  const lanes = Array.from({ length: shards }, () => ({ pending: 0, active: 0, busyUntil: 0, done: 0, calls: 0 }))
  let serial = 0
  for (let round = 1; round <= rounds; round++) {
    for (const lane of lanes) {
      if (lane.active && lane.busyUntil <= round) { lane.done += lane.active; lane.active = 0 }
    }
    for (let event = 0; event < arrivals; event++) lanes[serial++ % shards].pending++
    for (const lane of lanes) if (!lane.active && lane.pending) {
      lane.active = Math.min(capacity, lane.pending); lane.pending -= lane.active
      lane.busyUntil = round + 2; lane.calls++
    }
  }
  return lanes
}
export const ablation = [
  { id: 'super', p50: 12.4, p95: 15.7, cache: 23.2 },
  { id: 'without', p50: 12.6, p95: 15.5, cache: 31.8 },
  { id: 'neutral', p50: 20.4, p95: 29.5, cache: 6.1 },
  { id: 'delegate', p50: 13.8, p95: 29.0, cache: 10.8 },
] as const
export const routerMeasurements = [
  { rate: 1, batch: 1.0, requestSeconds: 2.5, decisionSeconds: 6.4 },
  { rate: 40, batch: 2.8, requestSeconds: 3.9, decisionSeconds: 1.6 },
] as const
export type JobEvent = 'start' | 'finish' | 'kill' | 'settle'
export type JobState = 'running' | 'cancel-requested' | 'cancelled' | 'finished'
export function jobState(events: readonly JobEvent[]): JobState {
  let state: JobState = 'running'
  for (const event of events) {
    if (event === 'start') state = 'running'
    if (event === 'kill' && state === 'running') state = 'cancel-requested'
    if (event === 'finish' && (state === 'running' || state === 'cancel-requested')) state = 'finished'
    if (event === 'settle' && state === 'cancel-requested') state = 'cancelled'
  }
  return state
}
