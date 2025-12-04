import React, { useState } from 'react';
import './CalibrationScreen.css';

/**
 * 9-point 캘리브레이션 화면
 * 사용자가 9개의 점을 순서대로 클릭하여 시선 추적 정확도를 높임
 */
const CalibrationScreen = ({ onComplete }) => {
    const [currentPoint, setCurrentPoint] = useState(0);
    const [clickedPoints, setClickedPoints] = useState([]);

    // 9개 캘리브레이션 포인트 좌표 (3x3 그리드)
    const calibrationPoints = [
        { id: 0, x: 10, y: 10 },   // 좌상
        { id: 1, x: 50, y: 10 },   // 중상
        { id: 2, x: 90, y: 10 },   // 우상
        { id: 3, x: 10, y: 50 },   // 좌중
        { id: 4, x: 50, y: 50 },   // 중중
        { id: 5, x: 90, y: 50 },   // 우중
        { id: 6, x: 10, y: 90 },   // 좌하
        { id: 7, x: 50, y: 90 },   // 중하
        { id: 8, x: 90, y: 90 },   // 우하
    ];

    // 포인트 클릭 핸들러
    const handlePointClick = async (pointId) => {
        if (pointId !== currentPoint) return;

        // WebGazer에 클릭 위치 학습
        if (window.webgazer) {
            const point = calibrationPoints[pointId];
            const x = (window.innerWidth * point.x) / 100;
            const y = (window.innerHeight * point.y) / 100;

            // 여러 번 클릭하여 정확도 향상
            for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                window.webgazer.recordScreenPosition(x, y);
            }
        }

        setClickedPoints([...clickedPoints, pointId]);

        if (currentPoint === 8) {
            // 모든 포인트 완료
            setTimeout(() => {
                onComplete();
            }, 500);
        } else {
            setCurrentPoint(currentPoint + 1);
        }
    };

    return (
        <div className="calibration-overlay">
            <div className="calibration-container">
                <div className="calibration-header">
                    <h2>👁️ 시선 추적 캘리브레이션</h2>
                    <p>화면에 표시되는 점을 순서대로 클릭해주세요 ({currentPoint + 1}/9)</p>
                </div>

                <div className="calibration-points">
                    {calibrationPoints.map((point) => (
                        <div
                            key={point.id}
                            className={`calibration-point ${point.id === currentPoint ? 'active' : ''
                                } ${clickedPoints.includes(point.id) ? 'clicked' : ''}`}
                            style={{
                                left: `${point.x}%`,
                                top: `${point.y}%`,
                            }}
                            onClick={() => handlePointClick(point.id)}
                        >
                            <div className="point-circle">
                                {clickedPoints.includes(point.id) ? '✓' : point.id + 1}
                            </div>
                            {point.id === currentPoint && (
                                <div className="point-pulse"></div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="calibration-footer">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${((currentPoint + 1) / 9) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalibrationScreen;
