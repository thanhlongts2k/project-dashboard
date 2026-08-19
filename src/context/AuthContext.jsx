import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { clearAuth, getAuthStorage, isTokenExpired } from "../utils/auth";

export const ROLES = {
  BOD: "BOD_ADMIN",
  BOD_ADMIN: "BOD_ADMIN",
  BU_HEAD: "BU_HEAD",
  SALES: "SALES",
  BU_STAFF: "SALES",
  VIEWER: "VIEWER",
};

export const ALL_BU_KEYS = [
  "elevator",
  "ibizPremium",
  "ibizValue",
  "eco",
  "agritech",
  "manufacturing",
  "dtct",
  "oversea",
];

export const DEFAULT_ROLE_TABS = {
  BOD_ADMIN: ["dashboard", "bu_detail", "inventory", "debt_collection", "aging"],
  BU_HEAD: ["bu_detail", "inventory", "debt_collection", "aging"],
  SALES: ["aging"],
  VIEWER: ["aging"],
};

export function normalizeRole(role) {
  const r = String(role || "").toUpperCase();
  if (r === "BOD" || r === "BOD_ADMIN") return "BOD_ADMIN";
  if (r === "BU_HEAD") return "BU_HEAD";
  if (r === "SALES" || r === "BU_STAFF" || r === "STAFF") return "SALES";
  if (r === "VIEWER") return "VIEWER";
  return "VIEWER";
}

export function mapBuCodeToFrontendKey(code = "") {
  if (!code) return "elevator";
  const raw = String(code).trim().toLowerCase();

  if (raw.includes("elevator") || raw.includes("thang máy")) return "elevator";
  if (raw.includes("premium")) return "ibizPremium";
  if (raw.includes("value")) return "ibizValue";
  if (raw.includes("agritech") && !raw.includes("eco")) return "agritech";
  if (raw.includes("eco") || raw.includes("agritech")) return "eco";
  if (raw.includes("manufacturing") || raw.includes("sản xuất") || raw.includes("nhà máy")) return "manufacturing";
  if (raw.includes("dtct") || raw.includes("đtct") || raw.includes("cho thuê") || raw.includes("đối tác")) return "dtct";
  if (raw.includes("oversea") || raw.includes("campuchia")) return "oversea";
  return raw;
}

export function getFirstAllowedPath(allowedTabs = [], buKey = "elevator") {
  const safeBuKey = buKey || "elevator";
  if (allowedTabs.includes("dashboard")) return "/dashboard";
  if (allowedTabs.includes("bu_detail")) return `/bu/${safeBuKey}`;
  if (allowedTabs.includes("inventory")) return "/inventory";
  if (allowedTabs.includes("debt_collection")) return "/receivables";
  if (allowedTabs.includes("aging")) return "/aging";
  return "/aging";
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const AuthContext = createContext(null);

function loadSavedUser() {
  try {
    const raw = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = getAuthStorage();
    if (!stored.token || isTokenExpired(stored.expiry)) {
      clearAuth();
      try {
        localStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_user");
      } catch {}
      return {
        token: "",
        expiry: "",
        user: null,
      };
    }

    const savedUser = loadSavedUser();
    const fallbackDisplayName = stored.username || "User";

    return {
      token: stored.token,
      expiry: stored.expiry,
      user: savedUser || {
        username: fallbackDisplayName,
        full_name: fallbackDisplayName,
        role: "BOD_ADMIN",
        allowed_tabs: DEFAULT_ROLE_TABS.BOD_ADMIN,
      },
    };
  });

  // Tự động fetch profile chi tiết từ /api/auth/me/ khi có Token
  useEffect(() => {
    if (!auth.token || isTokenExpired(auth.expiry)) return;

    let isMounted = true;

    async function fetchUserProfile() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
          headers: {
            Authorization: `Token ${auth.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.user && isMounted) {
            const enrichedUser = {
              ...data.user,
              displayName: data.user.full_name || data.user.username,
            };
            setAuth((prev) => ({
              ...prev,
              user: enrichedUser,
            }));
            try {
              if (localStorage.getItem("token")) {
                localStorage.setItem("auth_user", JSON.stringify(enrichedUser));
              } else {
                sessionStorage.setItem("auth_user", JSON.stringify(enrichedUser));
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn("Could not refresh user profile from /api/auth/me/:", err);
      }
    }

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [auth.token, auth.expiry]);

  // Tự động logout nếu token hết hạn
  useEffect(() => {
    if (auth.token && isTokenExpired(auth.expiry)) {
      logout();
    }
  }, [auth.token, auth.expiry]);

  const login = useCallback(
    ({
      token,
      expiry = "",
      username = "User",
      user: rawUser,
      rememberMe = true,
    }) => {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", token);
      storage.setItem("token_expiry", expiry);
      storage.setItem("username", username);

      const resolvedRole = normalizeRole(rawUser?.role || rawUser?.primary_role || "BOD_ADMIN");
      const resolvedTabs = rawUser?.allowed_tabs || DEFAULT_ROLE_TABS[resolvedRole] || ["aging"];

      const fullUser = {
        ...(rawUser || {}),
        username: username || rawUser?.username,
        full_name: rawUser?.full_name || username,
        displayName: rawUser?.full_name || username,
        role: resolvedRole,
        allowed_tabs: resolvedTabs,
      };

      try {
        storage.setItem("auth_user", JSON.stringify(fullUser));
      } catch {}

      setAuth({
        token,
        expiry,
        user: fullUser,
      });
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
    try {
      localStorage.removeItem("auth_user");
      sessionStorage.removeItem("auth_user");
    } catch {}
    setAuth({
      token: "",
      expiry: "",
      user: null,
    });
  }, []);

  const updateUser = useCallback((userData) => {
    setAuth((prev) => {
      const updatedUser = {
        ...(prev.user || {}),
        ...userData,
      };
      try {
        if (localStorage.getItem("token")) {
          localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem("auth_user", JSON.stringify(updatedUser));
        }
      } catch {}
      return {
        ...prev,
        user: updatedUser,
      };
    });
  }, []);

  // Quick Role Switcher (Chỉ hoạt động trong môi trường Development)
  const switchRole = useCallback((newRole, options = {}) => {
    const norm = normalizeRole(newRole);
    let allowedTabs = DEFAULT_ROLE_TABS[norm] || ["aging"];
    let buCode = "BU_ELEVATOR";
    let buName = "Thang máy";
    let displayName = "Ban Giám Đốc (BOD)";

    if (norm === "BU_HEAD") {
      displayName = "Mr. Đào Tiến Dũng (BU_HEAD)";
      buCode = options.buCode || "BU_ELEVATOR";
      buName = options.buName || "Thang máy";
    } else if (norm === "SALES") {
      displayName = "Lê Văn Tín (SALES)";
      buCode = options.buCode || "BU_ELEVATOR";
      buName = options.buName || "Thang máy";
    } else if (norm === "VIEWER") {
      displayName = "Nhân viên nghiệp vụ (VIEWER)";
    }

    const updatedUser = {
      username: displayName,
      full_name: displayName,
      displayName,
      role: norm,
      primary_role: norm,
      bu_code: buCode,
      bu_name: buName,
      employee_code: options.employeeCode || (norm === "SALES" ? "2000593" : norm === "BU_HEAD" ? "2000807" : null),
      allowed_tabs: allowedTabs,
    };

    updateUser(updatedUser);
  }, [updateUser]);

  // Tính toán các cờ quyền hạn năng động (Dynamic RBAC & Multi-BU Scope)
  const permissions = useMemo(() => {
    const userRole = normalizeRole(auth.user?.primary_role || auth.user?.role || "BOD_ADMIN");
    const isBOD = userRole === "BOD_ADMIN" || Boolean(auth.user?.is_superuser);
    const isBuHead = userRole === "BU_HEAD";
    const isSales = userRole === "SALES";
    const isViewer = userRole === "VIEWER";

    const allowedTabs = auth.user?.allowed_tabs || DEFAULT_ROLE_TABS[userRole] || ["aging"];
    const userBuCode = auth.user?.bu_code || null;
    const userBuName = auth.user?.bu_name || null;
    const employeeCode = auth.user?.employee_code || null;

    const managedBus = Array.isArray(auth.user?.managed_bus) ? auth.user.managed_bus : [];
    const assignedBus = Array.isArray(auth.user?.assigned_bus) ? auth.user.assigned_bus : [];
    const assignments = Array.isArray(auth.user?.assignments) ? auth.user.assignments : [];

    // Danh sách frontend keys của các BU mà nhân sự được phép truy cập
    let allowedBUs = ALL_BU_KEYS;
    if (!isBOD) {
      if (assignedBus.length > 0) {
        const mapped = assignedBus.map((code) => mapBuCodeToFrontendKey(code)).filter(Boolean);
        allowedBUs = Array.from(new Set(mapped));
      } else if (userBuCode) {
        allowedBUs = [mapBuCodeToFrontendKey(userBuCode)];
      } else {
        allowedBUs = ["elevator"];
      }
    }

    const defaultAllowedBu = allowedBUs[0] || "elevator";
    const firstAllowedPath = getFirstAllowedPath(allowedTabs, defaultAllowedBu);

    // Xác định vai trò cụ thể của nhân sự trong BU đang chọn
    const getRoleInCurrentBu = (buCodeOrKey) => {
      if (isBOD) return "BOD_ADMIN";
      if (!buCodeOrKey) return userRole;

      const fKey = mapBuCodeToFrontendKey(buCodeOrKey);
      const cleanInput = String(buCodeOrKey).trim().toUpperCase();

      // 1. Kiểm tra xem có phải là Trưởng BU của BU này không
      const isManaged = managedBus.some((b) => {
        const bKey = mapBuCodeToFrontendKey(b);
        return bKey === fKey || b.toUpperCase() === cleanInput;
      });
      if (isManaged) return "BU_HEAD";

      // 2. Tra cứu trong danh sách chi tiết các phân công (assignments)
      const matchedAssignment = assignments.find((a) => {
        const aKey = a.frontend_key || mapBuCodeToFrontendKey(a.bu_code);
        return aKey === fKey || (a.bu_code && a.bu_code.toUpperCase() === cleanInput);
      });
      if (matchedAssignment && matchedAssignment.role) {
        return normalizeRole(matchedAssignment.role);
      }

      // 3. Fallback theo primary role nếu khớp primary BU
      if (userBuCode && mapBuCodeToFrontendKey(userBuCode) === fKey) {
        return userRole;
      }

      return "VIEWER";
    };

    return {
      role: userRole,
      userRole,
      primaryRole: userRole,
      isBOD,
      isBuHead,
      isSales,
      isViewer,
      allowedTabs,
      allowedBUs,
      managedBus,
      assignedBus,
      assignments,
      userBuCode,
      userBuName,
      employeeCode,
      defaultAllowedBu,
      firstAllowedPath,
      getRoleInCurrentBu,
      isBuHeadInBu: (bu) => getRoleInCurrentBu(bu) === "BU_HEAD",
      isSalesInBu: (bu) => getRoleInCurrentBu(bu) === "SALES",
      canAccessTab: (tabKey) => allowedTabs.includes(tabKey),
      canAccessBu: (buId) => {
        if (!buId) return false;
        if (isBOD) return true;
        const normalized = mapBuCodeToFrontendKey(buId);
        return allowedBUs.includes(normalized) || allowedBUs.includes(buId);
      },
      canViewSensitiveMetrics: isBOD || isBuHead,
      canConfigureEmail: isBOD,
      canExportPdf: true,
    };
  }, [auth.user]);

  const contextValue = useMemo(
    () => ({
      token: auth.token,
      expiry: auth.expiry,
      user: auth.user,
      isAuthenticated: Boolean(auth.token),
      login,
      logout,
      updateUser,
      switchRole,
      ...permissions,
    }),
    [auth.token, auth.expiry, auth.user, login, logout, updateUser, switchRole, permissions]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
