import { expect, test } from 'claude-code/testing'

import type { Header } from '../types'
import {
  bar, gaugeLine, headerLine, modelName, pathTail, plain, resetIn,
} from '../hooks/format'

const NOW = Date.parse('2026-10-02T12:00:00Z')

const HEADER: Header = {
  model: 'claude-opus-5-5[1m]',
  effort: 'high',
  cwd: '/home/remote3/claude-hud-mod',
  ctx: 21,
  fiveHour: 8,
  fiveHourResetsAt: '2026-10-02T15:20:00Z',
  sevenDay: 28,
  sevenDayResetsAt: '2026-10-04T16:00:00Z',
}

test('model ids become display names', async () => {
  expect(modelName('claude-opus-5-5[1m]')).toBe('Opus 5.5')
  expect(modelName('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
  expect(modelName('claude-fable-5-1')).toBe('Fable 5.1')
  expect(modelName('claude-fable-5')).toBe('Fable 5')
  expect(modelName('gpt-unknown')).toBe('gpt-unknown')
})

test('path keeps the last segment', async () => {
  expect(pathTail('/home/remote3/claude-hud-mod')).toBe('claude-hud-mod')
  expect(pathTail('/')).toBe('/')
})

test('bar fills ten cells and clamps', async () => {
  expect(plain(bar(21, 'green'))).toBe('██░░░░░░░░')
  expect(plain(bar(150, 'red'))).toBe('██████████')
  expect(plain(bar(-5, 'green'))).toBe('░░░░░░░░░░')
})

test('reset time prints as claude-hud does', async () => {
  expect(resetIn('2026-10-02T12:45:00Z', NOW)).toBe('45m')
  expect(resetIn('2026-10-02T13:00:00Z', NOW)).toBe('1h')
  expect(resetIn('2026-10-02T13:15:00Z', NOW)).toBe('1h 15m')
  expect(resetIn('2026-10-02T15:20:00Z', NOW)).toBe('3h 20m')
  expect(resetIn('2026-10-04T16:00:00Z', NOW)).toBe('52h')
  expect(resetIn('2026-10-02T11:00:00Z', NOW)).toBe('')
  expect(resetIn(null, NOW)).toBe('')
})

test('header line shows model, effort and path', async () => {
  expect(plain(headerLine(HEADER))).toBe('[Opus 5.5 | high] │ claude-hud-mod')
  expect(plain(headerLine({ ...HEADER, effort: null })))
      .toBe('[Opus 5.5] │ claude-hud-mod')
})

test('gauge line always shows both usage windows', async () => {
  expect(plain(gaugeLine(HEADER, NOW))).toBe(
      'Context ██░░░░░░░░ 21% │ Usage █░░░░░░░░░ 8% (3h 20m / 5h)' +
      ' | ███░░░░░░░ 28% (52h / 7d)')
  const empty = { ...HEADER, ctx: null, sevenDay: null, sevenDayResetsAt: null }
  expect(plain(gaugeLine(empty, NOW))).toBe(
      'Context ░░░░░░░░░░ -- │ Usage █░░░░░░░░░ 8% (3h 20m / 5h)' +
      ' | ░░░░░░░░░░ -- (7d)')
})
