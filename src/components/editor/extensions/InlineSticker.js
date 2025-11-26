import { Node, mergeAttributes } from "@tiptap/core";

export const InlineSticker = Node.create({
  name: "inlineSticker",
  
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      src: { 
        default: null,
      },
      alt: { 
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      // 1순위: data-sticker 속성이 있는 이미지
      {
        tag: 'img[data-sticker]',
        priority: 100,
      },
      // 2순위: OpenMoji CDN 이미지 (data-sticker 없어도 스티커로 인식)
      {
        tag: 'img[src*="cdn.jsdelivr.net/gh/hfg-gmuend/openmoji"]',
        priority: 90,
      },
      // 3순위: OpenMoji 다른 CDN
      {
        tag: 'img[src*="openmoji"]',
        priority: 80,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        "data-sticker": "true",
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