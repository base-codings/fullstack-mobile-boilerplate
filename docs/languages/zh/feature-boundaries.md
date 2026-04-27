# 功能边界

> 🌐 **语言:** [English](../../feature-boundaries.md) · [Tiếng Việt](../vi/feature-boundaries.md) · **中文** · [한국어](../ko/feature-boundaries.md)

## 核心原则

**松散耦合、高聚合。** 功能和模块隔离；跨功能关注点存在 `core/`（后端）或 `core/` / `shared/`（前端）。

这实现了：
- 删除功能而不影响其他
- 在多个项目间重用功能
- 零合并冲突的并行功能开发
- 依赖清晰

## 后端模块隔离

### 规则：无内部深层导入

每个 NestJS 模块可能有 `internal/` 目录。**其他模块禁止从中导入。**

**示例结构：**
```
apps/api/src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── internal/
│   └── users.repository.ts       # ← 隐藏于外部
└── dto/
    └── create-user.dto.ts        # ← 可导出
```

**允许的导入：**
```typescript
// ✓ 好：另一模块导入公开 API
import { UsersService } from '@modules/users/users.service';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';

// ✗ 不好：从 internal/ 导入
import { UsersRepository } from '@modules/users/internal/users.repository';
```

### 强制：ESLint

**在 api 根 `.eslintrc.json` 中：**
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

**运行检查：**
```bash
pnpm --filter @mobile-boilerplate/api lint
```

### 模块间共享代码

**在 `common/` 或 `infra/` 中放置共享逻辑：**

```
apps/api/src/
├── common/
│   ├── validators/
│   │   └── email.validator.ts      # 用于 users + auth 模块
│   └── utils/
│       └── password-hasher.ts
├── infra/
│   └── prisma/
│       └── prisma.service.ts       # 用于所有模块
└── modules/
    ├── users/
    │   └── users.service.ts        # 从 common/ 导入
    └── auth/
        └── auth.service.ts         # 从 common/ 导入
```

**坏方法:** 暴露 users/internal → 导致紧密耦合。

## 前端功能隔离

### 规则：无交叉功能导入

每个功能独立。功能 A 禁止从功能 B 导入。

**示例结构：**
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

**允许的导入：**
```dart
// ✓ 好：同功能内
import 'package:mobile_boilerplate/features/users/domain/entities/user.dart';

// ✗ 不好：交叉功能导入（禁止）
import 'package:mobile_boilerplate/features/auth/domain/entities/session.dart';
```

### 共享代码：`core/` & `shared/`

**`lib/core/`** — 非功能逻辑：
- DI / provider（`lib/core/di/providers.dart`）
- 配置 / 环境（`lib/core/config/`）
- 网络 / HTTP 客户端（`lib/core/network/`）
- 路由器（`lib/core/router/`）
- 主题（`lib/core/theme/`）
- 错误处理（`lib/core/error/`）

**`lib/shared/`** — 可重用组件 / 实用工具：
- `lib/shared/widgets/` — UI 组件（LoadingView、ErrorView 等）
- `lib/shared/utils/` — 格式化、解析助手
- `lib/shared/extensions/` — Dart 扩展（例如 String.toCapitalized()）

**模式:** 若两个功能需要同一事物 → 移至 `shared/`。

### 强制：Linter

**在移动根 `analysis_options.yaml` 中：**
```yaml
linter:
  rules:
    - avoid_relative_lib_imports
    # 自定义检查（未来）：禁止 lib/features/foo → lib/features/bar 导入

custom_lint:
  enable-all: true  # 使用 riverpod_lint + custom_lint
```

**运行分析：**
```bash
cd apps/mobile && fvm flutter analyze
```

## 示例：添加评论功能

### 后端（NestJS）

**计划：**
1. 创建 `modules/comments/`
2. 从 `common/` 重用 `UsersService` 作者查询
3. 从 `common/validators/` 重用电子邮件验证
4. 在 `app.module.ts` 中注册

**结构：**
```
apps/api/src/modules/comments/
├── comments.module.ts
├── comments.controller.ts      # GET /comments、POST /comments
├── comments.service.ts         # 业务逻辑
├── dto/
│   ├── create-comment.dto.ts
│   └── comment-response.dto.ts
└── comments.service.spec.ts
```

**服务（comments.service.ts）：**
```typescript
@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,  // 从 infra/
    private emailValidator: EmailValidator,  // 从 common/validators
  ) {}

  async createComment(dto: CreateCommentDto): Promise<CommentResponseDto> {
    // 使用共享验证器验证电子邮件
    const isValidEmail = this.emailValidator.isValid(dto.authorEmail);
    if (!isValidEmail) throw new BadRequestException('Invalid email');

    // 通过 Prisma 创建评论
    return this.prisma.comment.create({ data: dto });
  }
}
```

**app.module.ts：**
```typescript
@Module({
  imports: [
    CommentsModule,  // ← 在此注册
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
```

### 前端（Flutter）

**计划：**
1. 创建 `features/comments/`
2. 从 `core/di/` 重用 `DioProvider`
3. 从 `shared/widgets/` 共享 `LoadingView`
4. 在 `app_router.dart` 中注册路由

**结构：**
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

**控制器（presentation/controllers/comments_controller.dart）：**
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

**Repository（data/comments_repository_impl.dart）：**
```dart
class CommentsRepositoryImpl implements CommentsRepository {
  final Dio dio;  // 从 core/di/providers.dart 注入

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

**在 core/router/app_router.dart 中注册：**
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

**屏幕（presentation/screens/comments_screen.dart）：**
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
        loading: () => LoadingView(),  // 从 shared/widgets
        error: (err, _) => ErrorView(error: err),  // 从 shared/widgets
      ),
    );
  }
}
```

## 常见违反与修复

| 违反 | 问题 | 修复 |
|-----------|---------|-----|
| 功能 A 直接导入功能 B | 紧密耦合、无法删除 B | 将公共逻辑移至 `core/` 或 `shared/` |
| 模块从 `internal/` 导入 | 破坏封装 | 从模块根导出公开 API |
| 功能中硬编码配置 | 非环境感知、不可重用 | 移至 `core/config/` + 注入 |
| 服务在两个功能中重复 | 代码重复、难维护 | 移至 `common/`（后端）或 `shared/`（前端） |
| 一个功能中的组件需要其他功能 | 循环导入风险 | 移至 `lib/shared/widgets/` |

## 测试边界隔离

### 后端
```typescript
// ✓ 在隔离中测试 CommentsService
describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    // 模拟依赖，不加载真实模块
    prisma = createMockPrisma();
    service = new CommentsService(prisma, emailValidator);
  });

  it('creates comment with validated email', () => {
    // 仅测试此服务，不测试 UsersService
  });
});
```

### 前端
```dart
// ✓ 在隔离中测试 CommentsController
test('fetch comments updates state', () async {
  final container = ProviderContainer(
    overrides: [
      commentsRepositoryProvider.overrideWithValue(
        FakeCommentsRepository(),  // 假，非真实 Dio
      ),
    ],
  );
  // 仅测试控制器，不测试路由或 UI
});
```

## 总结

**后端：**
- 模块存在 `modules/`
- 内部逻辑进入 `internal/`（隐藏于其他模块）
- 共享代码在 `common/` 或 `infra/`
- 无模块对模块导入（使用共享）

**前端：**
- 功能存在 `features/`
- 无功能对功能导入
- 共享代码在 `core/` 或 `shared/`
- DI/配置/路由在 `core/`
- 可重用组件在 `shared/widgets/`

**强制：**
- 后端：ESLint `no-restricted-imports` 规则
- 前端：Linter 规则 + 代码审查
- 两者：测试隔离（模拟依赖）

---

**最后更新:** 2026 年 4 月
