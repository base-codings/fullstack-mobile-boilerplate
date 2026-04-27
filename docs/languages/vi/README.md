# Chỉ Mục Tài Liệu

> 🌐 **Ngôn ngữ:** [English](../../README.md) · **Tiếng Việt** · [中文](../zh/README.md) · [한국어](../ko/README.md)

Chào mừng đến tài liệu dự án mobile-boilerplate. Đây là một khuôn mẫu sẵn sàng cho sản phẩm để phát hành ứng dụng Flutter được hỗ trợ bởi các API NestJS trên Supabase.

## Bắt Đầu

**Mới bắt đầu với khuôn mẫu này?** Hãy bắt đầu từ đây:
- [**Thiết Lập Phát Triển Cục Bộ**](guides/local-development.md) — yêu cầu tiên quyết, sao chép, cấu hình, chạy (15 phút)
- [**Tổng Quan Dự Án & PDR**](project-overview-pdr.md) — dự án này là gì, dành cho ai, quyết định ngoài phạm vi
- [**Tổng Quan Kiến Trúc**](system-architecture.md) — luồng dữ liệu, lớp, quy trình tạo mã OpenAPI

## Xây Dựng Tính Năng

**Thêm API backend?**
- [**Thêm Mô-đun Backend Mới**](guides/add-new-backend-module.md) — công thức cho bộ điều khiển NestJS + dịch vụ + DTO với quy tắc xác thực/phong bì
- [**Thêm Mô-đun Prisma**](guides/add-prisma-module.md) — mở rộng lược đồ cơ sở dữ liệu + kết nối vào lớp dịch vụ
- [**Quy Trình Hợp Đồng API**](guides/api-contract-workflow.md) — khi bạn thay đổi API, tạo lại khách hàng Dart + đồng bộ hóa bài kiểm tra

**Thêm tính năng Flutter?**
- [**Thêm Tính Năng Flutter Mới**](guides/add-new-flutter-feature.md) — cấu trúc thư mục, mô hình kho lưu trữ, nhà cung cấp Riverpod, định tuyến, bài kiểm tra

**Dịch UI?**
- [**Hướng Dẫn Tone i18n**](i18n-tone-guide.md) — cách thêm khóa dịch, quy tắc số nhiều, thêm ngôn ngữ mới

## Tham Khảo

**Hiểu codebase:**
- [**Tóm Tắt Codebase**](codebase-summary.md) — cây tệp với bảng tham chiếu nhanh ("tôi thêm một X ở đâu?")
- [**Tiêu Chuẩn Mã**](code-standards.md) — đặt tên tệp, tối đa 200 dòng, kiểu TypeScript/Dart, cấu trúc bài kiểm tra, định dạng tin nhắn cam kết, quy tắc linting
- [**Kiến Trúc Hệ Thống**](system-architecture.md) — lớp, trách nhiệm, hình dạng phong bì `{ data, meta, requestId }`
- [**Ranh Giới Tính Năng**](feature-boundaries.md) — quy tắc cô lập mô-đun (các mô-đun backend + tính năng frontend không thể nhập chéo)
- [**Mô Hình DI & Factory**](di-factory-pattern.md) — nhà cung cấp NestJS/phạm vi, nhà cung cấp Riverpod/ghi đè, ví dụ về công việc
- [**Hướng Dẫn Thiết Kế**](design-guidelines.md) — chủ đề Material 3, kiểu chữ, khoảng cách, tiện ích có thể tái sử dụng

**Triển khai & Phát hành:**
- [**Hướng Dẫn Triển Khai**](deployment-guide.md) — Docker backend, ký ứng dụng, quy trình semantic-release (main=sản xuất, beta=bản phát hành trước)

**Theo dõi thay đổi:**
- [**Nhật Ký Thay Đổi Dự Án**](project-changelog.md) — định dạng nhật ký thay đổi, được cập nhật tự động bởi semantic-release

## Liên Kết Nhanh

| Nhiệm Vụ | Liên Kết |
|------|------|
| Thiết lập dev cục bộ | [local-development.md](guides/local-development.md) |
| Thêm điểm cuối API | [add-new-backend-module.md](guides/add-new-backend-module.md) |
| Thêm bảng cơ sở dữ liệu | [add-prisma-module.md](guides/add-prisma-module.md) |
| Thêm màn hình Flutter | [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) |
| Tạo lại khách hàng API | [api-contract-workflow.md](guides/api-contract-workflow.md) |
| Thêm chuỗi dịch | [i18n-tone-guide.md](i18n-tone-guide.md) |
| Hiểu bố cục mã | [codebase-summary.md](codebase-summary.md) |
| Triển khai vào sản xuất | [deployment-guide.md](deployment-guide.md) |

## Cấu Trúc Nội Dung

```
docs/
├── README.md (tệp này)
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
    ├── vi/  (dịch tiếng Việt)
    ├── zh/  (dịch tiếng Trung)
    └── ko/  (dịch tiếng Hàn)
```

## Cho Các Vai Trò Cụ Thể

**Nhà Phát Triển Backend:** Đọc [code-standards.md](code-standards.md) → [add-new-backend-module.md](guides/add-new-backend-module.md) → [feature-boundaries.md](feature-boundaries.md)

**Nhà Phát Triển Mobile:** Đọc [local-development.md](guides/local-development.md) → [add-new-flutter-feature.md](guides/add-new-flutter-feature.md) → [i18n-tone-guide.md](i18n-tone-guide.md)

**DevOps/Infra:** Đọc [deployment-guide.md](deployment-guide.md) → [system-architecture.md](system-architecture.md)

**Người Đóng Góp Mới:** Đọc [project-overview-pdr.md](project-overview-pdr.md) → [local-development.md](guides/local-development.md) → [codebase-summary.md](codebase-summary.md)

---

**Cập nhật lần cuối:** Tháng 4 năm 2026
