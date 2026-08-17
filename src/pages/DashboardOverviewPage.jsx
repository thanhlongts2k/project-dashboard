import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import UnifiedSubHeader from "../components/common/UnifiedSubHeader";
import CustomSelect from "../components/common/CustomSelect";
import OverviewKpiGrid from "../components/dashboard/OverviewKpiGrid";
import DailyPerformanceChart from "../components/dashboard/DailyPerformanceChart";
import BuPerformanceTable from "../components/dashboard/BuPerformanceTable";
import FinanceKpiGrid from "../components/dashboard/FinanceKpiGrid";
import { formatCompactMoney, formatPercent } from "../utils/numberFormat";
import { fetchDailyPerformance } from "../api/dashboardApi";
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

function buildOwnerFilteredView(data, selectedOwner) {
  if (!data) return data;
  if (!selectedOwner || selectedOwner === "Tất cả phụ trách" || selectedOwner === "all" || selectedOwner === "Tất cả") return data;

  const filteredRows = (data.summaryRows || []).filter(
    (row) => row?.isTotal || row?.owner === selectedOwner
  );

  const mainRow = filteredRows.find(
    (row) => !row?.isTotal && !row?.isSub && row?.owner === selectedOwner
  );

  let topKpis = data.topKpis;
  let revenueChart = data.charts?.revenue || [];
  let cashChart = data.charts?.cash || [];

  if (mainRow) {
    topKpis = [
      {
        accent: "blue",
        label: "Doanh thu",
        valueText: formatCompactMoney(mainRow.revenueActual),
        targetText: `KH ${formatCompactMoney(mainRow.revenuePlan)}`,
        percent: mainRow.revenuePercent,
        percentText: formatPercent(mainRow.revenuePercent),
      },
      {
        accent: "teal",
        label: "Thu tiền",
        valueText: formatCompactMoney(mainRow.collectionActual),
        targetText: `KH ${formatCompactMoney(mainRow.collectionPlan)}`,
        percent: mainRow.collectionPercent,
        percentText: formatPercent(mainRow.collectionPercent),
      },
    ];

    revenueChart = [
      {
        bu: mainRow.bu,
        plan: mainRow.revenuePlan,
        actual: mainRow.revenueActual,
        percent: mainRow.revenuePercent,
      },
    ];

    cashChart = [
      {
        bu: mainRow.bu,
        plan: mainRow.collectionPlan,
        actual: mainRow.collectionActual,
        percent: mainRow.collectionPercent,
      },
    ];
  }

  return {
    ...data,
    header: {
      ...data.header,
      buLabel: mainRow?.bu || selectedOwner,
    },
    topKpis,
    summaryRows: filteredRows,
    charts: {
      revenue: revenueChart,
      cash: cashChart,
    },
  };
}

export default function DashboardOverviewPage({
  data,
  loadingDashboard,
  onRefreshDashboard,
  selectedMonth,
  selectedYear,
  onApplyOverviewFilter,
  overviewFilter,
}) {
  const { isBOD, canAccessBu } = useAuth();

  const [selectedOwner, setSelectedOwner] = useState(
    overviewFilter?.owner || "Tất cả phụ trách"
  );
  const [ownerDailySeries, setOwnerDailySeries] = useState(data?.dailySeries || []);
  const [loadingOwnerDaily, setLoadingOwnerDaily] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const dashRef = useRef(null);

  const startDate = overviewFilter?.startDate;
  const endDate = overviewFilter?.endDate;
  const preset = overviewFilter?.preset || "thisMonth";

  useEffect(() => {
    if (overviewFilter?.owner !== undefined) {
      setSelectedOwner(overviewFilter.owner || "Tất cả phụ trách");
    }
  }, [overviewFilter?.owner]);

  // Data Scoping: Chỉ hiển thị các BU mà user được phép xem
  const scopedData = useMemo(() => {
    if (!data) return data;
    if (isBOD) return data;

    const allowedTabs = (data.buTabs || []).filter((tab) => canAccessBu(tab.id));
    const allowedBuIds = allowedTabs.map((t) => t.id);

    const scopedRows = (data.summaryRows || []).filter(
      (row) => row.isTotal || (row.buId && allowedBuIds.includes(row.buId))
    );

    return {
      ...data,
      buTabs: allowedTabs,
      summaryRows: scopedRows,
    };
  }, [data, isBOD, canAccessBu]);

  const viewData = useMemo(() => {
    return buildOwnerFilteredView(scopedData, selectedOwner);
  }, [scopedData, selectedOwner]);

  const selectedBuTab =
    selectedOwner === "Tất cả phụ trách"
      ? null
      : (scopedData?.buTabs || []).find((tab) => tab?.owner === selectedOwner);

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerDaily() {
      if (!selectedOwner || selectedOwner === "Tất cả phụ trách") {
        setOwnerDailySeries(data?.dailySeries || []);
        return;
      }

      if (!selectedBuTab?.mainId) {
        setOwnerDailySeries([]);
        return;
      }

      try {
        setLoadingOwnerDaily(true);
        const periodParams = startDate && endDate ? { startDate, endDate } : { month: selectedMonth, year: selectedYear };
        const result = await fetchDailyPerformance({ ...periodParams, buId: selectedBuTab.mainId });
        if (!cancelled) setOwnerDailySeries(Array.isArray(result) ? result : []);
      } catch {
        if (!cancelled) setOwnerDailySeries([]);
      } finally {
        if (!cancelled) setLoadingOwnerDaily(false);
      }
    }

    loadOwnerDaily();
    return () => { cancelled = true; };
  }, [selectedOwner, selectedBuTab?.mainId, startDate, endDate, selectedMonth, selectedYear, data?.dailySeries]);

  const rangeLabel = startDate && endDate
    ? `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`
    : `Tháng ${String(selectedMonth).padStart(2, "0")}/${selectedYear}`;

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    try {
      setExportingPdf(true);
      await exportElementToPdf(dashRef.current, buildPdfFileName("dashboard-tong-quan", rangeLabel));
      toast.success("Đã tải báo cáo PDF.");
    } catch (error) {
      toast.error(error.message || "Không xuất được PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleOwnerChange = (newOwner) => {
    setSelectedOwner(newOwner);
    onApplyOverviewFilter?.({ owner: newOwner });
  };

  const ownerOptions = (scopedData?.header?.ownerOptions || ["Tất cả phụ trách"]).map((val) => ({
    value: val,
    label: val,
  }));

  const secondaryOwnerFilter = (
    <CustomSelect
      value={selectedOwner}
      onChange={handleOwnerChange}
      options={ownerOptions}
      placeholder="Chọn người phụ trách"
      triggerStyle={{ height: 36, fontSize: 12, padding: "0 12px", minWidth: 150 }}
    />
  );

  return (
    <div className="dash" ref={dashRef} style={{ padding: "0 16px" }}>
      {/* TẦNG 2: Unified Sub-Header */}
      <UnifiedSubHeader
        title={viewData?.header?.title || "Dashboard Tổng Quan"}
        subtitle={`Ngày báo cáo: ${viewData?.header?.reportDate || "-"} | ${rangeLabel} | ${viewData?.header?.buLabel || "Tất cả BU"}`}
        datePickerProps={{
          startDate,
          endDate,
          preset,
          onChangeRange: (newRange) => onApplyOverviewFilter?.(newRange),
        }}
        secondaryFilter={secondaryOwnerFilter}
        onRefresh={onRefreshDashboard}
        loading={loadingDashboard}
        onExportPdf={handleExportPdf}
        exportingPdf={exportingPdf}
      />

      {/* Overview Top KPIs */}
      <OverviewKpiGrid
        topKpis={viewData?.topKpis || []}
        overseaKpis={viewData?.overseaKpis || []}
      />

      {/* Daily Performance Line Chart & BU Progress */}
      <DailyPerformanceChart
        lineChartTitle={`Diễn biến DT & TT theo ngày — ${selectedOwner === "Tất cả phụ trách" ? "Toàn công ty" : selectedOwner} (${rangeLabel})`}
        dailySeries={ownerDailySeries}
        revenueChart={viewData?.charts?.revenue || []}
        cashChart={viewData?.charts?.cash || []}
        loadingDaily={loadingOwnerDaily}
      />

      {/* BU Performance & Alerts DataTables */}
      <BuPerformanceTable
        monthLabel={viewData?.header?.monthLabel || rangeLabel}
        summaryColumns={viewData?.summaryColumns || []}
        summaryRows={viewData?.summaryRows || []}
        alertColumns={viewData?.alertColumns || []}
        alertRows={viewData?.alertRows || []}
      />

      {/* Finance KPIs */}
      <FinanceKpiGrid financeKpis={viewData?.financeKpis || []} />
    </div>
  );
}