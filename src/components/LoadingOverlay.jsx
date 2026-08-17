export default function LoadingOverlay({
  show = false,
  text = "Đang tải dữ liệu...",
}) {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner" />
        <div className="loading-text">{text}</div>
      </div>
    </div>
  );
}