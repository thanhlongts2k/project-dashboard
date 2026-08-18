import { useMemo, useState } from "react";
import { formatCompactMoney, formatPercent } from "../../utils/numberFormat";

function formatFullVnd(num) {
  if (!num || num === 0) return "0 đ";
  return `${Number(num).toLocaleString("vi-VN")} đ`;
}

export default function AgingDistributionBar({ staffGroups = [], grandTotals = null, buName = "" }) {
  const [hoveredBucket, setHoveredBucket] = useState(null);

  const distribution = useMemo(() => {
    let inDue = 0;
    let overdue1_14 = 0;
    let overdue15_30 = 0;
    let overdue31_60 = 0;
    let overdueOver60 = 0;

    staffGroups.forEach((st) => {
      (st.customers || []).forEach((c) => {
        inDue += (c.totalBeforeDue || 0);
        overdue1_14 += (c.overdue_1_14 || 0);
        overdue15_30 += (c.overdue_15_30 || 0);
        overdue31_60 += (c.overdue_31_45 || 0) + (c.overdue_46_60 || 0);
        overdueOver60 += (c.overdue_61_90 || 0) + (c.overdue_91_120 || 0) + (c.overdue_over_120 || 0);
      });
    });

    const totalDebt = inDue + overdue1_14 + overdue15_30 + overdue31_60 + overdueOver60;

    const buckets = [
      {
        id: "in_due",
        label: "Trong hạn",
        shortLabel: "Trong hạn",
        val: inDue,
        pct: totalDebt > 0 ? (inDue / totalDebt) * 100 : 0,
        color: "#10B981",
        bgLight: "#ecfdf5",
        border: "#a7f3d0",
        textDark: "#065f46",
      },
      {
        id: "overdue_1_14",
        label: "Quá hạn 1-14 ngày",
        shortLabel: "1-14 ngày",
        val: overdue1_14,
        pct: totalDebt > 0 ? (overdue1_14 / totalDebt) * 100 : 0,
        color: "#FBBF24",
        bgLight: "#fffbeb",
        border: "#fde68a",
        textDark: "#92400e",
      },
      {
        id: "overdue_15_30",
        label: "Quá hạn 15-30 ngày",
        shortLabel: "15-30 ngày",
        val: overdue15_30,
        pct: totalDebt > 0 ? (overdue15_30 / totalDebt) * 100 : 0,
        color: "#F97316",
        bgLight: "#fff7ed",
        border: "#fed7aa",
        textDark: "#9a3412",
      },
      {
        id: "overdue_31_60",
        label: "Quá hạn 31-60 ngày",
        shortLabel: "31-60 ngày",
        val: overdue31_60,
        pct: totalDebt > 0 ? (overdue31_60 / totalDebt) * 100 : 0,
        color: "#EA580C",
        bgLight: "#fff1f2",
        border: "#fecdd3",
        textDark: "#9f1239",
      },
      {
        id: "overdue_over_60",
        label: "Quá hạn >60 ngày",
        shortLabel: ">60 ngày",
        val: overdueOver60,
        pct: totalDebt > 0 ? (overdueOver60 / totalDebt) * 100 : 0,
        color: "#DC2626",
        bgLight: "#fef2f2",
        border: "#fecaca",
        textDark: "#991b1b",
      },
    ];

    return { totalDebt, buckets };
  }, [staffGroups]);

  if (distribution.totalDebt <= 0) return null;

  return (
    <div className="card aging-distribution-card" style={{ marginBottom: 16, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>
              Cơ Cấu Phân Bổ Tuổi Nợ {buName ? `— ${buName}` : ""}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Trực quan hóa tỷ trọng công nợ theo từng phân khúc hạn thanh toán
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, background: "#f8fafc", padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
          Tổng công nợ: <strong style={{ color: "#0f172a" }}>{formatFullVnd(distribution.totalDebt)}</strong>
        </div>
      </div>

      {/* THANH STACKED BAR PHÂN KHÚC */}
      <div
        className="aging-stacked-bar-track"
        style={{
          display: "flex",
          width: "100%",
          height: 18,
          borderRadius: 8,
          overflow: "hidden",
          background: "#e2e8f0",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
          position: "relative",
          margin: "8px 0 12px 0",
        }}
      >
        {distribution.buckets.map((b) => {
          if (b.pct <= 0) return null;
          const isHovered = hoveredBucket === b.id;
          return (
            <div
              key={b.id}
              className="aging-stacked-segment"
              style={{
                width: `${b.pct}%`,
                height: "100%",
                backgroundColor: b.color,
                transition: "opacity 0.2s ease, transform 0.1s ease",
                opacity: hoveredBucket && !isHovered ? 0.45 : 1,
                cursor: "pointer",
                position: "relative",
              }}
              onMouseEnter={() => setHoveredBucket(b.id)}
              onMouseLeave={() => setHoveredBucket(null)}
              title={`${b.label}: ${formatFullVnd(b.val)} (${formatPercent(b.pct)})`}
            />
          );
        })}
      </div>

      {/* CHỈ DẪN LEGEND KÈM TỶ TRỌNG */}
      <div className="aging-distribution-legend">
        {distribution.buckets.map((b) => {
          const isHovered = hoveredBucket === b.id;
          return (
            <div
              key={b.id}
              className={`aging-legend-item ${isHovered ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 6,
                background: isHovered ? b.bgLight : "#ffffff",
                border: `1px solid ${isHovered ? b.border : "#f1f5f9"}`,
                transition: "all 0.15s ease",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredBucket(b.id)}
              onMouseLeave={() => setHoveredBucket(null)}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: b.color,
                  flexShrink: 0,
                  boxShadow: `0 0 0 2px ${b.color}33`,
                }}
              />
              <span style={{ fontSize: 11.5, color: "#334155", fontWeight: isHovered ? 700 : 500 }}>
                {b.shortLabel}:
              </span>
              <strong style={{ fontSize: 11.5, color: b.textDark, fontVariantNumeric: "tabular-nums" }}>
                {formatCompactMoney(b.val)}
              </strong>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: b.textDark,
                  background: b.bgLight,
                  padding: "1px 5px",
                  borderRadius: 4,
                  border: `1px solid ${b.border}`,
                }}
              >
                {formatPercent(b.pct)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
