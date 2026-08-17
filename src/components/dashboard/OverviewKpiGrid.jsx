import MetricCard from "../MetricCard";

export default function OverviewKpiGrid({ topKpis = [], overseaKpis = [] }) {
  return (
    <>
      <div className="slbl">Tổng quan</div>
      <div className="kpi-grid kpi-grid-4">
        {topKpis.map((item, idx) => (
          <MetricCard key={`${item.label}-${idx}`} item={item} />
        ))}
      </div>

      {overseaKpis.length > 0 && (
        <>
          <div className="slbl">Doanh thu Oversea</div>
          <div className="kpi-grid kpi-grid-4">
            {overseaKpis.map((item, idx) => (
              <MetricCard key={`oversea-${idx}`} item={item} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
