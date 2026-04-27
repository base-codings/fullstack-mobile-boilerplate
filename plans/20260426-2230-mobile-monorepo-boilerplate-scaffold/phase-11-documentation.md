# Phase 11 — Documentation

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** Critical — đây là phần "force structure" mà user yêu cầu
- **Status:** completed
- **Depends on:** Phase 01-10 (docs reflect actual code)
- **Description:** Viết toàn bộ docs canonical (English) + mirror sang vi/zh/ko theo project rule. Đảm bảo mỗi doc có language switcher header, content phản ánh đúng code đã scaffold.

## Key Insights

- Project rule (CLAUDE.md): English canonical ở root `docs/`, translations ở `docs/languages/{vi,zh,ko}/`.
- Mỗi file MUST có blockquote language switcher.
- Translate prose, headings, link text. Code/identifiers giữ nguyên.
- `journals/` excluded from translation.
- Documentation phải actionable — không chỉ là theory, mà là recipe step-by-step.

## Requirements

**Functional:**
- 11 file docs canonical ở `docs/`:
  1. `README.md` (docs index)
  2. `project-overview-pdr.md`
  3. `system-architecture.md`
  4. `code-standards.md`
  5. `codebase-summary.md`
  6. `design-guidelines.md`
  7. `deployment-guide.md`
  8. `feature-boundaries.md`
  9. `di-factory-pattern.md`
  10. `i18n-tone-guide.md`
  11. `project-changelog.md`
- 5 guides ở `docs/guides/`:
  1. `add-new-backend-module.md` (with auth + envelope + operationId rules)
  2. `add-new-flutter-feature.md`
  3. `add-prisma-module.md` (NEW <!-- Red Team #15 -->)
  4. `api-contract-workflow.md`
  5. `local-development.md`
- Mirror đầy đủ sang `docs/languages/{vi,zh,ko}/` cùng cấu trúc
- Mỗi file có language switcher header
- Tổng cộng 15 × 4 = 60 file (canonical + 3 ngôn ngữ)

**Non-functional:**
- Mỗi doc < 500 lines
- Code examples actual + tested
- Cross-references chính xác (relative path)

## Architecture

```
docs/
├── README.md
├── project-overview-pdr.md
├── system-architecture.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── feature-boundaries.md
├── di-factory-pattern.md
├── i18n-tone-guide.md
├── project-changelog.md
├── guides/
│   ├── add-new-backend-module.md
│   ├── add-new-flutter-feature.md
│   ├── api-contract-workflow.md
│   └── local-development.md
└── languages/
    ├── vi/
    │   ├── README.md
    │   ├── project-overview-pdr.md
    │   ├── ...
    │   └── guides/...
    ├── zh/
    │   └── ...
    └── ko/
        └── ...
```

## Related Code Files

**Create:** all docs above (60 files total).

**Read:** all phase-XX-*.md files trong plan này (source material).

## Implementation Steps

### Step A: Canonical English docs

1. **`docs/README.md`** — index liệt kê tất cả docs với 1-line description, có TOC, language switcher
2. **`project-overview-pdr.md`** — Product Requirements Doc:
   - Mục đích boilerplate, scope, audience
   - Stack overview (link sang system-architecture)
   - High-level use case (hello flow)
   - Out of scope explicit
3. **`system-architecture.md`** — Architecture:
   - Diagram (ASCII hoặc mermaid) data flow Flutter → API → Prisma → Supabase
   - Layer responsibilities (core/features/shared mobile, common/config/infra/modules backend)
   - Multi-env setup
   - OpenAPI codegen pipeline
4. **`code-standards.md`** — Coding standards:
   - File naming: kebab-case
   - Max file size: 200 lines (per CLAUDE.md)
   - TypeScript style (no `any`, explicit return types, prefer interfaces)
   - Dart style (very_good_analysis rules)
   - Test naming + structure
   - Commit message convention (link to commitlint)
   - Lint enforcement (link Lefthook config)
5. **`codebase-summary.md`** — Map codebase:
   - File tree với 1-line description per folder
   - Mapping concept → location (vd "Need to add API endpoint? → apps/api/src/modules/<name>/")
   - Quick reference cho LLM
6. **`design-guidelines.md`** — UI/UX design:
   - Theme (Material 3, light/dark)
   - Typography scale
   - Spacing scale
   - Color palette tokens (placeholder, dev override)
   - Reusable widgets pattern (shared/widgets)
7. **`deployment-guide.md`** — Deployment:
   - Backend: Docker build + push registry + run pattern
   - Mobile: build apk/ipa, sign, upload store (skeleton, not full guide)
   - Semantic-release flow (main = prod, beta = prerelease)
   - Env management per environment
8. **`feature-boundaries.md`** — ★ Force structure rule:
   - Backend: module không deep-import từ module khác
   - Frontend: feature không import feature khác
   - Cross-feature share → đẩy lên `core/` hoặc `shared/`
   - Examples: ✓ allowed vs ✗ forbidden
   - How lint enforces (ESLint + analysis_options)
9. **`di-factory-pattern.md`** — DI patterns:
   - NestJS: providers, scopes, useFactory examples
   - Riverpod: provider types, override pattern, ProviderContainer for tests
   - Examples: HelloController inject HelloRepository inject HelloApi
10. **`i18n-tone-guide.md`** — Translation guide:
    - Khi thêm key mới: thêm vào tất cả ARB files
    - Tone: friendly, concise
    - Vietnamese specific: avoid English loanwords khi có VN equivalent
    - Pluralization (intl message syntax)
    - How to add new locale (zh, ko)
11. **`project-changelog.md`** — Changelog:
    - Initial: `## [Unreleased]` section, bullet "boilerplate scaffold"
    - Format theo Keep a Changelog
    - Auto-updated bởi semantic-release sau này

### Step B: Guides

1. **<!-- Red Team #7 -->** `guides/add-new-backend-module.md` — Recipe:
   - `nest g module modules/<name>` + manual cleanup
   - Tạo dto/, service.ts, controller.ts, module.ts theo template
   - **Controller MUST có**:
     - `@Controller('<resource-name>')` với path segment explicit (KHÔNG dùng `@Controller()` không tham số)
     - `@RequireAuth()` decorator (default-deny) HOẶC `@Public()` explicit nếu endpoint thực sự công khai. KHÔNG để mặc định kh無 decorator — global guard sẽ throw 501.
     - `@ApiStandardResponse(ResponseDto)` — KHÔNG dùng `@ApiOkResponse({ type })` raw vì envelope wrapper cần khai báo trong Swagger
     - `@ApiOperation({ operationId: 'verbNoun' })` — operationId tường minh để Dart codegen sinh method name đẹp
   - Register trong app.module.ts
   - Add Swagger decorators
   - Add jest spec
   - **Codegen:** chạy `pnpm codegen:api` ngay sau khi thêm/đổi DTO
   - Verify endpoint
   - **Section "Adding real auth"**: replace `NotImplementedAuthGuard` với JwtAuthGuard, decorate routes `@RequireAuth()` để gate. `@Public()` chỉ cho health/hello/login.

2. **`guides/add-prisma-module.md`** — Recipe (NEW, replaces removed Users CRUD):
   - Add model vào `prisma/schema.prisma`
   - `pnpm prisma migrate dev --name add_<resource>` (DIRECT_URL required)
   - `pnpm prisma generate`
   - Tạo module theo `add-new-backend-module.md` recipe, inject PrismaService
   - Service methods: `findAll`, `findById`, `create`, `update`, `delete` (chỉ những cái cần)
   - Controller với guards + standard response
   - Test: e2e với SKIP_DB=false (cần real DB hoặc test container)
2. **`guides/add-new-flutter-feature.md`** — Recipe:
   - mkdir `lib/features/<name>/{data,domain,presentation}`
   - Tạo entity, repository abstract, repository_impl, controller, screen
   - Register route trong app_router.dart
   - Add ARB key cho strings
   - Add widget test + controller test
   - DON'T import from other feature (link feature-boundaries.md)
3. **`guides/api-contract-workflow.md`** — Codegen:
   - Khi đổi backend DTO/Controller:
     1. Update DTO + Swagger decorator
     2. Run `pnpm codegen:api` từ root
     3. Update consumers ở `apps/mobile`
     4. Update tests
     5. Commit cả backend change + regenerated client
   - CI sẽ fail nếu quên regen
4. **`guides/local-development.md`** — Onboarding:
   - Prerequisites: Node 20, pnpm 9, FVM, Flutter 3.27, Docker
   - Setup steps:
     1. Clone
     2. `cp apps/api/.env.example apps/api/.env` + fill Supabase URLs
     3. `pnpm bootstrap`
     4. `pnpm prisma:migrate` (apps/api)
     5. `pnpm dev` (apps/api)
     6. `cd apps/mobile && fvm flutter run --dart-define=FLAVOR=dev`
   - **Base URL per platform**:
     - Android emulator: `10.0.2.2:3000`
     - iOS simulator: `localhost:3000`
     - Real device: LAN IP, set qua `.env.dev`
   - Common issues + fixes

### Step C: Language switcher header template

Mỗi file MUST start với:

```markdown
# <Title>

> 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/<FILE>.md) · [中文](languages/zh/<FILE>.md) · [한국어](languages/ko/<FILE>.md)
```

Cho file trong `languages/vi/`:

```markdown
# <Tiêu đề>

> 🌐 **Ngôn ngữ:** [English](../../<FILE>.md) · **Tiếng Việt** · [中文](../zh/<FILE>.md) · [한국어](../ko/<FILE>.md)
```

(Tương tự cho zh, ko với markup ngôn ngữ tương ứng.)

### Step D: Mirror translations

1. Copy mỗi file canonical → 3 thư mục `languages/{vi,zh,ko}/`
2. Giữ nguyên: code blocks, file paths, identifiers, URLs
3. Translate: prose, headings, link text
4. Update language switcher header với current language bolded
5. Update relative paths trong cross-references (sibling languages dùng `../<lang>/<file>`)

### Step E: Verify

- Walk each canonical file: link tới translations work
- Walk each translation: link back to English work
- All code examples reflect real scaffolded code
- No dead links

## Todo List

- [x] docs/README.md (en)
- [x] project-overview-pdr.md (en)
- [x] system-architecture.md (en)
- [x] code-standards.md (en)
- [x] codebase-summary.md (en)
- [x] design-guidelines.md (en)
- [x] deployment-guide.md (en)
- [x] feature-boundaries.md (en)
- [x] di-factory-pattern.md (en)
- [x] i18n-tone-guide.md (en)
- [x] project-changelog.md (en)
- [x] guides/add-new-backend-module.md (en)
- [x] guides/add-new-flutter-feature.md (en)
- [x] guides/api-contract-workflow.md (en)
- [x] guides/local-development.md (en)
- [x] Mirror sang languages/vi/ (15 files)
- [x] Mirror sang languages/zh/ (15 files)
- [x] Mirror sang languages/ko/ (15 files)
- [x] Verify language switcher headers
- [x] Verify cross-references work
- [x] Commit

## Success Criteria

- 60 file docs total (15 × 4 languages)
- Mỗi file có language switcher header đúng format
- Code examples actual (copy-paste runnable hoặc reference đúng path)
- Cross-references chính xác
- Translation quality: native-like, không Google Translate raw
- Dev mới đọc `docs/guides/local-development.md` → setup được trong 15 phút

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Translation effort lớn (60 files) | Có thể dùng AI translate first pass + human review; doc rõ trong i18n-tone-guide.md về quality bar |
| Docs drift khỏi code khi feature thay đổi | `docs-manager` agent task khi feature change; CI optional check link integrity |
| Docs quá nhiều khiến dev không đọc | Index README clear + codebase-summary.md là entry point chính |
| Link relative paths sai sau khi rename | Verify step D bắt buộc; có thể script check |

## Security Considerations

- Docs không expose secret, internal URL, API key sample
- Examples dùng placeholder

## Next Steps

→ Phase 12 verify end-to-end + viết root README link sang docs/.
