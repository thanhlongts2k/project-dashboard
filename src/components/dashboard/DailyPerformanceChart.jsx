import DailyLineChart from "../DailyLineChart";
import ProgressChart from "../ProgressChart";

export default function DailyPerformanceChart({
  lineChartTitle,
  dailySeries = [],
  revenueChart = [],
  cashChart = [],
  loadingDaily = false,
}) {
  return (
    <>
      <div className="slbl">DT & TT theo khoảng ngày</div>
      <DailyLineChart
        title={loadingDaily ? "Đang tải dữ liệu ngày..." : lineChartTitle}
        data={dailySeries}
      />

      <div className="slbl">Tiến độ theo BU</div>
      <div className="chart-grid">
        <ProgressChart
          title="Doanh thu — KH vs thực hiện"
          data={revenueChart}
          theme="blue"
        />
        <ProgressChart
          title="Thu tiền — KH vs thực hiện"
          data={cashChart}
          theme="teal"
        />
      </div>
    </>
  );
}
