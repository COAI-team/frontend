import React, { useEffect } from 'react';
import '../../styles/PenaltyNotification.css';

/**
 * 패널티 알림 컴포넌트
 *
 * 위반 누적에 따른 패널티 알림을 표시합니다.
 * - warning: 단순 경고 (노란색)
 * - severe: 심각한 경고 (주황색)
 * - critical: 자동 제출 경고 (빨간색)
 * - 라이트/다크 모드 지원
 */
const PenaltyNotification = ({
  notification,
  onDismiss,
  penaltyStatus
}) => {
  // 자동 닫기 (warning만)
  useEffect(() => {
    if (notification?.type === 'warning') {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  const getTypeClass = () => {
    switch (notification.type) {
      case 'critical':
        return 'penalty-critical';
      case 'severe':
        return 'penalty-severe';
      case 'warning':
      default:
        return 'penalty-warning';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'critical':
        return '🛑';
      case 'severe':
        return '🚨';
      case 'warning':
      default:
        return '⚠️';
    }
  };

  const typeClass = getTypeClass();

  return (
    <div className="penalty-overlay fixed inset-0 z-[9999] flex items-center justify-center">
      <div className={`penalty-container ${typeClass} ${notification.type === 'critical' ? 'animate-pulse' : ''} p-6 rounded-xl shadow-2xl border-2 max-w-md mx-4`}>
        <div className="flex items-start gap-4">
          <span className="text-4xl">{getIcon()}</span>
          <div className="flex-1">
            <h3 className="penalty-title font-bold text-xl">
              {notification.title}
            </h3>
            <p className="penalty-message mt-2">
              {notification.message}
            </p>

            {/* 패널티 상태 표시 */}
            {penaltyStatus && (
              <div className="penalty-status-box mt-4 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="penalty-label">위반 점수:</span>
                    <span className="penalty-score ml-2 font-bold">
                      {penaltyStatus.totalScore.toFixed(1)}점
                    </span>
                  </div>
                  <div>
                    <span className="penalty-label">현재 상태:</span>
                    <span className={`ml-2 font-bold ${
                      penaltyStatus.tier >= 3 ? 'text-red-500 dark:text-red-400' :
                      penaltyStatus.tier >= 2 ? 'text-orange-500 dark:text-orange-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {penaltyStatus.tierLabel}
                    </span>
                  </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="mt-3">
                  <div className="penalty-progress-label flex justify-between text-xs mb-1">
                    <span>다음 단계까지</span>
                    <span>{penaltyStatus.nextTierAt.toFixed(1)}점 남음</span>
                  </div>
                  <div className="penalty-progress-bg w-full h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        penaltyStatus.tier >= 3 ? 'bg-red-500' :
                        penaltyStatus.tier >= 2 ? 'bg-orange-500' :
                        'bg-yellow-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          (penaltyStatus.totalScore / 7) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 닫기 버튼 (critical이 아닌 경우만) */}
            {notification.type !== 'critical' && (
              <button
                onClick={onDismiss}
                className={`mt-4 px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  notification.type === 'severe'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                확인
              </button>
            )}

            {/* 자동 제출 카운트다운 */}
            {notification.type === 'critical' && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg">
                  <span className="animate-spin">⏳</span>
                  <span className="font-bold text-white">3초 후 자동 제출...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenaltyNotification;
