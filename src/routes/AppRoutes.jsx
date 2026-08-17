import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../context/DashboardContext";
import { useDashboardFilters } from "../hooks/useDashboardFilters";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

import LoginPage from "../pages/LoginPage";
import DashboardOverviewPage from "../pages/DashboardOverviewPage";
import DashboardBuDetailPage from "../pages/DashboardBuDetailPage";
import InventoryReportPage from "../pages/InventoryReportPage";
import ReceivableReportPage from "../pages/ReceivableReportPage";
import DebtAgingReportPage from "../pages/DebtAgingReportPage";

function LoginPageWrapper() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSuccess = (authData) => {
    login(authData);
    navigate(from, { replace: true });
  };

  return <LoginPage onLoginSuccess={handleSuccess} />;
}

function DashboardOverviewPageWrapper() {
  const {
    dashboardData,
    loadingDashboard,
    loadOverviewData,
    handleExportAllReports,
  } = useDashboard();

  const { filters, setFilters } = useDashboardFilters("thisMonth");

  useEffect(() => {
    loadOverviewData({
      month: filters.month,
      year: filters.year,
      startDate: filters.startDate,
      endDate: filters.endDate,
      preset: filters.preset,
    });
  }, [filters.month, filters.year, filters.startDate, filters.endDate, filters.preset, loadOverviewData]);

  const handleApplyFilter = (newFilter) => {
    setFilters(newFilter);
  };

  const handleChangePeriod = (month, year) => {
    setFilters({ month, year, preset: "thisMonth" });
  };

  return (
    <DashboardOverviewPage
      data={dashboardData}
      loadingDashboard={loadingDashboard}
      onRefreshDashboard={() =>
        loadOverviewData({
          month: filters.month,
          year: filters.year,
          startDate: filters.startDate,
          endDate: filters.endDate,
          showOverlay: true,
          overlayText: "Đang làm mới dữ liệu tổng quan...",
        })
      }
      selectedMonth={filters.month}
      selectedYear={filters.year}
      overviewFilter={filters}
      onApplyOverviewFilter={handleApplyFilter}
      onChangePeriod={handleChangePeriod}
      onExportAllReports={handleExportAllReports}
    />
  );
}

function DashboardBuDetailPageWrapper() {
  const navigate = useNavigate();
  const params = useParams();
  const {
    activeBu,
    setActiveBu,
    dashboardData,
    loadingDetail,
    loadDetailData,
  } = useDashboard();

  const { filters, setFilters, preserveSearch } = useDashboardFilters("thisMonth");
  const currentBuKey = params.buKey || activeBu || "elevator";

  useEffect(() => {
    if (params.buKey && params.buKey !== activeBu) {
      setActiveBu(params.buKey);
    }
  }, [params.buKey, activeBu, setActiveBu]);

  useEffect(() => {
    loadDetailData({
      buId: currentBuKey,
      month: filters.month,
      year: filters.year,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  }, [currentBuKey, filters.month, filters.year, filters.startDate, filters.endDate, loadDetailData]);

  const handleChangeBu = (nextBuId) => {
    navigate(preserveSearch(`/bu/${nextBuId}`));
  };

  const handleApplyDetailFilter = (newFilter) => {
    setFilters(newFilter);
  };

  const handleChangePeriod = (month, year) => {
    setFilters({ month, year, preset: "thisMonth" });
  };

  return (
    <DashboardBuDetailPage
      data={dashboardData}
      activeBu={currentBuKey}
      onChangeBu={handleChangeBu}
      selectedMonth={filters.month}
      selectedYear={filters.year}
      onChangePeriod={handleChangePeriod}
      loadingDetail={loadingDetail}
      onRefreshDetail={() =>
        loadDetailData({
          buId: currentBuKey,
          month: filters.month,
          year: filters.year,
          startDate: filters.startDate,
          endDate: filters.endDate,
          showOverlay: true,
          overlayText: "Đang làm mới chi tiết BU...",
        })
      }
      detailFilter={filters}
      onApplyDetailFilter={handleApplyDetailFilter}
    />
  );
}

function InventoryReportPageWrapper() {
  const {
    inventoryReportData,
    loadingInventory,
    loadInventoryReportData,
  } = useDashboard();

  const { filters, setFilters } = useDashboardFilters("today");

  useEffect(() => {
    loadInventoryReportData({
      month: filters.month,
      year: filters.year,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  }, [filters.month, filters.year, filters.startDate, filters.endDate, loadInventoryReportData]);

  const handleApplyFilter = (newFilter) => {
    setFilters(newFilter);
  };

  const handleChangePeriod = (month, year) => {
    setFilters({ month, year, preset: "thisMonth" });
  };

  return (
    <InventoryReportPage
      data={inventoryReportData}
      selectedMonth={filters.month}
      selectedYear={filters.year}
      onChangePeriod={handleChangePeriod}
      loadingInventory={loadingInventory}
      onRefreshInventory={() =>
        loadInventoryReportData({
          month: filters.month,
          year: filters.year,
          startDate: filters.startDate,
          endDate: filters.endDate,
          showOverlay: true,
          overlayText: "Đang làm mới báo cáo tồn kho...",
        })
      }
      inventoryFilter={filters}
      onApplyInventoryFilter={handleApplyFilter}
    />
  );
}

function ReceivableReportPageWrapper() {
  const {
    receivableReportData,
    loadingReceivable,
    loadReceivableReportData,
  } = useDashboard();

  const { filters, setFilters } = useDashboardFilters("today");

  const currentDate = filters.singleDate || filters.startDate || new Date().toISOString().slice(0, 10);

  useEffect(() => {
    loadReceivableReportData({ date: currentDate });
  }, [currentDate, loadReceivableReportData]);

  const handleChangeDate = (newDateStr) => {
    setFilters({ singleDate: newDateStr, date: newDateStr });
  };

  return (
    <ReceivableReportPage
      data={receivableReportData}
      selectedDate={currentDate}
      onChangeDate={handleChangeDate}
      loadingReceivable={loadingReceivable}
      onRefreshReceivable={() =>
        loadReceivableReportData({
          date: currentDate,
          showOverlay: true,
          overlayText: "Đang làm mới báo cáo công nợ...",
        })
      }
      receivableDates={{
        today: currentDate,
      }}
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPageWrapper />} />

      {/* Protected Dashboard Routes wrapped in DashboardLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardOverviewPageWrapper />} />
        <Route
          path="bu/:buKey"
          element={
            <ProtectedRoute requireBuAccess>
              <DashboardBuDetailPageWrapper />
            </ProtectedRoute>
          }
        />
        <Route path="inventory" element={<InventoryReportPageWrapper />} />
        <Route path="receivables" element={<ReceivableReportPageWrapper />} />
        <Route path="aging" element={<DebtAgingReportPage />} />
      </Route>

      {/* Fallback wildcard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
