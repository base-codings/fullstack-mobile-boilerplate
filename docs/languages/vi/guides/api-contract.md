# API Contract

> 🌐 **Ngôn ngữ:** [English](../../../guides/api-contract.md) · **Tiếng Việt** · [中文](../../zh/guides/api-contract.md) · [한국어](../../ko/guides/api-contract.md)

When you change a backend API (DTO, controller, or operationId), follow this workflow to keep the generated Dart client in sync.

## The Problem

If you change a NestJS DTO but forget to regenerate the Dart client, the mobile app will:
- Have stale types
- Fail at compile time (type mismatch)
- Fail at runtime (serialization error)

## The Workflow

### 1. Change Backend DTO or Controller

**apps/api/src/modules/posts/dto/post-response.dto.ts:**
```typescript
export class PostResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  // NEW FIELD
  @ApiProperty()
  authorName: string;  // ← Added

  @ApiProperty()
  createdAt: Date;
}
```

### 2. Verify Swagger Decorators

**Ensure your controller has:**
```typescript
@Get(':id')
@ApiOperation({ operationId: 'getPost' })    // ← MUST have operationId
@ApiStandardResponse(PostResponseDto)          // ← MUST use @ApiStandardResponse
async getPost(@Param('id') id: string) {
  // ...
}
```

**Why:**
- `operationId` → clean Dart method name (`getPost()` not `postsControllerGetPostUsingGet()`)
- `@ApiStandardResponse` → wraps DTO in envelope shape `{ data, meta, requestId }`

### 3. Sinh OpenAPI Spec

NestJS app expose Swagger khi `isSwaggerEnabled` true (luôn bật trong
`development`; ở env khác cần `ENABLE_SWAGGER=true`). Mount path bao gồm
API prefix (`api` mặc định, xem `API_PREFIX`):

| Resource         | URL                                          |
| ---------------- | -------------------------------------------- |
| Swagger UI       | `http://localhost:3000/api-docs`             |
| OpenAPI JSON     | `http://localhost:3000/api-docs/json`        |

```bash
# Khởi động backend
pnpm --filter @mobile-boilerplate/api dev

# Lấy spec (codegen pipeline dùng)
curl http://localhost:3000/api-docs/json > openapi.json
```

> **Note:** codegen pipeline (`pnpm codegen:api`) KHÔNG cần server đang chạy
> — boot NestJS ở stub mode (`SKIP_DB=true`) qua
> `apps/api/scripts/export-openapi.ts` và dump spec trực tiếp. URL bên trên
> chỉ để inspect/debug thủ công.

### 4. Regenerate Dart Client

From repo root:
```bash
pnpm codegen:api
```

This:
1. Reads NestJS OpenAPI spec
2. Generates `packages/api_client/lib/api_client.dart`
3. Creates typed methods (e.g., `getPost(id: int) → Future<PostResponseDto>`)
4. **Overwrites previous client** — version control will show diff

**Output:**
```
✔ Generated api_client from openapi.json
✔ Updated packages/api_client/lib/
```

### 5. Update Mobile Code

Mobile code now has compile errors (new fields, changed types):

**Before:**
```dart
final post = await apiClient.getPost(id: 1);
final author = post.author;  // ERROR: field doesn't exist
```

**After:**
```dart
final post = await apiClient.getPost(id: 1);
final author = post.authorName;  // ✓ OK (new field)
```

Fix all compile errors in your feature code (repository, UI, tests).

### 6. Update Tests

E2E tests on backend:
```typescript
// apps/api/test/posts.e2e-spec.ts
expect(response.body.data).toHaveProperty('authorName');  // ← NEW FIELD
```

Mobile tests (Provider, widget):
```dart
// test/features/posts/posts_repository_test.dart
final post = await repository.fetchPost(1);
expect(post.authorName, isNotEmpty);  // ← Verify new field populated
```

### 7. Commit Both

```bash
git add apps/api/src/modules/posts/dto/post-response.dto.ts
git add packages/api_client/
git add test/features/posts/

git commit -m "feat(posts): add author name to post response

- Add authorName field to PostResponseDto
- Regenerate Dart client
- Update mobile tests to verify new field"
```

### 8. CI Verification

**codegen-check.yml** runs on every PR:
1. Detects changes to `apps/api/src/**/*.dto.ts`
2. Runs `pnpm codegen:api`
3. Compares generated output to `packages/api_client/`
4. **Fails PR if mismatch** — ensures you regenerated

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgot `operationId` in controller | Generated method name is ugly (`postsControllerGetPostUsingGet`) | Add `@ApiOperation({ operationId: 'getPost' })` |
| Forgot to regenerate Dart client | Mobile compile errors or runtime crashes | Run `pnpm codegen:api` |
| Changed DTO but forgot to update tests | Tests pass but mobile breaks | Update e2e test expectations |
| Forgot to commit generated files | CI fails (codegen-check detects mismatch) | `git add packages/api_client/` |
| Used raw `@ApiOkResponse` instead of `@ApiStandardResponse` | Envelope wrapper missing in spec | Use `@ApiStandardResponse(Dto)` |

## Refactoring Example

**Rename field (breaking change):**

1. **Backend:**
   ```typescript
   // OLD
   export class PostResponseDto {
     content: string;  // ← Was "content"
   }

   // NEW
   export class PostResponseDto {
     body: string;  // ← Now "body"
   }
   ```

2. **Regenerate:**
   ```bash
   pnpm codegen:api
   ```

3. **Mobile:**
   ```dart
   // OLD
   final text = post.content;  // ✗ COMPILE ERROR

   // NEW
   final text = post.body;  // ✓ OK
   ```

4. **Bump version:**
   ```
   feat!: rename post.content to post.body (BREAKING)
   ```

5. **Update changelog** (semantic-release auto-does this).

## Tips

1. **Design API first** — define DTOs before implementing service
2. **Test OpenAPI spec** — use Swagger UI to verify endpoint shape
3. **Generate early, generate often** — don't batch changes; regenerate per feature
4. **Review diffs** — check what changed in generated client (new fields, renamed methods)
5. **Use operationId consistently** — `verbNoun` pattern (getPost, createPost, listPosts, updatePost, deletePost)

## When to NOT Regenerate

You do NOT regenerate when:
- Changing service logic (no DTO change)
- Adding validation (DTO unchanged)
- Fixing bugs in unrelated features

You DO regenerate when:
- Adding/removing/renaming DTO fields
- Changing field types
- Adding/removing controller routes
- Changing operationId

---

**See Also:**
- [Add New Backend Module](./backend-module.md)
- [Add Prisma Module](./prisma-module.md)
