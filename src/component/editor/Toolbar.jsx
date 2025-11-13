import React from "react";
import { Bold, Italic, Code, Image } from "lucide-react";

const Toolbar = ({ editor, insertCodeBlock }) => {
  if (!editor) return null;

  const btn = "toolbar-btn mx-1";

  return (
    <div className="mb-3 p-2 bg-[#222] rounded-lg flex items-center shadow">
      <button className={btn} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={18} />
      </button>

      <button className={btn} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={18} />
      </button>

      {/* 이미지 */}
      <button className={btn} onClick={() => editor.chain().focus().setImage({ src: prompt("Image URL") }).run()}>
        <Image size={18} />
      </button>

      {/* VSCode Monaco 코드블록 */}
      <button className={btn} onClick={insertCodeBlock}>
        <Code size={18} />
      </button>
    </div>
  );
};

export default Toolbar;
