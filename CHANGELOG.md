# Changelog

Tất cả các thay đổi quan trọng của dự án **`project-dashboard`** sẽ được ghi nhận tại file này.
Định dạng tuân thủ chuẩn [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/) và [Semantic Versioning](https://semver.org/).

## [1.0.24] - 2026-08-19 (Hotfix: Xóa Nút Google Login Bị Nhân Đôi — Duplicate Button Bug)

### Fixed
- **[HOTFIX] Sửa Lỗi Nhân Đôi Nút Google Sign-In (`LoginPage.jsx`, `login.css`):**
  - **Root Cause 1 (CSS):** `.google-btn-wrapper` có `border: 1px solid #e2e8f0` và `box-shadow` tạo ra một khung viền hiển thị như "nút thứ 2" giả mạo đè lên iframe Google → Đã XÓA hoàn toàn class `.google-btn-wrapper` khỏi CSS.
  - **Root Cause 2 (JSX):** Cả `google-btn-container` wrapper (luôn hiện) lẫn `google-custom-btn` fallback (hiện khi `!gsiReady`) đang cùng tồn tại trong DOM → Đã đổi sang logic `{gsiReady ? <container/> : <fallback/>}` mutually exclusive.
  - **Root Cause 3 (Timing):** `renderButton` gọi ngay trước `setGsiReady(true)` nên container chưa hiện trong DOM → Đổi sang: `setGsiReady(true)` trước, sau đó `setTimeout(0)` để DOM flush rồi mới `renderButton`.
  - **Kết quả:** Màn hình Login chỉ còn đúng 1 nút Google Sign-In duy nhất, tròn trịa (shape pill), căn giữa, full-width đồng bộ với form.

## [1.0.23] - 2026-08-19 (UX: Body Scroll Lock cho tất cả Modal & Nâng cấp Nút Google Login)

### Fixed & Changed
- **[UX] Khoá Cuộn Nền Trang Khi Modal Mở (`useBodyScrollLock`, `CustomerDebtDetailModal`, `EmailConfigModal`, `MobileNavDrawer`):**
  - Tạo custom hook `src/hooks/useBodyScrollLock.js` dùng kỹ thuật `position: fixed + top: -scrollY` — tương thích iOS Safari hoàn hảo, khôi phục vị trí cuộn khi đóng modal.
  - Áp dụng đồng nhất cho 3 modal: `CustomerDebtDetailModal`, `EmailConfigModal`, `MobileNavDrawer`.
  - Overlay tất cả modal: `overflowY: auto; overscrollBehavior: contain` — nội dung dài cuộn bên trong modal, nền web đứng im tuyệt đối.
- **[UI] Nâng Cấp Nút Google Login (`LoginPage.jsx`, `login.css`):**
  - `renderButton shape: "pill"` — Google tự bo góc tròn sang trọng đồng bộ với card form.
  - Thêm `.google-btn-wrapper`: `border-radius: 999px; overflow: hidden` — clip iframe GSI sandboxed để tạo viền bo góc nhất quán.
  - `.google-custom-btn` (fallback): `height: 46px; border-radius: 999px; color: #334155; font-weight: 600` — đồng bộ 100% với thiết kế input và nút đăng nhập.
  - Hover effect nhẹ nhàng: `background: #f8fafc; border-color: #cbd5e1; box-shadow nhẹ`.
- **Files đã sửa:** `useBodyScrollLock.js` (NEW), `CustomerDebtDetailModal.jsx`, `EmailConfigModal.jsx`, `MobileNavDrawer.jsx`, `LoginPage.jsx`, `login.css`.

## [1.0.22] - 2026-08-19 (Critical Fix: Horizontal Overflow Blowout on iPhone — Multi-Layer DOM Viewport Guard)

### Fixed
- **[CRITICAL] Triệt Tiêu Lỗi Toác Màn Hình (Horizontal Overflow Blowout) Trên iPhone 390–430px:**
  - **Root Cause 1 — Recharts SVG không bị chặn:** Thêm `min-width: 0; overflow: hidden; box-sizing: border-box` vào `.chart-wrap`, `.inventory-chart-wrap`, `.receivable-chart-wrap`. Thêm `debounce={50}` vào 100% `ResponsiveContainer` trong `DailyLineChart`, `DetailMetricCompareChart`, `ProgressChart`, `InventoryCharts`, `ReceivableCharts`.
  - **Root Cause 2 — Grid children không có min-width: 0:** Thêm `.chart-grid > *` và `.detail-split-grid > *` với `min-width: 0; overflow: hidden` — đây là rule CSS tối quan trọng cho CSS Grid tránh blowout.
  - **Root Cause 3 — `.card` không có max-width:** Thêm `min-width: 0; max-width: 100%; box-sizing: border-box` vào class `.card` toàn cục.
  - **Root Cause 4 — Thiếu Global Viewport Guard:** Thêm `max-width: 100vw; overflow-x: hidden` vào `html, body, #root` — đây là lớp bảo vệ cuối cùng ngăn thanh cuộn ngang trang xuất hiện trên iPhone SE/12/13/14/15/16 Pro Max.
  - **Recharts XAxis cải thiện:** `interval="preserveStartEnd"` + `YAxis width={48}` + `margin right: 10, left: -15` để tick text không chạy ra ngoài biên trên màn hình hẹp.
  - **Mobile 768px media query bổ sung:** Collapse toàn bộ `.chart-grid`, `.table-grid`, `.detail-split-grid`, `.detail-grid` về `grid-template-columns: 1fr`; giảm `.chart-wrap height: 220px`.
  - **`detail-mini-table`:** Wrap `overflow-x: auto; -webkit-overflow-scrolling: touch` cho phép vuốt ngang nội bộ mà không đẩy layout trang.
- **Files đã sửa:** `dashboard.css`, `DailyLineChart.jsx`, `DetailMetricCompareChart.jsx`, `ProgressChart.jsx`, `InventoryCharts.jsx`, `ReceivableCharts.jsx`.

## [1.0.21] - 2026-08-19 (Lead Frontend Architect: Zero-Sledgehammer Responsive Design System & 42px Touch-Target Standard)

### Fixed & Enhanced
- **Loại Bỏ Hoàn Toàn CSS Sledgehammer Overrides (`dashboard.css`, `CustomSelect.jsx`, `DateRangePicker.jsx`):**
  - Xóa bỏ triệt để các selector phá hoại `.parent > *` có chứa `!important` ép `height`/`padding`, trả toàn bộ quyền kiểm soát kích thước Box-Model về cho chính component nội bộ.
  - Xóa file demo `src/App.css` và ngắt import thừa trong `App.jsx`.
- **Chuẩn Hóa Design System Vùng Chạm Mobile (Apple HIG & Material 42px Standard):**
  - Nút bấm (`.btn`, `.otb-icon-btn`, `.otb-nav-btn`, `.link-btn`): Desktop `min-height: 38px`, Mobile `min-height: 42px`, `padding: 10px 16px`, `border-radius: 8px`, chống co ép trên mọi kích thước màn hình (360px, 375px, 390px, 412px).
  - Dropdown & DatePicker (`.custom-select-trigger`, `.date-picker-trigger`, `select.filter-sel`): Desktop `min-height: 38px`, Mobile `min-height: 42px`, `padding: 10px 14px`, `border-radius: 8px`.
  - Ô nhập liệu (`input[type="text"]`, `input[type="password"]`, `input[type="email"]`): Mobile `min-height: 42px`, `font-size: 14px` chống iOS auto-zoom khi focus.
- **Đồng Bộ Hoàn Chỉnh Trên Cả 5 Phân Hệ:**
  - Chuẩn hóa layout Sub-Header, bộ lọc Dropdown, DatePicker và nút bấm hiển thị đầy đặn, tròn trịa, không bị bóp méo hay xẹp trên toàn bộ các trang (`/dashboard`, `/bu/:buKey`, `/inventory`, `/receivables`, `/aging`, `/login`).

## [1.0.20] - 2026-08-19 (Terminology Audit: Standardize ĐTCT to "Đầu tư cho thuê")

### Fixed & Enhanced
- **Chuẩn Hóa Tận Gốc Tên Gọi Khối ĐTCT (`dashboardMapper.js`, `detailMapper.js`, `AuthContext.jsx`):**
  - Thay thế triệt để cụm từ cũ *"Đối tác chiến lược"* thành **"Đầu tư cho thuê"** / **"Đầu tư cho thuê / ĐTCT"** trên toàn bộ hệ thống mappers và UI context.
  - Tối ưu bộ từ khóa nhận diện BU `dtct`: tập trung chính xác vào `['đtct', 'dtct', 'cho thuê', 'đầu tư']`.

## [1.0.19] - 2026-08-19 (Fix: Eliminate SubHeader Ghost Whitespace & Centralize Mobile Flexbox)

### Fixed & Enhanced
- **Triệt Tiêu Khoảng Trắng Lớn (Ghost Whitespace) Trên Mobile (`dashboard.css`, `UnifiedSubHeader.jsx`):**
  - Xóa bỏ toàn bộ các khai báo CSS ghi đè phân mảnh/xung đột cũ trong media queries aging (`@media (max-width: 1023px)`).
  - Tái cấu trúc chuẩn hóa flexbox trung tâm cho `.unified-sub-header`, `.unified-sub-header-left` và `.unified-sub-header-actions` với `height: auto; min-height: unset;`.
  - Trên mobile (< 768px): Tự động xếp chồng dọc liền mạch (`flex-direction: column; gap: 10px; padding: 0 0 10px 0; margin-bottom: 14px;`), bộ lọc ngày và các nút chức năng áp sát ngay bên dưới tiêu đề trang, loại bỏ 100% khoảng trống thừa.

## [1.0.18] - 2026-08-19 (Lead Frontend Architect: DOM Scroll Context Fix, Comprehensive Mobile /receivables & Cross-Page Audit)

### Fixed & Enhanced
- **Xử Lý Triệt Để Sticky Topbar Scroll Context (`dashboard.css`, `DashboardLayout.jsx`):**
  - Loại bỏ hoàn toàn `overflow-x: hidden` trên `html`, `body`, `#root` — khôi phục ngữ cảnh cuộn viewport tự nhiên của trình duyệt, giúp `position: sticky; top: 0; z-index: 50;` dính cố định 100% trên iOS Safari & Android Chrome.
- **Tái Cấu Trúc Toàn Diện Responsive Trang Thu Nợ (`/receivables`):**
  - `ReceivableKpiGrid.jsx`: Chuyển sang Grid auto-fit linh hoạt `repeat(auto-fit, minmax(220px, 1fr))` chống vỡ thẻ KPI trên màn hình nhỏ.
  - `ReceivableCharts.jsx`: Bọc container biểu đồ Recharts bằng `min-w-0 w-full` và cấu hình responsive grid `repeat(auto-fit, minmax(min(100%, 420px), 1fr))` tự động xếp chồng dọc an toàn trên mobile.
  - `ReceivableDetailTable.jsx` & `ReceivableCommitmentTable.jsx`: Bọc toàn bộ bảng bằng `<div className="table-wrap">` (`overflow-x: auto; -webkit-overflow-scrolling: touch;`) với `min-width: 650px` cho thẻ table, cho phép vuốt ngang mượt mà mà không tràn lề trang.
- **Đồng Bộ Tính Nhất Quán & Responsive SubHeader Toàn Bộ Các Trang:**
  - `UnifiedSubHeader.jsx` & `dashboard.css`: Bố cục flex-wrap thông minh, tự động xếp chồng controls trên mobile mà không làm vỡ giao diện.
  - Loại bỏ các inline padding cứng ở thẻ bọc `.dash` trên toàn bộ các trang (`/dashboard`, `/bu/:buKey`, `/aging`, `/inventory`, `/receivables`), đồng bộ thống nhất theo hệ thống CSS trung tâm.

## [1.0.17] - 2026-08-19 (Mobile & UI/UX Polish: Sticky Topbar, Mobile Login Responsiveness & Highlighted Email Badge)

### Fixed & Enhanced
- **Cố Định Topbar Trên Mobile (`DashboardLayout.jsx`):**
  - Cấu hình Topbar sticky trên cùng màn hình (`position: sticky; top: 0; z-index: 50; backdrop-filter: blur(8px)`) giữ cố định Logo và nút Hamburger khi cuộn nội dung.
- **Tối Ưu Giao Diện Màn Hình Đăng Nhập Trên Mobile (`LoginPage.jsx`, `login.css`):**
  - Giới hạn card login `max-width: 420px; width: 100%`, thêm media query `< 480px` co giãn mượt mà, chống tràn ngang (overflow-x).
  - Tự động tính toán độ rộng nút Google Sign-In theo kích thước màn hình thực tế.
- **Làm Nổi Bật Email Tài Khoản Dạng Pill Badge (`UserMenu.jsx`, `MobileNavDrawer.jsx`):**
  - Desktop: Hiển thị email trong chip/badge nền `#f1f5f9` với icon ✉️ dưới họ tên.
  - Mobile: Thêm email badge nổi bật trong User Profile card của Mobile Drawer, hiển thị đầy đủ thông tin Mã NV và Đơn vị.

## [1.0.16] - 2026-08-19 (UI/UX Polish: Google Button Styling, User Menu Email & Chart Layout Optimization)

### Fixed & Enhanced
- **Tối Ưu Nút Đăng Nhập Google (`LoginPage.jsx`, `login.css`):**
  - Căn giữa container `#google-signin-btn-container`, đồng bộ kích thước và khoảng cách chuyên nghiệp với form đăng nhập.
- **Bổ Sung Email Trong Dropdown UserMenu (`UserMenu.jsx`):**
  - Hiển thị email tài khoản (`userEmail`) ngay dưới họ tên người dùng, xử lý `truncate` chống tràn dòng.
- **Khắc Phục Vỡ Layout & Chồng Chữ Biểu Đồ Thu Nợ (`ReceivableCharts.jsx`, `receivableMapper.js`):**
  - Chuyển sang Grid layout thông thoáng `repeat(auto-fit, minmax(440px, 1fr))` với `min-height: 380px`.
  - Rút gọn nhãn trục X biểu đồ cột (`Elevator`, `Premium`, `Value`, `Eco`, `Agritech`, `SX`, `ĐTCT`, `Oversea`) và hiển thị đầy đủ tên BU trong Tooltip.

## [1.0.15] - 2026-08-19 (Fix: Google Identity FedCM Bypass & Standard Popup Button Render)

### Fixed & Enhanced
- **Tối Ưu Cơ Chế Đăng Nhập Google Identity (`LoginPage.jsx`):**
  - Cấu hình `use_fedcm_for_prompt: false`, `ux_mode: 'popup'`, `auto_select: false` ngăn chặn hoàn toàn lỗi FedCM NetworkError trên trình duyệt Chrome/Edge mới.
  - Sử dụng `google.accounts.id.renderButton` hiển thị nút đăng nhập Google popup tiêu chuẩn trực tiếp trên giao diện.
  - Bọc try/catch xử lý lỗi One Tap và hiển thị thông báo hướng dẫn thân thiện khi Google script bị chặn.

## [1.0.14] - 2026-08-19 (Feature: Key Accounts Debt Collection Pipeline Optimization & Smart Date Navigation)

### Fixed & Enhanced
- **Tối Ưu Giao Diện Thu Nợ Khách Hàng Trọng Yếu (`ReceivableReportPage.jsx`):**
  - Tích hợp Smart Notification Banner khi ngày xem báo cáo chưa có chứng từ phát sinh mới trong sổ kế toán (`AccountDetail`).
  - Hỗ trợ nút điều hướng 1-click chuyển ngay về ngày chốt số liệu gần nhất có dữ liệu (`18/08/2026`).
  - Cập nhật `receivableMapper.js` nhận diện `latestAvailableDate` và `hasData`.

## [1.0.13] - 2026-08-19 (Fix: Sales Aging Report Initialization Conflict & Smart BU Fallback)

### Fixed & Enhanced
- **Khắc Phục Xung Đột Khởi Tạo State Khi Sales Truy Cập Báo Cáo Tuổi Nợ (`DebtAgingReportPage.jsx`):**
  - Cập nhật `userFixedBu` và `selectedBu`: Tự động tìm và chọn BU thương mại hợp lệ đầu tiên trong `allowedBUs` (loại trừ `HPC` và `ALL`), ngăn chặn hoàn toàn việc Frontend gửi request tới `/api/debt/bus/HPC/drilldown/`.
  - Dropdown BU: Loại bỏ hoàn toàn tùy chọn `HPC` / `[🏢 Tất cả BU]` cho các tài khoản không phải `BOD_ADMIN`.
  - Loại bỏ hoàn toàn lỗi 403 Forbidden và banner cảnh báo vàng trên giao diện người dùng.

## [1.0.12] - 2026-08-19 (Feature: 4-Layer Data-Driven RBAC Engine, Commercial BU Support & Sales Aging-Only Permission)

### Added & Enhanced
- **Đồng Bộ Phân Quyền Theo Ma Trận Mới (Sales Aging Only):**
  - Cập nhật quyền hạn vai trò `SALES`: Thu hồi tab `debt_collection`, chỉ cho phép truy cập duy nhất 1 Tab là `aging` ("Tuổi nợ").
  - `ProtectedRoute` và `AppRoutes` tự động chuyển hướng người dùng SALES về `/aging` khi truy cập các URL khác.
  - Navbar trên `DashboardLayout` và `MobileNavDrawer` chỉ hiển thị tab `aging` cho Sales và Viewer.
- **Hỗ Trợ Toàn Diện 8 Đơn Vị Kinh Doanh Thương Mại (Full Commercial BU Support):**
  - Đồng bộ nhận diện và hiển thị cho `ĐTCT` (`dtct`) và `Oversea` (`oversea`) trên `DashboardContext.jsx`, `detailMapper.js`, `dashboardMapper.js`.
  - Cập nhật `labelMap` và `toneMap` chuẩn sắc thái giao diện cho toàn bộ 8 Commercial BUs.
- **Gia Cố Bảo Mật Sản Xuất (Production Hardening):**
  - Đảm bảo Dev Role Switcher hoàn toàn bị loại bỏ khi build production (`import.meta.env.DEV`).

## [1.0.11] - 2026-08-19 (Feature: Multi-BU & Multi-Assignment RBAC, Dynamic Scope per BU)

### Added & Enhanced
- **Phân Quyền Nhân Sự Kiêm Nhiệm Đa BU & Đa Vai Trò (`AuthContext.jsx`):**
  - Lưu trữ và phân giải danh sách `managed_bus` (BU quản lý), `assigned_bus` (BU công tác), và `assignments` (chi tiết từng phân công).
  - Bổ sung helper `getRoleInCurrentBu(buCodeOrKey)`: Xác định chính xác vai trò của nhân sự tại BU đang xem (`BOD_ADMIN`, `BU_HEAD`, `SALES`, `VIEWER`).
  - Nâng cấp `allowedBUs` và `canAccessBu(buId)` hỗ trợ kiểm tra linh hoạt đa BU.
- **Bộ Lọc Động Theo Từng BU (Dynamic Filter Guard - `DebtAgingReportPage.jsx`):**
  - **Dropdown BU**: Cho phép nhân sự có từ 2 BU công tác trở lên chuyển đổi linh hoạt qua lại giữa các BU thuộc quyền, ẩn các BU ngoài phạm vi; chỉ khóa cứng khi nhân sự thuộc duy nhất 1 BU.
  - **Dropdown Nhân viên**:
    * Khi đang chọn BU mà nhân sự giữ vai trò **`BU_HEAD`**: Dropdown mở toàn quyền xem `[Tất cả]` hoặc bất kỳ nhân viên nào trong BU.
    * Khi đang chọn BU mà nhân sự giữ vai trò **`SALES`**: Dropdown tự động chọn và khóa cứng theo `employee_code` của chính nhân sự đó.
- **Fallback Chống Crash Toàn Diện (`DashboardContext.jsx` & `AppRoutes.jsx`):**
  - Tự động chuẩn hóa mã BU qua `buIdFromCode()` và fallback an toàn nếu BU không tồn tại, loại bỏ hoàn toàn các lỗi exception gây vỡ biểu đồ.

## [1.0.10] - 2026-08-19 (Feature: Full-Stack RBAC, User Profile Sync, Route Guards, Filter Guards & Dev Switcher Isolation)

### Added & Enhanced
- **Chuẩn Hóa Phân Quyền & Quản Lý Profile Người Dùng (`AuthContext.jsx`):**
  - Đồng bộ trực tiếp thông tin quyền hạn và profile mở rộng từ endpoint `GET /api/auth/me/`.
  - Hỗ trợ đầy đủ 4 nhóm quyền: `BOD_ADMIN`, `BU_HEAD`, `SALES`, `VIEWER`.
  - Quản lý danh sách `allowedTabs` động và đường dẫn truy cập đầu tiên `firstAllowedPath`.
  - Cung cấp các helper quyền hạn: `isBOD`, `isBuHead`, `isSales`, `isViewer`, `canAccessTab(tabKey)`, `canAccessBu(buKey)`.
- **Phân Quyền Hiển Thị Tab Trên Navbar (`DashboardLayout.jsx` & `MobileNavDrawer.jsx`):**
  - `BOD_ADMIN`: Xem đủ 5 Tabs (`Tổng quan`, `Chi tiết BU`, `Tồn kho`, `Công nợ & Thu tiền`, `Tuổi nợ`).
  - `BU_HEAD`: Ẩn Tab `Tổng quan`, chỉ hiển thị 4 Tabs quản lý BU (`Chi tiết BU`, `Tồn kho`, `Công nợ & Thu tiền`, `Tuổi nợ`).
  - `SALES`: Ẩn `Tổng quan`, `Chi tiết BU`, `Tồn kho`, chỉ hiển thị Tab `Tuổi nợ` và `Công nợ`.
  - `VIEWER`: Chỉ hiển thị Tab `Tuổi nợ`.
- **Bảo Vệ Tuyến Đường & Tự Động Chuyển Hướng (Route Guard - `ProtectedRoute.jsx` & `AppRoutes.jsx`):**
  - Thêm thuộc tính `requiredTab` vào `ProtectedRoute`.
  - Người dùng truy cập trực tiếp URL của phân hệ không được phân quyền sẽ tự động chuyển hướng về trang hợp lệ đầu tiên (`firstAllowedPath`).
  - Route gốc `/` và Wildcard `*` tự động chuyển hướng theo quyền của từng User.
- **Khóa Cứng Bộ Lọc Dữ Liệu (Filter Guard - `DebtAgingReportPage.jsx`):**
  - `BU_HEAD`: Dropdown BU tự động chọn đúng BU của mình và bị khóa (`disabled`).
  - `SALES`: Dropdown BU bị khóa về BU của mình, Dropdown Nhân viên tự động chọn và khóa theo Mã nhân viên của chính mình.
  - `BOD_ADMIN`: Toàn quyền chọn lọc tất cả BU và mọi nhân viên trong công ty.
- **Bảo Mật Công Cụ Chuyển Vai Trò (Dev Switcher Isolation - `UserMenu.jsx` & `MobileNavDrawer.jsx`):**
  - Bọc khối "Chuyển vai trò (Test nhanh)" trong điều kiện `{import.meta.env.DEV && ( ... )}`.
  - Vite và Rollup tự động loại bỏ 100% mã nguồn kiểm thử trên bản build Production (`npm run build`).

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
