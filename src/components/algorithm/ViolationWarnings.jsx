import React from 'react';

/**
 * 집중 모드 위반 경고 팝업 컴포넌트
 *
 * 기능:
 * - 전체화면 이탈 경고
 * - 탭 전환 경고
 * - 마우스 이탈 경고 (토스트)
 */
const ViolationWarnings = ({
  showFullscreenWarning,
  showTabSwitchWarning,
  showMouseLeaveWarning,
  violationCount,
  onDismissFullscreen,
  onDismissTabSwitch,
  onDismissMouseLeave
}) => {
  return (
    <>
      {/* 전체화면 이탈 경고 */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/90 z-9999 flex items-center justify-center">
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
        <div className="fixed top-4 right-4 bg-yellow-900/95 p-4 rounded-lg z-9999 animate-pulse shadow-lg border border-yellow-700">
          <p className="text-yellow-200 font-medium">⚠️ 마우스가 화면 밖으로 나갔습니다!</p>
          <button
            onClick={onDismissMouseLeave}
            className="mt-2 text-sm text-yellow-400 hover:text-yellow-300 underline"
          >
            닫기
          </button>
        </div>
      )}
    </>
  );
};

export default ViolationWarnings;
