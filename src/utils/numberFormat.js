export const BLANK = "—";

export function isBlankValue(value) {
  return value === null || value === undefined || value === "";
}

export function toNullableNumber(value) {
  if (isBlankValue(value)) return null;

  const cleaned = String(value).replace(/,/g, "").trim();
  if (!cleaned) return null;

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function toNumber(value) {
  return toNullableNumber(value) ?? 0;
}

function trimZeros(text) {
  return text.replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

export function formatCompactMoney(value) {
  const num = toNullableNumber(value);
  if (num === null) return BLANK;

  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    return `${trimZeros(
      (num / 1_000_000_000).toFixed(abs >= 100_000_000_000 ? 0 : 2)
    )} tỷ`;
  }

  if (abs >= 1_000_000) {
    return `${trimZeros(
      (num / 1_000_000).toFixed(abs >= 100_000_000 ? 0 : 2)
    )} triệu`;
  }

  if (abs >= 1_000) {
    return `${trimZeros(
      (num / 1_000).toFixed(abs >= 100_000 ? 0 : 1)
    )} nghìn`;
  }

  return new Intl.NumberFormat("vi-VN").format(num);
}

export function formatAxisCompact(value) {
  const num = toNullableNumber(value);
  if (num === null) return "";

  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    return `${trimZeros((num / 1_000_000_000).toFixed(1))}T`;
  }

  if (abs >= 1_000_000) {
    return `${trimZeros((num / 1_000_000).toFixed(1))}Tr`;
  }

  if (abs >= 1_000) {
    return `${trimZeros((num / 1_000).toFixed(1))}K`;
  }

  return new Intl.NumberFormat("vi-VN").format(num);
}

export const formatCompactShort = formatAxisCompact;

export function deriveSafePercent({ rawPercent, actual, plan }) {
  const raw = toNullableNumber(rawPercent);
  if (raw !== null && raw >= 0 && raw <= 1000) {
    return Math.round(raw);
  }

  const a = toNullableNumber(actual);
  const p = toNullableNumber(plan);

  if (a === null || p === null || p <= 0) return null;

  const computed = (a / p) * 100;
  if (!Number.isFinite(computed) || computed < 0 || computed > 1000) {
    return null;
  }

  return Math.round(computed);
}

export function formatPercent(value, decimals = 2) {
  const num = toNullableNumber(value);
  if (num === null) return BLANK;

  const maxDigits = typeof decimals === "number" ? decimals : 2;
  return `${new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  }).format(num)}%`;
}

export const formatPercentDisplay = formatPercent;

export function formatGap(actual, plan) {
  const a = toNullableNumber(actual);
  const p = toNullableNumber(plan);

  if (a === null || p === null) return BLANK;

  const diff = a - p;
  if (diff === 0) return "0";

  const sign = diff > 0 ? "+" : "–";
  return `${sign}${formatCompactMoney(Math.abs(diff))}`;
}

export function sumNullable(values = []) {
  const numeric = values
    .map(toNullableNumber)
    .filter((item) => item !== null);

  if (!numeric.length) return null;

  return numeric.reduce((sum, item) => sum + item, 0);
}

export function formatShortDate(dateText, isToday = false) {
  if (!dateText) return BLANK;

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");

  return isToday ? `${dd}/${mm} (hôm nay)` : `${dd}/${mm}`;
}

export function sortDailyRowsAsc(rows = []) {
  return [...rows].sort((a, b) => {
    const da = new Date(a?.date || 0).getTime();
    const db = new Date(b?.date || 0).getTime();
    return da - db;
  });
}

export function getLatestDailyRow(rows = []) {
  const sorted = sortDailyRowsAsc(rows);
  return sorted.length ? sorted[sorted.length - 1] : null;
}

/**
 * Gộp nhiều dòng cùng date (ví dụ root API trả nhiều bu_code trong cùng 1 ngày)
 */
export function buildDailySeries(rows = [], month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const mapByDate = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row?.date) return;

    const current = mapByDate.get(row.date) || {
      revenue: null,
      collection: null,
    };

    const revenue = toNullableNumber(row?.daily_revenue);
    const collection = toNullableNumber(row?.daily_collection);

    mapByDate.set(row.date, {
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

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const row = mapByDate.get(isoDate);

    return {
      date: isoDate,
      label: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
      revenue: row?.revenue ?? null,
      collection: row?.collection ?? null,
    };
  });
}