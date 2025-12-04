import { createEmptyRules, getFirstError } from "./utils";

// 공통 체크 함수
function getEmailChecks(email) {
    const hasAt = email.includes("@");
    const hasDomain = email.split("@")[1]?.includes(".") ?? false;

    const isValidFormat = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);

    return {
        hasValidParts: hasAt && hasDomain,
        isValidFormat
    };
}

// UI용 규칙
export function validateEmailRules(email) {
    if (!email) {
        return createEmptyRules(["hasValidParts", "isValidFormat"]);
    }
    return getEmailChecks(email);
}

// 제출용 에러 메시지
export function validateEmail(email) {
    if (!email) return "이메일을 입력해주세요.";

    const checks = getEmailChecks(email);

    return getFirstError(checks, {
        hasValidParts: "이메일에는 '@'와 올바른 도메인이 포함되어야 합니다.",
        isValidFormat: "올바른 이메일 형식이 아닙니다. 예: example@gmail.com"
    });
}