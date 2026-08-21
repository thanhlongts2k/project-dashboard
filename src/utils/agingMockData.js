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
  manufacturing: "BU_MANUFACTURING",
  ĐTCT: "ĐTCT",
  dtct: "ĐTCT",
  Oversea: "Oversea",
  oversea: "Oversea",
};

export const FALLBACK_BU_OPTIONS = [
  { value: "BU_ELEVATOR", label: "Thang máy" },
  { value: "BU_IBIZ PREMIUM", label: "Thiết bị điện cao cấp" },
  { value: "BU_IBIZ VALUE", label: "Thiết bị điện phổ thông" },
  { value: "BU_ECO", label: "Năng lượng tái tạo" },
  { value: "BU_AGRITECH", label: "Nông nghiệp công nghệ cao" },
  { value: "BU_MANUFACTURING", label: "Sản xuất" },
  { value: "ĐTCT", label: "Đầu tư cho thuê" },
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
