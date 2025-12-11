import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 위반 패널티 시스템 커스텀 훅
 *
 * 기능:
 * - 모든 위반 유형을 집계하여 누적 카운트
 * - 3단계 패널티 시스템:
 *   - Tier 1 (1-3회): 단순 경고
 *   - Tier 2 (4-6회): 심각한 경고 + 시간 감소 (5분)
 *   - Tier 3 (7회+): 강제 자동 제출
 * - 시간 감소 및 자동 제출 콜백 제공
 *
 * @param {Object} options
 * @param {boolean} options.isActive - 패널티 시스템 활성화 여부
 * @param {number} options.currentTimeLeft - 현재 남은 시간 (초)
 * @param {Function} options.onTimeReduction - 시간 감소 콜백 (감소할 초 단위)
 * @param {Function} options.onAutoSubmit - 자동 제출 콜백
 * @returns {Object} 상태 및 액션
 */

// 패널티 상수 정의
const PENALTY_CONFIG = {
  // Tier 1: 단순 경고 (1-3회)
  TIER1_MAX: 3,

  // Tier 2: 심각한 경고 + 시간 감소 (4-6회)
  TIER2_MIN: 4,
  TIER2_MAX: 6,
  TIME_REDUCTION_SECONDS: 5 * 60, // 5분 감소

  // Tier 3: 강제 자동 제출 (7회+)
  TIER3_MIN: 7,

  // 시간 감소 최대 횟수 (무한 감소 방지)
  MAX_TIME_REDUCTIONS: 3,

  // 위반 유형별 가중치
  VIOLATION_WEIGHTS: {
    FULLSCREEN_EXIT: 1,
    TAB_SWITCH: 1,
    MOUSE_LEAVE: 0.5, // 마우스 이탈은 경미한 위반
    GAZE_AWAY: 0.5,   // 시선 이탈도 경미한 위반
    NO_FACE: 1,
    NO_FACE_SUSTAINED: 2, // 지속적 얼굴 미검출은 심각한 위반
    SLEEPING: 2,      // 졸음도 심각한 위반
    MASK_DETECTED: 1,
    MULTIPLE_FACES: 2,
    // DEVTOOLS_OPEN 제거됨 - 위반 기록 없이 콘텐츠 차단만 적용
  }
};

export const useViolationPenalty = ({
  isActive = false,
  currentTimeLeft = 0,
  onTimeReduction = null,
  onAutoSubmit = null
}) => {
  // 누적 위반 점수 (가중치 적용)
  const [totalViolationScore, setTotalViolationScore] = useState(0);

  // 위반 유형별 카운트
  const [violationCounts, setViolationCounts] = useState({});

  // 현재 패널티 티어
  const [currentTier, setCurrentTier] = useState(0);

  // 패널티 알림 상태
  const [penaltyNotification, setPenaltyNotification] = useState(null);

  // Refs for stale closure prevention
  const timeReductionsRef = useRef(0);
  const autoSubmitTriggeredRef = useRef(false);
  const onTimeReductionRef = useRef(onTimeReduction);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const currentTimeLeftRef = useRef(currentTimeLeft);
  const prevTierRef = useRef(0);

  // Refs를 최신 값으로 유지
  useEffect(() => {
    onTimeReductionRef.current = onTimeReduction;
    onAutoSubmitRef.current = onAutoSubmit;
    currentTimeLeftRef.current = currentTimeLeft;
  }, [onTimeReduction, onAutoSubmit, currentTimeLeft]);

  // 패널티 티어 계산
  const calculateTier = useCallback((score) => {
    if (score >= PENALTY_CONFIG.TIER3_MIN) return 3;
    if (score >= PENALTY_CONFIG.TIER2_MIN) return 2;
    if (score >= 1) return 1;
    return 0;
  }, []);

  // 티어 변경 감지 및 처리
  useEffect(() => {
    if (currentTier === prevTierRef.current) return;

    const prevTier = prevTierRef.current;
    prevTierRef.current = currentTier;

    console.log(`⚠️ Penalty tier changed: ${prevTier} → ${currentTier} (score: ${totalViolationScore})`);

    switch (currentTier) {
      case 1:
        // Tier 1: 단순 경고
        setPenaltyNotification({
          type: 'warning',
          title: '⚠️ 주의',
          message: '집중 모드 위반이 감지되었습니다. 계속되면 불이익이 있을 수 있습니다.',
          severity: 'low'
        });
        break;

      case 2:
        // Tier 2: 심각한 경고 + 시간 감소
        if (timeReductionsRef.current < PENALTY_CONFIG.MAX_TIME_REDUCTIONS) {
          timeReductionsRef.current += 1;

          if (onTimeReductionRef.current && currentTimeLeftRef.current > PENALTY_CONFIG.TIME_REDUCTION_SECONDS) {
            onTimeReductionRef.current(PENALTY_CONFIG.TIME_REDUCTION_SECONDS);
            console.log(`⏰ Time reduced by ${PENALTY_CONFIG.TIME_REDUCTION_SECONDS / 60} minutes`);
          }

          setPenaltyNotification({
            type: 'severe',
            title: '🚨 심각한 경고',
            message: `위반이 누적되어 제한 시간이 5분 감소되었습니다. (${timeReductionsRef.current}/${PENALTY_CONFIG.MAX_TIME_REDUCTIONS}회)`,
            severity: 'medium'
          });
        } else {
          setPenaltyNotification({
            type: 'severe',
            title: '🚨 심각한 경고',
            message: '추가 위반 시 자동 제출됩니다.',
            severity: 'high'
          });
        }
        break;

      case 3:
        // Tier 3: 강제 자동 제출
        if (!autoSubmitTriggeredRef.current) {
          autoSubmitTriggeredRef.current = true;

          setPenaltyNotification({
            type: 'critical',
            title: '🛑 자동 제출',
            message: '위반 누적으로 인해 자동 제출됩니다.',
            severity: 'critical'
          });

          // 3초 후 자동 제출 실행 (사용자에게 알림 시간)
          if (onAutoSubmitRef.current) {
            setTimeout(() => {
              console.log('🛑 Auto-submit triggered due to excessive violations');
              if (onAutoSubmitRef.current) {
                onAutoSubmitRef.current();
              }
            }, 3000);
          }
        }
        break;

      default:
        break;
    }
  }, [currentTier, totalViolationScore]);

  // 위반 기록 함수
  const recordViolation = useCallback((violationType) => {
    if (!isActive) return;

    const weight = PENALTY_CONFIG.VIOLATION_WEIGHTS[violationType] || 1;

    setViolationCounts(prev => ({
      ...prev,
      [violationType]: (prev[violationType] || 0) + 1
    }));

    setTotalViolationScore(prev => {
      const newScore = prev + weight;
      const newTier = calculateTier(newScore);

      // 티어 변경 (useEffect에서 처리)
      setCurrentTier(newTier);

      return newScore;
    });

    console.log(`📊 Violation recorded: ${violationType} (weight: ${weight})`);
  }, [isActive, calculateTier]);

  // 알림 닫기
  const dismissNotification = useCallback(() => {
    setPenaltyNotification(null);
  }, []);

  // 상태 초기화
  const resetPenalties = useCallback(() => {
    setTotalViolationScore(0);
    setViolationCounts({});
    setCurrentTier(0);
    setPenaltyNotification(null);
    timeReductionsRef.current = 0;
    autoSubmitTriggeredRef.current = false;
    prevTierRef.current = 0;
  }, []);

  // 현재 상태 요약 (디버깅/UI용)
  const getPenaltyStatus = useCallback(() => {
    return {
      totalScore: totalViolationScore,
      tier: currentTier,
      tierLabel: getTierLabel(currentTier),
      violationCounts,
      timeReductionsApplied: timeReductionsRef.current,
      isAutoSubmitPending: autoSubmitTriggeredRef.current,
      nextTierAt: getNextTierThreshold(totalViolationScore)
    };
  }, [totalViolationScore, currentTier, violationCounts]);

  // 비활성화 시 상태 초기화
  useEffect(() => {
    if (!isActive) {
      resetPenalties();
    }
  }, [isActive, resetPenalties]);

  return {
    // 상태
    totalViolationScore,
    violationCounts,
    currentTier,
    penaltyNotification,

    // 액션
    recordViolation,
    dismissNotification,
    resetPenalties,
    getPenaltyStatus,

    // 상수 (외부에서 참조용)
    PENALTY_CONFIG
  };
};

// 헬퍼 함수: 티어 라벨
function getTierLabel(tier) {
  switch (tier) {
    case 1: return '주의';
    case 2: return '경고';
    case 3: return '심각';
    default: return '정상';
  }
}

// 헬퍼 함수: 다음 티어까지 남은 점수
function getNextTierThreshold(currentScore) {
  if (currentScore < PENALTY_CONFIG.TIER2_MIN) {
    return PENALTY_CONFIG.TIER2_MIN - currentScore;
  }
  if (currentScore < PENALTY_CONFIG.TIER3_MIN) {
    return PENALTY_CONFIG.TIER3_MIN - currentScore;
  }
  return 0; // 이미 최고 티어
}

export default useViolationPenalty;
