# Dependency Injection

> 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/dependency-injection.md) · [中文](languages/zh/dependency-injection.md) · [한국어](languages/ko/dependency-injection.md)

## Backend: NestJS Dependency Injection

### Core Concepts

**Inversion of Control (IoC):** NestJS manages service creation and lifetime. Inject dependencies via constructor, not instantiate manually.

**Provider Types:**
- `useClass` — instantiate class
- `useValue` — inject fixed value
- `useFactory` — call function to create instance
- `useExisting` — alias to another provider

### Example: Hello Module

**Entity:**
```typescript
// hello.service.ts
@Injectable()  // Marks as injectable provider
export class HelloService {
  getMessage(): string {
    return 'Hello World';
  }
}
```

**Controller (depends on service):**
```typescript
@Controller('hello')
export class HelloController {
  // Dependency injected by NestJS
  constructor(private readonly helloService: HelloService) {}

  @Get()
  getHello(): string {
    return this.helloService.getMessage();
  }
}
```

**Module (registers providers):**
```typescript
@Module({
  controllers: [HelloController],
  providers: [HelloService],  // ← NestJS instantiates & injects
  exports: [HelloService],    // ← Available to other modules
})
export class HelloModule {}
```

### Scopes

**Transient** (default) — new instance per injection:
```typescript
@Injectable()
export class RandomService {
  readonly value = Math.random();
}

@Module({
  providers: [RandomService],
})
export class MyModule {}
// Each request gets a new RandomService instance
```

**Singleton** — single instance for app lifetime:
```typescript
@Injectable({ scope: Scope.DEFAULT })
export class ConfigService {
  // Single instance shared across all requests
}

// Or in module:
@Module({
  providers: [
    {
      provide: ConfigService,
      useClass: ConfigService,
      scope: Scope.DEFAULT,
    },
  ],
})
```

**Request** — new instance per HTTP request:
```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestService {
  // New instance per request (expensive, rarely needed)
}
```

### Factory Pattern

**useFactory — create instance dynamically:**

```typescript
// Example: Prisma client with error handling
@Module({
  providers: [
    {
      provide: 'PRISMA_CLIENT',
      useFactory: async () => {
        const prisma = new PrismaClient();
        await prisma.$connect();
        return prisma;
      },
      // Async factory must be awaited by NestJS
      inject: [],
    },
  ],
})
export class PrismaModule {}
```

**useFactory with dependencies:**

```typescript
@Module({
  providers: [
    ConfigService,
    {
      provide: DatabaseService,
      useFactory: (config: ConfigService) => {
        return new DatabaseService(config.get('DATABASE_URL'));
      },
      inject: [ConfigService],  // ← NestJS resolves ConfigService first
    },
  ],
})
export class DatabaseModule {}
```

### Auth guard pattern

The boilerplate uses a **default-deny** guard contract:

- `@Public()` — route is open to anonymous traffic
- `@RequireAuth()` — route requires authentication (marker only; no guard binding)
- No decorator → 501 Not Implemented (forces explicit intent)

The active global guard reads metadata to decide enforcement. To swap in a real
auth implementation, change one line in `app.module.ts`:

```ts
{ provide: APP_GUARD, useClass: NotImplementedAuthGuard }
// becomes
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

Your replacement guard MUST honor both metadata keys:

- `IS_PUBLIC_KEY` — bypass auth
- `REQUIRES_AUTH_KEY` — enforce auth

Otherwise the explicit intent contract breaks.

### Global Providers (app.module.ts)

Registered once; available to all modules without explicit import:

```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: NotImplementedAuthGuard,  // Guard all routes
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
```

### Worked Example: User Feature with Repository

**Entity (domain model):**
```typescript
export class User {
  id: number;
  email: string;
  name: string;
}
```

**DTO (API contract):**
```typescript
export class UserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;
}
```

**Repository interface:**
```typescript
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  create(user: User): Promise<User>;
}
```

**Repository implementation:**
```typescript
@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(user: User): Promise<User> {
    return this.prisma.user.create({ data: user });
  }
}
```

**Service (business logic):**
```typescript
@Injectable()
export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private logger: LoggerService,
  ) {}

  async getUser(id: number): Promise<User> {
    this.logger.log(`Fetching user ${id}`);
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    return this.userRepository.create(dto);
  }
}
```

**Controller:**
```typescript
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  @RequireAuth()
  @ApiOperation({ operationId: 'getUser' })
  @ApiStandardResponse(UserResponseDto)
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.getUser(parseInt(id));
    return { id: user.id, email: user.email };
  }

  @Post()
  @Public()
  @ApiOperation({ operationId: 'createUser' })
  @ApiStandardResponse(UserResponseDto)
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.createUser(dto);
    return { id: user.id, email: user.email };
  }
}
```

**Module (wires everything):**
```typescript
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: UserRepositoryImpl,  // Could swap for mock in tests
    },
  ],
  exports: [UserService],
})
export class UserModule {}
```

**Test:**
```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: Partial<IUserRepository>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn().mockResolvedValue({ id: 1, email: 'test@ex.com' }),
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'IUserRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('returns user if found', async () => {
    const user = await service.getUser(1);
    expect(user.email).toBe('test@ex.com');
  });
});
```

## Frontend: Riverpod Dependency Injection

### Core Concepts

**Provider** — lazy-evaluated, reactive value. Can depend on other providers.

**AsyncNotifierProvider** — manages async state (loading/data/error).

**ProviderContainer** — scope for provider overrides (for testing).

### Plain Provider (Scalar Values)

```dart
// Single value that never changes
final apiUrlProvider = Provider<String>((ref) => 'https://api.example.com');

// Depends on another provider
final dioProvider = Provider<Dio>((ref) {
  final apiUrl = ref.watch(apiUrlProvider);
  return Dio(BaseOptions(baseUrl: apiUrl));
});
```

### AsyncNotifierProvider (State Management)

```dart
// Define what state type the provider manages
final userControllerProvider =
    AsyncNotifierProvider<UserController, User>(UserController.new);

// Controller class (like a Redux reducer)
class UserController extends AsyncNotifier<User> {
  @override
  Future<User> build() async {
    // Called once on first access; re-runs if dependencies change
    final repository = ref.watch(userRepositoryProvider);
    return repository.fetchUser();
  }

  // Public method to mutate state
  Future<void> updateUser(User updated) async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.watch(userRepositoryProvider);
      final result = await repository.updateUser(updated);
      state = AsyncValue.data(result);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
```

**Use in widget:**
```dart
Consumer(builder: (context, ref, _) {
  final userAsync = ref.watch(userControllerProvider);

  return userAsync.when(
    data: (user) => Text('Hello, ${user.name}'),
    loading: () => CircularProgressIndicator(),
    error: (err, st) => ErrorView(error: err),
  );
})
```

### Repository Pattern

**Abstract (domain):**
```dart
abstract class IUserRepository {
  Future<User> fetchUser();
  Future<User> updateUser(User user);
}
```

**Implementation (data):**
```dart
class UserRepositoryImpl implements IUserRepository {
  final Dio dio;

  UserRepositoryImpl(this.dio);

  @override
  Future<User> fetchUser() async {
    final response = await dio.get('/user');
    return User.fromJson(response.data);
  }

  @override
  Future<User> updateUser(User user) async {
    final response = await dio.put('/user', data: user.toJson());
    return User.fromJson(response.data);
  }
}
```

**Provider (DI):**
```dart
final userRepositoryProvider = Provider<IUserRepository>((ref) {
  return UserRepositoryImpl(ref.watch(dioProvider));
});
```

### Override Pattern (Testing)

```dart
test('UserController loads user', () async {
  // Create fake repository
  final fakeRepository = FakeUserRepository();

  // Create container with overrides
  final container = ProviderContainer(
    overrides: [
      userRepositoryProvider.overrideWithValue(fakeRepository),
    ],
  );

  // Access provider via container (not directly)
  final userAsync = container.read(userControllerProvider);
  expect(userAsync, isA<AsyncData<User>>());
});
```

### Worked Example: Hello Feature

**Entity:**
```dart
class HelloMessage {
  final String message;
  final DateTime timestamp;

  HelloMessage({required this.message, required this.timestamp});

  factory HelloMessage.fromJson(Map<String, dynamic> json) {
    return HelloMessage(
      message: json['message'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}
```

**Repository interface:**
```dart
abstract class IHelloRepository {
  Future<HelloMessage> getHello();
}
```

**Repository implementation:**
```dart
class HelloRepositoryImpl implements IHelloRepository {
  final Dio dio;

  HelloRepositoryImpl(this.dio);

  @override
  Future<HelloMessage> getHello() async {
    final response = await dio.get('/hello');
    return HelloMessage.fromJson(response.data);
  }
}
```

**Provider (wires DI):**
```dart
final helloRepositoryProvider = Provider<IHelloRepository>((ref) {
  return HelloRepositoryImpl(ref.watch(dioProvider));
});

final helloControllerProvider =
    AsyncNotifierProvider<HelloController, HelloMessage>(
      HelloController.new,
    );

class HelloController extends AsyncNotifier<HelloMessage> {
  @override
  Future<HelloMessage> build() async {
    final repository = ref.watch(helloRepositoryProvider);
    return repository.getHello();
  }
}
```

**Screen (UI consumer):**
```dart
class HelloScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final helloAsync = ref.watch(helloControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text('Hello')),
      body: helloAsync.when(
        data: (hello) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(hello.message),
              Text(hello.timestamp.toIso8601String()),
            ],
          ),
        ),
        loading: () => LoadingView(),
        error: (err, st) => ErrorView(error: err),
      ),
    );
  }
}
```

**Test:**
```dart
void main() {
  group('HelloController', () {
    test('loads hello message', () async {
      final fakeRepository = FakeHelloRepository();

      final container = ProviderContainer(
        overrides: [
          helloRepositoryProvider.overrideWithValue(fakeRepository),
        ],
      );

      final helloAsync = await container.read(helloControllerProvider.future);
      expect(helloAsync.message, equals('Hello World'));
    });
  });
}
```

### Key Differences: NestJS vs Riverpod

| Feature | NestJS | Riverpod |
|---------|--------|----------|
| **Instantiation** | Automatic (IoC container) | Lazy (on first access) |
| **Scope** | Transient/Singleton/Request | Provider-level (manual via FamilyMixin) |
| **Testing** | Use TestingModule, provide mocks | Use ProviderContainer, override |
| **Async** | Promises (async/await) | Future + AsyncValue |
| **State mutation** | Via service methods | Via provider methods |
| **Global state** | App-wide singletons | ProviderContainer per scope |

---

**Last updated:** April 2026
