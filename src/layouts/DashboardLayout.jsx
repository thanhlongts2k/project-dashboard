import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../context/DashboardContext";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import Can from "../components/auth/Can";
import LoadingOverlay from "../components/LoadingOverlay";
import EmailConfigModal from "../components/EmailConfigModal";
import UserMenu from "../components/UserMenu";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout, defaultAllowedBu, canAccessBu } = useAuth();
  const {
    activeBu,
    loadingOverlay,
    loadingOverlayText,
    showEmailConfig,
    setShowEmailConfig,
    handleExportAllReports,
  } = useDashboard();
  const { preserveSearch } = useDashboardFilters();

  const pathname = location.pathname;

  const isOverviewActive = pathname === "/dashboard" || pathname === "/";
  const isBuDetailActive = pathname.startsWith("/bu");
  const isInventoryActive = pathname === "/inventory";
  const isReceivablesActive = pathname === "/receivables";

  const handleTabClick = (targetPath) => {
    navigate(preserveSearch(targetPath));
  };

  const currentAllowedBu = canAccessBu(activeBu) ? activeBu : defaultAllowedBu || "elevator";
  const buDetailPath = `/bu/${currentAllowedBu}`;

  return (
    <div className="page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f3ef" }}>
      {/* TẦNG 1: Global TopBar Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #d7d3c8",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "8px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Brand Logo & Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              onClick={() => handleTabClick("/dashboard")}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #185FA5 0%, #3B82F6 100%)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  boxShadow: "0 2px 4px rgba(24,95,165,0.25)",
                }}
              >
                📊
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", lineHeight: 1.1 }}>
                  Executive BI
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav style={{ display: "flex", gap: 4, marginLeft: 8 }}>
              <button
                type="button"
                className={`link-btn ${isOverviewActive ? "active" : ""}`}
                onClick={() => handleTabClick("/dashboard")}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isOverviewActive ? 600 : 500,
                  background: isOverviewActive ? "#185FA5" : "transparent",
                  color: isOverviewActive ? "#fff" : "#4b5563",
                  border: isOverviewActive ? "1px solid #185FA5" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                📊 Tổng quan
              </button>
              <button
                type="button"
                className={`link-btn ${isBuDetailActive ? "active" : ""}`}
                onClick={() => handleTabClick(buDetailPath)}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isBuDetailActive ? 600 : 500,
                  background: isBuDetailActive ? "#185FA5" : "transparent",
                  color: isBuDetailActive ? "#fff" : "#4b5563",
                  border: isBuDetailActive ? "1px solid #185FA5" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                🏢 Chi tiết BU
              </button>
              <button
                type="button"
                className={`link-btn ${isInventoryActive ? "active" : ""}`}
                onClick={() => handleTabClick("/inventory")}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isInventoryActive ? 600 : 500,
                  background: isInventoryActive ? "#185FA5" : "transparent",
                  color: isInventoryActive ? "#fff" : "#4b5563",
                  border: isInventoryActive ? "1px solid #185FA5" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                📦 Tồn kho
              </button>
              <button
                type="button"
                className={`link-btn ${isReceivablesActive ? "active" : ""}`}
                onClick={() => handleTabClick("/receivables")}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isReceivablesActive ? 600 : 500,
                  background: isReceivablesActive ? "#185FA5" : "transparent",
                  color: isReceivablesActive ? "#fff" : "#4b5563",
                  border: isReceivablesActive ? "1px solid #185FA5" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                💰 Công nợ & Thu tiền
              </button>
            </nav>
          </div>

          {/* Right Compact Actions & UserMenu */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Can perform="CONFIGURE_EMAIL">
              <button
                type="button"
                className="link-btn"
                onClick={() => setShowEmailConfig(true)}
                style={{
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "1px solid #d7d3c8",
                }}
                title="Cấu hình lịch tự động gửi email báo cáo (Dành riêng cho BOD)"
              >
                <span>✉️</span>
                <span>Lập lịch Mail</span>
              </button>
            </Can>

            <button
              type="button"
              className="link-btn"
              onClick={handleExportAllReports}
              style={{
                height: 32,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 10px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
              }}
              title="Xuất file PDF tổng hợp toàn bộ báo cáo"
            >
              <span>📥</span>
              <span>Xuất Toàn Bộ</span>
            </button>

            <UserMenu
              currentUser={user?.displayName || user?.username || "User"}
              onLogout={logout}
              roleBadge={role}
            />
          </div>
        </div>
      </header>

      {/* Main Content View (Sub-route) */}
      <main style={{ flex: 1, paddingBottom: 24 }}>
        <Outlet />
      </main>

      {/* Global Modals & Loading */}
      {showEmailConfig && (
        <EmailConfigModal onClose={() => setShowEmailConfig(false)} />
      )}

      {loadingOverlay && <LoadingOverlay text={loadingOverlayText} />}
    </div>
  );
}
