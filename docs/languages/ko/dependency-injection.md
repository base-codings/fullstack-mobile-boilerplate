# 의존성 주입

> 🌐 **언어:** [English](../../dependency-injection.md) · [Tiếng Việt](../vi/dependency-injection.md) · [中文](../zh/dependency-injection.md) · **한국어**

## 백엔드: NestJS 의존성 주입

### 핵심 개념

**제어 역전 (IoC):** NestJS가 서비스 생성 및 수명 관리. Constructor로 주입, 수동 인스턴스 생성 없음.

**제공자 타입:**
- `useClass` — 클래스 인스턴스화
- `useValue` — 고정 값 주입
- `useFactory` — 함수 호출해서 인스턴스 생성
- `useExisting` — 다른 제공자로 alias

### 예시: Hello Module

**Entity:**
```typescript
// hello.service.ts
@Injectable()  // injectable 제공자로 표시
export class HelloService {
  getMessage(): string {
    return 'Hello World';
  }
}
```

**Controller (서비스에 의존):**
```typescript
@Controller('hello')
export class HelloController {
  // NestJS가 의존성 주입
  constructor(private readonly helloService: HelloService) {}

  @Get()
  getHello(): string {
    return this.helloService.getMessage();
  }
}
```

**Module (제공자 등록):**
```typescript
@Module({
  controllers: [HelloController],
  providers: [HelloService],  // ← NestJS가 인스턴스화 & 주입
  exports: [HelloService],    // ← 다른 모듈에서 사용 가능
})
export class HelloModule {}
```

### 스코프

**Transient** (기본값) — 주입당 새 인스턴스:
```typescript
@Injectable()
export class RandomService {
  readonly value = Math.random();
}

@Module({
  providers: [RandomService],
})
export class MyModule {}
// 각 요청은 새로운 RandomService 인스턴스 받음
```

**Singleton** — 앱 수명 동안 단일 인스턴스:
```typescript
@Injectable({ scope: Scope.DEFAULT })
export class ConfigService {
  // 모든 요청 간에 공유되는 단일 인스턴스
}
```

**Request** — HTTP 요청당 새 인스턴스:
```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestService {
  // 요청당 새 인스턴스 (비용 큼, 드물게 필요)
}
```

### 팩토리 패턴

**useFactory — 동적으로 인스턴스 생성:**

```typescript
// 예: 오류 처리로 Prisma 클라이언트
@Module({
  providers: [
    {
      provide: 'PRISMA_CLIENT',
      useFactory: async () => {
        const prisma = new PrismaClient();
        await prisma.$connect();
        return prisma;
      },
      inject: [],
    },
  ],
})
export class PrismaModule {}
```

**의존성이 있는 useFactory:**

```typescript
@Module({
  providers: [
    ConfigService,
    {
      provide: DatabaseService,
      useFactory: (config: ConfigService) => {
        return new DatabaseService(config.get('DATABASE_URL'));
      },
      inject: [ConfigService],  // ← NestJS가 먼저 ConfigService 해결
    },
  ],
})
export class DatabaseModule {}
```

### 전역 제공자 (app.module.ts)

한 번 등록; 모든 모듈에서 명시적 import 없이 사용 가능:

```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: NotImplementedAuthGuard,  // 모든 라우트 guard
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

### 실제 예: Repository를 가진 User 기능

**Entity (도메인 모델):**
```typescript
export class User {
  id: number;
  email: string;
  name: string;
}
```

**DTO (API 계약):**
```typescript
export class UserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;
}
```

**Repository 인터페이스:**
```typescript
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  create(user: User): Promise<User>;
}
```

**Repository 구현:**
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

**Service (비즈니스 로직):**
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

**Module (모든 것을 연결):**
```typescript
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: UserRepositoryImpl,  // 테스트에서 mock으로 교체 가능
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

## 프론트엔드: Riverpod 의존성 주입

### 핵심 개념

**Provider** — lazy 평가, 반응형 값. 다른 제공자에 의존 가능.

**AsyncNotifierProvider** — async 상태 관리 (로딩/데이터/오류).

**ProviderContainer** — 제공자 오버라이드 스코프 (테스트용).

### Plain Provider (스칼라 값)

```dart
// 절대 변경되지 않는 단일 값
final apiUrlProvider = Provider<String>((ref) => 'https://api.example.com');

// 다른 제공자에 의존
final dioProvider = Provider<Dio>((ref) {
  final apiUrl = ref.watch(apiUrlProvider);
  return Dio(BaseOptions(baseUrl: apiUrl));
});
```

### AsyncNotifierProvider (상태 관리)

```dart
// 제공자가 관리할 상태 타입 정의
final userControllerProvider =
    AsyncNotifierProvider<UserController, User>(UserController.new);

// Controller 클래스 (Redux reducer처럼)
class UserController extends AsyncNotifier<User> {
  @override
  Future<User> build() async {
    // 첫 접근 시 호출; 의존성 변경 시 재실행
    final repository = ref.watch(userRepositoryProvider);
    return repository.fetchUser();
  }

  // 상태 변경을 위한 공개 메서드
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

**Widget에서 사용:**
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

### Repository 패턴

**추상 (domain):**
```dart
abstract class IUserRepository {
  Future<User> fetchUser();
  Future<User> updateUser(User user);
}
```

**구현 (data):**
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

### 오버라이드 패턴 (테스트)

```dart
test('UserController loads user', () async {
  // fake repository 생성
  final fakeRepository = FakeUserRepository();

  // 오버라이드를 가진 컨테이너 생성
  final container = ProviderContainer(
    overrides: [
      userRepositoryProvider.overrideWithValue(fakeRepository),
    ],
  );

  // 컨테이너를 통해 제공자 접근 (직접 아님)
  final userAsync = container.read(userControllerProvider);
  expect(userAsync, isA<AsyncData<User>>());
});
```

### 실제 예: Hello 기능

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

**Repository 인터페이스:**
```dart
abstract class IHelloRepository {
  Future<HelloMessage> getHello();
}
```

**Repository 구현:**
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

**Provider (DI 연결):**
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

### 주요 차이: NestJS vs Riverpod

| 기능 | NestJS | Riverpod |
|---------|--------|----------|
| **인스턴스화** | 자동 (IoC 컨테이너) | Lazy (첫 접근 시) |
| **스코프** | Transient/Singleton/Request | 제공자 레벨 (FamilyMixin으로 수동) |
| **테스트** | TestingModule 사용, mock 제공 | ProviderContainer, 오버라이드 |
| **Async** | Promise (async/await) | Future + AsyncValue |
| **상태 변경** | 서비스 메서드로 | 제공자 메서드로 |
| **전역 상태** | 앱 전체 singleton | ProviderContainer per scope |

---

**최종 업데이트:** 2026년 4월
