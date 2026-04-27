# 로컬 개발 설정

> 🌐 **언어:** [English](../../../guides/local-development.md) · [Tiếng Việt](../../vi/guides/local-development.md) · [中文](../../zh/guides/local-development.md) · **한국어**

전체 보일러플레이트를 15분 내 로컬에서 실행.

## 사전 요구사항

| 도구 | 버전 | 설치 |
|------|---------|---------|
| **Node** | 20+ | `nvm install 20` |
| **pnpm** | 9+ | `npm install -g pnpm@9` |
| **FVM** | latest | `dart pub global activate fvm` |
| **Flutter** | 3.27+ | `fvm install 3.27.0` |
| **Java** | 17+ | `java -version` (codegen용) |
| **Docker** | (선택사항) | Postgres + API 이미지 |

**검증:**
```bash
node --version     # v20.x.x
pnpm --version     # 9.x.x
fvm --version      # latest
dart --version     # 3.5.x
java -version      # openjdk 17+
```

## Clone & Install

```bash
# 1. Repo 클론
git clone https://github.com/yourorg/mobile-boilerplate.git
cd mobile-boilerplate

# 2. 모든 workspace 의존성 설치
pnpm install

# 3. 모노레포 bootstrap (codegen + Melos)
pnpm bootstrap
```

**`pnpm bootstrap` 수행 작업:**
- 모든 workspace 의존성 설치
- `pnpm codegen:api` 실행 (Dart 클라이언트 생성)
- `melos bootstrap` 실행 (pub 패키지 링크)

## 백엔드 설정

### 옵션 A: 로컬 Postgres (Docker)

**Postgres 시작:**
```bash
docker-compose up -d postgres
# Container는 localhost:5432에서 실행, user=postgres, password=postgres
```

**.env 생성:**
```bash
cp apps/api/.env.example apps/api/.env
```

**.env 편집:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boilerplate"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/boilerplate"
SKIP_DB=false
NODE_ENV=development
LOG_LEVEL=debug
API_PORT=3000
```

**마이그레이션 실행:**
```bash
pnpm --filter @mobile-boilerplate/api prisma:migrate dev
```

### 옵션 B: Supabase 클라우드

1. https://supabase.com에서 프로젝트 생성
2. "Connection Pooler"에서 DATABASE_URL + DIRECT_URL 복사
3. `.env`에 붙여넣기
4. 마이그레이션 실행: `pnpm --filter @mobile-boilerplate/api prisma:migrate deploy`

### 옵션 C: 데이터베이스 스킵 (Hello만)

API를 데이터베이스 없이 실행 (hello 엔드포인트만):

```bash
# .env
SKIP_DB=true
DIRECT_URL="postgresql://unused@unused:5432/unused"  # 미사용
```

## 백엔드 시작

```bash
pnpm --filter @mobile-boilerplate/api dev
```

**출력:**
```
[Nest] 12345 - 04/27/2026, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345 - 04/27/2026, 10:00:01 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +123ms
[Nest] 12345 - 04/27/2026, 10:00:02 AM     LOG [NestApplication] Nest application successfully started +456ms
```

**검증:**
```bash
curl http://localhost:3000/health
# {"data":{"status":"ok"},"meta":{...},"error":null}

curl http://localhost:3000/hello
# {"data":{"message":"Hello World","timestamp":"..."},"meta":{...},"error":null}
```

**Swagger:** http://localhost:3000/api (개발 모드만)

## 모바일 설정

### .env 생성

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

**기본 .env:**
```bash
FLAVOR=dev
API_BASE_URL=auto
LOG_LEVEL=debug
```

**API_BASE_URL 해결:**

| 플랫폼 | 값 | 해결 위치 |
|----------|-------|---|
| Android emulator | `auto` | `http://10.0.2.2:3000` |
| iOS simulator | `auto` | `http://localhost:3000` |
| Web (localhost) | `auto` | `http://localhost:3000` |
| Real device | 명시적 IP | `http://192.168.1.42:3000` |

**실제 기기 (로컬 네트워크):**
```bash
# 머신 IP 찾기
ifconfig | grep "inet 192"  # macOS/Linux
ipconfig | grep IPv4         # Windows

# .env 편집
API_BASE_URL=http://192.168.1.42:3000
```

### 모바일 실행

```bash
cd apps/mobile
fvm flutter run --dart-define=FLAVOR=dev
```

**첫 실행 (2–3분):**
- APK 빌드
- 에뮬레이터/기기에 설치
- 앱 실행

**성공 출력:**
```
Launching lib/main.dart on Android Emulator in debug mode...
✓ Built build/app/outputs/apk/debug/app-debug.apk
Installing and launching...
D/HostConnection( xxxx): hostConnection obtained, fd=44
I/System  (xxxx): [MAIN] app launched successfully
```

### 앱 테스트

1. **"Fetch Hello" 버튼 탭**
2. **UI 표시:** "Hello World" + timestamp
3. **로그 확인:** `adb logcat | grep "DEBUG"`로 Dio 요청 확인

## 문제 해결

### 백엔드 시작 안 됨

**오류: "EADDRINUSE: address already in use :::3000"**
```bash
# 3000 사용 프로세스 찾기
lsof -i :3000

# 죽이기
kill -9 <PID>

# 또는 다른 포트 사용
API_PORT=3001 pnpm dev
```

**오류: "connect ECONNREFUSED 127.0.0.1:5432"**
```bash
# Postgres 실행 안 됨
docker-compose up -d postgres

# 또는
SKIP_DB=true 설정
```

### 모바일 빌드 실패

**오류: "Could not resolve package:api_client"**
```bash
# 클라이언트 재생성
pnpm codegen:api

# 재설치
cd apps/mobile && fvm flutter pub get
```

**오류: "Android SDK version X too low"**
```bash
# Android Studio를 통해 SDK 업데이트
# Settings → SDK Manager → SDK Platforms → Android 34
```

**오류: "Certificate verification failed"**
```bash
# Proxy/corporate 네트워크 이슈
cd apps/mobile
fvm flutter config --no-analytics
fvm flutter run --verbose  # 전체 오류 확인
```

### API 호출 실패

**오류: 모바일에서 "Connection refused"**
- 백엔드 실행 확인: `curl http://localhost:3000/hello`
- .env `API_BASE_URL=auto` 검증 (또는 명시적 IP)
- Android emulator만: `10.0.2.2` 사용, `localhost` 아님

**오류: "Invalid response envelope" 또는 "type mismatch"**
- API 클라이언트 오래됨: `pnpm codegen:api`
- http://localhost:3000/api에서 Swagger 확인
- Controller에서 `@ApiStandardResponse(Dto)` 검증

## 일반 커맨드

```bash
# deps 설치 (루트)
pnpm install

# Bootstrap + codegen
pnpm bootstrap

# Lint & 테스트 (모두)
pnpm lint
pnpm test

# 백엔드만
pnpm --filter @mobile-boilerplate/api dev      # 시작
pnpm --filter @mobile-boilerplate/api test     # 테스트
pnpm --filter @mobile-boilerplate/api lint     # Lint

# 모바일만
cd apps/mobile
fvm flutter pub get                # 설치
fvm flutter analyze                # Lint
fvm flutter test                   # 테스트
fvm flutter run --flavor=dev       # 실행

# API 클라이언트 재생성
pnpm codegen:api

# Swagger UI 보기
# http://localhost:3000/api (dev only)

# 모두 중지
docker-compose down              # Postgres 중지
^C in terminal                   # 백엔드 + 프론트엔드 중지
```

## 다음 단계

- **[백엔드 모듈 추가](./add-new-backend-module.md)** — API 엔드포인트 생성
- **[Flutter 기능 추가](./add-new-flutter-feature.md)** — 모바일 화면 구축
- **[코드 표준](../code-standards.md)** — 따를 규칙
- **[프로젝트 개요](../project-overview-pdr.md)** — 범위 이해

---

**계속 고민되나요?** 로그 확인:

```bash
# 백엔드 로그
pnpm --filter @mobile-boilerplate/api dev 2>&1 | tee backend.log

# 모바일 로그
adb logcat | grep flutter

# API 클라이언트 생성
pnpm codegen:api --verbose
```
