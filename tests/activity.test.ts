import { expect, test } from 'claude-code/testing'

import type { AgentRun, Todo } from '../types'
import {
  agentLines, applyTaskCreate, applyTaskUpdate, applyTodoWrite, elapsed,
  settleAgents, todoLine,
} from '../hooks/activity'
import { plain } from '../hooks/format'

const RUN: AgentRun = {
  key: 'k1',
  id: 'a1',
  type: 'Explore',
  model: 'haiku',
  description: 'Finding auth code',
  status: 'running',
  startMs: 0,
  endMs: null,
}

test('elapsed prints as claude-hud does', async () => {
  expect(elapsed(0, 500)).toBe('<1s')
  expect(elapsed(0, 42000)).toBe('42s')
  expect(elapsed(0, 135000)).toBe('2m 15s')
})

test('agent line shows status, type, model, description and time', async () => {
  expect(agentLines([RUN], 135000).map(plain))
      .toEqual(['◐ Explore [haiku]: Finding auth code (2m 15s)'])
  const done = { ...RUN, model: null, status: 'completed' as const, endMs: 5000 }
  expect(agentLines([done], 135000).map(plain))
      .toEqual(['✓ Explore: Finding auth code (5s)'])
})

test('agent lines keep running ones and two recent, three at most', async () => {
  const runs: AgentRun[] = [
    { ...RUN, key: 'r1', description: 'r1' },
    { ...RUN, key: 'r2', description: 'r2' },
    { ...RUN, key: 'c1', description: 'c1', status: 'completed', endMs: 1 },
    { ...RUN, key: 'c2', description: 'c2', status: 'completed', endMs: 1 },
    { ...RUN, key: 'c3', description: 'c3', status: 'completed', endMs: 1 },
  ]
  expect(agentLines(runs, 2000).map(l => plain(l).split(': ')[1]))
      .toEqual(['r2 (2s)', 'c2 (<1s)', 'c3 (<1s)'])
})

test('settling marks runs the list no longer reports as running', async () => {
  const runs = [RUN, { ...RUN, key: 'k2', id: 'a2' }, { ...RUN, key: 'k3', id: null }]
  const settled = settleAgents(runs,
      [{ id: 'a1', status: 'completed' }, { id: 'a2', status: 'running' }], 9000)
  expect(settled.map(r => [r.status, r.endMs])).toEqual([
    ['completed', 9000], ['running', null], ['running', null],
  ])
})

test('todo line follows TodoWrite, TaskCreate and TaskUpdate', async () => {
  let todos: Todo[] = applyTodoWrite([
    { content: 'Write tests', status: 'completed' },
    { content: 'Fix authentication bug', status: 'in_progress' },
    { content: 'Ship it', status: 'pending' },
  ])
  expect(plain(todoLine(todos)!)).toBe('▸ Fix authentication bug (1/3)')

  todos = applyTaskCreate([], 't1', 'Port the band')
  todos = applyTaskCreate(todos, 't2', 'Check it')
  expect(todoLine(todos)).toBe(null)
  todos = applyTaskUpdate(todos, 't1', { status: 'in_progress' })
  expect(plain(todoLine(todos)!)).toBe('▸ Port the band (0/2)')
  todos = applyTaskUpdate(todos, 't1', { status: 'completed' })
  todos = applyTaskUpdate(todos, 't2', { status: 'deleted' })
  expect(plain(todoLine(todos)!)).toBe('✓ All todos complete (1/1)')
})
