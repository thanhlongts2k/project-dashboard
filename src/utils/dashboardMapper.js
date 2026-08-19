import {
  BLANK,
  formatCompactMoney,
  formatGap,
  formatPercent,
  toNullableNumber,
} from "./numberFormat";

function normalizeCode(code = "") {
  return String(code).trim().replace(/\s+/g, "_").toUpperCase();
}

function displayNameFromCode(code = "", fallbackName = "") {
  const map = {
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

  return map[normalizeCode(code)] || fallbackName || normalizeCode(code);
}

function buIdFromCode(code = "") {
  if (!code) return null;
  const raw = String(code).trim().toLowerCase();
  const normalized = normalizeCode(code);

  const map = {
    BU_ELEVATOR: "elevator",
    BU_IBIZ_PREMIUM: "ibizPremium",
    BU_IBIZ_VALUE: "ibizValue",
    BU_ECO: "eco",
    BU_AGRITECH: "agritech",
    BU_AGRITECH___ECO: "eco",
    BU_AGRITECH_ECO: "eco",
    BU_MANUFACTURING: "manufacturing",
    BU_DTCT: "dtct",
    BU_ĐTCT: "dtct",
    ĐTCT: "dtct",
    DTCT: "dtct",
    OVERSEA: "oversea",
    ELEVATOR: "elevator",
    IBIZPREMIUM: "ibizPremium",
    IBIZVALUE: "ibizValue",
    ECO: "eco",
    AGRITECH: "agritech",
    MANUFACTURING: "manufacturing",
  };

  if (map[normalized]) return map[normalized];
  if (raw.includes("elevator") || raw.includes("thang máy")) return "elevator";
  if (raw.includes("premium")) return "ibizPremium";
  if (raw.includes("value")) return "ibizValue";
  if (raw.includes("agritech") && !raw.includes("eco")) return "agritech";
  if (raw.includes("eco") || raw.includes("agritech")) return "eco";
  if (raw.includes("manufacturing") || raw.includes("sản xuất") || raw.includes("nhà máy")) return "manufacturing";
  if (raw.includes("dtct") || raw.includes("đtct") || raw.includes("cho thuê") || raw.includes("đầu tư")) return "dtct";
  if (raw.includes("oversea") || raw.includes("campuchia")) return "oversea";
  return null;
}

function toneFromBuId(buId = "") {
  const map = {
    elevator: "",
    ibizPremium: "amber",
    ibizValue: "red",
    eco: "green",
    agritech: "red",
    manufacturing: "",
  };

  return map[buId] || "";
}

function getPercent(rawPercent, actual, plan) {
  const raw = toNullableNumber(rawPercent);
  if (raw !== null) return raw;

  const a = toNullableNumber(actual);
  const p = toNullableNumber(plan);

  if (a === null || p === null || p === 0) return null;
  return (a / p) * 100;
}

function formatPercentOrBlank(value) {
  return value === null || value === undefined ? BLANK : formatPercent(value);
}

function getGapValue(actual, plan) {
  const a = toNullableNumber(actual);
  const p = toNullableNumber(plan);
  if (a === null || p === null) return null;
  return a - p;
}

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

function isFullMonthRange(startDate, endDate) {
  const from = normalizeDateValue(startDate);
  const to = normalizeDateValue(endDate);
  if (!from || !to) return false;
  const isStartOfMon = from.getDate() === 1;
  const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  const isEndOfMon =
    to.getDate() === lastDay &&
    from.getMonth() === to.getMonth() &&
    from.getFullYear() === to.getFullYear();
  return isStartOfMon && isEndOfMon;
}

// Khoảng "đầu tháng → một ngày trong cùng tháng" (month-to-date, gồm cả trọn tháng).
// Với khoảng này, backend đã tính sẵn mtd_* trong bu-performance → dùng thẳng,
// không tự cộng dồn từ daily (tránh lệch số do daily thiếu/ghi khác).
function isMonthToDateRange(startDate, endDate) {
  const from = normalizeDateValue(startDate);
  const to = normalizeDateValue(endDate);
  if (!from || !to) return false;
  return (
    from.getDate() === 1 &&
    from.getMonth() === to.getMonth() &&
    from.getFullYear() === to.getFullYear()
  );
}

// Aggregate daily rows to get period totals for revenue and collection
export function aggregateDailyTotals(dailyRows) {
  if (!Array.isArray(dailyRows) || dailyRows.length === 0) return null;
  const totalRevenue = dailyRows.reduce((sum, row) => sum + (Number(row?.daily_revenue) || 0), 0);
  const totalCollection = dailyRows.reduce((sum, row) => sum + (Number(row?.daily_collection) || 0), 0);
  return { totalRevenue, totalCollection };
}

// Gộp daily theo từng BU (bu_code) để lấy actual đúng theo kỳ khi lọc khoảng ngày lẻ
function aggregateDailyByBuCode(dailyRows) {
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

function formatDMY(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Ngày chốt số liệu Oversea = cuối kỳ đang lọc (endDate), mặc định hôm nay.
// MTD: từ ngày đầu tháng của ngày chốt → ngày chốt.
// YTD: từ 01/01 của năm ngày chốt → ngày chốt.
function buildOverseaPeriodBasis(startDate, endDate) {
  const anchor =
    normalizeDateValue(endDate) ||
    normalizeDateValue(startDate) ||
    normalizeDateValue(new Date());

  const mtdStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const ytdStart = new Date(anchor.getFullYear(), 0, 1);
  const anchorText = formatDMY(anchor);

  return {
    MTD: `${formatDMY(mtdStart)} – ${anchorText}`,
    YTD: `${formatDMY(ytdStart)} – ${anchorText}`,
  };
}

function formatRangeDisplay(startDate, endDate) {
  const from = normalizeDateValue(startDate);
  const to = normalizeDateValue(endDate);

  if (!from || !to) return BLANK;

  const formatOne = (d) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return `${formatOne(from)} – ${formatOne(to)}`;
}

function buildOverviewMetricLabels(startDate, endDate) {
  if (!startDate || !endDate) {
    return {
      revenueCardLabel: "DT tháng (MTD)",
      cashCardLabel: "Thu tiền tháng",
      cashAlertLabel: "Thu tiền tháng",
    };
  }

  if (isSingleDayRange(startDate, endDate)) {
    return {
      revenueCardLabel: "DT theo ngày",
      cashCardLabel: "Thu tiền theo ngày",
      cashAlertLabel: "Thu tiền ngày",
    };
  }

  return {
    revenueCardLabel: "DT theo kỳ",
    cashCardLabel: "Thu tiền theo kỳ",
    cashAlertLabel: "Thu tiền theo kỳ",
  };
}

function getSeverity(percent, gapValue, reverse = false) {
  const p = toNullableNumber(percent);
  const g = toNullableNumber(gapValue);

  if (p === null && g === null) return 99;

  if (reverse) {
    if ((p !== null && p >= 100) || (g !== null && g > 0)) return 1;
    if (p !== null && p >= 70) return 2;
    if (p !== null && p >= 50) return 3;
    return 4;
  }

  if ((p !== null && p < 50) || (g !== null && g < 0)) return 1;
  if (p !== null && p < 70) return 2;
  if (p !== null && p < 100) return 3;
  return 4;
}

function getToneByPercent(percent, reverse = false) {
  const p = toNullableNumber(percent);
  if (p === null) return "neutral";

  if (!reverse) {
    if (p < 50) return "danger";
    if (p < 70) return "orange";
    if (p < 100) return "warn";
    return "good";
  }

  if (p >= 100) return "danger";
  if (p >= 70) return "orange";
  if (p >= 50) return "warn";
  return "good";
}

function getGapTone(gapValue, reverse = false) {
  const g = toNullableNumber(gapValue);
  if (g === null) return "neutral";

  if (reverse) {
    if (g > 0) return "danger";
    if (g < 0) return "good";
    return "neutral";
  }

  if (g < 0) return "danger";
  if (g > 0) return "good";
  return "neutral";
}

function buildCard(
  label,
  actual,
  plan,
  percent,
  accent,
  threshold = false,
  reverseTone = false
) {
  return {
    label,
    value: actual ?? 0,
    valueText: formatCompactMoney(actual),
    targetText: threshold
      ? `Ngưỡng: ${formatCompactMoney(plan)}`
      : `/ ${formatCompactMoney(plan)}`,
    percent,
    percentText: formatPercentOrBlank(percent),
    accent,
    progressColor: accent,
    deltaText: formatGap(actual, plan),
    note: "",
    unit: "",
    reverseTone,
  };
}

function buildFinanceCard(
  label,
  actual,
  plan,
  percent,
  accent,
  reverseTone = false
) {
  return {
    label,
    value: actual ?? 0,
    valueText: formatCompactMoney(actual),
    targetText: `KH: ${formatCompactMoney(plan)}`,
    percent,
    percentText: formatPercentOrBlank(percent),
    accent,
    progressColor: accent,
    deltaText: formatGap(actual, plan),
    note: "",
    unit: "",
    reverseTone,
  };
}

// Card doanh thu Oversea / không gồm Oversea (MTD, YTD) — chỉ có actual, % là tỷ trọng trên tổng DT cùng kỳ
function buildOverseaCard(label, actual, shareBase, accent, periodText, basisText) {
  const share =
    actual !== null && shareBase !== null && shareBase > 0
      ? Math.round((actual / shareBase) * 1000) / 10
      : null;

  return {
    label: basisText ? `${label} · ${basisText}` : label,
    value: actual ?? 0,
    valueText: formatCompactMoney(actual),
    targetText:
      shareBase === null
        ? periodText
        : `/ ${formatCompactMoney(shareBase)} tổng DT ${periodText}`,
    percent: share,
    percentText: share === null ? BLANK : formatPercent(share),
    accent,
    progressColor: accent,
    deltaText: "",
    note: "",
    unit: "",
  };
}

function buildAlertRow(
  item,
  percentValue,
  actualValue,
  planValue,
  extra = {},
  options = {}
) {
  const gapValue = getGapValue(actualValue, planValue);
  const reverseTone = options.reverseTone || false;

  return {
    item,
    percent: formatPercentOrBlank(percentValue),
    gap:
      actualValue === BLANK || planValue === BLANK
        ? BLANK
        : formatGap(actualValue, planValue),
    percentTone:
      options.percentTone || getToneByPercent(percentValue, reverseTone),
    gapTone: options.gapTone || getGapTone(gapValue, reverseTone),
    dotTone: options.dotTone || getToneByPercent(percentValue, reverseTone),
    reverseTone,
    _severity: getSeverity(percentValue, gapValue, reverseTone),
    ...extra,
  };
}

function buildSummaryMainRow(item) {
  return {
    isTotal: false,
    isSub: false,
    buId: item.buId,
    bu: item.label,
    owner: item.owner,

    revenueTarget: formatCompactMoney(item.revenuePlan),
    revenueTargetRaw: item.revenuePlan,
    revenueActual: formatCompactMoney(item.revenueActual),
    revenueActualRaw: item.revenueActual,
    revenuePercent: formatPercentOrBlank(item.revenuePercent),
    revenuePercentValue: item.revenuePercent,
    revenueGap: formatGap(item.revenueActual, item.revenuePlan),

    cashTarget: formatCompactMoney(item.cashPlan),
    cashTargetRaw: item.cashPlan,
    cashActual: formatCompactMoney(item.cashActual),
    cashActualRaw: item.cashActual,
    cashPercent: formatPercentOrBlank(item.cashPercent),
    cashPercentValue: item.cashPercent,
    cashGap: formatGap(item.cashActual, item.cashPlan),

    inventoryTargetRaw: item.inventoryPlan,
    inventoryActualRaw: item.inventoryActual,
    inventoryPercentValue: item.inventoryPercent,

    debtTargetRaw: item.debtPlan,
    debtActualRaw: item.debtActual,
    debtPercentValue: item.debtPercent,

    cashBalanceTargetRaw: item.cashBalancePlan,
    cashBalanceActualRaw: item.cashBalanceActual,
    cashBalancePercentValue: item.cashBalancePercent,

    opexTargetRaw: item.opexPlan,
    opexActualRaw: item.opexActual,
    opexPercentValue: item.opexPercent,

    vsPrev: BLANK,
  };
}

function buildSummarySubRow(subUnit, perfRow) {
  const revenuePlan = perfRow ? toNullableNumber(perfRow?.mtd_revenue_plan) : null;
  const revenueActual = perfRow ? toNullableNumber(perfRow?.mtd_revenue_actual) : null;
  const cashPlan = perfRow ? toNullableNumber(perfRow?.mtd_collection_plan) : null;
  const cashActual = perfRow ? toNullableNumber(perfRow?.mtd_collection_actual) : null;

  const revenuePercent = perfRow
    ? getPercent(perfRow?.revenue_kpi, revenueActual, revenuePlan)
    : null;
  const cashPercent = perfRow
    ? getPercent(perfRow?.collection_kpi, cashActual, cashPlan)
    : null;

  return {
    isTotal: false,
    isSub: true,
    buId: null,
    bu: `— ${subUnit.name}`,
    owner: "",

    revenueTarget: perfRow ? formatCompactMoney(revenuePlan) : BLANK,
    revenueTargetRaw: revenuePlan,
    revenueActual: perfRow ? formatCompactMoney(revenueActual) : BLANK,
    revenueActualRaw: revenueActual,
    revenuePercent: perfRow ? formatPercentOrBlank(revenuePercent) : BLANK,
    revenuePercentValue: revenuePercent,
    revenueGap: perfRow ? formatGap(revenueActual, revenuePlan) : BLANK,

    cashTarget: perfRow ? formatCompactMoney(cashPlan) : BLANK,
    cashTargetRaw: cashPlan,
    cashActual: perfRow ? formatCompactMoney(cashActual) : BLANK,
    cashActualRaw: cashActual,
    cashPercent: perfRow ? formatPercentOrBlank(cashPercent) : BLANK,
    cashPercentValue: cashPercent,
    cashGap: perfRow ? formatGap(cashActual, cashPlan) : BLANK,

    inventoryTargetRaw: perfRow ? toNullableNumber(perfRow?.inventory_value_plan) : null,
    inventoryActualRaw: perfRow ? toNullableNumber(perfRow?.inventory_value_actual) : null,
    inventoryPercentValue: perfRow
      ? getPercent(
          perfRow?.inventory_vs_plan,
          perfRow?.inventory_value_actual,
          perfRow?.inventory_value_plan
        )
      : null,

    debtTargetRaw: perfRow ? toNullableNumber(perfRow?.bank_debt_plan) : null,
    debtActualRaw: perfRow ? toNullableNumber(perfRow?.bank_debt_actual) : null,
    debtPercentValue: perfRow
      ? getPercent(null, perfRow?.bank_debt_actual, perfRow?.bank_debt_plan)
      : null,

    cashBalanceTargetRaw: perfRow ? toNullableNumber(perfRow?.cash_balance_plan) : null,
    cashBalanceActualRaw: perfRow ? toNullableNumber(perfRow?.cash_balance_actual) : null,
    cashBalancePercentValue: perfRow
      ? getPercent(null, perfRow?.cash_balance_actual, perfRow?.cash_balance_plan)
      : null,

    opexTargetRaw: perfRow ? toNullableNumber(perfRow?.opex_plan) : null,
    opexActualRaw: perfRow ? toNullableNumber(perfRow?.opex_actual) : null,
    opexPercentValue: perfRow
      ? getPercent(null, perfRow?.opex_actual, perfRow?.opex_plan)
      : null,

    vsPrev: BLANK,
  };
}

function buildRangeAwareDailySeries(rows, month, year, startDate, endDate) {
  const dailyRows = Array.isArray(rows) ? rows : [];

  let from = normalizeDateValue(startDate);
  let to = normalizeDateValue(endDate);

  if (!from || !to) {
    from = new Date(year, month - 1, 1);
    from.setHours(0, 0, 0, 0);

    to = new Date(year, month, 0);
    to.setHours(0, 0, 0, 0);
  }

  if (from.getTime() > to.getTime()) {
    const temp = from;
    from = to;
    to = temp;
  }

  const byDate = new Map();

  dailyRows.forEach((item) => {
    const key = String(item?.date || "").slice(0, 10);
    if (!key) return;

    const revenue = Number(item?.daily_revenue || 0) || 0;
    const collection = Number(item?.daily_collection || 0) || 0;

    const current = byDate.get(key) || { revenue: 0, collection: 0 };
    current.revenue += revenue;
    current.collection += collection;
    byDate.set(key, current);
  });

  const result = [];
  const cursor = new Date(from);

  while (cursor.getTime() <= to.getTime()) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    const value = byDate.get(key) || { revenue: 0, collection: 0 };

    result.push({
      date: key,
      name: `${dd}/${mm}`,
      label: `${dd}/${mm}`,
      revenue: value.revenue,
      collection: value.collection,
      cash: value.collection,
      dailyRevenue: value.revenue,
      dailyCollection: value.collection,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

export function buildOverviewSummaryColumns(month, startDate, endDate) {
  if (startDate && endDate) {
    return [
      { key: "bu", label: "BU" },
      { key: "owner", label: "Phụ trách" },
      { key: "revenueTarget", label: "KH DT" },
      { key: "revenueActual", label: "TH DT" },
      { key: "revenuePercent", label: "% KH DT" },
      { key: "revenueGap", label: "Gap DT" },
      { key: "cashTarget", label: "KH TT" },
      { key: "cashActual", label: "TH TT" },
      { key: "cashPercent", label: "% KH TT" },
      { key: "vsPrev", label: "vs kỳ trước" },
    ];
  }

  const mm = String(month).padStart(2, "0");
  const prev = String(month === 1 ? 12 : month - 1).padStart(2, "0");

  return [
    { key: "bu", label: "BU" },
    { key: "owner", label: "Phụ trách" },
    { key: "revenueTarget", label: "KH tháng DT" },
    { key: "revenueActual", label: `LK T${mm} DT` },
    { key: "revenuePercent", label: "% KH DT" },
    { key: "revenueGap", label: "Gap DT" },
    { key: "cashTarget", label: "KH tháng TT" },
    { key: "cashActual", label: `LK T${mm} TT` },
    { key: "cashPercent", label: "% KH TT" },
    { key: "vsPrev", label: `vs T${prev} DT` },
  ];
}

export function buildOverviewAlertColumns() {
  return [
    { key: "item", label: "BU / Chỉ tiêu" },
    { key: "percent", label: "% KH" },
    { key: "gap", label: "Gap" },
  ];
}

export function mapOverviewDashboard({
  rootRows,
  performanceRows,
  mainUnits,
  subUnits = [],
  dailyRows,
  month,
  year,
  startDate,
  endDate,
  // Optional: period actuals aggregated from daily rows for non-full-month ranges
  periodRevenue = null,
  periodCollection = null,
}) {
  // Dòng TỔNG: API only_roots=true có thể trả nhiều dòng root — ưu tiên dòng
  // Tổng công ty (business_unit null / code Global), không lấy bừa phần tử đầu.
  const rootList = Array.isArray(rootRows) ? rootRows : [];
  const rootRow =
    rootList.find(
      (row) =>
        row?.business_unit === null ||
        normalizeCode(row?.bu_code) === "GLOBAL"
    ) ||
    rootList[0] ||
    null;
  const mainList = Array.isArray(mainUnits) ? mainUnits : [];
  const subList = Array.isArray(subUnits) ? subUnits : [];
  const perfRows = Array.isArray(performanceRows) ? performanceRows : [];

  const perfByBusinessUnit = new Map(
    perfRows.map((row) => [Number(row?.business_unit), row])
  );

  const perfByCode = new Map(
    perfRows.map((row) => [normalizeCode(row?.bu_code), row])
  );

  // Chỉ tự cộng dồn từ daily khi khoảng lọc KHÔNG phải month-to-date
  // (vd: 05/07–12/07, tuần, hôm qua...). Khoảng đầu tháng → hôm nay dùng mtd_* từ API.
  const usePeriodOverride = !!(
    startDate && endDate && !isMonthToDateRange(startDate, endDate)
  );
  const dailyByBu = usePeriodOverride ? aggregateDailyByBuCode(dailyRows) : null;

  const buRows = mainList.map((unit) => {
    const perf =
      perfByBusinessUnit.get(Number(unit.id)) ||
      perfByCode.get(normalizeCode(unit.code)) ||
      null;

    const revenuePlan = toNullableNumber(perf?.mtd_revenue_plan);
    let revenueActual = toNullableNumber(perf?.mtd_revenue_actual);
    const cashPlan = toNullableNumber(perf?.mtd_collection_plan);
    let cashActual = toNullableNumber(perf?.mtd_collection_actual);

    // Lọc khoảng ngày lẻ: dùng actual theo kỳ (gộp từ daily) thay cho số lũy kế tháng (mtd_*)
    const buDaily = dailyByBu?.get(normalizeCode(unit.code)) || null;
    if (buDaily) {
      revenueActual = buDaily.revenue;
      cashActual = buDaily.collection;
    }

    const inventoryPlan = toNullableNumber(perf?.inventory_value_plan);
    const inventoryActual = toNullableNumber(perf?.inventory_value_actual);
    const debtPlan = toNullableNumber(perf?.bank_debt_plan);
    const debtActual = toNullableNumber(perf?.bank_debt_actual);
    const cashBalancePlan = toNullableNumber(perf?.cash_balance_plan);
    const cashBalanceActual = toNullableNumber(perf?.cash_balance_actual);
    const opexPlan = toNullableNumber(perf?.opex_plan);
    const opexActual = toNullableNumber(perf?.opex_actual);

    const revenuePercent = getPercent(
      buDaily ? null : perf?.revenue_kpi,
      revenueActual,
      revenuePlan
    );
    const cashPercent = getPercent(
      buDaily ? null : perf?.collection_kpi,
      cashActual,
      cashPlan
    );
    const inventoryPercent = getPercent(
      perf?.inventory_vs_plan,
      inventoryActual,
      inventoryPlan
    );
    const debtPercent = getPercent(null, debtActual, debtPlan);
    const cashBalancePercent = getPercent(null, cashBalanceActual, cashBalancePlan);
    const opexPercent = getPercent(null, opexActual, opexPlan);

    return {
      buId: buIdFromCode(unit.code),
      label: displayNameFromCode(unit.code, unit.name),
      owner: unit.manager || "",
      mainId: unit.id,
      code: unit.code,

      revenuePlan,
      revenueActual,
      revenuePercent,

      cashPlan,
      cashActual,
      cashPercent,

      inventoryPlan,
      inventoryActual,
      inventoryPercent,

      debtPlan,
      debtActual,
      debtPercent,

      cashBalancePlan,
      cashBalanceActual,
      cashBalancePercent,

      opexPlan,
      opexActual,
      opexPercent,
    };
  });

  let rootRevenuePlan = toNullableNumber(rootRow?.mtd_revenue_plan);
  // Khoảng ngày lẻ (không phải month-to-date): override actual bằng tổng daily theo kỳ.
  // Month-to-date / trọn tháng: dùng thẳng mtd_revenue_actual từ bu-performance.
  const rootRevenueActual =
    periodRevenue !== null && usePeriodOverride
      ? periodRevenue
      : toNullableNumber(rootRow?.mtd_revenue_actual);
  let rootCashPlan = toNullableNumber(rootRow?.mtd_collection_plan);
  const rootCashActual =
    periodCollection !== null && usePeriodOverride
      ? periodCollection
      : toNullableNumber(rootRow?.mtd_collection_actual);
  const rootInventoryPlan = toNullableNumber(rootRow?.inventory_value_plan);
  const rootInventoryActual = toNullableNumber(rootRow?.inventory_value_actual);
  const rootDebtPlan = toNullableNumber(rootRow?.bank_debt_plan);
  const rootDebtActual = toNullableNumber(rootRow?.bank_debt_actual);
  const rootCashBalancePlan = toNullableNumber(rootRow?.cash_balance_plan);
  const rootCashBalanceActual = toNullableNumber(rootRow?.cash_balance_actual);
  const rootOpexPlan = toNullableNumber(rootRow?.opex_plan);
  const rootOpexActual = toNullableNumber(rootRow?.opex_actual);

  // Doanh thu Oversea / không gồm Oversea (MTD, YTD) — từ API bu-performance only_roots=true
  const rootMtdOverseaActual = toNullableNumber(
    rootRow?.mtd_revenue_oversea_actual
  );
  const rootMtdExcludeOverseaActual = toNullableNumber(
    rootRow?.mtd_revenue_exclude_oversea_actual
  );
  const rootYtdOverseaActual = toNullableNumber(
    rootRow?.ytd_revenue_oversea_actual
  );
  const rootYtdExcludeOverseaActual = toNullableNumber(
    rootRow?.ytd_revenue_exclude_oversea_actual
  );

  // Mẫu số tính tỷ trọng = Oversea + không gồm Oversea của cùng kỳ
  const mtdOverseaShareBase =
    rootMtdOverseaActual !== null || rootMtdExcludeOverseaActual !== null
      ? (rootMtdOverseaActual || 0) + (rootMtdExcludeOverseaActual || 0)
      : null;
  const ytdOverseaShareBase =
    rootYtdOverseaActual !== null || rootYtdExcludeOverseaActual !== null
      ? (rootYtdOverseaActual || 0) + (rootYtdExcludeOverseaActual || 0)
      : null;

  // Khi lọc khoảng ngày lẻ, API đôi khi trả KH (kế hoạch) = 0/null cho dòng TỔNG ở truy vấn theo ngày.
  // Giữ nguyên KH tháng: lấy tổng KH tháng của các BU để dòng TỔNG khớp với tổng các dòng con.
  if (usePeriodOverride) {
    if (rootRevenuePlan === null || rootRevenuePlan === 0) {
      const sum = buRows.reduce((acc, b) => acc + (b.revenuePlan || 0), 0);
      if (sum > 0) rootRevenuePlan = sum;
    }
    if (rootCashPlan === null || rootCashPlan === 0) {
      const sum = buRows.reduce((acc, b) => acc + (b.cashPlan || 0), 0);
      if (sum > 0) rootCashPlan = sum;
    }
  }

  const rootRevenuePercent = getPercent(
    usePeriodOverride ? null : rootRow?.revenue_kpi,
    rootRevenueActual,
    rootRevenuePlan
  );
  const rootCashPercent = getPercent(
    usePeriodOverride ? null : rootRow?.collection_kpi,
    rootCashActual,
    rootCashPlan
  );
  const rootInventoryPercent = getPercent(
    rootRow?.inventory_vs_plan,
    rootInventoryActual,
    rootInventoryPlan
  );
  const rootDebtPercent = getPercent(null, rootDebtActual, rootDebtPlan);
  const rootCashBalancePercent = getPercent(
    null,
    rootCashBalanceActual,
    rootCashBalancePlan
  );
  const rootOpexPercent = getPercent(null, rootOpexActual, rootOpexPlan);

  const summaryRows = [
    {
      isTotal: true,
      isSub: false,
      buId: null,
      bu: "TỔNG",
      owner: "",

      revenueTarget: formatCompactMoney(rootRevenuePlan),
      revenueTargetRaw: rootRevenuePlan,
      revenueActual: formatCompactMoney(rootRevenueActual),
      revenueActualRaw: rootRevenueActual,
      revenuePercent: formatPercentOrBlank(rootRevenuePercent),
      revenuePercentValue: rootRevenuePercent,
      revenueGap: formatGap(rootRevenueActual, rootRevenuePlan),

      cashTarget: formatCompactMoney(rootCashPlan),
      cashTargetRaw: rootCashPlan,
      cashActual: formatCompactMoney(rootCashActual),
      cashActualRaw: rootCashActual,
      cashPercent: formatPercentOrBlank(rootCashPercent),
      cashPercentValue: rootCashPercent,
      cashGap: formatGap(rootCashActual, rootCashPlan),

      inventoryTargetRaw: rootInventoryPlan,
      inventoryActualRaw: rootInventoryActual,
      inventoryPercentValue: rootInventoryPercent,

      debtTargetRaw: rootDebtPlan,
      debtActualRaw: rootDebtActual,
      debtPercentValue: rootDebtPercent,

      cashBalanceTargetRaw: rootCashBalancePlan,
      cashBalanceActualRaw: rootCashBalanceActual,
      cashBalancePercentValue: rootCashBalancePercent,

      opexTargetRaw: rootOpexPlan,
      opexActualRaw: rootOpexActual,
      opexPercentValue: rootOpexPercent,

      vsPrev: BLANK,
    },
  ];

  buRows.forEach((item) => {
    summaryRows.push(buildSummaryMainRow(item));

    const childUnits = subList.filter(
      (sub) => Number(sub.parent) === Number(item.mainId)
    );

    childUnits.forEach((sub) => {
      const perf =
        perfByBusinessUnit.get(Number(sub.id)) ||
        perfByCode.get(normalizeCode(sub.code)) ||
        null;

      summaryRows.push(buildSummarySubRow(sub, perf));
    });
  });

  const inventoryGapRaw = getGapValue(rootInventoryActual, rootInventoryPlan);
  const debtGapRaw = getGapValue(rootDebtActual, rootDebtPlan);

  const metricLabels = buildOverviewMetricLabels(startDate, endDate);
  const overseaBasis = buildOverseaPeriodBasis(startDate, endDate);
  const headerPeriodLabel =
    startDate && endDate
      ? formatRangeDisplay(startDate, endDate)
      : `Tháng ${String(month).padStart(2, "0")}/${year}`;

  const mainBuAlertRows = buRows.flatMap((item) => [
    buildAlertRow(
      `${item.label} — Doanh thu`,
      item.revenuePercent,
      item.revenueActual,
      item.revenuePlan,
      { buId: item.buId }
    ),
    buildAlertRow(
      `${item.label} — Thu tiền`,
      item.cashPercent,
      item.cashActual,
      item.cashPlan,
      { buId: item.buId }
    ),
  ]);

  const globalAlertRows = [
    buildAlertRow(
      metricLabels.cashAlertLabel,
      rootCashPercent,
      rootCashActual,
      rootCashPlan
    ),
    buildAlertRow(
      "Nợ NH sát ngưỡng",
      rootDebtPercent,
      rootDebtActual,
      rootDebtPlan,
      {},
      {
        reverseTone: false,
        percentTone: getToneByPercent(rootDebtPercent, false),
        dotTone: getToneByPercent(rootDebtPercent, false),
        gapTone: getGapTone(debtGapRaw, false),
      }
    ),
    buildAlertRow(
      "Tồn kho vượt ngưỡng",
      rootInventoryPercent,
      rootInventoryActual,
      rootInventoryPlan,
      {},
      {
        reverseTone: true,
        percentTone: getToneByPercent(rootInventoryPercent, true),
        dotTone: getToneByPercent(rootInventoryPercent, true),
        gapTone: getGapTone(inventoryGapRaw, true),
      }
    ),
  ];

  const subPlaceholderAlerts = subList
    .filter((item) =>
      mainList.some((main) => Number(main.id) === Number(item.parent))
    )
    .map((item) => {
      const perf =
        perfByBusinessUnit.get(Number(item.id)) ||
        perfByCode.get(normalizeCode(item.code)) ||
        null;

      if (!perf) {
        return buildAlertRow(`${item.name} — DT`, null, BLANK, BLANK, {
          buId: buIdFromCode(
            mainList.find((main) => Number(main.id) === Number(item.parent))?.code ||
              ""
          ),
        });
      }

      const revenuePlan = toNullableNumber(perf?.mtd_revenue_plan);
      const revenueActual = toNullableNumber(perf?.mtd_revenue_actual);
      const revenuePercent = getPercent(
        perf?.revenue_kpi,
        revenueActual,
        revenuePlan
      );

      return buildAlertRow(
        `${item.name} — DT`,
        revenuePercent,
        revenueActual,
        revenuePlan,
        {
          buId: buIdFromCode(
            mainList.find((main) => Number(main.id) === Number(item.parent))?.code ||
              ""
          ),
        }
      );
    });

  const alertRows = [...globalAlertRows, ...mainBuAlertRows, ...subPlaceholderAlerts]
    .sort((a, b) => (a._severity || 99) - (b._severity || 99))
    .map(({ _severity, reverseTone, ...rest }) => rest);

  return {
    header: {
      title: "Dashboard Tổng Quan",
      reportDate: "",
      monthLabel: headerPeriodLabel,
      buLabel: "Tất cả BU",
      updatedAt: "",
      ownerOptions: [
        "Tất cả phụ trách",
        ...[...new Set(buRows.map((item) => item.owner).filter(Boolean))],
      ],
    },

    topKpis: [
      buildCard(
        metricLabels.revenueCardLabel,
        rootRevenueActual,
        rootRevenuePlan,
        rootRevenuePercent,
        "blue"
      ),
      buildCard(
        metricLabels.cashCardLabel,
        rootCashActual,
        rootCashPlan,
        rootCashPercent,
        "teal"
      ),
      buildCard(
        "Tồn kho",
        rootInventoryActual,
        rootInventoryPlan,
        rootInventoryPercent,
        "amber",
        true,
        true
      ),
      buildCard(
        "Nợ ngân hàng",
        rootDebtActual,
        rootDebtPlan,
        rootDebtPercent,
        "purple",
        true,
        true
      ),
    ],

    overseaKpis: [
      buildOverseaCard(
        "Doanh thu Oversea MTD (Thực tế)",
        rootMtdOverseaActual,
        mtdOverseaShareBase,
        "blue",
        "MTD",
        overseaBasis.MTD
      ),
      buildOverseaCard(
        "DT không bao gồm Oversea MTD (Thực tế)",
        rootMtdExcludeOverseaActual,
        mtdOverseaShareBase,
        "teal",
        "MTD",
        overseaBasis.MTD
      ),
      buildOverseaCard(
        "Doanh thu Oversea YTD (Thực tế)",
        rootYtdOverseaActual,
        ytdOverseaShareBase,
        "blue",
        "YTD",
        overseaBasis.YTD
      ),
      buildOverseaCard(
        "DT không bao gồm Oversea YTD (Thực tế)",
        rootYtdExcludeOverseaActual,
        ytdOverseaShareBase,
        "teal",
        "YTD",
        overseaBasis.YTD
      ),
    ],

    dailySeries: buildRangeAwareDailySeries(
      dailyRows,
      month,
      year,
      startDate,
      endDate
    ),

    charts: {
      revenue: buRows.map((item) => ({
        buId: item.buId,
        name: item.label,
        target: item.revenuePlan,
        actual: item.revenueActual,
        gap:
          item.revenuePlan !== null && item.revenueActual !== null
            ? Math.max(item.revenuePlan - item.revenueActual, 0)
            : null,
      })),
      cash: buRows.map((item) => ({
        buId: item.buId,
        name: item.label,
        target: item.cashPlan,
        actual: item.cashActual,
        gap:
          item.cashPlan !== null && item.cashActual !== null
            ? Math.max(item.cashPlan - item.cashActual, 0)
            : null,
      })),
    },

    summaryColumns: buildOverviewSummaryColumns(month, startDate, endDate),
    summaryRows,

    alertColumns: buildOverviewAlertColumns(),
    alertRows,

    financeKpis: [
      buildFinanceCard(
        "Tiền cuối kỳ",
        rootCashBalanceActual,
        rootCashBalancePlan,
        rootCashBalancePercent,
        "teal"
      ),
      buildFinanceCard(
        "Hàng tồn kho",
        rootInventoryActual,
        rootInventoryPlan,
        rootInventoryPercent,
        "amber",
        true
      ),
      buildFinanceCard(
        "Nợ ngân hàng",
        rootDebtActual,
        rootDebtPlan,
        rootDebtPercent,
        "purple",
        true
      ),
      buildFinanceCard(
        "Chi phí vận hành (tạm tính)",
        rootOpexActual,
        rootOpexPlan,
        rootOpexPercent,
        "blue"
      ),
    ],

    buTabs: buRows
      .filter((item) => item.buId)
      .map((item) => ({
        id: item.buId,
        label: item.label,
        tone: toneFromBuId(item.buId),
        owner: item.owner,
        mainId: item.mainId,
        code: item.code,
      })),

    buDetails: {},
  };
}