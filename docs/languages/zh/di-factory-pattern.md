# 依赖注入与工厂模式

> 🌐 **语言:** [English](../../di-factory-pattern.md) · [Tiếng Việt](../vi/di-factory-pattern.md) · **中文** · [한국어](../ko/di-factory-pattern.md)

## 后端：NestJS 依赖注入

### 核心概念

**控制反转（IoC）:** NestJS 管理服务创建和生命周期。通过构造器注入依赖，而非手动实例化。

**Provider 类型：**
- `useClass` — 实例化类
- `useValue` — 注入固定值
- `useFactory` — 调用函数创建实例
- `useExisting` — 别名到另一 provider

### 示例：Hello 模块

**实体：**
```typescript
// hello.service.ts
@Injectable()  // 标记为可注入 provider
export class HelloService {
  getMessage(): string {
    return 'Hello World';
  }
}
```

**控制器（依赖服务）：**
```typescript
@Controller('hello')
export class HelloController {
  // NestJS 注入依赖
  constructor(private readonly helloService: HelloService) {}

  @Get()
  getHello(): string {
    return this.helloService.getMessage();
  }
}
```

**模块（注册 provider）：**
```typescript
@Module({
  controllers: [HelloController],
  providers: [HelloService],  // ← NestJS 实例化 & 注入
  exports: [HelloService],    // ← 对其他模块可用
})
export class HelloModule {}
```

### 作用域

**瞬态**（默认）— 每次注入新实例：
```typescript
@Injectable()
export class RandomService {
  readonly value = Math.random();
}

@Module({
  providers: [RandomService],
})
export class MyModule {}
// 每个请求获得新 RandomService 实例
```

**单例** — 应用生命周期单实例：
```typescript
@Injectable({ scope: Scope.DEFAULT })
export class ConfigService {
  // 单实例在所有请求间共享
}

// 或在模块中：
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

**请求** — 每 HTTP 请求新实例：
```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestService {
  // 每请求新实例（昂贵，很少需要）
}
```

### 工厂模式

**useFactory — 动态创建实例：**

```typescript
// 示例：含错误处理的 Prisma 客户端
@Module({
  providers: [
    {
      provide: 'PRISMA_CLIENT',
      useFactory: async () => {
        const prisma = new PrismaClient();
        await prisma.$connect();
        return prisma;
      },
      // 异步工厂必须由 NestJS 等待
      inject: [],
    },
  ],
})
export class PrismaModule {}
```

**useFactory 含依赖：**

```typescript
@Module({
  providers: [
    ConfigService,
    {
      provide: DatabaseService,
      useFactory: (config: ConfigService) => {
        return new DatabaseService(config.get('DATABASE_URL'));
      },
      inject: [ConfigService],  // ← NestJS 先解析 ConfigService
    },
  ],
})
export class DatabaseModule {}
```

### 全局 Provider (app.module.ts)

一次注册；对所有模块可用，无需显式导入：

```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: NotImplementedAuthGuard,  // 守卫所有路由
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

### 工作示例：带 Repository 的用户功能

**实体（域模型）：**
```typescript
export class User {
  id: number;
  email: string;
  name: string;
}
```

**DTO（API 合约）：**
```typescript
export class UserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;
}
```

**Repository 接口：**
```typescript
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  create(user: User): Promise<User>;
}
```

**Repository 实现：**
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

**服务（业务逻辑）：**
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

**控制器：**
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

**模块（连接一切）：**
```typescript
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'IUserRepository',
      useClass: UserRepositoryImpl,  // 可在测试中交换为模拟
    },
  ],
  exports: [UserService],
})
export class UserModule {}
```

**测试：**
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

## 前端：Riverpod 依赖注入

### 核心概念

**Provider** — 惰性求值、响应式值。可依赖其他 provider。

**AsyncNotifierProvider** — 管理异步状态（加载/数据/错误）。

**ProviderContainer** — provider 覆盖的作用域（用于测试）。

### 普通 Provider（标量值）

```dart
// 永不改变的单值
final apiUrlProvider = Provider<String>((ref) => 'https://api.example.com');

// 依赖另一 provider
final dioProvider = Provider<Dio>((ref) {
  final apiUrl = ref.watch(apiUrlProvider);
  return Dio(BaseOptions(baseUrl: apiUrl));
});
```

### AsyncNotifierProvider（状态管理）

```dart
// 定义 provider 管理的状态类型
final userControllerProvider =
    AsyncNotifierProvider<UserController, User>(UserController.new);

// 控制器类（类似 Redux reducer）
class UserController extends AsyncNotifier<User> {
  @override
  Future<User> build() async {
    // 首次访问调用；若依赖改变则重新运行
    final repository = ref.watch(userRepositoryProvider);
    return repository.fetchUser();
  }

  // 公开方法改变状态
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

**在组件中使用：**
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

### Repository 模式

**抽象（域）：**
```dart
abstract class IUserRepository {
  Future<User> fetchUser();
  Future<User> updateUser(User user);
}
```

**实现（数据）：**
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

**Provider（DI）：**
```dart
final userRepositoryProvider = Provider<IUserRepository>((ref) {
  return UserRepositoryImpl(ref.watch(dioProvider));
});
```

### 覆盖模式（测试）

```dart
test('UserController loads user', () async {
  // 创建假 repository
  final fakeRepository = FakeUserRepository();

  // 创建含覆盖的容器
  final container = ProviderContainer(
    overrides: [
      userRepositoryProvider.overrideWithValue(fakeRepository),
    ],
  );

  // 通过容器访问 provider（非直接）
  final userAsync = container.read(userControllerProvider);
  expect(userAsync, isA<AsyncData<User>>());
});
```

### 工作示例：Hello 功能

**实体：**
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

**Repository 接口：**
```dart
abstract class IHelloRepository {
  Future<HelloMessage> getHello();
}
```

**Repository 实现：**
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

**Provider（连接 DI）：**
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

**屏幕（UI 消费者）：**
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

**测试：**
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

### 主要区别：NestJS vs Riverpod

| 特性 | NestJS | Riverpod |
|---------|--------|----------|
| **实例化** | 自动（IoC 容器） | 惰性（首次访问） |
| **作用域** | 瞬态/单例/请求 | Provider 级（通过 FamilyMixin 手动） |
| **测试** | 使用 TestingModule、提供模拟 | 使用 ProviderContainer、覆盖 |
| **异步** | Promise（async/await） | Future + AsyncValue |
| **状态变化** | 通过服务方法 | 通过 provider 方法 |
| **全局状态** | 应用级单例 | 每作用域 ProviderContainer |

---

**最后更新:** 2026 年 4 月
