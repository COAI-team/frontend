import { createEmptyRules, getFirstError } from "./utils";

// 정규표현식 캐싱 (모듈 수준에서 한 번만 생성)
const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function getEmailChecks(email) {
  // '@' 없으면 즉시 실패
  if (!email.includes("@")) {
    return {
      hasValidParts: false,
      isValidFormat: false
    };
  }

  // 도메인 부분 추출 및 검사 (split 최소화)
  const domainPart = email.split("@")[1];
  if (!domainPart || !domainPart.includes(".")) {
    return {
      hasValidParts: false,
      isValidFormat: false
    };
  }

  const isValidFormat = REGEX_EMAIL.test(email);

  return {
    hasValidParts: true,
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
