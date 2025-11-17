import React, { useState } from "react";
import axios from "axios";
import imageCompression from "browser-image-compression";

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

  // 🔥 이미지 업로드 + 압축 + Cloudinary 전달
  const addImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 10MB 이하 & 자동 WebP 변환
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 10,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressedFile);

      try {
        const res = await axios.post(
          "http://localhost:8090/api/images/upload",
          formData
        );

        editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "image",
            attrs: { src: res.data },
          },
          {
            type: "paragraph",
            content: "",
          },
        ])
        .focus() // 새 단락으로 커서 이동 확정 -> 사진 2개 첨부 가능
        .run();
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        alert("이미지 업로드 실패: " + (error.response?.data || error.message));
      }
    };
  };

  const addLink = () => {
    const url = window.prompt("링크 URL을 입력하세요:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-3 mb-4">
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

      <div className="flex items-center gap-2 flex-wrap">
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

        <ToolbarButton onClick={() => {}} title="이모지">
          <Smile size={18} />
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;
