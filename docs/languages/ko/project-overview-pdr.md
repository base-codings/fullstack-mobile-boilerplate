# 프로젝트 개요 및 제품 요구사항

> 🌐 **언어:** [English](../../project-overview-pdr.md) · [Tiếng Việt](../vi/project-overview-pdr.md) · [中文](../zh/project-overview-pdr.md) · **한국어**

## 이것은 무엇인가요?

**mobile-boilerplate**는 Supabase에서 NestJS API로 지원하는 Flutter 모바일 애플리케이션을 배포하기 위한 프로덕션 준비 모노레포 스캐폴드입니다.

제공되는 것:
- **프론트엔드:** Riverpod 상태 관리, Dio HTTP 클라이언트, go_router 네비게이션, i18n 지원 (영어 + 베트남어 준비, 중국어 및 한국어로 확장 가능)이 있는 Flutter 앱.
- **백엔드:** Prisma ORM, 구조화된 로깅 (Pino), 요청 속도 제한, 기본 거부 인증, OpenAPI 코드 생성이 있는 NestJS API.
- **DevOps:** Docker 멀티스테이지 빌드, 로컬 개발용 docker-compose, semantic-release 파이프라인 (main = production, beta = prerelease), GitHub Actions CI/CD 게이트.
- **품질:** Lefthook 사전 커밋 린팅, commitlint 메시지 검증, Riverpod/Jest 단위 테스트, e2e 테스트, 엄격한 TypeScript, Dart 린팅.

## 대상 청중

- **Flutter 앱을 커스텀 백엔드로 배포하는 모바일 팀**
- **빠른 온보딩과 best practices가 내장되어 필요한 스타트업**
- **모노레포 구조, 감사 추적 (요청 ID), 보안 기본값 (기본 거부 인증)이 필요한 기업**

## 범위 내

- 단일 테넌트 SaaS 애플리케이션
- 인증 (스텁 구현; JWT, OAuth, Supabase Auth로 교체 가능)
- 실시간 데이터 동기화 후보 (WebSocket 또는 폴링을 위한 스켈레톤)
- 다중 플레이버 빌드 (dev/staging/prod)
- 다국어 UI (ARB 기반 i18n)
- Linux에서 Docker 배포 (클라우드 애그노스틱)

## 범위 외

- **전자상거래 무거운 작업** — 카트, 재고, 결제 통합 없음 (해당 모듈 추가)
- **실시간 프로토콜** — WebSocket 배관 미포함; 기능 모듈로 추가
- **모바일 플랫폼 특화** — iOS 전용 기능, Android 특화 네이티브 모듈 없음 (flutter 플러그인 예상)
- **기계 학습** — 온디바이스 ML 또는 TFLite 통합 없음
- **오프라인 우선 동기화** — 온라인 앱을 가정하며 가끔 연결 손실 (필요하면 Drift 추가)

## 스택 개요

| 계층 | 기술 | 참고 |
|-------|-----------|-------|
| **모바일 UI** | Flutter 3.27+, Material 3 테마 | 네비게이션은 go_router, 상태는 Riverpod |
| **API 클라이언트** | Dio 5.7+ | OpenAPI 스펙에서 생성 (NestJS → Dart) |
| **상태 관리** | Riverpod 2.5+ | AsyncNotifierProvider, 테스트용 오버라이드 패턴 |
| **HTTP 서버** | NestJS 10+, Express | 구조화된 로깅 (Pino), 속도 제한, guards, interceptors |
| **ORM** | Prisma 5+ | 자동 마이그레이션, 타입 안전 쿼리 |
| **데이터베이스** | PostgreSQL (Supabase) | SKIP_DB env 플래그로 hello 전용 검증 |
| **패키지 관리자** | pnpm 9+, melos | 모노레포 workspaces + Dart 도구 |
| **CI/CD** | GitHub Actions | Semantic-release, docker push, 앱 서명 |
| **Docker** | Alpine Linux, 멀티스테이지 | 최소 계층, 빌드 타임 deps 격리 |

## Hello 플로우 (스모크 테스트)

**로컬 실행:**
```bash
# 1. 백엔드
pnpm --filter @mobile-boilerplate/api dev
# 서버는 http://localhost:3000에서 실행

# 2. 모바일 (같은 터미널, 새 세션)
cd apps/mobile
fvm flutter run --dart-define=FLAVOR=dev
# 앱은 http://localhost:3000에 연결 (에뮬레이터에서 자동 해결)
```

**무엇이 발생하나요:**
1. **모바일:** 사용자가 "Fetch Hello" 버튼 탭
2. **HTTP:** Dio 클라이언트가 `GET /hello` 전송 (OpenAPI 스펙에서 자동 생성)
3. **API:** HelloController (공개 라우트, 인증 불필요)가 HelloService 호출
4. **응답:** `{ data: { message: "Hello World", timestamp }, meta: {...}, requestId: "..." }`
5. **모바일:** Riverpod 제공자가 수신, UI가 메시지 + 시간으로 업데이트

**검증:**
- 모노레포 부트스트랩 + 코드생성 작동
- 백엔드 서버 실행, 엔벨로프 배선 올바름
- Flutter→API 연결, Dio 클라이언트 올바르게 생성
- Riverpod 상태 업데이트 → UI 렌더 사이클

## 주요 제약사항

| 제약사항 | 근거 |
|-----------|-----------|
| 기본 거부 인증 (NotImplementedAuthGuard) | 보안 우선; 준비 시 JwtAuthGuard로 교체. 실수로 공개 엔드포인트 방지. |
| 전역 속도 제한 (IP당 100 req/min) | 복잡한 API 티어링 없이 악용 방지. env로 조정 가능. |
| 화이트리스트 DTO 검증 | 알 수 없는 필드 거부; 모델 주입 공격 방지. |
| 경로 인수 없는 `@Controller()` 불가 | 명시적 라우팅 명확성; 예기치 않은 중첩 라우트 방지. |
| `@Public()`은 /hello, /health, /login만 | 기본값은 "인증 필요"; 공개는 옵트인. |
| 기능 모듈 격리 (교차 기능 임포트 불가) | 느슨한 결합, 기능 삭제/재사용 용이. |
| 코드 파일당 최대 200줄 | 가독성 향상, 단일 책임 권장. |
| Conventional commits (feat:, fix:, refactor:) | 명확한 변경 로그, semantic-release 자동화. |

## 개발 워크플로우

1. **계획** — 기능 범위, 데이터베이스 스키마 스케치
2. **백엔드 구현** — NestJS 모듈, DTO, 컨트롤러, 서비스, 테스트 추가
3. **클라이언트 재생성** — `pnpm codegen:api`는 Dart api_client 생성
4. **프론트엔드 구현** — Flutter 기능 추가 (엔티티, repository, 제공자, UI, 테스트)
5. **테스트** — 단위 테스트 (백엔드는 Jest, 모바일은 Riverpod+mocktail), e2e 테스트
6. **커밋** — conventional 메시지, 기능 분기로 푸시
7. **CI 게이트** — GitHub Actions는 린팅, 테스트, 코드생성 체크 실행
8. **병합** — PR 검토, 자동 스쿼시 병합
9. **릴리스** — semantic-release는 커밋 읽음, 버전 범프, 태그, production/prerelease 푸시

## 성공 메트릭

- **온보딩 시간:** 새 개발자가 [local-development.md](guides/local-development.md) 읽음 → 15분 내 전체 환경 실행
- **기능 속도:** 백엔드 모듈 + Flutter 기능 + 테스트 + 릴리스 1–2 스프린트
- **코드 품질:** 0 `any` 타입, 비즈니스 로직에서 80%+ 테스트 커버리지, 0 린트 오류
- **배포 안정성:** 제로 다운타임 스키마 마이그레이션, git 태그를 통한 롤백을 갖춘 자동 릴리스

## 다음 단계

→ [로컬 개발 설정](guides/local-development.md)에서 클론하고 로컬 실행

→ 상세한 컴포넌트 분석을 위해 [시스템 아키텍처](system-architecture.md)

→ 첫 커밋 전 규칙 이해를 위해 [코드 표준](code-standards.md)
