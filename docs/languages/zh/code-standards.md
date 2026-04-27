# 代码标准

> 🌐 **语言:** [English](../../code-standards.md) · [Tiếng Việt](../vi/code-standards.md) · **中文** · [한국어](../ko/code-standards.md)

## 文件组织与命名

### 命名约定
- **文件:** `kebab-case`（例如 `hello-controller.ts`、`hello_repository.dart`）
- **目录:** `kebab-case`（例如 `src/modules/user-management/`、`lib/features/auth/`）
- **类/接口:** `PascalCase`（例如 `HelloController`、`UserRepository`）
- **函数/变量:** `camelCase`（例如 `getHello`、`userId`）
- **常量:** `UPPER_SNAKE_CASE`（例如 `MAX_RETRY_COUNT`、`API_TIMEOUT_MS`）
- **私有成员:** 前缀 `_`（例如 `_internal`、`_service`）

### 文件大小限制

**每文件最多 200 行**（不含注释）。原因：改进可读性、鼓励单一职责、便于 LLM 工具分析。

**违反模式:** 文件接近 180 行时，计划下一冲刺的模块化。

**示例分割：**
- 大控制器 → 按资源拆分为单独控制器
- 大服务 → 拆分业务逻辑为聚焦服务
- 大组件 → 提取子组件为单独文件

## TypeScript 标准（后端）

### 严格模式
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

**规则：**
- **无 `any` 类型。** 使用 `unknown` 如果真的未知，然后缩小类型。
- **显式返回类型。** 始终注解函数返回类型。
- **优先接口而非类型。** （次要风格；两者都有效。）

### 示例
```typescript
// ✗ 不好
function getUser(id) {
  return db.user.findUnique({ where: { id } });
}

// ✓ 好
function getUser(id: number): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}
```

### NestJS 特定

**控制器装饰器：**
```typescript
// ✓ 好：明确路径
@Controller('users')
export class UsersController { }

// ✗ 不好：无路径（歧义嵌套）
@Controller()
export class UsersController { }
```

**DTO 验证：**
```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;
}
```

**服务通过构造器注入：**
```typescript
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}
}
```

## Dart 标准（前端）

### Lint 配置
应用使用 `very_good_analysis` 包。无需其他 lint 规则。

**运行 lint：**
```bash
cd apps/mobile
fvm flutter analyze
```

**强制规则：**
- 无未使用变量/导入
- Effective Dart 约定
- const 构造器（可行）
- 正确 async/await 用法

### 示例
```dart
// ✗ 不好
class User {
  User({required this.name}); // 不是 const
  final String name;
}

// ✓ 好
class User {
  const User({required this.name});
  final String name;
}
```

### Riverpod Provider

**普通 provider（脚手架，暂无 build_runner）：**
```dart
final dioProvider = Provider<Dio>((ref) {
  return Dio();
});
```

**AsyncNotifierProvider（管理异步状态）：**
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

**Repository 模式：**
```dart
// 抽象接口
abstract class UserRepository {
  Future<List<User>> fetchUsers();
}

// 实现
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

## 测试标准

### 后端（Jest + NestJS）

**文件命名:** `*.spec.ts`，与源代码同位置。

**示例结构：**
```
apps/api/src/modules/users/
├── users.service.ts
├── users.service.spec.ts        // 单元测试
├── users.controller.ts
└── users.controller.spec.ts     // 控制器/集成测试

apps/api/test/
└── users.e2e-spec.ts            // 端到端测试
```

**测试模式：**
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

### 前端（Riverpod + Mocktail）

**文件命名:** `*_test.dart`，与源代码同位置在 `test/` 中。

**示例结构：**
```
apps/mobile/test/features/users/
├── user_controller_test.dart     // Provider 逻辑
├── user_screen_test.dart         // 组件测试
└── user_repository_test.dart     // Repository 层

apps/mobile/test/helpers/
└── pump_app.dart                 // 测试工具
```

**Provider 测试模式：**
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

### 覆盖要求

- **后端:** 业务逻辑（服务、助手）80%+ 覆盖率
- **前端:** provider + 关键组件 70%+ 覆盖率
- **排除:** 自动生成文件、平凡 getter、模拟工具

## 提交消息约定

**格式:** Conventional Commits（由 commitlint 强制）

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型：**
- `feat:` 新功能
- `fix:` 缺陷修复
- `refactor:` 代码重构（无功能变更）
- `test:` 添加/更新测试
- `docs:` 仅文档
- `chore:` 构建配置、依赖等（无 AI 参考）

**示例：**
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

**CI 强制：**
- Commitlint 在 `.husky/commit-msg` hook 中运行
- 拒绝无效格式
- 错误消息指导用户纠正格式

## Lint 与格式化

### 后端（TypeScript + ESLint）

**运行 lint：**
```bash
pnpm --filter @mobile-boilerplate/api lint
```

**预提交（Lefthook）：**
```yaml
# .lefthook.yml
pre-commit:
  commands:
    lint:
      run: pnpm --filter={app} lint
      glob: "src/**/*.ts"
```

**Lint 规则：**
- 无未使用变量
- 无 `any` 类型
- 无深层嵌套三元组
- 一致间距

### 前端（Dart 分析器）

**运行分析：**
```bash
cd apps/mobile && fvm flutter analyze
```

**预提交（Lefthook）：**
同一 hook 触发分析器 + 测试。

## 导入组织

### 后端（TypeScript）
```typescript
// 1. Node/外部包
import { Controller } from '@nestjs/common';
import axios from 'axios';

// 2. 绝对路径（@shared、@modules 等）
import { Logger } from '@shared/logger';

// 3. 相对路径
import { HelloService } from './hello.service';
```

### 前端（Dart）
```dart
// 1. Dart SDK
import 'dart:async';

// 2. Flutter 包
import 'package:flutter/material.dart';

// 3. Pub 包
import 'package:riverpod/riverpod.dart';

// 4. 本地包（api_client）
import 'package:api_client/api_client.dart';

// 5. 相对路径
import '../domain/repositories/user_repository.dart';
```

## 禁止模式

| 模式 | 原因 | 示例 |
|---------|--------|---------|
| 深层模块导入（后端） | 破坏封装 | `src/modules/users/internal/*` 外部可见 |
| 交叉功能导入（前端） | 紧密耦合、难删除功能 | 功能 A 导入功能 B 的 provider |
| `@Controller()` 无路径 | 路由歧义 | 路由意外嵌套 |
| 硬编码 URL/API 路径 | 非环境感知 | `'http://localhost:3000'` 而非环境变量 |
| `@Public()` 不应公开路由 | 安全风险 | 意外暴露 /admin 用 `@Public()` |
| 生产代码中 `console.log` | 日志噪音 | 使用结构化日志（Pino、logger 服务） |
| 魔数字 | 难读、难维护 | `limit: 100` 无解释（使用命名常量） |
| `// TODO` 无 issue 号 | 永远完成不了 | 债务积累；链接到 GitHub issue |

## 错误处理

### 后端
```typescript
// ✗ 不好：无声失败
const user = await prisma.user.findUnique({ where: { id } });
if (user) return user; // 未找到时什么？Undefined？

// ✓ 好：显式错误
const user = await this.prisma.user.findUnique({ where: { id } });
if (!user) {
  throw new NotFoundException(`User ${id} not found`);
}
return user;
```

### 前端
```dart
// ✗ 不好：无声错误
try {
  await repository.fetchUser();
} catch (e) {
  // 错误被忽略
}

// ✓ 好：处理或传播
try {
  return await repository.fetchUser();
} catch (e) {
  rethrow; // 让 provider 处理状态转换为错误
}
```

### 日志

- `pino-http` + `nestjs-pino` 用于结构化 JSON 日志。
- `redact:` 路径覆盖 `Authorization`、`Cookie`、password、token、refreshToken、email。
- **查询字符串默认从日志中剥离** 避免通过 `?token=...` 等方式泄露 PII。需要时可通过覆盖日志器按端点重新启用。
- `requestId` 回退链：`req.id`（pino-http）→ `X-Request-ID` 头 → 新鲜 UUID。永不为空。

## 文档要求

**代码注释需要用于：**
- 非显而易见的业务逻辑
- 解决方案（如复杂性，链接 GitHub issue）
- 公开 API 合约（参数、返回值）
- 弃用代码（何时删除计划）

**自文档化代码优于注释：**
```typescript
// ✗ 不好
const a = x > 10 ? 100 : x * 10;  // 什么是 a？

// ✓ 好
const adjustedPrice = price > 10 ? 100 : price * 10;
```

## 版本钉扎

**后端（package.json）：**
- 主依赖钉扎：`^13.0.0`（允许次版本/补丁）
- 测试/lint 工具精确：`=1.0.0`（确定性 CI）

**前端（pubspec.yaml）：**
- 插件依赖钉扎：`^2.5.0`（允许次版本/补丁）
- 测试运行器精确：`=2.4.13`（确定性 CI）

**更新流程：**
- 每周 `pnpm upgrade` / `fvm flutter pub upgrade --major-versions`
- CI 回归测试必须通过
- 每次升级的更新日志条目

---

**最后更新:** 2026 年 4 月
