# HANDOVER REPORT — PROJECT DASHBOARD

**Dự án:** Project Dashboard — Executive BI & Operations Report System  
**Phiên bản:** `v1.0.9` (Aging Page: Mobile Responsive, URL State Sync, Customer Detail Modal)  
**Ngày cập nhật:** 18/08/2026  
**Trạng thái:** 🚀 **RELEASE READY** (`Build 100% Pass`, Sẵn sàng Commit & Push)

---

## 1. 🏗️ Tổng Quan Phân Hệ Báo Cáo Tuổi Nợ (Executive Aging Matrix & Drilldown)

- **2 Chế Độ Điều Hành Đỉnh Cao:**
  * **Macro View (Toàn Cảnh BU Kinh Doanh):** 4 KPI Toàn Công Ty + Lưới Thẻ BU với tiến trình đo % quá hạn và cảnh báo rủi ro động.
  * **Micro View (Chi Tiết Khối BU):** 4 KPI Khối BU (Collapsible trên Mobile) + Filter Chips + Lưới Thẻ / Bảng Dữ Liệu đồng bộ cả Desktop & Mobile.
- **Deep Linking & Đồng Bộ Trạng Thái URL (4-Way URL State Sync):**
  * Đồng bộ tự động: `?period=YYYY-MM&bu=<BU_CODE>&employee=<CODE>&view=<grid|table>&filter=<all|due|overdue|large>&sort=<key>&search=<term>`.
  * Hỗ trợ F5 reload, back/forward trình duyệt, và chia sẻ link trực tiếp đến đúng chế độ xem/bộ lọc.
- **Customer Debt Detail Modal:**
  * Bấm `[🔍 Xem chi tiết nấc hạn (N)]` từ Dạng Thẻ hoặc Dạng Bảng để xem popup chi tiết: 4 Mini KPI + Bảng nấc hạn phát sinh (chỉ hiện nấc > 0).
  * Desktop: Dialog căn giữa (680px). Mobile: Bottom Sheet full-width bo góc, đóng bằng Esc hoặc click nền mờ.

---

## 2. 📁 Bảng Tổng Hợp File Đã Tạo Mới & Chỉnh Sửa (Phiên 18/08/2026)

| STT | Đường Dẫn File | Thao Tác | Vai Trò & Chức Năng |
| :---: | :--- | :---: | :--- |
| 1 | [`src/components/aging/AgingKpiGrid.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AgingKpiGrid.jsx) | MODIFY | Collapsible accordion: Mobile mặc định thu gọn + mini-badge tóm tắt. |
| 2 | [`src/components/aging/AgingCustomerCardGrid.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AgingCustomerCardGrid.jsx) | MODIFY | URL state sync 4 chiều, mặc định thu gọn accordion nhân sự, badge số nấc hạn trên nút. |
| 3 | [`src/components/aging/AgingCustomerTableView.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AgingCustomerTableView.jsx) | MODIFY | Sửa lỗi `expandedRows`, fix mobile bóp bảng: `minWidth: 900`, xóa `sticky-col`, swipe hint. |
| 4 | [`src/components/aging/AgingDistributionBar.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/AgingDistributionBar.jsx) | NEW | Stacked Bar 5 dải tuổi nợ với tooltip & legend responsive. |
| 5 | [`src/components/aging/CustomerDebtDetailModal.jsx`](file:///d:/Sources/project-dashboard/src/components/aging/CustomerDebtDetailModal.jsx) | NEW | Popup / Bottom-Sheet chi tiết công nợ khách hàng: 4 KPI mini + bảng nấc hạn phát sinh. |
| 6 | [`src/pages/DebtAgingReportPage.jsx`](file:///d:/Sources/project-dashboard/src/pages/DebtAgingReportPage.jsx) | MODIFY | Tích hợp `AgingDistributionBar`, truyền `buName` sang `AgingCustomerCardGrid`. |
| 7 | [`src/styles/dashboard.css`](file:///d:/Sources/project-dashboard/src/styles/dashboard.css) | MODIFY | Bổ sung CSS: Aging toolbar, filter chips, swipe hint, modal bottom-sheet, KPI accordion. |
| 8 | [`src/utils/numberFormat.js`](file:///d:/Sources/project-dashboard/src/utils/numberFormat.js) | MODIFY | `formatPercent(val, 2)` chuẩn hóa 1-2 chữ số thập phân. |
| 9 | [`CHANGELOG.md`](file:///d:/Sources/project-dashboard/CHANGELOG.md) | MODIFY | Ghi nhận đầy đủ từ `[1.0.5]` đến `[1.0.9]`. |

---

## 3. 🛡️ Trạng Thái Kiểm Thử & Git Release

- **Production Build:** `npm run build` → **✅ Built in ~580ms, 0 Errors**
- **Commit cần thực hiện:** `feat(aging): v1.0.9 — mobile responsive table, URL state sync, KPI accordion, customer detail modal`
- **Branch:** `main` → `origin/main`
