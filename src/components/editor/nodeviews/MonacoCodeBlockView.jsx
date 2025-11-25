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

  // 커스텀 라이트 테마 정의 (GitHub 스타일)
  const defineCustomTheme = (monaco) => {
    monaco.editor.defineTheme('github-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cf222e' },
        { token: 'string', foreground: '0a3069' },
        { token: 'number', foreground: '0550ae' },
        { token: 'type', foreground: '116329' },
        { token: 'class', foreground: '8250df' },
        { token: 'function', foreground: '8250df' },
        { token: 'variable', foreground: '953800' },
        { token: 'constant', foreground: '0550ae' },
        { token: 'operator', foreground: 'cf222e' },
      ],
      colors: {
        'editor.background': '#f6f8fa',
        'editor.foreground': '#1f2328',
        'editorLineNumber.foreground': '#8c959f',
        'editorLineNumber.activeForeground': '#1f2328',
        'editor.selectionBackground': '#addcff66',
        'editor.inactiveSelectionBackground': '#d0e8ff66',
        'editor.lineHighlightBackground': '#eaeef2',
        'editorCursor.foreground': '#1f2328',
        'editorWhitespace.foreground': '#d0d7de',
        'editorIndentGuide.background': '#d0d7de',
        'editorIndentGuide.activeBackground': '#8c959f',
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
            : 'bg-[#f6f8fa] text-[#1f2328] border-[#d0d7de]'
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