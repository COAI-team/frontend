import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageLoadingSpinner from "../nodeviews/ImageLoadingSpinner";

export const ImageLoading = Node.create({
  name: "imageLoading",
  group: "block",
  atom: true,

  parseHTML() {
    return [];
  },

  renderHTML() {
    return ["div"];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageLoadingSpinner);
  },

  addCommands() {
    return {
      insertImageLoading:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },
});

export default ImageLoading;