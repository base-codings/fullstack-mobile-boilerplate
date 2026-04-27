# Documentation Index

> 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/README.md) · [中文](languages/zh/README.md) · [한국어](languages/ko/README.md)

Production-grade monorepo scaffold for shipping Flutter + NestJS + Postgres applications.

## Start Here

- [**Getting Started**](guides/getting-started.md) — prerequisites, clone, configure, run (15 min)
- [**Overview**](overview.md) — what this is, who it's for, out-of-scope decisions
- [**Architecture**](architecture.md) — data flow, layers, OpenAPI codegen pipeline

## Recipes (Building Features)

- [**Backend Module**](guides/backend-module.md) — NestJS controller + service + DTO with auth/envelope rules
- [**Prisma Module**](guides/prisma-module.md) — extend database schema + wire into service layer
- [**Flutter Feature**](guides/flutter-feature.md) — directory layout, repository pattern, Riverpod, routing, tests
- [**API Contract**](guides/api-contract.md) — regenerate Dart client + sync tests when an API changes

## Reference

| Doc | Purpose |
|---|---|
| [Codebase Map](codebase-map.md) | File tree + quick-reference ("where do I add a new X?") |
| [Code Standards](code-standards.md) | Naming, file size, TS/Dart style, test structure, commit format |
| [Feature Boundaries](feature-boundaries.md) | Module isolation rules (no cross-imports) |
| [Dependency Injection](dependency-injection.md) | NestJS providers/scopes, Riverpod overrides, worked examples |
| [Design Guidelines](design-guidelines.md) | Material 3 theme, typography, spacing, reusable widgets |
| [i18n Guide](i18n-guide.md) | ARB workflow, translation keys, pluralization, adding locales |
| [Deployment](deployment.md) | Docker backend, app signing, semantic-release flow |
| [Changelog](../CHANGELOG.md) | Release notes (Keep a Changelog, auto-updated by semantic-release) |

## Structure

```
docs/
├── README.md             ← this file
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

The project changelog lives at [`/CHANGELOG.md`](../CHANGELOG.md) (root, with translations under `docs/languages/{lang}/CHANGELOG.md`).

## By Role

| Role | Read order |
|---|---|
| Backend Dev | [code-standards](code-standards.md) → [backend-module](guides/backend-module.md) → [feature-boundaries](feature-boundaries.md) |
| Mobile Dev | [getting-started](guides/getting-started.md) → [flutter-feature](guides/flutter-feature.md) → [i18n-guide](i18n-guide.md) |
| DevOps / Infra | [deployment](deployment.md) → [architecture](architecture.md) |
| New Contributor | [overview](overview.md) → [getting-started](guides/getting-started.md) → [codebase-map](codebase-map.md) |
