# HANDOVER REPORT — PROJECT DASHBOARD

**Dự án:** Project Dashboard — Executive BI & Operations Report System  
**Phiên bản:** `v1.0.14` (Key Accounts Debt Collection Pipeline Optimization & Smart Date Navigation)  
**Ngày cập nhật:** 19/08/2026  
**Trạng thái:** 🚀 **PRODUCTION READY** (`Build 100% Pass`, 0 Errors)

---

## 1. 🏗️ Tính Năng Mới & Nâng Cấp (v1.0.14)

- **Tối Ưu & Khắc Phục Lỗi Hiển Thị Thu Nợ Khách Hàng Trọng Yếu (`ReceivableReportPage.jsx`):**
  * Tích hợp Smart Info Banner khi ngày được chọn chưa có phát sinh giao dịch thu tiền mới trong sổ kế toán (`AccountDetail`).
  * Nút điều hướng 1-click chuyển nhanh về ngày chốt số liệu gần nhất có dữ liệu (`18/08/2026`).
  * Backend API `DashboardCollectionByBUAPIView` bổ sung `latest_available_date`, `has_data`, lọc kỳ `reporting_period`, mở rộng ánh xạ `customer__business_unit` và bảo vệ phân quyền RBAC.

---

## 2. 📁 Bảng Tổng Hợp File Đã Chỉnh Sửa

| STT | Đường Dẫn File | Thao Tác | Vai Trò & Chức Năng |
| :---: | :--- | :---: | :--- |
| 1 | [`src/pages/ReceivableReportPage.jsx`](file:///d:/Sources/project-dashboard/src/pages/ReceivableReportPage.jsx) | MODIFY | Thêm Smart Notification Banner & 1-click date switch về ngày có dữ liệu gần nhất. |
| 2 | [`src/utils/receivableMapper.js`](file:///d:/Sources/project-dashboard/src/utils/receivableMapper.js) | MODIFY | Nhận diện `latestAvailableDate` và `hasData`. |
| 3 | [`src/pages/DebtAgingReportPage.jsx`](file:///d:/Sources/project-dashboard/src/pages/DebtAgingReportPage.jsx) | MODIFY | Khởi tạo `userFixedBu` & `selectedBu` theo BU thương mại, ẩn HPC trong dropdown. |
| 4 | [`src/context/AuthContext.jsx`](file:///d:/Sources/project-dashboard/src/context/AuthContext.jsx) | MODIFY | Quản lý profile, quyền hạn, `DEFAULT_ROLE_TABS.SALES = ['aging']`. |
| 5 | [`src/layouts/DashboardLayout.jsx`](file:///d:/Sources/project-dashboard/src/layouts/DashboardLayout.jsx) | MODIFY | Lọc hiển thị tabs Topbar theo `canAccessTab`. |
| 6 | [`src/components/navigation/MobileNavDrawer.jsx`](file:///d:/Sources/project-dashboard/src/components/navigation/MobileNavDrawer.jsx) | MODIFY | Lọc menu mobile drawer, bọc Dev Role Switcher bằng `import.meta.env.DEV`. |
| 7 | [`src/components/UserMenu.jsx`](file:///d:/Sources/project-dashboard/src/components/UserMenu.jsx) | MODIFY | Hiển thị Mã NV, Đơn vị BU, bọc Dev Role Switcher bằng `import.meta.env.DEV`. |
| 8 | [`src/components/auth/ProtectedRoute.jsx`](file:///d:/Sources/project-dashboard/src/components/auth/ProtectedRoute.jsx) | MODIFY | Route Guard hỗ trợ `requiredTab`, redirect về `firstAllowedPath`. |
| 9 | [`src/routes/AppRoutes.jsx`](file:///d:/Sources/project-dashboard/src/routes/AppRoutes.jsx) | MODIFY | Gán `requiredTab` cho từng phân hệ, `IndexRedirect` động. |
| 10 | [`CHANGELOG.md`](file:///d:/Sources/project-dashboard/CHANGELOG.md) | MODIFY | Ghi nhận phiên bản `[1.0.14]`. |

---

## 3. 🛡️ Trạng Thái Kiểm Thử & Build

- **Production Build:** `npm run build` → **✅ Built in 659ms, 0 Errors**
