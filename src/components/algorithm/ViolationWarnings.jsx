import React from 'react';

/**
 * 집중 모드 위반 경고 팝업 컴포넌트
 *
 * 기능:
 * - 전체화면 이탈 경고 (전체 화면 모달)
 * - 탭 전환 경고 (전체 화면 모달)
 * - 마우스 이탈 경고 (상단 중앙 토스트 - 마우스 복귀 시 자동 닫힘)
 * - [Phase 2] NO_FACE 경고 (상단 중앙 - 얼굴 감지 시 자동 닫힘)
 * - [Phase 2] 개발자도구 열기 경고 (전체 콘텐츠 차단)
 * - [MediaPipe] 졸음 감지 경고 (상단 중앙 - 눈 뜨면 자동 닫힘)
 * - [MediaPipe] 다중 인물 감지 경고 (상단 중앙 - 1명 되면 자동 닫힘)
 * - [MediaPipe] 깜빡임 없음 경고 (상단 중앙 - 깜빡임 감지 시 자동 닫힘)
 *
 * 디자인 원칙:
 * - 전체화면/탭전환: 전체 화면 모달 (심각한 위반)
 * - 개발자도구: 전체 콘텐츠 차단 (위반 아님, 차단만)
 * - 기타 경고: 상단 중앙 토스트 스타일 (자동 닫힘 지원)
 *
 * 색상 체계:
 * - 빨간색: 심각한 위반 (다중 인물, 얼굴 미검출 15초+)
 * - 주황색: 중간 위반 (탭 전환, 졸음)
 * - 노란색: 경미한 위반 (마우스 이탈, 얼굴 미검출 초기)
 * - 보라색: Liveness 검증 (깜빡임 없음)
 */
const ViolationWarnings = ({
  showFullscreenWarning,
  showTabSwitchWarning,
  showMouseLeaveWarning,
  showDevtoolsWarning = false,
  violationCount,
  onDismissFullscreen,
  onDismissTabSwitch,
  // [Phase 2] NO_FACE 관련 props
  showNoFaceWarning = false,
  noFaceDuration = 0,
  noFaceProgress = 0,
  // [MediaPipe] 졸음 감지 관련 props
  showDrowsinessWarning = false,
  drowsinessPerclos = 0,
  // [MediaPipe] 다중 인물 감지 관련 props
  showMultipleFacesWarning = false,
  multipleFacesCount = 0,
  // [MediaPipe] 깜빡임 없음 경고 관련 props (Liveness 검증)
  showLivenessWarning = false,
}) => {
  // 상단 중앙 토스트 경고들의 수직 위치 계산 (중첩 방지)
  // 각 경고가 표시될 때 다음 경고는 아래로 밀림
  const getToastTopPosition = (index) => {
    return `${4 + index * 6}rem`; // 기본 top-4 (1rem) + 각 경고당 6rem 간격
  };

  // 현재 표시 중인 상단 중앙 토스트 경고 수 계산
  let toastIndex = 0;

  return (
    <>
      {/* ========== 전체 화면 모달 경고 (심각한 위반) ========== */}

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
        <div className="fixed inset-0 bg-black/90 z-9999 flex items-center justify-center">
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

      {/* ========== 전체 콘텐츠 차단 (개발자도구) ========== */}

      {/* [Phase 2] 개발자도구 열기 경고 - 콘텐츠 차단 (위반 기록 없음) */}
      {showDevtoolsWarning && (
        <div className="fixed inset-0 bg-zinc-900 z-9999 flex items-center justify-center">
          <div className="text-center max-w-lg p-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-zinc-800 rounded-full flex items-center justify-center">
              <span className="text-5xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">페이지 콘텐츠 보호됨</h2>
            <p className="text-gray-300 text-lg mb-2">
              문제 풀이 중에는 개발자도구를 사용할 수 없습니다.
            </p>
            <p className="text-gray-400 mb-6">
              개발자도구를 닫으면 페이지 콘텐츠가 다시 표시됩니다.
            </p>
            <div className="bg-zinc-800 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-400 mb-2">💡 개발자도구 닫는 방법:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Windows/Linux: <kbd className="px-2 py-1 bg-zinc-700 rounded text-xs">F12</kbd> 또는 <kbd className="px-2 py-1 bg-zinc-700 rounded text-xs">Ctrl + Shift + I</kbd></li>
                <li>• Mac: <kbd className="px-2 py-1 bg-zinc-700 rounded text-xs">⌘ + ⌥ + I</kbd></li>
              </ul>
            </div>
            <p className="text-xs text-green-400 mt-4">
              ※ 이 경고는 위반으로 기록되지 않습니다.
            </p>
          </div>
        </div>
      )}

      {/* ========== 상단 중앙 토스트 경고 (자동 닫힘 지원) ========== */}

      {/* 마우스 이탈 경고 - 노란색 (마우스 복귀 시 자동 닫힘) */}
      {showMouseLeaveWarning && (
        <div
          className="fixed left-1/2 transform -translate-x-1/2 z-[9998] animate-bounce"
          style={{ top: getToastTopPosition(toastIndex++) }}
        >
          <div className="bg-gradient-to-r from-yellow-800/95 to-amber-800/95 p-4 rounded-xl shadow-2xl border-2 border-yellow-500">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🖱️</span>
              <div>
                <h3 className="font-bold text-yellow-200">
                  마우스가 화면 밖으로 나갔습니다!
                </h3>
                <p className="text-sm text-gray-300">
                  마우스를 화면 안으로 다시 가져와 주세요.
                </p>
                <p className="text-xs text-yellow-300 mt-1">
                  마우스 복귀 시 자동으로 닫힙니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [Phase 2] NO_FACE 경고 (얼굴 미검출 경고) - 얼굴 감지 시 자동 닫힘 */}
      {showNoFaceWarning && (

        <div
          className="fixed left-1/2 transform -translate-x-1/2 z-9998 animate-bounce"
          style={{ top: getToastTopPosition(showMouseLeaveWarning ? toastIndex++ : toastIndex++) }}
        >
          <div className={`p-4 rounded-xl shadow-2xl border-2 ${
            noFaceProgress >= 1
              ? 'bg-linear-to-r from-red-900/95 to-rose-900/95 border-red-500'
              : 'bg-linear-to-r from-orange-900/95 to-amber-900/95 border-orange-500'
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
                {noFaceProgress < 1 && (
                  <p className="text-xs text-orange-300 mt-1">
                    얼굴 감지 시 자동으로 닫힙니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [MediaPipe] 졸음 감지 경고 - 주황색 (눈 뜨면 자동 닫힘) */}
      {showDrowsinessWarning && (
        <div
          className="fixed left-1/2 transform -translate-x-1/2 z-9998"
          style={{ top: getToastTopPosition(
            (showMouseLeaveWarning ? 1 : 0) + (showNoFaceWarning ? 1 : 0) + toastIndex++
          ) }}
        >
          <div className="bg-linear-to-r from-amber-900/95 to-orange-900/95 p-4 rounded-xl shadow-2xl border-2 border-amber-500 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-4xl">😴</span>
              <div>
                <h3 className="font-bold text-lg text-amber-200">
                  졸음이 감지되었습니다!
                </h3>
                <p className="text-sm text-gray-300">
                  집중력이 저하되고 있습니다. 잠시 휴식을 취하거나 스트레칭을 해보세요.
                </p>
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">
                    눈 감김 비율 (PERCLOS): {(drowsinessPerclos * 100).toFixed(1)}%
                  </div>
                  {/* 졸음 레벨 바 */}
                  <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-yellow-500 to-red-500 transition-all duration-300"
                      style={{ width: `${Math.min(drowsinessPerclos * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-amber-300 mt-1">
                  눈을 뜨면 자동으로 닫힙니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [MediaPipe] 다중 인물 감지 경고 - 빨간색 (1명 되면 자동 닫힘) */}
      {showMultipleFacesWarning && multipleFacesCount > 1 && (
        <div
          className="fixed left-1/2 transform -translate-x-1/2 z-9998"
          style={{ top: getToastTopPosition(
            (showMouseLeaveWarning ? 1 : 0) +
            (showNoFaceWarning ? 1 : 0) +
            (showDrowsinessWarning ? 1 : 0) + toastIndex++
          ) }}
        >
          <div className="bg-linear-to-r from-red-900/95 to-pink-900/95 p-4 rounded-xl shadow-2xl border-2 border-red-500 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-4xl">👥</span>
              <div>
                <h3 className="font-bold text-lg text-red-200">
                  다중 인물 감지!
                </h3>
                <p className="text-sm text-gray-300">
                  화면에서 <span className="font-bold text-red-300">{multipleFacesCount}명</span>이 감지되었습니다.
                </p>
                <p className="text-xs text-red-300 mt-1">
                  혼자서 시험을 보고 있는지 확인해주세요.
                </p>
                <p className="text-xs text-pink-300 mt-1">
                  1명만 감지되면 자동으로 닫힙니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [MediaPipe] 깜빡임 없음 경고 (Liveness 검증) - 보라색 (깜빡임 감지 시 자동 닫힘) */}
      {showLivenessWarning && (
        <div
          className="fixed left-1/2 transform -translate-x-1/2 z-9998"
          style={{ top: getToastTopPosition(
            (showMouseLeaveWarning ? 1 : 0) +
            (showNoFaceWarning ? 1 : 0) +
            (showDrowsinessWarning ? 1 : 0) +
            (showMultipleFacesWarning && multipleFacesCount > 1 ? 1 : 0) + toastIndex++
          ) }}
        >
          <div className="bg-linear-to-r from-purple-900/95 to-indigo-900/95 p-4 rounded-xl shadow-2xl border-2 border-purple-500 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-4xl">👁️</span>
              <div>
                <h3 className="font-bold text-lg text-purple-200">
                  눈 깜빡임이 감지되지 않습니다!
                </h3>
                <p className="text-sm text-gray-300">
                  30초 동안 눈 깜빡임이 없어 사진/영상 사용이 의심됩니다.
                </p>
                <p className="text-xs text-purple-300 mt-1">
                  실제 사용자라면 자연스럽게 눈을 깜빡여 주세요.
                </p>
                <p className="text-xs text-indigo-300 mt-1">
                  눈 깜빡임 감지 시 자동으로 닫힙니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViolationWarnings;
