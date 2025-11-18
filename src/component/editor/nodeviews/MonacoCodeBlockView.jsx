import React, { useCallback, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import * as monaco from "monaco-editor";

import "../monaco/setupMonaco";
import CodeBlockLangDropdown from "./CodeBlockLangDropdown";

const MonacoCodeBlockView = ({ node, updateAttributes }) => {
  const { code = "// 코드를 작성하세요\n", language = "javascript" } =
    node.attrs || {};

  const { theme } = useTheme();

  // 테마 변경 감지 후 모나코 테마 적용
  useEffect(() => {
    monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs");
  }, [theme]);

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
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          CODE
        </span>
        <CodeBlockLangDropdown
          language={language}
          onChange={handleLanguageChange}
        />
      </div>

      {/* 에디터 */}
      <div
        className="
          rounded-lg overflow-hidden 
          bg-white text-black 
          dark:bg-[#1e1e1e] dark:text-[#e1e1e1]
          border border-gray-300 dark:border-gray-700
          transition-colors duration-200
        "
      >
        <Editor
          height="320px"
          language={monacoLanguage}
          theme={theme === "dark" ? "vs-dark" : "vs"}
          value={code}
          onChange={handleCodeChange}
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
