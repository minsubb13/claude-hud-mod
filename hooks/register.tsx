import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { Header } from '../types'
import { gaugeLine, headerLine } from './format'
import type { Line } from './format'

const header = atom({ plugin: 'hud-band', key: 'header' } as const, null)

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
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
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

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const h = await read($, header)
    if (e.props.hasSurvey || h === null) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const now = await $.clock.now()
    const row = (line: Line, key: string) => (
      <Box key={key} flexDirection="row">
        {line.map((s, i) => (
          <Text key={String(i)} color={s.color} dimColor={s.dim}>
            {s.text}
          </Text>
        ))}
      </Box>
    )
    return (
      <Box flexDirection="column">
        {row(headerLine(h), 'header')}
        {row(gaugeLine(h, now), 'gauge')}
      </Box>
    )
  })
}
