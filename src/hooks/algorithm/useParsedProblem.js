import { useMemo } from 'react';

/**
 * 문제 설명 파싱 결과의 섹션 구조
 * @typedef {Object} ParsedSections
 * @property {string} description - 문제 설명 (첫 섹션 이전의 텍스트)
 * @property {string} input - 입력 설명
 * @property {string} output - 출력 설명
 * @property {string} constraints - 제한사항
 * @property {string} exampleInput - 예제 입력
 * @property {string} exampleOutput - 예제 출력
 */

/**
 * 문제 설명 파싱 함수
 * 마크다운 형식의 문제 설명을 구조화된 섹션으로 분리
 *
 * @param {string} description - 원본 문제 설명 텍스트
 * @returns {ParsedSections|null} 파싱된 섹션 객체 또는 null
 */
const parseProblemDescription = (description) => {
  if (!description) return null;

  const sections = {
    description: '',
    input: '',
    output: '',
    constraints: '',
    exampleInput: '',
    exampleOutput: '',
  };

  // 섹션 구분자 패턴 (유연한 매칭: **입력**, 입력:, ## 입력 등 모두 지원)
  const patterns = {
    input: /(?:^|\n)(?:\*\*)?(?:입력|Input)(?:\*\*)?\s*(?::|：)?\s*\n?/i,
    output: /(?:^|\n)(?:\*\*)?(?:출력|Output)(?:\*\*)?\s*(?::|：)?\s*\n?/i,
    constraints: /(?:^|\n)(?:\*\*)?(?:제한\s*사항|제한|조건|제약|Constraints?)(?:\*\*)?\s*(?::|：)?\s*\n?/i,
    exampleInput: /(?:^|\n)(?:\*\*)?(?:예제\s*입력|입력\s*예제|예시\s*입력|Sample\s*Input|Example\s*Input)(?:\*\*)?\s*(?:\d*)\s*(?::|：)?\s*\n?/i,
    exampleOutput: /(?:^|\n)(?:\*\*)?(?:예제\s*출력|출력\s*예제|예시\s*출력|Sample\s*Output|Example\s*Output)(?:\*\*)?\s*(?:\d*)\s*(?::|：)?\s*\n?/i,
  };

  let remaining = description;
  let firstSectionStart = remaining.length;

  // 각 섹션의 시작 위치 찾기
  const sectionPositions = [];
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = remaining.match(pattern);
    if (match) {
      const pos = remaining.indexOf(match[0]);
      sectionPositions.push({ key, pos, matchLength: match[0].length });
      if (pos < firstSectionStart) {
        firstSectionStart = pos;
      }
    }
  }

  // 문제 설명 (첫 섹션 이전의 모든 텍스트)
  sections.description = remaining.substring(0, firstSectionStart).trim();

  // 위치순 정렬
  sectionPositions.sort((a, b) => a.pos - b.pos);

  // 각 섹션 내용 추출
  for (let i = 0; i < sectionPositions.length; i++) {
    const current = sectionPositions[i];
    const next = sectionPositions[i + 1];
    const startPos = current.pos + current.matchLength;
    const endPos = next ? next.pos : remaining.length;
    sections[current.key] = remaining.substring(startPos, endPos).trim();
  }

  return sections;
};

/**
 * 문제 설명 파싱 커스텀 훅
 *
 * 문제 설명 문자열을 구조화된 섹션으로 파싱하고 결과를 메모이제이션합니다.
 * 동일한 description에 대해 파싱 결과를 캐싱하여 불필요한 재계산을 방지합니다.
 *
 * @param {string} description - 원본 문제 설명 텍스트
 * @returns {ParsedSections|null} 파싱된 섹션 객체 또는 null
 *
 * @example
 * const parsedSections = useParsedProblem(problem?.description);
 *
 * if (parsedSections) {
 *   console.log(parsedSections.description); // 문제 설명
 *   console.log(parsedSections.input);       // 입력 설명
 *   console.log(parsedSections.output);      // 출력 설명
 *   console.log(parsedSections.constraints); // 제한사항
 *   console.log(parsedSections.exampleInput);  // 예제 입력
 *   console.log(parsedSections.exampleOutput); // 예제 출력
 * }
 */
export const useParsedProblem = (description) => {
  return useMemo(() => {
    return parseProblemDescription(description);
  }, [description]);
};

// 순수 함수도 내보내기 (컴포넌트 외부에서 사용 시)
export { parseProblemDescription };

export default useParsedProblem;
