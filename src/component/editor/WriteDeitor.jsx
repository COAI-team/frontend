import React, { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import "highlight.js/styles/github-dark.css";

import Toolbar from "./Toolbar";
import MonacoModal from "./MonacoModal";

const WriteEditor = ({ onSubmit }) => {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: "",
  });

  const handleCodeInsert = (code) => {
    editor.chain().focus().insertContent({
      type: "codeBlock",
      attrs: { language: "javascript" },
      content: [{ type: "text", text: code }],
    }).run();
  };

  if (!editor) return null;

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 shadow-xl text-gray-200">
      
      {/* 제목 입력 */}
      <input
        type="text"
        placeholder="제목을 입력하세요"
        className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-5 text-gray-100 placeholder-gray-500"
      />

      {/* Toolbar */}
      <Toolbar editor={editor} openCodeModal={() => setIsCodeModalOpen(true)} />

      {/* 본문 */}
      <div className="mt-4 border border-gray-700 rounded-xl p-4 min-h-[350px] bg-[#111111]">
        <EditorContent editor={editor} />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end mt-6 gap-3">
        <button className="px-5 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
          취소
        </button>
        <button
          className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:opacity-90"
          onClick={() => onSubmit(editor.getHTML())}
        >
          발행하기
        </button>
      </div>

      {/* Monaco 코드 작성 모달 */}
      <MonacoModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        onInsert={handleCodeInsert}
      />
    </div>
  );
};

export default WriteEditor;
