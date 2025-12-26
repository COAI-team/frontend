import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from '../../context/theme/useTheme';
import hljs from 'highlight.js';



const CodeCopy = forwardRef(({ code, language, onCopy, showLineNumbers = true }, ref) => {
  const { theme } = useTheme();
  const codeRef = useRef(null);
  const containerRef = useRef(null);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [selectedLines, setSelectedLines] = useState(null);
  const [highlightedLines, setHighlightedLines] = useState(null);

  useEffect(() => {
    console.log('highlightedLines 상태 변경:', highlightedLines);
  }, [highlightedLines]);

  // 부모 컴포넌트에서 호출할 수 있는 함수 노출
  useImperativeHandle(ref, () => ({
    highlightLines: (startLine, endLine) => {
      console.log('CodeCopy highlightLines 호출됨:', startLine, endLine);
      console.log('containerRef.current:', containerRef.current);
      
      setHighlightedLines({ start: startLine, end: endLine });
      
      // 해당 라인으로 스크롤
      if (containerRef.current) {
        const lineHeight = 21; // 1.5 * 14px (fontSize 0.875rem)
        const scrollTop = (startLine - 1) * lineHeight - 100;
        console.log('스크롤 위치:', scrollTop);
        containerRef.current.scrollTop = Math.max(0, scrollTop);
      } else {
        console.log('containerRef.current가 null입니다');
      }

      // 3초 후 하이라이트 제거
      setTimeout(() => {
        console.log('하이라이트 제거');
        setHighlightedLines(null);
      }, 3000);
    }
  }));

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

      if (!codeRef.current.contains(range.commonAncestorContainer)) {
        setToolbarPosition(null);
        setSelectedLines(null);
        return;
      }

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
  const lineHeight = 21; // 1.5 * 14px

  return (
    <div className="relative" style={{ position: 'relative' }}>
      <div 
        ref={containerRef}
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
        <div ref={codeRef} style={{ flex: 1, position: 'relative' }}>
          <pre style={{ margin: 0, backgroundColor: 'transparent', position: 'relative' }}>
            {/* 오버레이를 pre 안쪽으로 이동 */}
            {highlightedLines && (
              <div
                style={{
                  position: 'absolute',
                  left: '1rem',  // padding 고려
                  right: '1rem',
                  top: `${(highlightedLines.start - 1) * lineHeight + 16}px`,
                  height: `${(highlightedLines.end - highlightedLines.start + 1) * lineHeight}px`,
                  backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                  pointerEvents: 'none',
                  zIndex: 3  // 코드 뒤에 배치
                }}
              />
            )}
            <code 
              className={`language-${language}`} 
              style={{
                display: 'block',
                padding: '1rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                fontFamily: 'monospace',
                position: 'relative',
                zIndex: 1
              }}
            >
              {code}
            </code>
          </pre>
        </div>
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
});

export default CodeCopy;