import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import MetricCard from "../components/MetricCard";
import ProgressChart from "../components/ProgressChart";
import DailyLineChart from "../components/DailyLineChart";
import DetailMetricCompareChart from "../components/DetailMetricCompareChart";
import DataTable from "../components/DataTable";
import UserMenu from "../components/UserMenu";
import { buildPdfFileName, exportElementToPdf } from "../utils/exportPdf";

function buildMonthOptions(year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      value: `${year}-${String(month).padStart(2, "0")}`,
      label: `T${String(month).padStart(2, "0")}/${year}`,
      month,
      year,
    };
  });
}

function getPercentColor(percent) {
  if (percent === null || percent === undefined || percent === "" || percent === "—") {
    return "#888780";
  }

  const value = Number(percent);
  if (!Number.isFinite(value)) return "#888780";
  if (value < 70) return "#d44f43";
  if (value < 100) return "#b7791f";
  return "#2f8f3a";
}

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

export default function DashboardBuDetailPage({
  data,
  activeBu,
  onChangeBu,
  onBack,
  onLogout,
  currentUser,
  selectedMonth,
  selectedYear,
  onChangePeriod,
  loadingDetail,
  onRefreshDetail,
  detailFilter,
  onApplyDetailFilter,
}) {
  const PRESET_LABELS = {
    yesterday: "Hôm qua",
    today: "Hôm nay",
    thisWeek: "Tuần này",
    thisMonth: "Tháng này",
  };

  const tabs = Array.isArray(data?.buTabs) ? data.buTabs : [];
  const detail = data?.buDetails?.[activeBu] || null;
  const activeTab = tabs.find((tab) => tab.id === activeBu);

  // Fallback month range
  const fallbackRange = useMemo(() => {
    const from = new Date(selectedYear, selectedMonth - 1, 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(selectedYear, selectedMonth, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, [selectedMonth, selectedYear]);

  const externalStartDate = detailFilter?.startDate
    ? new Date(detailFilter.startDate)
    : fallbackRange.from;
  const externalEndDate = detailFilter?.endDate
    ? new Date(detailFilter.endDate)
    : fallbackRange.to;
  const externalPreset = detailFilter?.preset || "custom";

  const [draftFromDate, setDraftFromDate] = useState(externalStartDate);
  const [draftToDate, setDraftToDate] = useState(externalEndDate);
  const [appliedFromDate, setAppliedFromDate] = useState(externalStartDate);
  const [appliedToDate, setAppliedToDate] = useState(externalEndDate);
  const [activePreset, setActivePreset] = useState(externalPreset);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

  const [exportingPdf, setExportingPdf] = useState(false);
  const dashRef = useRef(null);

  async function handleExportPdf() {
    if (exportingPdf) return;

    try {
      setExportingPdf(true);
      await exportElementToPdf(
        dashRef.current,
        buildPdfFileName(`chi-tiet-bu-${activeBu}`, rangeLabel)
      );
      toast.success("Đã tải báo cáo PDF.");
    } catch (error) {
      console.error("Export PDF error:", error);
      toast.error(error.message || "Không xuất được PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  // Sync state with prop updates
  useEffect(() => {
    setDraftFromDate(externalStartDate);
    setDraftToDate(externalEndDate);
    setAppliedFromDate(externalStartDate);
    setAppliedToDate(externalEndDate);
    setActivePreset(externalPreset);
  }, [detailFilter?.startDate, detailFilter?.endDate, detailFilter?.preset]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper date functions
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

  const rangeLabel = buildRangeLabel(appliedFromDate, appliedToDate);

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

    onApplyDetailFilter?.({
      startDate: formatDateApi(normalizedFrom),
      endDate: formatDateApi(normalizedTo),
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

  const monthOptions = useMemo(() => buildMonthOptions(selectedYear), [selectedYear]);

  // Custom date field — click anywhere opens native picker
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
          return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
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
            onChange={(e) => { setActivePreset("custom"); onChange(e.target.value ? new Date(e.target.value) : null); }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  }

  const safeDetail = detail || {
    title: activeTab?.label || "BU",
    owner: "",
    subInfo: "",
    statusTone: "neutral",
    revenuePercent: null,
    collectionPercent: null,
    revenuePercentText: "—",
    collectionPercentText: "—",
    kpis: [
      {
        label: "DT tháng",
        valueText: "—",
        targetText: "/ —",
        percent: null,
        percentText: "—",
        accent: "blue",
        progressColor: "blue",
        deltaText: "—",
        note: "",
        unit: "",
      },
      {
        label: "Thu tiền tháng",
        valueText: "—",
        targetText: "/ —",
        percent: null,
        percentText: "—",
        accent: "teal",
        progressColor: "teal",
        deltaText: "—",
        note: "",
        unit: "",
      },
      {
        label: "DT hôm nay",
        valueText: "—",
        targetText: "/ — (ngày)",
        percent: null,
        percentText: "—",
        accent: "blue",
        progressColor: "blue",
        deltaText: "—",
        note: "",
        unit: "",
      },
      {
        label: "Thu tiền hôm nay",
        valueText: "—",
        targetText: "/ — (ngày)",
        percent: null,
        percentText: "—",
        accent: "teal",
        progressColor: "teal",
        deltaText: "—",
        note: "",
        unit: "",
      },
    ],
    dailySeries: [],
    layoutType: activeBu === "elevator" ? "subMang" : "detailSummary",
    revenueChart: {
      title: `Sub-mảng — DT KH vs lũy kế T${String(selectedMonth).padStart(2, "0")}`,
      data: [],
    },
    cashChart: {
      title: `Sub-mảng — TT KH vs lũy kế T${String(selectedMonth).padStart(2, "0")}`,
      data: [],
    },
    compareChart: {
      title: `DT & TT — KH vs lũy kế T${String(selectedMonth).padStart(2, "0")}`,
      data: [],
    },
    detailSummary: {
      title: "Chỉ tiêu chi tiết",
      rows: [],
    },
    table: {
      title: `Bảng chi tiết — ${activeTab?.label || "BU"} sub-mảng T${String(selectedMonth).padStart(2, "0")}/${selectedYear}`,
      columns: [],
      rows: [],
    },
  };

  return (
    <div className="page">
      <div className="dash" ref={dashRef}>
        <div className="hdr">
          <div className="hdr-left">
            <h1>Dashboard Chi Tiết Từng BU</h1>
            <p>
              Ngày báo cáo: {data?.header?.reportDate || "-"} |{" "}
              {data?.header?.monthLabel || "-"}
            </p>
          </div>

          <div className="hdr-right">
            <UserMenu currentUser={currentUser} onLogout={onLogout} />
          </div>
        </div>

        {/* ===== COMPACT SMART TOOLBAR ===== */}
        <div className="smart-toolbar">
          {/* Left: Date range picker + BU picker */}
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
                  {PRESET_LABELS[activePreset] ? (
                    <span className="date-picker-preset-badge">{PRESET_LABELS[activePreset]}</span>
                  ) : null}
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

            {/* BU filter */}
            <div className="otb-owner-wrap">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 14V3.5A1.5 1.5 0 0 1 3.5 2h9a1.5 1.5 0 0 1 1.5 1.5V14M2 14h12M5 6h2M5 9h2M9 6h2M9 9h2M7 14v-3h2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <select
                className="otb-owner-select"
                value={activeBu}
                onChange={(e) => onChangeBu?.(e.target.value)}
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: meta + actions */}
          <div className="otb-right">
            <span className="otb-updated">
              Cập nhật: {data?.header?.updatedAt || "-"}
            </span>

            <div className="otb-sep" />

            <button
              type="button"
              className="otb-icon-btn"
              onClick={onRefreshDetail}
              disabled={loadingDetail}
              title="Làm mới dữ liệu"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
                style={{ animation: loadingDetail ? "spin 1s linear infinite" : "none" }}>
                <path d="M13.5 8a5.5 5.5 0 1 1-1.1-3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12.5 2v3.5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {loadingDetail ? "Đang tải..." : "Làm mới"}
            </button>

            <button
              type="button"
              className="otb-icon-btn"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              title="Tải báo cáo PDF"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8m0 0L5 7m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 11v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {exportingPdf ? "Đang xuất..." : "Tải PDF"}
            </button>

            <div className="otb-sep" />

            <button
              type="button"
              className="otb-nav-btn"
              onClick={onBack}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tổng quan
            </button>
          </div>
        </div>

        <div className="bu-header">
          <div>
            <div className="bu-name">{safeDetail.title}</div>
            <div className="bu-owner">
              Phụ trách: {safeDetail.owner || "-"}
              {safeDetail.subInfo ? ` | ${safeDetail.subInfo}` : ""}
            </div>
          </div>

          <div className="bu-status-badge dynamic">
            <span style={{ color: getPercentColor(safeDetail.revenuePercent) }}>
              DT: {safeDetail.revenuePercentText || "—"} KH
            </span>
            <span className="bu-status-sep">|</span>
            <span style={{ color: getPercentColor(safeDetail.collectionPercent) }}>
              TT: {safeDetail.collectionPercentText || "—"} KH
            </span>
          </div>
        </div>

        <div className="slbl">KPI tháng — {safeDetail.title}</div>
        <div className="kpi-grid kpi-grid-4">
          {(safeDetail.kpis || []).map((item, idx) => (
            <MetricCard key={idx} item={item} />
          ))}
        </div>

        <div className="slbl">DT & TT theo ngày trong tháng</div>
        <DailyLineChart
          title={`Doanh thu & Thu tiền theo ngày — T${String(
            appliedFromDate ? appliedFromDate.getMonth() + 1 : selectedMonth
          ).padStart(2, "0")}/${
            appliedFromDate ? appliedFromDate.getFullYear() : selectedYear
          }`}
          data={safeDetail.dailySeries || []}
        />

        {safeDetail.layoutType === "subMang" ? (
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
        ) : (
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
        )}
      </div>
    </div>
  );
}