import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Component bảo vệ các Route yêu cầu xác thực và phân quyền.
 *
 * @param {React.ReactNode} children - Component con được render khi thỏa mãn điều kiện
 * @param {string} [requiredRole] - Role bắt buộc (ví dụ: "BOD", "BU_HEAD")
 * @param {boolean} [requireBuAccess=false] - Nếu true, kiểm tra quyền truy cập params.buKey của người dùng
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  requireBuAccess = false,
}) {
  const { isAuthenticated, role, canAccessBu, defaultAllowedBu, isBOD } =
    useAuth();
  const location = useLocation();
  const params = useParams();

  // 1. Nếu chưa đăng nhập -> chuyển hướng về /login, lưu lại trang hiện tại để redirect sau khi login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Nếu route yêu cầu Role cụ thể mà người dùng không đủ quyền (BOD luôn có toàn quyền)
  if (requiredRole && role !== requiredRole && !isBOD) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Nếu route yêu cầu quyền truy cập BU (/bu/:buKey)
  if (requireBuAccess && params.buKey) {
    if (!canAccessBu(params.buKey)) {
      const fallbackBu = defaultAllowedBu || "elevator";
      return <Navigate to={`/bu/${fallbackBu}`} replace />;
    }
  }

  return children;
}
