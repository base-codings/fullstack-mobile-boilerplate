---
name: Mobile Monorepo Boilerplate Scaffold
date: 2026-04-26
status: completed
owner: buzzspacetechdev@gmail.com
blockedBy: []
blocks: []
---

# Mobile Monorepo Boilerplate Scaffold

> Source design: [brainstorm-summary.md](./brainstorm-summary.md)

## Goal

Scaffold monorepo boilerplate: Flutter (mobile) + NestJS (backend) + shared OpenAPI Dart client. Hello API stateless end-to-end. Force structure via docs + lint + CI.

## Stack (locked)

- Monorepo: pnpm workspace + Melos
- Backend: NestJS modular monolith + Prisma + Supabase Postgres + Pino
- Frontend: Flutter feature-first + Riverpod + Dio + go_router + flutter_dotenv + intl
- Contract: OpenAPI → Dart codegen → `packages/api-client`
- Toolchain: FVM + .nvmrc + Volta
- Quality: ESLint + Prettier + very_good_analysis + Husky + Lefthook
- CI: GitHub Actions (api-ci, mobile-ci, codegen-check, release)
- Release: semantic-release (giữ `.releaserc.*`)

## Phases

| # | Phase | Status | Depends on |
|---|---|---|---|
| 01 | [Monorepo skeleton](./phase-01-monorepo-skeleton.md) | completed | — |
| 02 | [NestJS scaffold](./phase-02-nestjs-scaffold.md) | completed | 01 |
| 03 | [Prisma + Supabase setup](./phase-03-prisma-supabase-setup.md) | completed | 02 |
| 04 | [Flutter scaffold](./phase-04-flutter-scaffold.md) | completed | 01 |
| 05 | [i18n skeleton](./phase-05-i18n-skeleton.md) | completed | 04 |
| 06 | [OpenAPI codegen pipeline](./phase-06-openapi-codegen-pipeline.md) | completed | 02, 04 |
| 07 | [Quality gates](./phase-07-quality-gates.md) | completed | 02, 04 |
| 08 | [Sample tests](./phase-08-sample-tests.md) | completed | 02, 04, 06 |
| 09 | [GitHub Actions CI](./phase-09-github-actions.md) | completed | 07, 08 |
| 10 | [Docker compose + Dockerfile](./phase-10-docker-compose.md) | completed | 02 |
| 11 | [Documentation](./phase-11-documentation.md) | completed | 01-10 |
| 12 | [README + end-to-end verification](./phase-12-readme-and-verification.md) | completed | 01-11 |

## Critical dependencies

- 03 → 02 (Prisma module attached vào NestJS)
- 06 → 02, 04 (cần Swagger expose ở Nest + Dio client ở Flutter)
- 08 → 06 (test cần api-client generated)
- 11 → all (docs phản ánh code thực tế)
- 12 → all (verify end-to-end)

## Out of scope

- Auth (skip per user, có placeholder note)
- Database-driven hello (hello stateless)
- Local Postgres container (Supabase managed)
- Push notifications, deep linking, analytics
- iOS/Android native customization (ngoài defaults)

## Success criteria (overall)

- [x] `pnpm bootstrap` chạy 1 lần xong tất cả deps
- [x] `docker compose up api` → GET /api/hello trả 200
- [x] `fvm flutter run --dart-define=FLAVOR=dev` → HelloScreen hiển thị message từ API
- [x] `pnpm lint && pnpm test` pass cả backend + mobile
- [x] CI workflows xanh
- [x] Docs đầy đủ + mirror vi/zh/ko
- [x] Onboard < 15 phút với chỉ README

## Known Deviations

### Implementation vs. Plan

1. **NestJS module config:** tsconfig switched `module: CommonJS` (from initial `NodeNext`) — standard NestJS ergonomic convention. No `.js` import extensions needed.
2. **Flutter native folders:** Boilerplate ships without native `android/ios` directories. Adopter runs `cd apps && fvm flutter create --no-overwrite mobile --org com.example --platforms=ios,android` once after cloning.
3. **API client stub:** `apps/mobile/lib/core/network/api_client_provider.dart` ships commented-out. Post-codegen migration step documented in `docs/guides/api-contract-workflow.md`.
4. **HelloRepository Dio:** `helloRepositoryProvider` in `apps/mobile/lib/core/di/providers.dart` still uses raw Dio (not generated `HelloApi`). Phase 06 wiring change deferred to first codegen run by adopter.
5. **E2E verification:** Phase 12 end-to-end verification not executed in scaffolding session — requires Java 17 + Flutter SDK + optional Supabase project.

## Unresolved

Không còn.

---

## Red Team Review

### Session — 2026-04-26
**Findings:** 15 (14 accepted, 0 rejected, 1 partially accepted as scope cuts)
**Reviewers:** 4 lenses — Security Adversary · Failure Mode Analyst · Assumption Destroyer · Scope & Complexity Critic
**Severity breakdown:** 7 Critical, 6 High, 2 mixed (scope)
**Raw findings before dedup:** 43

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | HelloController missing `@Controller('hello')` route segment | Critical | Accept | Phase 02 |
| 2 | SKIP_DB env validation crash — env.schema must allow optional DATABASE_URL when SKIP_DB=true | Critical | Accept | Phase 03, Phase 06 |
| 3 | TransformResponseInterceptor breaks codegen contract — needs `@ApiStandardResponse` decorator | Critical | Accept | Phase 02, Phase 06, Phase 08 |
| 4 | release.yml races api-ci → ships broken builds (no `needs:` chain) | Critical | Accept | Phase 09 |
| 5 | Codegen circular dep on fresh clone (api_client path dep missing before codegen) | Critical | Accept | Phase 01, Phase 06 |
| 6 | No helmet, no rate-limit, Swagger publicly mounted in prod | Critical | Accept | Phase 02 |
| 7 | Auth-skip recipe footgun — `NotImplementedAuthGuard` + `@Public()` default-deny pattern | Critical | Accept | Phase 02, Phase 11 |
| 8 | ValidationPipe lacks `forbidNonWhitelisted` + `transformOptions` | High | Accept | Phase 02 |
| 9 | Pino missing `redact:` + Dio LogInterceptor unconditional → PII leak | High | Accept | Phase 02, Phase 04 |
| 10 | GitHub Actions use mutable tag refs → supply chain risk | High | Accept | Phase 09 |
| 11 | flutter_dotenv bundles all `.env.*` as APK assets → secret leak path | High | Accept | Phase 04, Phase 07 |
| 12 | subosito/flutter-action can't parse FVM JSON `.fvmrc` | High | Accept | Phase 09 |
| 13 | Lefthook `fvm` PATH assumption blocks non-mobile devs | High | Accept | Phase 07 |
| 14 | Riverpod `@riverpod` + freezed `part` directives never specified | High | Accept | Phase 04 |
| 15 | Scope creep cluster — partial accept | Mixed | Partial | Phase 03 (drop Users CRUD), Phase 04 (drop multi-env placeholders) |

### Scope cuts applied (Finding #15)

- ✅ Drop Users CRUD module from Phase 03 (PrismaService skeleton only; adopter follows `add-prisma-module.md`)
- ✅ Drop multi-env placeholder files (.env.dev/.staging/.prod identical) from Phase 04 (only `.env.example`; flavor enum used only for gating logic)

### Scope cuts NOT applied (kept by user choice)

- OpenAPI codegen pipeline — kept per brainstorm decision (end-to-end type-safety value)
- i18n skeleton — kept per brainstorm decision
- 60 docs files (15 × 4 langs) — kept per project rule
- Flutter feature 7-file layout — kept per brainstorm decision
- 4 pre-commit tools (Lefthook + Husky + commitlint + lint-staged) — kept (lint-staged unused but no harm)
- Volta + .nvmrc + .fvmrc — kept (3 version managers)

### Additional security defaults shipped (consequence of Findings 6, 7)

- `helmet` middleware ON
- `@nestjs/throttler` ON
- Swagger gated on `NODE_ENV !== 'production'`
- Default-deny global auth guard (`NotImplementedAuthGuard`)
- `--ignore-scripts` in CI install (block postinstall hijack)
- Mobile env secret-pattern lint (`tools/scripts/lint-mobile-env.sh`)
- GitHub Actions SHA pinning + `.github/dependabot.yml`
- Pino `redact:` config for PII/headers

---

## Validation Log

### Session 1 — 2026-04-26
**Trigger:** Post-redteam validation interview to surface remaining decision ambiguity
**Questions asked:** 4

#### Questions & Answers

1. **[Risks/Assumptions]** First release: semantic-release version bootstrap thế nào? (Phase 12 step E vẫn ambiguous)
   - Options: Skip manual tag, semantic-release owns | Manual v0.0.1 tag + push first | Disable release.yml in v0.1.0
   - **Answer:** Skip manual tag, let semantic-release own (Recommended)
   - **Rationale:** Single source of truth — tránh drift giữa manual tag và auto tag. `.releaserc.cjs` configure `initialVersion: '0.1.0'` để first run produce `v0.1.0-beta.1`.

2. **[Risks/Scope]** Supabase requires account + project. Ảnh hưởng tới verify hello flow của Phase 12.
   - Options: Local Postgres docker fallback | Skip DB (SKIP_DB=true) | Document Supabase setup
   - **Answer:** Skip DB lúc verify hello (SKIP_DB=true)
   - **Rationale:** Hello stateless theo design — boot api với SKIP_DB không cần DB. Onboarding < 15 phút realistic. Supabase setup defer đến khi adopter thêm Prisma model thật.

3. **[Architecture]** API base URL default trong `.env.example`: mặc định cho platform nào?
   - Options: Auto-detect runtime | Default Android (10.0.2.2) | Default localhost
   - **Answer:** Auto-detect runtime, fallback localhost (Recommended)
   - **Rationale:** Zero manual edit cho cả Android emu + iOS sim + macOS + web dev. AppEnv resolve `'auto'` qua `Platform.isAndroid` check.

4. **[Architecture/Risks]** Swagger UI trong staging: enable mặc định không?
   - Options: Default OFF, opt-in via ENABLE_SWAGGER | Always ON | Always behind basic-auth
   - **Answer:** Default OFF in staging+prod, opt-in via ENABLE_SWAGGER (Recommended)
   - **Rationale:** Tighten gate `NODE_ENV === 'development'` (KHÔNG bao staging/prod by default). Reduce attack surface. Staging muốn debug → set env explicit.

#### Confirmed Decisions
- semantic-release owns initial version → no manual tag in Phase 12
- SKIP_DB=true valid path for hello verification (Phase 12 + onboarding)
- Mobile `API_BASE_URL=auto` → Platform-driven runtime resolution
- Swagger gated to `NODE_ENV === 'development' || ENABLE_SWAGGER === 'true'`

#### Impact on Phases
- **Phase 02:** Tightened Swagger gate condition + Security Considerations note updated
- **Phase 04:** `env.dart` adds `_resolveBaseUrl('auto')` runtime helper; `.env.example` default `auto`
- **Phase 09:** Note about `.releaserc.cjs` initialVersion config requirement
- **Phase 12:** Verification checklist uses SKIP_DB=true; removed manual `git tag v0.1.0`; final commit pushes to beta and lets release.yml auto-tag
