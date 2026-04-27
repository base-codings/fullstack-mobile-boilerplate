# Phase 07 — Quality Gates

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** High — force convention từ commit đầu tiên
- **Status:** completed
- **Depends on:** Phase 02, Phase 04
- **Description:** Setup Lefthook (git hooks) + Husky (cho commitlint) + ESLint flat config + custom Dart lint rules + commitlint cho conventional commits.

## Key Insights

- **Lefthook** (Go-based, fast, parallel) cho pre-commit/pre-push — preferred over Husky for non-message hooks.
- **Husky** vẫn cần cho commit-msg hook (tích hợp commitlint).
- **lint-staged**: chỉ chạy lint trên file thay đổi.
- **commitlint** với `@commitlint/config-conventional` để enforce conventional commits — required cho semantic-release.
- **Custom lint rules**:
  - Backend: ESLint `no-restricted-imports` cấm cross-module deep import
  - Frontend: `custom_lint` plugin Dart cấm cross-feature import (rule riêng hoặc dùng `boundaries` package)

## Requirements

**Functional:**
- `git commit` → tự động chạy lint + format trên staged files cả 2 side
- `git push` → chạy test toàn repo
- Commit message phải theo conventional format (`type(scope): subject`)
- Cross-module/cross-feature import bị reject ở lint step
- Skip với `--no-verify` được nhưng có warning

**Non-functional:**
- Hook chạy < 10s pre-commit
- Test pre-push có thể skip nếu test suite > 60s (chỉ run trên CI)

## Architecture

```
mobile-boilerplate/
├── lefthook.yml
├── commitlint.config.js
├── .husky/
│   └── commit-msg
├── package.json (root)
│   └── lint-staged config
├── apps/api/
│   ├── eslint.config.mjs       # boundary rules
│   └── .prettierrc
└── apps/mobile/
    └── analysis_options.yaml   # custom_lint + cross-feature ban
```

## Related Code Files

**Create:**
- `lefthook.yml`
- `commitlint.config.js`
- `.husky/commit-msg`
- `apps/mobile/lib/core/lint_rules/` (nếu cần custom_lint plugin riêng — optional, có thể skip)

**Modify:**
- Root `package.json`: add devDeps + lint-staged config + scripts
- `apps/api/eslint.config.mjs`: tighten cross-module rule
- `apps/mobile/analysis_options.yaml`: thêm errors block cấm import sai

## Implementation Steps

1. Install root devDeps:
   ```
   pnpm add -Dw lefthook husky lint-staged @commitlint/cli @commitlint/config-conventional
   ```
   **<!-- Red Team #11 -->** Tạo `tools/scripts/lint-mobile-env.sh`:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   files=("$@")
   pattern='(?i)(api[_-]?key|secret|token|password|dsn|jwt|bearer)\s*=\s*[A-Za-z0-9_-]{12,}'
   for f in "${files[@]}"; do
     if grep -qE "$pattern" "$f" 2>/dev/null; then
       echo "::error file=$f::Possible secret in mobile env file. Move to flutter_secure_storage."
       exit 1
     fi
   done
   ```
   `chmod +x tools/scripts/lint-mobile-env.sh`
2. Tạo `commitlint.config.js`:
   ```js
   module.exports = {
     extends: ['@commitlint/config-conventional'],
     rules: {
       'header-max-length': [2, 'always', 100],
       'type-enum': [2, 'always', [
         'feat', 'fix', 'docs', 'style', 'refactor',
         'perf', 'test', 'build', 'ci', 'chore', 'revert'
       ]],
     },
   };
   ```
3. Setup Husky:
   ```
   pnpm husky init
   echo 'pnpm exec commitlint --edit "$1"' > .husky/commit-msg
   chmod +x .husky/commit-msg
   ```
4. **<!-- Red Team #13 -->** Tạo `lefthook.yml`:
   ```yaml
   # Helper: prefer fvm if available, else fall back to system flutter/dart
   templates:
     dart_cmd: &dart_cmd "(command -v fvm >/dev/null && echo fvm dart || echo dart)"
     flutter_cmd: &flutter_cmd "(command -v fvm >/dev/null && echo fvm flutter || echo flutter)"

   pre-commit:
     parallel: true
     commands:
       lint-api:
         glob: "apps/api/**/*.{ts,js}"
         run: pnpm --filter @mobile-boilerplate/api exec eslint --fix --max-warnings=0 {staged_files}
         stage_fixed: true
       format-api:
         glob: "apps/api/**/*.{ts,js,json,md}"
         run: pnpm --filter @mobile-boilerplate/api exec prettier --write {staged_files}
         stage_fixed: true
       analyze-mobile:
         glob: "apps/mobile/**/*.dart"
         run: |
           cd apps/mobile
           if command -v fvm >/dev/null; then fvm dart analyze --fatal-infos {staged_files}
           elif command -v dart >/dev/null; then dart analyze --fatal-infos {staged_files}
           else echo "::warning::dart/fvm not installed, skipping (CI will catch)"; fi
       format-mobile:
         glob: "apps/mobile/**/*.dart"
         run: |
           cd apps/mobile
           if command -v fvm >/dev/null; then fvm dart format {staged_files}
           elif command -v dart >/dev/null; then dart format {staged_files}
           else echo "skip: dart not installed"; fi
         stage_fixed: true
       # ★ Mobile env file secret scan
       lint-mobile-env:
         glob: "apps/mobile/.env*"
         run: bash tools/scripts/lint-mobile-env.sh {staged_files}

   pre-push:
     skip:
       - ref: gh-pages
     commands:
       test-api:
         run: pnpm --filter @mobile-boilerplate/api test --passWithNoTests
       test-mobile:
         run: |
           cd apps/mobile
           if command -v fvm >/dev/null; then fvm flutter test
           elif command -v flutter >/dev/null; then flutter test
           else echo "::warning::flutter not installed, skipping (CI will catch)"; fi
   ```
   **<!-- Red Team #13 -->** Note: backend-only contributors + IDE-launched commits + semantic-release CI commits đều có thể không có `fvm` trong PATH. Guard tránh block toàn repo.
5. Update root `package.json`:
   - Add `"prepare": "lefthook install && husky"` script
   - Add `"preinstall": "npx only-allow pnpm"` để force pnpm
6. Tighten `apps/api/eslint.config.mjs` rule:
   ```js
   {
     rules: {
       'no-restricted-imports': ['error', {
         patterns: [{
           group: ['../*/internal/*', 'src/modules/*/!(*.module|index)'],
           message: 'Cross-module deep imports are forbidden. Use module exports.'
         }]
       }]
     }
   }
   ```
7. Update `apps/mobile/analysis_options.yaml`:
   ```yaml
   include: package:very_good_analysis/analysis_options.yaml
   analyzer:
     errors:
       avoid_relative_lib_imports: error
     plugins:
       - custom_lint
     exclude:
       - '**/*.g.dart'
       - '**/*.freezed.dart'
   linter:
     rules:
       always_use_package_imports: true
   custom_lint:
     rules:
       # Riverpod best practices
       - missing_provider_scope
       - avoid_manual_providers_as_generated_provider_dependency
   ```
   **Note:** Custom rule "no cross-feature import" có thể implement qua boundaries:
   - Optional: tạo `apps/mobile/lib/.dart_lint.yaml` định nghĩa boundary
   - Hoặc enforce qua PR review + doc trong `feature-boundaries.md` (đơn giản hơn)
   - Decision: docs + lint custom rule = **skip** (chỉ docs + review). Có thể add `dart_code_metrics` sau nếu cần
8. Run `pnpm prepare` cài hooks
9. Verify:
   - `git commit -m "bad message"` → reject bởi commitlint
   - `git commit -m "feat(api): test commit"` → pass
   - Sửa file ts với lỗi → commit fail
   - Sửa file dart unformat → auto format + stage
10. Doc trong `docs/code-standards.md` phase 11 — list tất cả rules + cách bypass tạm thời

## Todo List

- [x] Install lefthook, husky, lint-staged, commitlint
- [x] commitlint.config.js
- [x] .husky/commit-msg
- [x] lefthook.yml
- [x] root package.json prepare + preinstall scripts
- [x] eslint cross-module rule
- [x] analysis_options.yaml tighten + custom_lint
- [x] pnpm prepare install hooks
- [x] Verify reject bad commit message
- [x] Verify lint auto-fix on commit
- [x] Commit

## Success Criteria

- Bad commit message → rejected
- Lint error trên staged file → commit blocked
- Format issue → auto-fix + restage
- `pnpm install` chạy `prepare` → hooks installed
- Cross-module import attempt → ESLint error
- `fvm dart analyze` strict mode → 0 issues

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Lefthook không install global trên Windows | Doc fallback: `pnpm exec lefthook install` |
| Hook chậm gây dev frustration | parallel: true; chỉ chạy lint trên staged_files |
| FVM trong hook cần PATH đúng | Doc trong README.md prerequisites |
| Custom Dart lint phức tạp | Skip cho phase này, chỉ dùng very_good_analysis + docs rule |

## Security Considerations

- Hook không chạy code arbitrary từ commit content
- Commitlint regex an toàn (không ReDoS)
- `preinstall: only-allow pnpm` chặn npm/yarn (tránh lockfile khác)

## Next Steps

→ Phase 08 viết tests sẽ chạy được trong pre-push hook. Phase 09 mirror các check này lên CI.
