import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MonacoCodeBlockView from "../nodeviews/MonacoCodeBlockView.jsx";

const MonacoCodeBlock = Node.create({
  name: "monacoCodeBlock",

  group: "block",
  atom: true, // 내용은 전부 attribute(code)에 저장
  selectable: true,

  addAttributes() {
    return {
      language: {
        default: "javascript",
        parseHTML: (element) => element.getAttribute("data-language"),
        renderHTML: (attributes) => ({
          "data-language": attributes.language,
        }),
      },
      code: {
        default: "// 코드를 작성하세요\n",
        parseHTML: (element) => element.getAttribute("data-code"),
        renderHTML: (attributes) => ({
          "data-code": attributes.code,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="monaco-code-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "monaco-code-block",
        class: "monaco-code-block-wrapper",
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MonacoCodeBlockView);
  },

  addCommands() {
    return {
      insertMonacoCodeBlock:
        (attrs = {}) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run(),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-c": () =>
        this.editor
          .chain()
          .focus()
          .insertContent({ type: this.name })
          .run(),
    };
  },
});

export default MonacoCodeBlock;
