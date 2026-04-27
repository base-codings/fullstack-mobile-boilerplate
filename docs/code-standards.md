# Code Standards

> 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/code-standards.md) · [中文](languages/zh/code-standards.md) · [한국어](languages/ko/code-standards.md)

## File Organization & Naming

### Naming Convention
- **Files:** `kebab-case` (e.g., `hello-controller.ts`, `hello_repository.dart`)
- **Directories:** `kebab-case` (e.g., `src/modules/user-management/`, `lib/features/auth/`)
- **Classes/Interfaces:** `PascalCase` (e.g., `HelloController`, `UserRepository`)
- **Functions/Variables:** `camelCase` (e.g., `getHello`, `userId`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `API_TIMEOUT_MS`)
- **Private members:** Prefix with `_` (e.g., `_internal`, `_service`)

### File Size Limits

**Max 200 lines per file** (excluding comments). Rationale: improves readability, encourages single responsibility, easier for LLM tools to analyze.

**Violation pattern:** If a file approaches 180 lines, plan modularization in next sprint.

**Example splits:**
- Large controller → split routes into separate controllers per resource
- Large service → split business logic into focused services
- Large widget → extract sub-widgets into separate files

## TypeScript Standards (Backend)

### Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Rules:**
- **No `any` type.** Use `unknown` if truly unknown, then narrow type.
- **Explicit return types.** Always annotate function return types.
- **Prefer interfaces over types.** (Minor stylistic; both valid.)

### Example
```typescript
// ✗ BAD
function getUser(id) {
  return db.user.findUnique({ where: { id } });
}

// ✓ GOOD
function getUser(id: number): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}
```

### NestJS-Specific

**Controller decorator:**
```typescript
// ✓ GOOD: Explicit path
@Controller('users')
export class UsersController { }

// ✗ BAD: No path (ambiguous nesting)
@Controller()
export class UsersController { }
```

**DTO validation:**
```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;
}
```

**Service injection via constructor:**
```typescript
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}
}
```

## Dart Standards (Frontend)

### Lint Configuration
App uses `very_good_analysis` package. No additional linting rules needed.

**Run linting:**
```bash
cd apps/mobile
fvm flutter analyze
```

**Rules enforced:**
- No unused variables/imports
- Effective Dart conventions
- Const constructors where applicable
- Proper async/await usage

### Example
```dart
// ✗ BAD
class User {
  User({required this.name}); // Not const
  final String name;
}

// ✓ GOOD
class User {
  const User({required this.name});
  final String name;
}
```

### Riverpod Providers

**Plain provider (scaffold, no build_runner):**
```dart
final dioProvider = Provider<Dio>((ref) {
  return Dio();
});
```

**AsyncNotifierProvider (manage async state):**
```dart
final userControllerProvider = AsyncNotifierProvider<
  UserController,
  List<User>,
>(UserController.new);

class UserController extends AsyncNotifier<List<User>> {
  @override
  Future<List<User>> build() async {
    return ref.watch(userRepositoryProvider).fetchUsers();
  }
}
```

**Repository pattern:**
```dart
// Abstract interface
abstract class UserRepository {
  Future<List<User>> fetchUsers();
}

// Implementation
class UserRepositoryImpl implements UserRepository {
  final Dio _dio;
  
  UserRepositoryImpl(this._dio);

  @override
  Future<List<User>> fetchUsers() async {
    final response = await _dio.get('/users');
    return (response.data as List).map((u) => User.fromJson(u)).toList();
  }
}
```

## Testing Standards

### Backend (Jest + NestJS)

**File naming:** `*.spec.ts` colocated with source.

**Example structure:**
```
apps/api/src/modules/users/
├── users.service.ts
├── users.service.spec.ts        // Unit test
├── users.controller.ts
└── users.controller.spec.ts     // Controller/integration test

apps/api/test/
└── users.e2e-spec.ts            // End-to-end test
```

**Test pattern:**
```typescript
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();
    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should fetch user by id', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      id: 1, name: 'Alice'
    });
    const user = await service.getUser(1);
    expect(user.name).toBe('Alice');
  });
});
```

### Frontend (Riverpod + Mocktail)

**File naming:** `*_test.dart` colocated with source in `test/`.

**Example structure:**
```
apps/mobile/test/features/users/
├── user_controller_test.dart     // Provider logic
├── user_screen_test.dart         // Widget test
└── user_repository_test.dart     // Repository layer

apps/mobile/test/helpers/
└── pump_app.dart                 // Test utilities
```

**Provider test pattern:**
```dart
void main() {
  group('UserController', () {
    test('fetch users updates state', () async {
      final container = ProviderContainer(
        overrides: [
          userRepositoryProvider.overrideWithValue(
            FakeUserRepository(),
          ),
        ],
      );

      final controller = container.read(userControllerProvider.notifier);
      expect(
        container.read(userControllerProvider),
        isA<AsyncData<List<User>>>(),
      );
    });
  });
}
```

### Coverage Requirements

- **Backend:** Aim for 80%+ coverage on business logic (services, helpers)
- **Frontend:** Aim for 70%+ coverage on providers + critical widgets
- **Exclude:** Auto-generated files, trivial getters, mock utilities

## Commit Message Convention

**Format:** Conventional Commits (enforced by commitlint)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring (no feature change)
- `test:` Adding/updating tests
- `docs:` Documentation only
- `chore:` Build config, deps, etc. (NO AI references)

**Examples:**
```
feat(users): add user creation endpoint with validation

- Validate email format
- Hash password with bcrypt
- Return user with JWT token

Closes #123

---

fix(mobile): resolve Dio timeout on slow connections

Increase timeout from 10s to 30s. Use exponential backoff for retries.

---

refactor(api): extract validation logic into separate service

Move DTO validation from controller to shared service for reuse.
```

**CI Enforcement:**
- Commitlint runs in `.husky/commit-msg` hook
- Rejects commits with invalid format
- Error message guides user to correct format

## Linting & Formatting

### Backend (TypeScript + ESLint)

**Run linting:**
```bash
pnpm --filter @mobile-boilerplate/api lint
```

**Pre-commit (Lefthook):**
```yaml
# .lefthook.yml
pre-commit:
  commands:
    lint:
      run: pnpm --filter={app} lint
      glob: "src/**/*.ts"
```

**Lint rules:**
- No unused variables
- No `any` type
- No deeply nested ternaries
- Consistent spacing

### Frontend (Dart Analyzer)

**Run analysis:**
```bash
cd apps/mobile && fvm flutter analyze
```

**Pre-commit (Lefthook):**
Same hook triggers analyzer + tests.

## Import Organization

### Backend (TypeScript)
```typescript
// 1. Node/External packages
import { Controller } from '@nestjs/common';
import axios from 'axios';

// 2. Absolute paths (@shared, @modules, etc.)
import { Logger } from '@shared/logger';

// 3. Relative paths
import { HelloService } from './hello.service';
```

### Frontend (Dart)
```dart
// 1. Dart SDK
import 'dart:async';

// 2. Flutter packages
import 'package:flutter/material.dart';

// 3. Pub packages
import 'package:riverpod/riverpod.dart';

// 4. Local packages (api_client)
import 'package:api_client/api_client.dart';

// 5. Relative paths
import '../domain/repositories/user_repository.dart';
```

## Forbidden Patterns

| Pattern | Reason | Example |
|---------|--------|---------|
| Deep module imports (backend) | Breaks encapsulation | `src/modules/users/internal/*` visible outside `users/` |
| Cross-feature imports (frontend) | Tight coupling, hard to delete features | Feature A imports Feature B's provider |
| `@Controller()` with no path | Ambiguous routing | Routes nest unexpectedly |
| Hardcoded URLs/API paths | Not env-aware | `'http://localhost:3000'` instead of env var |
| `@Public()` on routes that shouldn't be public | Security risk | Accidentally expose /admin with `@Public()` |
| `console.log` in production code | Noise in logs | Use structured logger (Pino, logger service) |
| Magic numbers | Unreadable, hard to maintain | `limit: 100` without explanation (use named constant) |
| `// TODO` without issue number | Never gets done | Debt accumulates; link to GitHub issue |

## Error Handling

### Backend
```typescript
// ✗ BAD: Silent failure
const user = await prisma.user.findUnique({ where: { id } });
if (user) return user; // What if not found? Undefined?

// ✓ GOOD: Explicit error
const user = await this.prisma.user.findUnique({ where: { id } });
if (!user) {
  throw new NotFoundException(`User ${id} not found`);
}
return user;
```

### Frontend
```dart
// ✗ BAD: Silent error
try {
  await repository.fetchUser();
} catch (e) {
  // Error ignored
}

// ✓ GOOD: Handle or propagate
try {
  return await repository.fetchUser();
} catch (e) {
  rethrow; // Let provider handle state transition to error
}
```

## Documentation Requirements

**Code comments required for:**
- Non-obvious business logic
- Workarounds (link to GitHub issue if complexity)
- Public API contracts (parameters, return values)
- Deprecated code (when removal is planned)

**Self-documenting code preferred over comments:**
```typescript
// ✗ BAD
const a = x > 10 ? 100 : x * 10;  // What is a?

// ✓ GOOD
const adjustedPrice = price > 10 ? 100 : price * 10;
```

## Version Pinning

**Backend (package.json):**
- Major deps pinned: `^13.0.0` (allow minor/patch)
- Test/lint tools pinned exactly: `=1.0.0` (deterministic CI)

**Frontend (pubspec.yaml):**
- Plugin deps pinned: `^2.5.0` (allow minor/patch)
- Test runner pinned exactly: `=2.4.13` (deterministic CI)

**Update process:**
- Weekly `pnpm upgrade` / `fvm flutter pub upgrade --major-versions`
- CI regression tests must pass
- Changelog entry per upgrade

---

**Last updated:** April 2026
