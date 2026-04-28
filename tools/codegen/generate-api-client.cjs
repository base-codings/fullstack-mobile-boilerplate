#!/usr/bin/env node
/*
 * Generate packages/api_client from the live OpenAPI spec.
 *
 *   1. Boot NestJS in stub mode (SKIP_DB=true) and dump the spec
 *   2. Run openapi-generator-cli with the dart-dio generator
 *   3. Run build_runner inside packages/api_client to materialize built_value
 *
 * Cross-platform Node port (works on Windows cmd, macOS, Linux). Replaces
 * the previous bash script which broke when pnpm spawned WSL bash on Windows.
 *
 * Prereqs:
 *   - Node 20 + pnpm 9 (root deps installed)
 *   - Java 17 (openapi-generator-cli is a Java tool)
 *   - Flutter / FVM (for `dart pub get` + `build_runner` inside api_client)
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const API_DIR = path.join(REPO_ROOT, 'apps', 'api');
const API_CLIENT_DIR = path.join(REPO_ROOT, 'packages', 'api_client');
const IS_WINDOWS = process.platform === 'win32';

// openapi-generator-cli is a root devDep; openapi-config.yaml lives at repo root.
const OPENAPI_CONFIG = path.join(REPO_ROOT, 'tools', 'codegen', 'openapi-config.yaml');

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: opts.cwd ?? REPO_ROOT,
    shell: IS_WINDOWS, // resolves .cmd/.bat shims (pnpm.cmd, fvm.cmd) on Windows
    ...opts,
  });
  if (result.error) {
    console.error(`::error::Failed to spawn ${cmd}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function has(cmd) {
  const probe = spawnSync(cmd, ['--version'], {
    stdio: 'ignore',
    shell: IS_WINDOWS,
  });
  return !probe.error && probe.status === 0;
}

const JAVA_MIN_MAJOR = 11; // openapi-generator 7.x requires Java 11+; README recommends 17

// Returns the Java major version (e.g. 8, 11, 17), or null if Java is missing/unparseable.
// `java -version` writes to stderr in format:
//   openjdk version "1.8.0_392"        ← Java 8 (legacy "1.X" scheme)
//   openjdk version "17.0.9" 2023-...  ← Java 9+ (semver scheme)
function detectJavaMajor() {
  const probe = spawnSync('java', ['-version'], { shell: IS_WINDOWS });
  if (probe.error || probe.status !== 0) return null;
  const output = `${probe.stderr ?? ''}${probe.stdout ?? ''}`;
  const match = output.match(/version "(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  const first = Number(match[1]);
  // "1.8.0_xxx" → major = 8;  "17.0.x" → major = 17
  return first === 1 ? Number(match[2] ?? 0) : first;
}

function assertJava() {
  const major = detectJavaMajor();
  if (major === null) {
    console.error(
      `::error::'java' not found on PATH. openapi-generator-cli requires Java ${JAVA_MIN_MAJOR}+ ` +
        `(README recommends Java 17 — Temurin: https://adoptium.net/).`,
    );
    process.exit(1);
  }
  if (major < JAVA_MIN_MAJOR) {
    console.error(
      `::error::Java ${major} detected, but openapi-generator-cli requires Java ${JAVA_MIN_MAJOR}+ ` +
        `(README recommends Java 17). Install from https://adoptium.net/ and ensure JAVA_HOME points ` +
        `to it (or that 'java' on PATH is the new version).`,
    );
    process.exit(1);
  }
}

// Run pnpm directly inside apps/api (NOT --filter) so stderr streams raw —
// pnpm's recursive-filter mode buffers child stderr and only prints a summary,
// hiding ts-node compile errors. cwd ensures pnpm picks the api package.json
// and injects apps/api/node_modules/.bin into PATH.
console.log('→ Exporting OpenAPI spec from NestJS app...');
run('pnpm', ['run', 'codegen:export'], { cwd: API_DIR });

console.log('→ Generating Dart api_client (dart-dio generator)...');
assertJava();
run('pnpm', ['exec', 'openapi-generator-cli', 'generate', '-c', OPENAPI_CONFIG]);

console.log('→ Running build_runner inside packages/api_client...');
if (has('fvm')) {
  run('fvm', ['dart', 'pub', 'get'], { cwd: API_CLIENT_DIR });
  run('fvm', ['dart', 'run', 'build_runner', 'build', '--delete-conflicting-outputs'], {
    cwd: API_CLIENT_DIR,
  });
} else if (has('dart')) {
  run('dart', ['pub', 'get'], { cwd: API_CLIENT_DIR });
  run('dart', ['run', 'build_runner', 'build', '--delete-conflicting-outputs'], {
    cwd: API_CLIENT_DIR,
  });
} else {
  console.error('::error::dart/fvm not on PATH — install FVM or Flutter SDK and re-run.');
  process.exit(1);
}

console.log('✓ packages/api_client regenerated');
