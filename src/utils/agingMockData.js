// Danh mục dữ liệu rỗng dự phòng an toàn (Không lưu trữ số liệu giả lập)
export const MOCK_STAFF_LIST = [];

export const MOCK_GLOBAL_BUS_SUMMARY = {
  global_summary: null,
  results: [],
};

export const BU_CODE_MAP = {
  elevator: "BU_ELEVATOR",
  ibizPremium: "BU_IBIZ PREMIUM",
  ibizValue: "BU_IBIZ VALUE",
  eco: "BU_ECO",
  agritech: "BU_AGRITECH",
  sab: "BU_SAB",
  manufacturing: "BU_MANUFACTURING",
  ĐTCT: "ĐTCT",
  dtct: "ĐTCT",
  Oversea: "Oversea",
  oversea: "Oversea",
};

export const FALLBACK_BU_OPTIONS = [
  { value: "BU_ELEVATOR", label: "[BU_ELEVATOR] Thang máy" },
  { value: "BU_IBIZ PREMIUM", label: "[BU_IBIZ PREMIUM] Thiết bị điện cao cấp" },
  { value: "BU_IBIZ VALUE", label: "[BU_IBIZ VALUE] Thiết bị điện phổ thông" },
  { value: "BU_ECO", label: "[BU_ECO] Năng lượng tái tạo" },
  { value: "BU_AGRITECH", label: "[BU_AGRITECH] Nông nghiệp công nghệ cao" },
  { value: "BU_SAB", label: "[BU_SAB] Thủy sản thông minh (SAB)" },
  { value: "BU_MANUFACTURING", label: "[BU_MANUFACTURING] Sản xuất" },
  { value: "ĐTCT", label: "[ĐTCT] Đầu tư cho thuê" },
  { value: "Oversea", label: "[Oversea] Oversea" },
];

export function normalizeBuCode(code) {
  if (!code) return "BU_ELEVATOR";
  if (code === "ALL") return "ALL";
  if (code.startsWith("BU_")) return code;
  if (BU_CODE_MAP[code]) return BU_CODE_MAP[code];
  return code;
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
