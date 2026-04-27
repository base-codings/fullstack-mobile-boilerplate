# 架构

> 🌐 **语言:** [English](../../architecture.md) · [Tiếng Việt](../vi/architecture.md) · **中文** · [한국어](../ko/architecture.md)

## 数据流概览

```
┌─────────────────┐
│  Flutter 应用   │ (lib/core, lib/features, lib/shared)
│  (Riverpod)     │
└────────┬────────┘
         │
         │ Dio HTTP 客户端（从 OpenAPI 规范自动生成）
         │
┌────────▼────────────────────────────────────────────┐
│  NestJS API 服务器 (apps/api/src)                    │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 中间件: Helmet、CORS、请求日志记录              │ │
│  │ 守卫: ThrottlerGuard、NotImplementedAuthGuard   │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 控制器（路由）& 服务（业务逻辑）               │ │
│  │ modules/hello、modules/health、...              │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Prisma ORM → 数据库模型                        │ │
│  └─────────────────────────────────────────────────┘ │
└────────┬─────────────────────────────────────────────┘
         │
         │ SQL
         │
┌────────▼──────────────────┐
│ PostgreSQL (Supabase)      │
│ - 架构在 prisma/schema 中  │
│ - 自动迁移                 │
└───────────────────────────┘
```

## 响应信封

所有 API 响应（成功或错误）都包装在标准信封中：

```json
{
  "data": { /* 控制器返回值 */ },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-04-27T00:00:00Z",
    "version": "1.0"
  },
  "error": null  // 或错误对象，如果状态 >= 400
}
```

**强制执行者:** `TransformResponseInterceptor`（成功）+ `AllExceptionsFilter`（错误）

**`requestId` 回退链：**
1. `req.id`（由 pino-http 通过 `genReqId` 设置）
2. `X-Request-ID` 头（允许客户端关联）
3. 新鲜 `randomUUID()`（最后手段）

这确保每个错误响应都携带可用的关联 ID，即使在
pino-http 中间件之前错误触发时（例如 NestJS 内部启动错误）。

**生成的客户端（Dart）:** 反序列化自动处理。响应类型仅为 `data` 字段；`meta` + `requestId` 可通过上下文获得。

## 后端架构

### 文件夹结构 (apps/api/src)

```
apps/api/src/
├── main.ts                          # 引导：应用创建 + 监听
├── app.module.ts                    # 根模块：导入 + 全局守卫/管道/拦截器
├── common/                          # 跨模块共享
│   ├── auth/
│   │   ├── decorators/              # @Public()、@RequireAuth()
│   │   ├── not-implemented-auth.guard.ts  # 简单实现（默认拒绝）
│   │   └── jwt-auth.guard.ts        # 交换用于真实认证
│   ├── decorators/
│   │   └── api-standard-response.decorator.ts  # 包装 DTO + 信封为 Swagger
│   ├── filters/
│   │   └── all-exceptions.filter.ts  # 将错误格式化为信封
│   └── interceptors/
│       ├── logging.interceptor.ts   # 每请求计时
│       └── transform-response.interceptor.ts  # 包装成功数据
├── config/
│   ├── config.module.ts             # ConfigModule.forRoot (isGlobal: true)
│   ├── app.config.ts                # NestJS 配置架构
│   └── env.schema.ts                # Joi .env 验证
├── infra/                           # 基础设施
│   ├── logger/
│   │   └── logger.module.ts         # Pino 结构化日志
│   └── prisma/
│       ├── prisma.module.ts         # 全局 PrismaService
│       └── prisma.service.ts
└── modules/                         # 功能模块
    ├── hello/
    │   ├── hello.module.ts
    │   ├── hello.controller.ts      # 路由: GET /hello
    │   ├── hello.service.ts         # 业务逻辑
    │   ├── dto/
    │   │   └── hello-response.dto.ts
    │   └── hello.service.spec.ts
    └── health/
        ├── health.module.ts
        └── health.controller.ts     # GET /health（活跃探针）
```

### 分层职责

| 层 | 职责 | 示例 |
|-------|---|---|
| **控制器** | HTTP 路由、请求解析、响应格式化 | `@Get(':id')` 路径 + 查询 + 体参数 |
| **服务** | 业务逻辑、编排、错误处理 | 验证输入、调用 repository、处理边界情况 |
| **Repository** | 数据访问抽象（可选，使用 Prisma 直接） | 接口 + 实现 |
| **Prisma** | 类型安全数据库查询、迁移 | `prisma.user.findUnique({ where: { id } })` |
| **守卫/拦截器** | 横切关注: 认证、日志、速率限制 | 通过装饰器应用到全局或每路由 |
| **过滤器** | 异常 → HTTP 响应格式化 | 400/401/500 → 信封含错误详情 |
| **装饰器** | 路由、验证、Swagger 文档元数据 | `@Public()`、`@ApiStandardResponse(Dto)` |

### 全局 Provider (app.module.ts)

| Provider | 目的 | 类型 |
|---|---|---|
| APP_PIPE | ValidationPipe（白名单 + forbidNonWhitelisted） | 防止注入 |
| APP_GUARD | NotImplementedAuthGuard（默认拒绝） | 安全优先；交换为 JwtAuthGuard |
| APP_GUARD | ThrottlerGuard | 速率限制: 100 req/min/IP |
| APP_FILTER | AllExceptionsFilter | 将错误格式化为信封 |
| APP_INTERCEPTOR | LoggingInterceptor | 每请求日志时长 + 状态 |
| APP_INTERCEPTOR | TransformResponseInterceptor | 在信封中包装成功响应 |

## 前端架构

### 文件夹结构 (apps/mobile/lib)

```
apps/mobile/lib/
├── main.dart                        # 应用入口 + ProviderScope 设置
├── app.dart                         # App 组件，包含主题 + 路由
├── core/                            # 共享非功能逻辑
│   ├── config/
│   │   ├── env.dart                 # AppEnv: FLAVOR、API_BASE_URL 等
│   │   └── flavor.dart              # 枚举: dev、staging、prod
│   ├── di/
│   │   └── providers.dart           # 全局 Riverpod provider
│   ├── network/
│   │   └── dio_client.dart          # Dio 实例工厂
│   ├── router/
│   │   └── app_router.dart          # go_router 路由定义
│   ├── theme/
│   │   └── app_theme.dart           # Material 3 浅色 + 深色主题
│   └── error/
│       ├── app_exception.dart       # 自定义异常
│       └── failure.dart             # AsyncValue 的失败类型
├── features/                        # 功能模块（隔离）
│   └── hello/
│       ├── data/
│       │   └── hello_repository_impl.dart
│       ├── domain/
│       │   ├── entities/
│       │   │   └── hello.dart       # 数据类
│       │   └── repositories/
│       │       └── hello_repository.dart  # 抽象接口
│       └── presentation/
│           ├── controllers/
│           │   └── hello_controller.dart  # Riverpod provider
│           ├── screens/
│           │   └── hello_screen.dart
│           └── widgets/
│               └── hello_card.dart
├── shared/                          # 跨功能组件、实用工具
│   └── widgets/
│       ├── error_view.dart
│       └── loading_view.dart
└── l10n/                            # 国际化（ARB 文件）
    ├── app_en.arb
    └── app_vi.arb
```

### 依赖注入 (Riverpod)

**全局 provider** 存在 `lib/core/di/providers.dart`：
- `flavorProvider` — 应用风味（dev/staging/prod），在 `main()` 中覆盖
- `envProvider` — 运行时配置（基础 URL 等），在 `main()` 中覆盖
- `dioProvider` — HTTP 客户端，依赖 env + flavor

**功能 provider** 存在 `lib/features/<name>/presentation/controllers/`：
- `<name>ControllerProvider` — 异步通知器管理状态
- 依赖 repository，repository 依赖 dioProvider

**测试覆盖模式:**
```dart
ProviderContainer(
  overrides: [
    dioProvider.overrideWithValue(mockDio),
    helloRepositoryProvider.overrideWithValue(FakeHelloRepository()),
  ],
);
```

### 状态管理 (Riverpod)

每个功能有一个异步控制器：

```dart
// 普通 Provider（脚手架状态，暂无 build_runner）
final helloRepositoryProvider = Provider<HelloRepository>(
  (ref) => HelloRepositoryImpl(ref.watch(dioProvider)),
);

// AsyncNotifierProvider（管理异步获取状态）
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

**UI 消费：**
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

## OpenAPI 代码生成流程

1. **后端 DTO 定义：**
   ```typescript
   // apps/api/src/modules/hello/dto/hello-response.dto.ts
   export class HelloResponseDto {
     @ApiProperty()
     message: string;

     @ApiProperty()
     timestamp: Date;
   }
   ```

2. **控制器声明：**
   ```typescript
   @Controller('hello')
   export class HelloController {
     @Get()
     @ApiOperation({ operationId: 'getHello' })
     @ApiStandardResponse(HelloResponseDto)
     getHello(): HelloResponseDto { ... }
   }
   ```

3. **Swagger 规范生成：**
   - NestJS @nestjs/swagger 读取装饰器
   - 规范自动生成于 `http://localhost:3000/api-json`（开发模式）
   - 保存为 `openapi.json`（CI/CD）

4. **Dart 客户端生成：**
   ```bash
   pnpm codegen:api  # 运行 openapi-generator 或类似工具
   ```
   - 输入: `openapi.json`
   - 输出: `packages/api_client/lib/`（Dio 基础 REST 客户端）
   - 方法名源自 `operationId`（例如 `getHello()`）

5. **移动集成：**
   ```dart
   // 生成的客户端自动注入到功能 repository
   final apiClient = ref.watch(apiClientProvider);
   final response = await apiClient.getHello();  // 类型安全
   ```

## 多环境设置

### 本地开发
- **后端:** `SKIP_DB=true`（仅 hello 端点）或真实 Postgres
- **移动:** `.env` 中 `API_BASE_URL=auto` → localhost:3000（每平台自动解析）

### 暂存
- **后端:** Supabase 暂存数据库、真实认证（JwtAuthGuard）
- **移动:** `.env` 中明确暂存 API URL 或 `flutter run --dart-define=API_BASE_URL=...`

### 生产
- **后端:** Supabase 生产数据库、认证、监控
- **移动:** 签名 APK/IPA、应用签名证书、发布到 Play Store / App Store

## 数据库架构 (Prisma)

位置在 `apps/api/prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Supabase pgbouncer 解决方案
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

**工作流：**
1. 编辑架构
2. `pnpm --filter @mobile-boilerplate/api prisma migrate dev --name add_users`
3. `pnpm --filter @mobile-boilerplate/api prisma generate`
4. 自动生成的 `PrismaClient` 含类型安全查询

## 安全架构

| 机制 | 实现 | 强制在 |
|---|---|---|
| **默认拒绝认证** | NotImplementedAuthGuard（所有路由默认 401） | app.module.ts APP_GUARD |
| **公开路由选择加入** | `@Public()` 装饰器 | 每控制器或每方法 |
| **输入验证** | WhitelistPipe forbidNonWhitelisted | app.module.ts APP_PIPE |
| **速率限制** | ThrottlerGuard（100 req/min/IP） | app.module.ts APP_GUARD |
| **请求 ID 追踪** | 每请求 UUID、记录 + 返回信封 | TransformResponseInterceptor |
| **HTTPS (SSL)** | 反向代理（nginx/ALB）生产环境 | Kubernetes/Docker 编排 |
| **CORS** | Helmet 中间件 | app.module.ts imports |
| **SQL 注入预防** | Prisma 参数化查询 | ORM 层 |

## 错误处理

**后端异常 → 标准化信封：**

```typescript
// AllExceptionsFilter 捕获所有异常
{
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "验证失败",
    "details": ["field1 必须为字符串"]
  },
  "meta": { "requestId": "..." }
}
```

**移动端接收：**
```dart
helloAsync.when(
  error: (err, stack) {
    // err 是包含 statusCode、message 的 AppException
  },
);
```

## 监控与可观察性

- **日志:** Pino（后端结构化 JSON 日志）
- **请求追踪:** 元数据中 requestId + 日志
- **错误报告:** 所有异常含上下文记录
- **性能:** LoggingInterceptor 记录请求时长
- **健康检查:** GET /health（无需认证）
