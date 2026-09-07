import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fetchSalesPerformanceByEmployee } from "../../api/dashboardApi";

/**
 * Ánh xạ từ buKey (route id: 'elevator', 'ibiz-premium', 'ibizPremium', 'ibiz-value', ...) sang bu_code DB
 */
export function getBuCodeFromKey(key = "") {
  if (!key) return null;
  const raw = String(key).trim();
  const k = raw.toLowerCase().replace(/[-_]/g, "").replace(/\s+/g, "");
  const map = {
    elevator: "BU_ELEVATOR",
    buelevator: "BU_ELEVATOR",
    ibizpremium: "BU_IBIZ PREMIUM",
    buibizpremium: "BU_IBIZ PREMIUM",
    ibizvalue: "BU_IBIZ VALUE",
    buibizvalue: "BU_IBIZ VALUE",
    eco: "BU_ECO",
    bueco: "BU_ECO",
    agritech: "BU_ECO",
    buagritech: "BU_ECO",
    sab: "BU_ECO",
    busab: "BU_ECO",
    manufacturing: "BU_MANUFACTURING",
    bumanufacturing: "BU_MANUFACTURING",
    dtct: "BU_DTCT",
    budtct: "BU_DTCT",
    oversea: "OVERSEA",
  };
  if (map[k]) return map[k];
  if (raw.toUpperCase().startsWith("BU_")) return raw.toUpperCase();
  return `BU_${raw.toUpperCase()}`;
}

/**
 * Định dạng tiền tệ VND: 1.234.567.890 đ
 */
function formatVnd(val) {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (!Number.isFinite(num)) return "—";
  if (num === 0) return "0";
  return new Intl.NumberFormat("vi-VN").format(Math.round(num));
}

/**
 * Định dạng ngày: DD/MM/YYYY
 */
function formatDisplayDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || "—";
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDayMonth(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || "—";
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}`;
}

/**
 * Tính chênh lệch Thực tế - Kế hoạch
 */
function formatGap(actual, target) {
  if (target === null || target === undefined || Number(target) <= 0) return null;
  const diff = Number(actual || 0) - Number(target || 0);
  const formatted = new Intl.NumberFormat("vi-VN").format(Math.abs(Math.round(diff)));
  if (diff === 0) return "Đạt chuẩn";
  return diff > 0 ? `+${formatted} đ` : `-${formatted} đ`;
}

function getGapTone(actual, target) {
  if (target === null || target === undefined || Number(target) <= 0) return "neutral";
  const diff = Number(actual || 0) - Number(target || 0);
  return diff >= 0 ? "positive" : "negative";
}

/**
 * Màu sắc & tone cho Badge %
 */
function getRateTone(rate, target) {
  if (target === null || target === undefined || Number(target) <= 0) {
    return "neutral";
  }
  const r = Number(rate);
  if (!Number.isFinite(r) || r <= 0) return "danger";
  if (r >= 100) return "good";
  if (r >= 70) return "warn";
  return "danger";
}

/**
 * Tính độ rộng thanh Progress Bar (tối đa 100%)
 */
function getProgressWidth(rate, target) {
  if (target === null || target === undefined || Number(target) <= 0) return 0;
  const r = Number(rate) || 0;
  if (r <= 0) return 0;
  return Math.min(Math.round(r), 100);
}

export default function SalesPerformanceTable({
  buKey,
  reportDate,
  period,
  detailFilter,
  title,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // 1. Quản lý trạng thái Card Accordion kèm localStorage persistence
  const storageKey = `sales_perf_card_expanded_${buKey || "default"}`;
  const [isCardExpanded, setIsCardExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem(`sales_perf_card_expanded_${buKey || "default"}`);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return true; // Mặc định mở rộng khi tải trang
  });

  const toggleCardExpanded = () => {
    setIsCardExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // 2. Trạng thái mở rộng các hàng con Miền / Khu vực
  const [expandedRegionIds, setExpandedRegionIds] = useState(new Set());

  // 3. Bộ lọc nhanh (Quick Filter Pills): 'all' | 'north' | 'south' | 'warning'
  const [activeFilter, setActiveFilter] = useState("all");

  // Xác định bu_code
  const buCode = useMemo(() => getBuCodeFromKey(buKey), [buKey]);

  // Xác định date & period linh hoạt
  const queryDate = useMemo(() => {
    if (detailFilter?.endDate) return detailFilter.endDate;
    if (reportDate && /^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return reportDate;
    return null;
  }, [detailFilter?.endDate, reportDate]);

  const queryPeriod = useMemo(() => {
    if (detailFilter?.endDate) return detailFilter.endDate.substring(0, 7);
    if (queryDate) return queryDate.substring(0, 7);
    if (period) return period;
    return null;
  }, [detailFilter?.endDate, queryDate, period]);

  // Tải dữ liệu từ API
  const loadData = useCallback(async () => {
    if (!buCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSalesPerformanceByEmployee({
        date: queryDate,
        period: queryPeriod,
        bu_code: buCode,
      });
      if (res && res.success) {
        setData(res);
      } else {
        setError(res?.detail || "Không lấy được dữ liệu báo cáo Sales.");
      }
    } catch (err) {
      console.error("[SalesPerformanceTable] Lỗi fetch:", err);
      setError(err.message || "Lỗi kết nối tới hệ thống báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [buCode, queryDate, queryPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Thống kê danh sách Region IDs
  const allRegionIds = useMemo(() => {
    if (!data?.tree) return [];
    const ids = [];
    data.tree.forEach((buNode) => {
      (buNode.children || []).forEach((regNode) => {
        if (regNode.id) ids.push(regNode.id);
      });
    });
    return ids;
  }, [data]);

  const isAllRegionsExpanded = useMemo(() => {
    if (allRegionIds.length === 0) return false;
    return allRegionIds.every((id) => expandedRegionIds.has(id));
  }, [allRegionIds, expandedRegionIds]);

  const toggleRegion = (regionId) => {
    setExpandedRegionIds((prev) => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      return next;
    });
  };

  const handleExpandAllRegions = () => {
    setExpandedRegionIds(new Set(allRegionIds));
  };

  const handleCollapseAllRegions = () => {
    setExpandedRegionIds(new Set());
  };

  // Tính số lượng Sales cho từng filter pill
  const filterCounts = useMemo(() => {
    if (!data?.tree) return { all: 0, north: 0, south: 0, warning: 0 };
    let all = 0;
    let north = 0;
    let south = 0;
    let warning = 0;

    data.tree.forEach((bu) => {
      (bu.children || []).forEach((reg) => {
        const isNorth = (reg.region_name || reg.name || "").includes("Bắc");
        const isSouth = (reg.region_name || reg.name || "").includes("Nam");
        (reg.children || []).forEach((emp) => {
          all += 1;
          if (isNorth) north += 1;
          if (isSouth) south += 1;
          const m = emp.metrics;
          if (m?.month_target > 0 && Number(m?.month_rate || 0) < 70) {
            warning += 1;
          }
        });
      });
    });

    return { all, north, south, warning };
  }, [data]);

  // Khi chọn filter warning, tự động bung mở các Miền để quản lý quan sát
  useEffect(() => {
    if (activeFilter === "warning" && allRegionIds.length > 0) {
      setExpandedRegionIds(new Set(allRegionIds));
    }
  }, [activeFilter, allRegionIds]);

  // Render Badge % Tỷ lệ hoàn thành
  const renderRateBadge = (rate, target) => {
    const tone = getRateTone(rate, target);
    const hasTarget = target !== null && target !== undefined && Number(target) > 0;
    const text = rate !== null && rate !== undefined && hasTarget ? `${Number(rate).toFixed(1)}%` : "—";
    return <span className={`sales-rate-badge badge-${tone}`}>{text}</span>;
  };

  // Render Cột Tiến độ trực quan (Visual Progress Column)
  const renderProgressCell = (actual, target, rate, labelPrefix = "Mục tiêu") => {
    const hasTarget = target !== null && target !== undefined && Number(target) > 0;
    const progressWidth = getProgressWidth(rate, target);
    const tone = getRateTone(rate, target);
    const gapText = formatGap(actual, target);
    const gapTone = getGapTone(actual, target);

    return (
      <div className="progress-cell-wrap">
        {/* Dòng 1: Số thực tế & Badge % */}
        <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
          <span className="font-numeric actual-value">{formatVnd(actual)} đ</span>
          {renderRateBadge(rate, target)}
        </div>

        {/* Dòng 2: Thanh Progress Bar mỏng bo tròn */}
        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill fill-${tone}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {/* Dòng 3: Kế hoạch & Chênh lệch */}
        <div className="d-flex align-items-center justify-content-between text-muted sub-metrics-row mt-1">
          <span className="target-text">
            {labelPrefix}: <strong>{hasTarget ? `${formatVnd(target)} đ` : "—"}</strong>
          </span>
          {gapText && (
            <span className={`gap-indicator gap-${gapTone}`}>
              {gapText}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="card sales-performance-card mt-4 p-5 text-center">
        <div className="loading-state">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          <span className="text-muted">Đang tải bảng theo dõi doanh thu theo nhân viên sale...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card sales-performance-card mt-4 p-4 text-center">
        <div className="text-danger mb-2">⚠️ {error}</div>
        <button className="btn btn-sm btn-outline-primary" onClick={loadData}>
          Thử lại
        </button>
      </div>
    );
  }

  const tree = data?.tree || [];
  if (tree.length === 0 && !loading) {
    return null;
  }

  const effectivePeriod = data?.period || queryPeriod || "2026-08";
  const currentMonthNum = effectivePeriod ? parseInt(effectivePeriod.split("-")[1], 10) : 8;
  const currentYear = effectivePeriod ? effectivePeriod.split("-")[0] : "2026";
  const effectiveDate = data?.date || queryDate;
  const dayColLabel = effectiveDate ? `NGÀY ${formatDayMonth(effectiveDate)}` : "NGÀY CHỐT";

  const buTopNode = tree[0] || null;
  const buTopMetrics = buTopNode?.metrics || null;

  return (
    <div className={`card sales-performance-card mt-4 ${!isCardExpanded ? "card-collapsed" : ""}`}>
      {/* 1. HEADER CARD (CƠ CHẾ ACCORDION BLOCK VÀ TÓM TẮT NHANH) */}
      <div className="sales-perf-header d-flex flex-wrap justify-content-between align-items-center">
        <div className="header-left d-flex flex-column gap-1">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="card-icon">📊</span>
            <h3 className="card-title m-0">
              {title || "Báo cáo Doanh thu theo Nhân viên Sale"}
            </h3>
            <span className="badge-target-pill">Mục tiêu {currentYear}</span>
            {buTopNode && (
              <span className="bu-name-pill">{buTopNode.name}</span>
            )}
          </div>

          <div className="card-subtitle text-muted d-flex align-items-center gap-2 flex-wrap">
            <span>Ngày chốt: <strong className="text-dark">{formatDisplayDate(effectiveDate)}</strong></span>
            <span className="text-separator">•</span>
            <span>Kỳ báo cáo: <strong className="text-dark">{effectivePeriod}</strong></span>
            <span className="text-separator">•</span>
            <span className="text-exclude-hint">(Loại trừ DT nội bộ & đối ứng HiSa)</span>
          </div>

          {/* DẢI TÓM TẮT NHANH KHI CARD BỊ THU GỌN */}
          {!isCardExpanded && buTopMetrics && (
            <div className="collapsed-summary-strip d-flex align-items-center gap-3 mt-2 flex-wrap">
              <div className="summary-metric-item">
                <span className="metric-label">{dayColLabel}:</span>
                <span className="metric-value highlight-day">{formatVnd(buTopMetrics.day_revenue)} đ</span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-label">Thực tế Tháng {currentMonthNum}:</span>
                <span className="metric-value font-bold">{formatVnd(buTopMetrics.month_actual)} đ</span>
                <span className="metric-sub">/ {formatVnd(buTopMetrics.month_target)} đ</span>
                {renderRateBadge(buTopMetrics.month_rate, buTopMetrics.month_target)}
              </div>
              <div className="summary-metric-item">
                <span className="metric-label">Lũy kế Năm {currentYear}:</span>
                <span className="metric-value font-bold">{formatVnd(buTopMetrics.year_actual)} đ</span>
                <span className="metric-sub">/ {formatVnd(buTopMetrics.year_target)} đ</span>
                {renderRateBadge(buTopMetrics.year_rate, buTopMetrics.year_target)}
              </div>
            </div>
          )}
        </div>

        {/* NÚT ĐIỀU KHIỂN GÓC PHẢI */}
        <div className="header-right d-flex align-items-center gap-2 mt-2 mt-md-0">
          {/* NÚT THU GỌN / MỞ RỘNG TOÀN BỘ BLOCK (ACCORDION) */}
          <button
            type="button"
            className={`btn-card-accordion ${isCardExpanded ? "btn-accordion-collapse" : "btn-accordion-expand"}`}
            onClick={toggleCardExpanded}
            title={isCardExpanded ? "Thu gọn toàn bộ khối bảng" : "Mở rộng bảng dữ liệu chi tiết"}
          >
            {isCardExpanded ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                <span>Thu gọn</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span>Mở rộng</span>
              </>
            )}
          </button>

          {/* NÚT RELOAD DỮ LIỆU */}
          <button
            type="button"
            className="btn-reload-icon"
            onClick={loadData}
            title="Làm mới dữ liệu từ server"
            disabled={loading}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={loading ? "spin-icon" : ""}
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. BODY KHỐI BẢNG DỮ LIỆU TINH GỌN 4 CỘT (CHỈ HIỂN THỊ KHI CARD EXPANDED) */}
      {isCardExpanded && (
        <div className="sales-card-body mt-3">
          {/* THANH BỘ LỌC NHANH (QUICK FILTER PILLS) & ACTIONS */}
          <div className="quick-filter-bar d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <div className="filter-pills d-flex align-items-center gap-2 flex-wrap">
              <span className="filter-label text-muted font-medium">Bộ lọc:</span>
              <button
                type="button"
                className={`pill-btn ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                Tất cả ({filterCounts.all})
              </button>
              <button
                type="button"
                className={`pill-btn ${activeFilter === "north" ? "active" : ""}`}
                onClick={() => setActiveFilter("north")}
              >
                Miền Bắc ({filterCounts.north})
              </button>
              <button
                type="button"
                className={`pill-btn ${activeFilter === "south" ? "active" : ""}`}
                onClick={() => setActiveFilter("south")}
              >
                Miền Nam ({filterCounts.south})
              </button>
              <button
                type="button"
                className={`pill-btn warning-pill ${activeFilter === "warning" ? "active" : ""}`}
                onClick={() => setActiveFilter("warning")}
                title="Lọc các nhân sự chưa đạt tiến độ tháng (< 70%)"
              >
                <span className="warning-dot" />
                Cần bám sát (&lt; 70%) ({filterCounts.warning})
              </button>
            </div>

            <div className="table-actions-sub d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn-toggle-subrows"
                onClick={isAllRegionsExpanded ? handleCollapseAllRegions : handleExpandAllRegions}
              >
                {isAllRegionsExpanded ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
                    </svg>
                    <span>Thu gọn Sales</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                    <span>Bung tất cả Sales</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* BẢNG 4 CỘT TINH GỌN (VISUAL PROGRESS TABLE) */}
          <div className="sales-table-wrap table-responsive">
            <table className="sales-data-table modern-4col-table">
              <thead>
                <tr className="header-main-row">
                  <th className="sticky-col col-header-emp">
                    NHÂN VIÊN / NHÓM
                  </th>
                  <th className="col-header-progress">
                    TIẾN ĐỘ THÁNG NÀY (THÁNG {currentMonthNum})
                  </th>
                  <th className="col-header-progress">
                    TIẾN ĐỘ CẢ NĂM {currentYear}
                  </th>
                  <th className="col-header-day text-end">
                    DOANH SỐ TRONG NGÀY ({dayColLabel})
                  </th>
                </tr>
              </thead>

              <tbody>
                {tree.map((buNode) => {
                  const buMetrics = buNode.metrics;
                  const regions = buNode.children || [];

                  // Lọc regions theo activeFilter
                  const filteredRegions = regions.filter((regNode) => {
                    const isNorth = (regNode.region_name || regNode.name || "").includes("Bắc");
                    const isSouth = (regNode.region_name || regNode.name || "").includes("Nam");
                    if (activeFilter === "north") return isNorth;
                    if (activeFilter === "south") return isSouth;
                    return true;
                  });

                  return (
                    <React.Fragment key={buNode.id || buNode.code}>
                      {/* DÒNG TỔNG BU */}
                      <tr className="row-bu-total">
                        <td className="sticky-col col-bu-name">
                          <div className="bu-cell-wrap d-flex align-items-center gap-2">
                            <span className="bu-badge-label">TỔNG BU</span>
                            <span className="bu-title-text">{buNode.name}</span>
                          </div>
                        </td>

                        {/* TIẾN ĐỘ THÁNG NÀY */}
                        <td className="col-cell-progress">
                          {renderProgressCell(
                            buMetrics.month_actual,
                            buMetrics.month_target,
                            buMetrics.month_rate,
                            "Mục tiêu tháng"
                          )}
                        </td>

                        {/* TIẾN ĐỘ CẢ NĂM */}
                        <td className="col-cell-progress">
                          {renderProgressCell(
                            buMetrics.year_actual,
                            buMetrics.year_target,
                            buMetrics.year_rate,
                            "Kế hoạch năm"
                          )}
                        </td>

                        {/* DOANH SỐ TRONG NGÀY */}
                        <td className="col-cell-day text-end">
                          <div className="day-revenue-wrap">
                            <span className="day-revenue-amount font-numeric">
                              {formatVnd(buMetrics.day_revenue)} đ
                            </span>
                            <span className="day-revenue-tag">Ngày chốt</span>
                          </div>
                        </td>
                      </tr>

                      {/* CÁC MIỀN / KHU VỰC TRONG BU */}
                      {filteredRegions.map((regNode) => {
                        const regMetrics = regNode.metrics;
                        const allEmployees = regNode.children || [];

                        // Lọc nhân viên theo filter warning (< 70%) nếu được chọn
                        const displayedEmployees = activeFilter === "warning"
                          ? allEmployees.filter(
                              (emp) => emp.metrics?.month_target > 0 && Number(emp.metrics?.month_rate || 0) < 70
                            )
                          : allEmployees;

                        // Nếu filter là warning và region không có sales nào < 70% thì bỏ qua
                        if (activeFilter === "warning" && displayedEmployees.length === 0) {
                          return null;
                        }

                        const isExpanded = expandedRegionIds.has(regNode.id);

                        return (
                          <React.Fragment key={regNode.id}>
                            {/* DÒNG MIỀN / KHU VỰC (ACCORDION ROW) */}
                            <tr
                              className={`row-region ${isExpanded ? "region-expanded" : ""}`}
                              onClick={() => toggleRegion(regNode.id)}
                            >
                              <td className="sticky-col col-region-name">
                                <div className="region-cell-wrap d-flex align-items-center gap-2">
                                  <span className={`region-arrow-icon ${isExpanded ? "arrow-down" : "arrow-right"}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                  </span>
                                  <span className="region-text font-semibold">{regNode.name}</span>
                                  <span className="sales-count-pill">
                                    {displayedEmployees.length} nhân sự
                                  </span>
                                </div>
                              </td>

                              {/* TIẾN ĐỘ THÁNG NÀY */}
                              <td className="col-cell-progress">
                                {renderProgressCell(
                                  regMetrics.month_actual,
                                  regMetrics.month_target,
                                  regMetrics.month_rate,
                                  "Mục tiêu tháng"
                                )}
                              </td>

                              {/* TIẾN ĐỘ CẢ NĂM */}
                              <td className="col-cell-progress">
                                {renderProgressCell(
                                  regMetrics.year_actual,
                                  regMetrics.year_target,
                                  regMetrics.year_rate,
                                  "Kế hoạch năm"
                                )}
                              </td>

                              {/* DOANH SỐ TRONG NGÀY */}
                              <td className="col-cell-day text-end">
                                <div className="day-revenue-wrap">
                                  <span className="day-revenue-amount font-numeric">
                                    {formatVnd(regMetrics.day_revenue)} đ
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {/* CÁC DÒNG NHÂN VIÊN SALES CON */}
                            {isExpanded &&
                              displayedEmployees.map((empNode) => {
                                const empMetrics = empNode.metrics;
                                const isLeader = empNode.is_leader;

                                return (
                                  <tr key={empNode.id || empNode.employee_code} className="row-employee">
                                    <td className="sticky-col col-employee-name">
                                      <div className="employee-cell-wrap d-flex align-items-start gap-2">
                                        <span className={`role-avatar-icon ${isLeader ? "is-leader" : "is-sales"}`}>
                                          {isLeader ? "👔" : "👤"}
                                        </span>
                                        <div className="employee-info d-flex flex-column">
                                          <div className="d-flex align-items-center gap-1.5">
                                            <span className="employee-name-text font-bold">
                                              {empNode.name}
                                            </span>
                                            {isLeader && (
                                              <span className="leader-badge-pill">Trưởng nhóm</span>
                                            )}
                                          </div>
                                          <span className="employee-code-tag">
                                            Mã NV: {empNode.employee_code}
                                          </span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* TIẾN ĐỘ THÁNG NÀY */}
                                    <td className="col-cell-progress">
                                      {renderProgressCell(
                                        empMetrics.month_actual,
                                        empMetrics.month_target,
                                        empMetrics.month_rate,
                                        "Mục tiêu"
                                      )}
                                    </td>

                                    {/* TIẾN ĐỘ CẢ NĂM */}
                                    <td className="col-cell-progress">
                                      {renderProgressCell(
                                        empMetrics.year_actual,
                                        empMetrics.year_target,
                                        empMetrics.year_rate,
                                        "Kế hoạch"
                                      )}
                                    </td>

                                    {/* DOANH SỐ TRONG NGÀY */}
                                    <td className="col-cell-day text-end">
                                      <div className="day-revenue-wrap">
                                        <span className="day-revenue-amount font-numeric emp-day">
                                          {formatVnd(empMetrics.day_revenue)} đ
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 3. FOOTER CHÚ GIẢI THỊ GIÁC */}
          <div className="sales-perf-footer d-flex flex-wrap justify-content-between align-items-center mt-3 pt-2">
            <div className="legend-items d-flex align-items-center gap-3 flex-wrap">
              <span className="legend-title font-semibold text-muted">Quy ước màu sắc:</span>
              <span className="d-inline-flex align-items-center gap-1.5">
                <span className="color-legend-box bg-emerald" />
                <span className="sales-rate-badge badge-good">≥ 100%</span>
                <span className="legend-text">Đạt / Vượt kế hoạch</span>
              </span>
              <span className="d-inline-flex align-items-center gap-1.5">
                <span className="color-legend-box bg-amber" />
                <span className="sales-rate-badge badge-warn">70% – 99.9%</span>
                <span className="legend-text">Cần bám sát</span>
              </span>
              <span className="d-inline-flex align-items-center gap-1.5">
                <span className="color-legend-box bg-rose" />
                <span className="sales-rate-badge badge-danger">&lt; 70%</span>
                <span className="legend-text">Chậm tiến độ</span>
              </span>
            </div>

            <div className="table-guide-hint text-muted mt-2 mt-sm-0">
              <span>* Nhấp vào hàng <strong>Miền / Khu vực</strong> hoặc nút <strong>Bung tất cả Sales</strong> để xem chi tiết</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
