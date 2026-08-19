import { useAuth } from "../../hooks/useAuth";
import DateRangePicker from "./DateRangePicker";
import CustomSelect from "./CustomSelect";

/**
 * UnifiedSubHeader - Tầng 2 chuẩn Executive Dashboard
 * Gom gọn Tiêu đề trang + Bộ lọc + Thao tác vào cùng 1 thanh ngang phẳng, hiện đại.
 * Tích hợp Data Scoping: tự động lọc và khóa Dropdown BU theo phân quyền của user.
 */
export default function UnifiedSubHeader({
  title,
  subtitle,
  buSelector, // Optional: { activeBu, tabs, onChangeBu, owner, subInfo, revenuePercentText, collectionPercentText }
  datePickerProps, // { startDate, endDate, preset, onChangeRange, mode, singleDate, onChangeSingleDate }
  secondaryFilter, // Optional: JSX or select
  onRefresh,
  loading = false,
  onExportPdf,
  exportingPdf = false,
}) {
  const { canAccessBu, isBOD } = useAuth();

  // Lọc danh sách BU tabs theo quyền truy cập của user
  const availableBuTabs = (buSelector?.tabs || []).filter((tab) =>
    canAccessBu(tab.id)
  );

  const isBuLocked = !isBOD && availableBuTabs.length <= 1;

  const buOptions = availableBuTabs.map((tab) => ({
    value: tab.id,
    label: isBuLocked ? `${tab.label} 🔒` : tab.label,
  }));

  return (
    <div className="unified-sub-header">
      {/* LEFT: Title & Subtitle or Inline BU Selector */}
      <div className="unified-sub-header-left">
        {buSelector ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-main, #0f172a)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>Dashboard Chi Tiết:</span>
              <CustomSelect
                value={buSelector.activeBu}
                onChange={(nextBu) => buSelector.onChangeBu?.(nextBu)}
                options={buOptions}
                disabled={isBuLocked}
                triggerStyle={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isBuLocked ? "#475569" : "var(--color-primary, #185fa5)",
                  background: isBuLocked ? "#f1f5f9" : "var(--color-primary-light, #f0f7ff)",
                  border: isBuLocked ? "1px solid #cbd5e1" : "1px solid var(--color-primary-border, #bfdbfe)",
                  borderRadius: 8,
                }}
              />
            </h1>

            {buSelector.revenuePercentText && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span>DT: {buSelector.revenuePercentText}</span>
                <span style={{ color: "#cbd5e1" }}>|</span>
                <span>TT: {buSelector.collectionPercentText}</span>
              </div>
            )}
          </div>
        ) : (
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-main, #0f172a)" }}>
            {title}
          </h1>
        )}

        {subtitle && (
          <div style={{ fontSize: 11, color: "var(--text-muted, #64748b)", fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* RIGHT: Compact Filter & Action Controls on the same row */}
      <div className="unified-sub-header-actions">
        {/* Date Picker */}
        {datePickerProps && <DateRangePicker {...datePickerProps} />}

        {/* Secondary Filter (e.g. Owner Dropdown) */}
        {secondaryFilter}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            className="otb-icon-btn"
            onClick={onRefresh}
            disabled={loading}
            title="Làm mới dữ liệu"
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 8,
              fontSize: 12,
              border: "1px solid var(--border-card, #e2e8f0)",
              background: "#fff",
              boxShadow: "var(--shadow-sm)",
              cursor: "pointer",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            >
              <path
                d="M13.5 8a5.5 5.5 0 1 1-1.1-3.3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12.5 2v3.5H9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{loading ? "Đang tải..." : "Làm mới"}</span>
          </button>
        )}

        {/* Export PDF Button (Single Page) */}
        {onExportPdf && (
          <button
            type="button"
            className="otb-icon-btn"
            onClick={onExportPdf}
            disabled={exportingPdf}
            title="Tải báo cáo PDF trang này"
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 8,
              fontSize: 12,
              border: "1px solid var(--border-card, #e2e8f0)",
              background: "#fff",
              boxShadow: "var(--shadow-sm)",
              cursor: "pointer",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v8m0 0L5 7m3 3l3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 11v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{exportingPdf ? "Đang xuất..." : "Tải PDF"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
