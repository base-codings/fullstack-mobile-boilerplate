# Bắt đầu

> 🌐 **Ngôn ngữ:** [English](../../../guides/getting-started.md) · **Tiếng Việt** · [中文](../../zh/guides/getting-started.md) · [한국어](../../ko/guides/getting-started.md)

Get the full boilerplate running locally in 15 minutes.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node** | 20+ | `nvm install 20` |
| **pnpm** | 9+ | `npm install -g pnpm@9` |
| **FVM** | latest | `dart pub global activate fvm` |
| **Flutter** | 3.27+ | `fvm install 3.27.0` |
| **Java** | 17+ | `java -version` (for codegen) |
| **Docker** | (optional) | For Postgres + API image |

**Verify:**
```bash
node --version     # v20.x.x
pnpm --version     # 9.x.x
fvm --version      # latest
dart --version     # 3.5.x
java -version      # openjdk 17+
```

## Clone & Install

```bash
# 1. Clone repo
git clone https://github.com/yourorg/mobile-boilerplate.git
cd mobile-boilerplate

# 2. Install dependencies (all workspaces)
pnpm install

# 3. Bootstrap monorepo (codegen + Melos)
pnpm bootstrap
```

**What `pnpm bootstrap` does:**
- Installs all workspace dependencies
- Runs `pnpm codegen:api` (generates Dart client)
- Runs `melos bootstrap` (links pub packages)

## Backend Setup

### Option A: Local Postgres (Docker)

**Start Postgres:**
```bash
docker-compose up -d postgres
# Container runs on localhost:5432, user=postgres, password=postgres
```

**Create .env:**
```bash
cp apps/api/.env.example apps/api/.env
```

**Edit .env:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boilerplate"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/boilerplate"
SKIP_DB=false
NODE_ENV=development
LOG_LEVEL=debug
API_PORT=3000
```

**New env vars (Phase 02 hardening):**

| Var | Default | Description |
|---|---|---|
| `TRUST_PROXY` | `0` | Số hops proxy phía trước. Set to `1` if behind LB/Cloudflare. |
| `BODY_LIMIT` | `1mb` | Max JSON/urlencoded body size. Dùng multer cho file uploads. |

**Run migrations:**
```bash
pnpm --filter @mobile-boilerplate/api prisma:migrate dev
```

### Option B: Supabase Cloud

1. Create project at https://supabase.com
2. Copy DATABASE_URL + DIRECT_URL from "Connection Pooler"
3. Paste into `.env`
4. Run migrations: `pnpm --filter @mobile-boilerplate/api prisma:migrate deploy`

### Option C: Skip Database (Hello-only)

To run API without a database (hello endpoint only):

```bash
# .env
SKIP_DB=true
DIRECT_URL="postgresql://unused@unused:5432/unused"  # Not used
```

## Start Backend

```bash
pnpm --filter @mobile-boilerplate/api dev
```

**Output:**
```
[Nest] 12345 - 04/27/2026, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345 - 04/27/2026, 10:00:01 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +123ms
[Nest] 12345 - 04/27/2026, 10:00:02 AM     LOG [NestApplication] Nest application successfully started +456ms
```

**Verify:**
```bash
curl http://localhost:3000/health
# {"data":{"status":"ok"},"meta":{...},"error":null}

curl http://localhost:3000/hello
# {"data":{"message":"Hello World","timestamp":"..."},"meta":{...},"error":null}
```

**Swagger:** http://localhost:3000/api-docs (chỉ development; non-dev đặt `ENABLE_SWAGGER=true`)

## Mobile Setup

### Create .env

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

**Default .env:**
```bash
FLAVOR=dev
API_BASE_URL=auto
LOG_LEVEL=debug
```

**API_BASE_URL resolution:**

| Platform | Value | Resolves To |
|----------|-------|---|
| Android emulator | `auto` | `http://10.0.2.2:3000` |
| iOS simulator | `auto` | `http://localhost:3000` |
| Web (localhost) | `auto` | `http://localhost:3000` |
| Real device | explicit IP | `http://192.168.1.42:3000` |

**For real device on local network:**
```bash
# Find your machine's IP
ifconfig | grep "inet 192"  # macOS/Linux
ipconfig | grep IPv4         # Windows

# Edit .env
API_BASE_URL=http://192.168.1.42:3000
```

### Run Mobile

```bash
cd apps/mobile
fvm flutter run --dart-define=FLAVOR=dev
```

**First run (2–3 min):**
- Builds APK
- Installs on emulator/device
- Launches app

**Output (success):**
```
Launching lib/main.dart on Android Emulator in debug mode...
✓ Built build/app/outputs/apk/debug/app-debug.apk
Installing and launching...
D/HostConnection( xxxx): hostConnection obtained, fd=44
I/System  (xxxx): [MAIN] app launched successfully
```

### Test App

1. **Tap "Fetch Hello"** button
2. **UI shows:** "Hello World" + timestamp
3. **Check logs:** `adb logcat | grep "DEBUG"` to see Dio requests

## Troubleshooting

### Backend won't start

**Error: "EADDRINUSE: address already in use :::3000"**
```bash
# Find process using 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
API_PORT=3001 pnpm dev
```

**Error: "connect ECONNREFUSED 127.0.0.1:5432"**
```bash
# Postgres not running
docker-compose up -d postgres

# Or set SKIP_DB=true
```

### Mobile build fails

**Error: "Could not resolve package:api_client"**
```bash
# Regenerate client
pnpm codegen:api

# Reinstall
cd apps/mobile && fvm flutter pub get
```

**Error: "Android SDK version X too low"**
```bash
# Update SDK via Android Studio
# Settings → SDK Manager → SDK Platforms → Android 34
```

**Error: "Certificate verification failed"**
```bash
# Proxy/corporate network issue
cd apps/mobile
fvm flutter config --no-analytics
fvm flutter run --verbose  # See full error
```

### API call fails

**Error: "Connection refused" on mobile**
- Check backend running: `curl http://localhost:3000/hello`
- Verify .env `API_BASE_URL=auto` (or explicit IP)
- Android emulator only: use `10.0.2.2`, not `localhost`

**Error: "Invalid response envelope" or "type mismatch"**
- API client may be stale: `pnpm codegen:api`
- Check Swagger at http://localhost:3000/api
- Verify `@ApiStandardResponse(Dto)` on controller

## Common Commands

```bash
# Install deps (root)
pnpm install

# Bootstrap + codegen
pnpm bootstrap

# Lint & test (all)
pnpm lint
pnpm test

# Backend only
pnpm --filter @mobile-boilerplate/api dev      # Start
pnpm --filter @mobile-boilerplate/api test     # Test
pnpm --filter @mobile-boilerplate/api lint     # Lint

# Mobile only
cd apps/mobile
fvm flutter pub get                # Install
fvm flutter analyze                # Lint
fvm flutter test                   # Test
fvm flutter run --flavor=dev       # Run

# Regenerate API client
pnpm codegen:api

# Xem Swagger UI (OpenAPI JSON tại /api-docs/json)
# http://localhost:3000/api-docs (chỉ dev; ENABLE_SWAGGER=true cho non-dev)

# Stop all
docker-compose down              # Stop Postgres
^C in terminal                   # Stop backend + frontend
```

## Next Steps

- **[Add Backend Module](./backend-module.md)** — create API endpoint
- **[Add Flutter Feature](./flutter-feature.md)** — build mobile screen
- **[Code Standards](../code-standards.md)** — conventions to follow
- **[Project Overview](../overview.md)** — understand scope

---

**Still stuck?** Check logs:

```bash
# Backend logs
pnpm --filter @mobile-boilerplate/api dev 2>&1 | tee backend.log

# Mobile logs
adb logcat | grep flutter

# API client generation
pnpm codegen:api --verbose
```
