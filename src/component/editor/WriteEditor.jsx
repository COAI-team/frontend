import React, { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";

import MonacoCodeBlock from "./extensions/MonacoCodeBlock";
import Toolbar from "./Toolbar";
import { useTheme } from "next-themes";
import "../../styles/tiptap.css";

const WriteEditor = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const { theme } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        codeBlock: false, 
        hardBreak: false
      }),
      Image.configure({ allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      MonacoCodeBlock,
      Gapcursor,
      HardBreak,
    ],
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
  });

  const insertCodeBlock = () => {
    if (editor) {
      editor.chain().focus().setCodeBlock().run();
    }
  };

  if (!editor) return null;

  const isDark = theme === "dark";

return (
  
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        borderRadius: "1rem",
        backgroundColor: isDark ? "#1a1a1a" : "white",
        border: `1px solid ${isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"}`,  // 여기서 초록색 제거됨
        boxShadow: isDark 
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: "all 0.3s",
      }}
    >
        {/* 제목 */}
        <div 
          style={{
            padding: "2rem",
            borderBottom: `1px solid ${isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"}`,
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

        {/* Toolbar */}
        <div style={{ padding: "1.5rem" }}>
          <Toolbar editor={editor} insertCodeBlock={insertCodeBlock} theme={theme} />
        </div>

        {/* Editor */}
        <div 
          style={{
            padding: "1.5rem 2rem",
            minHeight: "400px",
            backgroundColor: isDark ? "#1a1a1a" : "white",
          }}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: "1.5rem 2rem",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            borderTop: `1px solid ${isDark ? "rgb(55, 65, 81)" : "rgb(229, 231, 235)"}`,
          }}
        >
          <button 
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: "500",
              backgroundColor: isDark ? "rgb(31, 41, 55)" : "rgb(229, 231, 235)",
              color: isDark ? "rgb(209, 213, 219)" : "rgb(55, 65, 81)",
              border: `1px solid ${isDark ? "rgb(55, 65, 81)" : "rgb(209, 213, 219)"}`,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? "rgb(55, 65, 81)" : "rgb(209, 213, 219)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? "rgb(31, 41, 55)" : "rgb(229, 231, 235)";
            }}
          >
            취소
          </button>

          <button
            onClick={() => onSubmit({ title, content: editor.getHTML() })}
            style={{
              padding: "0.625rem 2rem",
              borderRadius: "0.5rem",
              fontWeight: "bold",
              color: "white",
              background: "linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))",
              border: "none",
              cursor: "pointer",
              boxShadow: isDark 
                ? "0 10px 15px -3px rgba(0, 0, 0, 0.4)" 
                : "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(to right, rgb(147, 51, 234), rgb(219, 39, 119))";
              e.currentTarget.style.boxShadow = isDark 
                ? "0 20px 25px -5px rgba(0, 0, 0, 0.5)" 
                : "0 20px 25px -5px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))";
              e.currentTarget.style.boxShadow = isDark 
                ? "0 10px 15px -3px rgba(0, 0, 0, 0.4)" 
                : "0 10px 15px -3px rgba(0, 0, 0, 0.2)";
            }}
          >
            발행하기
          </button>
        </div>
      </div>
  );
};

export default WriteEditor;