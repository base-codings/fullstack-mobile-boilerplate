# Phase 10 — Docker Compose + Dockerfile

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** Medium — local dev convenience + production deploy primitive
- **Status:** completed
- **Depends on:** Phase 02
- **Description:** Multi-stage Dockerfile cho NestJS app. docker-compose.yml chạy api service local. Supabase đã managed → không cần Postgres container.

## Key Insights

- **Multi-stage Dockerfile:** stage 1 deps, stage 2 build, stage 3 runtime (slim).
- **node:20-alpine** cho runtime image nhỏ.
- **pnpm trong Docker:** dùng `corepack enable` thay vì cài pnpm thủ công.
- **Prisma trong Docker:** cần copy `prisma/` folder + chạy `prisma generate` ở build stage.
- **`.dockerignore`** quan trọng để build nhanh: exclude `node_modules`, `dist`, `coverage`, `.env*`.
- **docker-compose.yml** chỉ định service `api` với env_file pointer và port mapping.

## Requirements

**Functional:**
- `docker compose up api` → NestJS chạy trên `localhost:3000`
- API connect Supabase qua DATABASE_URL trong `.env`
- Image production-ready, < 250MB
- Healthcheck endpoint trong compose

**Non-functional:**
- Build < 2 phút từ cold cache
- Hot reload trong dev (volume mount source)

## Architecture

```
mobile-boilerplate/
├── docker-compose.yml
└── apps/api/
    ├── Dockerfile
    └── .dockerignore
```

## Related Code Files

**Create:**
- `apps/api/Dockerfile`
- `apps/api/.dockerignore`
- `docker-compose.yml` (root)

**Read:**
- `apps/api/.env.example`
- `apps/api/package.json`

## Implementation Steps

1. **`apps/api/.dockerignore`:**
   ```
   node_modules
   dist
   coverage
   .env
   .env.*
   !.env.example
   .git
   .vscode
   *.log
   test
   ```
2. **`apps/api/Dockerfile`** (multi-stage):
   ```dockerfile
   # syntax=docker/dockerfile:1.7

   ###############
   # Base image
   ###############
   FROM node:20-alpine AS base
   ENV PNPM_HOME=/pnpm
   ENV PATH=$PNPM_HOME:$PATH
   RUN corepack enable
   WORKDIR /app

   ###############
   # Deps install (cached)
   ###############
   FROM base AS deps
   COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
   COPY apps/api/package.json ./apps/api/
   COPY apps/api/prisma ./apps/api/prisma
   RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
       pnpm install --frozen-lockfile

   ###############
   # Build
   ###############
   FROM base AS build
   COPY --from=deps /app /app
   COPY apps/api ./apps/api
   WORKDIR /app/apps/api
   RUN pnpm prisma generate
   RUN pnpm build

   ###############
   # Runtime (slim)
   ###############
   FROM node:20-alpine AS runtime
   ENV NODE_ENV=production
   WORKDIR /app
   RUN apk add --no-cache tini
   COPY --from=build /app/apps/api/dist ./dist
   COPY --from=build /app/apps/api/node_modules ./node_modules
   COPY --from=build /app/apps/api/package.json ./package.json
   COPY --from=build /app/apps/api/prisma ./prisma
   USER node
   EXPOSE 3000
   ENTRYPOINT ["/sbin/tini", "--"]
   CMD ["node", "dist/main"]
   ```
   **Note:** Build context phải là root repo (vì pnpm workspace cần lockfile gốc). Doc rõ trong README.
3. **`docker-compose.yml`** (root):
   ```yaml
   services:
     api:
       build:
         context: .
         dockerfile: apps/api/Dockerfile
       image: mobile-boilerplate-api:local
       env_file:
         - apps/api/.env
       ports:
         - "3000:3000"
       healthcheck:
         test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
         interval: 10s
         timeout: 3s
         retries: 5
         start_period: 5s
       restart: unless-stopped
   ```
4. **Optional dev compose overlay** `docker-compose.dev.yml` (skip nếu không cần):
   - Volume mount source for hot reload
   - Override CMD: `pnpm dev`
5. **Build + verify:**
   ```bash
   docker compose build api
   docker compose up api -d
   curl http://localhost:3000/api/health
   docker compose logs api
   docker compose down
   ```
6. **Image size check:** `docker images mobile-boilerplate-api:local` → expect ~200-250MB
7. Doc trong `docs/deployment-guide.md` (phase 11): build args, env requirements, registry push pattern.

## Todo List

- [x] apps/api/.dockerignore
- [x] apps/api/Dockerfile multi-stage
- [x] docker-compose.yml root
- [x] Build image
- [x] Run + healthcheck verify
- [x] Image size < 250MB
- [x] docker compose down clean
- [x] Commit

## Success Criteria

- `docker compose build api` complete < 2 phút (cold cache, < 30s warm)
- `docker compose up api -d` healthcheck pass < 30s
- `curl localhost:3000/api/hello` từ host trả 200
- Image size < 250MB
- `docker compose down` không leave dangling resource

## Risk Assessment

| Risk | Mitigation |
|---|---|
| pnpm workspace context cần root → context lớn | `.dockerignore` cẩn thận; loại bỏ `apps/mobile`, `packages/api_client` khỏi context |
| Prisma binary platform mismatch (alpine = musl) | `binaryTargets` trong schema.prisma: `["native", "linux-musl-openssl-3.0.x"]` |
| .env file phải tồn tại trước docker compose up | Doc rõ: copy `.env.example` → `.env` |
| Healthcheck dùng wget có sẵn trên alpine | Có sẵn |
| BuildKit cache mount yêu cầu Docker BuildKit | Default từ Docker 23+; doc fallback `DOCKER_BUILDKIT=1` |

## Security Considerations

- USER node (non-root)
- ENTRYPOINT tini cho proper signal handling
- Không copy `.env` vào image (chỉ runtime mount qua compose)
- Multi-stage drops dev deps
- Image base từ official `node:20-alpine`

## Next Steps

→ Phase 11 docs `deployment-guide.md` reference Dockerfile + push image flow.
