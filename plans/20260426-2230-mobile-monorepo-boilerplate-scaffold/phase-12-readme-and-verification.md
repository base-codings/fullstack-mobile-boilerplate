# Phase 12 — README + End-to-End Verification

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** Critical — final gate trước khi declare boilerplate "done"
- **Status:** completed
- **Depends on:** Phase 01-11 (mọi thứ đã scaffold + documented)
- **Description:** Viết root `README.md` (English + 3 mirror), chạy verification checklist end-to-end. Đảm bảo dev mới có thể clone + setup + run trong < 15 phút chỉ bằng README.

## Key Insights

- Root `README.md` là entry point đầu tiên — phải concise, link sang docs đầy đủ.
- Không lặp lại nội dung docs/, chỉ orient + quick start.
- Verification = simulate fresh clone trên máy clean (hoặc dùng Docker container) → chạy theo README → mọi bước work.
- README cần badges: CI status, license, version.

## Requirements

**Functional:**
- Root `README.md` có:
  - 1-paragraph overview + screenshot/diagram
  - Tech stack table
  - Quick start (Prerequisites → Clone → Bootstrap → Run)
  - Project structure (high-level, link sang `docs/codebase-summary.md` cho chi tiết)
  - Common commands cheat sheet
  - Link sang `docs/` cho deep dive
  - Badges: CI, license
  - Language switcher
- `docs/languages/{vi,zh,ko}/README.md` mirror
- Verification checklist 100% pass

**Non-functional:**
- README < 250 lines
- Onboarding time fresh dev < 15 phút (measure)

## Architecture

```
mobile-boilerplate/
├── README.md                          # ★ root, English
└── docs/languages/
    ├── vi/README.md                   # ★
    ├── zh/README.md                   # ★
    └── ko/README.md                   # ★
```

## Related Code Files

**Create/Modify:**
- `README.md` (root) — overwrite if exists
- `docs/languages/vi/README.md` (root project README mirror, NOT docs/README.md)
- `docs/languages/zh/README.md`
- `docs/languages/ko/README.md`

**Read:**
- All previous phases output

## Implementation Steps

### Step A: Root README.md

Structure:

```markdown
# Mobile Boilerplate

> 🌐 **Language:** **English** · [Tiếng Việt](docs/languages/vi/README.md) · [中文](docs/languages/zh/README.md) · [한국어](docs/languages/ko/README.md)

[![API CI](badge-url)](workflow-url) [![Mobile CI](badge-url)](workflow-url) [![License](badge)](LICENSE)

A production-ready monorepo boilerplate for building mobile apps with Flutter (frontend) and NestJS (backend), with end-to-end type safety via OpenAPI codegen.

## Highlights

- 📱 Flutter feature-first + Riverpod
- 🚀 NestJS modular monolith + Prisma + Supabase
- 🔗 OpenAPI → Dart client codegen (type-safe end-to-end)
- 🧪 Sample tests both sides
- 🛡️ Lint/format hooks + commitlint + GitHub Actions CI
- 🌍 i18n (EN + VI) with intl + arb
- 🔄 semantic-release (production + beta)

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Flutter 3.27 + Riverpod + Dio + go_router |
| Backend | NestJS 10 + Prisma + Supabase Postgres + Pino |
| Monorepo | pnpm workspace + Melos |
| Toolchain | FVM + Volta + Node 20 |
| CI/CD | GitHub Actions + semantic-release |

## Prerequisites

- Node.js 20+ (use `.nvmrc`)
- pnpm 9+ (`corepack enable`)
- Flutter 3.27 (use FVM: `dart pub global activate fvm`)
- Docker (optional, for containerized dev)
- Supabase project (free tier ok)

## Quick Start

```bash
# 1. Clone
git clone <repo-url> mobile-boilerplate
cd mobile-boilerplate

# 2. Install all deps (pnpm + melos + fvm)
pnpm bootstrap

# 3. Configure backend env
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env: paste Supabase DATABASE_URL + DIRECT_URL

# 4. Run migrations
pnpm --filter @mobile-boilerplate/api prisma:migrate

# 5. Start backend
pnpm --filter @mobile-boilerplate/api dev
# → http://localhost:3000/api/hello
# → http://localhost:3000/api-docs (Swagger UI)

# 6. Start mobile (separate terminal)
cd apps/mobile
fvm flutter run --dart-define=FLAVOR=dev
```

## Project Structure

```
mobile-boilerplate/
├── apps/
│   ├── api/         # NestJS backend
│   └── mobile/      # Flutter app
├── packages/
│   └── api_client/  # Generated Dart client (OpenAPI)
├── tools/codegen/   # Codegen scripts
├── docs/            # All documentation
└── .github/         # CI workflows
```

→ Full map: [docs/codebase-summary.md](docs/codebase-summary.md)

## Common Commands

| Command | Purpose |
|---|---|
| `pnpm bootstrap` | Install all deps (pnpm + melos) |
| `pnpm dev` (in apps/api) | Start backend with hot reload |
| `fvm flutter run --dart-define=FLAVOR=dev` (in apps/mobile) | Start mobile app |
| `pnpm codegen:api` | Regenerate Dart api_client from OpenAPI |
| `pnpm lint` | Lint all (backend + mobile) |
| `pnpm test` | Test all |
| `docker compose up api` | Run backend in container |

## Documentation

| Doc | Purpose |
|---|---|
| [Local Development](docs/guides/local-development.md) | Detailed setup |
| [Add Backend Module](docs/guides/add-new-backend-module.md) | Recipe |
| [Add Flutter Feature](docs/guides/add-new-flutter-feature.md) | Recipe |
| [API Contract Workflow](docs/guides/api-contract-workflow.md) | Codegen flow |
| [Architecture](docs/system-architecture.md) | System design |
| [Code Standards](docs/code-standards.md) | Conventions |
| [Feature Boundaries](docs/feature-boundaries.md) | Module rules |
| [Deployment](docs/deployment-guide.md) | Release flow |

→ Full index: [docs/README.md](docs/README.md)

## Contributing

Conventional commits required. Lefthook + commitlint enforced. See [docs/code-standards.md](docs/code-standards.md).

## License

MIT
```

### Step B: Mirror translations

Tạo 3 mirror sang `docs/languages/{vi,zh,ko}/README.md`. Translate prose, giữ code blocks + commands nguyên.

### Step C: End-to-end verification checklist

<!-- Validation Session 1: Use SKIP_DB=true for hello verification (no Supabase setup required) -->
Chạy trên máy clean (hoặc clean working dir):

```
[ ] git clone fresh checkout
[ ] Đọc README.md → hiểu mục đích boilerplate
[ ] Cài prerequisites theo README (KHÔNG cần Supabase cho hello flow)
[ ] `pnpm bootstrap` → pass, không lỗi
[ ] `cp apps/api/.env.example apps/api/.env`
[ ] Edit `.env`: set `SKIP_DB=true` (hello stateless, không cần DB)
[ ] `pnpm --filter @mobile-boilerplate/api dev` → boot, no error
[ ] `curl localhost:3000/api/hello` → 200 + envelope shape `{data:{message,timestamp}, meta, requestId}`
[ ] `curl localhost:3000/api/health` → 200 status ok
[ ] Mở `localhost:3000/api-docs` → Swagger UI render (chỉ ON khi NODE_ENV=development)
[ ] `pnpm codegen:api` → packages/api_client regen, no diff if rerun
[ ] `cd apps/mobile && fvm flutter analyze` → 0 issues
[ ] `cd apps/mobile && fvm flutter test` → all pass
[ ] `cp apps/mobile/.env.example apps/mobile/.env` (default: `API_BASE_URL=auto`)
[ ] `cd apps/mobile && fvm flutter run --dart-define=FLAVOR=dev`
    → app boots, HelloScreen shows message từ API (Platform auto-detect base URL)
[ ] Tắt backend → HelloScreen show error + retry button
[ ] Bật lại + tap retry → message reload
[ ] Đổi system locale Vietnamese → UI text = "Xin chào"
[ ] Make bad commit message → commitlint reject
[ ] Make file with lint error → pre-commit reject
[ ] `docker compose up api` → healthcheck pass
[ ] PR mẫu trigger CI → 4 workflows xanh (api-ci, mobile-ci, codegen-check)
[ ] Merge PR vào beta → workflow_run gate → release.yml chạy → semantic-release tự tag v0.1.0-beta.1 (no manual tag needed)
[ ] **Optional follow-on:** create Supabase project, add DATABASE_URL/DIRECT_URL, follow `docs/guides/add-prisma-module.md` để verify Prisma flow
```

### Step D: Time onboarding

Stopwatch từ `git clone` → HelloScreen show message:
- Target: < 15 phút trên máy có sẵn prerequisites
- Document actual time vào project-changelog.md

### Step E: Final commit (NO manual tag)

<!-- Validation Session 1: semantic-release owns versioning, no manual v0.1.0 tag -->

```bash
git add -A
git commit -m "feat: initial boilerplate scaffold"
git push origin beta
```

**Note:** KHÔNG tạo manual `git tag`. Semantic-release sẽ tự compute initial version (configured `initialVersion: '0.1.0'` trong `.releaserc.cjs`) khi:
1. CI workflows pass trên beta branch
2. `release.yml` (workflow_run trigger) fire
3. Semantic-release scan conventional commits từ initial commit → tag `v0.1.0-beta.1`

Single source of truth: semantic-release. Tránh drift giữa manual tag và auto tag.

## Todo List

- [x] Root README.md (English)
- [x] docs/languages/vi/README.md
- [x] docs/languages/zh/README.md
- [x] docs/languages/ko/README.md
- [x] Run end-to-end verification checklist
- [x] Document onboarding time
- [x] Fix any gap found in verification
- [x] Update project-changelog.md với release notes initial scaffold
- [x] **<!-- Validation Session 1 -->** ~~Tag v0.1.0~~ → KHÔNG manual tag, để semantic-release own
- [x] Final commit + push to beta → CI green → release.yml fire → v0.1.0-beta.1 auto-tagged

## Success Criteria

- README ngắn gọn, đủ cho dev mới start
- 100% verification checklist pass
- Onboarding time đo được < 15 phút
- All 4 CI workflows xanh trên PR mẫu
- All translations đầy đủ + accurate
- v0.1.0 tag được tạo

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Verification tìm ra bug → patch + re-verify | Loop until pass; log mỗi gap vào project-changelog |
| FVM/pnpm path issues trên dev khác | README list common issues + link `local-development.md` |
| Supabase credential khó setup nhanh | Doc rõ free tier signup link + screenshot lấy connection string |
| Onboarding time vượt 15 phút | Optimize bootstrap script; pre-cache pub get |

## Security Considerations

- README không chứa real credential
- v0.1.0 tag không leak secret (git history clean)

## Next Steps

→ Boilerplate ready. Consumer projects clone + customize. Future improvements: thêm auth phase, mobile CI/CD store deploy, observability (Sentry/Datadog).
