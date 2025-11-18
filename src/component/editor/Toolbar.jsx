import React from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon,
  Image as ImageIcon, Code, Table, Smile, Upload
} from "lucide-react";
import axios from "axios";
import imageCompression from "browser-image-compression";

const Toolbar = ({ editor, insertCodeBlock }) => {
  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-2 rounded-lg text-sm
        transition-all duration-150
        ${active
          ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        }
      `}
    >
      {children}
    </button>
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

        editor.chain()
          .focus()
          .insertContent({ type: "image", attrs: { src: res.data } })
          .run();
      } catch (err) {
        alert("이미지 업로드 실패");
      }
    };
  };

  const addLink = () => {
    const url = window.prompt("링크 입력:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col gap-3">
      
      {/* 첫 번째 줄: 미디어 & 삽입 도구 */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-800">
        <ToolbarButton onClick={addImage} title="이미지">
          <ImageIcon size={18} />
        </ToolbarButton>

        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="링크">
          <LinkIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
          title="표 삽입"
        >
          <Table size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />

        <button
          onClick={insertCodeBlock}
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg
            bg-gradient-to-r from-purple-500 to-pink-500
            text-white text-sm font-medium
            hover:from-purple-600 hover:to-pink-600
            transition-all shadow-md hover:shadow-lg
          "
        >
          <Code size={18} />
          <span>코드 블록</span>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />

        <button
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg
            bg-blue-100 dark:bg-blue-900
            text-blue-700 dark:text-blue-300
            text-sm font-medium
            hover:bg-blue-200 dark:hover:bg-blue-800
            transition-all
          "
        >
          <Upload size={18} />
          <span>AI 분석 결과</span>
        </button>
      </div>

      {/* 두 번째 줄: 텍스트 서식 도구 */}
      <div className="flex items-center gap-1 flex-wrap">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="굵게 (Ctrl+B)"
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="기울임 (Ctrl+I)"
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="밑줄 (Ctrl+U)"
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

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />

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

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />

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

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />

        <ToolbarButton title="이모지">
          <Smile size={18} />
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;