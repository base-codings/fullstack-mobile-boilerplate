# Phase 02 — NestJS Scaffold

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** Critical — backend core
- **Status:** completed
- **Depends on:** Phase 01
- **Description:** Scaffold NestJS app `apps/api` với modular monolith pattern: hello module (stateless), common (filters/interceptors), config (env validation), Pino logger. Chưa attach Prisma (phase 03).

## Key Insights

- Idiomatic NestJS: feature module = `controller + service + dto + module`. Keep modules small, focused.
- `common/` cho cross-cutting concerns (filters, interceptors, pipes, decorators).
- `config/` validate env qua `zod` (preferred) hoặc `class-validator`.
- Pino: `nestjs-pino` package, structured JSON log, request-id correlation.
- Swagger setup mặc định ngay từ đầu để phase 06 dùng được.
- **<!-- Red Team #3 -->** Standard response shape via `TransformResponseInterceptor`: wrapper `{ data, meta, requestId }`. **Quan trọng:** Swagger phải khai báo wrapper qua `@ApiStandardResponse(Type)` decorator, KHÔNG dùng `@ApiOkResponse({ type })` raw — nếu không codegen sẽ sinh sai contract. Mọi controller MUST dùng `@ApiStandardResponse`.
- Global exception filter: format error response chuẩn `{ error: { code, message, details }, requestId }`.
- **<!-- Red Team #6 -->** Security defaults: `helmet` middleware ON by default, Swagger UI gated theo `NODE_ENV !== 'production'`, `@nestjs/throttler` rate-limit ON by default.
- **<!-- Red Team #7 -->** Auth-by-default pattern: ship `@RequireAuth()` decorator + `NotImplementedAuthGuard` throwing 501. Mọi controller MUST decorate với `@RequireAuth()` hoặc `@Public()` explicit. Hello + Health = `@Public()`.
- **<!-- Red Team #9 -->** Pino MUST có `redact:` array bao authorization header, cookie, password, token, email patterns. Test environment: pino level `silent`.
- **<!-- Red Team #3 -->** Extract `bootstrapApp(app)` function trong `main.ts` để e2e tests reuse — đảm bảo test config = runtime config.

## Requirements

**Functional:**
- `GET /api/hello` trả `{ message: string, timestamp: string }`
- Swagger docs ở `/api-docs` (UI) và `/api-docs/json` (spec)
- Health check `GET /api/health` trả `{ status: 'ok' }`
- Pino log mỗi request với requestId
- Env validation: app fail fast nếu thiếu env

**Non-functional:**
- Build qua `tsc` (Nest default)
- Hot reload `pnpm dev`
- All response wrapped consistent shape

## Architecture

```
apps/api/
├── src/
│   ├── common/
│   │   ├── filters/all-exceptions.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform-response.interceptor.ts
│   │   ├── decorators/api-standard-response.decorator.ts
│   │   └── index.ts
│   ├── config/
│   │   ├── env.schema.ts          # zod schema
│   │   ├── app.config.ts          # ConfigService wrapper
│   │   └── config.module.ts
│   ├── infra/
│   │   └── logger/
│   │       └── logger.module.ts   # nestjs-pino
│   ├── modules/
│   │   ├── hello/
│   │   │   ├── dto/hello-response.dto.ts
│   │   │   ├── hello.controller.ts
│   │   │   ├── hello.service.ts
│   │   │   └── hello.module.ts
│   │   └── health/
│   │       ├── health.controller.ts
│   │       └── health.module.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   └── jest-e2e.json              # e2e config (specs added phase 08)
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.mjs              # flat config
├── .prettierrc
└── package.json
```

## Related Code Files

**Create:**
- All files in tree above
- `apps/api/.env.example`:
  ```
  NODE_ENV=development
  PORT=3000
  API_PREFIX=api
  CORS_ORIGINS=http://localhost:*
  LOG_LEVEL=debug
  # DATABASE_URL=postgresql://...:6543/postgres?pgbouncer=true   # phase 03
  # DIRECT_URL=postgresql://...:5432/postgres                    # phase 03
  ```

**Read:**
- `package.json` root (để link Volta + engines)

## Implementation Steps

1. `cd apps/api && pnpm init`; set name `@mobile-boilerplate/api`, private true
2. Install deps:
   ```
   pnpm add @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/swagger \
     @nestjs/throttler helmet \
     reflect-metadata rxjs zod nestjs-pino pino pino-http pino-pretty class-transformer class-validator
   pnpm add -D @nestjs/cli @nestjs/testing typescript ts-node tsconfig-paths @types/node \
     @types/express jest ts-jest @types/jest supertest @types/supertest \
     eslint @eslint/js typescript-eslint prettier eslint-config-prettier eslint-plugin-import
   ```
   <!-- Red Team #6 --> Note: `helmet` + `@nestjs/throttler` là security defaults (KHÔNG optional).
3. Tạo `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json` (Nest CLI defaults)
4. Tạo `eslint.config.mjs` (flat config) với rule cấm cross-module deep imports:
   - `no-restricted-imports`: pattern `src/modules/*/!(index)`
5. Tạo `src/config/env.schema.ts` — zod schema validate `PORT, NODE_ENV, API_PREFIX, LOG_LEVEL, CORS_ORIGINS`
6. Tạo `src/config/config.module.ts` — `ConfigModule.forRoot({ validate, isGlobal: true, envFilePath: '.env' })`
7. Tạo `src/infra/logger/logger.module.ts` — `LoggerModule.forRootAsync` với pino:
   - `NODE_ENV === 'production'` → JSON
   - `NODE_ENV === 'test'` → `level: 'silent'` (tránh flood test output)
   - else → `pino-pretty`
   - **<!-- Red Team #9 -->** `redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.token', 'req.body.refreshToken', '*.email', 'res.headers["set-cookie"]'], censor: '[REDACTED]' }`
8. Tạo `src/common/filters/all-exceptions.filter.ts` — catch `HttpException` + `Error`, format `{ error: { code, message, details }, requestId }`, log via Pino
9. Tạo `src/common/interceptors/transform-response.interceptor.ts` — wrap response thành `{ data, meta, requestId }` (skip nếu controller dùng `@SkipTransform()`)
10. Tạo `src/common/interceptors/logging.interceptor.ts` — log request/response duration
10b. **<!-- Red Team #7 -->** Tạo `src/common/auth/`:
    - `not-implemented-auth.guard.ts`: `canActivate()` → throw `new NotImplementedException('Auth not configured. Implement AuthGuard or decorate route with @Public()')`
    - `decorators/require-auth.decorator.ts`: `RequireAuth = () => UseGuards(NotImplementedAuthGuard)`
    - `decorators/public.decorator.ts`: `Public = () => SetMetadata('isPublic', true)` + `NotImplementedAuthGuard.canActivate` checks reflector for `isPublic` and bypasses if true
    - Export ở `common/index.ts`
11. Tạo `src/modules/health/`:
    - `HealthController` với `@Controller('health')` + `@Public()` + `@Get()` trả `{ status: 'ok', timestamp }`
    - `HealthModule` register
12. **<!-- Red Team #1 -->** Tạo `src/modules/hello/`:
    - `HelloResponseDto` với `@ApiProperty()`: `message: string`, `timestamp: string`
    - `HelloService.getMessage()` trả `{ message: 'Hello from NestJS', timestamp: new Date().toISOString() }`
    - **`HelloController` với `@Controller('hello')` + `@Public()` + `@Get()` + `@ApiOperation({ operationId: 'getHello' })` + `@ApiStandardResponse(HelloResponseDto)`** ← path segment + public marker + custom operationId + envelope-aware swagger decorator (KHÔNG dùng `@ApiOkResponse({ type })` raw)
    - `HelloModule` register
13. Tạo `src/app.module.ts` — import ConfigModule, LoggerModule, HelloModule, HealthModule
14. **<!-- Red Team #3, #6, #7, #8 -->** Tạo `src/main.ts`:
    - **Extract `bootstrapApp(app)` function** chứa toàn bộ wiring globals (để e2e tests reuse — Phase 08 import function này)
    - Bootstrap Nest app với Pino logger
    - **`app.use(helmet())`** trước mọi middleware
    - **`ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])`** trong AppModule
    - Global pipes: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true, transform: true, transformOptions: { enableImplicitConversion: false } })`
    - Global filters: `AllExceptionsFilter`
    - Global interceptors: `LoggingInterceptor`, `TransformResponseInterceptor`
    - Global guards: `NotImplementedAuthGuard` (default deny; bypass khi route có `@Public()`)
    - Global prefix từ env (default `api`)
    - CORS từ env: `origin` parsed thành array exact strings, REJECT `*` khi `credentials: true`
    - **<!-- Validation #4 -->** Swagger: chỉ mount khi `NODE_ENV === 'development'` HOẶC `ENABLE_SWAGGER=true` (KHÔNG include staging/prod by default — explicit opt-in qua env). `DocumentBuilder().setTitle('Mobile Boilerplate API').setVersion('1.0').addBearerAuth().build()`, mount `/api-docs`
    - Listen on `PORT`
15. Update `apps/api/package.json` scripts:
    - `dev`: `nest start --watch`
    - `build`: `nest build`
    - `start`: `node dist/main`
    - `lint`: `eslint . --max-warnings=0`
    - `format`: `prettier --write .`
    - `test`: `jest`
    - `test:e2e`: `jest --config test/jest-e2e.json`
16. Verify `pnpm dev` boot, `curl localhost:3000/api/hello` trả 200, `/api-docs` mở UI

## Todo List

- [x] `pnpm init` apps/api
- [x] Install deps
- [x] tsconfig + nest-cli.json
- [x] ESLint flat config + cross-module rule
- [x] env.schema.ts (zod)
- [x] ConfigModule
- [x] LoggerModule (Pino)
- [x] AllExceptionsFilter
- [x] TransformResponseInterceptor
- [x] LoggingInterceptor
- [x] HealthModule
- [x] HelloModule (DTO + Service + Controller)
- [x] AppModule
- [x] main.ts with Swagger
- [x] Scripts trong package.json
- [x] Verify `curl /api/hello` trả 200
- [x] Verify `/api-docs` mở UI
- [x] Commit

## Success Criteria

- `pnpm dev` boot không lỗi
- `curl http://localhost:3000/api/hello` trả `{ "data": { "message": "Hello from NestJS", "timestamp": "..." }, "meta": {}, "requestId": "..." }`
- `curl http://localhost:3000/api/health` trả `{ "data": { "status": "ok" }, ... }`
- `http://localhost:3000/api-docs` hiển thị Swagger UI với HelloController + HealthController
- `http://localhost:3000/api-docs/json` trả OpenAPI 3.0 spec
- `pnpm lint` pass với 0 warnings
- Pino log JSON với requestId trên mỗi request

## Risk Assessment

| Risk | Mitigation |
|---|---|
| zod vs class-validator chọn 1 nhưng cần consistent | Chọn zod cho env, class-validator cho DTO (chuẩn Nest). Doc rõ trong code-standards.md |
| TransformResponseInterceptor đụng Swagger response shape | Dùng `@ApiExtraModels` + custom decorator `@ApiStandardResponse(Type)` để wrap proper |
| Pino pretty trong prod gây perf issue | `pino-pretty` chỉ load khi `NODE_ENV !== 'production'` |

## Security Considerations

- **<!-- Red Team #8 -->** ValidationPipe `whitelist + forbidNonWhitelisted + forbidUnknownValues + transform với enableImplicitConversion: false` — chống type coercion attack
- **<!-- Red Team #2 -->** CORS origins validated từ env thành array exact strings; default empty (deny). Reject `*` khi credentials enabled. Native mobile client không cần CORS — chỉ enable cho web debug
- **<!-- Red Team #6, Validation #4 -->** `helmet` ON BY DEFAULT (KHÔNG optional). Swagger UI gated `NODE_ENV === 'development'` (default OFF in staging+prod) hoặc `ENABLE_SWAGGER=true` opt-in. Throttler ON.
- **<!-- Red Team #7 -->** Default-deny auth: `NotImplementedAuthGuard` global. Endpoint phải explicit `@Public()` hoặc thay bằng real AuthGuard. Tránh ship endpoint kh無 auth bằng cách bỏ quên decorator.
- **<!-- Red Team #9 -->** Pino `redact:` array bao authorization, cookie, password, token, email. Test mode: silent.
- `.env.example` không chứa secret thật
- Log không expose stack trace cho client (chỉ log internal)

## Next Steps

→ Phase 03 attach PrismaModule. Phase 06 dùng `/api-docs/json` cho codegen.
