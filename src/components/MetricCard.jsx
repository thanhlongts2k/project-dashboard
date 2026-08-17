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
    <div className={`metric-card ${item.accent || ""}`}>
      <div className="metric-label">{item.label || "—"}</div>

      <div className="metric-value">
        {displayValue}
        {item.unit ? <span className="metric-unit"> {item.unit}</span> : null}
      </div>

      <div className="metric-target">{item.targetText || "—"}</div>

      <div className="metric-progress-row">
        <span className="metric-percent" style={{ color: percentColor }}>
          {displayPercent}
        </span>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: progressWidth,
              background: hasPercent ? percentColor : "#d8d6cd",
            }}
          />
        </div>
      </div>

      <div className="metric-delta" style={{ color: trendColor }}>
        {item.deltaText || "—"}
        {hasValue(item.note) ? ` ${item.note}` : ""}
      </div>
    </div>
  );
}