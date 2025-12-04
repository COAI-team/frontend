import { createEmptyRules, getFirstError } from "./utils";

// 공통 체크 함수
function getNameChecks(name) {
    return {
        noSpaceSpecial: [...name].every(ch => /\p{L}/u.test(ch)) && !name.includes(" "),
    };
}

// UI용 규칙
export function validateNameRules(name) {
    if (!name) {
        return createEmptyRules(["noSpaceSpecial"]);
    }
    return getNameChecks(name);
}

// 제출용 에러 메시지
export function validateNameError(name) {
    if (!name) return "이름을 입력해주세요.";

    const checks = getNameChecks(name);

    return getFirstError(checks, {
        noSpaceSpecial: "이름에는 공백이나 특수문자를 사용할 수 없습니다.",
    });
}