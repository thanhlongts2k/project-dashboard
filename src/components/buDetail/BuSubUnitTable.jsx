import React from "react";
import ProgressChart from "../ProgressChart";
import DataTable from "../DataTable";
import "../../styles/modules/bento-metrics.css";

function formatCompactText(val) {
  if (!val || val === "—" || val === "0" || val === 0) return "0 đ";
  return String(val).replace("triệu", "Tr").replace("tỷ", "Tỷ");
}

function parseNumericValue(val) {
  if (typeof val === "number") return val;
  if (!val || val === "—") return 0;
  const clean = String(val).replace(/,/g, ".").replace(/[^\d.-]/g, "");
  const num = parseFloat(clean);
  if (!Number.isFinite(num)) return 0;
  if (String(val).includes("tỷ") || String(val).includes("Tỷ")) return num * 1e9;
  if (String(val).includes("triệu") || String(val).includes("Tr")) return num * 1e6;
  return num;
}

function renderTrendTag(vsStr) {
  if (!vsStr || vsStr === "—") return null;
  const str = String(vsStr).trim();
  const isDown = str.startsWith("-");
  const isUp = str.startsWith("+");
  const toneClass = isDown ? "trend-down" : isUp ? "trend-up" : "trend-neutral";
  const arrow = isDown ? "↓ " : isUp ? "↑ " : "";

  return (
    <span className={`bento-trend-tag ${toneClass}`}>
      {arrow}{str}
    </span>
  );
}

function isPlanZeroOrEmpty(plan) {
  if (plan === null || plan === undefined) return true;
  const str = String(plan).trim().toLowerCase();
  return str === "" || str === "0" || str === "0 đ" || str === "0đ" || str === "—";
}

export default function BuSubUnitTable({ safeDetail }) {
  if (!safeDetail) return null;

  if (safeDetail.layoutType === "subMang") {
    return (
      <>
        <div className="chart-grid">
          <ProgressChart
            title={safeDetail.revenueChart?.title || "Sub-mảng — DT"}
            data={safeDetail.revenueChart?.data || []}
            theme="blue"
          />
          <ProgressChart
            title={safeDetail.cashChart?.title || "Sub-mảng — TT"}
            data={safeDetail.cashChart?.data || []}
            theme="teal"
          />
        </div>

        <DataTable
          title={safeDetail.table?.title || "Bảng chi tiết"}
          columns={safeDetail.table?.columns || []}
          rows={safeDetail.table?.rows || []}
          variant="generic"
        />
      </>
    );
  }

  const rows = safeDetail.detailSummary?.rows || [];
  const dtRow = rows.find((r) => r.label === "Doanh thu" || r.label?.includes("Doanh thu")) || {};
  const ttRow = rows.find((r) => r.label === "Thu tiền" || r.label?.includes("Thu tiền")) || {};
  const dtDayRow = rows.find((r) => r.label === "DT ngày" || r.label?.includes("DT ngày")) || {};
  const ttDayRow = rows.find((r) => r.label === "TT ngày" || r.label?.includes("TT ngày")) || {};

  const chartData = safeDetail.compareChart?.data || [];
  const dtRawVal = chartData.find((d) => d.tone === "actualRevenue")?.value ?? parseNumericValue(dtRow.actual);
  const ttRawVal = chartData.find((d) => d.tone === "actualCash")?.value ?? parseNumericValue(ttRow.actual);

  const maxVal = Math.max(dtRawVal, ttRawVal, 1);
  const dtWidth = Math.min(100, Math.max(dtRawVal > 0 ? 6 : 0, Math.round((dtRawVal / maxVal) * 100)));
  const ttWidth = Math.min(100, Math.max(ttRawVal > 0 ? 6 : 0, Math.round((ttRawVal / maxVal) * 100)));

  const ratioVal = dtRawVal > 0 ? ((ttRawVal / dtRawVal) * 100).toFixed(1) : null;
  const isOverCollected = ratioVal && Number(ratioVal) >= 100;

  return (
    <div className="bento-metrics-grid">
      {/* CARD 1: DOANH THU KỲ */}
      <div className="bento-metric-card">
        <div>
          <div className="bento-card-header">
            <div className="bento-card-title-group">
              <span className="bento-card-icon icon-revenue">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="20" x2="12" y2="10" />
                  <line x1="18" y1="20" x2="18" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="16" />
                </svg>
              </span>
              <span className="bento-card-title">Doanh thu kỳ</span>
            </div>
          </div>

          <div className="bento-card-body">
            <span className="bento-metric-value">{formatCompactText(dtRow.actual)}</span>
            {renderTrendTag(dtRow.vs)}
          </div>
        </div>

        <div className="bento-card-footer">
          <div className="bento-plan-group">
            <span>Kế hoạch:</span>
            {isPlanZeroOrEmpty(dtRow.plan) ? (
              <span className="bento-badge-neutral">Chưa đặt KH</span>
            ) : (
              <span className="bento-sub-metric">{dtRow.plan}</span>
            )}
          </div>
          <div>
            <span>DT ngày: </span>
            <span className="bento-sub-metric">{formatCompactText(dtDayRow.actual)}</span>
          </div>
        </div>
      </div>

      {/* CARD 2: THU TIỀN KỲ */}
      <div className="bento-metric-card">
        <div>
          <div className="bento-card-header">
            <div className="bento-card-title-group">
              <span className="bento-card-icon icon-cash">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
              </span>
              <span className="bento-card-title">Thu tiền kỳ</span>
            </div>
          </div>

          <div className="bento-card-body">
            <span className="bento-metric-value">{formatCompactText(ttRow.actual)}</span>
            {renderTrendTag(ttRow.vs)}
          </div>
        </div>

        <div className="bento-card-footer">
          <div className="bento-plan-group">
            <span>Kế hoạch:</span>
            {isPlanZeroOrEmpty(ttRow.plan) ? (
              <span className="bento-badge-neutral">Chưa đặt KH</span>
            ) : (
              <span className="bento-sub-metric">{ttRow.plan}</span>
            )}
          </div>
          <div>
            <span>TT ngày: </span>
            <span className="bento-sub-metric bento-highlight-day">{formatCompactText(ttDayRow.actual)}</span>
          </div>
        </div>
      </div>

      {/* CARD 3: TỔNG HỢP & TIẾN ĐỘ */}
      <div className="bento-metric-card">
        <div>
          <div className="bento-card-header">
            <div className="bento-card-title-group">
              <span className="bento-card-icon icon-summary">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
              </span>
              <span className="bento-card-title">Tổng hợp & Tiến độ</span>
            </div>
            {ratioVal && (
              <span className={isOverCollected ? "bento-ratio-badge" : "bento-badge-neutral"}>
                {isOverCollected ? "✓ Thu hồi cao" : "Tiến độ"}
              </span>
            )}
          </div>

          <div className="bento-summary-bars">
            {/* DT Bar */}
            <div className="bento-bar-row">
              <div className="bento-bar-label-line">
                <span className="bento-bar-label">Doanh thu kỳ</span>
                <span className="bento-bar-val">{formatCompactText(dtRow.actual)}</span>
              </div>
              <div className="bento-bar-track">
                <div className="bento-bar-fill fill-dt" style={{ width: `${dtWidth}%` }} />
              </div>
            </div>

            {/* TT Bar */}
            <div className="bento-bar-row">
              <div className="bento-bar-label-line">
                <span className="bento-bar-label">Thu tiền kỳ</span>
                <span className="bento-bar-val">{formatCompactText(ttRow.actual)}</span>
              </div>
              <div className="bento-bar-track">
                <div className="bento-bar-fill fill-tt" style={{ width: `${ttWidth}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bento-card-footer">
          <span>Tỷ lệ Thu hồi / DT:</span>
          {ratioVal ? (
            <span className={`bento-sub-metric font-bold ${isOverCollected ? "text-emerald-700" : ""}`}>
              {ratioVal}% ({((ttRawVal / Math.max(dtRawVal, 1))).toFixed(1)}x DT)
            </span>
          ) : (
            <span className="bento-badge-neutral">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
