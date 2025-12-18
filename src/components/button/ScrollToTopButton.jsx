import { useEffect, useState, useCallback, useMemo } from "react";
import { AiOutlineArrowUp } from "react-icons/ai";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(60);

  // ✅ useCallback으로 스크롤 핸들러 메모이제이션
  const handleScroll = useCallback(() => {
    const scrollArea = document.getElementById("scrollArea");
    if (!scrollArea) return;

    setIsVisible(scrollArea.scrollTop > 1);
    setBottomOffset(60);
  }, []);

  // ✅ 스크롤 이벤트 리스너 + 쓰로틀링/디바운싱
  useEffect(() => {
    const scrollArea = document.getElementById("scrollArea");
    if (!scrollArea) return;

    // ✅ 쓰로틀링: 성능 최적화 (100ms마다 한 번만 실행)
    let ticking = false;

    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollArea.addEventListener("scroll", throttledHandleScroll, { passive: true });

    // 초기 상태 설정
    handleScroll();

    return () => scrollArea.removeEventListener("scroll", throttledHandleScroll);
  }, [handleScroll]);

  // ✅ useCallback으로 scrollToTop 함수 메모이제이션
  const scrollToTop = useCallback(() => {
    const scrollArea = document.getElementById("scrollArea");
    if (!scrollArea) return;

    scrollArea.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // ✅ useMemo로 클래스명 계산 메모이제이션
  const buttonClassName = useMemo(() =>
      `fixed right-15 z-9999 w-16 h-16 rounded-full
        bg-linear-to-br from-blue-500 via-blue-600 to-blue-700
        hover:from-blue-600 hover:via-blue-700 hover:to-blue-800
        flex items-center justify-center shadow-2xl transition-all duration-300 
        active:scale-95 border border-white/10
        dark:from-blue-600 dark:via-blue-700 dark:to-blue-800
        ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`,
    [isVisible]
  );

  // ✅ useMemo로 스타일 객체 메모이제이션
  const buttonStyle = useMemo(() => ({
    bottom: bottomOffset + 5
  }), [bottomOffset]);

  return (
    <button
      onClick={scrollToTop}
      className={buttonClassName}
      style={buttonStyle}
      aria-label="맨 위로 이동" // ✅ 접근성
      aria-hidden={!isVisible} // ✅ 접근성: 보이지 않을 때 숨김
    >
      <AiOutlineArrowUp
        size={28}
        className="text-white"
        aria-hidden="true" // ✅ 접근성: 장식용 아이콘
      />
    </button>
  );
}
