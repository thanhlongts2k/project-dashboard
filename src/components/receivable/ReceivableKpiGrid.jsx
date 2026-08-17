import MetricCard from "../MetricCard";

export default function ReceivableKpiGrid({ topKpis = [], label = "Tổng quan" }) {
  return (
    <>
      <div className="slbl">{label}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {topKpis.map((item, idx) => (
          <MetricCard key={`${item.label}-${idx}`} item={item} />
        ))}
      </div>
    </>
  );
}
