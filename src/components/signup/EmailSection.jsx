import { useState, useCallback, useMemo, memo } from "react";
import LoadingButton from "../../components/button/LoadingButton";
import RuleItem from "./RuleItem";
import { validateEmailRules } from "../../utils/validators";
import { EmailRuleItemPropTypes } from "../../utils/propTypes";

const EmailSection = ({
                        email,
                        setEmail,
                        setEmailError,
                        validateEmail,
                        handleSendEmail,
                        handleVerifyCode,
                        remainingTime,
                        sendEmailBtn,
                        verifyBtn,
                        code,
                        setCode,
                        isVerified,
                        loadingSendEmail,
                        loadingVerifyEmail,
                      }) => {
  const [isFocused, setIsFocused] = useState(false);

  // ✅ useMemo로 규칙 검사 메모이제이션
  const rules = useMemo(() =>
      validateEmailRules(email),
    [email]
  );

  // ✅ useMemo로 표시 조건 메모이제이션
  const showRules = useMemo(() =>
      isFocused || email.length > 0,
    [isFocused, email.length]
  );

  // ✅ useCallback으로 이벤트 핸들러 메모이제이션
  const handleEmailFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleEmailBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleEmailChange = useCallback((e) => {
    const v = e.target.value;
    setEmail(v);
    setEmailError(validateEmail(v));
  }, [setEmail, setEmailError, validateEmail]);

  const handleCodeChange = useCallback((e) => {
    setCode(e.target.value);
  }, [setCode]);

  // ✅ useMemo로 클래스명 메모이제이션
  const inputClassName = useMemo(() =>
      "flex-[3] rounded-md bg-white px-3 py-2 text-gray-900 outline outline-gray-300 focus:outline-indigo-600 dark:bg-white/5 dark:text-white",
    []
  );

  const sendButtonClassName = useMemo(() =>
      `${sendEmailBtn} text-black w-full`,
    [sendEmailBtn]
  );

  const verifyButtonClassName = useMemo(() =>
      `${verifyBtn} text-black w-full`,
    [verifyBtn]
  );

  return (
    <div>
      <label
        htmlFor="email"
        className="block text-sm font-medium dark:text-gray-100">
        이메일
      </label>

      <div className="mt-2 flex gap-2">
        <input
          id="email"
          type="email"
          value={email}
          onFocus={handleEmailFocus}
          onBlur={handleEmailBlur}
          onChange={handleEmailChange}
          placeholder="이메일 입력"
          className={inputClassName}
          required
          aria-invalid={email.length > 0 && (!rules.hasValidParts || !rules.isValidFormat)}
          aria-describedby={showRules ? "email-rules" : undefined}
        />

        <div className="flex-1">
          <LoadingButton
            text="인증번호 발송"
            isLoading={loadingSendEmail}
            onClick={handleSendEmail}
            className={sendButtonClassName}
          />
        </div>
      </div>

      {/* 규칙 */}
      {showRules && (
        <ul id="email-rules" className="mt-2 text-xs space-y-1">
          <RuleItem
            ok={rules.hasValidParts}
            text="'@'와 도메인 형식이 포함되어야 합니다."
          />
          <RuleItem
            ok={rules.isValidFormat}
            text="올바른 이메일 형식이어야 합니다."
          />
        </ul>
      )}

      {/* 남은 시간 */}
      {remainingTime && (
        <output
          className="mt-1 text-sm text-red-500 block"
          role="timer"
          aria-live="polite"
        >
          남은 시간: {remainingTime}
        </output>
      )}

      {/* 인증번호 입력 */}
      <div className="mt-3 flex gap-2">
        <input
          id="verification-code"
          type="text"
          placeholder="인증번호"
          value={code}
          onChange={handleCodeChange}
          className={inputClassName}
          aria-label="인증번호 입력"
          aria-describedby={isVerified ? "verification-success" : undefined}
        />

        <div className="flex-1">
          <LoadingButton
            text="인증번호 확인"
            isLoading={loadingVerifyEmail}
            onClick={handleVerifyCode}
            className={verifyButtonClassName}
          />
        </div>
      </div>

      {/* 인증 성공 메시지 */}
      {isVerified && (
        <output
          id="verification-success"
          className="mt-1 text-sm text-green-400 dark:text-green-500 flex items-center gap-1"
          aria-live="polite"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          이메일 인증 성공!
        </output>
      )}
    </div>
  );
};

EmailSection.propTypes = EmailRuleItemPropTypes;

// ✅ React.memo로 불필요한 재렌더링 방지
export default memo(EmailSection);
