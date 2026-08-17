import MetricCard from "../MetricCard";

export default function FinanceKpiGrid({ financeKpis = [] }) {
  if (!financeKpis || financeKpis.length === 0) return null;

  return (
    <>
      <div className="slbl">Tài chính</div>
      <div className="kpi-grid kpi-grid-4">
        {financeKpis.map((item, idx) => (
          <MetricCard key={`fin-${idx}`} item={item} />
        ))}
      </div>
    </>
  );
}
