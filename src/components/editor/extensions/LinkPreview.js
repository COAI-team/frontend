import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import LinkPreviewComponent from "../nodeviews/LinkPreviewComponent";

const LinkPreview = Node.create({
  name: "linkPreview",

  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      title: { default: "" },
      description: { default: "" },
      image: { default: "" },
      site: { default: "" },
      url: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type=link-preview]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "link-preview" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewComponent);
  },
});

export default LinkPreview;
