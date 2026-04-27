# Feature Boundaries

> 🌐 **Ngôn ngữ:** [English](../../feature-boundaries.md) · **Tiếng Việt** · [中文](../zh/feature-boundaries.md) · [한국어](../ko/feature-boundaries.md)

## Core Principle

**Loose coupling, high cohesion.** Features và modules được cô lập; cross-feature concerns sống trong `core/` (backend) hoặc `core/` / `shared/` (frontend).

This enables:
- Deleting a feature without touching others
- Reusing a feature in multiple projects
- Parallel feature development with zero merge conflicts
- Clarity on dependencies

## Backend Module Isolation

### Rule: No Internal Deep Imports

Each NestJS module có thể có một `internal/` directory. **Other modules không thể import từ nó.**

**Example structure:**
```
apps/api/src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── internal/
│   └── users.repository.ts       # ← Hidden from outside
└── dto/
    └── create-user.dto.ts        # ← OK to export
```

**Allowed imports:**
```typescript
// ✓ GOOD: Another module imports public API
import { UsersService } from '@modules/users/users.service';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';

// ✗ BAD: Importing from internal/
import { UsersRepository } from '@modules/users/internal/users.repository';
```

### Enforcement: ESLint

**In `.eslintrc.json` at api root:**
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

**Run check:**
```bash
pnpm --filter @mobile-boilerplate/api lint
```

### Sharing Code Between Modules

**Put shared logic in `common/` or `infra/`:**

```
apps/api/src/
├── common/
│   ├── validators/
│   │   └── email.validator.ts      # Used by users + auth modules
│   └── utils/
│       └── password-hasher.ts
├── infra/
│   └── prisma/
│       └── prisma.service.ts       # Used by all modules
└── modules/
    ├── users/
    │   └── users.service.ts        # Imports from common/
    └── auth/
        └── auth.service.ts         # Imports from common/
```

**Bad approach:** Exposing users/internal → leads to tight coupling.

## Frontend Feature Isolation

### Rule: No Cross-Feature Imports

Each feature độc lập. Feature A không thể import từ Feature B.

**Example structure:**
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

**Allowed imports:**
```dart
// ✓ GOOD: Within same feature
import 'package:mobile_boilerplate/features/users/domain/entities/user.dart';

// ✗ BAD: Cross-feature import (forbidden)
import 'package:mobile_boilerplate/features/auth/domain/entities/session.dart';
```

### Sharing Code: `core/` & `shared/`

**`lib/core/`** — non-feature logic:
- DI / providers (`lib/core/di/providers.dart`)
- Config / env (`lib/core/config/`)
- Network / HTTP client (`lib/core/network/`)
- Router (`lib/core/router/`)
- Theme (`lib/core/theme/`)
- Error handling (`lib/core/error/`)

**`lib/shared/`** — reusable widgets / utilities:
- `lib/shared/widgets/` — UI components (LoadingView, ErrorView, etc.)
- `lib/shared/utils/` — formatting, parsing helpers
- `lib/shared/extensions/` — Dart extensions (e.g., String.toCapitalized())

**Pattern:** If two features need the same thing → move to `shared/`.

### Enforcement: Linter

**In `analysis_options.yaml` at mobile root:**
```yaml
linter:
  rules:
    - avoid_relative_lib_imports
    # Custom check (future): forbid lib/features/foo → lib/features/bar imports

custom_lint:
  enable-all: true  # Uses riverpod_lint + custom_lint
```

**Run analysis:**
```bash
cd apps/mobile && fvm flutter analyze
```

## Example: Adding a Comment Feature

### Backend (NestJS)

**Plan:**
1. Create `modules/comments/`
2. Reuse `UsersService` from `common/` for author lookups
3. Reuse email validation from `common/validators/`
4. Register in `app.module.ts`

**Structure:**
```
apps/api/src/modules/comments/
├── comments.module.ts
├── comments.controller.ts      # GET /comments, POST /comments
├── comments.service.ts         # Business logic
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
    private prisma: PrismaService,  # From infra/
    private emailValidator: EmailValidator,  # From common/validators
  ) {}

  async createComment(dto: CreateCommentDto): Promise<CommentResponseDto> {
    # Validate email using shared validator
    const isValidEmail = this.emailValidator.isValid(dto.authorEmail);
    if (!isValidEmail) throw new BadRequestException('Invalid email');

    # Create comment via Prisma
    return this.prisma.comment.create({ data: dto });
  }
}
```

**app.module.ts:**
```typescript
@Module({
  imports: [
    CommentsModule,  # ← Register here
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
```

### Frontend (Flutter)

**Plan:**
1. Create `features/comments/`
2. Reuse `DioProvider` from `core/di/`
3. Share `LoadingView` from `shared/widgets/`
4. Register route in `app_router.dart`

**Structure:**
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
  final Dio dio;  # Injected from core/di/providers.dart

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

**Register in core/router/app_router.dart:**
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
        loading: () => LoadingView(),  # From shared/widgets
        error: (err, _) => ErrorView(error: err),  # From shared/widgets
      ),
    );
  }
}
```

## Common Violations & Fixes

| Violation | Problem | Fix |
|-----------|---------|-----|
| Feature A imports Feature B directly | Tight coupling, can't delete B | Move common logic to `core/` or `shared/` |
| Module imports from `internal/` | Breaks encapsulation | Export public API from module root |
| Hard-coded config in feature | Not env-aware, not reusable | Move to `core/config/` + inject |
| Service duplicated in two features | Code duplication, hard to maintain | Move to `common/` (backend) or `shared/` (frontend) |
| Widget in one feature needed elsewhere | Circular import risk | Move to `lib/shared/widgets/` |

## Testing Boundary Isolation

### Backend
```typescript
# ✓ Test CommentsService in isolation
describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    # Mock dependencies, no real module loading
    prisma = createMockPrisma();
    service = new CommentsService(prisma, emailValidator);
  });

  it('creates comment with validated email', () => {
    # Test only this service, not UsersService
  });
});
```

### Frontend
```dart
# ✓ Test CommentsController in isolation
test('fetch comments updates state', () async {
  final container = ProviderContainer(
    overrides: [
      commentsRepositoryProvider.overrideWithValue(
        FakeCommentsRepository(),  # Fake, not real Dio
      ),
    ],
  );
  # Test only controller, not router or UI
});
```

## Summary

**Backend:**
- Modules live in `modules/`
- Internal logic goes in `internal/` (hidden from other modules)
- Shared code in `common/` or `infra/`
- No module-to-module imports (use shared)

**Frontend:**
- Features live in `features/`
- No feature-to-feature imports
- Shared code in `core/` or `shared/`
- DI/config/router in `core/`
- Reusable widgets in `shared/widgets/`

**Enforcement:**
- Backend: ESLint `no-restricted-imports` rule
- Frontend: Linter rules + code review
- Both: Test isolation (mock dependencies)

---

**Last updated:** April 2026
