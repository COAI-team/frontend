import React, { forwardRef } from 'react';
import WebGazerTracker from './WebGazerTracker';
import MediaPipeTracker from './MediaPipeTracker';

/**
 * 통합 시선/얼굴 추적 래퍼 컴포넌트
 *
 * trackerType에 따라 WebGazer 또는 MediaPipe 추적기를 렌더링
 *
 * Props:
 * - trackerType: 'webgazer' | 'mediapipe' (기본값: 'webgazer')
 * - problemId: 문제 ID
 * - isEnabled: 추적 활성화 여부
 * - timeLimitMinutes: 제한 시간 (분)
 * - onReady: 준비 완료 콜백
 * - onSessionStart: 세션 시작 콜백
 * - onSessionEnd: 세션 종료 콜백
 * - onNoFaceStateChange: NO_FACE 상태 변경 콜백
 * - onDrowsinessStateChange: 졸음 상태 변경 콜백 (MediaPipe only)
 * - onMultipleFacesDetected: 다중 인물 감지 콜백 (MediaPipe only)
 * - onLivenessWarningChange: 깜빡임 없음 경고 콜백 (MediaPipe only, Liveness 검증)
 * - showFocusGauge: 집중도 게이지 표시 여부 (MediaPipe only)
 * - focusGaugePosition: 게이지 위치 (MediaPipe only)
 * - focusGaugeCompact: 게이지 컴팩트 모드 (MediaPipe only)
 * - onFocusScoreChange: 집중도 점수 변경 콜백 (MediaPipe only)
 *
 * Ref Methods (useImperativeHandle):
 * - stopTracking(remainingSeconds): 추적 종료
 * - toggleDebugMode(): 디버그 모드 토글
 * - getDebugMode(): 현재 디버그 모드 상태
 * - getTrackingData(): MediaPipe 추가 데이터 (MediaPipe only)
 * - getFocusScore(): 집중도 점수 (MediaPipe only)
 * - getFocusStats(): 집중도 통계 (MediaPipe only)
 */
const EyeTracker = forwardRef(({
    trackerType = 'webgazer',
    problemId,
    isEnabled,
    timeLimitMinutes = 30,
    onReady,
    onSessionStart,
    onSessionEnd,
    onNoFaceStateChange,
    // MediaPipe 전용 콜백
    onDrowsinessStateChange,
    onMultipleFacesDetected,
    onLivenessWarningChange,
    skipCalibration,
    // 집중도 게이지 (MediaPipe only)
    showFocusGauge = false,
    focusGaugePosition = 'top-right',
    focusGaugeCompact = false,
    onFocusScoreChange
}, ref) => {

    // trackerType에 따라 적절한 추적기 렌더링
    if (trackerType === 'mediapipe') {
        return (
            <MediaPipeTracker
                ref={ref}
                problemId={problemId}
                isEnabled={isEnabled}
                timeLimitMinutes={timeLimitMinutes}
                onReady={onReady}
                onSessionStart={onSessionStart}
                onSessionEnd={onSessionEnd}
                onNoFaceStateChange={onNoFaceStateChange}
                onDrowsinessStateChange={onDrowsinessStateChange}
                onMultipleFacesDetected={onMultipleFacesDetected}
                onLivenessWarningChange={onLivenessWarningChange}
                skipCalibration={skipCalibration === true} // 명시적으로 true일 때만 스킵
                showFocusGauge={showFocusGauge}
                focusGaugePosition={focusGaugePosition}
                focusGaugeCompact={focusGaugeCompact}
                onFocusScoreChange={onFocusScoreChange}
            />
        );
    }

    // 기본값: WebGazer
    return (
        <WebGazerTracker
            ref={ref}
            problemId={problemId}
            isEnabled={isEnabled}
            timeLimitMinutes={timeLimitMinutes}
            onReady={onReady}
            onSessionStart={onSessionStart}
            onSessionEnd={onSessionEnd}
            onNoFaceStateChange={onNoFaceStateChange}
        />
    );
});

// 추적기 타입 상수 내보내기
export const TRACKER_TYPES = {
    WEBGAZER: 'webgazer',
    MEDIAPIPE: 'mediapipe'
};

export default EyeTracker;