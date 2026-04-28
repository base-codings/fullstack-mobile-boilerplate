#!/usr/bin/env bash
# Run `dart analyze` on the given files, preferring fvm if available.
# Backend-only contributors and CI bots without dart/fvm get a warning
# instead of a hard fail (CI catches real issues).
#
# Inlined into lefthook.yml as `bash tools/scripts/dart-analyze-staged.sh {staged_files}`
# because lefthook's Windows shell wrapper trips on inline if/elif/fi blocks.

set -e

if [ "$#" -eq 0 ]; then
  echo "::info::no dart files staged — skipping"
  exit 0
fi

if command -v fvm >/dev/null 2>&1; then
  exec fvm dart analyze --fatal-infos "$@"
elif command -v dart >/dev/null 2>&1; then
  exec dart analyze --fatal-infos "$@"
else
  echo "::warning::dart/fvm not installed — skipping (CI will catch)"
  exit 0
fi
