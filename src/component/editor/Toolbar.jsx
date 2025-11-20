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

  const ToolbarButton = ({ onClick, active, children, title, label }) => {
    const hasLabel = !!label;

    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        style={{
          display: "flex",
          flexDirection: hasLabel ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: hasLabel ? "0.25rem" : "0.35rem",
          padding: hasLabel ? "0.55rem 0.7rem" : "0.45rem",
          borderRadius: "0.5rem",
          fontSize: hasLabel ? "0.7rem" : "0.8rem",
          transition: "all 0.15s",
          backgroundColor: active
            ? isDark
              ? "rgba(139, 92, 246, 0.2)"
              : "rgba(139, 92, 246, 0.15)"
            : "transparent",
          color: active
            ? isDark
              ? "rgb(196, 181, 253)"
              : "rgb(109, 40, 217)"
            : isDark
            ? "rgb(156, 163, 175)"
            : "rgb(107, 114, 128)",
          border: active
            ? `1px solid ${
                isDark ? "rgba(139, 92, 246, 0.4)" : "rgba(139, 92, 246, 0.3)"
              }`
            : "1px solid transparent",
          cursor: "pointer",
          minWidth: hasLabel ? "3.5rem" : "auto",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = isDark
              ? "rgba(55, 65, 81, 0.6)"
              : "rgba(243, 244, 246, 0.9)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        {children}
        {hasLabel && (
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        )}
      </button>
    );
  };

  const Divider = () => (
    <div
      style={{
        width: "1px",
        height: "2rem",
        backgroundColor: isDark
          ? "rgba(75, 85, 99, 0.6)"
          : "rgba(209, 213, 219, 0.8)",
        margin: "0 0.4rem",
      }}
    />
  );

  // 이미지 업로드 (S3 사용)
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

      const LOADING = "이미지 업로드 중...";

      const pos = editor.state.selection.from;

      editor.chain().focus().insertContentAt(pos, LOADING).run();

      try {
        const formData = new FormData();
        formData.append("file", compressed);

        const res = await axios.post(
          "http://localhost:8090/upload/image",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const url =
          typeof res.data === "string"
            ? res.data
            : res.data.url || res.data.path || res.data.src;

        if (!url) throw new Error("이미지 URL 없음");

        editor
          .chain()
          .focus()
          .setTextSelection({ from: pos, to: pos + LOADING.length })
          .deleteSelection()
          .run();

        editor
          .chain()
          .focus()
          .setTextSelection(pos)
          .splitBlock()
          .insertContent({
            type: "image",
            attrs: { src: url },
          })
          .splitBlock()
          .run();
      } catch (err) {
        console.error("이미지 업로드 실패:", err);

        editor
          .chain()
          .focus()
          .setTextSelection({ from: pos, to: pos + LOADING.length })
          .deleteSelection()
          .run();

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
        gap: "0.6rem",
        backgroundColor: isDark
          ? "rgba(31, 41, 55, 0.5)"
          : "rgba(249, 250, 251, 0.9)",
        padding: "0.9rem 1rem",
        borderRadius: "0.75rem",
        border: `1px solid ${
          isDark ? "rgba(75, 85, 99, 0.5)" : "rgba(229, 231, 235, 0.8)"
        }`,
      }}
    >
      {/* 첫 번째 줄 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          flexWrap: "wrap",
          paddingBottom: "0.6rem",
          borderBottom: `1px solid ${
            isDark ? "rgba(75, 85, 99, 0.5)" : "rgba(229, 231, 235, 0.8)"
          }`,
        }}
      >
        <ToolbarButton onClick={addImage} title="이미지" label="이미지">
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
          title="표"
          label="표"
        >
          <Table size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={insertCodeBlock} title="코드 작성" label="코드작성">
          <Code size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="AI 분석 결과" label="AI 분석">
          <Upload size={18} />
        </ToolbarButton>
      </div>

      {/* 두 번째 줄 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          flexWrap: "wrap",
        }}
      >
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          title="제목 1"
        >
          <Heading1 size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="제목 2"
        >
          <Heading2 size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="굵게"
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="기울임"
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="밑줄"
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="취소선"
        >
          <Strikethrough size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="왼쪽 정렬"
        >
          <AlignLeft size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="가운데 정렬"
        >
          <AlignCenter size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="오른쪽 정렬"
        >
          <AlignRight size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="글머리 기호"
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="번호 매기기"
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="인용구"
        >
          <Quote size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="이모지">
          <Smile size={18} />
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;
