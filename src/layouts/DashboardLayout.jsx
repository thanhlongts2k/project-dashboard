import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../context/DashboardContext";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import Can from "../components/auth/Can";
import LoadingOverlay from "../components/LoadingOverlay";
import EmailConfigModal from "../components/EmailConfigModal";
import UserMenu from "../components/UserMenu";
import MobileNavDrawer from "../components/navigation/MobileNavDrawer";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout, defaultAllowedBu, canAccessBu, canAccessTab, firstAllowedPath } = useAuth();
  const {
    activeBu,
    loadingOverlay,
    loadingOverlayText,
    showEmailConfig,
    setShowEmailConfig,
    handleExportAllReports,
  } = useDashboard();
  const { preserveSearch } = useDashboardFilters();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const pathname = location.pathname;
  const isOverviewActive = pathname === "/dashboard" || pathname === "/";
  const isBuDetailActive = pathname.startsWith("/bu");
  const isInventoryActive = pathname === "/inventory";
  const isReceivablesActive = pathname === "/receivables";
  const isAgingActive = pathname === "/aging";

  const getActiveTabKey = () => {
    if (isOverviewActive) return "dashboard";
    if (isBuDetailActive) return "bu";
    if (isInventoryActive) return "inventory";
    if (isReceivablesActive) return "receivables";
    if (isAgingActive) return "aging";
    return "dashboard";
  };

  const handleTabClick = (targetPath) => {
    navigate(preserveSearch(targetPath));
  };

  const currentAllowedBu = canAccessBu(activeBu) ? activeBu : defaultAllowedBu || "elevator";
  const buDetailPath = `/bu/${currentAllowedBu}`;

  return (
    <div className="page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f3ef" }}>
      {/* TẦNG 1: Global TopBar Header (56px fixed on Mobile & Desktop) */}
      <header
        className="topbar-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: 56,
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.98)",
          borderBottom: "1px solid #e2e8f0",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
          boxSizing: "border-box",
        }}
      >
        <div className="topbar-container">
          {/* Brand Logo & Title */}
          <div className="topbar-left">
            <div
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              onClick={() => handleTabClick(firstAllowedPath || "/dashboard")}
            >
              <img src="/HPC-Icon.png" alt="HPC" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} />
              <div className="brand-title">
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                  HPC Dashboard
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs - Lọc hiển thị theo quyền User */}
            <nav className="desktop-nav-tabs">
              {canAccessTab("dashboard") && (
                <button type="button" className={`link-btn nav-tab-btn ${isOverviewActive ? "active" : ""}`} onClick={() => handleTabClick("/dashboard")}>
                  📊 Tổng quan
                </button>
              )}
              {canAccessTab("bu_detail") && (
                <button type="button" className={`link-btn nav-tab-btn ${isBuDetailActive ? "active" : ""}`} onClick={() => handleTabClick(buDetailPath)}>
                  🏢 Chi tiết BU
                </button>
              )}
              {user?.role === "TEST" && canAccessTab("inventory") && (
                <button type="button" className={`link-btn nav-tab-btn ${isInventoryActive ? "active" : ""}`} onClick={() => handleTabClick("/inventory")}>
                  📦 Tồn kho
                </button>
              )}
              {canAccessTab("debt_collection") && (
                <button type="button" className={`link-btn nav-tab-btn ${isReceivablesActive ? "active" : ""}`} onClick={() => handleTabClick("/receivables")}>
                  💰 Công nợ & Thu tiền
                </button>
              )}
              {canAccessTab("aging") && (
                <button type="button" className={`link-btn nav-tab-btn ${isAgingActive ? "active" : ""}`} onClick={() => handleTabClick("/aging")}>
                  📈 Tuổi nợ
                </button>
              )}
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="desktop-right-actions">
            <Can perform="CONFIGURE_EMAIL">
              <button type="button" className="link-btn topbar-action-btn" onClick={() => setShowEmailConfig(true)} title="Cấu hình lịch gửi email tự động (BOD)">
                <span>✉️</span>
                <span>Lập lịch Mail</span>
              </button>
            </Can>

            <button type="button" className="link-btn topbar-export-btn" onClick={handleExportAllReports} title="Xuất PDF tổng hợp toàn bộ báo cáo">
              <span>📥</span>
              <span>Xuất Toàn Bộ</span>
            </button>

            <UserMenu currentUser={user?.displayName || user?.username || "User"} onLogout={logout} roleBadge={role} onOpenEmailConfig={() => setShowEmailConfig(true)} />
          </div>

          {/* Mobile Right Unified One-Button Header (Menu Hamburger) */}
          <div className="mobile-right-actions">
            <button
              type="button"
              className="mobile-hamburger-btn touch-target"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Mở menu điều hành"
              title="Menu điều hành"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View (Sub-route) */}
      <main className="main-content" style={{ flex: 1, paddingTop: 56, paddingBottom: 24, minWidth: 0, maxWidth: "100%", boxSizing: "border-box" }}>
        <Outlet />
      </main>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeTab={getActiveTabKey()}
        onSelectTab={handleTabClick}
        buDetailPath={buDetailPath}
        onOpenEmailConfig={() => setShowEmailConfig(true)}
        onExportAllReports={handleExportAllReports}
      />

      {/* Global Modals & Loading */}
      {showEmailConfig && (
        <EmailConfigModal
          open={true}
          isOpen={true}
          onClose={() => setShowEmailConfig(false)}
        />
      )}

      {loadingOverlay && <LoadingOverlay text={loadingOverlayText} />}
    </div>
  );
}
