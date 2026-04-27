# 添加新的 Flutter 功能

> 🌐 **语言:** [English](../../../guides/add-new-flutter-feature.md) · [Tiếng Việt](../../vi/guides/add-new-flutter-feature.md) · **中文** · [한국어](../../ko/guides/add-new-flutter-feature.md)

本指南演示使用 repository 模式和 Riverpod 状态管理构建完整 Flutter 功能。

## 结构

每个功能遵循此布局：
```
lib/features/<feature-name>/
├── data/
│   └── <feature>_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── <entity>.dart
│   └── repositories/
│       └── <feature>_repository.dart
└── presentation/
    ├── controllers/
    │   └── <feature>_controller.dart
    ├── screens/
    │   └── <feature>_screen.dart
    └── widgets/
        └── <feature>_card.dart
```

## 示例：构建 Posts 功能

### 步骤 1：创建目录

```bash
mkdir -p apps/mobile/lib/features/posts/{data,domain/entities,domain/repositories,presentation/controllers,presentation/screens,presentation/widgets}
```

### 步骤 2：创建实体

**lib/features/posts/domain/entities/post.dart:**
```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'post.freezed.dart';
part 'post.g.dart';

@freezed
class Post with _$Post {
  const factory Post({
    required int id,
    required String title,
    required String body,
    required bool published,
    required int authorId,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Post;

  factory Post.fromJson(Map<String, dynamic> json) => _$PostFromJson(json);
}
```

**运行代码生成：**
```bash
cd apps/mobile && dart run build_runner build
```

### 步骤 3：创建 Repository 接口

**lib/features/posts/domain/repositories/post_repository.dart:**
```dart
import '../entities/post.dart';

abstract class PostRepository {
  Future<List<Post>> fetchPosts();
  Future<Post> fetchPost(int id);
  Future<Post> createPost({required String title, required String body});
  Future<Post> updatePost(int id, {required String title, required String body});
  Future<void> deletePost(int id);
}
```

### 步骤 4：创建 Repository 实现

**lib/features/posts/data/post_repository_impl.dart:**
```dart
import 'package:dio/dio.dart';
import '../../../shared/models/api_client_generated.dart';  // 自动生成
import '../domain/entities/post.dart';
import '../domain/repositories/post_repository.dart';

class PostRepositoryImpl implements PostRepository {
  final Dio dio;

  PostRepositoryImpl(this.dio);

  @override
  Future<List<Post>> fetchPosts() async {
    try {
      final response = await dio.get('/posts');
      return (response.data as List)
          .map((p) => Post.fromJson(p))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<Post> fetchPost(int id) async {
    final response = await dio.get('/posts/$id');
    return Post.fromJson(response.data);
  }

  @override
  Future<Post> createPost({required String title, required String body}) async {
    final response = await dio.post('/posts', data: {
      'title': title,
      'body': body,
    });
    return Post.fromJson(response.data);
  }

  @override
  Future<Post> updatePost(int id,
      {required String title, required String body}) async {
    final response = await dio.put('/posts/$id', data: {
      'title': title,
      'body': body,
    });
    return Post.fromJson(response.data);
  }

  @override
  Future<void> deletePost(int id) async {
    await dio.delete('/posts/$id');
  }
}
```

### 步骤 5：创建 Riverpod Provider

**lib/features/posts/presentation/controllers/posts_controller.dart:**
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/di/providers.dart';
import '../../domain/entities/post.dart';
import '../../domain/repositories/post_repository.dart';
import '../../data/post_repository_impl.dart';

/// Repository provider — 依赖注入
final postRepositoryProvider = Provider<PostRepository>((ref) {
  return PostRepositoryImpl(ref.watch(dioProvider));
});

/// Posts 列表 provider — 异步状态管理
final postsControllerProvider =
    AsyncNotifierProvider<PostsController, List<Post>>(
  PostsController.new,
);

class PostsController extends AsyncNotifier<List<Post>> {
  @override
  Future<List<Post>> build() async {
    final repository = ref.watch(postRepositoryProvider);
    return repository.fetchPosts();
  }

  /// 刷新 posts 列表
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.watch(postRepositoryProvider).fetchPosts(),
    );
  }

  /// 创建新 post
  Future<void> createPost(String title, String body) async {
    final repository = ref.watch(postRepositoryProvider);
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await repository.createPost(title: title, body: body);
      // 创建后刷新列表
      return repository.fetchPosts();
    });
  }
}

/// 单个 post provider（按 ID）
final postDetailProvider =
    FutureProvider.family<Post, int>((ref, postId) async {
  final repository = ref.watch(postRepositoryProvider);
  return repository.fetchPost(postId);
});
```

### 步骤 6：创建屏幕与组件

**lib/features/posts/presentation/screens/posts_screen.dart:**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../controllers/posts_controller.dart';
import '../widgets/post_card.dart';

class PostsScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postsAsync = ref.watch(postsControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Posts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(postsControllerProvider),
          ),
        ],
      ),
      body: postsAsync.when(
        data: (posts) => posts.isEmpty
            ? Center(
                child: Text('No posts yet'),
              )
            : ListView.builder(
                itemCount: posts.length,
                itemBuilder: (context, index) => PostCard(
                  post: posts[index],
                ),
              ),
        loading: () => const LoadingView(message: 'Loading posts...'),
        error: (err, st) => ErrorView(
          error: err,
          onRetry: () => ref.refresh(postsControllerProvider),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateDialog(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showCreateDialog(BuildContext context, WidgetRef ref) {
    final titleController = TextEditingController();
    final bodyController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New Post'),
        content: SingleChildScrollView(
          child: Column(
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(labelText: 'Title'),
              ),
              TextField(
                controller: bodyController,
                decoration: const InputDecoration(labelText: 'Body'),
                maxLines: 5,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              await ref
                  .read(postsControllerProvider.notifier)
                  .createPost(titleController.text, bodyController.text);
              Navigator.pop(context);
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}
```

**lib/features/posts/presentation/widgets/post_card.dart:**
```dart
import 'package:flutter/material.dart';
import '../../domain/entities/post.dart';

class PostCard extends StatelessWidget {
  final Post post;

  const PostCard({required this.post});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              post.title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              post.body,
              style: Theme.of(context).textTheme.bodyMedium,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  post.published ? 'Published' : 'Draft',
                  style: TextStyle(
                    color: post.published ? Colors.green : Colors.orange,
                  ),
                ),
                Text(
                  post.createdAt.toString().split('.')[0],
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

### 步骤 7：注册路由

**lib/core/router/app_router.dart:**
```dart
import 'package:go_router/go_router.dart';
import '../../features/posts/presentation/screens/posts_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    routes: [
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const HelloScreen(),
      ),
      GoRoute(
        path: '/posts',
        name: 'posts',
        builder: (context, state) => const PostsScreen(),
      ),
    ],
  );
});
```

### 步骤 8：添加测试

**test/features/posts/posts_controller_test.dart:**
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_boilerplate/features/posts/domain/entities/post.dart';
import 'package:mobile_boilerplate/features/posts/presentation/controllers/posts_controller.dart';

void main() {
  group('PostsController', () => {
    test('loads posts successfully', () async {
      final container = ProviderContainer(
        overrides: [
          postRepositoryProvider.overrideWithValue(FakePostRepository()),
        ],
      );

      final postsAsync = await container.read(postsControllerProvider.future);
      expect(postsAsync, isA<List<Post>>());
    });
  });
}

class FakePostRepository implements PostRepository {
  @override
  Future<List<Post>> fetchPosts() async {
    return [
      Post(
        id: 1,
        title: 'Test Post',
        body: 'Test body',
        published: true,
        authorId: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];
  }

  // ... 实现其他方法
}
```

### 步骤 9：关键 — 隔离规则

**禁止从其他功能导入：**

```dart
// ✗ 不好：功能 A 从功能 B 导入
import 'package:mobile_boilerplate/features/users/domain/entities/user.dart';

// ✓ 好：同功能内
import '../domain/entities/post.dart';

// ✓ 好：从 core/shared
import 'package:mobile_boilerplate/shared/widgets/loading_view.dart';
```

若 posts 需要用户信息，在 `core/` 中创建单独的"用户详情" provider，或在 Post 实体中复制最小用户数据。

## 测试模式

使用 `ProviderContainer` 及覆盖在隔离中测试：

```dart
test('creates post', () async {
  final fakeRepo = FakePostRepository();
  final container = ProviderContainer(
    overrides: [
      postRepositoryProvider.overrideWithValue(fakeRepo),
    ],
  );

  final controller = container.read(postsControllerProvider.notifier);
  await controller.createPost('Title', 'Body');
  
  final posts = container.read(postsControllerProvider).value!;
  expect(posts.length, greaterThan(0));
});
```

---

**后续步骤：**
- [API 合约工作流](./api-contract-workflow.md) — 后端 DTO 改变时
- [功能边界](../feature-boundaries.md) — 隔离规则
