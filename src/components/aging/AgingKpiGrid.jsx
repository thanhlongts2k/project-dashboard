import { useState, useEffect } from "react";
import MetricCard from "../MetricCard";

/**
 * AgingKpiGrid — Collapsible KPI section
 *
 * - Desktop (≥768px): Always expanded, 4-column grid.
 * - Mobile  (<768px): Collapsed by default; header shows a 1-line summary badge.
 *   Tap the header to toggle expand/collapse with a smooth transition.
 */
export default function AgingKpiGrid({ kpiCards = [], buName = "Elevator" }) {
  // Detect initial mobile state (server-safe: default to desktop/expanded)
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });

  // Sync if window is resized across the breakpoint
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setIsExpanded(true); // Always open on desktop
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Build mini-summary from kpiCards data
  const totalDebtText   = kpiCards[0]?.valueText  || "—";
  const overdueRateText = kpiCards[3]?.valueText   || "—";
  const overdueRateNum  = Number(kpiCards[3]?.rawNumber || 0);
  const isDanger        = overdueRateNum > 20;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* ─── Clickable accordion header ───────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((p) => !p)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIsExpanded((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "8px 12px",
          borderRadius: 8,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          cursor: "pointer",
          marginBottom: isExpanded ? 10 : 4,
          userSelect: "none",
          transition: "background 0.15s ease, margin-bottom 0.2s ease",
        }}
        className="aging-kpi-header"
      >
        {/* Left: Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
            textTransform: "uppercase", color: "#64748b", whiteSpace: "nowrap" }}>
            Tổng quan tuổi nợ
          </span>
          <span style={{ fontSize: 10, color: "#cbd5e1" }}>—</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {buName}
          </span>

          {/* Mini summary badge: only when collapsed on mobile */}
          {!isExpanded && kpiCards.length > 0 && (
            <span className="aging-kpi-mini-badge" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 8px",
              borderRadius: 20,
              background: isDanger ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${isDanger ? "#fecaca" : "#bbf7d0"}`,
              fontSize: 11,
              fontWeight: 700,
              color: isDanger ? "#b91c1c" : "#15803d",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}>
              <span>{totalDebtText}</span>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <span>Quá hạn: {overdueRateText}</span>
              <span style={{ fontSize: 9 }}>{isDanger ? "⚠️" : "✓"}</span>
            </span>
          )}
        </div>

        {/* Right: Chevron icon */}
        <span style={{
          fontSize: 13,
          color: "#64748b",
          transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.2s ease",
          flexShrink: 0,
          lineHeight: 1,
        }}>
          ▼
        </span>
      </div>

      {/* ─── KPI grid body with smooth expand/collapse ─────────────────── */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: isExpanded ? "600px" : "0px",
          opacity: isExpanded ? 1 : 0,
          transition: "max-height 0.28s ease, opacity 0.22s ease",
        }}
      >
        <div className="kpi-grid kpi-grid-4">
          {kpiCards.map((item, idx) => (
            <MetricCard key={`${item.label}-${idx}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
