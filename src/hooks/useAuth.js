import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Hook tiện ích để truy cập state Auth, Role và Permissions từ bất kỳ component nào.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong <AuthProvider />");
  }

  return context;
}

export default useAuth;
