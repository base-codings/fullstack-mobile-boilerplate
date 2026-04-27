# 代码库总结

> 🌐 **语言:** [English](../../codebase-summary.md) · [Tiếng Việt](../vi/codebase-summary.md) · **中文** · [한국어](../ko/codebase-summary.md)

## 文件树概览

```
mobile-boilerplate/
├── apps/
│   ├── api/                         # NestJS 后端
│   │   ├── src/
│   │   │   ├── app.module.ts        # 根模块 + 全局守卫
│   │   │   ├── main.ts              # 引导
│   │   │   ├── common/              # 共享装饰器、守卫、拦截器
│   │   │   ├── config/              # 环境加载
│   │   │   ├── infra/               # 日志、Prisma 模块
│   │   │   └── modules/             # 功能模块（hello、health、...）
│   │   ├── test/                    # E2E 测试
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # 数据库模型
│   │   │   └── migrations/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                      # Flutter 应用
│       ├── lib/
│       │   ├── main.dart            # 入口点、ProviderScope 设置
│       │   ├── app.dart             # 根组件、主题、路由
│       │   ├── core/                # 依赖注入、配置、路由、主题、网络
│       │   ├── features/            # 功能模块（hello、...）
│       │   ├── shared/              # 跨功能组件
│       │   └── l10n/                # 翻译 ARB 文件
│       ├── test/                    # 单元 + 组件测试
│       ├── pubspec.yaml
│       └── analysis_options.yaml
│
├── packages/
│   └── api_client/                  # 自动生成 Dio API 客户端
│       └── lib/
│           └── api_client.dart      # 从 OpenAPI 规范生成的客户端
│
├── .github/
│   └── workflows/
│       ├── api-ci.yml               # 后端 lint、test、build、docker push
│       ├── mobile-ci.yml            # 前端 analyze、test、build apk/ipa
│       └── release.yml              # Semantic-release（main=生产、beta=预发布）
│
├── .claude/
│   └── rules/                       # 开发工作流文档
│
├── docs/                            # 文档（本文件夹）
│   ├── README.md
│   ├── guides/
│   └── languages/
│
├── tools/                           # 共享脚本
│
├── .husky/                          # Git 钩子（pre-commit、commit-msg）
├── lefthook.yml                     # Lint 强制
├── commitlint.config.js             # 提交消息验证
├── melos.yaml                       # Monorepo 工作空间配置
├── docker-compose.yml               # 本地 Postgres 服务
├── Dockerfile                       # 多阶段后端构建
└── package.json                     # Monorepo 根
```

## 快速参考：我在哪里添加新的 X？

| 任务 | 位置 | 模板/说明 |
|------|----------|---|
| **添加 API 端点** | `apps/api/src/modules/<resource>/` | 见 [add-new-backend-module.md](guides/add-new-backend-module.md) |
| **添加数据库表** | `apps/api/prisma/schema.prisma` | 添加模型、迁移、见 [add-prisma-module.md](guides/add-prisma-module.md) |
| **添加 Flutter 屏幕** | `apps/mobile/lib/features/<feature>/` | 见 [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) |
| **添加共享 Flutter 组件** | `apps/mobile/lib/shared/widgets/` | 用于多个功能 |
| **添加翻译字符串** | `apps/mobile/lib/l10n/app_<lang>.arb` | 添加到所有语言，见 [i18n-tone-guide.md](i18n-tone-guide.md) |
| **添加环境变量** | `apps/api/.env.example` / `apps/mobile/.env.example` | 更新两个文件 + 架构验证 |
| **添加全局装饰器** | `apps/api/src/common/decorators/` | 可跨模块重用 |
| **添加服务依赖** | `app.module.ts` providers 数组 | 注册为 provider，通过构造器注入 |
| **添加 API 测试** | `apps/api/test/<resource>.e2e-spec.ts` | 使用 TestingModule、TestingController |
| **添加 Riverpod provider** | `apps/mobile/lib/core/di/providers.dart` 或功能本地 | 测试用覆盖模式 |

## 核心模块说明

### 后端：`apps/api/src/modules/`

**模块 = 功能聚合** — 每个目录有：
- `<module>.module.ts` — 导入、provider 注册
- `<module>.controller.ts` — HTTP 路由
- `<module>.service.ts` — 业务逻辑
- `dto/` — Swagger 的请求/响应 DTO
- `<module>.spec.ts` — 单元测试

**示例：HelloModule**
```
modules/hello/
├── hello.module.ts
├── hello.controller.ts        # GET /hello
├── hello.service.ts
├── dto/
│   └── hello-response.dto.ts
└── hello.service.spec.ts
```

**隔离规则:** 模块的内部目录（`modules/hello/internal/*`）禁止在 `hello/` 模块外导入。使用 `common/` 或 `infra/` 中的共享服务作为跨模块逻辑。

### 前端：`apps/mobile/lib/features/`

**功能 = 用户可见功能** — 每个目录有：
- `domain/entities/` — 数据模型
- `domain/repositories/` — 抽象接口
- `data/<repo>_impl.dart` — 具体实现
- `presentation/controllers/` — Riverpod provider
- `presentation/screens/` — 主 UI
- `presentation/widgets/` — 子组件

**示例：HelloFeature**
```
features/hello/
├── data/
│   └── hello_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── hello.dart
│   └── repositories/
│       └── hello_repository.dart
└── presentation/
    ├── controllers/
    │   └── hello_controller.dart
    ├── screens/
    │   └── hello_screen.dart
    └── widgets/
        └── hello_card.dart
```

**隔离规则:** 功能 A 禁止直接导入功能 B。共享关注点存在 `core/` 或 `shared/` 中。

## 配置与环境

### 后端 (.env)
```bash
# apps/api/.env.example
DATABASE_URL="postgresql://user:pass@localhost:5432/boilerplate"
DIRECT_URL="postgresql://user:pass@localhost:5432/boilerplate"  # Supabase 连接池
SKIP_DB=false                                                    # 设为 true 仅 hello
NODE_ENV=development
LOG_LEVEL=debug
API_PORT=3000
THROTTLE_LIMIT=100
THROTTLE_TTL=60000
```

### 前端 (.env)
```bash
# apps/mobile/.env.example
FLAVOR=dev                      # dev、staging、prod
API_BASE_URL=auto               # auto=localhost，或明确 IP
LOG_LEVEL=debug
```

## 主要依赖

### 后端
- **NestJS** — 框架
- **Prisma** — ORM + 迁移
- **Pino** — 结构化日志
- **@nestjs/swagger** — OpenAPI 规范生成
- **@nestjs/throttler** — 速率限制
- **class-validator** — DTO 验证
- **jest** — 测试

### 前端
- **Flutter** — 移动 SDK
- **Riverpod** — 状态管理（初无 build_runner）
- **Dio** — HTTP 客户端
- **go_router** — 导航
- **intl** — 国际化（ARB 格式）
- **mocktail** — 测试中模拟

## 数据库架构

位置在 `apps/api/prisma/schema.prisma`：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 模型在此定义；自动生成 PrismaClient
// 示例: User、Post 等
```

**工作流：**
1. 编辑 `schema.prisma`
2. `pnpm --filter @mobile-boilerplate/api prisma:migrate dev --name <description>`
3. 架构变更自动同步；ORM 客户端重新生成

## CI/CD 工作流

### GitHub Actions

**api-ci.yml**（触发于 `apps/api/**` 变更）：
1. Lint (ESLint)
2. 测试 (Jest)
3. 构建 (tsc)
4. Docker 构建 + 推送到 registry（如果 main/beta 分支）

**mobile-ci.yml**（触发于 `apps/mobile/**` 变更）：
1. 分析 (flutter analyze)
2. 测试 (flutter test)
3. 构建 (flutter build apk/ipa)

**codegen-check.yml**（触发于 NestJS DTO 变更）：
1. 运行 `pnpm codegen:api`
2. 若 `packages/api_client/` 未更新则失败（强制同步）

**release.yml** (semantic-release)：
- 读取常规提交
- 版本号碰撞（major/minor/patch）
- 生成更新日志条目
- 标记发布
- 推送到 main（生产）或 beta（预发布）
- 仅 api-ci + mobile-ci 通过时运行

## 测试策略

### 后端
- **单元测试**（`.spec.ts` 同位置）— 服务逻辑、助手
- **E2E 测试**（`test/` 文件夹）— 完整请求/响应循环
- **模拟模式:** Jest spy + PrismaService 模拟
- **运行:** `pnpm --filter @mobile-boilerplate/api test`

### 前端
- **Provider 测试**（`*_test.dart`）— Riverpod 状态逻辑
- **组件测试** — UI 行为、点击、状态变更
- **模拟模式:** ProviderContainer 覆盖 + FakeRepository
- **运行:** `cd apps/mobile && fvm flutter test`

## 构建制品

### 后端
- **Docker 镜像** — 多阶段（构建依赖隔离）
- **发布至:** Docker registry（通过 CI 密钥设置）
- **运行:** `docker-compose up -d`（本地）或 Kubernetes（生产）

### 移动
- **APK**（Android）— 通用或分割 ABI
- **IPA**（iOS）— 用配置文件签名
- **发布至:** Play Store / App Store（手动或 fastlane）

## Monorepo 结构（Melos + pnpm）

**根 `package.json`：**
```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

**过滤命令：**
```bash
# 在特定工作空间运行脚本
pnpm --filter @mobile-boilerplate/api <script>
pnpm --filter @mobile-boilerplate/mobile <script>

# 跨所有运行
pnpm install
```

**Melos 引导（阶段 01）：**
```bash
melos bootstrap  # 链接工作空间、准备代码生成
```

---

**最后更新:** 2026 年 4 月
