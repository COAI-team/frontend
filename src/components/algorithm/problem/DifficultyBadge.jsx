import PropTypes from "prop-types";
import { getDifficultyColorClasses } from "../../constants/difficultyColors";

const DifficultyBadge = ({ difficulty, size = "md" }) => {
  const colors = getDifficultyColorClasses(difficulty);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`
        ${colors.bg} ${colors.text} ${colors.border}
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
  difficulty: PropTypes.oneOf(["BRONZE", "SILVER", "GOLD", "PLATINUM"]).isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
};

export default DifficultyBadge;
