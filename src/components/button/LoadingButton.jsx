import { memo } from "react";
import {LoadingButtonPropTypes} from "../../utils/propTypes.js";

const LoadingButton = ({
                         text = "로딩중…",
                         isLoading = false, // ✅ 기본값 명시
                         onClick,
                         disabled = false,
                         className = "",
                         type = "submit", // ✅ type을 prop으로 받을 수 있게
                         loadingText = "로딩중…", // ✅ 로딩 텍스트 커스터마이징 가능
                         ...rest
                       }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
                flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-black
                ${className}
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
      aria-busy={isLoading} // ✅ 접근성: 로딩 상태 알림
      aria-label={isLoading ? loadingText : text} // ✅ 접근성: 스크린 리더용
      {...rest}
    >
      {isLoading && (
        <svg
          className="mr-2 size-5 animate-spin text-black"
          viewBox="0 0 24 24"
          aria-hidden="true" // ✅ 접근성: 장식용 아이콘
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}

      {isLoading ? loadingText : text}
    </button>
  );
};

LoadingButton.propTypes = LoadingButtonPropTypes;

export default memo(LoadingButton);
