import { useState, useEffect, useCallback, useRef } from "react";
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
  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnContainerRef = useRef(null);

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

  // --- Initialize Google GSI & Render Standard Popup Button ---
  useEffect(() => {
    const initGsi = () => {
      if (!window.google?.accounts?.id) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          use_fedcm_for_prompt: false,
          ux_mode: "popup",
          context: "signin",
        });

        // Trước tiên gọi setGsiReady để React render container hiện lên
        // Sau đó dùng setTimeout 0 để đợi DOM cập nhật rồi mới renderButton
        setGsiReady(true);
        setTimeout(() => {
          const container = document.getElementById("google-signin-btn-container");
          if (!container) return;
          // Dọn sạch trước khi render để tránh nhân đôi (hot reload / StrictMode)
          container.innerHTML = "";
          // Đo chiều rộng thực tế của form card để nút khớp 100%
          const formCard = container.closest(".login-left") || container;
          const cardWidth = formCard.offsetWidth || Math.min(window.innerWidth - 48, 420);
          // Trừ padding 2 bên (28px * 2) để nút khớp với ô input bên dưới
          const btnWidth = Math.max(cardWidth - 56, 240);
          try {
            window.google.accounts.id.renderButton(container, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "signin_with",
              shape: "pill",
              logo_alignment: "left",
              width: btnWidth,
            });
          } catch (renderErr) {
            console.warn("GSI renderButton error:", renderErr);
          }
        }, 0);

        return true;
      } catch (err) {
        console.warn("GSI init error:", err);
        return false;
      }
    };

    if (initGsi()) return;
    const interval = setInterval(() => {
      if (initGsi()) clearInterval(interval);
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [handleGoogleCredentialResponse]);

  // --- Trigger Google popup fallback khi bấm nút custom ---
  const handleGoogleBtnClick = useCallback(() => {
    if (!window.google?.accounts?.id) {
      setErrorMessage(
        "Google Sign-In chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng hoặc Authorized JavaScript Origins trên Google Console."
      );
      return;
    }
    setGoogleLoading(true);
    setErrorMessage("");
    try {
      window.google.accounts.id.prompt((notification) => {
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment()
        ) {
          setGoogleLoading(false);
        }
      });
    } catch (err) {
      console.warn("Google prompt error:", err);
      setGoogleLoading(false);
      setErrorMessage("Không thể kích hoạt cửa sổ Google tự động. Vui lòng nhấp vào nút đăng nhập Google.");
    }
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
            <img
              src="/HPC-Icon.png"
              alt="HPC Logo"
              className="login-header-icon"
              style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 10 }}
            />
            <div>
              <div className="login-brand-sub">Internal Workspace</div>
              <h1 className="login-title small">Đăng nhập hệ thống</h1>
            </div>
          </div>

          {/* --- Google Sign-In --- */}
          <div className="google-login-section">
            {/*
              QUAN TRỌNG: Chỉ render DUY NHẤT 1 nút tại một thời điểm.
              - Nếu GSI đã sẵn sàng (gsiReady): Chỉ hiện iframe Google qua renderButton.
              - Nếu GSI chưa tải: Hiện nút fallback tùy chỉnh.
              Container google-btn-wrapper đã bị XÓA vì viền CSS của nó
              tạo ra "nút thứ 2" giả mạo đè lên iframe Google.
            */}
            {gsiReady ? (
              /* Iframe Google chính hãng — không cần wrapper thêm viền */
              <div
                id="google-signin-btn-container"
                ref={googleBtnContainerRef}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: "44px",
                }}
              />
            ) : (
              /* Nút fallback — chỉ hiện khi Google SDK chưa tải xong */
              <>
                {/* Container ẩn để renderButton có thể mount sau này */}
                <div
                  id="google-signin-btn-container"
                  ref={googleBtnContainerRef}
                  style={{ display: "none" }}
                />
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
              </>
            )}
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