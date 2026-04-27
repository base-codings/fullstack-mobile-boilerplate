# 文档索引

> 🌐 **语言:** [English](../../README.md) · [Tiếng Việt](../vi/README.md) · **中文** · [한국어](../ko/README.md)

为 Flutter + NestJS + Postgres 应用交付而设计的生产级 monorepo 脚手架。

## 快速开始

- [**快速开始**](guides/getting-started.md) — 前置条件、克隆、配置、运行（15 分钟）
- [**概览**](overview.md) — 项目用途、适用对象、范围外的决策
- [**架构**](architecture.md) — 数据流、分层、OpenAPI 代码生成流程

## 配方（构建功能）

- [**后端模块**](guides/backend-module.md) — NestJS 控制器 + 服务 + DTO，含认证/包装规则
- [**Prisma 模块**](guides/prisma-module.md) — 扩展数据库 schema + 集成服务层
- [**Flutter 功能**](guides/flutter-feature.md) — 目录结构、仓库模式、Riverpod、路由、测试
- [**API 合约**](guides/api-contract.md) — 当 API 变更时重新生成 Dart 客户端 + 同步测试

## 参考

| 文档 | 用途 |
|---|---|
| [代码库地图](codebase-map.md) | 文件树 + 快速参考（"我在哪里添加新的 X?"） |
| [代码标准](code-standards.md) | 命名、文件大小、TS/Dart 风格、测试结构、提交格式 |
| [功能边界](feature-boundaries.md) | 模块隔离规则（禁止交叉导入） |
| [依赖注入](dependency-injection.md) | NestJS 提供者/作用域、Riverpod 覆盖、实际示例 |
| [设计指南](design-guidelines.md) | Material 3 主题、排版、间距、可重用小部件 |
| [i18n 指南](i18n-guide.md) | ARB 工作流、翻译键、复数形式、添加区域设置 |
| [部署](deployment.md) | Docker 后端、应用签名、语义发布流程 |
| [更新日志](../../../CHANGELOG.md) | 发布说明（Keep a Changelog，由 semantic-release 自动更新） |

## 结构

```
docs/
├── README.md             ← 此文件
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
    ├── vi/   ← 越南语镜像
    ├── zh/   ← 简体中文镜像
    └── ko/   ← 韩语镜像
```

项目更新日志位于 [`/CHANGELOG.md`](../../../CHANGELOG.md)（根目录，翻译在 `docs/languages/{lang}/CHANGELOG.md`）。

## 按角色

| 角色 | 阅读顺序 |
|---|---|
| 后端开发 | [代码标准](code-standards.md) → [后端模块](guides/backend-module.md) → [功能边界](feature-boundaries.md) |
| 移动开发 | [快速开始](guides/getting-started.md) → [Flutter 功能](guides/flutter-feature.md) → [i18n 指南](i18n-guide.md) |
| DevOps / 基础设施 | [部署](deployment.md) → [架构](architecture.md) |
| 新贡献者 | [概览](overview.md) → [快速开始](guides/getting-started.md) → [代码库地图](codebase-map.md) |
