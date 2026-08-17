const BLANK = "—";

function alertToneClass(tone) {
  if (tone === "danger") return "danger";
  if (tone === "warn") return "warn";
  if (tone === "good") return "good";
  return "neutral";
}

export default function InventoryTable({
  tableRows = [],
  alerts = [],
  note = "Đơn vị: nghìn đồng (000 VNĐ)",
}) {
  return (
    <div className="inventory-table-grid">
      <div className="card">
        <div className="card-title">Báo cáo tổng hợp nhập - xuất - tồn</div>

        <div className="table-wrap">
          <table className="bt inventory-table">
            <thead>
              <tr>
                <th className="inventory-col-center">STT</th>
                <th>Kho hàng</th>
                <th>Đầu kỳ</th>
                <th>Mua hàng</th>
                <th>Bán hàng</th>
                <th>Cuối kỳ</th>
                <th>+/−</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr
                  key={`${row.warehouse || row.name || "row"}-${idx}`}
                  className={row.isTotal ? "row-total" : ""}
                >
                  <td className="inventory-col-center inventory-stt">
                    {row.stt ?? idx + 1}
                  </td>
                  <td>{row.warehouse || row.name || BLANK}</td>
                  <td>{row.opening || BLANK}</td>
                  <td>{row.inValue || BLANK}</td>
                  <td>{row.outValue || BLANK}</td>
                  <td>{row.ending || BLANK}</td>
                  <td
                    className={
                      Number.isFinite(Number(row.deltaValue)) &&
                      Number(row.deltaValue) !== 0
                        ? Number(row.deltaValue) > 0
                          ? "delta-positive"
                          : "delta-negative"
                        : "delta-neutral"
                    }
                  >
                    {row.delta || BLANK}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="inventory-table-note">{note}</div>
      </div>

      <div className="inventory-side-stack">
        <div className="card">
          <div className="card-title">Cảnh báo tồn kho</div>

          <table className="bt inventory-alert-table">
            <thead>
              <tr>
                <th>Kho / Chỉ tiêu</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((item, idx) => {
                const tone = alertToneClass(item.tone);
                return (
                  <tr key={`${item.label}-${idx}`}>
                    <td>
                      <span className={`inventory-dot ${tone}`} />
                      {item.label}
                    </td>
                    <td>
                      <span className={`inventory-alert-pill ${tone}`}>
                        {item.status || BLANK}
                      </span>
                    </td>
                    <td className={`inventory-alert-note ${tone}`}>
                      {item.note || BLANK}
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
