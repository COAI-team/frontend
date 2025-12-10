import React from 'react';

/**
 * 집중 모드 위반 경고 팝업 컴포넌트
 *
 * 기능:
 * - 전체화면 이탈 경고
 * - 탭 전환 경고
 * - 마우스 이탈 경고 (토스트)
 * - [Phase 2] NO_FACE 경고 (얼굴 미검출 경고)
 */
const ViolationWarnings = ({
  showFullscreenWarning,
  showTabSwitchWarning,
  showMouseLeaveWarning,
  violationCount,
  onDismissFullscreen,
  onDismissTabSwitch,
  onDismissMouseLeave,
  // [Phase 2] NO_FACE 관련 props
  showNoFaceWarning = false,
  noFaceDuration = 0,
  noFaceProgress = 0,
}) => {
  return (
    <>
      {/* 전체화면 이탈 경고 */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center">
          <div className="bg-red-900 p-8 rounded-xl text-center max-w-md shadow-2xl">
            <span className="text-6xl">⚠️</span>
            <h2 className="text-2xl font-bold mt-4 text-white">전체화면을 유지해주세요!</h2>
            <p className="text-gray-300 mt-2">집중 모드에서는 전체화면을 유지해야 합니다.</p>
            <p className="text-yellow-400 mt-2 text-sm">경고 횟수: {violationCount}회</p>
            <button
              onClick={onDismissFullscreen}
              className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white transition-colors"
            >
              전체화면으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* 탭 전환 경고 */}
      {showTabSwitchWarning && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center">
          <div className="bg-orange-900 p-8 rounded-xl text-center max-w-md shadow-2xl">
            <span className="text-6xl">🚫</span>
            <h2 className="text-2xl font-bold mt-4 text-white">다른 창으로 이동하지 마세요!</h2>
            <p className="text-gray-300 mt-2">집중 모드에서는 다른 탭/창으로 이동이 제한됩니다.</p>
            <p className="text-yellow-400 mt-2">경고 횟수: {violationCount}회</p>
            <button
              onClick={onDismissTabSwitch}
              className="mt-6 px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold text-white transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 마우스 이탈 경고 (토스트) */}
      {showMouseLeaveWarning && (
        <div className="fixed top-4 right-4 bg-yellow-900/95 p-4 rounded-lg z-[9999] animate-pulse shadow-lg border border-yellow-700">
          <p className="text-yellow-200 font-medium">⚠️ 마우스가 화면 밖으로 나갔습니다!</p>
          <button
            onClick={onDismissMouseLeave}
            className="mt-2 text-sm text-yellow-400 hover:text-yellow-300 underline"
          >
            닫기
          </button>
        </div>
      )}

      {/* [Phase 2] NO_FACE 경고 (얼굴 미검출 경고) */}
      {showNoFaceWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-bounce">
          <div className={`p-4 rounded-xl shadow-2xl border-2 ${
            noFaceProgress >= 1
              ? 'bg-red-900/95 border-red-500'
              : 'bg-orange-900/95 border-orange-500'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">
                {noFaceProgress >= 1 ? '🚨' : '👤'}
              </span>
              <div>
                <h3 className={`font-bold text-lg ${
                  noFaceProgress >= 1 ? 'text-red-200' : 'text-orange-200'
                }`}>
                  {noFaceProgress >= 1
                    ? '심각한 위반 감지!'
                    : '얼굴이 감지되지 않습니다!'}
                </h3>
                <p className="text-sm text-gray-300">
                  {noFaceProgress >= 1
                    ? '15초 이상 얼굴이 감지되지 않았습니다. 이 기록은 저장됩니다.'
                    : '카메라를 향해 얼굴을 보여주세요.'}
                </p>
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">
                    미검출 시간: {Math.round(noFaceDuration / 1000)}초 / 15초
                  </div>
                  {/* 프로그레스 바 */}
                  <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        noFaceProgress >= 1
                          ? 'bg-red-500'
                          : noFaceProgress >= 0.7
                            ? 'bg-orange-500'
                            : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(noFaceProgress * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViolationWarnings;
