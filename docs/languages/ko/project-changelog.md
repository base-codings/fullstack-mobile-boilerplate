# 프로젝트 변경 로그

> 🌐 **언어:** [English](../../project-changelog.md) · [Tiếng Việt](../vi/project-changelog.md) · [中文](../zh/project-changelog.md) · **한국어**

이 프로젝트의 모든 주목할 만한 변경사항은 이 파일에 문서화됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)를 따르며,
이 프로젝트는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 준수합니다.

## [Unreleased]

### Added

- **초기 모노레포 스캐폴드** — pnpm workspaces + Melos configuration
- **NestJS API** (`apps/api/`)
  - Express adapter를 가진 Bootstrap
  - 전역 요청 검증 (ValidationPipe: whitelist + forbidNonWhitelisted)
  - 전역 예외 필터 (AllExceptionsFilter) → 표준화된 오류 엔벨로프
  - 전역 로깅 interceptor (LoggingInterceptor) → 요청 타이밍 + 요청당 로그
  - 전역 응답 변환 interceptor (TransformResponseInterceptor) → 성공 응답을 `{ data, meta, requestId }`로 감싸기
  - 전역 속도 제한 (ThrottlerGuard: IP당 100 req/min)
  - 전역 기본 거부 인증 (NotImplementedAuthGuard) — 라우트는 `@Public()` 또는 `@RequireAuth()` 명시적 사용 필요
  - 보안 헤더용 Helmet middleware
  - Pino 구조화된 로깅 (JSON 출력)
  - 환경 설정용 ConfigModule (isGlobal: true)
  - 마이그레이션 지원 Prisma ORM
  - 전역 injectable PrismaService
  - Hello module: `GET /hello` (공개, 인증 없음)
  - Health module: `GET /health` (공개, liveness 프로브)
  - OpenAPI (Swagger) 스펙 생성 `/api-json` (개발 모드)
  - 단위 테스트 (Jest) 모듈과 함께 위치 (*.spec.ts)
  - E2E 테스트 `test/` 폴더

- **Flutter 모바일 앱** (`apps/mobile/`)
  - Riverpod 2.5+ 상태 관리
  - Dio HTTP 클라이언트 with interceptors
  - 네비게이션용 go_router
  - Material 3 테마 (light + dark 모드, seed 색상: Indigo)
  - i18n foundation (ARB 형식)
    - 영어 (`app_en.arb`)
    - 베트남어 (`app_vi.arb`)
    - 중국어, 한국어로 확장 가능
  - flutter_dotenv를 통한 Flutter 환경 (.env) 지원
  - 다중 flavor 지원 (dev/staging/prod) via --dart-define=FLAVOR
  - Hello 기능 쇼케이스
    - Repository 패턴: data → domain → presentation 계층
    - 상태 관리용 AsyncNotifierProvider
    - Widget 테스트 + 제공자 테스트 (Riverpod + mocktail)
    - 공유 LoadingView + ErrorView 위젯
  - 앱 라우팅 (home → hello)
  - Very Good Analysis linting

- **OpenAPI 코드생성 파이프라인**
  - 백엔드: NestJS Swagger 데코레이터 (`@ApiStandardResponse`, `@ApiOperation(operationId)`)
  - 코드생성: `pnpm codegen:api` (Java 17 + openapi-generator)
  - 출력: `packages/api_client/` (Dio 기반 REST 클라이언트)
  - 모바일: operationId에서 자동 생성 메서드 명 (예: `getHello()`)
  - CI: codegen-check.yml는 동기화 강제 (DTO 변경 시 클라이언트 재생성 없으면 실패)

- **Docker & 배포**
  - NestJS API용 멀티스테이지 Dockerfile
  - 로컬 PostgreSQL + API용 docker-compose.yml
  - Dockerfile은 Alpine Linux 최소 이미지 크기
  - 빌드 타임 의존성 런타임에서 격리

- **모노레포 도구**
  - pnpm workspaces (root + apps/* + packages/*)
  - Dart + pub 패키지용 Melos configuration
  - `pnpm bootstrap` 스크립트 (install + codegen + melos bootstrap)

- **품질 게이트**
  - Commitlint — conventional commit 형식 강제
  - Lefthook — 사전 커밋 린팅 (수정된 파일에 lint + 테스트 실행)
  - ESLint (백엔드) — no-unused-vars, no `any`, 깊은 임포트 없음
  - Dart analyzer (프론트엔드) — very_good_analysis 규칙
  - .husky를 통한 사전 커밋 훅
  - GitHub Actions CI:
    - `api-ci.yml` — lint, 테스트, 빌드, docker push (apps/api/** 변경 시)
    - `mobile-ci.yml` — 분석, 테스트, apk 빌드 (apps/mobile/** 변경 시)
    - `codegen-check.yml` — DTO 변경 시 OpenAPI 클라이언트 재생성 검증
    - `release.yml` — semantic-release (main=production, beta=prerelease)

- **Semantic Release 파이프라인**
  - semantic-release configuration (.releaserc.cjs)
  - Conventional commit 파싱 (feat, fix, refactor, docs, 기타)
  - 자동 버전 범프 (major/minor/patch)
  - 자동 변경 로그 생성
  - Git 태그 생성 (v1.0.0, v1.0.0-beta.1)
  - 릴리스 배포 (GitHub Releases)
  - api-ci + mobile-ci 통과로 게이트됨

- **데이터베이스 & ORM**
  - Prisma 스키마 (apps/api/prisma/schema.prisma)
  - `prisma migrate dev`를 통한 자동 마이그레이션
  - PrismaClient 타입 안전 쿼리
  - Supabase PostgreSQL 지원 (pgbouncer용 DIRECT_URL)
  - hello 전용 검증을 위한 SKIP_DB 환경 변수 (DB 불필요)

- **문서화**
  - README.md — 프로젝트 색인
  - project-overview-pdr.md — 범위, 대상, 제약사항
  - system-architecture.md — 계층, 데이터 흐름, 엔벨로프 형태
  - code-standards.md — 명명, 파일 크기, TypeScript/Dart 스타일, 테스트
  - codebase-summary.md — 파일 트리, 빠른 참고 표
  - design-guidelines.md — Material 3 테마, 간격, 반응형 디자인
  - deployment-guide.md — Docker, 모바일 서명, 릴리스 파이프라인
  - feature-boundaries.md — 모듈 격리 규칙 (교차 임포트 없음)
  - di-factory-pattern.md — NestJS 제공자, Riverpod, 실제 예시
  - i18n-tone-guide.md — ARB 형식, 번역 프로세스, 언어별 톤
  - project-changelog.md — 이 파일
  - guides/:
    - add-new-backend-module.md — NestJS 모듈 + 인증/엔벨로프 규칙 레시피
    - add-prisma-module.md — 데이터베이스 모델 + 서비스 레시피
    - add-new-flutter-feature.md — Flutter 기능 구조 레시피
    - api-contract-workflow.md — API 변경 시 codegen 플로우
    - local-development.md — 사전 요구사항, 설정, 문제 해결
  - 다국어 번역 (vi, zh, ko) 모든 문서

### 설정 파일

- `.nvmrc` — Node 20
- `.fvmrc` — Flutter 3.27
- `.editorconfig` — editor 표준화
- `.gitignore` — node_modules, .env, dist, build 제외
- `.repomixignore` — 큰 바이너리/vendor 폴더 제외
- `tsconfig.json` (루트) — 기본 TypeScript config
- `tsconfig.app.json` (api) — 루트 확장, ES2020 타겟
- `eslint.config.js` (api) — no-unused-vars, no-restricted-imports (internal/* 금지)
- `jest.config.js` (api) — 테스트 설정
- `pubspec.yaml` (모바일) — Flutter 의존성
- `analysis_options.yaml` (모바일) — Dart linter 규칙
- `lefthook.yml` — 사전 커밋 lint 강제
- `commitlint.config.js` — 커밋 메시지 검증
- `melos.yaml` — 모노레포 Dart/pub workspace
- `docker-compose.yml` — 로컬 Postgres 서비스
- `Dockerfile` — 멀티스테이지 NestJS API 빌드
- `.releaserc.cjs` — semantic-release config
- `.releaserc.production.json` — production 릴리스 config
- `.releaserc.beta-config.json` — beta 릴리스 config

### 환경 변수 (기본값)

**백엔드 (apps/api/.env.example)**
- `DATABASE_URL` — PostgreSQL 연결 문자열
- `DIRECT_URL` — Supabase pgbouncer URL
- `SKIP_DB=false` — true이면 DB 연결 스킵 (hello 전용 검증)
- `NODE_ENV=development`
- `LOG_LEVEL=debug`
- `API_PORT=3000`
- `THROTTLE_LIMIT=100`
- `THROTTLE_TTL=60000` (밀리초)
- `JWT_SECRET` — placeholder; 실제 구현으로 교체

**프론트엔드 (apps/mobile/.env.example)**
- `FLAVOR=dev` (dev/staging/prod)
- `API_BASE_URL=auto` (localhost:3000 자동 해결, 또는 명시적 IP/URL)
- `LOG_LEVEL=debug`

### Git 훅 (Husky 경유)

- **사전 커밋** — Lefthook을 통해 실행 (lint + 형식 체크)
- **커밋 메시지** — conventional commit 형식 검증 (commitlint)

### NPM 스크립트 (루트)

- `pnpm install` — 모든 workspace deps 설치
- `pnpm bootstrap` — `install` + `codegen:api` + `melos bootstrap`
- `pnpm lint` — 모든 workspace lint
- `pnpm test` — 모든 workspace 테스트
- `pnpm dev` — 로컬 개발 시작 (API + 선택적 Docker Postgres)
- `pnpm codegen:api` — NestJS OpenAPI 스펙에서 Dart 클라이언트 생성
- `pnpm release` — semantic-release (수동 트리거, CI에서 실행)

---

**참고:**
- 이것은 초기 보일러플레이트 스캐폴드 (Phase 0-10 완료)
- 기능 개발 준비: `docs/guides/`의 가이드를 레시피로 사용
- 보안 참고: 기본 거부 인증 (NotImplementedAuthGuard)은 프로덕션 전 실제 인증 (JwtAuthGuard, Supabase Auth, OAuth)으로 교체 필요
- 데이터베이스 참고: 마이그레이션은 Prisma를 통해 제로 다운타임; 스키마 변경을 로컬에서 먼저 테스트

**생성됨:** 2026년 4월 27일
