function ComparisonCell({ value, tone }) {
  if (!value || value === "—") {
    return <span style={{ color: "#888780" }}>—</span>;
  }

  let color = "#888780";
  if (tone === "good") color = "#1D9E75";
  else if (tone === "bad") color = "#E24B4A";

  return (
    <span style={{ color, fontWeight: 500 }}>
      {value}
    </span>
  );
}

export default function ReceivableCommitmentTable({
  todayLabel,
  tomorrowLabel,
  commitmentRows = [],
  commitmentTotalRow = null,
}) {
  return (
    <div className="card" style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
      <div className="card-title">
        Cam kết thu nợ: {todayLabel} vs {tomorrowLabel}
      </div>

      <div className="table-wrap" style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table className="bt" style={{ minWidth: "650px", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>BU</th>
              <th>Cam kết ({todayLabel})</th>
              <th>Đã thu</th>
              <th>% Đạt</th>
              <th>Cam kết ({tomorrowLabel})</th>
              <th>So với hôm nay</th>
            </tr>
          </thead>
          <tbody>
            {commitmentRows.map((row) => (
              <tr key={row.bu}>
                <td>{row.bu}</td>
                <td>{row.commitToday}</td>
                <td style={{ color: "#1D9E75", fontWeight: 500 }}>
                  {row.collectedToday}
                </td>
                <td>
                  <span
                    style={{
                      color:
                        row.rateTone === "good"
                          ? "#1D9E75"
                          : row.rateTone === "bad"
                          ? "#E24B4A"
                          : "#888780",
                      fontWeight: 600,
                    }}
                  >
                    {row.rate}
                  </span>
                </td>
                <td>{row.commitTomorrow}</td>
                <td>
                  <ComparisonCell value={row.vsPrev} tone={row.vsPrevTone} />
                </td>
              </tr>
            ))}

            {commitmentTotalRow ? (
              <tr className="tot">
                <td>{commitmentTotalRow.bu}</td>
                <td>{commitmentTotalRow.commitToday}</td>
                <td style={{ color: "#1D9E75", fontWeight: 600 }}>
                  {commitmentTotalRow.collectedToday}
                </td>
                <td>
                  <span
                    style={{
                      color:
                        commitmentTotalRow.rateTone === "good"
                          ? "#1D9E75"
                          : commitmentTotalRow.rateTone === "bad"
                          ? "#E24B4A"
                          : "#888780",
                      fontWeight: 700,
                    }}
                  >
                    {commitmentTotalRow.rate}
                  </span>
                </td>
                <td>{commitmentTotalRow.commitTomorrow}</td>
                <td>
                  <ComparisonCell
                    value={commitmentTotalRow.vsPrev}
                    tone={commitmentTotalRow.vsPrevTone}
                  />
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
  );
}
