# i18n 指南

> 🌐 **语言:** [English](../../i18n-guide.md) · [Tiếng Việt](../vi/i18n-guide.md) · **中文** · [한국어](../ko/i18n-guide.md)

## 多语言设置

应用使用 **ARB（应用资源包）** 格式进行翻译。文件位于 `apps/mobile/lib/l10n/`。

### 当前语言环境

- **英文** (`app_en.arb`) — 规范
- **越南文** (`app_vi.arb`) — 已支持
- **中文** (`app_zh.arb`) — 可扩展
- **韩文** (`app_ko.arb`) — 可扩展

### ARB 文件结构

**示例：app_en.arb**
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

## 添加新字符串

### 流程

1. **添加到英文 ARB** (`app_en.arb`)：
   ```json
   {
     "myNewString": "This is my new string",
     "@myNewString": {
       "description": "Describes when/where used"
     }
   }
   ```

2. **立即添加到所有其他语言文件** (`app_vi.arb`、`app_zh.arb`、`app_ko.arb`)：
   - 复制键结构
   - 翻译值
   - 翻译描述

3. **重新生成** Dart 代码：
   ```bash
   cd apps/mobile
   fvm flutter gen-l10n
   ```
   这创建 `lib/gen_l10n/app_localizations.dart` + 每语言文件。

4. **在代码中使用：**
   ```dart
   final localizations = AppLocalizations.of(context)!;
   Text(localizations.myNewString);
   ```

### 缺少翻译的后果

若添加字符串到英文但 **忘记添加到越南文**：
- 构建仍成功（Flutter 不强制完整性）
- 越南语用户看到英文字符串（回滚）
- **不理想** — 不一致的体验

**防止：** 代码审查捕获缺少翻译。CI 可强制（可选）。

## 复数形式

使用 **intl 消息语法** 处理复数形式：

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

**app_zh.arb:**
```json
{
  "itemCount": "{count, plural, =0{无项目} one{1 项} other{{count} 项}}",
  "@itemCount": {
    "description": "列表中的项目数",
    "placeholders": {
      "count": {
        "type": "int",
        "example": "3"
      }
    }
  }
}
```

**用法：**
```dart
final localizations = AppLocalizations.of(context)!;
Text(localizations.itemCount(items.length));
```

## 音调指南

### 英文

- **友好:** "Oops!" 而非 "Error occurred"
- **简洁:** 避免不必要词语
- **主动语态:** "Save your changes" 而非 "Changes should be saved"
- **小写除专有名词:** "Enter your email" 而非 "Enter Your Email"
- **操作导向按钮:** "Delete Account" 而非 "Confirm Deletion"

**示例：**
```
✓ "Save your progress"
✗ "The progress has been saved"

✓ "Oops, something went wrong"
✗ "An error has been encountered"

✓ "Sign in"
✗ "Please sign in"
```

### 越南文

- **本地词优先** — 当自然越南词存在时避免英文借词
- **礼貌但直接:** "Vui lòng"（请）谨慎使用
- **小写:** "nhập email của bạn" 而非 "Nhập Email Của Bạn"
- **避免英文主义:** "đăng nhập" 而非 "login"、"lưu" 而非"save"、"hình ảnh" 而非 "image"、"email" 可接受（无好替代）

**示例：**
```
✓ "Lưu tiến trình của bạn"（保存进度）
✗ "Tiến trình đã được save"（混合越南文 + 英文）

✓ "Oops, có điều gì đó không ổn"（Oops，出问题了）
✗ "Một lỗi đã xảy ra"（发生错误 — 正式/生硬）

✓ "Đăng nhập"（登录）
✗ "Vui lòng đăng nhập vào hệ thống"（请登录系统 — 过分正式）
```

**常见越南文翻译：**
| 英文 | 越南文 | 说明 |
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

### 简体中文

- **直接、技术音调** — 避免华丽措辞
- **简洁字数** — 中文已很紧凑；不要冗长
- **正式寄存器:** "请"（please）可接受
- **传统术语:** "用户"（user）、"设置"（settings）、"界面"（interface）

**示例：**
```
✓ "保存您的进度"
✗ "您的进度已被保存"（被动）

✓ "哎呀，出错了"
✗ "系统遇到了一个错误"（正式）

✓ "登入"
✗ "请登入系统"
```

### 韩文

- **礼貌正式寄存器** (~습니다) 标准
- **本地韩文优先** 于英文借词，但技术术语可以
- **主宾谓 (SOV) 词序** — 自然遵循
- **助词用法:** 을/를（宾语）、이/가（主语）

**示例：**
```
✓ "진행 상황을 저장하세요"（保存您的进度）
✗ "진행 상황이 저장되었습니다"（被动/生硬）

✓ "어라, 뭔가 잘못되었어요"（Oops，出问题了）
✗ "시스템에서 오류가 발생했습니다"（系统遇到错误 — 正式）

✓ "로그인"（登入 — 技术术语，可接受）
✗ "시스템에 로그인하십시오"（登入系统 — 过分正式）
```

## 添加新语言环境

**示例：添加葡萄牙文 (pt)**

1. **创建 app_pt.arb** 在 `apps/mobile/lib/l10n/`：
   ```json
   {
     "@@locale": "pt",
     "helloTitle": "Olá",
     "greeting": "Bem-vindo, {name}!",
     ...
   }
   ```
   （从 app_en.arb 复制所有键，翻译值）

2. **更新 pubspec.yaml**（可选，IDE 支持）：
   ```yaml
   flutter:
     generate: true
     supported-locales:
       - en
       - vi
       - zh
       - pt
   ```

3. **重新生成：**
   ```bash
   fvm flutter gen-l10n
   ```

4. **在 app.dart 中启用：**
   ```dart
   MaterialApp(
     localizationsDelegates: AppLocalizations.localizationsDelegates,
     supportedLocales: AppLocalizations.supportedLocales,  // 自动更新
     ...
   )
   ```

5. **提交** 两个 `app_pt.arb` 和重新生成的 `app_localizations_pt.dart`。

## 代码示例

### 简单字符串

**ARB：**
```json
{
  "appTitle": "Mobile Boilerplate"
}
```

**用法：**
```dart
Text(AppLocalizations.of(context)!.appTitle)
```

### 含占位符的字符串

**ARB：**
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

**用法：**
```dart
Text(AppLocalizations.of(context)!.welcome('Alice'))
```

### 复数形式

**ARB：**
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

**用法：**
```dart
Text(AppLocalizations.of(context)!.itemCount(5))  // "5 items"
```

### 基于性别的形式（高级）

**ARB：**
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

**用法：**
```dart
Text(AppLocalizations.of(context)!.userRole('female'))  // "She is an admin"
```

## 最佳实践

1. **保持键描述性:** `submitButtonLabel` 而非 `btn1`
2. **分组相关字符串:** 所有用户相关消息共享前缀（可选但有帮助）
3. **测试所有语言环境:** 切换设备语言并验证文本显示正确
4. **避免上下文特定字符串:** "点击这里"不可翻译；使用"提交"代替
5. **使用句子格式:** "Save your work" 而非 "Save Your Work"
6. **无代码中硬编码字符串:** 始终使用 `AppLocalizations.of(context)!.key`
7. **为每个键添加描述:** 帮助译者理解上下文
8. **同时更新所有语言环境:** 永不仅添加英文而不添加其他语言

## 常见错误

| 错误 | 影响 | 修复 |
|---------|--------|-----|
| 忘记翻译新键 | 用户看到英文（回滚） | 添加翻译到所有 ARB 文件 |
| 代码中硬编码字符串 | 不可翻译 | 使用 `AppLocalizations.of(context)!.key` |
| 改变键但未更新代码 | 构建错误 | 搜索/替换旧键 → 新 |
| 嵌套占位符 | 语法错误 | 使用平坦结构，代码中串联（如需） |
| 不同参数计数/语言 | 运行时崩溃 | 匹配所有语言环境的参数计数 |

---

**最后更新:** 2026 年 4 月
