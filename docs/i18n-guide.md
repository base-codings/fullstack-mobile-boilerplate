# i18n Guide

> 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/i18n-guide.md) · [中文](languages/zh/i18n-guide.md) · [한국어](languages/ko/i18n-guide.md)

## Multi-Language Setup

The app uses **ARB (Application Resource Bundle)** format for translations. Files are in `apps/mobile/lib/l10n/`.

### Current Locales

- **English** (`app_en.arb`) — canonical
- **Vietnamese** (`app_vi.arb`) — supported
- **Chinese** (`app_zh.arb`) — extensible
- **Korean** (`app_ko.arb`) — extensible

### ARB File Structure

**Example: app_en.arb**
```json
{
  "@@locale": "en",
  "helloTitle": "Hello",
  "@helloTitle": {
    "description": "Title shown on hello screen"
  },
  "greeting": "Welcome, {name}!",
  "@greeting": {
    "description": "Personalized greeting",
    "placeholders": {
      "name": {
        "type": "String",
        "example": "Alice"
      }
    }
  }
}
```

## Adding New Strings

### Process

1. **Add to English ARB** (`app_en.arb`):
   ```json
   {
     "myNewString": "This is my new string",
     "@myNewString": {
       "description": "Describes when/where used"
     }
   }
   ```

2. **Add to ALL other locale files** immediately (`app_vi.arb`, `app_zh.arb`, `app_ko.arb`):
   - Copy the key structure
   - Translate the value
   - Translate the description

3. **Regenerate** the Dart code:
   ```bash
   cd apps/mobile
   fvm flutter gen-l10n
   ```
   This creates `lib/gen_l10n/app_localizations.dart` + per-locale files.

4. **Use in code:**
   ```dart
   final localizations = AppLocalizations.of(context)!;
   Text(localizations.myNewString);
   ```

### Consequences of Missing Translations

If you add a string to English but **forget to add to Vietnamese**:
- Build still succeeds (Flutter doesn't enforce completeness)
- Vietnamese users see the English string (fallback)
- **Not ideal** — inconsistent experience

**To prevent:** Code review catches missing translations. CI could enforce (optional).

## Pluralization

Use **intl message syntax** for plural forms:

**app_en.arb:**
```json
{
  "itemCount": "{count, plural, =0{No items} one{1 item} other{{count} items}}",
  "@itemCount": {
    "description": "Number of items in a list",
    "placeholders": {
      "count": {
        "type": "int",
        "example": "3"
      }
    }
  }
}
```

**app_vi.arb:**
```json
{
  "itemCount": "{count, plural, =0{Không có mục nào} one{1 mục} other{{count} mục}}",
  "@itemCount": {
    "description": "Số lượng mục trong danh sách",
    "placeholders": {
      "count": {
        "type": "int",
        "example": "3"
      }
    }
  }
}
```

**Usage:**
```dart
final localizations = AppLocalizations.of(context)!;
Text(localizations.itemCount(items.length));
```

## Tone Guidelines

### English

- **Friendly:** "Oops!" instead of "Error occurred"
- **Concise:** Avoid unnecessary words
- **Active voice:** "Save your changes" not "Changes should be saved"
- **Lowercase except proper nouns:** "Enter your email" not "Enter Your Email"
- **Action-oriented buttons:** "Delete Account" not "Confirm Deletion"

**Examples:**
```
✓ "Save your progress"
✗ "The progress has been saved"

✓ "Oops, something went wrong"
✗ "An error has been encountered"

✓ "Sign in"
✗ "Please sign in"
```

### Vietnamese

- **Native words preferred** — avoid English loanwords when a natural Vietnamese word exists
- **Polite but direct:** "Vui lòng" (please) used sparingly
- **Lowercase:** "nhập email của bạn" not "Nhập Email Của Bạn"
- **Avoid Anglicisms:** "đăng nhập" not "login", "lưu" not "save" (actually "lưu" is Vietnamese, use it), "hình ảnh" not "image" (actually native), "email" okay (no good equivalent)

**Examples:**
```
✓ "Lưu tiến trình của bạn" (Save your progress)
✗ "Tiến trình đã được save" (mixing Vietnamese + English)

✓ "Oops, có điều gì đó không ổn" (Oops, something isn't right)
✗ "Một lỗi đã xảy ra" (An error has occurred — formal/stiff)

✓ "Đăng nhập" (Sign in)
✗ "Vui lòng đăng nhập vào hệ thống" (Please sign in to the system — overly formal)
```

**Common Vietnamese translations:**
| English | Vietnamese | Notes |
|---------|-----------|-------|
| Error | Lỗi | |
| Success | Thành công | |
| Loading | Đang tải | |
| Save | Lưu | |
| Delete | Xóa | |
| Cancel | Hủy | |
| Confirm | Xác nhận | |
| Close | Đóng | |
| Next | Tiếp theo | |
| Back | Quay lại | |

### Simplified Chinese

- **Direct, technical tone** — avoid flowery language
- **Concise character count** — Chinese is already compact; don't be verbose
- **Formal register:** "请" (please) acceptable
- **Traditional terminology:** "用户" (user), "设置" (settings), "界面" (interface)

**Examples:**
```
✓ "保存您的进度" (Save your progress)
✗ "您的进度已被保存" (Your progress has been saved — passive)

✓ "哎呀，出错了" (Oops, error)
✗ "系统遇到了一个错误" (The system encountered an error — formal)

✓ "登入" (Sign in)
✗ "请登入系统" (Please sign in to the system)
```

### Korean

- **Polite formal register** (~습니다) standard
- **Native Korean preferred** over English loanwords, but tech terms okay
- **Subject+Object+Verb (SOV) word order** — follow naturally
- **Particle usage:** 을/를 (object), 이/가 (subject)

**Examples:**
```
✓ "진행 상황을 저장하세요" (Save your progress)
✗ "진행 상황이 저장되었습니다" (Passive/stiff)

✓ "어라, 뭔가 잘못되었어요" (Oops, something went wrong)
✗ "시스템에서 오류가 발생했습니다" (System encountered error — formal)

✓ "로그인" (Sign in — tech term, acceptable)
✗ "시스템에 로그인하십시오" (Sign in to the system — overly formal)
```

## Adding a New Locale

**Example: Adding Portuguese (pt)**

1. **Create app_pt.arb** in `apps/mobile/lib/l10n/`:
   ```json
   {
     "@@locale": "pt",
     "helloTitle": "Olá",
     "greeting": "Bem-vindo, {name}!",
     ...
   }
   ```
   (Copy all keys from app_en.arb, translate values)

2. **Update pubspec.yaml** (optional, for IDE support):
   ```yaml
   flutter:
     generate: true
     supported-locales:
       - en
       - vi
       - zh
       - pt
   ```

3. **Regenerate:**
   ```bash
   fvm flutter gen-l10n
   ```

4. **Enable in app.dart:**
   ```dart
   MaterialApp(
     localizationsDelegates: AppLocalizations.localizationsDelegates,
     supportedLocales: AppLocalizations.supportedLocales,  // Auto-updated
     ...
   )
   ```

5. **Commit** both `app_pt.arb` and regenerated `app_localizations_pt.dart`.

## Code Examples

### Simple String

**ARB:**
```json
{
  "appTitle": "Mobile Boilerplate"
}
```

**Usage:**
```dart
Text(AppLocalizations.of(context)!.appTitle)
```

### String with Placeholder

**ARB:**
```json
{
  "welcome": "Welcome, {name}!",
  "@welcome": {
    "placeholders": {
      "name": { "type": "String" }
    }
  }
}
```

**Usage:**
```dart
Text(AppLocalizations.of(context)!.welcome('Alice'))
```

### Pluralization

**ARB:**
```json
{
  "itemCount": "{count, plural, =0{No items} one{1 item} other{{count} items}}",
  "@itemCount": {
    "placeholders": {
      "count": { "type": "int" }
    }
  }
}
```

**Usage:**
```dart
Text(AppLocalizations.of(context)!.itemCount(5))  // "5 items"
```

### Gender-Based Forms (Advanced)

**ARB:**
```json
{
  "userRole": "{gender, select, male{He is} female{She is} other{They are}} an admin",
  "@userRole": {
    "placeholders": {
      "gender": {
        "type": "String",
        "example": "male"
      }
    }
  }
}
```

**Usage:**
```dart
Text(AppLocalizations.of(context)!.userRole('female'))  // "She is an admin"
```

## Best Practices

1. **Keep keys descriptive:** `submitButtonLabel` not `btn1`
2. **Group related strings:** All user-related messages share a prefix (optional but helps)
3. **Test all locales:** Switch device language and verify text displays correctly
4. **Avoid context-specific strings:** "Click here" not translatable; use "Submit" instead
5. **Use sentence case:** "Save your work" not "Save Your Work"
6. **No hardcoded strings in code:** Always use `AppLocalizations.of(context)!.key`
7. **Add descriptions to every key:** Helps translators understand context
8. **Update all locales together:** Never add English without adding to other languages

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Forgot to translate new key | Users see English (fallback) | Add translation to all ARB files |
| Hardcoded string in code | Not translatable | Use `AppLocalizations.of(context)!.key` |
| Changed key but didn't update code | Build error | Search/replace old key → new |
| Nested placeholders | Syntax error | Use flat structure, concatenate in code if needed |
| Different parameter counts per language | Runtime crash | Match parameter count across all locales |

---

**Last updated:** April 2026
