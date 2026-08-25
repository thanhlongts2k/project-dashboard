import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../context/DashboardContext";
import { useDashboardFilters, getDefaultReportingDate, formatIsoDate } from "../hooks/useDashboardFilters";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

import LoginPage from "../pages/LoginPage";
import DashboardOverviewPage from "../pages/DashboardOverviewPage";
import DashboardBuDetailPage from "../pages/DashboardBuDetailPage";
import InventoryReportPage from "../pages/InventoryReportPage";
import ReceivableReportPage from "../pages/ReceivableReportPage";
import DebtAgingReportPage from "../pages/DebtAgingReportPage";
import { buIdFromCode } from "../utils/detailMapper";

function LoginPageWrapper() {
  const { login, isAuthenticated, firstAllowedPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || firstAllowedPath || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(firstAllowedPath || "/dashboard", { replace: true });
    }
  }, [isAuthenticated, firstAllowedPath, navigate]);

  const handleSuccess = (authData) => {
    login(authData);
    navigate(from, { replace: true });
  };

  return <LoginPage onLoginSuccess={handleSuccess} />;
}

function IndexRedirect() {
  const { firstAllowedPath } = useAuth();
  return <Navigate to={firstAllowedPath || "/dashboard"} replace />;
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
  const { defaultAllowedBu } = useAuth();
  const {
    activeBu,
    setActiveBu,
    dashboardData,
    loadingDetail,
    loadDetailData,
  } = useDashboard();

  const { filters, setFilters, preserveSearch } = useDashboardFilters("thisMonth");
  const rawKey = params.buKey || activeBu || defaultAllowedBu || "elevator";
  const currentBuKey = buIdFromCode(rawKey) || rawKey || "elevator";

  useEffect(() => {
    if (params.buKey && params.buKey !== activeBu) {
      setActiveBu(currentBuKey);
    }
  }, [params.buKey, activeBu, currentBuKey, setActiveBu]);

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

  const currentDate =
    filters.singleDate ||
    filters.startDate ||
    formatIsoDate(getDefaultReportingDate());

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
      selectedBu={filters.buId || filters.bu || "all"}
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
        <Route index element={<IndexRedirect />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredTab="dashboard">
              <DashboardOverviewPageWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="bu/:buKey"
          element={
            <ProtectedRoute requiredTab="bu_detail" requireBuAccess>
              <DashboardBuDetailPageWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <ProtectedRoute requiredTab="inventory">
              <InventoryReportPageWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="receivables"
          element={
            <ProtectedRoute requiredTab="debt_collection">
              <ReceivableReportPageWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="aging"
          element={
            <ProtectedRoute requiredTab="aging">
              <DebtAgingReportPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback wildcard */}
      <Route path="*" element={<IndexRedirect />} />
    </Routes>
  );
}
