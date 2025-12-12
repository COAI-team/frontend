import { useState, useEffect, useCallback, useRef } from 'react';
import {
    startMonitoringSession,
    sendMonitoringViolation,
    endMonitoringSession,
    recordMonitoringWarning
} from '../../service/algorithm/algorithmApi';

/**
 * MediaPipe 기반 시선/얼굴 추적 커스텀 훅
 *
 * WebGazer 대안으로 MediaPipe Face Landmarker 사용
 * 추가 기능: 졸음 감지, 다중 인물 감지, 3D 얼굴 방향, 홍채 추적
 *
 * @param {number} problemId - 현재 문제 ID
 * @param {boolean} isActive - 추적 활성화 여부
 * @param {number} timeLimitMinutes - 제한 시간 (분, 기본 30분)
 * @returns {object} - 추적 상태 및 제어 함수
 */

// 상수 정의
const NO_FACE_THRESHOLD_MS = 15000; // 15초 이상 NO_FACE 시 심각한 위반
const NO_FACE_WARNING_THRESHOLD_MS = 5000; // 5초 이상 시 경고 표시 시작

// 졸음 감지 상수
const EAR_THRESHOLD = 0.20; // Eye Aspect Ratio 임계값 (눈 감김 판단) - 0.25에서 하향 (더 확실한 눈 감김만 감지)
const DROWSY_FRAME_THRESHOLD = 90; // 연속 프레임 수 (90프레임 ≈ 3초) - 30에서 상향 (오탐 감소)
const PERCLOS_THRESHOLD = 0.8; // PERCLOS 임계값 (80% 이상 시 졸음)
const PERCLOS_WINDOW_SECONDS = 60; // PERCLOS 계산 윈도우 (60초)

// MediaPipe 랜드마크 인덱스 (478개 중 주요 포인트)
const LANDMARK_INDICES = {
    // 눈 (Eye Aspect Ratio 계산용)
    LEFT_EYE: {
        P1: 33,   // 왼쪽 끝
        P2: 160,  // 상단 1
        P3: 158,  // 상단 2
        P4: 133,  // 오른쪽 끝
        P5: 153,  // 하단 1
        P6: 144   // 하단 2
    },
    RIGHT_EYE: {
        P1: 362,  // 왼쪽 끝
        P2: 385,  // 상단 1
        P3: 387,  // 상단 2
        P4: 263,  // 오른쪽 끝
        P5: 373,  // 하단 1
        P6: 380   // 하단 2
    },
    // 홍채 (Iris)
    LEFT_IRIS: [468, 469, 470, 471, 472],  // 왼쪽 홍채 중심 및 주변
    RIGHT_IRIS: [473, 474, 475, 476, 477], // 오른쪽 홍채 중심 및 주변
    // 얼굴 방향 계산용
    NOSE_TIP: 1,
    CHIN: 152,
    LEFT_EYE_OUTER: 33,
    RIGHT_EYE_OUTER: 263,
    LEFT_MOUTH_CORNER: 61,
    RIGHT_MOUTH_CORNER: 291
};

// 유틸리티: 두 점 사이 거리 계산
const distance = (p1, p2) => {
    return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) +
        Math.pow(p2.y - p1.y, 2) +
        Math.pow((p2.z || 0) - (p1.z || 0), 2)
    );
};

// Eye Aspect Ratio (EAR) 계산
const calculateEAR = (eyeLandmarks) => {
    const { P1, P2, P3, P4, P5, P6 } = eyeLandmarks;
    const vertical1 = distance(P2, P6);
    const vertical2 = distance(P3, P5);
    const horizontal = distance(P1, P4);
    return (vertical1 + vertical2) / (2.0 * horizontal);
};

export const useMediaPipeTracking = (problemId, isActive = false, timeLimitMinutes = 30) => {
    // 기본 상태
    const [isCalibrated, setIsCalibrated] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    // NO_FACE 상태
    const noFaceStartTimeRef = useRef(null);
    const [noFaceDuration, setNoFaceDuration] = useState(0);
    const [showNoFaceWarning, setShowNoFaceWarning] = useState(false);
    const warningShownRef = useRef(false);
    const sustainedViolationSentRef = useRef(false);

    // 디버그 모드
    const [debugMode, setDebugMode] = useState(false);
    const debugModeRef = useRef(false); // tracking loop에서 사용할 ref
    const [isFaceDetected, setIsFaceDetected] = useState(true);

    // MediaPipe 관련 상태
    const faceLandmarkerRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const isCleaningUpRef = useRef(false);

    // 추가 기능 상태 - UI 표시용 (throttled update)
    const [detectedFaces, setDetectedFaces] = useState([]); // 다중 인물
    const [faceCount, setFaceCount] = useState(0);
    const [headPose, setHeadPose] = useState({ pitch: 0, yaw: 0, roll: 0 }); // 3D 얼굴 방향
    const [gazePosition, setGazePosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 }); // 시선 위치
    const [eyeState, setEyeState] = useState({ leftEAR: null, rightEAR: null, avgEAR: null, isBlinking: false, faceDetected: false });
    const [irisPosition, setIrisPosition] = useState({ left: null, right: null });

    // 졸음 감지 상태
    const [drowsinessState, setDrowsinessState] = useState({
        isDrowsy: false,
        perclos: 0,
        consecutiveClosedFrames: 0
    });
    const closedFrameCountRef = useRef(0);
    const earHistoryRef = useRef([]); // PERCLOS 계산용
    const drowsyViolationSentRef = useRef(false);

    // 고빈도 데이터를 위한 refs (setState 호출 최소화 - Maximum update depth 방지)
    const latestDataRef = useRef({
        isFaceDetected: false,
        faceCount: 0,
        detectedFaces: [],
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        gazePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        eyeState: { leftEAR: null, rightEAR: null, avgEAR: null, isBlinking: false, faceDetected: false },
        irisPosition: { left: null, right: null },
        drowsinessState: { isDrowsy: false, perclos: 0, consecutiveClosedFrames: 0 },
        noFaceDuration: 0,
        showNoFaceWarning: false
    });
    const lastStateUpdateRef = useRef(0);
    const STATE_UPDATE_INTERVAL_MS = 100; // 100ms마다 상태 업데이트 (10fps - UI에 충분)

    // MediaPipe FaceLandmarker 초기화
    useEffect(() => {
        if (!isActive) return;

        const initMediaPipe = async () => {
            try {
                // MediaPipe Vision 동적 로드
                const vision = await import('@mediapipe/tasks-vision');
                const { FaceLandmarker, FilesetResolver } = vision;

                // WASM 파일 로드
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
                );

                // FaceLandmarker 생성
                const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        delegate: 'GPU' // GPU 가속 사용
                    },
                    outputFaceBlendshapes: true, // 표정 분석
                    outputFacialTransformationMatrixes: true, // 3D 변환 행렬
                    runningMode: 'VIDEO',
                    numFaces: 5 // 최대 5명 감지
                });

                faceLandmarkerRef.current = faceLandmarker;
                console.log('✅ MediaPipe FaceLandmarker initialized');
            } catch (error) {
                console.error('❌ MediaPipe initialization failed:', error);
            }
        };

        initMediaPipe();

        return () => {
            if (faceLandmarkerRef.current) {
                faceLandmarkerRef.current.close();
                faceLandmarkerRef.current = null;
            }
        };
    }, [isActive]);

    // 웹캠 스트림 설정
    const setupWebcam = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            // 비디오 엘리먼트 생성
            const video = document.createElement('video');
            video.id = 'mediapipeVideoFeed';
            video.srcObject = stream;
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;

            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });

            videoRef.current = video;

            // 캔버스 생성 (디버그 오버레이용)
            const canvas = document.createElement('canvas');
            canvas.id = 'mediapipeOverlay';
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvasRef.current = canvas;

            console.log('✅ Webcam stream ready:', video.videoWidth, 'x', video.videoHeight);
            return true;
        } catch (error) {
            console.error('❌ Webcam setup failed:', error);
            return false;
        }
    }, []);

    // 3D 얼굴 방향 계산 (Pitch, Yaw, Roll)
    const calculateHeadPose = useCallback((landmarks) => {
        if (!landmarks || landmarks.length === 0) return { pitch: 0, yaw: 0, roll: 0 };

        const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
        const chin = landmarks[LANDMARK_INDICES.CHIN];
        const leftEye = landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER];
        const rightEye = landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER];

        // Yaw (좌우 회전) - 코와 양 눈 중심 비교
        const eyeCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2,
            z: ((leftEye.z || 0) + (rightEye.z || 0)) / 2
        };
        const yaw = Math.atan2(noseTip.x - eyeCenter.x, noseTip.z - eyeCenter.z) * (180 / Math.PI);

        // Pitch (상하 회전) - 코와 턱 비교
        const pitch = Math.atan2(noseTip.y - chin.y, noseTip.z - chin.z) * (180 / Math.PI);

        // Roll (기울기) - 양 눈의 높이 차이
        const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

        return { pitch, yaw, roll };
    }, []);

    // 홍채 기반 시선 추정 (개선된 공식)
    const estimateGazeFromIris = useCallback((landmarks, videoWidth, videoHeight) => {
        if (!landmarks || landmarks.length < 478) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // 왼쪽 홍채 중심
        const leftIrisCenter = landmarks[LANDMARK_INDICES.LEFT_IRIS[0]];
        // 오른쪽 홍채 중심
        const rightIrisCenter = landmarks[LANDMARK_INDICES.RIGHT_IRIS[0]];

        // 홍채 중심 평균
        const irisCenter = {
            x: (leftIrisCenter.x + rightIrisCenter.x) / 2,
            y: (leftIrisCenter.y + rightIrisCenter.y) / 2
        };

        // 왼쪽/오른쪽 눈의 경계
        const leftEyeLeft = landmarks[LANDMARK_INDICES.LEFT_EYE.P1];
        const leftEyeRight = landmarks[LANDMARK_INDICES.LEFT_EYE.P4];
        const rightEyeLeft = landmarks[LANDMARK_INDICES.RIGHT_EYE.P1];
        const rightEyeRight = landmarks[LANDMARK_INDICES.RIGHT_EYE.P4];

        // 눈 너비 계산 (정규화 기준)
        const leftEyeWidth = Math.abs(leftEyeRight.x - leftEyeLeft.x);
        const rightEyeWidth = Math.abs(rightEyeRight.x - rightEyeLeft.x);
        const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;

        // 눈 영역 중심
        const eyeRegionCenter = {
            x: (leftEyeLeft.x + leftEyeRight.x + rightEyeLeft.x + rightEyeRight.x) / 4,
            y: (leftEyeLeft.y + leftEyeRight.y + rightEyeLeft.y + rightEyeRight.y) / 4
        };

        // 홍채 오프셋을 눈 너비 대비 비율로 정규화 (-1 ~ +1 범위)
        const normalizedOffsetX = avgEyeWidth > 0
            ? (irisCenter.x - eyeRegionCenter.x) / (avgEyeWidth / 2)
            : 0;
        const normalizedOffsetY = avgEyeWidth > 0
            ? (irisCenter.y - eyeRegionCenter.y) / (avgEyeWidth / 2)
            : 0;

        // 감도 조절 (화면 범위의 비율)
        const GAZE_SENSITIVITY_X = 0.5; // 화면 너비의 50%까지 커버
        const GAZE_SENSITIVITY_Y = 0.4; // 화면 높이의 40%까지 커버

        // 화면 좌표 변환 (거울 모드: x축 반전 - 사용자 시점에서 자연스럽게)
        // 웹캠 좌표계에서 오른쪽이 화면 좌측에 매핑되도록 반전
        const gazeX = window.innerWidth / 2 - normalizedOffsetX * window.innerWidth * GAZE_SENSITIVITY_X;
        const gazeY = window.innerHeight / 2 + normalizedOffsetY * window.innerHeight * GAZE_SENSITIVITY_Y;

        // 경계 클램핑
        return {
            x: Math.max(0, Math.min(gazeX, window.innerWidth)),
            y: Math.max(0, Math.min(gazeY, window.innerHeight))
        };
    }, []);

    // EAR 기반 눈 상태 분석
    const analyzeEyeState = useCallback((landmarks) => {
        if (!landmarks || landmarks.length < 478) {
            // 얼굴 미검출 시 null 반환 (졸음 감지에서 구분하기 위함)
            return { leftEAR: null, rightEAR: null, avgEAR: null, isBlinking: false, faceDetected: false };
        }

        // 왼쪽 눈 랜드마크 추출
        const leftEyePoints = {
            P1: landmarks[LANDMARK_INDICES.LEFT_EYE.P1],
            P2: landmarks[LANDMARK_INDICES.LEFT_EYE.P2],
            P3: landmarks[LANDMARK_INDICES.LEFT_EYE.P3],
            P4: landmarks[LANDMARK_INDICES.LEFT_EYE.P4],
            P5: landmarks[LANDMARK_INDICES.LEFT_EYE.P5],
            P6: landmarks[LANDMARK_INDICES.LEFT_EYE.P6]
        };

        // 오른쪽 눈 랜드마크 추출
        const rightEyePoints = {
            P1: landmarks[LANDMARK_INDICES.RIGHT_EYE.P1],
            P2: landmarks[LANDMARK_INDICES.RIGHT_EYE.P2],
            P3: landmarks[LANDMARK_INDICES.RIGHT_EYE.P3],
            P4: landmarks[LANDMARK_INDICES.RIGHT_EYE.P4],
            P5: landmarks[LANDMARK_INDICES.RIGHT_EYE.P5],
            P6: landmarks[LANDMARK_INDICES.RIGHT_EYE.P6]
        };

        const leftEAR = calculateEAR(leftEyePoints);
        const rightEAR = calculateEAR(rightEyePoints);
        const avgEAR = (leftEAR + rightEAR) / 2;
        const isBlinking = avgEAR < EAR_THRESHOLD;

        return { leftEAR, rightEAR, avgEAR, isBlinking, faceDetected: true };
    }, []);

    // 졸음 감지 (PERCLOS 기반) - 얼굴이 감지된 경우만 기록
    const detectDrowsiness = useCallback((avgEAR) => {
        // 얼굴 미검출 시 (avgEAR === null) 졸음 감지 스킵
        // 중요: 얼굴 미검출은 눈 감음으로 처리하지 않음!
        if (avgEAR === null) {
            // 연속 눈 감김 카운터 리셋 (얼굴 미검출은 눈 감김이 아님)
            closedFrameCountRef.current = 0;
            return {
                isDrowsy: false,
                perclos: earHistoryRef.current.length > 0
                    ? earHistoryRef.current.filter(e => e.ear < EAR_THRESHOLD).length / earHistoryRef.current.length
                    : 0,
                consecutiveClosedFrames: 0
            };
        }

        const now = Date.now();

        // EAR 기록 추가
        earHistoryRef.current.push({ ear: avgEAR, timestamp: now });

        // 윈도우 외부 데이터 제거
        const windowStart = now - PERCLOS_WINDOW_SECONDS * 1000;
        earHistoryRef.current = earHistoryRef.current.filter(
            entry => entry.timestamp >= windowStart
        );

        // PERCLOS 계산 (눈 감은 비율)
        const totalFrames = earHistoryRef.current.length;
        if (totalFrames === 0) return { isDrowsy: false, perclos: 0, consecutiveClosedFrames: 0 };

        const closedFrames = earHistoryRef.current.filter(
            entry => entry.ear < EAR_THRESHOLD
        ).length;
        const perclos = closedFrames / totalFrames;

        // 연속 눈 감김 프레임 카운트
        if (avgEAR < EAR_THRESHOLD) {
            closedFrameCountRef.current++;
        } else {
            closedFrameCountRef.current = 0;
        }

        const isDrowsy = perclos >= PERCLOS_THRESHOLD ||
            closedFrameCountRef.current >= DROWSY_FRAME_THRESHOLD;

        return {
            isDrowsy,
            perclos,
            consecutiveClosedFrames: closedFrameCountRef.current
        };
    }, []);

    // 홍채 위치 추출
    const extractIrisPosition = useCallback((landmarks) => {
        if (!landmarks || landmarks.length < 478) {
            return { left: null, right: null };
        }

        const leftIris = LANDMARK_INDICES.LEFT_IRIS.map(idx => landmarks[idx]);
        const rightIris = LANDMARK_INDICES.RIGHT_IRIS.map(idx => landmarks[idx]);

        return {
            left: {
                center: leftIris[0],
                points: leftIris
            },
            right: {
                center: rightIris[0],
                points: rightIris
            }
        };
    }, []);

    // Throttled 상태 업데이트 함수 (Maximum update depth 방지)
    const updateReactState = useCallback(() => {
        const data = latestDataRef.current;
        setIsFaceDetected(data.isFaceDetected);
        setFaceCount(data.faceCount);
        setDetectedFaces(data.detectedFaces);
        setHeadPose(data.headPose);
        setGazePosition(data.gazePosition);
        setEyeState(data.eyeState);
        setIrisPosition(data.irisPosition);
        setDrowsinessState(data.drowsinessState);
        setNoFaceDuration(data.noFaceDuration);
        setShowNoFaceWarning(data.showNoFaceWarning);
    }, []);

    // 메인 추적 루프 (ref 기반 - setState 최소화)
    const trackingLoop = useCallback(async () => {
        if (!faceLandmarkerRef.current || !videoRef.current || isCleaningUpRef.current) {
            return;
        }

        const video = videoRef.current;
        const now = performance.now();

        try {
            const results = faceLandmarkerRef.current.detectForVideo(video, now);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                // 얼굴 감지됨 - ref에 저장 (리렌더링 없음)
                latestDataRef.current.isFaceDetected = true;
                latestDataRef.current.faceCount = results.faceLandmarks.length;
                latestDataRef.current.detectedFaces = results.faceLandmarks;

                // 첫 번째 얼굴 기준 분석
                const primaryLandmarks = results.faceLandmarks[0];

                // 3D 얼굴 방향
                latestDataRef.current.headPose = calculateHeadPose(primaryLandmarks);

                // 시선 추정
                latestDataRef.current.gazePosition = estimateGazeFromIris(primaryLandmarks, video.videoWidth, video.videoHeight);

                // 눈 상태 분석
                const eye = analyzeEyeState(primaryLandmarks);
                latestDataRef.current.eyeState = eye;

                // 홍채 위치
                latestDataRef.current.irisPosition = extractIrisPosition(primaryLandmarks);

                // 졸음 감지
                const drowsiness = detectDrowsiness(eye.avgEAR);
                latestDataRef.current.drowsinessState = drowsiness;

                // NO_FACE 리셋 (이전에 얼굴이 없었다가 감지된 경우만 로그)
                if (noFaceStartTimeRef.current !== null) {
                    console.log('✅ Face detected - resetting NO_FACE tracking');
                    noFaceStartTimeRef.current = null;
                    latestDataRef.current.noFaceDuration = 0;
                    latestDataRef.current.showNoFaceWarning = false;
                    warningShownRef.current = false;
                    sustainedViolationSentRef.current = false;
                }

                // 다중 인물 경고 (2명 이상)
                if (results.faceLandmarks.length > 1 && sessionId) {
                    sendMonitoringViolation(sessionId, 'MULTIPLE_FACES', {
                        description: `Multiple faces detected: ${results.faceLandmarks.length} people`,
                        faceCount: results.faceLandmarks.length
                    }).catch(err => {
                        console.warn('MULTIPLE_FACES violation send failed:', err);
                    });
                }

                // 졸음 위반 전송 (1회)
                if (drowsiness.isDrowsy && !drowsyViolationSentRef.current && sessionId) {
                    drowsyViolationSentRef.current = true;
                    sendMonitoringViolation(sessionId, 'DROWSINESS_DETECTED', {
                        description: `Drowsiness detected - PERCLOS: ${(drowsiness.perclos * 100).toFixed(1)}%`,
                        perclos: drowsiness.perclos
                    }).catch(err => {
                        console.warn('DROWSINESS violation send failed:', err);
                    });
                }

                // 졸음 상태 해제 시 플래그 리셋
                if (!drowsiness.isDrowsy && drowsyViolationSentRef.current) {
                    drowsyViolationSentRef.current = false;
                }

            } else {
                // 얼굴 미검출 - ref에 저장
                latestDataRef.current.isFaceDetected = false;
                latestDataRef.current.faceCount = 0;
                latestDataRef.current.detectedFaces = [];

                // NO_FACE 지속 시간 추적
                const currentTime = Date.now();
                if (noFaceStartTimeRef.current === null) {
                    noFaceStartTimeRef.current = currentTime;
                    console.log('⚠️ Face not detected - starting NO_FACE tracking');
                }

                const duration = currentTime - noFaceStartTimeRef.current;
                // ref에 저장 (throttled 업데이트에서 React 상태로 반영됨)
                latestDataRef.current.noFaceDuration = duration;

                // 5초 이상: 경고 표시
                if (duration >= NO_FACE_WARNING_THRESHOLD_MS && !warningShownRef.current) {
                    warningShownRef.current = true;
                    latestDataRef.current.showNoFaceWarning = true;
                    console.log('⚠️ NO_FACE warning shown (5+ seconds)');

                    if (sessionId) {
                        recordMonitoringWarning(sessionId).catch(err => {
                            console.warn('Warning record failed:', err);
                        });
                    }
                }

                // 15초 이상: 심각한 위반
                if (duration >= NO_FACE_THRESHOLD_MS && !sustainedViolationSentRef.current && sessionId) {
                    sustainedViolationSentRef.current = true;
                    console.log('🚨 NO_FACE_SUSTAINED violation sent (15+ seconds)');

                    sendMonitoringViolation(sessionId, 'NO_FACE_SUSTAINED', {
                        description: `Face not detected for ${Math.round(duration / 1000)} seconds - serious violation`,
                        duration: Math.round(duration / 1000),
                        severity: 'HIGH'
                    }).catch(err => {
                        console.warn('NO_FACE_SUSTAINED violation send failed:', err);
                    });
                }
            }

            // Throttled 상태 업데이트 (100ms마다 = 10fps)
            if (now - lastStateUpdateRef.current >= STATE_UPDATE_INTERVAL_MS) {
                lastStateUpdateRef.current = now;
                updateReactState();
            }

            // 디버그 오버레이 그리기 (ref 사용으로 최신 상태 반영)
            if (debugModeRef.current && canvasRef.current) {
                drawDebugOverlay(results);
            }

        } catch (error) {
            console.error('Tracking loop error:', error);
        }

        // 다음 프레임 예약
        if (!isCleaningUpRef.current) {
            animationFrameRef.current = requestAnimationFrame(trackingLoop);
        }
    }, [
        sessionId,
        calculateHeadPose,
        estimateGazeFromIris,
        analyzeEyeState,
        extractIrisPosition,
        detectDrowsiness,
        updateReactState
    ]);

    // 디버그 오버레이 그리기
    const drawDebugOverlay = useCallback((results) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) {
            console.warn('drawDebugOverlay: canvas or video not ready', { canvas: !!canvas, video: !!video });
            return;
        }

        // 캔버스 크기가 비디오와 맞지 않으면 조정
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 비디오 그리기 (거울 모드) - 항상 그리기
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        if (results && results.faceLandmarks) {
            results.faceLandmarks.forEach((landmarks, faceIndex) => {
                const color = faceIndex === 0 ? '#22c55e' : '#f59e0b'; // 첫 번째: 초록, 나머지: 주황

                // 모든 랜드마크 그리기
                landmarks.forEach((landmark, idx) => {
                    const x = (1 - landmark.x) * canvas.width; // 거울 모드
                    const y = landmark.y * canvas.height;

                    // 홍채 포인트는 빨간색으로
                    const isIris = [...LANDMARK_INDICES.LEFT_IRIS, ...LANDMARK_INDICES.RIGHT_IRIS].includes(idx);
                    ctx.fillStyle = isIris ? '#ef4444' : color;
                    ctx.beginPath();
                    ctx.arc(x, y, isIris ? 3 : 1, 0, 2 * Math.PI);
                    ctx.fill();
                });

                // 눈 영역 표시
                const leftEye = [
                    LANDMARK_INDICES.LEFT_EYE.P1,
                    LANDMARK_INDICES.LEFT_EYE.P2,
                    LANDMARK_INDICES.LEFT_EYE.P3,
                    LANDMARK_INDICES.LEFT_EYE.P4,
                    LANDMARK_INDICES.LEFT_EYE.P5,
                    LANDMARK_INDICES.LEFT_EYE.P6
                ];
                const rightEye = [
                    LANDMARK_INDICES.RIGHT_EYE.P1,
                    LANDMARK_INDICES.RIGHT_EYE.P2,
                    LANDMARK_INDICES.RIGHT_EYE.P3,
                    LANDMARK_INDICES.RIGHT_EYE.P4,
                    LANDMARK_INDICES.RIGHT_EYE.P5,
                    LANDMARK_INDICES.RIGHT_EYE.P6
                ];

                [leftEye, rightEye].forEach(eyeIndices => {
                    ctx.beginPath();
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 2;
                    eyeIndices.forEach((idx, i) => {
                        const lm = landmarks[idx];
                        const x = (1 - lm.x) * canvas.width;
                        const y = lm.y * canvas.height;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.closePath();
                    ctx.stroke();
                });
            });
        }

        // 정보 오버레이 (ref에서 최신 데이터 읽기 - 리렌더링 의존성 제거)
        const data = latestDataRef.current;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 260, 180);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';

        // null 안전 처리
        const leftEAR = data.eyeState?.leftEAR;
        const rightEAR = data.eyeState?.rightEAR;
        const earText = leftEAR !== null && leftEAR !== undefined
            ? `L=${leftEAR.toFixed(3)} R=${rightEAR.toFixed(3)}`
            : 'N/A (no face)';

        const lines = [
            `Faces: ${data.faceCount}`,
            `Face Detected: ${data.isFaceDetected ? '✅ YES' : '❌ NO'}`,
            `EAR: ${earText}`,
            `Blink: ${data.eyeState?.isBlinking ? 'YES' : 'NO'}`,
            `PERCLOS: ${(data.drowsinessState?.perclos * 100 || 0).toFixed(1)}%`,
            `Drowsy: ${data.drowsinessState?.isDrowsy ? '⚠️ YES' : 'NO'}`,
            `Head: P=${data.headPose?.pitch?.toFixed(1) || 0}° Y=${data.headPose?.yaw?.toFixed(1) || 0}° R=${data.headPose?.roll?.toFixed(1) || 0}°`,
            `Gaze: (${Math.round(data.gazePosition?.x || 0)}, ${Math.round(data.gazePosition?.y || 0)})`
        ];

        lines.forEach((line, i) => {
            ctx.fillText(line, 20, 30 + i * 18);
        });

    }, []); // 의존성 제거 - ref 사용으로 항상 최신 데이터

    // 캘리브레이션 시작 (MediaPipe는 캘리브레이션 불필요)
    const startCalibration = useCallback(() => {
        console.log('MediaPipe calibration ready (no calibration needed)');
    }, []);

    // 캘리브레이션 완료
    const completeCalibration = useCallback(() => {
        setIsCalibrated(true);
    }, []);

    // 추적 시작
    const startTracking = useCallback(async () => {
        if (!isCalibrated || !problemId) return;

        isCleaningUpRef.current = false;

        // 웹캠 설정
        const webcamReady = await setupWebcam();
        if (!webcamReady) {
            console.error('Failed to setup webcam');
            return;
        }

        try {
            // 세션 시작
            const response = await startMonitoringSession(problemId, timeLimitMinutes);
            const newSessionId = response.data?.sessionId || response.sessionId;
            setSessionId(newSessionId);
            setIsTracking(true);

            console.log('🎯 MediaPipe monitoring session started, sessionId:', newSessionId);

            // 추적 루프 시작
            trackingLoop();

        } catch (error) {
            console.error('Failed to start monitoring session:', error);
        }
    }, [isCalibrated, problemId, timeLimitMinutes, setupWebcam, trackingLoop]);

    // 추적 종료
    const stopTracking = useCallback(async (remainingSeconds = null) => {
        if (isCleaningUpRef.current) {
            console.log('⚠️ stopTracking already in progress, skipping...');
            return;
        }
        isCleaningUpRef.current = true;

        try {
            // 애니메이션 프레임 취소
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            // 세션 종료
            if (sessionId) {
                try {
                    await endMonitoringSession(sessionId, remainingSeconds);
                    console.log('✅ Monitoring session ended, sessionId:', sessionId);
                } catch (error) {
                    console.error('Failed to end monitoring session:', error);
                }
            }

            // 웹캠 스트림 정리
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }

            // DOM 요소 정리
            const debugContainer = document.getElementById('mediapipeDebugContainer');
            if (debugContainer) {
                debugContainer.remove();
            }

            // 시선 도트 제거
            const gazeDot = document.getElementById('mediapipeGazeDot');
            if (gazeDot) {
                gazeDot.remove();
            }

            console.log('✅ MediaPipe tracking stopped');

            setIsTracking(false);
            setSessionId(null);

            // 상태 리셋
            noFaceStartTimeRef.current = null;
            latestDataRef.current.noFaceDuration = 0;
            latestDataRef.current.showNoFaceWarning = false;
            setNoFaceDuration(0);
            setShowNoFaceWarning(false);
            warningShownRef.current = false;
            sustainedViolationSentRef.current = false;
            drowsyViolationSentRef.current = false;
            earHistoryRef.current = [];
            closedFrameCountRef.current = 0;

        } catch (error) {
            console.error('Error during stopTracking:', error);
        }
    }, [sessionId]);

    // 디버그 모드 토글
    const toggleDebugMode = useCallback(() => {
        const newDebugMode = !debugModeRef.current;
        debugModeRef.current = newDebugMode; // ref 즉시 업데이트 (tracking loop에서 사용)
        setDebugMode(newDebugMode); // 상태도 업데이트 (UI 반영)

        if (newDebugMode) {
            // 디버그 컨테이너 생성
            setTimeout(() => {
                let container = document.getElementById('mediapipeDebugContainer');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'mediapipeDebugContainer';
                    container.style.cssText = `
                        position: fixed;
                        top: 120px;
                        left: 20px;
                        z-index: 10000;
                        border: 4px solid #22c55e;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
                        background: #18181b;
                        width: 320px;
                        height: 240px;
                    `;
                    document.body.appendChild(container);
                }

                // 캔버스가 없으면 생성
                if (!canvasRef.current && videoRef.current) {
                    const canvas = document.createElement('canvas');
                    canvas.id = 'mediapipeOverlay';
                    canvas.width = videoRef.current.videoWidth || 640;
                    canvas.height = videoRef.current.videoHeight || 480;
                    canvasRef.current = canvas;
                }

                if (canvasRef.current) {
                    canvasRef.current.style.cssText = `
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    `;
                    // 이미 컨테이너에 있는지 확인
                    if (!container.contains(canvasRef.current)) {
                        container.appendChild(canvasRef.current);
                    }
                }

                // 시선 도트 생성
                let gazeDot = document.getElementById('mediapipeGazeDot');
                if (!gazeDot) {
                    gazeDot = document.createElement('div');
                    gazeDot.id = 'mediapipeGazeDot';
                    gazeDot.style.cssText = `
                        position: fixed;
                        width: 40px;
                        height: 40px;
                        margin-left: -20px;
                        margin-top: -20px;
                        border-radius: 50%;
                        background: #ef4444;
                        border: 4px solid #ffffff;
                        box-shadow: 0 0 30px rgba(239, 68, 68, 1), 0 0 60px rgba(239, 68, 68, 0.5);
                        pointer-events: none;
                        z-index: 999999;
                        transition: left 0.05s ease-out, top 0.05s ease-out;
                    `;
                    document.body.appendChild(gazeDot);
                }

                console.log('🔧 MediaPipe Debug mode ON', {
                    hasVideo: !!videoRef.current,
                    hasCanvas: !!canvasRef.current,
                    videoSize: videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : 'N/A'
                });
            }, 100);
        } else {
            // 디버그 요소 제거 (캔버스는 유지, 컨테이너만 제거)
            const container = document.getElementById('mediapipeDebugContainer');
            if (container) {
                // 캔버스를 컨테이너에서 분리 (삭제하지 않음)
                if (canvasRef.current && container.contains(canvasRef.current)) {
                    container.removeChild(canvasRef.current);
                }
                container.remove();
            }

            const gazeDot = document.getElementById('mediapipeGazeDot');
            if (gazeDot) gazeDot.remove();

            console.log('🔧 MediaPipe Debug mode OFF');
        }
    }, []);

    // 시선 도트 위치 업데이트
    useEffect(() => {
        if (!debugMode) return;

        const gazeDot = document.getElementById('mediapipeGazeDot');
        if (gazeDot && gazePosition) {
            gazeDot.style.left = `${gazePosition.x}px`;
            gazeDot.style.top = `${gazePosition.y}px`;
        }
    }, [debugMode, gazePosition]);

    // 얼굴 감지 상태에 따른 컨테이너 테두리 색상
    useEffect(() => {
        if (!debugMode) return;

        const container = document.getElementById('mediapipeDebugContainer');
        if (!container) return;

        if (!isFaceDetected) {
            container.style.borderColor = '#ef4444';
            container.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.6)';
        } else {
            container.style.borderColor = '#22c55e';
            container.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.4)';
        }
    }, [debugMode, isFaceDetected]);

    // 캘리브레이션 완료 시 자동 추적 시작
    useEffect(() => {
        if (isCalibrated && !isTracking && problemId) {
            startTracking();
        }
    }, [isCalibrated, isTracking, problemId, startTracking]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    return {
        // 기본 (WebGazer 호환)
        isCalibrated,
        isTracking,
        sessionId,
        monitoringSessionId: sessionId,
        startCalibration,
        completeCalibration,
        stopTracking,

        // NO_FACE 상태 (WebGazer 호환)
        noFaceDuration,
        showNoFaceWarning,
        noFaceProgress: noFaceDuration / NO_FACE_THRESHOLD_MS,

        // 디버그 (WebGazer 호환)
        debugMode,
        toggleDebugMode,
        isFaceDetected,

        // MediaPipe 추가 기능
        faceCount,              // 감지된 얼굴 수
        detectedFaces,          // 모든 감지된 얼굴 랜드마크
        headPose,               // 3D 얼굴 방향 { pitch, yaw, roll }
        gazePosition,           // 추정된 시선 위치 { x, y }
        eyeState,               // 눈 상태 { leftEAR, rightEAR, avgEAR, isBlinking }
        irisPosition,           // 홍채 위치 { left, right }
        drowsinessState         // 졸음 상태 { isDrowsy, perclos, consecutiveClosedFrames }
    };
};
