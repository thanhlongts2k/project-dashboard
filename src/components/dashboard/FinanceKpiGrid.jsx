import MetricCard from "../MetricCard";
import Can from "../auth/Can";

export default function FinanceKpiGrid({ financeKpis = [] }) {
  if (!financeKpis || financeKpis.length === 0) return null;

  return (
    <Can perform="VIEW_SENSITIVE">
      <div className="slbl">Tài chính & Dòng tiền doanh nghiệp</div>
      <div className="kpi-grid kpi-grid-4">
        {financeKpis.map((item, idx) => (
          <MetricCard key={`fin-${idx}`} item={item} />
        ))}
      </div>
    </Can>
  );
}
