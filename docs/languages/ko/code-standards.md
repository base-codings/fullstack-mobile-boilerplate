# 코드 표준

> 🌐 **언어:** [English](../../code-standards.md) · [Tiếng Việt](../vi/code-standards.md) · [中文](../zh/code-standards.md) · **한국어**

## 파일 구조 & 명명

### 명명 규칙
- **파일:** `kebab-case` (예: `hello-controller.ts`, `hello_repository.dart`)
- **디렉토리:** `kebab-case` (예: `src/modules/user-management/`, `lib/features/auth/`)
- **클래스/인터페이스:** `PascalCase` (예: `HelloController`, `UserRepository`)
- **함수/변수:** `camelCase` (예: `getHello`, `userId`)
- **상수:** `UPPER_SNAKE_CASE` (예: `MAX_RETRY_COUNT`, `API_TIMEOUT_MS`)
- **프라이빗 멤버:** `_` 접두사 (예: `_internal`, `_service`)

### 파일 크기 제한

**파일당 최대 200줄** (주석 제외). 근거: 가독성 향상, 단일 책임 권장, LLM 도구가 쉽게 분석.

**위반 패턴:** 파일이 180줄에 가까워지면 다음 스프린트에서 모듈화 계획.

**예시 분할:**
- 큰 controller → 리소스당 분리된 controller로 분할
- 큰 service → 초점 맞춘 service로 비즈니스 로직 분할
- 큰 widget → sub-widget을 분리된 파일로 추출

## TypeScript 표준 (백엔드)

### Strict 모드
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**규칙:**
- **`any` 타입 없음.** 진정으로 미확인 시 `unknown` 사용, 그 후 타입 좁히기.
- **명시적 반환 타입.** 항상 함수 반환 타입을 주석.
- **타입보다 인터페이스 선호.** (경미한 스타일; 둘 다 유효.)

### 예시
```typescript
// ✗ 나쁨
function getUser(id) {
  return db.user.findUnique({ where: { id } });
}

// ✓ 좋음
function getUser(id: number): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}
```

### NestJS 특화

**Controller 데코레이터:**
```typescript
// ✓ 좋음: 명시적 경로
@Controller('users')
export class UsersController { }

// ✗ 나쁨: 경로 없음 (모호한 중첩)
@Controller()
export class UsersController { }
```

**DTO 검증:**
```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;
}
```

### 요청 검증

- 전역 `ValidationPipe`는 다음으로 설정됨: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- `forbidUnknownValues`는 의도적으로 설정되지 않음 (기본값 false): 중첩 DTO와 함께 `@Type()` 데코레이터가 누락되면 암호화된 "unknown values were given" 오류가 발생합니다. nestjs/nest#9759 참조.
- 중첩 DTO는 반드시 자식 필드를 `@Type(() => NestedDto)`로 데코레이트해야 변환/검증이 내려갑니다.

**Constructor를 통한 서비스 주입:**
```typescript
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}
}
```

## Dart 표준 (프론트엔드)

### Lint 설정
앱은 `very_good_analysis` 패키지를 사용합니다. 추가 린팅 규칙 불필요.

**린팅 실행:**
```bash
cd apps/mobile
fvm flutter analyze
```

**강제 규칙:**
- 사용되지 않는 변수/import 없음
- Effective Dart 규칙
- const 생성자 적용 가능
- 올바른 async/await 사용

### 예시
```dart
// ✗ 나쁨
class User {
  User({required this.name}); // const 아님
  final String name;
}

// ✓ 좋음
class User {
  const User({required this.name});
  final String name;
}
```

### Riverpod 제공자

**Plain provider (스캐폴드, 아직 build_runner 없음):**
```dart
final dioProvider = Provider<Dio>((ref) {
  return Dio();
});
```

**AsyncNotifierProvider (async 상태 관리):**
```dart
final userControllerProvider = AsyncNotifierProvider<
  UserController,
  List<User>,
>(UserController.new);

class UserController extends AsyncNotifier<List<User>> {
  @override
  Future<List<User>> build() async {
    return ref.watch(userRepositoryProvider).fetchUsers();
  }
}
```

**Repository 패턴:**
```dart
// 추상 인터페이스
abstract class UserRepository {
  Future<List<User>> fetchUsers();
}

// 구현
class UserRepositoryImpl implements UserRepository {
  final Dio _dio;
  
  UserRepositoryImpl(this._dio);

  @override
  Future<List<User>> fetchUsers() async {
    final response = await _dio.get('/users');
    return (response.data as List).map((u) => User.fromJson(u)).toList();
  }
}
```

### 로깅

- `pino-http` + `nestjs-pino`로 구조화된 JSON 로그.
- `redact:` 경로는 `Authorization`, `Cookie`, password, token, refreshToken, email을 다룹니다.
- **쿼리 문자열은 기본적으로 로그에서 제거됨** PII 누수를 피하기 위해 `?token=...` 등. 필요에 따라 로거를 오버라이드하여 엔드포인트당 다시 활성화.
- `requestId` 폴백: `req.id` (pino-http) → `X-Request-ID` 헤더 → 신선한 UUID. 절대 비어있지 않음.

## 테스트 표준

### 백엔드 (Jest + NestJS)

**파일 명명:** `*.spec.ts` 소스와 함께 위치.

**예시 구조:**
```
apps/api/src/modules/users/
├── users.service.ts
├── users.service.spec.ts        // 단위 테스트
├── users.controller.ts
└── users.controller.spec.ts     // Controller/통합 테스트

apps/api/test/
└── users.e2e-spec.ts            // End-to-end 테스트
```

**테스트 패턴:**
```typescript
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();
    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should fetch user by id', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      id: 1, name: 'Alice'
    });
    const user = await service.getUser(1);
    expect(user.name).toBe('Alice');
  });
});
```

### 프론트엔드 (Riverpod + Mocktail)

**파일 명명:** `*_test.dart` 소스와 함께 `test/`에 위치.

**예시 구조:**
```
apps/mobile/test/features/users/
├── user_controller_test.dart     // 제공자 로직
├── user_screen_test.dart         // Widget 테스트
└── user_repository_test.dart     // Repository 계층

apps/mobile/test/helpers/
└── pump_app.dart                 // 테스트 유틸리티
```

**제공자 테스트 패턴:**
```dart
void main() {
  group('UserController', () {
    test('fetch users updates state', () async {
      final container = ProviderContainer(
        overrides: [
          userRepositoryProvider.overrideWithValue(
            FakeUserRepository(),
          ),
        ],
      );

      final controller = container.read(userControllerProvider.notifier);
      expect(
        container.read(userControllerProvider),
        isA<AsyncData<List<User>>>(),
      );
    });
  });
}
```

### 커버리지 요구사항

- **백엔드:** 비즈니스 로직 (service, helper)에서 80%+ 커버리지 목표
- **프론트엔드:** 제공자 + 중요 widget에서 70%+ 커버리지 목표
- **제외:** 자동 생성 파일, 사소한 getter, mock 유틸리티

## 커밋 메시지 규칙

**형식:** Conventional Commits (commitlint에 의해 강제)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**타입:**
- `feat:` 새 기능
- `fix:` 버그 수정
- `refactor:` 코드 재구성 (기능 변경 없음)
- `test:` 테스트 추가/업데이트
- `docs:` 문서만
- `chore:` 빌드 config, deps, 기타 (AI 참고 없음)

**예시:**
```
feat(users): add user creation endpoint with validation

- Validate email format
- Hash password with bcrypt
- Return user with JWT token

Closes #123

---

fix(mobile): resolve Dio timeout on slow connections

Increase timeout from 10s to 30s. Use exponential backoff for retries.

---

refactor(api): extract validation logic into separate service

Move DTO validation from controller to shared service for reuse.
```

**CI 강제:**
- Commitlint은 `.husky/commit-msg` 훅에서 실행
- 잘못된 형식으로 커밋 거부
- 오류 메시지는 사용자에게 올바른 형식 안내

## 린팅 & 형식화

### 백엔드 (TypeScript + ESLint)

**린팅 실행:**
```bash
pnpm --filter @mobile-boilerplate/api lint
```

**사전 커밋 (Lefthook):**
```yaml
# .lefthook.yml
pre-commit:
  commands:
    lint:
      run: pnpm --filter={app} lint
      glob: "src/**/*.ts"
```

**린트 규칙:**
- 사용되지 않는 변수 없음
- `any` 타입 없음
- 깊게 중첩된 삼항 연산자 없음
- 일관된 간격

### 프론트엔드 (Dart Analyzer)

**분석 실행:**
```bash
cd apps/mobile && fvm flutter analyze
```

**사전 커밋 (Lefthook):**
같은 훅이 analyzer + 테스트를 트리거합니다.

## Import 구성

### 백엔드 (TypeScript)
```typescript
// 1. Node/외부 패키지
import { Controller } from '@nestjs/common';
import axios from 'axios';

// 2. 절대 경로 (@shared, @modules, 기타)
import { Logger } from '@shared/logger';

// 3. 상대 경로
import { HelloService } from './hello.service';
```

### 프론트엔드 (Dart)
```dart
// 1. Dart SDK
import 'dart:async';

// 2. Flutter 패키지
import 'package:flutter/material.dart';

// 3. Pub 패키지
import 'package:riverpod/riverpod.dart';

// 4. 로컬 패키지 (api_client)
import 'package:api_client/api_client.dart';

// 5. 상대 경로
import '../domain/repositories/user_repository.dart';
```

## 금지된 패턴

| 패턴 | 이유 | 예시 |
|---------|--------|---------|
| 깊은 모듈 임포트 (백엔드) | 캡슐화 위반 | `src/modules/users/internal/*`이 `users/` 외부에서 보임 |
| 크로스 기능 임포트 (프론트엔드) | 긴 결합, 기능 삭제 어려움 | 기능 A가 기능 B의 제공자를 임포트 |
| 경로 없는 `@Controller()` | 모호한 라우팅 | 라우트가 예기치 않게 중첩 |
| 하드코딩된 URL/API 경로 | env 미인식 | `'http://localhost:3000'` 대신 env 변수 |
| 공개하지 말아야 할 라우트에 `@Public()` | 보안 위험 | 실수로 /admin을 `@Public()`으로 노출 |
| 프로덕션 코드에서 `console.log` | 로그 노이즈 | 구조화된 로거 (Pino, logger service) 사용 |
| 매직 넘버 | 읽기 어려움, 유지보수 어려움 | `limit: 100` 설명 없음 (명명 상수 사용) |
| 이슈 번호 없는 `// TODO` | 완료 안 됨 | 기술 부채 누적; GitHub 이슈로 링크 |

## 오류 처리

### 백엔드
```typescript
// ✗ 나쁨: 무음 실패
const user = await prisma.user.findUnique({ where: { id } });
if (user) return user; // 못 찾으면 어떻게? Undefined?

// ✓ 좋음: 명시적 오류
const user = await this.prisma.user.findUnique({ where: { id } });
if (!user) {
  throw new NotFoundException(`User ${id} not found`);
}
return user;
```

### 프론트엔드
```dart
// ✗ 나쁨: 무음 오류
try {
  await repository.fetchUser();
} catch (e) {
  // 오류 무시
}

// ✓ 좋음: 처리 또는 전파
try {
  return await repository.fetchUser();
} catch (e) {
  rethrow; // 제공자가 상태 전환을 오류로 처리하도록 함
}
```

## 문서화 요구사항

**코드 주석이 필요한 경우:**
- 명확하지 않은 비즈니스 로직
- 해결책 (복잡성 시 GitHub 이슈로 링크)
- 공개 API 계약 (매개변수, 반환 값)
- 더 이상 사용되지 않는 코드 (제거 계획 시)

**자체 문서화 코드가 주석보다 나음:**
```typescript
// ✗ 나쁨
const a = x > 10 ? 100 : x * 10;  // a는 뭐지?

// ✓ 좋음
const adjustedPrice = price > 10 ? 100 : price * 10;
```

## 버전 고정

**백엔드 (package.json):**
- 주요 deps 고정: `^13.0.0` (minor/patch 허용)
- 테스트/린트 도구 정확히 고정: `=1.0.0` (결정적 CI)

**프론트엔드 (pubspec.yaml):**
- 플러그인 deps 고정: `^2.5.0` (minor/patch 허용)
- 테스트 러너 정확히 고정: `=2.4.13` (결정적 CI)

**업데이트 프로세스:**
- 주간 `pnpm upgrade` / `fvm flutter pub upgrade --major-versions`
- CI 회귀 테스트는 반드시 통과
- 업그레이드당 변경 로그 항목

---

**최종 업데이트:** 2026년 4월
