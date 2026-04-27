# 添加 Prisma 模块

> 🌐 **语言:** [English](../../../guides/add-prisma-module.md) · [Tiếng Việt](../../vi/guides/add-prisma-module.md) · **中文** · [한국어](../../ko/guides/add-prisma-module.md)

本指南涵盖用 Prisma 扩展数据库架构并将服务接线到查询新模型。

## 前置要求

- 脚手架本地设置
- `.env` 中配置 `DATABASE_URL` 和 `DIRECT_URL`（或 `SKIP_DB=true` 用于仅架构）

## 步骤 1：在架构中定义模型

编辑 `apps/api/prisma/schema.prisma`：

```prisma
model Post {
  id    Int     @id @default(autoincrement())
  title String
  body  String
  published Boolean @default(false)
  authorId Int     // FK 到 User（一旦 User 模型存在）
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 可选：到 User 的关系
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String
  posts Post[]  // 反向关系
}
```

## 步骤 2：创建并运行迁移

```bash
cd /repo/root
pnpm --filter @mobile-boilerplate/api prisma:migrate dev --name add_posts
```

这：
1. 创建 `apps/api/prisma/migrations/<timestamp>-add_posts/migration.sql`
2. 对开发数据库运行 SQL
3. 重新生成 `node_modules/.prisma/client`

**输出：**
```
✔ Your database has been successfully migrated to <timestamp>-add_posts
✔ Generated Prisma Client to ./node_modules/@prisma/client in XXms
```

## 步骤 3：生成 Prisma 客户端

```bash
pnpm --filter @mobile-boilerplate/api prisma:generate
```

现在服务可使用 `this.prisma.post.create(...)`、`this.prisma.post.findUnique(...)` 等 — 完全类型安全。

## 步骤 4：创建服务

**apps/api/src/modules/posts/posts.service.ts:**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePostDto, authorId: number): Promise<PostResponseDto> {
    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        body: dto.body,
        published: dto.published || false,
        authorId,
      },
    });
    return post;
  }

  async findById(id: number): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });
    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }
    return post;
  }

  async findAll(published?: boolean): Promise<PostResponseDto[]> {
    return this.prisma.post.findMany({
      where: published !== undefined ? { published } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, dto: CreatePostDto): Promise<PostResponseDto> {
    const post = await this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        published: dto.published,
      },
    });
    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }
    return post;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.post.delete({
      where: { id },
    });
  }
}
```

## 步骤 5：创建 DTO

**apps/api/src/modules/posts/dto/create-post.dto.ts:**
```typescript
import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'My First Post' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'This is the post body...' })
  @IsString()
  @MinLength(5)
  body: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
```

**apps/api/src/modules/posts/dto/post-response.dto.ts:**
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class PostResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  authorId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

## 步骤 6：创建控制器

**apps/api/src/modules/posts/posts.controller.ts:**
```typescript
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { RequireAuth } from '../../common/auth/decorators/require-auth.decorator';
import { Public } from '../../common/auth/decorators/public.decorator';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @RequireAuth()
  @ApiOperation({ operationId: 'createPost' })
  @ApiStandardResponse(PostResponseDto)
  async create(@Body() dto: CreatePostDto): Promise<PostResponseDto> {
    // 真实应用中，从 JWT 提取 userId
    return this.postsService.create(dto, 1);
  }

  @Get()
  @Public()
  @ApiOperation({ operationId: 'listPosts' })
  @ApiStandardResponse(PostResponseDto)
  async findAll(): Promise<PostResponseDto[]> {
    return this.postsService.findAll(true);  // 仅公开 posts
  }

  @Get(':id')
  @Public()
  @ApiOperation({ operationId: 'getPost' })
  @ApiStandardResponse(PostResponseDto)
  async findById(@Param('id') id: string): Promise<PostResponseDto> {
    return this.postsService.findById(parseInt(id, 10));
  }

  @Put(':id')
  @RequireAuth()
  @ApiOperation({ operationId: 'updatePost' })
  @ApiStandardResponse(PostResponseDto)
  async update(
    @Param('id') id: string,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.update(parseInt(id, 10), dto);
  }

  @Delete(':id')
  @RequireAuth()
  @ApiOperation({ operationId: 'deletePost' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.postsService.delete(parseInt(id, 10));
  }
}
```

## 步骤 7：创建模块

**apps/api/src/modules/posts/posts.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
```

## 步骤 8：在应用模块中注册

**apps/api/src/app.module.ts:**
```typescript
import { PostsModule } from './modules/posts/posts.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    HelloModule,
    HealthModule,
    PostsModule,  // ← 在此添加
  ],
  // ...
})
export class AppModule {}
```

## 步骤 9：添加测试

**E2E 测试（apps/api/test/posts.e2e-spec.ts）：**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Posts (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /posts', () => {
    it('should create a post', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Test Post', body: 'Body content' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.title).toBe('Test Post');
        });
    });
  });

  describe('GET /posts', () => {
    it('should list posts', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});
```

## 步骤 10：数据库测试

**重要：** E2E 测试接触 DB 需真实数据库连接。

**选项：**

1. **本地 PostgreSQL**（通过 docker-compose）：
   ```bash
   docker-compose up -d postgres
   pnpm --filter @mobile-boilerplate/api test:e2e
   ```

2. **Supabase 暂存项目：**
   - 在 Supabase 中创建暂存数据库
   - 在 `.env` 中设置 `DATABASE_URL` + `DIRECT_URL`
   - 运行迁移：`pnpm prisma:migrate deploy`
   - 运行测试：`pnpm test:e2e`

3. **测试容器**（高级）：
   - 使用 testcontainers 库自旋 Postgres 每测试套件

## 步骤 11：代码生成与重新生成客户端

```bash
pnpm codegen:api
```

生成的 Dart 客户端现有：
- `createPost(body: CreatePostDto)`
- `listPosts()`
- `getPost(id: int)`
- `updatePost(id: int, body: CreatePostDto)`
- `deletePost(id: int)`

## 步骤 12：在移动功能中使用

见 [add-new-flutter-feature.md](./add-new-flutter-feature.md) 创建调用这些端点的 Flutter 功能。

## 回滚迁移

若需撤销迁移：

```bash
# 还原到前一个状态
pnpm --filter @mobile-boilerplate/api prisma:migrate resolve --rolled-back <migration-name>

# 然后编辑 schema.prisma 并创建新迁移
pnpm prisma:migrate dev --name fix_<issue>
```

**注：** 生产回滚需数据备份 + 谨慎规划。

## 最佳实践

1. **总是在编写服务代码前创建迁移** — 架构是真相来源
2. **先在本地测试迁移** — 在推送到 CI 前
3. **谨慎使用关系** — Prisma 关系便捷但添加查询；若需非规范化
4. **在 DTO 层验证** — 让 ValidationPipe 在服务前捕获坏输入
5. **对频繁查询使用索引** — 在架构中 `@db.Index([field])`

---

**后续步骤：**
- [添加新后端模块](./add-new-backend-module.md) — 含认证/信封的完整配方
- [API 合约工作流](./api-contract-workflow.md) — DTO 改变时
