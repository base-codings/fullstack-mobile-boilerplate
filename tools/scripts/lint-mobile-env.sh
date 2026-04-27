#!/usr/bin/env bash
# Block committing secrets to apps/mobile/.env* files.
#
# Why: flutter_dotenv bundles .env files as APK assets; anything committed
# is publicly extractable via `unzip *.apk && cat assets/flutter_assets/.env`.
# Mobile secrets MUST come from flutter_secure_storage, not bundled .env.

set -euo pipefail

if [[ "$#" -eq 0 ]]; then
  exit 0
fi

# Match keys with high-entropy values typical of API keys / tokens / DSNs.
pattern='(?i)(api[_-]?key|secret|token|password|dsn|jwt|bearer)[[:space:]]*=[[:space:]]*[A-Za-z0-9_\-]{12,}'

failed=0
for f in "$@"; do
  if [[ ! -f "$f" ]]; then
    continue
  fi
  if grep -qP "$pattern" "$f" 2>/dev/null; then
    echo "::error file=$f::Possible secret detected in mobile env file."
    echo "         Mobile .env is bundled into the APK and is NOT secret storage."
    echo "         Move sensitive values to flutter_secure_storage."
    failed=1
  fi
done

exit "$failed"
