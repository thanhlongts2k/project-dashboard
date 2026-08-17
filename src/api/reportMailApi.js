const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

/**
 * Gửi báo cáo tổng hợp (PDF) qua email — cần backend hỗ trợ endpoint:
 *   POST /api/reports/send-email/
 *   Content-Type: multipart/form-data
 *   Fields: file (PDF), file_name, from_email, to_emails (phẩy), subject, message
 */
export async function sendReportEmail({
  pdfBlob,
  fileName,
  senderEmail,
  recipients = [],
  subject,
  message,
}) {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập.");
  }

  const formData = new FormData();
  formData.append("file", pdfBlob, fileName);
  formData.append("file_name", fileName);
  if (senderEmail) formData.append("from_email", senderEmail);
  formData.append("to_emails", recipients.join(","));
  formData.append("subject", subject || "Báo cáo tổng hợp dashboard");
  formData.append("message", message || "");

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/reports/send-email/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });
  } catch {
    // fetch reject (Failed to fetch): thường do server từ chối file quá lớn
    // (nginx 413 không kèm CORS header) hoặc mất kết nối mạng.
    const sizeMb = pdfBlob?.size ? (pdfBlob.size / (1024 * 1024)).toFixed(1) : "?";
    throw new Error(
      `Không gửi được email — file PDF (${sizeMb}MB) có thể vượt giới hạn upload của server, hoặc mất kết nối mạng.`
    );
  }

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    if (response.status === 413) {
      const sizeMb = pdfBlob?.size
        ? (pdfBlob.size / (1024 * 1024)).toFixed(1)
        : "?";
      throw new Error(
        `File PDF (${sizeMb}MB) vượt giới hạn upload của server. Cần tăng client_max_body_size trên nginx.`
      );
    }

    throw new Error(
      result?.detail ||
        result?.message ||
        result?.error ||
        "Không gửi được email báo cáo (backend chưa hỗ trợ endpoint gửi mail?)."
    );
  }

  return result;
}
