import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../context/AuthContext";
import Can from "./auth/Can";
import UserAvatar from "./common/UserAvatar";

export default function UserMenu({ currentUser, onLogout, roleBadge, onOpenEmailConfig }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const { user, role, switchRole } = useAuth();

  const currentRole = roleBadge || role || "BOD_ADMIN";
  const displayName = user?.displayName || user?.full_name || currentUser || "User";
  const avatarUrl = user?.avatar || user?.avatar_url || "";
  const employeeCode = user?.employee_code || "";
  const buName = user?.bu_name || user?.bu_code || "";
  const userEmail = user?.email || (user?.username && user?.username.includes("@") ? user?.username : "") || "";

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
    const norm = String(r || "").toUpperCase();
    if (norm === "BOD" || norm === "BOD_ADMIN") return { bg: "#fef3c7", color: "#92400e", border: "#fde68a", text: "👑 BOD" };
    if (norm === "BU_HEAD") return { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd", text: "🏢 BU_HEAD" };
    if (norm === "SALES" || norm === "BU_STAFF") return { bg: "#dcfce7", color: "#166534", border: "#bbf7d0", text: "💼 SALES" };
    return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0", text: "👤 VIEWER" };
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
        <UserAvatar
          src={avatarUrl}
          name={displayName}
          size={22}
          fontSize={11}
        />

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
            width: 250,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 100,
            padding: "8px 0",
          }}
        >
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <UserAvatar
                src={avatarUrl}
                name={displayName}
                size={36}
                fontSize={14}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  Vai trò: <strong style={{ color: badgeStyle.color }}>{badgeStyle.text}</strong>
                </div>
              </div>
            </div>

            {userEmail && (
              <div
                style={{
                  background: "#f1f5f9",
                  color: "#0f172a",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 11,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  margin: "4px 0 8px 0",
                  border: "1px solid #e2e8f0",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
                title={userEmail}
              >
                <span style={{ fontSize: 12 }}>✉️</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userEmail}
                </span>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px" }}>
              {employeeCode && (
                <span style={{ fontSize: 11, color: "#64748b" }}>Mã NV: <strong style={{ color: "#334155" }}>{employeeCode}</strong></span>
              )}
              {buName && (
                <span style={{ fontSize: 11, color: "#64748b" }}>Đơn vị: <strong style={{ color: "#334155" }}>{buName}</strong></span>
              )}
            </div>
          </div>

          {/* Quick Role Switcher for Dev / Testing - CHỈ HIỂN THỊ TRONG MÔI TRƯỜNG DEV */}
          {import.meta.env.DEV && (
            <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>
                Chuyển vai trò (Dev only):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleSwitch(ROLES.BOD_ADMIN)}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: currentRole === "BOD_ADMIN" ? "#fef3c7" : "#fff",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                    fontWeight: currentRole === "BOD_ADMIN" ? 700 : 500,
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
                    background: currentRole === "BU_HEAD" ? "#e0f2fe" : "#fff",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                    fontWeight: currentRole === "BU_HEAD" ? 700 : 500,
                  }}
                >
                  🏢 BU_HEAD (Quản lý Elevator)
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleSwitch(ROLES.SALES)}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: currentRole === "SALES" ? "#dcfce7" : "#fff",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                    fontWeight: currentRole === "SALES" ? 700 : 500,
                  }}
                >
                  💼 SALES (Kinh doanh Elevator)
                </button>
              </div>
            </div>
          )}

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