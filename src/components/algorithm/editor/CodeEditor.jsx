import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

/**
 * Monaco Editor 컴포넌트 (ALG-04 관련)
 * 문제 풀이용 코드 에디터
 */
const CodeEditor = ({ 
  language = 'javascript', 
  value = '', 
  onChange,
  height = '400px',
  theme = 'vs-dark',
  readOnly = false,
  className = ''
}) => {
  const editorRef = useRef(null);

  // 언어별 Monaco 언어 매핑
  const languageMap = {
    'javascript': 'javascript',
    'python': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c'
  };

  // 에디터 마운트 시 설정
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // 에디터 기본 설정
    editor.updateOptions({
      fontSize: 14,
      fontFamily: '"Fira Code", "Monaco", "Menlo", monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'boundary',
      bracketPairColorization: { enabled: true }
    });

    // 키보드 단축키 설정
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Ctrl+S 방지 (저장 기능 없음)
      console.log('저장 단축키 차단됨');
    });

    // 자동완성 강화 설정
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
  };

  // 언어별 기본 설정
  const getEditorOptions = () => {
    const baseOptions = {
      selectOnLineNumbers: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: '"Fira Code", "Monaco", "Menlo", monospace',
      lineNumbers: 'on',
      readOnly: readOnly,
      wordWrap: 'on',
      tabSize: language === 'python' ? 4 : 2,
      insertSpaces: true,
      renderWhitespace: 'boundary',
      bracketPairColorization: { enabled: true },
      formatOnPaste: true,
      formatOnType: true
    };

    // 언어별 추가 설정
    if (language === 'python') {
      return { ...baseOptions, tabSize: 4 };
    }
    
    return baseOptions;
  };

  // 에디터 포커스
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // 코드 포맷팅
  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  // 에디터 내용 전체 선택
  const selectAll = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.selectAll').run();
    }
  };

  // 컴포넌트가 마운트되면 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      focusEditor();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Editor
        height={height}
        language={languageMap[language] || 'javascript'}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={getEditorOptions()}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span>Monaco Editor 로딩 중...</span>
            </div>
          </div>
        }
      />
      
      {/* 에디터 툴바 (숨김 처리, 부모 컴포넌트에서 제어) */}
      <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
        <button
          onClick={formatCode}
          className="p-1 bg-black bg-opacity-50 text-white rounded text-xs hover:bg-opacity-70"
          title="코드 포맷팅 (Alt+Shift+F)"
        >
          ✨
        </button>
        <button
          onClick={selectAll}
          className="p-1 bg-black bg-opacity-50 text-white rounded text-xs hover:bg-opacity-70"
          title="전체 선택 (Ctrl+A)"
        >
          📋
        </button>
      </div>
    </div>
  );
};

export default CodeEditor;