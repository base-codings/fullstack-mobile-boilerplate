# 部署指南

> 🌐 **语言:** [English](../../deployment-guide.md) · [Tiếng Việt](../vi/deployment-guide.md) · **中文** · [한국어](../ko/deployment-guide.md)

## 后端部署

### Docker 构建

**多阶段 Dockerfile**（位置在项目根目录 `Dockerfile`）：

```dockerfile
# 阶段 1：构建
FROM node:20-alpine AS builder
WORKDIR /build
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm --filter @mobile-boilerplate/api build

# 阶段 2：运行时
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /build/apps/api/dist ./dist
COPY --from=builder /build/apps/api/node_modules ./node_modules
COPY --from=builder /build/apps/api/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**本地构建：**
```bash
docker build -t mobile-boilerplate-api:latest .
```

**在 CI 中构建（GitHub Actions）：**
- 触发于推送到 `main` 或 `beta` 分支（在 api-ci 通过后）
- 构建 docker 镜像
- 用 git sha + 分支标签标记
- 推送到 registry（例如 Docker Hub、ECR、GCR）

**设置 CI 密钥：**
- `DOCKER_REGISTRY` — `docker.io` 或私有 registry URL
- `DOCKER_USERNAME` — registry 用户名
- `DOCKER_PASSWORD` — registry 密码或令牌

### 环境配置

**生产 (.env)：**
```bash
DATABASE_URL="postgresql://user:pass@prod.supabase.co:5432/boilerplate"
DIRECT_URL="postgresql://user:pass@prod.supabase.co:5432/boilerplate"
SKIP_DB=false
NODE_ENV=production
LOG_LEVEL=info
API_PORT=3000
THROTTLE_LIMIT=100
THROTTLE_TTL=60000
JWT_SECRET="<use-secrets-manager>"
```

**暂存 (.env)：**
```bash
DATABASE_URL="postgresql://user:pass@staging.supabase.co:5432/boilerplate"
DIRECT_URL="postgresql://user:pass@staging.supabase.co:5432/boilerplate"
SKIP_DB=false
NODE_ENV=staging
LOG_LEVEL=debug
API_PORT=3000
JWT_SECRET="<use-secrets-manager>"
```

**生产部署选项：**

| 平台 | 方法 | 说明 |
|----------|--------|-------|
| **Docker** | `docker run -e DATABASE_URL=... mobile-boilerplate-api` | 简单、可移植 |
| **Kubernetes** | 使用 Helm chart 或清单 | 自动扩展、HA |
| **Cloud Run** (GCP) | 推送镜像、设置环境变量 | 无服务器、自动扩展 |
| **ECS** (AWS) | 任务定义 + 服务 | 托管容器 |
| **Railway** | 连接 GitHub、自动部署 | 小项目最简单 |

**密钥管理：**
- **从不提交 `.env` 文件**
- 使用平台特定密钥（GitHub 密钥、AWS 密钥管理、Vault）
- 在运行时通过环境变量或卷挂载注入
- 定期轮换密钥

### 数据库迁移

**自动化架构迁移（Prisma）：**

```bash
# 生成最新迁移文件
pnpm --filter @mobile-boilerplate/api prisma:migrate deploy
```

**在 CI/CD 中：**
- 在启动服务器前运行（通过 Prisma 零停机时间）
- 回滚：git revert commit，重新部署（Prisma 追踪迁移）

**在 Supabase 上手动迁移：**
1. 转到 SQL 编辑器
2. 复制迁移文件内容来自 `apps/api/prisma/migrations/<timestamp>-<name>/migration.sql`
3. 在编辑器中运行
4. 验证架构已更新

### 健康检查

**端点:** `GET /health`（无需认证）

**响应：**
```json
{
  "data": {
    "status": "ok",
    "database": "connected"
  },
  "meta": { "requestId": "..." },
  "error": null
}
```

**使用者：**
- Kubernetes 活跃探针：`http://pod:3000/health`
- 负载均衡器健康检查
- 监控告警

### 监控与日志

**结构化日志（Pino）：**
- 所有日志输出为 JSON（用 ELK、Datadog、CloudWatch 解析）
- 每请求有 requestId 用于追踪
- 日志级别可通过 `LOG_LEVEL` 环境变量配置

**示例日志条目：**
```json
{
  "level": 20,
  "time": "2026-04-27T00:00:00.000Z",
  "pid": 1234,
  "hostname": "pod-xyz",
  "req": { "method": "GET", "url": "/hello" },
  "res": { "statusCode": 200 },
  "duration": 5,
  "requestId": "uuid-v4",
  "msg": "request completed"
}
```

**设置日志聚合：**
- Datadog Agent → 日志到 Datadog
- AWS CloudWatch agent → 日志到 CloudWatch
- ELK Stack → 日志到 Elasticsearch

## 移动部署

### Android (APK/AAB)

**构建签名 APK（生产）：**
```bash
cd apps/mobile
fvm flutter build apk --release --dart-define=FLAVOR=prod
# 输出: build/app/outputs/apk/release/app-release.apk
```

**构建应用包（Play Store，推荐）：**
```bash
fvm flutter build appbundle --release --dart-define=FLAVOR=prod
# 输出: build/app/outputs/bundle/release/app-release.aab
```

**签名：**
1. 创建 keystore（一次性）：
   ```bash
   keytool -genkey -v -keystore ~/my-release-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias my-key-alias
   ```
2. 在 `apps/mobile/android/key.properties` 中引用：
   ```
   storeFile=/path/to/my-release-key.jks
   storePassword=****
   keyPassword=****
   keyAlias=my-key-alias
   ```
3. 构建将自动签名

**上传到 Play Store：**
- 使用 Play Console（手动）
- 或 fastlane：`fastlane supply --aab=path/to/app-release.aab --package_name=com.yourcompany.app`

### iOS (IPA/TestFlight)

**构建签名 IPA（生产）：**
```bash
cd apps/mobile
fvm flutter build ipa --release --dart-define=FLAVOR=prod
# 输出: build/ios/ipa/mobile_boilerplate.ipa
```

**签名：**
1. 在 Apple 开发者中创建或更新配置文件
2. 更新 `ios/Runner.xcconfig`：
   ```
   DEVELOPMENT_TEAM = ABC123XYZ
   CODE_SIGN_IDENTITY = iPhone Distribution
   ```
3. 构建将自动签名

**上传到 TestFlight/App Store：**
- 使用 Xcode Organizer（手动）
- 或 fastlane：`fastlane deliver --ipa=path/to/mobile_boilerplate.ipa`

### 应用版本管理

**版本在 pubspec.yaml 中：**
```yaml
version: 0.1.0+1  # 0.1.0 = 语义版本，1 = 构建号
```

**更新流程：**
1. 编辑 `pubspec.yaml` 中的 `version`
2. 提交 + 推送到 `main` 分支
3. semantic-release 自动标记和发布
4. CI 以新版本构建 APK/IPA

## 发布流程

### Semantic-Release 流程

**配置在项目根 `.releaserc.cjs` 中：**

1. **常规提交解析：**
   - `feat:` → 次版本碰撞
   - `fix:` → 补丁版本碰撞
   - `BREAKING CHANGE:` → 主版本碰撞

2. **自动生成更新日志**（附加到 `docs/project-changelog.md`）

3. **创建 Git 标签：** 例如 `v1.2.0` 或 `v1.2.0-beta.1`

4. **发布版本：**
   - Main 分支 → 生产发布（v1.2.0）
   - Beta 分支 → 预发布（v1.2.0-beta.1）

5. **制品：**
   - Git 标签推送
   - GitHub 上的发布说明
   - Docker 镜像标记 + 推送（如果 api 改变）
   - 移动应用上传（如果移动改变，手动步骤）

### 发布门禁

**semantic-release 仅在以下情况运行：**
1. `api-ci` 工作流通过（后端测试、lint、构建）
2. `mobile-ci` 工作流通过（前端测试、lint、构建）
3. 分支为 `main` 或 `beta`

**示例:** 若推送到 `main` 的功能破坏测试，semantic-release 会阻止发布直到修复。

### 分支与版本

| 分支 | 发布类型 | 示例标签 |
|--------|---|---|
| `main` | 生产 | `v1.2.0` |
| `beta` | 预发布 | `v1.2.0-beta.1` |
| `feature/*` | 无（仅 CI） | — |
| `develop` | 无（仅 CI） | — |

## 环境特定配置

### 本地开发
- **后端:** `DATABASE_URL=postgresql://localhost/boilerplate` 或 `SKIP_DB=true`
- **移动:** `API_BASE_URL=auto`、`FLAVOR=dev`

### 暂存
- **后端:** Supabase 暂存项目、`LOG_LEVEL=debug`
- **移动:** `API_BASE_URL=https://staging-api.yourcompany.com`、`FLAVOR=staging`

### 生产
- **后端:** Supabase 生产、`LOG_LEVEL=info`、监控启用
- **移动:** `API_BASE_URL=https://api.yourcompany.com`、`FLAVOR=prod`

**移动配置为构建时**（`flutter build --dart-define=FLAVOR=prod`）。
**后端配置为运行时**（部署时环境变量）。

## 回滚策略

**后端（基于 Docker）：**
1. 保留旧镜像标记：`mobile-boilerplate-api:v1.1.0`（旧）、`v1.2.0`（新）
2. 若生产中断，重新部署旧镜像：
   ```bash
   docker run -e DATABASE_URL=... mobile-boilerplate-api:v1.1.0
   ```
3. 或使用 git：`git checkout v1.1.0 && docker build ...`

**移动：**
- Play Store：使用"管理发布"→ 以前版本作为活跃
- App Store：在 App Store Connect 中使用 TestFlight 或以前版本

**数据库（Prisma）：**
- 迁移在 git 中版本化
- 要回滚架构：`git revert <migration-commit>`，然后 `prisma migrate deploy`
- **谨慎：** 可能数据丢失；重大迁移前备份

## 持续监控

**设置告警：**
- HTTP 5xx 错误率 > 1%
- 请求延迟 p95 > 500ms
- 数据库连接池耗尽
- 磁盘使用 > 80%
- 内存使用 > 85%

**工具：**
- Datadog、New Relic、Prometheus、CloudWatch
- 在监控仪表板中设置阈值
- 通过 Slack、PagerDuty 告警

---

**最后更新:** 2026 年 4 月
