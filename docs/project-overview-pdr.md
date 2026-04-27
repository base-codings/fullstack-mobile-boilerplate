# Project Overview & Product Requirements

> 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/project-overview-pdr.md) · [中文](languages/zh/project-overview-pdr.md) · [한국어](languages/ko/project-overview-pdr.md)

## What Is This?

**mobile-boilerplate** is a production-ready monorepo scaffold for shipping Flutter mobile applications backed by NestJS APIs on Supabase.

It provides:
- **Frontend:** Flutter app with Riverpod state management, Dio HTTP client, go_router navigation, and i18n support (English + Vietnamese ready, extensible to Chinese and Korean).
- **Backend:** NestJS API with Prisma ORM, structured logging (Pino), request rate limiting, default-deny authentication, and OpenAPI code generation.
- **DevOps:** Docker multi-stage builds, docker-compose for local dev, semantic-release pipeline (main = production, beta = prerelease), GitHub Actions CI/CD gates.
- **Quality:** Lefthook pre-commit linting, commitlint message validation, Riverpod/Jest unit tests, e2e tests, strict TypeScript, Dart linting.

## Target Audience

- **Mobile teams** shipping Flutter apps with a custom backend
- **Startups** needing fast onboarding with best practices baked in
- **Enterprises** requiring monorepo structure, audit trails (request IDs), and security defaults (default-deny auth)

## In Scope

- Single-tenant SaaS applications
- Authentication (stub implementation; swap for JWT, OAuth, Supabase Auth)
- Real-time data sync candidates (skeleton for WebSocket or polling)
- Multi-flavor builds (dev/staging/prod)
- Multi-language UI (ARB-based i18n)
- Docker deployment on Linux (cloud-agnostic)

## Out of Scope

- **E-commerce heavy lifting** — no cart, inventory, payment integration (you'll add those modules)
- **Real-time protocols** — WebSocket plumbing not included; add as a feature module
- **Mobile platform specifics** — no iOS-only features, Android-specific native modules (flutter plugins expected)
- **Machine learning** — no on-device ML or TFLite integration
- **Offline-first sync** — assumes online app with occasional connectivity loss (add Drift if you need local DB)

## Stack Overview

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Mobile UI** | Flutter 3.27+, Material 3 theme | go_router for navigation, Riverpod for state |
| **API Client** | Dio 5.7+ | Generated from OpenAPI spec (NestJS → Dart) |
| **State Management** | Riverpod 2.5+ | AsyncNotifierProvider, override pattern for tests |
| **HTTP Server** | NestJS 10+, Express | Structured logging (Pino), rate limiting, guards, interceptors |
| **ORM** | Prisma 5+ | Auto-migrations, type-safe queries |
| **Database** | PostgreSQL (Supabase) | SKIP_DB env flag for hello-only verification |
| **Package Manager** | pnpm 9+, melos | Monorepo workspaces + Dart tooling |
| **CI/CD** | GitHub Actions | Semantic-release, docker push, app signing |
| **Docker** | Alpine Linux, multi-stage | Minimal layers, build-time deps isolated |

## The Hello Flow (Smoke Test)

**Run locally:**
```bash
# 1. Backend
pnpm --filter @mobile-boilerplate/api dev
# Server runs on http://localhost:3000

# 2. Mobile (same terminal, new session)
cd apps/mobile
fvm flutter run --dart-define=FLAVOR=dev
# App connects to http://localhost:3000 (auto-resolved on emulator)
```

**What happens:**
1. **Mobile:** User taps "Fetch Hello" button
2. **HTTP:** Dio client sends `GET /hello` (auto-generated from OpenAPI spec)
3. **API:** HelloController (public route, no auth needed) calls HelloService
4. **Response:** `{ data: { message: "Hello World", timestamp }, meta: {...}, requestId: "..." }`
5. **Mobile:** Riverpod provider receives, UI updates with message + time

**Verifies:**
- Monorepo bootstrap + codegen working
- Backend server up, envelope wiring correct
- Flutter→API connectivity, Dio client generated correctly
- Riverpod state update → UI render cycle

## Key Constraints

| Constraint | Rationale |
|-----------|-----------|
| Default-deny auth (NotImplementedAuthGuard) | Security-first; swap for JwtAuthGuard when ready. Prevents accidental public endpoints. |
| Global rate limiting (100 req/min per IP) | Abuse prevention without complex API tiering. Tunable via env. |
| Whitelist DTO validation | Rejects unknown fields; prevents model injection attacks. |
| No `@Controller()` without path argument | Explicit routing clarity; prevents accidental nested routes. |
| `@Public()` only for /hello, /health, /login | Default is "require auth"; public is opt-in. |
| Feature modules isolated (no cross-feature imports) | Loose coupling, easier to delete/reuse features. |
| Max 200 lines per code file | Improves readability, encourages single responsibility. |
| Conventional commits (feat:, fix:, refactor:) | Clear changelog, semantic-release automation. |

## Development Workflow

1. **Plan** — sketch feature scope, database schema
2. **Implement Backend** — add NestJS module, DTO, controller, service, test
3. **Regenerate Client** — `pnpm codegen:api` generates Dart api_client
4. **Implement Frontend** — add Flutter feature (entity, repository, provider, UI, test)
5. **Test** — unit tests (Jest on backend, Riverpod+mocktail on mobile), e2e tests
6. **Commit** — conventional message, push to feature branch
7. **CI Gate** — GitHub Actions runs linting, tests, codegen check
8. **Merge** — PR review, auto-squash merge
9. **Release** — semantic-release reads commits, bumps version, tags, pushes to production/prerelease

## Success Metrics

- **Onboarding time:** New dev reads [local-development.md](guides/local-development.md) → full environment running in 15 min
- **Feature velocity:** Backend module + Flutter feature + tests + release in 1–2 sprints
- **Code quality:** 0 `any` types, 80%+ test coverage on business logic, 0 lint errors
- **Deployment reliability:** Automated releases with zero-downtime schema migrations, rollback via git tag

## Next Steps

→ [Local Development Setup](guides/local-development.md) to clone and run locally

→ [System Architecture](system-architecture.md) for detailed component breakdown

→ [Code Standards](code-standards.md) to understand conventions before first commit
