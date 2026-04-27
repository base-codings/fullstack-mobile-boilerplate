# 文档索引

> 🌐 **语言:** [English](../../README.md) · [Tiếng Việt](../vi/README.md) · **中文** · [한국어](../ko/README.md)

欢迎来到 mobile-boilerplate 文档套件。该项目是用于发布 Flutter+NestJS+Postgres 应用的生产级 monorepo 脚手架。

## 快速开始

**初次接触此脚手架？** 从这里开始：
- [**本地开发设置**](guides/local-development.md) — 前置要求、克隆、配置、运行（15 分钟）
- [**项目概览与 PDR**](project-overview-pdr.md) — 本项目是什么、目标用户、范围外决策
- [**架构概览**](system-architecture.md) — 数据流、分层、OpenAPI 代码生成流程

## 构建功能

**添加后端 API？**
- [**添加新的后端模块**](guides/add-new-backend-module.md) — NestJS 控制器+服务+DTO 的配方，含认证/信封规则
- [**添加 Prisma 模型**](guides/add-prisma-module.md) — 扩展数据库架构 + 连接到服务层
- [**API 契约工作流**](guides/api-contract-workflow.md) — 更改 API 时，重新生成 Dart 客户端 + 同步测试

**添加 Flutter 功能？**
- [**添加新的 Flutter 功能**](guides/add-new-flutter-feature.md) — 目录结构、repository 模式、Riverpod provider、路由、测试

**翻译 UI？**
- [**国际化音调指南**](i18n-tone-guide.md) — 如何添加翻译键、复数规则、添加新语言

## 参考

**了解代码库：**
- [**代码库总结**](codebase-summary.md) — 文件树和快速参考表（"我在哪里添加新的 X？"）
- [**代码标准**](code-standards.md) — 文件命名、最多 200 行、TypeScript/Dart 风格、测试结构、提交消息格式、lint 规则
- [**系统架构**](system-architecture.md) — 分层、职责、信封形状 `{ data, meta, requestId }`
- [**功能边界**](feature-boundaries.md) — 模块隔离规则（后端模块 + 前端功能不能交叉导入）
- [**依赖注入模式**](di-factory-pattern.md) — NestJS provider/作用域、Riverpod provider/覆盖、实现示例
- [**设计指南**](design-guidelines.md) — Material 3 主题、排版、间距、可重用组件

**部署与发布：**
- [**部署指南**](deployment-guide.md) — Docker 后端、应用签名、semantic-release 流程（main=生产环境，beta=预发布）

**跟踪变更：**
- [**项目更新日志**](project-changelog.md) — 遵循 Keep a Changelog 格式，由 semantic-release 自动更新

## 快速链接

| 任务 | 链接 |
|------|------|
| 设置本地开发 | [local-development.md](guides/local-development.md) |
| 添加 API 端点 | [add-new-backend-module.md](guides/add-new-backend-module.md) |
| 添加数据库表 | [add-prisma-module.md](guides/add-prisma-module.md) |
| 添加 Flutter 屏幕 | [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) |
| 重新生成 API 客户端 | [api-contract-workflow.md](guides/api-contract-workflow.md) |
| 添加翻译字符串 | [i18n-tone-guide.md](i18n-tone-guide.md) |
| 理解代码布局 | [codebase-summary.md](codebase-summary.md) |
| 部署到生产环境 | [deployment-guide.md](deployment-guide.md) |

## 内容结构

```
docs/
├── README.md (本文件)
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
    ├── vi/  (越南语翻译)
    ├── zh/  (简体中文翻译)
    └── ko/  (韩语翻译)
```

## 针对特定角色

**后端开发者:** 阅读 [code-standards.md](code-standards.md) → [add-new-backend-module.md](guides/add-new-backend-module.md) → [feature-boundaries.md](feature-boundaries.md)

**移动开发者:** 阅读 [local-development.md](guides/local-development.md) → [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) → [i18n-tone-guide.md](i18n-tone-guide.md)

**DevOps/基础设施:** 阅读 [deployment-guide.md](deployment-guide.md) → [system-architecture.md](system-architecture.md)

**新贡献者:** 阅读 [project-overview-pdr.md](project-overview-pdr.md) → [local-development.md](guides/local-development.md) → [codebase-summary.md](codebase-summary.md)

---

**最后更新:** 2026 年 4 月
