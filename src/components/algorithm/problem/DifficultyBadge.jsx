import PropTypes from 'prop-types';

/**
 * 알고리즘 문제 난이도 뱃지 컴포넌트
 * @param {string} difficulty - 난이도 (BRONZE, SILVER, GOLD, PLATINUM)
 * @param {string} size - 크기 (sm, md, lg)
 */
const DifficultyBadge = ({ difficulty, size = 'md' }) => {
  // 난이도별 색상 매핑
  const colorClasses = {
    BRONZE: 'bg-orange-100 text-orange-800 border-orange-200',
    SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
    GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PLATINUM: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  // 크기별 스타일
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  // 난이도 한글 표시 (선택사항)
//   const difficultyLabels = {
//     BRONZE: '브론즈',
//     SILVER: '실버',
//     GOLD: '골드',
//     PLATINUM: '플래티넘',
//   };

  return (
    <span
      className={`
        ${colorClasses[difficulty] || 'bg-gray-100 text-gray-800 border-gray-200'}
        ${sizeClasses[size]}
        rounded-full font-semibold border inline-flex items-center justify-center
        transition-all duration-200 hover:scale-105
      `}
    >
      {difficulty}
    </span>
  );
};

DifficultyBadge.propTypes = {
  difficulty: PropTypes.oneOf(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default DifficultyBadge;