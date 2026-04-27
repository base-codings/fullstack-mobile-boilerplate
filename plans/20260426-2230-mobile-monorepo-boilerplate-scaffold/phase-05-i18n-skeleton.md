# Phase 05 — i18n Skeleton

> Plan: [plan.md](./plan.md)

## Overview

- **Priority:** Medium — không block hello flow nhưng cần để boilerplate "complete"
- **Status:** completed
- **Depends on:** Phase 04
- **Description:** Setup `flutter_localizations` + `intl` + `gen_l10n`. Tạo arb files (en, vi). Wire vào HelloScreen để verify hoạt động.

## Key Insights

- Flutter standard tooling: `flutter_localizations` + `intl` + `gen_l10n` (built-in, không cần package thêm).
- ARB files ở `lib/l10n/`. Generated code ở `.dart_tool/flutter_gen/gen_l10n/` → import qua `package:flutter_gen/gen_l10n/app_localizations.dart`.
- Locale resolution mặc định theo system, có thể override programmatic qua provider sau (skip cho phase này).
- Vi default sẽ là tiếng Việt (Vietnam), en là English.

## Requirements

**Functional:**
- 2 locale support: en (default), vi
- ARB keys mẫu: `helloTitle`, `helloLoading`, `helloErrorRetry`, `helloRefresh`
- HelloScreen hiển thị string từ AppLocalizations (không hardcode)
- Auto-detect device locale, fallback en

**Non-functional:**
- `fvm flutter gen-l10n` chạy auto trong build
- Hot reload locale change (system level)

## Architecture

```
apps/mobile/
├── l10n.yaml                          # config gen-l10n
├── lib/
│   └── l10n/
│       ├── app_en.arb
│       └── app_vi.arb
└── (generated) .dart_tool/flutter_gen/gen_l10n/app_localizations.dart
```

## Related Code Files

**Create:**
- `apps/mobile/l10n.yaml`
- `apps/mobile/lib/l10n/app_en.arb`
- `apps/mobile/lib/l10n/app_vi.arb`

**Modify:**
- `apps/mobile/pubspec.yaml` — bật `generate: true` trong `flutter:` block
- `apps/mobile/lib/app.dart` — thêm `localizationsDelegates` + `supportedLocales`
- `apps/mobile/lib/features/hello/presentation/screens/hello_screen.dart` — replace hardcoded strings

## Implementation Steps

1. Update `apps/mobile/pubspec.yaml`:
   ```yaml
   dependencies:
     flutter_localizations:
       sdk: flutter
     intl: any   # let flutter_localizations resolve
   flutter:
     generate: true
     uses-material-design: true
     # ... assets ...
   ```
2. Tạo `apps/mobile/l10n.yaml`:
   ```yaml
   arb-dir: lib/l10n
   template-arb-file: app_en.arb
   output-localization-file: app_localizations.dart
   output-class: AppLocalizations
   nullable-getter: false
   ```
3. Tạo `apps/mobile/lib/l10n/app_en.arb`:
   ```json
   {
     "@@locale": "en",
     "helloTitle": "Hello",
     "@helloTitle": { "description": "Hello screen app bar title" },
     "helloLoading": "Loading...",
     "helloErrorRetry": "Retry",
     "helloRefresh": "Refresh"
   }
   ```
4. Tạo `apps/mobile/lib/l10n/app_vi.arb`:
   ```json
   {
     "@@locale": "vi",
     "helloTitle": "Xin chào",
     "helloLoading": "Đang tải...",
     "helloErrorRetry": "Thử lại",
     "helloRefresh": "Làm mới"
   }
   ```
5. `fvm flutter gen-l10n` (hoặc `fvm flutter pub get` auto trigger)
6. Update `apps/mobile/lib/app.dart`:
   ```dart
   import 'package:flutter_localizations/flutter_localizations.dart';
   import 'package:flutter_gen/gen_l10n/app_localizations.dart';

   MaterialApp.router(
     // ... existing
     localizationsDelegates: AppLocalizations.localizationsDelegates,
     supportedLocales: AppLocalizations.supportedLocales,
   )
   ```
7. Update `hello_screen.dart`:
   ```dart
   final l10n = AppLocalizations.of(context);
   AppBar(title: Text(l10n.helloTitle))
   // loading: Text(l10n.helloLoading)
   // error retry button: Text(l10n.helloErrorRetry)
   ```
8. Verify:
   - `fvm flutter analyze` pass
   - Run app with system locale = English → "Hello"
   - Change emulator locale → Vietnamese → "Xin chào"
   - `fvm flutter gen-l10n` regen không lỗi

## Todo List

- [x] pubspec.yaml: flutter_localizations, intl, generate: true
- [x] l10n.yaml
- [x] app_en.arb với 4 keys
- [x] app_vi.arb với 4 keys
- [x] Run gen-l10n
- [x] app.dart: localizationsDelegates + supportedLocales
- [x] hello_screen.dart: replace strings
- [x] Verify EN + VI rendering
- [x] Commit

## Success Criteria

- ARB files compile, generate `AppLocalizations`
- HelloScreen render đúng string theo locale
- Thay đổi locale system → UI cập nhật
- `fvm flutter analyze` pass
- Không hardcode string nào trong hello_screen.dart

## Risk Assessment

| Risk | Mitigation |
|---|---|
| `nullable-getter: false` yêu cầu mọi locale phải có đầy đủ key | Tooling tự fail nếu thiếu; doc trong i18n-tone-guide.md |
| Generated code commit hay không | Mặc định không commit (có trong `.gitignore`); CI tự `flutter pub get` |
| Add new locale (zh, ko) sau này | Doc rõ trong `i18n-tone-guide.md`: copy `app_en.arb` → `app_zh.arb`, dịch, regen |

## Security Considerations

- ARB files plain text, không chứa secret
- User-facing strings không expose internal info

## Next Steps

→ Phase 11 sẽ tạo `docs/i18n-tone-guide.md` với hướng dẫn dịch + tone of voice.
