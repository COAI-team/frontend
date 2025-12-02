import React, { useState } from "react";
import { Table } from "lucide-react";

// 표 삽입 시 크기를 선택할 수 있는 그리드 선택기
const TableSizeSelector = ({ onSelect, onClose, isDark }) => {
  const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 });
  const maxRows = 10;
  const maxCols = 10;

  const handleMouseOver = (row, col) => {
    setHoveredCell({ row, col });
  };

  const handleClick = (row, col) => {
    onSelect(row + 1, col + 1);
    onClose();
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        marginTop: "4px",
        backgroundColor: isDark ? "#1f2937" : "white",
        border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
        borderRadius: "8px",
        padding: "12px",
        boxShadow: isDark
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.4)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          marginBottom: "8px",
          fontSize: "12px",
          color: isDark ? "#9ca3af" : "#6b7280",
          fontWeight: 500,
        }}
      >
        {hoveredCell.row + 1} x {hoveredCell.col + 1}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${maxCols}, 20px)`,
          gap: "2px",
        }}
      >
        {Array.from({ length: maxRows * maxCols }).map((_, index) => {
          const row = Math.floor(index / maxCols);
          const col = index % maxCols;
          const isHighlighted = row <= hoveredCell.row && col <= hoveredCell.col;

          return (
            <div
              key={index}
              onMouseOver={() => handleMouseOver(row, col)}
              onClick={() => handleClick(row, col)}
              style={{
                width: "20px",
                height: "20px",
                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
                backgroundColor: isHighlighted
                  ? isDark
                    ? "#3b82f6"
                    : "#3b82f6"
                  : isDark
                  ? "#374151"
                  : "white",
                cursor: "pointer",
                transition: "background-color 0.1s",
                borderRadius: "2px",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// 표가 선택되었을 때 나타나는 컨텍스트 메뉴
const TableContextMenu = ({ editor, isDark }) => {
  if (!editor || !editor.isActive("table")) {
    return null;
  }

  const buttonStyle = {
    padding: "6px 10px",
    fontSize: "12px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "background-color 0.2s",
    color: isDark ? "#e5e7eb" : "#374151",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
  };

  const buttonHoverBg = isDark ? "#374151" : "#f3f4f6";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "8px",
        backgroundColor: isDark ? "#1f2937" : "white",
        border: `1px solid ${isDark ? "#4b5563" : "#e5e7eb"}`,
        borderRadius: "8px",
        boxShadow: isDark
          ? "0 2px 4px rgba(0, 0, 0, 0.3)"
          : "0 2px 4px rgba(0, 0, 0, 0.1)",
        marginBottom: "8px",
        flexWrap: "wrap",
      }}
    >
      {/* 행 추가/삭제 */}
      <div
        style={{
          display: "flex",
          gap: "2px",
          paddingRight: "8px",
          borderRight: `1px solid ${isDark ? "#4b5563" : "#e5e7eb"}`,
        }}
      >
        <button
          onClick={() => editor.chain().focus().addRowBefore().run()}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          title="위에 행 추가"
        >
          ⬆️ 행
        </button>
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          title="아래에 행 추가"
        >
          ⬇️ 행
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          style={{ ...buttonStyle, color: "#dc2626" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          title="행 삭제"
        >
          ❌ 행
        </button>
      </div>

      {/* 열 추가/삭제 */}
      <div
        style={{
          display: "flex",
          gap: "2px",
          paddingRight: "8px",
          borderRight: `1px solid ${isDark ? "#4b5563" : "#e5e7eb"}`,
        }}
      >
        <button
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          title="왼쪽에 열 추가"
        >
          ⬅️ 열
        </button>
        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          title="오른쪽에 열 추가"
        >
          ➡️ 열
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          style={{ ...buttonStyle, color: "#dc2626" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          title="열 삭제"
        >
          ❌ 열
        </button>
      </div>

      {/* 셀 병합/분할 */}
      <div
        style={{
          display: "flex",
          gap: "2px",
          paddingRight: "8px",
          borderRight: `1px solid ${isDark ? "#4b5563" : "#e5e7eb"}`,
        }}
      >
        <button
          onClick={() => editor.chain().focus().mergeCells().run()}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          disabled={!editor.can().mergeCells()}
          title="셀 병합"
        >
          🔗 병합
        </button>
        <button
          onClick={() => editor.chain().focus().splitCell().run()}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          disabled={!editor.can().splitCell()}
          title="셀 분할"
        >
          ✂️ 분할
        </button>
      </div>

      {/* 헤더 행 토글 */}
      <div
        style={{
          display: "flex",
          gap: "2px",
          paddingRight: "8px",
          borderRight: `1px solid ${isDark ? "#4b5563" : "#e5e7eb"}`,
        }}
      >
        <button
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          style={{
            ...buttonStyle,
            backgroundColor: editor.isActive("table", { hasHeaderRow: true })
              ? isDark
                ? "#1e40af"
                : "#dbeafe"
              : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!editor.isActive("table", { hasHeaderRow: true })) {
              e.currentTarget.style.backgroundColor = buttonHoverBg;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = editor.isActive("table", {
              hasHeaderRow: true,
            })
              ? isDark
                ? "#1e40af"
                : "#dbeafe"
              : "transparent";
          }}
          title="헤더 행 토글"
        >
          📋 헤더
        </button>
      </div>

      {/* 표 삭제 */}
      <button
        onClick={() => editor.chain().focus().deleteTable().run()}
        style={{ ...buttonStyle, color: "#dc2626" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = buttonHoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        title="표 삭제"
      >
        🗑️ 표 삭제
      </button>
    </div>
  );
};

// 표 버튼 컴포넌트
const TableButton = ({ editor, isDark }) => {
  const [showSizeSelector, setShowSizeSelector] = useState(false);

  if (!editor) return null;

  const insertTable = (rows, cols) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
  };

  const isActive = editor.isActive("table");

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setShowSizeSelector(!showSizeSelector)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          transition: "all 0.2s",
          backgroundColor: isActive
            ? isDark
              ? "rgba(59, 130, 246, 0.2)"
              : "rgba(219, 234, 254, 0.8)"
            : "transparent",
          color: isDark ? "#e5e7eb" : "#374151",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = isDark
              ? "rgba(55, 65, 81, 0.5)"
              : "rgba(243, 244, 246, 0.8)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
        title="표"
      >
        <Table size={18} />
        <span>표</span>
      </button>

      {/* 표 크기 선택기 */}
      {showSizeSelector && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setShowSizeSelector(false)}
          />
          <TableSizeSelector
            onSelect={insertTable}
            onClose={() => setShowSizeSelector(false)}
            isDark={isDark}
          />
        </>
      )}
    </div>
  );
};

export { TableButton, TableContextMenu };