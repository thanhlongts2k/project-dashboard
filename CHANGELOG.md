# Changelog

Tất cả các thay đổi quan trọng của dự án **`project-dashboard`** sẽ được ghi nhận tại file này.
Định dạng tuân thủ chuẩn [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/) và [Semantic Versioning](https://semver.org/).

---

## [0.4.3] - 2026-08-17 (Feature: Custom Executive Select Component & Native Dropdown Replacement)

### Added
- **Tạo Component `src/components/common/CustomSelect.jsx` (<140 dòng):**
  - Dropdown tùy biến chuyên dụng chuẩn Executive Dashboard, thay thế thẻ `<select>` mặc định của HTML.
  - Hỗ trợ đầy đủ các tính năng: Click outside tự đóng, icon chevron xoay 180°, animation hiển thị mượt mà (`fadeIn`), highlight item được chọn với dấu tích xanh (✓), và chống tràn chữ tự động (ellipsis).
  - Tích hợp trạng thái khóa/disabled với style mờ và con trỏ `not-allowed`.

### Changed & Integrated
- **Tích hợp vào `UnifiedSubHeader.jsx`:**
  - Thay thế Dropdown chọn BU thành CustomSelect hiện đại, tích hợp khóa BU theo quyền người dùng (`isBuLocked`).
- **Tích hợp vào `DashboardOverviewPage.jsx`:**
  - Thay thế Dropdown chọn Người phụ trách thành CustomSelect có bo góc 8px và hiệu ứng hover dòng tinh tế.

---

## [0.4.2] - 2026-08-17 (Fix: Chuẩn Hóa Logic Bộ Lọc Ngày, Đồng Bộ 2 Chiều & Làm Sạch URL)

### Fixed
- **Chuẩn hóa hàm tính khoảng ngày `calculatePresetDateRange(preset)`:**
  - `today`: `startDate = endDate = hôm nay`.
  - `yesterday`: `startDate = endDate = hôm qua`.
  - `thisWeek`: Lấy Thứ Hai đầu tuần làm `startDate` và Chủ Nhật cùng tuần làm `endDate` (chuẩn xác 100%, khắc phục lỗi hiển thị cả tháng khi chọn tuần).
  - `thisMonth`: Lấy ngày 01 đầu tháng làm `startDate` và ngày cuối cùng của tháng làm `endDate`.
- **Khắc phục xung đột giữa Preset và Custom Range (2-Way Sync):**
  - Khi click chọn bất kỳ Preset nhanh nào: Tự động tính toán lại ngày, cập nhật đồng bộ vào 2 ô input "Từ ngày - Đến ngày" và cập nhật URL ngay lập tức.
  - Khi người dùng tự chọn ngày ở ô input và bấm "Áp dụng": Tự động chuyển `preset = 'custom'` và làm nổi bật badge "Tùy chỉnh".
- **Làm sạch tham số URL (Clean Query String):**
  - Tự động xóa tham số `owner` khỏi URL khi người dùng chọn "Tất cả phụ trách", "all" hoặc để trống (`next.delete('owner')`), tránh lưu chuỗi tiếng Việt dài vào query string.

---

## [0.4.1] - 2026-08-17 (UI Polish: Executive Modern Minimalist Theme & Custom Scrollbars)

### Added
- **Bộ biến Design Tokens (`src/styles/dashboard.css`):**
  - Khai báo biến màu chuẩn `:root` cho Primary (`#185fa5`), Success (`#16a34a`), Warning (`#d97706`), Danger (`#dc2626`), Neutral (`#64748b`), Border (`#e2e8f0`) và Background (`#f8fafc`).
  - Hệ thống đổ bóng vi mô `var(--shadow-sm)` (`0 1px 3px rgba(0,0,0,0.05)`) và `var(--shadow-md)`.
- **Custom Sleek Scrollbars (`::-webkit-scrollbar`):**
  - Tùy biến thanh cuộn ngang/dọc cho toàn bộ bảng biểu và vùng tràn chỉ còn **6px**, bo tròn mềm mại (`border-radius: 999px`), thay thế thanh cuộn xám 16px mặc định của Windows.

### Changed & Polished
- **Thẻ KPI (MetricCard):**
  - Đảm bảo 100% thẻ trong cùng một hàng có chiều cao đồng đều tuyệt đối (Equal Height Flex Stretch).
  - Nâng độ tương phản màu nhãn mục tiêu (`.metric-target`) từ `#b4b2a9` lên `#64748b` đạt chuẩn tiếp cận WCAG AA.
  - Tinh chỉnh thanh tiến độ (`progress-track`) 6px bo tròn toàn phần với hiệu ứng chuyển màu mượt mà.
- **Bảng Dữ Liệu (DataTable & Alerts):**
  - Bổ sung hiệu ứng hover dòng (`.bt tbody tr:hover { background-color: #f8fafc }`) giúp người dùng dễ dàng theo dõi số liệu theo hàng ngang.
  - Chuẩn hóa padding ô và bo góc khung bảng `border-radius: 8px`.
- **Biểu Đồ Recharts:**
  - Đồng bộ theme Dark Tooltip sang trọng (`#1e293b`) với chữ trắng tương phản cao cho `DailyLineChart` và `ProgressChart`.
- **Sub-Header:**
  - Tinh chỉnh khoảng cách lề và padding chuẩn 1.400px, loại bỏ hoàn toàn hiện tượng lệch lề khi co giãn màn hình.

---

## [0.4.0] - 2026-08-17 (Phase 4: UI Guard Component, Data Scoping & Quick Role Switcher)

### Added
- **Tạo UI Guard Component (`src/components/auth/Can.jsx`):**
  - Hỗ trợ kiểm tra quyền linh hoạt qua prop `perform` (`VIEW_SENSITIVE`, `CONFIGURE_EMAIL`, `EXPORT_PDF`, `ACCESS_BU`) hoặc mảng `role` (ví dụ: `role={['BOD', 'BU_HEAD']}`).
  - Render `fallback` tương ứng khi tài khoản không đủ quyền.
- **Tích hợp Quick Role Switcher (`src/components/UserMenu.jsx`):**
  - Bổ sung menu test nhanh 3 roles: `👑 BOD (Toàn quyền)`, `🏢 BU_HEAD (Quản lý Elevator)`, `👤 BU_STAFF (Nhân viên Elevator)`.
  - Hiển thị Role Badge trực quan trên nút User Profile.
- **Tạo `AGENT_GUIDELINES.md`:** Ban hành 5 nguyên tắc vận hành bất di bất dịch cho AI Agent.

### Changed & Scoped
- **Ẩn/Hiện phần tử theo phân quyền (Role Restrictions):**
  - Thẻ chỉ số tài chính & dòng tiền doanh nghiệp (`FinanceKpiGrid.jsx`): Tự động ẩn hoàn toàn đối với vai trò `BU_STAFF`.
  - Nút *Lập lịch Email* (✉️ trên `DashboardLayout.jsx`): Bọc guard `Can perform="CONFIGURE_EMAIL"`, chỉ hiển thị cho `BOD`.
- **Khóa & Lọc phạm vi dữ liệu (Data Scoping):**
  - **Dropdown chọn BU (`UnifiedSubHeader.jsx`):** Tự động lọc danh sách BU theo `allowedBUs`. Nếu người dùng chỉ quản lý duy nhất 1 BU (ví dụ: BU_HEAD Elevator), dropdown sẽ tự động khóa cố định (🔒) và không cho phép chọn BU khác.
  - **Trang Tổng Quan (`DashboardOverviewPage.jsx`):** Tự động thu hẹp bảng tổng hợp BU (`summaryRows`) và danh sách người phụ trách theo quyền của từng user.
  - **Trang Chi Tiết BU (`/bu/:buKey`):** `ProtectedRoute requireBuAccess` tự động chặn và chuyển hướng về BU được cấp phép nếu cố tình nhập URL của BU không thuộc thẩm quyền.

---

## [0.3.2] - 2026-08-17 (Phase 3.2: Unified Sub-Header & Quy Hoạch Modular Component)

### Added
- **Tạo Component Khung Giao Diện Tầng 2 Chuẩn Executive Dashboard:**
  - `src/components/common/UnifiedSubHeader.jsx`: Banner ngang phẳng gom gọn Tiêu đề trang, Inline BU Selector, Subtitle metadata và toàn bộ thanh bộ lọc (Date Picker, Dropdown phụ, Làm mới, Tải PDF) vào đúng 1 hàng.
  - `src/components/common/DateRangePicker.jsx`: Component chọn khoảng ngày / ngày đơn độc lập, hỗ trợ cả quick presets (`Hôm qua`, `Hôm nay`, `Tuần này`, `Tháng này`) và tùy chỉnh custom range.
- **Bóc Tách Modular Toàn Bộ Các Khối Giao Diện Trọng Yếu:**
  - **Module Dashboard Overview (`src/components/dashboard/`):**
    * `OverviewKpiGrid.jsx`: 4 Thẻ KPI chính & Thẻ Oversea.
    * `DailyPerformanceChart.jsx`: Biểu đồ đường biến động theo ngày & tiến độ doanh thu/thu tiền BU.
    * `BuPerformanceTable.jsx`: Bảng DataTable tổng hợp BU & cảnh báo điều hành.
    * `FinanceKpiGrid.jsx`: Nhóm chỉ số tài chính doanh nghiệp.
  - **Module BU Detail (`src/components/buDetail/`):**
    * `BuDetailKpiGrid.jsx`: Lưới thẻ chỉ số KPI của BU được chọn.
    * `BuDailyChart.jsx`: Biểu đồ diễn biến ngày trong kỳ của BU.
    * `BuSubUnitTable.jsx`: Bảng chi tiết sub-mảng và so sánh chỉ tiêu thực hiện vs kế hoạch.
  - **Module Inventory (`src/components/inventory/`):**
    * `InventoryKpiGrid.jsx`: Thẻ chỉ số tổng quan nhập - xuất - tồn.
    * `InventoryTable.jsx`: Bảng tổng hợp tồn kho và cảnh báo tồn kho.
    * `InventoryCharts.jsx`: Biểu đồ cơ cấu Donut & biểu đồ cột biến động mua/bán theo kho.
  - **Module Receivable (`src/components/receivable/`):**
    * `ReceivableKpiGrid.jsx`: 5 Thẻ chỉ số tổng quan thu hồi công nợ.
    * `ReceivableDetailTable.jsx`: Bảng chi tiết thu theo BU & cảnh báo nợ.
    * `ReceivableCharts.jsx`: Biểu đồ tổng thu và cơ cấu nợ theo BU.
    * `ReceivableCommitmentTable.jsx`: Bảng cam kết thu nợ ngày hôm nay vs ngày mai.

### Changed
- **Tối ưu hóa các Page Controllers:**
  - Thu gọn 4 file `src/pages/*.jsx` xuống còn **~110 - 220 dòng** (giảm 75% số dòng mã), chỉ đóng vai trò Controller kết nối dữ liệu và truyền props.
  - Tích hợp Dropdown chọn BU trực tiếp vào tiêu đề `Dashboard Chi Tiết: [ Chọn BU ▾ ]` trên `DashboardBuDetailPage`.

---

## [0.3.1] - 2026-08-17 (Phase 3.1: Dọn Dẹp & Đồng Bộ Giao Diện Toàn Dự Án)

### Fixed & Cleaned
- **Loại bỏ trùng lặp UserMenu:** Xóa bỏ toàn bộ component `UserMenu` nội bộ trong 4 file page (`DashboardOverviewPage`, `DashboardBuDetailPage`, `InventoryReportPage`, `ReceivableReportPage`), quy về 1 vị trí duy nhất trên `DashboardLayout.jsx`.
- **Dọn dẹp các nút điều hướng thừa:** Xóa các nút chuyển tab cục bộ (`Chi tiết BU`, `Tồn kho`, `Công nợ`, `Tổng quan`) trong toolbar các trang, tránh xung đột với thanh điều hướng chính trên TopBar.
- **Đồng bộ Header & Toolbar từng trang:**
  - Giữ lại Tiêu đề trang, phụ đề ngày báo cáo và badge trạng thái BU/Kho.
  - Giữ nguyên bộ lọc ngày/tháng/năm, người phụ trách và nút *Làm mới dữ liệu*.
  - Nút *Tải PDF* trên toolbar mỗi trang phục vụ xuất PDF riêng cho trang đó; nút *Xuất PDF Toàn Bộ* trên TopBar xuất báo cáo tổng hợp.
- **Khắc phục lỗi lồng container CSS:** Xóa lớp bọc `<div className="page">` dư thừa trong từng trang, giúp giao diện hiển thị đồng nhất và liền mạch bên dưới `DashboardLayout`.

---

## [0.3.0] - 2026-08-17 (Phase 3: Khung Layout, Hệ Thống Routes & Tái Cấu Trúc App.jsx)

### Added
- **Tạo `src/layouts/DashboardLayout.jsx`:**
  - Khung giao diện chuẩn gồm TopBar, Thanh Tab điều hướng chính (`/dashboard`, `/bu/:buKey`, `/inventory`, `/receivables`), UserMenu, Nút thao tác Xuất PDF & Lập lịch Email.
  - Tích hợp hàm `preserveSearch` để bảo lưu toàn bộ tham số bộ lọc (`location.search`) khi chuyển đổi giữa các tab.
  - Quản lý các Modal toàn cục (`EmailConfigModal`, `LoadingOverlay`) và vùng hiển thị trang con qua `<Outlet />`.
- **Tạo `src/components/auth/ProtectedRoute.jsx`:**
  - Route Guard cấp độ điều hướng kiểm tra trạng thái đăng nhập, Role và quyền truy cập BU (`requireBuAccess`).
  - Tự động chuyển hướng về `/login` (lưu lại đường dẫn trước đó) hoặc redirect về BU được phép đầu tiên nếu user cố tình gõ URL BU bị cấm.
- **Tạo `src/context/DashboardContext.jsx`:**
  - Đóng gói toàn bộ logic tải dữ liệu, caching state cho 5 màn hình (`loadOverviewData`, `loadDetailData`, `loadInventoryReportData`, `loadReceivableReportData`).
  - Quản lý logic xuất file PDF đa trang chuẩn in ấn (`handleExportAllReports`).
- **Tạo `src/routes/AppRoutes.jsx`:**
  - Khai báo cây Route ứng dụng hoàn chỉnh cho các trang `/login`, `/dashboard`, `/bu/:buKey`, `/inventory`, `/receivables`, `*`.
  - Cung cấp các Page Controller Wrapper kết nối trực tiếp `useDashboard()` và `useDashboardFilters()`.

### Changed
- **Tái cấu trúc triệt để `src/App.jsx`:**
  - Rút gọn file gốc từ **>1.450 dòng** xuống còn **~35 dòng** siêu sạch và dễ đọc.
  - Loại bỏ hoàn toàn hiện tượng God Component, chuyển giao trách nhiệm Routing cho `AppRoutes` và State cho `AuthContext`/`DashboardContext`.

---

## [0.2.0] - 2026-08-17 (Phase 1 & Phase 2: Nền tảng Auth Context & URL-Driven State Hook)

### Added
- **Cài đặt thư viện Điều hướng `react-router-dom` (v7.18.2):** Hỗ trợ chuyển đổi ứng dụng sang cơ chế SPA Routing và URL Search Params.
- **Tạo `src/context/AuthContext.jsx` & `src/hooks/useAuth.js`:**
  - Định nghĩa 3 Roles chuẩn: `ROLES.BOD` (Ban Lãnh Đạo), `ROLES.BU_HEAD` (Trưởng Khối/BU), `ROLES.BU_STAFF` (Nhân viên BU).
  - Quản lý trạng thái xác thực: `token`, `expiry`, `user`, `role`, `allowedBUs`, `ownerId`, `isAuthenticated`.
  - Cung cấp các helper kiểm tra quyền (`permissions`):
    * `canAccessBu(buId)`: Kiểm tra quyền truy cập theo từng BU.
    * `canViewSensitiveMetrics`: Ẩn/hiện các chỉ số tài chính nhạy cảm (Nợ ngân hàng, Dòng tiền tổng).
    * `canConfigureEmail`: Kiểm tra quyền cấu hình gửi email tự động (dành riêng cho BOD).
    * `canExportPdf`: Quyền xuất file báo cáo PDF.
  - Tích hợp ghi nhớ phiên đăng nhập linh hoạt (`localStorage` cho Remember Me và `sessionStorage` cho phiên tạm thời).
  - Gắn comment/TODO đánh dấu vị trí sẵn sàng tích hợp giải mã JWT token hoặc endpoint `/api/auth/me/`.
- **Tạo `src/hooks/useDashboardFilters.js`:**
  - Đồng bộ 2 chiều giữa React State và URL Search Parameters (`preset`, `month`, `year`, `startDate`, `endDate`, `owner`, `date`).
  - Hàm `calculatePresetDateRange(preset)` tự động tính toán chính xác khoảng ngày cho các mốc thời gian động (`yesterday`, `today`, `thisWeek`, `thisMonth`).
  - Hàm `preserveSearch(targetPath)` hỗ trợ chuyển đổi giữa các màn hình mà không làm mất query params hiện tại.
  - Phục hồi 100% ngữ cảnh bộ lọc khi người dùng bấm F5 (reload) hoặc Back/Forward trình duyệt.

### Dependencies
- Thêm `react-router-dom`: `^7.18.2` vào `package.json`.

---

## [0.1.0] - 2026-08-17 (Khởi tạo Dự Án & Tổng Quan BI)

### Added
- Khởi tạo mã nguồn dự án React 19 + Vite 8.
- 5 Màn hình chức năng: `LoginPage`, `DashboardOverviewPage`, `DashboardBuDetailPage`, `InventoryReportPage`, `ReceivableReportPage`.
- Hệ thống UI Components và biểu đồ Recharts: `MetricCard`, `ProgressChart`, `DailyLineChart`, `DataTable`, `DetailMetricCompareChart`, `EmailConfigModal`, `LoadingOverlay`, `UserMenu`.
- Tầng Data Mappers & Formatters: `dashboardMapper`, `detailMapper`, `inventoryMapper`, `receivableMapper`, `numberFormat`, `exportPdf`, `emailSchedule`.
- Template biến môi trường `.env.example` và cấu hình bảo vệ `.gitignore`.
