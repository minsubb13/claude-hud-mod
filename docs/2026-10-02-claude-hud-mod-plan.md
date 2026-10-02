# Plan - claude-hud mod 이식 (2026-10-02)

계약서는 `docs/2026-10-02-claude-hud-mod-contract.md`입니다. 이 계획은 완료 조건으로 가는 경로를 안내하는 문서이고, 작업 중에 고칠 수 있습니다. 근거로 삼는 문서는 계약서입니다.

출발점은 `~/.claude/dev-mods/46c119f3-dbf7-4904-86a5-f3378fe1a7c5/hud-proto` 시제품입니다. 시제품에서 `turn.step`은 스트리밍 이벤트라서 `async function*`으로 써야 한다는 점과, `session.usage()`가 context와 rateLimits를 실제로 돌려준다는 점을 이미 확인했습니다.

모든 unit은 같은 모듈(`hooks/`)을 수정하기 때문에 순서대로 진행합니다. 병렬로 돌리지 않습니다.

## Work units

- [ ] U1 저장소 골격과 상시 로드 설정 [unit: U1 scope=.claude-plugin/**,hooks/**,types/**,scripts/**,tsconfig.json,.gitignore oracle=claude plugin validate . && jq -e '.env.CLAUDE_CODE_PLUGIN_DIRS == "/home/remote3/claude-hud-mod"' ~/.claude/settings.json && diff <(jq -S 'del(.env.CLAUDE_CODE_PLUGIN_DIRS)' ~/.claude/settings.json) <(jq -S 'del(.statusLine)' ~/.claude/settings.json.bak-hud-20261002)]
- [ ] U2 band 1~2행(모델, effort, 경로, context, usage) [unit: U2 scope=hooks/**,types/**,tests/**,scripts/** after=U1 oracle=./scripts/check.sh]
- [ ] U3 활동 줄(tools, agents, todos)을 tool.call로 수집 [unit: U3 scope=hooks/**,types/**,tests/**,scripts/** after=U2 oracle=./scripts/check.sh]
- [ ] U4 통합 점검: 시제품 삭제, 새 세션에서 로드, operator 확인 [unit: U4 scope=docs/2026-10-02-claude-hud-mod-plan.md after=U3 oracle=./scripts/check.sh && test ! -e /home/remote3/.claude/dev-mods/46c119f3-dbf7-4904-86a5-f3378fe1a7c5/hud-proto]

U1에서는 `plugin.json`, `hooks.json`, 비어 있는 `register.tsx`, 상태 계약 `types/index.d.ts`, `scripts/check.sh`를 만듭니다. `check.sh`는 validate, tsc, `claude plugin test`를 차례로 실행합니다. 그다음 settings env에 키 하나를 추가합니다.

U2에서는 시제품의 형식 함수를 claude-hud 규칙에 맞춰 옮깁니다. 바, 색상, 리셋 시간 형식, 모델 이름 변환이 여기에 해당하고, 각 함수에 테스트를 붙입니다.

U3에서는 `tool.call` 훅으로 실행 중인 도구와 완료된 도구, Agent 실행, todo 상태를 집계합니다. 집계 로직은 순수 함수로 분리해서 테스트합니다. negative control은 U2나 U3에서 한 번 수행합니다.

U4에서는 시제품 폴더를 삭제하고, operator가 새 세션을 열어 band를 확인할 때까지 hold로 기다립니다.

## Progress log

- 2026-10-02 계획을 작성했습니다.
