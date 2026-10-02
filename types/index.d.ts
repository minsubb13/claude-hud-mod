export type Header = {
  model: string
  effort: string | null
  cwd: string
  ctx: number | null
  fiveHour: number | null
  fiveHourResetsAt: string | null
  sevenDay: number | null
  sevenDayResetsAt: string | null
}

export type AgentRun = {
  // Tells concurrent runs apart before the Agent call returns.
  key: string
  // The agent id once the Agent call returned one; null while it starts.
  id: string | null
  type: string
  model: string | null
  description: string
  status: 'running' | 'completed'
  startMs: number
  endMs: number | null
}

export type Todo = {
  // The task id for TaskCreate todos; null for TodoWrite ones.
  id: string | null
  content: string
  status: 'pending' | 'in_progress' | 'completed'
}

export type Activity = { agents: AgentRun[]; todos: Todo[] }

declare module 'claude-code' {
  interface PluginState {
    'hud-band': { header: Header | null; activity: Activity }
  }
}
