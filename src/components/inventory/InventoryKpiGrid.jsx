import MetricCard from "../MetricCard";

export default function InventoryKpiGrid({ overview = [] }) {
  return (
    <>
      <div className="slbl">Tổng quan tồn kho</div>
      <div className="kpi-grid kpi-grid-4 inventory-kpi-grid">
        {overview.map((item, idx) => (
          <MetricCard key={`${item.label}-${idx}`} item={item} />
        ))}
      </div>
    </>
  );
}
