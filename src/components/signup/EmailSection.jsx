import {useState} from "react";
import LoadingButton from "../../components/button/LoadingButton";
import RuleItem from "./RuleItem";
import {validateEmailRules} from "../../utils/validators";
import {EmailRuleItemPropTypes} from "../../utils/propTypes";

export default function EmailSection({
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
                                     }) {
    const [isFocused, setIsFocused] = useState(false);
    const rules = validateEmailRules(email);
    const showRules = isFocused || email.length > 0;

    return (
        <div>
            <label
                htmlFor="email"
                className="block text-sm font-medium dark:text-gray-100">이메일</label>

            <div className="mt-2 flex gap-2">
                <input
                    id="email"
                    type="email"
                    value={email}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => {
                        const v = e.target.value;
                        setEmail(v);
                        setEmailError(validateEmail(v));
                    }}
                    placeholder="이메일 입력"
                    className="flex-[3] rounded-md bg-white px-3 py-2 text-gray-900
              outline outline-gray-300 focus:outline-indigo-600
              dark:bg-white/5 dark:text-white"
                    required
                />

                <div className="flex-[1]">
                    <LoadingButton
                        text="인증번호 발송"
                        isLoading={loadingSendEmail}
                        onClick={handleSendEmail}
                        className={`${sendEmailBtn} text-black w-full`}
                    />
                </div>
            </div>
            {/* 규칙 */}
            {showRules && (
                <ul className="mt-2 text-xs space-y-1">
                    <RuleItem ok={rules.hasValidParts} text="'@'와 도메인 형식이 포함되어야 합니다." />
                    <RuleItem ok={rules.isValidFormat} text="올바른 이메일 형식이어야 합니다." />
                </ul>
            )}

            {remainingTime && <p className="mt-1 text-sm text-red-500">남은 시간: {remainingTime}</p>}

            <div className="mt-3 flex gap-2">
                <input
                    type="text"
                    placeholder="인증번호"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-[3] rounded-md bg-white px-3 py-2 text-gray-900
              outline outline-gray-300 focus:outline-indigo-600
              dark:bg-white/5 dark:text-white"
                />

                <div className="flex-[1]">
                    <LoadingButton
                        text="인증번호 확인"
                        isLoading={loadingVerifyEmail}
                        onClick={handleVerifyCode}
                        className={`${verifyBtn} text-black w-full`}
                    />
                </div>
            </div>

            {isVerified && (
                <p className="mt-1 text-sm text-green-400">✔ 이메일 인증 성공!</p>
            )}
        </div>
    );
}

EmailSection.propTypes = EmailRuleItemPropTypes;