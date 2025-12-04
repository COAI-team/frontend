import { createEmptyRules, getFirstError } from "./utils";

function getNicknameChecks(nickname) {
    return {
        hasValidLength: nickname.length >= 3 && nickname.length <= 20,
        isAllowedChars: /^[A-Za-z0-9_-]+$/.test(nickname),
    };
}

// UI용 규칙
export function validateNicknameRules(nickname) {
    if (!nickname) {
        return createEmptyRules(["hasValidLength", "isAllowedChars"]);
    }
    return getNicknameChecks(nickname);
}

// 제출용 에러 메시지
export function validateNickname(nickname) {
    if (!nickname) return "닉네임을 입력해주세요.";

    const checks = getNicknameChecks(nickname);

    return getFirstError(checks, {
        hasValidLength: "닉네임은 3~20자여야 합니다.",
        isAllowedChars: "닉네임은 영문, 숫자, '_', '-'만 사용할 수 있습니다.",
    });
}
