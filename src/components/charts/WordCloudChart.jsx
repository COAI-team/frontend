import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts-wordcloud';

/**
 * ECharts WordCloud 컴포넌트
 * 
 * 긴 영어 텍스트에 최적화된 워드 클라우드
 * - 수평/약간의 기울기로 가독성 확보
 * - 어두운 배경과 밝은 배경 모두 지원
 * 
 * @param {Object} props
 * @param {Array<{name: string, value: number}>} props.data - 워드 클라우드 데이터
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {Function} [props.onWordClick] - 단어 클릭 시 콜백 (name, value)
 * @param {boolean} [props.darkMode] - 다크모드 여부
 */
const WordCloudChart = ({ data, className = '', onWordClick, darkMode = true }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;

        // ECharts 인스턴스 생성
        if (!chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current);
        }

        // 클릭 이벤트 핸들러 등록
        chartInstance.current.off('click');
        if (onWordClick) {
            chartInstance.current.on('click', 'series.wordCloud', (params) => {
                onWordClick(params.name, params.value);
            });
        }

        // 데이터가 없으면 차트 클리어
        if (!data || data.length === 0) {
            chartInstance.current.clear();
            return;
        }

        // 데이터 값 범위 계산
        const maxValue = Math.max(...data.map(item => item.value));
        const minValue = Math.min(...data.map(item => item.value));
        const valueRange = maxValue - minValue || 1;

        // 색상 팔레트 (시안/블루 그라데이션 - 다크 대시보드용)
        const getColor = (value) => {
            const ratio = (value - minValue) / valueRange;
            
            if (ratio > 0.75) {
                return '#22d3ee'; // cyan-400 (가장 밝음)
            } else if (ratio > 0.5) {
                return '#06b6d4'; // cyan-500
            } else if (ratio > 0.3) {
                return '#0ea5e9'; // sky-500
            } else if (ratio > 0.15) {
                return '#6366f1'; // indigo-500
            } else {
                return '#8b5cf6'; // violet-500
            }
        };

        // 폰트 크기 계산 (긴 텍스트 고려하여 조정)
        const getFontSize = (value, textLength) => {
            const ratio = (value - minValue) / valueRange;
            // 텍스트가 길면 폰트 크기 감소
            const lengthFactor = textLength > 20 ? 0.7 : textLength > 15 ? 0.85 : 1;
            const baseSize = 12 + ratio * 38; // 12px ~ 50px
            return Math.round(baseSize * lengthFactor);
        };

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                show: true,
                formatter: (params) => {
                    return `<div style="padding: 10px 14px; font-size: 13px; line-height: 1.5;">
                        <div style="font-weight: 600; color: #22d3ee; margin-bottom: 6px; font-size: 14px;">${params.name}</div>
                        <div style="color: #94a3b8;">발생 횟수: <strong style="color: #fff; font-size: 15px;">${params.value}</strong>회</div>
                    </div>`;
                },
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(56, 189, 248, 0.2)',
                borderWidth: 1,
                borderRadius: 10,
                padding: 0,
                textStyle: {
                    color: '#e2e8f0'
                },
                extraCssText: 'box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);'
            },
            series: [{
                type: 'wordCloud',
                shape: 'circle',
                keepAspect: false,
                left: 'center',
                top: 'center',
                width: '92%',
                height: '92%',
                right: null,
                bottom: null,
                // 긴 텍스트용: 수평 위주 + 약간의 기울기만
                sizeRange: [11, 48],
                rotationRange: [-20, 20],  // 작은 회전 범위
                rotationStep: 10,
                gridSize: 3,  // 촘촘한 배치
                drawOutOfBound: false,
                shrinkToFit: true,
                layoutAnimation: true,
                textStyle: {
                    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 'normal'
                },
                emphasis: {
                    focus: 'self',
                    textStyle: {
                        fontWeight: '600',
                        textShadowBlur: 10,
                        textShadowColor: 'rgba(34, 211, 238, 0.5)'
                    }
                },
                data: data.map((item) => ({
                    name: item.name,
                    value: item.value,
                    textStyle: {
                        color: getColor(item.value),
                        fontSize: getFontSize(item.value, item.name.length),
                        fontWeight: item.value >= maxValue * 0.5 ? '600' : '400'
                    }
                }))
            }]
        };

        chartInstance.current.setOption(option);

        // 차트 리사이즈 핸들러
        const handleResize = () => {
            chartInstance.current?.resize();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [data, onWordClick, darkMode]);

    // 컴포넌트 언마운트 시 차트 정리
    useEffect(() => {
        return () => {
            if (chartInstance.current) {
                chartInstance.current.dispose();
                chartInstance.current = null;
            }
        };
    }, []);

    return (
        <div 
            ref={chartRef} 
            className={`w-full h-full ${className}`}
            style={{ 
                minHeight: '300px',
                borderRadius: '12px',
                cursor: onWordClick ? 'pointer' : 'default'
            }}
        />
    );
};

export default WordCloudChart;
