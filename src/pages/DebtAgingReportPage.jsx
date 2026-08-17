import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import UnifiedSubHeader from "../components/common/UnifiedSubHeader";
import CustomSelect from "../components/common/CustomSelect";
import AgingKpiGrid from "../components/aging/AgingKpiGrid";
import AgingCustomerCardGrid from "../components/aging/AgingCustomerCardGrid";
import AllBUsDebtOverview from "../components/aging/AllBUsDebtOverview";
import { fetchAllBUsDebtSummary, fetchBUDebtDrilldown } from "../api/agingApi";
import { mapAgingDrilldownResponse } from "../utils/agingMapper";
import { BU_CODE_MAP, FALLBACK_BU_OPTIONS, MOCK_GLOBAL_BUS_SUMMARY, normalizeBuCode, formatDateDisplay } from "../utils/agingMockData";
import { buildPdfFileName, exportElementToPdf } from "../utils/exportPdf";

export default function DebtAgingReportPage() {
  const { user, isBOD, isBuHead, allowedBUs, canAccessBu } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isStaff = !isBOD && !isBuHead;
  const staffFixedCode = user?.staffCode || user?.employeeCode || user?.ownerId || "2000996";

  const defaultBu = isBOD ? (searchParams.get("bu") || "ALL") : normalizeBuCode(searchParams.get("bu") || (allowedBUs && allowedBUs[0]));
  const [selectedBu, setSelectedBu] = useState(defaultBu);
  const [selectedStaff, setSelectedStaff] = useState(() => (isStaff ? staffFixedCode : (searchParams.get("staff") || "ALL")));
  const [reportDate, setReportDate] = useState(() => searchParams.get("date") || new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawDrilldownData, setRawDrilldownData] = useState(null);
  const [allBUsData, setAllBUsData] = useState(MOCK_GLOBAL_BUS_SUMMARY);
  const [exportingPdf, setExportingPdf] = useState(false);
  const dashRef = useRef(null);

  const period = useMemo(() => reportDate.slice(0, 7), [reportDate]);

  useEffect(() => { if (isStaff) setSelectedStaff(staffFixedCode); }, [isStaff, staffFixedCode]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const isAll = selectedBu === "ALL";
      const requests = [fetchAllBUsDebtSummary({ period, include_all: true })];
      if (!isAll) requests.push(fetchBUDebtDrilldown(selectedBu, { period }));
      const [buSummaryRes, drilldownRes] = await Promise.allSettled(requests);

      if (buSummaryRes.status === "fulfilled" && buSummaryRes.value) {
        const val = buSummaryRes.value;
        const resList = val.results || val.data || (Array.isArray(val) ? val : []);
        setAllBUsData({
          global_summary: val.global_summary || val.summary || MOCK_GLOBAL_BUS_SUMMARY.global_summary,
          results: resList.length > 0 ? resList.map((b) => ({
            code: normalizeBuCode(b.code || b.bu_code || b.id),
            name: b.name || b.bu_name || b.code,
            manager_name: b.manager_name || b.bu_head || b.head_name || "Chưa gán",
            receivable_total: b.receivable_total ?? b.total_debt,
            due_total: b.due_total ?? b.total_before_due,
            overdue_total: b.overdue_total, overdue_rate: b.overdue_rate, customer_count: b.customer_count,
          })) : MOCK_GLOBAL_BUS_SUMMARY.results,
        });
      }

      if (!isAll) {
        if (drilldownRes?.status === "fulfilled") setRawDrilldownData(drilldownRes.value);
        else throw drilldownRes?.reason;
      }
    } catch (err) {
      setError(err?.message || "Không thể kết nối máy chủ để tải dữ liệu tuổi nợ.");
      setRawDrilldownData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedBu, period]);

  const buSelectOptions = useMemo(() => {
    const rawOptions = (allBUsData.results || []).map((b) => ({ value: b.code, label: b.name }));
    const baseOptions = rawOptions.length > 0 ? rawOptions : FALLBACK_BU_OPTIONS;
    if (isBOD) return [{ value: "ALL", label: "🏢 Tất cả BU (Toàn công ty)" }, ...baseOptions];

    const filtered = baseOptions.filter((opt) => {
      const rawKey = Object.keys(BU_CODE_MAP).find((k) => BU_CODE_MAP[k] === opt.value) || opt.value;
      return canAccessBu(rawKey) || canAccessBu(opt.value);
    });
    const isLocked = filtered.length <= 1;
    return filtered.map((opt) => ({ value: opt.value, label: isLocked ? `${opt.label} 🔒` : opt.label }));
  }, [allBUsData.results, isBOD, canAccessBu]);

  const isBuLocked = !isBOD && buSelectOptions.length <= 1;
  const currentBu = useMemo(() => (allBUsData.results || []).find((b) => b.code === selectedBu), [allBUsData.results, selectedBu]);
  const effectiveStaffCode = isStaff ? staffFixedCode : selectedStaff;
  const fullBuData = useMemo(() => mapAgingDrilldownResponse(rawDrilldownData, "ALL"), [rawDrilldownData]);

  const agingData = useMemo(() => {
    let data = mapAgingDrilldownResponse(rawDrilldownData, effectiveStaffCode);
    if (isStaff && data.staffGroups.length === 0 && fullBuData.staffGroups.length > 0) {
      const matched = fullBuData.staffGroups.find((st) => st.code === staffFixedCode || st.name.toLowerCase().includes("dương") || st.name.toLowerCase().includes(user?.displayName?.toLowerCase() || "")) || fullBuData.staffGroups[0];
      if (matched) data = mapAgingDrilldownResponse(rawDrilldownData, matched.code);
    }
    return data;
  }, [rawDrilldownData, effectiveStaffCode, isStaff, staffFixedCode, fullBuData, user]);

  const staffOptions = useMemo(() => {
    if (isStaff) {
      const current = agingData.staffGroups[0];
      return [{ value: effectiveStaffCode, label: `${current?.name || "MAI TIẾN DƯƠNG"} (${current?.title || "Nhân viên kinh doanh"}) 🔒` }];
    }
    return [
      { value: "ALL", label: "Tất cả nhân sự" },
      ...fullBuData.staffGroups.map((st) => ({ value: st.code, label: `${st.name} (${st.title || st.role})` })),
    ];
  }, [isStaff, effectiveStaffCode, agingData.staffGroups, fullBuData.staffGroups]);

  const handleBuChange = (nextBu) => {
    setSelectedBu(nextBu);
    setSelectedStaff(isStaff ? staffFixedCode : "ALL");
    setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("bu", nextBu); return next; }, { replace: true });
  };

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
    <div className="dash" ref={dashRef} style={{ padding: "0 16px" }}>
      <UnifiedSubHeader
        title="Báo Cáo Tổng Hợp Tuổi Nợ"
        subtitle={pageSubtitle}
        datePickerProps={{
          mode: "single", singleDate: reportDate,
          onChangeSingleDate: (newDate) => {
            setReportDate(newDate);
            setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("date", newDate); return next; }, { replace: true });
          },
        }}
        secondaryFilter={
          <>
            <CustomSelect value={selectedBu} onChange={handleBuChange} options={buSelectOptions} disabled={isBuLocked} placeholder="Chọn BU" triggerStyle={{ height: 36, fontSize: 12, padding: "0 10px", minWidth: 200 }} />
            {selectedBu !== "ALL" && (
              <CustomSelect value={effectiveStaffCode} onChange={(val) => setSelectedStaff(val)} options={staffOptions} disabled={isStaff} placeholder="Chọn nhân sự" triggerStyle={{ height: 36, fontSize: 12, padding: "0 10px", minWidth: 220 }} />
            )}
          </>
        }
        onRefresh={() => { loadData(); toast.success("Đang làm mới dữ liệu từ máy chủ..."); }}
        onExportPdf={handleExportPdf}
        exportingPdf={exportingPdf}
      />

      {error && (
        <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#991b1b", fontSize: 12 }}>
          <span>⚠️ {error} — Đang hiển thị chế độ dự phòng.</span>
          <button type="button" className="btn" onClick={loadData} style={{ fontSize: 11, padding: "4px 10px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", cursor: "pointer", fontWeight: 700, borderRadius: 4 }}>
            Thử lại
          </button>
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
          {agingData.staffGroups.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Không có phát sinh công nợ trong kỳ này</div>
            </div>
          ) : (
            <AgingCustomerCardGrid staffGroups={agingData.staffGroups} />
          )}
        </>
      )}
    </div>
  );
}
