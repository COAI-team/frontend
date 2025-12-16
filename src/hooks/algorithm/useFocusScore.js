import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 집중도 점수 계산 커스텀 훅
 *
 * 시선 위치를 기반으로 -100 ~ +100 점수 산출
 * - +100: 완벽한 집중 (화면 내 응시)
 * - 0: 보통 (경계선 부근)
 * - -100: 이탈 (화면 밖 응시)
 *
 * @param {object} gazePosition - 현재 시선 위치 { x, y }
 * @param {boolean} isTracking - 추적 활성화 여부
 * @param {object} options - 옵션 설정
 * @returns {object} - 집중도 점수 및 상태
 */

const DEFAULT_OPTIONS = {
    // 화면 경계 마진 (마진 내부는 화면 내로 간주)
    screenMargin: 50,

    // 점수 변화 속도 (초당)
    scoreIncreaseRate: 5,    // 집중 시 초당 +5점 (0→100까지 약 20초)
    scoreDecreaseRate: 8,    // 이탈 시 초당 -8점 (0→-100까지 약 12초)

    // 유예 기간 (ms) - 짧은 이탈은 무시
    gracePeriod: 500,

    // 디바운스 (ms)
    debounceMs: 100,

    // 최소/최대 점수
    minScore: -100,
    maxScore: 100,

    // 부드러운 점수 변화를 위한 스무딩 팩터
    smoothingFactor: 0.15,
};

export const useFocusScore = (gazePosition, isTracking, options = {}) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // 현재 점수 (표시용, 스무딩 적용)
    const [displayScore, setDisplayScore] = useState(0);
    // 실제 점수 (내부 계산용)
    const rawScoreRef = useRef(0);
    // 이탈 시작 시간
    const outsideStartTimeRef = useRef(null);
    // 마지막 업데이트 시간
    const lastUpdateTimeRef = useRef(performance.now());
    // 세션 통계
    const statsRef = useRef({
        totalTime: 0,
        focusedTime: 0,         // 점수 > 0인 시간
        highFocusTime: 0,       // 점수 > 50인 시간
        lowFocusTime: 0,        // 점수 < -50인 시간
        avgScore: 0,
        scoreSum: 0,
        sampleCount: 0,
    });

    // 화면 내부 여부 판단
    const isInsideScreen = useCallback((x, y) => {
        const margin = opts.screenMargin;
        return (
            x >= -margin &&
            x <= window.innerWidth + margin &&
            y >= -margin &&
            y <= window.innerHeight + margin
        );
    }, [opts.screenMargin]);

    // 점수 업데이트
    useEffect(() => {
        if (!isTracking || !gazePosition) {
            return;
        }

        const now = performance.now();
        const deltaTime = (now - lastUpdateTimeRef.current) / 1000; // 초 단위
        lastUpdateTimeRef.current = now;

        // 너무 긴 간격은 무시 (탭 전환 등)
        if (deltaTime > 1) {
            return;
        }

        const { x, y } = gazePosition;
        const inside = isInsideScreen(x, y);

        if (inside) {
            // 화면 내부 - 유예 기간 리셋
            outsideStartTimeRef.current = null;

            // 점수 증가
            rawScoreRef.current = Math.min(
                opts.maxScore,
                rawScoreRef.current + opts.scoreIncreaseRate * deltaTime
            );
        } else {
            // 화면 외부
            if (outsideStartTimeRef.current === null) {
                outsideStartTimeRef.current = now;
            }

            const outsideDuration = now - outsideStartTimeRef.current;

            // 유예 기간 이후에만 점수 감소
            if (outsideDuration > opts.gracePeriod) {
                rawScoreRef.current = Math.max(
                    opts.minScore,
                    rawScoreRef.current - opts.scoreDecreaseRate * deltaTime
                );
            }
        }

        // 스무딩 적용하여 표시 점수 업데이트
        const targetScore = rawScoreRef.current;
        setDisplayScore(prevScore => {
            const newScore = prevScore + (targetScore - prevScore) * opts.smoothingFactor;
            return Math.round(newScore * 10) / 10; // 소수점 1자리까지
        });

        // 통계 업데이트
        statsRef.current.totalTime += deltaTime;
        statsRef.current.scoreSum += rawScoreRef.current;
        statsRef.current.sampleCount += 1;
        statsRef.current.avgScore = statsRef.current.scoreSum / statsRef.current.sampleCount;

        if (rawScoreRef.current > 0) {
            statsRef.current.focusedTime += deltaTime;
        }
        if (rawScoreRef.current > 50) {
            statsRef.current.highFocusTime += deltaTime;
        }
        if (rawScoreRef.current < -50) {
            statsRef.current.lowFocusTime += deltaTime;
        }

    }, [gazePosition, isTracking, isInsideScreen, opts]);

    // 점수 초기화
    const resetScore = useCallback(() => {
        rawScoreRef.current = 0;
        setDisplayScore(0);
        outsideStartTimeRef.current = null;
        lastUpdateTimeRef.current = performance.now();
        statsRef.current = {
            totalTime: 0,
            focusedTime: 0,
            highFocusTime: 0,
            lowFocusTime: 0,
            avgScore: 0,
            scoreSum: 0,
            sampleCount: 0,
        };
    }, []);

    // 현재 집중 상태 (문자열)
    const getFocusState = useCallback(() => {
        const score = displayScore;
        if (score >= 70) return 'excellent';
        if (score >= 30) return 'good';
        if (score >= -30) return 'normal';
        if (score >= -70) return 'low';
        return 'critical';
    }, [displayScore]);

    // 통계 가져오기
    const getStats = useCallback(() => {
        const stats = statsRef.current;
        return {
            ...stats,
            focusedPercentage: stats.totalTime > 0
                ? (stats.focusedTime / stats.totalTime) * 100
                : 0,
            highFocusPercentage: stats.totalTime > 0
                ? (stats.highFocusTime / stats.totalTime) * 100
                : 0,
            avgScore: Math.round(stats.avgScore * 10) / 10,
        };
    }, []);

    return {
        score: displayScore,
        rawScore: rawScoreRef.current,
        focusState: getFocusState(),
        isInsideScreen: gazePosition ? isInsideScreen(gazePosition.x, gazePosition.y) : true,
        resetScore,
        getStats,
    };
};

export default useFocusScore;
