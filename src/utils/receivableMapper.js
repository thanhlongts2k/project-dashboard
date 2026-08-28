import { formatCompactMoney, formatGap, formatPercent } from "./numberFormat";

const BLANK = "—";

const CANONICAL_BU_KEYS = [
  "BU_ELEVATOR",
  "BU_IBIZ_PREMIUM",
  "BU_IBIZ_VALUE",
  "BU_ECO",
  "BU_AGRITECH",
  "BU_SAB",
  "BU_MANUFACTURING",
  "BU_DTCT",
  "BU_OVERSEA",
];

const BU_ORDER = CANONICAL_BU_KEYS;

const CANONICAL_BU_CONFIG = {
  BU_ELEVATOR: { key: "BU_ELEVATOR", buId: "elevator", label: "Elevator", shortLabel: "Elevator", color: "#185FA5" },
  BU_IBIZ_PREMIUM: { key: "BU_IBIZ_PREMIUM", buId: "premium", label: "IBIZ Premium", shortLabel: "Premium", color: "#1D9E75" },
  BU_IBIZ_VALUE: { key: "BU_IBIZ_VALUE", buId: "value", label: "IBIZ Value", shortLabel: "Value", color: "#D85A30" },
  BU_ECO: { key: "BU_ECO", buId: "eco", label: "ECO", shortLabel: "Eco", color: "#BA7517" },
  BU_AGRITECH: { key: "BU_AGRITECH", buId: "agritech", label: "Agritech", shortLabel: "Agritech", color: "#534AB7" },
  BU_SAB: { key: "BU_SAB", buId: "sab", label: "SAB", shortLabel: "SAB", color: "#0284c7" },
  BU_MANUFACTURING: { key: "BU_MANUFACTURING", buId: "manufacturing", label: "Sản xuất", shortLabel: "SX", color: "#888780" },
  BU_DTCT: { key: "BU_DTCT", buId: "dtct", label: "Đầu tư cho thuê / ĐTCT", shortLabel: "ĐTCT", color: "#0891b2" },
  BU_OVERSEA: { key: "BU_OVERSEA", buId: "oversea", label: "Oversea", shortLabel: "Oversea", color: "#7c3aed" },
};

const BU_META = {
  ...CANONICAL_BU_CONFIG,
  SAB: CANONICAL_BU_CONFIG.BU_SAB,
  ĐTCT: CANONICAL_BU_CONFIG.BU_DTCT,
  DTCT: CANONICAL_BU_CONFIG.BU_DTCT,
  BU_ĐTCT: CANONICAL_BU_CONFIG.BU_DTCT,
  OVERSEA: CANONICAL_BU_CONFIG.BU_OVERSEA,
};

function normalizeBuCode(code = "") {
  return String(code).trim().replace(/\s+/g, "_").toUpperCase();
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function getEffectiveCollectedValue(raw = {}) {
  const apiTotal = toNumber(raw?.total_collected);
  const due = toNumber(raw?.collected_due);
  const inTermCod = toNumber(raw?.collected_in_term_cod);

  // Ưu tiên total_collected nếu API trả đúng số dương
  if (apiTotal > 0) return apiTotal;

  // Nếu total_collected không usable, lấy phần thu thực tế dương
  return due + Math.max(inTermCod, 0);
}

function formatDateDisplay(dateString) {
  if (!dateString) return BLANK;
  const parts = String(dateString).split("-");
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateShort(dateString) {
  if (!dateString) return BLANK;
  const parts = String(dateString).split("-");
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}`;
}

function buildEmptyKpi(label, accent, targetText = BLANK, deltaText = BLANK) {
  return {
    label,
    valueText: BLANK,
    targetText,
    percent: null,
    percentText: BLANK,
    accent,
    deltaText,
    note: "",
    unit: "",
  };
}

function getCanonicalBuKey(code = "", fallbackName = "") {
  const normalized = normalizeBuCode(code);
  const raw = String(code).trim().toLowerCase();
  const nameNorm = String(fallbackName || "").toLowerCase();

  if (
    normalized === "BU_ELEVATOR" ||
    normalized === "ELEVATOR" ||
    raw.includes("elevator") ||
    nameNorm.includes("elevator") ||
    nameNorm.includes("thang máy")
  ) {
    return "BU_ELEVATOR";
  }
  if (
    normalized === "BU_IBIZ_PREMIUM" ||
    normalized === "IBIZ_PREMIUM" ||
    normalized === "PREMIUM" ||
    normalized === "BU_PREMIUM" ||
    raw.includes("premium") ||
    nameNorm.includes("premium")
  ) {
    return "BU_IBIZ_PREMIUM";
  }
  if (
    normalized === "BU_IBIZ_VALUE" ||
    normalized === "IBIZ_VALUE" ||
    normalized === "VALUE" ||
    normalized === "BU_VALUE" ||
    raw.includes("value") ||
    nameNorm.includes("value")
  ) {
    return "BU_IBIZ_VALUE";
  }
  if (
    normalized === "BU_ECO" ||
    normalized === "ECO" ||
    raw === "eco" ||
    nameNorm.includes("eco")
  ) {
    return "BU_ECO";
  }
  if (
    normalized === "BU_SAB" ||
    normalized === "SAB" ||
    raw.includes("sab") ||
    nameNorm.includes("sab") ||
    nameNorm.includes("thủy sản") ||
    nameNorm.includes("tôm")
  ) {
    return "BU_SAB";
  }
  if (
    normalized === "BU_AGRITECH" ||
    normalized === "AGRITECH" ||
    raw.includes("agritech") ||
    nameNorm.includes("agritech")
  ) {
    return "BU_AGRITECH";
  }
  if (
    normalized === "BU_MANUFACTURING" ||
    normalized === "MANUFACTURING" ||
    normalized === "SAN_XUAT" ||
    normalized === "BU_SAN_XUAT" ||
    raw.includes("manufacturing") ||
    nameNorm.includes("sản xuất") ||
    nameNorm.includes("nhà máy")
  ) {
    return "BU_MANUFACTURING";
  }
  if (
    normalized === "BU_DTCT" ||
    normalized === "DTCT" ||
    normalized === "ĐTCT" ||
    normalized === "BU_ĐTCT" ||
    raw.includes("dtct") ||
    nameNorm.includes("cho thuê") ||
    nameNorm.includes("đầu tư cho thuê") ||
    nameNorm.includes("thuê")
  ) {
    return "BU_DTCT";
  }
  if (
    normalized === "BU_OVERSEA" ||
    normalized === "OVERSEA" ||
    raw.includes("oversea") ||
    nameNorm.includes("oversea") ||
    nameNorm.includes("nước ngoài")
  ) {
    return "BU_OVERSEA";
  }

  return CANONICAL_BU_CONFIG[normalized] ? normalized : "UNKNOWN";
}

function getBuMeta(code = "", fallbackName = "") {
  const canKey = getCanonicalBuKey(code, fallbackName);
  return (
    CANONICAL_BU_CONFIG[canKey] || {
      key: canKey,
      buId: canKey.toLowerCase(),
      label: fallbackName || canKey || BLANK,
      shortLabel: fallbackName || canKey || BLANK,
      color: "#888780",
    }
  );
}

function aggregateRowsByCanonicalBu(rowsRaw = []) {
  const map = new Map();
  CANONICAL_BU_KEYS.forEach((canKey) => {
    const config = CANONICAL_BU_CONFIG[canKey];
    map.set(canKey, {
      bu_code: canKey,
      bu_name: config.label,
      canonical_key: canKey,
      bu_id: config.buId,
      receivable_total: 0,
      commitment_overdue: 0,
      collected_due: 0,
      collected_in_term_cod: 0,
      total_collected: 0,
    });
  });

  (rowsRaw || []).forEach((raw) => {
    const canKey = getCanonicalBuKey(raw?.bu_code, raw?.bu_name);
    let target = map.get(canKey);
    if (!target) {
      target = {
        bu_code: canKey,
        bu_name: raw?.bu_name || canKey,
        canonical_key: canKey,
        bu_id: canKey.toLowerCase(),
        receivable_total: 0,
        commitment_overdue: 0,
        collected_due: 0,
        collected_in_term_cod: 0,
        total_collected: 0,
      };
      map.set(canKey, target);
    }

    const norm = normalizeApiRow(raw);
    target.receivable_total += norm.receivable_total;
    target.commitment_overdue += norm.commitment_overdue;
    target.collected_due += norm.collected_due;
    target.collected_in_term_cod += norm.collected_in_term_cod;
    target.total_collected += norm.total_collected;
  });

  return CANONICAL_BU_KEYS.map((canKey) => map.get(canKey)).filter(Boolean);
}

function normalizeApiRow(raw = {}) {
  return {
    ...raw,
    receivable_total: toNumber(raw.receivable_total),
    commitment_overdue: toNumber(raw.commitment_overdue),
    collected_due: toNumber(raw.collected_due),
    collected_in_term_cod: toNumber(raw.collected_in_term_cod),
    total_collected: getEffectiveCollectedValue(raw),
  };
}

function getSafeRow(rowMap, code) {
  const raw = rowMap.get(normalizeBuCode(code));

  if (!raw) {
    return normalizeApiRow({
      bu_code: code,
      bu_name: "",
      receivable_total: 0,
      commitment_overdue: 0,
      collected_due: 0,
      collected_in_term_cod: 0,
      total_collected: 0,
    });
  }

  return normalizeApiRow(raw);
}

function percentTone(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "warn";
  if (num < 30) return "danger";
  if (num < 70) return "warn";
  return "success";
}

function valueTone(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return "neutral";
  return num > 0 ? "success" : "danger";
}

function sumTotalsFromRows(rows = []) {
  return rows.reduce(
    (acc, item) => {
      acc.receivable_total += toNumber(item.receivable_total);
      acc.commitment_overdue += toNumber(item.commitment_overdue);
      acc.collected_due += toNumber(item.collected_due);
      acc.collected_in_term_cod += toNumber(item.collected_in_term_cod);
      acc.total_collected += toNumber(item.total_collected);
      return acc;
    },
    {
      receivable_total: 0,
      commitment_overdue: 0,
      collected_due: 0,
      collected_in_term_cod: 0,
      total_collected: 0,
    }
  );
}

function buildTopKpis({
  todayRows = [],
  todayTotals = {},
  tomorrowTotals = {},
  todayDate = "",
  tomorrowDate = "",
  yesterdayDate = "",
}) {
  const totalReceivableToday = toNumber(todayTotals.receivable_total);
  const totalCommitmentToday = toNumber(todayTotals.commitment_overdue);
  const totalCollectedDueToday = toNumber(todayTotals.collected_due);
  const totalCollectedToday = toNumber(todayTotals.total_collected);

  const totalReceivableTomorrow = toNumber(tomorrowTotals.receivable_total);
  const totalCommitmentTomorrow = toNumber(tomorrowTotals.commitment_overdue);

  const bestCollectedToday = [...todayRows].sort(
    (a, b) => toNumber(b.total_collected) - toNumber(a.total_collected)
  )[0];

  const dueVsCommitmentToday =
    totalCommitmentToday > 0
      ? (totalCollectedDueToday / totalCommitmentToday) * 100
      : 0;

  const collectVsTomorrowReceivable =
    totalReceivableTomorrow > 0
      ? (totalCollectedToday / totalReceivableTomorrow) * 100
      : 0;

  return [
    {
      label: "Tổng dư nợ cần thu",
      valueText: formatCompactMoney(totalReceivableToday),
      targetText: `${todayRows.length} BU tổng hợp`,
      percent: null,
      percentText: BLANK,
      accent: "blue",
      deltaText: `${formatDateShort(yesterdayDate)}: ${BLANK}`,
      note: "",
      unit: "",
    },
    {
      label: "Tổng thu trong ngày",
      valueText: formatCompactMoney(totalCollectedToday),
      targetText: "Thu nợ + trong hạn + COD",
      percent: totalCollectedToday > 0 ? 100 : 0,
      percentText: totalCollectedToday > 0 ? "100%" : "0%",
      accent: "teal",
      deltaText: totalCollectedToday > 0 ? "▲ Có phát sinh thu" : BLANK,
      note: "",
      unit: "",
    },
    {
      label: "Cam kết thu (nợ quá hạn)",
      valueText: formatCompactMoney(totalCommitmentToday),
      targetText: "Từ nợ đến hạn + quá hạn",
      percent: null,
      percentText: BLANK,
      accent: "blue",
      deltaText: `${formatDateShort(todayDate)}: ${BLANK}`,
      note: "",
      unit: "",
    },
    {
      label: "Đã thu từ nợ đến hạn",
      valueText: formatCompactMoney(totalCollectedDueToday),
      targetText: `vs cam kết ${formatCompactMoney(totalCommitmentToday)}`,
      percent: dueVsCommitmentToday,
      percentText:
        totalCommitmentToday > 0 ? formatPercent(dueVsCommitmentToday) : "0%",
      accent: "teal",
      deltaText:
        totalCommitmentToday > 0
          ? totalCollectedDueToday >= totalCommitmentToday
            ? `▲ ${formatCompactMoney(
                totalCollectedDueToday - totalCommitmentToday
              )} vượt cam kết`
            : `▼ ${formatCompactMoney(
                totalCommitmentToday - totalCollectedDueToday
              )} chưa đạt cam kết`
          : BLANK,
      note: "",
      unit: "",
    },
    {
      label: `Tỷ lệ thu / cam kết (${formatDateShort(tomorrowDate)})`,
      valueText:
        totalReceivableTomorrow > 0
          ? formatPercent(collectVsTomorrowReceivable)
          : "0%",
      targetText: `Còn phải thu: ${formatCompactMoney(totalReceivableTomorrow)}`,
      percent: collectVsTomorrowReceivable,
      percentText:
        totalReceivableTomorrow > 0
          ? formatPercent(collectVsTomorrowReceivable)
          : "0%",
      accent: "amber",
      deltaText:
        totalCommitmentTomorrow > 0
          ? `Cam kết: ${formatCompactMoney(totalCommitmentTomorrow)}`
          : bestCollectedToday
          ? `Thu nhiều nhất: ${
              getBuMeta(bestCollectedToday.bu_code, bestCollectedToday.bu_name)
                .label
            }`
          : BLANK,
      note: "",
      unit: "",
    },
  ];
}

function buildAlertRows({
  allCodes = [],
  todayMap,
  tomorrowMap,
  yesterdayMap,
  todayTotals = {},
  tomorrowTotals = {},
  todayDate = "",
}) {
  const alerts = [];
  const todayLabel = formatDateShort(todayDate);

  const enriched = allCodes.map((code) => {
    const todayRow = getSafeRow(todayMap, code);
    const tomorrowRow = getSafeRow(tomorrowMap, code);
    const yesterdayRow = getSafeRow(yesterdayMap, code);
    const meta = getBuMeta(code, todayRow.bu_name || tomorrowRow.bu_name);

    const tomorrowReceivable = tomorrowRow.receivable_total;
    const tomorrowCommitment = tomorrowRow.commitment_overdue;
    const todayCollected = todayRow.total_collected;
    const yesterdayCollected = yesterdayRow.total_collected;

    const collectVsTomorrowReceivable =
      tomorrowReceivable > 0 ? (todayCollected / tomorrowReceivable) * 100 : 0;

    const collectVsTomorrowCommitment =
      tomorrowCommitment > 0 ? (todayCollected / tomorrowCommitment) * 100 : 0;

    return {
      code,
      label: meta.label,
      todayRow,
      tomorrowRow,
      yesterdayRow,
      tomorrowReceivable,
      tomorrowCommitment,
      todayCollected,
      yesterdayCollected,
      collectVsTomorrowReceivable,
      collectVsTomorrowCommitment,
    };
  });

  // 1) BU chưa thu: còn phải thu ngày mai nhưng hôm nay chưa thu gì
  const noCollectedRows = enriched
    .filter((item) => item.tomorrowReceivable > 0 && item.todayCollected <= 0)
    .sort((a, b) => b.tomorrowReceivable - a.tomorrowReceivable)
    .slice(0, 2);

  noCollectedRows.forEach((item) => {
    alerts.push({
      label: `${item.label} — chưa thu`,
      status: "0%",
      note: "Cần đôn đốc",
      tone: "danger",
    });
  });

  // 2) BU không cam kết: còn phải thu nhưng không có cam kết
  const noCommitmentRow = enriched
    .filter((item) => item.tomorrowReceivable > 0 && item.tomorrowCommitment <= 0)
    .sort((a, b) => b.tomorrowReceivable - a.tomorrowReceivable)[0];

  if (noCommitmentRow) {
    alerts.push({
      label: `${noCommitmentRow.label} — không cam kết`,
      status: BLANK,
      note: "Thiếu cam kết",
      tone: "danger",
    });
  }

  // 3) Tỷ lệ thu toàn cục
  const totalCollectedToday = toNumber(todayTotals.total_collected);
  const totalReceivableTomorrow = toNumber(tomorrowTotals.receivable_total);

  const overallRate =
    totalReceivableTomorrow > 0
      ? (totalCollectedToday / totalReceivableTomorrow) * 100
      : 0;

  alerts.push({
    label: `Tỷ lệ thu ${todayLabel}`,
    status: formatPercent(overallRate),
    note:
      overallRate >= 100
        ? "Đạt tốt"
        : overallRate >= 70
        ? "Cần theo dõi"
        : "Chưa đạt",
    tone:
      overallRate >= 100
        ? "success"
        : overallRate >= 70
        ? "warn"
        : "danger",
  });

  // 4) BU thu thấp: nhỏ nhất nhưng > 0
  const lowCollected = enriched
    .filter((item) => item.todayCollected > 0)
    .sort((a, b) => a.todayCollected - b.todayCollected)[0];

  if (lowCollected) {
    alerts.push({
      label: `${lowCollected.label} — thu thấp`,
      status: formatCompactMoney(lowCollected.todayCollected),
      note: "Dưới kỳ vọng",
      tone: "warn",
    });
  }

  // 5) BU thu tốt: lớn nhất
  const bestCollected = enriched
    .filter((item) => item.todayCollected > 0)
    .sort((a, b) => b.todayCollected - a.todayCollected)[0];

  if (bestCollected) {
    alerts.push({
      label: `${bestCollected.label} — thu tốt`,
      status: formatCompactMoney(bestCollected.todayCollected),
      note: "Vượt kỳ vọng",
      tone: "success",
    });
  }

  // 6) BU vượt cam kết: hôm nay / cam kết ngày mai
  const exceededCommitment = enriched
    .filter(
      (item) =>
        item.tomorrowCommitment > 0 &&
        item.collectVsTomorrowCommitment > 100
    )
    .sort(
      (a, b) =>
        b.collectVsTomorrowCommitment - a.collectVsTomorrowCommitment
    )[0];

  if (exceededCommitment) {
    alerts.push({
      label: `${exceededCommitment.label} — vượt cam kết`,
      status: formatPercent(exceededCommitment.collectVsTomorrowCommitment),
      note: "Đạt tốt",
      tone: "success",
    });
  }

  return alerts;
}

export function buildEmptyReceivableReport(month, year) {
  return {
    header: {
      title: "Thu Nợ Khách Hàng Trọng Yếu",
      reportDate: BLANK,
      scopeLabel: "Bao gồm HISA",
      buLabel: "Tất cả BU",
      updatedAt: BLANK,
      todayLabel: BLANK,
      tomorrowLabel: BLANK,
      yesterdayLabel: BLANK,
      monthLabel: `Tháng ${String(month).padStart(2, "0")}/${year}`,
    },
    topKpis: [
      buildEmptyKpi("Tổng dư nợ cần thu", "blue", "0 BU tổng hợp", BLANK),
      buildEmptyKpi(
        "Tổng thu trong ngày",
        "teal",
        "Thu nợ + trong hạn + COD",
        BLANK
      ),
      buildEmptyKpi(
        "Cam kết thu (nợ quá hạn)",
        "blue",
        "Từ nợ đến hạn + quá hạn",
        BLANK
      ),
      buildEmptyKpi("Đã thu từ nợ đến hạn", "teal", `vs cam kết ${BLANK}`, BLANK),
      buildEmptyKpi(
        "Tỷ lệ thu / cam kết",
        "amber",
        `Còn phải thu: ${BLANK}`,
        BLANK
      ),
    ],
    detailRows: [],
    detailTotalRow: null,
    alertRows: [],
    collectionChartData: [],
    receivableRateRows: [],
    receivableDonutData: [],
    commitmentRows: [],
    commitmentTotalRow: null,
    customerCommitments: [],
  };
}

export function mapReceivableReportFromApi(
  {
    yesterdayPayload = null,
    todayPayload = null,
    tomorrowPayload = null,
  } = {},
  options = {}
) {
  const todayRowsRaw = Array.isArray(todayPayload?.rows) ? todayPayload.rows : [];
  const tomorrowRowsRaw = Array.isArray(tomorrowPayload?.rows)
    ? tomorrowPayload.rows
    : [];
  const yesterdayRowsRaw = Array.isArray(yesterdayPayload?.rows)
    ? yesterdayPayload.rows
    : [];

  const todayRows = aggregateRowsByCanonicalBu(todayRowsRaw);
  const tomorrowRows = aggregateRowsByCanonicalBu(tomorrowRowsRaw);
  const yesterdayRows = aggregateRowsByCanonicalBu(yesterdayRowsRaw);

  const todayTotals = sumTotalsFromRows(todayRows);
  const tomorrowTotals = sumTotalsFromRows(tomorrowRows);
  const yesterdayTotals = sumTotalsFromRows(yesterdayRows);

  const todayDate = todayPayload?.date || options?.queryDates?.today || "";
  const tomorrowDate =
    tomorrowPayload?.date || options?.queryDates?.tomorrow || "";
  const yesterdayDate =
    yesterdayPayload?.date || options?.queryDates?.yesterday || "";

  const todayMap = new Map(todayRows.map((item) => [item.canonical_key, item]));
  const tomorrowMap = new Map(tomorrowRows.map((item) => [item.canonical_key, item]));
  const yesterdayMap = new Map(yesterdayRows.map((item) => [item.canonical_key, item]));

  const allCodes = CANONICAL_BU_KEYS;

  const detailRows = allCodes.map((code) => {
    const todayRow = todayMap.get(code) || {
      receivable_total: 0,
      commitment_overdue: 0,
      collected_due: 0,
      collected_in_term_cod: 0,
      total_collected: 0,
    };
    const meta = CANONICAL_BU_CONFIG[code] || getBuMeta(code);

    return {
      key: code,
      buKey: code,
      id: meta.buId || code,
      bu: meta.label,
      receivableTotal: formatCompactMoney(todayRow.receivable_total),
      receivableTotalValue: todayRow.receivable_total,
      commitmentOverdue: formatCompactMoney(todayRow.commitment_overdue),
      commitmentOverdueValue: todayRow.commitment_overdue,
      collectedDue: formatCompactMoney(todayRow.collected_due),
      collectedDueValue: todayRow.collected_due,
      collectedInTermCod: formatCompactMoney(todayRow.collected_in_term_cod),
      collectedInTermCodValue: todayRow.collected_in_term_cod,
      totalCollected: formatCompactMoney(todayRow.total_collected),
      totalCollectedValue: todayRow.total_collected,
    };
  });

  const detailTotalRow = {
    key: "TOTAL",
    buKey: "TOTAL",
    id: "total",
    bu: "TỔNG",
    receivableTotal: formatCompactMoney(todayTotals.receivable_total),
    receivableTotalValue: todayTotals.receivable_total,
    commitmentOverdue: formatCompactMoney(todayTotals.commitment_overdue),
    commitmentOverdueValue: todayTotals.commitment_overdue,
    collectedDue: formatCompactMoney(todayTotals.collected_due),
    collectedDueValue: todayTotals.collected_due,
    collectedInTermCod: formatCompactMoney(todayTotals.collected_in_term_cod),
    collectedInTermCodValue: todayTotals.collected_in_term_cod,
    totalCollected: formatCompactMoney(todayTotals.total_collected),
    totalCollectedValue: todayTotals.total_collected,
  };

  const collectionChartData = allCodes.map((code) => {
    const todayRow = todayMap.get(code) || {
      collected_due: 0,
      collected_in_term_cod: 0,
      total_collected: 0,
    };
    const meta = CANONICAL_BU_CONFIG[code] || getBuMeta(code);

    return {
      key: code,
      buKey: code,
      id: meta.buId || code,
      name: meta.shortLabel || meta.label,
      fullName: meta.label,
      collectedDue: todayRow.collected_due,
      collectedDueText: formatCompactMoney(todayRow.collected_due),
      inTermCod: todayRow.collected_in_term_cod,
      inTermCodText: formatCompactMoney(todayRow.collected_in_term_cod),
      totalCollected: todayRow.total_collected,
      color: meta.color,
    };
  });

  const totalReceivableTomorrow = toNumber(tomorrowTotals.receivable_total);

  const receivableRateRows = allCodes
    .map((code) => {
      const tomorrowRow = tomorrowMap.get(code) || { receivable_total: 0 };
      const meta = CANONICAL_BU_CONFIG[code] || getBuMeta(code);

      return {
        key: code,
        buKey: code,
        id: meta.buId || code,
        name: meta.label,
        value: tomorrowRow.receivable_total,
        valueText: formatCompactMoney(tomorrowRow.receivable_total),
        percent:
          totalReceivableTomorrow > 0
            ? (tomorrowRow.receivable_total / totalReceivableTomorrow) * 100
            : 0,
        color: meta.color,
      };
    })
    .sort((a, b) => b.value - a.value);

  const receivableDonutData = receivableRateRows.map((item) => ({
    key: item.buKey || item.id || item.name,
    buKey: item.buKey,
    id: item.id,
    name: item.name,
    value: item.value,
    valueText: item.valueText,
    color: item.color,
  }));

  const commitmentRows = allCodes.map((code) => {
    const todayRow = todayMap.get(code) || { total_collected: 0, commitment_overdue: 0 };
    const tomorrowRow = tomorrowMap.get(code) || { receivable_total: 0, commitment_overdue: 0 };
    const yesterdayRow = yesterdayMap.get(code) || { total_collected: 0 };
    const meta = CANONICAL_BU_CONFIG[code] || getBuMeta(code);

    const commitmentRate =
      tomorrowRow.receivable_total > 0
        ? (todayRow.total_collected / tomorrowRow.receivable_total) * 100
        : 0;

    const yesterdayCollected = yesterdayRow.total_collected;
    const todayCollected = todayRow.total_collected;
    const vsPrevDelta = todayCollected - yesterdayCollected;

    return {
      key: code,
      buKey: code,
      id: meta.buId || code,
      bu: meta.label,
      receivableTotal: formatCompactMoney(tomorrowRow.receivable_total),
      receivableTotalValue: tomorrowRow.receivable_total,
      commitmentOverdue: formatCompactMoney(tomorrowRow.commitment_overdue),
      commitmentOverdueValue: tomorrowRow.commitment_overdue,
      commitToday: formatCompactMoney(todayRow.commitment_overdue),
      collectedToday: formatCompactMoney(todayRow.total_collected),
      rate: formatPercent(commitmentRate),
      rateTone: commitmentRate >= 100 ? "good" : commitmentRate >= 70 ? "normal" : "bad",
      commitTomorrow: formatCompactMoney(tomorrowRow.commitment_overdue),
      commitmentRate: formatPercent(commitmentRate),
      commitmentRateRaw: commitmentRate,
      vsPrev:
        yesterdayCollected > 0 || todayCollected > 0
          ? formatGap(todayCollected, yesterdayCollected)
          : BLANK,
      vsPrevTone:
        vsPrevDelta > 0
          ? "positive"
          : vsPrevDelta < 0
          ? "negative"
          : "neutral",
    };
  });

  const commitmentTotalRate =
    tomorrowTotals.receivable_total > 0
      ? (todayTotals.total_collected / tomorrowTotals.receivable_total) * 100
      : 0;

  const totalVsPrev = todayTotals.total_collected - yesterdayTotals.total_collected;

  const commitmentTotalRow = {
    key: "TOTAL",
    buKey: "TOTAL",
    id: "total",
    bu: "TỔNG",
    receivableTotal: formatCompactMoney(tomorrowTotals.receivable_total),
    receivableTotalValue: tomorrowTotals.receivable_total,
    commitmentOverdue: formatCompactMoney(tomorrowTotals.commitment_overdue),
    commitmentOverdueValue: tomorrowTotals.commitment_overdue,
    commitToday: formatCompactMoney(todayTotals.commitment_overdue),
    collectedToday: formatCompactMoney(todayTotals.total_collected),
    rate: formatPercent(commitmentTotalRate),
    rateTone: commitmentTotalRate >= 100 ? "good" : commitmentTotalRate >= 70 ? "normal" : "bad",
    commitTomorrow: formatCompactMoney(tomorrowTotals.commitment_overdue),
    commitmentRate: formatPercent(commitmentTotalRate),
    commitmentRateRaw: commitmentTotalRate,
    vsPrev:
      yesterdayTotals.total_collected > 0 || todayTotals.total_collected > 0
        ? formatGap(todayTotals.total_collected, yesterdayTotals.total_collected)
        : BLANK,
    vsPrevTone:
      totalVsPrev > 0
        ? "positive"
        : totalVsPrev < 0
        ? "negative"
        : "neutral",
  };

  return {
    header: {
      title: "Thu Nợ Khách Hàng Trọng Yếu",
      reportDate: formatDateDisplay(todayDate),
      scopeLabel: "Bao gồm HISA",
      buLabel: "Tất cả BU",
      updatedAt: formatDateDisplay(todayDate),
      todayLabel: formatDateDisplay(todayDate),
      tomorrowLabel: formatDateDisplay(tomorrowDate),
      yesterdayLabel: formatDateDisplay(yesterdayDate),
      monthLabel:
        options?.month && options?.year
          ? `Tháng ${String(options.month).padStart(2, "0")}/${options.year}`
          : BLANK,
    },

    topKpis: buildTopKpis({
      todayRows,
      todayTotals,
      tomorrowTotals,
      todayDate,
      tomorrowDate,
      yesterdayDate,
    }),
    detailRows,
    detailTotalRow,
    alertRows: buildAlertRows({
      allCodes,
      todayMap,
      tomorrowMap,
      yesterdayMap,
      todayTotals,
      tomorrowTotals,
      todayDate,
    }),
    collectionChartData,
    receivableRateRows,
    receivableDonutData,
    commitmentRows,
    commitmentTotalRow,
    customerCommitments: [],
    latestAvailableDate: todayPayload?.latest_available_date || null,
    hasData: todayPayload?.has_data ?? (todayTotals.total_collected > 0),
  };
}