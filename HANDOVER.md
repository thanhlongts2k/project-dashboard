# HANDOVER REPORT — PROJECT DASHBOARD

**Dự án:** Project Dashboard — Executive BI & Operations Report System  
**Ngày cập nhật:** 17/08/2026  
**Trạng thái:** ✅ **HOÀN THÀNH PHASE 3.2 (UNIFIED SUB-HEADER & MODULAR ARCHITECTURE)** (Build Success 100%)

---

## 1. 📌 Tóm Tắt Hiện Trạng Kỹ Thuật Sau Phase 3.2

### 1.1. Cấu Trúc Header 2 Tầng Chuẩn Executive Dashboard
1. **Tầng 1 (Global TopBar - `DashboardLayout.jsx`):**
   - Giữ Logo hệ thống, 4 Tab điều hướng chính (`/dashboard`, `/bu/:buKey`, `/inventory`, `/receivables`), UserMenu.
   - Nút *Lập lịch Mail* (✉️) và *Xuất Toàn Bộ* (📥) được thu gọn thành các nút action tinh gọn góc phải.
2. **Tầng 2 (Unified Sub-Header - `UnifiedSubHeader.jsx`):**
   - Đặt Tiêu đề trang và toàn bộ thanh Filter trên cùng 1 hàng ngang phẳng, hiện đại, loại bỏ viền card trắng bao quanh gây phân mảnh.
   - Trang Chi tiết BU: Tích hợp trực tiếp Dropdown chọn BU vào tiêu đề dạng `Dashboard Chi Tiết: [ Chọn BU ▾ ]` kèm subtext hiển thị người phụ trách và % KPI.
   - Tách riêng `DateRangePicker.jsx` hỗ trợ chọn khoảng ngày, ngày đơn, presets động.

### 1.2. Quy Hoạch Modular Toàn Bộ File Trang (>300 Dòng)
- **`src/pages/DashboardOverviewPage.jsx` (~220 dòng):** Sử dụng `OverviewKpiGrid`, `DailyPerformanceChart`, `BuPerformanceTable`, `FinanceKpiGrid`.
- **`src/pages/DashboardBuDetailPage.jsx` (~130 dòng):** Sử dụng `BuDetailKpiGrid`, `BuDailyChart`, `BuSubUnitTable`.
- **`src/pages/InventoryReportPage.jsx` (~110 dòng):** Sử dụng `InventoryKpiGrid`, `InventoryTable`, `InventoryCharts`.
- **`src/pages/ReceivableReportPage.jsx` (~110 dòng):** Sử dụng `ReceivableKpiGrid`, `ReceivableDetailTable`, `ReceivableCharts`, `ReceivableCommitmentTable`.
- **Kiểm tra Build:** `npm run build` hoàn thành thành công trong **613ms**, đạt **0 lỗi**.

---

## 2. 🧪 Hướng Dẫn Kiểm Thử Trên Trình Duyệt

1. **Kiểm tra giao diện 2 Tầng Header:**
   - Mở `http://localhost:5173/dashboard` $\rightarrow$ Thấy rõ ràng 2 tầng: TopBar điều hướng (Tầng 1) và Sub-Header phẳng (Tầng 2) chứa Tiêu đề + Date Range Picker + Filter + Làm mới + Tải PDF.
2. **Kiểm tra Inline BU Selector:**
   - Mở `http://localhost:5173/bu/elevator` $\rightarrow$ Tiêu đề hiển thị `Dashboard Chi Tiết: [ Elevator ▾ ]`.
   - Chọn BU khác từ dropdown $\rightarrow$ URL đổi và nội dung trang cập nhật tương ứng.
3. **Kiểm tra Date Picker & Preset:**
   - Thử bấm các preset `Hôm qua`, `Hôm nay`, `Tuần này`, `Tháng này` $\rightarrow$ Dữ liệu làm mới và URL query parameters được cập nhật tức thì.

---

## 3. 📋 Kế Hoạch Tiếp Theo — Phase 4 (UI Guard & Data Scoping)

- [x] Phase 1: `react-router-dom`, `AuthContext.jsx`, `useAuth.js`.
- [x] Phase 2: `useDashboardFilters.js` (2-way URL sync).
- [x] Phase 3: `DashboardLayout.jsx`, `ProtectedRoute.jsx`, `AppRoutes.jsx`, Refactor `App.jsx`.
- [x] Phase 3.1: Clean up duplicate UserMenu / nav buttons.
- [x] Phase 3.2: Unified Sub-Header & Modular Component Architecture (<250 dòng/file).
- [ ] **Phase 4: Phân Quyền Hiển Thị & Thu Hẹp Dữ Liệu (UI Guard & Data Scoping):**
  - Component `<Can perform="..." />`.
  - Ẩn/hiện thẻ Dư nợ ngân hàng và các chỉ số nhạy cảm cho role `BU_STAFF`.
  - Lọc BU Tabs và Summary Rows theo quyền truy cập của từng tài khoản.
