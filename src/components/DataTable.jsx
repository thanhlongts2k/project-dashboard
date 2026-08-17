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
  const rowClass = row.isTotal ? "row-total" : row.isSub ? "row-sub" : "";

  return (
    <tr key={idx} className={rowClass}>
      {columns.map((col) => {
        if (col.key === "bu") {
          return (
            <td key={col.key}>
              <div>{row.bu}</div>
              {!row.isTotal && !row.isSub && row.owner ? (
                <span className="own">{row.owner}</span>
              ) : null}
            </td>
          );
        }

        if (col.key === "owner") {
          return <td key={col.key}>{row.isSub ? "" : row.owner || ""}</td>;
        }

        if (col.key === "revenuePercent") {
          return (
            <td key={col.key}>
              {row.revenuePercent === "—"
                ? "—"
                : renderPill(
                    row.revenuePercent,
                    getToneFromPercent(row.revenuePercent, false)
                  )}
            </td>
          );
        }

        if (col.key === "cashPercent") {
          return (
            <td key={col.key}>
              {row.cashPercent === "—"
                ? "—"
                : renderPill(
                    row.cashPercent,
                    getToneFromPercent(row.cashPercent, false)
                  )}
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
  const reverseTone = !!row.reverseTone;
  const percentTone =
    row.percentTone || getToneFromPercent(row.percent, reverseTone);
  const dotTone = row.dotTone || percentTone;
  const gapTone = row.gapTone || getGapTone(row.gap);

  return (
    <tr key={idx}>
      <td>
        <span className="alert-item">
          <span className={`dot ${dotTone}`}></span>
          <span>{row.item}</span>
        </span>
      </td>
      <td>{renderPill(row.percent || "—", percentTone)}</td>
      <td>{renderGap(row.gap || "—", gapTone)}</td>
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
  return (
    <div className="card">
      {title ? <div className="card-title">{title}</div> : null}

      <div className="table-wrap">
        <table className="bt data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: "center", color: "#9a968a" }}
                >
                  Chưa có dữ liệu
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