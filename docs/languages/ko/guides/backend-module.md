# 백엔드 모듈 레시피

> 🌐 **언어:** [English](../../../guides/backend-module.md) · [Tiếng Việt](../../vi/guides/backend-module.md) · [中文](../../zh/guides/backend-module.md) · **한국어**

데이터베이스 통합, 인증, API 문서를 갖춘 완전한 NestJS 모듈 생성 가이드.

## 사전 요구사항

- 보일러플레이트 로컬 설정 ([getting-started.md](./getting-started.md))
- NestJS CLI 사용 가능: `pnpm --filter @mobile-boilerplate/api exec nest`

## Step 1: 모듈 생성

```bash
cd /repo/root
pnpm --filter @mobile-boilerplate/api exec nest generate module modules/users
```

출력:
```
CREATE apps/api/src/modules/users/users.module.ts
```

## Step 2: DTO 생성

`apps/api/src/modules/users/dto/` 폴더 생성:

**create-user.dto.ts:**
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @MinLength(3)
  name: string;
}
```

**user-response.dto.ts:**
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: 'Alice' })
  name: string;
}
```

## Step 3: Service 생성

**users.service.ts:**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.create({
      data: dto,
    });
    return user;
  }

  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findAll(): Promise<UserResponseDto[]> {
    return this.prisma.user.findMany();
  }
}
```

## Step 4: Controller 생성

**users.controller.ts:**
```typescript
import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Public } from '../../common/auth/decorators/public.decorator';
import { RequireAuth } from '../../common/auth/decorators/require-auth.decorator';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';

/**
 * 사용자 관리 엔드포인트.
 *
 * POST /users (공개) — 새 사용자 생성
 * GET /users/:id (비공개) — id로 사용자 조회
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()  // 등록은 공개; 인증 불필요
  @ApiOperation({ operationId: 'createUser', summary: 'Create a new user' })
  @ApiStandardResponse(UserResponseDto)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @RequireAuth()  // 인증 필요
  @ApiOperation({ operationId: 'getUser', summary: 'Get user by ID' })
  @ApiStandardResponse(UserResponseDto)
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(parseInt(id, 10));
  }

  @Get()
  @RequireAuth()
  @ApiOperation({ operationId: 'listUsers', summary: 'List all users' })
  @ApiStandardResponse(UserResponseDto)
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }
}
```

### 인증 규칙 (중요)

| 데코레이터 | 의미 | 사용처 |
|-----------|---------|-------|
| `@Public()` | 라우트는 공개 (인증 불필요) | `/login`, `/register`, `/health`, `/hello` |
| `@RequireAuth()` | 마커 데코레이터 (메타데이터 설정 + Swagger에 Bearer 인증 추가). 전역 가드가 마커를 읽음; 라우트 레벨에서 가드를 바인딩하지 않습니다. | `/users/:id`, `/profile`, admin 엔드포인트 |
| None | **기본: 금지됨** (app.module은 NotImplementedAuthGuard 설정) | 데코레이션 없으면 501 Not Implemented |

**하나 선택:**
```typescript
// ✓ 좋음: 공개 등록
@Post('register')
@Public()
async register(@Body() dto: RegisterDto) { }

// ✓ 좋음: 비공개 사용자 조회
@Get(':id')
@RequireAuth()
async getUser(@Param('id') id: string) { }

// ✗ 나쁨: 데코레이터 없음 (기본 가드가 거부함)
@Get('me')
async getCurrentUser() { }  // 501 Not Implemented 발생
```

## Step 5: Module 업데이트

**users.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],  // 다른 모듈에서 UsersService 임포트 허용
})
export class UsersModule {}
```

## Step 6: 루트 App에 모듈 등록

**app.module.ts:**
import 배열에 추가:
```typescript
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    UsersModule,           // ← 여기 추가
    HelloModule,
    HealthModule,
  ],
  // ... providers 생략
})
export class AppModule {}
```

## Step 7: 데이터베이스 스키마에 추가

**apps/api/prisma/schema.prisma:**
```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String
}
```

마이그레이션 실행:
```bash
cd /repo/root
pnpm --filter @mobile-boilerplate/api prisma:migrate dev --name add_users
```

Prisma 클라이언트 생성:
```bash
pnpm --filter @mobile-boilerplate/api prisma:generate
```

## Step 8: 단위 테스트 추가

**users.service.spec.ts:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = { email: 'test@ex.com', name: 'Test' };
      const mockUser = { id: 1, ...dto };

      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      const result = await service.create(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      const mockUser = { id: 1, email: 'test@ex.com', name: 'Test' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findById(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

## Step 9: E2E 테스트 추가

**apps/api/test/users.e2e-spec.ts:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users (create)', () => {
    it('should create a user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ email: 'newuser@ex.com', name: 'New User' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.email).toBe('newuser@ex.com');
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ email: 'not-an-email', name: 'Test' })
        .expect(400);
    });
  });

  describe('GET /users/:id (fetch)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(401);  // 또는 NotImplementedAuthGuard가 활성이면 501
    });
  });
});
```

## Step 10: API 클라이언트 재생성

```bash
pnpm codegen:api
```

이제 `packages/api_client/`에서 Dart 메서드가 생성:
- `createUser(body: CreateUserDto)` → POST /users
- `getUser(id: int)` → GET /users/{id}
- `listUsers()` → GET /users

**operationId는 중요:**
- `operationId: 'createUser'` → 메서드 명 `createUser()`
- operationId 없으면, 생성 명이 못생김 (예: `postuserscreateUserDtoPostResponse`)

## Step 11: 검증

**백엔드 시작:**
```bash
pnpm --filter @mobile-boilerplate/api dev
```

**엔드포인트 테스트:**
```bash
# 공개: 사용자 생성 (인증 헤더 불필요)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@ex.com","name":"Alice"}'

# 응답:
# {
#   "data": { "id": 1, "email": "alice@ex.com", "name": "Alice" },
#   "meta": { "requestId": "...", "timestamp": "...", "version": "1.0" },
#   "error": null
# }

# 비공개: 사용자 조회 (인증 필요, NotImplementedAuthGuard 교체 후)
curl -X GET http://localhost:3000/users/1 \
  -H "Authorization: Bearer <token>"
```

**Swagger 확인:**
```
http://localhost:3000/api-docs (개발 모드)
```

## Step 12: 실제 인증 추가 (나중에)

실제 인증을 구현할 준비가 되면:

1. `JwtAuthGuard` 구현 (IS_PUBLIC_KEY + REQUIRES_AUTH_KEY 메타데이터 준수):

   ```ts
   // apps/api/src/common/auth/jwt-auth.guard.ts
   import { ExecutionContext, Injectable } from '@nestjs/common';
   import { Reflector } from '@nestjs/core';
   import { AuthGuard } from '@nestjs/passport';
   import { IS_PUBLIC_KEY } from './decorators/public.decorator';

   @Injectable()
   export class JwtAuthGuard extends AuthGuard('jwt') {
     constructor(private readonly reflector: Reflector) {
       super();
     }

     canActivate(context: ExecutionContext) {
       const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
         context.getHandler(),
         context.getClass(),
       ]);
       if (isPublic) return true;
       return super.canActivate(context); // passport JWT
     }
   }
   ```

2. `apps/api/src/app.module.ts`에서 `useClass: NotImplementedAuthGuard` → `useClass: JwtAuthGuard`로 교체.
3. 기존 `@Public()` 및 `@RequireAuth()` 데코레이션은 변경 없이 작동. 데코레이터 없는 라우트는 이제 유효한 JWT 필요 (passport가 401로 거부).

## 문제 해결

| 이슈 | 해결 |
|-------|----------|
| "No controller found" | 모듈을 `app.module.ts`에서 import 확인 |
| "Prisma model not found" | `prisma:migrate dev` + `prisma:generate` 실행 |
| "Swagger endpoint missing" | Controller 메서드에서 raw `@ApiOkResponse` 대신 `@ApiStandardResponse(Dto)` 검증 |
| "Generated client has ugly method names" | Controller 메서드에 `@ApiOperation({ operationId: 'verbNoun' })` 추가 |
| "Validation fails unexpectedly" | ValidationPipe에서 `forbidNonWhitelisted: true` 확인 — 추가 필드 거부됨 |

## 문제 해결

| 이슈 | 해결 |
|-------|----------|
| "No controller found" | 모듈을 `app.module.ts`에서 import 확인 |
| "Prisma model not found" | `prisma:migrate dev` + `prisma:generate` 실행 |
| "Swagger endpoint missing" | Controller 메서드에서 raw `@ApiOkResponse` 대신 `@ApiStandardResponse(Dto)` 검증 |
| "Generated client has ugly method names" | Controller 메서드에 `@ApiOperation({ operationId: 'verbNoun' })` 추가 |
| "Validation fails unexpectedly" | ValidationPipe에서 `forbidNonWhitelisted: true` 확인 — 추가 필드 거부됨 |

---

**다음 단계:**
- [Prisma 모델 추가](./prisma-module.md)
- [API 계약 워크플로우](./api-contract.md)
- [기능 경계](../feature-boundaries.md)
