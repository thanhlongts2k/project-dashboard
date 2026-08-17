import { useAuth } from "../../hooks/useAuth";

/**
 * Component kiểm tra và phân quyền hiển thị UI (RBAC Guard).
 *
 * @param {string} [perform] - Tên hành động / quyền: "VIEW_SENSITIVE", "CONFIGURE_EMAIL", "EXPORT_PDF", "ACCESS_BU"
 * @param {string|string[]} [role] - Role hoặc mảng Roles cho phép (ví dụ: "BOD", ["BOD", "BU_HEAD"])
 * @param {string} [buId] - Mã BU cần kiểm tra quyền nếu perform="ACCESS_BU"
 * @param {React.ReactNode} [fallback=null] - Phần tử render khi không đủ quyền
 * @param {React.ReactNode} children - Nội dung render khi đủ quyền
 */
export default function Can({
  perform,
  role: requiredRole,
  buId,
  fallback = null,
  children,
}) {
  const {
    role,
    isBOD,
    canViewSensitiveMetrics,
    canConfigureEmail,
    canExportPdf,
    canAccessBu,
  } = useAuth();

  // 1. Kiểm tra theo role cụ thể nếu có
  if (requiredRole) {
    const rolesArray = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    if (!rolesArray.includes(role) && !isBOD) {
      return fallback;
    }
  }

  // 2. Kiểm tra theo quyền / hành vi thực hiện
  if (perform) {
    switch (perform) {
      case "VIEW_SENSITIVE":
        if (!canViewSensitiveMetrics) return fallback;
        break;
      case "CONFIGURE_EMAIL":
        if (!canConfigureEmail) return fallback;
        break;
      case "EXPORT_PDF":
        if (!canExportPdf) return fallback;
        break;
      case "ACCESS_BU":
        if (buId && !canAccessBu(buId)) return fallback;
        break;
      default:
        break;
    }
  }

  return children;
}
