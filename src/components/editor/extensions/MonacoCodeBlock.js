import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MonacoCodeBlockView from "../nodeviews/MonacoCodeBlockView.jsx";

const MonacoCodeBlock = Node.create({
  name: "monacoCodeBlock",

  group: "block",
  atom: true, // 내용은 전부 attribute(code)에 저장
  isolating: true, // 있으면 오탈자 방지에 도움

  addAttributes() {
    return {
      language: {
        default: "java",
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
      "pre",
      {
        ...HTMLAttributes,
        "data-type": "monaco-code-block",
        class: "monaco-code monaco-code-block-wrapper",
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
          // Monaco 내부 Enter는 Monaco가 처리
          return false;
        }

        // 기본 줄바꿈 실행
        return editor.commands.splitBlock();
      },
    };
  },
});

export default MonacoCodeBlock;
