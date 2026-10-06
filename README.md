# hud-band

[claude-hud](https://github.com/jarrodwatts/claude-hud)를 Claude Code mod로 옮긴 것입니다. 입력창 위 band에 그립니다.

```
[Opus 5.5 | high] │ claude-hud-mod
Context ██░░░░░░░░ 21% │ Usage █░░░░░░░░░ 8% (3h 20m / 5h) | ███░░░░░░░ 28% (52h / 7d)
◐ Explore [haiku]: Finding auth code (2m 15s)
▸ Fix authentication bug (2/5)
```

`~/.claude/settings.json`의 `env`에 경로를 넣으면 세션마다 로드됩니다.

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "/path/to/claude-hud-mod" }
```

검사는 `./scripts/check.sh`(validate, tsc, test)로 합니다. Claude Code 2.1.287에서 확인했으며, mod API가 EARLY ACCESS라서 다른 버전에서는 동작하지 않을 수 있습니다.
