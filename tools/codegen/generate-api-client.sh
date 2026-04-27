#!/usr/bin/env bash
#
# Generate packages/api_client from the live OpenAPI spec.
#
#   1. Boot NestJS in stub mode (SKIP_DB=true) and dump the spec
#   2. Run openapi-generator-cli with the dart-dio generator
#   3. Run build_runner inside packages/api_client to materialize built_value
#
# Prereqs (only checked here for clear error messages):
#   - Node 20 + pnpm 9 (root deps installed)
#   - Java 17 (openapi-generator-cli is a Java tool)
#   - Flutter / FVM (for `dart pub get` + `build_runner` inside api_client)

set -euo pipefail

cd "$(dirname "$0")/../.."

echo "→ Exporting OpenAPI spec from NestJS app..."
pnpm exec ts-node --project tools/codegen/tsconfig.json tools/codegen/export-openapi.ts

echo "→ Generating Dart api_client (dart-dio generator)..."
pnpm exec openapi-generator-cli generate -c tools/codegen/openapi-config.yaml

echo "→ Running build_runner inside packages/api_client..."
cd packages/api_client
if command -v fvm >/dev/null; then
  fvm dart pub get
  fvm dart run build_runner build --delete-conflicting-outputs
elif command -v dart >/dev/null; then
  dart pub get
  dart run build_runner build --delete-conflicting-outputs
else
  echo "::error::dart/fvm not on PATH — install FVM or Flutter SDK and re-run." >&2
  exit 1
fi

echo "✓ packages/api_client regenerated"
