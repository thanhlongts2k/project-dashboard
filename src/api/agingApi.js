const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

async function apiGet(path, params = {}) {
  const token = getStoredToken();
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const fullPath = query.toString() ? `${path}?${query.toString()}` : path;
  const url = `${API_BASE_URL}${fullPath}`;

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const response = await fetch(url, { method: "GET", headers });

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.detail ||
        result?.message ||
        result?.error ||
        "Không lấy được dữ liệu Báo cáo Tuổi nợ từ máy chủ."
    );
  }

  return result;
}

/**
 * 1. GET /api/debt/bus/?period=YYYY-MM&include_all=true
 * Lấy tổng hợp công nợ của tất cả các BU
 */
export async function fetchAllBUsDebtSummary({ period, include_all = true } = {}) {
  return apiGet("/api/debt/bus/", {
    period,
    include_all,
  });
}

/**
 * 2. GET /api/debt/bus/<bu_code>/drilldown/?period=YYYY-MM
 * Lấy chi tiết phân tầng 3 cấp: BU -> Đội ngũ / Nhân sự -> Khách hàng
 */
export async function fetchBUDebtDrilldown(buCode, { period, employee } = {}) {
  if (!buCode) {
    throw new Error("Mã BU (buCode) không được để trống.");
  }
  return apiGet(`/api/debt/bus/${encodeURIComponent(buCode)}/drilldown/`, {
    period,
    employee: employee && employee !== "ALL" ? employee : undefined,
  });
}
