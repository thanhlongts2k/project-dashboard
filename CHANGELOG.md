# Changelog

Tất cả các thay đổi quan trọng của dự án **`project-dashboard`** sẽ được ghi nhận tại file này.
Định dạng tuân thủ chuẩn [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/) và [Semantic Versioning](https://semver.org/).

---

## [1.0.9] - 2026-08-18 (Enhancement: Active Bucket Count Badge, KPI Collapsible Accordion, Modal Filter & Mobile Table Fix)

### Added & Enhanced
- **Badge Số Nấc Hạn Trên Nút Thẻ Khách Hàng (`AgingCustomerCardGrid.jsx`):**
  - Nút `[🔍 Xem chi tiết nấc hạn]` hiển thị thêm badge số `[3]` (tông xanh dương) đếm chính xác số nấc hạn có phát sinh > 0 của từng khách hàng.
- **KPI Collapsible Accordion (`AgingKpiGrid.jsx`):**
  - Header "Tổng quan tuổi nợ — Khối [BU]" có thể bấm để đóng/mở với icon mũi tên `▼`/`▲` và hiệu ứng trượt mượt mà.
  - Mobile (`< 768px`): Mặc định thu gọn, header hiển thị mini-badge tóm tắt `[7.48 tỷ • Quá hạn: 18.68% ⚠️]`.
  - Desktop (`≥ 768px`): Luôn mở rộng đầy đủ 4 thẻ KPI, không bị thu gọn khi resize.
  - KPI Grid tự động chuyển 2 cột trên Mobile nhỏ (`< 768px`) và 1 cột trên màn hình rất nhỏ (`< 420px`).
- **Lọc Nấc Hạn Có Phát Sinh Trong Modal (`CustomerDebtDetailModal.jsx`):**
  - Chỉ hiển thị các nấc hạn có phát sinh số tiền > 0 (`activeBuckets`), ẩn hoàn toàn các dòng = 0 đ.
  - Tiêu đề bảng cập nhật động: `📊 Chi tiết nấc hạn phát sinh  [N nấc hạn]` (badge màu xanh lá / xám).
  - Xử lý Empty State: Dòng thông báo in nghiêng khi không có nấc nào phát sinh.
- **Sửa Hoàn Toàn Lỗi Bảng Bị Bóp Nghẹt Trên Mobile (`AgingCustomerTableView.jsx`):**
  - Xóa bỏ toàn bộ class `sticky-col` xung đột; bảng có `minWidth: 900px` cứng bên trong container `overflow-x-auto` + `WebkitOverflowScrolling: touch`.
  - Định nghĩa chiều rộng cố định cho từng cột qua object `COL` (Mã KH 120px, Tên KH 220px+, v.v.).
  - Thêm dòng gợi ý `👉 Vuốt sang ngang...` chỉ hiện trên màn hình `≤ 768px`.
- **Sửa Lỗi Runtime Crash Table View (`AgingCustomerTableView.jsx`):**
  - Xóa bỏ biến `expandedRows` orphan gây `ReferenceError: expandedRows is not defined` khi chuyển sang Dạng Bảng.

---

## [1.0.8] - 2026-08-18 (Feature: Default Collapsed Accordions, URL Search Params State Sync & Customer Debt Detail Modal)

### Added & Enhanced
- **Mặc Định Thu Gọn Tất Cả Accordion Nhân Sự (`AgingCustomerCardGrid.jsx`):**
  - Khởi tạo `expandedStaff = {}` giúp toàn bộ danh sách nhóm nhân sự ở trạng thái thu gọn khi load trang, tạo giao diện gọn gàng và tải trang nhanh chóng.
  - Duy trì nút toggle mở/thu gọn hàng loạt `[▼ Mở tất cả]` / `[▶ Thu gọn tất cả]`.
- **Đồng Bộ Trạng Thái 4 Chiều Lên URL Search Params (`AgingCustomerCardGrid.jsx`):**
  - Tự động đồng bộ `view` (`grid` / `table`), `search` (kèm debounce 300ms), `filter` (`all`, `due`, `overdue`, `large`), và `sort` (`overdue_desc`, `total_desc`, `rate_desc`, `name_asc`) lên thanh địa chỉ URL.
  - Đảm bảo khi F5 hoặc chia sẻ đường link, trang web tự động khôi phục 100% đúng chế độ xem và bộ lọc tương ứng.
- **Xây Dựng Popup Modal Xem Chi Tiết Công Nợ Khách Hàng (`CustomerDebtDetailModal.jsx`):**
  - Khi bấm nút `[🔍 Xem]` (cả Dạng Thẻ lẫn Dạng Bảng), modal hiển thị đầy đủ thông tin: Tiêu đề KH, 4 Thẻ Mini KPI, Bảng chi tiết nấc hạn và nút đóng.
  - Tối ưu Responsive: Căn giữa sang trọng trên Desktop (`max-w: 680px`), tự động chuyển thành Bottom Sheet full-width bo góc mềm mại trên màn hình Mobile (`< 640px`).

---

## [1.0.7] - 2026-08-18 (Feature: Aging Distribution Stacked Bar, Responsive Search Toolbar, Grid/Table View Switcher & Filter Chips)

### Added & Enhanced
- **Thanh Visual Phân Bổ Cơ Cấu Tuổi Nợ (Stacked Bar - `AgingDistributionBar.jsx`):**
  - Trực quan hóa 5 dải tuổi nợ với mã màu nhận diện chuẩn: Trong hạn (`#10B981`), 1-14 ngày (`#FBBF24`), 15-30 ngày (`#F97316`), 31-60 ngày (`#EA580C`), >60 ngày (`#DC2626`).
  - Hỗ trợ tooltip chi tiết khi rê chuột/chạm và thanh Legend phân bổ tỷ trọng thông minh (dàn hàng ngang trên Desktop, dạng Grid 2 cột trên Mobile).
- **Bộ Lọc Nhanh 4 Chip (`AgingCustomerCardGrid.jsx`):**
  - Filter Chips: `[Tất cả]`, `[🟢 Trong hạn]`, `[⚠️ Quá hạn]`, `[💎 Nợ lớn > 500Tr]` kèm badge số lượng thực tế.
  - Container cuộn ngang native (`overflow-x-auto`, `scrollbar-width: none`) chống bể giao diện trên Mobile.
- **Nút Chuyển Đổi Dạng Xem (`AgingCustomerCardGrid.jsx`):**
  - Switcher `[🔲 Dạng Thẻ]` vs `[📋 Dạng Bảng]` chuyển đổi mượt mà.
  - Dropdown sắp xếp đa tiêu chí: Quá hạn giảm dần, Tổng nợ giảm dần, Tỷ lệ % quá hạn, Tên khách hàng A-Z.

---

## [1.0.6] - 2026-08-18 (Enhancement: "Trong hạn" Filter Chip & Native Mobile Horizontal Scroll Optimization)

### Added & Enhanced
- **Thêm Nút Lọc Nhanh "🟢 Trong hạn" (`AgingCustomerCardGrid.jsx`):**
  - Bổ sung Filter Chip `[🟢 Trong hạn ({inDue})]` với tông màu xanh ngọc/emerald (`#059669`) đồng bộ với Stacked Bar.
  - Logic lọc chính xác các khách hàng có nợ trong hạn và 0 nợ quá hạn (`totalBeforeDue > 0 && totalOverdue == 0`).
- **Tối Ưu Vùng Filter Chips Chống Bể Giao Diện Trên Mobile (`dashboard.css`):**
  - Bọc cụm Filter Chips trong container cuộn ngang mượt mà (`overflow-x-auto`, `scrollbar-width: none`, `-webkit-overflow-scrolling: touch`).
  - Đặt thuộc tính `shrink-0 whitespace-nowrap` cho từng nút chip giúp người dùng vuốt trượt ngang tự nhiên như app native mà không bị rớt dòng hay tràn màn hình.

---

## [1.0.5] - 2026-08-18 (Feature: Aging Distribution Stacked Bar, Responsive Search Toolbar & Grid/Table View Switcher)

### Added & Enhanced
- **Thanh Visual Phân Bổ Cơ Cấu Tuổi Nợ (Stacked Bar - `AgingDistributionBar.jsx`):**
  - Trực quan hóa 5 dải tuổi nợ với mã màu nhận diện chuẩn: Trong hạn (`#10B981`), 1-14 ngày (`#FBBF24`), 15-30 ngày (`#F97316`), 31-60 ngày (`#EA580C`), >60 ngày (`#DC2626`).
  - Hỗ trợ tooltip chi tiết khi rê chuột/chạm và thanh Legend phân bổ tỷ trọng thông minh (dàn hàng ngang trên Desktop, dạng Grid 2 cột trên Mobile).
- **Thanh Công Cụ Tìm Kiếm & Bộ Lọc Nhanh (Responsive Toolbar - `AgingCustomerCardGrid.jsx`):**
  - Ô tìm kiếm realtime theo Tên hoặc Mã khách hàng, có nút xóa nhanh (✕).
  - Filter Chips phân loại: `[Tất cả]`, `[⚠️ Quá hạn]`, `[💎 Nợ lớn > 500Tr]` kèm badge số lượng thực tế.
  - Dropdown sắp xếp đa tiêu chí: Quá hạn giảm dần, Tổng nợ giảm dần, Tỷ lệ % quá hạn, Tên khách hàng A-Z.
  - Tối ưu Responsive: Dàn hàng ngang trên Desktop, cuộn ngang chip và full-width search trên Mobile.
- **Nút Chuyển Đổi Dạng Xem (Card Grid 🔲 vs Bảng Dữ Liệu 📋 - `AgingCustomerTableView.jsx`):**
  - Nút Switcher chuyển đổi mượt mà giữa Dạng Thẻ và Dạng Bảng.
  - Bảng dữ liệu hỗ trợ cuộn ngang (`overflow-x-auto`) kèm ghim cố định cột Mã & Tên Khách hàng (`sticky left-0 bg-white z-10`) giúp theo dõi liền mạch trên điện thoại/tablet.
  - Dòng tổng cộng (Footer Summary) ở cuối bảng hiển thị tổng nợ, trong hạn, quá hạn và tỷ lệ quá hạn trung bình.
- **Tinh Chỉnh Định Dạng Tỷ Lệ Phần Trăm (`src/utils/numberFormat.js`):**
  - Chuẩn hóa hiển thị tỷ lệ phần trăm với tối đa 1-2 chữ số thập phân (`formatPercent(val, 2)`), loại bỏ các số thập phân dài không cần thiết.

---

## [1.0.4] - 2026-08-18 (Fix: BU Code Normalization for Non-prefixed Business Units & Support ĐTCT / Oversea)

### Fixed & Enhanced
- **Chuẩn Hóa Mã BU Linh Hoạt (`src/utils/agingMockData.js`):**
  - Cập nhật hàm `normalizeBuCode` để không tự động nối tiền tố `BU_` với các mã BU độc lập như `ĐTCT` hay `Oversea`.
  - Cập nhật `BU_CODE_MAP` và `FALLBACK_BU_OPTIONS` nhận diện chính xác Khối *Đầu tư cho thuê (`ĐTCT`)*.
  - Khắc phục lỗi `404 Không tìm thấy Business Unit có mã: 'BU_ĐTCT'` khi chọn xem chi tiết BU Đầu tư cho thuê trên Dashboard.

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
