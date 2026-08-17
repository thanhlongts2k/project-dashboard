import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

import LoginPage from "./pages/LoginPage";
import DashboardOverviewPage from "./pages/DashboardOverviewPage";
import DashboardBuDetailPage from "./pages/DashboardBuDetailPage";
import InventoryReportPage from "./pages/InventoryReportPage";
import ReceivableReportPage from "./pages/ReceivableReportPage";

import { clearAuth, getAuthStorage, isTokenExpired } from "./utils/auth";
import {
  fetchBuPerformance,
  fetchBusinessUnits,
  fetchDailyPerformance,
  fetchWarehouses,
  fetchCollectionByBu,
} from "./api/dashboardApi";
import {
  mapOverviewDashboard,
  buildOverviewSummaryColumns,
  aggregateDailyTotals,
} from "./utils/dashboardMapper";
import { buIdFromCode, mapBuDetailFromApi, getPreviousPeriodRange, formatRangeDisplay } from "./utils/detailMapper";
import {
  buildEmptyInventoryReport,
  mapInventoryReportFromWarehouses,
} from "./utils/inventoryMapper";
import {
  buildEmptyReceivableReport,
  mapReceivableReportFromApi,
} from "./utils/receivableMapper";
import {
  buildPdfFileName,
  exportSectionsToPdf,
  waitForRender,
} from "./utils/exportPdf";
import {
  getEmailConfig,
  isAutoSendDue,
  markAutoSent,
  parseRecipients,
} from "./utils/emailSchedule";
import { sendReportEmail } from "./api/reportMailApi";

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

function buildReceivableQueryDates() {
  const base = new Date();

  const yesterday = new Date(base);
  yesterday.setDate(base.getDate() - 1);

  const tomorrow = new Date(base);
  tomorrow.setDate(base.getDate() + 1);

  return {
    yesterday: formatIsoDate(yesterday),
    today: formatIsoDate(base),
    tomorrow: formatIsoDate(tomorrow),
  };
}

function buildMonthBoundRange(month, year) {
  const from = new Date(year, month - 1, 1);
  from.setHours(0, 0, 0, 0);

  const to = new Date(year, month, 0);
  to.setHours(23, 59, 59, 999);

  return {
    startDate: formatIsoDate(from),
    endDate: formatIsoDate(to),
  };
}

// Always re-compute the exact date range for time-relative presets from the current time.
// This prevents "yesterday" from showing stale dates when the stored filter is from a previous session.
function recomputePresetRange(preset) {
  const now = new Date();

  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function endOfDay(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

  switch (preset) {
    case "yesterday": {
      const y = addDays(now, -1);
      return { startDate: formatIsoDate(startOfDay(y)), endDate: formatIsoDate(endOfDay(y)) };
    }
    case "today":
      return { startDate: formatIsoDate(startOfDay(now)), endDate: formatIsoDate(endOfDay(now)) };
    case "thisWeek": {
      const d = startOfDay(now);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const weekStart = addDays(d, diff);
      const weekEnd = addDays(weekStart, 6);
      return { startDate: formatIsoDate(weekStart), endDate: formatIsoDate(endOfDay(weekEnd)) };
    }
    case "thisMonth": {
      // "Tháng này" = từ đầu tháng tới ngày hiện tại (month-to-date),
      // không lấy tới cuối tháng vì các ngày sau hôm nay chưa có số liệu.
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatIsoDate(startOfDay(monthStart)), endDate: formatIsoDate(endOfDay(now)) };
    }
    default:
      return null; // custom range — keep stored dates
  }
}

function buildTabsFromMainUnits(mainUnits = []) {
  const labelMap = {
    BU_ELEVATOR: "Elevator",
    BU_IBIZ_PREMIUM: "Thiết bị điện cao cấp",
    BU_IBIZ_VALUE: "Thiết bị điện phổ thông",
    BU_ECO: "ECO",
    BU_AGRITECH: "AgriTech",
    BU_MANUFACTURING: "Sản xuất - Nhà máy",
  };

  const toneMap = {
    elevator: "",
    ibizPremium: "amber",
    ibizValue: "red",
    eco: "green",
    agritech: "red",
    manufacturing: "",
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

export default function App() {
  const today = new Date();
  const initialMonth =
    Number(localStorage.getItem("dashboard_month")) || today.getMonth() + 1;
  const initialYear =
    Number(localStorage.getItem("dashboard_year")) || today.getFullYear();

  const [view, setView] = useState("login");
  const [currentUser, setCurrentUser] = useState("");
  const [activeBu, setActiveBu] = useState(
    localStorage.getItem("dashboard_active_bu") || "elevator"
  );

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const [overviewFilter, setOverviewFilter] = useState({
    ...recomputePresetRange("thisMonth"),
    preset: "thisMonth",
    owner: "",
  });

  const [dashboardData, setDashboardData] = useState(
    buildEmptyDashboard(initialMonth, initialYear)
  );
  const [inventoryReportData, setInventoryReportData] = useState(
    buildEmptyInventoryReport(initialMonth, initialYear)
  );
  const [receivableReportData, setReceivableReportData] = useState(
    buildEmptyReceivableReport(initialMonth, initialYear)
  );

  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingReceivable, setLoadingReceivable] = useState(false);
  const [receivableSelectedDate, setReceivableSelectedDate] = useState(
    formatIsoDate(new Date())
  );
  const [detailFilter, setDetailFilter] = useState({
    ...recomputePresetRange("thisMonth"),
    preset: "thisMonth",
  });
  const [inventoryFilter, setInventoryFilter] = useState({
    ...recomputePresetRange("today"),
    preset: "today",
  });
  const [bootstrapping, setBootstrapping] = useState(true);

  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [loadingOverlayText, setLoadingOverlayText] = useState(
    "Đang tải dữ liệu..."
  );

  const skipNextOverviewEffectRef = useRef(false);
  const skipNextDetailEffectRef = useRef(false);
  const reportBusyRef = useRef(false);

  const showLoadingOverlay = (text = "Đang tải dữ liệu...") => {
    setLoadingOverlayText(text);
    setLoadingOverlay(true);
  };

  const hideLoadingOverlay = () => {
    setLoadingOverlay(false);
  };

  useEffect(() => {
    localStorage.setItem("dashboard_active_bu", activeBu);
  }, [activeBu]);

  useEffect(() => {
    localStorage.setItem("dashboard_month", String(selectedMonth));
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem("dashboard_year", String(selectedYear));
  }, [selectedYear]);

  const loadOverviewData = async (
    month = selectedMonth,
    year = selectedYear,
    options = {}
  ) => {
    const {
      showOverlay = false,
      overlayText = "Đang tải dữ liệu tổng quan...",
      startDate: optStartDate = overviewFilter.startDate,
      endDate: optEndDate = overviewFilter.endDate,
      preset: optPreset = overviewFilter.preset,
    } = options;

    // Always recompute fresh dates for time-relative presets
    const freshRange = recomputePresetRange(optPreset);
    const startDate = freshRange?.startDate ?? optStartDate;
    const endDate = freshRange?.endDate ?? optEndDate;

    try {
      if (showOverlay) {
        showLoadingOverlay(overlayText);
      }

      setLoadingDashboard(true);

      const [mainUnits, subUnits] = await Promise.all([
        fetchBusinessUnits({ isMain: true }),
        fetchBusinessUnits({ isMain: false }),
      ]);

      const periodParams =
        startDate && endDate ? { startDate, endDate } : { month, year };

      let rootRows = [];
      try {
        const rootResult = await fetchBuPerformance({
          ...periodParams,
          onlyRoots: true,
        });
        rootRows = Array.isArray(rootResult) ? rootResult : [];
      } catch (error) {
        console.warn("Overview root performance fallback to empty:", error);
        rootRows = [];
      }

      let detailRows = [];
      try {
        const detailResult = await fetchBuPerformance({
          ...periodParams,
          onlyRoots: false,
        });
        detailRows = Array.isArray(detailResult) ? detailResult : [];
      } catch (error) {
        console.warn("Overview detail performance fallback to empty:", error);
        detailRows = [];
      }

      let dailyRows = [];
      try {
        const dailyResult = await fetchDailyPerformance({
          ...periodParams,
          onlyRoots: true,
        });
        dailyRows = Array.isArray(dailyResult) ? dailyResult : [];
      } catch (error) {
        console.warn("Overview daily fallback to empty:", error);
        dailyRows = [];
      }

      // Aggregate period actuals from daily rows (daily API supports date-range filtering)
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

      setDashboardData((prev) => ({
        ...buildEmptyDashboard(month, year),
        buTabs: prev?.buTabs || [],
        buDetails: prev?.buDetails || {},
        header: {
          ...buildEmptyDashboard(month, year).header,
          reportDate: formatReportDate(new Date()),
          updatedAt: formatUpdatedAt(new Date()),
        },
      }));
    } finally {
      setLoadingDashboard(false);

      if (showOverlay) {
        hideLoadingOverlay();
      }
    }
  };

  const loadDetailData = async (
    buId = activeBu,
    month = selectedMonth,
    year = selectedYear,
    options = {}
  ) => {
    const {
      showOverlay = false,
      overlayText = "Đang tải dữ liệu chi tiết BU...",
      startDate: optStartDate = detailFilter.startDate,
      endDate: optEndDate = detailFilter.endDate,
      preset: optPreset = detailFilter.preset,
    } = options;

    // Always recompute fresh dates for time-relative presets
    const freshRange = recomputePresetRange(optPreset);
    const startDate = freshRange?.startDate ?? optStartDate;
    const endDate = freshRange?.endDate ?? optEndDate;

    try {
      if (showOverlay) {
        showLoadingOverlay(overlayText);
      }

      setLoadingDetail(true);

      const periodParams =
        startDate && endDate ? { startDate, endDate } : { month, year };

      let prevPeriodParams = {};
      if (startDate && endDate) {
        const prevRange = getPreviousPeriodRange(startDate, endDate);
        if (prevRange) {
          prevPeriodParams = {
            startDate: prevRange.startDate,
            endDate: prevRange.endDate,
          };
        } else {
          const { prevMonth, prevYear } = getPreviousPeriod(month, year);
          prevPeriodParams = { month: prevMonth, year: prevYear };
        }
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
      const mainUnit = (Array.isArray(mainUnits) ? mainUnits : []).find(
        (item) => buIdFromCode(item.code) === buId
      );

      if (!mainUnit) {
        throw new Error("Không tìm thấy BU chính.");
      }

      let performanceRows = [];
      try {
        const result = await fetchBuPerformance({
          ...periodParams,
          onlyRoots: false,
          buId: mainUnit.id,
        });
        performanceRows = Array.isArray(result) ? result : [];
      } catch (error) {
        console.warn("Detail performance fallback to empty:", error);
        performanceRows = [];
      }

      let prevPerformanceRows = [];
      try {
        const result = await fetchBuPerformance({
          ...prevPeriodParams,
          onlyRoots: false,
          buId: mainUnit.id,
        });
        prevPerformanceRows = Array.isArray(result) ? result : [];
      } catch (error) {
        console.warn("Detail prev performance fallback to empty:", error);
        prevPerformanceRows = [];
      }

      let dailyRows = [];
      try {
        const result = await fetchDailyPerformance({
          ...periodParams,
          buId: mainUnit.id,
        });
        dailyRows = Array.isArray(result) ? result : [];
      } catch (error) {
        console.warn("Detail daily fallback to empty:", error);
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

      return true;
    } catch (error) {
      console.error("Load detail error:", error);
      toast.error(error.message || "Không tải được dữ liệu chi tiết BU.");
      return false;
    } finally {
      setLoadingDetail(false);

      if (showOverlay) {
        hideLoadingOverlay();
      }
    }
  };

  const loadInventoryReportData = async (
    month = selectedMonth,
    year = selectedYear,
    options = {}
  ) => {
    const {
      showOverlay = false,
      overlayText = "Đang tải báo cáo tồn kho...",
      startDate: optStartDate = inventoryFilter.startDate,
      endDate: optEndDate = inventoryFilter.endDate,
      preset: optPreset = inventoryFilter.preset,
    } = options;

    // Always recompute fresh dates for time-relative presets
    const freshRange = recomputePresetRange(optPreset);
    const startDate = freshRange?.startDate ?? optStartDate;
    const endDate = freshRange?.endDate ?? optEndDate;

    try {
      if (showOverlay) {
        showLoadingOverlay(overlayText);
      }

      setLoadingInventory(true);

      const periodParams =
        startDate && endDate ? { startDate, endDate } : { month, year };

      let warehouseRows = [];
      try {
        const result = await fetchWarehouses(periodParams);
        warehouseRows = Array.isArray(result) ? result : [];
      } catch (error) {
        console.warn("Inventory warehouses fallback to empty:", error);
        warehouseRows = [];
      }

      const mapped = mapInventoryReportFromWarehouses(
        warehouseRows,
        month,
        year,
        startDate,
        endDate
      );

      setInventoryReportData({
        ...mapped,
        header: {
          ...mapped.header,
          reportDate: formatReportDate(new Date()),
          updatedAt: formatUpdatedAt(new Date()),
        },
      });
    } catch (error) {
      console.error("Load inventory report error:", error);
      toast.error(error.message || "Không tải được báo cáo tồn kho.");

      const empty = buildEmptyInventoryReport(month, year);
      setInventoryReportData({
        ...empty,
        header: {
          ...empty.header,
          reportDate: formatReportDate(new Date()),
          updatedAt: formatUpdatedAt(new Date()),
        },
      });
    } finally {
      setLoadingInventory(false);

      if (showOverlay) {
        hideLoadingOverlay();
      }
    }
  };

  const loadReceivableReportData = async (
    _month = selectedMonth,
    _year = selectedYear,
    options = {},
    dateOverride = null
  ) => {
    const {
      showOverlay = false,
      overlayText = "Đang tải báo cáo công nợ...",
    } = options;

    try {
      if (showOverlay) {
        showLoadingOverlay(overlayText);
      }

      setLoadingReceivable(true);

      // Use provided date or the current receivableSelectedDate state
      const baseDate = dateOverride
        ? new Date(dateOverride)
        : receivableSelectedDate
        ? new Date(receivableSelectedDate)
        : new Date();

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

      const [yesterdayPayload, todayPayload, tomorrowPayload] =
        await Promise.all([
          fetchCollectionByBu({ date: queryDates.yesterday }).catch(() => null),
          fetchCollectionByBu({ date: queryDates.today }).catch(() => null),
          fetchCollectionByBu({ date: queryDates.tomorrow }).catch(() => null),
        ]);

      const mapped =
        yesterdayPayload || todayPayload || tomorrowPayload
          ? mapReceivableReportFromApi(
              {
                yesterdayPayload,
                todayPayload,
                tomorrowPayload,
              },
              {
                month,
                year,
                queryDates,
              }
            )
          : buildEmptyReceivableReport(month, year);

      setReceivableReportData({
        ...mapped,
        header: {
          ...mapped.header,
          updatedAt: formatUpdatedAt(new Date()),
        },
      });
    } catch (error) {
      console.error("Load receivable report error:", error);
      toast.error(error.message || "Không tải được báo cáo công nợ.");

      const current = new Date();
      const month = current.getMonth() + 1;
      const year = current.getFullYear();

      const empty = buildEmptyReceivableReport(month, year);
      setReceivableReportData({
        ...empty,
        header: {
          ...empty.header,
          updatedAt: formatUpdatedAt(new Date()),
        },
      });
    } finally {
      setLoadingReceivable(false);

      if (showOverlay) {
        hideLoadingOverlay();
      }
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const auth = getAuthStorage();

        if (!auth.token) {
          setView("login");
          setCurrentUser("");
          return;
        }

        if (isTokenExpired(auth.expiry)) {
          clearAuth();
          setView("login");
          setCurrentUser("");
          return;
        }

        setCurrentUser(auth.username || "");
        setView("overview");

        await loadOverviewData(initialMonth, initialYear, {
          preset: "thisMonth",
        });
      } catch (error) {
        console.error("Bootstrap error:", error);
        clearAuth();
        setView("login");
        setCurrentUser("");
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (bootstrapping) return;

    if (skipNextOverviewEffectRef.current) {
      skipNextOverviewEffectRef.current = false;
      return;
    }

    if (view === "overview" || view === "detail") {
      loadOverviewData(selectedMonth, selectedYear, {
        startDate: overviewFilter.startDate,
        endDate: overviewFilter.endDate,
        preset: overviewFilter.preset,
      });
    }
  }, [bootstrapping, view]);

  useEffect(() => {
    if (bootstrapping) return;

    if (skipNextDetailEffectRef.current) {
      skipNextDetailEffectRef.current = false;
      return;
    }

    if (view === "detail") {
      loadDetailData(activeBu, selectedMonth, selectedYear, {
        startDate: detailFilter.startDate,
        endDate: detailFilter.endDate,
        preset: detailFilter.preset,
      });
    }
  }, [bootstrapping, view, activeBu]);

  useEffect(() => {
    const auth = getAuthStorage();
    if (!auth.token || !auth.expiry) return;

    const expiryTime = new Date(auth.expiry).getTime();
    if (!Number.isFinite(expiryTime)) return;

    const timeout = expiryTime - Date.now();
    if (timeout <= 0) {
      clearAuth();
      setCurrentUser("");
      setView("login");
      toast.error("Phiên đăng nhập đã hết hạn.");
      return;
    }

    const timer = setTimeout(() => {
      clearAuth();
      setCurrentUser("");
      setView("login");
      toast.error("Phiên đăng nhập đã hết hạn.");
    }, timeout);

    return () => clearTimeout(timer);
  }, [view]);

  const handleLoginSuccess = async (authData) => {
    try {
      setBootstrapping(true);
      setCurrentUser(authData?.username || "");
      setView("overview");

      await loadOverviewData(selectedMonth, selectedYear, {
        showOverlay: true,
        overlayText: "Đang tải dữ liệu tổng quan...",
        startDate: overviewFilter.startDate,
        endDate: overviewFilter.endDate,
      });

      toast.success(`Đăng nhập thành công: ${authData?.username || "user"}`);
    } finally {
      setBootstrapping(false);
    }
  };

  const handleOpenDetail = async (buId) => {
    const fallback = dashboardData?.buTabs?.[0]?.id || "elevator";
    const nextBu = buId || fallback;

    skipNextOverviewEffectRef.current = true;
    skipNextDetailEffectRef.current = true;

    setActiveBu(nextBu);
    setView("detail");

    // Mặc định chi tiết BU lọc theo tháng này
    const monthRange = recomputePresetRange("thisMonth");
    const nextFilter = {
      startDate: monthRange.startDate,
      endDate: monthRange.endDate,
      preset: "thisMonth",
    };
    setDetailFilter(nextFilter);

    await loadDetailData(nextBu, selectedMonth, selectedYear, {
      showOverlay: true,
      overlayText: "Đang mở chi tiết BU...",
      startDate: nextFilter.startDate,
      endDate: nextFilter.endDate,
      preset: nextFilter.preset,
    });
  };

  const handleChangeBu = async (buId) => {
    if (!buId || buId === activeBu) return;

    skipNextDetailEffectRef.current = true;
    setActiveBu(buId);

    await loadDetailData(buId, selectedMonth, selectedYear, {
      showOverlay: true,
      overlayText: "Đang tải dữ liệu BU...",
      startDate: detailFilter.startDate,
      endDate: detailFilter.endDate,
      preset: detailFilter.preset,
    });
  };

  const handleOpenInventoryReport = async () => {
    setView("inventory");

    // Mặc định báo cáo tồn kho lọc theo hôm nay
    const todayRange = recomputePresetRange("today");
    const nextFilter = {
      startDate: todayRange.startDate,
      endDate: todayRange.endDate,
      preset: "today",
    };
    setInventoryFilter(nextFilter);

    await loadInventoryReportData(selectedMonth, selectedYear, {
      showOverlay: true,
      overlayText: "Đang mở báo cáo tồn kho...",
      startDate: nextFilter.startDate,
      endDate: nextFilter.endDate,
      preset: nextFilter.preset,
    });
  };

  const handleOpenReceivableReport = async () => {
    // Mặc định báo cáo công nợ lọc theo hôm nay
    const targetDate = formatIsoDate(new Date());
    setReceivableSelectedDate(targetDate);
    setView("receivable");

    await loadReceivableReportData(
      selectedMonth,
      selectedYear,
      { showOverlay: true, overlayText: "Đang mở báo cáo công nợ..." },
      targetDate
    );
  };

  const handleReceivableDateChange = async (dateStr) => {
    setReceivableSelectedDate(dateStr);
    await loadReceivableReportData(
      selectedMonth,
      selectedYear,
      { showOverlay: true, overlayText: "Đang tải dữ liệu công nợ..." },
      dateStr
    );
  };

  // Danh sách section báo cáo tổng hợp — dùng chung cho tải PDF và gửi email
  const buildAllReportSections = () => {
    const getDashElement = () => document.querySelector(".dash");

    // Chỉ lấy tab hợp lệ và khử trùng lặp id — tránh chụp trang BU rỗng
    const seenBuIds = new Set();
    const buTabs = (Array.isArray(dashboardData?.buTabs)
      ? dashboardData.buTabs
      : []
    ).filter((tab) => {
      if (!tab?.id || seenBuIds.has(tab.id)) return false;
      seenBuIds.add(tab.id);
      return true;
    });

    const sections = [
      {
        label: "Tổng quan",
        prepare: async () => {
          skipNextOverviewEffectRef.current = true;
          setView("overview");
          await waitForRender(600);
          return getDashElement();
        },
      },
      ...buTabs.map((tab) => ({
        label: `Chi tiết ${tab.label}`,
        prepare: async () => {
          skipNextOverviewEffectRef.current = true;
          skipNextDetailEffectRef.current = true;
          setActiveBu(tab.id);
          setView("detail");
          const loaded = await loadDetailData(tab.id, selectedMonth, selectedYear, {
            startDate: detailFilter.startDate,
            endDate: detailFilter.endDate,
            preset: detailFilter.preset,
          });

          // BU load lỗi (không tìm thấy, API hỏng...) → bỏ qua, không chụp trang rỗng
          if (!loaded) return null;

          await waitForRender(600);
          return getDashElement();
        },
      })),
      {
        label: "Tồn kho",
        prepare: async () => {
          setView("inventory");
          await loadInventoryReportData(selectedMonth, selectedYear, {
            startDate: inventoryFilter.startDate,
            endDate: inventoryFilter.endDate,
            preset: inventoryFilter.preset,
          });
          await waitForRender(600);
          return getDashElement();
        },
      },
      {
        label: "Công nợ",
        prepare: async () => {
          setView("receivable");
          await loadReceivableReportData(
            selectedMonth,
            selectedYear,
            {},
            receivableSelectedDate
          );
          await waitForRender(600);
          return getDashElement();
        },
      },
    ];

    return sections;
  };

  // Xuất tổng hợp: lần lượt mở từng báo cáo, chụp và ghép vào 1 file PDF
  const handleExportAllReports = async () => {
    if (reportBusyRef.current) return;
    reportBusyRef.current = true;

    try {
      showLoadingOverlay("Đang tổng hợp báo cáo PDF...");

      await exportSectionsToPdf(
        buildAllReportSections(),
        buildPdfFileName(
          "bao-cao-tong-hop",
          `${overviewFilter.startDate || ""}_${overviewFilter.endDate || ""}`
        ),
        (label) => setLoadingOverlayText(`Đang xuất: ${label}...`)
      );

      toast.success("Đã tải báo cáo tổng hợp PDF.");
    } catch (error) {
      console.error("Export all reports error:", error);
      toast.error(error.message || "Không xuất được báo cáo tổng hợp.");
    } finally {
      reportBusyRef.current = false;
      hideLoadingOverlay();

      // Quay về tổng quan
      skipNextOverviewEffectRef.current = true;
      setView("overview");
    }
  };

  // Gửi báo cáo tổng hợp qua email (thủ công từ popup "Gửi thử ngay" hoặc tự động theo lịch)
  const handleSendReportEmail = async ({ auto = false } = {}) => {
    if (reportBusyRef.current) return;
    if (view === "login") return;

    let config = getEmailConfig();
    const recipients = parseRecipients(config.recipients);

    if (!recipients.length) {
      if (!auto) toast.error("Chưa cấu hình mail nhận hợp lệ.");
      return;
    }

    // Gửi tự động: đánh dấu kỳ này đã gửi ngay từ đầu để không gửi lặp
    if (auto) {
      config = markAutoSent(config);
    }

    reportBusyRef.current = true;

    try {
      showLoadingOverlay("Đang tổng hợp báo cáo để gửi email...");

      const fileName = buildPdfFileName(
        "bao-cao-tong-hop",
        `${overviewFilter.startDate || ""}_${overviewFilter.endDate || ""}`
      );

      const pdfBlob = await exportSectionsToPdf(
        buildAllReportSections(),
        fileName,
        (label) => setLoadingOverlayText(`Đang chuẩn bị: ${label}...`),
        { output: "blob" }
      );

      setLoadingOverlayText("Đang gửi email báo cáo...");

      await sendReportEmail({
        pdfBlob,
        fileName,
        senderEmail: config.senderEmail,
        recipients,
        subject: `Báo cáo tổng hợp dashboard — ${formatReportDate(new Date())}`,
        message: `Báo cáo tổng hợp dashboard kỳ ${
          overviewFilter.startDate || ""
        } → ${overviewFilter.endDate || ""}, gửi ${
          auto ? "tự động theo lịch" : "thủ công"
        } từ hệ thống.`,
      });

      toast.success(`Đã gửi báo cáo tới: ${recipients.join(", ")}`);
    } catch (error) {
      console.error("Send report email error:", error);
      toast.error(error.message || "Không gửi được email báo cáo.");
    } finally {
      reportBusyRef.current = false;
      hideLoadingOverlay();

      skipNextOverviewEffectRef.current = true;
      setView("overview");
    }
  };

  const sendReportEmailRef = useRef(null);
  useEffect(() => {
    sendReportEmailRef.current = handleSendReportEmail;
  });

  // Popup cấu hình bấm "Gửi thử ngay" sẽ bắn event này
  useEffect(() => {
    const onSendNow = () => sendReportEmailRef.current?.({ auto: false });
    window.addEventListener("report-email-send-now", onSendNow);
    return () => window.removeEventListener("report-email-send-now", onSendNow);
  }, []);

  // Lịch tự động: kiểm tra mỗi phút khi app đang mở trong trình duyệt
  useEffect(() => {
    const timer = setInterval(() => {
      const config = getEmailConfig();
      if (isAutoSendDue(config)) {
        sendReportEmailRef.current?.({ auto: true });
      }
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const handleBackOverview = async () => {
    skipNextOverviewEffectRef.current = true;
    setView("overview");

    await loadOverviewData(selectedMonth, selectedYear, {
      showOverlay: true,
      overlayText: "Đang quay về tổng quan...",
      startDate: overviewFilter.startDate,
      endDate: overviewFilter.endDate,
      preset: overviewFilter.preset,
    });
  };

  const handleApplyOverviewFilter = async ({
    startDate,
    endDate,
    preset = "custom",
    owner,
  }) => {
    setOverviewFilter({
      startDate,
      endDate,
      preset,
      owner: owner || "",
    });

    await loadOverviewData(selectedMonth, selectedYear, {
      showOverlay: true,
      overlayText: "Đang áp dụng bộ lọc ngày...",
      startDate,
      endDate,
      preset,
    });
  };

  const handleApplyDetailFilter = async ({
    startDate,
    endDate,
    preset = "custom",
  }) => {
    setDetailFilter({
      startDate,
      endDate,
      preset,
    });

    await loadDetailData(activeBu, selectedMonth, selectedYear, {
      showOverlay: true,
      overlayText: "Đang áp dụng bộ lọc ngày...",
      startDate,
      endDate,
      preset,
    });
  };

  const handleApplyInventoryFilter = async ({
    startDate,
    endDate,
    preset = "custom",
  }) => {
    setInventoryFilter({
      startDate,
      endDate,
      preset,
    });

    await loadInventoryReportData(selectedMonth, selectedYear, {
      showOverlay: true,
      overlayText: "Đang áp dụng bộ lọc ngày...",
      startDate,
      endDate,
      preset,
    });
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("dashboard_active_bu");
    localStorage.removeItem("dashboard_selected_owner");
    localStorage.removeItem("dashboard_month");
    localStorage.removeItem("dashboard_year");

    setCurrentUser("");
    setActiveBu("elevator");
    setDashboardData(buildEmptyDashboard(selectedMonth, selectedYear));
    setInventoryReportData(
      buildEmptyInventoryReport(selectedMonth, selectedYear)
    );
    setReceivableReportData(
      buildEmptyReceivableReport(selectedMonth, selectedYear)
    );
    setView("login");

    toast.success("Đã đăng xuất.");
  };

  const handleChangePeriod = async ({ month, year }) => {
    if (month === selectedMonth && year === selectedYear) return;

    setSelectedMonth(month);
    setSelectedYear(year);

    if (view === "detail") {
      const nextRange = buildMonthBoundRange(month, year);
      setDetailFilter({
        startDate: nextRange.startDate,
        endDate: nextRange.endDate,
        preset: "thisMonth",
      });

      await Promise.all([
        loadOverviewData(month, year, {
          showOverlay: true,
          overlayText: "Đang tải dữ liệu theo tháng...",
        }),
        loadDetailData(activeBu, month, year, {
          showOverlay: false,
          startDate: nextRange.startDate,
          endDate: nextRange.endDate,
        }),
      ]);
      return;
    }

    if (view === "inventory") {
      const nextRange = buildMonthBoundRange(month, year);
      setInventoryFilter({
        startDate: nextRange.startDate,
        endDate: nextRange.endDate,
        preset: "thisMonth",
      });

      await loadInventoryReportData(month, year, {
        showOverlay: true,
        overlayText: "Đang tải báo cáo tồn kho...",
        startDate: nextRange.startDate,
        endDate: nextRange.endDate,
      });
      return;
    }

    if (view === "receivable") {
      await loadReceivableReportData(month, year, {
        showOverlay: true,
        overlayText: "Đang tải báo cáo công nợ...",
      });
      return;
    }

    if (view === "overview") {
      const nextRange = buildMonthBoundRange(month, year);

      setOverviewFilter({
        ...nextRange,
        preset: "thisMonth",
        owner: overviewFilter.owner || "",
      });

      await loadOverviewData(month, year, {
        showOverlay: true,
        overlayText: "Đang tải dữ liệu theo tháng...",
        startDate: nextRange.startDate,
        endDate: nextRange.endDate,
      });
    }
  };

  const commonProps = useMemo(
    () => ({
      data: dashboardData,
      currentUser,
      onLogout: handleLogout,
      selectedMonth,
      selectedYear,
      onChangePeriod: handleChangePeriod,
      loadingDashboard,
      loadingDetail,
      overviewFilter,
      detailFilter,
      inventoryFilter,
      onApplyDetailFilter: handleApplyDetailFilter,
      onApplyInventoryFilter: handleApplyInventoryFilter,
      onRefreshDashboard: () =>
        loadOverviewData(selectedMonth, selectedYear, {
          showOverlay: true,
          overlayText: "Đang làm mới dữ liệu tổng quan...",
          startDate: overviewFilter.startDate,
          endDate: overviewFilter.endDate,
          preset: overviewFilter.preset,
        }),
      onRefreshDetail: () =>
        loadDetailData(activeBu, selectedMonth, selectedYear, {
          showOverlay: true,
          overlayText: "Đang làm mới dữ liệu chi tiết...",
          startDate: detailFilter.startDate,
          endDate: detailFilter.endDate,
          preset: detailFilter.preset,
        }),
    }),
    [
      dashboardData,
      currentUser,
      selectedMonth,
      selectedYear,
      loadingDashboard,
      loadingDetail,
      activeBu,
      overviewFilter.startDate,
      overviewFilter.endDate,
      overviewFilter.preset,
      overviewFilter.owner,
      detailFilter.startDate,
      detailFilter.endDate,
      detailFilter.preset,
      inventoryFilter.startDate,
      inventoryFilter.endDate,
      inventoryFilter.preset,
    ]
  );

  if (bootstrapping) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f3ee",
          color: "#5f5e5a",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Đang tải dashboard...
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: "#111827",
            color: "#fff",
            borderRadius: "12px",
            padding: "12px 14px",
            fontSize: "13px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />

      {loadingOverlay && (
        <div className="app-loading-overlay">
          <div className="app-loading-box">
            <div className="app-loading-spinner" />
            <div className="app-loading-text">{loadingOverlayText}</div>
          </div>
        </div>
      )}

      {view === "login" ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : view === "detail" ? (
        <DashboardBuDetailPage
          {...commonProps}
          activeBu={activeBu}
          onChangeBu={handleChangeBu}
          onBack={handleBackOverview}
        />
      ) : view === "inventory" ? (
        <InventoryReportPage
          data={inventoryReportData}
          currentUser={currentUser}
          onLogout={handleLogout}
          onBack={handleBackOverview}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onChangePeriod={handleChangePeriod}
          inventoryFilter={inventoryFilter}
          onApplyInventoryFilter={handleApplyInventoryFilter}
          onRefreshInventory={() =>
            loadInventoryReportData(selectedMonth, selectedYear, {
              showOverlay: true,
              overlayText: "Đang làm mới báo cáo tồn kho...",
              startDate: inventoryFilter.startDate,
              endDate: inventoryFilter.endDate,
              preset: inventoryFilter.preset,
            })
          }
          loadingInventory={loadingInventory}
        />
      ) : view === "receivable" ? (
        <ReceivableReportPage
          data={receivableReportData}
          currentUser={currentUser}
          onLogout={handleLogout}
          onBack={handleBackOverview}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onChangePeriod={handleChangePeriod}
          receivableSelectedDate={receivableSelectedDate}
          onChangeReceivableDate={handleReceivableDateChange}
          onRefreshReceivable={() =>
            loadReceivableReportData(
              selectedMonth,
              selectedYear,
              { showOverlay: true, overlayText: "Đang làm mới báo cáo công nợ..." },
              receivableSelectedDate
            )
          }
          loadingReceivable={loadingReceivable}
        />
      ) : (
        <DashboardOverviewPage
          {...commonProps}
          onOpenDetail={handleOpenDetail}
          onOpenInventoryReport={handleOpenInventoryReport}
          onOpenReceivableReport={handleOpenReceivableReport}
          onApplyOverviewFilter={handleApplyOverviewFilter}
          onExportAllReports={handleExportAllReports}
        />
      )}
    </>
  );
}