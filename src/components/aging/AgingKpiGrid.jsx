import MetricCard from "../MetricCard";

export default function AgingKpiGrid({ kpiCards = [], buName = "Elevator" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="slbl">Tổng quan tuổi nợ — Khối {buName}</div>
      <div className="kpi-grid kpi-grid-4">
        {kpiCards.map((item, idx) => (
          <MetricCard key={`${item.label}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
}
