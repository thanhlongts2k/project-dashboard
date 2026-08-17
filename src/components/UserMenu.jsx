import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import EmailConfigModal from "./EmailConfigModal";

export default function UserMenu({ currentUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const [emailConfigOpen, setEmailConfigOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = currentUser || "User";
  const avatar = displayName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className={`user-menu-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="user-avatar">{avatar}</span>

        <div className="user-meta">
          <div className="user-greet">Xin chào</div>
          <div className="user-name">{displayName}</div>
        </div>

        <span className="user-menu-caret">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-head">
            <div className="user-menu-head-name">{displayName}</div>
            <div className="user-menu-head-sub">Tài khoản đang đăng nhập</div>
          </div>

          <button
            type="button"
            className="user-menu-item"
            onClick={() => {
              toast("Chưa cấu hình trang hồ sơ.");
              setOpen(false);
            }}
          >
            Hồ sơ
          </button>

          <button
            type="button"
            className="user-menu-item"
            onClick={() => {
              toast("Chưa cấu hình chức năng đổi mật khẩu.");
              setOpen(false);
            }}
          >
            Đổi mật khẩu
          </button>

          <button
            type="button"
            className="user-menu-item"
            onClick={() => {
              setOpen(false);
              setEmailConfigOpen(true);
            }}
          >
            Cấu hình gửi báo cáo
          </button>

          <div className="user-menu-divider" />

          <button
            type="button"
            className="user-menu-item danger"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}

      <EmailConfigModal
        open={emailConfigOpen}
        onClose={() => setEmailConfigOpen(false)}
      />
    </div>
  );
}