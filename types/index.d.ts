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

declare module 'claude-code' {
  interface PluginState {
    'hud-band': { header: Header | null }
  }
}
