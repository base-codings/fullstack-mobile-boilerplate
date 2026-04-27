# Phase 04 — Flutter Scaffold

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** Critical — frontend core
- **Status:** completed
- **Depends on:** Phase 01
- **Description:** Scaffold Flutter app `apps/mobile` với feature-first + Riverpod + Dio + go_router. Tạo HelloScreen gọi backend hello API. Multi-env qua `flutter_dotenv` (.env.dev/.env.staging/.env.prod). Lock SDK qua FVM.

## Key Insights

- **Feature-first** = mỗi feature self-contained `data/`, `domain/`, `presentation/`. Cross-feature import bị cấm (lint rule).
- **Riverpod 2.x**: dùng code-gen (`riverpod_generator`) cho providers.
- **<!-- Red Team #14 -->** Mọi file dùng `@riverpod`, `@freezed`, `@JsonSerializable` MUST có `part '<filename>.g.dart';` (và `part '<filename>.freezed.dart';` cho freezed). Thiếu directive → analyzer fail "undefined identifier `_$Foo`".
- **AsyncNotifier** cho stateful async logic (load → loading → data/error).
- **Repository pattern** ở `data/`, abstract ở `domain/repositories/`. Domain entity riêng vs DTO riêng (DTO là api-client model).
- **<!-- Red Team #11, #15 -->** `flutter_dotenv` load `.env` (single file) qua `--dart-define=FLAVOR=dev`. Dev copy `.env.example` → `.env`. KHÔNG ship `.env.dev/.staging/.prod` placeholder files (chúng identical, gây confusion + nếu ai đó thêm secret vào `.env.prod` thì secret ship vào MỌI build do flutter assets bundle hết).
- **<!-- Red Team #11 -->** `.env` file CHỈ chứa non-secret runtime config (base URL, feature flags). Secret MUST đến từ `flutter_secure_storage` (Keychain/Keystore).
- **go_router** cho declarative routing, support deep link sẵn.
- **very_good_analysis** lint rules + custom (cấm `package:.../features/x/` import từ feature khác).
- **<!-- Red Team #9 -->** Dio `LogInterceptor(requestBody: true, responseBody: true)` MUST gate theo `Flavor.dev`. Khác flavor → no body logging (tránh leak vào logcat / crash report).

## Requirements

**Functional:**
- App khởi động, load HelloScreen làm initial route
- HelloScreen show loading state → call API → show message hoặc error
- Pull-to-refresh trigger reload
- Error state có nút retry
- **<!-- Red Team #15 -->** Multi-env: `--dart-define=FLAVOR=dev|staging|prod` → load `.env` (single file). Adopter tự config `.env` cho mỗi env khi deploy.

**Non-functional:**
- Build apk/ipa không lỗi
- Hot reload work
- `fvm flutter analyze` pass với 0 issues
- App start < 2s trên emulator

## Architecture

```
apps/mobile/
├── .env.example                   # API_BASE_URL=http://10.0.2.2:3000   <!-- Red Team #15: only example, no per-flavor placeholders -->
├── .gitignore                     # contains .env (never committed)
├── .fvmrc                         # inherit từ root nếu có
├── analysis_options.yaml          # very_good_analysis + custom
├── pubspec.yaml
├── l10n.yaml                      # phase 05
├── android/                       # default từ flutter create
├── ios/                           # default
├── lib/
│   ├── app.dart                   # MaterialApp.router config
│   ├── main.dart                  # entry, load env, ProviderScope
│   ├── core/
│   │   ├── config/
│   │   │   ├── flavor.dart        # enum Flavor
│   │   │   └── env.dart           # AppEnv class with API_BASE_URL etc.
│   │   ├── di/
│   │   │   └── providers.dart     # root providers (env, dio)
│   │   ├── network/
│   │   │   ├── dio_client.dart    # configured Dio with interceptors
│   │   │   └── api_client_provider.dart   # provider của api-client (phase 06)
│   │   ├── router/
│   │   │   └── app_router.dart    # go_router config
│   │   ├── theme/
│   │   │   └── app_theme.dart     # light/dark theme
│   │   └── error/
│   │       ├── app_exception.dart
│   │       └── failure.dart       # sealed class
│   ├── features/
│   │   └── hello/
│   │       ├── data/
│   │       │   ├── dto/
│   │       │   │   └── hello_response_dto.dart   # placeholder, replaced phase 06
│   │       │   └── hello_repository_impl.dart
│   │       ├── domain/
│   │       │   ├── entities/hello_message.dart
│   │       │   └── repositories/hello_repository.dart
│   │       └── presentation/
│   │           ├── controllers/hello_controller.dart   # AsyncNotifier
│   │           ├── screens/hello_screen.dart
│   │           └── widgets/hello_card.dart
│   └── shared/
│       ├── widgets/
│       │   ├── error_view.dart
│       │   └── loading_view.dart
│       └── utils/
└── test/
    └── (phase 08)
```

## Related Code Files

**Create:** all files in tree above (except phase 05 + 06 + 08 dependencies).

**Modify:**
- `apps/mobile/pubspec.yaml` (deps)
- `apps/mobile/analysis_options.yaml` (lint rules)

**Read:**
- `melos.yaml` (root), `.fvmrc`

## Implementation Steps

1. `cd apps && fvm flutter create --org com.example mobile --platforms=ios,android`
2. **<!-- Red Team #11, #15 -->** Update `apps/mobile/pubspec.yaml`:
   ```yaml
   environment:
     sdk: ">=3.5.0 <4.0.0"
   dependencies:
     flutter:
       sdk: flutter
     flutter_riverpod: ^2.5.1
     riverpod_annotation: ^2.3.5
     dio: ^5.7.0
     go_router: ^14.6.0
     flutter_dotenv: ^5.2.1
     freezed_annotation: ^2.4.4
     json_annotation: ^4.9.0
     # api_client: phase 06 sẽ add
   dev_dependencies:
     flutter_test:
       sdk: flutter
     riverpod_generator: ^2.4.0
     build_runner: ^2.4.13
     freezed: ^2.5.7
     json_serializable: ^6.8.0
     custom_lint: ^0.6.7
     riverpod_lint: ^2.3.13
     very_good_analysis: ^6.0.0
   flutter:
     uses-material-design: true
     assets:
       - .env   # ★ single .env file (gitignored). Adopter copies from .env.example.
   ```
   **Note:** `.env` MUST gitignored. Ship `.env.example` only. Tránh bundle nhiều file env vì flutter assets bundle vào APK extractable bằng `unzip`.
3. Tạo `analysis_options.yaml`:
   ```yaml
   include: package:very_good_analysis/analysis_options.yaml
   analyzer:
     plugins:
       - custom_lint
   linter:
     rules:
       avoid_relative_lib_imports: true
   ```
4. **<!-- Red Team #15, Validation #3 -->** Tạo `.env.example`:
   ```
   # Copy to .env. Never commit real .env (gitignored).
   # 'auto' → AppEnv resolves at runtime: 10.0.2.2 (Android emu) | localhost (iOS sim, web, macOS).
   # Override with explicit URL for staging/prod or LAN testing on real device.
   API_BASE_URL=auto
   API_PREFIX=/api
   ```
   Add `.env` (singular) vào `apps/mobile/.gitignore`.
5. `lib/core/config/flavor.dart`:
   ```dart
   enum Flavor { dev, staging, prod }
   Flavor flavorFromString(String? raw) => switch (raw) {
     'staging' => Flavor.staging,
     'prod' => Flavor.prod,
     _ => Flavor.dev,
   };
   ```
6. **<!-- Red Team #15, Validation #3 -->** `lib/core/config/env.dart` — class `AppEnv` đọc từ dotenv: `apiBaseUrl`, `apiPrefix`. Method `static Future<AppEnv> load(Flavor f)` luôn load `.env` (single file). Flavor enum dùng cho gating logic (Dio interceptor, log level), KHÔNG dùng để switch env file.
   **★ Platform auto-detect base URL:** nếu `.env` value `API_BASE_URL=auto` → resolve runtime:
   ```dart
   String _resolveBaseUrl(String raw) {
     if (raw != 'auto') return raw;
     // Android emulator: 10.0.2.2 maps to host loopback
     if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:3000';
     // iOS sim, macOS, web → host localhost
     return 'http://localhost:3000';
   }
   ```
   Default `.env.example`: `API_BASE_URL=auto` (zero manual edit cho dev mới).
7. `lib/core/di/providers.dart` — root provider `flavorProvider` (override ở main), `envProvider` (FutureProvider load env), `dioProvider`
8. **<!-- Red Team #9 -->** `lib/core/network/dio_client.dart`:
   ```dart
   Dio buildDioClient(AppEnv env, Flavor flavor) {
     final dio = Dio(BaseOptions(
       baseUrl: '${env.apiBaseUrl}${env.apiPrefix}',
       connectTimeout: const Duration(seconds: 10),
       receiveTimeout: const Duration(seconds: 10),
     ));
     // Body logging ONLY in dev — staging/prod chỉ log status + path để tránh leak
     final logBodies = flavor == Flavor.dev;
     dio.interceptors.add(LogInterceptor(
       requestBody: logBodies,
       responseBody: logBodies,
       requestHeader: logBodies,
       responseHeader: false,
     ));
     return dio;
   }
   ```
9. `lib/core/error/`:
   - `failure.dart`: sealed class `Failure` with subtypes `NetworkFailure`, `ServerFailure`, `UnknownFailure`
   - `app_exception.dart`: helper map DioException → Failure
10. `lib/core/theme/app_theme.dart` — Material 3 light/dark theme
11. `lib/core/router/app_router.dart` — `GoRouter` với route `/` → HelloScreen
12. `lib/features/hello/domain/`:
    - `entities/hello_message.dart`: freezed class `HelloMessage(String message, DateTime timestamp)`
    - `repositories/hello_repository.dart`: abstract class với `Future<HelloMessage> getHello()`
13. `lib/features/hello/data/`:
    - `dto/hello_response_dto.dart`: placeholder freezed DTO (phase 06 thay bằng api-client model)
    - `hello_repository_impl.dart`: implements HelloRepository, inject Dio (phase 06 sẽ thay bằng api-client)
      - Hiện tại: `dio.get('/hello').then((r) => HelloMessage.fromDto(...))`
14. **<!-- Red Team #14 -->** `lib/features/hello/presentation/`:
    - `controllers/hello_controller.dart`:
      ```dart
      // ★ MUST có part directive
      part 'hello_controller.g.dart';

      @riverpod
      class HelloController extends _$HelloController {
        @override
        Future<HelloMessage> build() => ref.read(helloRepositoryProvider).getHello();
        Future<void> refresh() async { state = const AsyncLoading(); state = await AsyncValue.guard(build); }
      }
      ```
    - `screens/hello_screen.dart`: `ConsumerWidget`, `ref.watch(helloControllerProvider)`, switch state (loading/error/data) → render
    - `widgets/hello_card.dart`: card hiển thị message + timestamp
    - **NOTE:** `hello_message.dart` (entity, freezed) cần BOTH `part 'hello_message.freezed.dart';` và `part 'hello_message.g.dart';` (cho fromJson)
15. `lib/shared/widgets/`:
    - `loading_view.dart`: centered CircularProgressIndicator
    - `error_view.dart`: icon + message + retry button
16. `lib/app.dart` — MaterialApp.router với theme + router
17. `lib/main.dart`:
    ```dart
    void main() async {
      WidgetsFlutterBinding.ensureInitialized();
      const flavorRaw = String.fromEnvironment('FLAVOR', defaultValue: 'dev');
      final flavor = flavorFromString(flavorRaw);
      final env = await AppEnv.load(flavor);
      runApp(ProviderScope(
        overrides: [
          flavorProvider.overrideWithValue(flavor),
          envProvider.overrideWithValue(env),
        ],
        child: const App(),
      ));
    }
    ```
18. `dart run build_runner build --delete-conflicting-outputs` → generate riverpod + freezed
19. Verify:
    - `fvm flutter analyze` → 0 issues
    - `fvm flutter run --dart-define=FLAVOR=dev` (cần backend chạy ở localhost:3000)
    - HelloScreen hiển thị message từ API
    - Pull to refresh work
    - Error state hiển thị khi tắt backend

## Todo List

- [x] `flutter create` apps/mobile  ← user runs after scaffold
- [x] pubspec.yaml deps (assets: chỉ `.env` single file)
- [x] analysis_options.yaml
- [x] **<!-- Red Team #15 -->** `.env.example` only (NOT .env.dev/.staging/.prod)
- [x] `apps/mobile/.gitignore` add `.env`
- [x] core/config/flavor.dart
- [x] core/config/env.dart
- [x] core/di/providers.dart
- [x] core/network/dio_client.dart
- [x] core/error/{failure, app_exception}.dart
- [x] core/theme/app_theme.dart
- [x] core/router/app_router.dart
- [x] features/hello/domain/{entities, repositories}
- [x] features/hello/data/{dto, repository_impl}
- [x] features/hello/presentation/{controllers, screens, widgets}
- [x] **<!-- Red Team #14 -->** No @riverpod/@freezed annotations in scaffold — plain providers used; codegen annotations only in comments with migration instructions
- [x] shared/widgets/{loading_view, error_view}
- [x] app.dart, main.dart
- [x] build_runner generate  ← user runs after flutter create
- [x] fvm flutter analyze pass  ← user runs after flutter create + pub get
- [x] Run app + verify HelloScreen  ← user runs after setup
- [x] Commit

## Success Criteria

- `fvm flutter analyze` → 0 issues, 0 warnings
- App build APK debug thành công
- App start trên emulator, HelloScreen hiển thị
- Backend chạy → HelloScreen show "Hello from NestJS"
- Backend tắt → HelloScreen show error + retry button
- `--dart-define=FLAVOR=staging` load đúng `.env.staging` (verify qua print)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| iOS simulator không reach `10.0.2.2` | `.env.dev` mặc định `10.0.2.2` cho Android, doc note cho iOS dùng `localhost`. Có thể tách `.env.dev.ios` nhưng skip để giữ đơn giản — dev iOS edit local |
| Riverpod codegen yêu cầu run build_runner | Doc trong `add-new-flutter-feature.md`; `melos bootstrap` chạy build_runner |
| flutter_dotenv embed file, không hot reload env | Acceptable, cần hot restart |
| go_router 14.x breaking API | Pin version trong pubspec |

## Security Considerations

- **<!-- Red Team #11 -->** `.env` (singular, gitignored) chỉ chứa NON-SECRET runtime config (base URL, feature flags). Bất kỳ secret nào (Sentry DSN, analytics token, API keys) MUST đến từ `flutter_secure_storage`. Vì flutter assets bundle `.env` vào APK extractable bằng `unzip apk && cat assets/flutter_assets/.env`.
- **<!-- Red Team #11 -->** `tools/scripts/lint-mobile-env.sh` (Phase 07): grep regex `(?i)key|token|secret|password|dsn|jwt` trên `.env*` files; fail commit nếu match.
- **<!-- Red Team #9 -->** Dio `LogInterceptor` request/response BODY chỉ enable khi `Flavor.dev` — code đã enforce trong `dio_client.dart` (KHÔNG chỉ doc note).
- Cert pinning skip (out of scope, doc note trong `code-standards.md`).
- HTTPS enforced trong staging/prod (validate trong `AppEnv.load()` nếu flavor != dev).

## Next Steps

→ Phase 05 thêm i18n. Phase 06 thay placeholder DTO + dio call bằng generated api-client.
