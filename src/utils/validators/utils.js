/**
 * 규칙 키 배열을 받아 모두 false인 초기 객체를 생성
 * ex) createEmptyRules(["a", "b"]) → { a:false, b:false }
 */
export function createEmptyRules(ruleKeys) {
  const result = {};
  for (const element of ruleKeys) {
    result[element] = false;
  }
  return result;
}

/**
 * 검사 객체(checks)에서 false인 항목의 메시지를 반환
 * checks = { rule1: true, rule2: false }
 * messages = { rule2: "오류 메시지" }
 */
export function getFirstError(checks, messages) {
  const keys = Object.keys(checks);
  for (const element of keys) {
    const key = element;
    if (!checks[key]) return messages[key];
  }
  return "";
}
