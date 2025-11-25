import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MonacoCodeBlockView from "../nodeviews/MonacoCodeBlockView.jsx";

const MonacoCodeBlock = Node.create({
  name: "monacoCodeBlock",

  group: "block",
  atom: true,
  isolating: true,

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
    return [
      { 
        tag: 'pre[data-type="monaco-code-block"]',
        getAttrs: (element) => {
          return {
            language: element.getAttribute('data-language') || 'javascript',
            code: element.getAttribute('data-code') || '// 코드를 작성하세요\n',
          };
        },
      },
      {
        tag: 'div[data-type="monaco-code-block"]',
        getAttrs: (element) => {
          return {
            language: element.getAttribute('data-language') || 'javascript',
            code: element.getAttribute('data-code') || '// 코드를 작성하세요\n',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      {
        ...HTMLAttributes,
        "data-type": "monaco-code-block",
        class: "monaco-code monaco-code-block-wrapper",
      },
      // atom 노드는 content를 가질 수 없으므로 0을 반환하거나 아예 생략
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
        this.editor.chain().focus().insertContent({ type: this.name }).run(),

      Backspace: () => {
        const { $anchor, empty } = this.editor.state.selection;
        const isCodeBlock = $anchor.parent.type.name === this.name;

        if (isCodeBlock && empty) {
          return this.editor.commands.deleteNode(this.name);
        }
        return false;
      },

      Enter: ({ editor }) => {
        const { $anchor } = editor.state.selection;
        const isCodeBlock = $anchor.parent.type.name === this.name;

        if (isCodeBlock) {
          return false;
        }

        return editor.commands.splitBlock();
      },
    };
  },
});

export default MonacoCodeBlock;