# Recipe Backend Module

> 🌐 **Ngôn ngữ:** [English](../../../guides/backend-module.md) · **Tiếng Việt** · [中文](../../zh/guides/backend-module.md) · [한국어](../../ko/guides/backend-module.md)

Hướng dẫn này hướng dẫn tạo một module NestJS hoàn chỉnh với database integration, authentication, và API documentation.

## Prerequisites

- Boilerplate set up locally ([getting-started.md](./getting-started.md))
- NestJS CLI available: `pnpm --filter @mobile-boilerplate/api exec nest`

## Step 1: Generate the Module

```bash
cd /repo/root
pnpm --filter @mobile-boilerplate/api exec nest generate module modules/users
```

Output:
```
CREATE apps/api/src/modules/users/users.module.ts
```

## Step 2: Create DTOs

DTOs định nghĩa API contract. Create `apps/api/src/modules/users/dto/` folder:

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

## Step 3: Create Service

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

## Step 4: Create Controller

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
 * User management endpoints.
 *
 * POST /users (public) — create new user
 * GET /users/:id (private) — fetch user by id
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()  // Registration is public; no auth required
  @ApiOperation({ operationId: 'createUser', summary: 'Create a new user' })
  @ApiStandardResponse(UserResponseDto)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @RequireAuth()  // Must be authenticated
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

### Auth Rules (CRITICAL)

| Decorator | Ý Nghĩa | Sử Dụng |
|-----------|---------|-------|
| `@Public()` | Route is publicly accessible (no auth required) | `/login`, `/register`, `/health`, `/hello` |
| `@RequireAuth()` | Route requires valid authentication | `/users/:id`, `/profile`, admin endpoints |
| None | **Default: FORBIDDEN** (app.module sets NotImplementedAuthGuard) | Error 501 if not decorated |

**Choose ONE:**
```typescript
// ✓ GOOD: Public registration
@Post('register')
@Public()
async register(@Body() dto: RegisterDto) { }

// ✓ GOOD: Private user fetch
@Get(':id')
@RequireAuth()
async getUser(@Param('id') id: string) { }

// ✗ BAD: No decorator (will be denied by default guard)
@Get('me')
async getCurrentUser() { }  // Throws 501 Not Implemented
```

## Step 5: Update Module

**users.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],  // Allow other modules to import UsersService
})
export class UsersModule {}
```

## Step 6: Register Module in Root App

**app.module.ts:**
Add to imports array:
```typescript
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    UsersModule,           // ← ADD HERE
    HelloModule,
    HealthModule,
  ],
  // ... providers omitted
})
export class AppModule {}
```

## Step 7: Add to Database Schema

**apps/api/prisma/schema.prisma:**
```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String
}
```

Run migration:
```bash
cd /repo/root
pnpm --filter @mobile-boilerplate/api prisma:migrate dev --name add_users
```

Generate Prisma client:
```bash
pnpm --filter @mobile-boilerplate/api prisma:generate
```

## Step 8: Add Unit Tests

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

## Step 9: Add E2E Tests

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
        .expect(401);  // Or 501 if NotImplementedAuthGuard still active
    });
  });
});
```

## Step 10: Regenerate API Client

```bash
pnpm codegen:api
```

This generates Dart methods in `packages/api_client/`:
- `createUser(body: CreateUserDto)` → POST /users
- `getUser(id: int)` → GET /users/{id}
- `listUsers()` → GET /users

**operationId is critical:**
- `operationId: 'createUser'` → method name `createUser()`
- Without operationId, generated name is ugly (e.g., `postuserscreateUserDtoPostResponse`)

## Step 11: Verify

**Start backend:**
```bash
pnpm --filter @mobile-boilerplate/api dev
```

**Test endpoint:**
```bash
# Public: create user (no auth header needed)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@ex.com","name":"Alice"}'

# Response:
# {
#   "data": { "id": 1, "email": "alice@ex.com", "name": "Alice" },
#   "meta": { "requestId": "...", "timestamp": "...", "version": "1.0" },
#   "error": null
# }

# Private: fetch user (requires auth once NotImplementedAuthGuard is replaced)
curl -X GET http://localhost:3000/users/1 \
  -H "Authorization: Bearer <token>"
```

**Check Swagger:**
```
http://localhost:3000/api (development mode)
```

## Step 12: Add Real Authentication (Later)

When you're ready to implement real auth:

1. **Implement JwtAuthGuard** (or use Supabase Auth)
2. **Replace NotImplementedAuthGuard in app.module.ts:**
   ```typescript
   {
     provide: APP_GUARD,
     useClass: JwtAuthGuard,  // ← Swap here
   }
   ```
3. **Routes already decorated with `@RequireAuth()` will gate properly.**
4. **Routes with `@Public()` will continue to bypass auth.**

**No controller changes needed** — decorators already in place!

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No controller found" | Ensure module is imported in `app.module.ts` |
| "Prisma model not found" | Run `prisma:migrate dev` + `prisma:generate` |
| "Swagger endpoint missing" | Verify `@ApiStandardResponse(Dto)` on controller method (not raw `@ApiOkResponse`) |
| "Generated client has ugly method names" | Add `@ApiOperation({ operationId: 'verbNoun' })` to controller method |
| "Validation fails unexpectedly" | Check `forbidNonWhitelisted: true` in ValidationPipe — extra fields rejected |

---

**Next Steps:**
- [Add a Prisma Model](./prisma-module.md)
- [API Contract Workflow](./api-contract.md)
- [Feature Boundaries](../feature-boundaries.md)
