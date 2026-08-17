# HANDOVER REPORT — PROJECT DASHBOARD

**Dự án:** Project Dashboard — Executive BI & Operations Report System  
**Phiên bản:** `v1.0.7` (Dropdown UI/CSS Fix & Mobile Responsiveness)  
**Ngày cập nhật:** 17/08/2026  
**Trạng thái:** 🚀 **RELEASE READY** (`Build 100% Pass`, Sẵn sàng Commit & Push)

---

## 1. 🏗️ Tổng Quan Phân Hệ Báo Cáo Tuổi Nợ (Executive Aging Matrix & Drilldown)

- **2 Chế Độ Điều Hành Đỉnh Cao:**
  * **Macro View (Toàn Cảnh 6 BU Kinh Doanh):** 4 KPI Toàn Công Ty (55.71 tỷ) + Lưới 6 Thẻ BU Kinh Doanh Cốt Lõi với tiến trình đo % quá hạn và cảnh báo rủi ro động. Badge mã BU nổi bật tông Xanh Dương (`#1d4ed8`) đặt ngay trước tên BU.
  * **Micro View (Chi Tiết Khối BU):** 4 KPI Khối BU + Lưới Thẻ Khách Hàng (Executive Card Grid) đồng bộ trên cả Desktop & Mobile.
- **Deep Linking & Đồng Bộ Trạng Thái URL (2-Way URL State Sync):**
  * Đồng bộ tự động các query params: `?period=YYYY-MM&bu=<BU_CODE>&employee=<EMPLOYEE_CODE>`.
  * Hỗ trợ F5 reload, back/forward trình duyệt, và chia sẻ link trực tiếp đến đúng BU và nhân viên đang xem.
- **Tối Ưu Giao Diện Dropdown & Responsive Filter Bar:**
  * Sửa lỗi neo tọa độ `left: 0` và `maxWidth: min(420px, calc(100vw - 32px))`, `z-index: 1000` chống đè hoặc lệch mép trái màn hình.
  * Tự động cắt ngắn text (`text-overflow: ellipsis`) kèm `title` tooltip đầy đủ cho nhân sự có tên và chức danh dài.
  * Responsive co dãn `w-full` trên màn hình nhỏ/mobile (< 640px).

---

## 2. 📁 Bảng Tổng Hợp Kiểm Toán Mã Nguồn (< 200 dòng/file)

| STT | Đường Dẫn File | Số Dòng Mã | Trạng Thái | Vai Trò & Chức Năng |
| :---: | :--- | :---: | :---: | :--- |
| 1 | [`src/api/agingApi.js`](file:///d:/Sources/project-dashboard/src/api/agingApi.js) | **74 dòng** | ✅ Đạt (< 90) | Service gọi 2 REST API Backend + param employee |
| 2 | [`src/utils/agingMapper.js`](file:///d:/Sources/project-dashboard/src/utils/agingMapper.js) | **125 dòng** | ✅ Đạt (< 150) | Tầng ánh xạ, ép kiểu & đồng bộ KPI động |
| 3 | [`src/utils/agingMockData.js`](file:///d:/Sources/project-dashboard/src/utils/agingMockData.js) | **135 dòng** | ✅ Đạt (< 200) | Bộ dữ liệu mẫu mở rộng & chuẩn hóa mã BU |
| 4 | [`src/components/common/CustomSelect.jsx`](file:///d:/Sources/project-dashboard/src/components/common/CustomSelect.jsx) | **171 dòng** | ✅ Đạt (< 200) | Dropdown tùy biến chuẩn Executive, z-index 1000, align left/right |
| 5 | [`src/components/aging/AgingKpiGrid.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AgingKpiGrid.jsx) | **15 dòng** | ✅ Đạt (< 50) | Lưới 4 thẻ KPI Top của BU |
| 6 | [`src/components/aging/AgingCustomerCardGrid.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AgingCustomerCardGrid.jsx) | **189 dòng** | ✅ Đạt (< 200) | Lưới thẻ khách hàng Executive Card Grid |
| 7 | [`src/components/aging/AllBUsDebtOverview.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AllBUsDebtOverview.jsx) | **143 dòng** | ✅ Đạt (< 150) | Màn hình toàn cảnh 6 BU + Badge xanh trước tên |
| 8 | [`src/components/navigation/MobileNavDrawer.jsx`](file:///d:/Sources/project-dashboard/src/components/navigation/MobileNavDrawer.jsx) | **116 dòng** | ✅ Đạt (< 150) | Menu trượt điều hướng Mobile hợp nhất |
| 9 | [`src/pages/DebtAgingReportPage.jsx`](file:///d:/Sources/project-dashboard/src/pages/DebtAgingReportPage.jsx) | **199 dòng** | ✅ Đạt (< 200) | Page Controller điều phối lifecycle, RBAC & Deep Linking |
| 10 | [`src/layouts/DashboardLayout.jsx`](file:///d:/Sources/project-dashboard/src/layouts/DashboardLayout.jsx) | **144 dòng** | ✅ Đạt (< 200) | TopBar 56px, Tabs Active và Layout toàn cục |

---

## 3. 🛡️ Trạng Thái Git Release
- **Commit:** `fix(ui): resolve employee dropdown positioning, text clipping, and mobile filter bar responsiveness`
- **Branch:** `main` $\rightarrow$ `origin/main`.
- **Working Tree:** `clean` sau khi commit & push.
