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

import MonacoCodeBlock from "./extensions/MonacoCodeBlock";
import Toolbar from "./Toolbar";

const WriteEditor = ({ onSubmit }) => {
  const [title, setTitle] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        image: false,
      }),

      // Image 확장
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "tiptap-image",
        },
      }),

      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      MonacoCodeBlock,
    ],
    content: "",
  });

  if (!editor) return null;

  return (
  <div className="bg-[#1a1a1a] rounded-2xl p-6 shadow-xl text-gray-200">
    <input
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="제목을 입력하세요"
      className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-5 text-gray-100 placeholder-gray-500"
    />

    <Toolbar 
      editor={editor}
      insertCodeBlock={() =>
        editor.chain().focus().insertContent({ type: "monacoCodeBlock" }).run()
      }
    />

    <div className="mt-4 border border-gray-700 rounded-xl p-4 min-h-[350px] bg-[#111111] tiptap">
      <EditorContent editor={editor} />
    </div>

    <div className="flex justify-end mt-6 gap-3">
      <button className="px-5 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
        취소
      </button>
      <button
        className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:opacity-90"
        onClick={() => onSubmit({ title, content: editor.getHTML() })}
      >
        발행하기
      </button>
    </div>
  </div>
);};

export default WriteEditor;