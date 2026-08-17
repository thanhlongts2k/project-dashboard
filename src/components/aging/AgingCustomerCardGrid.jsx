import { useState } from "react";
import { formatPercent } from "../../utils/numberFormat";

function formatVnd(val, isDanger = false) {
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

function CustomerDebtCard({ customer: c }) {
  const [showBuckets, setShowBuckets] = useState(false);

  const buckets = [
    { label: "Trước hạn 0-7 ngày", val: c.due_0_7, color: "#0369a1" },
    { label: "Trước hạn 8-14 ngày", val: c.due_8_14, color: "#0369a1" },
    { label: "Trước hạn 15-21 ngày", val: c.due_15_21, color: "#0369a1" },
    { label: "Trước hạn 22-28 ngày", val: c.due_22_28, color: "#0369a1" },
    { label: "Trước hạn 29-60 ngày", val: c.due_29_60, color: "#0369a1" },
    { label: "Trước hạn >60 ngày", val: c.due_over_60, color: "#0369a1" },
    { label: "Quá hạn 1-14 ngày", val: c.overdue_1_14, color: "#c2410c" },
    { label: "Quá hạn 15-30 ngày", val: c.overdue_15_30, color: "#c2410c" },
    { label: "Quá hạn 31-45 ngày", val: c.overdue_31_45, color: "#c2410c" },
    { label: "Quá hạn 46-60 ngày", val: c.overdue_46_60, color: "#c2410c" },
    { label: "Quá hạn 61-90 ngày", val: c.overdue_61_90, color: "#c2410c" },
    { label: "Quá hạn 91-120 ngày", val: c.overdue_91_120, color: "#c2410c" },
    { label: "Quá hạn >120 ngày", val: c.overdue_over_120, color: "#dc2626", isDanger: true },
  ].filter((b) => Number(b.val) > 0);

  const inDuePct = c.totalDebt > 0 ? (c.totalBeforeDue / c.totalDebt) * 100 : 0;
  const overduePct = c.totalDebt > 0 ? (c.totalOverdue / c.totalDebt) * 100 : 0;

  return (
    <div className="aging-customer-card">
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a", lineHeight: 1.3, flex: 1, minWidth: 0 }} title={c.name}>
            {c.name}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
            {c.id}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>TỔNG CÔNG NỢ</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#854d0e", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
              {formatVnd(c.totalDebt)}
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: c.overduePercent > 20 ? "#fee2e2" : "#dcfce7", color: c.overduePercent > 20 ? "#991b1b" : "#166534", border: `1px solid ${c.overduePercent > 20 ? "#fca5a5" : "#86efac"}` }}>
            {formatPercent(c.overduePercent)} quá hạn
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "8px 10px", borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: "#0369a1", fontWeight: 700, textTransform: "uppercase" }}>Trong hạn ({formatPercent(inDuePct)})</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{formatVnd(c.totalBeforeDue)}</div>
          </div>
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "8px 10px", borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: "#c2410c", fontWeight: 700, textTransform: "uppercase" }}>Quá hạn ({formatPercent(overduePct)})</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.totalOverdue > 0 ? "#dc2626" : "#c2410c", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{formatVnd(c.totalOverdue, c.totalOverdue > 0)}</div>
          </div>
        </div>
      </div>

      {buckets.length > 0 && (
        <div style={{ marginTop: "auto", paddingTop: 4 }}>
          <button
            type="button"
            onClick={() => setShowBuckets((p) => !p)}
            style={{ width: "100%", padding: "5px 8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 11, color: "#334155", cursor: "pointer", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>Chi tiết {buckets.length} nấc hạn phát sinh</span>
            <span>{showBuckets ? "▴" : "▾"}</span>
          </button>

          {showBuckets && (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4, background: "#f8fafc", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              {buckets.map((b, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, padding: "3px 0", borderBottom: idx < buckets.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                  <span style={{ color: b.color, fontWeight: 600 }}>{b.label}:</span>
                  <strong style={{ fontVariantNumeric: "tabular-nums", color: b.isDanger ? "#dc2626" : "#0f172a" }}>{formatVnd(b.val, b.isDanger)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgingCustomerCardGrid({ staffGroups = [] }) {
  const [expandedStaff, setExpandedStaff] = useState(() =>
    staffGroups.reduce((acc, st) => ({ ...acc, [st.code || st.id]: true }), {})
  );

  const toggleStaff = (id) => setExpandedStaff((p) => ({ ...p, [id]: !p[id] }));
  const expandAll = () => setExpandedStaff(staffGroups.reduce((acc, st) => ({ ...acc, [st.code || st.id]: true }), {}));
  const collapseAll = () => setExpandedStaff({});
  const allExpanded = staffGroups.every((st) => expandedStaff[st.code || st.id]);

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-card)", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)" }}>
            Báo Cáo Tổng Hợp Tuổi Nợ Theo Khách Hàng (Executive Card Grid)
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            Phân rã chi tiết công nợ trước hạn & quá hạn theo từng nhân sự phụ trách
          </div>
        </div>

        <button
          type="button"
          className="btn touch-target"
          onClick={allExpanded ? collapseAll : expandAll}
          style={{ fontSize: 11, padding: "6px 12px", borderRadius: 6, background: "#f8fafc", border: "1px solid #cbd5e1", cursor: "pointer", fontWeight: 600 }}
        >
          {allExpanded ? "▶ Thu gọn tất cả" : "▼ Mở tất cả"}
        </button>
      </div>

      <div style={{ padding: "14px 16px" }}>
        {staffGroups.map((st) => {
          const staffKey = st.code || st.id;
          const isOpen = !!expandedStaff[staffKey];
          const isDanger = st.overduePercent > 20;

          return (
            <div key={staffKey} style={{ marginBottom: 14, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#f8fafc" }}>
              <div
                onClick={() => toggleStaff(staffKey)}
                style={{ padding: "10px 14px", background: "#f8fafc", cursor: "pointer", borderLeft: "4px solid var(--color-primary, #185fa5)", borderBottom: isOpen ? "1px solid #e2e8f0" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>{isOpen ? "▼" : "▶"}</span>
                  <strong style={{ color: "#0f172a", fontSize: 13.5 }}>{st.code} — {st.name}</strong>
                  <RoleBadge role={st.role} />
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>({st.customerCount} KH)</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, flexWrap: "wrap" }}>
                  <span>Trong hạn: <strong style={{ color: "#0369a1" }}>{formatVnd(st.totalBeforeDue)}</strong></span>
                  <span>Quá hạn: <strong style={{ color: isDanger ? "#dc2626" : "#c2410c" }}>{formatVnd(st.totalOverdue)}</strong></span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: isDanger ? "#fee2e2" : "#dcfce7", color: isDanger ? "#991b1b" : "#166534", fontWeight: 700 }}>
                    {formatPercent(st.overduePercent)}
                  </span>
                  <span>Tổng nợ: <strong style={{ color: "#854d0e", fontSize: 13.5 }}>{formatVnd(st.totalDebt)}</strong></span>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "12px", background: "#f1f5f9" }}>
                  <div className="aging-customer-card-grid">
                    {st.customers.map((c) => (
                      <CustomerDebtCard key={c.id} customer={c} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
