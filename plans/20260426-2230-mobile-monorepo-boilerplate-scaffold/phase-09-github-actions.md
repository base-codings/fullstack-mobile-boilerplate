# Phase 09 — GitHub Actions CI

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** High — automation chính thức
- **Status:** completed
- **Depends on:** Phase 07, Phase 08
- **Description:** 4 workflows: api-ci, mobile-ci, codegen-check, release. Chạy trên push/PR. Use path filters để chỉ chạy khi liên quan.

## Key Insights

- **Path filters**: `paths:` trên trigger để skip workflow không liên quan (vd backend change không trigger mobile CI).
- **Concurrency groups**: cancel run cũ trên cùng PR.
- **pnpm cache**: dùng `pnpm/action-setup` + `actions/setup-node` cache.
- **Flutter cache**: `subosito/flutter-action` cache SDK + pub.
- **codegen-check**: regen api_client trong CI, `git diff --exit-code` fail nếu khác.
- **release**: `cycjimmy/semantic-release-action` chạy semantic-release với multi-config (`.releaserc.cjs` cho main, `.releaserc.beta-config.json` cho beta).
- **<!-- Red Team #10 -->** **Pin actions to full SHA** (KHÔNG tag `@v4`). Tag mutable → supply chain attack (tj-actions/changed-files Mar 2025 incident). Add `dependabot.yml` để auto-PR action updates với valid SHA.
- **<!-- Red Team #4 -->** `release.yml` MUST gate behind CI success qua `workflow_run` trigger (KHÔNG `push`). Tránh ship tag trước khi tests pass.
- **<!-- Red Team #12 -->** `subosito/flutter-action@v2` `flutter-version-file` KHÔNG parse FVM JSON `.fvmrc`. Workaround: `jq -r .flutter .fvmrc` extract version → pass qua `flutter-version`.

## Requirements

**Functional:**
- PR tới `main`/`beta` chạy api-ci nếu `apps/api/**` thay đổi
- PR chạy mobile-ci nếu `apps/mobile/**` thay đổi
- PR luôn chạy codegen-check
- Push lên `main` → release production qua semantic-release
- Push lên `beta` → release prerelease qua semantic-release

**Non-functional:**
- Workflow chạy < 10 phút
- Tận dụng cache để speed up

## Architecture

```
.github/workflows/
├── api-ci.yml
├── mobile-ci.yml
├── codegen-check.yml
└── release.yml
```

## Related Code Files

**Create:** all 4 workflow files.

**Read:**
- `.releaserc.cjs`, `.releaserc.beta-config.json`, `.releaserc.production.json` (existing)

## Implementation Steps

1. **<!-- Red Team #10 -->** `.github/workflows/api-ci.yml`:
   ```yaml
   name: API CI
   on:
     pull_request:
       paths: ['apps/api/**', 'packages/**', 'pnpm-workspace.yaml', 'package.json', '.github/workflows/api-ci.yml']
     push:
       branches: [main, beta, dev]
       paths: ['apps/api/**']
   concurrency:
     group: api-ci-${{ github.ref }}
     cancel-in-progress: true
   permissions:
     contents: read
   jobs:
     lint-test-build:
       runs-on: ubuntu-latest
       steps:
         # Pin to SHA — supply chain hardening
         - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
         - uses: pnpm/action-setup@a3252b78c470c02df07e9d59298aecedc3ccdd6d # v3.0.0
         - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8 # v4.0.2
           with:
             node-version-file: '.nvmrc'
             cache: 'pnpm'
         # Disable lifecycle scripts in CI install — supply chain hardening
         - run: pnpm install --frozen-lockfile --ignore-scripts
         - run: pnpm --filter @mobile-boilerplate/api exec prisma generate
         - run: pnpm --filter @mobile-boilerplate/api lint
         - run: pnpm --filter @mobile-boilerplate/api test
         - run: pnpm --filter @mobile-boilerplate/api build
   ```
   **<!-- Red Team #10 -->** SHA hashes là examples — verify thực tế tại release time. **<!-- Red Team #7 (Security #7) -->** `--ignore-scripts` block postinstall hijack; chạy `prisma generate` explicit.
2. **<!-- Red Team #10, #12 -->** `.github/workflows/mobile-ci.yml`:
   ```yaml
   name: Mobile CI
   on:
     pull_request:
       paths: ['apps/mobile/**', 'packages/api_client/**', '.fvmrc', '.github/workflows/mobile-ci.yml']
     push:
       branches: [main, beta, dev]
       paths: ['apps/mobile/**', '.fvmrc']
   concurrency:
     group: mobile-ci-${{ github.ref }}
     cancel-in-progress: true
   permissions:
     contents: read
   jobs:
     analyze-test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
         # ★ Extract Flutter version from FVM JSON .fvmrc — subosito/flutter-action can't parse it
         - id: flutter_version
           run: echo "version=$(jq -r .flutter .fvmrc)" >> $GITHUB_OUTPUT
         - uses: subosito/flutter-action@2783a3f08e1baf891508463f8c6653c258246225 # v2.16.0
           with:
             flutter-version: ${{ steps.flutter_version.outputs.version }}
             cache: true
         - run: flutter pub get
           working-directory: apps/mobile
         - run: dart run build_runner build --delete-conflicting-outputs
           working-directory: apps/mobile
         - run: flutter analyze --fatal-infos
           working-directory: apps/mobile
         - run: flutter test --coverage
           working-directory: apps/mobile
         # apk build moved out of PR CI (slow, low signal); keep on push to main only
   ```
   **<!-- Red Team #12 -->** Single source of truth: `.fvmrc`. Trigger paths include `.fvmrc` để bump version trigger CI.
3. **<!-- Red Team #10, #12 -->** `.github/workflows/codegen-check.yml`:
   ```yaml
   name: API Client Codegen Check
   on:
     pull_request:
       paths:
         - 'apps/api/src/**'
         - 'packages/api_client/**'
         - 'tools/codegen/**'
   permissions:
     contents: read           # ★ minimal — defense against fork-PR exfil
   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
           with:
             persist-credentials: false
         - uses: pnpm/action-setup@a3252b78c470c02df07e9d59298aecedc3ccdd6d # v3.0.0
         - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8 # v4.0.2
           with:
             node-version-file: '.nvmrc'
             cache: 'pnpm'
         - uses: actions/setup-java@99b8673ff64fbf99d8d325f52d9a5bdedb8483e9 # v4.2.1
           with:
             distribution: temurin
             java-version: '17'
         - id: flutter_version
           run: echo "version=$(jq -r .flutter .fvmrc)" >> $GITHUB_OUTPUT
         - uses: subosito/flutter-action@2783a3f08e1baf891508463f8c6653c258246225 # v2.16.0
           with:
             flutter-version: ${{ steps.flutter_version.outputs.version }}
             cache: true
         - run: pnpm install --frozen-lockfile --ignore-scripts
         - run: pnpm --filter @mobile-boilerplate/api exec prisma generate
         # SKIP_DB injected inside export-openapi.ts — no need to set here
         - run: pnpm codegen:api
         - name: Verify api_client up-to-date
           run: |
             if [ -n "$(git status --porcelain packages/api_client)" ]; then
               echo "::error::packages/api_client out of sync. Run 'pnpm codegen:api' locally."
               git status packages/api_client
               git diff packages/api_client
               exit 1
             fi
   ```
4. **<!-- Red Team #4, #10 -->** `.github/workflows/release.yml`:
   ```yaml
   name: Release
   on:
     workflow_run:                       # ★ gated by CI success — no race with api-ci/mobile-ci
       workflows: [API CI, Mobile CI]
       branches: [main, beta]
       types: [completed]
   permissions:
     contents: write
     issues: write
     pull-requests: write
   jobs:
     release:
       if: github.event.workflow_run.conclusion == 'success'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
           with:
             fetch-depth: 0
             persist-credentials: false
             ref: ${{ github.event.workflow_run.head_branch }}
         - uses: pnpm/action-setup@a3252b78c470c02df07e9d59298aecedc3ccdd6d # v3.0.0
         - uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8 # v4.0.2
           with:
             node-version-file: '.nvmrc'
             cache: 'pnpm'
         - run: pnpm install --frozen-lockfile --ignore-scripts
         - name: Determine config
           id: cfg
           run: |
             if [ "${{ github.event.workflow_run.head_branch }}" = "beta" ]; then
               echo "config=.releaserc.beta-config.json" >> $GITHUB_OUTPUT
             else
               echo "config=.releaserc.production.json" >> $GITHUB_OUTPUT
             fi
         - run: pnpm exec semantic-release --extends "$(pwd)/${{ steps.cfg.outputs.config }}"
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
   ```
   **<!-- Red Team #4 -->** `workflow_run` trigger ensures release ONLY runs sau khi cả `API CI` và `Mobile CI` pass cùng commit. Tránh ship broken builds.
   **Note:** Verify behavior với `.releaserc.cjs` existing — đọc kỹ 3 file `.releaserc.*` trước khi finalize.
   **<!-- Validation #1 -->** `.releaserc.cjs` (root config) MUST cấu hình `initialVersion: '0.1.0'` (qua `@semantic-release/exec` hoặc plugin equivalent) để first run trên beta tag `v0.1.0-beta.1`. KHÔNG cần manual `git tag` trong Phase 12 — semantic-release own toàn bộ versioning từ commit history.

5. **<!-- Red Team #10 -->** Tạo `.github/dependabot.yml`:
   ```yaml
   version: 2
   updates:
     - package-ecosystem: github-actions
       directory: /
       schedule:
         interval: weekly
       open-pull-requests-limit: 5
   ```
   Auto-PR action SHA bumps weekly.
5. Verify trên branch test:
   - PR mới với change ở `apps/api/src/` → api-ci chạy, codegen-check chạy, mobile-ci skip
   - PR với change ở `apps/mobile/lib/` → mobile-ci chạy, api-ci skip
   - PR với change ở DTO Nest mà chưa regen client → codegen-check fail
   - Merge vào beta → release workflow chạy, tag `v0.1.0-beta.1` được tạo

## Todo List

- [x] api-ci.yml
- [x] mobile-ci.yml
- [x] codegen-check.yml
- [x] release.yml
- [x] Verify path filters work
- [x] Verify codegen-check fail on drift
- [x] Verify release dry-run
- [x] Doc trong deployment-guide.md (phase 11)
- [x] Commit

## Success Criteria

- 4 workflows xanh trên sample PR
- Path filter chính xác (skip không liên quan)
- Codegen check fail khi DTO đổi mà api_client không update
- Concurrency cancel old runs khi push thêm commit
- Release workflow tag được phiên bản trên beta branch

## Risk Assessment

| Risk | Mitigation |
|---|---|
| `.releaserc.cjs` config phức tạp + multi-config logic | Đọc kỹ existing files; nếu cần điều chỉnh thì tạo PR riêng |
| **<!-- Red Team #12 -->** Flutter SDK version drift | Single source `.fvmrc` (FVM JSON); CI extract via `jq`; trigger paths include `.fvmrc` |
| **<!-- Red Team #4 -->** Release ships broken builds nếu CI race | `workflow_run` trigger + `if: conclusion == success` gate |
| **<!-- Red Team #10 -->** Action supply chain attack | Full SHA pinning + dependabot weekly auto-PR |
| **<!-- Red Team #7 (Sec #7) -->** postinstall hijack qua compromised dep | `--ignore-scripts` trong install step + explicit `prisma generate` |
| openapi-generator-cli timeout trong CI | Pre-cache JDK 17 + node_modules; fallback retry step |
| Secrets cho release (GITHUB_TOKEN) | GITHUB_TOKEN auto-provided; minimal permissions per workflow |

## Security Considerations

- `permissions:` minimal per workflow
- `persist-credentials: false` ở release checkout
- Không log secret
- Concurrency tránh race condition

## Next Steps

→ Phase 11 docs `deployment-guide.md` cover release flow chi tiết.
