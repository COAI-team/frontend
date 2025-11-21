import React, { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import imageCompression from "browser-image-compression";
import StickerPicker from "./StickerPicker";

import MonacoCodeBlock from "./extensions/MonacoCodeBlock";
import LinkPreview from "./extensions/LinkPreview";
import { BlockImage } from "./extensions/ImageBlock.js";
import { ImageLoading } from "./extensions/ImageLoading.js";
import { InlineSticker } from "./extensions/InlineSticker.js";
import Toolbar from "./Toolbar";
import { useTheme } from "next-themes";
import "../../styles/tiptap.css";

import axios from "axios";

const WriteEditor = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const { theme } = useTheme();

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

  // 첫 번째 이미지를 자동으로 대표로 설정하는 함수 (useEditor 위에 선언)
  const updateFirstImageAsRepresentative = (editor) => {
    if (!editor) return;

    let hasRepresentative = false;
    let hasAnyImage = false;
    let firstImagePos = null;

    // 대표 이미지가 있는지, 이미지가 있는지 확인 (스티커 제외)
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "blockImage" && !node.attrs.isSticker) {
        hasAnyImage = true;
        if (firstImagePos === null) {
          firstImagePos = pos;
        }
        if (node.attrs.isRepresentative) {
          hasRepresentative = true;
        }
      }
    });

    // 이미지가 있는데 대표가 하나도 없으면 첫 번째를 대표로 설정
    if (hasAnyImage && !hasRepresentative && firstImagePos !== null) {
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(firstImagePos, null, {
          ...editor.state.doc.nodeAt(firstImagePos).attrs,
          isRepresentative: true,
        })
      );
    }
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

      BlockImage, // 대표이미지 기능 포함
      ImageLoading, // 이미지 업로드 로딩 스피너
      InlineSticker, // 인라인 스티커 (텍스트와 같은 줄)

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      MonacoCodeBlock,
      LinkPreview,
    ],

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

  async function uploadImageByDrop(file) {
    const originalFileName = file.name;

    try {
      // 로딩 스피너 먼저 삽입
      editor.chain().focus().insertImageLoading().run();

      // 이미지 압축
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

      // 로딩 스피너 찾아서 이미지로 교체 (마지막 로딩 스피너)
      let loadingPos = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "imageLoading") {
          loadingPos = pos; // 마지막 것으로 계속 업데이트
        }
      });

      if (loadingPos !== null) {
        // 스피너 삭제하고 같은 위치에 이미지 삽입
        const hasRepresentative = checkIfHasRepresentative(editor);
        
        editor
          .chain()
          .focus()
          .deleteRange({ from: loadingPos, to: loadingPos + 1 })
          .setTextSelection(loadingPos)
          .setBlockImage({ 
            src: url,
            isRepresentative: !hasRepresentative // 대표가 없으면 자동으로 설정
          })
          .run();
        
        // 이미지 다음 위치로 커서 이동
        setTimeout(() => {
          const newPos = loadingPos + 1;
          editor
            .chain()
            .focus()
            .setTextSelection(newPos)
            .run();
        }, 0);
      } else {
        // 로딩 스피너를 못 찾으면 현재 위치에 삽입
        const hasRepresentative = checkIfHasRepresentative(editor);
        editor.chain().focus().setBlockImage({ 
          src: url,
          isRepresentative: !hasRepresentative
        }).run();
      }
    } catch (error) {
      // 에러 발생 시 로딩 스피너 삭제 (마지막 것)
      let loadingPos = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "imageLoading") {
          loadingPos = pos; // 마지막 것으로 계속 업데이트
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

  const isDark = theme === "dark";

  // 대표 이미지 추출
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

      {/* 툴바 + 스티커 */}
      <div style={{ padding: "1.5rem", position: "relative" }}>
        <Toolbar
          editor={editor}
          insertCodeBlock={insertCodeBlock}
          theme={theme}
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
          padding: "1.5rem 2rem",
          minHeight: "400px",
          fontSize: "1.125rem", // 18px - 벨로그 스타일
          lineHeight: "1.7", // 줄간격
          color: isDark ? "rgb(229, 231, 235)" : "rgb(31, 41, 55)",
        }}
      >
        <EditorContent editor={editor} />
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
            const html = editor.getHTML();
            const representImage = getRepresentativeImage();
            onSubmit({ title, content: html, representImage });
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
          발행하기
        </button>
      </div>
    </div>
  );
};

export default WriteEditor;