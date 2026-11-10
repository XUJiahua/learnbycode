import test from 'node:test'
import assert from 'node:assert/strict'
import { queueModel, jobState } from '../../explainers/shared/course-models.ts'

test('queue accounting conserves every arrival across capacity, load, and shard settings', () => {
  for (const arrivals of [1, 3, 8]) for (const capacity of [1, 4, 8]) for (const shards of [1, 2]) for (let rounds = 1; rounds <= 6; rounds++) {
    const lanes = queueModel(arrivals, capacity, shards, rounds)
    assert.equal(lanes.reduce((sum, lane) => sum + lane.pending + lane.active + lane.done, 0), arrivals * rounds)
    assert.ok(lanes.every(lane => lane.active <= capacity && lane.pending >= 0 && lane.done >= 0))
  }
})
test('busy batches hold new arrivals until their fixed two-round service completes', () => {
  const [first] = queueModel(3, 8, 1, 1)
  const [second] = queueModel(3, 8, 1, 2)
  const [third] = queueModel(3, 8, 1, 3)
  assert.deepEqual([first.active, first.done], [3, 0])
  assert.deepEqual([second.active, second.pending, second.done], [3, 3, 0])
  assert.deepEqual([third.active, third.pending, third.done], [6, 0, 3])
})
test('cancellation requests remain nonterminal and do not erase an observed completion', () => {
  assert.equal(jobState(['start', 'kill']), 'cancel-requested')
  assert.equal(jobState(['start', 'kill', 'settle']), 'cancelled')
  assert.equal(jobState(['start', 'finish', 'kill']), 'finished')
  assert.equal(jobState(['start', 'kill', 'finish', 'settle']), 'finished')
  assert.equal(jobState(['start', 'kill', 'settle', 'kill']), 'cancelled')
})
