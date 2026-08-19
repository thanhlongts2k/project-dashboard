const BLANK = "—";

function getValueColor(val) {
  if (!Number.isFinite(val) || val === 0) return "#888780";
  return "#1D9E75";
}

function getAlertToneStyles(tone) {
  if (tone === "danger") {
    return {
      dot: "#e24b4a",
      pillBg: "#fce8e8",
      pillBorder: "#f7c1c1",
      pillText: "#a32d2d",
      note: "#a32d2d",
    };
  }
  if (tone === "good") {
    return {
      dot: "#639922",
      pillBg: "#eaf3de",
      pillBorder: "#dce9ca",
      pillText: "#3b6d11",
      note: "#3b6d11",
    };
  }
  return {
    dot: "#ba7517",
    pillBg: "#faedd8",
    pillBorder: "#f5d7a6",
    pillText: "#854f0b",
    note: "#854f0b",
  };
}

export default function ReceivableDetailTable({
  todayLabel,
  detailRows = [],
  detailTotalRow = null,
  alertRows = [],
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
        gap: 14,
        marginBottom: 14,
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* BU Detail Collection Table */}
      <div className="card" style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
        <div className="card-title">
          Chi tiết thu theo BU — {todayLabel || BLANK}
        </div>

        <div className="table-wrap" style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="bt" style={{ minWidth: "650px", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>BU</th>
                <th>Dư nợ cần thu</th>
                <th>Nợ quá hạn</th>
                <th>Đã thu (nợ quá hạn)</th>
                <th>Thu trong hạn + COD</th>
                <th>Tổng thu</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row) => (
                <tr key={row.bu}>
                  <td>{row.bu}</td>
                  <td style={{ color: "#185FA5" }}>{row.receivableTotal}</td>
                  <td>{row.commitmentOverdue}</td>
                  <td style={{ color: getValueColor(row.collectedDueValue) }}>
                    {row.collectedDue}
                  </td>
                  <td style={{ color: getValueColor(row.collectedInTermCodValue) }}>
                    {row.collectedInTermCod}
                  </td>
                  <td
                    style={{
                      color: getValueColor(row.totalCollectedValue),
                      fontWeight: 500,
                    }}
                  >
                    {row.totalCollected}
                  </td>
                </tr>
              ))}

              {detailTotalRow ? (
                <tr className="tot">
                  <td>{detailTotalRow.bu}</td>
                  <td style={{ color: "#185FA5" }}>
                    {detailTotalRow.receivableTotal}
                  </td>
                  <td>{detailTotalRow.commitmentOverdue}</td>
                  <td style={{ color: getValueColor(detailTotalRow.collectedDueValue) }}>
                    {detailTotalRow.collectedDue}
                  </td>
                  <td style={{ color: getValueColor(detailTotalRow.collectedInTermCodValue) }}>
                    {detailTotalRow.collectedInTermCod}
                  </td>
                  <td style={{ color: getValueColor(detailTotalRow.totalCollectedValue) }}>
                    {detailTotalRow.totalCollected}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 10, color: "#b4b2a9", marginTop: 6 }}>
          Đơn vị: nghìn đồng (000 VNĐ)
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card" style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
        <div className="card-title">Cảnh báo điều hành</div>

        <div className="table-wrap" style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="bt" style={{ minWidth: "320px", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>BU / Chỉ tiêu</th>
              <th>Trạng thái</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {alertRows.map((row, idx) => {
              const toneStyles = getAlertToneStyles(row.tone);

              return (
                <tr key={`${row.label}-${idx}`}>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: toneStyles.dot,
                        marginRight: 8,
                        verticalAlign: "middle",
                      }}
                    />
                    {row.label}
                  </td>

                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 52,
                        padding: "2px 10px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 600,
                        color: toneStyles.pillText,
                        background: toneStyles.pillBg,
                        border: `1px solid ${toneStyles.pillBorder}`,
                      }}
                    >
                      {row.status || BLANK}
                    </span>
                  </td>

                  <td>
                    <span
                      style={{
                        color: toneStyles.note,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {row.note || BLANK}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
