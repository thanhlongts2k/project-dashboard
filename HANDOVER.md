# HANDOVER REPORT — PROJECT DASHBOARD

**Dự án:** Project Dashboard — Executive BI & Operations Report System  
**Ngày cập nhật:** 17/08/2026  
**Trạng thái:** 🏆 **HOÀN THÀNH 100% TOÀN BỘ 4 GIAI ĐOẠN REFACTOR KIẾN TRÚC & GIAO DIỆN** (Production Ready)

---

## 1. 📌 Tổng Quan Thành Quả Dự Án Sau Refactor

| Giai Đoạn | Trạng Thái | Mô Tả Trọng Tâm & Kỹ Thuật Đạt Được |
| :--- | :---: | :--- |
| **Phase 1: Nền tảng Auth & Context** | ✅ Xong | Cài đặt `react-router-dom`, `AuthContext.jsx`, `useAuth.js` với 3 Roles (`BOD`, `BU_HEAD`, `BU_STAFF`). |
| **Phase 2: URL-Driven State Hook** | ✅ Xong | `useDashboardFilters.js` đồng bộ 2 chiều state và URL Search Params, bảo lưu 100% bộ lọc khi F5 / Back / Forward. |
| **Phase 3: Layout, Routes & App Refactor** | ✅ Xong | `DashboardLayout.jsx`, `ProtectedRoute.jsx`, `AppRoutes.jsx`, rút gọn `App.jsx` từ >1.450 dòng xuống **~35 dòng**. |
| **Phase 3.1: Dọn Dẹp Duplicate UI** | ✅ Xong | Xóa bỏ UserMenu nội bộ và các nút điều hướng thừa, giải quyết hoàn toàn xung đột CSS container lồng. |
| **Phase 3.2: Unified Sub-Header & Modular** | ✅ Xong | Quy hoạch Sub-Header 2 tầng Executive phẳng, bóc tách toàn bộ 4 trang lớn xuống **<200 dòng/file**. |
| **Phase 4: RBAC UI Guard & Data Scoping** | ✅ Xong | `<Can />` Component, tự động ẩn/khóa BU & chỉ số nhạy cảm theo phân quyền, tích hợp Quick Role Switcher. |

---

## 2. 🏗️ Kiến Trúc Hệ Thống & Cấu Trúc File Chuẩn

```
src/
├── components/
│   ├── auth/
│   │   ├── Can.jsx                  # UI RBAC Guard (<Can perform="..." role="..." />)
│   │   └── ProtectedRoute.jsx       # Route Level Guard (requireBuAccess, Role check)
│   ├── buDetail/
│   │   ├── BuDailyChart.jsx         # Biểu đồ diễn biến ngày BU
│   │   ├── BuDetailKpiGrid.jsx      # Lưới thẻ KPI của BU
│   │   └── BuSubUnitTable.jsx       # Bảng chi tiết sub-mảng & so sánh chỉ tiêu
│   ├── common/
│   │   ├── DateRangePicker.jsx      # Bộ chọn ngày/khoảng ngày & dynamic presets
│   │   └── UnifiedSubHeader.jsx     # Sub-Header Tầng 2 phẳng tích hợp Inline BU selector & filters
│   ├── dashboard/
│   │   ├── BuPerformanceTable.jsx   # Bảng tổng hợp tất cả BU & cảnh báo
│   │   ├── DailyPerformanceChart.jsx# Biểu đồ đường biến động theo ngày
│   │   ├── FinanceKpiGrid.jsx       # Thẻ tài chính nhạy cảm (bọc bởi Can guard)
│   │   └── OverviewKpiGrid.jsx      # 4 Thẻ KPI chính & Oversea
│   ├── inventory/
│   │   ├── InventoryCharts.jsx      # Biểu đồ Donut & Bar chart biến động kho
│   │   ├── InventoryKpiGrid.jsx     # Thẻ chỉ số tổng quan kho
│   │   └── InventoryTable.jsx       # Bảng tổng hợp Nhập - Xuất - Tồn & cảnh báo
│   ├── receivable/
│   │   ├── ReceivableCharts.jsx     # Biểu đồ tổng thu & cơ cấu nợ theo BU
│   │   ├── ReceivableCommitmentTable.jsx # Bảng cam kết thu nợ hôm nay vs ngày mai
│   │   ├── ReceivableDetailTable.jsx# Bảng chi tiết thu theo BU & cảnh báo
│   │   └── ReceivableKpiGrid.jsx    # Thẻ chỉ số tổng quan thu nợ
│   └── UserMenu.jsx                 # Profile menu + Quick Role Switcher cho Dev/Test
├── context/
│   ├── AuthContext.jsx              # RBAC State, token expiry, dynamic permission helpers
│   └── DashboardContext.jsx         # Data loading, caching state & PDF export
├── hooks/
│   ├── useAuth.js                   # Hook truy cập AuthContext
│   └── useDashboardFilters.js       # Hook 2-way sync giữa State và URL query params
├── layouts/
│   └── DashboardLayout.jsx          # TopBar Tầng 1, tabs điều hướng, global modals & <Outlet />
├── pages/                           # 100% Page Controllers siêu nhẹ (<150-220 dòng)
│   ├── DashboardOverviewPage.jsx
│   ├── DashboardBuDetailPage.jsx
│   ├── InventoryReportPage.jsx
│   ├── ReceivableReportPage.jsx
│   └── LoginPage.jsx
└── routes/
    └── AppRoutes.jsx                # Cấu hình Router cây và Page Wrappers
```

---

## 3. 🔍 Các Điểm Lưu Ý Kỹ Thuật Khi Phát Triển Tiếp (Technical Notes)

1. **Tích hợp Backend API Thật (Production API Integration):**
   - Tại [`src/context/AuthContext.jsx`](file:///d:/Sources/project-dashboard/src/context/AuthContext.jsx), phần hàm `inferRoleAndPermissions()` đã có comment đánh dấu sẵn. Khi backend có endpoint xác thực JWT (`/api/auth/me/`), chỉ cần thay thế hàm này bằng logic decode payload token.
2. **Tuân thủ AGENT_GUIDELINES.md:**
   - Luôn duy trì kích thước file **dưới 200 - 250 dòng** cho tất cả các component mới.
   - Luôn sử dụng `<Can perform="..." />` để kiểm soát các nút thao tác hoặc dữ liệu nhạy cảm mới.
3. **Bảo toàn Query Parameters:**
   - Khi tạo liên kết điều hướng mới giữa các màn hình, hãy luôn sử dụng hàm `preserveSearch(targetPath)` từ hook `useDashboardFilters()` để không làm mất bộ lọc ngày tháng của người dùng.
