import React, { useCallback, useEffect, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import * as monaco from "monaco-editor";

import "../monaco/setupMonaco";
import CodeBlockLangDropdown from "../ui/CodeBlockLangDropdown";

const MonacoCodeBlockView = ({ node, updateAttributes }) => {
  const { code = "// 코드를 작성하세요\n", language = "javascript" } =
    node.attrs || {};

  const { theme, systemTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);

  // 실제 테마 결정
  const currentTheme = theme === 'system' ? systemTheme : theme;

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // 커스텀 라이트 테마 정의
  const defineCustomTheme = (monaco) => {
    monaco.editor.defineTheme('github-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'd73a49' },
        { token: 'string', foreground: '032f62' },
        { token: 'number', foreground: '005cc5' },
        { token: 'type', foreground: '22863a' },
        { token: 'class', foreground: '6f42c1' },
        { token: 'function', foreground: '6f42c1' },
        { token: 'variable', foreground: 'e36209' },
        { token: 'constant', foreground: '005cc5' },
        { token: 'operator', foreground: 'd73a49' },
      ],
      colors: {
        'editor.background': '#f6f8fa',
        'editor.foreground': '#24292f',
        'editorLineNumber.foreground': '#8c959f',
        'editorLineNumber.activeForeground': '#24292f',
        'editor.selectionBackground': '#b3d7ff',
        'editor.inactiveSelectionBackground': '#d0e8ff',
        'editor.lineHighlightBackground': '#f3f4f6',
        'editorCursor.foreground': '#24292f',
        'editorWhitespace.foreground': '#d1d5db',
      }
    });
  };

  // 에디터 마운트 시 커스텀 테마 정의
  const handleEditorMount = (editor, monaco) => {
    setEditorInstance(editor);
    defineCustomTheme(monaco);
  };

  // 테마 변경 시 Monaco 테마 적용
  useEffect(() => {
    if (editorInstance) {
      monaco.editor.setTheme(isDark ? "vs-dark" : "github-light");
    }
  }, [isDark, editorInstance]);

  const handleCodeChange = useCallback(
    (value) => {
      updateAttributes({ code: value ?? "" });
    },
    [updateAttributes]
  );

  const handleLanguageChange = useCallback(
    (lang) => {
      updateAttributes({ language: lang });
    },
    [updateAttributes]
  );

  // Monaco에서 지원되지 않는 언어는 근접언어로 매핑
  const monacoLanguage =
    language === "python3" ? "python" : language === "shell" ? "bash" : language;

  return (
    <NodeViewWrapper className="monaco-code-block">
      {/* 상단 바 */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          CODE
        </span>
        <CodeBlockLangDropdown
          language={language}
          onChange={handleLanguageChange}
        />
      </div>

      {/* 에디터 */}
      <div
        className={`
          rounded-lg overflow-hidden 
          border transition-colors duration-200
          ${isDark 
            ? 'bg-[#1e1e1e] text-[#e1e1e1] border-gray-700' 
            : 'bg-[#f6f8fa] text-[#24292f] border-gray-300'
          }
        `}
      >
        <Editor
          height="320px"
          language={monacoLanguage}
          theme={isDark ? "vs-dark" : "github-light"}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

export default MonacoCodeBlockView;