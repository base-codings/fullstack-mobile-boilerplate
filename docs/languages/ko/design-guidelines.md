# 디자인 가이드라인

> 🌐 **언어:** [English](../../design-guidelines.md) · [Tiếng Việt](../vi/design-guidelines.md) · [中文](../zh/design-guidelines.md) · **한국어**

## 테마 & 색상 시스템

앱은 **Material 3** light와 dark 테마를 사용합니다. Seed 색상은 **Indigo** (Colors.indigo).

### 테마 설정 (apps/mobile/lib/core/theme/app_theme.dart)

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

**app.dart에서 사용:**
```dart
MaterialApp(
  theme: AppTheme.lightTheme,
  darkTheme: AppTheme.darkTheme,
  themeMode: ThemeMode.system,  // 기기 설정 따르기
);
```

### 색상 토큰

| 토큰 | Light | Dark | 사용처 |
|-------|-------|------|-------|
| **Primary** | Indigo 500 | Indigo 200 | 버튼, 강조, 선택 상태 |
| **Secondary** | Teal 500 | Teal 200 | 액센트, 보조 작업 |
| **Tertiary** | Pink 500 | Pink 200 | 링크, 배지, 강조 |
| **Surface** | White | Grey 800 | Card, 대화, 컨테이너 |
| **Error** | Red 600 | Red 400 | 오류 메시지, 유효하지 않은 상태 |
| **Success** | Green 600 | Green 400 | 성공 메시지, 확인 |
| **Warning** | Amber 600 | Amber 400 | 경고, 주의 메시지 |

**코드에서 접근:**
```dart
final colorScheme = Theme.of(context).colorScheme;
Container(
  color: colorScheme.primary,
  child: Text('Hello', style: TextStyle(color: colorScheme.onPrimary)),
);
```

## 타이포그래피 스케일

Material 3는 사전 정의된 텍스트 테마를 제공합니다. 크기를 하드코딩하지 말고 `theme.textTheme`을 사용.

### 텍스트 스타일 (apps/mobile/lib/core/theme/)

| 이름 | 크기 | 굵기 | 사용처 |
|------|------|--------|-------|
| **displayLarge** | 57 | 400 | 앱 제목, hero 텍스트 |
| **displayMedium** | 45 | 400 | 주요 섹션 헤더 |
| **displaySmall** | 36 | 400 | 페이지 제목 |
| **headlineLarge** | 32 | 400 | 기능 헤더 |
| **headlineMedium** | 28 | 400 | 섹션 헤더 |
| **headlineSmall** | 24 | 400 | Card 헤더 |
| **titleLarge** | 22 | 500 | 대화 제목 |
| **titleMedium** | 16 | 500 | 서브헤더 |
| **titleSmall** | 14 | 500 | 라벨 |
| **bodyLarge** | 16 | 400 | 주 본문 텍스트 |
| **bodyMedium** | 14 | 400 | 보조 본문 텍스트 |
| **bodySmall** | 12 | 400 | 도우미 텍스트, 캡션 |
| **labelLarge** | 14 | 500 | 버튼 텍스트 |
| **labelMedium** | 12 | 500 | 작은 라벨 |
| **labelSmall** | 11 | 500 | 아주 작은 라벨 |

**예시 사용:**
```dart
// ✗ 나쁨: 하드코딩된 크기
Text('Hello', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold));

// ✓ 좋음: 테마 사용
Text(
  'Hello',
  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
    fontWeight: FontWeight.bold,
  ),
);
```

## 간격 시스템

**기본 단위: 8픽셀.** 모든 간격은 8의 배수.

| 값 | 픽셀 | 사용처 |
|-------|--------|-------|
| **xs** | 4 | 최소 (아이콘-텍스트 간격) |
| **sm** | 8 | 타이트 간격 (작은 widget 패딩) |
| **md** | 16 | 표준 (card 패딩, 요소 간 간격) |
| **lg** | 24 | 여유 있는 (화면 패딩, 섹션 간격) |
| **xl** | 32 | 큰 (주요 섹션 간 간격) |
| **2xl** | 48 | 매우 큼 (화면 상단/하단 패딩) |

**예시:**
```dart
Padding(
  padding: EdgeInsets.all(16),  // md: 표준 패딩
  child: Column(
    spacing: 8,  // sm: 항목 간 타이트
    children: [
      Text('Title'),
      SizedBox(height: 24),  // lg: 섹션 나누기
      Text('Content'),
    ],
  ),
);
```

## 컴포넌트 라이브러리

### 재사용 가능한 위젯 (apps/mobile/lib/shared/widgets/)

**LoadingView** — 스피너 with 메시지
```dart
LoadingView(message: 'Fetching data...');
```

**ErrorView** — 오류 메시지 + 재시도 버튼
```dart
ErrorView(
  error: 'Failed to load',
  onRetry: () => ref.refresh(helloControllerProvider),
);
```

**Built-in Material 위젯:**
- `ElevatedButton`, `TextButton`, `OutlinedButton`
- `TextField` (Material 3 outline 스타일)
- `Card` (Material 3 elevation)
- `Scaffold`, `AppBar`, `FloatingActionButton`
- `SnackBar` (일시적 메시지)

### 위젯 구성 패턴

위젯을 작게 유지 (<100줄). sub-widget을 분리된 파일로 추출.

**예시:**
```
features/hello/presentation/
├── screens/
│   └── hello_screen.dart      # 메인 화면 (Router 대상)
└── widgets/
    ├── hello_card.dart         # 재사용 가능한 greeting card
    └── hello_actions.dart      # 작업 버튼
```

```dart
// hello_screen.dart
class HelloScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Hello')),
      body: HelloCard(),  // 추출됨
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

## 반응형 레이아웃

**고정 너비 컨테이너 없음.** 반응형으로 `Flexible`, `Expanded`, `FractionallySizedBox` 사용.

```dart
// ✗ 나쁨: 태블릿에서 고정 너비
Container(width: 300, child: MyWidget());

// ✓ 좋음: 적응형
ConstrainedBox(
  constraints: BoxConstraints(maxWidth: 600),
  child: MyWidget(),
);
```

**태블릿 지원:** breakpoint 인식 레이아웃을 위해 `MediaQuery.of(context).size` 사용.

```dart
final isMobile = MediaQuery.of(context).size.width < 600;
// 모바일 vs 태블릿에 다른 레이아웃 구축
```

## Dark Mode

Material 3 테마는 자동으로 dark mode 처리합니다. 테마당 커스텀 색상이 필요한 경우를 제외하고 특별한 로직 없음.

**Dark mode 테스트:**
```bash
fvm flutter run --dart-define=FLAVOR=dev -v
# 상단에서 스와이프 → 접근성 → Dark mode (에뮬레이터만)
# 또는 실제 기기의 시스템 설정
```

## 접근성

**가이드라인:**
- **대비:** 배경에서 텍스트 최소 4.5:1 (Material 3 처리)
- **터치 대상:** 최소 48×48 dp (Material 버튼이 따름)
- **의미론:** 스크린 리더를 위해 `Semantics` 위젯 사용
- **라벨:** 모든 버튼/아이콘은 tooltip 또는 의미론적 라벨 필요

**예시:**
```dart
// ✓ 좋음
IconButton(
  icon: Icon(Icons.close),
  onPressed: () => Navigator.pop(context),
  tooltip: 'Close',  // 스크린 리더 라벨
);
```

## 네비게이션

**go_router** 사용 ([system-architecture.md](system-architecture.md#프론트엔드-아키텍처) 참고).

**lib/core/router/app_router.dart에서 라우트 정의:**
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

**네비게이트:**
```dart
// 이름으로 라우트 푸시
context.pushNamed('hello');

// 팝
context.pop();
```

## 애니메이션 가이드라인

애니메이션은 **미묘하고 목적 있게:**
- 페이지 전환: 300ms
- 대화 열기: 200ms
- 버튼 누르기 피드백: 100ms

**Flutter 내장 사용:**
```dart
// ✓ 좋음: 전환을 위한 PageRouteBuilder
PageRouteBuilder(
  transitionDuration: Duration(milliseconds: 300),
  pageBuilder: (context, animation, secondaryAnimation) => HelloScreen(),
);

// ✓ 좋음: 복잡한 애니메이션을 위한 AnimatedBuilder
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

## 테마 best practice

1. **색상 하드코딩 금지.** 항상 `theme.colorScheme` 또는 `theme.textTheme` 사용.
2. **필요하지 않으면 커스텀 ThemeData 피하기.** Material 3는 95% 사용 사례 커버.
3. **Light와 dark 테마 모두 테스트.** `flutter run -d chrome`에서 DevTools로 전환.
4. **`context.theme` 아닌 `Theme.of(context)` 사용.** 더 명확하고 명시적.
5. **정적 문자열이 아닌 ARB 파일로 텍스트 로컬화.** [i18n-tone-guide.md](i18n-tone-guide.md) 참고.

## 커스텀 위젯

커스텀 위젯이 필요한 경우 (예: 커스텀 버튼 스타일), `lib/shared/widgets/`에 배치하고 예시로 사용법 문서화.

**템플릿:**
```dart
/// 일관된 스타일의 커스텀 작업 버튼.
///
/// 예시:
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
    // 하드코딩 대신 테마 색상 사용
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

**최종 업데이트:** 2026년 4월
