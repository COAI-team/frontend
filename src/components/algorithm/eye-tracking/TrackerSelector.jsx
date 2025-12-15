import React from 'react';
import './TrackerSelector.css';

/**
 * 시선/얼굴 추적기 선택 컴포넌트
 *
 * WebGazer와 MediaPipe 중 선택 가능
 */
const TrackerSelector = ({ selectedTracker, onSelect, disabled = false }) => {
    const trackers = [
        {
            id: 'webgazer',
            name: 'WebGazer',
            description: '기본 시선 추적',
            icon: '👁️',
            features: [
                '시선 추적',
                '얼굴 감지',
                '9점 캘리브레이션',
                'Kalman 필터 스무딩'
            ],
            pros: ['가벼운 라이브러리', '빠른 로딩'],
            cons: ['정확도 제한적', '추가 기능 없음']
        },
        {
            id: 'mediapipe',
            name: 'MediaPipe',
            description: 'AI 기반 고급 추적',
            icon: '🎯',
            features: [
                '시선 추적',
                '얼굴 감지',
                '478개 랜드마크',
                '홍채 추적',
                '졸음 감지',
                '다중 인물 감지',
                '3D 얼굴 방향'
            ],
            pros: ['높은 정확도', 'GPU 가속', '다양한 기능'],
            cons: ['캘리브레이션 불필요', '더 많은 리소스 사용']
        }
    ];

    return (
        <div className="tracker-selector">
            <h3 className="tracker-selector-title">
                🔧 추적 방식 선택
            </h3>
            <p className="tracker-selector-description">
                시선 및 얼굴 추적에 사용할 기술을 선택하세요
            </p>

            <div className="tracker-options">
                {trackers.map((tracker) => (
                    <div
                        key={tracker.id}
                        className={`tracker-option ${selectedTracker === tracker.id ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                        onClick={() => !disabled && onSelect(tracker.id)}
                    >
                        <div className="tracker-option-header">
                            <span className="tracker-icon">{tracker.icon}</span>
                            <div className="tracker-info">
                                <h4 className="tracker-name">{tracker.name}</h4>
                                <p className="tracker-desc">{tracker.description}</p>
                            </div>
                            <div className={`tracker-radio ${selectedTracker === tracker.id ? 'checked' : ''}`}>
                                {selectedTracker === tracker.id && <span className="checkmark">✓</span>}
                            </div>
                        </div>

                        <div className="tracker-features">
                            <h5>기능</h5>
                            <ul>
                                {tracker.features.map((feature, idx) => (
                                    <li key={idx}>
                                        <span className="feature-check">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="tracker-pros-cons">
                            <div className="pros">
                                <h5>👍 장점</h5>
                                <ul>
                                    {tracker.pros.map((pro, idx) => (
                                        <li key={idx}>{pro}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="cons">
                                <h5>📌 특징</h5>
                                <ul>
                                    {tracker.cons.map((con, idx) => (
                                        <li key={idx}>{con}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {tracker.id === 'mediapipe' && (
                            <div className="tracker-badge recommended">
                                ⭐ 권장
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrackerSelector;
