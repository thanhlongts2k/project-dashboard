import { useEffect } from "react";

/**
 * useBodyScrollLock
 *
 * Khoá cuộn nền trang khi modal/drawer đang mở.
 * - Khi `isLocked = true`: Body không cuộn được, iOS không kéo được.
 * - Khi `isLocked = false` hoặc component unmount: Trả lại trạng thái bình thường.
 *
 * @param {boolean} isLocked - true = khoá, false = mở
 */
export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    // Lưu lại trạng thái hiện tại để khôi phục
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    const prevPosition = document.body.style.position;
    const scrollY = window.scrollY;

    // Khoá cuộn: iOS Safari yêu cầu position fixed + top để giữ nguyên vị trí cuộn
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    // Chỉ cần overflow hidden là đủ cho hầu hết trường hợp
    // iOS Safari: set position fixed giữ vị trí cuộn không bị nhảy lên đầu
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      // Khôi phục toàn bộ styles
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
      document.body.style.position = prevPosition;
      document.body.style.top = "";
      document.body.style.width = "";
      // Khôi phục vị trí cuộn cho iOS Safari
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
