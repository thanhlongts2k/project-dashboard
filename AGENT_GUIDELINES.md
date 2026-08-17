# 📜 BỘ QUY TẮC VẬN HÀNH DỰ ÁN (AGENT_GUIDELINES.md)

Tài liệu này định nghĩa các nguyên tắc cốt lõi và quy trình làm việc chuẩn bắt buộc áp dụng đối với mọi AI Coding Agent (Antigravity / Claude Code / Cursor...) khi tham gia phát triển, bảo trì và nâng cấp dự án **`project-dashboard`**.

---

## 1. 🎯 NGUYÊN TẮC LẬP KẾ HOẠCH (PLANNING FIRST)
- Khi nhận bất kỳ task mới nào (dù lớn hay nhỏ), **TUYỆT ĐỐI KHÔNG** được vội vàng code ngay lập tức.
- Phải luôn thực hiện:
  1. Đọc và phân tích hiện trạng mã nguồn liên quan.
  2. Đánh giá phạm vi và mức độ ảnh hưởng (impact analysis).
  3. Lập kế hoạch thực hiện chi tiết theo từng bước rõ ràng trước khi bắt tay vào chỉnh sửa mã nguồn.

---

## 2. 💡 NGUYÊN TẮC ĐA PHƯƠNG ÁN (MULTI-SOLUTION PROPOSAL)
- Đối với mỗi bài toán kỹ thuật, kiến trúc hoặc giao diện cần giải quyết, Agent phải luôn đề xuất ít nhất **2 đến 3 phương án khả thi**.
- Cấu trúc phân tích cho mỗi phương án phải bao gồm:
  - **Mô tả cách tiếp cận (Approach)**
  - **Ưu điểm (Pros)**
  - **Nhược điểm (Cons)**
  - **Mức độ phức tạp & thời gian triển khai (Complexity)**
  - **Khả năng mở rộng trong tương lai (Scalability)**
  - **Đề xuất khuyến nghị (Recommendation)**
- Chờ người dùng lựa chọn hoặc thống nhất phương án tối ưu trước khi triển khai.

---

## 3. ⚡ NGUYÊN TẮC TIẾT KIỆM TÀI NGUYÊN & TOKEN (RESOURCE EFFICIENCY)
- Luôn ưu tiên giải pháp tối ưu hiệu năng chạy của ứng dụng và tiết kiệm context window / token của LLM.
- **Kích thước file chuẩn:** Giữ kích thước mỗi file Component / Module luôn **dưới 200 - 250 dòng** (tuân thủ nguyên tắc Single Responsibility). Khi file vượt ngưỡng, chủ động bóc tách thành sub-components.
- **Thao tác có trọng tâm:** Chỉ đọc và sửa đúng các file/dòng code cần thiết; không in log rác lớn hay đọc lan man toàn bộ thư mục không liên quan.

---

## 4. 📝 NGUYÊN TẮC TRUY VẾT & BÀN GIAO (CHANGELOG & HANDOVER MANDATORY)
Sau khi hoàn thành bất kỳ task hoặc giai đoạn (phase) nào, Agent **BẮT BUỘC** phải cập nhật đồng thời 2 tài liệu:
1. **`CHANGELOG.md`:** Ghi nhận phiên bản và nội dung chi tiết theo chuẩn Keep a Changelog:
   - `[Added]`: Tính năng, component, utility mới.
   - `[Changed]`: Refactor, tối ưu cấu trúc, thay đổi logic.
   - `[Fixed]`: Sửa lỗi giao diện, lỗi logic, xung đột CSS.
   - `[Removed]`: Xóa file, code thừa hoặc deprecated.
2. **`HANDOVER.md`:** Báo cáo bàn giao phiên làm việc:
   - Tóm tắt hiện trạng kỹ thuật sau thay đổi.
   - Hướng dẫn kiểm thử nhanh (Manual Test Guide) cho người dùng.
   - Checklist công việc sẵn sàng cho phase kế tiếp.

---

## 5. 🛡️ NGUYÊN TẮC AN TOÀN GIT & QUYỀN HẠN (GIT SAFETY & NO AUTO-COMMIT)
- **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý CHẠY CÁC LỆNH `git commit`, `git push`, `git merge`, `git rebase`** khi chưa có sự xác nhận bằng lời rõ ràng từ người dùng trong đoạn chat.
- Quy trình chuẩn trước khi commit:
  1. Chạy `npm run build` đảm bảo đạt **0 lỗi**.
  2. Chạy `git status` và `git diff` để kiểm tra danh sách file đã thay đổi.
  3. Trình bày tóm tắt kết quả cho người dùng và **hỏi ý kiến xác nhận** trước khi thực thi lệnh commit.
