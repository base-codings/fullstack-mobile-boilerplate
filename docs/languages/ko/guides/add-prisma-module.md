# Prisma 모듈 추가

> 🌐 **언어:** [English](../../../guides/add-prisma-module.md) · [Tiếng Việt](../../vi/guides/add-prisma-module.md) · [中文](../../zh/guides/add-prisma-module.md) · **한국어**

Prisma로 데이터베이스 스키마 확장 및 서비스 계층 연결 가이드.

## 사전 요구사항

- 로컬 설정 완료
- `.env`에 `DATABASE_URL` 및 `DIRECT_URL` 설정 (또는 스키마만 작업용 `SKIP_DB=true`)

## Step 1: 스키마에서 모델 정의

`apps/api/prisma/schema.prisma` 편집:

```prisma
model Post {
  id    Int     @id @default(autoincrement())
  title String
  body  String
  published Boolean @default(false)
  authorId Int     // User 모델 존재 시 FK
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 선택사항: User로의 relation
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String
  posts Post[]  // 역 relation
}
```

## Step 2: 마이그레이션 생성 및 실행

```bash
cd /repo/root
pnpm --filter @mobile-boilerplate/api prisma:migrate dev --name add_posts
```

이것은:
1. `apps/api/prisma/migrations/<timestamp>-add_posts/migration.sql` 생성
2. dev 데이터베이스에 SQL 실행
3. `node_modules/.prisma/client` 재생성

**출력:**
```
✔ Your database has been successfully migrated to <timestamp>-add_posts
✔ Generated Prisma Client to ./node_modules/@prisma/client in XXms
```

## Step 3: Prisma 클라이언트 생성

```bash
pnpm --filter @mobile-boilerplate/api prisma:generate
```

이제 서비스는 `this.prisma.post.create(...)`, `this.prisma.post.findUnique(...)` 등 사용 가능 — 타입 안전.

## Step 4: Service 생성

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

## Step 5: DTO 생성

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

## Step 6: Controller 생성

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
    // 실제 앱은 JWT에서 userId 추출
    return this.postsService.create(dto, 1);
  }

  @Get()
  @Public()
  @ApiOperation({ operationId: 'listPosts' })
  @ApiStandardResponse(PostResponseDto)
  async findAll(): Promise<PostResponseDto[]> {
    return this.postsService.findAll(true);  // 공개 posts만
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

## Step 7: Module 생성

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

## Step 8: App Module에 등록

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
    PostsModule,  // ← 여기 추가
  ],
  // ...
})
export class AppModule {}
```

## Step 9: 테스트 추가

**apps/api/test/posts.e2e-spec.ts:**
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

## Step 10: 데이터베이스 테스트

**중요:** DB에 영향주는 E2E 테스트는 실제 DB 필요.

**옵션:**

1. **로컬 PostgreSQL** (docker-compose):
   ```bash
   docker-compose up -d postgres
   pnpm --filter @mobile-boilerplate/api test:e2e
   ```

2. **Supabase staging 프로젝트:**
   - Supabase에서 staging 데이터베이스 생성
   - `.env`에 `DATABASE_URL` + `DIRECT_URL` 설정
   - 마이그레이션 실행: `pnpm prisma:migrate deploy`
   - 테스트 실행: `pnpm test:e2e`

3. **Test container** (고급):
   - testcontainers 라이브러리로 테스트당 Postgres 스핀

## Step 11: Codegen & 클라이언트 재생성

```bash
pnpm codegen:api
```

생성된 Dart 클라이언트는:
- `createPost(body: CreatePostDto)`
- `listPosts()`
- `getPost(id: int)`
- `updatePost(id: int, body: CreatePostDto)`
- `deletePost(id: int)`

## Step 12: 모바일 기능에서 사용

[add-new-flutter-feature.md](./add-new-flutter-feature.md)를 보고 이 엔드포인트를 호출하는 Flutter 기능 생성.

## 마이그레이션 롤백

필요하면 마이그레이션 실행취소:

```bash
# 이전 상태로 되돌리기
pnpm --filter @mobile-boilerplate/api prisma:migrate resolve --rolled-back <migration-name>

# 그 후 schema.prisma 편집 후 새 마이그레이션 생성
pnpm prisma:migrate dev --name fix_<issue>
```

**참고:** Production의 롤백은 데이터 백업 + 신중한 계획 필요.

## Best Practice

1. **서비스 코드 작성 전에 마이그레이션 항상 생성** — 스키마가 진실의 근원
2. **마이그레이션을 로컬에서 먼저 테스트** — CI 푸시 전
3. **Relations 신중히 사용** — 편하지만 쿼리 추가; 필요시 비정규화
4. **DTO 계층에서 검증** — ValidationPipe가 서비스 전 나쁜 입력 잡기
5. **빈번한 쿼리에 인덱스 사용** — `@db.Index([field])`를 스키마에

---

**다음 단계:**
- [새로운 백엔드 모듈 추가](./add-new-backend-module.md) — 인증/엔벨로프와 함께 완전 레시피
- [API 계약 워크플로우](./api-contract-workflow.md) — DTO 변경 시
