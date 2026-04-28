#!/usr/bin/env bash
# Run `dart format` on the given files, preferring fvm if available.
# Inlined into lefthook.yml — see dart-analyze-staged.sh for rationale.

set -e

if [ "$#" -eq 0 ]; then
  echo "::info::no dart files staged — skipping"
  exit 0
fi

if command -v fvm >/dev/null 2>&1; then
  exec fvm dart format "$@"
elif command -v dart >/dev/null 2>&1; then
  exec dart format "$@"
else
  echo "::warning::dart/fvm not installed — skipping format"
  exit 0
fi
