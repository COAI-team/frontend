import React, { useCallback } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import Editor from "@monaco-editor/react";

import "../monaco/setupMonaco";
import CodeBlockLangDropdown from "./CodeBlockLangDropdown";

const MonacoCodeBlockView = ({ node, updateAttributes }) => {
  const { code = "// 코드를 작성하세요\n", language = "javascript" } =
    node.attrs || {};

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

  // monaco 에서 공식적으로 지원하지 않는 이름은 근접 언어로 맵핑
  const monacoLanguage =
    language === "python3" ? "python" : language === "shell" ? "bash" : language;

  return (
    <NodeViewWrapper className="monaco-code-block">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-mono">
          MONACO CODE BLOCK
        </span>
        <CodeBlockLangDropdown
          language={language}
          onChange={handleLanguageChange}
        />
      </div>

      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <Editor
          height="320px"
          language={monacoLanguage}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

export default MonacoCodeBlockView;
