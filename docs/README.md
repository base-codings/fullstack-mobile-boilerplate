# Documentation Index

> 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/README.md) · [中文](languages/zh/README.md) · [한국어](languages/ko/README.md)

Welcome to the mobile-boilerplate documentation suite. This project is a production-grade monorepo scaffold for shipping Flutter+NestJS+Postgres applications.

## Getting Started

**New to this boilerplate?** Start here:
- [**Local Development Setup**](guides/local-development.md) — prerequisites, clone, configure, run (15 min)
- [**Project Overview & PDR**](project-overview-pdr.md) — what this is, who it's for, out-of-scope decisions
- [**Architecture Overview**](system-architecture.md) — data flow, layers, OpenAPI codegen pipeline

## Building Features

**Adding backend API?**
- [**Add a New Backend Module**](guides/add-new-backend-module.md) — recipe for NestJS controller+service+DTO with auth/envelope rules
- [**Add a Prisma Model**](guides/add-prisma-module.md) — extend database schema + wire into service layer
- [**API Contract Workflow**](guides/api-contract-workflow.md) — when you change an API, regenerate Dart client + sync tests

**Adding Flutter feature?**
- [**Add a New Flutter Feature**](guides/add-new-flutter-feature.md) — directory structure, repository pattern, Riverpod providers, routing, tests

**Translating UI?**
- [**i18n Tone Guide**](i18n-tone-guide.md) — how to add translation keys, pluralization rules, add new locales

## Reference

**Understand the codebase:**
- [**Codebase Summary**](codebase-summary.md) — file tree with quick-reference table ("where do I add a new X?")
- [**Code Standards**](code-standards.md) — file naming, max 200 lines, TypeScript/Dart style, test structure, commit message format, linting rules
- [**System Architecture**](system-architecture.md) — layers, responsibilities, envelope shape `{ data, meta, requestId }`
- [**Feature Boundaries**](feature-boundaries.md) — module isolation rules (backend modules + frontend features cannot cross-import)
- [**Dependency Injection Patterns**](di-factory-pattern.md) — NestJS providers/scopes, Riverpod providers/overrides, worked examples
- [**Design Guidelines**](design-guidelines.md) — Material 3 theme, typography, spacing, reusable widgets

**Deploy & Release:**
- [**Deployment Guide**](deployment-guide.md) — Docker backend, app signing, semantic-release flow (main=prod, beta=prerelease)

**Track Changes:**
- [**Project Changelog**](project-changelog.md) — keep a changelog format, auto-updated by semantic-release

## Quick Links

| Task | Link |
|------|------|
| Setup local dev | [local-development.md](guides/local-development.md) |
| Add API endpoint | [add-new-backend-module.md](guides/add-new-backend-module.md) |
| Add database table | [add-prisma-module.md](guides/add-prisma-module.md) |
| Add Flutter screen | [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) |
| Regenerate API client | [api-contract-workflow.md](guides/api-contract-workflow.md) |
| Add translation strings | [i18n-tone-guide.md](i18n-tone-guide.md) |
| Understand code layout | [codebase-summary.md](codebase-summary.md) |
| Deploy to production | [deployment-guide.md](deployment-guide.md) |

## Content Structure

```
docs/
├── README.md (this file)
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
    ├── vi/  (Vietnamese translations)
    ├── zh/  (Simplified Chinese translations)
    └── ko/  (Korean translations)
```

## For Specific Roles

**Backend Developer:** Read [code-standards.md](code-standards.md) → [add-new-backend-module.md](guides/add-new-backend-module.md) → [feature-boundaries.md](feature-boundaries.md)

**Mobile Developer:** Read [local-development.md](guides/local-development.md) → [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) → [i18n-tone-guide.md](i18n-tone-guide.md)

**DevOps/Infra:** Read [deployment-guide.md](deployment-guide.md) → [system-architecture.md](system-architecture.md)

**New Contributor:** Read [project-overview-pdr.md](project-overview-pdr.md) → [local-development.md](guides/local-development.md) → [codebase-summary.md](codebase-summary.md)

---

**Last updated:** April 2026
