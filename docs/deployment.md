# Deployment

> 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/deployment.md) · [中文](languages/zh/deployment.md) · [한국어](languages/ko/deployment.md)

## Backend Deployment

### Docker Build

**Multi-stage Dockerfile** (located in project root `Dockerfile`):

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

**Build locally:**
```bash
docker build -t mobile-boilerplate-api:latest .
```

**Build in CI (GitHub Actions):**
- Triggered on push to `main` or `beta` branch (after api-ci passes)
- Builds docker image
- Tags with git sha + branch tag
- Pushes to registry (e.g., Docker Hub, ECR, GCR)

**Set CI secrets:**
- `DOCKER_REGISTRY` — `docker.io` or private registry URL
- `DOCKER_USERNAME` — registry username
- `DOCKER_PASSWORD` — registry password or token

### Environment Configuration

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

**Production deployment options:**

| Platform | Method | Notes |
|----------|--------|-------|
| **Docker** | `docker run -e DATABASE_URL=... mobile-boilerplate-api` | Simple, portable |
| **Kubernetes** | Use Helm chart or manifests | Auto-scaling, HA |
| **Cloud Run** (GCP) | Push image, set env vars | Serverless, auto-scaling |
| **ECS** (AWS) | Task definition + service | Managed containers |
| **Railway** | Connect GitHub, auto-deploy | Simplest for small projects |

**Secrets management:**
- **Never commit `.env` file**
- Use platform-specific secrets (GitHub Secrets, AWS Secrets Manager, Vault)
- Inject at runtime via env vars or volume mounts
- Rotate secrets regularly

### Database Migrations

**Automated schema migrations (Prisma):**

```bash
# Generate latest migration files
pnpm --filter @mobile-boilerplate/api prisma:migrate deploy
```

**In CI/CD:**
- Run before starting server (zero-downtime via Prisma)
- Rollback: git revert commit, redeploy (Prisma tracks migrations)

**Manual migration on Supabase:**
1. Go to SQL Editor
2. Copy migration file content from `apps/api/prisma/migrations/<timestamp>-<name>/migration.sql`
3. Run in editor
4. Verify schema updated

### Health Check

**Endpoint:** `GET /health` (no authentication required)

**Response:**
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

**Used by:**
- Kubernetes liveness probe: `http://pod:3000/health`
- Load balancer health check
- Monitoring alerts

### Monitoring & Logging

**Structured logging (Pino):**
- All logs output as JSON (parse with ELK, Datadog, CloudWatch)
- Each request has requestId for tracing
- Log level configurable via `LOG_LEVEL` env

**Example log entry:**
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

**Set up log aggregation:**
- Datadog Agent → logs to Datadog
- AWS CloudWatch agent → logs to CloudWatch
- ELK Stack → logs to Elasticsearch

## Mobile Deployment

### Android (APK/AAB)

**Build signed APK (production):**
```bash
cd apps/mobile
fvm flutter build apk --release --dart-define=FLAVOR=prod
# Output: build/app/outputs/apk/release/app-release.apk
```

**Build App Bundle (Play Store, recommended):**
```bash
fvm flutter build appbundle --release --dart-define=FLAVOR=prod
# Output: build/app/outputs/bundle/release/app-release.aab
```

**Signing:**
1. Create keystore (one-time):
   ```bash
   keytool -genkey -v -keystore ~/my-release-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias my-key-alias
   ```
2. Reference in `apps/mobile/android/key.properties`:
   ```
   storeFile=/path/to/my-release-key.jks
   storePassword=****
   keyPassword=****
   keyAlias=my-key-alias
   ```
3. Build will auto-sign

**Upload to Play Store:**
- Use Play Console (manual)
- Or fastlane: `fastlane supply --aab=path/to/app-release.aab --package_name=com.yourcompany.app`

### iOS (IPA/TestFlight)

**Build signed IPA (production):**
```bash
cd apps/mobile
fvm flutter build ipa --release --dart-define=FLAVOR=prod
# Output: build/ios/ipa/mobile_boilerplate.ipa
```

**Signing:**
1. Create or update provisioning profiles in Apple Developer
2. Update `ios/Runner.xcconfig`:
   ```
   DEVELOPMENT_TEAM = ABC123XYZ
   CODE_SIGN_IDENTITY = iPhone Distribution
   ```
3. Build will auto-sign

**Upload to TestFlight/App Store:**
- Use Xcode Organizer (manual)
- Or fastlane: `fastlane deliver --ipa=path/to/mobile_boilerplate.ipa`

### App Version Management

**Version is in pubspec.yaml:**
```yaml
version: 0.1.0+1  # 0.1.0 = semantic version, 1 = build number
```

**Update process:**
1. Edit `version` in `pubspec.yaml`
2. Commit + push to `main` branch
3. semantic-release auto-tags and releases
4. CI builds APK/IPA with new version

## Release Pipeline

### Semantic-Release Flow

**Configured in `.releaserc.cjs` at project root:**

1. **Conventional commits parsed:**
   - `feat:` → minor version bump
   - `fix:` → patch version bump
   - `BREAKING CHANGE:` → major version bump

2. **Changelog auto-generated** (appended to `docs/project-changelog.md`)

3. **Git tag created:** e.g., `v1.2.0` or `v1.2.0-beta.1`

4. **Release published:**
   - Main branch → production release (v1.2.0)
   - Beta branch → prerelease (v1.2.0-beta.1)

5. **Artifacts:**
   - Git tag pushed
   - Release notes on GitHub
   - Docker image tagged + pushed (if api changed)
   - Mobile app uploaded (if mobile changed, manual step)

### Release Gating

**semantic-release only runs if:**
1. `api-ci` workflow passed (backend tests, lint, build)
2. `mobile-ci` workflow passed (frontend tests, lint, build)
3. Branch is `main` or `beta`

**Example:** If you push a feature to `main` that breaks a test, semantic-release blocks the release until you fix it.

### Branches & Versions

| Branch | Release Type | Example Tag |
|--------|---|---|
| `main` | Production | `v1.2.0` |
| `beta` | Prerelease | `v1.2.0-beta.1` |
| `feature/*` | None (CI only) | — |
| `develop` | None (CI only) | — |

## Environment-Specific Configuration

### Local Development
- **Backend:** `DATABASE_URL=postgresql://localhost/boilerplate` or `SKIP_DB=true`
- **Mobile:** `API_BASE_URL=auto`, `FLAVOR=dev`

### Staging
- **Backend:** Supabase staging project, `LOG_LEVEL=debug`
- **Mobile:** `API_BASE_URL=https://staging-api.yourcompany.com`, `FLAVOR=staging`

### Production
- **Backend:** Supabase production, `LOG_LEVEL=info`, monitoring enabled
- **Mobile:** `API_BASE_URL=https://api.yourcompany.com`, `FLAVOR=prod`

**Mobile config is build-time (flutter build --dart-define=FLAVOR=prod).**
**Backend config is runtime (env vars at deploy time).**

## Rollback Strategy

**Backend (Docker-based):**
1. Keep previous image tagged: `mobile-boilerplate-api:v1.1.0` (old), `v1.2.0` (new)
2. If production breaks, redeploy old image:
   ```bash
   docker run -e DATABASE_URL=... mobile-boilerplate-api:v1.1.0
   ```
3. OR use git: `git checkout v1.1.0 && docker build ...`

**Mobile:**
- Play Store: Use "Manage releases" → previous version as active
- App Store: Use TestFlight or previous release in App Store Connect

**Database (Prisma):**
- Migrations are versioned in git
- To rollback schema: `git revert <migration-commit>`, then `prisma migrate deploy`
- **Caution:** Data loss possible; backup before major migrations

## ⚠️ Swagger in non-dev environments

Setting `ENABLE_SWAGGER=true` outside `NODE_ENV=development` relaxes the
Content Security Policy: `script-src` allows `'unsafe-inline'` so the Swagger
UI can render its inline scripts.

**Trade-off:** XSS protection is materially weakened. Any user-controllable
content reflected in a response becomes potentially executable.

**Rule:**
- ✅ Use `ENABLE_SWAGGER=true` for short, supervised debug sessions in staging
- ❌ Never leave it on in production
- ❌ Never set in long-lived staging environments exposed to real users

If you need Swagger access against a non-dev API for routine work, use a
stand-alone Swagger UI client (browser extension, Postman, Swagger Editor)
pointed at `/api-docs/json` — keep server-side CSP strict.

## Behind a proxy

If your API runs behind a load balancer, CDN, or reverse proxy (Cloudflare, ALB,
Render, Fly.io, Nginx, etc.), set:

```env
TRUST_PROXY=1   # 1 hop — most common
TRUST_PROXY=2   # CDN → LB → app — set to actual hop count
```

This makes `req.ip` resolve to the real client IP from `X-Forwarded-For` instead
of the proxy's IP. Critical for:

- Rate limiting (Throttler keys requests by IP)
- Audit logs
- Security analysis

**Footgun:** never set `TRUST_PROXY` higher than the real hop count.
Higher value = `X-Forwarded-For` becomes spoofable, attacker can fake any IP.

## Request body limits

`BODY_LIMIT=1mb` covers JSON/urlencoded bodies. For file uploads:

1. Do NOT raise `BODY_LIMIT` to absorb files (affects all routes).
2. Use `multer` per-route with explicit limit: `FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } })`.

## Continuous Monitoring

**Set up alerts for:**
- HTTP 5xx error rate > 1%
- Request latency p95 > 500ms
- Database connection pool exhausted
- Disk usage > 80%
- Memory usage > 85%

**Tools:**
- Datadog, New Relic, Prometheus, CloudWatch
- Set thresholds in monitoring dashboard
- Alert via Slack, PagerDuty

---

**Last updated:** April 2026
