import { createEmptyRules, getFirstError } from "./utils";

function getPasswordChecks(password) {
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[-!@#$%^&*()_+~={}[\]|;:"<>,.?/]/.test(password);

    return {
        hasValidLength: password.length >= 8 && password.length <= 20,
        hasAllRequiredTypes: hasLetter && hasNumber && hasSpecial,
    };
}

// UI용 규칙
export function validatePasswordRules(password) {
    if (!password) {
        return createEmptyRules([
            "hasValidLength",
            "hasAllRequiredTypes",
        ]);
    }
    return getPasswordChecks(password);
}

// 제출용 에러 메시지
export function validatePassword(password) {
    if (!password) return "";

    const checks = getPasswordChecks(password);

    return getFirstError(checks, {
        hasValidLength: "비밀번호는 8~20자여야 합니다.",
        hasAllRequiredTypes: "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.",
    });
}