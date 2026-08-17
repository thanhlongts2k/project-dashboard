import ProgressChart from "../ProgressChart";
import DetailMetricCompareChart from "../DetailMetricCompareChart";
import DataTable from "../DataTable";

function getPillTone(text = "") {
  const raw = String(text || "").replace("%", "").replace(/,/g, "").trim();
  const num = Number(raw);
  if (!Number.isFinite(num)) return "neutral";
  if (num < 70) return "danger";
  if (num < 100) return "warn";
  return "good";
}

function renderMiniCell(value) {
  if (!value || value === "—") {
    return <span className="mini-text muted">—</span>;
  }
  return <span className="mini-text">{value}</span>;
}

function renderMiniPercent(value) {
  if (!value || value === "—") {
    return <span className="mini-text muted">—</span>;
  }
  return <span className={`mini-pill ${getPillTone(value)}`}>{value}</span>;
}

function renderMiniVsPercent(value) {
  if (!value || value === "—") {
    return <span className="mini-text muted">—</span>;
  }
  return <span className={`mini-pill ${getPillTone(value)}`}>{value}</span>;
}

export default function BuSubUnitTable({ safeDetail }) {
  if (!safeDetail) return null;

  if (safeDetail.layoutType === "subMang") {
    return (
      <>
        <div className="chart-grid">
          <ProgressChart
            title={safeDetail.revenueChart?.title || "Sub-mảng — DT"}
            data={safeDetail.revenueChart?.data || []}
            theme="blue"
          />
          <ProgressChart
            title={safeDetail.cashChart?.title || "Sub-mảng — TT"}
            data={safeDetail.cashChart?.data || []}
            theme="teal"
          />
        </div>

        <DataTable
          title={safeDetail.table?.title || "Bảng chi tiết"}
          columns={safeDetail.table?.columns || []}
          rows={safeDetail.table?.rows || []}
          variant="generic"
        />
      </>
    );
  }

  return (
    <div className="detail-split-grid">
      <DetailMetricCompareChart
        title={safeDetail.compareChart?.title || "DT & TT — KH vs lũy kế"}
        data={safeDetail.compareChart?.data || []}
      />

      <div className="card detail-mini-card">
        <div className="card-title">
          {safeDetail.detailSummary?.title || "Chỉ tiêu chi tiết"}
        </div>

        <div className="detail-mini-table-wrap">
          <table className="detail-mini-table">
            <thead>
              <tr>
                <th>Chỉ tiêu</th>
                <th>KH tháng</th>
                <th>Thực hiện</th>
                <th>Kỳ</th>
                <th>% KH</th>
                <th>vs trước</th>
              </tr>
            </thead>
            <tbody>
              {(safeDetail.detailSummary?.rows || []).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.label}</td>
                  <td>{renderMiniCell(row.plan)}</td>
                  <td>{renderMiniCell(row.actual)}</td>
                  <td>{renderMiniCell(row.period)}</td>
                  <td>{renderMiniPercent(row.percent)}</td>
                  <td>{renderMiniVsPercent(row.vs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
