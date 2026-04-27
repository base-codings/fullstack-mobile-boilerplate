# Kiến Trúc Hệ Thống

> 🌐 **Ngôn ngữ:** [English](../../system-architecture.md) · **Tiếng Việt** · [中文](../zh/system-architecture.md) · [한국어](../ko/system-architecture.md)

## Tổng Quan Luồng Dữ Liệu

```
┌─────────────────┐
│  Flutter App    │ (lib/core, lib/features, lib/shared)
│  (Riverpod)     │
└────────┬────────┘
         │
         │ Dio HTTP Client (tự động sinh từ OpenAPI spec)
         │
┌────────▼────────────────────────────────────────────┐
│  NestJS API Server (apps/api/src)                    │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Middleware: Helmet, CORS, request logging       │ │
│  │ Guards: ThrottlerGuard, NotImplementedAuthGuard │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Controllers (routes) & Services (business logic)│ │
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
│ - Schema in prisma/schema  │
│ - Auto-migrations          │
└───────────────────────────┘
```

## Response Envelope

Tất cả API responses (thành công hoặc lỗi) được bao trong một envelope tiêu chuẩn:

```json
{
  "data": { /* controller return value */ },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-04-27T00:00:00Z",
    "version": "1.0"
  },
  "error": null  // hoặc error object nếu status >= 400
}
```

**Được thực thi bởi:** `TransformResponseInterceptor` (thành công) + `AllExceptionsFilter` (lỗi)

**Generated client (Dart):** Deserialization được xử lý tự động. Response type là `data` field; `meta` + `requestId` có sẵn qua context.

## Kiến Trúc Backend

### Cấu Trúc Thư Mục (apps/api/src)

```
apps/api/src/
├── main.ts                          # Bootstrap: app creation + listen
├── app.module.ts                    # Root module: imports + global guards/pipes/interceptors
├── common/                          # Shared cross-module
│   ├── auth/
│   │   ├── decorators/              # @Public(), @RequireAuth()
│   │   ├── not-implemented-auth.guard.ts  # Stub (default-deny)
│   │   └── jwt-auth.guard.ts        # Swap in for real auth
│   ├── decorators/
│   │   └── api-standard-response.decorator.ts  # Wraps DTO + envelope for Swagger
│   ├── filters/
│   │   └── all-exceptions.filter.ts  # Formats errors to envelope
│   └── interceptors/
│       ├── logging.interceptor.ts   # Per-request timing
│       └── transform-response.interceptor.ts  # Wraps success data
├── config/
│   ├── config.module.ts             # ConfigModule.forRoot (isGlobal: true)
│   ├── app.config.ts                # NestJS config schema
│   └── env.schema.ts                # Joi validation for .env
├── infra/                           # Infrastructure
│   ├── logger/
│   │   └── logger.module.ts         # Pino structured logging
│   └── prisma/
│       ├── prisma.module.ts         # Global PrismaService
│       └── prisma.service.ts
└── modules/                         # Feature modules
    ├── hello/
    │   ├── hello.module.ts
    │   ├── hello.controller.ts      # Routes: GET /hello
    │   ├── hello.service.ts         # Business logic
    │   ├── dto/
    │   │   └── hello-response.dto.ts
    │   └── hello.service.spec.ts
    └── health/
        ├── health.module.ts
        └── health.controller.ts     # GET /health (liveness probe)
```

### Trách Nhiệm Từng Lớp

| Lớp | Trách Nhiệm | Ví Dụ |
|-------|---|---|
| **Controller** | HTTP routing, request parsing, response formatting | `@Get(':id')` path + query + body params |
| **Service** | Business logic, orchestration, error handling | Validate input, call repository, handle edge cases |
| **Repository** | Data access abstraction (tùy chọn nếu dùng Prisma trực tiếp) | Interface + implementation |
| **Prisma** | Type-safe database queries, migrations | `prisma.user.findUnique({ where: { id } })` |
| **Guard/Interceptor** | Cross-cutting: auth, logging, rate limiting | Applied globally hoặc per-route via decorators |
| **Filter** | Exception → HTTP response formatting | 400/401/500 → envelope with error details |
| **Decorator** | Metadata for routing, validation, Swagger docs | `@Public()`, `@ApiStandardResponse(Dto)` |

### Global Providers (app.module.ts)

| Provider | Mục Đích | Loại |
|---|---|---|
| APP_PIPE | ValidationPipe with whitelist + forbidNonWhitelisted | Prevents injection |
| APP_GUARD | NotImplementedAuthGuard (default-deny) | Security first; swap for JwtAuthGuard |
| APP_GUARD | ThrottlerGuard | Rate limit: 100 req/min per IP |
| APP_FILTER | AllExceptionsFilter | Formats errors to envelope |
| APP_INTERCEPTOR | LoggingInterceptor | Logs duration + status per request |
| APP_INTERCEPTOR | TransformResponseInterceptor | Wraps success responses in envelope |

## Kiến Trúc Frontend

### Cấu Trúc Thư Mục (apps/mobile/lib)

```
apps/mobile/lib/
├── main.dart                        # App entry + ProviderScope setup
├── app.dart                         # App widget with theme + routing
├── core/                            # Shared non-feature logic
│   ├── config/
│   │   ├── env.dart                 # AppEnv: FLAVOR, API_BASE_URL, etc.
│   │   └── flavor.dart              # Enum: dev, staging, prod
│   ├── di/
│   │   └── providers.dart           # Global Riverpod providers
│   ├── network/
│   │   └── dio_client.dart          # Dio instance factory
│   ├── router/
│   │   └── app_router.dart          # go_router route definitions
│   ├── theme/
│   │   └── app_theme.dart           # Material 3 light + dark themes
│   └── error/
│       ├── app_exception.dart       # Custom exceptions
│       └── failure.dart             # Failure types for AsyncValue
├── features/                        # Feature modules (isolated)
│   └── hello/
│       ├── data/
│       │   └── hello_repository_impl.dart
│       ├── domain/
│       │   ├── entities/
│       │   │   └── hello.dart       # Data class
│       │   └── repositories/
│       │       └── hello_repository.dart  # Abstract interface
│       └── presentation/
│           ├── controllers/
│           │   └── hello_controller.dart  # Riverpod provider
│           ├── screens/
│           │   └── hello_screen.dart
│           └── widgets/
│               └── hello_card.dart
├── shared/                          # Cross-feature widgets, utilities
│   └── widgets/
│       ├── error_view.dart
│       └── loading_view.dart
└── l10n/                            # Internationalization (ARB files)
    ├── app_en.arb
    └── app_vi.arb
```

### Dependency Injection (Riverpod)

**Global providers** live in `lib/core/di/providers.dart`:
- `flavorProvider` — app flavor (dev/staging/prod), overridden in `main()`
- `envProvider` — runtime config (base URL, etc.), overridden in `main()`
- `dioProvider` — HTTP client, depends on env + flavor

**Feature providers** live in `lib/features/<name>/presentation/controllers/`:
- `<name>ControllerProvider` — async notifier managing state
- Depends on repository, which depends on dioProvider

**Override pattern for tests:**
```dart
ProviderContainer(
  overrides: [
    dioProvider.overrideWithValue(mockDio),
    helloRepositoryProvider.overrideWithValue(FakeHelloRepository()),
  ],
);
```

### State Management (Riverpod)

Mỗi feature có một async controller:

```dart
// Plain Provider (scaffold state, no build_runner yet)
final helloRepositoryProvider = Provider<HelloRepository>(
  (ref) => HelloRepositoryImpl(ref.watch(dioProvider)),
);

// AsyncNotifierProvider (manage async fetch state)
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

**UI consumes:**
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

## OpenAPI Code Generation Pipeline

1. **Backend DTO Definition:**
   ```typescript
   // apps/api/src/modules/hello/dto/hello-response.dto.ts
   export class HelloResponseDto {
     @ApiProperty()
     message: string;

     @ApiProperty()
     timestamp: Date;
   }
   ```

2. **Controller Declaration:**
   ```typescript
   @Controller('hello')
   export class HelloController {
     @Get()
     @ApiOperation({ operationId: 'getHello' })
     @ApiStandardResponse(HelloResponseDto)
     getHello(): HelloResponseDto { ... }
   }
   ```

3. **Swagger Spec Generation:**
   - NestJS @nestjs/swagger reads decorators
   - Spec auto-generated at `http://localhost:3000/api-json` (dev)
   - Saved to `openapi.json` (CI/CD)

4. **Dart Client Generation:**
   ```bash
   pnpm codegen:api  # Runs openapi-generator or similar
   ```
   - Input: `openapi.json`
   - Output: `packages/api_client/lib/` (Dio-based REST client)
   - Method name derived from `operationId` (e.g., `getHello()`)

5. **Mobile Integration:**
   ```dart
   // Generated client auto-injected into feature repository
   final apiClient = ref.watch(apiClientProvider);
   final response = await apiClient.getHello();  // Type-safe
   ```

## Multi-Environment Setup

### Local Development
- **Backend:** `SKIP_DB=true` (hello endpoint only) hoặc real Postgres
- **Mobile:** `.env` với `API_BASE_URL=auto` → localhost:3000 (auto-resolved per platform)

### Staging
- **Backend:** Supabase staging database, real auth (JwtAuthGuard)
- **Mobile:** `.env` với explicit staging API URL hoặc `flutter run --dart-define=API_BASE_URL=...`

### Production
- **Backend:** Supabase production database, auth, monitoring
- **Mobile:** Signed APK/IPA, app-signing cert, released to Play Store / App Store

## Database Schema (Prisma)

Located in `apps/api/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Supabase pgbouncer workaround
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

**Workflow:**
1. Edit schema
2. `pnpm --filter @mobile-boilerplate/api prisma migrate dev --name add_users`
3. `pnpm --filter @mobile-boilerplate/api prisma generate`
4. Auto-generated `PrismaClient` with type-safe queries

## Kiến Trúc Bảo Mật

| Cơ Chế | Triển Khai | Thực Thi Tại |
|---|---|---|
| **Default-deny auth** | NotImplementedAuthGuard (401 all routes by default) | app.module.ts APP_GUARD |
| **Public route opt-in** | `@Public()` decorator | Per-controller or per-method |
| **Input validation** | WhitelistPipe forbidNonWhitelisted | app.module.ts APP_PIPE |
| **Rate limiting** | ThrottlerGuard (100 req/min per IP) | app.module.ts APP_GUARD |
| **Request ID tracing** | UUID per request, logged + returned in envelope | TransformResponseInterceptor |
| **HTTPS (SSL)** | Reverse proxy (nginx/ALB) in production | Kubernetes/Docker orchestration |
| **CORS** | Helmet middleware | app.module.ts imports |
| **SQL injection prevention** | Prisma parameterized queries | ORM layer |

## Xử Lý Lỗi

**Backend exceptions → standardized envelope:**

```typescript
// AllExceptionsFilter catches all exceptions
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

**Mobile receives:**
```dart
helloAsync.when(
  error: (err, stack) {
    // err is AppException with statusCode, message
  },
);
```

## Monitoring & Observability

- **Logging:** Pino (structured JSON logs on backend)
- **Request tracing:** requestId in meta + logs
- **Error reporting:** All exceptions logged with context
- **Performance:** LoggingInterceptor logs request duration
- **Health checks:** GET /health (no auth required)
