import { useEffect } from "react";
import { formatPercent } from "../../utils/numberFormat";

function formatFullVnd(val, isDanger = false) {
  const num = Number(val);
  if (!num || num === 0) return <span style={{ color: "#94a3b8" }}>0 đ</span>;
  return (
    <span style={{ color: isDanger ? "#dc2626" : "inherit", fontWeight: isDanger ? 700 : "inherit" }}>
      {`${num.toLocaleString("vi-VN")} đ`}
    </span>
  );
}

function RoleBadge({ role }) {
  const styles = {
    CCO: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    BU_HEAD: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
    MANAGER: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
    SALES: { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
  }[role] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };

  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}>
      {role}
    </span>
  );
}

export default function CustomerDebtDetailModal({ isOpen, customer, buName = "", onClose }) {
  // Đóng modal khi bấm phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !customer) return null;

  const c = customer;
  const totalDebt = Number(c.totalDebt || 0);
  const totalBeforeDue = Number(c.totalBeforeDue || 0);
  const totalOverdue = Number(c.totalOverdue || 0);
  const overduePercent = Number(c.overduePercent || 0);
  const inDuePercent = totalDebt > 0 ? (totalBeforeDue / totalDebt) * 100 : 0;

  // Danh sách chi tiết 13 nấc hạn
  const allBuckets = [
    { key: "due_0_7", label: "Trước hạn 0-7 ngày", type: "due", val: c.due_0_7, color: "#0369a1" },
    { key: "due_8_14", label: "Trước hạn 8-14 ngày", type: "due", val: c.due_8_14, color: "#0369a1" },
    { key: "due_15_21", label: "Trước hạn 15-21 ngày", type: "due", val: c.due_15_21, color: "#0369a1" },
    { key: "due_22_28", label: "Trước hạn 22-28 ngày", type: "due", val: c.due_22_28, color: "#0369a1" },
    { key: "due_29_60", label: "Trước hạn 29-60 ngày", type: "due", val: c.due_29_60, color: "#0369a1" },
    { key: "due_over_60", label: "Trước hạn >60 ngày", type: "due", val: c.due_over_60, color: "#0369a1" },
    { key: "overdue_1_14", label: "Quá hạn 1-14 ngày", type: "overdue", val: c.overdue_1_14, color: "#c2410c" },
    { key: "overdue_15_30", label: "Quá hạn 15-30 ngày", type: "overdue", val: c.overdue_15_30, color: "#c2410c" },
    { key: "overdue_31_45", label: "Quá hạn 31-45 ngày", type: "overdue", val: c.overdue_31_45, color: "#c2410c" },
    { key: "overdue_46_60", label: "Quá hạn 46-60 ngày", type: "overdue", val: c.overdue_46_60, color: "#c2410c" },
    { key: "overdue_61_90", label: "Quá hạn 61-90 ngày", type: "overdue", val: c.overdue_61_90, color: "#c2410c" },
    { key: "overdue_91_120", label: "Quá hạn 91-120 ngày", type: "overdue", val: c.overdue_91_120, color: "#c2410c" },
    { key: "overdue_over_120", label: "Quá hạn >120 ngày", type: "overdue", val: c.overdue_over_120, color: "#dc2626", isDanger: true },
  ];

  // Chỉ hiển thị các nấc hạn có phát sinh số tiền > 0
  const activeBuckets = allBuckets.filter((b) => Number(b.val || 0) > 0);

  return (
    <div
      className="aging-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="aging-modal-card"
        style={{
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          animation: "fadeInUp 0.2s ease-out",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>🏢</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
                {c.name}
              </h3>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}>
                {c.id}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
              {c.staffName && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span>Phụ trách: <strong style={{ color: "#334155" }}>{c.staffName}</strong></span>
                  {c.staffRole && <RoleBadge role={c.staffRole} />}
                </div>
              )}
              {buName && (
                <span>• Khối: <strong style={{ color: "#334155" }}>{buName}</strong></span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 14,
              color: "#475569",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
            title="Đóng (Esc)"
          >
            ✕
          </button>
        </div>

        {/* BODY CONTENT */}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {/* 4 THẺ MINI KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
            {/* TỔNG NỢ */}
            <div style={{ background: "#fefce8", border: "1px solid #fef08a", padding: "10px 12px", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#854d0e", textTransform: "uppercase" }}>Tổng Công Nợ</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#854d0e", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                {formatFullVnd(totalDebt)}
              </div>
              <div style={{ fontSize: 10.5, color: "#a16207", marginTop: 2 }}>Toàn bộ dư nợ</div>
            </div>

            {/* TRONG HẠN */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 12px", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>Trong Hạn</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#15803d", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                {formatFullVnd(totalBeforeDue)}
              </div>
              <div style={{ fontSize: 10.5, color: "#16a34a", marginTop: 2 }}>Tỷ trọng {formatPercent(inDuePercent)}</div>
            </div>

            {/* QUÁ HẠN */}
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 12px", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase" }}>Quá Hạn</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: totalOverdue > 0 ? "#dc2626" : "#b91c1c", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                {formatFullVnd(totalOverdue, totalOverdue > 0)}
              </div>
              <div style={{ fontSize: 10.5, color: "#dc2626", marginTop: 2 }}>Tỷ trọng {formatPercent(overduePercent)}</div>
            </div>

            {/* TỶ LỆ QUÁ HẠN */}
            <div style={{ background: overduePercent > 20 ? "#fff1f2" : "#f0f9ff", border: `1px solid ${overduePercent > 20 ? "#fecdd3" : "#bae6fd"}`, padding: "10px 12px", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: overduePercent > 20 ? "#9f1239" : "#0369a1", textTransform: "uppercase" }}>Tỷ Lệ Quá Hạn</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: overduePercent > 20 ? "#dc2626" : "#0369a1", marginTop: 4 }}>
                {formatPercent(overduePercent)}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: overduePercent > 20 ? "#e11d48" : "#0284c7", marginTop: 2 }}>
                {overduePercent === 0 ? "✓ An toàn" : overduePercent <= 20 ? "⚠️ Cần theo dõi" : "🚨 Vượt ngưỡng (20%)"}
              </div>
            </div>
          </div>

          {/* BẢNG CHI TIẾT CÁC NẤC HẠN (chỉ nấc có phát sinh) */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📊 Chi tiết nấc hạn phát sinh</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                background: activeBuckets.length > 0 ? "#f0fdf4" : "#f1f5f9",
                color: activeBuckets.length > 0 ? "#166534" : "#64748b",
                border: `1px solid ${activeBuckets.length > 0 ? "#bbf7d0" : "#e2e8f0"}` }}>
                {activeBuckets.length} nấc hạn
              </span>
            </div>

            {activeBuckets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 16px", color: "#94a3b8",
                fontSize: 13, fontStyle: "italic", background: "#f8fafc",
                borderRadius: 8, border: "1px solid #e2e8f0" }}>
                Không có nấc hạn phát sinh số dư trong kỳ này.
              </div>
            ) : (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1", color: "#475569", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px", fontWeight: 700 }}>Nấc Hạn</th>
                      <th style={{ padding: "8px 12px", fontWeight: 700, width: 100 }}>Phân Loại</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>Số Tiền Phát Sinh</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, width: 90 }}>Tỷ Trọng (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBuckets.map((b, idx) => {
                      const numVal = Number(b.val || 0);
                      const pct = totalDebt > 0 ? (numVal / totalDebt) * 100 : 0;
                      const isOverdue = b.type === "overdue";

                      return (
                        <tr
                          key={b.key}
                          style={{
                            background: isOverdue ? "#fff5f5" : "#f0fdf4",
                            borderBottom: idx < activeBuckets.length - 1 ? "1px solid #e2e8f0" : "none",
                          }}
                        >
                          <td style={{ padding: "8px 12px", color: "#0f172a", fontWeight: 700 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: b.color, flexShrink: 0 }} />
                              {b.label}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                              background: isOverdue ? "#fee2e2" : "#dcfce7",
                              color: isOverdue ? "#991b1b" : "#166534" }}>
                              {isOverdue ? "Quá hạn" : "Trong hạn"}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            <strong style={{ color: b.isDanger ? "#dc2626" : isOverdue ? "#c2410c" : "#0369a1" }}>
                              {formatFullVnd(numVal, b.isDanger)}
                            </strong>
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700,
                            color: isOverdue ? "#dc2626" : "#166534" }}>
                            {formatPercent(pct)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{
              padding: "7px 18px",
              borderRadius: 6,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              fontSize: 12.5,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
