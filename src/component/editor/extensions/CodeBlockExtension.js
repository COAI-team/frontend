import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CodeBlock from "../nodeviews/CodeBlock.jsx";

export default Node.create({
  name: "monacoCodeBlock",

  group: "block",
  atom: true,

  addAttributes() {
    return {
      code: { default: "" },
      language: { default: "javascript" },
    };
  },

  parseHTML() {
    return [{ tag: "monaco-code-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["monaco-code-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlock);
  },
});
