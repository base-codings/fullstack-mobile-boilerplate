# 更新日志

> 🌐 **语言:** [English](../../../CHANGELOG.md) · [Tiếng Việt](../vi/CHANGELOG.md) · **中文** · [한국어](../ko/CHANGELOG.md)

本项目所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),本项目遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

> 下方的 release 条目由 `semantic-release` 维护,无论镜像语言如何均保持英文 — 只有上方的描述/标题会被翻译。

## [Unreleased]

### 已更改

- **Backend security hardening (Phase 02 follow-up)**
  - `@RequireAuth()` is now a marker-only decorator (no `UseGuards` binding) — global guard reads metadata
  - Default-deny: routes without `@Public()` or `@RequireAuth()` throw 501 with explicit guidance
  - CORS rejection no longer throws 500 (uses graceful `callback(null, false)`)
  - Helmet CSP relaxed when Swagger enabled (UI was broken in dev)
  - Swagger paths excluded from global API prefix (no more `/api/api-docs` collision)
  - `TRUST_PROXY` env (default `0`) — set to hop count when behind LB/CDN
  - `BODY_LIMIT` env (default `1mb`) — JSON/urlencoded body size cap
  - `enableShutdownHooks()` — clean k8s/Docker SIGTERM
  - `forbidUnknownValues` removed from ValidationPipe (footgun)
  - `@SkipThrottle()` on `/api/health` (LB probes don't exhaust throttler budget)
  - `requestId` fallback: `req.id` → `X-Request-ID` header → UUID (never empty)
  - Query strings stripped from logs (PII protection)
  - Prisma logs `emit: 'stdout'` (was `'event'` without subscriber → silent)

### Added

- **Initial monorepo scaffold** — pnpm workspaces + Melos configuration
- **NestJS API** (`apps/api/`)
  - Bootstrap with Express adapter
  - Global request validation (ValidationPipe: whitelist + forbidNonWhitelisted)
  - Global exception filter (AllExceptionsFilter) → standardized error envelope
  - Global logging interceptor (LoggingInterceptor) → request timing + per-request logs
  - Global response transform interceptor (TransformResponseInterceptor) → wraps success responses in `{ data, meta, requestId }`
  - Global rate limiting (ThrottlerGuard: 100 req/min per IP)
  - Global default-deny auth (NotImplementedAuthGuard) — routes must use `@Public()` or `@RequireAuth()` explicitly
  - Helmet middleware for security headers
  - Pino structured logging (JSON output)
  - ConfigModule for environment configuration (isGlobal: true)
  - Prisma ORM with migration support
  - PrismaService as global injectable
  - Hello module: `GET /hello` (public, no auth)
  - Health module: `GET /health` (public, liveness probe)
  - OpenAPI (Swagger) spec generation at `/api-json` (development mode)
  - Unit tests (Jest) colocated with modules (*.spec.ts)
  - E2E tests in `test/` folder

- **Flutter Mobile App** (`apps/mobile/`)
  - Riverpod 2.5+ for state management
  - Dio HTTP client with interceptors
  - go_router for navigation
  - Material 3 theme (light + dark modes, seed color: Indigo)
  - i18n foundation (ARB format) — English + Vietnamese, extensible to Chinese, Korean
  - Flutter environment (.env) support via flutter_dotenv
  - Multi-flavor support (dev/staging/prod) via --dart-define=FLAVOR
  - Hello feature showcase (data → domain → presentation layers)
  - AsyncNotifierProvider for state management
  - Widget tests + provider tests
  - Shared LoadingView + ErrorView widgets
  - Very Good Analysis linting

- **OpenAPI Code Generation Pipeline**
  - Backend: NestJS Swagger decorators (`@ApiStandardResponse`, `@ApiOperation(operationId)`)
  - Code generation: `pnpm codegen:api` (Java 17 + openapi-generator)
  - Output: `packages/api_client/` (Dio-based REST client)
  - CI: codegen-check.yml enforces sync (fails if DTO changed without regenerating client)

- **Docker & Deployment**
  - Multi-stage Dockerfile for NestJS API
  - docker-compose.yml for local PostgreSQL + API
  - Alpine Linux base for minimal image size

- **Monorepo Tooling**
  - pnpm workspaces (root + apps/* + packages/*)
  - Melos configuration for Dart + pub packages
  - `pnpm bootstrap` (npm-only) + `pnpm bootstrap:full` (npm + melos + codegen + pub get)

- **Quality Gates**
  - Commitlint — enforces conventional commit format
  - Lefthook — pre-commit linting (runs lint + tests for modified files)
  - ESLint (backend) — no-unused-vars, no `any`, no deep imports
  - Dart analyzer (frontend) — very_good_analysis rules
  - GitHub Actions CI: api-ci.yml, mobile-ci.yml, codegen-check.yml, release.yml (workflow_run gated)

- **Semantic Release Pipeline**
  - Conventional commit parsing → automatic version bumping + changelog
  - Multi-config: `.releaserc.production.json` (main) + `.releaserc.beta-config.json` (beta)

- **Database & ORM**
  - Prisma schema (apps/api/prisma/schema.prisma)
  - Auto-migrations via `prisma migrate dev`
  - Supabase PostgreSQL support (DIRECT_URL for pgbouncer)
  - SKIP_DB env for hello-only verification (no DB required)

- **Documentation**
  - 11 canonical docs + 4 guides in English at root of `docs/`
  - Multi-language mirrors (vi, zh, ko) for all docs
  - Recipes for adding backend modules, Flutter features, API contract workflow

---

**说明:**

- 初始 boilerplate 脚手架完成 (阶段 01–12)
- 已可进行功能开发: 使用 `docs/guides/` 中的指南作为配方
- 安全: 上线生产前必须将默认拒绝的 auth 替换为真实 auth
- 数据库: 通过 Prisma 实现零停机迁移 — 先在本地测试 schema 变更
