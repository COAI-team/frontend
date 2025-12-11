import { useState } from 'react';
import '../../../styles/TopicSelector.css';

// 주제/유형 전체 목록
export const ALL_TOPICS = [
  { value: '', label: '전체', category: 'main' },
  { value: '배열', label: '배열', category: 'main' },
  { value: '문자열', label: '문자열', category: 'main' },
  { value: '동적 프로그래밍', label: 'DP', category: 'main' },
  { value: '그리디', label: '그리디', category: 'main' },
  { value: '깊이 우선 탐색', label: 'DFS', category: 'main' },
  { value: '이진 탐색', label: '이진 탐색', category: 'main' },
  { value: '너비 우선 탐색', label: 'BFS', category: 'main' },
  { value: '그래프', label: '그래프', category: 'main' },
  { value: '백트래킹', label: '백트래킹', category: 'main' },
  { value: '해시 테이블', label: '해시 테이블', category: 'extra' },
  { value: '수학', label: '수학', category: 'extra' },
  { value: '정렬', label: '정렬', category: 'extra' },
  { value: '행렬', label: '행렬', category: 'extra' },
  { value: '비트 조작', label: '비트 조작', category: 'extra' },
  { value: '트리', label: '트리', category: 'extra' },
  { value: '투 포인터', label: '투 포인터', category: 'extra' },
  { value: '누적 합', label: '누적 합', category: 'extra' },
  { value: '힙', label: '힙', category: 'extra' },
  { value: '시뮬레이션', label: '시뮬레이션', category: 'extra' },
  { value: '카운팅', label: '카운팅', category: 'extra' },
  { value: '이진 트리', label: '이진 트리', category: 'extra' },
  { value: '스택', label: '스택', category: 'extra' },
  { value: '슬라이딩 윈도우', label: '슬라이딩 윈도우', category: 'extra' },
  { value: '완전 탐색', label: '완전 탐색', category: 'extra' },
  { value: '유니온 파인드', label: '유니온 파인드', category: 'extra' },
  { value: '정수론', label: '정수론', category: 'extra' },
  { value: '연결 리스트', label: '연결 리스트', category: 'extra' },
  { value: '세그먼트 트리', label: '세그먼트 트리', category: 'extra' },
  { value: '단조 스택', label: '단조 스택', category: 'extra' },
  { value: '트라이', label: '트라이', category: 'extra' },
  { value: '분할 정복', label: '분할 정복', category: 'extra' },
  { value: '조합론', label: '조합론', category: 'extra' },
  { value: '비트마스크', label: '비트마스크', category: 'extra' },
  { value: '큐', label: '큐', category: 'extra' },
  { value: '재귀', label: '재귀', category: 'extra' },
  { value: '기하학', label: '기하학', category: 'extra' },
  { value: '펜윅 트리', label: '펜윅 트리', category: 'extra' },
  { value: '메모이제이션', label: '메모이제이션', category: 'extra' },
  { value: '이진 탐색 트리', label: 'BST', category: 'extra' },
  { value: '최단 경로', label: '최단 경로', category: 'extra' },
  { value: '문자열 매칭', label: '문자열 매칭', category: 'extra' },
  { value: '위상 정렬', label: '위상 정렬', category: 'extra' },
  { value: '게임 이론', label: '게임 이론', category: 'extra' },
  { value: '단조 큐', label: '단조 큐', category: 'extra' },
  { value: '병합 정렬', label: '병합 정렬', category: 'extra' },
  { value: '최소 신장 트리', label: 'MST', category: 'extra' },
];

// 메인 주제만 추출
export const MAIN_TOPICS = ALL_TOPICS.filter(t => t.category === 'main');

// 추가 주제만 추출
export const EXTRA_TOPICS = ALL_TOPICS.filter(t => t.category === 'extra');

// 주제 선택 컴포넌트
const TopicSelector = ({ selectedTopic, onTopicSelect }) => {
  const [showExtraTopics, setShowExtraTopics] = useState(false);

  const handleTopicClick = (topicValue) => {
    onTopicSelect(topicValue);
  };

  return (
    <div className="topic-selector-container">
      {/* 메인 주제 */}
      <div className="topic-buttons-wrapper">
        {MAIN_TOPICS.map((topic) => (
          <button
            key={topic.value}
            type="button"
            onClick={() => handleTopicClick(topic.value)}
            className={`topic-button ${selectedTopic === topic.value ? 'active' : ''}`}
          >
            {topic.label}
          </button>
        ))}
        
        {/* 더보기 버튼 */}
        <button
          type="button"
          onClick={() => setShowExtraTopics(!showExtraTopics)}
          className={`topic-more-button ${showExtraTopics ? 'open' : ''}`}
        >
          <span>더보기</span>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 추가 주제 (펼쳤을 때만 표시) */}
      {showExtraTopics && (
        <div className="extra-topics-section">
          {EXTRA_TOPICS.map((topic) => (
            <button
              key={topic.value}
              type="button"
              onClick={() => handleTopicClick(topic.value)}
              className={`topic-button ${selectedTopic === topic.value ? 'active' : ''}`}
            >
              {topic.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicSelector;