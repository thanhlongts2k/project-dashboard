import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN = 6;

async function captureElement(element, { scale = 2 } = {}) {
  return html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: "#f5f3ee",
    windowWidth: element.scrollWidth,
    scrollX: 0,
    scrollY: 0,
  });
}

function addCanvasToPdf(pdf, canvas, isFirstPage, { quality = 0.92 } = {}) {
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/jpeg", quality);

  if (!isFirstPage) {
    pdf.addPage();
  }

  let heightLeft = imgHeight;
  let position = MARGIN;

  pdf.addImage(imgData, "JPEG", MARGIN, position, contentWidth, imgHeight);
  heightLeft -= PAGE_HEIGHT - MARGIN * 2;

  while (heightLeft > 0) {
    position -= PAGE_HEIGHT - MARGIN * 2;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", MARGIN, position, contentWidth, imgHeight);
    heightLeft -= PAGE_HEIGHT - MARGIN * 2;
  }
}

/**
 * Chụp 1 element DOM và tải về thành file PDF (A4 dọc, tự chia nhiều trang).
 */
export async function exportElementToPdf(element, fileName = "bao-cao.pdf") {
  if (!element) {
    throw new Error("Không tìm thấy nội dung để xuất PDF.");
  }

  const canvas = await captureElement(element);
  const pdf = new jsPDF("p", "mm", "a4");
  addCanvasToPdf(pdf, canvas, true);
  pdf.save(fileName);
}

/**
 * Xuất tổng hợp: chụp lần lượt nhiều báo cáo vào 1 file PDF duy nhất.
 * `sections` là mảng { label, prepare }:
 *  - prepare(): async — chuyển app sang view tương ứng, đợi data render,
 *    trả về element DOM cần chụp (hoặc null để bỏ qua section đó).
 * `onProgress(label, index, total)` để hiển thị tiến độ.
 */
export async function exportSectionsToPdf(
  sections = [],
  fileName = "bao-cao-tong-hop.pdf",
  onProgress = null,
  options = {}
) {
  const { output = "save" } = options;

  // Khi xuất blob để gửi email: giảm scale/quality để file nhẹ,
  // tránh vượt giới hạn upload của server (nginx ~1MB).
  const isBlob = output === "blob";
  const captureOpts = isBlob ? { scale: 1.25 } : {};
  const imageOpts = isBlob ? { quality: 0.72 } : {};

  const pdf = new jsPDF("p", "mm", "a4");
  let pageCount = 0;

  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    onProgress?.(section.label, i, sections.length);

    const element = await section.prepare();
    if (!element) continue;

    const canvas = await captureElement(element, captureOpts);
    addCanvasToPdf(pdf, canvas, pageCount === 0, imageOpts);
    pageCount += 1;
  }

  if (pageCount === 0) {
    throw new Error("Không có nội dung nào để xuất PDF.");
  }

  if (output === "blob") {
    return pdf.output("blob");
  }

  pdf.save(fileName);
  return null;
}

export function buildPdfFileName(prefix, rangeLabel = "") {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const rangePart = String(rangeLabel || "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "");

  return [prefix, rangePart, `${yyyy}${mm}${dd}`]
    .filter(Boolean)
    .join("_") + ".pdf";
}

/** Đợi 2 frame render + thêm 1 khoảng nghỉ cho chart vẽ xong. */
export function waitForRender(extraMs = 400) {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, extraMs);
      });
    });
  });
}
