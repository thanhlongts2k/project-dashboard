import {
  BLANK,
  formatCompactMoney,
  formatGap,
  formatPercent,
} from "./numberFormat";

function normalizeDateValue(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
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

export function isFullMonthRange(startDate, endDate) {
  const from = normalizeDateValue(startDate);
  const to = normalizeDateValue(endDate);
  if (!from || !to) return false;

  const isStartOfMon = from.getDate() === 1;
  const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  const isEndOfMon = to.getDate() === lastDay && from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();

  return isStartOfMon && isEndOfMon;
}

function buildPeriodRangeLabel(startDate, endDate, month, year) {
  if (startDate && endDate) {
    const from = new Date(startDate);
    const to = new Date(endDate);
    const fromDayStr = String(from.getDate()).padStart(2, "0");
    const fromMonthStr = String(from.getMonth() + 1).padStart(2, "0");
    const toDayStr = String(to.getDate()).padStart(2, "0");
    const toMonthStr = String(to.getMonth() + 1).padStart(2, "0");
    
    if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
      return `${fromDayStr}–${toDayStr}/${toMonthStr}`;
    } else {
      return `${fromDayStr}/${fromMonthStr}–${toDayStr}/${toMonthStr}`;
    }
  }
  
  return `01–04/${String(month).padStart(2, "0")}`;
}

const INVENTORY_COLORS = {
  elevator: "#185FA5",
  premium: "#1D9E75",
  agritech: "#BA7517",
  bhTb: "#534AB7",
  others: "#888780",
};

const DISPLAY_WAREHOUSE_BUCKETS = [
  {
    key: "bh_thiet_bi",
    label: "Kho BH Thiết Bị",
    codePhrases: ["BH_TB", "KHO_BH_TB", "KBH_TB", "THIET_BI"],
    namePhrases: ["KHO BH THIET BI", "KHO THIET BI"],
  },
  {
    key: "du_an",
    label: "Kho Dự Án",
    codePhrases: ["DU_AN", "KDUAN", "KHO_DU_AN"],
    namePhrases: ["KHO DU AN", "DU AN"],
  },
  {
    key: "bao_hanh",
    label: "Kho Bảo Hành",
    codePhrases: ["BAO_HANH", "KBAOHANH", "KHO_BAO_HANH"],
    namePhrases: ["KHO BAO HANH", "BAO HANH"],
  },
  {
    key: "hang_di_duong",
    label: "Hàng đang đi đường",
    codePhrases: ["HANG_DD", "DI_DUONG", "HANG_DI_DUONG"],
    namePhrases: ["HANG DI DUONG", "DI DUONG"],
  },
  {
    key: "bu_elevator",
    label: "Kho BU_Elevator",
    codePhrases: ["ELEVATOR"],
    namePhrases: ["BU ELEVATOR", "BU_ELEVATOR", "KHO BU ELEVATOR"],
  },
  {
    key: "bu_mfg",
    label: "Kho BU_Manufacturing",
    codePhrases: ["MFG", "MANUFACTURING"],
    namePhrases: ["BU MANUFACTURING", "BU_MANUFACTURING", "KHO BU MANUFACTURING"],
  },
  {
    key: "bu_premium",
    label: "Kho BU_Premium",
    codePhrases: ["PREMIUM", "IBIZ_PREMIUM"],
    namePhrases: ["BU PREMIUM", "BU_PREMIUM", "IBIZ PREMIUM", "BU IBIZ PREMIUM"],
  },
  {
    key: "bu_agritech",
    label: "Kho BU_Agritech",
    codePhrases: ["AGRITECH"],
    namePhrases: ["BU AGRITECH", "BU_AGRITECH", "AGRITECH"],
  },
  {
    key: "bu_eco",
    label: "Kho BU_Eco",
    codePhrases: ["ECO"],
    namePhrases: ["BU ECO", "BU_ECO", "ECO"],
  },
  {
    key: "bu_value",
    label: "Kho BU_Value",
    codePhrases: ["VALUE", "IBIZ_VALUE"],
    namePhrases: ["BU VALUE", "BU_VALUE", "IBIZ VALUE", "BU IBIZ VALUE"],
  },
];

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatPercentOrBlank(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? BLANK
    : formatPercent(Number(value));
}

function formatSignedPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return BLANK;

  const formatted = formatPercent(Math.abs(num));

  if (num > 0) return `+${formatted}`;
  if (num < 0) return `-${formatted}`;
  return formatted;
}

function getInventoryAlertTone(percent) {
  const value = Number(percent);
  if (!Number.isFinite(value)) return "warn";

  // Tồn kho: càng cao càng xấu
  if (value >= 100) return "danger";
  if (value >= 70) return "warn";
  return "success";
}

function normalizeText(value = "") {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function containsAnyPhrase(text, phrases = []) {
  const normalized = normalizeText(text);
  return phrases.some((phrase) => normalized.includes(normalizeText(phrase)));
}

function buildEmptyWarehouseGroup(label, key = "") {
  return {
    id: null,
    code: key,
    name: label,
    businessUnit: null,
    openingValue: 0,
    inValue: 0,
    outValue: 0,
    actualValue: 0,
    planValue: 0,
    deltaValue: 0,
  };
}

function aggregateWarehouseGroup(items = [], name = "", code = "") {
  if (!items.length) {
    return buildEmptyWarehouseGroup(name, code);
  }

  const openingValue = items.reduce(
    (sum, item) => sum + toNumber(item.openingValue),
    0
  );
  const inValue = items.reduce((sum, item) => sum + toNumber(item.inValue), 0);
  const outValue = items.reduce((sum, item) => sum + toNumber(item.outValue), 0);
  const actualValue = items.reduce(
    (sum, item) => sum + toNumber(item.actualValue),
    0
  );
  const planValue = items.reduce(
    (sum, item) => sum + toNumber(item.planValue),
    0
  );

  return {
    id: items[0]?.id ?? null,
    code: code || items[0]?.code || "",
    name,
    businessUnit: items[0]?.businessUnit ?? null,
    openingValue,
    inValue,
    outValue,
    actualValue,
    planValue,
    deltaValue: actualValue - openingValue,
  };
}

function matchWarehouseBucket(item) {
  const code = normalizeText(item?.code);
  const name = normalizeText(item?.name);

  for (const bucket of DISPLAY_WAREHOUSE_BUCKETS) {
    if (containsAnyPhrase(code, bucket.codePhrases)) {
      return bucket;
    }

    if (containsAnyPhrase(name, bucket.namePhrases)) {
      return bucket;
    }
  }

  return null;
}

function buildDisplayWarehouses(normalized = []) {
  const bucketMap = new Map();
  const otherItems = [];

  DISPLAY_WAREHOUSE_BUCKETS.forEach((bucket) => {
    bucketMap.set(bucket.key, []);
  });

  normalized.forEach((item) => {
    const bucket = matchWarehouseBucket(item);

    if (!bucket) {
      otherItems.push(item);
      return;
    }

    bucketMap.get(bucket.key).push(item);
  });

  const displayWarehouses = DISPLAY_WAREHOUSE_BUCKETS.map((bucket) => {
    const bucketItems = bucketMap.get(bucket.key) || [];
    return aggregateWarehouseGroup(bucketItems, bucket.label, bucket.key);
  });

  const otherWarehouseGroup = otherItems.length
    ? aggregateWarehouseGroup(otherItems, "Kho còn lại", "other_unmapped")
    : null;

  return {
    displayWarehouses,
    otherWarehouseGroup,
  };
}

function buildCompositionData(displayWarehouses = [], otherWarehouseGroup = null) {
  const findWarehouseValue = (label) =>
    displayWarehouses.find((item) => item.name === label)?.actualValue || 0;

  const elevatorValue = findWarehouseValue("Kho BU_Elevator");
  const premiumValue = findWarehouseValue("Kho BU_Premium");
  const agritechValue = findWarehouseValue("Kho BU_Agritech");
  const bhTbValue = findWarehouseValue("Kho BH Thiết Bị");

  const otherLabels = [
    "Kho Dự Án",
    "Kho Bảo Hành",
    "Hàng đang đi đường",
    "Kho BU_Manufacturing",
    "Kho BU_Eco",
    "Kho BU_Value",
  ];

  const mappedOthersValue = displayWarehouses
    .filter((item) => otherLabels.includes(item.name))
    .reduce((sum, item) => sum + item.actualValue, 0);

  const extraOtherValue = otherWarehouseGroup?.actualValue || 0;
  const othersValue = mappedOthersValue + extraOtherValue;

  return [
    {
      key: "elevator",
      name: "BU_Elevator",
      value: elevatorValue,
      valueText: formatCompactMoney(elevatorValue),
      color: INVENTORY_COLORS.elevator,
    },
    {
      key: "premium",
      name: "BU_Premium",
      value: premiumValue,
      valueText: formatCompactMoney(premiumValue),
      color: INVENTORY_COLORS.premium,
    },
    {
      key: "agritech",
      name: "BU_Agritech",
      value: agritechValue,
      valueText: formatCompactMoney(agritechValue),
      color: INVENTORY_COLORS.agritech,
    },
    {
      key: "bhTb",
      name: "Kho BH TB",
      value: bhTbValue,
      valueText: formatCompactMoney(bhTbValue),
      color: INVENTORY_COLORS.bhTb,
    },
    {
      key: "others",
      name: "Còn lại",
      value: othersValue,
      valueText: formatCompactMoney(othersValue),
      color: INVENTORY_COLORS.others,
    },
  ];
}

function buildCompositionLegend(compositionData = [], totalActual = 0) {
  return compositionData.map((item) => ({
    name:
      totalActual > 0
        ? `${item.name} ${formatPercent((item.value / totalActual) * 100)}`
        : `${item.name} ${BLANK}`,
    color: item.color,
  }));
}

function getPreviousMonthInfo(month, year) {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }

  return { month: month - 1, year };
}

function buildTopKpis({
  month,
  year,
  warehousesForTable,
  totalOpening,
  totalIn,
  totalOut,
  totalActual,
  totalPlan,
  inventoryPercent,
  largestIn,
  largestOut,
  startDate,
  endDate,
}) {
  const isMonth = !startDate || !endDate || isFullMonthRange(startDate, endDate);
  const prev = getPreviousMonthInfo(month, year);
  const buyPercent = totalOpening > 0 ? (totalIn / totalOpening) * 100 : null;
  const sellPercent = totalOpening > 0 ? -(totalOut / totalOpening) * 100 : null;
  const endingPercent =
    totalOpening > 0 ? ((totalActual - totalOpening) / totalOpening) * 100 : null;

  const periodLabelStr = buildPeriodRangeLabel(startDate, endDate, month, year);

  return [
    {
      label: isMonth 
        ? `Giá trị đầu kỳ T${month}` 
        : `Giá trị đầu kỳ (${formatDateDisplay(startDate)})`,
      value: totalOpening,
      valueText: formatCompactMoney(totalOpening),
      targetText: isMonth ? `= Cuối kỳ T${prev.month}` : "= Cuối kỳ trước",
      percent: null,
      percentText: BLANK,
      accent: "blue",
      deltaText: `Tổng ${warehousesForTable.length} kho`,
    },
    {
      label: `Giá trị mua hàng (${periodLabelStr})`,
      value: totalIn,
      valueText: formatCompactMoney(totalIn),
      targetText: "Nhập kho trong kỳ",
      percent: buyPercent,
      percentText: formatSignedPercent(buyPercent),
      accent: "teal",
      deltaText:
        largestIn && largestIn.inValue > 0
          ? `▲ Nhập chủ yếu ${largestIn.name}`
          : BLANK,
    },
    {
      label: `Giá trị bán hàng (${periodLabelStr})`,
      value: totalOut,
      valueText: formatCompactMoney(totalOut),
      targetText: "Xuất kho trong kỳ",
      percent: sellPercent,
      percentText: formatSignedPercent(sellPercent),
      accent: "coral",
      deltaText:
        largestOut && largestOut.outValue > 0
          ? `Chủ yếu ${largestOut.name}`
          : BLANK,
    },
    {
      label: "Giá trị cuối kỳ",
      value: totalActual,
      valueText: formatCompactMoney(totalActual),
      targetText:
        totalActual >= totalOpening ? "Tăng so đầu kỳ" : "Giảm so đầu kỳ",
      percent: endingPercent,
      percentText: formatSignedPercent(endingPercent),
      accent: "amber",
      deltaText:
        totalActual >= totalOpening
          ? `▲ ${formatGap(totalActual, totalOpening)} so đầu kỳ`
          : `▼ ${formatGap(totalActual, totalOpening)} so đầu kỳ`,
      reverseTone: true,
    },
  ];
}

export function buildEmptyInventoryReport(month, year, startDate, endDate) {
  const emptyCompositionData = buildCompositionData([], null);
  const isMonth = !startDate || !endDate || isFullMonthRange(startDate, endDate);
  const prev = getPreviousMonthInfo(month, year);

  return {
    header: {
      title: "Báo Cáo Tồn Kho",
      reportDate: BLANK,
      monthLabel: startDate && endDate
        ? `Kỳ: ${formatRangeDisplay(startDate, endDate)}`
        : `Tháng ${String(month).padStart(2, "0")}/${year}`,
      dateRangeLabel: startDate && endDate
        ? `Từ ${formatDateDisplay(startDate)} → ${formatDateDisplay(endDate)}`
        : "Từ — → —",
      warehouseCountLabel: `${DISPLAY_WAREHOUSE_BUCKETS.length} kho hiển thị`,
      updatedAt: BLANK,
    },

    topKpis: [
      {
        label: isMonth 
          ? `Giá trị đầu kỳ T${month}` 
          : `Giá trị đầu kỳ (${formatDateDisplay(startDate)})`,
        valueText: BLANK,
        targetText: isMonth ? `= Cuối kỳ T${prev.month}` : "= Cuối kỳ trước",
        percent: null,
        percentText: BLANK,
        accent: "blue",
        deltaText: `Tổng ${DISPLAY_WAREHOUSE_BUCKETS.length} kho`,
      },
      {
        label: `Giá trị mua hàng (${buildPeriodRangeLabel(startDate, endDate, month, year)})`,
        valueText: BLANK,
        targetText: "Nhập kho trong kỳ",
        percent: null,
        percentText: BLANK,
        accent: "teal",
        deltaText: BLANK,
      },
      {
        label: `Giá trị bán hàng (${buildPeriodRangeLabel(startDate, endDate, month, year)})`,
        valueText: BLANK,
        targetText: "Xuất kho trong kỳ",
        percent: null,
        percentText: BLANK,
        accent: "coral",
        deltaText: BLANK,
      },
      {
        label: "Giá trị cuối kỳ",
        valueText: BLANK,
        targetText: "Tăng so đầu kỳ",
        percent: null,
        percentText: BLANK,
        accent: "amber",
        deltaText: BLANK,
        reverseTone: true,
      },
    ],

    table: {
      title: "Chi tiết tồn kho theo kho hàng",
      note: "Đơn vị: nghìn đồng (000 VNĐ)",
      rows: [],
    },

    alerts: [],
    compositionLegend: buildCompositionLegend(emptyCompositionData, 0),
    compositionData: emptyCompositionData,
    movementData: [],
  };
}

export function mapInventoryReportFromWarehouses(warehouses = [], month, year, startDate, endDate) {
  const base = buildEmptyInventoryReport(month, year, startDate, endDate);
  const list = Array.isArray(warehouses) ? warehouses : [];

  const normalized = list.map((item) => {
    const openingValue = toNumber(item?.inventory_opening_value);
    const inValue = toNumber(item?.inventory_in_value);
    const outValue = toNumber(item?.inventory_out_value);
    const actualValue = toNumber(item?.inventory_value_actual);
    const planValue = toNumber(item?.inventory_value_plan);

    return {
      id: item?.id ?? null,
      code: item?.code || "",
      name: item?.name || `Kho ${item?.id || ""}`,
      businessUnit: item?.business_unit ?? null,
      openingValue,
      inValue,
      outValue,
      actualValue,
      planValue,
      deltaValue: actualValue - openingValue,
    };
  });

  const { displayWarehouses, otherWarehouseGroup } =
    buildDisplayWarehouses(normalized);

  const warehousesForTable = otherWarehouseGroup
    ? [...displayWarehouses, otherWarehouseGroup]
    : displayWarehouses;

  const totalOpening = warehousesForTable.reduce(
    (sum, item) => sum + item.openingValue,
    0
  );
  const totalIn = warehousesForTable.reduce((sum, item) => sum + item.inValue, 0);
  const totalOut = warehousesForTable.reduce((sum, item) => sum + item.outValue, 0);
  const totalActual = warehousesForTable.reduce(
    (sum, item) => sum + item.actualValue,
    0
  );
  const totalPlan = warehousesForTable.reduce(
    (sum, item) => sum + item.planValue,
    0
  );

  const inventoryPercent =
    totalPlan > 0 ? (totalActual / totalPlan) * 100 : null;

  const sortedByActual = [...warehousesForTable].sort(
    (a, b) => b.actualValue - a.actualValue
  );

  const largestWarehouse = sortedByActual[0] || null;
  const largestIn =
    [...warehousesForTable].sort((a, b) => b.inValue - a.inValue)[0] || null;
  const largestOut =
    [...warehousesForTable].sort((a, b) => b.outValue - a.outValue)[0] || null;
  const noMovementWarehouses = warehousesForTable.filter(
    (item) => item.inValue === 0 && item.outValue === 0
  );

  const compositionData = buildCompositionData(
    displayWarehouses,
    otherWarehouseGroup
  );
  const compositionLegend = buildCompositionLegend(compositionData, totalActual);

  const movementData = warehousesForTable.map((item) => ({
    name: item.name,
    purchase: item.inValue,
    purchaseText: formatCompactMoney(item.inValue),
    sales: item.outValue,
    salesText: formatCompactMoney(item.outValue),
  }));

  const alerts = [];

  if (largestWarehouse && largestWarehouse.actualValue > 0) {
    alerts.push({
      label: `${largestWarehouse.name} — tồn lớn nhất`,
      status: formatCompactMoney(largestWarehouse.actualValue),
      note:
        totalActual > 0
          ? `${formatPercent((largestWarehouse.actualValue / totalActual) * 100)} tổng kho`
          : BLANK,
      tone: "warn",
    });
  }

  if (largestOut && largestOut.outValue > 0) {
    alerts.push({
      label: `${largestOut.name} — xuất nhiều`,
      status: formatCompactMoney(largestOut.outValue),
      note: "Giảm nhanh",
      tone: "warn",
    });
  }

  noMovementWarehouses
    .filter((item) => item.actualValue > 0)
    .slice(0, 2)
    .forEach((item) => {
      alerts.push({
        label: `${item.name} — không biến động`,
        status: "0 mua/bán",
        note: "Cần kiểm tra",
        tone: "danger",
      });
    });

  if (largestIn && largestIn.inValue > 0) {
    alerts.push({
      label: `${largestIn.name} — nhập mạnh`,
      status: formatCompactMoney(largestIn.inValue),
      note: "Tăng tốt",
      tone: "success",
    });
  }

  alerts.push({
    label: totalActual >= totalOpening ? "Tổng kho tăng nhẹ" : "Tổng kho giảm nhẹ",
    status:
      totalOpening > 0
        ? formatPercent(((totalActual - totalOpening) / totalOpening) * 100)
        : BLANK,
    note: totalActual >= totalOpening ? "Ổn định" : "Cần theo dõi",
    tone: totalActual >= totalOpening ? "success" : "warn",
  });

  const tableRows = warehousesForTable.map((item, index) => ({
    stt: index + 1,
    warehouse: item.name,
    opening: formatCompactMoney(item.openingValue),
    inValue: formatCompactMoney(item.inValue),
    outValue: formatCompactMoney(item.outValue),
    ending: formatCompactMoney(item.actualValue),
    delta: formatGap(item.actualValue, item.openingValue),
    deltaValue: item.actualValue - item.openingValue,
  }));

  tableRows.push({
    stt: "—",
    warehouse: "Tổng cộng",
    opening: formatCompactMoney(totalOpening),
    inValue: formatCompactMoney(totalIn),
    outValue: formatCompactMoney(totalOut),
    ending: formatCompactMoney(totalActual),
    delta: formatGap(totalActual, totalOpening),
    deltaValue: totalActual - totalOpening,
    isTotal: true,
  });

  return {
    ...base,
    header: {
      ...base.header,
      title: "Báo Cáo Tồn Kho",
      monthLabel: startDate && endDate
        ? `Kỳ: ${formatRangeDisplay(startDate, endDate)}`
        : `Tháng ${String(month).padStart(2, "0")}/${year}`,
      dateRangeLabel: startDate && endDate
        ? `Từ ${formatDateDisplay(startDate)} → ${formatDateDisplay(endDate)}`
        : "Từ — → —",
      warehouseCountLabel: `${warehousesForTable.length} kho hiển thị`,
    },

    topKpis: buildTopKpis({
      month,
      year,
      warehousesForTable,
      totalOpening,
      totalIn,
      totalOut,
      totalActual,
      totalPlan,
      inventoryPercent,
      largestIn,
      largestOut,
      startDate,
      endDate,
    }),

    table: {
      title: "Chi tiết tồn kho theo kho hàng",
      note: "Đơn vị: nghìn đồng (000 VNĐ)",
      rows: tableRows,
    },

    alerts,
    compositionLegend,
    compositionData,
    movementData,
  };
}