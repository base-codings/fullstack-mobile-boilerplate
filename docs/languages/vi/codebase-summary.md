# Tóm Tắt Codebase

> 🌐 **Ngôn ngữ:** [English](../../codebase-summary.md) · **Tiếng Việt** · [中文](../zh/codebase-summary.md) · [한국어](../ko/codebase-summary.md)

## File Tree Overview

```
mobile-boilerplate/
├── apps/
│   ├── api/                         # NestJS backend
│   │   ├── src/
│   │   │   ├── app.module.ts        # Root module + global guards
│   │   │   ├── main.ts              # Bootstrap
│   │   │   ├── common/              # Shared decorators, guards, interceptors
│   │   │   ├── config/              # Environment loading
│   │   │   ├── infra/               # Logger, Prisma modules
│   │   │   └── modules/             # Feature modules (hello, health, ...)
│   │   ├── test/                    # E2E tests
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Database models
│   │   │   └── migrations/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                      # Flutter app
│       ├── lib/
│       │   ├── main.dart            # Entry point, ProviderScope setup
│       │   ├── app.dart             # Root widget, theme, router
│       │   ├── core/                # DI, config, router, theme, network
│       │   ├── features/            # Feature modules (hello, ...)
│       │   ├── shared/              # Cross-feature widgets
│       │   └── l10n/                # Translation ARB files
│       ├── test/                    # Unit + widget tests
│       ├── pubspec.yaml
│       └── analysis_options.yaml
│
├── packages/
│   └── api_client/                  # Auto-generated Dio API client
│       └── lib/
│           └── api_client.dart      # Generated client from OpenAPI spec
│
├── .github/
│   └── workflows/
│       ├── api-ci.yml               # Backend lint, test, build, docker push
│       ├── mobile-ci.yml            # Frontend analyze, test, build apk/ipa
│       └── release.yml              # Semantic-release (main=prod, beta=prerelease)
│
├── .claude/
│   └── rules/                       # Development workflow docs
│
├── docs/                            # Documentation (this folder)
│   ├── README.md
│   ├── guides/
│   └── languages/
│
├── tools/                           # Shared scripts
│
├── .husky/                          # Git hooks (pre-commit, commit-msg)
├── lefthook.yml                     # Lint enforcement
├── commitlint.config.js             # Commit message validation
├── melos.yaml                       # Monorepo workspace config
├── docker-compose.yml               # Local dev postgres
├── Dockerfile                       # Multi-stage backend build
└── package.json                     # Monorepo root
```

## Quick Reference: "Tôi cần thêm X ở đâu?"

| Task | Location | Template/Notes |
|------|----------|---|
| **Add API endpoint** | `apps/api/src/modules/<resource>/` | See [add-new-backend-module.md](guides/add-new-backend-module.md) |
| **Add database table** | `apps/api/prisma/schema.prisma` | Add model, migrate, see [add-prisma-module.md](guides/add-prisma-module.md) |
| **Add Flutter screen** | `apps/mobile/lib/features/<feature>/` | See [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) |
| **Add shared Flutter widget** | `apps/mobile/lib/shared/widgets/` | Used across multiple features |
| **Add translation string** | `apps/mobile/lib/l10n/app_<lang>.arb` | Add to ALL locales, see [i18n-tone-guide.md](i18n-tone-guide.md) |
| **Add environment variable** | `apps/api/.env.example` / `apps/mobile/.env.example` | Update both files + schema validation |
| **Add global decorator** | `apps/api/src/common/decorators/` | Reusable across modules |
| **Add service dependency** | `app.module.ts` providers array | Register as provider, inject via constructor |
| **Add API test** | `apps/api/test/<resource>.e2e-spec.ts` | Uses TestingModule, TestingController |
| **Add Riverpod provider** | `apps/mobile/lib/core/di/providers.dart` or feature-local | Override pattern for tests |

## Giải Thích Core Modules

### Backend: `apps/api/src/modules/`

**Module = feature cohesion** — mỗi directory có:
- `<module>.module.ts` — imports, provider registration
- `<module>.controller.ts` — HTTP routes
- `<module>.service.ts` — business logic
- `dto/` — request/response DTOs for Swagger
- `<module>.spec.ts` — unit tests

**Ví dụ: HelloModule**
```
modules/hello/
├── hello.module.ts
├── hello.controller.ts        # GET /hello
├── hello.service.ts
├── dto/
│   └── hello-response.dto.ts
└── hello.service.spec.ts
```

**Isolation rule:** A module's internal directory (`modules/hello/internal/*`) is forbidden from outside `hello/` module. Use shared services in `common/` or `infra/` for cross-module logic.

### Frontend: `apps/mobile/lib/features/`

**Feature = user-visible functionality** — mỗi directory có:
- `domain/entities/` — data models
- `domain/repositories/` — abstract interfaces
- `data/<repo>_impl.dart` — concrete implementations
- `presentation/controllers/` — Riverpod providers
- `presentation/screens/` — main UI
- `presentation/widgets/` — sub-widgets

**Ví dụ: HelloFeature**
```
features/hello/
├── data/
│   └── hello_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── hello.dart
│   └── repositories/
│       └── hello_repository.dart
└── presentation/
    ├── controllers/
    │   └── hello_controller.dart
    ├── screens/
    │   └── hello_screen.dart
    └── widgets/
        └── hello_card.dart
```

**Isolation rule:** Feature A must not import from Feature B. Shared concerns live in `core/` or `shared/`.

## Configuration & Environment

### Backend (.env)
```bash
# apps/api/.env.example
DATABASE_URL="postgresql://user:pass@localhost:5432/boilerplate"
DIRECT_URL="postgresql://user:pass@localhost:5432/boilerplate"  # Supabase pooling
SKIP_DB=false                                                    # Set true for hello-only
NODE_ENV=development
LOG_LEVEL=debug
API_PORT=3000
THROTTLE_LIMIT=100
THROTTLE_TTL=60000
```

### Frontend (.env)
```bash
# apps/mobile/.env.example
FLAVOR=dev                      # dev, staging, prod
API_BASE_URL=auto               # auto=localhost, or explicit IP
LOG_LEVEL=debug
```

## Key Dependencies

### Backend
- **NestJS** — framework
- **Prisma** — ORM + migrations
- **Pino** — structured logging
- **@nestjs/swagger** — OpenAPI spec generation
- **@nestjs/throttler** — rate limiting
- **class-validator** — DTO validation
- **jest** — testing

### Frontend
- **Flutter** — mobile SDK
- **Riverpod** — state management (no build_runner initially)
- **Dio** — HTTP client
- **go_router** — navigation
- **intl** — i18n (ARB format)
- **mocktail** — mocking in tests

## Database Schema

Located in `apps/api/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Models defined here; auto-generates PrismaClient
// Example: User, Post, etc.
```

**Workflow:**
1. Edit `schema.prisma`
2. `pnpm --filter @mobile-boilerplate/api prisma:migrate dev --name <description>`
3. Schema changes auto-synced; ORM client regenerated

## CI/CD Workflow

### GitHub Actions

**api-ci.yml** (triggered on `apps/api/**` changes):
1. Lint (ESLint)
2. Test (Jest)
3. Build (tsc)
4. Docker build + push to registry (if main/beta branch)

**mobile-ci.yml** (triggered on `apps/mobile/**` changes):
1. Analyze (flutter analyze)
2. Test (flutter test)
3. Build (flutter build apk/ipa)

**codegen-check.yml** (triggered on NestJS DTO changes):
1. Run `pnpm codegen:api`
2. Fail if `packages/api_client/` not updated (forces sync)

**release.yml** (semantic-release):
- Reads conventional commits
- Bumps version (major/minor/patch)
- Generates changelog entry
- Tags release
- Pushes to main (production) or beta (prerelease)
- Only runs if api-ci + mobile-ci pass

## Testing Strategy

### Backend
- **Unit tests** (`.spec.ts` colocated) — service logic, helpers
- **E2E tests** (`test/` folder) — full request/response cycle
- **Mock pattern:** Jest spies + PrismaService mocks
- **Run:** `pnpm --filter @mobile-boilerplate/api test`

### Frontend
- **Provider tests** (`*_test.dart`) — Riverpod state logic
- **Widget tests** — UI behavior, tap, state changes
- **Mock pattern:** ProviderContainer overrides + FakeRepository
- **Run:** `cd apps/mobile && fvm flutter test`

## Build Artifacts

### Backend
- **Docker image** — multi-stage (build deps isolated)
- **Published to:** Docker registry (set via CI secrets)
- **Run:** `docker-compose up -d` (local) or Kubernetes (prod)

### Mobile
- **APK** (Android) — universal or split ABIs
- **IPA** (iOS) — signed with provisioning profile
- **Published to:** Play Store / App Store (manual or fastlane)

## Monorepo Structure (Melos + pnpm)

**Root `package.json`:**
```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

**Filter commands:**
```bash
# Run script in specific workspace
pnpm --filter @mobile-boilerplate/api <script>
pnpm --filter @mobile-boilerplate/mobile <script>

# Run across all
pnpm install
```

**Melos bootstrap (Phase 01):**
```bash
melos bootstrap  # Links workspaces, prepares codegen
```

---

**Last updated:** April 2026
