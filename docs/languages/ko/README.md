# 문서 색인

> 🌐 **언어:** [English](../../README.md) · [Tiếng Việt](../vi/README.md) · [中文](../zh/README.md) · **한국어**

모바일-보일러플레이트 문서 모음에 오신 것을 환영합니다. 이 프로젝트는 Flutter+NestJS+Postgres 애플리케이션을 배포하기 위한 프로덕션급 모노레포 스캐폴드입니다.

## 시작하기

**이 보일러플레이트가 처음이신가요?** 여기서 시작하세요:
- [**로컬 개발 설정**](guides/local-development.md) — 사전 요구 사항, 클론, 설정, 실행 (15분)
- [**프로젝트 개요 & PDR**](project-overview-pdr.md) — 이것은 무엇인가, 누가 사용하는가, 범위 밖 결정사항
- [**아키텍처 개요**](system-architecture.md) — 데이터 흐름, 계층, OpenAPI 코드생성 파이프라인

## 기능 구축

**백엔드 API를 추가하려나요?**
- [**새로운 백엔드 모듈 추가**](guides/add-new-backend-module.md) — 인증/엔벨로프 규칙이 포함된 NestJS 컨트롤러+서비스+DTO 레시피
- [**Prisma 모델 추가**](guides/add-prisma-module.md) — 데이터베이스 스키마 확장 + 서비스 계층 연결
- [**API 계약 워크플로우**](guides/api-contract-workflow.md) — API를 변경할 때, Dart 클라이언트 재생성 + 테스트 동기화

**Flutter 기능을 추가하려나요?**
- [**새로운 Flutter 기능 추가**](guides/add-new-flutter-feature.md) — 디렉터리 구조, repository 패턴, Riverpod 제공자, 라우팅, 테스트

**UI를 번역하려나요?**
- [**i18n 톤 가이드**](i18n-tone-guide.md) — 번역 키 추가 방법, 복수형 규칙, 새 로캘 추가

## 참고

**코드베이스 이해하기:**
- [**코드베이스 요약**](codebase-summary.md) — 파일 트리와 빠른 참고 표 ("새로운 X를 어디에 추가할까?")
- [**코드 표준**](code-standards.md) — 파일 명명, 최대 200줄, TypeScript/Dart 스타일, 테스트 구조, 커밋 메시지 형식, 린팅 규칙
- [**시스템 아키텍처**](system-architecture.md) — 계층, 책임, 엔벨로프 형태 `{ data, meta, requestId }`
- [**기능 경계**](feature-boundaries.md) — 모듈 격리 규칙 (백엔드 모듈 + 프론트엔드 기능은 교차 임포트 불가)
- [**의존성 주입 패턴**](di-factory-pattern.md) — NestJS 제공자/스코프, Riverpod 제공자/오버라이드, 실제 예시
- [**디자인 가이드라인**](design-guidelines.md) — Material 3 테마, 타이포그래피, 간격, 재사용 가능한 위젯

**배포 및 릴리스:**
- [**배포 가이드**](deployment-guide.md) — Docker 백엔드, 앱 서명, semantic-release 플로우 (main=prod, beta=prerelease)

**변경 사항 추적:**
- [**프로젝트 변경 로그**](project-changelog.md) — 변경 로그 형식 유지, semantic-release에 의해 자동 업데이트

## 빠른 링크

| 작업 | 링크 |
|------|------|
| 로컬 개발 설정 | [local-development.md](guides/local-development.md) |
| API 엔드포인트 추가 | [add-new-backend-module.md](guides/add-new-backend-module.md) |
| 데이터베이스 테이블 추가 | [add-prisma-module.md](guides/add-prisma-module.md) |
| Flutter 화면 추가 | [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) |
| API 클라이언트 재생성 | [api-contract-workflow.md](guides/api-contract-workflow.md) |
| 번역 문자열 추가 | [i18n-tone-guide.md](i18n-tone-guide.md) |
| 코드 레이아웃 이해 | [codebase-summary.md](codebase-summary.md) |
| 프로덕션에 배포 | [deployment-guide.md](deployment-guide.md) |

## 콘텐츠 구조

```
docs/
├── README.md (이 파일)
├── project-overview-pdr.md
├── system-architecture.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── feature-boundaries.md
├── di-factory-pattern.md
├── i18n-tone-guide.md
├── project-changelog.md
├── guides/
│   ├── add-new-backend-module.md
│   ├── add-new-flutter-feature.md
│   ├── add-prisma-module.md
│   ├── api-contract-workflow.md
│   └── local-development.md
└── languages/
    ├── vi/  (베트남어 번역)
    ├── zh/  (중국어 간체 번역)
    └── ko/  (한국어 번역)
```

## 역할별

**백엔드 개발자:** [code-standards.md](code-standards.md) → [add-new-backend-module.md](guides/add-new-backend-module.md) → [feature-boundaries.md](feature-boundaries.md) 읽기

**모바일 개발자:** [local-development.md](guides/local-development.md) → [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) → [i18n-tone-guide.md](i18n-tone-guide.md) 읽기

**DevOps/Infra:** [deployment-guide.md](deployment-guide.md) → [system-architecture.md](system-architecture.md) 읽기

**새로운 기여자:** [project-overview-pdr.md](project-overview-pdr.md) → [local-development.md](guides/local-development.md) → [codebase-summary.md](codebase-summary.md) 읽기

---

**최종 업데이트:** 2026년 4월
