import { useState } from "react";
import DataTable from "../DataTable";
import BuMobileCards from "./BuMobileCards";

export default function BuPerformanceTable({
  monthLabel,
  summaryColumns = [],
  summaryRows = [],
  alertColumns = [],
  alertRows = [],
}) {
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "alert"

  return (
    <div className="overview-section-container">
      {/* Segmented Switcher cho Mobile (< 768px) */}
      <div className="overview-mobile-segmented-tabs">
        <button
          type="button"
          className={`overview-segmented-btn ${activeTab === "summary" ? "active" : ""}`}
          onClick={() => setActiveTab("summary")}
        >
          <span className="overview-segmented-label">📊 Tổng Hợp BU</span>
          <span className="overview-segmented-count">{summaryRows.length}</span>
        </button>
        <button
          type="button"
          className={`overview-segmented-btn ${activeTab === "alert" ? "active" : ""}`}
          onClick={() => setActiveTab("alert")}
        >
          <span className="overview-segmented-label">🚨 Cảnh Báo</span>
          <span className="overview-segmented-count alert">{alertRows.length}</span>
        </button>
      </div>

      <div className="overview-table-grid">
        {/* Card 1: Bảng Tổng Hợp BU */}
        <div
          className={`overview-grid-col overview-summary-col ${
            activeTab === "summary" ? "mobile-show" : "mobile-hide"
          }`}
        >
          {/* Desktop Table View (>= 768px) */}
          <div className="overview-desktop-table-view">
            <DataTable
              title={`Bảng tổng hợp tất cả BU — ${monthLabel || ""}`}
              columns={summaryColumns}
              rows={summaryRows}
              variant="summary"
            />
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="overview-mobile-cards-view">
            <div className="overview-card">
              <div className="overview-card-header">
                <span className="overview-card-title">
                  Bảng tổng hợp BU — {monthLabel || ""}
                </span>
                <span className="overview-card-badge">{summaryRows.length} đơn vị</span>
              </div>
              <div className="overview-card-body-mobile">
                <BuMobileCards rows={summaryRows} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Cảnh Báo Điều Hành */}
        <div
          className={`overview-grid-col overview-alert-col ${
            activeTab === "alert" ? "mobile-show" : "mobile-hide"
          }`}
        >
          <DataTable
            title="Cảnh báo điều hành"
            columns={alertColumns}
            rows={alertRows}
            variant="alert"
          />
        </div>
      </div>
    </div>
  );
}
