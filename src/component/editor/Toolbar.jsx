import React, { useState } from "react";
import axios from "axios";
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
  Smile,
  Table,
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

  // 🔥 이미지 업로드 반영
  const addImage = async () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";

  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    // 이미지 파일 형식 체크
    if (!file.type.startsWith('image/')) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:8090/api/images/upload",
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data" 
          },
          timeout: 30000 // 30초 타임아웃
        }
      );

      if (res.data) {
        editor.chain().focus().setImage({ src: res.data }).run();
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert(`이미지 업로드 실패: ${error.response?.data || error.message}`);
    }
  };

  fileInput.click();
};

  const addLink = () => {
    const url = window.prompt("링크 URL을 입력하세요:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-3 mb-4">
      {/* 1줄: 첨부/코드 */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
        <ToolbarButton onClick={addImage} title="사진">
          <ImageIcon size={20} />
        </ToolbarButton>

        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="링크">
          <LinkIcon size={20} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
          }
          title="표 삽입"
        >
          <Table size={20} />
        </ToolbarButton>

        <ToolbarButton
          onClick={insertCodeBlock}
          active={editor.isActive("monacoCodeBlock")}
          title="코드 작성"
        >
          <div className="flex flex-col items-center">
            <Code size={20} className="text-purple-400" />
            <span className="text-[10px] text-purple-400 mt-0.5">코드작성</span>
          </div>
        </ToolbarButton>
      </div>

      {/* 2줄: 텍스트 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Bold, Italic, Underline, Strike */}
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

        {/* 정렬 */}
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

        {/* 리스트 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="● 목록"
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="1. 목록"
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        {/* 이모지 */}
        <ToolbarButton onClick={() => {}} title="이모지">
          <Smile size={18} />
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;
