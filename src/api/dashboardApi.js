const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

// Khoảng ngày trọn tháng (01 → ngày cuối tháng) thì trả về {month, year} tương ứng,
// ngược lại trả null. Backend chỉ trả số kế hoạch (KH/KPI) khi truy vấn theo month/year.
function fullMonthFromRange(startDate, endDate) {
  if (!startDate || !endDate) return null;

  const from = new Date(startDate);
  const to = new Date(endDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

  const sameMonth =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth();
  const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();

  if (sameMonth && from.getDate() === 1 && to.getDate() === lastDay) {
    return { month: from.getMonth() + 1, year: from.getFullYear() };
  }

  return null;
}

function buildPeriodParams({ month, year, startDate, endDate }) {
  if (startDate && endDate) {
    const fullMonth = fullMonthFromRange(startDate, endDate);
    if (fullMonth) {
      return {
        month: fullMonth.month,
        year: fullMonth.year,
      };
    }

    return {
      start_date: startDate,
      end_date: endDate,
    };
  }

  return {
    month,
    year,
  };
}

async function apiGet(path, params = {}) {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập.");
  }

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const fullPath = query.toString() ? `${path}?${query.toString()}` : path;
  const url = `${API_BASE_URL}${fullPath}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
  });

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
        "Không lấy được dữ liệu API."
    );
  }

  return result;
}

export async function fetchBusinessUnits({ isMain = true }) {
  return apiGet("/api/business-units/", {
    is_main: isMain,
  });
}

export async function fetchBuPerformance({
  month,
  year,
  onlyRoots = false,
  buId,
  startDate,
  endDate,
}) {
  return apiGet("/api/bu-performance/", {
    ...buildPeriodParams({ month, year, startDate, endDate }),
    only_roots: onlyRoots,
    bu_id: buId,
  });
}

export async function fetchDailyPerformance({
  month,
  year,
  buId,
  onlyRoots = false,
  startDate,
  endDate,
}) {
  return apiGet("/api/performance/daily/", {
    ...buildPeriodParams({ month, year, startDate, endDate }),
    bu_id: buId,
    only_roots: onlyRoots,
  });
}

export async function fetchWarehouses(params = {}) {
  return apiGet("/api/warehouses/", params);
}

export async function fetchCollectionByBu({ date }) {
  return apiGet("/api/dashboard/collection-by-bu/", {
    date,
  });
}

export async function fetchOverdueCustomers({ date, bu_code } = {}) {
  return apiGet("/api/debt/overdue-customers/", {
    date,
    bu_code,
  });
}