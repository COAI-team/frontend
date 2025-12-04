import { useState, useEffect, useCallback, useRef } from 'react';
import {
    startMonitoringSession,
    sendMonitoringViolation,
    endMonitoringSession,
    recordMonitoringWarning
} from '../../service/algorithm/algorithmApi';

/**
 * WebGazer 기반 시선 추적 커스텀 훅 (모니터링 시스템 연동)
 *
 * 변경사항:
 * - startFocusSession → startMonitoringSession
 * - sendFocusEvent → sendMonitoringViolation
 * - endFocusSession → endMonitoringSession
 * - 모니터링은 점수에 미반영 (정보 제공 및 경고 목적)
 *
 * @param {number} problemId - 현재 문제 ID
 * @param {boolean} isActive - 추적 활성화 여부
 * @param {number} timeLimitMinutes - 제한 시간 (분, 기본 30분)
 * @returns {object} - { isCalibrated, startCalibration, sessionId, isTracking, monitoringSessionId }
 */
export const useEyeTracking = (problemId, isActive = false, timeLimitMinutes = 30) => {
    const [isCalibrated, setIsCalibrated] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const gazeIntervalRef = useRef(null);

    // WebGazer 초기화
    useEffect(() => {
        if (!isActive || !window.webgazer) return;

        const initWebGazer = async () => {
            try {
                await window.webgazer
                    .setRegression('ridge')
                    .setTracker('TFFacemesh')
                    .begin();

                // 예측 비디오 숨기기 (UI 정리)
                window.webgazer.showVideoPreview(false);
                window.webgazer.showPredictionPoints(false);

                console.log('WebGazer initialized');
            } catch (error) {
                console.error('WebGazer initialization failed:', error);
            }
        };

        initWebGazer();

        // Cleanup
        return () => {
            if (window.webgazer) {
                window.webgazer.end();
            }
        };
    }, [isActive]);

    // 캘리브레이션 시작
    const startCalibration = useCallback(() => {
        if (!window.webgazer) {
            console.error('WebGazer not loaded');
            return;
        }

        // 캘리브레이션 완료는 CalibrationScreen에서 처리
        console.log('Calibration ready');
    }, []);

    // 세션 시작 및 시선 추적 시작
    const startTracking = useCallback(async () => {
        if (!isCalibrated || !problemId) return;

        try {
            // 백엔드에 모니터링 세션 시작 요청
            const response = await startMonitoringSession(problemId, timeLimitMinutes);
            const newSessionId = response.data?.sessionId || response.sessionId;
            setSessionId(newSessionId);
            setIsTracking(true);

            // 시선 데이터 수집 시작 (5초마다)
            gazeIntervalRef.current = setInterval(() => {
                if (window.webgazer && window.webgazer.isReady()) {
                    window.webgazer.getCurrentPrediction().then((prediction) => {
                        if (prediction) {
                            // 시선이 화면 밖으로 나갔는지 확인
                            const { x, y } = prediction;
                            const isOutOfBounds =
                                x < 0 || x > window.innerWidth ||
                                y < 0 || y > window.innerHeight;

                            if (isOutOfBounds) {
                                // 시선 이탈 위반 전송
                                sendMonitoringViolation(newSessionId, 'GAZE_AWAY', {
                                    description: `Gaze out of bounds: (${x.toFixed(0)}, ${y.toFixed(0)})`,
                                    duration: 5
                                });
                            }
                        } else {
                            // 얼굴 미검출 위반 전송
                            sendMonitoringViolation(newSessionId, 'NO_FACE', {
                                description: 'Face not detected',
                                duration: 5
                            });
                        }
                    });
                }
            }, 5000); // 5초마다 체크

            console.log('🎯 Monitoring session started, sessionId:', newSessionId);
        } catch (error) {
            console.error('Failed to start monitoring session:', error);
        }
    }, [isCalibrated, problemId, timeLimitMinutes]);

    // 추적 종료
    const stopTracking = useCallback(async (remainingSeconds = null) => {
        if (!sessionId) return;

        // 인터벌 정리
        if (gazeIntervalRef.current) {
            clearInterval(gazeIntervalRef.current);
            gazeIntervalRef.current = null;
        }

        try {
            // 백엔드에 모니터링 세션 종료 요청
            await endMonitoringSession(sessionId, remainingSeconds);
            console.log('✅ Monitoring session ended, sessionId:', sessionId);
        } catch (error) {
            console.error('Failed to end monitoring session:', error);
        } finally {
            // 에러가 나더라도 반드시 WebGazer 종료
            if (window.webgazer) {
                try {
                    // 1. 비디오 엘리먼트 참조 미리 확보
                    const videoElement = document.getElementById('webgazerVideoFeed');
                    const stream = videoElement ? videoElement.srcObject : null;

                    // 2. WebGazer 종료
                    window.webgazer.end();

                    // 3. 강제로 비디오 스트림 정지 (WebGazer가 놓친 경우 대비)
                    if (stream) {
                        const tracks = stream.getTracks();
                        tracks.forEach(track => {
                            track.stop();
                            console.log('Forced track stop:', track.label);
                        });
                    }

                    // 4. 비디오 컨테이너 제거
                    const videoContainer = document.getElementById('webgazerVideoContainer');
                    if (videoContainer) {
                        videoContainer.remove();
                    }
                } catch (e) {
                    console.error('Error stopping WebGazer:', e);
                }
                console.log('WebGazer stopped');
            }
            setIsTracking(false);
            setSessionId(null);
        }
    }, [sessionId]);

    // 캘리브레이션 완료 처리
    const completeCalibration = useCallback(() => {
        setIsCalibrated(true);
    }, []);

    // 캘리브레이션 완료 시 자동으로 추적 시작
    useEffect(() => {
        if (isCalibrated && !isTracking && problemId) {
            startTracking();
        }
    }, [isCalibrated, isTracking, problemId, startTracking]);

    return {
        isCalibrated,
        isTracking,
        sessionId,                          // 현재 세션 ID
        monitoringSessionId: sessionId,     // 모니터링 세션 ID (별칭)
        startCalibration,
        completeCalibration,
        stopTracking
    };
};
