import { useSearchParams, useLocation } from "react-router-dom";
import { useMemo, useCallback } from "react";

function formatIsoDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Tính toán lại khoảng ngày chính xác cho các preset động.
 * - today: hôm nay
 * - yesterday: hôm qua
 * - thisWeek: Thứ Hai đầu tuần -> Chủ Nhật cùng tuần
 * - thisMonth: Ngày 01 đầu tháng -> Ngày cuối cùng của tháng
 */
export function calculatePresetDateRange(preset) {
  const now = new Date();

  switch (preset) {
    case "yesterday": {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const iso = formatIsoDate(y);
      return { startDate: iso, endDate: iso };
    }
    case "today": {
      const iso = formatIsoDate(now);
      return { startDate: iso, endDate: iso };
    }
    case "thisWeek": {
      const d = new Date(now);
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
    case "thisMonth": {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return {
        startDate: formatIsoDate(firstDay),
        endDate: formatIsoDate(lastDay),
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
    const today = new Date();
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
      ? rawStartDate || dynamicRange?.startDate || formatIsoDate(today)
      : dynamicRange?.startDate || rawStartDate || formatIsoDate(today);

    const endDate = isCustom
      ? rawEndDate || dynamicRange?.endDate || formatIsoDate(today)
      : dynamicRange?.endDate || rawEndDate || formatIsoDate(today);

    const startObj = new Date(startDate);
    const month = rawMonth
      ? Number(rawMonth)
      : startObj.getMonth() + 1 || today.getMonth() + 1;
    const year = rawYear
      ? Number(rawYear)
      : startObj.getFullYear() || today.getFullYear();

    const owner =
      !rawOwner ||
      rawOwner === "all" ||
      rawOwner === "Tất cả" ||
      rawOwner === "Tất cả phụ trách"
        ? "Tất cả phụ trách"
        : rawOwner;

    const singleDate = rawDate || formatIsoDate(today);

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
      const today = new Date();
      const dynamic = calculatePresetDateRange(preset);

      setFilters({
        preset,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        owner: "",
        startDate: dynamic?.startDate || formatIsoDate(today),
        endDate: dynamic?.endDate || formatIsoDate(today),
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
