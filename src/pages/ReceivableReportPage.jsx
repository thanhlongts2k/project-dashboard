import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import MetricCard from "../components/MetricCard";
import UserMenu from "../components/UserMenu";
import WrappedAxisTick from "../components/WrappedAxisTick";
import {
  formatCompactMoney,
  formatCompactShort,
  formatPercent,
} from "../utils/numberFormat";
import { buildPdfFileName, exportElementToPdf } from "../utils/exportPdf";

const BLANK = "—";

function ComparisonCell({ value, tone = "neutral" }) {
  const color =
    tone === "positive"
      ? "#3B6D11"
      : tone === "negative"
      ? "#A32D2D"
      : "#5f5e5a";

  return <span style={{ color, fontSize: 10 }}>{value || BLANK}</span>;
}

function CollectionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d3d1c7",
        borderRadius: 10,
        boxShadow: "0 10px 24px rgba(15,23,42,.1)",
        padding: "8px 10px",
        fontSize: 11,
        color: "#2c2c2a",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey}>
          {entry.name}: {formatCompactMoney(entry.value)}
        </div>
      ))}
    </div>
  );
}

function ReceivableDonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d3d1c7",
        borderRadius: 10,
        boxShadow: "0 10px 24px rgba(15,23,42,.1)",
        padding: "8px 10px",
        fontSize: 11,
        color: "#2c2c2a",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
      <div>{item.valueText || BLANK}</div>
    </div>
  );
}

function EmptyDonutChart({ text = "Không có dữ liệu dư nợ" }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 168,
          height: 168,
          borderRadius: "50%",
          border: "18px solid #ebe8df",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 22px",
            fontSize: 11,
            lineHeight: 1.4,
            color: "#9a988f",
            fontWeight: 500,
            whiteSpace: "pre-line",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function getValueColor(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return "#b4b2a9";
  if (num > 0) return "#1D9E75";
  return "#D84C4C";
}

function getAlertToneStyles(tone = "warn") {
  if (tone === "danger") {
    return {
      dot: "#D84C4C",
      pillText: "#C43C2F",
      pillBg: "#F8E3E0",
      pillBorder: "#E8B8B1",
      note: "#A32D2D",
    };
  }

  if (tone === "success") {
    return {
      dot: "#6E9E1F",
      pillText: "#5E8617",
      pillBg: "#E8F1D8",
      pillBorder: "#CDDEAE",
      note: "#5E8617",
    };
  }

  return {
    dot: "#D28A16",
    pillText: "#A86B0A",
    pillBg: "#F7E9D2",
    pillBorder: "#E7C995",
    note: "#A86B0A",
  };
}

export default function ReceivableReportPage({
  data,
  currentUser,
  onLogout,
  onBack,
  selectedMonth,
  selectedYear,
  onChangePeriod,
  onRefreshReceivable,
  loadingReceivable,
  receivableSelectedDate,
  onChangeReceivableDate,
}) {
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
        buildPdfFileName("bao-cao-cong-no", todayStr)
      );
      toast.success("Đã tải báo cáo PDF.");
    } catch (error) {
      console.error("Export PDF error:", error);
      toast.error(error.message || "Không xuất được PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  // Build yesterday/today/tomorrow strings from selected date
  const baseDate = receivableSelectedDate ? new Date(receivableSelectedDate) : new Date();
  const todayStr = receivableSelectedDate || formatLocalDate(new Date());

  function formatLocalDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function buildQuickDate(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return formatLocalDate(d);
  }

  function formatDisplayDate(isoStr) {
    if (!isoStr) return "—";
    const [y, m, d] = isoStr.split("-");
    return `${d}/${m}/${y}`;
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const header = data?.header || {};
  const topKpis = Array.isArray(data?.topKpis) ? data.topKpis : [];
  const detailRows = Array.isArray(data?.detailRows) ? data.detailRows : [];
  const detailTotalRow = data?.detailTotalRow || null;
  const alertRows = Array.isArray(data?.alertRows) ? data.alertRows : [];
  const collectionChartData = Array.isArray(data?.collectionChartData)
    ? data.collectionChartData
    : [];
  const receivableRateRows = Array.isArray(data?.receivableRateRows)
    ? data.receivableRateRows
    : [];
  const receivableDonutData = Array.isArray(data?.receivableDonutData)
    ? data.receivableDonutData
    : [];
  const commitmentRows = Array.isArray(data?.commitmentRows)
    ? data.commitmentRows
    : [];
  const commitmentTotalRow = data?.commitmentTotalRow || null;

  const hasReceivableDonutData = receivableDonutData.some(
    (item) => Number(item?.value) > 0
  );

  return (
    <div className="page">
      <div className="dash" ref={dashRef}>
        <div className="hdr">
          <div className="hdr-left">
            <h1>{header.title || "Thu Nợ Khách Hàng Trọng Yếu"}</h1>
            <p>
              Ngày báo cáo: {header.todayLabel || BLANK} |{" "}
              {header.scopeLabel || "Bao gồm HISA"} |{" "}
              {header.buLabel || "Tất cả BU"}
            </p>
          </div>

          <div className="hdr-right">
            <UserMenu currentUser={currentUser} onLogout={onLogout} />
          </div>
        </div>

        {/* ===== COMPACT SMART TOOLBAR ===== */}
        <div className="smart-toolbar">
          <div className="smart-toolbar__left">
            {/* Date picker for receivable */}
            <div className="date-picker-wrap" ref={datePickerRef}>
              <button
                type="button"
                className={`date-picker-trigger ${isDatePickerOpen ? "is-open" : ""}`}
                onClick={() => setIsDatePickerOpen((v) => !v)}
                style={{ minWidth: 180 }}
              >
                <svg className="date-picker-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <span className="date-picker-range">
                  <span className="date-picker-preset-badge">Ngày</span>
                  <span>{formatDisplayDate(todayStr)}</span>
                </span>
                <svg className={`date-picker-caret ${isDatePickerOpen ? "rotated" : ""}`} viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {isDatePickerOpen && (
                <div className="date-picker-dropdown">
                  {/* Quick presets */}
                  <div className="date-picker-presets">
                    <div className="date-picker-presets-label">Nhanh</div>
                    {[
                      { label: "Hôm qua", offset: -1 },
                      { label: "Hôm nay", offset: 0 },
                      { label: "Ngày mai", offset: 1 },
                    ].map(({ label, offset }) => {
                      const dateVal = buildQuickDate(offset);
                      return (
                        <button
                          key={offset}
                          type="button"
                          className={`date-preset-item ${todayStr === dateVal ? "is-active" : ""}`}
                          onClick={() => {
                            onChangeReceivableDate?.(dateVal);
                            setIsDatePickerOpen(false);
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="date-picker-divider" />

                  {/* Custom date */}
                  <div className="date-picker-custom">
                    <div className="date-picker-custom-label">Chọn ngày</div>
                    <div className="date-picker-inputs">
                      <div className="date-picker-field">
                        <label>Ngày xem</label>
                        <input
                          type="date"
                          value={todayStr}
                          onChange={(e) => {
                            if (e.target.value) {
                              onChangeReceivableDate?.(e.target.value);
                              setIsDatePickerOpen(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="otb-right">
            <span className="otb-updated">
              Cập nhật: {header.updatedAt || BLANK}
            </span>

            <div className="otb-sep" />

            <button
              type="button"
              className="otb-icon-btn"
              onClick={onRefreshReceivable}
              disabled={loadingReceivable}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
                style={{ animation: loadingReceivable ? "spin 1s linear infinite" : "none" }}>
                <path d="M13.5 8a5.5 5.5 0 1 1-1.1-3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12.5 2v3.5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {loadingReceivable ? "Đang tải..." : "Làm mới"}
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

        <div className="slbl">
          Tổng quan ngày {header.todayLabel || BLANK}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {topKpis.map((item, idx) => (
            <MetricCard key={`${item.label}-${idx}`} item={item} />
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 2fr",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div className="card">
            <div className="card-title">
              Chi tiết thu theo BU — {header.todayLabel || BLANK}
            </div>

            <div className="table-wrap">
              <table className="bt">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>BU</th>
                    <th>Dư nợ cần thu</th>
                    <th>Nợ quá hạn</th>
                    <th>Đã thu (nợ quá hạn)</th>
                    <th>Thu trong hạn + COD</th>
                    <th>Tổng thu</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((row) => (
                    <tr key={row.bu}>
                      <td>{row.bu}</td>
                      <td style={{ color: "#185FA5" }}>{row.receivableTotal}</td>
                      <td>{row.commitmentOverdue}</td>
                      <td style={{ color: getValueColor(row.collectedDueValue) }}>
                        {row.collectedDue}
                      </td>
                      <td style={{ color: getValueColor(row.collectedInTermCodValue) }}>
                        {row.collectedInTermCod}
                      </td>
                      <td
                        style={{
                          color: getValueColor(row.totalCollectedValue),
                          fontWeight: 500,
                        }}
                      >
                        {row.totalCollected}
                      </td>
                    </tr>
                  ))}

                  {detailTotalRow ? (
                    <tr className="tot">
                      <td>{detailTotalRow.bu}</td>
                      <td style={{ color: "#185FA5" }}>
                        {detailTotalRow.receivableTotal}
                      </td>
                      <td>{detailTotalRow.commitmentOverdue}</td>
                      <td style={{ color: getValueColor(detailTotalRow.collectedDueValue) }}>
                        {detailTotalRow.collectedDue}
                      </td>
                      <td style={{ color: getValueColor(detailTotalRow.collectedInTermCodValue) }}>
                        {detailTotalRow.collectedInTermCod}
                      </td>
                      <td style={{ color: getValueColor(detailTotalRow.totalCollectedValue) }}>
                        {detailTotalRow.totalCollected}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 10, color: "#b4b2a9", marginTop: 6 }}>
              Đơn vị: nghìn đồng (000 VNĐ)
            </div>
          </div>

          <div className="card">
            <div className="card-title">Cảnh báo điều hành</div>

            <table className="bt">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>BU / Chỉ tiêu</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {alertRows.map((row, idx) => {
                  const toneStyles = getAlertToneStyles(row.tone);

                  return (
                    <tr key={`${row.label}-${idx}`}>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: toneStyles.dot,
                            marginRight: 8,
                            verticalAlign: "middle",
                          }}
                        />
                        {row.label}
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 52,
                            padding: "2px 10px",
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 600,
                            color: toneStyles.pillText,
                            background: toneStyles.pillBg,
                            border: `1px solid ${toneStyles.pillBorder}`,
                          }}
                        >
                          {row.status || BLANK}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            color: toneStyles.note,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {row.note || BLANK}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div className="card">
            <div className="card-title">
              Tổng thu theo BU — {header.todayLabel || BLANK}
            </div>

            <div className="chart-legend">
              <div className="chart-legend-item">
                <span
                  className="chart-legend-icon"
                  style={{ background: "#185FA5" }}
                />
                <span>Thu từ nợ đến hạn</span>
              </div>

              <div className="chart-legend-item">
                <span
                  className="chart-legend-icon"
                  style={{ background: "#1D9E75" }}
                />
                <span>Thu trong hạn + COD</span>
              </div>
            </div>

            <div style={{ position: "relative", width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={collectionChartData}
                  margin={{ top: 20, right: 4, left: -18, bottom: 6 }}
                  barGap={6}
                  barCategoryGap="18%"
                >
                  <CartesianGrid stroke="#f1efe8" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tickMargin={2}
                    height={44}
                    tick={<WrappedAxisTick fontSize={10} fill="#5f5e5a" width={84} />}
                  />
                  <YAxis
                    width={42}
                    tick={{ fontSize: 10, fill: "#888780" }}
                    tickFormatter={(value) => formatCompactShort(value)}
                  />
                  <Tooltip content={<CollectionTooltip />} />
                  <Bar
                    dataKey="collectedDue"
                    name="Thu từ nợ đến hạn"
                    fill="#185FA5"
                    radius={[4, 4, 0, 0]}
                    stackId="s"
                    maxBarSize={42}
                    isAnimationActive={false}
                  >
                    {/* Tầng trên (inTermCod) = 0 thì bar đó không render → hiện tổng ở đây */}
                    <LabelList
                      position="top"
                      valueAccessor={(entry) =>
                        Number(entry?.payload?.inTermCod) > 0
                          ? ""
                          : formatCompactShort(
                              Number(entry?.payload?.collectedDue) || 0
                            )
                      }
                      style={{ fontSize: 10, fontWeight: 700, fill: "#2c2c2a" }}
                    />
                  </Bar>
                  <Bar
                    dataKey="inTermCod"
                    name="Thu trong hạn + COD"
                    fill="#1D9E75"
                    radius={[4, 4, 0, 0]}
                    stackId="s"
                    maxBarSize={42}
                    isAnimationActive={false}
                  >
                    {/* Tổng cả stack hiển thị trên đầu cột */}
                    <LabelList
                      position="top"
                      valueAccessor={(entry) => {
                        const total =
                          (Number(entry?.payload?.collectedDue) || 0) +
                          (Number(entry?.payload?.inTermCod) || 0);
                        return total ? formatCompactShort(total) : "";
                      }}
                      style={{ fontSize: 10, fontWeight: 700, fill: "#2c2c2a" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              Dư nợ cần thu — {header.tomorrowLabel || BLANK}
            </div>

            <div style={{ marginBottom: 14 }}>
              {receivableRateRows.map((row) => (
                <div
                  key={row.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                    fontSize: 11,
                  }}
                >
                  <div
                    style={{
                      width: 110,
                      color: "#5f5e5a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: 10,
                    }}
                  >
                    {row.name}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      height: 5,
                      background: "#f1efe8",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(Math.max(row.percent || 0, 0), 100)}%`,
                        height: 5,
                        borderRadius: 3,
                        background: row.color,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      width: 38,
                      textAlign: "right",
                      fontSize: 10,
                      color: "#888780",
                    }}
                  >
                    {formatPercent(row.percent || 0)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ position: "relative", width: "100%", height: 200 }}>
              {hasReceivableDonutData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={receivableDonutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={56}
                      outerRadius={84}
                      paddingAngle={1}
                      stroke="#f4f3ef"
                      strokeWidth={1}
                      isAnimationActive={false}
                    >
                      {receivableDonutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ReceivableDonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyDonutChart
                  text={`Không có dư nợ\n${header.tomorrowLabel || BLANK}`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="slbl">
          Dư nợ & cam kết — {header.tomorrowLabel || BLANK}
        </div>

        <div className="card" style={{ marginBottom: 10 }}>
          <div className="table-wrap">
            <table className="bt">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>BU</th>
                  <th>Dư nợ cần thu ({header.tomorrowLabel || BLANK})</th>
                  <th>Cam kết thu (nợ quá hạn)</th>
                  <th>Tỷ lệ thu / cam kết</th>
                  <th>So với hôm qua</th>
                </tr>
              </thead>
              <tbody>
                {commitmentRows.map((row) => (
                  <tr key={row.bu}>
                    <td>{row.bu}</td>
                    <td style={{ color: "#185FA5" }}>{row.receivableTotal}</td>
                    <td>{row.commitmentOverdue}</td>
                    <td>
                      <span
                        className={`pill ${
                          row.commitmentRateRaw >= 70
                            ? "pg"
                            : row.commitmentRateRaw > 0
                            ? "pa"
                            : "pr"
                        }`}
                      >
                        {row.commitmentRate}
                      </span>
                    </td>
                    <td>
                      <ComparisonCell value={row.vsPrev} tone={row.vsPrevTone} />
                    </td>
                  </tr>
                ))}

                {commitmentTotalRow ? (
                  <tr className="tot">
                    <td>{commitmentTotalRow.bu}</td>
                    <td style={{ color: "#185FA5" }}>
                      {commitmentTotalRow.receivableTotal}
                    </td>
                    <td>{commitmentTotalRow.commitmentOverdue}</td>
                    <td>
                      <span
                        className={`pill ${
                          commitmentTotalRow.commitmentRateRaw >= 70
                            ? "pg"
                            : commitmentTotalRow.commitmentRateRaw > 0
                            ? "pa"
                            : "pr"
                        }`}
                      >
                        {commitmentTotalRow.commitmentRate}
                      </span>
                    </td>
                    <td>
                      <ComparisonCell
                        value={commitmentTotalRow.vsPrev}
                        tone={commitmentTotalRow.vsPrevTone}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 10, color: "#b4b2a9", marginTop: 6 }}>
            Đơn vị: nghìn đồng (000 VNĐ)
          </div>
        </div>
      </div>
    </div>
  );
}