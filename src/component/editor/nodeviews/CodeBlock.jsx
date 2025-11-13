// src/component/editor/CodeBlock.jsx
import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import Editor from "@monaco-editor/react";

const CodeBlock = ({ node, updateAttributes }) => {
  const code = node.attrs.code || "";

  return (
    <NodeViewWrapper className="my-4 border border-gray-700 rounded-lg bg-[#0f0f0f]">
      <Editor
        height="250px"
        defaultLanguage={node.attrs.language || "javascript"}
        theme="vs-dark"
        value={code}
        onChange={(value) => updateAttributes({ code: value })}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </NodeViewWrapper>
  );
};

export default CodeBlock;
