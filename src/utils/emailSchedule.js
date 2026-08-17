const STORAGE_KEY = "report_email_config";

export const DEFAULT_EMAIL_CONFIG = {
  enabled: false,
  senderEmail: "",
  recipients: "", // "a@x.com, b@y.com"
  frequency: "daily", // daily | weekly | monthly
  weeklyDay: 1, // 0 = Chủ nhật ... 6 = Thứ 7
  monthlyDay: 1, // 1..28
  sendTime: "08:00",
  lastSentPeriod: "", // khóa kỳ đã gửi tự động gần nhất
};

export function getEmailConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EMAIL_CONFIG };
    return { ...DEFAULT_EMAIL_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_EMAIL_CONFIG };
  }
}

export function saveEmailConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function parseRecipients(text) {
  return String(text || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter((item) => /\S+@\S+\.\S+/.test(item));
}

// Khóa kỳ gửi hiện tại: daily/weekly → theo ngày, monthly → theo tháng
export function currentPeriodKey(config, now = new Date()) {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  if (config.frequency === "monthly") return `${yyyy}-${mm}`;
  return `${yyyy}-${mm}-${dd}`;
}

export function isAutoSendDue(config, now = new Date()) {
  if (!config?.enabled) return false;
  if (!parseRecipients(config.recipients).length) return false;

  const [hh, mi] = String(config.sendTime || "08:00").split(":").map(Number);
  const sendMinutes = (hh || 0) * 60 + (mi || 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes < sendMinutes) return false;

  if (config.frequency === "weekly" && now.getDay() !== Number(config.weeklyDay)) {
    return false;
  }

  if (
    config.frequency === "monthly" &&
    now.getDate() !== Number(config.monthlyDay)
  ) {
    return false;
  }

  return currentPeriodKey(config, now) !== config.lastSentPeriod;
}

// Đánh dấu kỳ hiện tại đã gửi (gọi ngay khi bắt đầu gửi tự động để tránh gửi lặp)
export function markAutoSent(config, now = new Date()) {
  const next = { ...config, lastSentPeriod: currentPeriodKey(config, now) };
  saveEmailConfig(next);
  return next;
}
