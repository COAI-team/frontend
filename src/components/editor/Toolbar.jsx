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

import ToolbarButton from "./ToolbarButton";
import { addImage, addLink, addLinkCard } from "./ToolbarAction";

const Toolbar = ({ editor, insertCodeBlock, theme, onToggleSticker}) => {
  if (!editor) return null;

  const isDark = theme === "dark";

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
        <ToolbarButton
          onClick={() => addImage(editor)}
          title="이미지"
          label="이미지"
          isDark={isDark}
        >
          <ImageIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => addLinkCard(editor)}
          title="링크 카드"
          label="링크카드"
          isDark={isDark}
        >
          <LinkIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
          }
          title="표"
          label="표"
          isDark={isDark}
        >
          <Table size={18} />
        </ToolbarButton>


        <ToolbarButton
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
          }
          title="표"
          label="표"
          isDark={isDark}
        >
          <Table size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={insertCodeBlock}
          title="코드 작성"
          label="코드작성"
          isDark={isDark}
        >
          <Code size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="AI 분석 결과" label="AI 분석" isDark={isDark}>
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
        {/* 제목 */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          title="제목 1"
          isDark={isDark}
        >
          <Heading1 size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="제목 2"
          isDark={isDark}
        >
          <Heading2 size={18} />
        </ToolbarButton>

        <Divider />

        {/* 텍스트 스타일 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="굵게"
          isDark={isDark}
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="기울임"
          isDark={isDark}
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="밑줄"
          isDark={isDark}
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="취소선"
          isDark={isDark}
        >
          <Strikethrough size={18} />
        </ToolbarButton>

        <Divider />

        {/* 정렬 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="왼쪽 정렬"
          isDark={isDark}
        >
          <AlignLeft size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="가운데 정렬"
          isDark={isDark}
        >
          <AlignCenter size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="오른쪽 정렬"
          isDark={isDark}
        >
          <AlignRight size={18} />
        </ToolbarButton>

        <Divider />

        {/* 리스트 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="글머리 기호"
          isDark={isDark}
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="번호 매기기"
          isDark={isDark}
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="인용구"
          isDark={isDark}
        >
          <Quote size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => addLink(editor)}
          active={editor.isActive("link")}
          title="텍스트 링크"
          isDark={isDark}
        >
          <LinkIcon size={18} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={onToggleSticker}
          title="스티커"
          label="스티커"
          isDark={isDark}
        >
          {/* 아이콘은 적당히 Smile 쓰거나, 나중에 다른 걸로 변경 */}
          <Smile size={18} />
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;
