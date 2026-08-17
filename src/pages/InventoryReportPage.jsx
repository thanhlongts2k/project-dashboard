import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import UnifiedSubHeader from "../components/common/UnifiedSubHeader";
import InventoryKpiGrid from "../components/inventory/InventoryKpiGrid";
import InventoryTable from "../components/inventory/InventoryTable";
import InventoryCharts from "../components/inventory/InventoryCharts";
import { buildPdfFileName, exportElementToPdf } from "../utils/exportPdf";

const BLANK = "—";

function formatDateDisplay(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function InventoryReportPage({
  data,
  selectedMonth,
  selectedYear,
  loadingInventory,
  onRefreshInventory,
  inventoryFilter,
  onApplyInventoryFilter,
}) {
  const startDate = inventoryFilter?.startDate;
  const endDate = inventoryFilter?.endDate;
  const preset = inventoryFilter?.preset || "today";

  const [exportingPdf, setExportingPdf] = useState(false);
  const dashRef = useRef(null);

  const header = data?.header || {};
  const overview = data?.overview || [];
  const tableRows = data?.table?.rows || [];
  const alerts = data?.alerts || [];
  const compositionData = data?.compositionData || [];
  const compositionLegend = data?.compositionLegend || [];
  const movementData = data?.movementData || [];

  const rangeLabel = startDate && endDate
    ? `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`
    : `Tháng ${String(selectedMonth).padStart(2, "0")}/${selectedYear}`;

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    try {
      setExportingPdf(true);
      await exportElementToPdf(
        dashRef.current,
        buildPdfFileName("bao-cao-ton-kho", rangeLabel)
      );
      toast.success("Đã tải báo cáo PDF.");
    } catch (error) {
      toast.error(error.message || "Không xuất được PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const subtitle = `Ngày báo cáo: ${header.reportDate || BLANK} | ${header.monthLabel || rangeLabel} | ${header.warehouseCountLabel || "Tất cả kho"}`;

  return (
    <div className="dash" ref={dashRef} style={{ padding: "0 16px" }}>
      {/* TẦNG 2: Unified Sub-Header */}
      <UnifiedSubHeader
        title={header.title || "Báo Cáo Tồn Kho"}
        subtitle={subtitle}
        datePickerProps={{
          startDate,
          endDate,
          preset,
          onChangeRange: (newRange) => onApplyInventoryFilter?.(newRange),
        }}
        onRefresh={onRefreshInventory}
        loading={loadingInventory}
        onExportPdf={handleExportPdf}
        exportingPdf={exportingPdf}
      />

      {/* Overview KPI Cards */}
      <InventoryKpiGrid overview={overview} />

      {/* Warehouse Summary Table & Alert Stack */}
      <InventoryTable
        tableRows={tableRows}
        alerts={alerts}
        note={data?.table?.note}
      />

      {/* Composition Donut & Movement Bar Charts */}
      <InventoryCharts
        compositionData={compositionData}
        compositionLegend={compositionLegend}
        movementData={movementData}
      />
    </div>
  );
}