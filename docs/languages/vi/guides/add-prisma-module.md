# Thêm Một Prisma Module

> 🌐 **Ngôn ngữ:** [English](../../../guides/add-prisma-module.md) · **Tiếng Việt** · [中文](../../zh/guides/add-prisma-module.md) · [한국어](../../ko/guides/add-prisma-module.md)

Hướng dẫn này bao gồm extending database schema với Prisma và wiring services để query các models mới.

## Prerequisites

- Boilerplate set up locally
- `DATABASE_URL` và `DIRECT_URL` configured in `.env` (hoặc `SKIP_DB=true` cho schema-only work)

## Step 1: Define Model in Schema

Edit `apps/api/prisma/schema.prisma`:

```prisma
model Post {
  id    Int     @id @default(autoincrement())
  title String
  body  String
  published Boolean @default(false)
  authorId Int     // FK to User (add once User model exists)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Optional: relation to User
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String
  posts Post[]  // Back-relation
}
```

## Step 2: Create and Run Migration

```bash
cd /repo/root
pnpm --filter @mobile-boilerplate/api prisma:migrate dev --name add_posts
```

This:
1. Creates `apps/api/prisma/migrations/<timestamp>-add_posts/migration.sql`
2. Runs SQL against dev database
3. Regenerates `node_modules/.prisma/client`

**Output:**
```
✔ Your database has been successfully migrated to <timestamp>-add_posts
✔ Generated Prisma Client to ./node_modules/@prisma/client in XXms
```

## Step 3: Generate Prisma Client

```bash
pnpm --filter @mobile-boilerplate/api prisma:generate
```

Now your service can use `this.prisma.post.create(...)`, `this.prisma.post.findUnique(...)`, etc. — fully type-safe.

## Step 4: Create Service

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

## Step 5: Create DTOs

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

## Step 6: Create Controller

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
    return this.postsService.create(dto, 1);
  }

  @Get()
  @Public()
  @ApiOperation({ operationId: 'listPosts' })
  @ApiStandardResponse(PostResponseDto)
  async findAll(): Promise<PostResponseDto[]> {
    return this.postsService.findAll(true);
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

## Step 7: Create Module

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

## Step 8: Register in App Module

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
    PostsModule,  // ← ADD HERE
  ],
  // ...
})
export class AppModule {}
```

## Step 9: Add Tests

**E2E Test (apps/api/test/posts.e2e-spec.ts):**
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

## Step 10: Database Testing

**Important:** E2E tests touching DB need a real database connection.

**Options:**

1. **Local PostgreSQL** (via docker-compose):
   ```bash
   docker-compose up -d postgres
   pnpm --filter @mobile-boilerplate/api test:e2e
   ```

2. **Supabase staging project:**
   - Create staging database in Supabase
   - Set `DATABASE_URL` + `DIRECT_URL` in `.env`
   - Run migrations: `pnpm prisma:migrate deploy`
   - Run tests: `pnpm test:e2e`

## Step 11: Codegen & Regenerate Client

```bash
pnpm codegen:api
```

Generated Dart client now has:
- `createPost(body: CreatePostDto)`
- `listPosts()`
- `getPost(id: int)`
- `updatePost(id: int, body: CreatePostDto)`
- `deletePost(id: int)`

## Step 12: Use in Mobile Feature

See [add-new-flutter-feature.md](./add-new-flutter-feature.md) để create a Flutter feature that calls these endpoints.

## Rollback Migration

If you need to undo a migration:

```bash
# Revert to previous state
pnpm --filter @mobile-boilerplate/api prisma:migrate resolve --rolled-back <migration-name>

# Then edit schema.prisma and create new migration
pnpm prisma:migrate dev --name fix_<issue>
```

**Note:** Rollbacks on production require data backups + careful planning.

## Best Practices

1. **Always create migrations before writing service code** — schema is source of truth
2. **Test migrations locally first** — before pushing to CI
3. **Use relations sparingly** — Prisma relations are convenient but add queries; denormalize if needed
4. **Validate at DTO layer** — let ValidationPipe catch bad input before service
5. **Use indexes for frequent queries** — `@db.Index([field])` in schema

---

**Next Steps:**
- [Add New Backend Module](./add-new-backend-module.md) — complete recipe with auth/envelope
- [API Contract Workflow](./api-contract-workflow.md) — when DTOs change
