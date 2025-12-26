import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/theme/useTheme';
import hljs from 'highlight.js';

const CodeCopy = ({ code, language, onCopy, showLineNumbers = true }) => {
  const { theme } = useTheme();
  const codeRef = useRef(null);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [selectedLines, setSelectedLines] = useState(null);

  // highlight.js 적용
  useEffect(() => {
    if (!codeRef.current || !code) return;

    const codeElement = codeRef.current.querySelector('code');
    if (codeElement) {
      codeElement.classList.remove('hljs');
      delete codeElement.dataset.highlighted;
      hljs.highlightElement(codeElement);
    }
  }, [code, theme]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      
      if (!selection.toString().trim() || !codeRef.current) {
        setToolbarPosition(null);
        setSelectedLines(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = codeRef.current.getBoundingClientRect();

      // 선택된 영역이 코드 블록 내부인지 확인
      if (!codeRef.current.contains(range.commonAncestorContainer)) {
        setToolbarPosition(null);
        setSelectedLines(null);
        return;
      }

      // 라인 번호 계산
      const beforeSelection = range.cloneRange();
      beforeSelection.selectNodeContents(codeRef.current);
      beforeSelection.setEnd(range.startContainer, range.startOffset);
      const beforeText = beforeSelection.toString();
      const selectedText = selection.toString();
      
      const startLine = beforeText.split('\n').length;
      const endLine = startLine + selectedText.split('\n').length - 1;

      setSelectedLines({ start: startLine, end: endLine });
      setToolbarPosition({
        top: rect.bottom - containerRect.top + 5,
        left: rect.left - containerRect.left
      });
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, []);

  const handleCodeCopy = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    navigator.clipboard.writeText(selectedText).then(() => {
      if (onCopy) {
        onCopy('코드가 복사되었습니다');
      }
      setToolbarPosition(null);
      window.getSelection().removeAllRanges();
    });
  };

  const handleLineCopy = () => {
    if (!selectedLines) return;

    const lineTag = selectedLines.start === selectedLines.end
      ? `[L${selectedLines.start}]`
      : `[L${selectedLines.start}-${selectedLines.end}]`;

    navigator.clipboard.writeText(lineTag).then(() => {
      if (onCopy) {
        onCopy('라인 태그가 복사되었습니다');
      }
      setToolbarPosition(null);
      window.getSelection().removeAllRanges();
    });
  };

  const lines = code.split('\n');

  return (
    <div className="relative" style={{ position: 'relative' }}>
      <div 
        ref={codeRef}
        style={{ 
          margin: 0, 
          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f6f8fa',
          position: 'relative',
          display: 'flex'
        }}
      >
        {showLineNumbers && (
          <div style={{
            padding: '1rem 0',
            paddingRight: '1rem',
            paddingLeft: '1rem',
            backgroundColor: theme === 'dark' ? '#0d0d0d' : '#f0f0f0',
            borderRight: `1px solid ${theme === 'dark' ? '#2b2b2b' : '#e5e7eb'}`,
            userSelect: 'none',
            textAlign: 'right',
            minWidth: '3.5rem'
          }}>
            {lines.map((_, index) => (
              <div 
                key={index + 1}
                style={{
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  fontFamily: 'monospace',
                  color: theme === 'dark' ? '#6b7280' : '#9ca3af'
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>
        )}
        <pre style={{ margin: 0, flex: 1, backgroundColor: 'transparent' }}>
          <code 
            className={`language-${language}`} 
            style={{
              display: 'block',
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              fontFamily: 'monospace'
            }}
          >
            {code}
          </code>
        </pre>
      </div>

      {toolbarPosition && (
        <div
          className={`absolute z-10 flex gap-1 p-1 rounded shadow-lg border ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-300'
          }`}
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={handleCodeCopy}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="선택한 코드 복사"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            코드 복사
          </button>
          
          <button
            onClick={handleLineCopy}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="라인 번호 태그 복사"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
            </svg>
            라인 복사
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeCopy;