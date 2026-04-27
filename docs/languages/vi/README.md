# Chỉ Mục Tài Liệu

> 🌐 **Ngôn ngữ:** [English](../../README.md) · **Tiếng Việt** · [中文](../zh/README.md) · [한국어](../ko/README.md)

Scaffold monorepo cấp sản xuất để phát hành ứng dụng Flutter + NestJS + Postgres.

## Bắt Đầu

- [**Bắt Đầu**](guides/getting-started.md) — yêu cầu tiên quyết, sao chép, cấu hình, chạy (15 phút)
- [**Tổng Quan**](overview.md) — dự án này là gì, dành cho ai, quyết định ngoài phạm vi
- [**Kiến Trúc**](architecture.md) — luồng dữ liệu, lớp, quy trình tạo mã OpenAPI

## Công Thức (Xây Dựng Tính Năng)

- [**Recipe Backend Module**](guides/backend-module.md) — NestJS controller + service + DTO với quy tắc xác thực/phong bì
- [**Recipe Prisma Module**](guides/prisma-module.md) — mở rộng lược đồ cơ sở dữ liệu + kết nối vào lớp dịch vụ
- [**Recipe Flutter Feature**](guides/flutter-feature.md) — cấu trúc thư mục, mô hình kho lưu trữ, Riverpod, định tuyến, bài kiểm tra
- [**API Contract**](guides/api-contract.md) — tạo lại khách hàng Dart + đồng bộ hóa bài kiểm tra khi API thay đổi

## Tham Khảo

| Tài Liệu | Mục Đích |
|---|---|
| [Bản Đồ Mã Nguồn](codebase-map.md) | Cây tệp + tham chiếu nhanh ("tôi thêm X ở đâu?") |
| [Tiêu Chuẩn Mã](code-standards.md) | Đặt tên, kích thước tệp, kiểu TS/Dart, cấu trúc bài kiểm tra, định dạng commit |
| [Ranh Giới Tính Năng](feature-boundaries.md) | Quy tắc cô lập mô-đun (không nhập chéo) |
| [Dependency Injection](dependency-injection.md) | NestJS providers/scopes, Riverpod overrides, ví dụ công việc |
| [Hướng Dẫn Thiết Kế](design-guidelines.md) | Material 3 theme, kiểu chữ, khoảng cách, tiện ích tái sử dụng |
| [Hướng Dẫn i18n](i18n-guide.md) | Quy trình ARB, khóa dịch, quy tắc số nhiều, thêm ngôn ngữ |
| [Triển Khai](deployment.md) | Docker backend, ký ứng dụng, quy trình semantic-release |
| [Changelog](../../../CHANGELOG.md) | Ghi chú phát hành (Keep a Changelog, cập nhật tự động bởi semantic-release) |

## Cấu Trúc

```
docs/
├── README.md             ← tệp này
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
    ├── vi/   ← bản dịch tiếng Việt
    ├── zh/   ← bản dịch tiếng Trung
    └── ko/   ← bản dịch tiếng Hàn
```

Changelog dự án nằm ở [`/CHANGELOG.md`](../../../CHANGELOG.md) (root, với bản dịch dưới `docs/languages/{lang}/CHANGELOG.md`).

## Theo Vai Trò

| Vai Trò | Thứ Tự Đọc |
|---|---|
| Backend Dev | [code-standards](code-standards.md) → [backend-module](guides/backend-module.md) → [feature-boundaries](feature-boundaries.md) |
| Mobile Dev | [getting-started](guides/getting-started.md) → [flutter-feature](guides/flutter-feature.md) → [i18n-guide](i18n-guide.md) |
| DevOps / Infra | [deployment](deployment.md) → [architecture](architecture.md) |
| New Contributor | [overview](overview.md) → [getting-started](guides/getting-started.md) → [codebase-map](codebase-map.md) |
