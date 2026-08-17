import DateRangePicker from "./DateRangePicker";

/**
 * UnifiedSubHeader - Tầng 2 chuẩn Executive Dashboard
 * Gom gọn Tiêu đề trang + Bộ lọc + Thao tác vào cùng 1 thanh ngang phẳng, hiện đại.
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
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        padding: "10px 0 14px 0",
        marginBottom: 12,
        borderBottom: "1px solid #dcdad1",
      }}
    >
      {/* LEFT: Title & Subtitle or Inline BU Selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 260 }}>
        {buSelector ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>Dashboard Chi Tiết:</span>
              <div className="otb-owner-wrap" style={{ display: "inline-flex", margin: 0 }}>
                <select
                  className="otb-owner-select"
                  value={buSelector.activeBu}
                  onChange={(e) => buSelector.onChangeBu?.(e.target.value)}
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#185FA5",
                    background: "#f0f7ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 8,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  {(buSelector.tabs || []).map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
            </h1>

            {buSelector.revenuePercentText && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "#f4f3ef",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span>DT: {buSelector.revenuePercentText}</span>
                <span style={{ color: "#94a3b8" }}>|</span>
                <span>TT: {buSelector.collectionPercentText}</span>
              </div>
            )}
          </div>
        ) : (
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1f2937" }}>
            {title}
          </h1>
        )}

        {subtitle && (
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* RIGHT: Compact Filter & Action Controls on the same row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
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
            style={{ height: 36, padding: "0 12px", borderRadius: 8, fontSize: 12 }}
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
            style={{ height: 36, padding: "0 12px", borderRadius: 8, fontSize: 12 }}
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
