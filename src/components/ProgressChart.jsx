import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  LabelList,
} from "recharts";
import { formatCompactMoney, formatCompactShort } from "../utils/numberFormat";
import WrappedAxisTick from "./WrappedAxisTick";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const actual = payload.find((item) => item.dataKey === "actual")?.value;
  const gap = payload.find((item) => item.dataKey === "gap")?.value;
  const target = payload.find((item) => item.dataKey === "target")?.value;

  return (
    <div
      style={{
        background: "#1e293b",
        color: "#fff",
        border: "1px solid #334155",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.2)",
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#f8fafc" }}>{label}</div>

      <div style={{ color: "#93c5fd", marginBottom: 2 }}>
        Thực hiện: {formatCompactMoney(actual)}
      </div>

      <div style={{ color: "#fde68a", marginBottom: 2 }}>
        Chênh lệch: {formatCompactMoney(gap)}
      </div>

      <div style={{ color: "#cbd5e1" }}>
        Kế hoạch: {formatCompactMoney(target)}
      </div>
    </div>
  );
}

export default function ProgressChart({ title, data = [], theme = "blue" }) {
  const colorsMap = {
    blue: {
      actual: "#185FA5",
      gap: "#EAF3DE",
      target: "#185FA5",
    },
    teal: {
      actual: "#1D9E75",
      gap: "#E1F5EE",
      target: "#1D9E75",
    },
  };

  const colors = colorsMap[theme] || colorsMap.blue;

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    fill: colors.actual,
  };

  const hasGap = (payload) => Number(payload?.gap) > 0;

  const actualWhenNoGap = (entry) =>
    hasGap(entry?.payload) ? "" : formatCompactShort(entry?.payload?.actual);

  const actualOnGapTop = (entry) =>
    hasGap(entry?.payload) ? formatCompactShort(entry?.payload?.actual) : "";

  return (
    <div className="card">
      <div className="card-title">{title}</div>

      <div className="chart-legend">
        <div className="chart-legend-item">
          <span
            className="chart-legend-icon chart-legend-icon--dashed"
            style={{ borderColor: colors.target }}
          />
          <span>KH tháng</span>
        </div>

        <div className="chart-legend-item">
          <span
            className="chart-legend-icon"
            style={{ background: colors.actual }}
          />
          <span>Thực hiện</span>
        </div>

        <div className="chart-legend-item">
          <span
            className="chart-legend-icon"
            style={{ background: colors.gap, border: "1px solid #d3d1c7" }}
          />
          <span>Gap</span>
        </div>
      </div>

      <div
        className="chart-wrap chart-no-focus"
        onMouseDown={(e) => e.preventDefault()}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 22, right: 20, left: 0, bottom: 14 }}
          >
            <CartesianGrid stroke="#f1efe8" vertical={false} />
            <XAxis
              dataKey="name"
              interval={0}
              height={46}
              tick={<WrappedAxisTick fontSize={11} fill="#5f5e5a" width={92} />}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#888780" }}
              tickFormatter={(value) => formatCompactShort(value)}
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar
              dataKey="actual"
              stackId="a"
              fill={colors.actual}
              barSize={70}
              maxBarSize={70}
              isAnimationActive={false}
            >
              <LabelList
                valueAccessor={actualWhenNoGap}
                position="top"
                style={labelStyle}
              />
            </Bar>

            <Bar
              dataKey="gap"
              stackId="a"
              fill={colors.gap}
              barSize={70}
              maxBarSize={70}
              isAnimationActive={false}
            >
              <LabelList
                valueAccessor={actualOnGapTop}
                position="top"
                style={labelStyle}
              />
            </Bar>

            <Line
              dataKey="target"
              stroke={colors.target}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}