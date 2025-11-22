import { Node, mergeAttributes } from "@tiptap/core";

export const InlineSticker = Node.create({
  name: "inlineSticker",
  
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-sticker]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        "data-sticker": "",
        style: "width: 1.5em; height: 1.5em; vertical-align: -0.3em; display: inline-block; margin: 0 0.1em;",
      }),
    ];
  },

  addCommands() {
    return {
      insertInlineSticker:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});

export default InlineSticker;