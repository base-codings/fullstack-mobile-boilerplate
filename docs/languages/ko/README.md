# 문서 색인

> 🌐 **언어:** [English](../../README.md) · [Tiếng Việt](../vi/README.md) · [中文](../zh/README.md) · **한국어**

Flutter + NestJS + Postgres 애플리케이션 출시를 위한 프로덕션급 monorepo scaffold입니다.

## 여기서 시작

- [**시작하기**](guides/getting-started.md) — 사전 요구사항, clone, 설정, 실행 (15분)
- [**개요**](overview.md) — 이 프로젝트의 목적, 대상, scope 외 결정 사항
- [**아키텍처**](architecture.md) — 데이터 흐름, 레이어, OpenAPI 코드 생성 파이프라인

## 레시피 (기능 구축)

- [**백엔드 모듈**](guides/backend-module.md) — auth/envelope 규칙이 적용된 NestJS controller + service + DTO
- [**Prisma 모듈**](guides/prisma-module.md) — 데이터베이스 schema 확장 + service 레이어 연결
- [**Flutter 기능**](guides/flutter-feature.md) — 디렉터리 구조, repository 패턴, Riverpod, 라우팅, 테스트
- [**API 계약**](guides/api-contract.md) — API 변경 시 Dart 클라이언트 재생성 + 테스트 동기화

## 레퍼런스

| 문서 | 용도 |
|---|---|
| [코드베이스 맵](codebase-map.md) | 파일 트리 + 빠른 참조 ("새 X는 어디에 추가하나?") |
| [코드 표준](code-standards.md) | 네이밍, 파일 크기, TS/Dart 스타일, 테스트 구조, commit 형식 |
| [기능 경계](feature-boundaries.md) | 모듈 격리 규칙 (cross-import 금지) |
| [의존성 주입](dependency-injection.md) | NestJS providers/scopes, Riverpod overrides, 실제 예제 |
| [디자인 가이드라인](design-guidelines.md) | Material 3 테마, 타이포그래피, 간격, 재사용 가능한 위젯 |
| [i18n 가이드](i18n-guide.md) | ARB 워크플로, 번역 키, 복수형 처리, 로케일 추가 |
| [배포](deployment.md) | Docker 백엔드, 앱 서명, semantic-release 흐름 |
| [변경 로그](../../../CHANGELOG.md) | 릴리스 노트 (Keep a Changelog, semantic-release가 자동 업데이트) |

## 구조

```
docs/
├── README.md             ← 이 파일
├── overview.md
├── architecture.md
├── codebase-map.md
├── code-standards.md
├── design-guidelines.md
├── feature-boundaries.md
├── dependency-injection.md
├── i18n-guide.md
├── deployment.md
├── guides/
│   ├── getting-started.md
│   ├── backend-module.md
│   ├── prisma-module.md
│   ├── flutter-feature.md
│   └── api-contract.md
└── languages/
    ├── vi/   ← Vietnamese mirrors
    ├── zh/   ← Simplified Chinese mirrors
    └── ko/   ← Korean mirrors
```

프로젝트 변경 로그는 [`/CHANGELOG.md`](../../../CHANGELOG.md) (루트)에 있으며, 번역은 `docs/languages/{lang}/CHANGELOG.md`에 위치합니다.

## 역할별

| 역할 | 읽기 순서 |
|---|---|
| 백엔드 개발자 | [code-standards](code-standards.md) → [backend-module](guides/backend-module.md) → [feature-boundaries](feature-boundaries.md) |
| 모바일 개발자 | [getting-started](guides/getting-started.md) → [flutter-feature](guides/flutter-feature.md) → [i18n-guide](i18n-guide.md) |
| DevOps / 인프라 | [deployment](deployment.md) → [architecture](architecture.md) |
| 신규 기여자 | [overview](overview.md) → [getting-started](guides/getting-started.md) → [codebase-map](codebase-map.md) |
