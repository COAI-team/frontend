import React, { useState } from "react";
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
  Video,
  Code,
  FileText,
  Table,
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Smile,
} from "lucide-react";

const Toolbar = ({ editor, insertCodeBlock }) => {
  const [fontSize, setFontSize] = useState(15);

  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-700 transition-colors ${
        active ? "bg-gray-700 text-purple-400" : "text-gray-300"
      }`}
      title={title}
    >
      {children}
    </button>
  );

  const addImage = () => {
    const url = window.prompt("이미지 URL을 입력하세요:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt("링크 URL을 입력하세요:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-3 mb-4">
      {/* 1줄: 첨부/코드 관련 */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
        <ToolbarButton onClick={addImage} title="사진">
          <ImageIcon size={20} />
        </ToolbarButton>

        <ToolbarButton onClick={() => {}} title="동영상">
          <Video size={20} />
        </ToolbarButton>

        <ToolbarButton onClick={addLink} title="링크">
          <LinkIcon size={20} />
        </ToolbarButton>

        <ToolbarButton onClick={() => {}} title="인용구">
          <FileText size={20} />
        </ToolbarButton>

        <ToolbarButton onClick={() => {}} title="파일">
          <FileSpreadsheet size={20} />
        </ToolbarButton>

        <ToolbarButton onClick={() => {}} title="투표">
          <BarChart3 size={20} />
        </ToolbarButton>

        <ToolbarButton onClick={() => {}} title="문서">
          <Calendar size={20} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          title="표"
        >
          <Table size={20} />
        </ToolbarButton>

        <ToolbarButton onClick={() => {}} title="수식">
          <span className="text-sm font-bold">∑</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={insertCodeBlock}
          active={editor.isActive("monacoCodeBlock")}
          title="코드작성"
        >
          <div className="flex flex-col items-center">
            <Code size={20} className="text-purple-400" />
            <span className="text-[10px] text-purple-400 mt-0.5">코드작성</span>
          </div>
        </ToolbarButton>
      </div>

      {/* 2줄: 텍스트 편집 */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="bg-gray-700 text-gray-200 px-3 py-1.5 rounded text-sm border border-gray-600"
        >
          <option value={12}>12</option>
          <option value={14}>14</option>
          <option value={15}>15</option>
          <option value={16}>16</option>
          <option value={18}>18</option>
          <option value={20}>20</option>
          <option value={24}>24</option>
        </select>

        <div className="w-px h-6 bg-gray-600 mx-1" />

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

        <div className="w-px h-6 bg-gray-600 mx-1" />

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

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <ToolbarButton onClick={() => {}} title="이모지">
          <Smile size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={addLink}
          active={editor.isActive("link")}
          title="링크"
        >
          <LinkIcon size={18} />
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;
