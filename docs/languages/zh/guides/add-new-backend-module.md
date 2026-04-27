# 添加新的后端模块

> 🌐 **语言:** [English](../../../guides/add-new-backend-module.md) · [Tiếng Việt](../../vi/guides/add-new-backend-module.md) · **中文** · [한국어](../../ko/guides/add-new-backend-module.md)

本指南演示创建含数据库集成、认证和 API 文档的完整 NestJS 模块。

## 前置要求

- 脚手架本地设置（[local-development.md](./local-development.md)）
- NestJS CLI 可用：`pnpm --filter @mobile-boilerplate/api exec nest`

## 步骤 1：生成模块

```bash
cd /repo/root
pnpm --filter @mobile-boilerplate/api exec nest generate module modules/users
```

输出：
```
CREATE apps/api/src/modules/users/users.module.ts
```

## 步骤 2：创建 DTO

DTO 定义 API 合约。创建 `apps/api/src/modules/users/dto/` 文件夹：

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

## 步骤 3：创建服务

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

## 步骤 4：创建控制器

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
 * 用户管理端点。
 *
 * POST /users（公开）— 创建新用户
 * GET /users/:id（私有）— 按 id 获取用户
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()  // 注册公开；无需认证
  @ApiOperation({ operationId: 'createUser', summary: 'Create a new user' })
  @ApiStandardResponse(UserResponseDto)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @RequireAuth()  // 必须认证
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

### 认证规则（关键）

| 装饰器 | 含义 | 用法 |
|-----------|---------|-------|
| `@Public()` | 路由公开可访问（无需认证） | `/login`、`/register`、`/health`、`/hello` |
| `@RequireAuth()` | 路由需要有效认证 | `/users/:id`、`/profile`、管理员端点 |
| 无 | **默认：禁止**（app.module 设置 NotImplementedAuthGuard） | 若未装饰则 501 错误 |

**选择一个：**
```typescript
// ✓ 好：公开注册
@Post('register')
@Public()
async register(@Body() dto: RegisterDto) { }

// ✓ 好：私有用户获取
@Get(':id')
@RequireAuth()
async getUser(@Param('id') id: string) { }

// ✗ 不好：无装饰器（将被默认守卫拒绝）
@Get('me')
async getCurrentUser() { }  // 抛出 501 未实现
```

## 步骤 5：更新模块

**users.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],  // 允许其他模块导入 UsersService
})
export class UsersModule {}
```

## 步骤 6：在根应用中注册模块

**app.module.ts:**
添加到导入数组：
```typescript
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    UsersModule,           // ← 在此添加
    HelloModule,
    HealthModule,
  ],
  // ... provider 省略
})
export class AppModule {}
```

## 步骤 7：添加到数据库架构

**apps/api/prisma/schema.prisma:**
```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String
}
```

运行迁移：
```bash
cd /repo/root
pnpm --filter @mobile-boilerplate/api prisma:migrate dev --name add_users
```

生成 Prisma 客户端：
```bash
pnpm --filter @mobile-boilerplate/api prisma:generate
```

## 步骤 8：添加单元测试

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

## 步骤 9：添加 E2E 测试

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
        .expect(401);  // 或 501 若 NotImplementedAuthGuard 仍活跃
    });
  });
});
```

## 步骤 10：重新生成 API 客户端

```bash
pnpm codegen:api
```

这生成 `packages/api_client/` 中的 Dart 方法：
- `createUser(body: CreateUserDto)` → POST /users
- `getUser(id: int)` → GET /users/{id}
- `listUsers()` → GET /users

**operationId 是关键：**
- `operationId: 'createUser'` → 方法名 `createUser()`
- 无 operationId，生成名是丑的（例如 `postuserscreateUserDtoPostResponse`）

## 步骤 11：验证

**启动后端：**
```bash
pnpm --filter @mobile-boilerplate/api dev
```

**测试端点：**
```bash
# 公开：创建用户（无需认证头）
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@ex.com","name":"Alice"}'

# 响应：
# {
#   "data": { "id": 1, "email": "alice@ex.com", "name": "Alice" },
#   "meta": { "requestId": "...", "timestamp": "...", "version": "1.0" },
#   "error": null
# }

# 私有：获取用户（需认证）
curl -X GET http://localhost:3000/users/1 \
  -H "Authorization: Bearer <token>"
```

**检查 Swagger：**
```
http://localhost:3000/api（开发模式）
```

## 步骤 12：稍后添加真实认证

当准备好实现真实认证：

1. **实现 JwtAuthGuard**（或使用 Supabase Auth）
2. **在 app.module.ts 中替换 NotImplementedAuthGuard：**
   ```typescript
   {
     provide: APP_GUARD,
     useClass: JwtAuthGuard,  // ← 在此交换
   }
   ```
3. **装饰有 `@RequireAuth()` 的路由将正确门禁。**
4. **装饰有 `@Public()` 的路由将继续绕过认证。**

**无需控制器改动** — 装饰器已就位！

## 故障排除

| 问题 | 解决方案 |
|-------|----------|
| "未找到控制器" | 确保模块在 `app.module.ts` 中导入 |
| "Prisma 模型未找到" | 运行 `prisma:migrate dev` + `prisma:generate` |
| "Swagger 端点缺失" | 验证控制器方法上 `@ApiStandardResponse(Dto)`（非原始 `@ApiOkResponse`） |
| "生成的客户端方法名丑陋" | 添加 `@ApiOperation({ operationId: 'verbNoun' })` 到控制器方法 |
| "验证意外失败" | 检查 ValidationPipe 中 `forbidNonWhitelisted: true` — 额外字段被拒 |

---

**后续步骤：**
- [添加 Prisma 模型](./add-prisma-module.md)
- [API 合约工作流](./api-contract-workflow.md)
- [功能边界](../feature-boundaries.md)
