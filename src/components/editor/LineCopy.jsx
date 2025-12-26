import React from 'react';
import { useTheme } from '../../context/theme/useTheme';

const LineCopy = ({ content, onLineClick }) => {
  const { theme } = useTheme();

  // [L15-20] 또는 [L15] 패턴 파싱
  const parseLineReferences = (text) => {
    const parts = [];
    const regex = /\[L(\d+)(?:-(\d+))?\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // 일반 텍스트 추가
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }

      // 라인 참조 추가
      const startLine = parseInt(match[1]);
      const endLine = match[2] ? parseInt(match[2]) : startLine;
      
      parts.push({
        type: 'line',
        content: match[0],
        startLine,
        endLine
      });

      lastIndex = regex.lastIndex;
    }

    // 남은 텍스트 추가
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    return parts;
  };

  const parts = parseLineReferences(content);

  const handleLineClick = (startLine, endLine) => {
    if (onLineClick) {
      onLineClick(startLine, endLine);
    }
  };

  return (
    <span>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        }

        return (
          <button
            key={index}
            onClick={() => handleLineClick(part.startLine, part.endLine)}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono transition-colors ${
              theme === 'dark'
                ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-700'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
            title={`${part.startLine}번 라인으로 이동`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            {part.content}
          </button>
        );
      })}
    </span>
  );
};

export default LineCopy;