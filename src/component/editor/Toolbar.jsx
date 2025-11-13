import React from "react";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Quote,
  FileText,
  BarChart2,
  Table,
  Code,
} from "lucide-react";

const Toolbar = ({ editor, openCodeModal }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-3 bg-[#242424] p-3 rounded-xl border border-gray-700">
      <button className="toolbar-btn" onClick={() => editor.chain().focus().setImage({ src: window.prompt("이미지 URL") }).run()}>
        <ImageIcon size={20} />
      </button>

      <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleLink({ href: window.prompt("링크 입력") }).run()}>
        <LinkIcon size={20} />
      </button>

      <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={20} />
      </button>

      <button className="toolbar-btn">
        <FileText size={20} />
      </button>

      <button className="toolbar-btn">
        <BarChart2 size={20} />
      </button>

      <button className="toolbar-btn">
        <Table size={20} />
      </button>

      <button className="toolbar-btn bg-purple-600 text-white" onClick={openCodeModal}>
        <Code size={20} />
      </button>
    </div>
  );
};

export default Toolbar;
