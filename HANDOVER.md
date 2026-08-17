# HANDOVER REPORT — PROJECT DASHBOARD

**Dự án:** Project Dashboard — Executive BI & Operations Report System  
**Phiên bản:** `v1.0.5` (UI Polish & 6-BU Strict Scope)  
**Ngày cập nhật:** 17/08/2026  
**Trạng thái:** 🚀 **RELEASED & PUSHED TO ORIGIN/MAIN** (`Working tree clean`, Build 100% Pass)

---

## 1. 🏗️ Tổng Quan Phân Hệ Báo Cáo Tuổi Nợ (Executive Aging Matrix & Drilldown)

- **2 Chế Độ Điều Hành Đỉnh Cao:**
  * **Macro View (Toàn Cảnh 6 BU Kinh Doanh):** 4 KPI Toàn Công Ty (55.71 tỷ) + Lưới 6 Thẻ BU Kinh Doanh Cốt Lõi với tiến trình đo % quá hạn và cảnh báo rủi ro động. Badge mã BU nổi bật tông Xanh Dương (`#1d4ed8`) đặt ngay trước tên BU.
  * **Micro View (Chi Tiết Khối BU):** 4 KPI Khối BU + Lưới Thẻ Khách Hàng (Executive Card Grid) đồng bộ trên cả Desktop & Mobile.
- **Đồng Bộ Động 4 Thẻ KPI Đầu Trang:**
  * Khi chọn "Tất cả nhân sự": KPI hiển thị tổng của toàn BU.
  * Khi chọn 1 nhân sự cụ thể: 4 Thẻ KPI tự động tính toán lại 100% theo đúng số liệu của nhân sự đó.
- **Phân Quyền RBAC & Data Scoping Chặt Chẽ:**
  * `BOD`: Toàn quyền xem Toàn cảnh (`ALL`) hoặc chuyển nhanh sang 6 BU kinh doanh và lọc từng nhân sự.
  * `BU_HEAD`: Khóa cứng BU của mình (`Thang máy 🔒`), mở quyền chọn lọc từng nhân sự trong BU.
  * `BU_STAFF`: Khóa cứng BU và Nhân sự, chỉ xem đúng số liệu và khách hàng do mình phụ trách.
- **Kết Nối REST API Backend Thực Tế:**
  * `GET /api/debt/bus/?period=YYYY-MM`
  * `GET /api/debt/bus/<bu_code>/drilldown/?period=YYYY-MM`

---

## 2. 📁 Bảng Tổng Hợp Kiểm Toán Mã Nguồn (< 200 dòng/file)

| STT | Đường Dẫn File | Số Dòng Mã | Trạng Thái | Vai Trò & Chức Năng |
| :---: | :--- | :---: | :---: | :--- |
| 1 | [`src/api/agingApi.js`](file:///d:/Sources/project-dashboard/src/api/agingApi.js) | **73 dòng** | ✅ Đạt (< 90) | Service gọi 2 REST API Backend |
| 2 | [`src/utils/agingMapper.js`](file:///d:/Sources/project-dashboard/src/utils/agingMapper.js) | **125 dòng** | ✅ Đạt (< 150) | Tầng ánh xạ, ép kiểu & đồng bộ KPI động |
| 3 | [`src/utils/agingMockData.js`](file:///d:/Sources/project-dashboard/src/utils/agingMockData.js) | **135 dòng** | ✅ Đạt (< 200) | Bộ dữ liệu mẫu mở rộng & chuẩn hóa mã BU |
| 4 | [`src/components/aging/AgingKpiGrid.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AgingKpiGrid.jsx) | **15 dòng** | ✅ Đạt (< 50) | Lưới 4 thẻ KPI Top của BU |
| 5 | [`src/components/aging/AgingCustomerCardGrid.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AgingCustomerCardGrid.jsx) | **189 dòng** | ✅ Đạt (< 200) | Lưới thẻ khách hàng Executive Card Grid |
| 6 | [`src/components/aging/AllBUsDebtOverview.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AllBUsDebtOverview.jsx) | **143 dòng** | ✅ Đạt (< 150) | Màn hình toàn cảnh 6 BU + Badge xanh trước tên |
| 7 | [`src/components/navigation/MobileNavDrawer.jsx`](file:///d:/Sources/project-dashboard/src/components/navigation/MobileNavDrawer.jsx) | **116 dòng** | ✅ Đạt (< 150) | Menu trượt điều hướng Mobile hợp nhất |
| 8 | [`src/pages/DebtAgingReportPage.jsx`](file:///d:/Sources/project-dashboard/src/pages/DebtAgingReportPage.jsx) | **193 dòng** | ✅ Đạt (< 200) | Page Controller điều phối lifecycle & RBAC |
| 9 | [`src/layouts/DashboardLayout.jsx`](file:///d:/Sources/project-dashboard/src/layouts/DashboardLayout.jsx) | **144 dòng** | ✅ Đạt (< 200) | TopBar 56px, Tabs Active và Layout toàn cục |

---

## 3. 🛡️ Trạng Thái Git Release
- **Commit:** `feat(aging): polish BU card header with brand blue badge and clean 6-BU scope`
- **Branch:** `main` $\rightarrow$ `origin/main` (Up to date).
- **Working Tree:** `clean`.
