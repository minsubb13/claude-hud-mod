// Pure formatting for the band, following claude-hud's render rules
// (render/colors.ts, render/lines/project.ts, identity.ts, usage.ts).

import type { Header } from '../types'

export type Segment = { text: string; color?: string; dim?: boolean }
export type Line = Segment[]

const BAR_WIDTH = 10

export function plain(line: Line): string {
  return line.map(s => s.text).join('')
}

// `claude-opus-5-5[1m]` -> `Opus 5.5`, `claude-haiku-4-5-20251001` ->
// `Haiku 4.5`; anything else is shown as given.
export function modelName(id: string): string {
  const m = /^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?(?:\[[^\]]*\])?$/
      .exec(id)
  if (!m || !m[1] || !m[2]) return id
  const family = m[1].charAt(0).toUpperCase() + m[1].slice(1)
  return m[3] ? `${family} ${m[2]}.${m[3]}` : `${family} ${m[2]}`
}

export function pathTail(cwd: string): string {
  const segments = cwd.split(/[/\\]/).filter(Boolean)
  return segments.length > 0 ? segments[segments.length - 1]! : '/'
}

export function contextColor(percent: number): string {
  if (percent >= 85) return 'red'
  if (percent >= 70) return 'yellow'
  return 'green'
}

export function quotaColor(percent: number): string {
  if (percent >= 90) return 'red'
  if (percent >= 75) return 'magentaBright'
  return 'blueBright'
}

function clampPercent(percent: number): number {
  return Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0
}

export function bar(percent: number, color: string): Segment[] {
  const filled = Math.round((clampPercent(percent) / 100) * BAR_WIDTH)
  return [
    { text: '█'.repeat(filled), color },
    { text: '░'.repeat(BAR_WIDTH - filled), dim: true },
  ]
}

// Time left until `resetsAt`, as claude-hud prints it: `45m`, `3h 20m`,
// `52h`; empty when unknown or already past.
export function resetIn(resetsAt: string | null, nowMs: number): string {
  if (!resetsAt) return ''
  const diffMs = Date.parse(resetsAt) - nowMs
  if (!Number.isFinite(diffMs) || diffMs <= 0) return ''
  const mins = Math.ceil(diffMs / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
}

function quota(
  percent: number | null,
  resetsAt: string | null,
  window: string,
  nowMs: number,
): Segment[] {
  const shown: Segment = percent === null
    ? { text: '--', dim: true }
    : { text: `${percent}%`, color: contextColor(percent) }
  const reset = resetIn(resetsAt, nowMs)
  return [
    ...bar(percent ?? 0, quotaColor(percent ?? 0)),
    { text: ' ' },
    shown,
    { text: reset ? ` (${reset} / ${window})` : ` (${window})` },
  ]
}

export function headerLine(h: Header): Line {
  const tag = h.effort
      ? `[${modelName(h.model)} | ${h.effort}]`
      : `[${modelName(h.model)}]`
  return [
    { text: tag, color: 'cyan' },
    { text: ' │ ' },
    { text: pathTail(h.cwd), color: 'yellow' },
  ]
}

export function gaugeLine(h: Header, nowMs: number): Line {
  const ctx = h.ctx ?? 0
  return [
    { text: 'Context', dim: true },
    { text: ' ' },
    ...bar(ctx, contextColor(ctx)),
    { text: ' ' },
    { text: h.ctx === null ? '--' : `${h.ctx}%`, color: contextColor(ctx) },
    { text: ' │ ' },
    { text: 'Usage', dim: true },
    { text: ' ' },
    ...quota(h.fiveHour, h.fiveHourResetsAt, '5h', nowMs),
    { text: ' | ' },
    ...quota(h.sevenDay, h.sevenDayResetsAt, '7d', nowMs),
  ]
}
