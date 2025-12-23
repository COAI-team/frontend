import { useState, useCallback, useMemo, memo } from "react";
import { InputRuleItemPropTypes } from "../../utils/propTypes";
import RuleItem from "./RuleItem";
import { validateNameRules, validateNicknameRules } from "../../utils/validators";

const InputField = ({ label, id, value, onChange, ...rest }) => {
  const [isFocused, setIsFocused] = useState(false);

  // ✅ useMemo로 표시 조건 메모이제이션
  const showRules = useMemo(() =>
      isFocused || value.length > 0,
    [isFocused, value.length]
  );

  // ✅ useMemo로 규칙 검사 메모이제이션
  const nameRules = useMemo(() =>
      id === "name" ? validateNameRules(value) : null,
    [id, value]
  );

  const nicknameRules = useMemo(() =>
      id === "nickname" ? validateNicknameRules(value) : null,
    [id, value]
  );

  // ✅ useCallback으로 이벤트 핸들러 메모이제이션
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // ✅ useMemo로 클래스명 메모이제이션
  const inputClassName = useMemo(() =>
    "mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:bg-white/5 dark:text-white dark:border-white/20",
    []
  );

  // ✅ useMemo로 유효성 검사 결과 메모이제이션
  const isValid = useMemo(() => {
    if (id === "name" && nameRules) {
      return nameRules.noSpaceSpecial;
    }
    if (id === "nickname" && nicknameRules) {
      return nicknameRules.hasValidLength && nicknameRules.isAllowedChars;
    }
    return true;
  }, [id, nameRules, nicknameRules]);

  // ✅ useMemo로 규칙 ID 메모이제이션
  const rulesId = useMemo(() =>
      `${id}-rules`,
    [id]
  );

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium dark:text-gray-100">
        {label}
      </label>

      <input
        id={id}
        type="text"
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={onChange}
        className={inputClassName}
        aria-invalid={value.length > 0 && !isValid}
        aria-describedby={showRules ? rulesId : undefined}
        {...rest}
      />

      {/* 이름 규칙 */}
      {id === "name" && showRules && nameRules && (
        <ul id={rulesId} className="mt-2 text-xs space-y-1">
          <RuleItem
            ok={nameRules.noSpaceSpecial}
            text="공백과 특수문자를 사용할 수 없습니다."
          />
        </ul>
      )}

      {/* 닉네임 규칙 */}
      {id === "nickname" && showRules && nicknameRules && (
        <ul id={rulesId} className="mt-2 text-xs space-y-1">
          <RuleItem
            ok={nicknameRules.hasValidLength}
            text="길이는 3~20자여야 합니다."
          />
          <RuleItem
            ok={nicknameRules.isAllowedChars}
            text="영문, 숫자, '_', '-'만 가능합니다."
          />
        </ul>
      )}
    </div>
  );
};

InputField.propTypes = InputRuleItemPropTypes;

export default memo(InputField);
