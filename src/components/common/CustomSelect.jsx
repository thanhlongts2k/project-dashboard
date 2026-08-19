import { useState, useRef, useEffect } from "react";

/**
 * CustomSelect - Dropdown tùy biến chuẩn Executive Dashboard.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Chọn...",
  disabled = false,
  style = {},
  triggerStyle = {},
  className = "",
  align = "left",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optValue) => {
    if (disabled) return;
    onChange?.(optValue);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      <button
        type="button"
        className="custom-select-trigger"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          ...triggerStyle,
        }}
      >
        <span className="custom-select-label" title={displayLabel}>
          {selectedOption?.icon && <span style={{ marginRight: 6 }}>{selectedOption.icon}</span>}
          {displayLabel}
        </span>

        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
            opacity: disabled ? 0.4 : 0.7,
            flexShrink: 0,
          }}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: align === "right" ? "auto" : 0,
            right: align === "right" ? 0 : "auto",
            minWidth: "100%",
            width: "max-content",
            maxWidth: "min(420px, calc(100vw - 32px))",
            maxHeight: 260,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            padding: "4px",
            animation: "fadeIn 0.12s ease-out",
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: isSelected ? "var(--color-primary-light, #eff6ff)" : "transparent",
                  color: isSelected ? "var(--color-primary, #1d4ed8)" : "var(--text-main, #0f172a)",
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.1s ease",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }} title={opt.label}>
                  {opt.icon && <span style={{ marginRight: 6 }}>{opt.icon}</span>}
                  {opt.label}
                </span>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--color-primary, #1d4ed8)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
