import React, { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";

import MonacoCodeBlock from "./extensions/MonacoCodeBlock";
import Toolbar from "./Toolbar";

const WriteEditor = ({ onSubmit }) => {
  const [title, setTitle] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false, image: false }),
      Image.configure({ allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      MonacoCodeBlock,
      Gapcursor,
      HardBreak,
    ],
  });

  if (!editor) return null;

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-[#0d0d0d] transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        
        {/* 메인 카드 */}
        <div className="
          rounded-2xl overflow-hidden 
          bg-white dark:bg-[#1a1a1a]
          shadow-xl
          transition-colors duration-200
        ">
          
          {/* 제목 영역 */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-800">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="
                w-full text-3xl font-bold 
                bg-transparent outline-none
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-600
                transition-colors duration-200
              "
            />
          </div>

          {/* Toolbar */}
          <div className="px-8 py-4 border-b border-gray-200 dark:border-gray-800">
            <Toolbar
              editor={editor}
              insertCodeBlock={() =>
                editor.chain().focus().insertContent({ type: "monacoCodeBlock" }).run()
              }
            />
          </div>

          {/* 에디터 본문 - 다크모드 대응 */}
          <div className="p-8 bg-white dark:bg-[#1a1a1a] transition-colors duration-200">
            <EditorContent 
              editor={editor} 
              className="
                tiptap
                min-h-[600px] outline-none
                text-gray-900 dark:text-gray-100
                text-base leading-relaxed
                transition-colors duration-200
                
                [&_p]:my-3
                [&_p:empty]:min-h-[1.5em]
                
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
                [&_h1]:text-gray-900 [&_h1]:dark:text-gray-100
                
                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
                [&_h2]:text-gray-900 [&_h2]:dark:text-gray-100
                
                [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2
                [&_h3]:text-gray-900 [&_h3]:dark:text-gray-100
                
                [&_ul]:pl-8 [&_ul]:my-4 [&_ul]:list-disc
                [&_ol]:pl-8 [&_ol]:my-4 [&_ol]:list-decimal
                [&_li]:my-2
                
                [&_blockquote]:border-l-4 [&_blockquote]:border-purple-500 
                [&_blockquote]:dark:border-purple-400
                [&_blockquote]:pl-6 [&_blockquote]:my-6 [&_blockquote]:italic
                [&_blockquote]:text-gray-600 [&_blockquote]:dark:text-gray-400
                
                [&_img]:max-w-full [&_img]:h-auto [&_img]:my-8 [&_img]:mx-auto
                [&_img]:rounded-lg [&_img]:cursor-pointer
                [&_img:hover]:scale-[1.02] [&_img]:transition-transform
                
                [&_a]:text-purple-600 [&_a]:dark:text-purple-400
                [&_a]:underline
                [&_a:hover]:text-purple-700 [&_a:hover]:dark:text-purple-300
                
                [&_code]:bg-gray-100 [&_code]:dark:bg-gray-800
                [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
                [&_code]:text-sm [&_code]:font-mono
                [&_code]:text-gray-900 [&_code]:dark:text-gray-100
                
                [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse
                [&_td]:border [&_td]:border-gray-300 [&_td]:dark:border-gray-700
                [&_td]:p-3 [&_td]:min-w-[100px]
                [&_th]:border [&_th]:border-gray-300 [&_th]:dark:border-gray-700
                [&_th]:p-3 [&_th]:bg-gray-100 [&_th]:dark:bg-gray-800
                [&_th]:font-semibold [&_th]:text-left
              " 
            />
          </div>

          {/* 하단 버튼 영역 */}
          <div className="
            px-8 py-6 
            border-t border-gray-200 dark:border-gray-800
            bg-gray-50 dark:bg-[#141414]
            flex justify-end gap-3
            transition-colors duration-200
          ">
            <button className="
              px-6 py-2.5 rounded-lg font-medium
              bg-white dark:bg-gray-800
              text-gray-700 dark:text-gray-300
              border border-gray-300 dark:border-gray-700
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-all
            ">
              취소
            </button>

            <button
              onClick={() => onSubmit({ title, content: editor.getHTML() })}
              className="
                px-8 py-2.5 rounded-lg font-semibold text-white
                bg-gradient-to-r from-purple-500 to-pink-500
                hover:from-purple-600 hover:to-pink-600
                shadow-lg hover:shadow-xl
                transition-all
              "
            >
              발행하기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WriteEditor;