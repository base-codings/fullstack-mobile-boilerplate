# 코드베이스 요약

> 🌐 **언어:** [English](../../codebase-summary.md) · [Tiếng Việt](../vi/codebase-summary.md) · [中文](../zh/codebase-summary.md) · **한국어**

## 파일 트리 개요

```
mobile-boilerplate/
├── apps/
│   ├── api/                         # NestJS 백엔드
│   │   ├── src/
│   │   │   ├── app.module.ts        # 루트 모듈 + 전역 guards
│   │   │   ├── main.ts              # Bootstrap
│   │   │   ├── common/              # 공유 데코레이터, guards, interceptors
│   │   │   ├── config/              # 환경 로딩
│   │   │   ├── infra/               # Logger, Prisma 모듈
│   │   │   └── modules/             # 기능 모듈 (hello, health, ...)
│   │   ├── test/                    # E2E 테스트
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # 데이터베이스 모델
│   │   │   └── migrations/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                      # Flutter 앱
│       ├── lib/
│       │   ├── main.dart            # 진입점, ProviderScope 설정
│       │   ├── app.dart             # 루트 위젯, 테마, 라우터
│       │   ├── core/                # DI, config, 라우터, 테마, 네트워크
│       │   ├── features/            # 기능 모듈 (hello, ...)
│       │   ├── shared/              # 크로스 기능 위젯
│       │   └── l10n/                # 번역 ARB 파일
│       ├── test/                    # 단위 + widget 테스트
│       ├── pubspec.yaml
│       └── analysis_options.yaml
│
├── packages/
│   └── api_client/                  # 자동 생성 Dio API 클라이언트
│       └── lib/
│           └── api_client.dart      # OpenAPI 스펙에서 생성한 클라이언트
│
├── .github/
│   └── workflows/
│       ├── api-ci.yml               # 백엔드 lint, 테스트, 빌드, docker push
│       ├── mobile-ci.yml            # 프론트엔드 분석, 테스트, apk/ipa 빌드
│       └── release.yml              # Semantic-release (main=prod, beta=prerelease)
│
├── .claude/
│   └── rules/                       # 개발 워크플로우 문서
│
├── docs/                            # 문서 (이 폴더)
│   ├── README.md
│   ├── guides/
│   └── languages/
│
├── tools/                           # 공유 스크립트
│
├── .husky/                          # Git 훅 (사전 커밋, 커밋 메시지)
├── lefthook.yml                     # Lint 강제
├── commitlint.config.js             # 커밋 메시지 검증
├── melos.yaml                       # 모노레포 workspace config
├── docker-compose.yml               # 로컬 개발 postgres
├── Dockerfile                       # 멀티스테이지 백엔드 빌드
└── package.json                     # 모노레포 루트
```

## 빠른 참고: "새로운 X를 어디에 추가할까?"

| 작업 | 위치 | 템플릿/참고 |
|------|----------|---|
| **API 엔드포인트 추가** | `apps/api/src/modules/<resource>/` | [add-new-backend-module.md](guides/add-new-backend-module.md) 참고 |
| **데이터베이스 테이블 추가** | `apps/api/prisma/schema.prisma` | 모델 추가, 마이그레이션, [add-prisma-module.md](guides/add-prisma-module.md) 참고 |
| **Flutter 화면 추가** | `apps/mobile/lib/features/<feature>/` | [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) 참고 |
| **공유 Flutter 위젯 추가** | `apps/mobile/lib/shared/widgets/` | 여러 기능에서 사용 |
| **번역 문자열 추가** | `apps/mobile/lib/l10n/app_<lang>.arb` | 모든 로캘에 추가, [i18n-tone-guide.md](i18n-tone-guide.md) 참고 |
| **환경 변수 추가** | `apps/api/.env.example` / `apps/mobile/.env.example` | 두 파일 업데이트 + 스키마 검증 |
| **전역 데코레이터 추가** | `apps/api/src/common/decorators/` | 모듈 간 재사용 가능 |
| **서비스 의존성 추가** | `app.module.ts` 제공자 배열 | 제공자로 등록, constructor로 주입 |
| **API 테스트 추가** | `apps/api/test/<resource>.e2e-spec.ts` | TestingModule, TestingController 사용 |
| **Riverpod 제공자 추가** | `apps/mobile/lib/core/di/providers.dart` 또는 기능 로컬 | 테스트용 오버라이드 패턴 |

## 핵심 모듈 설명

### 백엔드: `apps/api/src/modules/`

**Module = 기능 응집** — 각 디렉토리는:
- `<module>.module.ts` — imports, 제공자 등록
- `<module>.controller.ts` — HTTP 라우트
- `<module>.service.ts` — 비즈니스 로직
- `dto/` — Swagger용 요청/응답 DTO
- `<module>.spec.ts` — 단위 테스트

**예시: HelloModule**
```
modules/hello/
├── hello.module.ts
├── hello.controller.ts        # GET /hello
├── hello.service.ts
├── dto/
│   └── hello-response.dto.ts
└── hello.service.spec.ts
```

**격리 규칙:** 모듈의 내부 디렉토리 (`modules/hello/internal/*`)는 `hello/` 모듈 외부에서 임포트 금지. `common/` 또는 `infra/`의 공유 서비스를 크로스 모듈 로직으로 사용.

### 프론트엔드: `apps/mobile/lib/features/`

**Feature = 사용자에게 보이는 기능** — 각 디렉토리는:
- `domain/entities/` — 데이터 모델
- `domain/repositories/` — 추상 인터페이스
- `data/<repo>_impl.dart` — 구체적 구현
- `presentation/controllers/` — Riverpod 제공자
- `presentation/screens/` — 메인 UI
- `presentation/widgets/` — sub-widget

**예시: HelloFeature**
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

**격리 규칙:** Feature A는 Feature B에서 임포트 불가. 공유 관심사는 `core/` 또는 `shared/`에 위치.

## 설정 & 환경

### 백엔드 (.env)
```bash
# apps/api/.env.example
DATABASE_URL="postgresql://user:pass@localhost:5432/boilerplate"
DIRECT_URL="postgresql://user:pass@localhost:5432/boilerplate"  # Supabase pooling
SKIP_DB=false                                                    # hello 전용의 경우 true
NODE_ENV=development
LOG_LEVEL=debug
API_PORT=3000
THROTTLE_LIMIT=100
THROTTLE_TTL=60000
```

### 프론트엔드 (.env)
```bash
# apps/mobile/.env.example
FLAVOR=dev                      # dev, staging, prod
API_BASE_URL=auto               # auto=localhost, 또는 명시적 IP
LOG_LEVEL=debug
```

## 주요 의존성

### 백엔드
- **NestJS** — 프레임워크
- **Prisma** — ORM + 마이그레이션
- **Pino** — 구조화된 로깅
- **@nestjs/swagger** — OpenAPI 스펙 생성
- **@nestjs/throttler** — 속도 제한
- **class-validator** — DTO 검증
- **jest** — 테스트

### 프론트엔드
- **Flutter** — 모바일 SDK
- **Riverpod** — 상태 관리 (초기에는 build_runner 없음)
- **Dio** — HTTP 클라이언트
- **go_router** — 네비게이션
- **intl** — i18n (ARB 형식)
- **mocktail** — 테스트용 mocking

## 데이터베이스 스키마

`apps/api/prisma/schema.prisma`에 위치:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 모델을 여기 정의; PrismaClient 자동 생성
// 예시: User, Post, 등
```

**워크플로우:**
1. `schema.prisma` 편집
2. `pnpm --filter @mobile-boilerplate/api prisma:migrate dev --name <description>`
3. 스키마 변경 자동 동기화; ORM 클라이언트 재생성

## CI/CD 워크플로우

### GitHub Actions

**api-ci.yml** (`apps/api/**` 변경 시 트리거):
1. Lint (ESLint)
2. Test (Jest)
3. Build (tsc)
4. Docker 빌드 + registry에 푸시 (main/beta 분기인 경우)

**mobile-ci.yml** (`apps/mobile/**` 변경 시 트리거):
1. 분석 (flutter analyze)
2. 테스트 (flutter test)
3. 빌드 (flutter build apk/ipa)

**codegen-check.yml** (NestJS DTO 변경 시 트리거):
1. `pnpm codegen:api` 실행
2. `packages/api_client/`이 업데이트되지 않으면 실패 (동기화 강제)

**release.yml** (semantic-release):
- Conventional commits 읽음
- 버전 범프 (major/minor/patch)
- 변경 로그 항목 생성
- 릴리스 태그
- main (production) 또는 beta (prerelease)로 푸시
- api-ci + mobile-ci 통과 시에만 실행

## 테스트 전략

### 백엔드
- **단위 테스트** (`.spec.ts` 함께 위치) — service 로직, helper
- **E2E 테스트** (`test/` 폴더) — 전체 요청/응답 사이클
- **Mock 패턴:** Jest spies + PrismaService mocks
- **실행:** `pnpm --filter @mobile-boilerplate/api test`

### 프론트엔드
- **제공자 테스트** (`*_test.dart`) — Riverpod 상태 로직
- **Widget 테스트** — UI 동작, 탭, 상태 변경
- **Mock 패턴:** ProviderContainer 오버라이드 + FakeRepository
- **실행:** `cd apps/mobile && fvm flutter test`

## 빌드 아티팩트

### 백엔드
- **Docker 이미지** — 멀티스테이지 (빌드 deps 격리)
- **배포 대상:** Docker registry (CI 시크릿으로 설정)
- **실행:** `docker-compose up -d` (로컬) 또는 Kubernetes (production)

### 모바일
- **APK** (Android) — universal 또는 split ABI
- **IPA** (iOS) — provisioning profile로 서명
- **배포 대상:** Play Store / App Store (수동 또는 fastlane)

## 모노레포 구조 (Melos + pnpm)

**루트 `package.json`:**
```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

**필터 커맨드:**
```bash
# 특정 workspace에서 스크립트 실행
pnpm --filter @mobile-boilerplate/api <script>
pnpm --filter @mobile-boilerplate/mobile <script>

# 모두에서 실행
pnpm install
```

**Melos bootstrap (Phase 01):**
```bash
melos bootstrap  # Workspace 링크, 코드생성 준비
```

---

**최종 업데이트:** 2026년 4월
