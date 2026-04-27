# Phase 08 — Sample Tests

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** High — demo cấu trúc test đúng
- **Status:** completed
- **Depends on:** Phase 02, Phase 04, Phase 06
- **Description:** Viết sample tối thiểu: backend (Jest unit + e2e cho HelloService/Controller), mobile (unit cho HelloController + widget cho HelloScreen). Mục đích: dev mới biết cách test theo đúng cấu trúc.

## Key Insights

- Backend Jest convention: unit `*.spec.ts` cạnh source, e2e `test/*.e2e-spec.ts` ở root.
- E2E dùng `@nestjs/testing` + supertest. Không cần boot DB cho hello (stateless).
- Flutter test: `test/` mirror `lib/` structure. Riverpod test dùng `ProviderContainer`.
- Widget test: `pumpWidget(ProviderScope(overrides: [...], child: ...))`.
- Mock dependencies: backend dùng provider override; Flutter dùng `mocktail` (preferred) cho HelloApi.

## Requirements

**Functional:**
- Backend:
  - `HelloService.getMessage()` unit test pass
  - `GET /api/hello` e2e test trả 200 + correct shape
- Mobile:
  - `HelloController` unit test: loading → data, loading → error
  - `HelloScreen` widget test: render loading state, render data state, render error state với retry button

**Non-functional:**
- Backend test < 5s
- Mobile test < 10s
- Coverage report được generate qua `pnpm test:cov`

## Architecture

```
apps/api/
├── src/modules/hello/
│   ├── hello.service.spec.ts         # ★ unit
│   └── hello.controller.spec.ts      # ★ unit (optional)
└── test/
    ├── hello.e2e-spec.ts             # ★ e2e
    └── jest-e2e.json

apps/mobile/test/
├── features/hello/
│   ├── hello_controller_test.dart    # ★
│   └── hello_screen_test.dart        # ★
└── helpers/
    ├── mock_hello_api.dart           # mocktail
    └── pump_app.dart                 # widget test helper
```

## Related Code Files

**Create:**
- `apps/api/src/modules/hello/hello.service.spec.ts`
- `apps/api/test/hello.e2e-spec.ts`
- `apps/mobile/test/features/hello/hello_controller_test.dart`
- `apps/mobile/test/features/hello/hello_screen_test.dart`
- `apps/mobile/test/helpers/mock_hello_api.dart`
- `apps/mobile/test/helpers/pump_app.dart`

**Modify:**
- `apps/api/test/jest-e2e.json` (config nếu chưa có)
- `apps/mobile/pubspec.yaml`: add `mocktail: ^1.0.4` to dev_dependencies

## Implementation Steps

1. **Backend unit test** `hello.service.spec.ts`:
   ```ts
   describe('HelloService', () => {
     let service: HelloService;
     beforeEach(async () => {
       const module = await Test.createTestingModule({ providers: [HelloService] }).compile();
       service = module.get(HelloService);
     });
     it('returns message and timestamp', () => {
       const r = service.getMessage();
       expect(r.message).toBe('Hello from NestJS');
       expect(new Date(r.timestamp).getTime()).not.toBeNaN();
     });
   });
   ```
2. **<!-- Red Team #3 -->** Backend e2e `test/hello.e2e-spec.ts` — MUST reuse `bootstrapApp(app)` từ `main.ts` để config = runtime:
   ```ts
   // Inject env BEFORE imports (same pattern as codegen export script)
   process.env.SKIP_DB = 'true';
   process.env.DATABASE_URL ??= 'postgresql://stub:stub@localhost:5432/stub';

   import { Test } from '@nestjs/testing';
   import { INestApplication } from '@nestjs/common';
   import * as request from 'supertest';
   import { AppModule } from '../src/app.module';
   import { bootstrapApp } from '../src/main';

   describe('Hello (e2e)', () => {
     let app: INestApplication;
     beforeAll(async () => {
       const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
       app = module.createNestApplication();
       await bootstrapApp(app);   // ★ same wiring as production main.ts
       await app.init();
     });
     afterAll(() => app.close());

     it('GET /api/hello → 200 with envelope shape', () =>
       request(app.getHttpServer())
         .get('/api/hello')                           // ★ global prefix applied
         .expect(200)
         .expect((r) => {
           expect(r.body.data.message).toBe('Hello from NestJS');
           expect(r.body.data.timestamp).toBeDefined();
           expect(r.body.requestId).toMatch(/.+/);    // ★ verify requestId actually populated
           expect(r.body.meta).toBeDefined();
         }));

     it('GET /api/hello respects @Public() (no 501 from NotImplementedAuthGuard)', () =>
       request(app.getHttpServer()).get('/api/hello').expect(200));
   });
   ```
   **<!-- Red Team #3 -->** Test giờ exercise: global prefix + ValidationPipe + AllExceptionsFilter + TransformResponseInterceptor + LoggingInterceptor (requestId) + NotImplementedAuthGuard + @Public bypass. Drift giữa test và prod = 0.
3. **Backend test config:**
   - `apps/api/test/jest-e2e.json`:
     ```json
     {
       "moduleFileExtensions": ["js", "json", "ts"],
       "rootDir": ".",
       "testRegex": ".e2e-spec.ts$",
       "transform": { "^.+\\.(t|j)s$": "ts-jest" }
     }
     ```
   - `apps/api/package.json` thêm `"test:cov": "jest --coverage"`
4. **Mobile mocktail** `pubspec.yaml` add: `mocktail: ^1.0.4`, `flutter_test: { sdk: flutter }` (đã có)
5. **Mobile mock helper** `test/helpers/mock_hello_api.dart`:
   ```dart
   import 'package:api_client/api_client.dart';
   import 'package:mocktail/mocktail.dart';
   class MockHelloApi extends Mock implements HelloApi {}
   ```
6. **Mobile pump_app helper** `test/helpers/pump_app.dart`:
   ```dart
   Future<void> pumpApp(WidgetTester tester, Widget child, {List<Override> overrides = const []}) {
     return tester.pumpWidget(
       ProviderScope(
         overrides: overrides,
         child: MaterialApp(
           localizationsDelegates: AppLocalizations.localizationsDelegates,
           supportedLocales: AppLocalizations.supportedLocales,
           home: child,
         ),
       ),
     );
   }
   ```
7. **Mobile controller test** `test/features/hello/hello_controller_test.dart`:
   - Tạo container với override `helloApiProvider` → MockHelloApi
   - Stub `helloControllerGetHello()` trả mock response
   - Read `helloControllerProvider`, verify state transitions
   - Test error case: stub throws DioException
8. **Mobile widget test** `test/features/hello/hello_screen_test.dart`:
   - Override providers
   - pumpApp(HelloScreen)
   - Verify loading state hiển thị
   - settle → verify message render
   - Test error state: tap retry button → verify api được call lại
9. **Run tests:**
   - Backend: `pnpm --filter @mobile-boilerplate/api test && pnpm --filter @mobile-boilerplate/api test:e2e`
   - Mobile: `cd apps/mobile && fvm flutter test`
10. **Coverage:**
    - Backend: `pnpm --filter @mobile-boilerplate/api test:cov` → coverage/
    - Mobile: `fvm flutter test --coverage` → coverage/lcov.info
11. Update root `package.json`:
    - `"test"`: `pnpm -r test && melos run test`
    - `"test:cov"`: `pnpm --filter @mobile-boilerplate/api test:cov && cd apps/mobile && fvm flutter test --coverage`

## Todo List

- [x] hello.service.spec.ts
- [x] hello.e2e-spec.ts
- [x] jest-e2e.json
- [x] backend test:cov script
- [x] pubspec add mocktail
- [x] mock_hello_api.dart
- [x] pump_app.dart helper
- [x] hello_controller_test.dart
- [x] hello_screen_test.dart
- [x] Run all tests pass
- [x] Coverage generate được
- [x] Commit

## Success Criteria

- `pnpm --filter @mobile-boilerplate/api test` → all pass
- `pnpm --filter @mobile-boilerplate/api test:e2e` → hello e2e pass
- `cd apps/mobile && fvm flutter test` → all pass
- Coverage backend ≥ 80% trên hello module
- Coverage mobile ≥ 60% trên hello feature
- Test runtime tổng < 30s

## Risk Assessment

| Risk | Mitigation |
|---|---|
| E2e import AppModule → boot Prisma | Test chỉ import HelloModule (isolated). Hoặc đặt `SKIP_DB=true` |
| Mocktail registerFallbackValue cho complex types | Doc trong `docs/code-standards.md` |
| Riverpod test cần ProviderContainer cleanup | pump_app hoặc tearDown disposeContainer |
| Flutter widget test load AppLocalizations cần delegate | pump_app helper bao đủ |

## Security Considerations

- Test không chứa real credential
- Mock không expose production data
- E2e không hit external network

## Next Steps

→ Phase 09 CI sẽ run tests này trên PR. Phase 11 docs `code-standards.md` reference cấu trúc test.
