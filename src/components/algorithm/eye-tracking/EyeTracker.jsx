import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useEyeTracking } from '../../../hooks/algorithm/useEyeTracking';
import CalibrationScreen from './CalibrationScreen';

/**
 * 시선 추적 래퍼 컴포넌트
 * 웹캠 권한, 캘리브레이션, 추적 활성화를 통합 관리
 *
 * 변경사항:
 * - onSessionStart 콜백 추가 (monitoringSessionId 전달)
 * - monitoringSessionId를 부모 컴포넌트에서 사용할 수 있도록 노출
 * - timeLimitMinutes prop 추가 (사용자 지정 시간)
 */
const EyeTracker = forwardRef(({ problemId, isEnabled, timeLimitMinutes = 30, onReady, onSessionStart, onSessionEnd }, ref) => {
    const [showCalibration, setShowCalibration] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [error, setError] = useState(null);

    // Refs for cleanup (의존성 변경 시 cleanup 호출 방지)
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
        stopTracking
    } = useEyeTracking(problemId, isEnabled && permissionGranted, timeLimitMinutes);

    // Refs를 최신 값으로 유지
    useEffect(() => {
        stopTrackingRef.current = stopTracking;
        sessionIdRef.current = sessionId;
        onSessionEndRef.current = onSessionEnd;
    }, [stopTracking, sessionId, onSessionEnd]);

    // 웹캠 권한 요청
    useEffect(() => {
        if (!isEnabled) return;

        const requestPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });

                // 권한 획득 후 스트림 즉시 종료 (WebGazer가 자체적으로 관리)
                stream.getTracks().forEach(track => track.stop());

                setPermissionGranted(true);
                setShowCalibration(true);
            } catch (err) {
                console.error('Webcam permission denied:', err);
                setError('웹캠 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
            }
        };

        requestPermission();
    }, [isEnabled]);

    // 세션 시작 시 onSessionStart 콜백 호출
    useEffect(() => {
        if (isTracking && sessionId && onSessionStart) {
            console.log('🎯 Monitoring session started, notifying parent:', sessionId);
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

    // 부모 컴포넌트에서 stopTracking 호출 가능하도록 노출
    // Ref를 통해 최신 함수 참조 (stale closure 방지)
    useImperativeHandle(ref, () => ({
        stopTracking: async (remainingSeconds = null) => {
            if (cleanupCalledRef.current) return; // 이미 정리됨
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
        }
    }), []); // 빈 의존성 - ref를 통해 최신 값 접근

    // 컴포넌트 언마운트 시에만 추적 종료 (의존성 변경 시 호출 안 함)
    useEffect(() => {
        // 마운트 시 cleanup 플래그 초기화
        cleanupCalledRef.current = false;

        return () => {
            // 이미 부모에서 stopTracking을 호출했으면 스킵
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
    }, []); // 빈 의존성 배열 - 언마운트 시에만 실행

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

    // 추적 중 상태 표시 (선택적)
    if (isTracking) {
        return (
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
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
                    background: '#43e97b',
                    animation: 'blink 1.5s infinite'
                }}></span>
                👁️ 시선 추적 중
                <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
            </div>
        );
    }

    return null;
});

export default EyeTracker;
