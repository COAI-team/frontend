import React from 'react';

/**
 * 마크다운 유틸리티 함수
 * - ProblemDetail, ProblemSolve, ProblemGenerator, SubmissionResult에서 공통 사용
 */

/**
 * 문제 설명에서 순수 스토리 부분만 추출
 * (입력/출력 섹션 이전까지)
 */
export const extractPureDescription = (text) => {
  if (!text) return null;

  const inputPatterns = [
    /\*\*입력\*\*/,
    /\*\*입력 형식\*\*/,
    /\n입력\n/,
    /\n입력:/,
  ];

  for (const pattern of inputPatterns) {
    const match = text.search(pattern);
    if (match !== -1) {
      return text.substring(0, match).trim();
    }
  }

  return text;
};

/**
 * 인라인 마크다운 처리 (**bold**, `code`)
 */
export const renderInlineFormatting = (text) => {
  if (!text) return null;

  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="formatted-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="formatted-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

/**
 * 마크다운 텍스트를 React 엘리먼트로 렌더링
 */
export const renderFormattedText = (text) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="formatted-text">
      {lines.map((line, lineIndex) => {
        if (!line.trim()) {
          return <div key={lineIndex} className="formatted-text-empty" />;
        }

        // 리스트 아이템 (- 또는 *)
        const listMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
        if (listMatch) {
          const [, indent, , content] = listMatch;
          const indentLevel = Math.floor(indent.length / 2);
          return (
            <div key={lineIndex} className="formatted-list-item" style={{ marginLeft: `${indentLevel * 16}px` }}>
              <span className="formatted-text-bullet">•</span>
              <span>{renderInlineFormatting(content)}</span>
            </div>
          );
        }

        // 숫자 리스트 (1. 2. 3.)
        const numListMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (numListMatch) {
          const [, indent, num, content] = numListMatch;
          const indentLevel = Math.floor(indent.length / 2);
          return (
            <div key={lineIndex} className="formatted-list-item" style={{ marginLeft: `${indentLevel * 16}px` }}>
              <span className="formatted-text-number">{num}.</span>
              <span>{renderInlineFormatting(content)}</span>
            </div>
          );
        }

        return <div key={lineIndex} className="formatted-text-line">{renderInlineFormatting(line)}</div>;
      })}
    </div>
  );
};
