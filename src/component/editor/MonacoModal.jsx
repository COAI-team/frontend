import React from "react";
import Editor from "@monaco-editor/react";

const MonacoModal = ({ isOpen, onClose, onInsert }) => {
  const [code, setCode] = React.useState("// 코드를 작성하세요");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] p-5 rounded-xl w-[800px]">
        <h2 className="text-xl font-semibold mb-4">코드 작성</h2>

        <Editor
          height="300px"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v)}
        />

        <div className="flex justify-end mt-4 gap-3">
          <button className="px-4 py-2 bg-gray-700 rounded" onClick={onClose}>
            취소
          </button>
          <button
            className="px-4 py-2 bg-purple-600 rounded"
            onClick={() => {
              onInsert(code);
              onClose();
            }}
          >
            삽입
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonacoModal;
