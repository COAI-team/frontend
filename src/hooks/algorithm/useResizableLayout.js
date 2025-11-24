import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 리사이저블 레이아웃 Hook
 * 두 패널 사이의 드래그 가능한 리사이저 기능을 제공
 */
export const useResizableLayout = (initialWidth = 50, minWidth = 20, maxWidth = 80) => {
  // 상태 관리
  const [leftPanelWidth, setLeftPanelWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // 리사이저 드래그 시작
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // 리사이저 드래그 중
  const handleResize = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // 최소/최대 너비 제한
    const minWidthPx = containerWidth * (minWidth / 100);
    const maxWidthPx = containerWidth * (maxWidth / 100);
    
    const clampedX = Math.max(minWidthPx, Math.min(maxWidthPx, mouseX));
    const newLeftPanelWidth = (clampedX / containerWidth) * 100;
    
    setLeftPanelWidth(newLeftPanelWidth);
  }, [isResizing, minWidth, maxWidth]);

  // 리사이저 드래그 종료
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // 리사이저 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  // 너비 초기화 함수
  const resetWidth = useCallback(() => {
    setLeftPanelWidth(initialWidth);
  }, [initialWidth]);

  // 너비 설정 함수 (프로그래밍 방식)
  const setWidth = useCallback((width) => {
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
    setLeftPanelWidth(clampedWidth);
  }, [minWidth, maxWidth]);

  return {
    // 상태 (실제 사용되는 것들만)
    leftPanelWidth,
    isResizing,
    
    // 핸들러 (기존 코드에서 사용하는 것들)
    handleResizeStart,
    handleResize,
    handleResizeEnd,
    
    // Ref
    containerRef,
    
    // 유틸리티 함수 (필요시 사용)
    resetWidth,
    setWidth
  };
};