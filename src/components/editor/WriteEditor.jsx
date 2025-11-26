import React, { useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import imageCompression from "browser-image-compression";

// toolbar 폴더에서 import
import StickerPicker from "./toolbar/StickerPicker";
import Toolbar from "./toolbar/Toolbar";
import { TableButton } from "./toolbar/TableButton";

// extensions 폴더에서 import
import MonacoCodeBlock from "./extensions/MonacoCodeBlock";
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
  initialTags = []
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState(initialTags);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const { theme, systemTheme } = useTheme();
  
  // theme이 'system'이면 실제 시스템 테마를 사용
  const currentTheme = theme === 'system' ? systemTheme : theme;

  // 대표 이미지가 있는지 확인하는 헬퍼 함수
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

      MonacoCodeBlock,
      LinkPreview,
    ],

    content: initialContent,

    editorProps: {
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

  // initialTitle이 변경될 때 title 업데이트
  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  // initialContent가 변경될 때 editor 내용 업데이트
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // initialTags가 변경될 때 tags 업데이트
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

      const res = await axios.post(
        "http://localhost:8090/upload/image",
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
        backgroundColor: isDark ? "#1a1a1a" : "white",
        border: `1px solid ${
          isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
        }`,
        boxShadow: isDark
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: "all 0.3s",
        position: "relative",
      }}
    >
      {/* 제목 입력 */}
      <div
        style={{
          padding: "2rem",
          borderBottom: `1px solid ${
            isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
          }`,
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
          }}
          className="placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* 플로팅 툴바 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "1rem 1.5rem",
          backgroundColor: isDark ? "#1a1a1a" : "white",
          borderBottom: `1px solid ${
            isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
          }`,
        }}
      >
        <Toolbar
          editor={editor}
          insertCodeBlock={insertCodeBlock}
          theme={currentTheme}
          onToggleSticker={() => setShowStickerPicker((v) => !v)}
        />

        {showStickerPicker && (
          <StickerPicker
            editor={editor}
            isDark={isDark}
            onClose={() => setShowStickerPicker(false)}
          />
        )}
      </div>

      {/* 에디터 본문 */}
      <div
        style={{
          padding: "1.5rem 2rem 3rem",
          minHeight: "500px",
          fontSize: "1.125rem",
          lineHeight: "1.7",
          color: isDark ? "rgb(229, 231, 235)" : "rgb(31, 41, 55)",
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* 태그 입력 */}
      <div
        style={{
          padding: "1.5rem 2rem",
          borderTop: `1px solid ${
            isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
          }`,
        }}
      >
        <TagInput
          tags={tags}
          onChange={setTags}
          maxTags={5}
          isDark={isDark}
        />
      </div>

      {/* 하단 버튼 */}
      <div
        style={{
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          borderTop: `1px solid ${
            isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"
          }`,
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
            transition: "all 0.15s",
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
            background:
              "linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))",
            border: "none",
            cursor: "pointer",
            boxShadow: isDark
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.4)"
              : "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
            transition: "all 0.15s",
          }}
        >
          {mode === "edit" ? "수정하기" : "발행하기"}
        </button>
      </div>
    </div>
  );
};

export default WriteEditor;