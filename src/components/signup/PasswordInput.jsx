import { useCallback, useMemo, memo } from "react";
import { PasswordRuleItemPropTypes } from "../../utils/propTypes";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

const PasswordInput = ({
                         label,
                         id,
                         value,
                         onChange,
                         onFocus,
                         onBlur,
                         show,
                         setShow,
                         placeholder,
                       }) => {
  // ✅ useCallback으로 토글 함수 메모이제이션
  const handleToggleShow = useCallback(() => {
    setShow(!show);
  }, [show, setShow]);

  // ✅ useMemo로 input type 메모이제이션
  const inputType = useMemo(() =>
      show ? "text" : "password",
    [show]
  );

  // ✅ useMemo로 클래스명 메모이제이션
  const inputClassName = useMemo(() =>
      "mt-2 block w-full rounded-md bg-white px-3 py-2 pr-10 text-gray-900 outline outline-gray-300 focus:outline-indigo-600 dark:bg-white/5 dark:text-white",
    []
  );

  const buttonClassName = useMemo(() =>
      "absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded",
    []
  );

  // ✅ useMemo로 버튼 레이블 메모이제이션
  const buttonLabel = useMemo(() =>
      show ? "비밀번호 숨기기" : "비밀번호 보기",
    [show]
  );

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium dark:text-gray-100">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className={inputClassName}
          autoComplete={id === "password" ? "current-password" : "new-password"}
        />

        <button
          type="button"
          onClick={handleToggleShow}
          className={buttonClassName}
          aria-label={buttonLabel}
          aria-pressed={show}
        >
          {show ? (
            <AiFillEyeInvisible aria-hidden="true" />
          ) : (
            <AiFillEye aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
};

PasswordInput.propTypes = PasswordRuleItemPropTypes;

export default memo(PasswordInput);
