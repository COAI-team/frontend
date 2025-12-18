import React, { useState, useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { axiosInstance } from "../../server/AxiosConfig";
import imageCompression from "browser-image-compression";
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";

// toolbar
import StickerPicker from "./toolbar/StickerPicker";
import Toolbar from "./toolbar/Toolbar";

// extensions
import MonacoCodeBlock from "./extensions/MonacoCodeBlock";
import LinkPreview from "./extensions/LinkPreview";
import { BlockImage } from "./extensions/ImageBlock.js";
import { ImageLoading } from "./extensions/ImageLoading.js";
import { InlineSticker } from "./extensions/InlineSticker.js";
import CustomTableCell from "./extensions/CustomTableCell";
import CustomTableHeader from "./extensions/CustomTableHeader";

import TagInput from "../../components/tag/TagInput";
import { useTheme } from "../../context/theme/useTheme";
import "../../styles/tiptap.css";

const WriteEditor = ({
  onSubmit,
  mode = "create",
  initialTitle = "",
  initialContent = "",
  initialTags = [],
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState(initialTags);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const { theme, systemTheme } = useTheme();
  const {alert, showAlert, closeAlert} = useAlert();
  
  // 초기 content 설정 여부 추적
  const isContentInitialized = useRef(false);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

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

    content: "", // 초기에는 빈 값으로 시작

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

  // 제목 초기화
  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
  }, [initialTitle]);

  // 에디터 content 초기화 - 한 번만 실행
  useEffect(() => {
    if (editor && initialContent && !isContentInitialized.current) {
      // 에디터가 준비될 때까지 약간 대기
      const timer = setTimeout(() => {
        console.log("Setting initial content:", initialContent);
        editor.commands.setContent(initialContent);
        isContentInitialized.current = true;
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [editor, initialContent]);

  // 태그 초기화
  useEffect(() => {
    if (initialTags.length > 0) setTags(initialTags);
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
      formData.append(
        "file",
        new File([compressed], originalFileName, {
          type: compressed.type || file.type,
          lastModified: Date.now(),
        })
      );

      const res = await axiosInstance.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data;
      let loadingPos = null;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "imageLoading") loadingPos = pos;
      });

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
    } catch (error) {
      showAlert({
        type: "error",
        title: "이미지 업로드 실패",
        message: error?.message ?? "이미지 업로드 중 문제가 발생했습니다.",
      });
    }
  }

  const insertCodeBlock = () => {
    editor.chain().focus().insertMonacoCodeBlock().run();
  };

  if (!editor) return null;

  const getRepresentativeImage = () => {
    let represent = null;
    let first = null;

    editor.state.doc.descendants((node) => {
      if (node.type.name === "blockImage" && !node.attrs.isSticker) {
        if (!first) first = node.attrs.src;
        if (node.attrs.isRepresentative) represent = node.attrs.src;
      }
    });

    return represent || first;
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        borderRadius: "1rem",
        backgroundColor: isDark ? "#101828" : "white",
        border: `1px solid ${isDark ? "rgb(55,65,81)" : "rgb(229,231,235)"}`,
        boxShadow: isDark
          ? "0 20px 25px -5px rgba(0,0,0,0.5)"
          : "0 20px 25px -5px rgba(0,0,0,0.1)",
        transition: "all 0.2s",
      }}
    >
      {/* 제목 */}
      <div
        style={{
          padding: "2rem",
          borderBottom: `1px solid ${
            isDark ? "rgb(55,65,81)" : "rgb(229,231,235)"
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
            background: "transparent",
            color: isDark ? "rgb(229,231,235)" : "rgb(17,24,39)",
            border: "none",
            outline: "none",
          }}
        />
      </div>

      {/* 툴바 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "1rem 1.5rem",
          backgroundColor: isDark ? "#101828" : "white",
          borderBottom: `1px solid ${
            isDark ? "rgb(55,65,81)" : "rgb(229,231,235)"
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

      {/* 본문 */}
      <div
        style={{
          padding: "1.5rem 2rem 3rem",
          minHeight: "500px",
          color: isDark ? "rgb(229,231,235)" : "rgb(31,41,55)",
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* 태그 */}
      <div
        style={{
          padding: "1.5rem 2rem",
          borderTop: `1px solid ${
            isDark ? "rgb(55,65,81)" : "rgb(229,231,235)"
          }`,
        }}
      >
        <TagInput tags={tags} onChange={setTags} maxTags={5} isDark={isDark} />
      </div>

      {/* 하단 버튼 */}
      <div
        style={{
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          borderTop: `1px solid ${
            isDark ? "rgb(55,65,81)" : "rgb(229,231,235)"
          }`,
        }}
      >
        <button
          onClick={() => globalThis.history.back()}
          style={{
            padding: "0.625rem 1.5rem",
            backgroundColor: isDark ? "rgb(31,41,55)" : "rgb(229,231,235)",
            color: isDark ? "rgb(209,213,219)" : "rgb(55,65,81)",
            borderRadius: "0.5rem",
            border: "1px solid",
            cursor: "pointer",
          }}
        >
          취소
        </button>

        <button
          onClick={() => {
            if (!title.trim()) {
              showAlert({
                type: "warning",
                title: "입력 필요",
                message: "제목을 입력하세요.",
              });
              return;
            }

            const html = editor.getHTML();
            if (!html || html === "<p></p>") {
              showAlert({
                type: "warning",
                title: "입력 필요",
                message: "내용을 입력하세요.",
              });
              return;
            }

            onSubmit({
              title: title.trim(),
              content: html,
              representImage: getRepresentativeImage(),
              tags,
            });
          }}
          style={{
            padding: "0.625rem 2rem",
            backgroundColor: "#ec4899",
            color: "white",
            borderRadius: "0.5rem",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {mode === "edit" ? "수정하기" : "발행하기"}
        </button>
      </div>
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          closeAlert();
          alert.onConfirm?.();
        }}
        onClose={closeAlert}
      />
    </div>
  );
};

export default WriteEditor;
