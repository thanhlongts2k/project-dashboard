# Project Dashboard — Executive BI & Operations Report System

Hệ thống **Dashboard Điều hành & Báo cáo Quản trị Doanh nghiệp** (Executive BI & Operations Dashboard) dành cho Ban Lãnh Đạo, Giám Đốc Khối và Trưởng các Đơn vị Kinh doanh (BU).

---

## 🌟 Tính Năng Nổi Bật

- **Dashboard Tổng Quan (Overview BI):**
  - Giám sát 4 chỉ số cốt lõi thời gian thực: **Doanh thu theo kỳ**, **Thu tiền**, **Tồn kho**, **Dư nợ ngân hàng**.
  - Tách bạch chỉ số thị trường quốc tế (Lào, Campuchia...).
  - Biểu đồ tiến độ lũy kế theo ngày so với Kế hoạch (KPI).
  - Bảng tổng hợp hiệu quả kinh doanh phân cấp Root BU $\rightarrow$ Sub BU.
  - Cảnh báo tự động các đơn vị có tỷ lệ đạt kế hoạch dưới ngưỡng.
- **Chi Tiết Đơn Vị Kinh Doanh (BU Deep-Dive):**
  - Tabs chuyển đổi nhanh giữa các BU (Elevator, Thiết bị điện cao cấp iBiz Premium, Phổ thông iBiz Value, ECO, AgriTech, Sản xuất...).
  - Phân rã số liệu chi tiết đến từng chi nhánh, phòng ban, nhóm sản phẩm.
  - So sánh tốc độ tăng trưởng với kỳ trước (Growth vs Previous Period).
- **Báo Cáo Quản Lý Tồn Kho (Inventory Report):**
  - Tổng giá trị tồn kho toàn hệ thống.
  - Biểu đồ Donut cơ cấu tồn kho theo BU và kho hàng chính.
  - Biểu đồ cột Xuất - Nhập - Tồn.
  - Cảnh báo kho hàng tồn lớn, nhập/xuất đột biến, kho bất động.
- **Báo Cáo Quản Lý Công Nợ & Thu Tiền (Receivable Report):**
  - Phân loại tuổi nợ (Chưa đến hạn, Quá hạn 1-30 ngày, 30-90 ngày, Trên 90 ngày).
  - Theo dõi dòng tiền thu hồi thực tế theo ngày (Hôm qua vs Hôm nay vs Ngày mai).
- **Tự Động Hóa Xuất Báo Cáo:**
  - Xuất báo cáo PDF đa trang chất lượng cao (chuẩn in ấn A4 ngang).
  - Lập lịch tự động gửi email báo cáo định kỳ hàng ngày kèm file PDF đính kèm.
- **Xác Thực Đa Nền Tảng:**
  - Hỗ trợ đăng nhập tài khoản hệ thống hoặc Single Sign-On qua **Google Workspace**.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Framework:** React 19 (`v19.2.4`)
- **Bundler:** Vite 8 (`v8.0.4`)
- **Biểu đồ:** Recharts (`v3.8.1`)
- **Xuất PDF:** jspdf + html2canvas
- **Thông báo:** react-hot-toast
- **Kiểm thực:** Google Identity Services

---

## 🚀 Cài Đặt & Chạy Dự Án

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo file `.env` hoặc `.env.development` từ mẫu `.env.example`:
```bash
cp .env.example .env
```

### 3. Chạy ở môi trường Development
```bash
npm run dev
```

### 4. Build Production
```bash
npm run build
```

---

## 📂 Cấu Trúc Mã Nguồn

```text
src/
├── api/          # Tầng giao tiếp REST API backend
├── components/   # Các UI Component dùng chung (Chart, Table, MetricCard...)
├── pages/        # 5 Màn hình chức năng chính (Login, Overview, BU Detail, Inventory, Receivable)
├── styles/       # Hệ thống CSS Design System
├── utils/        # Logic nghiệp vụ, Mappers, Export PDF, Scheduler
├── App.jsx       # Component gốc điều phối trạng thái toàn ứng dụng
└── main.jsx      # Entry point
```
