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
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          height: 36,
          padding: "0 12px",
          background: disabled ? "#f8fafc" : "#fff",
          border: disabled ? "1px solid #cbd5e1" : "1px solid var(--border-card, #e2e8f0)",
          borderRadius: 8,
          color: disabled ? "#94a3b8" : "var(--text-main, #0f172a)",
          fontSize: 12,
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))",
          transition: "all 0.15s ease",
          outline: "none",
          whiteSpace: "nowrap",
          ...triggerStyle,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
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
            right: 0,
            left: "auto",
            minWidth: "100%",
            width: "max-content",
            maxWidth: "calc(100vw - 32px)",
            maxHeight: 240,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
            zIndex: 100,
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
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: isSelected ? "var(--color-primary-light, #f0f7ff)" : "transparent",
                  color: isSelected ? "var(--color-primary, #185fa5)" : "var(--text-main, #0f172a)",
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {opt.icon && <span style={{ marginRight: 6 }}>{opt.icon}</span>}
                  {opt.label}
                </span>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginLeft: 8 }}>
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--color-primary, #185fa5)"
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
