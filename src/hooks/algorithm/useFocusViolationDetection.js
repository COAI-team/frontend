import { useState, useEffect, useCallback } from 'react';
import devtools from 'devtools-detect';
import { sendMonitoringViolation } from '../../service/algorithm/AlgorithmApi';

/**
 * 집중 모드 위반 감지 커스텀 훅
 *
 * 기능:
 * - 전체화면 이탈 감지
 * - 탭/브라우저 전환 감지
 * - 마우스 화면 밖 이동 감지
 * - 개발자도구 열기 감지 (프로덕션 환경에서만 위반 처리, 기본/집중 모드 모두 적용)
 * - 위반 횟수 카운트
 * - 백엔드 위반 기록 전송
 *
 * @param {Object} options
 * @param {boolean} options.isActive - 감지 활성화 여부
 * @param {boolean} options.isDevtoolsCheckActive - 개발자도구 감지 활성화 (기본/집중 모드 모두)
 * @param {string} options.monitoringSessionId - 모니터링 세션 ID
 * @returns {Object} 상태 및 액션
 */
export const useFocusViolationDetection = ({ isActive, isDevtoolsCheckActive = false, monitoringSessionId }) => {
  // 경고 팝업 상태
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [showMouseLeaveWarning, setShowMouseLeaveWarning] = useState(false);
  const [showDevtoolsWarning, setShowDevtoolsWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // 프로덕션 환경 여부 (Vite 환경변수)
  const isProduction = import.meta.env.PROD;

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

  // 마우스 화면 밖 이동 감지 (마우스 복귀 시 자동 닫힘)
  useEffect(() => {
    if (!isActive) return;

    const handleMouseLeave = () => {
      setShowMouseLeaveWarning(true);
      if (monitoringSessionId) {
        sendMonitoringViolation(monitoringSessionId, 'MOUSE_LEAVE', {
          description: 'Mouse left the browser window'
        });
      }
    };

    // 마우스 복귀 시 경고 자동 닫힘
    const handleMouseEnter = () => {
      setShowMouseLeaveWarning(false);
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isActive, monitoringSessionId]);

  // 개발자도구 열기 감지 (기본/집중 모드 모두 적용)
  // ※ 위반 기록 없음 - 콘텐츠 차단 경고만 표시
  useEffect(() => {
    // isDevtoolsCheckActive: 문제 풀이가 시작되면 활성화 (모드 무관)
    if (!isDevtoolsCheckActive) return;

    const handleDevtoolsChange = (event) => {
      // 개발 모드에서도 테스트 가능하도록 오버레이 표시
      if (!isProduction) {
        console.log('[DEV MODE] DevTools', event.detail.isOpen ? 'opened' : 'closed');
      }

      // 개발자도구 상태에 따라 경고 표시/숨김 (위반 기록 없음)
      setShowDevtoolsWarning(event.detail.isOpen);
    };

    // 초기 상태 확인 (이미 열려있는 경우)
    if (devtools.isOpen) {
      if (!isProduction) {
        console.log('[DEV MODE] DevTools already open on mount');
      }
      setShowDevtoolsWarning(true);
    }

    window.addEventListener('devtoolschange', handleDevtoolsChange);

    return () => {
      window.removeEventListener('devtoolschange', handleDevtoolsChange);
    };
  }, [isDevtoolsCheckActive, isProduction]);

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

  const dismissDevtoolsWarning = useCallback(() => {
    setShowDevtoolsWarning(false);
  }, []);

  // 상태 초기화 (컴포넌트 언마운트 또는 모드 변경 시)
  const resetViolations = useCallback(() => {
    setShowFullscreenWarning(false);
    setShowTabSwitchWarning(false);
    setShowMouseLeaveWarning(false);
    setShowDevtoolsWarning(false);
    setViolationCount(0);
  }, []);

  return {
    // 상태
    showFullscreenWarning,
    showTabSwitchWarning,
    showMouseLeaveWarning,
    showDevtoolsWarning,
    violationCount,

    // 액션
    enterFullscreen,
    dismissFullscreenWarning,
    dismissTabSwitchWarning,
    dismissMouseLeaveWarning,
    dismissDevtoolsWarning,
    resetViolations
  };
};

export default useFocusViolationDetection;
