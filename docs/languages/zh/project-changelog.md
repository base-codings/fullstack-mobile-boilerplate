# 项目更新日志

> 🌐 **语言:** [English](../../project-changelog.md) · [Tiếng Việt](../vi/project-changelog.md) · **中文** · [한국어](../ko/project-changelog.md)

本文档中所有值得注意的更改都将被记录。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
本项目遵循 [语义化版本](https://semver.org/spec/v2.0.0.html)。

## [未发布]

### 已添加

- **初始 monorepo 脚手架** — pnpm 工作空间 + Melos 配置
- **NestJS API** (`apps/api/`)
  - Express 适配器引导
  - 全局请求验证（ValidationPipe: 白名单 + forbidNonWhitelisted）
  - 全局异常过滤器（AllExceptionsFilter）→ 标准化错误信封
  - 全局日志拦截器（LoggingInterceptor）→ 请求计时 + 每请求日志
  - 全局响应转换拦截器（TransformResponseInterceptor）→ 在 `{ data, meta, requestId }` 中包装成功响应
  - 全局速率限制（ThrottlerGuard: 100 req/min/IP）
  - 全局默认拒绝认证（NotImplementedAuthGuard）— 路由必须显式使用 `@Public()` 或 `@RequireAuth()`
  - Helmet 中间件安全头
  - Pino 结构化日志（JSON 输出）
  - ConfigModule 环境配置（isGlobal: true）
  - Prisma ORM 含迁移支持
  - 全局可注入 PrismaService
  - Hello 模块：`GET /hello`（公开，无认证）
  - Health 模块：`GET /health`（公开，活跃探针）
  - OpenAPI (Swagger) 规范生成在 `/api-json`（开发模式）
  - 单元测试（Jest）与模块同位置（*.spec.ts）
  - `test/` 文件夹中的 E2E 测试

- **Flutter 移动应用** (`apps/mobile/`)
  - Riverpod 2.5+ 状态管理
  - Dio HTTP 客户端含拦截器
  - go_router 导航
  - Material 3 主题（浅色 + 深色模式，种子颜色：Indigo）
  - 国际化基础（ARB 格式）
    - 英文 (`app_en.arb`)
    - 越南文 (`app_vi.arb`)
    - 可扩展到中文、韩文
  - Flutter 环境（.env）支持通过 flutter_dotenv
  - 多风味支持（dev/staging/prod）通过 --dart-define=FLAVOR
  - Hello 功能展示
    - Repository 模式：数据 → 域 → 展示层
    - AsyncNotifierProvider 状态管理
    - 组件测试 + provider 测试（Riverpod + mocktail）
    - 共享 LoadingView + ErrorView 组件
  - 应用路由（首页 → hello）
  - Very Good Analysis lint

- **OpenAPI 代码生成流程**
  - 后端：NestJS Swagger 装饰器（`@ApiStandardResponse`、`@ApiOperation(operationId)`）
  - 代码生成：`pnpm codegen:api`（Java 17 + openapi-generator）
  - 输出：`packages/api_client/`（Dio 基础 REST 客户端）
  - 移动：自动生成方法名来自 operationId（例如 `getHello()`）
  - CI：codegen-check.yml 强制同步（若 DTO 改变未重新生成客户端则失败）

- **Docker 与部署**
  - NestJS API 多阶段 Dockerfile
  - docker-compose.yml 用于本地 PostgreSQL + API
  - Dockerfile 使用 Alpine Linux 最小镜像大小
  - 构建时依赖与运行时隔离

- **Monorepo 工具**
  - pnpm 工作空间（根 + apps/* + packages/*）
  - Dart + pub 包的 Melos 配置
  - `pnpm bootstrap` 脚本（install + codegen + melos bootstrap）

- **质量门禁**
  - Commitlint — 强制常规提交格式
  - Lefthook — 预提交 lint（为修改文件运行 lint + 测试）
  - ESLint（后端）— no-unused-vars、无 `any`、无深层导入
  - Dart 分析器（前端）— very_good_analysis 规则
  - 预提交钩子（通过 .husky）
  - GitHub Actions CI：
    - `api-ci.yml` — lint、test、build、docker push（在 apps/api/** 变更时）
    - `mobile-ci.yml` — analyze、test、build apk（在 apps/mobile/** 变更时）
    - `codegen-check.yml` — 验证 OpenAPI 客户端在 DTO 变更时重新生成
    - `release.yml` — semantic-release（main=生产、beta=预发布）

- **Semantic Release 流程**
  - semantic-release 配置（.releaserc.cjs）
  - 常规提交解析（feat、fix、refactor、docs 等）
  - 自动版本碰撞（major/minor/patch）
  - 自动更新日志生成
  - Git 标签创建（v1.0.0、v1.0.0-beta.1）
  - 发布发布（GitHub Releases）
  - 由 api-ci + mobile-ci 通过把守

- **数据库与 ORM**
  - Prisma 架构（apps/api/prisma/schema.prisma）
  - 通过 `prisma migrate dev` 自动迁移
  - PrismaClient 类型安全查询
  - Supabase PostgreSQL 支持（含 DIRECT_URL 用于 pgbouncer）
  - SKIP_DB 环境变量用于仅 hello 验证（无数据库需要）

- **文档**
  - README.md — 项目索引
  - project-overview-pdr.md — 范围、受众、约束
  - system-architecture.md — 分层、数据流、信封形状
  - code-standards.md — 命名、文件大小、TypeScript/Dart 风格、测试
  - codebase-summary.md — 文件树、快速参考表
  - design-guidelines.md — Material 3 主题、间距、响应设计
  - deployment-guide.md — Docker、移动签名、发布流程
  - feature-boundaries.md — 模块隔离规则（无交叉导入）
  - di-factory-pattern.md — NestJS provider、Riverpod、示例
  - i18n-tone-guide.md — ARB 格式、翻译流程、每语言音调
  - project-changelog.md — 本文件
  - guides/:
    - add-new-backend-module.md — NestJS 模块 + 认证/信封规则的配方
    - add-prisma-module.md — 数据库模型 + 服务的配方
    - add-new-flutter-feature.md — Flutter 功能结构的配方
    - api-contract-workflow.md — API 改变时的代码生成流程
    - local-development.md — 前置要求、设置、故障排除
  - 多语言翻译（vi、zh、ko）用于所有文档

### 配置文件

- `.nvmrc` — Node 20
- `.fvmrc` — Flutter 3.27
- `.editorconfig` — 编辑器标准化
- `.gitignore` — 排除 node_modules、.env、dist、build
- `.repomixignore` — 排除大二进制/vendor 文件夹
- `tsconfig.json`（根）— 基础 TypeScript 配置
- `tsconfig.app.json`（api）— 扩展根，目标 ES2020
- `eslint.config.js`（api）— no-unused-vars、no-restricted-imports（禁止 internal/*）
- `jest.config.js`（api）— 测试配置
- `pubspec.yaml`（移动）— Flutter 依赖
- `analysis_options.yaml`（移动）— Dart lint 规则
- `lefthoox.yml` — 预提交 lint 强制
- `commitlint.config.js` — 提交消息验证
- `melos.yaml` — monorepo Dart/pub 工作空间
- `docker-compose.yml` — 本地 Postgres 服务
- `Dockerfile` — 多阶段 NestJS API 构建
- `.releaserc.cjs` — semantic-release 配置
- `.releaserc.production.json` — 生产发布配置
- `.releaserc.beta-config.json` — beta 发布配置

### 环境变量（默认值）

**后端（apps/api/.env.example）**
- `DATABASE_URL` — PostgreSQL 连接字符串
- `DIRECT_URL` — Supabase pgbouncer URL
- `SKIP_DB=false` — 若为 true，跳过数据库连接（用于仅 hello 验证）
- `NODE_ENV=development`
- `LOG_LEVEL=debug`
- `API_PORT=3000`
- `THROTTLE_LIMIT=100`
- `THROTTLE_TTL=60000`（毫秒）
- `JWT_SECRET` — 占位符；交换为真实实现

**前端（apps/mobile/.env.example）**
- `FLAVOR=dev`（dev/staging/prod）
- `API_BASE_URL=auto`（自动解析每平台 localhost:3000，或明确 IP/URL）
- `LOG_LEVEL=debug`

### Git 钩子（通过 Husky）

- **pre-commit** — 通过 Lefthook 运行（lint + 格式检查）
- **commit-msg** — 验证常规提交格式（commitlint）

### NPM 脚本（根）

- `pnpm install` — 安装所有工作空间依赖
- `pnpm bootstrap` — `install` + `codegen:api` + `melos bootstrap`
- `pnpm lint` — 所有工作空间 lint
- `pnpm test` — 所有工作空间测试
- `pnpm dev` — 启动本地开发（API + 可选 Docker Postgres）
- `pnpm codegen:api` — 从 NestJS OpenAPI 规范生成 Dart 客户端
- `pnpm release` — semantic-release（手动触发，在 CI 中运行）

---

**说明：**
- 这是初始脚手架（阶段 0-10 完成）
- 功能开发就绪：使用 `docs/guides/` 中的指南作为配方
- 安全说明：默认拒绝认证（NotImplementedAuthGuard）必须交换为真实认证（JwtAuthGuard、Supabase Auth、OAuth）然后生产
- 数据库说明：迁移通过 Prisma 零停机时间；先在本地测试架构改变

**生成:** 2026 年 4 月 27 日
