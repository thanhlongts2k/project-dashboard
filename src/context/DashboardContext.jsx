import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  fetchBuPerformance,
  fetchBusinessUnits,
  fetchDailyPerformance,
  fetchWarehouses,
  fetchCollectionByBu,
} from "../api/dashboardApi";
import {
  mapOverviewDashboard,
  buildOverviewSummaryColumns,
  aggregateDailyTotals,
} from "../utils/dashboardMapper";
import {
  buIdFromCode,
  mapBuDetailFromApi,
  getPreviousPeriodRange,
  formatRangeDisplay,
} from "../utils/detailMapper";
import {
  buildEmptyInventoryReport,
  mapInventoryReportFromWarehouses,
} from "../utils/inventoryMapper";
import {
  buildEmptyReceivableReport,
  mapReceivableReportFromApi,
} from "../utils/receivableMapper";
import {
  buildPdfFileName,
  exportSectionsToPdf,
  waitForRender,
} from "../utils/exportPdf";
import {
  getEmailConfig,
  isAutoSendDue,
  markAutoSent,
  parseRecipients,
} from "../utils/emailSchedule";
import { sendReportEmail } from "../api/reportMailApi";

const DashboardContext = createContext(null);

function formatReportDate(date = new Date()) {
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function formatUpdatedAt(date = new Date()) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPreviousPeriod(month, year) {
  if (month === 1) {
    return { prevMonth: 12, prevYear: year - 1 };
  }
  return { prevMonth: month - 1, prevYear: year };
}

function formatIsoDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildTabsFromMainUnits(mainUnits = []) {
  const labelMap = {
    BU_ELEVATOR: "Elevator",
    BU_IBIZ_PREMIUM: "Thiết bị điện cao cấp",
    BU_IBIZ_VALUE: "Thiết bị điện phổ thông",
    BU_ECO: "ECO",
    BU_AGRITECH: "AgriTech",
    BU_MANUFACTURING: "Sản xuất - Nhà máy",
    BU_DTCT: "Đầu tư cho thuê / ĐTCT",
    ĐTCT: "Đầu tư cho thuê / ĐTCT",
    DTCT: "Đầu tư cho thuê / ĐTCT",
    OVERSEA: "Oversea",
  };

  const toneMap = {
    elevator: "",
    ibizPremium: "amber",
    ibizValue: "red",
    eco: "green",
    agritech: "red",
    manufacturing: "",
    dtct: "teal",
    oversea: "blue",
  };

  return (Array.isArray(mainUnits) ? mainUnits : [])
    .map((item) => {
      const id = buIdFromCode(item.code);
      if (!id) return null;

      return {
        id,
        label:
          labelMap[
          String(item.code).trim().replace(/\s+/g, "_").toUpperCase()
          ] || item.name,
        tone: toneMap[id] || "",
        owner: item.manager || "",
        mainId: item.id,
        code: item.code,
      };
    })
    .filter(Boolean);
}

function buildEmptyDashboard(month, year) {
  return {
    header: {
      title: "Dashboard Tổng Quan",
      reportDate: "",
      monthLabel: `Tháng ${String(month).padStart(2, "0")}/${year}`,
      buLabel: "Tất cả BU",
      updatedAt: "",
      ownerOptions: ["Tất cả phụ trách"],
    },
    topKpis: [],
    overseaKpis: [],
    dailySeries: [],
    charts: {
      revenue: [],
      cash: [],
    },
    summaryColumns: buildOverviewSummaryColumns(month),
    summaryRows: [],
    alertColumns: [
      { key: "item", label: "BU / Chỉ tiêu" },
      { key: "percent", label: "% KH" },
      { key: "gap", label: "Gap" },
    ],
    alertRows: [],
    financeKpis: [],
    buTabs: [],
    buDetails: {},
  };
}

export function DashboardProvider({ children }) {
  const { isAuthenticated, defaultAllowedBu } = useAuth();

  const today = new Date();
  const initialMonth = today.getMonth() + 1;
  const initialYear = today.getFullYear();

  const [activeBu, setActiveBu] = useState(
    localStorage.getItem("dashboard_active_bu") || defaultAllowedBu || "elevator"
  );

  const [dashboardData, setDashboardData] = useState(() =>
    buildEmptyDashboard(initialMonth, initialYear)
  );
  const [inventoryReportData, setInventoryReportData] = useState(() =>
    buildEmptyInventoryReport(initialMonth, initialYear)
  );
  const [receivableReportData, setReceivableReportData] = useState(() =>
    buildEmptyReceivableReport(initialMonth, initialYear)
  );

  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingReceivable, setLoadingReceivable] = useState(false);

  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [loadingOverlayText, setLoadingOverlayText] = useState("Đang tải dữ liệu...");
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  const reportBusyRef = useRef(false);

  const showLoadingOverlay = (text = "Đang tải dữ liệu...") => {
    setLoadingOverlayText(text);
    setLoadingOverlay(true);
  };

  const hideLoadingOverlay = () => {
    setLoadingOverlay(false);
  };

  useEffect(() => {
    if (activeBu) {
      localStorage.setItem("dashboard_active_bu", activeBu);
    }
  }, [activeBu]);

  // Load Overview Data
  const loadOverviewData = useCallback(
    async ({ month = initialMonth, year = initialYear, startDate, endDate, showOverlay = false, overlayText = "Đang tải dữ liệu tổng quan..." } = {}) => {
      try {
        if (showOverlay) showLoadingOverlay(overlayText);
        setLoadingDashboard(true);

        const [mainUnits, subUnits] = await Promise.all([
          fetchBusinessUnits({ isMain: true }),
          fetchBusinessUnits({ isMain: false }),
        ]);

        const periodParams = startDate && endDate ? { startDate, endDate } : { month, year };

        let rootRows = [];
        try {
          const rootResult = await fetchBuPerformance({ ...periodParams, onlyRoots: true });
          rootRows = Array.isArray(rootResult) ? rootResult : [];
        } catch {
          rootRows = [];
        }

        let detailRows = [];
        try {
          const detailResult = await fetchBuPerformance({ ...periodParams, onlyRoots: false });
          detailRows = Array.isArray(detailResult) ? detailResult : [];
        } catch {
          detailRows = [];
        }

        let dailyRows = [];
        try {
          const dailyResult = await fetchDailyPerformance({ ...periodParams, onlyRoots: true });
          dailyRows = Array.isArray(dailyResult) ? dailyResult : [];
        } catch {
          dailyRows = [];
        }

        const dailyTotals = aggregateDailyTotals(dailyRows);

        const mapped = mapOverviewDashboard({
          rootRows,
          performanceRows: detailRows,
          mainUnits,
          subUnits,
          dailyRows,
          month,
          year,
          startDate,
          endDate,
          periodRevenue: dailyTotals?.totalRevenue ?? null,
          periodCollection: dailyTotals?.totalCollection ?? null,
        });

        setDashboardData((prev) => ({
          ...mapped,
          buDetails: prev?.buDetails || {},
          header: {
            ...mapped.header,
            reportDate: formatReportDate(new Date()),
            updatedAt: formatUpdatedAt(new Date()),
          },
        }));
      } catch (error) {
        console.error("Load overview error:", error);
        toast.error(error.message || "Không tải được dữ liệu tổng quan.");
      } finally {
        setLoadingDashboard(false);
        if (showOverlay) hideLoadingOverlay();
      }
    },
    [initialMonth, initialYear]
  );

  // Load Detail Data for a specific BU
  const loadDetailData = useCallback(
    async ({ buId = activeBu, month = initialMonth, year = initialYear, startDate, endDate, showOverlay = false, overlayText = "Đang tải chi tiết BU..." } = {}) => {
      try {
        if (showOverlay) showLoadingOverlay(overlayText);
        setLoadingDetail(true);

        const periodParams = startDate && endDate ? { startDate, endDate } : { month, year };

        let prevPeriodParams = {};
        if (startDate && endDate) {
          const prevRange = getPreviousPeriodRange(startDate, endDate);
          prevPeriodParams = prevRange ? { startDate: prevRange.startDate, endDate: prevRange.endDate } : { month, year };
        } else {
          const { prevMonth, prevYear } = getPreviousPeriod(month, year);
          prevPeriodParams = { month: prevMonth, year: prevYear };
        }

        const { prevMonth } = getPreviousPeriod(month, year);

        const [mainUnits, subUnits] = await Promise.all([
          fetchBusinessUnits({ isMain: true }),
          fetchBusinessUnits({ isMain: false }),
        ]);

        const tabs = buildTabsFromMainUnits(mainUnits);
        let mainUnit = (Array.isArray(mainUnits) ? mainUnits : []).find(
          (item) => buIdFromCode(item.code) === buId || buIdFromCode(item.code) === buIdFromCode(buId) || item.code === buId
        );

        // Fallback an toàn: Nếu không tìm thấy buId tương ứng (ví dụ buId không phải BU thương mại), tự động chọn BU thương mại đầu tiên
        if (!mainUnit && Array.isArray(mainUnits) && mainUnits.length > 0) {
          mainUnit = mainUnits[0];
          console.warn(`[DashboardContext] Không tìm thấy BU '${buId}'. Tự động chuyển hướng về BU '${buIdFromCode(mainUnit.code)}'.`);
        }

        if (!mainUnit) {
          setLoadingDetail(false);
          return;
        }

        let performanceRows = [];
        try {
          const result = await fetchBuPerformance({ ...periodParams, onlyRoots: false, buId: mainUnit.id });
          performanceRows = Array.isArray(result) ? result : [];
        } catch {
          performanceRows = [];
        }

        let prevPerformanceRows = [];
        try {
          const result = await fetchBuPerformance({ ...prevPeriodParams, onlyRoots: false, buId: mainUnit.id });
          prevPerformanceRows = Array.isArray(result) ? result : [];
        } catch {
          prevPerformanceRows = [];
        }

        let dailyRows = [];
        try {
          const result = await fetchDailyPerformance({ ...periodParams, buId: mainUnit.id });
          dailyRows = Array.isArray(result) ? result : [];
        } catch {
          dailyRows = [];
        }

        const mappedDetail = mapBuDetailFromApi({
          selectedBuId: buId,
          mainUnits,
          subUnits,
          performanceRows,
          prevPerformanceRows,
          dailyRows,
          month,
          year,
          prevMonth,
          startDate,
          endDate,
        });

        setDashboardData((prev) => ({
          ...prev,
          header: {
            ...(prev?.header || {}),
            reportDate: formatReportDate(new Date()),
            monthLabel: startDate && endDate
              ? `Kỳ: ${formatRangeDisplay(startDate, endDate)}`
              : `Tháng ${String(month).padStart(2, "0")}/${year}`,
            updatedAt: formatUpdatedAt(new Date()),
          },
          buTabs: tabs,
          buDetails: {
            ...(prev?.buDetails || {}),
            [buId]: mappedDetail,
          },
        }));
      } catch (error) {
        console.error("Load detail error:", error);
        toast.error(error.message || "Không tải được chi tiết BU.");
      } finally {
        setLoadingDetail(false);
        if (showOverlay) hideLoadingOverlay();
      }
    },
    [activeBu, initialMonth, initialYear]
  );

  // Load Inventory Data
  const loadInventoryReportData = useCallback(
    async ({ month = initialMonth, year = initialYear, startDate, endDate, showOverlay = false, overlayText = "Đang tải báo cáo tồn kho..." } = {}) => {
      try {
        if (showOverlay) showLoadingOverlay(overlayText);
        setLoadingInventory(true);

        const periodParams = startDate && endDate ? { startDate, endDate } : { month, year };

        let warehouseRows = [];
        try {
          const result = await fetchWarehouses(periodParams);
          warehouseRows = Array.isArray(result) ? result : (result?.results || []);
        } catch {
          warehouseRows = [];
        }

        const mapped = mapInventoryReportFromWarehouses(warehouseRows, month, year, startDate, endDate);

        setInventoryReportData({
          ...mapped,
          header: {
            ...mapped.header,
            reportDate: formatReportDate(new Date()),
            updatedAt: formatUpdatedAt(new Date()),
          },
        });
      } catch (error) {
        console.error("Load inventory error:", error);
        toast.error(error.message || "Không tải được báo cáo tồn kho.");
      } finally {
        setLoadingInventory(false);
        if (showOverlay) hideLoadingOverlay();
      }
    },
    [initialMonth, initialYear]
  );

  // Load Receivable Data
  const loadReceivableReportData = useCallback(
    async ({ date = formatIsoDate(new Date()), showOverlay = false, overlayText = "Đang tải báo cáo công nợ..." } = {}) => {
      try {
        if (showOverlay) showLoadingOverlay(overlayText);
        setLoadingReceivable(true);

        const baseDate = new Date(date);
        const month = baseDate.getMonth() + 1;
        const year = baseDate.getFullYear();

        const yesterday = new Date(baseDate);
        yesterday.setDate(baseDate.getDate() - 1);
        const tomorrow = new Date(baseDate);
        tomorrow.setDate(baseDate.getDate() + 1);

        const queryDates = {
          yesterday: formatIsoDate(yesterday),
          today: formatIsoDate(baseDate),
          tomorrow: formatIsoDate(tomorrow),
        };

        const [yesterdayPayload, todayPayload, tomorrowPayload] = await Promise.all([
          fetchCollectionByBu({ date: queryDates.yesterday }).catch(() => null),
          fetchCollectionByBu({ date: queryDates.today }).catch(() => null),
          fetchCollectionByBu({ date: queryDates.tomorrow }).catch(() => null),
        ]);

        const mapped = mapReceivableReportFromApi(
          { yesterdayPayload, todayPayload, tomorrowPayload },
          { month, year, queryDates }
        );

        setReceivableReportData({
          ...mapped,
          header: {
            ...mapped.header,
            updatedAt: formatUpdatedAt(new Date()),
          },
        });
      } catch (error) {
        console.error("Load receivable error:", error);
        toast.error(error.message || "Không tải được báo cáo công nợ.");
      } finally {
        setLoadingReceivable(false);
        if (showOverlay) hideLoadingOverlay();
      }
    },
    []
  );

  // Handle Export Full PDF
  const handleExportAllReports = useCallback(async () => {
    if (reportBusyRef.current) return;
    reportBusyRef.current = true;

    try {
      showLoadingOverlay("Đang chuẩn bị và xuất file PDF toàn bộ báo cáo...");
      const getDashElement = () => document.querySelector(".dash");
      const element = getDashElement();

      if (!element) {
        toast.error("Không tìm thấy nội dung để xuất PDF.");
        return;
      }

      const fileName = buildPdfFileName("Bao-cao-tong-hop-dashboard");
      await exportSectionsToPdf([
        {
          label: "Báo cáo tổng hợp",
          prepare: async () => {
            await waitForRender(300);
            return getDashElement();
          },
        },
      ], { fileName });

      toast.success("Xuất file PDF thành công!");
    } catch (error) {
      console.error("Export PDF error:", error);
      toast.error("Lỗi khi xuất file PDF: " + (error.message || ""));
    } finally {
      reportBusyRef.current = false;
      hideLoadingOverlay();
    }
  }, []);

  const value = useMemo(
    () => ({
      activeBu,
      setActiveBu,
      dashboardData,
      inventoryReportData,
      receivableReportData,
      loadingDashboard,
      loadingDetail,
      loadingInventory,
      loadingReceivable,
      loadingOverlay,
      loadingOverlayText,
      showLoadingOverlay,
      hideLoadingOverlay,
      showEmailConfig,
      setShowEmailConfig,
      loadOverviewData,
      loadDetailData,
      loadInventoryReportData,
      loadReceivableReportData,
      handleExportAllReports,
    }),
    [
      activeBu,
      dashboardData,
      inventoryReportData,
      receivableReportData,
      loadingDashboard,
      loadingDetail,
      loadingInventory,
      loadingReceivable,
      loadingOverlay,
      loadingOverlayText,
      showEmailConfig,
      loadOverviewData,
      loadDetailData,
      loadInventoryReportData,
      loadReceivableReportData,
      handleExportAllReports,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard phải được sử dụng bên trong <DashboardProvider />");
  }
  return context;
}
