import { useState, useEffect, useCallback } from 'react';
import { sendMonitoringViolation } from '../../service/algorithm/algorithmApi';

/**
 * 집중 모드 위반 감지 커스텀 훅
 *
 * 기능:
 * - 전체화면 이탈 감지
 * - 탭/브라우저 전환 감지
 * - 마우스 화면 밖 이동 감지
 * - 위반 횟수 카운트
 * - 백엔드 위반 기록 전송
 *
 * @param {Object} options
 * @param {boolean} options.isActive - 감지 활성화 여부
 * @param {string} options.monitoringSessionId - 모니터링 세션 ID
 * @returns {Object} 상태 및 액션
 */
export const useFocusViolationDetection = ({ isActive, monitoringSessionId }) => {
  // 경고 팝업 상태
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [showMouseLeaveWarning, setShowMouseLeaveWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // 전체화면 진입 함수
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  }, []);

  // 전체화면 이탈 감지
  useEffect(() => {
    if (!isActive) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setShowFullscreenWarning(true);
        setViolationCount(prev => prev + 1);
        if (monitoringSessionId) {
          sendMonitoringViolation(monitoringSessionId, 'FULLSCREEN_EXIT', {
            description: 'User exited fullscreen mode'
          });
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isActive, monitoringSessionId]);

  // 탭/브라우저 전환 감지
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowTabSwitchWarning(true);
        setViolationCount(prev => prev + 1);
        if (monitoringSessionId) {
          sendMonitoringViolation(monitoringSessionId, 'TAB_SWITCH', {
            description: 'User switched to another tab/window'
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, monitoringSessionId]);

  // 마우스 화면 밖 이동 감지
  useEffect(() => {
    if (!isActive) return;

    let timeoutId = null;

    const handleMouseLeave = () => {
      setShowMouseLeaveWarning(true);
      if (monitoringSessionId) {
        sendMonitoringViolation(monitoringSessionId, 'MOUSE_LEAVE', {
          description: 'Mouse left the browser window'
        });
      }
      // 3초 후 자동으로 경고 숨기기
      timeoutId = setTimeout(() => {
        setShowMouseLeaveWarning(false);
      }, 3000);
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isActive, monitoringSessionId]);

  // 경고 닫기 핸들러
  const dismissFullscreenWarning = useCallback(() => {
    enterFullscreen();
    setShowFullscreenWarning(false);
  }, [enterFullscreen]);

  const dismissTabSwitchWarning = useCallback(() => {
    setShowTabSwitchWarning(false);
  }, []);

  const dismissMouseLeaveWarning = useCallback(() => {
    setShowMouseLeaveWarning(false);
  }, []);

  // 상태 초기화 (컴포넌트 언마운트 또는 모드 변경 시)
  const resetViolations = useCallback(() => {
    setShowFullscreenWarning(false);
    setShowTabSwitchWarning(false);
    setShowMouseLeaveWarning(false);
    setViolationCount(0);
  }, []);

  return {
    // 상태
    showFullscreenWarning,
    showTabSwitchWarning,
    showMouseLeaveWarning,
    violationCount,

    // 액션
    enterFullscreen,
    dismissFullscreenWarning,
    dismissTabSwitchWarning,
    dismissMouseLeaveWarning,
    resetViolations
  };
};

export default useFocusViolationDetection;
