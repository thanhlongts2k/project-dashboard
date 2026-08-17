import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { clearAuth, getAuthStorage, isTokenExpired } from "../utils/auth";

export const ROLES = {
  BOD: "BOD",           // Ban Lãnh Đạo: Toàn quyền truy cập 6 BU & các chỉ số tài chính nhạy cảm
  BU_HEAD: "BU_HEAD",   // Trưởng Khối / BU: Chỉ xem các BU được phân công phụ trách
  BU_STAFF: "BU_STAFF", // Nhân viên BU: Chỉ xem số liệu các đơn vị/khách hàng mình phụ trách
};

export const ALL_BU_KEYS = [
  "elevator",
  "ibizPremium",
  "ibizValue",
  "eco",
  "agritech",
  "manufacturing",
];

export const AuthContext = createContext(null);

/**
 * Helper phân giải Role & Scoping tạm thời từ username/email.
 * TODO: [Production Integration] Thay thế khối phân giải mock này bằng:
 *   1. Giải mã JWT token payload (claims: role, allowed_bus, owner_id)
 *   2. Hoặc gọi API backend GET /api/auth/me/ khi vừa load trang.
 */
function inferRoleAndPermissions(username = "") {
  const normalized = String(username).toLowerCase().trim();

  // Pattern mock mẫu để test các Role:
  // - Nếu username chứa "head_" (ví dụ: head_elevator, head_eco) -> BU_HEAD
  // - Nếu username chứa "staff" (ví dụ: staff_thangmay) -> BU_STAFF
  // - Mặc định cho tất cả tài khoản quản trị khác -> BOD
  if (normalized.includes("head_")) {
    const matchedBu = ALL_BU_KEYS.find((key) =>
      normalized.includes(key.toLowerCase())
    );
    const allowed = matchedBu ? [matchedBu] : ["elevator"];

    return {
      role: ROLES.BU_HEAD,
      allowedBUs: allowed,
      ownerId: username,
    };
  }

  if (normalized.includes("staff")) {
    return {
      role: ROLES.BU_STAFF,
      allowedBUs: ["elevator"],
      ownerId: username,
    };
  }

  // Mặc định Ban Lãnh Đạo / Admin
  return {
    role: ROLES.BOD,
    allowedBUs: ALL_BU_KEYS,
    ownerId: null,
  };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = getAuthStorage();
    if (!stored.token || isTokenExpired(stored.expiry)) {
      clearAuth();
      return {
        token: "",
        expiry: "",
        user: null,
        role: null,
        allowedBUs: [],
        ownerId: null,
      };
    }

    const { role, allowedBUs, ownerId } = inferRoleAndPermissions(
      stored.username
    );

    return {
      token: stored.token,
      expiry: stored.expiry,
      user: {
        username: stored.username || "User",
        displayName: stored.username || "User",
      },
      role,
      allowedBUs,
      ownerId,
    };
  });

  // Tự động dọn dẹp auth nếu token hết hạn khi mở lại tab
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
      role: explicitRole,
      allowedBUs: explicitAllowedBUs,
      ownerId: explicitOwnerId,
      rememberMe = true,
    }) => {
      // Lưu vào storage theo flag rememberMe
      if (rememberMe) {
        localStorage.setItem("token", token);
        localStorage.setItem("token_expiry", expiry);
        localStorage.setItem("username", username);
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("token_expiry", expiry);
        sessionStorage.setItem("username", username);
      }

      const inferred = inferRoleAndPermissions(username);
      const finalRole = explicitRole || inferred.role;
      const finalAllowedBUs =
        explicitAllowedBUs && explicitAllowedBUs.length
          ? explicitAllowedBUs
          : inferred.allowedBUs;
      const finalOwnerId =
        explicitOwnerId !== undefined ? explicitOwnerId : inferred.ownerId;

      setAuth({
        token,
        expiry,
        user: {
          username,
          displayName: username,
        },
        role: finalRole,
        allowedBUs: finalAllowedBUs,
        ownerId: finalOwnerId,
      });
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
    setAuth({
      token: "",
      expiry: "",
      user: null,
      role: null,
      allowedBUs: [],
      ownerId: null,
    });
  }, []);

  const updateUser = useCallback((userData) => {
    setAuth((prev) => ({
      ...prev,
      user: {
        ...(prev.user || {}),
        ...userData,
      },
    }));
  }, []);

  // Bộ helper kiểm tra quyền năng động
  const permissions = useMemo(() => {
    const isBOD = auth.role === ROLES.BOD;
    const isBuHead = auth.role === ROLES.BU_HEAD;
    const isStaff = auth.role === ROLES.BU_STAFF;

    return {
      isBOD,
      isBuHead,
      isStaff,
      // Kiểm tra có quyền truy cập BU cụ thể hay không
      canAccessBu: (buId) => {
        if (!buId) return false;
        if (isBOD) return true;
        return (auth.allowedBUs || []).includes(buId);
      },
      // Kiểm tra quyền xem các chỉ số tài chính nhạy cảm (Nợ ngân hàng, Dòng tiền tổng)
      canViewSensitiveMetrics: isBOD || isBuHead,
      // Quyền cấu hình Lập lịch Email
      canConfigureEmail: isBOD,
      // Quyền xuất báo cáo PDF
      canExportPdf: true,
      // Lấy BU mặc định được phép truy cập đầu tiên
      defaultAllowedBu: auth.allowedBUs?.[0] || "elevator",
    };
  }, [auth.role, auth.allowedBUs]);

  const contextValue = useMemo(
    () => ({
      token: auth.token,
      expiry: auth.expiry,
      user: auth.user,
      role: auth.role,
      allowedBUs: auth.allowedBUs,
      ownerId: auth.ownerId,
      isAuthenticated: Boolean(auth.token),
      login,
      logout,
      updateUser,
      ...permissions,
    }),
    [auth, permissions, login, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
