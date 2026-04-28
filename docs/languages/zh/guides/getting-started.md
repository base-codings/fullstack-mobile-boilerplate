# 快速开始

> 🌐 **语言:** [English](../../../guides/getting-started.md) · [Tiếng Việt](../../vi/guides/getting-started.md) · **中文** · [한국어](../../ko/guides/getting-started.md)

在 15 分钟内让完整脚手架运行。

## 前置要求

| 工具 | 版本 | 安装 |
|------|---------|---------|
| **Node** | 20+ | `nvm install 20` |
| **pnpm** | 9+ | `npm install -g pnpm@9` |
| **FVM** | latest | `dart pub global activate fvm` |
| **Flutter** | 3.27+ | `fvm install 3.27.0` |
| **Java** | 17+ | `java -version`（用于代码生成） |
| **Docker** | (可选) | 用 Postgres + API 镜像 |

**验证：**
```bash
node --version     # v20.x.x
pnpm --version     # 9.x.x
fvm --version      # latest
dart --version     # 3.5.x
java -version      # openjdk 17+
```

## 克隆与安装

```bash
# 1. 克隆 repo
git clone https://github.com/yourorg/mobile-boilerplate.git
cd mobile-boilerplate

# 2. 安装依赖（所有工作空间）
pnpm install

# 3. Bootstrap monorepo（代码生成 + Melos）
pnpm bootstrap
```

**`pnpm bootstrap` 做什么：**
- 安装所有工作空间依赖
- 运行 `pnpm codegen:api`（生成 Dart 客户端）
- 运行 `melos bootstrap`（链接 pub 包）

## 后端设置

### 选项 A：本地 Postgres（Docker）

**启动 Postgres：**
```bash
docker-compose up -d postgres
# 容器运行在 localhost:5432，user=postgres，password=postgres
```

**创建 .env：**
```bash
cp apps/api/.env.example apps/api/.env
```

**编辑 .env：**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boilerplate"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/boilerplate"
SKIP_DB=false
NODE_ENV=development
LOG_LEVEL=debug
API_PORT=3000
```

**新增环境变量（Phase 02 强化）：**

| 变量 | 默认值 | 描述 |
|---|---|---|
| `TRUST_PROXY` | `0` | 前面代理数量。如果在 LB/Cloudflare 后设置为 `1`。 |
| `BODY_LIMIT` | `1mb` | 最大 JSON/urlencoded 体大小。使用 multer 处理文件上传。 |

**运行迁移：**
```bash
pnpm --filter @mobile-boilerplate/api prisma:migrate dev
```

### 选项 B：Supabase 云

1. 在 https://supabase.com 创建项目
2. 从"Connection Pooler"复制 DATABASE_URL + DIRECT_URL
3. 粘贴到 `.env`
4. 运行迁移：`pnpm --filter @mobile-boilerplate/api prisma:migrate deploy`

### 选项 C：跳过数据库（仅 Hello）

要运行无数据库的 API（仅 hello 端点）：

```bash
# .env
SKIP_DB=true
DIRECT_URL="postgresql://unused@unused:5432/unused"  # 未使用
```

## 启动后端

```bash
pnpm --filter @mobile-boilerplate/api dev
```

**输出：**
```
[Nest] 12345 - 04/27/2026, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345 - 04/27/2026, 10:00:01 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +123ms
[Nest] 12345 - 04/27/2026, 10:00:02 AM     LOG [NestApplication] Nest application successfully started +456ms
```

**验证：**
```bash
curl http://localhost:3000/health
# {"data":{"status":"ok"},"meta":{...},"error":null}

curl http://localhost:3000/hello
# {"data":{"message":"Hello World","timestamp":"..."},"meta":{...},"error":null}
```

**Swagger:** http://localhost:3000/api-docs（仅开发模式；非开发环境需设 `ENABLE_SWAGGER=true`）

## 移动设置

### 创建 .env

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

**默认 .env：**
```bash
FLAVOR=dev
API_BASE_URL=auto
LOG_LEVEL=debug
```

**API_BASE_URL 解析：**

| 平台 | 值 | 解析为 |
|----------|-------|---|
| Android 模拟器 | `auto` | `http://10.0.2.2:3000` |
| iOS 模拟器 | `auto` | `http://localhost:3000` |
| Web（localhost） | `auto` | `http://localhost:3000` |
| 真实设备 | 明确 IP | `http://192.168.1.42:3000` |

**对本地网络上的真实设备：**
```bash
# 找到机器 IP
ifconfig | grep "inet 192"  # macOS/Linux
ipconfig | grep IPv4         # Windows

# 编辑 .env
API_BASE_URL=http://192.168.1.42:3000
```

### 运行移动

```bash
cd apps/mobile
fvm flutter run --dart-define=FLAVOR=dev
```

**首次运行（2–3 分钟）：**
- 构建 APK
- 在模拟器/设备上安装
- 启动应用

**输出（成功）：**
```
Launching lib/main.dart on Android Emulator in debug mode...
✓ Built build/app/outputs/apk/debug/app-debug.apk
Installing and launching...
D/HostConnection( xxxx): hostConnection obtained, fd=44
I/System  (xxxx): [MAIN] app launched successfully
```

### 测试应用

1. **点击"获取 Hello"** 按钮
2. **UI 显示:** "Hello World" + 时间戳
3. **检查日志:** `adb logcat | grep "DEBUG"` 查看 Dio 请求

## 故障排除

### 后端不启动

**错误："EADDRINUSE: address already in use :::3000"**
```bash
# 找到使用 3000 的进程
lsof -i :3000

# 杀死它
kill -9 <PID>

# 或使用不同端口
API_PORT=3001 pnpm dev
```

**错误："connect ECONNREFUSED 127.0.0.1:5432"**
```bash
# Postgres 未运行
docker-compose up -d postgres

# 或设置 SKIP_DB=true
```

### 移动构建失败

**错误："Could not resolve package:api_client"**
```bash
# 重新生成客户端
pnpm codegen:api

# 重装
cd apps/mobile && fvm flutter pub get
```

**错误："Android SDK version X too low"**
```bash
# 通过 Android Studio 更新 SDK
# Settings → SDK Manager → SDK Platforms → Android 34
```

### API 调用失败

**错误：移动上"连接被拒绝"**
- 检查后端运行：`curl http://localhost:3000/hello`
- 验证 .env `API_BASE_URL=auto`（或明确 IP）
- Android 模拟器仅：使用 `10.0.2.2`，不是 `localhost`

**错误："无效响应信封"或"类型不匹配"**
- API 客户端可能过时：`pnpm codegen:api`
- 检查 Swagger http://localhost:3000/api
- 验证控制器上 `@ApiStandardResponse(Dto)`

## 常见命令

```bash
# 安装依赖（根）
pnpm install

# Bootstrap + 代码生成
pnpm bootstrap

# Lint & 测试（全部）
pnpm lint
pnpm test

# 仅后端
pnpm --filter @mobile-boilerplate/api dev      # 启动
pnpm --filter @mobile-boilerplate/api test     # 测试
pnpm --filter @mobile-boilerplate/api lint     # Lint

# 仅移动
cd apps/mobile
fvm flutter pub get                # 安装
fvm flutter analyze                # Lint
fvm flutter test                   # 测试
fvm flutter run --flavor=dev       # 运行

# 重新生成 API 客户端
pnpm codegen:api

# 查看 Swagger UI（OpenAPI JSON 在 /api-docs/json）
# http://localhost:3000/api-docs（仅开发模式；非开发设 ENABLE_SWAGGER=true）

# 停止全部
docker-compose down              # 停止 Postgres
^C 在终端                        # 停止后端 + 前端
```

## 后续步骤

- **[添加后端模块](./backend-module.md)** — 创建 API 端点
- **[添加 Flutter 功能](./flutter-feature.md)** — 构建移动屏幕
- **[代码标准](../code-standards.md)** — 要遵循的约定
- **[项目概览](../overview.md)** — 理解范围

---

**仍然卡住？** 检查日志：

```bash
# 后端日志
pnpm --filter @mobile-boilerplate/api dev 2>&1 | tee backend.log

# 移动日志
adb logcat | grep flutter

# API 客户端生成
pnpm codegen:api --verbose
```
