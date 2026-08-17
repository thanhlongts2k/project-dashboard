import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import UnifiedSubHeader from "../components/common/UnifiedSubHeader";
import ReceivableKpiGrid from "../components/receivable/ReceivableKpiGrid";
import ReceivableDetailTable from "../components/receivable/ReceivableDetailTable";
import ReceivableCharts from "../components/receivable/ReceivableCharts";
import ReceivableCommitmentTable from "../components/receivable/ReceivableCommitmentTable";
import { buildPdfFileName, exportElementToPdf } from "../utils/exportPdf";

const BLANK = "—";

function formatDisplayDate(dateStr) {
  if (!dateStr) return BLANK;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function ReceivableReportPage({
  data,
  selectedDate,
  onChangeDate,
  loadingReceivable,
  onRefreshReceivable,
}) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const dashRef = useRef(null);

  const header = data?.header || {};
  const topKpis = data?.topKpis || [];
  const detailRows = data?.detailRows || [];
  const detailTotalRow = data?.detailTotalRow || null;
  const alertRows = data?.alertRows || [];
  const collectionChartData = data?.collectionChartData || [];
  const receivableRateRows = data?.receivableRateRows || [];
  const receivableDonutData = data?.receivableDonutData || [];
  const commitmentRows = data?.commitmentRows || [];
  const commitmentTotalRow = data?.commitmentTotalRow || null;

  const hasReceivableDonutData = (receivableDonutData || []).some(
    (item) => Number(item?.value) > 0
  );

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    try {
      setExportingPdf(true);
      await exportElementToPdf(
        dashRef.current,
        buildPdfFileName("thu-no-trong-yeu", formatDisplayDate(selectedDate))
      );
      toast.success("Đã tải báo cáo PDF.");
    } catch (error) {
      toast.error(error.message || "Không xuất được PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const subtitle = `Ngày báo cáo: ${header.todayLabel || BLANK} | ${header.scopeLabel || "Bao gồm HISA"} | ${header.buLabel || "Tất cả BU"}`;

  return (
    <div className="dash" ref={dashRef} style={{ padding: "0 16px" }}>
      {/* TẦNG 2: Unified Sub-Header */}
      <UnifiedSubHeader
        title={header.title || "Thu Nợ Khách Hàng Trọng Yếu"}
        subtitle={subtitle}
        datePickerProps={{
          mode: "single",
          singleDate: selectedDate,
          onChangeSingleDate: onChangeDate,
        }}
        onRefresh={onRefreshReceivable}
        loading={loadingReceivable}
        onExportPdf={handleExportPdf}
        exportingPdf={exportingPdf}
      />

      {/* Top Overview Metric Cards */}
      <ReceivableKpiGrid
        label={`Tổng quan ngày ${header.todayLabel || BLANK}`}
        topKpis={topKpis}
      />

      {/* BU Detail Collection & Executive Alerts */}
      <ReceivableDetailTable
        todayLabel={header.todayLabel}
        detailRows={detailRows}
        detailTotalRow={detailTotalRow}
        alertRows={alertRows}
      />

      {/* Collection Bar Chart & Donut Chart */}
      <ReceivableCharts
        todayLabel={header.todayLabel}
        tomorrowLabel={header.tomorrowLabel}
        collectionChartData={collectionChartData}
        receivableRateRows={receivableRateRows}
        receivableDonutData={receivableDonutData}
        hasReceivableDonutData={hasReceivableDonutData}
      />

      {/* Commitment Table */}
      <ReceivableCommitmentTable
        todayLabel={header.todayLabel || "Hôm nay"}
        tomorrowLabel={header.tomorrowLabel || "Ngày mai"}
        commitmentRows={commitmentRows}
        commitmentTotalRow={commitmentTotalRow}
      />
    </div>
  );
}