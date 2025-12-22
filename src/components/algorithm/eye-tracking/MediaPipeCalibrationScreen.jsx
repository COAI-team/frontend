import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * MediaPipe 전용 3-point 캘리브레이션 화면
 *
 * 3개의 점(중앙, 좌상, 우하)을 바라보며 시선 데이터를 수집하여
 * 홍채 오프셋 + 머리 방향 -> 화면 좌표 매핑을 학습
 *
 * @param {function} onComplete - 캘리브레이션 완료 시 콜백 (calibrationData 전달)
 * @param {object} faceLandmarker - MediaPipe FaceLandmarker 인스턴스
 * @param {HTMLVideoElement} videoRef - 웹캠 비디오 요소
 */
const MediaPipeCalibrationScreen = ({ onComplete, faceLandmarker, videoRef }) => {
    const [currentPoint, setCurrentPoint] = useState(0);
    const [isCollecting, setIsCollecting] = useState(false);
    const [collectionProgress, setCollectionProgress] = useState(0);
    const [calibrationComplete, setCalibrationComplete] = useState(false);
    const [message, setMessage] = useState('캘리브레이션을 시작합니다');

    // 캘리브레이션 데이터 수집용 refs
    const collectedDataRef = useRef([]);
    const animationFrameRef = useRef(null);
    const collectingRef = useRef(false);

    // 3-point 캘리브레이션 포인트 (화면 비율 %)
    // 중앙, 좌상, 우하 - 최대한 넓은 범위 커버
    const calibrationPoints = [
        { id: 0, x: 50, y: 50, label: '중앙', instruction: '화면 중앙의 점을 바라봐주세요' },
        { id: 1, x: 15, y: 15, label: '좌상', instruction: '화면 왼쪽 위의 점을 바라봐주세요' },
        { id: 2, x: 85, y: 85, label: '우하', instruction: '화면 오른쪽 아래의 점을 바라봐주세요' }
    ];

    // 랜드마크 인덱스 (useMediaPipeTracking과 동일)
    const LANDMARK_INDICES = {
        LEFT_EYE: { P1: 33, P2: 160, P4: 133, P5: 153 },    // P2=상단, P5=하단 추가
        RIGHT_EYE: { P1: 362, P2: 385, P4: 263, P5: 373 },  // P2=상단, P5=하단 추가
        LEFT_IRIS: [468, 469, 470, 471, 472],
        RIGHT_IRIS: [473, 474, 475, 476, 477],
        NOSE_TIP: 1,
        CHIN: 152,
        LEFT_EYE_OUTER: 33,
        RIGHT_EYE_OUTER: 263
    };

    // 3D 머리 방향 계산
    const calculateHeadPose = useCallback((landmarks) => {
        if (!landmarks || landmarks.length === 0) return null;

        const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
        const chin = landmarks[LANDMARK_INDICES.CHIN];
        const leftEye = landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER];
        const rightEye = landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER];

        const eyeCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2,
            z: ((leftEye.z || 0) + (rightEye.z || 0)) / 2
        };

        let yaw = Math.atan2(noseTip.x - eyeCenter.x, noseTip.z - eyeCenter.z) * (180 / Math.PI);
        let pitch = Math.atan2(noseTip.y - chin.y, noseTip.z - chin.z) * (180 / Math.PI);
        let roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

        // NaN 검증 및 범위 클램핑 (±60도)
        const MAX_ANGLE = 60;
        if (!Number.isFinite(pitch)) pitch = 0;
        if (!Number.isFinite(yaw)) yaw = 0;
        if (!Number.isFinite(roll)) roll = 0;

        pitch = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, pitch));
        yaw = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, yaw));
        roll = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, roll));

        return { pitch, yaw, roll };
    }, []);

    // 홍채 상대 위치 계산 (눈 경계 기준 비율)
    // useMediaPipeTracking.js와 동일한 방식 사용 (일관성 유지)
    const calculate3DGazeVector = useCallback((landmarks) => {
        if (!landmarks || landmarks.length < 478) return null;

        // 홍채 중심 좌표
        const leftIris3D = landmarks[LANDMARK_INDICES.LEFT_IRIS[0]];
        const rightIris3D = landmarks[LANDMARK_INDICES.RIGHT_IRIS[0]];

        // 눈의 좌우 경계점
        const leftEyeLeft3D = landmarks[LANDMARK_INDICES.LEFT_EYE.P1];
        const leftEyeRight3D = landmarks[LANDMARK_INDICES.LEFT_EYE.P4];
        const rightEyeLeft3D = landmarks[LANDMARK_INDICES.RIGHT_EYE.P1];
        const rightEyeRight3D = landmarks[LANDMARK_INDICES.RIGHT_EYE.P4];

        // 눈의 상하 경계점
        const leftEyeTop3D = landmarks[LANDMARK_INDICES.LEFT_EYE.P2];
        const leftEyeBottom3D = landmarks[LANDMARK_INDICES.LEFT_EYE.P5];
        const rightEyeTop3D = landmarks[LANDMARK_INDICES.RIGHT_EYE.P2];
        const rightEyeBottom3D = landmarks[LANDMARK_INDICES.RIGHT_EYE.P5];

        // X축: 눈 폭 대비 홍채 위치 비율 (0=왼쪽 끝, 1=오른쪽 끝)
        const leftEyeWidth = Math.abs(leftEyeRight3D.x - leftEyeLeft3D.x) || 0.001;
        const leftIrisRatioX = (leftIris3D.x - leftEyeLeft3D.x) / leftEyeWidth;

        const rightEyeWidth = Math.abs(rightEyeRight3D.x - rightEyeLeft3D.x) || 0.001;
        const rightIrisRatioX = (rightIris3D.x - rightEyeLeft3D.x) / rightEyeWidth;

        const irisRatioX = (leftIrisRatioX + rightIrisRatioX) / 2;

        // Y축: 눈 높이 대비 홍채 위치 비율
        const leftEyeHeight = Math.abs(leftEyeBottom3D.y - leftEyeTop3D.y) || 0.001;
        const leftIrisRatioY = (leftIris3D.y - leftEyeTop3D.y) / leftEyeHeight;

        const rightEyeHeight = Math.abs(rightEyeBottom3D.y - rightEyeTop3D.y) || 0.001;
        const rightIrisRatioY = (rightIris3D.y - rightEyeTop3D.y) / rightEyeHeight;

        const irisRatioY = (leftIrisRatioY + rightIrisRatioY) / 2;

        // 중심(0.5) 기준으로 변환 (범위: 약 -0.2 ~ +0.2)
        return {
            x: irisRatioX - 0.5,
            y: irisRatioY - 0.5
        };
    }, []);

    // 프레임 수집 (30프레임 수집 후 평균)
    const FRAMES_PER_POINT = 30;

    // 단일 프레임 데이터 수집
    const collectFrame = useCallback(async () => {
        if (!faceLandmarker || !videoRef?.current || !collectingRef.current) return null;

        const video = videoRef.current;
        const now = performance.now();

        try {
            const results = faceLandmarker.detectForVideo(video, now);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const landmarks = results.faceLandmarks[0];
                const headPose = calculateHeadPose(landmarks);
                const irisOffset = calculate3DGazeVector(landmarks);

                if (headPose && irisOffset) {
                    return { headPose, irisOffset };
                }
            }
        } catch (error) {
            console.error('Frame collection error:', error);
        }

        return null;
    }, [faceLandmarker, videoRef, calculateHeadPose, calculate3DGazeVector]);

    // 포인트별 데이터 수집 시작
    const startCollecting = useCallback(async (pointId) => {
        setIsCollecting(true);
        collectingRef.current = true;
        setCollectionProgress(0);

        const frameData = [];
        let frameCount = 0;

        const collectLoop = async () => {
            if (!collectingRef.current || frameCount >= FRAMES_PER_POINT) {
                // 수집 완료
                if (frameData.length > 0) {
                    // 평균 계산
                    const avgHeadPose = {
                        pitch: frameData.reduce((sum, d) => sum + d.headPose.pitch, 0) / frameData.length,
                        yaw: frameData.reduce((sum, d) => sum + d.headPose.yaw, 0) / frameData.length,
                        roll: frameData.reduce((sum, d) => sum + d.headPose.roll, 0) / frameData.length
                    };
                    const avgIrisOffset = {
                        x: frameData.reduce((sum, d) => sum + d.irisOffset.x, 0) / frameData.length,
                        y: frameData.reduce((sum, d) => sum + d.irisOffset.y, 0) / frameData.length
                    };

                    const point = calibrationPoints[pointId];
                    const screenX = (window.innerWidth * point.x) / 100;
                    const screenY = (window.innerHeight * point.y) / 100;

                    collectedDataRef.current.push({
                        pointId,
                        screenX,
                        screenY,
                        headPose: avgHeadPose,
                        irisOffset: avgIrisOffset
                    });

                    console.log(`✅ Point ${pointId} calibration complete:`, {
                        screen: { x: screenX, y: screenY },
                        headPose: avgHeadPose,
                        irisOffset: avgIrisOffset
                    });
                }

                setIsCollecting(false);
                collectingRef.current = false;

                // 다음 포인트로 이동
                if (pointId < calibrationPoints.length - 1) {
                    setCurrentPoint(pointId + 1);
                    setMessage(calibrationPoints[pointId + 1].instruction);
                } else {
                    // 모든 포인트 완료 - 캘리브레이션 계산
                    computeCalibration();
                }
                return;
            }

            const frame = await collectFrame();
            if (frame) {
                frameData.push(frame);
                frameCount++;
                setCollectionProgress((frameCount / FRAMES_PER_POINT) * 100);
            }

            animationFrameRef.current = requestAnimationFrame(collectLoop);
        };

        collectLoop();
    }, [collectFrame, calibrationPoints]);

    // 캘리브레이션 계수 계산 (선형 회귀)
    const computeCalibration = useCallback(() => {
        const data = collectedDataRef.current;

        if (data.length < 3) {
            console.error('Not enough calibration data');
            setMessage('캘리브레이션 실패. 다시 시도해주세요.');
            return;
        }

        // 단순 선형 매핑 계수 계산
        // screenX = ax * irisOffsetX + bx * headYaw + cx
        // screenY = ay * irisOffsetY + by * headPitch + cy

        // 3점을 이용한 선형 회귀 (최소자승법 간소화)
        // 중앙점을 기준으로 offset 계산

        const centerData = data.find(d => d.pointId === 0);
        const topLeftData = data.find(d => d.pointId === 1);
        const bottomRightData = data.find(d => d.pointId === 2);

        if (!centerData || !topLeftData || !bottomRightData) {
            console.error('Missing calibration point data');
            setMessage('캘리브레이션 실패. 다시 시도해주세요.');
            return;
        }

        // 기준점 (중앙)
        const baseline = {
            headPose: centerData.headPose,
            irisOffset: centerData.irisOffset,
            screenX: centerData.screenX,
            screenY: centerData.screenY
        };

        // X축 감도 계산: (좌상 → 우하)
        const deltaIrisX = bottomRightData.irisOffset.x - topLeftData.irisOffset.x;
        const deltaYaw = bottomRightData.headPose.yaw - topLeftData.headPose.yaw;
        const deltaScreenX = bottomRightData.screenX - topLeftData.screenX;

        // Y축 감도 계산
        const deltaIrisY = bottomRightData.irisOffset.y - topLeftData.irisOffset.y;
        const deltaPitch = bottomRightData.headPose.pitch - topLeftData.headPose.pitch;
        const deltaScreenY = bottomRightData.screenY - topLeftData.screenY;

        // 디버그: delta 값 출력
        console.log('📊 Calibration deltas:', {
            deltaIrisX: deltaIrisX.toFixed(4),
            deltaIrisY: deltaIrisY.toFixed(4),
            deltaYaw: deltaYaw.toFixed(2),
            deltaPitch: deltaPitch.toFixed(2),
            deltaScreenX: Math.round(deltaScreenX),
            deltaScreenY: Math.round(deltaScreenY)
        });

        // 감도 계수 계산 (더 엄격한 임계값)
        // deltaIris가 너무 작으면 신뢰성 낮음
        let irisSensitivityX = Math.abs(deltaIrisX) > 0.02 ? deltaScreenX / deltaIrisX : 0;
        let headSensitivityX = Math.abs(deltaYaw) > 2 ? deltaScreenX / deltaYaw : 0;

        let irisSensitivityY = Math.abs(deltaIrisY) > 0.02 ? deltaScreenY / deltaIrisY : 0;
        let headSensitivityY = Math.abs(deltaPitch) > 2 ? deltaScreenY / deltaPitch : 0;

        // 극단적인 감도 값 제한 (화면 크기 대비 합리적인 범위)
        const MAX_IRIS_SENSITIVITY = window.innerWidth * 20; // 최대 화면 너비의 20배
        const MAX_HEAD_SENSITIVITY = window.innerWidth / 5; // 1도당 최대 화면의 1/5

        irisSensitivityX = Math.max(-MAX_IRIS_SENSITIVITY, Math.min(MAX_IRIS_SENSITIVITY, irisSensitivityX));
        irisSensitivityY = Math.max(-MAX_IRIS_SENSITIVITY, Math.min(MAX_IRIS_SENSITIVITY, irisSensitivityY));
        headSensitivityX = Math.max(-MAX_HEAD_SENSITIVITY, Math.min(MAX_HEAD_SENSITIVITY, headSensitivityX));
        headSensitivityY = Math.max(-MAX_HEAD_SENSITIVITY, Math.min(MAX_HEAD_SENSITIVITY, headSensitivityY));

        console.log('📏 Raw sensitivities:', {
            irisX: irisSensitivityX.toFixed(1),
            irisY: irisSensitivityY.toFixed(1),
            headX: headSensitivityX.toFixed(1),
            headY: headSensitivityY.toFixed(1)
        });

        // 홍채 기반 민감도만 사용 (head pose는 현재 비활성화됨)
        // 가중치 비율을 적용하지 않고 직접 민감도 사용
        const irisRatio = 1.0; // 홍채 100% 사용
        const headRatio = 0.0; // head 비활성화

        // 최종 감도 (가중치 적용 없이 직접 사용)
        const finalSensitivity = {
            irisX: irisSensitivityX,
            irisY: irisSensitivityY,
            headX: 0,
            headY: 0
        };

        // 최소 민감도 보장
        // 홍채 이동량이 약 ±0.05 이므로, 화면 절반(840px)을 커버하려면: 840 / 0.05 = 16800
        // 너무 높으면 과민하게 반응하므로 적절한 균형 필요
        const MIN_IRIS_SENSITIVITY_X = window.innerWidth * 10; // 최소 화면 너비의 10배 (15→10 축소)
        const MIN_IRIS_SENSITIVITY_Y = window.innerHeight * 3;  // 최소 화면 높이의 3배

        if (Math.abs(finalSensitivity.irisX) < MIN_IRIS_SENSITIVITY_X) {
            const sign = finalSensitivity.irisX < 0 ? -1 : (finalSensitivity.irisX > 0 ? 1 : -1);
            finalSensitivity.irisX = sign * MIN_IRIS_SENSITIVITY_X;
            console.warn(`⚠️ X-axis sensitivity too low, using minimum: ${finalSensitivity.irisX.toFixed(0)}`);
        }
        if (Math.abs(finalSensitivity.irisY) < MIN_IRIS_SENSITIVITY_Y) {
            const sign = finalSensitivity.irisY < 0 ? -1 : (finalSensitivity.irisY > 0 ? 1 : 1);
            finalSensitivity.irisY = sign * MIN_IRIS_SENSITIVITY_Y;
            console.warn(`⚠️ Y-axis sensitivity too low, using minimum: ${finalSensitivity.irisY.toFixed(0)}`);
        }

        const calibrationData = {
            baseline,
            sensitivity: finalSensitivity,
            irisRatio,
            headRatio
        };

        console.log('📐 Calibration computed:', calibrationData);

        setCalibrationComplete(true);
        setMessage('캘리브레이션 완료!');

        // 완료 콜백 호출
        setTimeout(() => {
            onComplete(calibrationData);
        }, 1000);
    }, [onComplete]);

    // 포인트 클릭 핸들러
    const handlePointClick = (pointId) => {
        if (isCollecting || pointId !== currentPoint) return;
        startCollecting(pointId);
    };

    // 초기 메시지 설정
    useEffect(() => {
        setMessage(calibrationPoints[0].instruction);
    }, []);

    // 정리
    useEffect(() => {
        return () => {
            collectingRef.current = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* 헤더 */}
            <div style={{
                position: 'absolute',
                top: '40px',
                textAlign: 'center',
                color: 'white'
            }}>
                <h2 style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                }}>
                    👁️ 시선 추적 캘리브레이션
                </h2>
                <p style={{
                    fontSize: '1.1rem',
                    color: '#a5b4fc',
                    marginBottom: '0.25rem'
                }}>
                    {message}
                </p>
                <p style={{
                    fontSize: '0.9rem',
                    color: '#6366f1'
                }}>
                    ({currentPoint + 1} / {calibrationPoints.length})
                </p>
            </div>

            {/* 캘리브레이션 포인트 */}
            {calibrationPoints.map((point) => (
                <div
                    key={point.id}
                    onClick={() => handlePointClick(point.id)}
                    style={{
                        position: 'absolute',
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: point.id === currentPoint && !isCollecting ? 'pointer' : 'default',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {/* 외곽 펄스 애니메이션 */}
                    {point.id === currentPoint && !isCollecting && (
                        <div style={{
                            position: 'absolute',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            border: '3px solid rgba(139, 92, 246, 0.5)',
                            animation: 'pulse-ring 1.5s infinite',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)'
                        }} />
                    )}

                    {/* 수집 중 진행률 링 */}
                    {point.id === currentPoint && isCollecting && (
                        <svg
                            style={{
                                position: 'absolute',
                                width: '80px',
                                height: '80px',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%) rotate(-90deg)'
                            }}
                        >
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke="rgba(139, 92, 246, 0.3)"
                                strokeWidth="6"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="6"
                                strokeDasharray={`${2 * Math.PI * 35}`}
                                strokeDashoffset={`${2 * Math.PI * 35 * (1 - collectionProgress / 100)}`}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.1s ease' }}
                            />
                        </svg>
                    )}

                    {/* 중앙 점 */}
                    <div style={{
                        width: point.id === currentPoint ? '50px' : '30px',
                        height: point.id === currentPoint ? '50px' : '30px',
                        borderRadius: '50%',
                        background: point.id < currentPoint
                            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                            : point.id === currentPoint
                                ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
                                : 'rgba(255, 255, 255, 0.2)',
                        boxShadow: point.id === currentPoint
                            ? '0 0 30px rgba(139, 92, 246, 0.8), 0 0 60px rgba(236, 72, 153, 0.4)'
                            : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: point.id === currentPoint ? '1.2rem' : '0.9rem',
                        transition: 'all 0.3s ease'
                    }}>
                        {point.id < currentPoint ? '✓' : point.id + 1}
                    </div>

                    {/* 라벨 */}
                    {point.id === currentPoint && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '10px',
                            color: '#a5b4fc',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                        }}>
                            {isCollecting ? '수집 중...' : '클릭하세요'}
                        </div>
                    )}
                </div>
            ))}

            {/* 하단 진행률 바 */}
            <div style={{
                position: 'absolute',
                bottom: '40px',
                width: '300px'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    height: '8px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
                        height: '100%',
                        width: `${((currentPoint + (isCollecting ? collectionProgress / 100 : 0)) / calibrationPoints.length) * 100}%`,
                        transition: 'width 0.3s ease',
                        borderRadius: '10px'
                    }} />
                </div>
            </div>

            {/* 완료 메시지 */}
            {calibrationComplete && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        textAlign: 'center',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>캘리브레이션 완료!</h2>
                        <p style={{ color: '#a5b4fc', marginTop: '0.5rem' }}>시선 추적을 시작합니다...</p>
                    </div>
                </div>
            )}

            {/* CSS 애니메이션 */}
            <style>{`
                @keyframes pulse-ring {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1.5);
                        opacity: 0;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MediaPipeCalibrationScreen;
