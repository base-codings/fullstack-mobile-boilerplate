# 概览

> 🌐 **语言:** [English](../../overview.md) · [Tiếng Việt](../vi/overview.md) · **中文** · [한국어](../ko/overview.md)

## 这是什么？

**mobile-boilerplate** 是一个生产就绪的 monorepo 脚手架，用于发布由 NestJS API（基于 Supabase）支持的 Flutter 移动应用。

它提供：
- **前端:** Flutter 应用，包含 Riverpod 状态管理、Dio HTTP 客户端、go_router 导航和国际化支持（英文 + 越南文已就绪，可扩展到中文和韩文）。
- **后端:** NestJS API，包含 Prisma ORM、结构化日志记录（Pino）、请求速率限制、默认拒绝认证和 OpenAPI 代码生成。
- **DevOps:** Docker 多阶段构建、docker-compose 用于本地开发、semantic-release 流程（main = 生产环境，beta = 预发布）、GitHub Actions CI/CD 门禁。
- **质量:** Lefthook 预提交 lint、commitlint 消息验证、Riverpod/Jest 单元测试、e2e 测试、严格 TypeScript、Dart lint。

## 目标受众

- **移动团队** 发布具有自定义后端的 Flutter 应用
- **创业公司** 需要快速上手并内置最佳实践
- **企业** 需要 monorepo 结构、审计跟踪（请求 ID）和安全默认值（默认拒绝认证）

## 范围内

- 单租户 SaaS 应用
- 认证（简单实现；可替换为 JWT、OAuth、Supabase Auth）
- 实时数据同步候选（WebSocket 或轮询的骨架）
- 多风味构建（dev/staging/prod）
- 多语言 UI（基于 ARB 的国际化）
- Docker 部署在 Linux 上（云无关）

## 范围外

- **电子商务重型功能** — 无购物车、库存、支付集成（你将添加这些模块）
- **实时协议** — WebSocket 管道不包含；作为功能模块添加
- **移动平台特定功能** — 无 iOS 特定功能、Android 特定原生模块（预期 flutter 插件）
- **机器学习** — 无设备端 ML 或 TFLite 集成
- **离线优先同步** — 假设在线应用，偶尔连接丢失（如需本地数据库，添加 Drift）

## 技术栈概览

| 层 | 技术 | 说明 |
|-------|-----------|-------|
| **移动 UI** | Flutter 3.27+、Material 3 主题 | go_router 导航、Riverpod 状态管理 |
| **API 客户端** | Dio 5.7+ | 从 OpenAPI 规范生成（NestJS → Dart） |
| **状态管理** | Riverpod 2.5+ | AsyncNotifierProvider、测试覆盖模式 |
| **HTTP 服务器** | NestJS 10+、Express | 结构化日志记录（Pino）、速率限制、守卫、拦截器 |
| **ORM** | Prisma 5+ | 自动迁移、类型安全查询 |
| **数据库** | PostgreSQL (Supabase) | SKIP_DB 环境变量用于仅 hello 验证 |
| **包管理器** | pnpm 9+、melos | Monorepo 工作空间 + Dart 工具 |
| **CI/CD** | GitHub Actions | Semantic-release、docker push、应用签名 |
| **Docker** | Alpine Linux、多阶段 | 最小层数、构建时依赖隔离 |

## Hello 流程（冒烟测试）

**在本地运行：**
```bash
# 1. 后端
pnpm --filter @mobile-boilerplate/api dev
# 服务器运行在 http://localhost:3000

# 2. 移动（同一终端，新会话）
cd apps/mobile
fvm flutter run --dart-define=FLAVOR=dev
# 应用连接到 http://localhost:3000（模拟器上自动解析）
```

**发生了什么：**
1. **移动:** 用户点击"获取 Hello"按钮
2. **HTTP:** Dio 客户端发送 `GET /hello`（从 OpenAPI 规范自动生成）
3. **API:** HelloController（公开路由，无需认证）调用 HelloService
4. **响应:** `{ data: { message: "Hello World", timestamp }, meta: {...}, requestId: "..." }`
5. **移动:** Riverpod provider 接收，UI 更新为消息 + 时间

**验证内容：**
- Monorepo 引导 + 代码生成正常
- 后端服务器启动、信封连接正确
- Flutter→API 连接、Dio 客户端正确生成
- Riverpod 状态更新 → UI 渲染循环

## 关键约束

| 约束 | 原因 |
|-----------|-----------|
| 默认拒绝认证（NotImplementedAuthGuard） | 安全优先；准备好时替换为 JwtAuthGuard。防止意外的公开端点。 |
| 全局速率限制（100 req/min/IP） | 无复杂 API 分级的滥用预防。可通过环境变量调整。 |
| 白名单 DTO 验证 | 拒绝未知字段；防止模型注入攻击。 |
| 无无路径 `@Controller()` | 路由明确清晰；防止意外嵌套路由。 |
| `@Public()` 仅用于 /hello、/health、/login | 默认"需要认证"；公开是选择加入。 |
| 功能模块隔离（无交叉功能导入） | 松散耦合，易于删除/重用功能。 |
| 每个代码文件最多 200 行 | 改进可读性，鼓励单一职责。 |
| 常规提交（feat:、fix:、refactor:） | 清晰更新日志、semantic-release 自动化。 |

## 开发工作流

1. **计划** — 草拟功能范围、数据库架构
2. **实现后端** — 添加 NestJS 模块、DTO、控制器、服务、测试
3. **重新生成客户端** — `pnpm codegen:api` 生成 Dart api_client
4. **实现前端** — 添加 Flutter 功能（实体、repository、provider、UI、测试）
5. **测试** — 单元测试（后端 Jest、移动 Riverpod+mocktail）、e2e 测试
6. **提交** — 常规消息、推送到功能分支
7. **CI 门禁** — GitHub Actions 运行 lint、测试、代码生成检查
8. **合并** — PR 审查、自动压缩合并
9. **发布** — semantic-release 读取提交、版本号碰撞、标签、推送到生产/预发布

## 成功指标

- **入门时间:** 新开发者阅读 [getting-started.md](guides/getting-started.md) → 完整环境在 15 分钟内运行
- **功能速度:** 后端模块 + Flutter 功能 + 测试 + 发布在 1–2 个冲刺中完成
- **代码质量:** 0 个 `any` 类型、80%+ 业务逻辑测试覆盖率、0 个 lint 错误
- **部署可靠性:** 自动发布零停机时间架构迁移、通过 git tag 回滚

## 后续步骤

→ [本地开发设置](guides/getting-started.md) 克隆并在本地运行

→ [系统架构](architecture.md) 获取详细组件分解

→ [代码标准](code-standards.md) 在首次提交前理解约定
