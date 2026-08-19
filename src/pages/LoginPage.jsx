import { useState, useEffect, useCallback } from "react";
import "../styles/login.css";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "407408718192.apps.googleusercontent.com";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // --- Google login handler ---
  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      const idToken = response?.credential;
      if (!idToken) {
        setErrorMessage("Không nhận được token từ Google.");
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const res = await fetch(`${API_BASE}/api/google-login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken }),
        });

        let result = null;
        try {
          result = await res.json();
        } catch {
          result = null;
        }

        if (!res.ok) {
          throw new Error(
            result?.detail ||
              result?.message ||
              result?.error ||
              "Đăng nhập Google thất bại."
          );
        }

        if (!result?.token) {
          throw new Error("API không trả về token.");
        }

        // Extract display name from JWT payload (best-effort, UTF-8 safe)
        let displayName = "Google User";
        try {
          const base64 = idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
          const jsonStr = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonStr);
          displayName = payload.name || payload.email || "Google User";
        } catch {
          /* ignore parse errors */
        }

        // Persist auth
        if (rememberMe) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("token_expiry", result.expiry || "");
          localStorage.setItem("username", displayName);
        } else {
          sessionStorage.setItem("token", result.token);
          sessionStorage.setItem("token_expiry", result.expiry || "");
          sessionStorage.setItem("username", displayName);
        }

        const finalDisplayName = result?.user?.full_name || displayName;

        onLoginSuccess?.({
          token: result.token,
          expiry: result.expiry || "",
          username: finalDisplayName,
          user: result.user,
          rememberMe,
        });
      } catch (error) {
        console.error("Google login error:", error);
        setErrorMessage(error.message || "Đăng nhập Google thất bại.");
      } finally {
        setLoading(false);
        setGoogleLoading(false);
      }
    },
    [onLoginSuccess, rememberMe]
  );

  // --- Initialize Google GSI (chỉ initialize, không renderButton) ---
  useEffect(() => {
    const initGsi = () => {
      if (!window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
      });
      return true;
    };

    if (initGsi()) return;
    const interval = setInterval(() => {
      if (initGsi()) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [handleGoogleCredentialResponse]);

  // --- Trigger Google popup khi bấm nút custom ---
  const handleGoogleBtnClick = useCallback(() => {
    if (!window.google?.accounts?.id) {
      setErrorMessage("Google Sign-In chưa sẵn sàng, thử lại sau.");
      return;
    }
    setGoogleLoading(true);
    setErrorMessage("");
    window.google.accounts.id.prompt((notification) => {
      // Nếu One Tap bị dismiss/skip thì tắt loading
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment() ||
        notification.isDismissedMoment()
      ) {
        setGoogleLoading(false);
      }
    });
  }, []);

  // --- Username/password login handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ username và mật khẩu.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      let result = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            result?.message ||
            result?.error ||
            "Đăng nhập thất bại."
        );
      }

      if (!result?.token) {
        throw new Error("API không trả về token.");
      }

      if (rememberMe) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("token_expiry", result.expiry || "");
        localStorage.setItem("username", username.trim());
      } else {
        sessionStorage.setItem("token", result.token);
        sessionStorage.setItem("token_expiry", result.expiry || "");
        sessionStorage.setItem("username", username.trim());
      }

      const finalDisplayName = result?.user?.full_name || username.trim();

      onLoginSuccess?.({
        token: result.token,
        expiry: result.expiry || "",
        username: finalDisplayName,
        user: result.user,
        rememberMe,
      });
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page simple-login">
      <div className="login-bg login-bg-1" />
      <div className="login-bg login-bg-2" />
      <div className="login-bg login-bg-3" />

      <div className="login-shell single">
        <div className="login-left compact">
          <div className="login-brand compact-brand">
            <div className="login-logo">HP</div>
            <div>
              <div className="login-brand-sub">Internal Workspace</div>
              <h1 className="login-title small">Đăng nhập hệ thống</h1>
            </div>
          </div>

          {/* --- Google Sign-In --- */}
          <div className="google-login-section">
            <button
              type="button"
              className="google-custom-btn"
              onClick={handleGoogleBtnClick}
              disabled={loading || googleLoading}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>{googleLoading ? "Đang xử lý..." : "Đăng nhập bằng Google"}</span>
            </button>
          </div>

          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">hoặc đăng nhập bằng tài khoản</span>
            <span className="login-divider-line" />
          </div>

          {/* --- Username / Password Form --- */}
          <form className="login-form compact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label>Mật khẩu</label>
                <button
                  type="button"
                  className="link-text"
                  onClick={() =>
                    setErrorMessage("Chưa cấu hình chức năng quên mật khẩu.")
                  }
                >
                  Quên mật khẩu?
                </button>
              </div>

              <div className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="show-pass-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            </div>

            {errorMessage ? (
              <div
                style={{
                  fontSize: "13px",
                  color: "#a32d2d",
                  background: "#fcebeb",
                  border: "1px solid #f2caca",
                  borderRadius: "12px",
                  padding: "10px 12px",
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}