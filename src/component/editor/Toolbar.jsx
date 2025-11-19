import React from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Table,
  Smile,
  Upload,
  Heading1,
  Heading2,
  Quote,
} from "lucide-react";
import axios from "axios";
import imageCompression from "browser-image-compression";

const Toolbar = ({ editor, insertCodeBlock, theme }) => {
  if (!editor) return null;

  const isDark = theme === "dark";

  const ToolbarButton = ({ onClick, active, children, title, label }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.5rem 0.625rem",
        borderRadius: "0.5rem",
        fontSize: "0.75rem",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: active
          ? isDark 
            ? "rgba(168, 85, 247, 0.15)" 
            : "rgba(168, 85, 247, 0.1)"
          : "transparent",
        color: active
          ? isDark ? "rgb(216, 180, 254)" : "rgb(147, 51, 234)"
          : isDark ? "rgb(156, 163, 175)" : "rgb(107, 114, 128)",
        border: active 
          ? `1px solid ${isDark ? "rgba(168, 85, 247, 0.3)" : "rgba(168, 85, 247, 0.2)"}`
          : "1px solid transparent",
        cursor: "pointer",
        minWidth: label ? "3.5rem" : "auto",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = isDark ? "rgba(55, 65, 81, 0.6)" : "rgba(243, 244, 246, 0.8)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      {children}
      {label && (
        <span style={{ 
          fontSize: "0.65rem", 
          fontWeight: "500",
          whiteSpace: "nowrap",
        }}>
          {label}
        </span>
      )}
    </button>
  );

  const Divider = () => (
    <div
      style={{
        width: "1px",
        height: "2.5rem",
        background: isDark 
          ? "linear-gradient(to bottom, transparent, rgb(75, 85, 99), transparent)"
          : "linear-gradient(to bottom, transparent, rgb(209, 213, 219), transparent)",
        margin: "0 0.5rem",
      }}
    />
  );

  const addImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const compressed = await imageCompression(file, {
        maxSizeMB: 10,
        maxWidthOrHeight: 1920,
      });

      const formData = new FormData();
      formData.append("file", compressed);

      try {
        const res = await axios.post(
          "http://localhost:8090/api/images/upload",
          formData
        );

        editor
          .chain()
          .focus()
          .insertContent({ type: "image", attrs: { src: res.data } })
          .run();
      } catch (err) {
        console.error("이미지 업로드 실패:", err);
        alert("이미지 업로드 실패");
      }
    };
  };

  const addLink = () => {
    const url = window.prompt("링크 입력:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "1rem",
        backgroundColor: isDark ? "rgba(26, 26, 26, 0.95)" : "rgba(255, 255, 255, 0.95)",
        padding: "1.25rem",
        borderRadius: "0.875rem",
        border: `1px solid ${isDark ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)"}`,
        backdropFilter: "blur(10px)",
        boxShadow: isDark
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* 주요 기능 버튼 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <ToolbarButton onClick={addImage} title="이미지 추가" label="이미지">
          <ImageIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={addLink}
          active={editor.isActive("link")}
          title="링크"
          label="링크"
        >
          <LinkIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
          }
          title="표 삽입"
          label="표"
        >
          <Table size={18} />
        </ToolbarButton>

        <Divider />

        <button
          type="button"
          onClick={insertCodeBlock}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.625rem",
            background: isDark
              ? "linear-gradient(135deg, rgb(139, 92, 246) 0%, rgb(219, 39, 119) 100%)"
              : "linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(236, 72, 153) 100%)",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
            boxShadow: isDark 
              ? "0 4px 12px -2px rgba(168, 85, 247, 0.4)" 
              : "0 4px 12px -2px rgba(168, 85, 247, 0.3)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = isDark 
              ? "0 8px 16px -4px rgba(168, 85, 247, 0.5)" 
              : "0 8px 16px -4px rgba(168, 85, 247, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = isDark 
              ? "0 4px 12px -2px rgba(168, 85, 247, 0.4)" 
              : "0 4px 12px -2px rgba(168, 85, 247, 0.3)";
          }}
        >
          <Code size={17} />
          <span>코드 블록</span>
        </button>

        <Divider />

        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.625rem",
            backgroundColor: isDark 
              ? "rgba(59, 130, 246, 0.15)" 
              : "rgba(59, 130, 246, 0.1)",
            color: isDark ? "rgb(147, 197, 253)" : "rgb(37, 99, 235)",
            fontSize: "0.875rem",
            fontWeight: "600",
            border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)"}`,
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark 
              ? "rgba(59, 130, 246, 0.25)" 
              : "rgba(59, 130, 246, 0.15)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark 
              ? "rgba(59, 130, 246, 0.15)" 
              : "rgba(59, 130, 246, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Upload size={17} />
          <span>AI 분석</span>
        </button>
      </div>

      {/* 구분선 */}
      <div
        style={{
          height: "1px",
          background: isDark 
            ? "linear-gradient(to right, transparent, rgba(75, 85, 99, 0.5), transparent)"
            : "linear-gradient(to right, transparent, rgba(229, 231, 235, 0.8), transparent)",
        }}
      />

      {/* 텍스트 서식 */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
        {/* 헤딩 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="제목 1"
          label="제목1"
        >
          <Heading1 size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="제목 2"
          label="제목2"
        >
          <Heading2 size={18} />
        </ToolbarButton>

        <Divider />

        {/* 기본 서식 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="굵게 (Ctrl+B)"
          label="굵게"
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="기울임 (Ctrl+I)"
          label="기울임"
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="밑줄 (Ctrl+U)"
          label="밑줄"
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="취소선"
          label="취소선"
        >
          <Strikethrough size={18} />
        </ToolbarButton>

        <Divider />

        {/* 정렬 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="왼쪽 정렬"
          label="왼쪽"
        >
          <AlignLeft size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="가운데 정렬"
          label="가운데"
        >
          <AlignCenter size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="오른쪽 정렬"
          label="오른쪽"
        >
          <AlignRight size={18} />
        </ToolbarButton>

        <Divider />

        {/* 리스트 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="글머리 기호"
          label="목록"
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="번호 매기기"
          label="번호"
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="인용구"
          label="인용"
        >
          <Quote size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="이모지" label="이모지">
          <Smile size={18} />
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;