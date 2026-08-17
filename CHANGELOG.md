# Changelog

Tất cả các thay đổi quan trọng của dự án **`project-dashboard`** sẽ được ghi nhận tại file này.
Định dạng tuân thủ chuẩn [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/) và [Semantic Versioning](https://semver.org/).

---

## [1.0.3] - 2026-08-17 (Enhancement: Dynamic Top KPI Synchronization & Strict BU_STAFF Data Scoping)

### Fixed & Enhanced
- **Đồng Bộ Động 4 Thẻ KPI Top Theo Nhân Sự (`agingMapper.js` & `DebtAgingReportPage.jsx`):**
  - Khi chọn "Tất cả nhân sự" (`ALL`): 4 Thẻ KPI hiển thị tổng của toàn BU.
  - Khi chọn 1 nhân sự cụ thể (ví dụ: `2000996 — MAI TIẾN DƯƠNG`): 4 Thẻ KPI Top tự động tính toán lại theo đúng số liệu của nhân sự đó (Tổng nợ: 452.786.230 đ, Trong hạn: 219.467.880 đ, Quá hạn: 233.318.350 đ, % Quá hạn: 51.529%).
  - Subtitle thẻ 1 tự động hiển thị: `1 nhân sự · 3 KH phụ trách`.
- **Khắc Phục Hoàn Toàn Phân Quyền Vai Trò `BU_STAFF`:**
  - Khóa cố định Dropdown BU (`Thang máy 🔒`) và Dropdown Nhân sự (`MAI TIẾN DƯƠNG (Nhân viên kinh doanh) 🔒`).
  - Giao diện tự động hiển thị duy nhất nhóm khách hàng do nhân viên phụ trách mà không bị rỗng.
- **Phân Quyền Vai Trò `BU_HEAD`:**
  - Dropdown BU khóa cố định (`Thang máy 🔒`), Dropdown Nhân sự mở để linh hoạt giám sát toàn bộ đội ngũ Sales.

---

## [1.0.2] - 2026-08-17 (Refinement: Executive Language & Label Polish)

### Changed & Polished
- **Tinh Chỉnh Ngôn Ngữ Giao Diện (`AllBUsDebtOverview.jsx`):**
  - Thay thế nhãn nút bấm trên từng Card BU: `"Xem chi tiết ➔"` (thay cho `"Xem chi tiết 3 tầng ➔"`).
  - Cập nhật phụ đề hướng dẫn: `Nhấp "Xem chi tiết" trên bất kỳ BU nào để xem phân rã theo nhân sự và khách hàng`.

---

## [1.0.1] - 2026-08-17 (Fix: Staff Naming Mapping & TopBar Active Tab Highlight)

### Fixed & Enhanced
- **Sửa Lỗi Mapping Tên & Mã Nhân Sự Thực Tế (`agingMapper.js` & `DebtAgingReportPage.jsx`):**
  - Khắc phục lỗi đọc nhầm trường từ API bằng cách đọc trực tiếp `employee_code`, `employee_name`, `title`, `role`.
- **Sửa Lỗi Active State Tab "Tuổi nợ" trên TopBar (`DashboardLayout.jsx` & `dashboard.css`):**
  - Thêm CSS chuyên biệt `.desktop-nav-tabs .nav-tab-btn.active` với màu nền xanh nhạt, viền xanh và chữ xanh đậm.

---

## [1.0.0] - 2026-08-17 (Release: Phân Hệ Báo Cáo Tổng Hợp Tuổi Nợ & Phân Cấp Công Nợ 3 Tầng - Executive Aging & 3-Tier Debt Drilldown)

### Added & Official Release
- **Kiến Trúc Điều Hành 2 Chế Độ (Macro & Micro Dual-View Architecture)**
- **Kết Nối 2 REST API Backend Thực Tế (`src/api/agingApi.js`)**
- **Tích Hợp Phân Quyền RBAC & Data Scoping Chặt Chẽ**
- **Chuẩn Hóa 100% Hiển Thị Tên BU & Trưởng BU Nguyên Bản**
- **Tối Ưu Mobile TopBar & Drawer**
