export default function BuMobileCards({ rows = [] }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#94a3b8", padding: "24px 0", fontSize: 13 }}>
        Chưa có dữ liệu đơn vị
      </div>
    );
  }

  return (
    <div className="overview-mobile-cards-list">
      {rows.map((row, idx) => {
        const isTotal = row.isTotal;
        const rev = row.revenueProgress || {};
        const cash = row.cashProgress || {};
        const pace = row.timePace;
        const revPct = typeof rev.percent === "number" ? Math.min(Math.max(rev.percent, 0), 100) : 0;
        const cashPct = typeof cash.percent === "number" ? Math.min(Math.max(cash.percent, 0), 100) : 0;

        return (
          <div
            key={idx}
            className={`overview-mobile-card ${isTotal ? "overview-mobile-card-total" : ""}`}
          >
            {/* Header Thẻ: Tên BU/Phụ trách + Badge Nhịp độ */}
            <div className="overview-mobile-card-header">
              <div className="overview-mobile-card-info">
                <div className="overview-mobile-card-name">{row.bu}</div>
                {!isTotal && row.owner ? (
                  <div className="overview-mobile-card-owner">{row.owner}</div>
                ) : null}
              </div>

              {pace && pace.status !== "none" ? (
                <div className="overview-mobile-card-pace">
                  <span className={`pace-badge ${pace.tone}`}>
                    {pace.label}
                  </span>
                  {pace.deltaPaceText ? (
                    <span className="pace-subtext">{pace.deltaPaceText}</span>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Body Thẻ: 2 Cột Doanh Thu & Thu Tiền Cân Đối */}
            <div className="overview-mobile-card-body">
              {/* Cột 1: Doanh thu */}
              <div className="overview-mobile-metric-col">
                <div className="overview-mobile-metric-label">Doanh thu</div>
                <div className="overview-mobile-metric-val">
                  <span className="overview-mobile-actual">{rev.actualText || "0"}</span>
                  <span className="overview-mobile-plan">/ {rev.planText || "0"}</span>
                </div>
                <div className="overview-mobile-metric-progress">
                  <div className="micro-progress-bar">
                    <div
                      className={`micro-progress-fill ${rev.tone || "neutral"}`}
                      style={{ width: `${revPct}%` }}
                    />
                  </div>
                  <span className={`overview-mobile-pct ${rev.tone || "neutral"}`}>
                    {rev.percentText || "0%"}
                  </span>
                </div>
                <div className="overview-mobile-gap">({rev.gapText || "0"})</div>
              </div>

              {/* Cột 2: Thu tiền */}
              <div className="overview-mobile-metric-col">
                <div className="overview-mobile-metric-label">Thu tiền</div>
                <div className="overview-mobile-metric-val">
                  <span className="overview-mobile-actual">{cash.actualText || "0"}</span>
                  <span className="overview-mobile-plan">/ {cash.planText || "0"}</span>
                </div>
                <div className="overview-mobile-metric-progress">
                  <div className="micro-progress-bar">
                    <div
                      className={`micro-progress-fill ${cash.tone || "neutral"}`}
                      style={{ width: `${cashPct}%` }}
                    />
                  </div>
                  <span className={`overview-mobile-pct ${cash.tone || "neutral"}`}>
                    {cash.percentText || "0%"}
                  </span>
                </div>
                {cash.runRateText ? (
                  <div className="overview-mobile-runrate" title="Tốc độ thu bình quân ngày">
                    {cash.runRateText}
                  </div>
                ) : (
                  <div className="overview-mobile-gap">({cash.gapText || "0"})</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
