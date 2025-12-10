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
 * - [Phase 2] NO_FACE 지속 감지 (15초 이상 시 심각한 위반)
 *
 * @param {number} problemId - 현재 문제 ID
 * @param {boolean} isActive - 추적 활성화 여부
 * @param {number} timeLimitMinutes - 제한 시간 (분, 기본 30분)
 * @returns {object} - { isCalibrated, startCalibration, sessionId, isTracking, monitoringSessionId, noFaceWarning }
 */

// 상수 정의
const NO_FACE_THRESHOLD_MS = 15000; // 15초 이상 NO_FACE 시 심각한 위반
const NO_FACE_WARNING_THRESHOLD_MS = 5000; // 5초 이상 시 경고 표시 시작

export const useEyeTracking = (problemId, isActive = false, timeLimitMinutes = 30) => {
    const [isCalibrated, setIsCalibrated] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const gazeIntervalRef = useRef(null);
    const isCleaningUpRef = useRef(false); // 중복 정리 방지 플래그

    // [Phase 2] NO_FACE 지속 감지 상태
    const noFaceStartTimeRef = useRef(null); // 얼굴 미검출 시작 시간
    const [noFaceDuration, setNoFaceDuration] = useState(0); // 현재 미검출 지속 시간 (ms)
    const [showNoFaceWarning, setShowNoFaceWarning] = useState(false); // 경고 표시 여부
    const warningShownRef = useRef(false); // 경고 표시 중복 방지 (stale closure 방지)
    const sustainedViolationSentRef = useRef(false); // 15초 위반 이벤트 중복 전송 방지

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
                try {
                    // WebGazer가 초기화되었는지 확인 후 종료
                    if (typeof window.webgazer.end === 'function') {
                        window.webgazer.end();
                    }
                } catch (e) {
                    // WebGazer 내부 요소가 이미 제거된 경우 무시
                    console.warn('WebGazer cleanup warning:', e.message);
                }
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

        // 새 세션 시작 시 정리 플래그 리셋
        isCleaningUpRef.current = false;

        try {
            // 백엔드에 모니터링 세션 시작 요청
            const response = await startMonitoringSession(problemId, timeLimitMinutes);
            const newSessionId = response.data?.sessionId || response.sessionId;
            setSessionId(newSessionId);
            setIsTracking(true);

            // 시선 데이터 수집 시작 (1초마다 - NO_FACE 지속 감지를 위해 더 자주 체크)
            gazeIntervalRef.current = setInterval(() => {
                if (window.webgazer && window.webgazer.isReady()) {
                    window.webgazer.getCurrentPrediction().then((prediction) => {
                        if (prediction) {
                            // [Phase 2] 얼굴이 감지됨 - NO_FACE 추적 상태 리셋
                            if (noFaceStartTimeRef.current !== null) {
                                console.log('✅ Face detected - resetting NO_FACE tracking');
                                noFaceStartTimeRef.current = null;
                                setNoFaceDuration(0);
                                setShowNoFaceWarning(false);
                                warningShownRef.current = false;
                                sustainedViolationSentRef.current = false;
                            }

                            // 시선이 화면 밖으로 나갔는지 확인
                            const { x, y } = prediction;
                            const isOutOfBounds =
                                x < 0 || x > window.innerWidth ||
                                y < 0 || y > window.innerHeight;

                            if (isOutOfBounds) {
                                // 시선 이탈 위반 전송 (에러 발생해도 무시)
                                sendMonitoringViolation(newSessionId, 'GAZE_AWAY', {
                                    description: `Gaze out of bounds: (${x.toFixed(0)}, ${y.toFixed(0)})`,
                                    duration: 1
                                }).catch(err => {
                                    console.warn('GAZE_AWAY violation send failed (non-critical):', err);
                                });
                            }
                        } else {
                            // [Phase 2] 얼굴 미검출 - 지속 시간 추적
                            const now = Date.now();

                            if (noFaceStartTimeRef.current === null) {
                                // 미검출 시작 시간 기록
                                noFaceStartTimeRef.current = now;
                                console.log('⚠️ Face not detected - starting NO_FACE tracking');
                            }

                            // 지속 시간 계산
                            const duration = now - noFaceStartTimeRef.current;
                            setNoFaceDuration(duration);

                            // 5초 이상: 경고 표시 시작
                            if (duration >= NO_FACE_WARNING_THRESHOLD_MS && !warningShownRef.current) {
                                warningShownRef.current = true;
                                setShowNoFaceWarning(true);
                                console.log('⚠️ NO_FACE warning shown (5+ seconds)');

                                // 경고 시작 시 백엔드에 warning 기록 (sessionId만 전달)
                                if (newSessionId) {
                                    recordMonitoringWarning(newSessionId).catch(err => {
                                        console.warn('Warning record failed (non-critical):', err);
                                    });
                                }
                            }

                            // 15초 이상: 심각한 위반 전송 (1회만)
                            if (duration >= NO_FACE_THRESHOLD_MS && !sustainedViolationSentRef.current) {
                                sustainedViolationSentRef.current = true;
                                console.log('🚨 NO_FACE_SUSTAINED violation sent (15+ seconds)');

                                // 403 에러 시에도 페이지 리다이렉트 방지
                                sendMonitoringViolation(newSessionId, 'NO_FACE_SUSTAINED', {
                                    description: `Face not detected for ${Math.round(duration / 1000)} seconds - serious violation`,
                                    duration: Math.round(duration / 1000),
                                    severity: 'HIGH'
                                }).catch(err => {
                                    console.warn('NO_FACE_SUSTAINED violation send failed (non-critical):', err);
                                });
                            }
                        }
                    });
                }
            }, 1000); // 1초마다 체크 (NO_FACE 지속 감지를 위해)

            console.log('🎯 Monitoring session started, sessionId:', newSessionId);
        } catch (error) {
            console.error('Failed to start monitoring session:', error);
        }
    }, [isCalibrated, problemId, timeLimitMinutes]);

    // 추적 종료 (WebGazer 정리는 sessionId와 관계없이 항상 실행)
    const stopTracking = useCallback(async (remainingSeconds = null) => {
        // 중복 호출 방지
        if (isCleaningUpRef.current) {
            console.log('⚠️ stopTracking already in progress, skipping...');
            return;
        }
        isCleaningUpRef.current = true;

        try {
            // 인터벌 정리 (항상 실행)
            if (gazeIntervalRef.current) {
                clearInterval(gazeIntervalRef.current);
                gazeIntervalRef.current = null;
            }

            // 세션 종료 요청 (sessionId가 있을 때만)
            if (sessionId) {
                try {
                    await endMonitoringSession(sessionId, remainingSeconds);
                    console.log('✅ Monitoring session ended, sessionId:', sessionId);
                } catch (error) {
                    console.error('Failed to end monitoring session:', error);
                }
            }

            // WebGazer 및 웹캠 정리 (항상 실행)
            // 1. 먼저 비디오 스트림 정리 (WebGazer.end() 에러 방지)
            try {
                const videoElement = document.getElementById('webgazerVideoFeed');
                if (videoElement?.srcObject) {
                    const tracks = videoElement.srcObject.getTracks();
                    tracks.forEach(track => {
                        track.stop();
                        console.log('Forced track stop:', track.label);
                    });
                    videoElement.srcObject = null;
                }

                // 모든 video 요소의 스트림 정리
                const allVideos = document.querySelectorAll('video');
                allVideos.forEach(video => {
                    if (video.srcObject) {
                        const tracks = video.srcObject.getTracks();
                        tracks.forEach(track => {
                            track.stop();
                            console.log('Additional track stopped:', track.label);
                        });
                        video.srcObject = null;
                    }
                });
            } catch (e) {
                console.warn('Error cleaning up video streams:', e.message);
            }

            // 2. WebGazer 종료 (내부 요소가 없어도 안전하게 처리)
            if (window.webgazer) {
                try {
                    if (typeof window.webgazer.end === 'function') {
                        window.webgazer.end();
                    }
                } catch (e) {
                    // WebGazer 내부 요소가 이미 제거된 경우 무시
                    console.warn('WebGazer.end() warning (safe to ignore):', e.message);
                }
            }

            // 3. 비디오 컨테이너 DOM 제거
            try {
                const videoContainer = document.getElementById('webgazerVideoContainer');
                if (videoContainer) {
                    videoContainer.remove();
                }
            } catch (e) {
                console.warn('Error removing video container:', e.message);
            }

            console.log('✅ WebGazer and webcam stopped');

            setIsTracking(false);
            setSessionId(null);

            // [Phase 2] NO_FACE 추적 상태 리셋
            noFaceStartTimeRef.current = null;
            setNoFaceDuration(0);
            setShowNoFaceWarning(false);
            warningShownRef.current = false;
            sustainedViolationSentRef.current = false;
        } finally {
            // 정리 완료 후 플래그는 리셋하지 않음 (한 번만 호출되도록)
            // 새로운 세션 시작 시 startTracking에서 리셋
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
        stopTracking,
        // [Phase 2] NO_FACE 지속 감지 상태
        noFaceDuration,                     // 현재 얼굴 미검출 지속 시간 (ms)
        showNoFaceWarning,                  // NO_FACE 경고 표시 여부
        noFaceProgress: noFaceDuration / NO_FACE_THRESHOLD_MS  // 위반 진행률 (0~1)
    };
};
