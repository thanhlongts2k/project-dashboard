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
import WrappedAxisTick from "../WrappedAxisTick";
import { formatCompactMoney, formatCompactShort, formatPercent } from "../../utils/numberFormat";

const BLANK = "—";

function CollectionTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const due = Number(payload[0]?.value) || 0;
    const inTerm = Number(payload[1]?.value) || 0;
    const total = due + inTerm;

    return (
      <div className="custom-tooltip" style={{ background: "#1f2937", color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: 11 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#93c5fd" }}>Thu từ nợ đến hạn: {formatCompactMoney(due)}</div>
        <div style={{ color: "#6ee7b7" }}>Thu trong hạn + COD: {formatCompactMoney(inTerm)}</div>
        <div style={{ borderTop: "1px solid #374151", marginTop: 4, paddingTop: 4, fontWeight: 600 }}>
          Tổng thu: {formatCompactMoney(total)}
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
      <div className="custom-tooltip" style={{ background: "#1f2937", color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: 11 }}>
        <div style={{ fontWeight: 600 }}>{item.name}</div>
        <div>Dư nợ: {formatCompactMoney(item.value)}</div>
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
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        marginBottom: 10,
      }}
    >
      {/* Collection Bar Chart */}
      <div className="card">
        <div className="card-title">
          Tổng thu theo BU — {todayLabel || BLANK}
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

      {/* Receivable Breakdown Donut & Progress */}
      <div className="card">
        <div className="card-title">
          Dư nợ cần thu — {tomorrowLabel || BLANK}
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
