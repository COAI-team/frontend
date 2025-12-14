import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useMediaPipeTracking } from '../../../hooks/algorithm/useMediaPipeTracking';
import MediaPipeCalibrationScreen from './MediaPipeCalibrationScreen';

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
 * - skipCalibration: 캘리브레이션 스킵 여부 (기본 false - 3-point 캘리브레이션 사용)
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
    skipCalibration = false // 기본: 3-point 캘리브레이션 사용
}, ref) => {
    const [showCalibration, setShowCalibration] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [error, setError] = useState(null);
    const [calibrationReady, setCalibrationReady] = useState(false); // FaceLandmarker + 웹캠 준비 완료

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
        drowsinessState,
        // 3-point 캘리브레이션용 refs
        faceLandmarkerRef,
        videoRef,
        setupWebcam
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

    // 다중 인물 감지 상태 변경 시 부모에게 알림 (1명으로 줄어도 알림)
    useEffect(() => {
        if (onMultipleFacesDetected) {
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
                // 먼저 권한 확인
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
                stream.getTracks().forEach(track => track.stop());
                setPermissionGranted(true);
                console.log('✅ Webcam permission granted');
            } catch (err) {
                console.error('Webcam permission denied:', err);
                setError('웹캠 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
            }
        };

        requestPermission();
    }, [isEnabled]);

    // 캘리브레이션 준비 (권한 획득 후)
    useEffect(() => {
        if (!isEnabled || !permissionGranted) return;

        if (skipCalibration) {
            // 캘리브레이션 스킵 - 바로 완료 처리 (자동 캘리브레이션 사용)
            completeCalibration(null);
            if (onReady) {
                onReady();
            }
            return;
        }

        // 3-point 캘리브레이션을 위해 웹캠 + FaceLandmarker 초기화 대기
        setShowCalibration(true); // 먼저 로딩 화면 표시

        const initializeCalibration = async () => {
            console.log('🔄 Starting calibration initialization...');

            // FaceLandmarker 초기화 대기 (최대 15초)
            let attempts = 0;
            const maxAttempts = 150; // 15초

            while (!faceLandmarkerRef?.current && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!faceLandmarkerRef?.current) {
                console.warn('⚠️ FaceLandmarker initialization timeout');
                setShowCalibration(false);
                completeCalibration(null);
                if (onReady) {
                    onReady();
                }
                return;
            }
            console.log('✅ FaceLandmarker ready');

            // 웹캠 설정
            if (setupWebcam) {
                const webcamReady = await setupWebcam();
                if (!webcamReady) {
                    console.warn('⚠️ Webcam setup failed');
                    setShowCalibration(false);
                    completeCalibration(null);
                    if (onReady) {
                        onReady();
                    }
                    return;
                }
            }
            console.log('✅ Webcam ready');

            // 비디오 요소 준비 대기
            attempts = 0;
            while (!videoRef?.current && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (faceLandmarkerRef?.current && videoRef?.current) {
                setCalibrationReady(true);
                console.log('✅ Calibration ready - FaceLandmarker and webcam initialized');
            } else {
                console.warn('⚠️ Video element not ready, using auto calibration');
                setShowCalibration(false);
                completeCalibration(null);
                if (onReady) {
                    onReady();
                }
            }
        };

        // 약간의 지연 후 초기화 시작 (hook이 먼저 실행되도록)
        const timer = setTimeout(initializeCalibration, 1000);

        return () => clearTimeout(timer);
    }, [isEnabled, permissionGranted, skipCalibration, completeCalibration, onReady, setupWebcam, faceLandmarkerRef, videoRef]);

    // 세션 시작 시 onSessionStart 콜백 호출
    useEffect(() => {
        if (isTracking && sessionId && onSessionStart) {
            console.log('🎯 MediaPipe monitoring session started, notifying parent:', sessionId);
            onSessionStart(sessionId);
        }
    }, [isTracking, sessionId, onSessionStart]);

    // 캘리브레이션 완료 처리 (3-point 캘리브레이션 데이터 포함)
    const handleCalibrationComplete = (calibrationData) => {
        setShowCalibration(false);
        setCalibrationReady(false);
        completeCalibration(calibrationData);

        if (onReady) {
            onReady();
        }

        console.log('✅ 3-point calibration completed with data:', calibrationData);
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
            // cleanupCalledRef 체크 제거 - 항상 정리 실행 보장
            // (이전에는 체크 후 바로 return하여 웹캠이 종료되지 않는 문제 발생)
            const currentStopTracking = stopTrackingRef.current;
            const currentSessionId = sessionIdRef.current;
            const currentOnSessionEnd = onSessionEndRef.current;

            console.log('🔴 [MediaPipeTracker] stopTracking called', {
                hasStopTracking: !!currentStopTracking,
                sessionId: currentSessionId,
                cleanupCalled: cleanupCalledRef.current
            });

            if (currentStopTracking) {
                await currentStopTracking(remainingSeconds);
            }
            if (currentOnSessionEnd && currentSessionId) {
                currentOnSessionEnd(currentSessionId);
            }

            // 정리 완료 후 플래그 설정 (언마운트 시 중복 정리 방지)
            cleanupCalledRef.current = true;
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
    if (showCalibration && calibrationReady) {
        return (
            <MediaPipeCalibrationScreen
                onComplete={handleCalibrationComplete}
                faceLandmarker={faceLandmarkerRef?.current}
                videoRef={videoRef}
            />
        );
    }

    // 캘리브레이션 준비 중
    if (showCalibration && !calibrationReady) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    borderTopColor: '#8b5cf6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ marginTop: '1.5rem', fontSize: '1.2rem' }}>
                    캘리브레이션 준비 중...
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#a5b4fc' }}>
                    MediaPipe 초기화 중입니다
                </p>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // 추적 중 상태 표시는 ProblemSolve.jsx의 상단 중앙 바에서 처리
    // 졸음/다중인물 경고는 ViolationWarnings.jsx에서 처리
    return null;
});

export default MediaPipeTracker;
