import { createEmptyRules, getFirstError } from "./utils";

// 정규표현식 캐싱 (모듈 수준에서 한 번만 생성)
const REGEX_LETTER_ONLY = /\p{L}/u;

function getNameChecks(name) {
  // 공백 먼저 검사: 포함되면 즉시 false 반환
  if (name.includes(" ")) {
    return {
      noSpaceSpecial: false,
    };
  }

  // 문자열마다 체크 대신 한 번에 검사
  const noSpaceSpecial = REGEX_LETTER_ONLY.test(name) && name === name.match(new RegExp(`^[\\p{L}]+$/u`));

  return {
    noSpaceSpecial: noSpaceSpecial,
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
