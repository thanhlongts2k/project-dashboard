import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  LabelList,
} from "recharts";

function formatCompact(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";

  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(0)} triệu`;
  }
  if (abs >= 1_000) {
    return `${(num / 1_000).toFixed(0)}`;
  }
  return `${num}`;
}

function formatAxisTick(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";

  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}T`;
  }
  if (abs >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(0)}Tr`;
  }
  if (abs >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return `${num}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const revenue = payload.find((item) => item.dataKey === "revenue")?.value;
  const collection = payload.find((item) => item.dataKey === "collection")?.value;

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
        Doanh thu ngày: {formatCompact(revenue)}
      </div>
      <div style={{ color: "#fca5a5" }}>
        Thu tiền ngày: {formatCompact(collection)}
      </div>
    </div>
  );
}

// Ngày Chủ nhật (getDay() === 0) bị loại khỏi chart
function isSunday(item) {
  const iso = String(item?.date || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).getDay() === 0;
  }
  return false;
}

const PLOT_PADDING_BOTTOM = 26;
const PLOT_PADDING_TOP = 14;

function makeLineLabel(fill, dataKey, chartData) {
  return function LineValueLabel({ x, y, value, index }) {
    const num = Number(value);
    if (!Number.isFinite(num) || num === 0) return null;

    const point = chartData?.[index] || {};
    const other =
      dataKey === "revenue"
        ? Number(point.collection) || 0
        : Number(point.revenue) || 0;

    const isHigher = dataKey === "revenue" ? num >= other : num > other;
    const dy = isHigher ? -9 : 15;

    return (
      <text
        x={x}
        y={y + dy}
        textAnchor="middle"
        fill={fill}
        fontSize={9}
        fontWeight={700}
        stroke="#fff"
        strokeWidth={3}
        paintOrder="stroke"
        style={{ strokeLinejoin: "round" }}
      >
        {formatAxisTick(num)}
      </text>
    );
  };
}

export default function DailyLineChart({ title, data = [] }) {
  const chartData = Array.isArray(data)
    ? data
        .filter((item) => !isSunday(item))
        .map((item) => {
          const rev = Number(item?.revenue ?? item?.daily_revenue ?? item?.dailyRevenue ?? 0) || 0;
          const col = Number(item?.collection ?? item?.daily_collection ?? item?.dailyCollection ?? item?.cash ?? 0) || 0;
          const rawDate = String(item?.date || "");
          const formattedDate =
            item?.formattedDate ||
            item?.label ||
            item?.dateLabel ||
            item?.name ||
            (rawDate.length >= 10 ? `${rawDate.slice(8, 10)}/${rawDate.slice(5, 7)}` : rawDate);

          return {
            date: rawDate,
            label: formattedDate,
            formattedDate,
            revenue: rev,
            collection: col,
          };
        })
    : [];

  return (
    <div className="card" style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
      <div className="card-title">{title}</div>

      <div
        className="chart-wrap chart-no-focus"
        onMouseDown={(e) => e.preventDefault()}
        style={{ minWidth: 0 }}
      >
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <LineChart data={chartData} margin={{ top: 18, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid stroke="#f0ede5" vertical={false} />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 11, fill: "#7f7b72" }}
              axisLine={{ stroke: "#bdb7aa" }}
              tickLine={{ stroke: "#bdb7aa" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatAxisTick}
              tick={{ fontSize: 11, fill: "#7f7b72" }}
              axisLine={{ stroke: "#bdb7aa" }}
              tickLine={{ stroke: "#bdb7aa" }}
              width={48}
              padding={{ top: PLOT_PADDING_TOP, bottom: PLOT_PADDING_BOTTOM }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => {
                if (value === "revenue") return "Doanh thu ngày";
                if (value === "collection") return "Thu tiền ngày";
                return value;
              }}
            />

            {/* Doanh thu */}
            <Line
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="#185fa5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="revenue"
                content={makeLineLabel("#185fa5", "revenue", chartData)}
              />
            </Line>

            {/* Thu tiền */}
            <Line
              type="monotone"
              dataKey="collection"
              name="collection"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="collection"
                content={makeLineLabel("#dc2626", "collection", chartData)}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}