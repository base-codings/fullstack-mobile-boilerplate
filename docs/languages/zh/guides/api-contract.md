# API 合约

> 🌐 **语言:** [English](../../../guides/api-contract.md) · [Tiếng Việt](../../vi/guides/api-contract.md) · **中文** · [한국어](../../ko/guides/api-contract.md)

后端 API 改变时（DTO、控制器或 operationId），遵循此工作流保持生成 Dart 客户端同步。

## 问题

若改变 NestJS DTO 但忘记重新生成 Dart 客户端，移动应用将：
- 有过时类型
- 编译时失败（类型不匹配）
- 运行时失败（反序列化错误）

## 工作流

### 1. 改变后端 DTO 或控制器

**apps/api/src/modules/posts/dto/post-response.dto.ts:**
```typescript
export class PostResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  // 新字段
  @ApiProperty()
  authorName: string;  // ← 已添加

  @ApiProperty()
  createdAt: Date;
}
```

### 2. 验证 Swagger 装饰器

**确保控制器有：**
```typescript
@Get(':id')
@ApiOperation({ operationId: 'getPost' })    // ← 必须有 operationId
@ApiStandardResponse(PostResponseDto)          // ← 必须使用 @ApiStandardResponse
async getPost(@Param('id') id: string) {
  // ...
}
```

**为什么：**
- `operationId` → 整洁 Dart 方法名（`getPost()` 而非 `postsControllerGetPostUsingGet()`）
- `@ApiStandardResponse` → 在信封形状 `{ data, meta, requestId }` 中包装 DTO

### 3. 生成 OpenAPI 规范

NestJS 应用在 `/api-json`（开发模式）生成 Swagger 规范：

```bash
# 启动后端
pnpm --filter @mobile-boilerplate/api dev

# 规范可在以下访问
curl http://localhost:3000/api-json > openapi.json
```

或 Swagger UI 在 `http://localhost:3000/api`。

### 4. 重新生成 Dart 客户端

从 repo 根：
```bash
pnpm codegen:api
```

这：
1. 读取 NestJS OpenAPI 规范
2. 生成 `packages/api_client/lib/api_client.dart`
3. 创建类型方法（例如 `getPost(id: int) → Future<PostResponseDto>`）
4. **覆盖前一个客户端** — 版本控制将显示差异

**输出：**
```
✔ Generated api_client from openapi.json
✔ Updated packages/api_client/lib/
```

### 5. 更新移动代码

移动代码现有编译错误（新字段、改变类型）：

**之前：**
```dart
final post = await apiClient.getPost(id: 1);
final author = post.author;  // 错误：字段不存在
```

**之后：**
```dart
final post = await apiClient.getPost(id: 1);
final author = post.authorName;  // ✓ 好（新字段）
```

修复功能代码中所有编译错误（repository、UI、测试）。

### 6. 更新测试

后端 E2E 测试：
```typescript
// apps/api/test/posts.e2e-spec.ts
expect(response.body.data).toHaveProperty('authorName');  // ← 新字段
```

移动测试（Provider、组件）：
```dart
// test/features/posts/posts_repository_test.dart
final post = await repository.fetchPost(1);
expect(post.authorName, isNotEmpty);  // ← 验证新字段已填充
```

### 7. 提交两者

```bash
git add apps/api/src/modules/posts/dto/post-response.dto.ts
git add packages/api_client/
git add test/features/posts/

git commit -m "feat(posts): add author name to post response

- Add authorName field to PostResponseDto
- Regenerate Dart client
- Update mobile tests to verify new field"
```

### 8. CI 验证

**codegen-check.yml** 在每个 PR 上运行：
1. 检测对 `apps/api/src/**/*.dto.ts` 的改动
2. 运行 `pnpm codegen:api`
3. 将生成输出与 `packages/api_client/` 比较
4. **若不匹配则 PR 失败** — 确保重新生成

## 常见错误

| 错误 | 症状 | 修复 |
|---------|---------|-----|
| 忘记 `operationId` 在控制器 | 生成方法名丑陋（`postsControllerGetPostUsingGet`） | 添加 `@ApiOperation({ operationId: 'getPost' })` |
| 忘记重新生成 Dart 客户端 | 移动编译错误或运行时崩溃 | 运行 `pnpm codegen:api` |
| 改变 DTO 但忘记更新测试 | 测试通过但移动断 | 更新 e2e 测试期望 |
| 忘记提交生成文件 | CI 失败（codegen-check 检测不匹配） | `git add packages/api_client/` |
| 使用原始 `@ApiOkResponse` 而非 `@ApiStandardResponse` | 规范中缺信封包装 | 使用 `@ApiStandardResponse(Dto)` |

## 重构示例

**重命名字段（breaking 改动）：**

1. **后端：**
   ```typescript
   // 旧
   export class PostResponseDto {
     content: string;  // ← 曾是"content"
   }

   // 新
   export class PostResponseDto {
     body: string;  // ← 现为"body"
   }
   ```

2. **重新生成：**
   ```bash
   pnpm codegen:api
   ```

3. **移动：**
   ```dart
   // 旧
   final text = post.content;  // ✗ 编译错误

   // 新
   final text = post.body;  // ✓ 好
   ```

4. **版本碰撞：**
   ```
   feat!: rename post.content to post.body (BREAKING)
   ```

5. **更新更新日志**（semantic-release 自动做）。

## 提示

1. **设计 API 优先** — 实现服务前定义 DTO
2. **测试 OpenAPI 规范** — 使用 Swagger UI 验证端点形状
3. **早代码生成、频代码生成** — 不要批处理改动；每功能重新生成
4. **审查差异** — 检查生成客户端中改变了什么（新字段、重命名方法）
5. **一致使用 operationId** — `verbNoun` 模式（getPost、createPost、listPosts、updatePost、deletePost）

## 何时不重新生成

你不重新生成当：
- 改变服务逻辑（无 DTO 改动）
- 添加验证（DTO 未改动）
- 修复不相关功能中的缺陷

你重新生成当：
- 添加/删除/重命名 DTO 字段
- 改变字段类型
- 添加/删除控制器路由
- 改变 operationId

---

**另见：**
- [添加新后端模块](./backend-module.md)
- [添加 Prisma 模块](./prisma-module.md)
