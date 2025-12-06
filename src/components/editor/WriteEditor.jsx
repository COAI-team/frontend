import React, { useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { axiosInstance } from "../../server/AxiosConfig";
import { TableRow } from "@tiptap/extension-table-row";
import imageCompression from "browser-image-compression";

// toolbar 폴더에서 import
import StickerPicker from "./toolbar/StickerPicker";
import Toolbar from "./toolbar/Toolbar";
import { TableButton } from "./toolbar/TableButton";

// extensions 폴더에서 import
import MonacoCodeBlock from "./extensions/MonacoCodeBlock";
import { SimpleCodeBlock } from "./extensions/SimpleCodeBlock";
import LinkPreview from "./extensions/LinkPreview";
import { BlockImage } from "./extensions/ImageBlock.js";
import { ImageLoading } from "./extensions/ImageLoading.js";
import { InlineSticker } from "./extensions/InlineSticker.js";
import CustomTableCell from "./extensions/CustomTableCell";
import CustomTableHeader from "./extensions/CustomTableHeader";

import TagInput from "../../components/tag/TagInput";

import { useTheme } from "next-themes";
import "../../styles/tiptap.css";

import axios from "axios";

const WriteEditor = ({ 
  onSubmit, 
  mode = "create", 
  initialTitle = "", 
  initialContent = "",
  initialTags = [],
  toolbarType = "full" // "full" | "minimal"
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState(initialTags);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const { theme, systemTheme } = useTheme();
  
  const currentTheme = theme === 'system' ? systemTheme : theme;

  const checkIfHasRepresentative = (editor) => {
    let hasRepresentative = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "blockImage" && node.attrs.isRepresentative) {
        hasRepresentative = true;
      }
    });
    return hasRepresentative;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
      }),

      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
        autolink: false,
      }),

      BlockImage,
      ImageLoading,
      InlineSticker,

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 100,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      CustomTableCell,
      CustomTableHeader,

      SimpleCodeBlock,
      MonacoCodeBlock,
      LinkPreview,
    ],

    content: initialContent,

    editorProps: {
      handleKeyDown(view, event) {
        if (event.key === 'Enter') {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;

          if ($from.parent.type.name === 'paragraph') {
            const textBefore = $from.parent.textContent;
            const match = textBefore.match(/^```([a-z]*)$/);
            
            if (match) {
              const language = match[1] || 'plaintext';
              
              editor
                .chain()
                .deleteRange({ from: $from.start(), to: $from.end() })
                .setCodeBlock({ language })
                .run();
              
              event.preventDefault();
              return true;
            }
          }
        }
        
        return false;
      },

      handleDrop(view, event, _slice, moved) {
        event.preventDefault();
        event.stopPropagation();

        if (moved) return false;

        const files = Array.from(event.dataTransfer.files);
        if (!files.length) return false;

        const file = files[0];

        if (file.type.startsWith("image/")) {
          uploadImageByDrop(file);
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (initialTags && initialTags.length > 0) {
      setTags(initialTags);
    }
  }, [initialTags]);

  async function uploadImageByDrop(file) {
    const originalFileName = file.name;

    try {
      editor.chain().focus().insertImageLoading().run();

      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const formData = new FormData();

      const fileToUpload = new File([compressed], originalFileName, {
        type: compressed.type || file.type,
        lastModified: Date.now(),
      });

      formData.append("file", fileToUpload);

      const res = await axiosInstance.post(
        "/upload/image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const url = res.data;

      let loadingPos = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "imageLoading") {
          loadingPos = pos;
        }
      });

      if (loadingPos !== null) {
        const hasRepresentative = checkIfHasRepresentative(editor);

        editor
          .chain()
          .focus()
          .deleteRange({ from: loadingPos, to: loadingPos + 1 })
          .setTextSelection(loadingPos)
          .setBlockImage({
            src: url,
            isRepresentative: !hasRepresentative,
          })
          .run();

        setTimeout(() => {
          const newPos = loadingPos + 1;
          editor.chain().focus().setTextSelection(newPos).run();
        }, 0);
      } else {
        const hasRepresentative = checkIfHasRepresentative(editor);
        editor
          .chain()
          .focus()
          .setBlockImage({
            src: url,
            isRepresentative: !hasRepresentative,
          })
          .run();
      }
    } catch (error) {
      let loadingPos = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "imageLoading") {
          loadingPos = pos;
        }
      });

      if (loadingPos !== null) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: loadingPos, to: loadingPos + 1 })
          .run();
      }

      alert(`이미지 업로드 실패: ${error.message}`);
    }
  }

  const insertCodeBlock = () => {
    if (editor) {
      editor.chain().focus().insertMonacoCodeBlock().run();
    }
  };

  if (!editor) return null;

  const isDark = currentTheme === "dark";

  const getRepresentativeImage = () => {
    let representImage = null;
    let firstImage = null;

    editor.state.doc.descendants((node) => {
      if (node.type.name === "blockImage" && !node.attrs.isSticker) {
        if (!firstImage) firstImage = node.attrs.src;
        if (node.attrs.isRepresentative) {
          representImage = node.attrs.src;
        }
      }
    });

    return representImage || firstImage;
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        borderRadius: "1rem",
        backgroundColor: isDark ? "#101828" : "white",
        border: `1px solid ${
          isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
        }`,
        boxShadow: isDark
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: "2rem",
          borderBottom: `1px solid ${
            isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
          }`,
          backgroundColor: isDark ? "#101828" : "white",
          borderTopLeftRadius: "1rem", 
          borderTopRightRadius: "1rem",
          transition: "background-color 0.2s, border-color 0.2s",
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          style={{
            width: "100%",
            fontSize: "1.875rem",
            fontWeight: "bold",
            backgroundColor: "transparent",
            color: isDark ? "rgb(229, 231, 235)" : "rgb(17, 24, 39)",
            border: "none",
            outline: "none",
            transition: "color 0.2s",
          }}
          className="placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "1rem 1.5rem",
          backgroundColor: isDark ? "#101828" : "white",
          borderBottom: `1px solid ${
            isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
          }`,
          transition: "background-color 0.2s, border-color 0.2s",
        }}
      >
        <Toolbar
          editor={editor}
          insertCodeBlock={insertCodeBlock}
          theme={currentTheme}
          onToggleSticker={() => setShowStickerPicker((v) => !v)}
          type={toolbarType}
        />

        {showStickerPicker && (
          <StickerPicker
            editor={editor}
            isDark={isDark}
            onClose={() => setShowStickerPicker(false)}
          />
        )}
      </div>

      <div
        style={{
          padding: "1.5rem 2rem 3rem",
          minHeight: "500px",
          fontSize: "1.125rem",
          lineHeight: "1.7",
          color: isDark ? "rgb(229, 231, 235)" : "rgb(31, 41, 55)",
          backgroundColor: isDark ? "#101828" : "white",
          transition: "background-color 0.2s, color 0.2s",
        }}
      >
        <EditorContent editor={editor} />
      </div>

      <div
        style={{
          padding: "1.5rem 2rem",
          borderTop: `1px solid ${
            isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
          }`,
          backgroundColor: isDark ? "#101828" : "white",
          transition: "background-color 0.2s, border-color 0.2s",
        }}
      >
        <TagInput
          tags={tags}
          onChange={setTags}
          maxTags={5}
          isDark={isDark}
        />
      </div>

      <div
        style={{
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          borderTop: `1px solid ${
            isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
          }`,
          backgroundColor: isDark ? "#101828" : "white",
          borderBottomLeftRadius: "1rem",
          borderBottomRightRadius: "1rem",
          transition: "background-color 0.2s, border-color 0.2s",
        }}
      >
        <button
          onClick={() => window.history.back()}
          style={{
            padding: "0.625rem 1.5rem",
            borderRadius: "0.5rem",
            fontWeight: "500",
            backgroundColor: isDark ? "rgb(31, 41, 55)" : "rgb(229, 231, 235)",
            color: isDark ? "rgb(209, 213, 219)" : "rgb(55, 65, 81)",
            border: `1px solid ${
              isDark ? "rgb(55, 65, 81)" : "rgb(209, 213, 219)"
            }`,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          취소
        </button>

        <button
          onClick={() => {
            if (!title.trim()) {
              alert("제목을 입력하세요.");
              return;
            }
            
            const html = editor.getHTML();
            if (!html || html === "<p></p>") {
              alert("내용을 입력하세요.");
              return;
            }

            const representImage = getRepresentativeImage();
            onSubmit({ title: title.trim(), content: html, representImage, tags });
          }}
          style={{
            padding: "0.625rem 2rem",
            borderRadius: "0.5rem",
            fontWeight: "bold",
            color: "white",
            backgroundColor: "#ec4899", 
            border: "none",
            cursor: "pointer",
            boxShadow: isDark
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.4)"
              : "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#db2777";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#ec4899";
          }}
        >
          {mode === "edit" ? "수정하기" : "발행하기"}
        </button>
      </div>
    </div>
  );
};

export default WriteEditor;