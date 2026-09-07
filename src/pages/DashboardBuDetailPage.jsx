import { useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import UnifiedSubHeader from "../components/common/UnifiedSubHeader";
import BuDetailKpiGrid from "../components/buDetail/BuDetailKpiGrid";
import BuDailyChart from "../components/buDetail/BuDailyChart";
import BuSubUnitTable from "../components/buDetail/BuSubUnitTable";
import SalesPerformanceTable from "../components/sales/SalesPerformanceTable";
import { buildPdfFileName, exportElementToPdf } from "../utils/exportPdf";

function formatDateDisplay(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function DashboardBuDetailPage({
  data,
  activeBu,
  onChangeBu,
  selectedMonth,
  selectedYear,
  loadingDetail,
  onRefreshDetail,
  detailFilter,
  onApplyDetailFilter,
}) {
  const tabs = Array.isArray(data?.buTabs) ? data.buTabs : [];
  const detail = data?.buDetails?.[activeBu] || null;
  const activeTab = tabs.find((tab) => tab.id === activeBu);

  const startDate = detailFilter?.startDate;
  const endDate = detailFilter?.endDate;
  const preset = detailFilter?.preset || "thisMonth";

  const [exportingPdf, setExportingPdf] = useState(false);
  const dashRef = useRef(null);

  const rangeLabel = startDate && endDate
    ? `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`
    : `Tháng ${String(selectedMonth).padStart(2, "0")}/${selectedYear}`;

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    try {
      setExportingPdf(true);
      await exportElementToPdf(
        dashRef.current,
        buildPdfFileName(`chi-tiet-bu-${activeBu}`, rangeLabel)
      );
      toast.success("Đã tải báo cáo PDF.");
    } catch (error) {
      toast.error(error.message || "Không xuất được PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const safeDetail = detail || {
    title: activeTab?.label || "BU",
    owner: "",
    subInfo: "",
    statusTone: "neutral",
    revenuePercent: null,
    collectionPercent: null,
    revenuePercentText: "—",
    collectionPercentText: "—",
    kpis: [],
    dailySeries: [],
  };

  const subtitle = `Ngày báo cáo: ${data?.header?.reportDate || "-"} | ${rangeLabel} | Phụ trách: ${safeDetail.owner || "-"}${safeDetail.subInfo ? ` (${safeDetail.subInfo})` : ""}`;

  return (
    <div className="dash" ref={dashRef}>
      {/* TẦNG 2: Unified Sub-Header with Inline BU Selector */}
      <UnifiedSubHeader
        buSelector={{
          activeBu,
          tabs,
          onChangeBu,
          owner: safeDetail.owner,
          revenuePercentText: safeDetail.revenuePercentText,
          collectionPercentText: safeDetail.collectionPercentText,
        }}
        subtitle={subtitle}
        datePickerProps={{
          startDate,
          endDate,
          preset,
          onChangeRange: (newRange) => onApplyDetailFilter?.(newRange),
        }}
        onRefresh={onRefreshDetail}
        loading={loadingDetail}
        onExportPdf={handleExportPdf}
        exportingPdf={exportingPdf}
      />

      {/* BU Detail KPI Grid */}
      <BuDetailKpiGrid title={safeDetail.title} kpis={safeDetail.kpis || []} />

      {/* Daily Performance Chart for this BU */}
      <BuDailyChart
        title={`Doanh thu & Thu tiền theo ngày — ${safeDetail.title} (${rangeLabel})`}
        dailySeries={safeDetail.dailySeries || []}
      />

      {/* Sub-Unit Performance & Breakdown Tables */}
      <BuSubUnitTable safeDetail={safeDetail} />

      {/* Sales Performance by Employee Table (Mục tiêu 2026) */}
      <SalesPerformanceTable
        buKey={activeBu}
        reportDate={data?.header?.reportDate}
        period={`${selectedYear}-${String(selectedMonth).padStart(2, "0")}`}
        detailFilter={detailFilter}
        title={`Theo dõi Doanh thu theo Nhân viên Sale — ${safeDetail.title}`}
      />
    </div>
  );
}