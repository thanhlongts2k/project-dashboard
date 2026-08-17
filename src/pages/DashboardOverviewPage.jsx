import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import MetricCard from "../components/MetricCard";
import ProgressChart from "../components/ProgressChart";
import DailyLineChart from "../components/DailyLineChart";
import DataTable from "../components/DataTable";
import UserMenu from "../components/UserMenu";
import {
  formatCompactMoney,
  formatPercent,
} from "../utils/numberFormat";
import { fetchDailyPerformance } from "../api/dashboardApi";
import { buildPdfFileName, exportElementToPdf } from "../utils/exportPdf";

const PRESET_LABELS = {
  yesterday: "Hôm qua",
  today: "Hôm nay",
  thisWeek: "Tuần này",
  thisMonth: "Tháng này",
};

function buildOwnerFilteredView(data, selectedOwner) {
  if (!selectedOwner || selectedOwner === "Tất cả phụ trách") {
    return data;
  }

  const mainRow = (data?.summaryRows || []).find(
    (row) => !row?.isTotal && !row?.isSub && row?.owner === selectedOwner
  );

  if (!mainRow) return data;

  const revenueLabel = data?.topKpis?.[0]?.label || "DT theo kỳ";
  const cashLabel = data?.topKpis?.[1]?.label || "Thu tiền theo kỳ";

  return {
    ...data,
    header: {
      ...(data?.header || {}),
      buLabel: mainRow.bu,
    },
    topKpis: [
      {
        label: revenueLabel,
        value: mainRow.revenueActualRaw ?? 0,
        valueText: mainRow.revenueActual,
        targetText: `/ ${mainRow.revenueTarget}`,
        percent: mainRow.revenuePercentValue,
        percentText: mainRow.revenuePercent,
        accent: "blue",
        progressColor: "blue",
        deltaText: mainRow.revenueGap,
        note: "",
        unit: "",
      },
      {
        label: cashLabel,
        value: mainRow.cashActualRaw ?? 0,
        valueText: mainRow.cashActual,
        targetText: `/ ${mainRow.cashTarget}`,
        percent: mainRow.cashPercentValue,
        percentText: mainRow.cashPercent,
        accent: "teal",
        progressColor: "teal",
        deltaText: mainRow.cashGap,
        note: "",
        unit: "",
      },
      {
        label: "Tồn kho",
        value: mainRow.inventoryActualRaw ?? 0,
        valueText: formatCompactMoney(mainRow.inventoryActualRaw),
        targetText: `Ngưỡng: ${formatCompactMoney(
          mainRow.inventoryTargetRaw
        )}`,
        percent: mainRow.inventoryPercentValue,
        percentText: formatPercent(mainRow.inventoryPercentValue),
        accent: "amber",
        progressColor: "amber",
        deltaText: "—",
        note: "",
        unit: "",
        reverseTone: true,
      },
      {
        label: "Nợ ngân hàng",
        value: mainRow.debtActualRaw ?? 0,
        valueText: formatCompactMoney(mainRow.debtActualRaw),
        targetText: `Ngưỡng: ${formatCompactMoney(mainRow.debtTargetRaw)}`,
        percent: mainRow.debtPercentValue,
        percentText: formatPercent(mainRow.debtPercentValue),
        accent: "purple",
        progressColor: "purple",
        deltaText: "—",
        note: "",
        unit: "",
        reverseTone: true,
      },
    ],
    summaryRows: [mainRow],
    alertRows: (data?.alertRows || []).filter(
      (item) => item?.buId === mainRow?.buId
    ),
    charts: {
      revenue: (data?.charts?.revenue || []).filter(
        (item) => item?.buId === mainRow?.buId
      ),
      cash: (data?.charts?.cash || []).filter(
        (item) => item?.buId === mainRow?.buId
      ),
    },
  };
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function endOfWeek(date) {
  return endOfDay(addDays(startOfWeek(date), 6));
}

function startOfMonth(date) {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

function endOfMonth(date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function buildCurrentPresetRange(preset) {
  const now = new Date();

  switch (preset) {
    case "yesterday": {
      const y = addDays(now, -1);
      return {
        from: startOfDay(y),
        to: endOfDay(y),
      };
    }
    case "today":
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      };
    case "thisWeek":
      return {
        from: startOfWeek(now),
        to: endOfWeek(now),
      };
    case "thisMonth":
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
      };
    default:
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      };
  }
}

function buildMonthBoundRange(month, year) {
  const from = startOfDay(new Date(year, month - 1, 1));
  const to = endOfDay(new Date(year, month, 0));
  return { from, to };
}

function formatDateInput(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function formatDateApi(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function formatDateDisplay(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

function buildRangeLabel(fromDate, toDate) {
  return `${formatDateDisplay(fromDate)} – ${formatDateDisplay(toDate)}`;
}

function normalizeOwnerOptions(options = []) {
  return (Array.isArray(options) ? options : []).map((item) => ({
    value: item,
    label: item,
  }));
}

function buildRangeDailySeries(rows, fromDate, toDate) {
  const dailyRows = Array.isArray(rows) ? rows : [];
  const from = fromDate ? startOfDay(fromDate) : null;
  const to = toDate ? startOfDay(toDate) : null;

  if (!from || !to) return [];

  const byDate = new Map();

  dailyRows.forEach((item) => {
    const key = String(item?.date || "").slice(0, 10);
    if (!key) return;

    const revenue = Number(item?.daily_revenue || 0) || 0;
    const collection = Number(item?.daily_collection || 0) || 0;

    const current = byDate.get(key) || { revenue: 0, collection: 0 };
    current.revenue += revenue;
    current.collection += collection;
    byDate.set(key, current);
  });

  const result = [];
  const cursor = new Date(from);

  while (cursor.getTime() <= to.getTime()) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    const current = byDate.get(key) || { revenue: 0, collection: 0 };

    result.push({
      date: key,
      name: `${dd}/${mm}`,
      label: `${dd}/${mm}`,
      revenue: current.revenue,
      collection: current.collection,
      cash: current.collection,
      dailyRevenue: current.revenue,
      dailyCollection: current.collection,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

export default function DashboardOverviewPage({
  data,
  onOpenDetail,
  onLogout,
  currentUser,
  loadingDashboard,
  onRefreshDashboard,
  selectedMonth,
  selectedYear,
  onOpenInventoryReport,
  onOpenReceivableReport,
  onApplyOverviewFilter,
  onExportAllReports,
  overviewFilter,
}) {
  const [selectedOwner, setSelectedOwner] = useState(
    localStorage.getItem("dashboard_selected_owner") || "Tất cả phụ trách"
  );

  const fallbackRange = useMemo(
    () => buildMonthBoundRange(selectedMonth, selectedYear),
    [selectedMonth, selectedYear]
  );

  const externalStartDate = overviewFilter?.startDate
    ? new Date(overviewFilter.startDate)
    : fallbackRange.from;
  const externalEndDate = overviewFilter?.endDate
    ? new Date(overviewFilter.endDate)
    : fallbackRange.to;
  const externalPreset = overviewFilter?.preset || "custom";

  const [draftFromDate, setDraftFromDate] = useState(externalStartDate);
  const [draftToDate, setDraftToDate] = useState(externalEndDate);
  const [appliedFromDate, setAppliedFromDate] = useState(externalStartDate);
  const [appliedToDate, setAppliedToDate] = useState(externalEndDate);
  const [activePreset, setActivePreset] = useState(externalPreset);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

  const [ownerDailySeries, setOwnerDailySeries] = useState(
    data?.dailySeries || []
  );
  const [loadingOwnerDaily, setLoadingOwnerDaily] = useState(false);

  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const dashRef = useRef(null);

  async function handleExportPdf() {
    if (exportingPdf) return;

    try {
      setExportingPdf(true);
      await exportElementToPdf(
        dashRef.current,
        buildPdfFileName("dashboard-tong-quan", rangeLabel)
      );
      toast.success("Đã tải báo cáo PDF.");
    } catch (error) {
      console.error("Export PDF error:", error);
      toast.error(error.message || "Không xuất được PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleExportAll() {
    if (exportingAll) return;

    try {
      setExportingAll(true);
      await onExportAllReports?.();
    } finally {
      setExportingAll(false);
    }
  }


  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem("dashboard_selected_owner", selectedOwner);
  }, [selectedOwner]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const ownerOptionValues =
      data?.header?.ownerOptions || ["Tất cả phụ trách"];
    if (!ownerOptionValues.includes(selectedOwner)) {
      setSelectedOwner("Tất cả phụ trách");
    }
  }, [data, selectedOwner]);

  useEffect(() => {
    setDraftFromDate(externalStartDate);
    setDraftToDate(externalEndDate);
    setAppliedFromDate(externalStartDate);
    setAppliedToDate(externalEndDate);
    setActivePreset(externalPreset);
  }, [overviewFilter?.startDate, overviewFilter?.endDate, overviewFilter?.preset]);

  const viewData = useMemo(() => {
    return buildOwnerFilteredView(data, selectedOwner);
  }, [data, selectedOwner]);

  const ownerOptions = useMemo(
    () =>
      normalizeOwnerOptions(
        viewData?.header?.ownerOptions || ["Tất cả phụ trách"]
      ),
    [viewData]
  );

  const selectedMainRow =
    selectedOwner === "Tất cả phụ trách"
      ? null
      : (data?.summaryRows || []).find(
          (row) => !row?.isTotal && !row?.isSub && row?.owner === selectedOwner
        );

  const selectedBuTab =
    selectedOwner === "Tất cả phụ trách"
      ? null
      : (data?.buTabs || []).find((tab) => tab?.owner === selectedOwner);

  const targetBuId =
    selectedMainRow?.buId || data?.buTabs?.[0]?.id || "elevator";

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerDailySeries() {
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

        const rows = await fetchDailyPerformance({
          buId: selectedBuTab.mainId,
          startDate: formatDateApi(appliedFromDate),
          endDate: formatDateApi(appliedToDate),
        });

        if (cancelled) return;

        const mappedSeries = buildRangeDailySeries(
          Array.isArray(rows) ? rows : [],
          appliedFromDate,
          appliedToDate
        );

        setOwnerDailySeries(mappedSeries);
      } catch (error) {
        console.warn("Load owner daily series failed:", error);
        if (!cancelled) {
          setOwnerDailySeries([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingOwnerDaily(false);
        }
      }
    }

    loadOwnerDailySeries();

    return () => {
      cancelled = true;
    };
  }, [selectedOwner, selectedBuTab, data, appliedFromDate, appliedToDate]);

  const rawLineChartData =
    selectedOwner === "Tất cả phụ trách"
      ? data?.dailySeries || []
      : ownerDailySeries || [];

  const rangeLabel = buildRangeLabel(appliedFromDate, appliedToDate);

  const lineChartTitle =
    selectedOwner === "Tất cả phụ trách"
      ? `Doanh thu & Thu tiền theo ngày — ${rangeLabel}`
      : `Doanh thu & Thu tiền theo ngày — ${
          viewData?.header?.buLabel || ""
        } — ${rangeLabel}`;

  function applyRange(nextFrom, nextTo, preset = activePreset) {
    const safeFrom = nextFrom ? new Date(nextFrom) : null;
    const safeTo = nextTo ? new Date(nextTo) : null;

    if (!safeFrom || !safeTo) return;

    const normalizedFrom =
      safeFrom.getTime() <= safeTo.getTime() ? safeFrom : safeTo;
    const normalizedTo =
      safeFrom.getTime() <= safeTo.getTime() ? safeTo : safeFrom;

    setDraftFromDate(normalizedFrom);
    setDraftToDate(normalizedTo);
    setAppliedFromDate(normalizedFrom);
    setAppliedToDate(normalizedTo);
    setActivePreset(preset);

    onApplyOverviewFilter?.({
      startDate: formatDateApi(normalizedFrom),
      endDate: formatDateApi(normalizedTo),
      owner: selectedOwner,
      preset,
    });
  }

  function handleQuickPreset(preset) {
    const nextRange = buildCurrentPresetRange(preset);
    applyRange(nextRange.from, nextRange.to, preset);
  }

  function handleQuickPresetAndClose(preset) {
    handleQuickPreset(preset);
    setIsDatePickerOpen(false);
  }

  function handleApplyFilter() {
    applyRange(draftFromDate, draftToDate, activePreset || "custom");
    setIsDatePickerOpen(false);
  }

  function DateField({ label, value, onChange }) {
    const ref = useRef(null);

    function handleFieldClick(e) {
      if (e.target === ref.current) return;
      try { ref.current?.showPicker(); } catch (_) { ref.current?.focus(); }
    }

    const displayVal = value
      ? (() => {
          const d = new Date(value);
          if (isNaN(d.getTime())) return "";
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        })()
      : "";

    return (
      <div className="cdp-field" onClick={handleFieldClick}>
        <span className="cdp-field__label">{label}</span>
        <div className="cdp-field__body">
          <svg className="cdp-field__icon" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span className="cdp-field__text">{displayVal || <span className="cdp-field__placeholder">DD/MM/YYYY</span>}</span>
          <input
            ref={ref}
            type="date"
            className="cdp-field__native"
            value={formatDateInput(value ? new Date(value) : null)}
            onChange={(e) => {
              setActivePreset("custom");
              onChange(e.target.value ? new Date(e.target.value) : null);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="dash" ref={dashRef}>
        <div className="hdr">
          <div className="hdr-left">
            <h1>{viewData?.header?.title || "Dashboard Tổng Quan"}</h1>
            <p>
              Ngày báo cáo: {viewData?.header?.reportDate || "-"} | {rangeLabel}{" "}
              | {viewData?.header?.buLabel || "Tất cả BU"}
            </p>
          </div>

          <div className="hdr-right">
            <UserMenu currentUser={currentUser} onLogout={onLogout} />
          </div>
        </div>

        {/* ===== COMPACT SMART TOOLBAR ===== */}
        <div className="smart-toolbar">

          {/* Left: Date range picker */}
          <div className="smart-toolbar__left">
            <div className="date-picker-wrap" ref={datePickerRef}>
              <button
                type="button"
                className={`date-picker-trigger ${isDatePickerOpen ? "is-open" : ""}`}
                onClick={() => setIsDatePickerOpen((v) => !v)}
              >
                <svg className="date-picker-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <span className="date-picker-range">
                  {PRESET_LABELS[activePreset]
                    ? <span className="date-picker-preset-badge">{PRESET_LABELS[activePreset]}</span>
                    : null}
                  <span>{rangeLabel}</span>
                </span>
                <svg className={`date-picker-caret ${isDatePickerOpen ? "rotated" : ""}`} viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {isDatePickerOpen && (
                <div className="date-picker-dropdown">
                  {/* Preset list */}
                  <div className="date-picker-presets">
                    <div className="date-picker-presets-label">Nhanh</div>
                    {["yesterday", "today", "thisWeek", "thisMonth"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`date-preset-item ${activePreset === preset ? "is-active" : ""}`}
                        onClick={() => handleQuickPresetAndClose(preset)}
                      >
                        {PRESET_LABELS[preset]}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="date-picker-divider" />

                  {/* Custom range */}
                  <div className="date-picker-custom">
                    <div className="date-picker-custom-label">Tùy chỉnh</div>
                    <div className="date-picker-inputs">
                      <DateField
                        label="Từ ngày"
                        value={draftFromDate}
                        onChange={(d) => setDraftFromDate(d)}
                      />
                      <div className="date-picker-sep">→</div>
                      <DateField
                        label="Đến ngày"
                        value={draftToDate}
                        onChange={(d) => setDraftToDate(d)}
                      />
                    </div>
                    <button
                      type="button"
                      className="date-picker-apply-btn"
                      onClick={handleApplyFilter}
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Owner filter */}
            <div className="otb-owner-wrap">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M2 13c0-2.5 2.686-4 6-4s6 1.5 6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <select
                className="otb-owner-select"
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
              >
                {ownerOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: meta + actions */}
          <div className="otb-right">
            <span className="otb-updated">
              Cập nhật: {viewData?.header?.updatedAt || "-"}
            </span>

            <div className="otb-sep" />

            {/* Refresh */}
            <button
              type="button"
              className="otb-icon-btn"
              onClick={onRefreshDashboard}
              disabled={loadingDashboard}
              title="Làm mới dữ liệu"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                style={{
                  animation: loadingDashboard ? "spin 1s linear infinite" : "none",
                }}
              >
                <path
                  d="M13.5 8a5.5 5.5 0 1 1-1.1-3.3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M12.5 2v3.5H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {loadingDashboard ? "Đang tải..." : "Làm mới"}
            </button>

            {/* Export PDF */}
            <button
              type="button"
              className="otb-icon-btn"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              title="Tải báo cáo PDF"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2v8m0 0L5 7m3 3l3-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 11v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {exportingPdf ? "Đang xuất..." : "Tải PDF"}
            </button>

            {/* Export ALL reports into one PDF */}
            <button
              type="button"
              className="otb-icon-btn"
              onClick={handleExportAll}
              disabled={exportingAll}
              title="Tải tổng hợp toàn bộ báo cáo vào 1 file PDF"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M13 5v8a1.5 1.5 0 0 1-1.5 1.5H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M6.5 6.5v3.5m0 0L5 8.5m1.5 1.5L8 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {exportingAll ? "Đang tổng hợp..." : "Tải tất cả"}
            </button>

            <div className="otb-sep" />

            {/* Navigation actions */}
            <button
              type="button"
              className="otb-nav-btn"
              onClick={() => onOpenDetail?.(targetBuId)}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              Chi tiết BU
            </button>

            <button
              type="button"
              className="otb-nav-btn"
              onClick={onOpenInventoryReport}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M5 5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Tồn kho
            </button>

            <button
              type="button"
              className="otb-nav-btn"
              onClick={onOpenReceivableReport}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Công nợ
            </button>
          </div>
        </div>

        <div className="slbl">Tổng quan</div>
        <div className="kpi-grid kpi-grid-4">
          {(viewData?.topKpis || []).map((item, idx) => (
            <MetricCard key={idx} item={item} />
          ))}
        </div>

        {(viewData?.overseaKpis || []).length > 0 && (
          <>
            <div className="slbl">Doanh thu Oversea</div>
            <div className="kpi-grid kpi-grid-4">
              {(viewData?.overseaKpis || []).map((item, idx) => (
                <MetricCard key={idx} item={item} />
              ))}
            </div>
          </>
        )}

        <div className="slbl">DT & TT theo khoảng ngày</div>
        <DailyLineChart
          title={loadingOwnerDaily ? "Đang tải dữ liệu ngày..." : lineChartTitle}
          data={rawLineChartData}
        />

        <div className="slbl">Tiến độ theo BU</div>
        <div className="chart-grid">
          <ProgressChart
            title="Doanh thu — KH vs thực hiện"
            data={viewData?.charts?.revenue || []}
            theme="blue"
          />
          <ProgressChart
            title="Thu tiền — KH vs thực hiện"
            data={viewData?.charts?.cash || []}
            theme="teal"
          />
        </div>

        <div className="table-grid">
          <DataTable
            title={`Bảng tổng hợp tất cả BU — ${
              viewData?.header?.monthLabel ||
              `T${String(selectedMonth).padStart(2, "0")}/${selectedYear}`
            }`}
            columns={viewData?.summaryColumns || []}
            rows={viewData?.summaryRows || []}
            variant="summary"
          />

          <DataTable
            title="Cảnh báo điều hành"
            columns={viewData?.alertColumns || []}
            rows={viewData?.alertRows || []}
            variant="alert"
          />
        </div>

        <div className="slbl">Tài chính</div>
        <div className="kpi-grid kpi-grid-4">
          {(viewData?.financeKpis || []).map((item, idx) => (
            <MetricCard key={idx} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}