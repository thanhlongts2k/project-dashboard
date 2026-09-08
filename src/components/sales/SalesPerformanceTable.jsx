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
    agritech: "BU_AGRITECH",
    buagritech: "BU_AGRITECH",
    sab: "BU_SAB",
    busab: "BU_SAB",
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
 * Định dạng tiền tệ VND chuẩn: 1.234.567.890 đ
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

/**
 * Định dạng tiền tệ ngắn gọn (tỷ / tr / k) cho subtitle và metric cards
 */
function formatVndCompact(val) {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (!Number.isFinite(num)) return "—";
  const abs = Math.abs(num);
  if (abs === 0) return "0";
  if (abs >= 1_000_000_000) {
    const b = num / 1_000_000_000;
    const formatted = b.toFixed(1).replace(/\.0$/, "");
    return `${formatted} tỷ`;
  }
  if (abs >= 1_000_000) {
    const m = num / 1_000_000;
    const formatted = m.toFixed(1).replace(/\.0$/, "");
    return `${formatted} tr`;
  }
  if (abs >= 1_000) {
    return `${(num / 1_000).toFixed(0)} k`;
  }
  return new Intl.NumberFormat("vi-VN").format(Math.round(num));
}

function formatPlanCompact(actual, target) {
  if (target === null || target === undefined || Number(target) <= 0) {
    return "KH: —";
  }
  const targetStr = formatVndCompact(target);
  const diff = Number(actual || 0) - Number(target || 0);
  if (diff === 0) {
    return `KH: ${targetStr} (Đạt)`;
  }
  const diffStr = diff > 0 ? `+${formatVndCompact(diff)}` : `-${formatVndCompact(Math.abs(diff))}`;
  return `KH: ${targetStr} (${diffStr})`;
}

/**
 * Lấy chữ cái viết tắt của tên nhân viên làm Avatar
 */
function getInitials(name) {
  if (!name) return "?";
  const clean = name.trim().replace(/^Mr\.\s*|^Ms\.\s*|^Anh\s*|^Chị\s*/i, "");
  const parts = clean.split(/\s+/);
  if (parts.length === 0) return "?";
  const last = parts[parts.length - 1];
  return (last[0] || "?").toUpperCase();
}

/**
 * Render Pill Badge % Tiến độ chuẩn màu Tremor/Stripe (êm dịu mắt)
 */
function renderRatePill(rate, target) {
  const hasTarget = target !== null && target !== undefined && Number(target) > 0;
  if (!hasTarget) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400 font-mono"
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "1.5px 7px",
          borderRadius: "9999px",
          fontSize: "11px",
          fontWeight: 500,
          backgroundColor: "#f1f5f9",
          color: "#94a3b8",
          fontFamily: "ui-monospace, monospace",
          lineHeight: 1.2,
        }}
      >
        —
      </span>
    );
  }
  const r = Number(rate);
  const text = `${(Number.isFinite(r) && r > 0 ? r : 0).toFixed(1)}%`;

  let styleObj = {
    display: "inline-flex",
    alignItems: "center",
    padding: "1.5px 7px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 600,
    fontFamily: "ui-monospace, monospace",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.2,
  };
  let className = "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono tabular-nums ";

  if (r >= 100) {
    className += "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
    styleObj = {
      ...styleObj,
      backgroundColor: "#ecfdf5",
      color: "#047857",
      border: "1px solid rgba(167, 243, 208, 0.8)",
    };
  } else if (r >= 70) {
    className += "bg-blue-50 text-blue-700 border border-blue-200/60";
    styleObj = {
      ...styleObj,
      backgroundColor: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid rgba(191, 219, 254, 0.8)",
    };
  } else {
    className += "bg-amber-50 text-amber-700 border border-amber-200/60";
    styleObj = {
      ...styleObj,
      backgroundColor: "#fffbeb",
      color: "#b45309",
      border: "1px solid rgba(253, 230, 138, 0.8)",
    };
  }

  return (
    <span className={className} style={styleObj}>
      {text}
    </span>
  );
}

function getProgressColor(rate, target) {
  const hasTarget = target !== null && target !== undefined && Number(target) > 0;
  if (!hasTarget) return "#e2e8f0";
  const r = Number(rate) || 0;
  if (r >= 100) return "#10b981"; // emerald
  if (r >= 70) return "#3b82f6"; // blue
  return "#f59e0b"; // amber
}

function getProgressColorClass(rate, target) {
  const hasTarget = target !== null && target !== undefined && Number(target) > 0;
  if (!hasTarget) return "bg-slate-200";
  const r = Number(rate) || 0;
  if (r >= 100) return "bg-emerald-500";
  if (r >= 70) return "bg-blue-500";
  return "bg-amber-500";
}

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

  // 1. Hook xác định Viewport Mobile (< 768px) để render chuyển đổi giao diện
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Mobile Tab State: 'top' | 'warning' | 'regions' (trên mobile chỉ render 1 card tại 1 thời điểm)
  const [activeMobileWidgetTab, setActiveMobileWidgetTab] = useState("top");

  // 3. Toggle Kỳ báo cáo cho Action Hub: Cố định 'MTD' (Tháng này) theo chỉ đạo điều hành
  const [hubPeriodType, setHubPeriodType] = useState("MTD");

  // 4. Progressive disclosure: Mặc định đóng bảng chi tiết
  const [isDetailTableOpen, setIsDetailTableOpen] = useState(false);

  // 5. Ô tìm kiếm nhanh (Quick Search) theo tên hoặc mã NV
  const [searchQuery, setSearchQuery] = useState("");

  // 6. Trạng thái mở rộng các hàng con Miền / Khu vực trong bảng chi tiết
  const [expandedRegionIds, setExpandedRegionIds] = useState(new Set());
  const [mobileCrossSellingOpen, setMobileCrossSellingOpen] = useState(false);

  // 7. Quick Filter Tabs trong bảng chi tiết: 'all' | 'north' | 'south' | 'warning'
  const [activeFilter, setActiveFilter] = useState("all");

  const buCode = useMemo(() => getBuCodeFromKey(buKey), [buKey]);

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

  // Danh sách phẳng toàn bộ nhân viên Sale chính thức từ cây dữ liệu (Deduplicated theo mã nhân viên)
  const allEmployees = useMemo(() => {
    if (!data?.tree) return [];
    const map = new Map();
    data.tree.forEach((bu) => {
      // Defense-in-depth: Nếu đang xem BU cụ thể, chỉ xử lý đúng BU node đó hoặc BU cha tương ứng
      const buCodeNorm = String(bu.code || "").toUpperCase();
      if (buCode && buCodeNorm && buCodeNorm !== buCode && buCodeNorm !== "TOTAL_ECO_AGRITECH") {
        return;
      }
      (bu.children || []).forEach((reg) => {
        // TỰ ĐỘNG LOẠI TRỪ CỤM BÁN CHÉO KHỎI ALL EMPLOYEES CỦA ACTION HUB & TABS BỘ LỌC
        if (reg.is_cross_selling || (reg.region_name || reg.name || "").toLowerCase().includes("bán chéo")) {
          return;
        }

        const regNameUpper = String(reg.region_name || reg.name || "").toUpperCase();
        // Nếu đang ở BU_ECO, tuyệt đối không nhận các vùng miền của AGRITECH hoặc SAB
        if (buCode === "BU_ECO" && (regNameUpper.includes("AGRITECH") || regNameUpper.includes("SAB"))) {
          return;
        }
        if (buCode === "BU_AGRITECH" && (regNameUpper.includes("ECO") || regNameUpper.includes("SAB"))) {
          return;
        }
        if (buCode === "BU_SAB" && (regNameUpper.includes("ECO") || regNameUpper.includes("AGRITECH"))) {
          return;
        }

        (reg.children || []).forEach((emp) => {
          if (emp.is_cross_selling) return;

          const key = String(emp.employee_code || emp.id || emp.name);
          if (!map.has(key)) {
            map.set(key, {
              ...emp,
              regionId: reg.id,
              regionName: reg.region_name || reg.name || "",
              buName: bu.name || "",
            });
          } else {
            // Nếu đã có nhưng đang ghi tên 'Tổng Miền' mà gặp đơn vị cụ thể, ưu tiên tên đơn vị cụ thể
            const existing = map.get(key);
            if ((existing.regionName || "").includes("Tổng Miền") && !(reg.region_name || reg.name || "").includes("Tổng Miền")) {
              map.set(key, {
                ...emp,
                regionId: reg.id,
                regionName: reg.region_name || reg.name || "",
                buName: bu.name || "",
              });
            }
          }
        });
      });
    });
    return Array.from(map.values());
  }, [data, buCode]);

  // Danh sách các Miền / Khối con
  const allRegions = useMemo(() => {
    if (!data?.tree) return [];
    const list = [];
    data.tree.forEach((bu) => {
      (bu.children || []).forEach((reg) => {
        list.push({
          ...reg,
          buName: bu.name,
        });
      });
    });
    return list;
  }, [data]);

  const allRegionIds = useMemo(() => allRegions.map((r) => r.id), [allRegions]);

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

  // Khởi tạo: Mặc định mở các khu vực chính thức của BU, thu gọn các khu vực bán chéo
  useEffect(() => {
    if (allRegions.length > 0 && expandedRegionIds.size === 0) {
      const initialExpanded = new Set();
      allRegions.forEach((r) => {
        if (!r.is_cross_selling && !(r.region_name || r.name || "").toLowerCase().includes("bán chéo")) {
          initialExpanded.add(r.id);
        }
      });
      setExpandedRegionIds(initialExpanded);
    }
  }, [allRegions]);

  const crossSellingRegion = useMemo(() => {
    return allRegions.find((r) => r.is_cross_selling || (r.region_name || r.name || "").toLowerCase().includes("bán chéo"));
  }, [allRegions]);

  // Tự động mở rộng tất cả vùng miền khi tìm kiếm có text
  useEffect(() => {
    if (searchQuery.trim() && allRegionIds.length > 0) {
      setExpandedRegionIds(new Set(allRegionIds));
    }
  }, [searchQuery, allRegionIds]);

  const effectivePeriod = data?.period || queryPeriod || "2026-09";
  const currentMonthNum = effectivePeriod ? parseInt(effectivePeriod.split("-")[1], 10) : 9;
  const currentYear = effectivePeriod ? effectivePeriod.split("-")[0] : "2026";
  const effectiveDate = data?.date || queryDate;

  const buTopNode = data?.tree?.[0] || null;
  const buTopMetrics = buTopNode?.metrics || null;

  const shortBuTag = buKey
    ? buKey.replace(/[-_]/g, " ").toUpperCase()
    : buTopNode?.code
    ? buTopNode.code.replace(/^BU_/, "")
    : "ECO";

  // Danh sách nhân viên kèm số liệu hiển thị chuẩn theo kỳ toggle (MTD / YTD)
  const mappedEmployees = useMemo(() => {
    if (allEmployees.length === 0) return [];
    const isMtd = hubPeriodType === "MTD";
    return allEmployees.map((emp) => {
      const actual = Number(isMtd ? emp.metrics?.month_actual : emp.metrics?.year_actual) || 0;
      const target = Number(isMtd ? emp.metrics?.month_target : emp.metrics?.year_target) || 0;
      const rate = Number(isMtd ? emp.metrics?.month_rate : emp.metrics?.year_rate) || 0;
      const gap = Math.max(0, target - actual);
      return {
        ...emp,
        displayActual: actual,
        displayTarget: target,
        displayRate: rate,
        displayGap: gap,
      };
    });
  }, [allEmployees, hubPeriodType]);

  // Tìm nhân sự dẫn đầu doanh thu của toàn BU (Top 1 Revenue Driver - bảo vệ miễn trừ cảnh báo)
  const topRevenueEmployeeId = useMemo(() => {
    if (mappedEmployees.length === 0) return null;
    const sortedByActual = [...mappedEmployees].sort((a, b) => b.displayActual - a.displayActual);
    const top = sortedByActual[0];
    return top && top.displayActual > 0 ? String(top.employee_code || top.id) : null;
  }, [mappedEmployees]);

  // 1. BÁO ĐỘNG CHẬM TIẾN ĐỘ (ACTION REQUIRED): Tính theo MTD hoặc YTD tùy toggle
  const actionRequiredList = useMemo(() => {
    if (mappedEmployees.length === 0) return [];
    const isMtd = hubPeriodType === "MTD";

    // Ngưỡng cảnh báo theo nhịp thời gian thực tế:
    // - MTD (Tháng này, ngày 7/30 ~ 23.3%): cảnh báo người có target mà đạt < 20%
    // - YTD (Cả năm, tháng 9/12 ~ 70%): cảnh báo người có target mà đạt < 50%
    const warningRateThreshold = isMtd ? 20 : 50;

    const list = mappedEmployees
      .filter((e) => {
        const id = String(e.employee_code || e.id);
        // NGUYÊN TẮC QUẢN TRỊ 1: Người gánh doanh số cao nhất BU (Top 1 Revenue) được miễn trừ cảnh báo
        if (topRevenueEmployeeId && id === topRevenueEmployeeId) {
          return false;
        }
        // Phải có chỉ tiêu giao và tỷ lệ hoàn thành thấp hơn ngưỡng nhịp
        return e.displayTarget > 0 && e.displayRate < warningRateThreshold;
      })
      .sort((a, b) => {
        // Ưu tiên tỷ lệ hoàn thành thấp nhất lên đầu (nguy cấp nhất), sau đó đến số tiền thiếu lớn nhất
        if (a.displayRate !== b.displayRate) return a.displayRate - b.displayRate;
        return b.displayGap - a.displayGap;
      });

    return list.slice(0, 3);
  }, [mappedEmployees, hubPeriodType, topRevenueEmployeeId]);

  // 2. TOP VINH DANH (LEADERBOARD): Tính theo MTD hoặc YTD tùy toggle
  const topPerformers = useMemo(() => {
    if (mappedEmployees.length === 0) return [];

    // NGUYÊN TẮC QUẢN TRỊ 2 (MUTUAL EXCLUSIVITY 2 CHIỀU):
    // Nhân sự đã nằm trong danh sách Báo Động Chậm Tiến Độ thì KHÔNG trao cúp Vinh Danh
    const warningIds = new Set(
      actionRequiredList.map((w) => String(w.employee_code || w.id))
    );

    return mappedEmployees
      .filter((emp) => {
        const id = String(emp.employee_code || emp.id);
        if (warningIds.has(id)) return false;
        return emp.displayActual > 0 || emp.displayRate > 0;
      })
      .sort((a, b) => {
        if (b.displayActual !== a.displayActual) return b.displayActual - a.displayActual;
        return b.displayRate - a.displayRate;
      })
      .slice(0, 3);
  }, [mappedEmployees, actionRequiredList]);

  // 3. TIẾN ĐỘ THEO KHỐI & VÙNG MIỀN: Tính theo MTD hoặc YTD tùy toggle
  const regionalSummary = useMemo(() => {
    if (allRegions.length === 0) return [];
    const isMtd = hubPeriodType === "MTD";
    const buTotalActual = Number(isMtd ? buTopMetrics?.month_actual : buTopMetrics?.year_actual) || 1;

    return allRegions
      .map((reg) => {
        const actual = Number(isMtd ? reg.metrics?.month_actual : reg.metrics?.year_actual) || 0;
        const target = Number(isMtd ? reg.metrics?.month_target : reg.metrics?.year_target) || 0;
        const rate = Number(isMtd ? reg.metrics?.month_rate : reg.metrics?.year_rate) || 0;
        const share = buTotalActual > 0 ? (actual / buTotalActual) * 100 : 0;
        return {
          ...reg,
          displayActual: actual,
          displayTarget: target,
          displayRate: rate,
          share: Math.min(Math.round(share * 10) / 10, 100),
        };
      })
      .sort((a, b) => b.displayActual - a.displayActual);
  }, [allRegions, buTopMetrics, hubPeriodType]);

  // Lọc tìm kiếm nhân viên
  const filteredEmployeesForDetail = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEmployees.filter((emp) => {
      // 1. Filter theo tab
      const isNorth = (emp.regionName || "").includes("Bắc");
      const isSouth =
        (emp.regionName || "").includes("Nam") ||
        (emp.regionName || "").includes("ECO");
      if (activeFilter === "north" && !isNorth) return false;
      if (activeFilter === "south" && !isSouth) return false;
      if (activeFilter === "warning") {
        const m = emp.metrics;
        if (!(m?.month_target > 0 && Number(m?.month_rate || 0) < 70)) return false;
      }
      // 2. Filter theo Search Query (an toàn với số và chữ)
      if (q) {
        const matchName = String(emp.name || "").toLowerCase().includes(q);
        const matchCode = String(emp.employee_code ?? "").toLowerCase().includes(q);
        const matchReg = String(emp.regionName || "").toLowerCase().includes(q);
        return matchName || matchCode || matchReg;
      }
      return true;
    });
  }, [allEmployees, activeFilter, searchQuery]);

  // Đếm số lượng bộ lọc chuẩn
  const filterCounts = useMemo(() => {
    let all = allEmployees.length;
    let north = 0;
    let south = 0;
    let warning = 0;

    allEmployees.forEach((emp) => {
      const reg = emp.regionName || "";
      if (reg.includes("Bắc")) north += 1;
      if (reg.includes("Nam") || reg.includes("ECO")) south += 1;
      const m = emp.metrics;
      if (m?.month_target > 0 && Number(m?.month_rate || 0) < 70) {
        warning += 1;
      }
    });

    return { all, north, south, warning };
  }, [allEmployees]);

  if (loading && !data) {
    return (
      <div
        className="bg-white border border-slate-200/80 shadow-sm rounded-xl mt-4 p-8 text-center"
        style={{
          marginTop: "16px",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <div
          className="inline-flex items-center gap-2 text-slate-500 text-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "14px" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
          </svg>
          <span>Đang tải Action Hub doanh thu theo nhân viên sale...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        className="bg-white border border-rose-200 rounded-xl mt-4 p-5 text-center"
        style={{
          marginTop: "16px",
          backgroundColor: "#ffffff",
          border: "1px solid #fecdd3",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#e11d48", fontSize: "14px", fontWeight: 500, marginBottom: "12px" }}>⚠️ {error}</div>
        <button
          type="button"
          style={{
            padding: "6px 14px",
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
            color: "#334155",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={loadData}
        >
          Thử lại
        </button>
      </div>
    );
  }

  const tree = data?.tree || [];
  if (tree.length === 0 && !loading) {
    return null;
  }

  // Helper render Widget 1: Top Vinh danh
  const renderTopVinhDanhCard = () => (
    <div
      className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        height: "100%",
      }}
    >
      <div
        className="flex items-center justify-between pb-3 border-b border-slate-100"
        style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🏆</span>
          <div>
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
              TOP VINH DANH
            </h4>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              {hubPeriodType === "MTD" ? `Dẫn đầu Tháng ${currentMonthNum}` : `Dẫn đầu Năm ${currentYear}`}
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 600,
            color: "#047857",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            padding: "2px 7px",
            borderRadius: "9999px",
          }}
        >
          Leaderboard
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", flexGrow: 1 }}>
        {topPerformers.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: "12px", textAlign: "center", padding: "16px" }}>
            Chưa có số liệu kỳ này
          </div>
        ) : (
          topPerformers.map((emp, idx) => {
            const rankBadges = [
              { label: "🥇 #1", bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
              { label: "🥈 #2", bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" },
              { label: "🥉 #3", bg: "#ffedd5", text: "#9a3412", border: "#fed7aa" },
            ];
            const badge = rankBadges[idx] || { label: `#${idx + 1}`, bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" };

            return (
              <div
                key={emp.id || emp.employee_code}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: idx === 0 ? "rgba(240, 253, 244, 0.6)" : "#ffffff",
                  border: idx === 0 ? "1px solid #dcfce7" : "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "1.5px 5px",
                        borderRadius: "4px",
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        flexShrink: 0,
                      }}
                    >
                      {badge.label}
                    </span>
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: "#ecfdf5",
                        color: "#047857",
                        border: "1px solid #a7f3d0",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(emp.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {emp.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        #{emp.employee_code} • {emp.regionName}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, fontFamily: "ui-monospace, monospace", color: "#0f172a" }}>
                      {formatVndCompact(emp.displayActual)}
                    </div>
                    {emp.displayTarget > 0 && (
                      <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
                        / {formatVndCompact(emp.displayTarget)}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: "#e2e8f0",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    marginTop: "6px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(emp.displayRate > 0 ? emp.displayRate : 100, 100)}%`,
                      background: "linear-gradient(90deg, #059669, #10b981)",
                      borderRadius: "9999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3px", fontSize: "10px" }}>
                  <span style={{ color: "#059669", fontWeight: 600 }}>
                    {emp.displayRate >= 100 ? `Vượt KH ${emp.displayRate.toFixed(1)}%` : `Đạt ${emp.displayRate.toFixed(1)}%`}
                  </span>
                  <span style={{ color: "#94a3b8" }}>
                    {hubPeriodType === "MTD" ? `Tháng ${currentMonthNum}` : `Năm ${currentYear}`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Helper render Widget 2: Báo động chậm tiến độ
  const renderActionRequiredCard = () => (
    <div
      className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        height: "100%",
      }}
    >
      <div
        className="flex items-center justify-between pb-3 border-b border-slate-100"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>⚠️</span>
          <div>
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#991b1b" }}>
              BÁO ĐỘNG CHẬM TIẾN ĐỘ
            </h4>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              {hubPeriodType === "MTD" ? `Cần đôn đốc Tháng ${currentMonthNum}` : `Cần đôn đốc Năm ${currentYear}`}
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 600,
            color: "#b45309",
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            padding: "2px 7px",
            borderRadius: "9999px",
          }}
        >
          Action Required
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", flexGrow: 1 }}>
        {actionRequiredList.length === 0 ? (
          <div style={{ color: "#047857", fontSize: "12px", textAlign: "center", padding: "20px 16px" }}>
            🎉 Tất cả nhân sự có chỉ tiêu đều đang bám sát tiến độ rất tốt!
          </div>
        ) : (
          actionRequiredList.map((emp) => (
            <div
              key={emp.id || emp.employee_code}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 251, 235, 0.5)",
                border: "1px solid #fef3c7",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: "#fef3c7",
                      color: "#b45309",
                      border: "1px solid #fde68a",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(emp.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>
                      #{emp.employee_code} • {emp.regionName}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      color: "#b45309",
                      backgroundColor: "#fef3c7",
                      border: "1px solid #fde68a",
                      padding: "1.5px 6px",
                      borderRadius: "9999px",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {emp.displayRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "4px",
                  backgroundColor: "#fee2e2",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  marginTop: "6px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(emp.displayRate, 3)}%`,
                    backgroundColor: "#f59e0b",
                    borderRadius: "9999px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", fontSize: "10.5px" }}>
                <span style={{ color: "#dc2626", fontWeight: 600 }}>
                  Cần thêm: <strong>{formatVndCompact(emp.displayGap)}</strong> để đạt KH
                </span>
                <span style={{ color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
                  Đã có: {formatVndCompact(emp.displayActual)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Helper render Widget 3: Tiến độ Khối & Vùng miền
  const renderRegionalCard = () => (
    <div
      className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        height: "100%",
      }}
    >
      <div
        className="flex items-center justify-between pb-3 border-b border-slate-100"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>📍</span>
          <div>
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
              TIẾN ĐỘ THEO KHỐI & VÙNG MIỀN
            </h4>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              {hubPeriodType === "MTD" ? `Tỷ trọng Tháng ${currentMonthNum}` : `Tỷ trọng Năm ${currentYear}`}
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 600,
            color: "#1d4ed8",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "2px 7px",
            borderRadius: "9999px",
          }}
        >
          {regionalSummary.length} Khối/Miền
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginTop: "12px", flexGrow: 1 }}>
        {regionalSummary.map((reg) => {
          const hasTarget = reg.displayTarget > 0;
          return (
            <div key={reg.id || reg.name} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px" }}>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>
                  {reg.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: "#0f172a" }}>
                    {formatVndCompact(reg.displayActual)}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      backgroundColor: "#f1f5f9",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    {reg.share}% BU
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "5px",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(reg.share, 100)}%`,
                    backgroundColor: "#3b82f6",
                    borderRadius: "9999px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", fontSize: "10px", color: "#64748b" }}>
                <span>
                  {hasTarget ? `KH: ${formatVndCompact(reg.displayTarget)} (${reg.displayRate.toFixed(1)}%)` : "Chưa đặt KH"}
                </span>
                <span style={{ fontFamily: "ui-monospace, monospace" }}>
                  {hasTarget ? (reg.displayActual >= reg.displayTarget ? "Đạt chỉ tiêu" : `Còn thiếu: ${formatVndCompact(reg.displayTarget - reg.displayActual)}`) : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="bg-white border border-slate-200 shadow-sm rounded-xl mt-4 overflow-hidden transition-all"
      style={{
        marginTop: "16px",
        backgroundColor: "#ffffff",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        overflow: "hidden",
      }}
    >
      {/* ==================================================================== */}
      {/* 1. HUB HEADER: TIÊU ĐỀ EXECUTIVE + TOGGLE KỲ BÁO CÁO (MTD / YTD) */}
      {/* ==================================================================== */}
      <div
        className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap md:flex-nowrap bg-white"
        style={{
          padding: isMobile ? "10px 12px" : "11px 18px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: isMobile ? "wrap" : "nowrap",
          backgroundColor: "#ffffff",
        }}
      >
        {/* BÊN TRÁI: Icon Hub + Tiêu đề + BU Tag */}
        <div
          className="flex items-center gap-2.5 flex-nowrap min-w-0"
          style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "nowrap", minWidth: 0 }}
        >
          <div
            className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "15px", height: "15px", flexShrink: 0 }}
            >
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div
            className="flex items-baseline gap-2 flex-nowrap truncate"
            style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "nowrap", minWidth: 0 }}
          >
            <h3
              className="m-0 text-sm font-semibold text-slate-900 truncate"
              style={{ margin: 0, fontSize: isMobile ? "13px" : "14px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}
            >
              {title || "Executive Sales Performance Hub"}
            </h3>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 tracking-wide flex-shrink-0"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "1px 7px",
                borderRadius: "4px",
                backgroundColor: "#f1f5f9",
                color: "#334155",
                border: "1px solid #e2e8f0",
                flexShrink: 0,
              }}
            >
              {shortBuTag}
            </span>
            <span
              className="text-xs text-slate-500 font-normal whitespace-nowrap hidden sm:inline"
              style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap" }}
            >
              (Chốt: <strong style={{ color: "#334155", fontWeight: 600 }}>{formatDisplayDate(effectiveDate)}</strong>)
            </span>
          </div>
        </div>

        {/* BÊN PHẢI: TOGGLE KỲ (THÁNG NÀY | CẢ NĂM) + NÚT RELOAD */}
        <div
          className="flex items-center gap-2 flex-nowrap flex-shrink-0 ml-auto"
          style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "nowrap", flexShrink: 0 }}
        >
          {/* TIỆN ÍCH: PHẠM VI THEO DÕI CỐ ĐỊNH THÁNG NÀY (MTD) */}
          <div
            className="bg-slate-100 p-0.5 rounded-lg inline-flex items-center border border-slate-200/80"
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "#f1f5f9",
              padding: "2px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <span
              className="px-2.5 py-1 text-xs rounded-md font-semibold bg-white text-slate-900 shadow-2xs"
              style={{
                padding: isMobile ? "3px 8px" : "3px 10px",
                fontSize: "11px",
                borderRadius: "6px",
                fontWeight: 600,
                backgroundColor: "#ffffff",
                color: "#0f172a",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
              title={`Theo dõi tiến độ Tháng ${currentMonthNum}`}
            >
              Tháng này
            </span>
          </div>

          <button
            type="button"
            className="w-7 h-7 inline-flex items-center justify-center text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-md shadow-2xs transition-colors"
            style={{
              width: "28px",
              height: "28px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            onClick={loadData}
            title="Làm mới dữ liệu"
            disabled={loading}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "13px", height: "13px", flexShrink: 0 }}
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. EXECUTIVE BENTO GRID (RESPONSIVE: MOBILE TABS vs DESKTOP 3-COL) */}
      {/* ==================================================================== */}
      <div
        className="p-3 md:p-4 bg-slate-50/40"
        style={{
          padding: isMobile ? "12px" : "16px",
          backgroundColor: "#fcfdfe",
        }}
      >
        {/* RESPONSIVE MOBILE TABS: HIỂN THỊ TRÊN MÀN HÌNH NHỎ (< 768px) */}
        {isMobile ? (
          <div>
            {/* Cụm tab di động chuyển đổi 3 card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#f1f5f9",
                padding: "3px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                gap: "3px",
                marginBottom: "12px",
              }}
            >
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  fontSize: "11px",
                  fontWeight: activeMobileWidgetTab === "top" ? 700 : 500,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeMobileWidgetTab === "top" ? "#ffffff" : "transparent",
                  color: activeMobileWidgetTab === "top" ? "#0f172a" : "#64748b",
                  boxShadow: activeMobileWidgetTab === "top" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
                onClick={() => setActiveMobileWidgetTab("top")}
              >
                🏆 Vinh danh
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  fontSize: "11px",
                  fontWeight: activeMobileWidgetTab === "warning" ? 700 : 500,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeMobileWidgetTab === "warning" ? "#ffffff" : "transparent",
                  color: activeMobileWidgetTab === "warning" ? "#991b1b" : "#64748b",
                  boxShadow: activeMobileWidgetTab === "warning" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
                onClick={() => setActiveMobileWidgetTab("warning")}
              >
                ⚠️ Cảnh báo ({actionRequiredList.length})
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  fontSize: "11px",
                  fontWeight: activeMobileWidgetTab === "regions" ? 700 : 500,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeMobileWidgetTab === "regions" ? "#ffffff" : "transparent",
                  color: activeMobileWidgetTab === "regions" ? "#1d4ed8" : "#64748b",
                  boxShadow: activeMobileWidgetTab === "regions" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
                onClick={() => setActiveMobileWidgetTab("regions")}
              >
                📍 Vùng miền
              </button>
            </div>

            {/* Render Card tương ứng trên Mobile */}
            <div>
              {activeMobileWidgetTab === "top" && renderTopVinhDanhCard()}
              {activeMobileWidgetTab === "warning" && renderActionRequiredCard()}
              {activeMobileWidgetTab === "regions" && renderRegionalCard()}
            </div>
          </div>
        ) : (
          /* DESKTOP (>= 768px): RENDER ĐẦY ĐỦ 3 CỘT GRID */
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            {renderTopVinhDanhCard()}
            {renderActionRequiredCard()}
            {renderRegionalCard()}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. THANH PROGRESSIVE DISCLOSURE BẬT/TẮT BẢNG CHI TIẾT */}
      {/* ==================================================================== */}
      <div
        className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-center"
        style={{
          padding: "12px 16px",
          backgroundColor: "#ffffff",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-full shadow-2xs transition-all"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 18px",
            backgroundColor: isDetailTableOpen ? "#f1f5f9" : "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#334155",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            transition: "all 0.15s ease",
          }}
          onClick={() => setIsDetailTableOpen((prev) => !prev)}
        >
          {isDetailTableOpen ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "12px", height: "12px" }}>
                <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Thu gọn danh sách chi tiết</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: "13px" }}>👁️</span>
              <span>Xem danh sách bảng số liệu chi tiết ({allEmployees.length} nhân sự BU)</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "12px", height: "12px" }}>
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 4. PHẦN CHI TIẾT (PROGRESSIVE DISCLOSURE): QUICK SEARCH + TABLE/CARDS */}
      {/* ==================================================================== */}
      {isDetailTableOpen && (
        <div style={{ borderTop: "1px solid #e2e8f0" }}>
          {/* TOOLBAR PHỤ TRỢ: QUICK SEARCH + TABS LỌC + NÚT BUNG */}
          <div
            className="px-3 md:px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap"
            style={{
              padding: isMobile ? "8px 12px" : "8px 16px",
              backgroundColor: "rgba(248, 250, 252, 0.9)",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {/* TIỆN ÍCH 1: Ô TÌM KIẾM NHANH (QUICK SEARCH) */}
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                width: isMobile ? "100%" : "200px",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{
                  position: "absolute",
                  left: "9px",
                  width: "13px",
                  height: "13px",
                  color: "#94a3b8",
                  pointerEvents: "none",
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên sale, mã NV..."
                style={{
                  width: "100%",
                  padding: "4.5px 24px 4.5px 28px",
                  fontSize: "11.5px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  outline: "none",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "6px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#94a3b8",
                    padding: "2px",
                  }}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Segmented control lọc */}
            <div
              className="bg-slate-200/70 p-0.5 rounded-lg inline-flex items-center gap-0.5 border border-slate-300/60"
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#e2e8f0",
                padding: "2px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                gap: "2px",
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}
            >
              <button
                type="button"
                style={{
                  padding: "3px 8px",
                  fontSize: "11px",
                  borderRadius: "6px",
                  fontWeight: activeFilter === "all" ? 600 : 500,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeFilter === "all" ? "#ffffff" : "transparent",
                  color: activeFilter === "all" ? "#0f172a" : "#64748b",
                  boxShadow: activeFilter === "all" ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
                }}
                onClick={() => setActiveFilter("all")}
              >
                Nhân sự BU ({filterCounts.all})
              </button>
              <button
                type="button"
                style={{
                  padding: "3px 8px",
                  fontSize: "11px",
                  borderRadius: "6px",
                  fontWeight: activeFilter === "north" ? 600 : 500,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeFilter === "north" ? "#ffffff" : "transparent",
                  color: activeFilter === "north" ? "#0f172a" : "#64748b",
                  boxShadow: activeFilter === "north" ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
                }}
                onClick={() => setActiveFilter("north")}
              >
                Miền Bắc ({filterCounts.north})
              </button>
              <button
                type="button"
                style={{
                  padding: "3px 8px",
                  fontSize: "11px",
                  borderRadius: "6px",
                  fontWeight: activeFilter === "south" ? 600 : 500,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeFilter === "south" ? "#ffffff" : "transparent",
                  color: activeFilter === "south" ? "#0f172a" : "#64748b",
                  boxShadow: activeFilter === "south" ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
                }}
                onClick={() => setActiveFilter("south")}
              >
                Miền Nam ({filterCounts.south})
              </button>
              <button
                type="button"
                style={{
                  padding: "3px 8px",
                  fontSize: "11px",
                  borderRadius: "6px",
                  fontWeight: activeFilter === "warning" ? 600 : 500,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeFilter === "warning" ? "#fef3c7" : "transparent",
                  color: "#b45309",
                  boxShadow: activeFilter === "warning" ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
                }}
                onClick={() => setActiveFilter("warning")}
              >
                Cần bám sát ({filterCounts.warning})
              </button>
            </div>

            {/* Nút Bung tất cả / Thu gọn (chỉ hiển thị trên Desktop khi có cây phân cấp) */}
            {!isMobile && (
              <button
                type="button"
                style={{
                  height: "26px",
                  padding: "0 9px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#475569",
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                onClick={isAllRegionsExpanded ? handleCollapseAllRegions : handleExpandAllRegions}
              >
                {isAllRegionsExpanded ? "Thu gọn toàn bộ" : "Bung tất cả nhân sự"}
              </button>
            )}
          </div>

          {/* ==================================================================== */}
          {/* TRƯỜNG HỢP A: MOBILE CARDS (< 768px) ĐỂ TRÁNH TRÀN CUỘN NGANG HOẶC VỠ KHUNG */}
          {/* ==================================================================== */}
          {isMobile ? (
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredEmployeesForDetail.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                  Không tìm thấy nhân viên sale phù hợp
                </div>
              ) : (
                filteredEmployeesForDetail.map((emp) => {
                  const m = emp.metrics;
                  const isLeader = emp.is_leader;
                  const yearActual = Number(m?.year_actual || 0);
                  const yearTarget = Number(m?.year_target || 0);
                  const yearRate = Number(m?.year_rate || 0);
                  const monthActual = Number(m?.month_actual || 0);

                  return (
                    <div
                      key={emp.id || emp.employee_code}
                      className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                      }}
                    >
                      {/* Dòng 1: [Avatar + Tên Sale + Mã NV] bên trái, [Doanh số thực tế] bên phải */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              backgroundColor: isLeader ? "#eff6ff" : "#f1f5f9",
                              color: isLeader ? "#1d4ed8" : "#475569",
                              border: isLeader ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f172a" }}>
                                {emp.name}
                              </span>
                              {isLeader && (
                                <span style={{ fontSize: "9px", color: "#1d4ed8", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.5px 4px", borderRadius: "3px" }}>
                                  Trưởng nhóm
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "10px", color: "#64748b" }}>
                              #{emp.employee_code} • {emp.regionName}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: "12.5px", fontWeight: 700, fontFamily: "ui-monospace, monospace", color: "#0f172a" }}>
                            {formatVnd(yearActual)} đ
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
                            Tháng: {formatVndCompact(monthActual)}
                          </div>
                        </div>
                      </div>

                      {/* Dòng 2: Thanh progress bar mỏng (h-1.5) + text [Target & % đạt] */}
                      <div
                        style={{
                          width: "100%",
                          height: "4px",
                          backgroundColor: "#f1f5f9",
                          borderRadius: "9999px",
                          overflow: "hidden",
                          marginTop: "2px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${getProgressWidth(yearRate, yearTarget)}%`,
                            backgroundColor: getProgressColor(yearRate, yearTarget),
                            borderRadius: "9999px",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10.5px" }}>
                        <span style={{ color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
                          {formatPlanCompact(yearActual, yearTarget)}
                        </span>
                        {renderRatePill(yearRate, yearTarget)}
                      </div>
                    </div>
                  );
                })
              )}

              {/* KHỐI DOANH SỐ BÁN CHÉO & VÃNG LAI TRÊN MOBILE (TỰ ĐỘNG THU GỌN GỌN GÀNG) */}
              {crossSellingRegion && (activeFilter === "all" || !searchQuery) && (
                <div
                  style={{
                    marginTop: "6px",
                    backgroundColor: "#fffdf5",
                    border: "1px solid #fde68a",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    onClick={() => setMobileCrossSellingOpen((prev) => !prev)}
                    style={{
                      padding: "9px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      backgroundColor: "#fef3c7",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#92400e", whiteSpace: "nowrap" }}>
                        🔄 Bán chéo & Vãng lai
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          color: "#92400e",
                          backgroundColor: "#ffffff",
                          border: "1px solid #fde68a",
                          padding: "1px 4px",
                          borderRadius: "9999px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {crossSellingRegion.children?.length || 0} ngoài BU
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px", fontWeight: 700, color: "#92400e" }}>
                        {formatVndCompact(crossSellingRegion.metrics?.year_actual || 0)}
                      </span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                          transform: mobileCrossSellingOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s ease",
                          color: "#92400e",
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {mobileCrossSellingOpen && (
                    <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "#ffffff" }}>
                      {(crossSellingRegion.children || []).map((emp) => {
                        const m = emp.metrics;
                        return (
                          <div
                            key={emp.id || emp.employee_code}
                            style={{
                              backgroundColor: "#fffdf5",
                              border: "1px solid #fef08a",
                              borderRadius: "6px",
                              padding: "8px 10px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                                  {emp.name}
                                </span>
                                <span style={{ fontSize: "9px", color: "#b45309", backgroundColor: "#fef3c7", border: "1px solid #fde68a", padding: "0.5px 4px", borderRadius: "3px" }}>
                                  {emp.department_name ? `Bán chéo • ${emp.department_name}` : "Bán chéo"}
                                </span>
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "ui-monospace, monospace", color: "#0f172a" }}>
                                {formatVnd(m?.year_actual || 0)} đ
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px", color: "#64748b" }}>
                              <span>#{emp.employee_code}</span>
                              <span style={{ fontStyle: "italic" }}>Ngoài kế hoạch biên chế</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ==================================================================== */
            /* TRƯỜNG HỢP B: DESKTOP TABLE (>= 768px) 3 CỘT ĐẦY ĐỦ */
            /* ==================================================================== */
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table
                className="w-full text-left border-collapse"
                style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th
                      style={{
                        width: "40%",
                        padding: "8px 16px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      NHÂN VIÊN / BỘ PHẬN
                    </th>
                    <th
                      style={{
                        width: "25%",
                        padding: "8px 16px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      TIẾN ĐỘ THÁNG {currentMonthNum}
                    </th>
                    <th
                      style={{
                        width: "35%",
                        padding: "8px 16px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      TIẾN ĐỘ CẢ NĂM {currentYear}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {tree.map((buNode) => {
                    const buMetrics = buNode.metrics;
                    const regions = buNode.children || [];

                    const filteredRegions = regions.filter((regNode) => {
                      const isNorth = (regNode.region_name || regNode.name || "").includes("Bắc");
                      const isSouth = (regNode.region_name || regNode.name || "").includes("Nam");
                      if (activeFilter === "north") return isNorth;
                      if (activeFilter === "south") return isSouth;
                      return true;
                    });

                    return (
                      <React.Fragment key={buNode.id || buNode.code}>
                        {/* Hàng Tổng BU */}
                        <tr
                          style={{
                            backgroundColor: "#f8fafc",
                            borderBottom: "1px solid #cbd5e1",
                            borderTop: "1px solid #e2e8f0",
                          }}
                        >
                          <td style={{ padding: "9px 16px", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "6px",
                                  backgroundColor: "#4f46e5",
                                  color: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 13, height: 13 }}>
                                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div>
                                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>
                                  {buNode.name}
                                </span>
                                <span style={{ fontSize: "10.5px", color: "#64748b", marginLeft: "6px" }}>
                                  ({regions.length} khu vực)
                                </span>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: "9px 16px", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: "#0f172a", fontSize: "12.5px" }}>
                                  {formatVnd(buMetrics.month_actual)} đ
                                </span>
                                {renderRatePill(buMetrics.month_rate, buMetrics.month_target)}
                              </div>
                              <div style={{ width: "100%", height: "4px", backgroundColor: "#e2e8f0", borderRadius: "9999px", overflow: "hidden", marginTop: "4px" }}>
                                <div
                                  style={{
                                    width: `${getProgressWidth(buMetrics.month_rate, buMetrics.month_target)}%`,
                                    height: "100%",
                                    backgroundColor: getProgressColor(buMetrics.month_rate, buMetrics.month_target),
                                    borderRadius: "9999px",
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: "9px 16px", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                  <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: "#0f172a", fontSize: "12.5px" }}>
                                    {formatVnd(buMetrics.year_actual)} đ
                                  </span>
                                  {Number(buMetrics.year_target) > 0 && (
                                    <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
                                      / {formatVndCompact(buMetrics.year_target)}
                                    </span>
                                  )}
                                </div>
                                {renderRatePill(buMetrics.year_rate, buMetrics.year_target)}
                              </div>
                              <div style={{ width: "100%", height: "4px", backgroundColor: "#e2e8f0", borderRadius: "9999px", overflow: "hidden", marginTop: "4px" }}>
                                <div
                                  style={{
                                    width: `${getProgressWidth(buMetrics.year_rate, buMetrics.year_target)}%`,
                                    height: "100%",
                                    backgroundColor: getProgressColor(buMetrics.year_rate, buMetrics.year_target),
                                    borderRadius: "9999px",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Các hàng Miền / Khu vực */}
                        {filteredRegions.map((regNode) => {
                          const regMetrics = regNode.metrics;
                          const allEmps = regNode.children || [];
                          const isExpanded = expandedRegionIds.has(regNode.id);

                          const q = searchQuery.trim().toLowerCase();
                          const displayedEmployees = allEmps.filter((emp) => {
                            if (activeFilter === "warning") {
                              const m = emp.metrics;
                              if (!(m?.month_target > 0 && Number(m?.month_rate || 0) < 70)) return false;
                            }
                            if (q) {
                              const matchName = String(emp.name || "").toLowerCase().includes(q);
                              const matchCode = String(emp.employee_code ?? "").toLowerCase().includes(q);
                              return matchName || matchCode;
                            }
                            return true;
                          });

                          if (displayedEmployees.length === 0 && (activeFilter === "warning" || q)) return null;

                          return (
                            <React.Fragment key={regNode.id}>
                              <tr
                                style={{
                                  backgroundColor: isExpanded ? "#f8fafc" : "#ffffff",
                                  borderBottom: "1px solid #f1f5f9",
                                  cursor: "pointer",
                                }}
                                onClick={() => toggleRegion(regNode.id)}
                              >
                                <td style={{ padding: "8px 16px 8px 24px", verticalAlign: "middle" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      style={{
                                        width: "12px",
                                        height: "12px",
                                        transform: isExpanded ? "rotate(90deg)" : "none",
                                        color: isExpanded ? "#4f46e5" : "#94a3b8",
                                        transition: "transform 0.2s ease",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <path d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: regNode.is_cross_selling ? "#92400e" : "#1e293b" }}>
                                      {regNode.is_cross_selling ? `🔄 ${regNode.name}` : ((!regNode.is_cross_selling && regNode.name.startsWith("Tổng BU")) ? regNode.name.replace("Tổng BU", "Nhân sự BU") : regNode.name)}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: 500,
                                        color: regNode.is_cross_selling ? "#92400e" : "#64748b",
                                        backgroundColor: regNode.is_cross_selling ? "#fef3c7" : "#f1f5f9",
                                        border: regNode.is_cross_selling ? "1px solid #fde68a" : "none",
                                        padding: "1px 6px",
                                        borderRadius: "9999px",
                                      }}
                                    >
                                      {regNode.is_cross_selling ? `${displayedEmployees.length} nhân sự ngoài BU` : `${displayedEmployees.length} nhân sự`}
                                    </span>
                                  </div>
                                </td>

                                <td style={{ padding: "8px 16px", verticalAlign: "middle" }}>
                                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                      <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600, color: "#1e293b", fontSize: "12px" }}>
                                        {formatVnd(regMetrics.month_actual)} đ
                                      </span>
                                      {regNode.is_cross_selling ? (
                                        <span style={{ fontSize: "10.5px", color: "#94a3b8", fontStyle: "italic" }}>Ngoài KH</span>
                                      ) : (
                                        renderRatePill(regMetrics.month_rate, regMetrics.month_target)
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: "8px 16px", verticalAlign: "middle" }}>
                                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                      <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600, color: "#1e293b", fontSize: "12px" }}>
                                        {formatVnd(regMetrics.year_actual)} đ
                                      </span>
                                      {regNode.is_cross_selling ? (
                                        <span style={{ fontSize: "10.5px", color: "#94a3b8", fontStyle: "italic" }}>Ngoài KH</span>
                                      ) : (
                                        renderRatePill(regMetrics.year_rate, regMetrics.year_target)
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>

                              {/* Các dòng Sale cá nhân khi mở rộng */}
                              {isExpanded &&
                                displayedEmployees.map((emp) => {
                                  const empMetrics = emp.metrics;
                                  const isLeader = emp.is_leader;
                                  const isCross = emp.is_cross_selling || regNode.is_cross_selling;
                                  return (
                                    <tr
                                      key={emp.id || emp.employee_code}
                                      style={{ backgroundColor: isCross ? "rgba(255, 251, 235, 0.4)" : "#ffffff", borderBottom: "1px solid #f8fafc" }}
                                    >
                                      <td style={{ padding: "6px 16px 6px 44px", verticalAlign: "middle" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                          <div
                                            style={{
                                              width: "18px",
                                              height: "18px",
                                              borderRadius: "50%",
                                              backgroundColor: isLeader ? "#eff6ff" : (isCross ? "#fffbeb" : "#f1f5f9"),
                                              color: isLeader ? "#1d4ed8" : (isCross ? "#b45309" : "#475569"),
                                              border: isLeader ? "1px solid #bfdbfe" : (isCross ? "1px solid #fde68a" : "1px solid #e2e8f0"),
                                              display: "inline-flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: "9.5px",
                                              fontWeight: 700,
                                              flexShrink: 0,
                                            }}
                                          >
                                            {getInitials(emp.name)}
                                          </div>
                                          <span style={{ fontSize: "11.5px", fontWeight: 500, color: "#0f172a" }}>
                                            {emp.name}
                                          </span>
                                          {isLeader && (
                                            <span style={{ fontSize: "9px", color: "#1d4ed8", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.5px 4px", borderRadius: "3px" }}>
                                              Trưởng nhóm
                                            </span>
                                          )}
                                          {isCross && (
                                            <span style={{ fontSize: "9px", color: "#b45309", backgroundColor: "#fffbeb", border: "1px solid #fde68a", padding: "0.5px 5px", borderRadius: "3px" }}>
                                              {emp.department_name ? `Bán chéo • ${emp.department_name}` : "Bán chéo"}
                                            </span>
                                          )}
                                          <span style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "ui-monospace, monospace" }}>
                                            #{emp.employee_code}
                                          </span>
                                        </div>
                                      </td>

                                      <td style={{ padding: "6px 16px", verticalAlign: "middle" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "11.5px", color: "#1e293b" }}>
                                            {formatVnd(empMetrics.month_actual)} đ
                                          </span>
                                          {isCross ? (
                                            <span style={{ fontSize: "10px", color: "#94a3b8", fontStyle: "italic" }}>—</span>
                                          ) : (
                                            renderRatePill(empMetrics.month_rate, empMetrics.month_target)
                                          )}
                                        </div>
                                      </td>

                                      <td style={{ padding: "6px 16px", verticalAlign: "middle" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "11.5px", color: "#1e293b" }}>
                                            {formatVnd(empMetrics.year_actual)} đ
                                          </span>
                                          {isCross ? (
                                            <span style={{ fontSize: "10px", color: "#94a3b8", fontStyle: "italic", fontFamily: "ui-monospace, monospace" }}>
                                              Ngoài KH
                                            </span>
                                          ) : (
                                            renderRatePill(empMetrics.year_rate, empMetrics.year_target)
                                          )}
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
          )}
        </div>
      )}
    </div>
  );
}
