import DailyLineChart from "../DailyLineChart";

export default function BuDailyChart({ title, dailySeries = [] }) {
  return (
    <>
      <div className="slbl">DT & TT theo ngày trong kỳ</div>
      <DailyLineChart
        title={title || "Doanh thu & Thu tiền theo ngày"}
        data={dailySeries}
      />
    </>
  );
}
