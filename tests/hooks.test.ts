import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'

// Answers, as the engine would, what the band reads at session start, then
// starts the session; every `on` must come before the first call on `$`.
async function startSession($: Engine, on: On): Promise<void> {
  mock.clock(on, { now: Date.parse('2026-10-02T12:00:00Z') })
  on('session.start', (_$, e) => e as never)
  on('session.model', () => ({ value: 'claude-opus-5-5[1m]' }))
  on('session.cwd', () => ({ value: '/w/proj' }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 1000000, tokens: 210000, percent: 21 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 8 }],
    },
  }))
  await $.session.start({ cwd: '/w/proj', surface: 'terminal', isInteractive: true })
}

const BAND = {
  hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 120,
  scroll: { offset: 0, bodyRows: 20 }, view: {},
}

async function bandText($: Engine): Promise<string[]> {
  const drawing = await $.ui.mount({
    plugin: 'hud-band', surface: 'terminal', component: 'AbovePrompt',
    props: BAND,
  })
  const texts = (await drawing.findAll({ type: 'Text' })).map(t => t.text ?? '')
  await drawing.unmount()
  return texts
}

test('TodoWrite passes through untouched and draws the todo', async ($, on) => {
  const todos = [
    { content: 'Write tests', status: 'completed', activeForm: 'Writing' },
    { content: 'Fix bug', status: 'in_progress', activeForm: 'Fixing' },
  ] as const
  const answer = { result: { oldTodos: [], newTodos: [...todos] } }

  on('tool.call', { tool: 'TodoWrite' }, () => answer as never)
  await startSession($, on)

  const ran = await $.tool.call({ tool: 'TodoWrite', todos: [...todos] })

  expect(ran.result).toEqual(answer.result)
  const band = (await bandText($)).join('')
  expect(band).toContain('[Opus 5.5] │ proj')
  expect(band).toContain('Context ██░░░░░░░░ 21% │ Usage █░░░░░░░░░ 8% (5h)')
  expect(band).toContain('▸ Fix bug (1/2)')
})

test('a background Agent call passes through and draws as running', async ($, on) => {
  const answer = {
    result: {
      status: 'async_launched', agentId: 'agent-7', description: 'Find code',
      prompt: 'p', outputFile: '/tmp/out',
    },
  }

  on('tool.call', { tool: 'Agent' }, () => answer as never)
  await startSession($, on)

  const ran = await $.tool.call({
    tool: 'Agent', description: 'Find code', prompt: 'p',
    subagent_type: 'Explore', model: 'haiku',
  })

  expect(ran.result).toEqual(answer.result)
  expect((await bandText($)).join('')).toContain('◐ Explore [haiku]: Find code')
})
