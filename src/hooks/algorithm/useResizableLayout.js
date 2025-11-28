import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 리사이저블 레이아웃 Hook (수평/수직 지원)
 * @param {number} initialSize - 초기 크기 (%)
 * @param {number} minSize - 최소 크기 (%)
 * @param {number} maxSize - 최대 크기 (%)
 * @param {string} direction - 'horizontal' | 'vertical'
 */
export const useResizableLayout = (
  initialSize = 50, 
  minSize = 20, 
  maxSize = 80,
  direction = 'horizontal'
) => {
  const [panelSize, setPanelSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // 리사이저 드래그 시작
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  // 리사이저 드래그 중
  const handleResize = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    let newSize;
    if (direction === 'horizontal') {
      // 수평 리사이즈 (좌우)
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      const minSizePx = containerWidth * (minSize / 100);
      const maxSizePx = containerWidth * (maxSize / 100);
      const clampedX = Math.max(minSizePx, Math.min(maxSizePx, mouseX));
      newSize = (clampedX / containerWidth) * 100;
    } else {
      // 수직 리사이즈 (상하)
      const containerHeight = containerRect.height;
      const mouseY = e.clientY - containerRect.top;
      const minSizePx = containerHeight * (minSize / 100);
      const maxSizePx = containerHeight * (maxSize / 100);
      const clampedY = Math.max(minSizePx, Math.min(maxSizePx, mouseY));
      newSize = (clampedY / containerHeight) * 100;
    }
    
    setPanelSize(newSize);
  }, [isResizing, minSize, maxSize, direction]);

  // 리사이저 드래그 종료
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // 이벤트 리스너 등록/해제
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

  // 크기 초기화
  const resetSize = useCallback(() => {
    setPanelSize(initialSize);
  }, [initialSize]);

  // 크기 설정
  const setSize = useCallback((size) => {
    const clampedSize = Math.max(minSize, Math.min(maxSize, size));
    setPanelSize(clampedSize);
  }, [minSize, maxSize]);

  return {
    // 기존 호환성을 위해 leftPanelWidth도 유지
    leftPanelWidth: panelSize,
    panelSize,
    isResizing,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
    containerRef,
    resetSize,
    setSize,
    resetWidth: resetSize,
    setWidth: setSize
  };
};

/**
 * 수직 리사이저블 레이아웃 전용 Hook
 * @param {number} initialHeight - 초기 높이 (%)
 * @param {number} minHeight - 최소 높이 (%)
 * @param {number} maxHeight - 최대 높이 (%)
 */
export const useVerticalResizable = (
  initialHeight = 70,
  minHeight = 30,
  maxHeight = 90
) => {
  const [topPanelHeight, setTopPanelHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleResize = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const mouseY = e.clientY - containerRect.top;
    
    const minHeightPx = containerHeight * (minHeight / 100);
    const maxHeightPx = containerHeight * (maxHeight / 100);
    const clampedY = Math.max(minHeightPx, Math.min(maxHeightPx, mouseY));
    
    const newHeight = (clampedY / containerHeight) * 100;
    setTopPanelHeight(newHeight);
  }, [isResizing, minHeight, maxHeight]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

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

  const resetHeight = useCallback(() => {
    setTopPanelHeight(initialHeight);
  }, [initialHeight]);

  return {
    topPanelHeight,
    bottomPanelHeight: 100 - topPanelHeight,
    isResizing,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
    containerRef,
    resetHeight
  };
};

export default useResizableLayout;