import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import SimpleCodeBlockView from '../nodeviews/SimpleCodeBlockView';

export const SimpleCodeBlock = Node.create({
  name: 'codeBlock',
  
  content: 'text*',
  
  marks: '',
  
  group: 'block',
  
  code: true,
  
  defining: true,
  
  addAttributes() {
    return {
      language: {
        default: 'plaintext',
        parseHTML: element => element.getAttribute('data-language'),
        renderHTML: attributes => ({
          'data-language': attributes.language,
        }),
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['pre', HTMLAttributes, ['code', {}, 0]];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(SimpleCodeBlockView);
  },
  
  addCommands() {
    return {
      setCodeBlock: attributes => ({ commands }) => {
        return commands.setNode(this.name, attributes);
      },
      toggleCodeBlock: attributes => ({ commands }) => {
        return commands.toggleNode(this.name, 'paragraph', attributes);
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),
      
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection;
        
        if ($anchor.parent.type.name !== this.name) {
          return false;
        }
        
        if (empty && !$anchor.parent.textContent) {
          return this.editor.commands.clearNodes();
        }
        
        return false;
      },
      
      Enter: () => {
        const { state, view } = this.editor;
        const { selection } = state;
        const { $from } = selection;

        // 현재 위치가 코드 블록이 아니면 무시
        if ($from.parent.type.name !== 'paragraph') {
          return false;
        }

        const textBefore = $from.parent.textContent;
        
        // ```java 형태 감지
        const match = textBefore.match(/^```([a-z]*)$/);
        
        if (match) {
          const language = match[1] || 'plaintext';
          
          this.editor
            .chain()
            .deleteRange({ from: $from.start(), to: $from.end() })
            .setCodeBlock({ language })
            .run();
          
          return true;
        }
        
        return false;
      },
      
      Space: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;

        if ($from.parent.type.name !== 'paragraph') {
          return false;
        }

        const textBefore = $from.parent.textContent;
        
        // ```java 형태 감지
        const match = textBefore.match(/^```([a-z]*)$/);
        
        if (match) {
          const language = match[1] || 'plaintext';
          
          this.editor
            .chain()
            .deleteRange({ from: $from.start(), to: $from.end() })
            .setCodeBlock({ language })
            .run();
          
          return true;
        }
        
        return false;
      },
    };
  },
});