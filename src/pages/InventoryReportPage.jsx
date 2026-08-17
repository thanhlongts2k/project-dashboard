import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import MetricCard from "../components/MetricCard";
import UserMenu from "../components/UserMenu";
import WrappedAxisTick from "../components/WrappedAxisTick";
import { toast } from "react-hot-toast";
import { formatCompactMoney, formatCompactShort } from "../utils/numberFormat";
import { buildPdfFileName, exportElementToPdf } from "../utils/exportPdf";

const BLANK = "—";

const INVENTORY_PLACEHOLDER = {
  warehouses: [
    "Kho BH Thiết Bị",
    "Kho Dự Án",
    "Kho Bảo Hành",
    "Hàng đang đi đường",
    "Kho BU_Elevator",
    "Kho BU_Manufacturing",
    "Kho BU_Premium",
    "Kho BU_Agritech",
    "Kho BU_Eco",
    "Kho BU_Value",
  ],
  alerts: [
    "BU_Elevator — tồn lớn nhất",
    "BU_Premium — xuất nhiều",
    "BU_Agritech — không biến động",
    "BU_Eco — không biến động",
    "Kho BH Thiết Bị — nhập mạnh",
    "Tổng kho tăng nhẹ",
  ],
  compositionLegend: [
    { name: "BU_Elevator", color: "#185FA5" },
    { name: "BU_Premium", color: "#1D9E75" },
    { name: "BU_Agritech", color: "#BA7517" },
    { name: "Kho BH TB", color: "#534AB7" },
    { name: "Còn lại", color: "#888780" },
  ],
};

const PURCHASE_COLOR = "#1FA37A";
const SALES_COLOR = "#E06432";

function monthLabel(month, year) {
  return `T${String(month).padStart(2, "0")}/${year}`;
}

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

function formatRangeText(selectedMonth, selectedYear, header = {}) {
  return `${header.monthLabel || `Tháng ${String(selectedMonth).padStart(2, "0")}/${selectedYear}`} | ${
    header.dateRangeLabel || "Từ — → —"
  } | ${header.warehouseCountLabel || "— kho hàng"}`;
}

function alertToneClass(tone) {
  if (tone === "danger") return "danger";
  if (tone === "success") return "success";
  return "warn";
}

function EmptyChart({ text = "Chưa có dữ liệu" }) {
  return <div className="inventory-empty-state">{text}</div>;
}

function InventoryPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="inventory-tooltip">
      <div className="inventory-tooltip-title">{item.name}</div>
      <div>{item.valueText || BLANK}</div>
      <div>{item.percentText || BLANK}</div>
    </div>
  );
}

function InventoryBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="inventory-tooltip">
      <div className="inventory-tooltip-title">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey}>
          {entry.name}: {formatCompactMoney(entry.value)}
        </div>
      ))}
    </div>
  );
}

export default function InventoryReportPage({
  data,
  currentUser,
  onLogout,
  onBack,
  selectedMonth,
  selectedYear,
  onChangePeriod,
  onRefreshInventory,
  loadingInventory,
  inventoryFilter,
  onApplyInventoryFilter,
}) {
  const PRESET_LABELS = {
    yesterday: "Hôm qua",
    today: "Hôm nay",
    thisWeek: "Tuần này",
    thisMonth: "Tháng này",
  };

  const fallbackRange = useMemo(() => {
    const from = new Date(selectedYear, selectedMonth - 1, 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(selectedYear, selectedMonth, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, [selectedMonth, selectedYear]);

  const externalStartDate = inventoryFilter?.startDate
    ? new Date(inventoryFilter.startDate)
    : fallbackRange.from;
  const externalEndDate = inventoryFilter?.endDate
    ? new Date(inventoryFilter.endDate)
    : fallbackRange.to;
  const externalPreset = inventoryFilter?.preset || "custom";

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
        buildPdfFileName("bao-cao-ton-kho", rangeLabel)
      );
      toast.success("Đã tải báo cáo PDF.");
    } catch (error) {
      console.error("Export PDF error:", error);
      toast.error(error.message || "Không xuất được PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  useEffect(() => {
    setDraftFromDate(externalStartDate);
    setDraftToDate(externalEndDate);
    setAppliedFromDate(externalStartDate);
    setAppliedToDate(externalEndDate);
    setActivePreset(externalPreset);
  }, [inventoryFilter?.startDate, inventoryFilter?.endDate, inventoryFilter?.preset]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Monday-based week calculation
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

  function handleQuickPresetAndClose(preset) {
    const range = buildCurrentPresetRange(preset);
    setDraftFromDate(range.from);
    setDraftToDate(range.to);
    setAppliedFromDate(range.from);
    setAppliedToDate(range.to);
    setActivePreset(preset);
    setIsDatePickerOpen(false);

    onApplyInventoryFilter?.({
      startDate: formatDateApi(range.from),
      endDate: formatDateApi(range.to),
      preset,
    });
  }

  function handleApplyFilter() {
    if (!draftFromDate || !draftToDate) return;
    const finalFrom = draftFromDate.getTime() <= draftToDate.getTime() ? draftFromDate : draftToDate;
    const finalTo = draftFromDate.getTime() <= draftToDate.getTime() ? draftToDate : draftFromDate;

    setAppliedFromDate(finalFrom);
    setAppliedToDate(finalTo);
    setActivePreset("custom");
    setIsDatePickerOpen(false);

    onApplyInventoryFilter?.({
      startDate: formatDateApi(finalFrom),
      endDate: formatDateApi(finalTo),
      preset: "custom",
    });
  }

  const header = data?.header || {};

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

  const overview =
    Array.isArray(data?.topKpis) && data.topKpis.length
      ? data.topKpis
      : [
          {
            accent: "blue",
            label: `Giá trị đầu kỳ T${selectedMonth}`,
            valueText: BLANK,
            unit: "",
            targetText: "= Cuối kỳ tháng trước",
            percent: null,
            percentText: BLANK,
            deltaText: "Tổng kho hàng",
          },
          {
            accent: "teal",
            label: "Giá trị mua hàng",
            valueText: BLANK,
            unit: "",
            targetText: "Nhập kho trong kỳ",
            percent: null,
            percentText: BLANK,
            deltaText: BLANK,
          },
          {
            accent: "coral",
            label: "Giá trị bán hàng",
            valueText: BLANK,
            unit: "",
            targetText: "Xuất kho trong kỳ",
            percent: null,
            percentText: BLANK,
            deltaText: BLANK,
          },
          {
            accent: "amber",
            label: "Giá trị cuối kỳ",
            valueText: BLANK,
            unit: "",
            targetText: "Tăng/giảm so đầu kỳ",
            percent: null,
            percentText: BLANK,
            deltaText: BLANK,
            reverseTone: true,
          },
        ];

  const tableRows =
    Array.isArray(data?.table?.rows) && data.table.rows.length
      ? data.table.rows
      : [
          ...INVENTORY_PLACEHOLDER.warehouses.map((name, idx) => ({
            stt: idx + 1,
            warehouse: name,
            opening: BLANK,
            inValue: BLANK,
            outValue: BLANK,
            ending: BLANK,
            delta: BLANK,
          })),
          {
            stt: "—",
            warehouse: "Tổng cộng",
            opening: BLANK,
            inValue: BLANK,
            outValue: BLANK,
            ending: BLANK,
            delta: BLANK,
            isTotal: true,
          },
        ];

  const alerts =
    Array.isArray(data?.alerts) && data.alerts.length
      ? data.alerts
      : INVENTORY_PLACEHOLDER.alerts.map((item) => ({
          label: item,
          status: BLANK,
          note: BLANK,
          tone: "warn",
        }));

  const compositionLegend =
    Array.isArray(data?.compositionLegend) && data.compositionLegend.length
      ? data.compositionLegend
      : INVENTORY_PLACEHOLDER.compositionLegend;

  const compositionData = Array.isArray(data?.compositionData)
    ? data.compositionData
    : [];

  const movementData = Array.isArray(data?.movementData)
    ? data.movementData
    : [];

  return (
    <div className="page">
      <div className="dash" ref={dashRef}>
        <div className="hdr">
          <div className="hdr-left">
            <h1>{header.title || "Báo Cáo Tồn Kho"}</h1>
            <p>
              Ngày báo cáo: {header.reportDate || BLANK} | {header.monthLabel || BLANK}
            </p>
          </div>

          <div className="hdr-right">
            <UserMenu currentUser={currentUser} onLogout={onLogout} />
          </div>
        </div>

        {/* ===== COMPACT SMART TOOLBAR ===== */}
        <div className="smart-toolbar">
          <div className="smart-toolbar__left">
            {/* Date range picker */}
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

            {/* Warehouse count badge */}
            {header.warehouseCountLabel && (
              <span className="smart-meta-badge">{header.warehouseCountLabel}</span>
            )}
          </div>

          <div className="otb-right">
            <span className="otb-updated">
              Cập nhật: {header.updatedAt || "—"}
            </span>

            <div className="otb-sep" />

            <button
              type="button"
              className="otb-icon-btn"
              onClick={onRefreshInventory}
              disabled={loadingInventory}
              title="Làm mới"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
                style={{ animation: loadingInventory ? "spin 1s linear infinite" : "none" }}>
                <path d="M13.5 8a5.5 5.5 0 1 1-1.1-3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12.5 2v3.5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {loadingInventory ? "Đang tải..." : "Làm mới"}
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

        <div className="slbl">Tổng quan</div>
        <div className="kpi-grid kpi-grid-4 inventory-kpi-grid">
          {overview.map((item, idx) => (
            <MetricCard key={`${item.label}-${idx}`} item={item} />
          ))}
        </div>

        <div className="inventory-main-grid">
          <div className="card">
            <div className="card-title">
              {data?.table?.title || "Chi tiết tồn kho theo kho hàng"}
            </div>

            <div className="table-wrap">
              <table className="bt inventory-table">
                <thead>
                  <tr>
                    <th className="inventory-col-center">STT</th>
                    <th>Kho hàng</th>
                    <th>Đầu kỳ</th>
                    <th>Mua hàng</th>
                    <th>Bán hàng</th>
                    <th>Cuối kỳ</th>
                    <th>+/−</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, idx) => (
                    <tr
                      key={`${row.warehouse || row.name || "row"}-${idx}`}
                      className={row.isTotal ? "row-total" : ""}
                    >
                      <td className="inventory-col-center inventory-stt">
                        {row.stt ?? idx + 1}
                      </td>
                      <td>{row.warehouse || row.name || BLANK}</td>
                      <td>{row.opening || BLANK}</td>
                      <td>{row.inValue || BLANK}</td>
                      <td>{row.outValue || BLANK}</td>
                      <td>{row.ending || BLANK}</td>
                      <td
                        className={
                          Number.isFinite(Number(row.deltaValue)) &&
                          Number(row.deltaValue) !== 0
                            ? Number(row.deltaValue) > 0
                              ? "delta-positive"
                              : "delta-negative"
                            : "delta-neutral"
                        }
                      >
                        {row.delta || BLANK}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="inventory-table-note">
              {data?.table?.note || "Đơn vị: nghìn đồng (000 VNĐ)"}
            </div>
          </div>

          <div className="inventory-side-stack">
            <div className="card">
              <div className="card-title">Cảnh báo tồn kho</div>

              <table className="bt inventory-alert-table">
                <thead>
                  <tr>
                    <th>Kho / Chỉ tiêu</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((item, idx) => {
                    const tone = alertToneClass(item.tone);
                    return (
                      <tr key={`${item.label}-${idx}`}>
                        <td>
                          <span className={`inventory-dot ${tone}`} />
                          {item.label}
                        </td>
                        <td>
                          <span className={`inventory-alert-pill ${tone}`}>
                            {item.status || BLANK}
                          </span>
                        </td>
                        <td className={`inventory-alert-note ${tone}`}>
                          {item.note || BLANK}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-title">Cơ cấu tồn kho cuối kỳ</div>

              <div className="inventory-donut-wrap">
                {compositionData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={compositionData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={1}
                        stroke="#f4f3ef"
                        strokeWidth={1}
                        isAnimationActive={false}
                      >
                        {compositionData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<InventoryPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>

              <div className="inventory-legend-grid">
                {compositionLegend.map((item) => (
                  <div className="inventory-legend-item" key={item.name}>
                    <span
                      className="inventory-legend-swatch"
                      style={{ background: item.color }}
                    />
                    <span>
                      {item.name} {BLANK}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="slbl">Biến động mua / bán theo kho</div>
        <div className="card inventory-bar-card">
          <div className="chart-legend">
            <div className="chart-legend-item">
              <span
                className="chart-legend-icon"
                style={{ background: PURCHASE_COLOR }}
              />
              <span>Giá trị mua hàng</span>
            </div>

            <div className="chart-legend-item">
              <span
                className="chart-legend-icon"
                style={{ background: SALES_COLOR }}
              />
              <span>Giá trị bán hàng</span>
            </div>
          </div>

          <div className="inventory-chart-wrap">
            {movementData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={movementData}
                  margin={{ top: 20, right: 18, left: 8, bottom: 6 }}
                  barGap={8}
                  barCategoryGap="24%"
                >
                  <CartesianGrid stroke="#f1efe8" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    height={44}
                    tick={<WrappedAxisTick fontSize={10} fill="#5f5e5a" width={84} />}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#888780" }}
                    tickFormatter={(value) => formatCompactShort(value)}
                    width={78}
                  />
                  <Tooltip content={<InventoryBarTooltip />} />
                  <Bar
                    dataKey="purchase"
                    name="Giá trị mua hàng"
                    fill={PURCHASE_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="purchase"
                      position="top"
                      formatter={(value) => formatCompactShort(value)}
                      style={{ fontSize: 10, fontWeight: 700, fill: PURCHASE_COLOR }}
                    />
                  </Bar>
                  <Bar
                    dataKey="sales"
                    name="Giá trị bán hàng"
                    fill={SALES_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="sales"
                      position="top"
                      formatter={(value) => formatCompactShort(value)}
                      style={{ fontSize: 10, fontWeight: 700, fill: SALES_COLOR }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}