function parsePercentValue(value) {
  if (!value || value === "—") return null;

  const raw = String(value).replace("%", "").trim();
  let normalized = raw;

  // 96,67  => 96.67
  if (raw.includes(",") && !raw.includes(".")) {
    normalized = raw.replace(",", ".");
  }
  // 1.279.851.547,5 => 1279851547.5
  else if (raw.includes(",") && raw.includes(".")) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  }
  // 9.153.410.720 => 9153410720
  else {
    const dotCount = (raw.match(/\./g) || []).length;
    if (dotCount > 1) {
      normalized = raw.replace(/\./g, "");
    }
  }

  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function getToneFromPercent(value, reverse = false) {
  const num = parsePercentValue(value);
  if (num === null) return "neutral";

  // Mặc định: đỏ -> cam -> vàng -> xanh
  if (!reverse) {
    if (num < 50) return "danger";
    if (num < 70) return "orange";
    if (num < 100) return "warn";
    return "good";
  }

  // Chỉ dùng cho logic đảo màu (ví dụ tồn kho vượt ngưỡng)
  if (num >= 100) return "danger";
  if (num >= 70) return "orange";
  if (num >= 50) return "warn";
  return "good";
}

function getGapTone(value) {
  if (!value || value === "—") return "neutral";
  if (String(value).startsWith("+")) return "good";
  if (String(value).startsWith("-") || String(value).startsWith("–")) {
    return "danger";
  }
  return "neutral";
}

function renderPill(value, tone) {
  return <span className={`pill ${tone}`}>{value || "—"}</span>;
}

function renderGap(value, tone) {
  return <span className={`gap-text ${tone}`}>{value || "—"}</span>;
}

function renderCellValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

function renderGenericCell(cell) {
  if (cell && typeof cell === "object" && !Array.isArray(cell)) {
    if (cell.type === "pill") {
      return renderPill(
        cell.value || "—",
        cell.tone || getToneFromPercent(cell.value, !!cell.reverseTone)
      );
    }

    if (cell.type === "gap") {
      return renderGap(cell.value || "—", cell.tone || getGapTone(cell.value));
    }

    return renderCellValue(cell.value);
  }

  return renderCellValue(cell);
}

function renderSummaryRow(row, columns, idx) {
  const isCorpTotal = row.isTotal;
  const rowClass = isCorpTotal ? "row-total-corp" : row.isSub ? "row-sub" : "";

  return (
    <tr key={idx} className={rowClass}>
      {columns.map((col) => {
        // Cột Đơn vị / Phụ trách
        if (col.key === "bu") {
          return (
            <td key={col.key}>
              <div className="bu-info-cell">
                <div className="bu-info-name">{row.bu}</div>
                {!isCorpTotal && !row.isSub && row.owner ? (
                  <div className="bu-info-owner">{row.owner}</div>
                ) : null}
              </div>
            </td>
          );
        }

        // Cột Tiến độ Doanh thu (Dual-tier Cell)
        if (col.key === "revenueProgress") {
          const rev = row.revenueProgress;
          if (!rev) return <td key={col.key}>—</td>;
          const tone = rev.tone || "neutral";
          const pctVal = typeof rev.percent === "number" ? Math.min(Math.max(rev.percent, 0), 100) : 0;
          return (
            <td key={col.key}>
              <div className="dual-tier-cell">
                <div className="dual-tier-top">
                  <span className="dual-tier-actual">{rev.actualText}</span>
                  <span className="dual-tier-plan">/ {rev.planText}</span>
                </div>
                <div className="dual-tier-bottom">
                  <div className="micro-progress-bar">
                    <div
                      className={`micro-progress-fill ${tone}`}
                      style={{ width: `${pctVal}%` }}
                    />
                  </div>
                  <span className={`dual-tier-percent ${tone}`}>{rev.percentText}</span>
                  <span className="dual-tier-extra">({rev.gapText})</span>
                </div>
              </div>
            </td>
          );
        }

        // Cột Tiến độ Thu tiền (Dual-tier Cell)
        if (col.key === "cashProgress") {
          const cash = row.cashProgress;
          if (!cash) return <td key={col.key}>—</td>;
          const tone = cash.tone || "neutral";
          const pctVal = typeof cash.percent === "number" ? Math.min(Math.max(cash.percent, 0), 100) : 0;
          return (
            <td key={col.key}>
              <div className="dual-tier-cell">
                <div className="dual-tier-top">
                  <span className="dual-tier-actual">{cash.actualText}</span>
                  <span className="dual-tier-plan">/ {cash.planText}</span>
                </div>
                <div className="dual-tier-bottom">
                  <div className="micro-progress-bar">
                    <div
                      className={`micro-progress-fill ${tone}`}
                      style={{ width: `${pctVal}%` }}
                    />
                  </div>
                  <span className={`dual-tier-percent ${tone}`}>{cash.percentText}</span>
                  {cash.runRateText ? (
                    <span className="dual-tier-extra" title="Tốc độ thu trung bình ngày">
                      {cash.runRateText}
                    </span>
                  ) : (
                    <span className="dual-tier-extra">({cash.gapText})</span>
                  )}
                </div>
              </div>
            </td>
          );
        }

        // Cột Nhịp độ Thời gian (Time-Pace Badge)
        if (col.key === "timePace") {
          const pace = row.timePace;
          if (!pace || pace.status === "none") {
            return (
              <td key={col.key}>
                <span className="text-slate-400 text-xs">—</span>
              </td>
            );
          }
          return (
            <td key={col.key}>
              <div className="pace-badge-container">
                <span className={`pace-badge ${pace.tone}`}>
                  {pace.label}
                </span>
                <span className="pace-subtext">{pace.deltaPaceText}</span>
              </div>
            </td>
          );
        }

        // Fallbacks cho các cột cũ (nếu có)
        if (col.key === "owner") {
          return <td key={col.key}>{row.isSub ? "" : row.owner || ""}</td>;
        }

        if (col.key === "revenuePercent") {
          return (
            <td key={col.key}>
              {row.revenuePercent === "—"
                ? "—"
                : renderPill(row.revenuePercent, getToneFromPercent(row.revenuePercent, false))}
            </td>
          );
        }

        if (col.key === "cashPercent") {
          return (
            <td key={col.key}>
              {row.cashPercent === "—"
                ? "—"
                : renderPill(row.cashPercent, getToneFromPercent(row.cashPercent, false))}
            </td>
          );
        }

        if (col.key === "revenueGap") {
          return (
            <td key={col.key}>
              {row.revenueGap === "—"
                ? "—"
                : renderGap(row.revenueGap, getGapTone(row.revenueGap))}
            </td>
          );
        }

        if (col.key === "vsPrev") {
          return (
            <td key={col.key}>
              {row.vsPrev === "—"
                ? "—"
                : renderPill(row.vsPrev, getToneFromPercent(row.vsPrev, false))}
            </td>
          );
        }

        return <td key={col.key}>{renderCellValue(row[col.key])}</td>;
      })}
    </tr>
  );
}

function renderAlertRow(row, idx) {
  const dotTone = row.dotTone || row.tone || "danger";
  const pillTone = row.tone || "danger";
  const gapTone = row.gapTone || "danger";

  return (
    <tr key={idx}>
      <td>
        <div className="alert-row-item">
          <div className="alert-row-title">
            <span className={`alert-row-dot ${dotTone}`}></span>
            <span>{row.item}</span>
          </div>
          {row.subText ? (
            <div className="alert-row-desc">{row.subText}</div>
          ) : null}
        </div>
      </td>
      <td style={{ textAlign: "center" }}>
        <span className={`alert-pill ${pillTone}`}>
          {row.status || row.percent || "—"}
        </span>
      </td>
      <td style={{ textAlign: "right" }}>
        <span className={`alert-gap-text ${gapTone}`}>
          {row.gap || "—"}
        </span>
      </td>
    </tr>
  );
}

function renderGenericRow(row, columns, idx) {
  const rowClass = row.isTotal ? "row-total" : row.isSub ? "row-sub" : "";

  return (
    <tr key={idx} className={rowClass}>
      {columns.map((col) => (
        <td key={col.key}>{renderGenericCell(row[col.key])}</td>
      ))}
    </tr>
  );
}

export default function DataTable({
  title,
  columns = [],
  rows = [],
  variant = "generic",
}) {
  const isOverviewVariant = variant === "summary" || variant === "alert";

  return (
    <div className={isOverviewVariant ? "overview-card" : "card"}>
      {title ? (
        <div className={isOverviewVariant ? "overview-card-header" : "card-title"}>
          <span className={isOverviewVariant ? "overview-card-title" : ""}>{title}</span>
          {variant === "alert" && rows.length > 0 ? (
            <span className="overview-card-badge">{rows.length} ngoại lệ</span>
          ) : null}
        </div>
      ) : null}

      <div className={isOverviewVariant ? "overview-table-wrap" : "table-wrap"}>
        <table className={isOverviewVariant ? "overview-table" : "bt data-table"}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : {}}
                  className={col.key === "gap" || col.key === "revenueProgress" || col.key === "cashProgress" ? "text-right" : ""}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: "center", color: "#9a968a", padding: "24px 0" }}
                >
                  {variant === "alert" ? "Không có cảnh báo ngoại lệ" : "Chưa có dữ liệu"}
                </td>
              </tr>
            ) : variant === "summary" ? (
              rows.map((row, idx) => renderSummaryRow(row, columns, idx))
            ) : variant === "alert" ? (
              rows.map((row, idx) => renderAlertRow(row, idx))
            ) : (
              rows.map((row, idx) => renderGenericRow(row, columns, idx))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}