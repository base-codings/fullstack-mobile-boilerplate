# 배포

> 🌐 **언어:** [English](../../deployment.md) · [Tiếng Việt](../vi/deployment.md) · [中文](../zh/deployment.md) · **한국어**

## 백엔드 배포

### Docker 빌드

**멀티스테이지 Dockerfile** (프로젝트 루트의 `Dockerfile`에 위치):

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /build
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm --filter @mobile-boilerplate/api build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /build/apps/api/dist ./dist
COPY --from=builder /build/apps/api/node_modules ./node_modules
COPY --from=builder /build/apps/api/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**로컬 빌드:**
```bash
docker build -t mobile-boilerplate-api:latest .
```

**CI에서 빌드 (GitHub Actions):**
- api-ci 통과 후 `main` 또는 `beta` 분기에 푸시 시 트리거
- docker 이미지 빌드
- git sha + 분기 태그로 태그
- registry에 푸시 (예: Docker Hub, ECR, GCR)

**CI 시크릿 설정:**
- `DOCKER_REGISTRY` — `docker.io` 또는 프라이빗 registry URL
- `DOCKER_USERNAME` — registry 사용자명
- `DOCKER_PASSWORD` — registry 암호 또는 토큰

### 환경 설정

**Production (.env):**
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

**Staging (.env):**
```bash
DATABASE_URL="postgresql://user:pass@staging.supabase.co:5432/boilerplate"
DIRECT_URL="postgresql://user:pass@staging.supabase.co:5432/boilerplate"
SKIP_DB=false
NODE_ENV=staging
LOG_LEVEL=debug
API_PORT=3000
JWT_SECRET="<use-secrets-manager>"
```

**프로덕션 배포 옵션:**

| 플랫폼 | 방법 | 참고 |
|----------|--------|-------|
| **Docker** | `docker run -e DATABASE_URL=... mobile-boilerplate-api` | 단순, 이식성 |
| **Kubernetes** | Helm chart 또는 manifest 사용 | 자동 스케일링, HA |
| **Cloud Run** (GCP) | 이미지 푸시, env 변수 설정 | Serverless, 자동 스케일링 |
| **ECS** (AWS) | 작업 정의 + 서비스 | 관리 컨테이너 |
| **Railway** | GitHub 연결, 자동 배포 | 작은 프로젝트에 가장 간단 |

**시크릿 관리:**
- **절대 `.env` 파일을 커밋하지 말 것**
- 플랫폼 특화 시크릿 사용 (GitHub Secrets, AWS Secrets Manager, Vault)
- 런타임 시 env 변수 또는 볼륨 마운트로 주입
- 정기적으로 시크릿 로테이션

### 데이터베이스 마이그레이션

**자동화 스키마 마이그레이션 (Prisma):**

```bash
# 최신 마이그레이션 파일 생성
pnpm --filter @mobile-boilerplate/api prisma:migrate deploy
```

**CI/CD:**
- 서버 시작 전 실행 (Prisma를 통한 제로 다운타임)
- 롤백: git 커밋 되돌리기, 재배포 (Prisma가 마이그레이션 추적)

**Supabase에서 수동 마이그레이션:**
1. SQL Editor로 이동
2. 마이그레이션 파일 내용 복사 from `apps/api/prisma/migrations/<timestamp>-<name>/migration.sql`
3. 에디터에서 실행
4. 스키마 업데이트 확인

### 헬스 체크

**엔드포인트:** `GET /health` (인증 불필요)

**응답:**
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

**사용처:**
- Kubernetes liveness 프로브: `http://pod:3000/health`
- 로드 밸런서 헬스 체크
- 모니터링 alert

### 모니터링 & 로깅

**구조화된 로깅 (Pino):**
- 모든 로그 JSON 출력 (ELK, Datadog, CloudWatch로 파싱)
- 각 요청은 tracing용 requestId
- env로 로그 레벨 설정 가능 (`LOG_LEVEL`)

**예시 로그 항목:**
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

**로그 집계 설정:**
- Datadog Agent → Datadog로 로그
- AWS CloudWatch agent → CloudWatch로 로그
- ELK Stack → Elasticsearch로 로그

## 모바일 배포

### Android (APK/AAB)

**서명된 APK 빌드 (프로덕션):**
```bash
cd apps/mobile
fvm flutter build apk --release --dart-define=FLAVOR=prod
# 출력: build/app/outputs/apk/release/app-release.apk
```

**App Bundle 빌드 (Play Store, 권장):**
```bash
fvm flutter build appbundle --release --dart-define=FLAVOR=prod
# 출력: build/app/outputs/bundle/release/app-release.aab
```

**서명:**
1. 키스토어 생성 (일회):
   ```bash
   keytool -genkey -v -keystore ~/my-release-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias my-key-alias
   ```
2. `apps/mobile/android/key.properties`에서 참조:
   ```
   storeFile=/path/to/my-release-key.jks
   storePassword=****
   keyPassword=****
   keyAlias=my-key-alias
   ```
3. 빌드가 자동으로 서명

**Play Store에 업로드:**
- Play Console 사용 (수동)
- 또는 fastlane: `fastlane supply --aab=path/to/app-release.aab --package_name=com.yourcompany.app`

### iOS (IPA/TestFlight)

**서명된 IPA 빌드 (프로덕션):**
```bash
cd apps/mobile
fvm flutter build ipa --release --dart-define=FLAVOR=prod
# 출력: build/ios/ipa/mobile_boilerplate.ipa
```

**서명:**
1. Apple Developer에서 provisioning profile 생성/업데이트
2. `ios/Runner.xcconfig` 업데이트:
   ```
   DEVELOPMENT_TEAM = ABC123XYZ
   CODE_SIGN_IDENTITY = iPhone Distribution
   ```
3. 빌드가 자동으로 서명

**TestFlight/App Store에 업로드:**
- Xcode Organizer 사용 (수동)
- 또는 fastlane: `fastlane deliver --ipa=path/to/mobile_boilerplate.ipa`

### 앱 버전 관리

**버전은 pubspec.yaml에 위치:**
```yaml
version: 0.1.0+1  # 0.1.0 = semantic version, 1 = build number
```

**업데이트 프로세스:**
1. `pubspec.yaml`에서 `version` 편집
2. `main` 분기로 커밋 + 푸시
3. semantic-release가 자동으로 태그 및 릴리스
4. CI가 새 버전으로 APK/IPA 빌드

## 릴리스 파이프라인

### Semantic-Release 플로우

**프로젝트 루트의 `.releaserc.cjs`로 설정:**

1. **Conventional commits 파싱:**
   - `feat:` → minor 버전 범프
   - `fix:` → patch 버전 범프
   - `BREAKING CHANGE:` → major 버전 범프

2. **변경 로그 자동 생성** (`docs/project-changelog.md`에 추가)

3. **Git 태그 생성:** 예: `v1.2.0` 또는 `v1.2.0-beta.1`

4. **릴리스 배포:**
   - Main 분기 → production 릴리스 (v1.2.0)
   - Beta 분기 → prerelease (v1.2.0-beta.1)

5. **아티팩트:**
   - Git 태그 푸시
   - GitHub의 릴리스 노트
   - Docker 이미지 태그 + 푸시 (api 변경 시)
   - 모바일 앱 업로드 (모바일 변경 시, 수동 단계)

### 릴리스 게이트

**semantic-release는 다음이 모두 만족할 때만 실행:**
1. `api-ci` 워크플로우 통과 (백엔드 테스트, lint, 빌드)
2. `mobile-ci` 워크플로우 통과 (프론트엔드 테스트, lint, 빌드)
3. 분기는 `main` 또는 `beta`

**예시:** API 변경이 테스트를 깨뜨리면, semantic-release는 수정할 때까지 릴리스 차단.

### 분기 & 버전

| 분기 | 릴리스 타입 | 예시 태그 |
|--------|---|---|
| `main` | Production | `v1.2.0` |
| `beta` | Prerelease | `v1.2.0-beta.1` |
| `feature/*` | None (CI만) | — |
| `develop` | None (CI만) | — |

## 환경별 설정

### 로컬 개발
- **백엔드:** `DATABASE_URL=postgresql://localhost/boilerplate` 또는 `SKIP_DB=true`
- **모바일:** `API_BASE_URL=auto`, `FLAVOR=dev`

### Staging
- **백엔드:** Supabase staging 프로젝트, `LOG_LEVEL=debug`
- **모바일:** `API_BASE_URL=https://staging-api.yourcompany.com`, `FLAVOR=staging`

### Production
- **백엔드:** Supabase production, `LOG_LEVEL=info`, 모니터링 활성화
- **모바일:** `API_BASE_URL=https://api.yourcompany.com`, `FLAVOR=prod`

**모바일 설정은 빌드 타임:** (flutter build --dart-define=FLAVOR=prod)
**백엔드 설정은 런타임:** (배포 시 env 변수)

## 롤백 전략

**백엔드 (Docker 기반):**
1. 이전 이미지 태그 유지: `mobile-boilerplate-api:v1.1.0` (old), `v1.2.0` (new)
2. production이 깨지면, 이전 이미지 재배포:
   ```bash
   docker run -e DATABASE_URL=... mobile-boilerplate-api:v1.1.0
   ```
3. 또는 git 사용: `git checkout v1.1.0 && docker build ...`

**모바일:**
- Play Store: "Manage releases" → 이전 버전을 활성으로 설정
- App Store: TestFlight 또는 App Store Connect의 이전 릴리스 사용

**데이터베이스 (Prisma):**
- 마이그레이션은 git에 버전 관리
- 스키마 롤백: `git revert <migration-commit>`, 그 후 `prisma migrate deploy`
- **주의:** 데이터 손실 가능; 주요 마이그레이션 전 백업

## 지속적 모니터링

**alert 설정:**
- HTTP 5xx 오류율 > 1%
- 요청 지연시간 p95 > 500ms
- 데이터베이스 연결 풀 고갈
- 디스크 사용 > 80%
- 메모리 사용 > 85%

**도구:**
- Datadog, New Relic, Prometheus, CloudWatch
- 모니터링 대시보드에 threshold 설정
- Slack, PagerDuty로 alert

---

**최종 업데이트:** 2026년 4월
