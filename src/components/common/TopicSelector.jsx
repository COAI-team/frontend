import { useState } from 'react';
import '../../styles/TopicSelector.css';
import {EXTRA_TOPICS, MAIN_TOPICS} from "../constants/topics";
import {TopicSelectorPropTypes} from "../../utils/propTypes";

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

TopicSelector.propTypes = TopicSelectorPropTypes;
