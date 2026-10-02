# Contract - claude-hud mod 이식 (2026-10-02)

No load-bearing decision absent from this contract proceeds: stop and bring the question.

Pin: start commit d85df47
Approval: wade 2026-10-02 - verification state at approval: 시제품 hud-proto가 이 세션에서 band와 status 줄로 표시되는 것을 operator가 눈으로 확인함(effort `high`, ctx 21%, 5h 8%, 7d 28%). 이식 코드는 아직 없음

## Completion conditions

모든 조건이 충족되어야 합니다. 일부만 진행된 상태는 완료로 인정하지 않습니다.

1. `~/claude-hud-mod`가 Claude Code mod로 동작합니다. `.claude-plugin/plugin.json`, `hooks/hooks.json`, `hooks/register.tsx`, `types/index.d.ts`를 갖추고, `claude plugin validate`가 오류 없이 통과합니다.
2. 이 mod는 `AbovePrompt` band 하나에만 그립니다. `$.ui.status`는 호출하지 않습니다. band에는 다음 내용이 이 순서로 나옵니다.
   - 1행: `[<모델 표시 이름> | <effort>] │ <cwd의 마지막 경로 한 단계>`. git 정보는 넣지 않습니다.
   - 2행: `Context <색상 바> <percent>% │ Usage <바> <5h %> (<리셋까지 남은 시간> / 5h) | <바> <7d %> (<리셋까지 남은 시간> / 7d)`. 7d는 값과 상관없이 항상 표시합니다. 값이 없으면 `--`로 표시합니다.
   - 그 아래 활동 줄: claude-hud의 `tools-line.ts`, `agents-line.ts`, `todos-line.ts`와 같은 규칙으로 그리는 tools 줄, agents 줄(최대 3개), todos 줄입니다. 표시할 내용이 없는 줄은 생략합니다.
   - config counts 줄과 경과 시간은 표시하지 않습니다.
3. 활동 데이터는 transcript 파일을 파싱하지 않고 `tool.call` 훅으로 수집합니다. todos는 `TodoWrite`, `TaskCreate`, `TaskUpdate`로, agents는 `Agent`로 수집합니다.
4. 형식을 만드는 함수와 활동을 집계하는 함수에 대한 테스트가 `claude plugin test`로 통과하고, `tsc` 타입 검사가 exit 0입니다. 둘 중 최소 하나는 일부러 고장 낸 뒤 실패하는지 확인하고 되돌립니다(negative control).
5. `~/.claude/settings.json`의 `env`에 `CLAUDE_CODE_PLUGIN_DIRS`가 `~/claude-hud-mod`를 가리키도록 추가됩니다. 백업 `settings.json.bak-hud-20261002`와 비교하면 차이는 이 키 하나와 앞서 제거한 `statusLine`뿐입니다.
6. 이 세션 전용 시제품 폴더 `~/.claude/dev-mods/46c119f3-dbf7-4904-86a5-f3378fe1a7c5/hud-proto`를 삭제해서 band가 두 개 그려지지 않게 합니다.
7. 새 세션에서 mod가 로드되어 band가 위 2번의 구성대로 보이는 것을 operator가 눈으로 확인합니다.

Verification (oracles): 1번은 `claude plugin validate`, 2~4번은 `scripts/check.sh`(validate, tsc, plugin test 실행)와 negative control, 5번은 `jq`로 정렬한 settings와 백업 비교, 6번은 `test ! -e`, 7번은 operator 판단입니다.

Not answered: toast, 자동 compact처럼 행동하는 기능, claude-hud 플러그인을 최종적으로 어떻게 처리할지, mod API(EARLY ACCESS)가 바뀔 때 어떻게 대응할지, 성능 비교는 이번 run에서 다루지 않습니다.

## Forbidden rows

- Write scope: 이 zone 안의 mod 소스와 문서 [machine: write-scope hooks/**]
- Write scope [machine: write-scope types/**]
- Write scope [machine: write-scope tests/**]
- Write scope [machine: write-scope scripts/**]
- Write scope [machine: write-scope .claude-plugin/**]
- Write scope [machine: write-scope tsconfig.json]
- Write scope [machine: write-scope .gitignore]
- Write scope [machine: write-scope docs/2026-10-02-claude-hud-mod-plan.md]
- zone 밖에서 쓸 수 있는 곳은 두 군데뿐입니다. 하나는 `~/.claude/settings.json`의 `env.CLAUDE_CODE_PLUGIN_DIRS` 키 하나이고, 다른 하나는 위 6번의 hud-proto 폴더 삭제입니다. 이 두 작업은 계약으로 미리 허가합니다. file tool이 zone 밖이라는 이유로 거부하면 shell로 수행하고, 그 사실을 바로 보고합니다 [self-report]
- `settings.json`의 다른 키는 건드리지 않습니다. `statusLine`도 다시 넣거나 바꾸지 않습니다 [self-report]
- claude-hud 플러그인 파일(cache, marketplaces)을 수정하거나 삭제하지 않습니다 [machine: bash-deny (rm|mv|sed\s+-i|tee|truncate|>)\s*.*plugins/(cache|marketplaces)/claude-hud]
- 행동하는 기능(toast, compact, 그 밖에 엔진 동작을 바꾸는 훅)을 추가하지 않습니다. `tool.call` 훅은 관찰만 하고 반드시 `next(e)`의 결과를 그대로 돌려줍니다 [self-report]

## Budget

이 세션 안에서, 같은 unit의 oracle이 같은 원인으로 세 번 실패하기 전까지입니다. 이 한도에 닿으면: INCOMPLETE - RESUME REQUIRED (resume: `~/claude-hud-mod`에서 `docs/2026-10-02-claude-hud-mod-plan.md`의 Progress log를 읽고, `.amber/progress.json`에서 첫 번째로 열린 unit부터 `record.cjs unit start`로 다시 시작합니다).

## Settled decisions

- 위치는 `~/claude-hud-mod`이고, `~/.claude/settings.json`의 env에 `CLAUDE_CODE_PLUGIN_DIRS`를 넣어 상시 로드합니다 (wade 2026-10-02)
- 표시 위치는 입력창 위 `AbovePrompt` band만 씁니다 (wade 2026-10-02)
- 1행은 모델, effort, 경로이고 git은 넣지 않습니다 (wade 2026-10-02)
- 2행의 usage는 claude-hud 방식의 바와 리셋 시간으로 그리고, 7d는 항상 표시합니다 (wade 2026-10-02)
- 활동 줄(tools, agents, todos)은 유지하고, config counts와 경과 시간은 넣지 않습니다 (wade 2026-10-02)
- 설정값은 코드 상수로 고정하고, 설정 표면은 만들지 않습니다 (wade 2026-10-02)
- claude-hud는 설치된 상태로 두고 statusLine은 제거된 채로 둡니다. 최종 처리는 이식이 끝난 뒤에 정합니다 (wade 2026-10-02)
- 독립 리뷰 unit은 넣지 않습니다 (wade 2026-10-02)
- mod API는 직접 학습하지 않고 oracle(validate, tsc, plugin test)과 operator의 눈으로 확인하는 것에 맡깁니다 (wade 2026-10-02, 기본값을 제시했고 이의가 없었음)

## Discretion

- 모델 표시 이름은 모델 ID를 사람이 읽는 이름으로 바꿉니다. 예를 들어 `claude-opus-5-5[1m]`은 `Opus 5.5`가 됩니다. 규칙에 맞지 않는 ID는 원래 ID 그대로 표시합니다 (조정 가능)
- 색상과 임계값은 claude-hud `colors.ts`의 값을 그대로 가져옵니다. context는 70% 미만이면 초록, 85% 미만이면 노랑, 그 이상이면 빨강입니다 (조정 가능)
- context percent는 `$.session.usage().context.percent`를 씁니다. claude-hud가 먼저 쓰는 엔진 `used_percentage`와 같은 값입니다(`stdin.ts:65-70`) (조정 가능)
- 활동 상태는 `session.start` 때 초기화합니다. tools 줄은 실행 중인 도구 최대 2개와 완료된 도구 상위 4개를 표시합니다(claude-hud와 같음) (조정 가능)
- 파일 구성은 `hooks/register.tsx`에 훅을 두고, 형식 함수와 집계 함수는 테스트하기 쉽도록 `hooks/` 아래 별도 파일로 나눌 수 있습니다 (조정 가능)

## Standing rules

- Before the completion signal, give the completion report: what was done and how, in full - show the actual deliverable, state what changed where and what verified it, and explain it for a reader with no context. The signal closes the report; it never replaces it [self-report]
- Before the completion signal, semantically re-check the original request, every required condition of this contract, the current artifacts, and the validation evidence. One condition without evidence, or with failed, unsuitable, or stale evidence, means the work is not complete. After a change made during that re-check, refresh the affected validation and re-check again [self-report]
- Incomplete, blocked, waiting, and status-only turns run no completion signal. The signal declares the contracted work unit itself complete, never that an assessment, report, or attempt finished [self-report]
- The re-check result goes into `record.cjs done --review "<evidence summary>" --goal "<goal-test result>" --summary "<summary>"` (the last tool call; no marker line in the message). S2 checks only the signal, the pointer, the current contract link, and leftover worktrees; semantic completion is the model's judgment. On a pass the hook removes the pointer and progress.json [hook: S2]
- Numbers and claims carry provenance (verified / quoted / unverified)
- Plan units transition only through `record.cjs unit` (`.amber/progress.json`); a stop while units are open is announced first with `amber:mark hold`. Parallel units run as subagents in worktrees; the main agent re-verifies each with the same oracle and merges last. A leftover worktree means not complete [hook: E1, S2]
- 7번 조건은 operator가 새 세션에서 확인해야 하므로, U4는 operator의 답을 기다리는 동안 `amber:mark hold`로 멈춥니다 [self-report]

## Question handling

Default: on a discovery outside the contract, full stop plus report.

## Carry-over (filled at completion)

- Left behind:
- Waiting (what waits on whose judgment):
- Next action:
