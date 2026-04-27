# 기능 경계

> 🌐 **언어:** [English](../../feature-boundaries.md) · [Tiếng Việt](../vi/feature-boundaries.md) · [中文](../zh/feature-boundaries.md) · **한국어**

## 핵심 원칙

**느슨한 결합, 높은 응집도.** 기능과 모듈은 격리; 크로스 기능 관심사는 `core/` (백엔드) 또는 `core/` / `shared/` (프론트엔드)에 위치.

이것은 다음을 가능하게 합니다:
- 다른 것 건드리지 않고 기능 삭제
- 프로젝트 간 기능 재사용
- 병렬 기능 개발, 병합 충돌 제로
- 의존성 명확성

## 백엔드 모듈 격리

### 규칙: 내부 깊은 임포트 없음

각 NestJS 모듈은 `internal/` 디렉토리를 가질 수 있습니다. **다른 모듈은 이것에서 임포트할 수 없습니다.**

**예시 구조:**
```
apps/api/src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── internal/
│   └── users.repository.ts       # ← 외부에서 숨김
└── dto/
    └── create-user.dto.ts        # ← OK 내보내기
```

**허용 임포트:**
```typescript
// ✓ 좋음: 다른 모듈은 공개 API 임포트
import { UsersService } from '@modules/users/users.service';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';

// ✗ 나쁨: internal/에서 임포트
import { UsersRepository } from '@modules/users/internal/users.repository';
```

### 강제: ESLint

**api 루트의 `.eslintrc.json`:**
```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          "src/modules/*/internal/*"
        ]
      }
    ]
  }
}
```

**체크 실행:**
```bash
pnpm --filter @mobile-boilerplate/api lint
```

### 모듈 간 코드 공유

**공유 로직을 `common/` 또는 `infra/`에 배치:**

```
apps/api/src/
├── common/
│   ├── validators/
│   │   └── email.validator.ts      # users + auth 모듈에서 사용
│   └── utils/
│       └── password-hasher.ts
├── infra/
│   └── prisma/
│       └── prisma.service.ts       # 모든 모듈에서 사용
└── modules/
    ├── users/
    │   └── users.service.ts        # common/에서 임포트
    └── auth/
        └── auth.service.ts         # common/에서 임포트
```

**나쁜 접근:** users/internal 노출 → 긴 결합.

## 프론트엔드 기능 격리

### 규칙: 크로스 기능 임포트 없음

각 기능은 독립적입니다. 기능 A는 기능 B에서 임포트할 수 없습니다.

**예시 구조:**
```
apps/mobile/lib/features/users/
├── data/
│   └── users_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── user.dart
│   └── repositories/
│       └── users_repository.dart
└── presentation/
    ├── controllers/
    │   └── user_controller.dart
    ├── screens/
    │   └── user_screen.dart
    └── widgets/
        └── user_card.dart
```

**허용 임포트:**
```dart
// ✓ 좋음: 같은 기능 내
import 'package:mobile_boilerplate/features/users/domain/entities/user.dart';

// ✗ 나쁨: 크로스 기능 임포트 (금지)
import 'package:mobile_boilerplate/features/auth/domain/entities/session.dart';
```

### 코드 공유: `core/` & `shared/`

**`lib/core/`** — non-feature 로직:
- DI / 제공자 (`lib/core/di/providers.dart`)
- Config / env (`lib/core/config/`)
- 네트워크 / HTTP 클라이언트 (`lib/core/network/`)
- 라우터 (`lib/core/router/`)
- 테마 (`lib/core/theme/`)
- 오류 처리 (`lib/core/error/`)

**`lib/shared/`** — 재사용 가능한 위젯 / 유틸리티:
- `lib/shared/widgets/` — UI 컴포넌트 (LoadingView, ErrorView, 기타)
- `lib/shared/utils/` — 형식화, 파싱 helper
- `lib/shared/extensions/` — Dart extension (예: String.toCapitalized())

**패턴:** 두 기능이 같은 것을 필요로 하면 → `shared/`로 이동.

### 강제: Linter

**모바일 루트의 `analysis_options.yaml`:**
```yaml
linter:
  rules:
    - avoid_relative_lib_imports
    # Custom check (future): forbid lib/features/foo → lib/features/bar imports

custom_lint:
  enable-all: true  # riverpod_lint + custom_lint 사용
```

**분석 실행:**
```bash
cd apps/mobile && fvm flutter analyze
```

## 예시: Comment 기능 추가

### 백엔드 (NestJS)

**계획:**
1. `modules/comments/` 생성
2. 작성자 조회를 위해 `UsersService` 재사용 from `common/`
3. `common/validators/`의 email 검증 재사용
4. `app.module.ts`에 등록

**구조:**
```
apps/api/src/modules/comments/
├── comments.module.ts
├── comments.controller.ts      # GET /comments, POST /comments
├── comments.service.ts         # 비즈니스 로직
├── dto/
│   ├── create-comment.dto.ts
│   └── comment-response.dto.ts
└── comments.service.spec.ts
```

**Service (comments.service.ts):**
```typescript
@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,  // infra/에서
    private emailValidator: EmailValidator,  // common/validators에서
  ) {}

  async createComment(dto: CreateCommentDto): Promise<CommentResponseDto> {
    // 공유 validator 사용
    const isValidEmail = this.emailValidator.isValid(dto.authorEmail);
    if (!isValidEmail) throw new BadRequestException('Invalid email');

    // Prisma를 통해 comment 생성
    return this.prisma.comment.create({ data: dto });
  }
}
```

**app.module.ts:**
```typescript
@Module({
  imports: [
    CommentsModule,  // ← 여기 등록
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
```

### 프론트엔드 (Flutter)

**계획:**
1. `features/comments/` 생성
2. `core/di/`의 `DioProvider` 재사용
3. `shared/widgets/`의 `LoadingView` 공유
4. `app_router.dart`에 라우트 등록

**구조:**
```
apps/mobile/lib/features/comments/
├── data/
│   └── comments_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── comment.dart
│   └── repositories/
│       └── comments_repository.dart
└── presentation/
    ├── controllers/
    │   └── comments_controller.dart
    ├── screens/
    │   └── comments_screen.dart
    └── widgets/
        └── comment_card.dart
```

**Controller (presentation/controllers/comments_controller.dart):**
```dart
final commentsControllerProvider =
    AsyncNotifierProvider<CommentsController, List<Comment>>(
      CommentsController.new,
    );

class CommentsController extends AsyncNotifier<List<Comment>> {
  @override
  Future<List<Comment>> build() async {
    final repository = ref.watch(commentsRepositoryProvider);
    return repository.fetchComments();
  }
}
```

**Repository (data/comments_repository_impl.dart):**
```dart
class CommentsRepositoryImpl implements CommentsRepository {
  final Dio dio;  // core/di/providers.dart에서 주입

  CommentsRepositoryImpl(this.dio);

  @override
  Future<List<Comment>> fetchComments() async {
    final response = await dio.get('/comments');
    return (response.data as List)
        .map((c) => Comment.fromJson(c))
        .toList();
  }
}
```

**core/router/app_router.dart에 등록:**
```dart
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    routes: [
      GoRoute(
        path: '/comments',
        name: 'comments',
        builder: (context, state) => CommentsScreen(),
      ),
    ],
  );
});
```

**Screen (presentation/screens/comments_screen.dart):**
```dart
class CommentsScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final commentsAsync = ref.watch(commentsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text('Comments')),
      body: commentsAsync.when(
        data: (comments) => ListView.builder(
          itemCount: comments.length,
          itemBuilder: (context, index) => CommentCard(
            comment: comments[index],
          ),
        ),
        loading: () => LoadingView(),  // shared/widgets에서
        error: (err, _) => ErrorView(error: err),  // shared/widgets에서
      ),
    );
  }
}
```

## 일반적 위반 & 수정

| 위반 | 문제 | 수정 |
|-----------|---------|-----|
| Feature A가 Feature B를 직접 임포트 | 긴 결합, B 삭제 불가 | 공통 로직을 `core/` 또는 `shared/`로 이동 |
| Module이 `internal/`에서 임포트 | 캡슐화 위반 | 모듈 루트에서 공개 API 내보내기 |
| Feature에 하드코딩된 설정 | env 미인식, 재사용 불가 | `core/config/`로 이동 + 주입 |
| 두 기능에서 서비스 복제 | 코드 복제, 유지보수 어려움 | `common/` (백엔드) 또는 `shared/` (프론트엔드)로 이동 |
| 한 기능에서 필요한 Widget | 순환 임포트 위험 | `lib/shared/widgets/`로 이동 |

## 격리 경계 테스트

### 백엔드
```typescript
// ✓ 격리된 CommentsService 테스트
describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    // Mock 의존성, 실제 모듈 로딩 없음
    prisma = createMockPrisma();
    service = new CommentsService(prisma, emailValidator);
  });

  it('creates comment with validated email', () => {
    // 이 서비스만 테스트, UsersService 아님
  });
});
```

### 프론트엔드
```dart
// ✓ 격리된 CommentsController 테스트
test('fetch comments updates state', () async {
  final container = ProviderContainer(
    overrides: [
      commentsRepositoryProvider.overrideWithValue(
        FakeCommentsRepository(),  // Fake, 실제 Dio 아님
      ),
    ],
  );
  // 컨트롤러만 테스트, 라우터 또는 UI 아님
});
```

## 요약

**백엔드:**
- 모듈은 `modules/`에 위치
- 내부 로직은 `internal/`에 (다른 모듈 숨김)
- 공유 코드는 `common/` 또는 `infra/`에
- 모듈 간 임포트 없음 (공유 사용)

**프론트엔드:**
- 기능은 `features/`에 위치
- 기능 간 임포트 없음
- 공유 코드는 `core/` 또는 `shared/`에
- DI/config/라우터는 `core/`에
- 재사용 가능한 위젯은 `shared/widgets/`에

**강제:**
- 백엔드: ESLint `no-restricted-imports` 규칙
- 프론트엔드: Linter 규칙 + 코드 리뷰
- 둘 다: 테스트 격리 (mock 의존성)

---

**최종 업데이트:** 2026년 4월
