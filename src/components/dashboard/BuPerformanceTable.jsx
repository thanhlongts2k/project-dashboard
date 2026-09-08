import DataTable from "../DataTable";

export default function BuPerformanceTable({
  monthLabel,
  summaryColumns = [],
  summaryRows = [],
  alertColumns = [],
  alertRows = [],
}) {
  return (
    <div className="overview-table-grid">
      <DataTable
        title={`Bảng tổng hợp tất cả BU — ${monthLabel || ""}`}
        columns={summaryColumns}
        rows={summaryRows}
        variant="summary"
      />

      <DataTable
        title="Cảnh báo điều hành"
        columns={alertColumns}
        rows={alertRows}
        variant="alert"
      />
    </div>
  );
}
