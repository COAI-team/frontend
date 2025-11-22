import React, { useState } from "react";
import { 
  Table, Palette, Merge, Split, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  X, TableProperties, Trash2 
} from "lucide-react";

// 표 삽입 시 크기를 선택할 수 있는 그리드 선택기
const TableSizeSelector = ({ onSelect, onClose, isDark }) => {
  const [hoveredCell, setHoveredCell] = useState({ row: -1, col: -1 });
  const maxRows = 10;
  const maxCols = 10;

  const handleMouseOver = (row, col) => {
    setHoveredCell({ row, col });
  };

  const handleMouseLeave = () => {
    setHoveredCell({ row: -1, col: -1 });
  };

  const handleClick = (row, col) => {
    onSelect(row + 1, col + 1);
    setHoveredCell({ row: -1, col: -1 });
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
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          marginBottom: "8px",
          fontSize: "12px",
          color: isDark ? "#9ca3af" : "#6b7280",
          fontWeight: 500,
          minHeight: "18px",
        }}
      >
        {hoveredCell.row >= 0 && hoveredCell.col >= 0
          ? `${hoveredCell.row + 1} x ${hoveredCell.col + 1}`
          : "크기를 선택하세요"}
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
          const isHighlighted =
            row <= hoveredCell.row && col <= hoveredCell.col;

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
                  ? "#3b82f6"
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

// 색상 선택 팔레트
const ColorPicker = ({ onSelect, isDark }) => {
  const colors = [
    { name: "기본", value: null },
    { name: "흰색", value: "#ffffff" },
    { name: "연한 회색", value: "#f3f4f6" },
    { name: "회색", value: "#d1d5db" },
    { name: "연한 빨강", value: "#fee2e2" },
    { name: "빨강", value: "#fca5a5" },
    { name: "진한 빨강", value: "#dc2626" },
    { name: "연한 주황", value: "#fed7aa" },
    { name: "주황", value: "#fdba74" },
    { name: "진한 주황", value: "#ea580c" },
    { name: "연한 노랑", value: "#fef3c7" },
    { name: "노랑", value: "#fde047" },
    { name: "진한 노랑", value: "#ca8a04" },
    { name: "연한 초록", value: "#d9f99d" },
    { name: "초록", value: "#86efac" },
    { name: "진한 초록", value: "#16a34a" },
    { name: "연한 파랑", value: "#dbeafe" },
    { name: "파랑", value: "#93c5fd" },
    { name: "진한 파랑", value: "#2563eb" },
    { name: "연한 보라", value: "#e9d5ff" },
    { name: "보라", value: "#c084fc" },
    { name: "진한 보라", value: "#9333ea" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 32px)",
        gap: "4px",
        padding: "8px",
      }}
    >
      {colors.map((color) => (
        <div
          key={color.value || "default"}
          onClick={() => onSelect(color.value)}
          title={color.name}
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: color.value || (isDark ? "#1f2937" : "white"),
            border: `2px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
            borderRadius: "4px",
            cursor: "pointer",
            transition: "transform 0.1s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        />
      ))}
    </div>
  );
};

// 표 툴바 (아이콘만 표시 - 간결한 버전)
const TableToolbar = ({ editor, isDark }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!editor || !editor.isActive("table")) {
    return null;
  }

  const handleCellColor = (color) => {
    editor.chain().focus().setCellAttribute("backgroundColor", color).run();
    setShowColorPicker(false);
  };

  const buttonStyle = {
    padding: "0.45rem",
    fontSize: "13px",
    fontWeight: "500",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    borderRadius: "0.5rem",
    transition: "all 0.2s",
    color: isDark ? "#e5e7eb" : "#374151",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: 0.4,
    cursor: "not-allowed",
  };

  const buttonHoverBg = isDark
    ? "rgba(55, 65, 81, 0.8)"
    : "rgba(243, 244, 246, 0.9)";

  const Divider = () => (
    <div
      style={{
        width: "1px",
        height: "1.5rem",
        backgroundColor: isDark
          ? "rgba(75, 85, 99, 0.6)"
          : "rgba(209, 213, 219, 0.8)",
        margin: "0 0.25rem",
      }}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        flexWrap: "wrap",
      }}
    >
      {/* 배경색 */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonHoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="셀 배경색"
        >
          <Palette size={18} />
        </button>
        {showColorPicker && (
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
              onClick={() => setShowColorPicker(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "4px",
                backgroundColor: isDark ? "#1f2937" : "white",
                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
                borderRadius: "8px",
                boxShadow: isDark
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.4)"
                  : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                zIndex: 1000,
              }}
            >
              <ColorPicker onSelect={handleCellColor} isDark={isDark} />
            </div>
          </>
        )}
      </div>

      <Divider />

      {/* 셀 병합/분할 */}
      <button
        onClick={() => editor.chain().focus().mergeCells().run()}
        disabled={!editor.can().mergeCells()}
        style={editor.can().mergeCells() ? buttonStyle : disabledButtonStyle}
        onMouseEnter={(e) => {
          if (editor.can().mergeCells()) {
            e.currentTarget.style.backgroundColor = buttonHoverBg;
          }
        }}
        onMouseLeave={(e) => {
          if (editor.can().mergeCells()) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
        title="셀 병합"
      >
        <Merge size={18} />
      </button>

      <button
        onClick={() => editor.chain().focus().splitCell().run()}
        disabled={!editor.can().splitCell()}
        style={editor.can().splitCell() ? buttonStyle : disabledButtonStyle}
        onMouseEnter={(e) => {
          if (editor.can().splitCell()) {
            e.currentTarget.style.backgroundColor = buttonHoverBg;
          }
        }}
        onMouseLeave={(e) => {
          if (editor.can().splitCell()) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
        title="셀 분할"
      >
        <Split size={18} />
      </button>

      <Divider />

      {/* 행 추가/삭제 */}
      <button
        onClick={() => editor.chain().focus().addRowBefore().run()}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title="위에 행 추가"
      >
        <ArrowUp size={18} />
      </button>

      <button
        onClick={() => editor.chain().focus().addRowAfter().run()}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title="아래에 행 추가"
      >
        <ArrowDown size={18} />
      </button>

      <button
        onClick={() => editor.chain().focus().deleteRow().run()}
        style={{ ...buttonStyle, color: "#dc2626" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title="행 삭제"
      >
        <X size={18} />
      </button>

      <Divider />

      {/* 열 추가/삭제 */}
      <button
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title="왼쪽에 열 추가"
      >
        <ArrowLeft size={18} />
      </button>

      <button
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title="오른쪽에 열 추가"
      >
        <ArrowRight size={18} />
      </button>

      <button
        onClick={() => editor.chain().focus().deleteColumn().run()}
        style={{ ...buttonStyle, color: "#dc2626" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title="열 삭제"
      >
        <X size={18} />
      </button>

      <Divider />

      {/* 헤더 행 토글 */}
      <button
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title="제목 굵게"
      >
        <TableProperties size={18} />
      </button>

      <Divider />

      {/* 표 삭제 */}
      <button
        onClick={() => editor.chain().focus().deleteTable().run()}
        style={{ ...buttonStyle, color: "#dc2626" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title="표 삭제"
      >
        <Trash2 size={18} />
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
        type="button"
        onClick={() => setShowSizeSelector(!showSizeSelector)}
        title="표"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.25rem",
          padding: "0.55rem 0.7rem",
          borderRadius: "0.5rem",
          fontSize: "0.7rem",
          transition: "all 0.15s",
          backgroundColor: isActive
            ? isDark
              ? "rgba(139, 92, 246, 0.2)"
              : "rgba(139, 92, 246, 0.15)"
            : "transparent",
          color: isActive
            ? isDark
              ? "rgb(196, 181, 253)"
              : "rgb(109, 40, 217)"
            : isDark
            ? "rgb(156, 163, 175)"
            : "rgb(107, 114, 128)",
          border: isActive
            ? `1px solid ${
                isDark
                  ? "rgba(139, 92, 246, 0.4)"
                  : "rgba(139, 92, 246, 0.3)"
              }`
            : "1px solid transparent",
          cursor: "pointer",
          minWidth: "3.5rem",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = isDark
              ? "rgba(55, 65, 81, 0.6)"
              : "rgba(243, 244, 246, 0.9)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <Table size={18} />
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          표
        </span>
      </button>

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

export { TableButton, TableToolbar };