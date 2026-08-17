import {
  BLANK,
  buildDailySeries,
  deriveSafePercent,
  formatCompactMoney,
  formatGap,
  formatPercent,
  getLatestDailyRow,
  toNullableNumber,
} from "./numberFormat";

function normalizeDateValue(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSingleDayRange(startDate, endDate) {
  const from = normalizeDateValue(startDate);
  const to = normalizeDateValue(endDate);
  if (!from || !to) return false;
  return from.getTime() === to.getTime();
}

export function isFullMonthRange(startDate, endDate) {
  const from = normalizeDateValue(startDate);
  const to = normalizeDateValue(endDate);
  if (!from || !to) return false;

  const isStartOfMon = from.getDate() === 1;
  const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  const isEndOfMon = to.getDate() === lastDay && from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();

  return isStartOfMon && isEndOfMon;
}

function formatDateDisplay(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatRangeDisplay(startDate, endDate) {
  const from = normalizeDateValue(startDate);
  const to = normalizeDateValue(endDate);

  if (!from || !to) return BLANK;

  return `${formatDateDisplay(from)} – ${formatDateDisplay(to)}`;
}

function formatIsoDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getPreviousPeriodRange(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  // Check if it's a full calendar month
  const isStartOfMon = start.getDate() === 1;
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const isEndOfMon = end.getDate() === lastDay && start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (isStartOfMon && isEndOfMon) {
    const prevMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const prevMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0);
    return {
      startDate: formatIsoDate(prevMonthStart),
      endDate: formatIsoDate(prevMonthEnd),
    };
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const prevStart = new Date(start);
  prevStart.setDate(start.getDate() - diffDays);

  const prevEnd = new Date(end);
  prevEnd.setDate(end.getDate() - diffDays);

  return {
    startDate: formatIsoDate(prevStart),
    endDate: formatIsoDate(prevEnd),
  };
}

function buildDetailDailySeries(rows = [], month, year, startDate, endDate) {
  let from = normalizeDateValue(startDate);
  let to = normalizeDateValue(endDate);

  if (!from || !to) {
    from = new Date(year, month - 1, 1);
    from.setHours(0, 0, 0, 0);

    to = new Date(year, month, 0);
    to.setHours(0, 0, 0, 0);
  }

  const mapByDate = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row?.date) return;
    const key = String(row.date).slice(0, 10);

    const current = mapByDate.get(key) || {
      revenue: null,
      collection: null,
    };

    const revenue = toNullableNumber(row?.daily_revenue);
    const collection = toNullableNumber(row?.daily_collection);

    mapByDate.set(key, {
      revenue:
        revenue === null
          ? current.revenue
          : (current.revenue ?? 0) + revenue,
      collection:
        collection === null
          ? current.collection
          : (current.collection ?? 0) + collection,
    });
  });

  const result = [];
  const cursor = new Date(from);

  while (cursor.getTime() <= to.getTime()) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getDate()).padStart(2, "0");
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const row = mapByDate.get(isoDate);

    result.push({
      date: isoDate,
      label: `${dd}/${mm}`,
      name: `${dd}/${mm}`,
      revenue: row?.revenue ?? null,
      collection: row?.collection ?? null,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}


function normalizeCode(code = "") {
  return String(code).trim().replace(/\s+/g, "_").toUpperCase();
}

export function buIdFromCode(code = "") {
  const map = {
    BU_ELEVATOR: "elevator",
    BU_IBIZ_PREMIUM: "ibizPremium",
    BU_IBIZ_VALUE: "ibizValue",
    BU_ECO: "eco",
    BU_AGRITECH: "agritech",
    BU_MANUFACTURING: "manufacturing",
  };

  return map[normalizeCode(code)] || null;
}

function displayNameFromCode(code = "", fallbackName = "") {
  const map = {
    BU_ELEVATOR: "Elevator",
    BU_IBIZ_PREMIUM: "iBiz Premium",
    BU_IBIZ_VALUE: "iBiz Value",
    BU_ECO: "ECO",
    BU_AGRITECH: "AgriTech",
    BU_MANUFACTURING: "Sản xuất - Nhà máy",
  };

  return map[normalizeCode(code)] || fallbackName || normalizeCode(code);
}

function shortSubName(name = "") {
  return String(name)
    .replace("Thiết bị ", "")
    .replace("Nông nghiệp ", "")
    .replace("Thang máy ", "")
    .trim();
}

function buildPerfMap(performanceRows = []) {
  const map = new Map();

  (Array.isArray(performanceRows) ? performanceRows : []).forEach((row) => {
    const code = normalizeCode(row?.bu_code);
    if (code) {
      map.set(code, row);
    }
  });

  return map;
}

// Gộp daily theo từng BU (bu_code) để lấy actual đúng theo kỳ khi lọc khoảng ngày lẻ
function aggregateDailyByBuCode(dailyRows = []) {
  const map = new Map();
  (Array.isArray(dailyRows) ? dailyRows : []).forEach((row) => {
    const code = normalizeCode(row?.bu_code);
    if (!code) return;
    const current = map.get(code) || { revenue: 0, collection: 0 };
    current.revenue += Number(row?.daily_revenue) || 0;
    current.collection += Number(row?.daily_collection) || 0;
    map.set(code, current);
  });
  return map;
}

function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function deriveVsPrevPercent(current, previous) {
  const currentValue = toNullableNumber(current);
  const previousValue = toNullableNumber(previous);

  if (
    currentValue === null ||
    previousValue === null ||
    !Number.isFinite(previousValue) ||
    previousValue === 0
  ) {
    return null;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
}

function buildKpi(label, actual, plan, percent, accent, isDaily = false) {
  return {
    label,
    value: actual ?? 0,
    valueText: formatCompactMoney(actual),
    targetText:
      plan === null || plan === undefined
        ? isDaily
          ? "/ — (ngày)"
          : "/ —"
        : isDaily
        ? `/ ${formatCompactMoney(plan)} (ngày)`
        : `/ ${formatCompactMoney(plan)}`,
    percent,
    percentText: formatPercent(percent),
    accent,
    progressColor: accent,
    deltaText: formatGap(actual, plan),
    note: "",
    unit: "",
  };
}

function buildElevatorChildRows(
  childUnits,
  perfRows,
  perfMap,
  prevPerfRows,
  prevPerfMap,
  dailyByBu = null
) {
  return (Array.isArray(childUnits) ? childUnits : []).map((unit) => {
    const row =
      perfRows.find((item) => Number(item?.business_unit) === Number(unit.id)) ||
      perfMap.get(normalizeCode(unit.code)) ||
      null;

    const prevRow =
      prevPerfRows.find(
        (item) => Number(item?.business_unit) === Number(unit.id)
      ) ||
      prevPerfMap.get(normalizeCode(unit.code)) ||
      null;

    const revenuePlan = toNullableNumber(row?.mtd_revenue_plan);
    let revenueActual = toNullableNumber(row?.mtd_revenue_actual);
    const revenueActualPrev = toNullableNumber(prevRow?.mtd_revenue_actual);

    const cashPlan = toNullableNumber(row?.mtd_collection_plan);
    let cashActual = toNullableNumber(row?.mtd_collection_actual);

    // Lọc khoảng ngày lẻ: dùng actual theo kỳ (gộp từ daily) thay cho số lũy kế tháng (mtd_*)
    const childDaily = dailyByBu?.get(normalizeCode(unit.code)) || null;
    if (childDaily) {
      revenueActual = childDaily.revenue;
      cashActual = childDaily.collection;
    }

    const revenuePercent = deriveSafePercent({
      rawPercent: childDaily ? null : row?.revenue_kpi,
      actual: revenueActual,
      plan: revenuePlan,
    });

    const cashPercent = deriveSafePercent({
      rawPercent: childDaily ? null : row?.collection_kpi,
      actual: cashActual,
      plan: cashPlan,
    });

    const revenueVsPrevPercent = deriveVsPrevPercent(
      revenueActual,
      revenueActualPrev
    );

    return {
      id: unit.id,
      code: normalizeCode(unit.code),
      name: unit.name || "",
      shortName: shortSubName(unit.name || ""),
      revenuePlan,
      revenueActual,
      revenueActualPrev,
      revenuePercent,
      revenueVsPrevPercent,
      cashPlan,
      cashActual,
      cashPercent,
    };
  });
}

function buildDetailSummaryRows({
  rootRevenuePlan,
  rootRevenueActual,
  rootRevenuePercent,
  rootRevenueVsPrevPercent,
  rootCashPlan,
  rootCashActual,
  rootCashPercent,
  rootCashVsPrevPercent,
  todayRevenue,
  todayCollection,
  dailyRevenuePlan,
  dailyCollectionPlan,
  dailyRevenuePercent,
  dailyCollectionPercent,
  month,
  startDate,
  endDate,
}) {
  const mm = String(month).padStart(2, "0");
  const periodLabel =
    startDate && endDate && !isFullMonthRange(startDate, endDate)
      ? "Kỳ"
      : `T${mm}`;

  return [
    {
      label: "Doanh thu",
      plan: formatCompactMoney(rootRevenuePlan),
      actual: formatCompactMoney(rootRevenueActual),
      period: periodLabel,
      percent: formatPercent(rootRevenuePercent),
      vs: formatPercent(rootRevenueVsPrevPercent),
    },
    {
      label: "Thu tiền",
      plan: formatCompactMoney(rootCashPlan),
      actual: formatCompactMoney(rootCashActual),
      period: periodLabel,
      percent: formatPercent(rootCashPercent),
      vs: formatPercent(rootCashVsPrevPercent),
    },
    {
      label: "DT ngày",
      plan: formatCompactMoney(dailyRevenuePlan),
      actual: formatCompactMoney(todayRevenue),
      period: "Ngày",
      percent: formatPercent(dailyRevenuePercent),
      vs: BLANK,
    },
    {
      label: "TT ngày",
      plan: formatCompactMoney(dailyCollectionPlan),
      actual: formatCompactMoney(todayCollection),
      period: "Ngày",
      percent: formatPercent(dailyCollectionPercent),
      vs: BLANK,
    },
  ];
}

export function mapBuDetailFromApi({
  selectedBuId,
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
}) {
  const mainList = Array.isArray(mainUnits) ? mainUnits : [];
  const subList = Array.isArray(subUnits) ? subUnits : [];
  const perfRows = Array.isArray(performanceRows) ? performanceRows : [];
  const prevPerfRows = Array.isArray(prevPerformanceRows)
    ? prevPerformanceRows
    : [];

  const perfMap = buildPerfMap(perfRows);
  const prevPerfMap = buildPerfMap(prevPerfRows);

  const usePeriodOverride = !!(
    startDate && endDate && !isFullMonthRange(startDate, endDate)
  );
  const dailyByBu = usePeriodOverride
    ? aggregateDailyByBuCode(dailyRows)
    : null;

  const mainUnit = mainList.find(
    (item) => buIdFromCode(item.code) === selectedBuId
  );

  if (!mainUnit) {
    return null;
  }

  const mainCode = normalizeCode(mainUnit.code);

  const rootPerf =
    perfRows.find((row) => Number(row?.business_unit) === Number(mainUnit.id)) ||
    perfMap.get(mainCode) ||
    null;

  const rootPerfPrev =
    prevPerfRows.find(
      (row) => Number(row?.business_unit) === Number(mainUnit.id)
    ) ||
    prevPerfMap.get(mainCode) ||
    null;

  const rootRevenuePlan = toNullableNumber(rootPerf?.mtd_revenue_plan);
  // Compute period actuals from daily rows when date range is not a full month
  const dailyAggregate = (() => {
    if (!startDate || !endDate || isFullMonthRange(startDate, endDate)) return null;
    const rows = Array.isArray(dailyRows) ? dailyRows : [];
    if (rows.length === 0) return null;
    const revenue = rows.reduce((sum, row) => sum + (Number(row?.daily_revenue) || 0), 0);
    const collection = rows.reduce((sum, row) => sum + (Number(row?.daily_collection) || 0), 0);
    return { revenue, collection };
  })();

  const rootRevenueActual = dailyAggregate !== null
    ? dailyAggregate.revenue
    : toNullableNumber(rootPerf?.mtd_revenue_actual);
  const rootRevenueActualPrev = toNullableNumber(
    rootPerfPrev?.mtd_revenue_actual
  );

  const rootCashPlan = toNullableNumber(rootPerf?.mtd_collection_plan);
  const rootCashActual = dailyAggregate !== null
    ? dailyAggregate.collection
    : toNullableNumber(rootPerf?.mtd_collection_actual);
  const rootCashActualPrev = toNullableNumber(
    rootPerfPrev?.mtd_collection_actual
  );

  const rootRevenuePercent = deriveSafePercent({
    rawPercent: usePeriodOverride ? null : rootPerf?.revenue_kpi,
    actual: rootRevenueActual,
    plan: rootRevenuePlan,
  });

  const rootCashPercent = deriveSafePercent({
    rawPercent: usePeriodOverride ? null : rootPerf?.collection_kpi,
    actual: rootCashActual,
    plan: rootCashPlan,
  });

  const rootRevenueVsPrevPercent = deriveVsPrevPercent(
    rootRevenueActual,
    rootRevenueActualPrev
  );

  const rootCashVsPrevPercent = deriveVsPrevPercent(
    rootCashActual,
    rootCashActualPrev
  );

  const filteredDailyRows = (Array.isArray(dailyRows) ? dailyRows : []).filter(
    (row) => {
      const code = normalizeCode(row?.bu_code || "");
      return !code || code === mainCode;
    }
  );

  const latestDailyRow = getLatestDailyRow(filteredDailyRows);
  const todayRevenue = toNullableNumber(latestDailyRow?.daily_revenue);
  const todayCollection = toNullableNumber(latestDailyRow?.daily_collection);

  // Calculate days in period
  let daysInPeriod = getDaysInMonth(month, year);
  if (startDate && endDate) {
    const from = normalizeDateValue(startDate);
    const to = normalizeDateValue(endDate);
    if (from && to) {
      const diffTime = Math.abs(to.getTime() - from.getTime());
      daysInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const dailyRevenuePlan =
    rootRevenuePlan !== null && daysInPeriod > 0
      ? rootRevenuePlan / daysInPeriod
      : null;

  const dailyCollectionPlan =
    rootCashPlan !== null && daysInPeriod > 0
      ? rootCashPlan / daysInPeriod
      : null;

  const dailyRevenuePercent = deriveSafePercent({
    rawPercent: null,
    actual: todayRevenue,
    plan: dailyRevenuePlan,
  });

  const dailyCollectionPercent = deriveSafePercent({
    rawPercent: null,
    actual: todayCollection,
    plan: dailyCollectionPlan,
  });

  const isElevatorLayout = selectedBuId === "elevator";

  const childUnits = isElevatorLayout
    ? subList.filter((item) => Number(item.parent) === Number(mainUnit.id))
    : [];

  const childRows = isElevatorLayout
    ? buildElevatorChildRows(
        childUnits,
        perfRows,
        perfMap,
        prevPerfRows,
        prevPerfMap,
        dailyByBu
      )
    : [];

  // Ưu tiên suy ra tháng hiển thị từ khoảng ngày đang lọc (startDate),
  // vì prop `month` có thể là state cũ chưa đồng bộ với bộ lọc.
  const filterStart = normalizeDateValue(startDate);
  const effectiveMonth = filterStart ? filterStart.getMonth() + 1 : month;
  const effectiveYear = filterStart ? filterStart.getFullYear() : year;

  const mm = String(effectiveMonth).padStart(2, "0");
  const prev = String(
    effectiveMonth === 1 ? 12 : effectiveMonth - 1
  ).padStart(2, "0");

  const revenueChartData = isElevatorLayout
    ? childRows.length > 0
      ? childRows.map((item) => ({
          name: item.shortName || item.name,
          target: item.revenuePlan,
          actual: item.revenueActual,
          gap:
            item.revenuePlan !== null && item.revenueActual !== null
              ? Math.max(item.revenuePlan - item.revenueActual, 0)
              : null,
        }))
      : [
          {
            name: "Tổng",
            target: rootRevenuePlan,
            actual: rootRevenueActual,
            gap:
              rootRevenuePlan !== null && rootRevenueActual !== null
                ? Math.max(rootRevenuePlan - rootRevenueActual, 0)
                : null,
          },
        ]
    : [];

  const cashChartData = isElevatorLayout
    ? childRows.length > 0
      ? childRows.map((item) => ({
          name: item.shortName || item.name,
          target: item.cashPlan,
          actual: item.cashActual,
          gap:
            item.cashPlan !== null && item.cashActual !== null
              ? Math.max(item.cashPlan - item.cashActual, 0)
              : null,
        }))
      : [
          {
            name: "Tổng",
            target: rootCashPlan,
            actual: rootCashActual,
            gap:
              rootCashPlan !== null && rootCashActual !== null
                ? Math.max(rootCashPlan - rootCashActual, 0)
                : null,
          },
        ]
    : [];

  const isFullMonth = !startDate || !endDate || isFullMonthRange(startDate, endDate);
  const isSingleDay = startDate && endDate && isSingleDayRange(startDate, endDate);

  const revenueLabel = isFullMonth
    ? "DT tháng"
    : isSingleDay
    ? "DT ngày"
    : "DT theo kỳ";

  const cashLabel = isFullMonth
    ? "Thu tiền tháng"
    : isSingleDay
    ? "Thu tiền ngày"
    : "Thu tiền theo kỳ";

  const periodRangeLabel =
    startDate && endDate
      ? formatRangeDisplay(startDate, endDate)
      : `T${mm}/${effectiveYear}`;

  const periodLabelText =
    startDate && endDate
      ? isFullMonth
        ? `T${mm}`
        : formatRangeDisplay(startDate, endDate)
      : `T${mm}`;

  return {
    title: displayNameFromCode(mainUnit.code, mainUnit.name),
    owner: mainUnit.manager || "",
    subInfo:
      isElevatorLayout && childRows.length
        ? `${childRows.length} sub-mảng: ${childRows
            .map((item) => item.name)
            .join(" · ")}`
        : "",

    statusTone: "neutral",
    revenuePercent: rootRevenuePercent,
    collectionPercent: rootCashPercent,
    revenuePercentText: formatPercent(rootRevenuePercent),
    collectionPercentText: formatPercent(rootCashPercent),

    kpis: [
      buildKpi(
        revenueLabel,
        rootRevenueActual,
        rootRevenuePlan,
        rootRevenuePercent,
        "blue"
      ),
      buildKpi(
        cashLabel,
        rootCashActual,
        rootCashPlan,
        rootCashPercent,
        "teal"
      ),
      buildKpi(
        "DT hôm nay",
        todayRevenue,
        dailyRevenuePlan,
        dailyRevenuePercent,
        "blue",
        true
      ),
      buildKpi(
        "Thu tiền hôm nay",
        todayCollection,
        dailyCollectionPlan,
        dailyCollectionPercent,
        "teal",
        true
      ),
    ],

    dailySeries: buildDetailDailySeries(
      filteredDailyRows,
      month,
      year,
      startDate,
      endDate
    ),

    layoutType: isElevatorLayout ? "subMang" : "detailSummary",

    revenueChart: {
      title: `Sub-mảng — DT KH vs lũy kế ${periodLabelText}`,
      data: revenueChartData,
    },

    cashChart: {
      title: `Sub-mảng — TT KH vs lũy kế ${periodLabelText}`,
      data: cashChartData,
    },

    compareChart: {
      title: `DT & TT — KH vs lũy kế ${periodLabelText}`,
      data: [
        {
          name: "KH DT",
          value: rootRevenuePlan,
          tone: "planRevenue",
        },
        {
          name: "TH DT",
          value: rootRevenueActual,
          tone: "actualRevenue",
        },
        {
          name: "KH TT",
          value: rootCashPlan,
          tone: "planCash",
        },
        {
          name: "TH TT",
          value: rootCashActual,
          tone: "actualCash",
        },
      ],
    },

    detailSummary: {
      title: "Chỉ tiêu chi tiết",
      rows: buildDetailSummaryRows({
        rootRevenuePlan,
        rootRevenueActual,
        rootRevenuePercent,
        rootRevenueVsPrevPercent,
        rootCashPlan,
        rootCashActual,
        rootCashPercent,
        rootCashVsPrevPercent,
        todayRevenue,
        todayCollection,
        dailyRevenuePlan,
        dailyCollectionPlan,
        dailyRevenuePercent,
        dailyCollectionPercent,
        month,
        startDate,
        endDate,
      }),
    },

    table: {
      title: `Bảng chi tiết — ${displayNameFromCode(
        mainUnit.code,
        mainUnit.name
      )} sub-mảng ${periodRangeLabel}`,
      columns: [
        { key: "subMang", label: "Sub-mảng" },
        { key: "khDt", label: "KH DT" },
        { key: "kqDtNgay", label: "KQ DT ngày" },
        {
          key: "lkDtThang",
          label: isFullMonth ? `LK DT T${mm}` : "TH DT",
        },
        {
          key: "lkDtPrev",
          label: isFullMonth ? `LK DT T${prev}` : "TH DT Kỳ trước",
        },
        { key: "pctDt", label: "% KH DT" },
        { key: "gapDt", label: "Gap DT" },
        { key: "khTt", label: "KH TT" },
        {
          key: "lkTtThang",
          label: isFullMonth ? `LK TT T${mm}` : "TH TT",
        },
        { key: "pctTt", label: "% KH TT" },
        {
          key: "vsPrevDt",
          label: isFullMonth ? `vs T${prev} DT` : "vs Kỳ trước DT",
        },
      ],
      rows: [
        {
          isTotal: true,
          subMang: `Tổng ${displayNameFromCode(mainUnit.code, mainUnit.name)}`,
          khDt: formatCompactMoney(rootRevenuePlan),
          kqDtNgay: formatCompactMoney(todayRevenue),
          lkDtThang: formatCompactMoney(rootRevenueActual),
          lkDtPrev: formatCompactMoney(rootRevenueActualPrev),
          pctDt: { type: "pill", value: formatPercent(rootRevenuePercent) },
          gapDt: {
            type: "gap",
            value: formatGap(rootRevenueActual, rootRevenuePlan),
          },
          khTt: formatCompactMoney(rootCashPlan),
          lkTtThang: formatCompactMoney(rootCashActual),
          pctTt: { type: "pill", value: formatPercent(rootCashPercent) },
          vsPrevDt: {
            type: "pill",
            value: formatPercent(rootRevenueVsPrevPercent),
          },
        },
        ...childRows.map((item) => ({
          subMang: item.name,
          khDt: formatCompactMoney(item.revenuePlan),
          kqDtNgay: BLANK,
          lkDtThang: formatCompactMoney(item.revenueActual),
          lkDtPrev: formatCompactMoney(item.revenueActualPrev),
          pctDt: { type: "pill", value: formatPercent(item.revenuePercent) },
          gapDt: {
            type: "gap",
            value: formatGap(item.revenueActual, item.revenuePlan),
          },
          khTt: formatCompactMoney(item.cashPlan),
          lkTtThang: formatCompactMoney(item.cashActual),
          pctTt: { type: "pill", value: formatPercent(item.cashPercent) },
          vsPrevDt: {
            type: "pill",
            value: formatPercent(item.revenueVsPrevPercent),
          },
        })),
      ],
    },
  };
}