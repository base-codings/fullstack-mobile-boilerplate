# Project Changelog

> 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/project-changelog.md) · [中文](languages/zh/project-changelog.md) · [한국어](languages/ko/project-changelog.md)

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
  - project-overview-pdr.md — scope, audience, constraints
  - system-architecture.md — layers, data flow, envelope shape
  - code-standards.md — naming, file size, TypeScript/Dart style, testing
  - codebase-summary.md — file tree, quick-reference table
  - design-guidelines.md — Material 3 theme, spacing, responsive design
  - deployment-guide.md — Docker, mobile signing, release pipeline
  - feature-boundaries.md — module isolation rules (no cross-imports)
  - di-factory-pattern.md — NestJS providers, Riverpod, examples
  - i18n-tone-guide.md — ARB format, translation process, tone per language
  - project-changelog.md — this file
  - guides/:
    - add-new-backend-module.md — recipe for NestJS module + auth/envelope rules
    - add-prisma-module.md — recipe for database models + service
    - add-new-flutter-feature.md — recipe for Flutter feature structure
    - api-contract-workflow.md — codegen flow when API changes
    - local-development.md — prerequisites, setup, troubleshooting
  - Multi-language translations (vi, zh, ko) for all docs

### Configuration Files

- `.nvmrc` — Node 20
- `.fvmrc` — Flutter 3.27
- `.editorconfig` — editor standardization
- `.gitignore` — excludes node_modules, .env, dist, build
- `.repomixignore` — excludes large binary/vendor folders
- `tsconfig.json` (root) — base TypeScript config
- `tsconfig.app.json` (api) — extends root, targets ES2020
- `eslint.config.js` (api) — no-unused-vars, no-restricted-imports (internal/* forbidden)
- `jest.config.js` (api) — test configuration
- `pubspec.yaml` (mobile) — Flutter dependencies
- `analysis_options.yaml` (mobile) — Dart linter rules
- `lefthoox.yml` — pre-commit lint enforcement
- `commitlint.config.js` — commit message validation
- `melos.yaml` — monorepo Dart/pub workspace
- `docker-compose.yml` — local Postgres service
- `Dockerfile` — multi-stage NestJS API build
- `.releaserc.cjs` — semantic-release config
- `.releaserc.production.json` — production release config
- `.releaserc.beta-config.json` — beta release config

### Environment Variables (Defaults)

**Backend (apps/api/.env.example)**
- `DATABASE_URL` — PostgreSQL connection string
- `DIRECT_URL` — Supabase pgbouncer URL
- `SKIP_DB=false` — if true, skips DB connection (for hello-only verification)
- `NODE_ENV=development`
- `LOG_LEVEL=debug`
- `API_PORT=3000`
- `THROTTLE_LIMIT=100`
- `THROTTLE_TTL=60000` (milliseconds)
- `JWT_SECRET` — placeholder; swap for real implementation

**Frontend (apps/mobile/.env.example)**
- `FLAVOR=dev` (dev/staging/prod)
- `API_BASE_URL=auto` (auto-resolves localhost:3000 per platform, or explicit IP/URL)
- `LOG_LEVEL=debug`

### Git Hooks (via Husky)

- **pre-commit** — runs via Lefthook (lint + format checks)
- **commit-msg** — validates conventional commit format (commitlint)

### NPM Scripts (Root)

- `pnpm install` — install all workspace deps
- `pnpm bootstrap` — `install` + `codegen:api` + `melos bootstrap`
- `pnpm lint` — lint all workspaces
- `pnpm test` — test all workspaces
- `pnpm dev` — start local dev (API + optional Docker Postgres)
- `pnpm codegen:api` — generate Dart client from NestJS OpenAPI spec
- `pnpm release` — semantic-release (manual trigger, runs in CI)

---

**Notes:**
- This is the initial boilerplate scaffold (Phase 0-10 complete)
- Ready for feature development: use guides in `docs/guides/` as recipes
- Security note: default-deny auth (NotImplementedAuthGuard) must be swapped for real auth (JwtAuthGuard, Supabase Auth, OAuth) before production
- Database note: migrations are zero-downtime via Prisma; test schema changes locally first

**Generated:** April 27, 2026
