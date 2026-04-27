# i18n 가이드

> 🌐 **언어:** [English](../../i18n-guide.md) · [Tiếng Việt](../vi/i18n-guide.md) · [中文](../zh/i18n-guide.md) · **한국어**

## 다국어 설정

앱은 **ARB (Application Resource Bundle)** 형식을 번역에 사용합니다. 파일은 `apps/mobile/lib/l10n/`에 위치합니다.

### 현재 로캘

- **영어** (`app_en.arb`) — canonical
- **베트남어** (`app_vi.arb`) — 지원
- **중국어** (`app_zh.arb`) — 확장 가능
- **한국어** (`app_ko.arb`) — 확장 가능

### ARB 파일 구조

**예시: app_en.arb**
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

## 새로운 문자열 추가

### 프로세스

1. **영어 ARB에 추가** (`app_en.arb`):
   ```json
   {
     "myNewString": "This is my new string",
     "@myNewString": {
       "description": "Describes when/where used"
     }
   }
   ```

2. **즉시 다른 모든 로캘 파일에 추가** (`app_vi.arb`, `app_zh.arb`, `app_ko.arb`):
   - 키 구조 복사
   - 값 번역
   - 설명 번역

3. **재생성** Dart 코드:
   ```bash
   cd apps/mobile
   fvm flutter gen-l10n
   ```
   이것은 `lib/gen_l10n/app_localizations.dart` + 로캘별 파일을 생성합니다.

4. **코드에서 사용:**
   ```dart
   final localizations = AppLocalizations.of(context)!;
   Text(localizations.myNewString);
   ```

### 누락된 번역의 결과

영어에는 문자열을 추가했지만 **베트남어에는 추가하지 않은 경우**:
- 빌드는 여전히 성공 (Flutter는 완성도 강제 안 함)
- 베트남어 사용자는 영어 문자열 표시 (폴백)
- **이상적이지 않음** — 일관되지 않은 경험

**방지하려면:** 코드 리뷰가 누락된 번역 발견. CI는 선택사항으로 강제 가능.

## 복수형

복수 형식에는 **intl 메시지 구문** 사용:

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

**app_ko.arb:**
```json
{
  "itemCount": "{count, plural, =0{항목 없음} one{1개 항목} other{{count}개 항목}}",
  "@itemCount": {
    "description": "목록의 항목 수",
    "placeholders": {
      "count": {
        "type": "int",
        "example": "3"
      }
    }
  }
}
```

**사용:**
```dart
final localizations = AppLocalizations.of(context)!;
Text(localizations.itemCount(items.length));
```

## 톤 가이드라인

### 영어

- **친근함:** "Oops!" 대신 "Error occurred"
- **간결함:** 불필요한 단어 피하기
- **능동형:** "Save your changes" not "Changes should be saved"
- **소문자 (고유명사 제외):** "Enter your email" not "Enter Your Email"
- **액션 중심 버튼:** "Delete Account" not "Confirm Deletion"

**예시:**
```
✓ "Save your progress"
✗ "The progress has been saved"

✓ "Oops, something went wrong"
✗ "An error has been encountered"

✓ "Sign in"
✗ "Please sign in"
```

### 베트남어

- **모국어 선호** — 자연 베트남어 단어가 있을 때 영어 loanword 피하기
- **정중하지만 직접적:** "Vui lòng" (please) 드물게 사용
- **소문자:** "nhập email của bạn" not "Nhập Email Của Bạn"
- **영어식 표현 피하기:** "đăng nhập" not "login", "hình ảnh" not "image" (실제로 모국어), "email" OK (좋은 대체 없음)

**예시:**
```
✓ "Lưu tiến trình của bạn" (Save your progress)
✗ "Tiến trình đã được save" (mixing Vietnamese + English)

✓ "Oops, có điều gì đó không ổn" (Oops, something isn't right)
✗ "Một lỗi đã xảy ra" (An error has occurred — formal/stiff)

✓ "Đăng nhập" (Sign in)
✗ "Vui lòng đăng nhập vào hệ thống" (Please sign in to the system — overly formal)
```

**흔한 베트남어 번역:**
| 영어 | 베트남어 | 참고 |
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

### 중국어 (간체)

- **직접적, 기술 톤** — 화려한 언어 피하기
- **간결한 문자 수** — 중국어는 이미 간결; 장황하지 않기
- **정중한 레지스터:** "请" (please) 수용 가능
- **전통 용어:** "用户" (user), "设置" (settings), "界面" (interface)

**예시:**
```
✓ "保存您的进度" (Save your progress)
✗ "您的进度已被保存" (Your progress has been saved — passive)

✓ "哎呀，出错了" (Oops, error)
✗ "系统遇到了一个错误" (The system encountered an error — formal)

✓ "登入" (Sign in)
✗ "请登入系统" (Please sign in to the system)
```

### 한국어

- **정중한 정식 레지스터** (~습니다) 표준
- **모국어 선호** 영어 loanword보다, 하지만 기술 용어는 OK
- **주어+목적어+동사 (SOV) 어순** — 자연스럽게 따르기
- **입자 사용:** 을/를 (목적어), 이/가 (주어)

**예시:**
```
✓ "진행 상황을 저장하세요" (Save your progress)
✗ "진행 상황이 저장되었습니다" (Passive/stiff)

✓ "어라, 뭔가 잘못되었어요" (Oops, something went wrong)
✗ "시스템에서 오류가 발생했습니다" (System encountered error — formal)

✓ "로그인" (Sign in — tech term, acceptable)
✗ "시스템에 로그인하십시오" (Sign in to the system — overly formal)
```

## 새로운 로캘 추가

**예시: 포르투갈어 (pt) 추가**

1. **app_pt.arb 생성** `apps/mobile/lib/l10n/`에:
   ```json
   {
     "@@locale": "pt",
     "helloTitle": "Olá",
     "greeting": "Bem-vindo, {name}!",
     ...
   }
   ```
   (app_en.arb에서 모든 키 복사, 값 번역)

2. **pubspec.yaml 업데이트** (선택사항, IDE 지원):
   ```yaml
   flutter:
     generate: true
     supported-locales:
       - en
       - vi
       - zh
       - pt
   ```

3. **재생성:**
   ```bash
   fvm flutter gen-l10n
   ```

4. **app.dart에서 활성화:**
   ```dart
   MaterialApp(
     localizationsDelegates: AppLocalizations.localizationsDelegates,
     supportedLocales: AppLocalizations.supportedLocales,  // Auto-updated
     ...
   )
   ```

5. **커밋** both `app_pt.arb` 및 생성된 `app_localizations_pt.dart`.

## 코드 예시

### 단순 문자열

**ARB:**
```json
{
  "appTitle": "Mobile Boilerplate"
}
```

**사용:**
```dart
Text(AppLocalizations.of(context)!.appTitle)
```

### 플레이스홀더가 있는 문자열

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

**사용:**
```dart
Text(AppLocalizations.of(context)!.welcome('Alice'))
```

### 복수형

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

**사용:**
```dart
Text(AppLocalizations.of(context)!.itemCount(5))  // "5 items"
```

### 성별 기반 형식 (고급)

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

**사용:**
```dart
Text(AppLocalizations.of(context)!.userRole('female'))  // "She is an admin"
```

## Best Practice

1. **기술적 키 유지:** `submitButtonLabel` not `btn1`
2. **관련 문자열 그룹화:** 모든 사용자 관련 메시지는 접두사 공유 (선택사항이지만 도움)
3. **모든 로캘 테스트:** 기기 언어 전환 및 텍스트 올바르게 표시 확인
4. **컨텍스트 특화 문자열 피하기:** "Click here" 번역 불가; "Submit" 대신 사용
5. **Sentence case 사용:** "Save your work" not "Save Your Work"
6. **코드에 하드코딩된 문자열 없음:** 항상 `AppLocalizations.of(context)!.key` 사용
7. **모든 키에 설명 추가:** 번역자가 컨텍스트 이해 도움
8. **모든 로캘 함께 업데이트:** 영어 추가 후 다른 언어 추가 안 함

## 일반적 실수

| 실수 | 영향 | 수정 |
|---------|--------|-----|
| 새 키 번역 잊음 | 사용자는 영어 (폴백) 표시 | 모든 ARB 파일에 번역 추가 |
| 코드에 하드코딩된 문자열 | 번역 불가 | `AppLocalizations.of(context)!.key` 사용 |
| 키 변경했지만 코드 미업데이트 | 빌드 오류 | 기존 키 검색/치환 → 새 |
| 중첩 플레이스홀더 | 구문 오류 | 평탄한 구조 사용, 필요시 코드에서 연결 |
| 로캘별 다른 매개변수 수 | 런타임 크래시 | 모든 로캘에서 매개변수 수 일치 |

---

**최종 업데이트:** 2026년 4월
