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
        background: "#fff",
        border: "1px solid #d9d4c7",
        borderRadius: 8,
        padding: "10px 12px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ color: "#1D4ED8", marginBottom: 4 }}>
        Doanh thu ngày: {formatCompact(revenue)}
      </div>
      <div style={{ color: "#DC2626" }}>
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

// Khoảng đệm (px) chèn dưới/trên vùng vẽ để label không đè trục X / bị cắt nóc.
// Đồng bộ với YAxis padding bên dưới.
const PLOT_PADDING_BOTTOM = 26;
const PLOT_PADDING_TOP = 14;

// Label số liệu trên line — ẩn giá trị 0 để đỡ rối.
// Quy tắc đặt số để 2 line KHÔNG BAO GIỜ đè label lên nhau:
//  - Tại mỗi ngày, line có giá trị cao hơn → số đặt PHÍA TRÊN điểm,
//    line thấp hơn → số đặt PHÍA DƯỚI điểm (tách tối đa 2 nhãn).
//  - YAxis chừa đệm đáy (PLOT_PADDING_BOTTOM) nên điểm sát đáy vẫn đủ chỗ
//    để đặt số phía dưới mà không chạm hàng ngày tháng.
// Thêm viền trắng (halo) để số luôn đọc rõ khi cắt qua đường line.
function makeLineLabel(fill, dataKey, chartData) {
  return function LineValueLabel({ x, y, value, index }) {
    const num = Number(value);
    if (!Number.isFinite(num) || num === 0) return null;

    const point = chartData?.[index] || {};
    const other =
      dataKey === "revenue"
        ? Number(point.collection) || 0
        : Number(point.revenue) || 0;

    // Line này cao hơn? (bằng nhau: doanh thu ưu tiên nằm trên)
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
        .map((item) => ({
          label: item?.label || item?.dateLabel || item?.name || "",
          revenue: Number(item?.revenue) || 0,
          collection: Number(item?.collection) || 0,
        }))
    : [];

  return (
    <div className="card">
      <div className="card-title">{title}</div>

      <div
        className="chart-wrap chart-no-focus"
        onMouseDown={(e) => e.preventDefault()}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 18, right: 18, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#f0ede5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#7f7b72" }}
              axisLine={{ stroke: "#bdb7aa" }}
              tickLine={{ stroke: "#bdb7aa" }}
            />
            <YAxis
              tickFormatter={formatAxisTick}
              tick={{ fontSize: 11, fill: "#7f7b72" }}
              axisLine={{ stroke: "#bdb7aa" }}
              tickLine={{ stroke: "#bdb7aa" }}
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

            {/* Doanh thu: xanh dương */}
            <Line
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="#1D4ED8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="revenue"
                content={makeLineLabel("#1D4ED8", "revenue", chartData)}
              />
            </Line>

            {/* Thu tiền: đỏ/cam để tương phản mạnh */}
            <Line
              type="monotone"
              dataKey="collection"
              name="collection"
              stroke="#DC2626"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="collection"
                content={makeLineLabel("#DC2626", "collection", chartData)}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}