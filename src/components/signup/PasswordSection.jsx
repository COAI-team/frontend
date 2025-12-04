import { useState } from "react";
import {PasswordInputPropTypes} from "../../utils/propTypes";
import RuleItem from "./RuleItem";
import PasswordInput from "./PasswordInput";

export default function PasswordSection({
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
                                        }) {
    const [focusPw, setFocusPw] = useState(false);
    const [focusConfirm, setFocusConfirm] = useState(false);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* 비밀번호 */}
            <div>
                <PasswordInput
                    label="비밀번호"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusPw(true)}
                    onBlur={() => setFocusPw(false)}
                    show={showPassword}
                    setShow={setShowPassword}
                    error={passwordMessage}
                    placeholder="비밀번호 입력"
                />

                {(focusPw || password.length > 0) && (
                    <ul className="mt-2 text-xs space-y-1">
                        <RuleItem ok={passwordRules.hasValidLength} text="길이는 8~20자여야 합니다." />
                        <RuleItem ok={passwordRules.hasAllRequiredTypes} text="영문(대/소문자), 숫자, 특수문자를 모두 포함해야 합니다." />
                    </ul>
                )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
                <PasswordInput
                    label="비밀번호 확인"
                    id="passwordConfirm"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    onFocus={() => setFocusConfirm(true)}
                    onBlur={() => setFocusConfirm(false)}
                    show={showPasswordConfirm}
                    setShow={setShowPasswordConfirm}
                    error={!isPasswordMatch && passwordConfirm.length > 0 ? "비밀번호가 일치하지 않습니다." : ""}
                    placeholder="비밀번호 재입력"
                />

                {(focusConfirm || passwordConfirm.length > 0) && (
                    <ul className="mt-2 text-xs space-y-1">
                        <RuleItem ok={isPasswordMatch} text="비밀번호가 일치해야 합니다." />
                    </ul>
                )}
            </div>

        </div>
    );
}

PasswordSection.propTypes = PasswordInputPropTypes;