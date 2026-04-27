# 设计指南

> 🌐 **语言:** [English](../../design-guidelines.md) · [Tiếng Việt](../vi/design-guidelines.md) · **中文** · [한국어](../ko/design-guidelines.md)

## 主题与配色系统

应用使用 **Material 3**，包含浅色和深色主题。种子颜色为 **Indigo**（Colors.indigo）。

### 主题设置 (apps/mobile/lib/core/theme/app_theme.dart)

```dart
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.indigo,
        brightness: Brightness.light,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.indigo,
        brightness: Brightness.dark,
      ),
    );
  }
}
```

**在 app.dart 中使用：**
```dart
MaterialApp(
  theme: AppTheme.lightTheme,
  darkTheme: AppTheme.darkTheme,
  themeMode: ThemeMode.system,  // 跟随设备设置
);
```

### 颜色令牌

| 令牌 | 浅色 | 深色 | 用途 |
|-------|-------|------|-------|
| **Primary** | Indigo 500 | Indigo 200 | 按钮、高亮、选中状态 |
| **Secondary** | Teal 500 | Teal 200 | 强调、次操作 |
| **Tertiary** | Pink 500 | Pink 200 | 链接、徽章、强调 |
| **Surface** | White | Grey 800 | 卡片、对话框、容器 |
| **Error** | Red 600 | Red 400 | 错误消息、无效状态 |
| **Success** | Green 600 | Green 400 | 成功消息、确认 |
| **Warning** | Amber 600 | Amber 400 | 警告、注意消息 |

**代码访问：**
```dart
final colorScheme = Theme.of(context).colorScheme;
Container(
  color: colorScheme.primary,
  child: Text('Hello', style: TextStyle(color: colorScheme.onPrimary)),
);
```

## 排版比例

Material 3 提供预定义文本主题。使用 `theme.textTheme` 而非硬编码大小。

### 文本样式 (apps/mobile/lib/core/theme/)

| 名称 | 大小 | 粗细 | 用途 |
|------|------|--------|-------|
| **displayLarge** | 57 | 400 | 应用标题、英雄文本 |
| **displayMedium** | 45 | 400 | 主要部分标题 |
| **displaySmall** | 36 | 400 | 页面标题 |
| **headlineLarge** | 32 | 400 | 功能标题 |
| **headlineMedium** | 28 | 400 | 部分标题 |
| **headlineSmall** | 24 | 400 | 卡片标题 |
| **titleLarge** | 22 | 500 | 对话框标题 |
| **titleMedium** | 16 | 500 | 副标题 |
| **titleSmall** | 14 | 500 | 标签 |
| **bodyLarge** | 16 | 400 | 主体文本 |
| **bodyMedium** | 14 | 400 | 副体文本 |
| **bodySmall** | 12 | 400 | 辅助文本、标题 |
| **labelLarge** | 14 | 500 | 按钮文本 |
| **labelMedium** | 12 | 500 | 小标签 |
| **labelSmall** | 11 | 500 | 极小标签 |

**示例用法：**
```dart
// ✗ 不好：硬编码大小
Text('Hello', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold));

// ✓ 好：使用主题
Text(
  'Hello',
  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
    fontWeight: FontWeight.bold,
  ),
);
```

## 间距系统

**基本单位：8 像素。** 所有间距使用 8 的倍数。

| 值 | 像素 | 用途 |
|-------|--------|-------|
| **xs** | 4 | 最小（图标与文本间距） |
| **sm** | 8 | 紧密间距（小组件中的填充） |
| **md** | 16 | 标准（卡片填充、元素间隙） |
| **lg** | 24 | 慷慨（屏幕填充、部分间距） |
| **xl** | 32 | 大（主要部分间距） |
| **2xl** | 48 | 特大（屏幕上下填充） |

**示例：**
```dart
Padding(
  padding: EdgeInsets.all(16),  // md：标准填充
  child: Column(
    spacing: 8,  // sm：项目间紧密
    children: [
      Text('Title'),
      SizedBox(height: 24),  // lg：部分分割
      Text('Content'),
    ],
  ),
);
```

## 组件库

### 可重用组件 (apps/mobile/lib/shared/widgets/)

**LoadingView** — 加载动画含消息
```dart
LoadingView(message: 'Fetching data...');
```

**ErrorView** — 错误消息 + 重试按钮
```dart
ErrorView(
  error: 'Failed to load',
  onRetry: () => ref.refresh(helloControllerProvider),
);
```

**内置 Material 组件：**
- `ElevatedButton`、`TextButton`、`OutlinedButton`
- `TextField`（含 Material 3 轮廓样式）
- `Card`（含 Material 3 升起）
- `Scaffold`、`AppBar`、`FloatingActionButton`
- `SnackBar`（临时消息）

### 组件组合模式

保持组件小（<100 行）。将子组件提取为单独文件。

**示例：**
```
features/hello/presentation/
├── screens/
│   └── hello_screen.dart      # 主屏幕（Router 目标）
└── widgets/
    ├── hello_card.dart         # 可重用问候卡
    └── hello_actions.dart      # 操作按钮
```

```dart
// hello_screen.dart
class HelloScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Hello')),
      body: HelloCard(),  // 已提取
    );
  }
}

// widgets/hello_card.dart
class HelloCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final helloAsync = ref.watch(helloControllerProvider);
    return helloAsync.when(
      data: (hello) => _buildContent(hello),
      loading: () => LoadingView(),
      error: (err, _) => ErrorView(error: err),
    );
  }

  Widget _buildContent(HelloResponseDto hello) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Text(hello.message),
      ),
    );
  }
}
```

## 响应式布局

**无固定宽度容器。** 使用 `Flexible`、`Expanded`、`FractionallySizedBox` 实现响应式。

```dart
// ✗ 不好：平板上固定宽度
Container(width: 300, child: MyWidget());

// ✓ 好：自适应
ConstrainedBox(
  constraints: BoxConstraints(maxWidth: 600),
  child: MyWidget(),
);
```

**平板支持:** 使用 `MediaQuery.of(context).size` 实现断点感知布局。

```dart
final isMobile = MediaQuery.of(context).size.width < 600;
// 为移动与平板构建不同布局
```

## 深色模式

Material 3 主题自动处理深色模式。除非需要每主题自定义颜色，否则无需特殊逻辑。

**测试深色模式：**
```bash
fvm flutter run --dart-define=FLAVOR=dev -v
# 然后从顶部滑动 → 无障碍 → 深色模式（仅模拟器）
# 或真实设备上的系统设置
```

## 无障碍

**指南：**
- **对比度:** 文本在背景上最少 4.5:1（Material 3 处理）
- **触摸目标:** 最小 48×48 dp（Material 按钮遵循）
- **语义:** 使用 `Semantics` 组件用于屏幕阅读器
- **标签:** 所有按钮/图标需 tooltip 或语义标签

**示例：**
```dart
// ✓ 好
IconButton(
  icon: Icon(Icons.close),
  onPressed: () => Navigator.pop(context),
  tooltip: 'Close',  // 屏幕阅读器标签
);
```

## 导航

使用 **go_router**（见 [architecture.md](architecture.md#前端架构)）。

**在 lib/core/router/app_router.dart 中定义路由：**
```dart
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    routes: [
      GoRoute(
        path: '/hello',
        name: 'hello',
        builder: (context, state) => HelloScreen(),
      ),
    ],
  );
});
```

**导航：**
```dart
// 推送命名路由
context.pushNamed('hello');

// 弹出
context.pop();
```

## 动画指南

保持动画 **精妙与目的性：**
- 页面转换：300ms
- 对话框打开：200ms
- 按钮按压反馈：100ms

**使用 Flutter 内置：**
```dart
// ✓ 好：PageRouteBuilder 用于转换
PageRouteBuilder(
  transitionDuration: Duration(milliseconds: 300),
  pageBuilder: (context, animation, secondaryAnimation) => HelloScreen(),
);

// ✓ 好：AnimatedBuilder 用于复杂动画
AnimatedBuilder(
  animation: _controller,
  builder: (context, child) {
    return Transform.translate(
      offset: Offset(_controller.value * 100, 0),
      child: child,
    );
  },
);
```

## 主题最佳实践

1. **永不硬编码颜色。** 始终使用 `theme.colorScheme` 或 `theme.textTheme`。
2. **避免自定义 ThemeData，除非必要。** Material 3 覆盖 95% 用例。
3. **同时测试浅色和深色主题。** 使用 `flutter run -d chrome` 与 DevTools 切换。
4. **使用 `Theme.of(context)` 非 `context.theme`。** 更清晰、更明确。
5. **使用 ARB 文件本地化文本，非静态字符串。** 见 [i18n-guide.md](i18n-guide.md)。

## 自定义组件

若需自定义组件（例如自定义按钮样式），将其放在 `lib/shared/widgets/` 并用示例记录用法。

**模板：**
```dart
/// 具有一致样式的自定义操作按钮。
///
/// 示例：
/// ```dart
/// ActionButton(
///   label: 'Submit',
///   onPressed: () => handleSubmit(),
///   isLoading: false,
/// );
/// ```
class ActionButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isLoading;

  const ActionButton({
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    // 使用主题颜色，非硬编码
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? SizedBox(height: 20, width: 20, child: CircularProgressIndicator())
          : Text(label),
    );
  }
}
```

---

**最后更新:** 2026 年 4 月
