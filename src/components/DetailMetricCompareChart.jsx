import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";
import {
  formatAxisCompact,
  formatCompactMoney,
  formatCompactShort,
} from "../utils/numberFormat";
import WrappedAxisTick from "./WrappedAxisTick";

const BAR_COLORS = {
  planRevenue: "#cfdcf0",
  actualRevenue: "#185FA5",
  planCash: "#cde6df",
  actualCash: "#1D9E75",
};

export default function DetailMetricCompareChart({
  title,
  data = [],
}) {
  return (
    <div className="card" style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
      <div className="card-title">{title}</div>

      <div className="chart-wrap" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={50}>
          <BarChart data={data} margin={{ top: 22, right: 10, left: -15, bottom: 14 }}>
            <CartesianGrid stroke="#f1efe8" vertical={false} />
            <XAxis
              dataKey="name"
              interval={0}
              height={46}
              tick={<WrappedAxisTick fontSize={11} fill="#5f5e5a" width={92} />}
            />
            <YAxis tickFormatter={(value) => formatAxisCompact(value)} tick={{ fontSize: 11, fill: "#7c7c78" }} />
            <Tooltip
              formatter={(value) => [formatCompactMoney(value), "Giá trị"]}
              cursor={{ fill: "rgba(0,0,0,0.02)" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value) => formatCompactShort(value)}
                style={{ fontSize: 11, fontWeight: 700, fill: "#5f5e5a" }}
              />
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BAR_COLORS[entry.tone] || "#185FA5"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}