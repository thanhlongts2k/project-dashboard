function normalizePercentToken(token) {
  const raw = String(token ?? "").trim();
  if (!raw) return null;

  let normalized = raw;

  if (raw.includes(",") && raw.includes(".")) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",") && !raw.includes(".")) {
    normalized = raw.replace(",", ".");
  } else {
    const dotCount = (raw.match(/\./g) || []).length;
    if (dotCount > 1) {
      normalized = raw.replace(/\./g, "");
    }
  }

  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

export function extractPercentNumbers(input) {
  if (input === null || input === undefined || input === "") return [];

  if (typeof input === "number") {
    return Number.isFinite(input) ? [input] : [];
  }

  const text = String(input);
  const matches = text.match(/-?\d[\d.,]*\s*%/g);
  if (!matches) return [];

  return matches
    .map((item) => item.replace("%", "").trim())
    .map(normalizePercentToken)
    .filter((value) => value !== null);
}

export function getPercentValue(input) {
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null;
  }

  const numbers = extractPercentNumbers(input);
  if (!numbers.length) return null;

  return Math.min(...numbers);
}

export function getPercentTone(input, reverse = false) {
  const percent = getPercentValue(input);
  if (percent === null || Number.isNaN(percent)) return "neutral";

  // Logic thường: đỏ -> cam -> vàng -> xanh
  if (!reverse) {
    if (percent < 50) return "danger";
    if (percent < 70) return "orange";
    if (percent < 100) return "warn";
    return "good";
  }

  // Logic đảo cho tồn kho
  if (percent >= 100) return "danger";
  if (percent >= 70) return "orange";
  if (percent >= 50) return "warn";
  return "good";
}

const TONE_COLORS = {
  neutral: {
    color: "#888780",
    backgroundColor: "#f1efe8",
    borderColor: "#e3e1d8",
  },
  danger: {
    color: "#D84C4C",
    backgroundColor: "#FCEBEB",
    borderColor: "#F2CACA",
  },
  orange: {
    color: "#E67E22",
    backgroundColor: "#FBE8D7",
    borderColor: "#F1CBA5",
  },
  warn: {
    color: "#A38A00",
    backgroundColor: "#F6F0C8",
    borderColor: "#E8D98A",
  },
  good: {
    color: "#3B8D3A",
    backgroundColor: "#EAF3DE",
    borderColor: "#CFE3BC",
  },
};

export function getPercentColor(input, reverse = false) {
  const tone = getPercentTone(input, reverse);
  return TONE_COLORS[tone]?.color || TONE_COLORS.neutral.color;
}

export function getPercentBgColor(input, reverse = false) {
  const tone = getPercentTone(input, reverse);
  return TONE_COLORS[tone]?.backgroundColor || TONE_COLORS.neutral.backgroundColor;
}

export function getPercentBorderColor(input, reverse = false) {
  const tone = getPercentTone(input, reverse);
  return TONE_COLORS[tone]?.borderColor || TONE_COLORS.neutral.borderColor;
}

export function getPercentStyle(input, reverse = false) {
  return {
    color: getPercentColor(input, reverse),
    backgroundColor: getPercentBgColor(input, reverse),
    border: `1px solid ${getPercentBorderColor(input, reverse)}`,
  };
}

export function getTrendColor(input = "", reverse = false) {
  const text = String(input || "").toLowerCase().trim();
  if (!text || text === "—") return "#5f5e5a";

  const positiveKeywords = [
    "▲",
    "+",
    "tăng",
    "vượt",
    "đúng nhịp",
    "đang tốt",
    "tốt",
    "ổn",
  ];

  const negativeKeywords = [
    "▼",
    "–",
    "-",
    "giảm",
    "rủi ro",
    "chưa phát sinh",
    "không phát sinh",
    "cần theo dõi",
  ];

  const isPositive = positiveKeywords.some((k) => text.includes(k.toLowerCase()));
  const isNegative = negativeKeywords.some((k) => text.includes(k.toLowerCase()));

  if (!reverse) {
    if (isPositive) return "#3B8D3A";
    if (isNegative) return "#D84C4C";
    return "#5f5e5a";
  }

  if (isPositive) return "#D84C4C";
  if (isNegative) return "#3B8D3A";
  return "#5f5e5a";
}