import { formatPercent } from "../../utils/numberFormat";

// ─── Column widths (fixed, keeps layout stable inside a scrollable container) ───
const COL = {
  id:     { width: 120, whiteSpace: "nowrap" },
  name:   { minWidth: 220, maxWidth: 300 },
  staff:  { width: 160, whiteSpace: "nowrap" },
  money:  { width: 140, textAlign: "right", whiteSpace: "nowrap" },
  rate:   { width: 90,  textAlign: "center", whiteSpace: "nowrap" },
  status: { width: 120, textAlign: "center", whiteSpace: "nowrap" },
  action: { width: 80,  textAlign: "center", whiteSpace: "nowrap" },
};

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
  const s = {
    CCO:     { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    BU_HEAD: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
    MANAGER: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
    SALES:   { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
  }[role] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {role}
    </span>
  );
}

function StatusBadge({ overduePercent, totalOverdue }) {
  if (totalOverdue <= 0) {
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
        background: "#dcfce7", color: "#166534", border: "1px solid #86efac", whiteSpace: "nowrap" }}>
        ✓ An toàn
      </span>
    );
  }
  if (overduePercent <= 20) {
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
        background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", whiteSpace: "nowrap" }}>
        ⚠️ Chú ý ({formatPercent(overduePercent)})
      </span>
    );
  }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
      background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", whiteSpace: "nowrap" }}>
      🚨 Quá hạn ({formatPercent(overduePercent)})
    </span>
  );
}

export default function AgingCustomerTableView({ customers = [], onSelectCustomer }) {
  // Footer totals
  const totalDebt      = customers.reduce((s, c) => s + (c.totalDebt      || 0), 0);
  const totalBeforeDue = customers.reduce((s, c) => s + (c.totalBeforeDue || 0), 0);
  const totalOverdue   = customers.reduce((s, c) => s + (c.totalOverdue   || 0), 0);
  const avgOverduePct  = totalDebt > 0 ? (totalOverdue / totalDebt) * 100 : 0;

  // ─── shared header / cell base styles ───────────────────────────────────────
  const thBase = {
    padding: "10px 12px",
    fontWeight: 700,
    fontSize: 12.5,
    color: "#475569",
    background: "#f8fafc",
    borderBottom: "2px solid #cbd5e1",
    whiteSpace: "nowrap",
  };

  return (
    <>
      {/* Swipe hint – only visible on small screens */}
      <p style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 11, color: "#94a3b8", fontStyle: "italic",
        marginBottom: 6, marginTop: 0,
      }}
        className="aging-swipe-hint"
      >
        👉 Vuốt sang ngang để xem đầy đủ các cột số liệu
      </p>

      {/* ─── Scrollable wrapper ─────────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* min-width FORCES the table to be wider than small screens → triggers scroll */}
        <table style={{
          width: "100%",
          minWidth: 900,
          borderCollapse: "collapse",
          fontSize: 12.5,
          textAlign: "left",
        }}>

          {/* ── THEAD ──────────────────────────────────────────────────────── */}
          <thead>
            <tr>
              <th style={{ ...thBase, ...COL.id    }}>Mã KH</th>
              <th style={{ ...thBase, ...COL.name  }}>Tên Khách Hàng</th>
              <th style={{ ...thBase, ...COL.staff }}>Phụ Trách</th>
              <th style={{ ...thBase, ...COL.money }}>Tổng Nợ</th>
              <th style={{ ...thBase, ...COL.money }}>Trong Hạn</th>
              <th style={{ ...thBase, ...COL.money }}>Quá Hạn</th>
              <th style={{ ...thBase, ...COL.rate  }}>Tỷ Lệ %</th>
              <th style={{ ...thBase, ...COL.status }}>Trạng Thái</th>
              <th style={{ ...thBase, ...COL.action }}>Chi Tiết</th>
            </tr>
          </thead>

          {/* ── TBODY ──────────────────────────────────────────────────────── */}
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
                  Không tìm thấy khách hàng phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              customers.map((c, idx) => {
                const isEven = idx % 2 === 0;
                const rowBg  = isEven ? "#ffffff" : "#f8fafc";
                return (
                  <tr key={`${c.id}-${idx}`} style={{ background: rowBg, borderBottom: "1px solid #e2e8f0" }}>

                    {/* Mã KH */}
                    <td style={{ padding: "10px 12px", ...COL.id, fontWeight: 700, color: "#475569" }}>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4,
                        background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                        {c.id}
                      </span>
                    </td>

                    {/* Tên KH */}
                    <td style={{ padding: "10px 12px", ...COL.name, fontWeight: 600, color: "#0f172a",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span title={c.name}>{c.name}</span>
                    </td>

                    {/* Phụ trách */}
                    <td style={{ padding: "10px 12px", ...COL.staff, color: "#334155" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
                          {c.staffName || "—"}
                        </span>
                        {c.staffRole && <RoleBadge role={c.staffRole} />}
                      </div>
                    </td>

                    {/* Tổng nợ */}
                    <td style={{ padding: "10px 12px", ...COL.money, fontWeight: 700, color: "#854d0e",
                      fontVariantNumeric: "tabular-nums" }}>
                      {formatVnd(c.totalDebt)}
                    </td>

                    {/* Trong hạn */}
                    <td style={{ padding: "10px 12px", ...COL.money, fontWeight: 600, color: "#0369a1",
                      fontVariantNumeric: "tabular-nums" }}>
                      {formatVnd(c.totalBeforeDue)}
                    </td>

                    {/* Quá hạn */}
                    <td style={{ padding: "10px 12px", ...COL.money, fontWeight: 700,
                      color: c.totalOverdue > 0 ? "#dc2626" : "#475569",
                      fontVariantNumeric: "tabular-nums" }}>
                      {formatVnd(c.totalOverdue, c.totalOverdue > 0)}
                    </td>

                    {/* Tỷ lệ % */}
                    <td style={{ padding: "10px 12px", ...COL.rate, fontWeight: 700,
                      color: c.overduePercent > 20 ? "#991b1b" : "#166534" }}>
                      {formatPercent(c.overduePercent)}
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: "10px 12px", ...COL.status }}>
                      <StatusBadge overduePercent={c.overduePercent} totalOverdue={c.totalOverdue} />
                    </td>

                    {/* Chi tiết */}
                    <td style={{ padding: "10px 12px", ...COL.action }}>
                      <button
                        type="button"
                        onClick={() => onSelectCustomer?.(c)}
                        style={{
                          padding: "4px 10px",
                          fontSize: 11.5,
                          borderRadius: 5,
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          color: "#1d4ed8",
                          cursor: "pointer",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                        title="Xem chi tiết toàn bộ các nấc hạn công nợ"
                      >
                        <span>🔍</span>
                        <span>Xem</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* ── TFOOT ──────────────────────────────────────────────────────── */}
          {customers.length > 0 && (
            <tfoot>
              <tr style={{ background: "#f1f5f9", borderTop: "2px solid #94a3b8", fontWeight: 800 }}>
                <td colSpan={2} style={{ padding: "12px", whiteSpace: "nowrap", color: "#0f172a" }}>
                  TỔNG CỘNG ({customers.length} KHÁCH HÀNG)
                </td>
                <td style={{ padding: "12px", color: "#64748b" }}>—</td>
                <td style={{ padding: "12px", ...COL.money, fontVariantNumeric: "tabular-nums", color: "#854d0e", fontSize: 13 }}>
                  {formatVnd(totalDebt)}
                </td>
                <td style={{ padding: "12px", ...COL.money, fontVariantNumeric: "tabular-nums", color: "#0369a1", fontSize: 13 }}>
                  {formatVnd(totalBeforeDue)}
                </td>
                <td style={{ padding: "12px", ...COL.money, fontVariantNumeric: "tabular-nums", color: "#dc2626", fontSize: 13 }}>
                  {formatVnd(totalOverdue, true)}
                </td>
                <td style={{ padding: "12px", ...COL.rate, color: avgOverduePct > 20 ? "#991b1b" : "#166534" }}>
                  {formatPercent(avgOverduePct)}
                </td>
                <td style={{ padding: "12px", ...COL.status }}>
                  <StatusBadge overduePercent={avgOverduePct} totalOverdue={totalOverdue} />
                </td>
                <td style={{ padding: "12px" }} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}
