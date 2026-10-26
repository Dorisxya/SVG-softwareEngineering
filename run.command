#!/bin/sh
set -eu
cd -- "$(dirname -- "$0")"
if command -v node >/dev/null 2>&1; then
  exec node --import tsx src/cli/main.ts
fi
runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [ -x "$runtime" ]; then
  exec "$runtime" --import tsx src/cli/main.ts
fi
printf '%s\n' '需要 Node.js 22.6+。安装后在本目录运行 npm install，再重试。'
exit 1
