import React, { useMemo, useState, useEffect, useRef } from 'react';

/**
 * 집중도 점수 게이지 바 컴포넌트 (세로 방향)
 *
 * 실시간으로 집중도 점수를 시각화하여 표시
 * - 점수 범위: -100 ~ +100
 * - 색상 코딩: 빨강(이탈) → 노랑(보통) → 초록(집중)
 * - 경험치 스타일 점수 변화 애니메이션
 *
 * Props:
 * - score: 현재 집중도 점수 (-100 ~ +100)
 * - focusState: 집중 상태 ('excellent', 'good', 'normal', 'low', 'critical')
 * - isVisible: 게이지 표시 여부
 * - position: 위치 ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'right-center')
 * - compact: 컴팩트 모드 (작은 크기)
 * - showLabel: 점수 레이블 표시 여부
 */

const POSITION_STYLES = {
    'top-left': { top: '160px', left: '20px' },
    'top-right': { top: '160px', right: '15px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '15px' },
    'right-center': { top: '160px', right: '15px' },  // 문제설명/코드에디터 패널 상단과 정렬, 좌측으로 2px 이동
};

const STATE_CONFIG = {
    excellent: {
        label: '집중',
        emoji: '😊',
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.15)',
        borderColor: 'rgba(34, 197, 94, 0.4)',
    },
    good: {
        label: '양호',
        emoji: '🙂',
        color: '#84cc16',
        bgColor: 'rgba(132, 204, 22, 0.15)',
        borderColor: 'rgba(132, 204, 22, 0.4)',
    },
    normal: {
        label: '보통',
        emoji: '😐',
        color: '#eab308',
        bgColor: 'rgba(234, 179, 8, 0.15)',
        borderColor: 'rgba(234, 179, 8, 0.4)',
    },
    low: {
        label: '주의',
        emoji: '😟',
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.15)',
        borderColor: 'rgba(249, 115, 22, 0.4)',
    },
    critical: {
        label: '이탈',
        emoji: '😵',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
};

const FocusScoreGauge = ({
    score = 0,
    focusState = 'normal',
    isVisible = true,
    position = 'right-center',
    compact = false,
    showLabel = true,
}) => {
    // 테마 감지
    const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    // 경험치 스타일 애니메이션을 위한 상태
    const [animations, setAnimations] = useState([]);
    const prevScoreRef = useRef(score);
    const accumulatedDiffRef = useRef(0);  // 누적 점수 변화량
    const animationIdRef = useRef(0);

    // 점수 변화 누적 (매 프레임마다)
    useEffect(() => {
        const prevScore = prevScoreRef.current;
        const diff = score - prevScore;
        accumulatedDiffRef.current += diff;
        prevScoreRef.current = score;
    }, [score]);

    // 5초마다 누적된 점수 변화 표시
    useEffect(() => {
        const interval = setInterval(() => {
            const accumulated = Math.round(accumulatedDiffRef.current);

            // 누적 변화가 있을 때만 애니메이션 표시
            if (Math.abs(accumulated) >= 1) {
                const newAnimation = {
                    id: animationIdRef.current++,
                    value: accumulated,
                    timestamp: Date.now(),
                };

                setAnimations(prev => [...prev, newAnimation]);

                // 2초 후 해당 애니메이션 제거
                setTimeout(() => {
                    setAnimations(prev => prev.filter(a => a.id !== newAnimation.id));
                }, 2000);

                // 누적값 리셋
                accumulatedDiffRef.current = 0;
            }
        }, 5000);  // 5초마다 실행

        return () => clearInterval(interval);
    }, []);

    // 게이지 채움 비율 계산 (0~100%)
    // 세로 게이지에서 아래가 -100, 위가 +100
    // ⚠️ useMemo는 조건부 return 이전에 호출되어야 함 (React Hooks 규칙)
    const fillPercentage = useMemo(() => {
        return ((score + 100) / 200) * 100;
    }, [score]);

    // early return은 모든 Hooks 호출 이후에 배치
    if (!isVisible) return null;

    const config = STATE_CONFIG[focusState] || STATE_CONFIG.normal;
    const positionStyle = POSITION_STYLES[position] || POSITION_STYLES['right-center'];

    // 세로 그라데이션 (아래→위: 빨강→노랑→초록)
    const gaugeGradient = 'linear-gradient(to top, #ef4444, #f97316, #eab308, #84cc16, #22c55e)';

    const gaugeHeight = compact ? 120 : 180;
    const gaugeWidth = compact ? 20 : 28;

    return (
        <div style={{
            position: 'fixed',
            ...positionStyle,
            zIndex: 9999,
            pointerEvents: 'none',
            userSelect: 'none',
        }}>
            <div style={{
                background: isDarkMode ? '#18181b' : '#ffffff',  // 라이트/다크 모드에 따른 배경색
                borderRadius: compact ? '10px' : '12px',
                padding: compact ? '8px 6px' : '10px 8px',  // 패딩 축소
                border: `1px solid ${isDarkMode ? config.borderColor : '#e2e8f0'}`,
                boxShadow: isDarkMode
                    ? `0 4px 16px rgba(0, 0, 0, 0.5), 0 0 12px ${config.color}15`
                    : `0 4px 16px rgba(0, 0, 0, 0.1), 0 0 12px ${config.color}15`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: compact ? '6px' : '8px',
            }}>
                {/* 경험치 스타일 점수 변화 표시 (연속 애니메이션) */}
                <div style={{
                    position: 'relative',
                    minHeight: compact ? '20px' : '24px',
                    minWidth: compact ? '36px' : '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: compact ? '2px' : '4px',
                }}>
                    {animations.map((anim, index) => (
                        <div
                            key={anim.id}
                            style={{
                                position: 'absolute',
                                fontSize: compact ? '12px' : '14px',
                                fontWeight: '700',
                                fontFamily: 'monospace',
                                color: anim.value > 0 ? '#22c55e' : '#ef4444',
                                textShadow: anim.value > 0
                                    ? '0 0 8px rgba(34, 197, 94, 0.8), 0 0 16px rgba(34, 197, 94, 0.4)'
                                    : '0 0 8px rgba(239, 68, 68, 0.8), 0 0 16px rgba(239, 68, 68, 0.4)',
                                animation: 'expFloat 1.5s ease-out forwards',
                                whiteSpace: 'nowrap',
                                top: `${8 + index * 2}px`,  // 더 아래에서 시작
                            }}
                        >
                            {anim.value > 0 ? `+${anim.value}` : anim.value}
                        </div>
                    ))}
                    {/* 애니메이션 없을 때 빈 공간 유지 */}
                    {animations.length === 0 && (
                        <div style={{
                            fontSize: compact ? '9px' : '10px',
                            color: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                            fontFamily: 'monospace',
                        }}>
                            ···
                        </div>
                    )}
                </div>

                {/* 세로 게이지 바 */}
                <div style={{
                    position: 'relative',
                    width: gaugeWidth,
                    height: gaugeHeight,
                    borderRadius: gaugeWidth / 2,
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                }}>
                    {/* 배경 그라데이션 (희미하게) */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: gaugeGradient,
                        opacity: 0.15,
                    }} />

                    {/* 중앙선 (0점 위치) */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                    }} />

                    {/* 채움 게이지 */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${fillPercentage}%`,
                        background: gaugeGradient,
                        borderRadius: `0 0 ${gaugeWidth / 2}px ${gaugeWidth / 2}px`,
                        transition: 'height 0.15s ease-out',
                        boxShadow: `0 0 12px ${config.color}40`,
                    }} />

                    {/* 현재 위치 마커 */}
                    <div style={{
                        position: 'absolute',
                        bottom: `${fillPercentage}%`,
                        left: '50%',
                        transform: 'translate(-50%, 50%)',
                        width: gaugeWidth + 6,
                        height: compact ? 5 : 6,
                        borderRadius: '3px',
                        background: '#fff',
                        border: `2px solid ${config.color}`,
                        boxShadow: `0 0 10px ${config.color}`,
                        zIndex: 3,
                        transition: 'bottom 0.15s ease-out',
                    }} />
                </div>

                {/* 상태 레이블 + 이모지 */}
                {showLabel && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                    }}>
                        <span style={{
                            fontSize: compact ? '11px' : '13px',
                            fontWeight: '700',
                            color: config.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            {config.label}
                        </span>
                        <span style={{
                            fontSize: compact ? '20px' : '24px',
                            lineHeight: 1,
                        }}>
                            {config.emoji}
                        </span>
                    </div>
                )}
            </div>

            {/* 경험치 애니메이션 스타일 */}
            <style>{`
                @keyframes expFloat {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    30% {
                        opacity: 1;
                        transform: translateY(-8px) scale(1.15);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-25px) scale(0.8);
                    }
                }
            `}</style>
        </div>
    );
};

export default FocusScoreGauge;
