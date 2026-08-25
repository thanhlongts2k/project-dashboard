// useEffect removed — scroll lock handled by useBodyScrollLock hook
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../context/AuthContext";
import Can from "../auth/Can";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import UserAvatar from "../common/UserAvatar";

export default function MobileNavDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  buDetailPath,
  onOpenEmailConfig,
  onExportAllReports,
}) {
  const { user, role, switchRole, logout, canAccessTab } = useAuth();

  // Khoá cuộn nền trang khi drawer mở (iOS Safari safe với position:fixed)
  useBodyScrollLock(isOpen);


  if (!isOpen) return null;

  const displayName = user?.displayName || user?.full_name || user?.username || "User";
  const avatarUrl = user?.avatar || user?.avatar_url || "";
  const userEmail = user?.email || (user?.username && user?.username.includes("@") ? user?.username : "") || "";
  const employeeCode = user?.employee_code || "";
  const buName = user?.bu_name || user?.bu_code || "";

  const getRoleBadgeStyle = (r) => {
    const norm = String(r || "").toUpperCase();
    if (norm === "BOD" || norm === "BOD_ADMIN") return { bg: "#fef3c7", color: "#92400e", border: "#fde68a", text: "👑 BOD" };
    if (norm === "BU_HEAD") return { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd", text: "🏢 BU_HEAD" };
    if (norm === "SALES" || norm === "BU_STAFF") return { bg: "#dcfce7", color: "#166534", border: "#bbf7d0", text: "💼 SALES" };
    return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0", text: "👤 VIEWER" };
  };

  const badge = getRoleBadgeStyle(role);

  const handleRoleSwitch = (newRole) => {
    switchRole?.(newRole);
    toast.success(`Đã chuyển vai trò sang: ${newRole}`);
  };

  const allNavItems = [
    { key: "dashboard", tabKey: "dashboard", path: "/dashboard", label: "📊 Báo cáo Tổng quan" },
    { key: "bu", tabKey: "bu_detail", path: buDetailPath, label: "🏢 Báo cáo Chi tiết BU" },
    { key: "inventory", tabKey: "inventory", path: "/inventory", label: "📦 Báo cáo Tồn kho" },
    { key: "receivables", tabKey: "debt_collection", path: "/receivables", label: "💰 Báo cáo Công nợ & Thu tiền" },
    { key: "aging", tabKey: "aging", path: "/aging", label: "📈 Báo cáo Tuổi nợ (Aging Matrix)" },
  ];

  const isTestUser = user?.role === "TEST";
  const navItems = allNavItems.filter((item) => {
    if (item.key === "inventory" && !isTestUser) return false;
    return canAccessTab ? canAccessTab(item.tabKey) : true;
  });

  return (
    <div className="mobile-drawer-backdrop" onClick={onClose}>
      <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/HPC-Icon.png" alt="HPC" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} />
            <strong style={{ fontSize: 15, color: "#1f2937" }}>HPC Dashboard</strong>
          </div>
          <button type="button" className="mobile-drawer-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Drawer Body Scroll */}
        <div className="mobile-drawer-body">
          {/* KHU VỰC 1: User Profile & RBAC Card */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <UserAvatar
                src={avatarUrl}
                name={displayName}
                size={44}
                fontSize={16}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </div>
                <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, marginTop: 2 }}>
                  {badge.text}
                </div>
              </div>
            </div>

            {/* Highlighted Email Badge on Mobile */}
            {userEmail && (
              <div
                style={{
                  background: "#ffffff",
                  color: "#0f172a",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  margin: "6px 0 8px 0",
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={userEmail}
              >
                <span style={{ fontSize: 12 }}>✉️</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userEmail}
                </span>
              </div>
            )}

            {(employeeCode || buName) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                {employeeCode && <span>Mã NV: <strong style={{ color: "#334155" }}>{employeeCode}</strong></span>}
                {buName && <span>Đơn vị: <strong style={{ color: "#334155" }}>{buName}</strong></span>}
              </div>
            )}

            {/* Quick Role Switcher - Chỉ hiển thị trong môi trường Development */}
            {import.meta.env.DEV && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>
                  Chuyển vai trò (Dev only):
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.BOD_ADMIN)}
                    style={{ fontSize: 10, padding: "5px 2px", borderRadius: 6, fontWeight: role === "BOD_ADMIN" ? 700 : 500, background: role === "BOD_ADMIN" ? "#fef3c7" : "#fff", color: role === "BOD_ADMIN" ? "#92400e" : "#475569", border: "1px solid #cbd5e1", cursor: "pointer" }}
                  >
                    👑 BOD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.BU_HEAD)}
                    style={{ fontSize: 10, padding: "5px 2px", borderRadius: 6, fontWeight: role === "BU_HEAD" ? 700 : 500, background: role === "BU_HEAD" ? "#e0f2fe" : "#fff", color: role === "BU_HEAD" ? "#0369a1" : "#475569", border: "1px solid #cbd5e1", cursor: "pointer" }}
                  >
                    🏢 BU_HEAD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.SALES)}
                    style={{ fontSize: 10, padding: "5px 2px", borderRadius: 6, fontWeight: role === "SALES" ? 700 : 500, background: role === "SALES" ? "#dcfce7" : "#fff", color: role === "SALES" ? "#166534" : "#475569", border: "1px solid #cbd5e1", cursor: "pointer" }}
                  >
                    💼 SALES
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                logout?.();
              }}
              style={{ width: "100%", padding: "7px 0", borderRadius: 6, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <span>🚪</span> <span>Đăng xuất</span>
            </button>
          </div>

          {/* KHU VỰC 2: Danh sách 5 Tab điều hướng */}
          <div className="slbl" style={{ margin: "10px 0 6px" }}>Phân hệ Báo cáo</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.path);
                    onClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "11px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? "var(--color-primary-light, #f0f7ff)" : "#fff",
                    color: isActive ? "var(--color-primary, #185fa5)" : "#334155",
                    border: isActive ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* KHU VỰC 3: Hành động toàn cục */}
          <div className="slbl" style={{ margin: "10px 0 6px" }}>Thao tác Toàn cục</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Can perform="CONFIGURE_EMAIL">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEmailConfig();
                }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#fff", color: "#334155", border: "1px solid #d7d3c8", cursor: "pointer" }}
              >
                <span>✉️</span> <span>Lập lịch Mail tự động</span>
              </button>
            </Can>

            <button
              type="button"
              onClick={() => {
                onClose();
                onExportAllReports();
              }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", cursor: "pointer" }}
            >
              <span>📥</span> <span>Xuất PDF Toàn Bộ Báo Cáo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
