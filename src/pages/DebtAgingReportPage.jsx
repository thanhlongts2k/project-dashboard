import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import UnifiedSubHeader from "../components/common/UnifiedSubHeader";
import CustomSelect from "../components/common/CustomSelect";
import AgingKpiGrid from "../components/aging/AgingKpiGrid";
import AgingDistributionBar from "../components/aging/AgingDistributionBar";
import AgingCustomerCardGrid from "../components/aging/AgingCustomerCardGrid";
import AllBUsDebtOverview from "../components/aging/AllBUsDebtOverview";
import { fetchAllBUsDebtSummary, fetchBUDebtDrilldown } from "../api/agingApi";
import { mapAgingDrilldownResponse } from "../utils/agingMapper";
import { BU_CODE_MAP, FALLBACK_BU_OPTIONS, normalizeBuCode, formatDateDisplay } from "../utils/agingMockData";
import { buildPdfFileName, exportElementToPdf } from "../utils/exportPdf";
import { getDefaultReportingDate, formatIsoDate } from "../hooks/useDashboardFilters";

export default function DebtAgingReportPage() {
  const { user, isBOD, userBuCode, employeeCode, allowedBUs, canAccessBu, getRoleInCurrentBu } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const staffFixedCode = employeeCode || user?.employee_code || user?.staffCode || "2000996";
  const userFixedBu = useMemo(() => {
    // 1. Tìm BU thương mại hợp lệ đầu tiên trong allowedBUs / assigned_bus (loại trừ HPC / ALL)
    const validAllowedBu = (allowedBUs || []).find((b) => {
      const norm = normalizeBuCode(b);
      return norm && norm !== "HPC" && norm !== "ALL";
    });
    if (validAllowedBu) return normalizeBuCode(validAllowedBu);

    // 2. Tìm theo userBuCode nếu không phải HPC
    if (userBuCode && normalizeBuCode(userBuCode) !== "HPC") {
      return normalizeBuCode(userBuCode);
    }
    return "BU_ELEVATOR";
  }, [allowedBUs, userBuCode]);

  const urlPeriod = searchParams.get("period");
  const urlDate = searchParams.get("date");
  const urlBu = searchParams.get("bu");
  const urlEmployee = searchParams.get("employee") || searchParams.get("staff");

  const reportDate = useMemo(
    () => urlDate || (urlPeriod ? `${urlPeriod}-01` : formatIsoDate(getDefaultReportingDate())),
    [urlDate, urlPeriod]
  );
  const period = useMemo(() => urlPeriod || reportDate.slice(0, 7), [urlPeriod, reportDate]);

  const selectedBu = useMemo(() => {
    if (isBOD) {
      if (!urlBu || urlBu === "ALL") return "ALL";
      return normalizeBuCode(urlBu);
    }
    if (urlBu && urlBu !== "ALL" && urlBu !== "HPC") {
      const normUrl = normalizeBuCode(urlBu);
      if (canAccessBu(normUrl)) return normUrl;
    }
    return userFixedBu;
  }, [urlBu, isBOD, canAccessBu, userFixedBu]);

  // Xác định vai trò cụ thể tại BU đang chọn: nếu là BU_HEAD thì mở toàn quyền chọn nhân sự, nếu là SALES thì khóa theo mã cá nhân
  const currentBuRole = useMemo(() => getRoleInCurrentBu(selectedBu), [getRoleInCurrentBu, selectedBu]);
  const isStaffInCurrentBu = !isBOD && currentBuRole !== "BU_HEAD";

  const selectedStaff = useMemo(() => {
    if (isStaffInCurrentBu) return staffFixedCode;
    return urlEmployee && urlEmployee !== "ALL" ? urlEmployee : "ALL";
  }, [isStaffInCurrentBu, staffFixedCode, urlEmployee]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawDrilldownData, setRawDrilldownData] = useState(null);
  const [allBUsData, setAllBUsData] = useState({ global_summary: null, results: [] });
  const [exportingPdf, setExportingPdf] = useState(false);
  const dashRef = useRef(null);

  const updateUrlParams = useCallback((updates = {}) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "" || v === "ALL") {
          next.delete(k);
          if (k === "employee") next.delete("staff");
        } else {
          next.set(k, String(v));
        }
      });
      return next;
    }, { replace: false });
  }, [setSearchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isAll = selectedBu === "ALL";
      const requests = [fetchAllBUsDebtSummary({ period })];
      if (!isAll) requests.push(fetchBUDebtDrilldown(selectedBu, { period, employee: selectedStaff }));
      const [buSummaryRes, drilldownRes] = await Promise.allSettled(requests);

      if (buSummaryRes.status === "fulfilled" && buSummaryRes.value) {
        const val = buSummaryRes.value;
        const resList = val.bus || val.results || val.data || (Array.isArray(val) ? val : []);
        setAllBUsData({
          global_summary: val.global_summary || val.summary || {},
          results: resList.map((b) => ({
            id: b.id, code: normalizeBuCode(b.code || b.bu_code || b.id), name: b.name || b.bu_name || b.code,
            manager_name: b.manager_name || b.bu_head || b.head_name || "Chưa gán",
            receivable_total: Number(b.receivable_total ?? b.total_debt ?? 0),
            due_total: Number(b.due_total ?? b.total_before_due ?? 0),
            overdue_total: Number(b.overdue_total ?? 0), overdue_rate: Number(b.overdue_rate ?? 0), customer_count: b.customer_count,
          })),
        });
      }

      if (!isAll) {
        if (drilldownRes?.status === "fulfilled") setRawDrilldownData(drilldownRes.value);
        else throw drilldownRes?.reason;
      }
    } catch (err) {
      setError(err?.message || "Không thể kết nối máy chủ để tải dữ liệu tuổi nợ.");
      setRawDrilldownData(null);
    } finally { setLoading(false); }
  }, [selectedBu, selectedStaff, period]);

  useEffect(() => { loadData(); }, [loadData]);

  const buSelectOptions = useMemo(() => {
    const rawOptions = (allBUsData.results || []).map((b) => ({
      value: b.code,
      label: b.code && b.name && b.code !== b.name ? `[${b.code}] ${b.name}` : (b.name || b.code),
    }));
    const baseOptions = rawOptions.length > 0 ? rawOptions : FALLBACK_BU_OPTIONS;
    if (isBOD) return [{ value: "ALL", label: "🏢 Tất cả BU (Toàn công ty)" }, ...baseOptions];

    const filtered = baseOptions.filter((opt) => {
      if (opt.value === "HPC" || opt.value === "ALL") return false;
      const rawKey = Object.keys(BU_CODE_MAP).find((k) => BU_CODE_MAP[k] === opt.value) || opt.value;
      return canAccessBu(rawKey) || canAccessBu(opt.value) || opt.value === userFixedBu;
    });
    return filtered.map((opt) => ({ value: opt.value, label: `${opt.label} 🔒` }));
  }, [allBUsData.results, isBOD, canAccessBu, userFixedBu]);

  // Cho phép chuyển đổi nếu nhân sự có từ 2 BU trở lên, khóa nếu chỉ có 1 BU
  const isBuLocked = !isBOD && buSelectOptions.length <= 1;
  const currentBu = useMemo(() => (allBUsData.results || []).find((b) => b.code === selectedBu), [allBUsData.results, selectedBu]);
  const fullBuData = useMemo(() => mapAgingDrilldownResponse(rawDrilldownData, "ALL"), [rawDrilldownData]);

  const agingData = useMemo(() => {
    return mapAgingDrilldownResponse(rawDrilldownData, selectedStaff);
  }, [rawDrilldownData, selectedStaff]);

  const staffOptions = useMemo(() => {
    if (isStaffInCurrentBu) {
      const current = agingData.staffGroups[0];
      const staffName = user?.full_name || user?.displayName || current?.name || "Nhân viên";
      return [{ value: staffFixedCode, label: `👤 ${staffName} (${staffFixedCode}) 🔒` }];
    }
    return [{ value: "ALL", label: "Tất cả nhân sự" }, ...fullBuData.staffGroups.map((st) => ({ value: st.code, label: `${st.name} (${st.title || st.role})` }))];
  }, [isStaffInCurrentBu, staffFixedCode, agingData.staffGroups, fullBuData.staffGroups, user]);

  const handleBuChange = (nextBu) => updateUrlParams({ bu: nextBu === "ALL" ? null : nextBu, employee: null, period });
  const handleStaffChange = (nextStaff) => updateUrlParams({ bu: selectedBu, employee: nextStaff === "ALL" ? null : nextStaff, period });

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    try {
      setExportingPdf(true);
      await exportElementToPdf(dashRef.current, buildPdfFileName("bao-cao-tuoi-no", formatDateDisplay(reportDate)));
      toast.success("Đã tải báo cáo PDF Tuổi nợ.");
    } catch (err) { toast.error(err.message || "Không xuất được PDF."); }
    finally { setExportingPdf(false); }
  };

  const pageSubtitle = selectedBu === "ALL"
    ? `Ngày báo cáo: ${formatDateDisplay(reportDate)} (Kỳ ${period}) | Toàn công ty (Tất cả BU)`
    : `Ngày báo cáo: ${formatDateDisplay(reportDate)} (Kỳ ${period}) | ${currentBu?.name || agingData.buInfo?.name || selectedBu} | Trưởng BU: ${currentBu?.manager_name || "Chưa gán"}`;

  return (
    <div className="dash" ref={dashRef}>
      <UnifiedSubHeader
        title="Báo Cáo Tổng Hợp Tuổi Nợ" subtitle={pageSubtitle}
        datePickerProps={{
          mode: "single", singleDate: reportDate,
          onChangeSingleDate: (newDate) => updateUrlParams({ date: newDate, period: newDate.slice(0, 7), bu: selectedBu === "ALL" ? null : selectedBu, employee: selectedStaff === "ALL" ? null : selectedStaff }),
        }}
        secondaryFilter={
          <>
            <CustomSelect value={selectedBu} onChange={handleBuChange} options={buSelectOptions} disabled={isBuLocked} placeholder="Chọn BU" triggerStyle={{ fontSize: 13, minWidth: 180 }} />
            {selectedBu !== "ALL" && (
              <CustomSelect value={selectedStaff} onChange={handleStaffChange} options={staffOptions} disabled={isStaffInCurrentBu} placeholder="Chọn nhân sự" triggerStyle={{ fontSize: 13, minWidth: 200 }} />
            )}
          </>
        }
        onRefresh={() => { loadData(); toast.success("Đang làm mới dữ liệu từ máy chủ..."); }}
        onExportPdf={handleExportPdf} exportingPdf={exportingPdf}
      />

      {error && (
        <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#991b1b", fontSize: 12 }}>
          <span>⚠️ {error} — Đang hiển thị chế độ dự phòng.</span>
          <button type="button" className="btn" onClick={loadData} style={{ fontSize: 11, padding: "4px 10px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", cursor: "pointer", fontWeight: 700, borderRadius: 4 }}>Thử lại</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
          <div className="spinner" style={{ margin: "0 auto 12px", width: 28, height: 28, border: "3px solid #e2e8f0", borderTopColor: "var(--color-primary, #185fa5)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>Đang kết nối và tải dữ liệu tuổi nợ...</div>
        </div>
      ) : selectedBu === "ALL" ? (
        <AllBUsDebtOverview globalSummary={allBUsData.global_summary} buList={allBUsData.results} onSelectBU={handleBuChange} />
      ) : (
        <>
          <AgingKpiGrid kpiCards={agingData.kpiCards} buName={currentBu?.name || agingData.buInfo?.name || selectedBu} />
          <AgingDistributionBar
            staffGroups={agingData.staffGroups}
            grandTotals={agingData.grandTotals}
            buName={currentBu?.name || agingData.buInfo?.name || selectedBu}
          />
          {agingData.staffGroups.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Không có phát sinh công nợ trong kỳ này</div>
            </div>
          ) : (
            <AgingCustomerCardGrid
              staffGroups={agingData.staffGroups}
              buName={currentBu?.name || agingData.buInfo?.name || selectedBu}
            />
          )}
        </>
      )}
    </div>
  );
}
