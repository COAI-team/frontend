import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useMediaPipeTracking } from '../../../hooks/algorithm/useMediaPipeTracking';
import CalibrationScreen from './CalibrationScreen';

/**
 * MediaPipe 기반 시선/얼굴 추적 래퍼 컴포넌트
 *
 * WebGazer 대안으로 MediaPipe FaceLandmarker 사용
 * 추가 기능: 졸음 감지, 다중 인물 감지, 3D 얼굴 방향, 홍채 추적
 *
 * Props:
 * - problemId: 문제 ID
 * - isEnabled: 추적 활성화 여부
 * - timeLimitMinutes: 제한 시간 (분)
 * - onReady: 준비 완료 콜백
 * - onSessionStart: 세션 시작 콜백 (sessionId 전달)
 * - onSessionEnd: 세션 종료 콜백
 * - onNoFaceStateChange: NO_FACE 상태 변경 콜백
 * - onDrowsinessStateChange: 졸음 상태 변경 콜백
 * - onMultipleFacesDetected: 다중 인물 감지 콜백
 * - skipCalibration: 캘리브레이션 스킵 여부 (MediaPipe는 기본 true)
 */
const MediaPipeTracker = forwardRef(({
    problemId,
    isEnabled,
    timeLimitMinutes = 30,
    onReady,
    onSessionStart,
    onSessionEnd,
    onNoFaceStateChange,
    onDrowsinessStateChange,
    onMultipleFacesDetected,
    skipCalibration = true // MediaPipe는 캘리브레이션 불필요
}, ref) => {
    const [showCalibration, setShowCalibration] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [error, setError] = useState(null);

    // Refs for cleanup
    const stopTrackingRef = useRef(null);
    const sessionIdRef = useRef(null);
    const onSessionEndRef = useRef(null);
    const cleanupCalledRef = useRef(false);

    const {
        isCalibrated,
        isTracking,
        sessionId,
        startCalibration,
        completeCalibration,
        stopTracking,
        // NO_FACE 상태
        showNoFaceWarning,
        noFaceDuration,
        noFaceProgress,
        // 디버그 모드
        debugMode,
        toggleDebugMode,
        isFaceDetected,
        // MediaPipe 추가 기능
        faceCount,
        detectedFaces,
        headPose,
        gazePosition,
        eyeState,
        irisPosition,
        drowsinessState
    } = useMediaPipeTracking(problemId, isEnabled && permissionGranted, timeLimitMinutes);

    // Refs를 최신 값으로 유지
    useEffect(() => {
        stopTrackingRef.current = stopTracking;
        sessionIdRef.current = sessionId;
        onSessionEndRef.current = onSessionEnd;
    }, [stopTracking, sessionId, onSessionEnd]);

    // NO_FACE 상태 변경 시 부모에게 알림
    useEffect(() => {
        if (onNoFaceStateChange) {
            onNoFaceStateChange({
                showNoFaceWarning,
                noFaceDuration,
                noFaceProgress
            });
        }
    }, [showNoFaceWarning, noFaceDuration, noFaceProgress, onNoFaceStateChange]);

    // 졸음 상태 변경 시 부모에게 알림
    useEffect(() => {
        if (onDrowsinessStateChange) {
            onDrowsinessStateChange(drowsinessState);
        }
    }, [drowsinessState, onDrowsinessStateChange]);

    // 다중 인물 감지 시 부모에게 알림
    useEffect(() => {
        if (onMultipleFacesDetected && faceCount > 1) {
            onMultipleFacesDetected({
                faceCount,
                detectedFaces
            });
        }
    }, [faceCount, detectedFaces, onMultipleFacesDetected]);

    // 웹캠 권한 요청
    useEffect(() => {
        if (!isEnabled) return;

        const requestPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });

                // 권한 획득 후 스트림 즉시 종료 (MediaPipe가 자체적으로 관리)
                stream.getTracks().forEach(track => track.stop());

                setPermissionGranted(true);

                if (skipCalibration) {
                    // 캘리브레이션 스킵 - 바로 완료 처리
                    completeCalibration();
                    if (onReady) {
                        onReady();
                    }
                } else {
                    setShowCalibration(true);
                }
            } catch (err) {
                console.error('Webcam permission denied:', err);
                setError('웹캠 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
            }
        };

        requestPermission();
    }, [isEnabled, skipCalibration, completeCalibration, onReady]);

    // 세션 시작 시 onSessionStart 콜백 호출
    useEffect(() => {
        if (isTracking && sessionId && onSessionStart) {
            console.log('🎯 MediaPipe monitoring session started, notifying parent:', sessionId);
            onSessionStart(sessionId);
        }
    }, [isTracking, sessionId, onSessionStart]);

    // 캘리브레이션 완료 처리
    const handleCalibrationComplete = () => {
        setShowCalibration(false);
        completeCalibration();

        if (onReady) {
            onReady();
        }
    };

    // Refs for debug mode
    const toggleDebugModeRef = useRef(null);
    const debugModeRef = useRef(false);

    useEffect(() => {
        toggleDebugModeRef.current = toggleDebugMode;
        debugModeRef.current = debugMode;
    }, [toggleDebugMode, debugMode]);

    // 부모 컴포넌트에서 호출 가능한 메서드 노출
    useImperativeHandle(ref, () => ({
        stopTracking: async (remainingSeconds = null) => {
            if (cleanupCalledRef.current) return;
            cleanupCalledRef.current = true;

            const currentStopTracking = stopTrackingRef.current;
            const currentSessionId = sessionIdRef.current;
            const currentOnSessionEnd = onSessionEndRef.current;

            if (currentStopTracking) {
                await currentStopTracking(remainingSeconds);
            }
            if (currentOnSessionEnd && currentSessionId) {
                currentOnSessionEnd(currentSessionId);
            }
        },
        toggleDebugMode: () => {
            if (toggleDebugModeRef.current) {
                toggleDebugModeRef.current();
            }
        },
        getDebugMode: () => debugModeRef.current,
        // MediaPipe 전용 메서드
        getTrackingData: () => ({
            faceCount,
            headPose,
            gazePosition,
            eyeState,
            irisPosition,
            drowsinessState,
            isFaceDetected
        })
    }), [faceCount, headPose, gazePosition, eyeState, irisPosition, drowsinessState, isFaceDetected]);

    // 컴포넌트 언마운트 시 추적 종료
    useEffect(() => {
        cleanupCalledRef.current = false;

        return () => {
            if (cleanupCalledRef.current) return;
            cleanupCalledRef.current = true;

            const currentStopTracking = stopTrackingRef.current;
            const currentSessionId = sessionIdRef.current;
            const currentOnSessionEnd = onSessionEndRef.current;

            if (currentStopTracking) {
                currentStopTracking().then(() => {
                    if (currentOnSessionEnd && currentSessionId) {
                        currentOnSessionEnd(currentSessionId);
                    }
                });
            }
        };
    }, []);

    // 에러 표시
    if (error) {
        return (
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: '#fee',
                color: '#c33',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                maxWidth: '300px'
            }}>
                <strong>⚠️ 오류</strong>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{error}</p>
            </div>
        );
    }

    // 캘리브레이션 화면 표시
    if (showCalibration) {
        return <CalibrationScreen onComplete={handleCalibrationComplete} />;
    }

    // 추적 중 상태 표시
    if (isTracking) {
        return (
            <>
                {/* 기본 상태 표시 */}
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    color: 'white',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: faceCount > 0 ? '#43e97b' : '#ef4444',
                        animation: 'blink 1.5s infinite'
                    }}></span>
                    🎯 MediaPipe 추적 중
                    {faceCount > 1 && (
                        <span style={{
                            background: '#f59e0b',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            marginLeft: '4px'
                        }}>
                            {faceCount}명 감지
                        </span>
                    )}
                    <style>{`
                        @keyframes blink {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.3; }
                        }
                    `}</style>
                </div>

                {/* 졸음 경고 */}
                {drowsinessState.isDrowsy && (
                    <div style={{
                        position: 'fixed',
                        top: '70px',
                        right: '20px',
                        background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                        color: 'white',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        animation: 'pulse 1s infinite'
                    }}>
                        😴 졸음이 감지되었습니다!
                        <style>{`
                            @keyframes pulse {
                                0%, 100% { transform: scale(1); }
                                50% { transform: scale(1.02); }
                            }
                        `}</style>
                    </div>
                )}
            </>
        );
    }

    return null;
});

export default MediaPipeTracker;
