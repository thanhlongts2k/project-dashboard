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
import WrappedAxisTick from "../WrappedAxisTick";
import { formatCompactMoney, formatCompactShort } from "../../utils/numberFormat";

const BLANK = "—";
const PURCHASE_COLOR = "#3B82F6";
const SALES_COLOR = "#F97316";

function EmptyChart() {
  return (
    <div
      style={{
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: 12,
      }}
    >
      Chưa có dữ liệu biểu đồ
    </div>
  );
}

function InventoryPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="custom-tooltip" style={{ background: "#1f2937", color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: 11 }}>
        <div style={{ fontWeight: 600 }}>{data.name}</div>
        <div>Tỷ trọng: {data.value}%</div>
      </div>
    );
  }
  return null;
}

function InventoryBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ background: "#1f2937", color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: 11 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((item) => (
          <div key={item.name} style={{ color: item.color, fontSize: 11 }}>
            {item.name}: {formatCompactMoney(item.value)}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function InventoryCharts({
  compositionData = [],
  compositionLegend = [],
  movementData = [],
}) {
  return (
    <>
      {/* Composition Donut Card */}
      {compositionData.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Cơ cấu tồn kho cuối kỳ</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
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
      )}

      {/* Movement Bar Chart */}
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
    </>
  );
}
