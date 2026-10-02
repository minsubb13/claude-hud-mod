#!/usr/bin/env bash
#
# Validates, type-checks and tests the mod in this repository.

set -euo pipefail

readonly ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Prints the type root to include: the folder the engine lays beside a loaded
# mod, else the newest declaration file the plugin-authoring skill wrote.
find_types() {
  local laid="${ROOT}/.claude-plugin/types"
  if [[ -f "${laid}/claude-code/index.d.ts" ]]; then
    echo "${laid}"
    return
  fi
  ls -t /tmp/claude-*/bundled-skills/*/*/plugin-authoring/types/claude-code.d.ts \
      2>/dev/null | head -1
}

main() {
  echo "== validate"
  claude plugin validate "${ROOT}"

  echo "== tsc"
  local types
  types="$(find_types)"
  if [[ -z "${types}" ]]; then
    echo "check.sh: no Claude Code type declarations found" >&2
    exit 1
  fi
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "${tmp}"' EXIT
  cat > "${tmp}/tsconfig.json" <<EOF
{
  "compilerOptions": {
    "target": "es2023", "lib": ["es2023"], "types": [],
    "module": "esnext", "moduleResolution": "bundler",
    "strict": true, "noUncheckedIndexedAccess": true,
    "noEmit": true, "skipLibCheck": true,
    "jsx": "react", "jsxFactory": "h", "jsxFragmentFactory": "Fragment"
  },
  "include": ["${types}", "${ROOT}/hooks", "${ROOT}/types", "${ROOT}/tests"]
}
EOF
  npx -y -p typescript@5.6 tsc -p "${tmp}/tsconfig.json"
  echo "tsc ok"

  echo "== test"
  if compgen -G "${ROOT}/tests/*.test.ts" > /dev/null; then
    claude plugin test "${ROOT}"
  else
    echo "no tests yet"
  fi
}

main "$@"
