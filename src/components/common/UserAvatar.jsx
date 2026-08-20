import { useState } from "react";

/**
 * Component hiển thị Avatar người dùng thông minh (Smart User Avatar)
 * - Tự động tải ảnh đại diện từ Google Profile nếu có.
 * - Sử dụng `referrerPolicy="no-referrer"` để chống bị Google CDN chặn tải ảnh.
 * - Tự động fallback về chữ cái đầu của tên người dùng nếu không có ảnh hoặc khi ảnh tải bị lỗi (onError).
 */
export default function UserAvatar({
  src = "",
  name = "User",
  size = 24,
  fontSize = 11,
  className = "",
  style = {},
}) {
  const [imgError, setImgError] = useState(false);

  const fallbackLetter = (name || "U").trim().charAt(0).toUpperCase() || "U";
  const hasValidImage = Boolean(src && !imgError);

  if (hasValidImage) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`user-avatar-img ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: "50%",
          objectFit: "cover",
          display: "inline-block",
          verticalAlign: "middle",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          ...style,
        }}
      />
    );
  }

  return (
    <span
      className={`user-avatar ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        fontSize,
        borderRadius: "50%",
        background: "#185fa5",
        color: "#ffffff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        lineHeight: 1,
        userSelect: "none",
        verticalAlign: "middle",
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        ...style,
      }}
    >
      {fallbackLetter}
    </span>
  );
}
