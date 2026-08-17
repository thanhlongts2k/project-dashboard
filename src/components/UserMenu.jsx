import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../context/AuthContext";
import Can from "./auth/Can";

export default function UserMenu({ currentUser, onLogout, roleBadge, onOpenEmailConfig }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const { role, switchRole } = useAuth();

  const currentRole = roleBadge || role || "BOD";
  const displayName = currentUser || "User";
  const avatar = displayName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = (newRole) => {
    switchRole?.(newRole);
    toast.success(`Đã chuyển sang vai trò: ${newRole}`);
    setOpen(false);
  };

  const getRoleBadgeStyle = (r) => {
    if (r === ROLES.BOD) return { bg: "#fef3c7", color: "#92400e", border: "#fde68a", text: "👑 BOD" };
    if (r === ROLES.BU_HEAD) return { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd", text: "🏢 BU_HEAD" };
    return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0", text: "👤 BU_STAFF" };
  };

  const badgeStyle = getRoleBadgeStyle(currentRole);

  return (
    <div className="user-menu" ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        className={`user-menu-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 32,
          padding: "0 10px",
          borderRadius: 6,
          background: "#fff",
          border: "1px solid #d7d3c8",
          cursor: "pointer",
        }}
      >
        <span className="user-avatar" style={{ width: 22, height: 22, fontSize: 11 }}>
          {avatar}
        </span>

        <div style={{ textAlign: "left", lineHeight: 1.1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1f2937" }}>
            {displayName}
          </div>
        </div>

        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 4,
            background: badgeStyle.bg,
            color: badgeStyle.color,
            border: `1px solid ${badgeStyle.border}`,
          }}
        >
          {badgeStyle.text}
        </span>

        <span className="user-menu-caret" style={{ fontSize: 10 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          className="user-menu-dropdown"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            width: 240,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 100,
            padding: "8px 0",
          }}
        >
          <div style={{ padding: "8px 14px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{displayName}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Vai trò hiện tại: <strong>{currentRole}</strong></div>
          </div>

          {/* Quick Role Switcher for Dev / Testing */}
          <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>
              Chuyển vai trò (Test nhanh):
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button
                type="button"
                className="btn"
                onClick={() => handleSwitch(ROLES.BOD)}
                style={{
                  textAlign: "left",
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: currentRole === ROLES.BOD ? "#fef3c7" : "#fff",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  fontWeight: currentRole === ROLES.BOD ? 700 : 500,
                }}
              >
                👑 BOD (Toàn quyền + Dòng tiền)
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => handleSwitch(ROLES.BU_HEAD)}
                style={{
                  textAlign: "left",
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: currentRole === ROLES.BU_HEAD ? "#e0f2fe" : "#fff",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  fontWeight: currentRole === ROLES.BU_HEAD ? 700 : 500,
                }}
              >
                🏢 BU_HEAD (Quản lý Elevator)
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => handleSwitch(ROLES.BU_STAFF)}
                style={{
                  textAlign: "left",
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: currentRole === ROLES.BU_STAFF ? "#f1f5f9" : "#fff",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  fontWeight: currentRole === ROLES.BU_STAFF ? 700 : 500,
                }}
              >
                👤 BU_STAFF (Nhân viên Elevator)
              </button>
            </div>
          </div>

          <Can perform="CONFIGURE_EMAIL">
            <button
              type="button"
              className="user-menu-item"
              onClick={() => {
                setOpen(false);
                onOpenEmailConfig?.();
              }}
              style={{
                padding: "8px 14px",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                color: "#1e293b",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>✉️</span>
              <span>Cấu hình gửi báo cáo email</span>
            </button>
          </Can>

          <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />

          <button
            type="button"
            className="user-menu-item danger"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            style={{
              padding: "8px 14px",
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#dc2626",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}