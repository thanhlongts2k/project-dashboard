import { useSearchParams, useLocation } from "react-router-dom";
import { useMemo, useCallback } from "react";

export function formatIsoDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Tính ngày báo cáo mặc định (T-1 / T-2):
 * - Nếu là Thứ Hai (day === 1): Lùi 2 ngày về Thứ Bảy tuần trước (baseDate - 2).
 * - Các ngày còn lại (Thứ 3 - Chủ Nhật): Lùi 1 ngày về hôm qua (baseDate - 1).
 */
export function getDefaultReportingDate(baseDate = new Date()) {
  const d = new Date(baseDate);
  const day = d.getDay(); // 0: CN, 1: T2, 2: T3, ..., 6: T7
  const offset = day === 1 ? 2 : 1;
  const target = new Date(d);
  target.setDate(d.getDate() - offset);
  return target;
}

/**
 * Tính toán lại khoảng ngày chính xác cho các preset động dựa trên ngày báo cáo mặc định.
 * - today: ngày báo cáo mặc định (T-1 hoặc T-2)
 * - yesterday: ngày liền trước ngày báo cáo
 * - thisWeek: Thứ Hai đầu tuần -> Chủ Nhật cùng tuần
 * - lastWeek: Thứ Hai tuần trước -> Chủ Nhật tuần trước
 * - thisMonth: MTD (01 đầu tháng -> ngày báo cáo mặc định)
 * - lastMonth: Trọn tháng trước (01 tháng trước -> ngày cuối cùng tháng trước)
 */
export function calculatePresetDateRange(preset, baseDate = new Date()) {
  const reportingDate = getDefaultReportingDate(baseDate);

  switch (preset) {
    case "today": {
      const iso = formatIsoDate(reportingDate);
      return { startDate: iso, endDate: iso };
    }
    case "yesterday": {
      const y = new Date(reportingDate);
      y.setDate(reportingDate.getDate() - 1);
      const iso = formatIsoDate(y);
      return { startDate: iso, endDate: iso };
    }
    case "thisWeek": {
      const d = new Date(reportingDate);
      const day = d.getDay(); // 0: CN, 1: T2, ..., 6: T7
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        startDate: formatIsoDate(monday),
        endDate: formatIsoDate(sunday),
      };
    }
    case "lastWeek": {
      const d = new Date(reportingDate);
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const thisMonday = new Date(d);
      thisMonday.setDate(d.getDate() + diffToMonday);

      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);

      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);

      return {
        startDate: formatIsoDate(lastMonday),
        endDate: formatIsoDate(lastSunday),
      };
    }
    case "thisMonth": {
      // MTD: 01 của tháng báo cáo -> ngày báo cáo mặc định (T-1 / T-2)
      const firstDay = new Date(reportingDate.getFullYear(), reportingDate.getMonth(), 1);
      return {
        startDate: formatIsoDate(firstDay),
        endDate: formatIsoDate(reportingDate),
      };
    }
    case "lastMonth": {
      // Trọn tháng trước: 01 của tháng trước -> ngày cuối cùng của tháng trước
      const prevMonthFirstDay = new Date(reportingDate.getFullYear(), reportingDate.getMonth() - 1, 1);
      const prevMonthLastDay = new Date(reportingDate.getFullYear(), reportingDate.getMonth(), 0);
      return {
        startDate: formatIsoDate(prevMonthFirstDay),
        endDate: formatIsoDate(prevMonthLastDay),
      };
    }
    default:
      return null;
  }
}

/**
 * Hook đồng bộ 2 chiều giữa URL Search Params và Dashboard Filters.
 */
export function useDashboardFilters(defaultPreset = "thisMonth") {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const filters = useMemo(() => {
    const defaultReporting = getDefaultReportingDate();
    const defaultReportingIso = formatIsoDate(defaultReporting);
    const rawPreset = searchParams.get("preset");
    const rawMonth = searchParams.get("month");
    const rawYear = searchParams.get("year");
    const rawOwner = searchParams.get("owner");
    const rawStartDate = searchParams.get("startDate");
    const rawEndDate = searchParams.get("endDate");
    const rawDate = searchParams.get("date");

    const preset = rawPreset || defaultPreset;
    const isCustom = preset === "custom";

    const dynamicRange = calculatePresetDateRange(preset);

    const startDate = isCustom
      ? rawStartDate || dynamicRange?.startDate || defaultReportingIso
      : dynamicRange?.startDate || rawStartDate || defaultReportingIso;

    const endDate = isCustom
      ? rawEndDate || dynamicRange?.endDate || defaultReportingIso
      : dynamicRange?.endDate || rawEndDate || defaultReportingIso;

    const startObj = new Date(startDate);
    const month = rawMonth
      ? Number(rawMonth)
      : startObj.getMonth() + 1 || defaultReporting.getMonth() + 1;
    const year = rawYear
      ? Number(rawYear)
      : startObj.getFullYear() || defaultReporting.getFullYear();

    const owner =
      !rawOwner ||
      rawOwner === "all" ||
      rawOwner === "Tất cả" ||
      rawOwner === "Tất cả phụ trách"
        ? "Tất cả phụ trách"
        : rawOwner;

    const singleDate = rawDate || defaultReportingIso;

    return {
      preset,
      month,
      year,
      owner,
      startDate,
      endDate,
      singleDate,
      isCustomRange: isCustom,
    };
  }, [searchParams, defaultPreset]);

  /**
   * Cập nhật các trường filter lên URL Search Params.
   */
  const setFilters = useCallback(
    (newFilters, { replace = true } = {}) => {
      setSearchParams(
        (prevParams) => {
          const next = new URLSearchParams(prevParams);

          // 1. Khi chọn Preset nhanh -> tính lại khoảng ngày & month/year
          if (newFilters.preset && newFilters.preset !== "custom") {
            const dynamic = calculatePresetDateRange(newFilters.preset);
            if (dynamic) {
              next.set("preset", newFilters.preset);
              next.set("startDate", dynamic.startDate);
              next.set("endDate", dynamic.endDate);
              const startObj = new Date(dynamic.startDate);
              next.set("month", String(startObj.getMonth() + 1));
              next.set("year", String(startObj.getFullYear()));
            }
          }

          // 2. Cập nhật các trường khác và làm sạch URL
          Object.entries(newFilters).forEach(([key, value]) => {
            if (key === "preset" && newFilters.preset !== "custom") return;

            // Làm sạch owner
            if (key === "owner") {
              if (
                !value ||
                value === "all" ||
                value === "Tất cả" ||
                value === "Tất cả phụ trách"
              ) {
                next.delete("owner");
                return;
              }
            }

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

  const resetFilters = useCallback(
    (preset = defaultPreset) => {
      const reportingDate = getDefaultReportingDate();
      const dynamic = calculatePresetDateRange(preset);

      setFilters({
        preset,
        month: reportingDate.getMonth() + 1,
        year: reportingDate.getFullYear(),
        owner: "",
        startDate: dynamic?.startDate || formatIsoDate(reportingDate),
        endDate: dynamic?.endDate || formatIsoDate(reportingDate),
        singleDate: formatIsoDate(reportingDate),
        date: formatIsoDate(reportingDate),
      });
    },
    [defaultPreset, setFilters]
  );

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
