# Project Changelog

> 🌐 **Ngôn ngữ:** [English](../../project-changelog.md) · **Tiếng Việt** · [中文](../zh/project-changelog.md) · [한국어](../ko/project-changelog.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
  - i18n foundation (ARB format)
    - English (`app_en.arb`)
    - Vietnamese (`app_vi.arb`)
    - Extensible to Chinese, Korean
  - Flutter environment (.env) support via flutter_dotenv
  - Multi-flavor support (dev/staging/prod) via --dart-define=FLAVOR
  - Hello feature showcase
    - Repository pattern: data → domain → presentation layers
    - AsyncNotifierProvider for state management
    - Widget tests + provider tests (Riverpod + mocktail)
    - Shared LoadingView + ErrorView widgets
  - App routing (home → hello)
  - Very Good Analysis linting

- **OpenAPI Code Generation Pipeline**
  - Backend: NestJS Swagger decorators (`@ApiStandardResponse`, `@ApiOperation(operationId)`)
  - Code generation: `pnpm codegen:api` (Java 17 + openapi-generator)
  - Output: `packages/api_client/` (Dio-based REST client)
  - Mobile: Auto-generated method names from operationId (e.g., `getHello()`)
  - CI: codegen-check.yml enforces sync (fails if DTO changed without regenerating client)

- **Docker & Deployment**
  - Multi-stage Dockerfile for NestJS API
  - docker-compose.yml for local PostgreSQL + API
  - Dockerfile uses Alpine Linux for minimal image size
  - Build-time dependencies isolated from runtime

- **Monorepo Tooling**
  - pnpm workspaces (root + apps/* + packages/*)
  - Melos configuration for Dart + pub packages
  - `pnpm bootstrap` script (install + codegen + melos bootstrap)

- **Quality Gates**
  - Commitlint — enforces conventional commit format
  - Lefthook — pre-commit linting (runs lint + tests for modified files)
  - ESLint (backend) — no-unused-vars, no `any`, no deep imports
  - Dart analyzer (frontend) — very_good_analysis rules
  - Pre-commit hooks (via .husky)
  - GitHub Actions CI:
    - `api-ci.yml` — lint, test, build, docker push (on apps/api/** changes)
    - `mobile-ci.yml` — analyze, test, build apk (on apps/mobile/** changes)
    - `codegen-check.yml` — verifies OpenAPI client regenerated on DTO changes
    - `release.yml` — semantic-release (main=production, beta=prerelease)

- **Semantic Release Pipeline**
  - semantic-release configuration (.releaserc.cjs)
  - Conventional commit parsing (feat, fix, refactor, docs, etc.)
  - Automatic version bumping (major/minor/patch)
  - Automatic changelog generation
  - Git tag creation (v1.0.0, v1.0.0-beta.1)
  - Release publication (GitHub Releases)
  - Gated by api-ci + mobile-ci passing

- **Database & ORM**
  - Prisma schema (apps/api/prisma/schema.prisma)
  - Auto-migrations via `prisma migrate dev`
  - PrismaClient type-safe queries
  - Support for Supabase PostgreSQL (with DIRECT_URL for pgbouncer)
  - SKIP_DB environment variable for hello-only verification (no DB required)

- **Documentation**
  - README.md — project index
  - System architecture diagram + component breakdown
  - Code standards & conventions (TypeScript, Dart, testing)
  - Codebase summary (file tree + quick reference)
  - Design guidelines (Material 3, theming, responsive layout)
  - Deployment guide (Docker, mobile app store uploads, versioning)
  - Feature boundaries (module isolation, cross-feature import rules)
  - Dependency injection patterns (NestJS, Riverpod)
  - i18n & tone guide (ARB, locale management, translation best practices)
  - Setup guides:
    - Local development (prerequisites, setup, troubleshooting)
    - Adding backend modules (step-by-step NestJS module creation)
    - Adding Flutter features (repository pattern walkthrough)
    - Adding database models (Prisma migrations + ORM usage)
    - API contract workflow (DTO changes → codegen → mobile updates)

---

**Last updated:** April 2026
