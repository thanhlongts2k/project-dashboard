// Tick tùy chỉnh cho trục X: in đậm + tự xuống dòng (word wrap)
// để các tên dài như "Thiết bị điện cao cấp" không bị recharts ẩn/cắt.
export default function WrappedAxisTick({
  x,
  y,
  payload,
  width = 90,
  fontSize = 11,
  fill = "#5f5e5a",
}) {
  const text = String(payload?.value ?? "");
  const words = text.split(/\s+/).filter(Boolean);

  // Ước lượng số ký tự tối đa mỗi dòng theo bề rộng cho phép
  const maxChars = Math.max(6, Math.floor(width / (fontSize * 0.6)));

  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill={fill} fontSize={fontSize} fontWeight={700}>
        {lines.map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? 12 : fontSize + 2}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}
