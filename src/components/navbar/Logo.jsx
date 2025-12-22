import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { LogoPropTypes } from "../../utils/propTypes";

const Logo = ({ theme }) => {
  // ✅ useMemo로 클래스명 메모이제이션
  const containerClassName = useMemo(() =>
      `p-1.5 rounded-md transition-colors duration-300 ${
        theme === "dark" ? "" : "bg-black"
      }`,
    [theme]
  );

  return (
    <Link
      to="/"
      aria-label="홈으로 이동"
    >
      <div className={containerClassName}>
        <img
          src="/Logo.png"
          alt="CodeSync 로고"
          className="h-8 w-auto"
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
