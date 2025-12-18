import { createEmptyRules, getFirstError } from "./utils";

// 정규표현식 캐싱 (모듈 수준에서 한 번만 생성)
const REGEX_NICKNAME = /^[A-Za-z0-9_-]+$/;

function getNicknameChecks(nickname) {
  // 길이 검사 먼저: 유효하지 않으면 RegExp 테스트 생략
  const lengthValid = nickname.length >= 3 && nickname.length <= 20;
  if (!lengthValid) {
    return {
      hasValidLength: false,
      isAllowedChars: false,
    };
  }

  const isAllowedChars = REGEX_NICKNAME.test(nickname);

  return {
    hasValidLength: true,
    isAllowedChars: isAllowedChars,
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
