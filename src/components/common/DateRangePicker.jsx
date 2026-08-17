import { useState, useRef, useEffect } from "react";
import { calculatePresetDateRange } from "../../hooks/useDashboardFilters";

const PRESET_LABELS = {
  yesterday: "Hôm qua",
  today: "Hôm nay",
  thisWeek: "Tuần này",
  thisMonth: "Tháng này",
};

function formatDateInput(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function DateField({ label, value, onChange }) {
  const ref = useRef(null);

  return (
    <div className="cdp-field" onClick={() => ref.current?.showPicker?.()}>
      <span className="cdp-field__label">{label}</span>
      <div className="cdp-field__body">
        <svg className="cdp-field__icon" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="cdp-field__text">
          {value ? formatDateDisplay(value) : <span className="cdp-field__placeholder">DD/MM/YYYY</span>}
        </span>
        <input
          ref={ref}
          type="date"
          className="cdp-field__native"
          value={formatDateInput(value)}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

export default function DateRangePicker({
  startDate,
  endDate,
  preset = "thisMonth",
  onChangeRange,
  mode = "range", // "range" | "single"
  singleDate,
  onChangeSingleDate,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [draftFrom, setDraftFrom] = useState(startDate ? new Date(startDate) : new Date());
  const [draftTo, setDraftTo] = useState(endDate ? new Date(endDate) : new Date());

  // Đồng bộ 2 ô input khi props startDate/endDate thay đổi
  useEffect(() => {
    if (startDate) setDraftFrom(new Date(startDate));
    if (endDate) setDraftTo(new Date(endDate));
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rangeLabel =
    mode === "single"
      ? formatDateDisplay(singleDate || new Date())
      : `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`;

  const handleQuickPreset = (p) => {
    const dynamic = calculatePresetDateRange(p);
    if (dynamic) {
      setDraftFrom(new Date(dynamic.startDate));
      setDraftTo(new Date(dynamic.endDate));
      onChangeRange?.({
        preset: p,
        startDate: dynamic.startDate,
        endDate: dynamic.endDate,
      });
    } else {
      onChangeRange?.({ preset: p });
    }
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    onChangeRange?.({
      startDate: formatDateInput(draftFrom),
      endDate: formatDateInput(draftTo),
      preset: "custom",
    });
    setIsOpen(false);
  };

  if (mode === "single") {
    return (
      <div className="date-picker-wrap" ref={dropdownRef}>
        <button
          type="button"
          className={`date-picker-trigger ${isOpen ? "is-open" : ""}`}
          onClick={() => setIsOpen((v) => !v)}
          style={{ minWidth: 170 }}
        >
          <svg className="date-picker-icon" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="date-picker-range">
            <span className="date-picker-preset-badge">Ngày</span>
            <span>{rangeLabel}</span>
          </span>
          <svg className={`date-picker-caret ${isOpen ? "rotated" : ""}`} viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {isOpen && (
          <div className="date-picker-dropdown">
            <div className="date-picker-presets">
              <div className="date-picker-presets-label">Nhanh</div>
              {[
                { label: "Hôm qua", offset: -1 },
                { label: "Hôm nay", offset: 0 },
                { label: "Ngày mai", offset: 1 },
              ].map(({ label, offset }) => {
                const target = new Date();
                target.setDate(target.getDate() + offset);
                const isoStr = formatDateInput(target);
                const isActive = formatDateInput(singleDate) === isoStr;
                return (
                  <button
                    key={offset}
                    type="button"
                    className={`date-preset-item ${isActive ? "is-active" : ""}`}
                    onClick={() => {
                      onChangeSingleDate?.(isoStr);
                      setIsOpen(false);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="date-picker-divider" />

            <div className="date-picker-custom">
              <div className="date-picker-custom-label">Chọn ngày</div>
              <div className="date-picker-inputs">
                <input
                  type="date"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #d7d3c8", fontSize: 12 }}
                  value={formatDateInput(singleDate)}
                  onChange={(e) => {
                    if (e.target.value) {
                      onChangeSingleDate?.(e.target.value);
                      setIsOpen(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="date-picker-wrap" ref={dropdownRef}>
      <button
        type="button"
        className={`date-picker-trigger ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
      >
        <svg className="date-picker-icon" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="date-picker-range">
          {PRESET_LABELS[preset] ? (
            <span className="date-picker-preset-badge">{PRESET_LABELS[preset]}</span>
          ) : (
            <span className="date-picker-preset-badge">Tùy chỉnh</span>
          )}
          <span>{rangeLabel}</span>
        </span>
        <svg className={`date-picker-caret ${isOpen ? "rotated" : ""}`} viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="date-picker-dropdown">
          <div className="date-picker-presets">
            <div className="date-picker-presets-label">Nhanh</div>
            {["yesterday", "today", "thisWeek", "thisMonth"].map((p) => (
              <button
                key={p}
                type="button"
                className={`date-preset-item ${preset === p ? "is-active" : ""}`}
                onClick={() => handleQuickPreset(p)}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="date-picker-divider" />

          <div className="date-picker-custom">
            <div className="date-picker-custom-label">Tùy chỉnh</div>
            <div className="date-picker-inputs">
              <DateField label="Từ ngày" value={draftFrom} onChange={(d) => setDraftFrom(d)} />
              <div className="date-picker-sep">→</div>
              <DateField label="Đến ngày" value={draftTo} onChange={(d) => setDraftTo(d)} />
            </div>
            <button type="button" className="date-picker-apply-btn" onClick={handleApplyCustom}>
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
