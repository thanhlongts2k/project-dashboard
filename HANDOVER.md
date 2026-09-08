# HANDOVER REPORT — PROJECT DASHBOARD

**Dự án:** Project Dashboard — Executive BI & Operations Report System  
**Phiên bản:** `v1.0.31` (Overview Refactor: Zero-Scroll Dual-Tier BU Table, Filtered Executive Alerts & Comprehensive Mobile Optimization)  
**Ngày cập nhật:** 08/09/2026  
**Trạng thái:** 🚀 **PRODUCTION READY** (`Build 100% Pass`, 0 Errors)

---

## 1. 🏗️ Tính Năng Mới & Nâng Cấp (v1.0.31)

- **Tái Cấu Trúc Khối Bảng Tổng Hợp BU Chuẩn C-Level:**
  * **4 Cột Cốt Lõi Đa Tầng (Dual-tier Cell):** Rút gọn từ 7 cột xuống 4 cột chính: `Đơn vị kinh doanh / Phụ trách`, `Tiến độ Doanh thu`, `Tiến độ Thu tiền`, và `Nhịp độ thời gian`. Tích hợp số Thực hiện / Kế hoạch ở tầng 1, Micro Progress Bar và % Đạt ở tầng 2.
  * **Tốc Độ Thu Bình Quân Ngày (Run-rate):** Tích hợp hiển thị `~X/ngày` (Thực thu / Cutoff Day) ở cột Thu tiền giúp Lãnh đạo nắm ngay vận tốc dòng tiền.
  * **Chỉ Số Nhịp Độ Thời Gian (Time-Pace Metric):** Đánh giá tiến độ bằng cách so sánh % Đạt với % Thời gian thực tế trong tháng ($D_{\text{cutoff}} / D_{\text{total}} \approx 23.3\%$), xóa bỏ định kiến so sánh ngày 7 với chỉ tiêu cả tháng dẫn tới đỏ rực vô lý.
  * **Zero-Scroll & Fit-to-Content:** Triệt tiêu hoàn toàn thanh cuộn dọc nội bộ (overflow-y scrollbar), hiển thị trọn vẹn 100% 10 dòng (Tổng toàn công ty + 9 BU, gồm SAB Thủy sản). Hàng TỔNG nổi bật với `bg-slate-100/90 font-bold border-b-2`.
  * **Executive Exception Alerts:** Lọc sạch 100% cảnh báo rác (`Target=0, Gap=0` hoặc BU đạt nhịp $\ge 80\%$), chỉ giữ lại Top 6 ngoại lệ nguy cấp nhất (Tồn kho vượt trần, Nợ NH sát trần, Chậm nhịp nặng).

- **Tối Ưu Hóa Toàn Diện Giao Diện Mobile (< 768px):**
  * **Trục X Biểu Đồ Vuốt Ngang:** Container `chart-inner-scroll` (`min-width: 660px`, `scrollbar-none`) loại bỏ triệt để tình trạng nhãn BU bị rớt dòng đè chữ.
  * **Segmented Switcher:** Thanh chuyển đổi tinh gọn `[ 📊 Tổng Hợp BU (10) ]` và `[ 🚨 Cảnh Báo (6) ]` giảm hơn 60% chiều dài trang cuộn trên điện thoại.
  * **Mobile BU Cards:** Danh sách thẻ compact 2 cột cân đối (Doanh thu & Thu tiền), ghim thẻ TỔNG lên đầu với nền `bg-slate-100`.
  * **Bảo Toàn Desktop (>= 768px):** Tự động ẩn tab, giữ nguyên 100% layout 2 cột song song zero-scroll.

---

## 2. 📁 Bảng Tổng Hợp File Đã Chỉnh Sửa & Tạo Mới

| STT | Đường Dẫn File | Thao Tác | Vai Trò & Chức Năng |
| :---: | :--- | :---: | :--- |
| 1 | [`src/components/dashboard/BuMobileCards.jsx`](file:///d:/Sources/project-dashboard/src/components/dashboard/BuMobileCards.jsx) | **NEW** | Component render danh sách thẻ BU compact 2 cột trên Mobile. |
| 2 | [`src/styles/modules/overview-table.css`](file:///d:/Sources/project-dashboard/src/styles/modules/overview-table.css) | **NEW** | Module CSS chuyên biệt cho bảng Tổng quan, Alert Hub, Segmented Tabs & Mobile Cards. |
| 3 | [`src/components/dashboard/BuPerformanceTable.jsx`](file:///d:/Sources/project-dashboard/src/components/dashboard/BuPerformanceTable.jsx) | MODIFY | Tích hợp Mobile Segmented Tabs và điều kiện hiển thị Table (Desktop) / Cards (Mobile). |
| 4 | [`src/components/DataTable.jsx`](file:///d:/Sources/project-dashboard/src/components/DataTable.jsx) | MODIFY | Hỗ trợ render Dual-tier Cell, Micro-bar, Pace-badge, Row-total-corp, Alert-row. |
| 5 | [`src/components/ProgressChart.jsx`](file:///d:/Sources/project-dashboard/src/components/ProgressChart.jsx) | MODIFY | Bọc chart trong container vuốt ngang hỗ trợ Mobile. |
| 6 | [`src/styles/dashboard.css`](file:///d:/Sources/project-dashboard/src/styles/dashboard.css) | MODIFY | Import module `overview-table.css`. |
| 7 | [`src/utils/dashboardMapper.js`](file:///d:/Sources/project-dashboard/src/utils/dashboardMapper.js) | MODIFY | Logic Time-Pace, Run-rate thu tiền, bộ 4 cột mới và bộ lọc Executive Alerts. |
| 8 | [`CHANGELOG.md`](file:///d:/Sources/project-dashboard/CHANGELOG.md) | MODIFY | Ghi nhận phiên bản `[1.0.31]`. |
| 9 | [`HANDOVER.md`](file:///d:/Sources/project-dashboard/HANDOVER.md) | MODIFY | Báo cáo bàn giao phiên bản `v1.0.31`. |

---

## 3. 🛡️ Trạng Thái Kiểm Thử & Build

- **Vite Build (`npm run build`):**
  * ✅ `✓ 850 modules transformed.`
  * ✅ `dist/index.html`: `0.69 kB`
  * ✅ `dist/assets/index-DDJ1hb8K.js`: `1,519.47 kB`
  * ✅ `dist/assets/index-C4jV80uG.css`: `65.69 kB`
  * ✅ **0 Errors, 0 Warnings lỗi.**
- **Visual Verification (Playwright):**
  * ✅ Desktop (1920x1080): Đạt chuẩn Zero-Scroll, đủ 10 dòng, không thanh cuộn ngang/dọc.
  * ✅ Mobile (390x844): Segmented Switcher mượt mà, Thẻ compact 2 cột, Trục X biểu đồ vuốt ngang không đè chữ.

