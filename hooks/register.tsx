import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { Activity, AgentRun, Header } from '../types'
import {
  agentLines, applyTaskCreate, applyTaskUpdate, applyTodoWrite, settleAgents,
  todoLine,
} from './activity'
import { gaugeLine, headerLine } from './format'
import type { Line } from './format'

const header = atom({ plugin: 'hud-band', key: 'header' } as const, null)
const NO_ACTIVITY: Activity = { agents: [], todos: [] }
const activity =
    atom({ plugin: 'hud-band', key: 'activity' } as const, NO_ACTIVITY)

let runSeq = 0

function limit(limits: readonly SessionRateLimit[], kind: string) {
  return limits.find(l => l.kind === kind)
}

// `effort` undefined keeps the last known effort; it arrives only with a
// model request (turn.step), so it is unknown until the first one.
async function refresh($: EngineInterface, effort?: string): Promise<void> {
  const prev = await read($, header)
  const usage = await $.session.usage()
  const fiveHour = limit(usage.rateLimits, 'five_hour')
  const sevenDay = limit(usage.rateLimits, 'seven_day')
  const h: Header = {
    model: await $.session.model(),
    effort: effort ?? prev?.effort ?? null,
    cwd: await $.session.cwd(),
    ctx: usage.context.percent ?? null,
    fiveHour: fiveHour?.percentUsed ?? null,
    fiveHourResetsAt: fiveHour?.resetsAt ?? null,
    sevenDay: sevenDay?.percentUsed ?? null,
    sevenDayResetsAt: sevenDay?.resetsAt ?? null,
  }
  await update($, header, () => h)

  const runs = (await read($, activity)).agents
  if (runs.some(r => r.status === 'running' && r.id !== null)) {
    const listed = await $.agent.list()
    const now = await $.clock.now()
    await update($, activity,
        a => ({ ...a, agents: settleAgents(a.agents, listed, now) }))
  }
}

async function updateRun(
  $: EngineInterface,
  key: string,
  change: (r: AgentRun) => AgentRun | null,
): Promise<void> {
  await update($, activity, a => ({
    ...a,
    agents: a.agents.flatMap(r => {
      if (r.key !== key) return [r]
      const changed = change(r)
      return changed ? [changed] : []
    }),
  }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await update($, activity, () => NO_ACTIVITY)
    await refresh($)
    return r
  })

  on('turn.step', async function* ($, e, next) {
    await refresh($, e.effort === undefined ? undefined : String(e.effort))
    return yield* next(e)
  })

  on('session.measure', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  // Only the main loop's calls count, as claude-hud reads the main
  // transcript; every hook passes the call on untouched.
  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const startMs = await $.clock.now()
    const key = `${startMs}-${runSeq++}`
    const run: AgentRun = {
      key,
      id: null,
      type: e.subagent_type ?? 'general-purpose',
      model: e.model ?? null,
      description: e.description,
      status: 'running',
      startMs,
      endMs: null,
    }
    await update($, activity, a => ({ ...a, agents: [...a.agents, run] }))

    const ran = await next(e)
    const result = ran.deny === undefined && !ran.isError ? ran.result : null
    const status = result && 'status' in result ? String(result.status) : null
    const id = result && 'agentId' in result ? result.agentId : null
    if (id !== null && status === 'completed') {
      const endMs = await $.clock.now()
      await updateRun($, key, r => ({ ...r, id, status: 'completed', endMs }))
    } else if (id !== null && status === 'async_launched') {
      await updateRun($, key, r => ({ ...r, id }))
    } else {
      // Denied, failed or remote: no local run to follow.
      await updateRun($, key, () => null)
    }
    return ran
  })

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId === undefined && ran.deny === undefined && !ran.isError) {
      await update($, activity, a => ({ ...a, todos: applyTodoWrite(e.todos) }))
    }
    return ran
  })

  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId === undefined && ran.deny === undefined && !ran.isError) {
      const id = ran.result.task.id
      await update($, activity,
          a => ({ ...a, todos: applyTaskCreate(a.todos, id, e.subject) }))
    }
    return ran
  })

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId === undefined && ran.deny === undefined && !ran.isError &&
        ran.result.success) {
      const change = { status: e.status, subject: e.subject }
      await update($, activity,
          a => ({ ...a, todos: applyTaskUpdate(a.todos, e.taskId, change) }))
    }
    return ran
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // Not `h`: JSX compiles to the global `h`, which a local would shadow.
    const head = await read($, header)
    if (e.props.hasSurvey || head === null) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const now = await $.clock.now()
    const { agents, todos } = await read($, activity)
    const todo = todoLine(todos)
    const lines: Line[] = [
      headerLine(head),
      gaugeLine(head, now),
      ...agentLines(agents, now),
      ...(todo ? [todo] : []),
    ]
    return (
      <Box flexDirection="column">
        {lines.map((line, n) => (
          <Box key={`line-${n}`} flexDirection="row">
            {line.map((s, i) => (
              <Text key={String(i)} color={s.color} dimColor={s.dim}>
                {s.text}
              </Text>
            ))}
          </Box>
        ))}
      </Box>
    )
  })
}
