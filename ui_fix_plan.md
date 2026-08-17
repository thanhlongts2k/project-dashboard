# 🎨 KẾ HOẠCH TINH CHỈNH GIAO DIỆN TOÀN DIỆN (UI POLISH PLAN)

**Dự án:** Project Dashboard — Executive BI & Operations Report System  
**Ngày lập:** 17/08/2026  
**Trạng thái:** 📝 ĐANG CHỜ DUYỆT (Pending Approval)

---

## 1. 🔍 KẾT QUẢ RÀ SOÁT HIỆN TRẠNG GIAO DIỆN TRÊN 4 MÀN HÌNH

Sau khi rà soát chi tiết toàn bộ 4 màn hình (`/dashboard`, `/bu/:buKey`, `/inventory`, `/receivables`), nhóm phát triển ghi nhận các điểm cần tinh chỉnh như sau:

### 1.1. Khu vực Header & Sub-Header (2 Tầng)
- **Khoảng cách lề (Spacing/Padding):** TopBar Tầng 1 và Sub-Header Tầng 2 đang có một số style inline xen lẫn file CSS, dẫn đến khoảng cách giữa Sub-Header và khối KPI bên dưới chưa hoàn toàn đồng nhất khi co giãn màn hình.
- **Dropdown chọn BU (`UnifiedSubHeader.jsx`):** Style của select inline (`#185FA5`, nền `#f0f7ff`) hơi cứng và mũi tên select mặc định của trình duyệt chưa được tùy biến tinh tế.
- **Date Range Picker (`DateRangePicker.jsx`):** Khung dropdown custom range hiển thị tốt nhưng cần thêm bóng đổ mềm và bo góc chuẩn để tách biệt rõ với nền trang.

### 1.2. Lưới Thẻ KPI (Cards Grid & MetricCard)
- **Độ cao không đồng đều (Unequal Height):** Các thẻ KPI trong cùng một hàng có thể bị lệch chiều cao khi có thẻ có thêm dòng `deltaText` / `note` và thẻ khác thì không. Cần chuyển sang cơ chế `display: flex; flex-direction: column; justify-content: space-between; height: 100%;`.
- **Độ tương phản chữ số (WCAG Contrast Ratio):** Dòng nhãn mục tiêu (`.metric-target`) đang sử dụng màu `#b4b2a9` trên nền trắng (độ tương phản ~2.1:1, dưới chuẩn WCAG AA 4.5:1), gây khó đọc trên các màn hình có độ sáng cao.
- **Thanh tiến độ (Progress Track):** Thanh track 5px hiện tại hơi mảnh, cần bo tròn nhẹ (`border-radius: 999px`) và có hiệu ứng chuyển màu mượt mà.

### 1.3. Biểu Đồ & Bảng Biểu (Charts & DataTables)
- **Thanh cuộn bảng (Custom Scrollbar):** Khung `table-wrap` khi cuộn ngang trên Windows đang hiển thị thanh cuộn xám dày mặc định (16px) gây thô. Cần custom thanh cuộn mỏng (5-6px) bán trong suốt.
- **Hiệu ứng Hover dòng bảng (Row Hover Effect):** Bảng tổng hợp BU và Bảng tồn kho cần có hiệu ứng hover dòng nhẹ (`background: #f8fafc`) để người dùng dễ theo dõi đối chiếu số liệu theo hàng ngang.
- **Tooltip Biểu đồ (Recharts Tooltip):** Đồng bộ 100% theme tooltip sang màu nền tối sang trọng (`#1e293b`), chữ trắng sắc nét, viền mờ và đổ bóng nhẹ.

### 1.4. Hệ Thống Màu Sắc & Nhận Diện Thương Hiệu (Color System)
- Hiện tại dự án đang có sự phân mảnh giữa các mã màu xanh dương (`#185fa5` vs `#3b82f6`), xanh lá (`#1d9e75` vs `#166534` vs `#639922`) và màu cảnh báo cam/đỏ.
- Cần chuẩn hóa toàn bộ vào bộ biến CSS Design Tokens đồng nhất tại `:root` trong `src/styles/dashboard.css`.

---

## 2. 💡 ĐỀ XUẤT ĐA PHƯƠNG ÁN XỬ LÝ (MULTI-SOLUTION PROPOSAL)

| Tiêu chí | **Phương án 1: Executive Modern Minimalist (Khuyến nghị)** | **Phương án 2: Elevated Card Shadow & Glassmorphism** |
| :--- | :--- | :--- |
| **Ý tưởng cốt lõi** | Tập trung vào sự tinh tế, phẳng, sắc nét, viền siêu mỏng 1px (`#e2e8f0`), micro-shadow (`0 1px 3px rgba(0,0,0,0.05)`), typography chuẩn mực. | Tập trung vào hiệu ứng nổi khối, bóng đổ sâu (`0 10px 15px -3px rgba(0,0,0,0.08)`), bo góc lớn 12-14px, nền thẻ gradient nhẹ. |
| **Ưu điểm** | - Tải siêu nhanh, giao diện nghiêm túc, tập trung 100% vào số liệu BI điều hành.<br>- Rất thân thiện khi in ấn và xuất file PDF (không bị lem bóng).<br>- Dễ dàng bảo trì và đồng bộ CSS tokens. | - Trông hiện đại, bắt mắt, tạo chiều sâu thị giác (3D depth).<br>- Cảm giác ứng dụng web cao cấp. |
| **Nhược điểm** | - Đòi hỏi căn chỉnh tỉ mỉ từng pixel padding/margin và font-weight. | - Bóng đổ lớn có thể làm rối mắt khi hiển thị bảng nhiều hàng cột.<br>- Xuất PDF có thể bị sai lệch màu bóng đổ trên một số trình duyệt. |
| **Mức độ phức tạp** | **Vừa phải** (Chủ yếu can thiệp `dashboard.css` và vài component nhỏ). | **Trung bình - Cao** (Cần viết lại shadow layers, backdrop blur và hiệu ứng gradient). |
| **Khả năng mở rộng**| **Rất cao** (Nhờ chuẩn hóa CSS Variables `:root`). | **Khá** (Phụ thuộc vào các bộ lọc blur/shadow). |

> **⭐ ĐỀ XUẤT KHUYẾN NGHỊ: CHỌN PHƯƠNG ÁN 1 (Executive Modern Minimalist).**  
> Phương án này giữ đúng tinh thần của hệ thống Executive Dashboard dành cho Ban Lãnh Đạo: tối ưu khả năng đọc số liệu, tinh gọn, tốc độ cao và xuất PDF chuẩn 100%.

---

## 3. 🛠️ DANH SÁCH FILE DỰ KIẾN CAN THIỆP & PHẠM VI SỬA

1. **`src/styles/dashboard.css` (Trọng tâm ~80% thay đổi):**
   - Định nghĩa Design Tokens tại `:root` (Colors, Shadows, Radii, Spacing, Typography).
   - Tinh chỉnh CSS Custom Scrollbar (`::-webkit-scrollbar`).
   - Cập nhật Card, MetricCard (Equal Height Flex), DataTable Hover & Striping.
2. **`src/components/MetricCard.jsx`:**
   - Cải thiện độ tương phản của `.metric-target` từ `#b4b2a9` lên `#64748b`.
   - Đảm bảo thẻ luôn giãn đều chiều cao (Flex stretch).
3. **`src/components/common/UnifiedSubHeader.jsx` & `DateRangePicker.jsx`:**
   - Đồng bộ style nút bấm và dropdown với Design Tokens mới.
4. **`src/components/DataTable.jsx`:**
   - Chuẩn hóa padding ô (`8px 12px`), căn lề số liệu phải (right-align) và chữ trái (left-align).
5. **`src/layouts/DashboardLayout.jsx`:**
   - Tinh chỉnh khoảng cách lề TopBar để thẳng hàng tuyệt đối với nội dung bên dưới (Container max-width 1400px).

---

## 4. 🧪 KẾ HOẠCH KIỂM THỬ & NGHIỆM THU

- [ ] Kiểm tra hiển thị trên 4 độ phân giải: Laptop 1366x768, Desktop 1920x1080, Tablet 1024x768, Mobile 375x667.
- [ ] Kiểm tra độ tương phản màu sắc đạt chuẩn WCAG AA.
- [ ] Kiểm tra xuất file PDF trang đơn và PDF toàn bộ không bị lỗi viền/bóng.
- [ ] Chạy `npm run build` đảm bảo 0 lỗi.
