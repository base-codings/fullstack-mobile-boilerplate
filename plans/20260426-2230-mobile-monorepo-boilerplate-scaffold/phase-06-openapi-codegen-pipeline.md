# Phase 06 — OpenAPI Codegen Pipeline

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** Critical — đảm bảo type-safety end-to-end
- **Status:** completed
- **Depends on:** Phase 02, Phase 04
- **Description:** NestJS đã expose `/api-docs/json`. Build pipeline: dump spec → run openapi-generator-cli (Dart-Dio template) → output `packages/api-client`. Flutter app chuyển từ raw Dio call sang generated client.

## Key Insights

- `openapi-generator-cli` là Java tool — chạy qua npm wrapper `@openapitools/openapi-generator-cli` (no need install JDK if user has Docker, hoặc tool tự tải JDK runtime).
- Dart template `dart-dio` (Dio-based, support null-safety, freezed-style models).
- Generated package có pubspec riêng, được Melos pickup tự động (`packages/api_client`).
- Flow: backend phải boot → `curl /api-docs/json` → save spec → generate. Hoặc dùng `nest build` + script export spec offline (preferred — không cần boot DB).
- Offline export script: `ts-node tools/codegen/export-openapi.ts` → import AppModule, build app, dump SwaggerModule.createDocument(), write file.
- **<!-- Red Team #2, #3 -->** Hai khó khăn ràng buộc nhau:
  1. AppModule import → ConfigModule validate env → fail nếu thiếu `DATABASE_URL`. **Fix:** export script phải set `SKIP_DB=true` AND inject stub `DATABASE_URL=postgresql://stub:stub@localhost:5432/stub` qua process.env trước khi `NestFactory.create()`.
  2. TransformResponseInterceptor wrap response → Swagger spec phải declare envelope shape, KHÔNG raw DTO. **Fix:** `@ApiStandardResponse(Type)` decorator (Phase 02) wrap `{ data: Type, meta, requestId }` schema. Codegen sinh `Response<EnvelopeOf<HelloResponseDto>>`. Repository unwrap `res.data!.data!`.
- **<!-- Red Team #5 -->** `packages/api_client/` MUST có stub skeleton commit từ đầu (Phase 01) để `flutter pub get` resolve được path dep trên fresh clone TRƯỚC khi codegen chạy lần đầu.

## Requirements

**Functional:**
- Script `pnpm codegen:api` (root) regen `packages/api_client` từ NestJS spec
- Output `packages/api_client/lib/api_client.dart` (entry) + models + apis
- Flutter `apps/mobile` import api_client qua `path: ../../packages/api_client` (Melos resolve)
- HelloScreen dùng generated API client thay vì raw Dio
- CI check: nếu spec đổi mà api_client không regen → fail

**Non-functional:**
- Codegen chạy < 30s
- Generated code không commit nếu deterministic, hoặc commit để diff dễ review (chọn: **commit** để code review thấy được API drift)

## Architecture

```
tools/codegen/
├── export-openapi.ts            # ★ Nest app → openapi.json (no boot DB)
├── generate-api-client.sh       # ★ orchestrate: export + run generator
└── openapi-config.yaml          # generator config

packages/
└── api_client/                  # generated
    ├── lib/
    │   ├── api_client.dart
    │   ├── api/                 # DefaultApi, HelloApi, UsersApi
    │   └── model/               # HelloResponseDto, UserResponseDto, ...
    ├── pubspec.yaml             # generated
    └── README.md

apps/mobile/lib/
├── core/network/
│   └── api_client_provider.dart # ★ provider của generated ApiClient
└── features/hello/
    ├── data/hello_repository_impl.dart   # use generated HelloApi
    └── data/dto/                          # ✗ removed, dùng api_client model
```

## Related Code Files

**Create:**
- `tools/codegen/export-openapi.ts`
- `tools/codegen/generate-api-client.sh`
- `tools/codegen/openapi-config.yaml`
- `apps/mobile/lib/core/network/api_client_provider.dart`

**Modify:**
- Root `package.json`: add devDep `@openapitools/openapi-generator-cli`, script `codegen:api`
- `apps/mobile/pubspec.yaml`: add `api_client: { path: ../../packages/api_client }`
- `apps/mobile/lib/features/hello/data/hello_repository_impl.dart`: use generated `HelloApi`
- `apps/mobile/lib/features/hello/domain/entities/hello_message.dart`: add `fromDto(HelloResponseDto)` factory
- `melos.yaml`: ensure `packages/api_client` listed

**Delete:**
- `apps/mobile/lib/features/hello/data/dto/hello_response_dto.dart` (replaced by generated)

## Implementation Steps

1. Install codegen tool ở root: `pnpm add -Dw @openapitools/openapi-generator-cli`
2. **<!-- Red Team #2, #3 -->** Tạo `tools/codegen/export-openapi.ts`:
   ```ts
   // ★ Inject env BEFORE any nest import — ConfigModule validates at module load time
   process.env.SKIP_DB = 'true';
   process.env.DATABASE_URL ??= 'postgresql://stub:stub@localhost:5432/stub';
   process.env.NODE_ENV ??= 'development';
   process.env.ENABLE_SWAGGER = 'true';

   import { NestFactory } from '@nestjs/core';
   import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
   import { writeFileSync, mkdirSync } from 'node:fs';
   import { dirname, resolve } from 'node:path';
   import { AppModule } from '../../apps/api/src/app.module';

   async function main() {
     const app = await NestFactory.create(AppModule, { logger: false });
     const config = new DocumentBuilder()
       .setTitle('Mobile Boilerplate API')
       .setVersion('1.0')
       .addBearerAuth()
       .build();
     const document = SwaggerModule.createDocument(app, config);
     const out = resolve(__dirname, 'openapi.json');
     mkdirSync(dirname(out), { recursive: true });
     writeFileSync(out, JSON.stringify(document, null, 2));
     await app.close();
     console.log('✓ Exported OpenAPI spec to', out);
   }
   main().catch((e) => { console.error(e); process.exit(1); });
   ```
   **<!-- Red Team #2 -->** SKIP_DB short-circuit MUST đã implement ở Phase 03 PrismaService + env.schema.
   **<!-- Red Team #3 -->** Spec sẽ chứa envelope schema vì Phase 02 dùng `@ApiStandardResponse(HelloResponseDto)`. Verify sau khi run: `cat openapi.json | jq '.paths."/hello".get.responses["200"].content."application/json".schema'` phải có `data` property bao DTO.
3. Tạo `tools/codegen/openapi-config.yaml`:
   ```yaml
   generatorName: dart-dio
   inputSpec: tools/codegen/openapi.json
   outputDir: packages/api_client
   additionalProperties:
     pubName: api_client
     pubLibrary: api_client.api
     useEnumExtension: true
     nullableFields: true
   ```
4. **<!-- Red Team #2 -->** Tạo `tools/codegen/generate-api-client.sh`:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   cd "$(dirname "$0")/../.."

   echo "→ Exporting OpenAPI spec..."
   # Run from root; use dedicated tools/codegen/tsconfig.json to bypass apps/api rootDir restriction
   pnpm exec ts-node --project tools/codegen/tsconfig.json tools/codegen/export-openapi.ts

   echo "→ Generating Dart client..."
   pnpm exec openapi-generator-cli generate -c tools/codegen/openapi-config.yaml

   echo "→ Running build_runner in api_client..."
   cd packages/api_client
   fvm dart pub get
   fvm dart run build_runner build --delete-conflicting-outputs

   echo "✓ api_client regenerated"
   ```
   `chmod +x` script.

   **<!-- Red Team #2 -->** Tạo `tools/codegen/tsconfig.json`:
   ```json
   {
     "extends": "../../apps/api/tsconfig.json",
     "compilerOptions": {
       "rootDir": "../..",
       "outDir": "./dist"
     },
     "include": ["./*.ts", "../../apps/api/src/**/*.ts"]
   }
   ```
5. Update root `package.json` script: `"codegen:api": "bash tools/codegen/generate-api-client.sh"`
6. Update `melos.yaml` packages: thêm `packages/api_client`
7. Update `apps/mobile/pubspec.yaml`:
   ```yaml
   dependencies:
     api_client:
       path: ../../packages/api_client
   ```
8. Tạo `apps/mobile/lib/core/network/api_client_provider.dart`:
   ```dart
   import 'package:api_client/api_client.dart';
   final apiClientProvider = Provider<ApiClient>((ref) {
     final dio = ref.watch(dioProvider);
     return ApiClient(dio: dio);   // hoặc theo signature generator output
   });

   final helloApiProvider = Provider<HelloApi>((ref) {
     return ref.watch(apiClientProvider).getHelloApi();
   });
   ```
9. **<!-- Red Team #3 -->** Update `hello_repository_impl.dart` — UNWRAP envelope:
   ```dart
   class HelloRepositoryImpl implements HelloRepository {
     HelloRepositoryImpl(this._api);
     final HelloApi _api;
     @override
     Future<HelloMessage> getHello() async {
       final res = await _api.getHello();           // operationId 'getHello'
       final envelope = res.data!;                  // EnvelopeOfHelloResponseDto
       final dto = envelope.data!;                  // HelloResponseDto (unwrap envelope)
       return HelloMessage(message: dto.message, timestamp: DateTime.parse(dto.timestamp));
     }
   }
   ```
10. Delete placeholder `data/dto/hello_response_dto.dart`
11. Update controller provider để inject HelloApi qua helloApiProvider
12. First run: `pnpm codegen:api` từ root
13. Verify:
    - `packages/api_client/lib/api/hello_api.dart` exists với method `helloControllerGetHello()`
    - `fvm flutter analyze` pass
    - App run + HelloScreen vẫn hoạt động (nay dùng generated client)
    - Test: thêm field mới vào HelloResponseDto bên Nest → `pnpm codegen:api` → field xuất hiện ở Dart model

## Todo List

- [x] Install @openapitools/openapi-generator-cli
- [x] tools/codegen/export-openapi.ts
- [x] PrismaService support SKIP_DB env
- [x] tools/codegen/openapi-config.yaml
- [x] tools/codegen/generate-api-client.sh + chmod
- [x] root package.json script codegen:api
- [x] melos.yaml add api_client
- [x] apps/mobile/pubspec.yaml api_client path dep
- [x] api_client_provider.dart
- [x] Update hello_repository_impl.dart use generated client
- [x] Delete placeholder DTO
- [x] First run codegen:api
- [x] Verify HelloScreen still works
- [x] Test API drift detection
- [x] Commit

## Success Criteria

- `pnpm codegen:api` từ root regen thành công < 30s
- `packages/api_client/lib/api/hello_api.dart` có method match HelloController
- HelloScreen vẫn hiển thị message đúng (dùng generated client)
- `fvm flutter analyze` pass
- Thêm field mới ở Nest DTO → regen → Flutter analyze fail nếu không update consumer (proves type-safety)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| openapi-generator-cli cần Java | npm wrapper auto-tải JDK; fallback doc cách install JDK manual |
| **<!-- Red Team #2 -->** AppModule env validation crash trước khi PrismaService skip | export-openapi.ts inject `process.env.SKIP_DB=true` + stub `DATABASE_URL` BEFORE imports; env.schema.ts (Phase 03) cho phép DATABASE_URL optional khi SKIP_DB |
| **<!-- Red Team #2 -->** ts-node rootDir restriction từ apps/api/tsconfig | Dedicated `tools/codegen/tsconfig.json` extend api tsconfig với rootDir mở rộng |
| **<!-- Red Team #3 -->** TransformResponseInterceptor + Swagger contract divergence | Phase 02 enforce mọi controller dùng `@ApiStandardResponse(Type)` decorator (envelope-aware). Verify spec sau export bằng jq script |
| **<!-- Red Team #5 -->** Fresh clone: `flutter pub get` fails vì `packages/api_client/` chưa tồn tại | Phase 01 commit stub skeleton (`packages/api_client/{pubspec.yaml, lib/api_client.dart}` tối thiểu); pnpm bootstrap order: install → codegen → melos bootstrap |
| Generated code style khác convention | Dart formatter + analyzer config bypass cho `packages/api_client/lib/**` (`exclude:` trong analysis_options.yaml) |
| Drift giữa spec và generated → dev quên regen | CI workflow `codegen-check.yml` (phase 09) regen + git diff fail nếu khác |
| Method names xấu (e.g. `helloControllerGetHello`) | Phase 02 mọi controller MUST set `@ApiOperation({ operationId: 'verbNoun' })` (e.g. `getHello`) |

## Security Considerations

- `openapi.json` không chứa example data nhạy cảm
- Generated client không expose internal validation rules client-side beyond DTO shape

## Next Steps

→ Phase 08 viết test cho HelloRepository dùng mock HelloApi. Phase 09 set up codegen-check CI.
