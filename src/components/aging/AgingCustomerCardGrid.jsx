import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatPercent } from "../../utils/numberFormat";
import AgingCustomerTableView from "./AgingCustomerTableView";
import CustomerDebtDetailModal from "./CustomerDebtDetailModal";
import CustomSelect from "../common/CustomSelect";

const SORT_OPTIONS = [
  { value: "overdue_desc", label: "Quá hạn giảm dần",   icon: "⬇️" },
  { value: "total_desc",   label: "Tổng nợ giảm dần",   icon: "💰" },
  { value: "rate_desc",    label: "Tỷ lệ % quá hạn",    icon: "📊" },
  { value: "name_asc",     label: "Tên khách hàng A→Z", icon: "🔤" },
];

function formatVnd(val, isDanger = false) {
  const num = Number(val);
  if (!num || num === 0) return <span style={{ color: "#94a3b8" }}>0 đ</span>;
  return (
    <span style={{ color: isDanger ? "#dc2626" : "inherit", fontWeight: isDanger ? 700 : "inherit" }}>
      {`${num.toLocaleString("vi-VN")} đ`}
    </span>
  );
}

function RoleBadge({ role }) {
  const styles = {
    CCO: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    BU_HEAD: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
    MANAGER: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
    SALES: { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
  }[role] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };

  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}>
      {role}
    </span>
  );
}

function CustomerDebtCard({ customer: c, onSelectCustomer }) {
  const inDuePct  = c.totalDebt > 0 ? (c.totalBeforeDue / c.totalDebt) * 100 : 0;
  const overduePct = c.totalDebt > 0 ? (c.totalOverdue   / c.totalDebt) * 100 : 0;

  // Đếm số nấc hạn có phát sinh (để hiển thị trên nút)
  const activeBucketCount = [
    c.due_0_7, c.due_8_14, c.due_15_21, c.due_22_28, c.due_29_60, c.due_over_60,
    c.overdue_1_14, c.overdue_15_30, c.overdue_31_45, c.overdue_46_60,
    c.overdue_61_90, c.overdue_91_120, c.overdue_over_120,
  ].filter((v) => Number(v || 0) > 0).length;

  return (
    <div className="aging-customer-card">
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a", lineHeight: 1.3, flex: 1, minWidth: 0 }} title={c.name}>
            {c.name}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
            {c.id}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>TỔNG CÔNG NỢ</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#854d0e", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
              {formatVnd(c.totalDebt)}
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: c.overduePercent > 20 ? "#fee2e2" : "#dcfce7", color: c.overduePercent > 20 ? "#991b1b" : "#166534", border: `1px solid ${c.overduePercent > 20 ? "#fca5a5" : "#86efac"}` }}>
            {formatPercent(c.overduePercent)} quá hạn
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "8px 10px", borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: "#0369a1", fontWeight: 700, textTransform: "uppercase" }}>Trong hạn ({formatPercent(inDuePct)})</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{formatVnd(c.totalBeforeDue)}</div>
          </div>
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "8px 10px", borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: "#c2410c", fontWeight: 700, textTransform: "uppercase" }}>Quá hạn ({formatPercent(overduePct)})</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.totalOverdue > 0 ? "#dc2626" : "#c2410c", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{formatVnd(c.totalOverdue, c.totalOverdue > 0)}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 4 }}>
        <button
          type="button"
          onClick={() => onSelectCustomer?.(c)}
          style={{
            width: "100%",
            padding: "6px 10px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: 11.5,
            color: "#1e293b",
            cursor: "pointer",
            fontWeight: 700,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
          title="Xem chi tiết 13 nấc hạn"
        >
          <span>🔍</span>
          <span>Xem chi tiết nấc hạn</span>
          {activeBucketCount > 0 && (
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              padding: "1px 6px",
              borderRadius: 10,
              background: "#dbeafe",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              lineHeight: "16px",
            }}>
              {activeBucketCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AgingCustomerCardGrid({ staffGroups = [], buName = "" }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. ĐỌC URL SEARCH PARAMS
  const urlView = searchParams.get("view");
  const urlSearch = searchParams.get("search") || "";
  const urlFilter = searchParams.get("filter") || "all";
  const urlSort = searchParams.get("sort") || "overdue_desc";

  // State chế độ xem (grid | table)
  const viewMode = urlView === "table" ? "table" : "grid";

  // State bộ lọc (all | due | overdue | large)
  const filterMode = useMemo(() => {
    if (urlFilter === "due") return "IN_DUE";
    if (urlFilter === "overdue") return "OVERDUE";
    if (urlFilter === "large") return "HIGH_DEBT";
    return "ALL";
  }, [urlFilter]);

  // State sắp xếp
  const sortBy = useMemo(() => {
    if (["overdue_desc", "total_desc", "rate_desc", "name_asc"].includes(urlSort)) {
      return urlSort;
    }
    return "overdue_desc";
  }, [urlSort]);

  // State tìm kiếm nội bộ (Debounce khi update lên URL)
  const [searchInput, setSearchInput] = useState(urlSearch);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) {
          next.set("search", trimmed);
        } else {
          next.delete("search");
        }
        return next;
      }, { replace: true });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  // 2. MẶC ĐỊNH THU GỌN TOÀN BỘ ACCORDION NHÂN SỰ KHI LOAD TRANG
  const [expandedStaff, setExpandedStaff] = useState({});

  const toggleStaff = (id) => setExpandedStaff((p) => ({ ...p, [id]: !p[id] }));
  const expandAll = () => setExpandedStaff(staffGroups.reduce((acc, st) => ({ ...acc, [st.code || st.id]: true }), {}));
  const collapseAll = () => setExpandedStaff({});
  const allExpanded = staffGroups.length > 0 && staffGroups.every((st) => expandedStaff[st.code || st.id]);

  // 3. STATE MODAL XEM CHI TIẾT KHÁCH HÀNG
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState(null);

  // Trích xuất danh sách khách hàng phẳng kèm thông tin nhân sự
  const allFlatCustomers = useMemo(() => {
    const list = [];
    staffGroups.forEach((st) => {
      (st.customers || []).forEach((c) => {
        list.push({
          ...c,
          staffCode: st.code,
          staffName: st.name,
          staffTitle: st.title,
          staffRole: st.role,
        });
      });
    });
    return list;
  }, [staffGroups]);

  // Thống kê số lượng cho các Filter Chips
  const filterCounts = useMemo(() => {
    const total = allFlatCustomers.length;
    const inDue = allFlatCustomers.filter((c) => (c.totalBeforeDue || 0) > 0 && (c.totalOverdue || 0) === 0).length;
    const overdue = allFlatCustomers.filter((c) => (c.totalOverdue || 0) > 0).length;
    const highDebt = allFlatCustomers.filter((c) => (c.totalDebt || 0) >= 500_000_000).length;
    return { total, inDue, overdue, highDebt };
  }, [allFlatCustomers]);

  // Lọc và sắp xếp danh sách khách hàng
  const processedStaffGroups = useMemo(() => {
    const term = urlSearch.trim().toLowerCase();

    return staffGroups
      .map((st) => {
        let filteredCustomers = (st.customers || []).map((c) => ({
          ...c,
          staffCode: st.code,
          staffName: st.name,
          staffTitle: st.title,
          staffRole: st.role,
        }));

        // 1. Lọc theo ô tìm kiếm
        if (term) {
          filteredCustomers = filteredCustomers.filter(
            (c) =>
              (c.name && c.name.toLowerCase().includes(term)) ||
              (c.id && c.id.toLowerCase().includes(term)) ||
              (st.name && st.name.toLowerCase().includes(term))
          );
        }

        // 2. Lọc theo Filter Chips
        if (filterMode === "IN_DUE") {
          filteredCustomers = filteredCustomers.filter((c) => (c.totalBeforeDue || 0) > 0 && (c.totalOverdue || 0) === 0);
        } else if (filterMode === "OVERDUE") {
          filteredCustomers = filteredCustomers.filter((c) => (c.totalOverdue || 0) > 0);
        } else if (filterMode === "HIGH_DEBT") {
          filteredCustomers = filteredCustomers.filter((c) => (c.totalDebt || 0) >= 500_000_000);
        }

        // 3. Sắp xếp danh sách khách hàng
        filteredCustomers.sort((a, b) => {
          if (sortBy === "overdue_desc") return (b.totalOverdue || 0) - (a.totalOverdue || 0);
          if (sortBy === "total_desc") return (b.totalDebt || 0) - (a.totalDebt || 0);
          if (sortBy === "rate_desc") return (b.overduePercent || 0) - (a.overduePercent || 0);
          if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "", "vi");
          return 0;
        });

        const totalBeforeDue = filteredCustomers.reduce((sum, c) => sum + c.totalBeforeDue, 0);
        const totalOverdue = filteredCustomers.reduce((sum, c) => sum + c.totalOverdue, 0);
        const totalDebt = filteredCustomers.reduce((sum, c) => sum + c.totalDebt, 0);
        const overduePercent = totalDebt > 0 ? (totalOverdue / totalDebt) * 100 : 0;

        return {
          ...st,
          customers: filteredCustomers,
          customerCount: filteredCustomers.length,
          totalBeforeDue,
          totalOverdue,
          totalDebt,
          overduePercent,
        };
      })
      .filter((st) => st.customers.length > 0);
  }, [staffGroups, urlSearch, filterMode, sortBy]);

  // Toàn bộ khách hàng đã được lọc và sắp xếp (dành cho chế độ Table View)
  const filteredFlatCustomers = useMemo(() => {
    return processedStaffGroups.flatMap((st) => st.customers);
  }, [processedStaffGroups]);

  // HANDLERS CẬP NHẬT URL QUERY PARAMS
  const handleSetViewMode = (mode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (mode === "table") {
        next.set("view", "table");
      } else {
        next.delete("view");
      }
      return next;
    }, { replace: true });
  };

  const handleSetFilterMode = (mode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const paramMap = {
        IN_DUE: "due",
        OVERDUE: "overdue",
        HIGH_DEBT: "large",
        ALL: null,
      };
      const val = paramMap[mode];
      if (val) {
        next.set("filter", val);
      } else {
        next.delete("filter");
      }
      return next;
    }, { replace: true });
  };

  const handleSetSortBy = (sortKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (sortKey && sortKey !== "overdue_desc") {
        next.set("sort", sortKey);
      } else {
        next.delete("sort");
      }
      return next;
    }, { replace: true });
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {/* HEADER SECTION: TIÊU ĐỀ & THANH ĐIỀU KHIỂN CHÍNH */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-card, #e2e8f0)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-main, #0f172a)" }}>
              Danh Sách Công Nợ Khách Hàng
            </div>
            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
              Hiển thị {filteredFlatCustomers.length} / {allFlatCustomers.length} khách hàng
            </div>
          </div>

          {/* VIEW MODE SWITCHER & EXPAND ALL */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="aging-view-switcher" style={{ display: "inline-flex", background: "#f1f5f9", padding: 3, borderRadius: 8, border: "1px solid #cbd5e1" }}>
              <button
                type="button"
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => handleSetViewMode("grid")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "grid" ? "#ffffff" : "transparent",
                  color: viewMode === "grid" ? "var(--color-primary, #185fa5)" : "#64748b",
                  boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>🔲</span>
                <span>Dạng Thẻ</span>
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => handleSetViewMode("table")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "table" ? "#ffffff" : "transparent",
                  color: viewMode === "table" ? "var(--color-primary, #185fa5)" : "#64748b",
                  boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>📋</span>
                <span>Dạng Bảng</span>
              </button>
            </div>

            {viewMode === "grid" && (
              <button
                type="button"
                className="btn touch-target"
                onClick={allExpanded ? collapseAll : expandAll}
                style={{ fontSize: 11.5, padding: "6px 12px", borderRadius: 6, background: "#f8fafc", border: "1px solid #cbd5e1", cursor: "pointer", fontWeight: 600 }}
              >
                {allExpanded ? "▶ Thu gọn tất cả" : "▼ Mở tất cả"}
              </button>
            )}
          </div>
        </div>

        {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC NHANH (RESPONSIVE TOOLBAR) */}
        <div className="aging-toolbar-container">
          {/* Ô SEARCH REALTIME */}
          <div className="aging-search-box" style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, pointerEvents: "none" }}>
              🔍
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên hoặc mã khách hàng..."
              style={{
                width: "100%",
                height: 34,
                padding: "0 28px 0 30px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 2,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTER CHIPS (VUỐT CUỘN NGANG CHỐNG BỂ TRÊN MOBILE) */}
          <div className="aging-filter-chips-row">
            {/* TẤT CẢ */}
            <button
              type="button"
              className={`filter-chip ${filterMode === "ALL" ? "active" : ""}`}
              onClick={() => handleSetFilterMode("ALL")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
                border: filterMode === "ALL" ? "1px solid var(--color-primary, #185fa5)" : "1px solid #cbd5e1",
                background: filterMode === "ALL" ? "var(--color-primary, #185fa5)" : "#ffffff",
                color: filterMode === "ALL" ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              <span>Tất cả</span>
              <span
                style={{
                  fontSize: 10,
                  background: filterMode === "ALL" ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: filterMode === "ALL" ? "#ffffff" : "#475569",
                  padding: "1px 6px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {filterCounts.total}
              </span>
            </button>

            {/* TRONG HẠN */}
            <button
              type="button"
              className={`filter-chip ${filterMode === "IN_DUE" ? "active" : ""}`}
              onClick={() => handleSetFilterMode("IN_DUE")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
                border: filterMode === "IN_DUE" ? "1px solid #059669" : "1px solid #a7f3d0",
                background: filterMode === "IN_DUE" ? "#059669" : "#ecfdf5",
                color: filterMode === "IN_DUE" ? "#ffffff" : "#047857",
                transition: "all 0.15s ease",
              }}
            >
              <span>🟢 Trong hạn</span>
              <span
                style={{
                  fontSize: 10,
                  background: filterMode === "IN_DUE" ? "rgba(255,255,255,0.25)" : "#d1fae5",
                  color: filterMode === "IN_DUE" ? "#ffffff" : "#065f46",
                  padding: "1px 6px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {filterCounts.inDue}
              </span>
            </button>

            {/* QUÁ HẠN */}
            <button
              type="button"
              className={`filter-chip ${filterMode === "OVERDUE" ? "active" : ""}`}
              onClick={() => handleSetFilterMode("OVERDUE")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
                border: filterMode === "OVERDUE" ? "1px solid #dc2626" : "1px solid #fecaca",
                background: filterMode === "OVERDUE" ? "#dc2626" : "#fef2f2",
                color: filterMode === "OVERDUE" ? "#ffffff" : "#b91c1c",
                transition: "all 0.15s ease",
              }}
            >
              <span>⚠️ Quá hạn</span>
              <span
                style={{
                  fontSize: 10,
                  background: filterMode === "OVERDUE" ? "rgba(255,255,255,0.25)" : "#fee2e2",
                  color: filterMode === "OVERDUE" ? "#ffffff" : "#991b1b",
                  padding: "1px 6px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {filterCounts.overdue}
              </span>
            </button>

            {/* NỢ LỚN > 500TR */}
            <button
              type="button"
              className={`filter-chip ${filterMode === "HIGH_DEBT" ? "active" : ""}`}
              onClick={() => handleSetFilterMode("HIGH_DEBT")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
                border: filterMode === "HIGH_DEBT" ? "1px solid #d97706" : "1px solid #fde68a",
                background: filterMode === "HIGH_DEBT" ? "#d97706" : "#fefce8",
                color: filterMode === "HIGH_DEBT" ? "#ffffff" : "#854d0e",
                transition: "all 0.15s ease",
              }}
            >
              <span>💎 Nợ lớn &gt; 500Tr</span>
              <span
                style={{
                  fontSize: 10,
                  background: filterMode === "HIGH_DEBT" ? "rgba(255,255,255,0.25)" : "#fef08a",
                  color: filterMode === "HIGH_DEBT" ? "#ffffff" : "#713f12",
                  padding: "1px 6px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {filterCounts.highDebt}
              </span>
            </button>
          </div>

          {/* SẮP XẼP */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>Sắp xếp:</span>
            <CustomSelect
              value={sortBy}
              onChange={handleSetSortBy}
              options={SORT_OPTIONS}
              align="right"
              triggerStyle={{ height: 34, fontSize: 11.5, borderRadius: 6 }}
            />
          </div>
        </div>
      </div>

      {/* CONTENT BODY: CHẾ ĐỘ CARD GRID HOẶC CHẾ ĐỘ TABLE */}
      <div style={{ padding: "14px 16px" }}>
        {filteredFlatCustomers.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#334155" }}>
              Không tìm thấy khách hàng nào phù hợp
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: "#94a3b8" }}>
              Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc [Tất cả]
            </div>
            {(searchInput || filterMode !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  handleSetFilterMode("ALL");
                }}
                style={{
                  marginTop: 12,
                  padding: "6px 14px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 6,
                  color: "#1d4ed8",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          <AgingCustomerTableView
            customers={filteredFlatCustomers}
            onSelectCustomer={(c) => setSelectedCustomerForDetail(c)}
          />
        ) : (
          <div>
            {processedStaffGroups.map((st) => {
              const staffKey = st.code || st.id;
              const isOpen = !!expandedStaff[staffKey];
              const isDanger = st.overduePercent > 20;

              return (
                <div key={staffKey} style={{ marginBottom: 14, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#f8fafc" }}>
                  <div
                    onClick={() => toggleStaff(staffKey)}
                    style={{
                      padding: "10px 14px",
                      background: "#f8fafc",
                      cursor: "pointer",
                      borderLeft: "4px solid var(--color-primary, #185fa5)",
                      borderBottom: isOpen ? "1px solid #e2e8f0" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#64748b", fontSize: 13 }}>{isOpen ? "▼" : "▶"}</span>
                      <strong style={{ color: "#0f172a", fontSize: 13.5 }}>{st.code} — {st.name}</strong>
                      <RoleBadge role={st.role} />
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>({st.customerCount} KH)</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, flexWrap: "wrap" }}>
                      <span>Trong hạn: <strong style={{ color: "#0369a1" }}>{formatVnd(st.totalBeforeDue)}</strong></span>
                      <span>Quá hạn: <strong style={{ color: isDanger ? "#dc2626" : "#c2410c" }}>{formatVnd(st.totalOverdue)}</strong></span>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: isDanger ? "#fee2e2" : "#dcfce7", color: isDanger ? "#991b1b" : "#166534", fontWeight: 700 }}>
                        {formatPercent(st.overduePercent)}
                      </span>
                      <span>Tổng nợ: <strong style={{ color: "#854d0e", fontSize: 13.5 }}>{formatVnd(st.totalDebt)}</strong></span>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: "12px", background: "#f1f5f9" }}>
                      <div className="aging-customer-card-grid">
                        {st.customers.map((c) => (
                          <CustomerDebtCard
                            key={c.id}
                            customer={c}
                            onSelectCustomer={(cust) => setSelectedCustomerForDetail(cust)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POPUP MODAL XEM CHI TIẾT CÔNG NỢ KHÁCH HÀNG */}
      <CustomerDebtDetailModal
        isOpen={!!selectedCustomerForDetail}
        customer={selectedCustomerForDetail}
        buName={buName}
        onClose={() => setSelectedCustomerForDetail(null)}
      />
    </div>
  );
}
