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
    return [
      { 
        tag: "div[data-type=link-preview]",
        getAttrs: (element) => {
          return {
            title: element.getAttribute("data-title") || "",
            description: element.getAttribute("data-description") || "",
            image: element.getAttribute("data-image") || "",
            site: element.getAttribute("data-site") || "",
            url: element.getAttribute("data-url") || "",
          };
        },
      }
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div", 
      mergeAttributes(HTMLAttributes, { 
        "data-type": "link-preview",
        "data-title": node.attrs.title,
        "data-description": node.attrs.description,
        "data-image": node.attrs.image,
        "data-site": node.attrs.site,
        "data-url": node.attrs.url,
      })
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewComponent);
  },
});

export default LinkPreview;