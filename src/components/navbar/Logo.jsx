import { memo } from "react";
import { Link } from "react-router-dom";
import { LogoPropTypes } from "../../utils/propTypes";

// eslint-disable-next-line no-unused-vars
const Logo = ({ theme }) => {
  return (
    <Link
      to="/"
      aria-label="홈으로 이동"
    >
      <div className="p-1.5 rounded-md transition-all duration-300">
        <img
          src="/Logo.png"
          alt="CodeSync 로고"
          className="h-8 w-auto transition-all duration-300 invert dark:invert-0"
          width="184"
          height="33"
          loading="eager"
          decoding="async"
        />
      </div>
    </Link>
  );
};

Logo.propTypes = LogoPropTypes;

export default memo(Logo);
