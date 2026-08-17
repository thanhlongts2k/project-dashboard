import { formatPercent, formatCompactMoney } from "../../utils/numberFormat";
import MetricCard from "../MetricCard";

function formatVnd(val, isDanger = false) {
  const num = Number(val);
  if (!num || num === 0) return <span style={{ color: "#94a3b8" }}>0 đ</span>;
  return (
    <span style={{ color: isDanger ? "#dc2626" : "inherit", fontWeight: isDanger ? 700 : "inherit" }}>
      {`${num.toLocaleString("vi-VN")} đ`}
    </span>
  );
}

export default function AllBUsDebtOverview({ globalSummary = {}, buList = [], onSelectBU, includeAll = false, onToggleIncludeAll }) {
  const totalDebt = Number(globalSummary?.receivable_total) || buList.reduce((s, b) => s + Number(b.receivable_total || 0), 0);
  const dueTotal = Number(globalSummary?.due_total) || buList.reduce((s, b) => s + Number(b.due_total || 0), 0);
  const overdueTotal = Number(globalSummary?.overdue_total) || buList.reduce((s, b) => s + Number(b.overdue_total || 0), 0);
  const overdueRate = totalDebt > 0 ? (overdueTotal / totalDebt) * 100 : Number(globalSummary?.overdue_rate || 0);
  const inDueRate = totalDebt > 0 ? (dueTotal / totalDebt) * 100 : 0;
  const riskyBuCount = buList.filter((b) => Number(b.overdue_rate || 0) > 20).length;

  const kpis = [
    {
      accent: "blue", label: "Tổng công nợ toàn công ty", valueText: formatCompactMoney(totalDebt),
      targetText: `${buList.length} Khối BU · ${globalSummary?.customer_count || "Toàn công ty"}`,
      percent: 100, percentText: "100%", progressColor: "blue",
    },
    {
      accent: "teal", label: "Nợ trong hạn", valueText: formatCompactMoney(dueTotal),
      targetText: `Chiếm ${formatPercent(inDueRate)} tổng nợ`,
      percent: inDueRate, percentText: formatPercent(inDueRate), progressColor: "teal",
    },
    {
      accent: "amber", label: "Nợ quá hạn", valueText: formatCompactMoney(overdueTotal),
      targetText: `Chiếm ${formatPercent(overdueRate)} tổng nợ`,
      percent: overdueRate, percentText: formatPercent(overdueRate), progressColor: "amber",
    },
    {
      accent: overdueRate > 20 ? "rose" : "teal", label: "Tỷ lệ quá hạn toàn công ty", valueText: formatPercent(overdueRate),
      targetText: overdueRate > 20 ? `⚠️ ${riskyBuCount}/${buList.length} BU vượt ngưỡng an toàn (20%)` : "✓ Mức an toàn toàn công ty",
      percent: overdueRate, percentText: overdueRate > 20 ? "Cảnh báo" : "An toàn",
      progressColor: overdueRate > 20 ? "danger" : "teal",
    },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="kpi-grid kpi-grid-4" style={{ marginBottom: 18 }}>
        {kpis.map((kpi, idx) => (<MetricCard key={idx} item={kpi} />))}
      </div>

      <div className="card" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-main, #0f172a)" }}>
              So Sánh Công Nợ & Rủi Ro Theo Khối Kinh Doanh (BU Comparison)
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Nhấp "Xem chi tiết" trên bất kỳ BU nào để xem phân rã theo nhân sự và khách hàng
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {onToggleIncludeAll && (
              <button
                type="button"
                className="btn"
                onClick={onToggleIncludeAll}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: includeAll ? "var(--color-primary, #185fa5)" : "#fff",
                  color: includeAll ? "#fff" : "#475569",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {includeAll ? "✓ Đang hiện tất cả 22 BU" : "👁️ Xem tất cả 22 BU"}
              </button>
            )}
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", background: "#f1f5f9", padding: "4px 10px", borderRadius: 6 }}>
              {includeAll ? `Tất cả: ${buList.length} BU` : `Đang hiện: ${buList.length} BU có nợ`}
            </span>
          </div>
        </div>

        <div className="all-bus-debt-grid">
          {buList.map((bu) => {
            const buCode = bu.code || bu.bu_code;
            const buName = bu.name || bu.bu_name;
            const managerName = bu.manager_name || bu.bu_head || "Chưa gán";
            const bDebt = Number(bu.receivable_total || 0);
            const bDue = Number(bu.due_total || 0);
            const bOverdue = Number(bu.overdue_total || 0);
            const bRate = bDebt > 0 ? (bOverdue / bDebt) * 100 : Number(bu.overdue_rate || 0);
            const isDanger = bRate > 20;

            return (
              <div key={buCode} className="bu-debt-summary-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", lineHeight: 1.3 }}>{buName}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                      Trưởng BU: <strong>{managerName}</strong> {bu.customer_count ? `(${bu.customer_count} KH)` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                    {buCode}
                  </span>
                </div>

                <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: 6, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>TỔNG CÔNG NỢ</span>
                    <strong style={{ fontSize: 15, color: "#854d0e", fontVariantNumeric: "tabular-nums" }}>{formatVnd(bDebt)}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11 }}>
                    <div><span style={{ color: "#0369a1" }}>Trong hạn: </span><strong style={{ color: "#0369a1" }}>{formatVnd(bDue)}</strong></div>
                    <div style={{ textAlign: "right" }}><span style={{ color: isDanger ? "#dc2626" : "#c2410c" }}>Quá hạn: </span><strong style={{ color: isDanger ? "#dc2626" : "#c2410c" }}>{formatVnd(bOverdue, isDanger)}</strong></div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: "#64748b", fontWeight: 600 }}>Tỷ lệ quá hạn:</span>
                    <span style={{ fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: isDanger ? "#fee2e2" : "#dcfce7", color: isDanger ? "#991b1b" : "#166534", fontSize: 11 }}>
                      {formatPercent(bRate)}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(bRate, 100)}%`, height: "100%", background: isDanger ? "#dc2626" : "#16a34a", transition: "width 0.3s ease" }} />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn touch-target"
                  onClick={() => onSelectBU(buCode)}
                  style={{ width: "100%", padding: "7px 12px", background: "var(--color-primary, #185fa5)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}
                >
                  <span>Xem chi tiết</span>
                  <span>➔</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
