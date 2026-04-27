# Tổng quan

> 🌐 **Ngôn ngữ:** [English](../../overview.md) · **Tiếng Việt** · [中文](../zh/overview.md) · [한국어](../ko/overview.md)

## Đây Là Gì?

**mobile-boilerplate** là một khuôn mẫu monorepo sẵn sàng cho sản phẩm để phát hành các ứng dụng mobile Flutter được hỗ trợ bởi các API NestJS trên Supabase.

Nó cung cấp:
- **Frontend:** Ứng dụng Flutter với quản lý trạng thái Riverpod, máy khách HTTP Dio, điều hướng go_router, và hỗ trợ i18n (sẵn sàng cho Tiếng Anh + Tiếng Việt, có thể mở rộng sang Tiếng Trung và Tiếng Hàn).
- **Backend:** API NestJS với ORM Prisma, ghi nhật ký có cấu trúc (Pino), giới hạn tốc độ yêu cầu, xác thực từ chối mặc định, và tạo mã OpenAPI.
- **DevOps:** Xây dựng Docker multi-stage, docker-compose cho dev cục bộ, quy trình semantic-release (main = sản xuất, beta = bản phát hành trước), GitHub Actions CI/CD gates.
- **Chất lượng:** Linting pre-commit via Lefthook, kiểm tra lệnh cam kết via commitlint, bài kiểm tra Riverpod/Jest, bài kiểm tra e2e, TypeScript nghiêm ngặt, linting Dart.

## Đối Tượng Mục Tiêu

- **Các nhóm mobile** phát hành ứng dụng Flutter với một backend tùy chỉnh
- **Các startup** cần onboarding nhanh với các thực tiễn tốt nhất được tích hợp sẵn
- **Các doanh nghiệp** yêu cầu cấu trúc monorepo, nhật ký kiểm tra (ID yêu cầu), và các giá trị mặc định bảo mật (xác thực từ chối mặc định)

## Phạm Vi

- Ứng dụng SaaS thuê nhất
- Xác thực (triển khai stub; hoán đổi cho JWT, OAuth, Supabase Auth)
- Các ứng dụng đồng bộ dữ liệu thời gian thực (khung xương cho WebSocket hoặc thăm dò)
- Xây dựng đa hương vị (dev/staging/prod)
- UI đa ngôn ngữ (i18n dựa trên ARB)
- Triển khai Docker trên Linux (không phụ thuộc vào đám mây)

## Ngoài Phạm Vi

- **E-commerce nặng** — không có giỏ hàng, hàng tồn kho, tích hợp thanh toán (bạn sẽ thêm các mô-đun đó)
- **Các giao thức thời gian thực** — không có lắp ráp ống WebSocket; thêm như một mô-đun tính năng
- **Các đặc tính dành riêng cho nền tảng mobile** — không có các tính năng chỉ dành cho iOS, các mô-đun gốc Android cụ thể (plugin flutter dự kiến)
- **Máy học** — không có ML trên thiết bị hoặc tích hợp TFLite
- **Đồng bộ hóa offline-first** — giả định ứng dụng trực tuyến với mất kết nối thỉnh thoảng (thêm Drift nếu bạn cần DB cục bộ)

## Tổng Quan Stack

| Lớp | Công Nghệ | Ghi Chú |
|-------|-----------|-------|
| **UI Mobile** | Flutter 3.27+, Material 3 theme | go_router cho điều hướng, Riverpod cho trạng thái |
| **API Client** | Dio 5.7+ | Được tạo từ spec OpenAPI (NestJS → Dart) |
| **Quản Lý Trạng Thái** | Riverpod 2.5+ | AsyncNotifierProvider, mô hình ghi đè cho bài kiểm tra |
| **HTTP Server** | NestJS 10+, Express | Ghi nhật ký có cấu trúc (Pino), giới hạn tốc độ, bảo vệ, trình chặn |
| **ORM** | Prisma 5+ | Di cư tự động, truy vấn an toàn về loại |
| **Cơ Sở Dữ Liệu** | PostgreSQL (Supabase) | Lược đồ trong prisma/schema, di cư tự động |
| **Trình Quản Lý Gói** | pnpm 9+, melos | Không gian làm việc monorepo + công cụ Dart |
| **CI/CD** | GitHub Actions | Semantic-release, docker push, ký ứng dụng |
| **Docker** | Alpine Linux, multi-stage | Các lớp tối thiểu, deps dựa trên lúc xây dựng bị cô lập |

## Quy Trình Hello (Kiểm Tra Khói)

**Chạy cục bộ:**
```bash
# 1. Backend
pnpm --filter @mobile-boilerplate/api dev
# Server chạy trên http://localhost:3000

# 2. Mobile (phiên bản cùng thiết bị đầu cuối mới)
cd apps/mobile
fvm flutter run --dart-define=FLAVOR=dev
# Ứng dụng kết nối tới http://localhost:3000 (tự động phân giải trên trình mô phỏng)
```

**Điều gì xảy ra:**
1. **Mobile:** Người dùng nhấn nút "Fetch Hello"
2. **HTTP:** Máy khách Dio gửi `GET /hello` (được tạo tự động từ spec OpenAPI)
3. **API:** HelloController (tuyến công khai, không cần xác thực) gọi HelloService
4. **Phản Hồi:** `{ data: { message: "Hello World", timestamp }, meta: {...}, requestId: "..." }`
5. **Mobile:** Nhà cung cấp Riverpod nhận, UI cập nhật bằng thông báo + thời gian

**Xác Minh:**
- Bootstrap monorepo + codegen hoạt động
- Server backend lên, bao bọc phong bì nối dây đúng
- Kết nối Flutter→API, máy khách Dio được tạo đúng cách
- Chu kỳ cập nhật trạng thái Riverpod → kết xuất UI

---

Xem [Tổng Quan Kiến Trúc](architecture.md) để tìm hiểu chi tiết thêm.
