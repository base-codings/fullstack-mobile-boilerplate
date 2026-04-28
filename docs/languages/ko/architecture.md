# 아키텍처

> 🌐 **언어:** [English](../../architecture.md) · [Tiếng Việt](../vi/architecture.md) · [中文](../zh/architecture.md) · **한국어**

## 데이터 흐름 개요

```
┌─────────────────┐
│  Flutter App    │ (lib/core, lib/features, lib/shared)
│  (Riverpod)     │
└────────┬────────┘
         │
         │ Dio HTTP Client (OpenAPI 스펙에서 자동 생성)
         │
┌────────▼────────────────────────────────────────────┐
│  NestJS API Server (apps/api/src)                    │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Middleware: Helmet, CORS, 요청 로깅            │ │
│  │ Guards: ThrottlerGuard, NotImplementedAuthGuard │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Controllers (라우트) & Services (비즈니스 로직)  │ │
│  │ modules/hello, modules/health, ...               │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Prisma ORM → Database models                    │ │
│  └─────────────────────────────────────────────────┘ │
└────────┬─────────────────────────────────────────────┘
         │
         │ SQL
         │
┌────────▼──────────────────┐
│ PostgreSQL (Supabase)      │
│ - prisma/schema에서 스키마  │
│ - 자동 마이그레이션        │
└───────────────────────────┘
```

## 응답 엔벨로프

모든 API 응답 (성공 또는 오류)은 표준 엔벨로프로 데이터를 감쌉니다:

```json
{
  "data": { /* 컨트롤러 반환 값 */ },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-04-27T00:00:00Z",
    "version": "1.0"
  },
  "error": null  // 또는 상태 >= 400이면 오류 객체
}
```

**강제됨:** `TransformResponseInterceptor` (성공) + `AllExceptionsFilter` (오류)

**`requestId` 폴백 체인:**
1. `req.id` (pino-http에서 `genReqId`로 설정)
2. `X-Request-ID` 헤더 (클라이언트 상관관계 허용)
3. 신선한 `randomUUID()` (최후의 수단)

이것은 모든 오류 응답이 usable 상관관계 ID를 가지도록 보장합니다. 심지어
pino-http 미들웨어가 활성화되기 전에 오류가 발생할 때 (예: NestJS 내부 시작 오류).

**생성된 클라이언트 (Dart):** 역직렬화는 자동으로 처리됨. 응답 타입은 `data` 필드만; `meta` + `requestId`는 컨텍스트를 통해 사용 가능.

## 백엔드 아키텍처

### 폴더 구조 (apps/api/src)

```
apps/api/src/
├── main.ts                          # Bootstrap: 앱 생성 + listen
├── app.module.ts                    # 루트 모듈: imports + 전역 guards/pipes/interceptors
├── common/                          # 모듈 간 공유
│   ├── auth/
│   │   ├── decorators/              # @Public(), @RequireAuth()
│   │   ├── not-implemented-auth.guard.ts  # 스텁 (기본 거부)
│   │   └── jwt-auth.guard.ts        # 실제 인증을 위해 교체
│   ├── decorators/
│   │   └── api-standard-response.decorator.ts  # DTO + 엔벨로프를 Swagger로 감싸기
│   ├── filters/
│   │   └── all-exceptions.filter.ts  # 오류를 엔벨로프로 형식화
│   └── interceptors/
│       ├── logging.interceptor.ts   # 요청당 타이밍
│       └── transform-response.interceptor.ts  # 성공 데이터를 감싸기
├── config/
│   ├── config.module.ts             # ConfigModule.forRoot (isGlobal: true)
│   ├── app.config.ts                # NestJS config 스키마
│   └── env.schema.ts                # Joi .env 검증
├── infra/                           # 인프라
│   ├── logger/
│   │   └── logger.module.ts         # Pino 구조화된 로깅
│   └── prisma/
│       ├── prisma.module.ts         # 전역 PrismaService
│       └── prisma.service.ts
└── modules/                         # 기능 모듈
    ├── hello/
    │   ├── hello.module.ts
    │   ├── hello.controller.ts      # 라우트: GET /hello
    │   ├── hello.service.ts         # 비즈니스 로직
    │   ├── dto/
    │   │   └── hello-response.dto.ts
    │   └── hello.service.spec.ts
    └── health/
        ├── health.module.ts
        └── health.controller.ts     # GET /health (liveness 프로브)
```

### 계층 책임

| 계층 | 책임 | 예시 |
|-------|---|---|
| **Controller** | HTTP 라우팅, 요청 파싱, 응답 형식화 | `@Get(':id')` 경로 + 쿼리 + 본문 params |
| **Service** | 비즈니스 로직, 오케스트레이션, 오류 처리 | 입력 검증, repository 호출, 엣지 케이스 처리 |
| **Repository** | 데이터 접근 추상화 (Prisma 직접 사용 시 선택사항) | 인터페이스 + 구현 |
| **Prisma** | 타입 안전 데이터베이스 쿼리, 마이그레이션 | `prisma.user.findUnique({ where: { id } })` |
| **Guard/Interceptor** | 크로스 커팅: 인증, 로깅, 속도 제한 | 전역 또는 데코레이터로 라우트당 적용 |
| **Filter** | 예외 → HTTP 응답 형식화 | 400/401/500 → 엔벨로프 with 오류 세부사항 |
| **Decorator** | 라우팅, 검증, Swagger 문서의 메타데이터 | `@Public()`, `@ApiStandardResponse(Dto)` |

### 전역 제공자 (app.module.ts)

| 제공자 | 목적 | 타입 |
|---|---|---|
| APP_PIPE | whitelist + forbidNonWhitelisted를 가진 ValidationPipe | 주입 방지 |
| APP_GUARD | NotImplementedAuthGuard (기본 거부) | 보안 우선; JwtAuthGuard로 교체 |
| APP_GUARD | ThrottlerGuard | 속도 제한: IP당 100 req/min |
| APP_FILTER | AllExceptionsFilter | 오류를 엔벨로프로 형식화 |
| APP_INTERCEPTOR | LoggingInterceptor | 요청당 기간 + 상태 로깅 |
| APP_INTERCEPTOR | TransformResponseInterceptor | 성공 응답을 엔벨로프로 감싸기 |

## 프론트엔드 아키텍처

### 폴더 구조 (apps/mobile/lib)

```
apps/mobile/lib/
├── main.dart                        # 앱 진입 + ProviderScope 설정
├── app.dart                         # 앱 위젯 with 테마 + 라우팅
├── core/                            # 공유 non-feature 로직
│   ├── config/
│   │   ├── env.dart                 # AppEnv: FLAVOR, API_BASE_URL, 기타
│   │   └── flavor.dart              # Enum: dev, staging, prod
│   ├── di/
│   │   └── providers.dart           # 전역 Riverpod 제공자
│   ├── network/
│   │   └── dio_client.dart          # Dio 인스턴스 팩토리
│   ├── router/
│   │   └── app_router.dart          # go_router 라우트 정의
│   ├── theme/
│   │   └── app_theme.dart           # Material 3 라이트 + 다크 테마
│   └── error/
│       ├── app_exception.dart       # 커스텀 예외
│       └── failure.dart             # AsyncValue용 Failure 타입
├── features/                        # 기능 모듈 (격리됨)
│   └── hello/
│       ├── data/
│       │   └── hello_repository_impl.dart
│       ├── domain/
│       │   ├── entities/
│       │   │   └── hello.dart       # 데이터 클래스
│       │   └── repositories/
│       │       └── hello_repository.dart  # 추상 인터페이스
│       └── presentation/
│           ├── controllers/
│           │   └── hello_controller.dart  # Riverpod 제공자
│           ├── screens/
│           │   └── hello_screen.dart
│           └── widgets/
│               └── hello_card.dart
├── shared/                          # 크로스 기능 위젯, 유틸리티
│   └── widgets/
│       ├── error_view.dart
│       └── loading_view.dart
└── l10n/                            # 다국어화 (ARB 파일)
    ├── app_en.arb
    └── app_vi.arb
```

### 의존성 주입 (Riverpod)

**전역 제공자**는 `lib/core/di/providers.dart`에 위치:
- `flavorProvider` — 앱 flavor (dev/staging/prod), `main()`에서 오버라이드
- `envProvider` — 런타임 config (기본 URL, 기타), `main()`에서 오버라이드
- `dioProvider` — HTTP 클라이언트, env + flavor에 의존

**기능 제공자**는 `lib/features/<name>/presentation/controllers/`에 위치:
- `<name>ControllerProvider` — 상태를 관리하는 async notifier
- repository에 의존, 그것은 dioProvider에 의존

**테스트용 오버라이드 패턴:**
```dart
ProviderContainer(
  overrides: [
    dioProvider.overrideWithValue(mockDio),
    helloRepositoryProvider.overrideWithValue(FakeHelloRepository()),
  ],
);
```

### 상태 관리 (Riverpod)

각 기능은 async 컨트롤러를 가집니다:

```dart
// Plain Provider (스캐폴드 상태, 아직 build_runner 아님)
final helloRepositoryProvider = Provider<HelloRepository>(
  (ref) => HelloRepositoryImpl(ref.watch(dioProvider)),
);

// AsyncNotifierProvider (async fetch 상태 관리)
final helloControllerProvider = AsyncNotifierProvider<
  HelloController,
  HelloResponseDto,
>(HelloController.new);

class HelloController extends AsyncNotifier<HelloResponseDto> {
  @override
  Future<HelloResponseDto> build() async {
    return ref.watch(helloRepositoryProvider).getHello();
  }
}
```

**UI 사용:**
```dart
Consumer(builder: (ctx, ref, child) {
  final helloAsync = ref.watch(helloControllerProvider);
  return helloAsync.when(
    data: (hello) => Text(hello.message),
    loading: () => CircularProgressIndicator(),
    error: (err, stack) => ErrorView(error: err),
  );
})
```

## OpenAPI 코드생성 파이프라인

1. **백엔드 DTO 정의:**
   ```typescript
   // apps/api/src/modules/hello/dto/hello-response.dto.ts
   export class HelloResponseDto {
     @ApiProperty()
     message: string;

     @ApiProperty()
     timestamp: Date;
   }
   ```

2. **Controller 선언:**
   ```typescript
   @Controller('hello')
   export class HelloController {
     @Get()
     @ApiOperation({ operationId: 'getHello' })
     @ApiStandardResponse(HelloResponseDto)
     getHello(): HelloResponseDto { ... }
   }
   ```

3. **Swagger 스펙 생성:**
   - NestJS @nestjs/swagger는 데코레이터 읽음
   - 스펙은 `http://localhost:3000/api-docs/json` (dev)에서 자동 생성
   - `openapi.json`에 저장 (CI/CD)

4. **Dart 클라이언트 생성:**
   ```bash
   pnpm codegen:api  # openapi-generator 또는 유사 실행
   ```
   - 입력: `openapi.json`
   - 출력: `packages/api_client/lib/` (Dio 기반 REST 클라이언트)
   - 메서드 명은 `operationId`에서 유도 (예: `getHello()`)

5. **모바일 통합:**
   ```dart
   // 생성된 클라이언트는 기능 repository에 자동 주입
   final apiClient = ref.watch(apiClientProvider);
   final response = await apiClient.getHello();  // 타입 안전
   ```

## 다중 환경 설정

### 로컬 개발
- **백엔드:** `SKIP_DB=true` (hello 엔드포인트만) 또는 실제 Postgres
- **모바일:** `.env` with `API_BASE_URL=auto` → localhost:3000 (플랫폼당 자동 해결)

### Staging
- **백엔드:** Supabase staging 데이터베이스, 실제 인증 (JwtAuthGuard)
- **모바일:** `.env` with 명시적 staging API URL 또는 `flutter run --dart-define=API_BASE_URL=...`

### Production
- **백엔드:** Supabase production 데이터베이스, 인증, 모니터링
- **모바일:** 서명된 APK/IPA, 앱 서명 인증서, Play Store / App Store에 릴리스

## 데이터베이스 스키마 (Prisma)

`apps/api/prisma/schema.prisma`에 위치:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Supabase pgbouncer 해결책
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

**워크플로우:**
1. 스키마 편집
2. `pnpm --filter @mobile-boilerplate/api prisma migrate dev --name add_users`
3. `pnpm --filter @mobile-boilerplate/api prisma generate`
4. 자동 생성된 `PrismaClient` with 타입 안전 쿼리

## 보안 아키텍처

| 메커니즘 | 구현 | 강제 위치 |
|---|---|---|
| **기본 거부 인증** | NotImplementedAuthGuard (기본적으로 모든 라우트 401) | app.module.ts APP_GUARD |
| **공개 라우트 옵트인** | `@Public()` 데코레이터 | 컨트롤러당 또는 메서드당 |
| **입력 검증** | WhitelistPipe forbidNonWhitelisted | app.module.ts APP_PIPE |
| **속도 제한** | ThrottlerGuard (IP당 100 req/min) | app.module.ts APP_GUARD |
| **요청 ID 추적** | 요청당 UUID, 로깅 + 엔벨로프에서 반환 | TransformResponseInterceptor |
| **HTTPS (SSL)** | Reverse proxy (nginx/ALB) in production | Kubernetes/Docker 오케스트레이션 |
| **CORS** | Helmet middleware | app.module.ts imports |
| **SQL injection 방지** | Prisma 매개변수화된 쿼리 | ORM 계층 |

## 오류 처리

**백엔드 예외 → 표준화된 엔벨로프:**

```typescript
// AllExceptionsFilter는 모든 예외를 잡음
{
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "details": ["field1 must be a string"]
  },
  "meta": { "requestId": "..." }
}
```

**모바일이 수신:**
```dart
helloAsync.when(
  error: (err, stack) {
    // err은 statusCode, message를 가진 AppException
  },
);
```

## 모니터링 & 관찰성

- **로깅:** Pino (백엔드에서 구조화된 JSON 로그)
- **요청 추적:** meta의 requestId + 로그
- **오류 보고:** 모든 예외는 컨텍스트와 함께 로깅
- **성능:** LoggingInterceptor는 요청 기간 로깅
- **헬스 체크:** GET /health (인증 불필요)
