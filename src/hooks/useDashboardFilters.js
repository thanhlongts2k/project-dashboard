import { useSearchParams, useLocation } from "react-router-dom";
import { useMemo, useCallback } from "react";

function formatIsoDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Tính toán lại khoảng ngày chính xác cho các preset động theo thời gian thực.
 */
export function calculatePresetDateRange(preset) {
  const now = new Date();

  switch (preset) {
    case "yesterday": {
      const y = addDays(now, -1);
      return {
        startDate: formatIsoDate(startOfDay(y)),
        endDate: formatIsoDate(endOfDay(y)),
      };
    }
    case "today":
      return {
        startDate: formatIsoDate(startOfDay(now)),
        endDate: formatIsoDate(endOfDay(now)),
      };
    case "thisWeek": {
      const d = startOfDay(now);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const weekStart = addDays(d, diff);
      const weekEnd = addDays(weekStart, 6);
      return {
        startDate: formatIsoDate(weekStart),
        endDate: formatIsoDate(endOfDay(weekEnd)),
      };
    }
    case "thisMonth": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: formatIsoDate(startOfDay(monthStart)),
        endDate: formatIsoDate(endOfDay(now)),
      };
    }
    default:
      return null;
  }
}

/**
 * Hook đồng bộ 2 chiều giữa URL Search Params và Dashboard Filters.
 * Đảm bảo giữ nguyên 100% trạng thái khi F5 hoặc bấm Back/Forward trình duyệt.
 *
 * @param {string} defaultPreset - Preset mặc định ("thisMonth", "today", v.v.)
 */
export function useDashboardFilters(defaultPreset = "thisMonth") {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const filters = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const rawPreset = searchParams.get("preset");
    const rawMonth = searchParams.get("month");
    const rawYear = searchParams.get("year");
    const rawOwner = searchParams.get("owner");
    const rawStartDate = searchParams.get("startDate");
    const rawEndDate = searchParams.get("endDate");
    const rawDate = searchParams.get("date"); // Dùng cho Receivable single date

    const preset = rawPreset || defaultPreset;
    const month = rawMonth ? Number(rawMonth) : currentMonth;
    const year = rawYear ? Number(rawYear) : currentYear;
    const owner = rawOwner || "";

    // Nếu có preset động thì tính toán lại khoảng ngày mới nhất theo giờ hiện tại
    const dynamicRange = calculatePresetDateRange(preset);
    const startDate = rawStartDate || dynamicRange?.startDate || "";
    const endDate = rawEndDate || dynamicRange?.endDate || "";
    const singleDate = rawDate || formatIsoDate(today);

    return {
      preset,
      month,
      year,
      owner,
      startDate,
      endDate,
      singleDate,
      // Helper kiểm tra có đang dùng khoảng ngày tùy chọn không
      isCustomRange: preset === "custom",
    };
  }, [searchParams, defaultPreset]);

  /**
   * Cập nhật các trường filter lên URL Search Params.
   * Các giá trị rỗng/null/undefined sẽ được tự động xóa khỏi query string.
   */
  const setFilters = useCallback(
    (newFilters, { replace = true } = {}) => {
      setSearchParams(
        (prevParams) => {
          const next = new URLSearchParams(prevParams);

          Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              next.set(key, String(value));
            } else {
              next.delete(key);
            }
          });

          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  /**
   * Đặt lại bộ lọc về mặc định ban đầu.
   */
  const resetFilters = useCallback(
    (preset = defaultPreset) => {
      const today = new Date();
      const dynamic = calculatePresetDateRange(preset);

      setFilters({
        preset,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        owner: "",
        startDate: dynamic?.startDate || "",
        endDate: dynamic?.endDate || "",
      });
    },
    [defaultPreset, setFilters]
  );

  /**
   * Helper tạo đường dẫn URL bảo lưu toàn bộ query params hiện tại khi chuyển tab.
   * Ví dụ: preserveSearch("/bu/elevator") -> "/bu/elevator?preset=thisMonth&month=8..."
   */
  const preserveSearch = useCallback(
    (targetPath) => {
      const search = location.search;
      if (!search) return targetPath;
      const cleanPath = targetPath.split("?")[0];
      return `${cleanPath}${search}`;
    },
    [location.search]
  );

  return {
    filters,
    setFilters,
    resetFilters,
    preserveSearch,
    searchParams,
  };
}

export default useDashboardFilters;
