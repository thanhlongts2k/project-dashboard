import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import UnifiedSubHeader from "../components/common/UnifiedSubHeader";
import CustomSelect from "../components/common/CustomSelect";
import OverviewKpiGrid from "../components/dashboard/OverviewKpiGrid";
import DailyPerformanceChart from "../components/dashboard/DailyPerformanceChart";
import BuPerformanceTable from "../components/dashboard/BuPerformanceTable";
import FinanceKpiGrid from "../components/dashboard/FinanceKpiGrid";
import { formatCompactMoney, formatPercent, toNullableNumber } from "../utils/numberFormat";
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

function buildOwnerFilteredView(data, selectedOwner, ownerDailySeries = []) {
  if (!data) return data;
  if (!selectedOwner || selectedOwner === "Tất cả phụ trách" || selectedOwner === "all" || selectedOwner === "Tất cả") {
    return data;
  }

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
    let actualRevenue = mainRow.revenueActualRaw ?? toNullableNumber(mainRow.revenueActual);
    let actualCash = mainRow.cashActualRaw ?? toNullableNumber(mainRow.cashActual);
    const planRevenue = mainRow.revenueTargetRaw ?? toNullableNumber(mainRow.revenueTarget);
    const planCash = mainRow.cashTargetRaw ?? toNullableNumber(mainRow.cashTarget);

    // Nếu có mảng daily performance tải về từ API, ưu tiên tính tổng theo kỳ lọc
    if (Array.isArray(ownerDailySeries) && ownerDailySeries.length > 0) {
      const sumRev = ownerDailySeries.reduce(
        (sum, item) => sum + (Number(item?.revenue ?? item?.daily_revenue ?? item?.dailyRevenue ?? 0) || 0),
        0
      );
      const sumCol = ownerDailySeries.reduce(
        (sum, item) => sum + (Number(item?.collection ?? item?.daily_collection ?? item?.dailyCollection ?? item?.cash ?? 0) || 0),
        0
      );
      if (sumRev > 0 || sumCol > 0) {
        actualRevenue = sumRev;
        actualCash = sumCol;
      }
    }

    const revenuePercent =
      planRevenue && planRevenue > 0
        ? (actualRevenue / planRevenue) * 100
        : (mainRow.revenuePercentValue ?? null);

    const cashPercent =
      planCash && planCash > 0
        ? (actualCash / planCash) * 100
        : (mainRow.cashPercentValue ?? null);

    topKpis = [
      {
        accent: "blue",
        label: "Doanh thu",
        value: actualRevenue ?? 0,
        valueText: formatCompactMoney(actualRevenue),
        targetText: planRevenue ? `/ ${formatCompactMoney(planRevenue)}` : "—",
        percent: revenuePercent,
        percentText: formatPercent(revenuePercent),
        progressColor: "blue",
      },
      {
        accent: "teal",
        label: "Thu tiền",
        value: actualCash ?? 0,
        valueText: formatCompactMoney(actualCash),
        targetText: planCash ? `/ ${formatCompactMoney(planCash)}` : "—",
        percent: cashPercent,
        percentText: formatPercent(cashPercent),
        progressColor: "teal",
      },
      ...(data.topKpis || []).slice(2),
    ];

    revenueChart = [
      {
        name: mainRow.bu,
        bu: mainRow.bu,
        target: planRevenue,
        plan: planRevenue,
        actual: actualRevenue,
        percent: revenuePercent,
        gap: planRevenue !== null && actualRevenue !== null ? Math.max(planRevenue - actualRevenue, 0) : null,
      },
    ];

    cashChart = [
      {
        name: mainRow.bu,
        bu: mainRow.bu,
        target: planCash,
        plan: planCash,
        actual: actualCash,
        percent: cashPercent,
        gap: planCash !== null && actualCash !== null ? Math.max(planCash - actualCash, 0) : null,
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
    return buildOwnerFilteredView(scopedData, selectedOwner, ownerDailySeries);
  }, [scopedData, selectedOwner, ownerDailySeries]);

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

        if (!cancelled) {
          const formatted = (Array.isArray(result) ? result : []).map((item) => {
            const rev = Number(item?.revenue ?? item?.daily_revenue ?? item?.dailyRevenue ?? 0) || 0;
            const col = Number(item?.collection ?? item?.daily_collection ?? item?.dailyCollection ?? item?.cash ?? 0) || 0;
            const rawDate = String(item?.date || "");
            const formattedDate =
              item?.formattedDate ||
              (rawDate.length >= 10 ? `${rawDate.slice(8, 10)}/${rawDate.slice(5, 7)}` : rawDate);

            return {
              date: rawDate,
              formattedDate,
              label: formattedDate,
              name: formattedDate,
              revenue: rev,
              collection: col,
              dailyRevenue: rev,
              dailyCollection: col,
            };
          });

          setOwnerDailySeries(formatted);
        }
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
      triggerStyle={{ fontSize: 13, minWidth: 150 }}
    />
  );

  return (
    <div className="dash" ref={dashRef}>
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