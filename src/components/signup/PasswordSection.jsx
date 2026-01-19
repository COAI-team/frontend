import { useState, useCallback, useMemo, memo } from "react";
import { PasswordInputPropTypes } from "../../utils/propTypes";
import RuleItem from "./RuleItem";
import PasswordInput from "./PasswordInput";

const PasswordSection = ({
                           password,
                           setPassword,
                           passwordConfirm,
                           setPasswordConfirm,
                           showPassword,
                           setShowPassword,
                           showPasswordConfirm,
                           setShowPasswordConfirm,
                           passwordRules,
                           passwordMessage,
                           isPasswordMatch,
                         }) => {
  const [focusPw, setFocusPw] = useState(false);
  const [focusConfirm, setFocusConfirm] = useState(false);

  // ✅ useCallback으로 이벤트 핸들러 메모이제이션
  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, [setPassword]);

  const handlePasswordConfirmChange = useCallback((e) => {
    setPasswordConfirm(e.target.value);
  }, [setPasswordConfirm]);

  const handlePasswordFocus = useCallback(() => {
    setFocusPw(true);
  }, []);

  const handlePasswordBlur = useCallback(() => {
    setFocusPw(false);
  }, []);

  const handleConfirmFocus = useCallback(() => {
    setFocusConfirm(true);
  }, []);

  const handleConfirmBlur = useCallback(() => {
    setFocusConfirm(false);
  }, []);

  // ✅ useMemo로 표시 조건 메모이제이션
  const showPasswordRules = useMemo(() =>
      focusPw || password.length > 0,
    [focusPw, password.length]
  );

  const showConfirmRules = useMemo(() =>
      focusConfirm || passwordConfirm.length > 0,
    [focusConfirm, passwordConfirm.length]
  );

  // ✅ useMemo로 에러 메시지 메모이제이션
  const confirmErrorMessage = useMemo(() =>
      !isPasswordMatch && passwordConfirm.length > 0 ? "비밀번호가 일치하지 않습니다." : "",
    [isPasswordMatch, passwordConfirm.length]
  );

  // ✅ useMemo로 확인 메시지 메모이제이션
  const confirmMessage = useMemo(() => {
    if (focusConfirm && password.length === 0 && passwordConfirm.length === 0) {
      return (
        <RuleItem ok={false} text="비밀번호를 먼저 입력해주세요." />
      );
    }

    if (passwordConfirm.length > 0) {
      return (
        <RuleItem
          ok={isPasswordMatch}
          text={isPasswordMatch ? "비밀번호가 일치합니다." : "비밀번호가 일치해야 합니다."}
        />
      );
    }

    return null;
  }, [focusConfirm, password.length, passwordConfirm.length, isPasswordMatch]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

      {/* 비밀번호 */}
      <div>
        <PasswordInput
          label="비밀번호"
          id="password"
          value={password}
          onChange={handlePasswordChange}
          onFocus={handlePasswordFocus}
          onBlur={handlePasswordBlur}
          show={showPassword}
          setShow={setShowPassword}
          error={passwordMessage}
          placeholder="비밀번호 입력"
        />

        {showPasswordRules && (
          <ul className="mt-2 text-xs space-y-1">
            <RuleItem
              ok={passwordRules.hasValidLength}
              text="길이는 8~20자여야 합니다."
            />
            <RuleItem
              ok={passwordRules.hasAllRequiredTypes}
              text="영문(대/소문자), 숫자, 특수문자를 모두 포함해야 합니다."
            />
          </ul>
        )}
      </div>

      {/* 비밀번호 확인 */}
      <div>
        <PasswordInput
          label="비밀번호 확인"
          id="passwordConfirm"
          value={passwordConfirm}
          onChange={handlePasswordConfirmChange}
          onFocus={handleConfirmFocus}
          onBlur={handleConfirmBlur}
          show={showPasswordConfirm}
          setShow={setShowPasswordConfirm}
          error={confirmErrorMessage}
          placeholder="비밀번호 재입력"
        />

        {showConfirmRules && (
          <ul className="mt-2 text-xs space-y-1">
            {confirmMessage}
          </ul>
        )}
      </div>

    </div>
  );
};

PasswordSection.propTypes = PasswordInputPropTypes;

export default memo(PasswordSection);
