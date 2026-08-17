import MetricCard from "../MetricCard";

export default function BuDetailKpiGrid({ title, kpis = [] }) {
  return (
    <>
      <div className="slbl">KPI tháng — {title}</div>
      <div className="kpi-grid kpi-grid-4">
        {kpis.map((item, idx) => (
          <MetricCard key={`${item.label}-${idx}`} item={item} />
        ))}
      </div>
    </>
  );
}
