import React, { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import imageCompression from "browser-image-compression";

import MonacoCodeBlock from "./extensions/MonacoCodeBlock";
import LinkPreview from "./extensions/LinkPreview";
import Toolbar from "./Toolbar";
import { useTheme } from "next-themes";
import "../../styles/tiptap.css";
import axios from "axios";

const WriteEditor = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const { theme } = useTheme();

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

      Image.configure({
        allowBase64: true,
        inline: false,
        HTMLAttributes: {
          class: "tiptap-image",
        },
      }),

      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
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

        if (moved) {
          return false;
        }

        const files = Array.from(event.dataTransfer.files);
        if (!files.length) return false;

        const file = files[0];

        if (file.type.startsWith("image/")) {
          // 우리가 만든 업로드 함수로 연결 (프론트 이미지 업로드 로직)
          uploadImageByDrop(file);
          return true;
        }

        return false;
      }
    }
  });

  async function uploadImageByDrop(file) {
    // 원본 파일명 저장
    const originalFileName = file.name;
    console.log("드롭한 파일명:", originalFileName);
    
    try {
      // 1MB로 압축
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressed = await imageCompression(file, options);
      
      console.log("압축 후 크기:", (compressed.size / 1024 / 1024).toFixed(2) + "MB");

      const formData = new FormData();
      
      // 압축된 파일을 원본 파일명으로 새로 생성
      const fileToUpload = new File(
        [compressed],
        originalFileName,
        { 
          type: compressed.type || file.type,
          lastModified: Date.now()
        }
      );
      
      console.log("업로드할 파일명:", fileToUpload.name);
      formData.append("file", fileToUpload);

      // 업로드 요청
      const res = await axios.post(
        "http://localhost:8090/upload/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const url = res.data;
      console.log("드래그 업로드 성공:", url);

      // 커서가 이미지 위라면 새로운 줄 추가해서 덮어쓰기 방지
      const { state } = editor;
      const node = state.selection.$from.parent;
      if (node.type.name === "image") {
        editor.commands.insertContent("<p></p>");
      }

      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error("드래그 이미지 업로드 실패:", error);
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

  // 본문 HTML에서 첫 번째 이미지 URL 추출
  const extractFirstImage = (html) => {
    const match = html.match(/<img[^>]+src=["']?([^>"']+)["']?[^>]*>/);
    return match ? match[1] : null;
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

      <div style={{ padding: "1.5rem" }}>
        <Toolbar editor={editor} insertCodeBlock={insertCodeBlock} theme={theme} />
      </div>

      <div
        style={{
          padding: "1.5rem 2rem",
          minHeight: "400px",
          backgroundColor: isDark ? "#1a1a1a" : "white",
          display: "block",
          flex: "none",
          alignSelf: "stretch",
          width: "100%",
          overflow: "visible",
        }}
      >
        <EditorContent editor={editor} />
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
            const representImage = extractFirstImage(html);
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