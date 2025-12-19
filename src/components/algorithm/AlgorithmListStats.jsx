import React, { useEffect, useState } from 'react';
import { useCountAnimation } from '../../hooks/algorithm/useCountAnimation';
import { getAlgorithmStatistics } from '../../service/algorithm/algorithmApi';
import '../../styles/AlgorithmListStats.css';

const StatCard = ({ label, value, color, suffix = '', isDecimal = false }) => {
  const displayValue = isDecimal ? Math.round(value * 10) / 10 : Math.round(value);
  const [count, ref] = useCountAnimation(displayValue, 2000);

  const formattedValue = isDecimal 
    ? count.toFixed(1) 
    : count.toLocaleString();

  return (
    <div className="stat-card" style={{ '--card-color': color }} ref={ref}>
      <div className="stat-content">
        <div className="stat-value">
          {formattedValue}
          {suffix && <span className="stat-suffix">{suffix}</span>}
        </div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-background-gradient"></div>
    </div>
  );
};

const AlgorithmListStats = () => {
  const [stats, setStats] = useState({
    totalProblems: 0,
    solvedProblems: 0,
    averageAccuracy: 0,
    totalAttempts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAlgorithmStatistics();
        if (!data.error) {
          setStats(data);
        }
      } catch (error) {
        console.error('통계 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="algorithm-stats-loading">
        <div className="loading-spinner"></div>
        <p>통계를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="algorithm-list-stats-container">
      <div className="stats-header">
        <h2 className="stats-title">알고리즘 문제 통계</h2>
        <p className="stats-subtitle">전체 문제에 대한 통계 정보를 한눈에 확인하세요</p>
      </div>

      <div className="stats-grid">
        <StatCard
          label="전체 문제 수"
          value={stats.totalProblems}
          color="#3b82f6"
          suffix="개"
        />

        <StatCard
          label="내가 푼 문제"
          value={stats.solvedProblems}
          color="#10b981"
          suffix="개"
        />
        
        <StatCard
          label="전체 제출 수"
          value={stats.totalAttempts}
          color="#8b5cf6"
          suffix="회"
        />
        
        <StatCard
          label="평균 정답률"
          value={stats.averageAccuracy}
          color="#f59e0b"
          suffix="%"
          isDecimal={true}
        />
      </div>
    </div>
  );
};

export default AlgorithmListStats;