# Design Guidelines

> 🌐 **Ngôn ngữ:** [English](../../design-guidelines.md) · **Tiếng Việt** · [中文](../zh/design-guidelines.md) · [한국어](../ko/design-guidelines.md)

## Theme & Color System

App sử dụng **Material 3** với light và dark themes. Seed color là **Indigo** (Colors.indigo).

### Theme Setup (apps/mobile/lib/core/theme/app_theme.dart)

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

**Used in app.dart:**
```dart
MaterialApp(
  theme: AppTheme.lightTheme,
  darkTheme: AppTheme.darkTheme,
  themeMode: ThemeMode.system,  // Follow device setting
);
```

### Color Tokens

| Token | Light | Dark | Sử Dụng |
|-------|-------|------|-------|
| **Primary** | Indigo 500 | Indigo 200 | Buttons, highlights, selected states |
| **Secondary** | Teal 500 | Teal 200 | Accents, secondary actions |
| **Tertiary** | Pink 500 | Pink 200 | Links, badges, emphasis |
| **Surface** | White | Grey 800 | Cards, dialogs, containers |
| **Error** | Red 600 | Red 400 | Error messages, invalid states |
| **Success** | Green 600 | Green 400 | Success messages, confirmations |
| **Warning** | Amber 600 | Amber 400 | Warnings, caution messages |

**Access in code:**
```dart
final colorScheme = Theme.of(context).colorScheme;
Container(
  color: colorScheme.primary,
  child: Text('Hello', style: TextStyle(color: colorScheme.onPrimary)),
);
```

## Typography Scale

Material 3 provides a predefined text theme. Use `theme.textTheme` instead of hardcoding sizes.

### Text Styles (apps/mobile/lib/core/theme/)

| Tên | Size | Weight | Sử Dụng |
|------|------|--------|-------|
| **displayLarge** | 57 | 400 | App title, hero text |
| **displayMedium** | 45 | 400 | Major section headers |
| **displaySmall** | 36 | 400 | Page headings |
| **headlineLarge** | 32 | 400 | Feature headers |
| **headlineMedium** | 28 | 400 | Section headers |
| **headlineSmall** | 24 | 400 | Card headers |
| **titleLarge** | 22 | 500 | Dialog titles |
| **titleMedium** | 16 | 500 | Subheaders |
| **titleSmall** | 14 | 500 | Labels |
| **bodyLarge** | 16 | 400 | Primary body text |
| **bodyMedium** | 14 | 400 | Secondary body text |
| **bodySmall** | 12 | 400 | Helper text, captions |
| **labelLarge** | 14 | 500 | Button text |
| **labelMedium** | 12 | 500 | Small labels |
| **labelSmall** | 11 | 500 | Tiny labels |

**Example usage:**
```dart
// ✗ BAD: Hardcoded size
Text('Hello', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold));

// ✓ GOOD: Use theme
Text(
  'Hello',
  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
    fontWeight: FontWeight.bold,
  ),
);
```

## Spacing System

**Base unit: 8 pixels.** All spacing uses multiples of 8.

| Giá Trị | Pixels | Sử Dụng |
|-------|--------|-------|
| **xs** | 4 | Minimal (icon-to-text spacing) |
| **sm** | 8 | Tight spacing (padding in small widgets) |
| **md** | 16 | Standard (padding in cards, gaps between elements) |
| **lg** | 24 | Generous (padding in screens, section spacing) |
| **xl** | 32 | Large (spacing between major sections) |
| **2xl** | 48 | Extra large (screen top/bottom padding) |

**Example:**
```dart
Padding(
  padding: EdgeInsets.all(16),  // md: standard padding
  child: Column(
    spacing: 8,  // sm: tight between items
    children: [
      Text('Title'),
      SizedBox(height: 24),  // lg: section break
      Text('Content'),
    ],
  ),
);
```

## Component Library

### Reusable Widgets (apps/mobile/lib/shared/widgets/)

**LoadingView** — spinner with message
```dart
LoadingView(message: 'Fetching data...');
```

**ErrorView** — error message + retry button
```dart
ErrorView(
  error: 'Failed to load',
  onRetry: () => ref.refresh(helloControllerProvider),
);
```

**Built-in Material widgets:**
- `ElevatedButton`, `TextButton`, `OutlinedButton`
- `TextField` (with Material 3 outline style)
- `Card` (with Material 3 elevation)
- `Scaffold`, `AppBar`, `FloatingActionButton`
- `SnackBar` (for transient messages)

### Widget Composition Pattern

Keep widgets small (<100 lines). Extract sub-widgets into separate files.

**Example:**
```
features/hello/presentation/
├── screens/
│   └── hello_screen.dart      # Main screen (Router target)
└── widgets/
    ├── hello_card.dart         # Reusable greeting card
    └── hello_actions.dart      # Action buttons
```

```dart
// hello_screen.dart
class HelloScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Hello')),
      body: HelloCard(),  // Extracted
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

## Responsive Layout

**No fixed width containers.** Use `Flexible`, `Expanded`, `FractionallySizedBox` for responsiveness.

```dart
// ✗ BAD: Fixed width on tablet
Container(width: 300, child: MyWidget());

// ✓ GOOD: Adaptive
ConstrainedBox(
  constraints: BoxConstraints(maxWidth: 600),
  child: MyWidget(),
);
```

**Tablet support:** Use `MediaQuery.of(context).size` for breakpoint-aware layouts.

```dart
final isMobile = MediaQuery.of(context).size.width < 600;
// Build different layouts for mobile vs tablet
```

## Dark Mode

Material 3 theme automatically handles dark mode. No special logic needed unless you want custom colors per theme.

**Test dark mode:**
```bash
fvm flutter run --dart-define=FLAVOR=dev -v
# Then swipe from top → Accessibility → Dark mode (emulator only)
# Or system settings on real device
```

## Accessibility

**Guidelines:**
- **Contrast:** Minimum 4.5:1 for text on backgrounds (Material 3 handles this)
- **Touch targets:** Minimum 48×48 dp (Material buttons follow this)
- **Semantics:** Use `Semantics` widget for screen readers
- **Labels:** All buttons/icons must have tooltip or semantic label

**Example:**
```dart
// ✓ GOOD
IconButton(
  icon: Icon(Icons.close),
  onPressed: () => Navigator.pop(context),
  tooltip: 'Close',  // Screen reader label
);
```

## Navigation

Uses **go_router** (see [architecture.md](architecture.md#frontend-architecture)).

**Define routes in lib/core/router/app_router.dart:**
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

**Navigate:**
```dart
// Push named route
context.pushNamed('hello');

// Pop
context.pop();
```

## Animation Guidelines

Keep animations **subtle and purposeful:**
- Page transitions: 300ms
- Dialog open: 200ms
- Button press feedback: 100ms

**Use Flutter's built-in:**
```dart
// ✓ GOOD: PageRouteBuilder for transition
PageRouteBuilder(
  transitionDuration: Duration(milliseconds: 300),
  pageBuilder: (context, animation, secondaryAnimation) => HelloScreen(),
);

// ✓ GOOD: AnimatedBuilder for complex animations
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

## Theming Best Practices

1. **Never hardcode colors.** Always use `theme.colorScheme` or `theme.textTheme`.
2. **Avoid custom ThemeData unless necessary.** Material 3 covers 95% of use cases.
3. **Test both light and dark themes.** Use `flutter run -d chrome` with DevTools to switch.
4. **Use `Theme.of(context)` not `context.theme`.** Clearer and more explicit.
5. **Localize text using ARB files, not static strings.** See [i18n-guide.md](i18n-guide.md).

## Custom Widgets

If you need a custom widget (e.g., custom button style), place it in `lib/shared/widgets/` and document its usage with an example.

**Template:**
```dart
/// A custom action button with consistent styling.
///
/// Example:
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
    // Use theme colors, not hardcoded
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

**Last updated:** April 2026
