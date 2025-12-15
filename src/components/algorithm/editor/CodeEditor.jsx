import React, { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { editorOptions, LANGUAGE_MAP } from './editorUtils';
import {CodeEditorPropTypes} from '../../../utils/propTypes';
/**
 * Monaco Editor 컴포넌트 (ALG-04)
 * 문제 풀이용 코드 에디터
 */
const CodeEditor = ({ 
  language = 'javascript', 
  value = '', 
  onChange,
  onMount,
  height = '400px',
  theme = 'vs-dark',
  readOnly = false,
  className = ''
}) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // 코드 포맷팅
  const formatCode = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  }, []);

  // 전체 선택
  const selectAll = useCallback(() => {
    editorRef.current?.getAction('editor.action.selectAll')?.run();
  }, []);

  // 실행 취소
  const undo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'undo');
  }, []);

  // 다시 실행
  const redo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'redo');
  }, []);

  // 특정 라인으로 이동
  const goToLine = useCallback((lineNumber) => {
    if (editorRef.current) {
      editorRef.current.revealLine(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  }, []);

  // 에디터 마운트 핸들러
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // 기본 옵션 설정
    editor.updateOptions({
      fontSize: 14,
      fontFamily: '"Fira Code", "JetBrains Mono", "Monaco", "Menlo", monospace',
      fontLigatures: true,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: 'on',
      tabSize: language === 'python' ? 4 : 2,
      insertSpaces: true,
      renderWhitespace: 'boundary',
      bracketPairColorization: { enabled: true },
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      padding: { top: 16, bottom: 16 },
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10
      }
    });

    // Ctrl+S 저장 단축키 차단
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // 저장 기능 없음 - 단축키만 차단
    });

    // Ctrl+Enter 실행 단축키 (부모에서 처리 가능하도록)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const event = new CustomEvent('editor-run', { detail: { code: editor.getValue() } });
      globalThis.dispatchEvent(event);
    });

    // 테마 커스터마이징
    monaco.editor.defineTheme('algorithm-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editorCursor.foreground': '#aeafad',
        'editor.wordHighlightBackground': '#575757',
      }
    });
    
    if (theme === 'vs-dark') {
      monaco.editor.setTheme('algorithm-dark');
    }

    // 부모 컴포넌트 콜백 호출
    if (onMount) {
      onMount(editor, monaco);
    }

    // 에디터에 포커스
    setTimeout(() => editor.focus(), 100);
  }, [language, theme, onMount]);

  // 언어 변경 시 에디터 옵션 업데이트
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        tabSize: language === 'python' ? 4 : 2
      });
    }
  }, [language]);

  // 외부에서 사용할 수 있도록 ref에 유틸리티 함수 노출
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.utils = { formatCode, selectAll, undo, redo, goToLine };
    }
  }, [formatCode, selectAll, undo, redo, goToLine]);

  return (
    <div className={`relative h-full ${className}`}>
      <Editor
        height={height}
        language={LANGUAGE_MAP[language] || 'javascript'}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          ...editorOptions.base,
          readOnly,
          tabSize: language === 'python' ? 4 : 2
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-zinc-900">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
              <span>에디터 로딩 중...</span>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor;

CodeEditor.propTypes = CodeEditorPropTypes;
