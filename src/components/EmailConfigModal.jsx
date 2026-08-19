import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import {
  getEmailConfig,
  saveEmailConfig,
  parseRecipients,
} from "../utils/emailSchedule";

const WEEKDAYS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
];

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  zIndex: 1200,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: 16,
  overflowY: "auto",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
};

const cardStyle = {
  width: 480,
  maxWidth: "94vw",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
  padding: "20px 22px",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#5f5e5a",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  border: "1px solid #d8d6cd",
  borderRadius: 10,
  padding: "9px 11px",
  fontSize: 13,
  color: "#2c2c2a",
  background: "#fff",
  boxSizing: "border-box",
};

const fieldStyle = { marginBottom: 14 };

export default function EmailConfigModal({ open, isOpen, onClose }) {
  const isVisible = open !== undefined ? open : isOpen !== undefined ? isOpen : true;
  const [form, setForm] = useState(getEmailConfig);

  // Khoá cuộn nền trang khi modal đang mở
  useBodyScrollLock(isVisible);

  useEffect(() => {
    if (isVisible) {
      setForm(getEmailConfig());
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const validateRecipients = () => {
    const recipients = parseRecipients(form.recipients);
    if (!recipients.length) {
      toast.error("Nhập ít nhất 1 mail nhận hợp lệ (cách nhau bằng dấu phẩy).");
      return false;
    }
    return true;
  };

  const validateSender = () => {
    const sender = String(form.senderEmail || "").trim();
    if (sender && !/^\S+@\S+\.\S+$/.test(sender)) {
      toast.error("Mail gửi (From) không đúng định dạng email.");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateSender()) return;
    if (form.enabled && !validateRecipients()) return;

    saveEmailConfig(form);
    toast.success("Đã lưu cấu hình gửi báo cáo.");
    onClose?.();
  };

  const handleSendNow = () => {
    if (!validateSender()) return;
    if (!validateRecipients()) return;

    saveEmailConfig(form);
    onClose?.();
    window.dispatchEvent(new Event("report-email-send-now"));
  };

  return (
    <div style={overlayStyle} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div style={cardStyle}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#2c2c2a" }}>
            Cấu hình gửi báo cáo qua email
          </div>
          <div style={{ fontSize: 12, color: "#9a968a", marginTop: 4 }}>
            Tự động gửi báo cáo tổng hợp (PDF) tới mail nhận theo lịch.
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2c2c2a", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!!form.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
            />
            <span>Bật tự động gửi theo lịch</span>
          </label>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Mail gửi (From)</label>
          <input
            style={inputStyle}
            type="email"
            placeholder="baocao@congty.com (để trống dùng mail hệ thống)"
            value={form.senderEmail}
            onChange={(e) => update({ senderEmail: e.target.value })}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Mail nhận (To) — cách nhau bằng dấu phẩy</label>
          <textarea
            style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
            placeholder="giamdoc@congty.com, ketoan@congty.com"
            value={form.recipients}
            onChange={(e) => update({ recipients: e.target.value })}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ ...fieldStyle, flex: 1 }}>
            <label style={labelStyle}>Tần suất</label>
            <select
              style={inputStyle}
              value={form.frequency}
              onChange={(e) => update({ frequency: e.target.value })}
            >
              <option value="daily">Mỗi ngày</option>
              <option value="weekly">Mỗi tuần</option>
              <option value="monthly">Mỗi tháng</option>
            </select>
          </div>

          {form.frequency === "weekly" && (
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label style={labelStyle}>Vào thứ</label>
              <select
                style={inputStyle}
                value={form.weeklyDay}
                onChange={(e) => update({ weeklyDay: Number(e.target.value) })}
              >
                {WEEKDAYS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.frequency === "monthly" && (
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label style={labelStyle}>Vào ngày</label>
              <select
                style={inputStyle}
                value={form.monthlyDay}
                onChange={(e) => update({ monthlyDay: Number(e.target.value) })}
              >
                {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                  <option key={day} value={day}>
                    Ngày {day}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ ...fieldStyle, flex: 1 }}>
            <label style={labelStyle}>Giờ gửi</label>
            <input
              style={inputStyle}
              type="time"
              value={form.sendTime}
              onChange={(e) => update({ sendTime: e.target.value })}
            />
          </div>
        </div>

        <div
          style={{
            fontSize: 11.5,
            lineHeight: 1.5,
            color: "#8a7a52",
            background: "#f6f0dc",
            border: "1px solid #e8d98a",
            borderRadius: 10,
            padding: "9px 11px",
            marginBottom: 16,
          }}
        >
          Lưu ý: lịch tự động chỉ chạy khi dashboard đang mở trong trình duyệt.
          Trong lúc gửi, app sẽ tự lướt qua các trang báo cáo để chụp dữ liệu.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleSendNow}
            style={{
              border: "1px solid #d8d6cd",
              background: "#fff",
              color: "#2c2c2a",
              borderRadius: 10,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Gửi thử ngay
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #d8d6cd",
              background: "#fff",
              color: "#5f5e5a",
              borderRadius: 10,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              border: "none",
              background: "#185FA5",
              color: "#fff",
              borderRadius: 10,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}
