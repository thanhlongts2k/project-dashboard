import MetricCard from "../MetricCard";

export default function ReceivableKpiGrid({ topKpis = [], label = "Tổng quan" }) {
  return (
    <div style={{ width: "100%", marginBottom: 14 }}>
      <div className="slbl">{label}</div>
      <div
        className="kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          width: "100%",
        }}
      >
        {topKpis.map((item, idx) => (
          <MetricCard key={`${item.label}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
}
