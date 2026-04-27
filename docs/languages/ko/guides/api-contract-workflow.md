# API 계약 워크플로우

> 🌐 **언어:** [English](../../../guides/api-contract-workflow.md) · [Tiếng Việt](../../vi/guides/api-contract-workflow.md) · [中文](../../zh/guides/api-contract-workflow.md) · **한국어**

백엔드 API 변경 (DTO, controller, operationId) 시 생성된 Dart 클라이언트와 동기화 유지 워크플로우.

## 문제

NestJS DTO는 변경했지만 Dart 클라이언트 재생성을 잊으면, 모바일 앱:
- 오래된 타입 사용
- 컴파일 타임 실패 (타입 불일치)
- 런타임 실패 (역직렬화 오류)

## 워크플로우

### 1. 백엔드 DTO 또는 Controller 변경

**apps/api/src/modules/posts/dto/post-response.dto.ts:**
```typescript
export class PostResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  // 새 필드
  @ApiProperty()
  authorName: string;  // ← 추가됨

  @ApiProperty()
  createdAt: Date;
}
```

### 2. Swagger 데코레이터 검증

**Controller가 있는지 확인:**
```typescript
@Get(':id')
@ApiOperation({ operationId: 'getPost' })    // ← operationId 필수
@ApiStandardResponse(PostResponseDto)          // ← @ApiStandardResponse 필수
async getPost(@Param('id') id: string) {
  // ...
}
```

**왜:**
- `operationId` → 깔끔한 Dart 메서드 명 (`getPost()` not `postsControllerGetPostUsingGet()`)
- `@ApiStandardResponse` → DTO를 엔벨로프 형태 `{ data, meta, requestId }`로 감싸기

### 3. OpenAPI 스펙 생성

NestJS 앱은 dev 모드에서 `/api-json`에 Swagger 스펙 생성:

```bash
# 백엔드 시작
pnpm --filter @mobile-boilerplate/api dev

# 스펙 접근
curl http://localhost:3000/api-json > openapi.json
```

또는 `http://localhost:3000/api`에서 Swagger UI.

### 4. Dart 클라이언트 재생성

Repository 루트에서:
```bash
pnpm codegen:api
```

이것:
1. NestJS OpenAPI 스펙 읽음
2. `packages/api_client/lib/api_client.dart` 생성
3. 타입 메서드 생성 (예: `getPost(id: int) → Future<PostResponseDto>`)
4. **이전 클라이언트 덮어씀** — version control은 diff를 표시

**출력:**
```
✔ Generated api_client from openapi.json
✔ Updated packages/api_client/lib/
```

### 5. 모바일 코드 업데이트

모바일 코드는 이제 컴파일 오류 (새 필드, 변경된 타입):

**이전:**
```dart
final post = await apiClient.getPost(id: 1);
final author = post.author;  // ERROR: 필드 없음
```

**이후:**
```dart
final post = await apiClient.getPost(id: 1);
final author = post.authorName;  // ✓ OK (새 필드)
```

모든 feature 코드 (repository, UI, 테스트)의 컴파일 오류 수정.

### 6. 테스트 업데이트

**백엔드 E2E 테스트:**
```typescript
// apps/api/test/posts.e2e-spec.ts
expect(response.body.data).toHaveProperty('authorName');  // ← 새 필드
```

**모바일 테스트 (Provider, widget):**
```dart
// test/features/posts/posts_repository_test.dart
final post = await repository.fetchPost(1);
expect(post.authorName, isNotEmpty);  // ← 새 필드 확인
```

### 7. 둘 다 커밋

```bash
git add apps/api/src/modules/posts/dto/post-response.dto.ts
git add packages/api_client/
git add test/features/posts/

git commit -m "feat(posts): add author name to post response

- Add authorName field to PostResponseDto
- Regenerate Dart client
- Update mobile tests to verify new field"
```

### 8. CI 검증

**codegen-check.yml**은 모든 PR에서 실행:
1. `apps/api/src/**/*.dto.ts` 변경 감지
2. `pnpm codegen:api` 실행
3. 생성 결과를 `packages/api_client/`와 비교
4. **불일치하면 PR 실패** — 재생성 강제

## 일반적 실수

| 실수 | 증상 | 수정 |
|---------|---------|-----|
| Controller에서 `operationId` 잊음 | 생성 메서드 명이 못생김 (`postsControllerGetPostUsingGet`) | `@ApiOperation({ operationId: 'getPost' })` 추가 |
| Dart 클라이언트 재생성 잊음 | 모바일 컴파일 오류 또는 런타임 크래시 | `pnpm codegen:api` 실행 |
| DTO 변경했지만 테스트 미업데이트 | 테스트 통과하지만 모바일 깨짐 | e2e 테스트 기대값 업데이트 |
| 생성된 파일 커밋 잊음 | CI 실패 (codegen-check 불일치 감지) | `git add packages/api_client/` |
| 원래 `@ApiOkResponse` 대신 `@ApiStandardResponse` 사용 | 스펙에서 엔벨로프 래퍼 누락 | `@ApiStandardResponse(Dto)` 사용 |

## 리팩토링 예시

**필드 이름 바꾸기 (breaking change):**

1. **백엔드:**
   ```typescript
   // 이전
   export class PostResponseDto {
     content: string;  // ← "content"였음
   }

   // 새로
   export class PostResponseDto {
     body: string;  // ← 이제 "body"
   }
   ```

2. **재생성:**
   ```bash
   pnpm codegen:api
   ```

3. **모바일:**
   ```dart
   // 이전
   final text = post.content;  // ✗ 컴파일 오류

   // 새로
   final text = post.body;  // ✓ OK
   ```

4. **버전 범프:**
   ```
   feat!: rename post.content to post.body (BREAKING)
   ```

5. **변경 로그 업데이트** (semantic-release 자동)

## Tips

1. **API 먼저 설계** — 서비스 구현 전 DTO 정의
2. **OpenAPI 스펙 테스트** — Swagger UI로 엔드포인트 형태 검증
3. **자주 생성** — 변경을 일괄 처리하지 말고; feature당 재생성
4. **diff 리뷰** — 생성된 클라이언트에서 뭐가 변했는지 확인 (새 필드, 메서드 이름 바꾸기)
5. **operationId 일관성** — `verbNoun` 패턴 사용 (getPost, createPost, listPosts, updatePost, deletePost)

## 언제 재생성하지 않음

다음 시는 재생성 **불필요:**
- 서비스 로직 변경 (DTO 미변경)
- 검증 추가 (DTO 미변경)
- 관련없는 기능의 버그 수정

다음 시 재생성 **필요:**
- DTO 필드 추가/제거/이름 바꾸기
- 필드 타입 변경
- Controller 라우트 추가/제거
- operationId 변경

---

**참고:**
- [새로운 백엔드 모듈 추가](./add-new-backend-module.md)
- [Prisma 모듈 추가](./add-prisma-module.md)
