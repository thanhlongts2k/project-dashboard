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
import { formatCompactMoney, formatCompactShort, formatPercent } from "../../utils/numberFormat";

const BLANK = "—";

function CollectionTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const due = Number(payload[0]?.value) || 0;
    const inTerm = Number(payload[1]?.value) || 0;
    const total = due + inTerm;
    const fullName = payload[0]?.payload?.fullName || label;

    return (
      <div
        className="custom-tooltip"
        style={{
          background: "#1e293b",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          fontSize: 12,
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
          border: "1px solid #334155",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6, color: "#f8fafc", fontSize: 13 }}>
          🏢 {fullName}
        </div>
        <div style={{ color: "#93c5fd", marginBottom: 3, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>Thu từ nợ đến hạn:</span>
          <strong>{formatCompactMoney(due)}</strong>
        </div>
        <div style={{ color: "#6ee7b7", marginBottom: 6, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>Thu trong hạn + COD:</span>
          <strong>{formatCompactMoney(inTerm)}</strong>
        </div>
        <div
          style={{
            borderTop: "1px solid #475569",
            paddingTop: 6,
            fontWeight: 700,
            color: "#fef08a",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>Tổng thu:</span>
          <span>{formatCompactMoney(total)}</span>
        </div>
      </div>
    );
  }
  return null;
}

function ReceivableDonutTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div
        className="custom-tooltip"
        style={{
          background: "#1e293b",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 12,
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
          border: "1px solid #334155",
        }}
      >
        <div style={{ fontWeight: 700, color: "#f8fafc", marginBottom: 2 }}>{item.name}</div>
        <div style={{ color: "#93c5fd" }}>Dư nợ: <strong>{formatCompactMoney(item.value)}</strong></div>
      </div>
    );
  }
  return null;
}

export default function ReceivableCharts({
  todayLabel,
  tomorrowLabel,
  collectionChartData = [],
  receivableRateRows = [],
  receivableDonutData = [],
  hasReceivableDonutData = false,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
        gap: 16,
        marginBottom: 16,
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* 1. Collection Bar Chart (Left) */}
      <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 380, padding: "16px", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
        <div className="card-title" style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>
          Tổng thu theo BU — {todayLabel || BLANK}
        </div>

        <div className="chart-legend" style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 12, fontSize: 12 }}>
          <div className="chart-legend-item" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              className="chart-legend-icon"
              style={{ width: 10, height: 10, borderRadius: 2, background: "#185FA5", display: "inline-block" }}
            />
            <span style={{ color: "#475569" }}>Thu từ nợ đến hạn</span>
          </div>

          <div className="chart-legend-item" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              className="chart-legend-icon"
              style={{ width: 10, height: 10, borderRadius: 2, background: "#1D9E75", display: "inline-block" }}
            />
            <span style={{ color: "#475569" }}>Thu trong hạn + COD</span>
          </div>
        </div>

        <div style={{ position: "relative", width: "100%", minWidth: 0, height: 320, flex: 1, overflow: "hidden" }}>
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <BarChart
              data={collectionChartData}
              margin={{ top: 20, right: 8, left: -12, bottom: 20 }}
              barGap={4}
              barCategoryGap="16%"
            >
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                interval={0}
                tickMargin={6}
                height={35}
                tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
              />
              <YAxis
                width={46}
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(value) => formatCompactShort(value)}
              />
              <Tooltip content={<CollectionTooltip />} />
              <Bar
                dataKey="collectedDue"
                name="Thu từ nợ đến hạn"
                fill="#185FA5"
                radius={[4, 4, 0, 0]}
                stackId="s"
                maxBarSize={38}
                isAnimationActive={false}
              >
                <LabelList
                  position="top"
                  valueAccessor={(entry) =>
                    Number(entry?.payload?.inTermCod) > 0
                      ? ""
                      : formatCompactShort(
                          Number(entry?.payload?.collectedDue) || 0
                        )
                  }
                  style={{ fontSize: 10, fontWeight: 700, fill: "#1e293b" }}
                />
              </Bar>
              <Bar
                dataKey="inTermCod"
                name="Thu trong hạn + COD"
                fill="#1D9E75"
                radius={[4, 4, 0, 0]}
                stackId="s"
                maxBarSize={38}
                isAnimationActive={false}
              >
                <LabelList
                  position="top"
                  valueAccessor={(entry) => {
                    const total =
                      (Number(entry?.payload?.collectedDue) || 0) +
                      (Number(entry?.payload?.inTermCod) || 0);
                    return total ? formatCompactShort(total) : "";
                  }}
                  style={{ fontSize: 10, fontWeight: 700, fill: "#1e293b" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Receivable Breakdown Donut & Progress (Right) */}
      <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 380, padding: "16px", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
        <div className="card-title" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>
          Dư nợ cần thu — {tomorrowLabel || BLANK}
        </div>

        <div style={{ marginBottom: 16, flex: 1 }}>
          {receivableRateRows.map((row) => (
            <div
              key={row.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 7,
                fontSize: 11,
              }}
            >
              <div
                style={{
                  width: 130,
                  color: "#334155",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: 11,
                  fontWeight: 500,
                }}
                title={row.name}
              >
                {row.name}
              </div>

              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: "#f1f5f9",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(Math.max(row.percent || 0, 0), 100)}%`,
                    height: 6,
                    borderRadius: 3,
                    background: row.color,
                  }}
                />
              </div>

              <div
                style={{
                  width: 44,
                  textAlign: "right",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#475569",
                }}
              >
                {formatPercent(row.percent || 0)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", width: "100%", height: 160, minWidth: 0, overflow: "hidden" }}>
          {hasReceivableDonutData ? (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie
                  data={receivableDonutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={1}
                  stroke="#ffffff"
                  strokeWidth={2}
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
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Không có dữ liệu dư nợ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
