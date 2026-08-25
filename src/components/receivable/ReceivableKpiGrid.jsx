import MetricCard from "../MetricCard";

export default function ReceivableKpiGrid({
  topKpis = [],
  label = "Tổng quan",
  onOpenCommitmentDetail,
}) {
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
        {topKpis.map((item, idx) => {
          const isCommitmentCard =
            item.label?.includes("Cam kết thu") || idx === 2;

          return (
            <MetricCard
              key={`${item.label}-${idx}`}
              item={item}
              onClick={isCommitmentCard && onOpenCommitmentDetail ? onOpenCommitmentDetail : undefined}
              extraAction={
                isCommitmentCard && onOpenCommitmentDetail ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCommitmentDetail();
                    }}
                    className="btn-kpi-detail-action"
                    style={{
                      fontSize: "12px",
                      padding: "4px 10px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      fontWeight: 600,
                      lineHeight: 1.2,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#dbeafe";
                      e.currentTarget.style.borderColor = "#93c5fd";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#eff6ff";
                      e.currentTarget.style.borderColor = "#bfdbfe";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    title="Xem chi tiết tiến độ cam kết theo khách hàng"
                  >
                    <span>📋</span>
                    <span>Chi tiết</span>
                  </button>
                ) : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}
