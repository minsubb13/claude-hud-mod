# hud-band

A Claude Code mod that shows the session's status (model, effort, context, usage, agents, todos) above the prompt.

```
[Opus 5.5 | high] │ claude-hud-mod
Context ██░░░░░░░░ 21% │ Usage █░░░░░░░░░ 8% (3h 20m / 5h) | ███░░░░░░░ 28% (52h / 7d)
◐ Explore [haiku]: Finding auth code (2m 15s)
▸ Fix authentication bug (2/5)
```

Add the repository path to `env` in `~/.claude/settings.json` to load it in every session:

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "/path/to/claude-hud-mod" }
```

Run `./scripts/check.sh` to validate, type-check and test it. Tested on Claude Code 2.1.287; the mod API is in early access, so other versions may break it.
