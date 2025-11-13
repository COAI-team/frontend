import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import MonacoEditor from "@monaco-editor/react";
import CodeBlockLangDropdown from "./CodeBlockLangDropdown";

const CodeBlock = ({ node, updateAttributes }) => {
  const { code, language } = node.attrs;

  return (
    <NodeViewWrapper className="monaco-code-block">
      {/* 언어 드롭다운 */}
      <div className="flex justify-between items-center mb-2">
        <CodeBlockLangDropdown
          language={language}
          onChange={(lang) => updateAttributes({ language: lang })}
        />
      </div>

      {/* 실제 모나코 */}
      <MonacoEditor
        height="320px"
        language={language}
        value={code}
        onChange={(value) => updateAttributes({ code: value })}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 15,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </NodeViewWrapper>
  );
};

export default CodeBlock;
