// Activity the band tracks from tool calls, and its lines, following
// claude-hud's render/agents-line.ts and render/todos-line.ts.

import type { AgentRun, Todo } from '../types'
import type { Line } from './format'

const MAX_AGENTS = 3
const RECENT_COMPLETED = 2

// Applies the agent list's statuses: a run the list no longer reports as
// running is marked completed at `nowMs`, the first time it is seen so.
export function settleAgents(
  runs: readonly AgentRun[],
  listed: readonly { id: string; status: string }[],
  nowMs: number,
): AgentRun[] {
  const status = new Map(listed.map(a => [a.id, a.status]))
  return runs.map(r => {
    if (r.status !== 'running' || r.id === null) return r
    const s = status.get(r.id)
    if (s === undefined || s === 'running') return r
    return { ...r, status: 'completed', endMs: nowMs }
  })
}

export function applyTodoWrite(
  todos: readonly { content: string; status: Todo['status'] }[],
): Todo[] {
  return todos.map(t => ({ id: null, content: t.content, status: t.status }))
}

export function applyTaskCreate(
  todos: readonly Todo[],
  id: string,
  subject: string,
): Todo[] {
  return [...todos, { id, content: subject, status: 'pending' }]
}

export function applyTaskUpdate(
  todos: readonly Todo[],
  id: string,
  change: { status?: Todo['status'] | 'deleted'; subject?: string },
): Todo[] {
  if (change.status === 'deleted') return todos.filter(t => t.id !== id)
  const status = change.status
  return todos.map(t => t.id !== id ? t : {
    ...t,
    status: status ?? t.status,
    content: change.subject ?? t.content,
  })
}

function truncate(text: string, maxLen: number): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen - 3) + '...'
}

export function elapsed(startMs: number, endMs: number): string {
  const ms = endMs - startMs
  if (ms < 1000) return '<1s'
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  const mins = Math.floor(ms / 60000)
  const secs = Math.round((ms % 60000) / 1000)
  return `${mins}m ${secs}s`
}

export function agentLines(runs: readonly AgentRun[], nowMs: number): Line[] {
  const running = runs.filter(r => r.status === 'running')
  const completed = runs.filter(r => r.status === 'completed')
      .slice(-RECENT_COMPLETED)
  return [...running, ...completed].slice(-MAX_AGENTS).map(r => {
    const line: Line = r.status === 'running'
        ? [{ text: '◐', color: 'yellow' }]
        : [{ text: '✓', color: 'green' }]
    line.push({ text: ' ' }, { text: r.type, color: 'magenta' })
    if (r.model) line.push({ text: ' ' }, { text: `[${r.model}]`, dim: true })
    if (r.description) {
      line.push({ text: `: ${truncate(r.description, 40)}`, dim: true })
    }
    line.push({ text: ' ' },
        { text: `(${elapsed(r.startMs, r.endMs ?? nowMs)})`, dim: true })
    return line
  })
}

export function todoLine(todos: readonly Todo[]): Line | null {
  if (todos.length === 0) return null
  const completed = todos.filter(t => t.status === 'completed').length
  const progress = { text: ` (${completed}/${todos.length})`, dim: true }
  const current = todos.find(t => t.status === 'in_progress')
  if (current) {
    return [
      { text: '▸', color: 'yellow' },
      { text: ` ${truncate(current.content, 50)}` },
      progress,
    ]
  }
  if (completed === todos.length) {
    return [{ text: '✓', color: 'green' }, { text: ' All todos complete' },
        progress]
  }
  return null
}
