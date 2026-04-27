# Phase 03 — Prisma + Supabase Setup

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** High — DB layer cho future features
- **Status:** completed
- **Depends on:** Phase 02
- **Description:** Setup Prisma ORM connect Supabase Postgres. Tạo PrismaModule + PrismaService injectable globally. **<!-- Red Team #15 (scope cut) -->** KHÔNG tạo sample User CRUD module — chỉ ship PrismaService skeleton + empty schema. Match "stateless hello" pillar. Dev tự tạo model đầu tiên qua `docs/guides/add-prisma-module.md`.

## Key Insights

- Supabase yêu cầu **2 connection strings**:
  - `DATABASE_URL`: pooled (port 6543, qua PgBouncer) — dùng runtime
  - `DIRECT_URL`: direct (port 5432) — dùng migration
- Prisma schema khai báo `directUrl` cho migrations:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }
  ```
- PrismaService extends PrismaClient, implement `OnModuleInit`/`OnModuleDestroy` để connect/disconnect đúng cách
- PrismaModule global → các module khác không cần import lại
- **Schema khởi đầu RỖNG** (chỉ generator + datasource block, không có model). Dev thêm model đầu tiên qua guide.
- **<!-- Red Team #2 -->** `SKIP_DB` env flag: cho phép Nest app boot không connect DB (dùng cho codegen Phase 06). PrismaService + env.schema MUST hỗ trợ flag này.
- **<!-- Red Team #15 -->** KHÔNG ship Users module / sample CRUD — sẽ làm pollute boilerplate + sinh dead code khi adopter clone.

## Requirements

**Functional:**
- `apps/api/prisma/schema.prisma` chứa generator + datasource block, KHÔNG model nào
- KHÔNG có migration nào ship cùng boilerplate (adopter chạy `prisma migrate dev --name init` lần đầu sau khi thêm model)
- PrismaService injectable globally, sẵn sàng cho future modules
- **<!-- Red Team #2 -->** `SKIP_DB=true` env → Nest app boot không gọi `prisma.$connect()` (cần cho OpenAPI codegen Phase 06)

**Non-functional:**
- `pnpm prisma generate` regenerate Prisma Client (no-op khi schema rỗng nhưng vẫn chạy được)
- App boot fail fast nếu `DATABASE_URL` invalid VÀ `SKIP_DB !== 'true'`

## Architecture

```
apps/api/
├── prisma/
│   └── schema.prisma                  # generator + datasource ONLY, no models
└── src/
    └── infra/
        └── prisma/
            ├── prisma.service.ts      # SKIP_DB-aware
            └── prisma.module.ts       # @Global()
```

<!-- Red Team #15 (scope cut) --> Users CRUD module + dto + sample User schema removed. Adopter creates first model qua `docs/guides/add-prisma-module.md`.

## Related Code Files

**Create:**
- `apps/api/prisma/schema.prisma` (chỉ generator + datasource, không model)
- `apps/api/src/infra/prisma/prisma.service.ts` (với SKIP_DB short-circuit)
- `apps/api/src/infra/prisma/prisma.module.ts`

**Modify:**
- `apps/api/src/app.module.ts` (import PrismaModule)
- `apps/api/src/config/env.schema.ts` (add `DATABASE_URL` conditional, `DIRECT_URL`, `SKIP_DB`)
- `apps/api/.env.example` (uncomment + document DB urls + SKIP_DB note)
- `apps/api/package.json` (scripts: `prisma:generate`, `prisma:migrate`, `prisma:studio`)

## Implementation Steps

1. Install: `pnpm add @prisma/client && pnpm add -D prisma` ở `apps/api`
2. `pnpm prisma init` (tạo `prisma/schema.prisma` + cập nhật .env)
3. **<!-- Red Team #15 -->** Sửa `prisma/schema.prisma` (KHÔNG model nào):
   ```prisma
   generator client {
     provider      = "prisma-client-js"
     binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
   }
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   // Add models below. See docs/guides/add-prisma-module.md
   ```
4. **<!-- Red Team #2 -->** Update `env.schema.ts`:
   - `SKIP_DB` optional boolean (default false), accept `'true'` string
   - `DATABASE_URL` REQUIRED khi `SKIP_DB !== 'true'`, OPTIONAL khi `SKIP_DB === 'true'` (zod `.optional()` + `.refine()` với context-dependent validation, hoặc `z.discriminatedUnion`)
   - `DIRECT_URL` optional
5. Update `.env.example`:
   ```
   # Supabase: Project Settings → Database → Connection string
   DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   # SKIP_DB=true  # set this to skip Prisma connection (used by codegen pipeline)
   ```
6. **<!-- Red Team #2 -->** Tạo `src/infra/prisma/prisma.service.ts`:
   - extends PrismaClient
   - constructor inject ConfigService
   - `async onModuleInit() { if (this.config.get('SKIP_DB') === 'true') return; await this.$connect() }`
   - `async onModuleDestroy() { if (this.config.get('SKIP_DB') === 'true') return; await this.$disconnect() }`
7. Tạo `src/infra/prisma/prisma.module.ts` — `@Global()`, providers: PrismaService, exports: PrismaService
8. **<!-- Red Team #15 (scope cut) -->** ~~Tạo Users module~~ — REMOVED. Skip toàn bộ step Users module. Adopter sẽ tạo model + module đầu tiên qua `docs/guides/add-prisma-module.md` (created in Phase 11).
9. Update `app.module.ts` import `PrismaModule` (KHÔNG import UsersModule)
10. Update `apps/api/package.json` scripts:
    - `prisma:generate`: `prisma generate`
    - `prisma:migrate`: `prisma migrate dev`
    - `prisma:migrate:deploy`: `prisma migrate deploy`
    - `prisma:studio`: `prisma studio`
    - `postinstall`: `prisma generate`
11. Document trong `docs/guides/local-development.md` (sẽ tạo phase 11): cách setup Supabase project + lấy connection string. Document `add-prisma-module.md` recipe.
12. Verify:
    - `pnpm prisma generate` chạy thành công (no-op khi schema rỗng)
    - `pnpm dev` với valid `DATABASE_URL` → boot, Pino không lỗi connect
    - `SKIP_DB=true pnpm dev` (không cần `DATABASE_URL`) → boot thành công, không call `$connect`
    - `curl localhost:3000/api/hello` vẫn trả 200 (hello stateless)

## Todo List

- [x] Install prisma + @prisma/client
- [x] schema.prisma RỖNG (chỉ generator + datasource, binaryTargets bao linux-musl)
- [x] env.schema.ts: DATABASE_URL conditional + DIRECT_URL + SKIP_DB
- [x] .env.example update với SKIP_DB note
- [x] PrismaService (SKIP_DB-aware onModuleInit/Destroy)
- [x] PrismaModule (@Global)
- [x] AppModule import PrismaModule
- [x] package.json scripts (prisma:*)
- [x] **<!-- Red Team #15 -->** ~~CreateUserDto, UsersService, UsersController, UsersModule~~ → REMOVED
- [x] Verify boot với DATABASE_URL valid
- [x] Verify boot với SKIP_DB=true (không cần DATABASE_URL)
- [x] Commit

## Success Criteria

- `pnpm prisma generate` chạy thành công với schema rỗng
- `pnpm dev` với valid `DATABASE_URL` → boot, Pino log không lỗi
- **<!-- Red Team #2 -->** `SKIP_DB=true pnpm dev` → boot thành công không cần `DATABASE_URL`
- Hello flow vẫn hoạt động (`curl /api/hello` → 200)
- Adopter follow `add-prisma-module.md` → tạo được model + migrate dev đầu tiên

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Pooled connection (PgBouncer transaction mode) không support prepared statements → Prisma cần `?pgbouncer=true&connection_limit=1` | Doc rõ trong .env.example + local-development.md |
| Migration trên Supabase yêu cầu DIRECT_URL | `directUrl` trong schema; doc rõ |
| Dev không có Supabase project | Fallback note: dùng local Postgres docker (out of phase scope) hoặc free tier Supabase |
| Prisma Client size lớn (~10MB) | Acceptable cho boilerplate |

## Security Considerations

- DATABASE_URL chứa password → MUST trong `.env`, never commit
- `.env.example` dùng placeholder, không có credential thật
- `UserResponseDto` exclude sensitive fields (nếu sau này có password_hash)
- Validation pipe strict trên CreateUserDto (whitelist + forbidNonWhitelisted)

## Next Steps

→ Phase 06 sẽ dùng /api-docs/json (đã include UsersController) để generate Dart client.
