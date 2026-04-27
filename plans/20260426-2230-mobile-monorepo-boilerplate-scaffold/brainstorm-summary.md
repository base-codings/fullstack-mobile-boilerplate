# Brainstorm Summary — Mobile Boilerplate Monorepo Scaffold

> Date: 2026-04-26
> Status: Design approved, ready for planning
> Owner: buzzspacetechdev@gmail.com

## 1. Problem Statement

Cần scaffold 1 monorepo boilerplate cho mobile app gồm 2 phần chính:

- **Frontend**: Flutter app
- **Backend**: NestJS API

Yêu cầu:
- Clean, micro code, dễ đọc, dễ maintain
- Backend demo 1 module có hello API
- Flutter có 1 màn UI mẫu gọi API đó (verify pipe end-to-end)
- Cấu trúc chuẩn senior, dễ hiểu
- Sau scaffold: bổ sung docs với guidelines/conventions để force theo 1 bộ khung nhất định

## 2. Decisions (Final)

| Layer | Lựa chọn |
|---|---|
| Monorepo | pnpm workspace + Melos |
| Backend | NestJS modular monolith + Prisma + Supabase Postgres |
| Frontend | Flutter feature-first + Riverpod + Dio |
| API contract | OpenAPI + Dart codegen (`packages/api-client`) |
| Toolchain lock | FVM + .nvmrc + Volta |
| Quality gates | ESLint + Prettier + dart analyze + Husky + Lefthook + GitHub Actions |
| Logger | Pino (NestJS) |
| Tests | Jest + flutter_test, sample tối thiểu |
| Hello API | Stateless, không đụng DB |
| Supabase role | Chỉ là managed Postgres (qua DATABASE_URL), không dùng Supabase Auth/SDK |
| Docker compose | Chỉ api service |
| Multi-env Flutter | `flutter_dotenv` + `.env.{dev,staging,prod}` |
| Auth | Skip (sẽ thêm sau theo guideline) |
| i18n | Skeleton: `flutter_localizations` + `intl` + arb (en, vi), dùng luôn cho HelloScreen |
| Release | Giữ semantic-release (`.releaserc.*`), thêm `release.yml` workflow |

## 3. Evaluated Approaches

### 3.1 Monorepo
- **pnpm + Melos (chosen)**: Tooling chuẩn mỗi hệ sinh thái, scale tốt, ít overhead
- pnpm only: Không quản lý Dart packages
- Nx: Plugin Flutter chưa stable, học cost cao
- Plain folders: Đơn giản nhưng thiếu workspace orchestration

### 3.2 Flutter architecture
- **Feature-first + Riverpod (chosen)**: Pattern phổ biến nhất 2025-26, scale theo feature, ít boilerplate
- Clean Arch strict + BLoC: Quá nhiều boilerplate cho boilerplate nhỏ
- Simple MVC + Provider: Không "chuẩn senior", dễ thành spaghetti

### 3.3 Backend architecture
- **Modular Monolith chuẩn Nest (chosen)**: Idiomatic, dễ đọc, scale lên được khi cần
- Hexagonal / Clean Arch: Over-engineer cho boilerplate
- Vertical slice + CQRS: Quá nặng

### 3.4 API contract
- **OpenAPI + codegen (chosen)**: End-to-end type-safe, auto-sync khi API đổi
- Manual DTO + freezed: Dễ drift
- Shared TS package only: Compromise nhẹ, vẫn manual bên Dart

### 3.5 Supabase role
- **Managed Postgres only (chosen)**: Clean nhất, NestJS là source-of-truth, Flutter chỉ gọi API
- Postgres + Supabase Auth: Coupling 2 SDK, phức tạp hơn
- Full BaaS: Đổi pattern, không còn là "mobile + backend" truyền thống

## 4. Architecture Overview

### 4.1 Repo layout

```
mobile-boilerplate/
├── apps/
│   ├── api/                         # NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── common/              # filters, interceptors, pipes
│   │   │   ├── config/              # env validation, app config
│   │   │   ├── infra/
│   │   │   │   ├── prisma/
│   │   │   │   └── logger/          # Pino
│   │   │   ├── modules/
│   │   │   │   ├── hello/           # ★ stateless demo
│   │   │   │   └── users/           # demo Prisma usage
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/                    # e2e
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── mobile/                      # Flutter
│       ├── .env.dev
│       ├── .env.staging
│       ├── .env.prod
│       ├── .fvmrc
│       ├── l10n.yaml
│       ├── analysis_options.yaml    # very_good_analysis + custom
│       ├── lib/
│       │   ├── core/
│       │   │   ├── config/          # env, flavor
│       │   │   ├── di/              # root Riverpod providers
│       │   │   ├── network/         # Dio + api_client provider
│       │   │   ├── router/          # go_router
│       │   │   ├── theme/
│       │   │   └── error/
│       │   ├── features/
│       │   │   └── hello/           # ★ demo feature
│       │   │       ├── data/
│       │   │       ├── domain/
│       │   │       └── presentation/
│       │   ├── shared/
│       │   ├── l10n/
│       │   │   ├── app_en.arb
│       │   │   └── app_vi.arb
│       │   ├── app.dart
│       │   └── main.dart
│       └── test/
│
├── packages/
│   └── api-client/                  # generated Dart client
│
├── tools/
│   ├── codegen/generate-api-client.sh
│   └── scripts/
│
├── docs/
│   ├── README.md
│   ├── project-overview-pdr.md
│   ├── system-architecture.md
│   ├── code-standards.md
│   ├── codebase-summary.md
│   ├── design-guidelines.md
│   ├── deployment-guide.md
│   ├── feature-boundaries.md        # ★ enforce structure
│   ├── di-factory-pattern.md
│   ├── i18n-tone-guide.md
│   ├── project-changelog.md
│   ├── guides/
│   │   ├── add-new-backend-module.md      # ★ recipe
│   │   ├── add-new-flutter-feature.md     # ★ recipe
│   │   ├── api-contract-workflow.md       # codegen flow
│   │   └── local-development.md           # base URL per platform
│   └── languages/{vi,zh,ko}/        # mirror
│
├── .github/workflows/
│   ├── api-ci.yml
│   ├── mobile-ci.yml
│   ├── codegen-check.yml            # api-client sync check
│   └── release.yml                  # semantic-release
│
├── docker-compose.yml               # api only
├── lefthook.yml
├── .nvmrc
├── pnpm-workspace.yaml
├── melos.yaml
├── package.json
├── README.md
├── CLAUDE.md / AGENTS.md            # giữ nguyên
├── .releaserc.cjs                   # giữ nguyên
├── .releaserc.beta-config.json      # giữ nguyên
├── .releaserc.production.json       # giữ nguyên
└── .gitignore
```

### 4.2 Hello flow (verification path)

```
[Flutter HelloScreen]
  └─ ref.watch(helloControllerProvider)             # AsyncNotifier
       └─ HelloRepositoryImpl.getHello()
            └─ DefaultApi(api-client).helloControllerGetHello()   # OpenAPI generated
                 └─ HTTP GET /api/hello              (base URL từ .env.dev)
                      └─ NestJS HelloController.getHello()
                           └─ HelloService.getMessage()
                                └─ { message, timestamp }
```

### 4.3 Multi-env Flutter

- `apps/mobile/.env.dev` → `API_BASE_URL=http://10.0.2.2:3000` (Android emu) / `http://localhost:3000` (iOS sim)
- `core/config/flavor.dart`: enum Flavor { dev, staging, prod }
- `core/config/env.dart`: load `.env.<flavor>` qua `flutter_dotenv`
- Run: `fvm flutter run --dart-define=FLAVOR=dev`
- Doc rõ trong `docs/guides/local-development.md` (base URL per platform)

## 5. Convention Enforcement Strategy

### 5.1 Documentation (force qua hiểu biết)

| Doc | Force điều gì |
|---|---|
| `code-standards.md` | Naming, formatting, lint rules |
| `system-architecture.md` | Layer + data flow |
| `feature-boundaries.md` | Feature không import feature khác (chỉ qua `core/` hoặc `shared/`) |
| `di-factory-pattern.md` | Riverpod provider patterns + Nest DI |
| `guides/add-new-backend-module.md` | Recipe step-by-step tạo Nest module |
| `guides/add-new-flutter-feature.md` | Recipe step-by-step tạo Flutter feature |
| `guides/api-contract-workflow.md` | Đổi API → regen OpenAPI → regen Dart client |

### 5.2 Tooling (force qua automation)

- **ESLint** custom rules cho NestJS (cấm cross-module deep imports)
- **`analysis_options.yaml`** dùng `very_good_analysis` + custom lints (cấm cross-feature imports)
- **Lefthook**: pre-commit (lint + format), pre-push (test)
- **Husky** (cho semantic-release commit message lint)
- **GitHub Actions**:
  - `api-ci.yml`: lint + test + build NestJS
  - `mobile-ci.yml`: analyze + test + build Flutter
  - `codegen-check.yml`: regen api-client, fail nếu diff
  - `release.yml`: semantic-release trigger trên main/beta

## 6. Open Source References

- **Backend**:
  - `notiz-dev/nestjs-prisma-starter`
  - `bezkoder/nestjs-prisma-rest-api`
- **Flutter**:
  - `bizz84/code_with_andrea_flutter` (feature-first + Riverpod chuẩn)
  - `VeryGoodOpenSource/very_good_core`
  - `flutter/samples`
- **Monorepo**:
  - `xmtp/example-chat-react-native`
  - `nrwl/nx-recipes` (làm reference even khi không dùng Nx)
- **OpenAPI codegen**:
  - `OpenAPITools/openapi-generator-cli` (Dart-dio template)

## 7. Implementation Considerations & Risks

| Risk | Mitigation |
|---|---|
| OpenAPI codegen overhead khi đổi API | `tools/codegen/generate-api-client.sh` + CI check `codegen-check.yml`; doc trong `api-contract-workflow.md` |
| pnpm + Melos = 2 package managers | Phân scope rõ; root `package.json` orchestrate qua scripts (`pnpm bootstrap` chạy cả `pnpm install` + `melos bootstrap`) |
| Prisma + Supabase: connection pooling | `.env.example`: `DATABASE_URL` (pooled, port 6543) + `DIRECT_URL` (port 5432 cho migrations) |
| Feature-first dễ bị dev đẩy logic vào `core/` thành "god folder" | `feature-boundaries.md` rule rõ + lint rule + PR review |
| FVM cần install thêm | Doc trong README + `melos bootstrap` script tự run `fvm install` |
| Multi-env Flutter base URL khác per platform | `local-development.md` doc rõ; default `.env.dev` dùng `10.0.2.2` cho Android, có note iOS sim |
| Skip auth có thể trở thành rebuild lớn sau này | `add-new-backend-module.md` chứa placeholder section "When adding auth" với pattern khuyến nghị |

## 8. Success Metrics

- [ ] `pnpm bootstrap` (root) chạy 1 lần xong tất cả deps cả 2 hệ
- [ ] `docker compose up api` start NestJS, GET /api/hello trả 200 với `{ message, timestamp }`
- [ ] `cd apps/mobile && fvm flutter run --dart-define=FLAVOR=dev` mở app, HelloScreen hiển thị message từ API
- [ ] `pnpm lint && pnpm test` pass cả backend + mobile
- [ ] `pnpm codegen:api` regen được Dart client mới khi đổi DTO
- [ ] CI workflows xanh trên PR mẫu
- [ ] semantic-release tag được phiên bản đầu trên branch beta
- [ ] Docs đầy đủ tiếng Anh + mirror vi/zh/ko theo project rule
- [ ] Dev mới onboard < 15 phút với chỉ README + docs/

## 9. Next Steps

1. Tạo implementation plan chi tiết (qua `/ck:plan`) chia thành các phase:
   - **Phase 01** — Monorepo skeleton (pnpm + Melos + root configs)
   - **Phase 02** — NestJS scaffold (modules/hello + infra/prisma + common + config + Pino)
   - **Phase 03** — Prisma + Supabase setup (schema, migrations, env)
   - **Phase 04** — Flutter scaffold (core/, features/hello, dotenv multi-env, FVM)
   - **Phase 05** — i18n skeleton (l10n.yaml + arb files + integrate vào HelloScreen)
   - **Phase 06** — OpenAPI codegen pipeline (Swagger setup + script + packages/api-client)
   - **Phase 07** — Quality gates (Husky, Lefthook, ESLint, very_good_analysis)
   - **Phase 08** — Sample tests (jest e2e + flutter widget/unit)
   - **Phase 09** — GitHub Actions (api-ci, mobile-ci, codegen-check, release)
   - **Phase 10** — Docker compose + Dockerfile
   - **Phase 11** — Documentation (full docs/ với guidelines + mirror vi/zh/ko)
   - **Phase 12** — README + verification end-to-end

## 10. Unresolved Questions

Không còn. Toàn bộ design đã chốt.
