import PropTypes from 'prop-types';
import { SOURCE_OPTIONS } from '../../../service/algorithm/AlgorithmApi';
import DifficultyBadge from './DifficultyBadge';

/**
 * 알고리즘 문제 카드 컴포넌트
 * @param {Object} problem - 문제 데이터 객체
 * @param {Function} onClick - 클릭 이벤트 핸들러
 */
const ProblemCard = ({ problem, onClick }) => {
  // 출처 아이콘 매핑
  const getSourceIcon = (source) => {
    const icons = {
      AI_GENERATED: '🤖',
      BOJ: '🏛️',
      CUSTOM: '✏️'
    };
    return icons[source] || '📄';
  };

  // 출처 라벨 가져오기
  const getSourceLabel = (source) => {
    return SOURCE_OPTIONS.find(opt => opt.value === source)?.label || source;
  };

  const handleClick = () => {
    console.log('🔍 클릭된 문제 ID:', problem.algoProblemId);
    onClick(problem.algoProblemId);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* 문제 제목 영역 */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg font-medium text-gray-900">
              #{problem.algoProblemId}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              {problem.algoProblemTitle}
            </h3>
          </div>

          {/* 문제 메타 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {/* 난이도 뱃지 */}
            <DifficultyBadge difficulty={problem.algoProblemDifficulty} />

            {/* 문제 유형 배지 */}
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${problem.problemType === 'SQL'
              ? 'bg-purple-100 text-purple-700 border-purple-200'
              : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}>
              {problem.problemType === 'SQL' ? 'DATABASE' : 'ALGO'}
            </span>

            {/* 출처 */}
            <span className="flex items-center gap-1">
              {getSourceIcon(problem.algoProblemSource)}
              {getSourceLabel(problem.algoProblemSource)}
            </span>

            {/* 시간 제한 */}
            <span className="flex items-center gap-1">
              ⏱️ {problem.timelimit}ms
            </span>

            {/* 메모리 제한 */}
            <span className="flex items-center gap-1">
              💾 {problem.memorylimit}MB
            </span>
          </div>

          {/* 태그 영역 */}
          {problem.tagsAsList && problem.tagsAsList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {problem.tagsAsList.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                >
                  {tag.replace(/["[\]]/g, '')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 화살표 아이콘 */}
        <div className="flex items-center text-gray-400 ml-4">
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

ProblemCard.propTypes = {
  problem: PropTypes.shape({
    algoProblemId: PropTypes.number.isRequired,
    algoProblemTitle: PropTypes.string.isRequired,
    algoProblemDifficulty: PropTypes.oneOf(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).isRequired,
    algoProblemSource: PropTypes.oneOf(['AI_GENERATED', 'BOJ', 'CUSTOM']).isRequired,
    timelimit: PropTypes.number.isRequired,
    memorylimit: PropTypes.number.isRequired,
    tagsAsList: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ProblemCard;
