#!/usr/bin/env bash
# Run `flutter test` in apps/mobile, preferring fvm if available.
# Inlined into lefthook.yml — see dart-analyze-staged.sh for rationale.

set -e

cd "$(dirname "$0")/../../apps/mobile"

if command -v fvm >/dev/null 2>&1; then
  exec fvm flutter test
elif command -v flutter >/dev/null 2>&1; then
  exec flutter test
else
  echo "::warning::flutter not installed — skipping (CI will catch)"
  exit 0
fi
