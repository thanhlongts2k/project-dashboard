import MetricCard from "../MetricCard";

export default function ReceivableKpiGrid({ topKpis = [], label = "Tổng quan" }) {
  return (
    <>
      <div className="slbl">{label}</div>
      <div className="kpi-grid kpi-grid-5" style={{ marginBottom: 14 }}>
        {topKpis.map((item, idx) => (
          <MetricCard key={`${item.label}-${idx}`} item={item} />
        ))}
      </div>
    </>
  );
}
