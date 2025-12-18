import { createEmptyRules, getFirstError } from "./utils";

// 정규표현식 캐싱 (모듈 수준에서 한 번만 생성)
const REGEX_LETTER = /[A-Za-z]/;
const REGEX_NUMBER = /\d/;
const REGEX_SPECIAL = /[-!@#$%^&*()_+~={}[\]|;:"<>,.?/]/;

function getPasswordChecks(password) {
  // 길이 검사 먼저: 유효하지 않으면 RegExp 테스트 생략
  const lengthValid = password.length >= 8 && password.length <= 20;
  if (!lengthValid) {
    return {
      hasValidLength: false,
      hasAllRequiredTypes: false,
    };
  }

  const hasLetter = REGEX_LETTER.test(password);
  const hasNumber = REGEX_NUMBER.test(password);
  const hasSpecial = REGEX_SPECIAL.test(password);

  return {
    hasValidLength: true,
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
