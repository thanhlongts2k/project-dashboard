import { formatPercent } from "../utils/numberFormat";
import {
  getPercentColor,
  getPercentValue,
  getTrendColor,
} from "../utils/dashboardColor";

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

export default function MetricCard({ item = {} }) {
  const reverseTone = !!item.reverseTone;

  const numericPercent = getPercentValue(item.percent);
  const hasPercent = numericPercent !== null;

  const percentColor = getPercentColor(numericPercent, reverseTone);
  const trendColor = getTrendColor(item.deltaText, reverseTone);

  const displayValue =
    item.valueText !== undefined && item.valueText !== null
      ? item.valueText
      : "—";

  const displayPercent =
    item.percentText !== undefined && item.percentText !== null
      ? item.percentText
      : hasPercent
      ? formatPercent(numericPercent)
      : "—";

  const progressWidth =
    hasPercent && Number.isFinite(numericPercent)
      ? `${Math.min(Math.max(numericPercent, 0), 100)}%`
      : "0%";

  return (
    <div
      className={`metric-card ${item.accent || ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        minHeight: 120,
      }}
    >
      <div>
        <div className="metric-label" style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
          {item.label || "—"}
        </div>

        <div className="metric-value" style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
          {displayValue}
          {item.unit ? <span className="metric-unit" style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}> {item.unit}</span> : null}
        </div>

        <div className="metric-target" style={{ fontSize: 11, color: "#64748b", marginTop: 3, fontWeight: 500 }}>
          {item.targetText || "—"}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="metric-progress-row" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="metric-percent" style={{ color: percentColor, fontSize: 12, fontWeight: 700, minWidth: 38 }}>
            {displayPercent}
          </span>

          <div className="progress-track" style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
            <div
              className="progress-fill"
              style={{
                width: progressWidth,
                height: "100%",
                borderRadius: 999,
                background: hasPercent ? percentColor : "#cbd5e1",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <div className="metric-delta" style={{ color: trendColor, fontSize: 10, marginTop: 4, fontWeight: 600 }}>
          {item.deltaText || "—"}
          {hasValue(item.note) ? ` ${item.note}` : ""}
        </div>
      </div>
    </div>
  );
}