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

// ========== Kalman Filter for 2D Gaze Tracking ==========
// State: [x, y, vx, vy] (position + velocity)
// Measurement: [x, y] (position only)
class KalmanFilter2D {
    constructor() {
        // 상태 벡터: [x, y, vx, vy]
        this.state = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: 0,
            vy: 0
        };

        // 오차 공분산 행렬 P (4x4, 대각선만 사용 - 단순화)
        this.P = {
            x: 1000,   // 초기 위치 불확실성 (큰 값)
            y: 1000,
            vx: 1000,  // 초기 속도 불확실성
            vy: 1000
        };

        // 프로세스 노이즈 Q (모델 불확실성)
        // 값이 클수록 측정값을 더 신뢰
        this.Q = {
            x: 0.1,    // 위치 노이즈
            y: 0.1,
            vx: 1.0,   // 속도 노이즈 (가속 허용)
            vy: 1.0
        };

        // 측정 노이즈 R (측정값 불확실성)
        // 값이 클수록 예측값을 더 신뢰 (스무딩 효과 증가)
        // 값이 작을수록 측정값을 더 신뢰 (반응 속도 증가)
        this.R = {
            x: 20,     // 시선 측정 노이즈 (픽셀 단위) - 50에서 20으로 감소 (반응성 향상)
            y: 20
        };

        this.lastTime = performance.now();
        this.initialized = false;
    }

    // 예측 단계 (Predict)
    predict(dt = null) {
        const now = performance.now();
        if (dt === null) {
            dt = (now - this.lastTime) / 1000; // 초 단위
        }
        this.lastTime = now;

        // dt가 너무 크면 (0.5초 이상) 리셋
        if (dt > 0.5) {
            dt = 0.033; // 30fps 기준
        }

        // 상태 전이: x' = x + vx * dt
        this.state.x += this.state.vx * dt;
        this.state.y += this.state.vy * dt;

        // 위치 경계 클램핑 (화면 밖으로 너무 멀리 나가지 않도록)
        const MARGIN = 200;
        this.state.x = Math.max(-MARGIN, Math.min(this.state.x, window.innerWidth + MARGIN));
        this.state.y = Math.max(-MARGIN, Math.min(this.state.y, window.innerHeight + MARGIN));

        // 오차 공분산 업데이트: P' = F * P * F^T + Q
        // 단순화된 버전 (대각 행렬 가정)
        this.P.x += this.P.vx * dt * dt + this.Q.x;
        this.P.y += this.P.vy * dt * dt + this.Q.y;
        this.P.vx += this.Q.vx;
        this.P.vy += this.Q.vy;

        return { x: this.state.x, y: this.state.y };
    }

    // 업데이트 단계 (Update/Correct)
    update(measurementX, measurementY) {
        if (!this.initialized) {
            // 첫 측정값으로 초기화
            this.state.x = measurementX;
            this.state.y = measurementY;
            this.state.vx = 0;
            this.state.vy = 0;
            this.initialized = true;
            return { x: measurementX, y: measurementY };
        }

        // 칼만 이득 계산: K = P * H^T * (H * P * H^T + R)^-1
        // H = [[1, 0, 0, 0], [0, 1, 0, 0]] (위치만 측정)
        const Kx = this.P.x / (this.P.x + this.R.x);
        const Ky = this.P.y / (this.P.y + this.R.y);

        // 속도에 대한 칼만 이득 (위치 잔차에서 속도 추정)
        const Kvx = this.P.vx / (this.P.x + this.R.x) * 0.5;
        const Kvy = this.P.vy / (this.P.y + this.R.y) * 0.5;

        // 잔차 (Innovation): y = z - H * x
        let residualX = measurementX - this.state.x;
        let residualY = measurementY - this.state.y;

        // 잔차 클램핑 (너무 큰 점프 방지 - 화면 1/2 이상 점프 제한)
        // 1/3 → 1/2로 변경: 빠른 시선 이동 허용 범위 확대
        const MAX_RESIDUAL = Math.max(window.innerWidth, window.innerHeight) / 2;
        residualX = Math.max(-MAX_RESIDUAL, Math.min(MAX_RESIDUAL, residualX));
        residualY = Math.max(-MAX_RESIDUAL, Math.min(MAX_RESIDUAL, residualY));

        // 상태 업데이트: x = x + K * y
        this.state.x += Kx * residualX;
        this.state.y += Ky * residualY;

        // 속도 업데이트 (잔차 기반)
        this.state.vx += Kvx * residualX;
        this.state.vy += Kvy * residualY;

        // 속도 클램핑 (폭주 방지 - 1초에 화면 1배 이상 이동 불가)
        const MAX_VELOCITY = window.innerWidth;
        this.state.vx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, this.state.vx));
        this.state.vy = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, this.state.vy));

        // 속도 감쇠 (서서히 0으로 수렴하도록 - 안정성)
        // 0.95 → 0.98로 변경: 감쇠를 줄여 빠른 움직임 추적 개선
        this.state.vx *= 0.98;
        this.state.vy *= 0.98;

        // 오차 공분산 업데이트: P = (I - K * H) * P
        this.P.x *= (1 - Kx);
        this.P.y *= (1 - Ky);
        this.P.vx *= (1 - Kvx * 0.3);
        this.P.vy *= (1 - Kvy * 0.3);

        // 공분산 클램핑 (수치 안정성)
        const MIN_P = 0.01;
        const MAX_P = 10000;
        this.P.x = Math.max(MIN_P, Math.min(MAX_P, this.P.x));
        this.P.y = Math.max(MIN_P, Math.min(MAX_P, this.P.y));
        this.P.vx = Math.max(MIN_P, Math.min(MAX_P, this.P.vx));
        this.P.vy = Math.max(MIN_P, Math.min(MAX_P, this.P.vy));

        // 최종 NaN 체크 (방어적 프로그래밍)
        if (!Number.isFinite(this.state.x) || !Number.isFinite(this.state.y) ||
            !Number.isFinite(this.state.vx) || !Number.isFinite(this.state.vy) ||
            !Number.isFinite(this.P.x) || !Number.isFinite(this.P.y)) {
            console.error('🚨 Kalman state became NaN/Infinity, resetting...');
            this.reset();
            return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        }

        return { x: this.state.x, y: this.state.y };
    }

    // 예측 + 업데이트 한번에 (일반적인 사용)
    filter(measurementX, measurementY) {
        // NaN/Infinity 검증 - 잘못된 입력 방지
        if (!Number.isFinite(measurementX) || !Number.isFinite(measurementY)) {
            console.warn('⚠️ Kalman filter received invalid input:', { measurementX, measurementY });
            // 현재 상태 반환 (예측만 수행)
            this.predict();
            return { x: this.state.x, y: this.state.y };
        }

        this.predict();
        const result = this.update(measurementX, measurementY);

        // 결과 NaN 검증
        if (!Number.isFinite(result.x) || !Number.isFinite(result.y)) {
            console.error('🚨 Kalman filter produced NaN, resetting...');
            this.reset();
            return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        }

        return result;
    }

    // 현재 상태 반환
    getState() {
        return { ...this.state };
    }

    // 필터 리셋
    reset() {
        this.state = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: 0,
            vy: 0
        };
        this.P = { x: 1000, y: 1000, vx: 1000, vy: 1000 };
        this.initialized = false;
        this.lastTime = performance.now();
    }

    // 측정 노이즈 조정 (동적 조정용)
    setMeasurementNoise(rx, ry) {
        this.R.x = rx;
        this.R.y = ry;
    }
}

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

    // ========== Liveness Detection (사진/영상 감지) ==========
    // 눈 깜빡임이 일정 시간 동안 없으면 사진/영상으로 판정
    const LIVENESS_BLINK_TIMEOUT_MS = 30000; // 30초 동안 눈 깜빡임 없으면 경고
    const lastBlinkTimeRef = useRef(Date.now()); // 마지막 눈 깜빡임 시간
    const wasBlinkingRef = useRef(false); // 이전 프레임 눈 감김 상태
    const [livenessWarning, setLivenessWarning] = useState(false); // 사진 감지 경고

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

    // ========== 3-Point 캘리브레이션 데이터 ==========
    // MediaPipeCalibrationScreen에서 전달받은 캘리브레이션 데이터
    const calibrationDataRef = useRef(null);
    const hasManualCalibrationRef = useRef(false); // 수동 캘리브레이션 완료 여부

    // ========== 자동 캘리브레이션 (Baseline) - 수동 캘리브레이션 없을 때 폴백 ==========
    // 시작 후 처음 몇 프레임의 평균값을 기준점으로 저장
    const CALIBRATION_FRAMES = 30; // 30프레임 (~1초) 동안 평균 계산
    const isBaselineCalibratedRef = useRef(false);
    const baselineRef = useRef({
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        irisOffset: { x: 0, y: 0 } // 정면 볼 때 홍채 오프셋
    });
    // 캘리브레이션 중 누적값
    const calibrationAccumulatorRef = useRef({
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        irisOffset: { x: 0, y: 0 },
        count: 0
    });

    // ========== Kalman Filter 스무딩 (EMA 대체) ==========
    // 위치 + 속도 기반 예측으로 더 안정적인 시선 추적
    const kalmanFilterRef = useRef(null);

    // Kalman Filter 초기화 (lazy initialization)
    const getKalmanFilter = useCallback(() => {
        if (!kalmanFilterRef.current) {
            kalmanFilterRef.current = new KalmanFilter2D();
            console.log('✅ Kalman Filter initialized');
        }
        return kalmanFilterRef.current;
    }, []);

    // ========== 얼굴 감지 안정화 (디바운싱) ==========
    // 연속 N프레임 동안 같은 상태여야 변경
    const FACE_DETECTION_DEBOUNCE_FRAMES = 3; // 3프레임 연속 필요
    const faceDetectionCounterRef = useRef({ detected: 0, notDetected: 0 });
    const stableFaceDetectedRef = useRef(false);

    // drawDebugOverlay를 ref로 관리 (순환 의존성 방지)
    const drawDebugOverlayRef = useRef(null);

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

        // 랜드마크 유효성 검증
        if (!noseTip || !chin || !leftEye || !rightEye) {
            return { pitch: 0, yaw: 0, roll: 0 };
        }

        // Yaw (좌우 회전) - 코와 양 눈 중심 비교
        const eyeCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2,
            z: ((leftEye.z || 0) + (rightEye.z || 0)) / 2
        };

        // z 좌표가 너무 작으면 기본값 사용 (0으로 나누기 방지)
        const noseZ = noseTip.z || 0;
        const chinZ = chin.z || 0;
        const eyeCenterZ = eyeCenter.z || 0;

        // z 차이가 너무 작으면 yaw/pitch 계산이 불안정해짐
        const zDiffYaw = Math.abs(noseZ - eyeCenterZ);
        const zDiffPitch = Math.abs(noseZ - chinZ);

        let yaw = 0, pitch = 0, roll = 0;

        // Yaw 계산 (z 깊이가 충분히 있을 때만)
        if (zDiffYaw > 0.001) {
            yaw = Math.atan2(noseTip.x - eyeCenter.x, noseZ - eyeCenterZ) * (180 / Math.PI);
        } else {
            // z가 거의 없으면 x 기반 단순 계산
            yaw = (noseTip.x - eyeCenter.x) * 100; // 스케일 조정
        }

        // Pitch 계산 (z 깊이가 충분히 있을 때만)
        if (zDiffPitch > 0.001) {
            pitch = Math.atan2(noseTip.y - chin.y, noseZ - chinZ) * (180 / Math.PI);
        } else {
            pitch = (noseTip.y - chin.y) * 100;
        }

        // Roll (기울기) - 양 눈의 높이 차이
        roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

        // NaN 검증 및 범위 클램핑 (실제 머리 회전 범위: 약 ±60도)
        const MAX_ANGLE = 60;
        if (!Number.isFinite(pitch)) pitch = 0;
        if (!Number.isFinite(yaw)) yaw = 0;
        if (!Number.isFinite(roll)) roll = 0;

        pitch = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, pitch));
        yaw = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, yaw));
        roll = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, roll));

        return { pitch, yaw, roll };
    }, []);

    // ========== 3D 벡터 기반 시선 추정 ==========
    // MediaPipe의 3D 좌표(x, y, z)를 활용하여 시선 벡터를 계산하고 화면에 투영
    const estimateGazeFromIris = useCallback((landmarks, videoWidth, videoHeight, headPose = null) => {
        if (!landmarks || landmarks.length < 478) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // ========== 3D 좌표 추출 ==========
        // 왼쪽 홍채 중심 (3D)
        const leftIris3D = landmarks[LANDMARK_INDICES.LEFT_IRIS[0]];
        // 오른쪽 홍채 중심 (3D)
        const rightIris3D = landmarks[LANDMARK_INDICES.RIGHT_IRIS[0]];

        // 왼쪽/오른쪽 눈의 경계 (3D)
        const leftEyeLeft3D = landmarks[LANDMARK_INDICES.LEFT_EYE.P1];
        const leftEyeRight3D = landmarks[LANDMARK_INDICES.LEFT_EYE.P4];
        const rightEyeLeft3D = landmarks[LANDMARK_INDICES.RIGHT_EYE.P1];
        const rightEyeRight3D = landmarks[LANDMARK_INDICES.RIGHT_EYE.P4];

        // 눈 중심 (3D) - 양쪽 눈의 중간점
        const eyeCenter3D = {
            x: (leftEyeLeft3D.x + leftEyeRight3D.x + rightEyeLeft3D.x + rightEyeRight3D.x) / 4,
            y: (leftEyeLeft3D.y + leftEyeRight3D.y + rightEyeLeft3D.y + rightEyeRight3D.y) / 4,
            z: ((leftEyeLeft3D.z || 0) + (leftEyeRight3D.z || 0) + (rightEyeLeft3D.z || 0) + (rightEyeRight3D.z || 0)) / 4
        };

        // 홍채 중심 (3D)
        const irisCenter3D = {
            x: (leftIris3D.x + rightIris3D.x) / 2,
            y: (leftIris3D.y + rightIris3D.y) / 2,
            z: ((leftIris3D.z || 0) + (rightIris3D.z || 0)) / 2
        };

        // ========== 3D 시선 벡터 계산 ==========
        // 시선 방향 = 홍채 위치 - 눈 중심 위치 (정규화된 방향 벡터)
        const gazeVector = {
            x: irisCenter3D.x - eyeCenter3D.x,
            y: irisCenter3D.y - eyeCenter3D.y,
            z: (irisCenter3D.z - eyeCenter3D.z) || 0.01 // z가 0이면 작은 값 사용
        };

        // 시선 벡터 정규화
        const gazeMagnitude = Math.sqrt(gazeVector.x ** 2 + gazeVector.y ** 2 + gazeVector.z ** 2);
        const normalizedGaze = {
            x: gazeVector.x / (gazeMagnitude || 1),
            y: gazeVector.y / (gazeMagnitude || 1),
            z: gazeVector.z / (gazeMagnitude || 1)
        };

        // ========== 자동 캘리브레이션 (baseline 저장) ==========
        if (!isBaselineCalibratedRef.current && headPose) {
            const acc = calibrationAccumulatorRef.current;
            acc.headPose.pitch += headPose.pitch;
            acc.headPose.yaw += headPose.yaw;
            acc.headPose.roll += headPose.roll;
            // 3D 벡터 누적
            acc.irisOffset.x += normalizedGaze.x;
            acc.irisOffset.y += normalizedGaze.y;
            acc.count++;

            if (acc.count >= CALIBRATION_FRAMES) {
                baselineRef.current = {
                    headPose: {
                        pitch: acc.headPose.pitch / acc.count,
                        yaw: acc.headPose.yaw / acc.count,
                        roll: acc.headPose.roll / acc.count
                    },
                    irisOffset: {
                        x: acc.irisOffset.x / acc.count,
                        y: acc.irisOffset.y / acc.count
                    }
                };
                isBaselineCalibratedRef.current = true;
                console.log('✅ 3D Gaze baseline calibration complete:', baselineRef.current);
            }

            return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        }

        // ========== 3-Point 캘리브레이션 사용 (수동 캘리브레이션 완료 시) ==========
        if (hasManualCalibrationRef.current && calibrationDataRef.current) {
            const calibData = calibrationDataRef.current;
            const baseline = calibData.baseline;
            const sensitivity = calibData.sensitivity;

            // 3D 벡터 기반 상대값
            const deltaGazeX = normalizedGaze.x - baseline.irisOffset.x;
            const deltaGazeY = normalizedGaze.y - baseline.irisOffset.y;

            let deltaYaw = 0;
            let deltaPitch = 0;
            if (headPose) {
                deltaYaw = headPose.yaw - baseline.headPose.yaw;
                deltaPitch = headPose.pitch - baseline.headPose.pitch;
                // Delta 클램핑 (머리가 갑자기 120도 돌아가지 않음)
                const MAX_DELTA = 30;
                deltaYaw = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, deltaYaw));
                deltaPitch = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, deltaPitch));
            }

            // 3D 벡터를 화면 좌표로 변환
            // sensitivity는 캘리브레이션에서 (deltaScreen / deltaIris)로 계산됨
            // 따라서 deltaIris * sensitivity = deltaScreen 관계가 성립
            let rawGazeX = baseline.screenX
                + deltaGazeX * sensitivity.irisX * 1.5  // ✅ 더하기로 수정 (sensitivity가 음수이므로)
                + deltaYaw * sensitivity.headX;

            let rawGazeY = baseline.screenY
                + deltaGazeY * sensitivity.irisY * 1.5
                - deltaPitch * sensitivity.headY;

            // Raw gaze 클램핑 (화면 밖으로 너무 멀리 나가지 않도록 - Kalman 안정성)
            const SCREEN_MARGIN = 500; // 화면 밖 500px까지만 허용
            rawGazeX = Math.max(-SCREEN_MARGIN, Math.min(rawGazeX, window.innerWidth + SCREEN_MARGIN));
            rawGazeY = Math.max(-SCREEN_MARGIN, Math.min(rawGazeY, window.innerHeight + SCREEN_MARGIN));

            // Kalman Filter 스무딩 (EMA 대체)
            const kalman = getKalmanFilter();
            const filtered = kalman.filter(rawGazeX, rawGazeY);

            // 디버그: 수동 캘리브레이션 경로 값 확인 (10% 확률로 출력)
            if (Math.random() < 0.10) {
                console.log('🔍 [Manual Calib] Gaze Debug:', {
                    normalizedGaze: { x: normalizedGaze.x.toFixed(4), y: normalizedGaze.y.toFixed(4) },
                    baselineIris: { x: baseline.irisOffset.x.toFixed(4), y: baseline.irisOffset.y.toFixed(4) },
                    delta: { x: deltaGazeX.toFixed(4), y: deltaGazeY.toFixed(4) },
                    sensitivity: { iX: sensitivity.irisX.toFixed(1), iY: sensitivity.irisY.toFixed(1), hX: sensitivity.headX.toFixed(1), hY: sensitivity.headY.toFixed(1) },
                    baselineScreen: { x: Math.round(baseline.screenX), y: Math.round(baseline.screenY) },
                    headDelta: { yaw: deltaYaw.toFixed(2), pitch: deltaPitch.toFixed(2) },
                    raw: { x: Math.round(rawGazeX), y: Math.round(rawGazeY) },
                    filtered: { x: Math.round(filtered.x), y: Math.round(filtered.y) },
                    kalmanVel: { vx: kalman.state.vx.toFixed(2), vy: kalman.state.vy.toFixed(2) }
                });
            }

            return {
                x: Math.max(0, Math.min(filtered.x, window.innerWidth)),
                y: Math.max(0, Math.min(filtered.y, window.innerHeight))
            };
        }

        // ========== 자동 캘리브레이션 모드: baseline 기준 상대값 ==========
        const baseline = baselineRef.current;

        // 3D 시선 벡터의 상대적 변화
        const relativeGazeX = normalizedGaze.x - baseline.irisOffset.x;
        const relativeGazeY = normalizedGaze.y - baseline.irisOffset.y;

        // 머리 회전 보정
        let headCompensationX = 0;
        let headCompensationY = 0;

        if (headPose) {
            const relativeYaw = headPose.yaw - baseline.headPose.yaw;
            const relativePitch = headPose.pitch - baseline.headPose.pitch;

            // 머리 회전을 시선 벡터에 통합
            // 머리가 돌아간 방향으로 시선도 이동 (감도 조절)
            const HEAD_WEIGHT = 0.025; // 머리 회전 1도당 화면 2.5% 이동
            headCompensationX = relativeYaw * HEAD_WEIGHT;  // 좌우 반전 수정: - 제거
            headCompensationY = -relativePitch * HEAD_WEIGHT;
        }

        // ========== 3D 벡터를 화면 좌표로 투영 ==========
        // 시선 벡터를 화면에 투영 (고정 감도 방식)
        // Note: Ray-casting 투영은 제거됨 (고정 감도가 더 안정적)

        // 시선 감도 (3D 벡터 → 화면 픽셀)
        const GAZE_SENSITIVITY_X = 2.5; // 시선 벡터 변화에 대한 화면 이동 배율
        const GAZE_SENSITIVITY_Y = 2.0;

        // 최종 시선 위치 계산
        const rawGazeX = window.innerWidth / 2
            + relativeGazeX * window.innerWidth * GAZE_SENSITIVITY_X  // 3D 벡터 기여 (좌우 반전 수정)
            + headCompensationX * window.innerWidth;                   // 머리 회전 기여

        const rawGazeY = window.innerHeight / 2
            + relativeGazeY * window.innerHeight * GAZE_SENSITIVITY_Y  // 3D 벡터 기여
            + headCompensationY * window.innerHeight;                  // 머리 회전 기여

        // ========== Kalman Filter 스무딩 적용 (EMA 대체) ==========
        const kalman = getKalmanFilter();
        const filtered = kalman.filter(rawGazeX, rawGazeY);

        // 디버그: 값 확인
        if (Math.random() < 0.02) { // 2% 샘플링
            console.log('🔍 Gaze Debug:', {
                normalizedGaze: { x: normalizedGaze.x.toFixed(4), y: normalizedGaze.y.toFixed(4), z: normalizedGaze.z.toFixed(4) },
                baseline: { x: baseline.irisOffset.x.toFixed(4), y: baseline.irisOffset.y.toFixed(4) },
                relative: { x: relativeGazeX.toFixed(4), y: relativeGazeY.toFixed(4) },
                raw: { x: Math.round(rawGazeX), y: Math.round(rawGazeY) },
                filtered: { x: Math.round(filtered.x), y: Math.round(filtered.y) },
                screen: { w: window.innerWidth, h: window.innerHeight }
            });
        }

        // 경계 클램핑
        return {
            x: Math.max(0, Math.min(filtered.x, window.innerWidth)),
            y: Math.max(0, Math.min(filtered.y, window.innerHeight))
        };
    }, [getKalmanFilter]);

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
        // 최소 30프레임 (약 1초) 이상 수집되어야 의미있는 PERCLOS 계산
        const MIN_FRAMES_FOR_PERCLOS = 30;
        if (totalFrames < MIN_FRAMES_FOR_PERCLOS) {
            return { isDrowsy: false, perclos: 0, consecutiveClosedFrames: closedFrameCountRef.current };
        }

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

            // ========== 얼굴 감지 디바운싱 적용 ==========
            const rawFaceDetected = results.faceLandmarks && results.faceLandmarks.length > 0;

            if (rawFaceDetected) {
                faceDetectionCounterRef.current.detected++;
                faceDetectionCounterRef.current.notDetected = 0;

                // 연속 3프레임 감지 시 안정적 감지로 판정
                if (faceDetectionCounterRef.current.detected >= FACE_DETECTION_DEBOUNCE_FRAMES) {
                    if (!stableFaceDetectedRef.current) {
                        console.log('✅ Face stably detected (debounced)');
                    }
                    stableFaceDetectedRef.current = true;
                }
            } else {
                faceDetectionCounterRef.current.notDetected++;
                faceDetectionCounterRef.current.detected = 0;

                // 연속 3프레임 미감지 시 안정적 미감지로 판정
                if (faceDetectionCounterRef.current.notDetected >= FACE_DETECTION_DEBOUNCE_FRAMES) {
                    if (stableFaceDetectedRef.current) {
                        console.log('⚠️ Face stably not detected (debounced)');
                    }
                    stableFaceDetectedRef.current = false;
                }
            }

            // 안정화된 얼굴 감지 상태 사용
            const isFaceStablyDetected = stableFaceDetectedRef.current;

            if (isFaceStablyDetected && rawFaceDetected) {
                // 얼굴 감지됨 - ref에 저장 (리렌더링 없음)
                latestDataRef.current.isFaceDetected = true;
                latestDataRef.current.faceCount = results.faceLandmarks.length;
                latestDataRef.current.detectedFaces = results.faceLandmarks;

                // 첫 번째 얼굴 기준 분석
                const primaryLandmarks = results.faceLandmarks[0];

                // 3D 얼굴 방향 (먼저 계산 - 시선 추정에 사용)
                const headPose = calculateHeadPose(primaryLandmarks);
                latestDataRef.current.headPose = headPose;

                // 시선 추정 (홍채 + 머리 방향 통합)
                latestDataRef.current.gazePosition = estimateGazeFromIris(primaryLandmarks, video.videoWidth, video.videoHeight, headPose);

                // 눈 상태 분석
                const eye = analyzeEyeState(primaryLandmarks);
                latestDataRef.current.eyeState = eye;

                // 홍채 위치
                latestDataRef.current.irisPosition = extractIrisPosition(primaryLandmarks);

                // 졸음 감지
                const drowsiness = detectDrowsiness(eye.avgEAR);
                latestDataRef.current.drowsinessState = drowsiness;

                // ========== Liveness Detection (사진/영상 감지) ==========
                // 눈 깜빡임 감지: 눈이 감겼다가 떠지는 순간을 감지
                const isCurrentlyBlinking = eye.isBlinking;
                if (wasBlinkingRef.current && !isCurrentlyBlinking) {
                    // 눈을 감았다가 뜸 = 깜빡임 완료
                    lastBlinkTimeRef.current = Date.now();
                    if (livenessWarning) {
                        setLivenessWarning(false);
                        console.log('✅ Blink detected - liveness confirmed');
                    }
                }
                wasBlinkingRef.current = isCurrentlyBlinking;

                // 일정 시간 동안 눈 깜빡임 없으면 사진/영상 의심
                const timeSinceLastBlink = Date.now() - lastBlinkTimeRef.current;
                if (timeSinceLastBlink >= LIVENESS_BLINK_TIMEOUT_MS && !livenessWarning) {
                    setLivenessWarning(true);
                    console.warn('⚠️ Liveness warning: No blink detected for', Math.round(timeSinceLastBlink / 1000), 'seconds');
                }

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

            } else if (!isFaceStablyDetected) {
                // 얼굴 안정적 미검출 (디바운싱 적용됨) - ref에 저장
                latestDataRef.current.isFaceDetected = false;
                latestDataRef.current.faceCount = 0;
                latestDataRef.current.detectedFaces = [];

                // NO_FACE 지속 시간 추적 (디바운싱된 상태 기준)
                const currentTime = Date.now();
                if (noFaceStartTimeRef.current === null) {
                    noFaceStartTimeRef.current = currentTime;
                    // 디바운싱으로 인해 이 로그는 훨씬 적게 나타남
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
            // else: 상태 전환 중 (디바운싱 대기) - 아무것도 하지 않음

            // Throttled 상태 업데이트 (100ms마다 = 10fps)
            if (now - lastStateUpdateRef.current >= STATE_UPDATE_INTERVAL_MS) {
                lastStateUpdateRef.current = now;
                updateReactState();
            }

            // 디버그 오버레이 그리기 (ref 사용으로 순환 의존성 방지)
            if (debugModeRef.current && canvasRef.current && drawDebugOverlayRef.current) {
                drawDebugOverlayRef.current(results);
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
        updateReactState,
        livenessWarning
        // drawDebugOverlay는 trackingLoop 이후에 정의되어 ref 패턴으로 접근
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
        ctx.fillRect(10, 10, 280, 200);
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
            `Gaze: (${Math.round(data.gazePosition?.x || 0)}, ${Math.round(data.gazePosition?.y || 0)})`,
            `Filter: Kalman (vel: ${kalmanFilterRef.current ? Math.round(kalmanFilterRef.current.state.vx) : 0}, ${kalmanFilterRef.current ? Math.round(kalmanFilterRef.current.state.vy) : 0})`
        ];

        lines.forEach((line, i) => {
            ctx.fillText(line, 20, 30 + i * 18);
        });

    }, []); // 의존성 제거 - ref 사용으로 항상 최신 데이터

    // drawDebugOverlay를 ref에 할당 (순환 의존성 방지)
    useEffect(() => {
        drawDebugOverlayRef.current = drawDebugOverlay;
    }, [drawDebugOverlay]);

    // 캘리브레이션 시작 (3-point 캘리브레이션 준비)
    const startCalibration = useCallback(() => {
        console.log('MediaPipe 3-point calibration starting...');
        // 캘리브레이션 상태 리셋
        calibrationDataRef.current = null;
        hasManualCalibrationRef.current = false;
        isBaselineCalibratedRef.current = false;
        calibrationAccumulatorRef.current = {
            headPose: { pitch: 0, yaw: 0, roll: 0 },
            irisOffset: { x: 0, y: 0 },
            count: 0
        };
    }, []);

    // 캘리브레이션 완료 (3-point 캘리브레이션 데이터 저장)
    const completeCalibration = useCallback((calibrationData = null) => {
        if (calibrationData) {
            // 3-point 캘리브레이션 데이터가 있으면 저장
            calibrationDataRef.current = calibrationData;
            hasManualCalibrationRef.current = true;

            // 상세 디버그 로그
            console.log('✅ 3-point calibration complete');
            console.log('📐 Baseline:', {
                screenX: Math.round(calibrationData.baseline?.screenX || 0),
                screenY: Math.round(calibrationData.baseline?.screenY || 0),
                irisOffset: calibrationData.baseline?.irisOffset,
                headPose: calibrationData.baseline?.headPose
            });
            console.log('📏 Sensitivity:', calibrationData.sensitivity);
            console.log('⚖️ Weights:', {
                irisRatio: calibrationData.irisRatio,
                headRatio: calibrationData.headRatio
            });

            // 감도가 0이면 경고
            if (calibrationData.sensitivity) {
                const sens = calibrationData.sensitivity;
                if (Math.abs(sens.irisX) < 1 && Math.abs(sens.headX) < 1) {
                    console.warn('⚠️ X-axis sensitivity is very low! Gaze X movement will be minimal');
                }
                if (Math.abs(sens.irisY) < 1 && Math.abs(sens.headY) < 1) {
                    console.warn('⚠️ Y-axis sensitivity is very low! Gaze Y movement will be minimal');
                }
            }

            // Kalman Filter 리셋 (새 캘리브레이션에 맞게)
            if (kalmanFilterRef.current) {
                kalmanFilterRef.current.reset();
                console.log('🔄 Kalman filter reset for new calibration');
            }
        } else {
            // 캘리브레이션 데이터 없이 완료 (자동 캘리브레이션 사용)
            hasManualCalibrationRef.current = false;
            console.log('✅ Calibration complete (will use auto baseline)');

            // Kalman Filter 리셋
            if (kalmanFilterRef.current) {
                kalmanFilterRef.current.reset();
            }
        }
        setIsCalibrated(true);
    }, []);

    // 추적 시작
    const startTracking = useCallback(async () => {
        if (!isCalibrated || !problemId) return;

        isCleaningUpRef.current = false;

        // ========== 추적 시작 시 상태 초기화 ==========
        // EAR 히스토리 리셋 (PERCLOS 100% 즉시 감지 방지)
        earHistoryRef.current = [];
        closedFrameCountRef.current = 0;
        drowsyViolationSentRef.current = false;
        // Liveness 리셋
        lastBlinkTimeRef.current = Date.now();
        wasBlinkingRef.current = false;
        setLivenessWarning(false);
        // 얼굴 감지 상태 리셋
        faceDetectionCounterRef.current = { detected: 0, notDetected: 0 };
        stableFaceDetectedRef.current = false;
        console.log('🔄 Tracking state reset for new session');

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

            // 캘리브레이션 상태 리셋 (다음 세션을 위해)
            isBaselineCalibratedRef.current = false;
            calibrationAccumulatorRef.current = {
                headPose: { pitch: 0, yaw: 0, roll: 0 },
                irisOffset: { x: 0, y: 0 },
                count: 0
            };

            // Kalman Filter 리셋
            if (kalmanFilterRef.current) {
                kalmanFilterRef.current.reset();
            }

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
        drowsinessState,        // 졸음 상태 { isDrowsy, perclos, consecutiveClosedFrames }
        livenessWarning,        // 사진/영상 감지 경고 (30초 동안 눈 깜빡임 없음)

        // 3-point 캘리브레이션용 refs (MediaPipeCalibrationScreen에서 사용)
        faceLandmarkerRef,      // FaceLandmarker 인스턴스 ref
        videoRef,               // 웹캠 비디오 요소 ref
        setupWebcam             // 웹캠 설정 함수
    };
};
